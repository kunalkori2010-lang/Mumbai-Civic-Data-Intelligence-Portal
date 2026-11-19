import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getDb, logAudit } from './src/server/db.ts';
import { bootstrapDatabaseIfEmpty, inspectWorkbookBuffer, runEtlAndStoreDataset } from './src/server/etl.ts';
import {
  DATA_DICTIONARY_ENTRIES,
  EXPECTED_VALIDATION_TOTALS,
  SOURCE_METADATA,
} from './src/server/seedData.ts';
import {
  POWERBI_EXPORTS_DIR,
  WORKBOOK_PATH,
} from './src/server/workbookGenerator.ts';
import type {
  MunicipalDataset,
  WardConnectionRow,
  FactWaterConnectionRow,
} from './src/shared/types.ts';

const app = express();
app.use(express.json({ limit: '5mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Initialize DB and run initial ETL on startup
bootstrapDatabaseIfEmpty();

function getActiveDataset(): MunicipalDataset {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, dataset_name as datasetName, version, source, source_url as sourceUrl,
              reference_date as referenceDate, import_date as importDate, file_format as fileFormat,
              record_count as recordCount, status, imported_by as importedBy,
              change_summary as changeSummary, is_active as isActive
       FROM municipal_datasets WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
    )
    .get() as MunicipalDataset | undefined;

  if (!row) {
    throw new Error('No active municipal dataset found in database.');
  }
  return row;
}

function getAllActiveWardRows(datasetId: number): WardConnectionRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT r.id, r.dataset_id as datasetId, r.ward_code as wardCode, w.ward_name as wardName,
              w.zone_division as zoneDivision, w.major_localities as majorLocalities,
              r.metered_cm as meteredCm, r.metered_dm as meteredDm, r.metered_ind as meteredInd,
              r.metered_total as meteredTotal, r.non_metered_cm as nonMeteredCm,
              r.non_metered_dm as nonMeteredDm, r.non_metered_ind as nonMeteredInd,
              r.non_metered_total as nonMeteredTotal, r.all_connections_total as allConnectionsTotal,
              r.non_metered_pct_calculated as nonMeteredPctCalculated,
              r.non_metered_pct_source as nonMeteredPctSource,
              r.reference_date as referenceDate, r.source_basis as sourceBasis, r.source_url as sourceUrl
       FROM water_connections_raw r
       JOIN wards w ON w.ward_code = r.ward_code
       WHERE r.dataset_id = ?
       ORDER BY w.ward_code ASC`
    )
    .all(datasetId) as unknown as WardConnectionRow[];
}

function computeDescriptiveStats(values: number[]) {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, min: 0, max: 0, range: 0, stdDev: 0, q1: 0, q3: 0, iqr: 0, upperFence: 0, lowerFence: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const percentile = (p: number) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  const q1 = percentile(0.25);
  const q3 = percentile(0.75);
  const iqr = q3 - q1;
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return {
    count: n,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    min: sorted[0],
    max: sorted[n - 1],
    range: Number((sorted[n - 1] - sorted[0]).toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    lowerFence: Number((q1 - 1.5 * iqr).toFixed(2)),
    upperFence: Number((q3 + 1.5 * iqr).toFixed(2)),
  };
}

// Health check
app.get('/api/health', (_req, res) => {
  try {
    const ds = getActiveDataset();
    res.json({ ok: true, activeDataset: ds.datasetName, version: ds.version });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Dashboard overview with interactive filters
app.get('/api/dashboard', (req, res) => {
  try {
    const ds = getActiveDataset();
    const db = getDb();
    const wardFilter = String(req.query.ward || '').trim();
    const categoryFilter = String(req.query.category || '').trim(); // Commercial | Domestic | Industrial
    const meterFilter = String(req.query.meterStatus || '').trim(); // Metered | Non-Metered
    const zoneFilter = String(req.query.zone || '').trim();
    const search = String(req.query.search || '').trim().toLowerCase();

    const rawWards = getAllActiveWardRows(ds.id);
    const factRows = db
      .prepare(
        `SELECT f.ward_code as wardCode, w.ward_name as wardName, w.zone_division as zoneDivision,
                w.major_localities as majorLocalities, f.connection_category as connectionCategory,
                f.meter_status as meterStatus, f.connection_count as connectionCount
         FROM water_connections_fact f
         JOIN wards w ON w.ward_code = f.ward_code
         WHERE f.dataset_id = ?`
      )
      .all(ds.id) as unknown as Array<FactWaterConnectionRow & { wardName: string; zoneDivision: string; majorLocalities: string }>;

    const matchingWardSet = new Set(
      rawWards
        .filter((w) => {
          if (wardFilter && wardFilter !== 'ALL' && w.wardCode !== wardFilter) return false;
          if (zoneFilter && zoneFilter !== 'ALL' && w.zoneDivision !== zoneFilter) return false;
          if (search) {
            const hay = `${w.wardCode} ${w.wardName} ${w.zoneDivision} ${w.majorLocalities}`.toLowerCase();
            if (!hay.includes(search)) return false;
          }
          return true;
        })
        .map((w) => w.wardCode)
    );

    const filteredFacts = factRows.filter((f) => {
      if (!matchingWardSet.has(f.wardCode)) return false;
      if (categoryFilter && categoryFilter !== 'ALL' && f.connectionCategory !== categoryFilter) return false;
      if (meterFilter && meterFilter !== 'ALL' && f.meterStatus !== meterFilter) return false;
      return true;
    });

    let totalConnections = 0;
    let meteredConnections = 0;
    let nonMeteredConnections = 0;

    const categoryTotals: Record<string, { category: string; metered: number; nonMetered: number; total: number }> = {
      Commercial: { category: 'Commercial', metered: 0, nonMetered: 0, total: 0 },
      Domestic: { category: 'Domestic', metered: 0, nonMetered: 0, total: 0 },
      Industrial: { category: 'Industrial', metered: 0, nonMetered: 0, total: 0 },
    };

    const wardTotalsMap = new Map<
      string,
      {
        wardCode: string;
        wardName: string;
        zoneDivision: string;
        metered: number;
        nonMetered: number;
        commercial: number;
        domestic: number;
        industrial: number;
        total: number;
        nonMeteredPct: number;
      }
    >();

    for (const f of filteredFacts) {
      totalConnections += f.connectionCount;
      if (f.meterStatus === 'Metered') {
        meteredConnections += f.connectionCount;
        categoryTotals[f.connectionCategory].metered += f.connectionCount;
      } else {
        nonMeteredConnections += f.connectionCount;
        categoryTotals[f.connectionCategory].nonMetered += f.connectionCount;
      }
      categoryTotals[f.connectionCategory].total += f.connectionCount;

      if (!wardTotalsMap.has(f.wardCode)) {
        wardTotalsMap.set(f.wardCode, {
          wardCode: f.wardCode,
          wardName: f.wardName,
          zoneDivision: f.zoneDivision,
          metered: 0,
          nonMetered: 0,
          commercial: 0,
          domestic: 0,
          industrial: 0,
          total: 0,
          nonMeteredPct: 0,
        });
      }
      const wEntry = wardTotalsMap.get(f.wardCode)!;
      wEntry.total += f.connectionCount;
      if (f.meterStatus === 'Metered') wEntry.metered += f.connectionCount;
      else wEntry.nonMetered += f.connectionCount;
      if (f.connectionCategory === 'Commercial') wEntry.commercial += f.connectionCount;
      if (f.connectionCategory === 'Domestic') wEntry.domestic += f.connectionCount;
      if (f.connectionCategory === 'Industrial') wEntry.industrial += f.connectionCount;
    }

    const wardSeries = Array.from(wardTotalsMap.values()).map((w) => ({
      ...w,
      nonMeteredPct: w.total > 0 ? Number(((w.nonMetered / w.total) * 100).toFixed(2)) : 0,
    }));

    const nonMeteredPct = totalConnections > 0 ? Number(((nonMeteredConnections / totalConnections) * 100).toFixed(2)) : 0;
    const meteredPct = totalConnections > 0 ? Number(((meteredConnections / totalConnections) * 100).toFixed(2)) : 0;

    res.json({
      dataset: ds,
      kpis: {
        totalConnections,
        meteredConnections,
        nonMeteredConnections,
        wardsCovered: wardSeries.length,
        totalWardsInDataset: rawWards.length,
        meteredPct,
        nonMeteredPct,
      },
      meteringSplit: [
        { name: 'Metered', value: meteredConnections, share: meteredPct },
        { name: 'Non-Metered', value: nonMeteredConnections, share: nonMeteredPct },
      ],
      categoryBreakdown: Object.values(categoryTotals),
      wardSeries,
      allWardsMeta: rawWards.map((w) => ({
        wardCode: w.wardCode,
        wardName: w.wardName,
        zoneDivision: w.zoneDivision,
        majorLocalities: w.majorLocalities,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Categorised Data Explorer (server-side filtering, sorting, pagination)
app.get('/api/explorer', (req, res) => {
  try {
    const ds = getActiveDataset();
    const category = String(req.query.category || 'total');
    const zone = String(req.query.zone || 'ALL');
    const search = String(req.query.search || '').trim().toLowerCase();
    const sortBy = String(req.query.sortBy || 'wardCode');
    const sortDir = String(req.query.sortDir || 'asc') === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 12)));

    const rawWards = getAllActiveWardRows(ds.id);

    const mapped = rawWards
      .filter((w) => {
        if (zone !== 'ALL' && w.zoneDivision !== zone) return false;
        if (search) {
          const hay = `${w.wardCode} ${w.wardName} ${w.zoneDivision} ${w.majorLocalities}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .map((w) => {
        const commercialTotal = w.meteredCm + w.nonMeteredCm;
        const domesticTotal = w.meteredDm + w.nonMeteredDm;
        const industrialTotal = w.meteredInd + w.nonMeteredInd;
        let focusValue = w.allConnectionsTotal;
        if (category === 'commercial') focusValue = commercialTotal;
        else if (category === 'domestic') focusValue = domesticTotal;
        else if (category === 'industrial') focusValue = industrialTotal;
        else if (category === 'metered') focusValue = w.meteredTotal;
        else if (category === 'non_metered') focusValue = w.nonMeteredTotal;

        return {
          ...w,
          commercialTotal,
          domesticTotal,
          industrialTotal,
          focusValue,
        };
      });

    mapped.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortBy];
      const valB = (b as Record<string, unknown>)[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc'
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });

    const totalRecords = mapped.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safePage = Math.min(page, totalPages);
    const items = mapped.slice((safePage - 1) * pageSize, safePage * pageSize);

    res.json({
      dataset: ds,
      category,
      totalRecords,
      page: safePage,
      pageSize,
      totalPages,
      items,
      summaryTotals: {
        totalConnections: mapped.reduce((s, r) => s + r.allConnectionsTotal, 0),
        meteredTotal: mapped.reduce((s, r) => s + r.meteredTotal, 0),
        nonMeteredTotal: mapped.reduce((s, r) => s + r.nonMeteredTotal, 0),
        commercialTotal: mapped.reduce((s, r) => s + r.commercialTotal, 0),
        domesticTotal: mapped.reduce((s, r) => s + r.domesticTotal, 0),
        industrialTotal: mapped.reduce((s, r) => s + r.industrialTotal, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Ward analytics & individual ward detail
app.get('/api/wards', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const wards = getAllActiveWardRows(ds.id).map((w) => ({
      ...w,
      commercialTotal: w.meteredCm + w.nonMeteredCm,
      domesticTotal: w.meteredDm + w.nonMeteredDm,
      industrialTotal: w.meteredInd + w.nonMeteredInd,
      meteredPct: w.allConnectionsTotal > 0 ? Number(((w.meteredTotal / w.allConnectionsTotal) * 100).toFixed(2)) : 0,
    }));
    res.json({ dataset: ds, wards });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/wards/:code', (req, res) => {
  try {
    const ds = getActiveDataset();
    const code = decodeURIComponent(req.params.code).toUpperCase();
    const ward = getAllActiveWardRows(ds.id).find((w) => w.wardCode === code);
    if (!ward) {
      return res.status(404).json({ error: `Ward '${code}' not found` });
    }
    res.json({ dataset: ds, ward });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Advanced descriptive statistics & outlier indicators
app.get('/api/analytics/stats', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const wards = getAllActiveWardRows(ds.id);

    const totalStats = computeDescriptiveStats(wards.map((w) => w.allConnectionsTotal));
    const meteredStats = computeDescriptiveStats(wards.map((w) => w.meteredTotal));
    const nonMeteredStats = computeDescriptiveStats(wards.map((w) => w.nonMeteredTotal));
    const nonMeteredPctStats = computeDescriptiveStats(wards.map((w) => w.nonMeteredPctCalculated));
    const commercialStats = computeDescriptiveStats(wards.map((w) => w.meteredCm + w.nonMeteredCm));
    const domesticStats = computeDescriptiveStats(wards.map((w) => w.meteredDm + w.nonMeteredDm));
    const industrialStats = computeDescriptiveStats(wards.map((w) => w.meteredInd + w.nonMeteredInd));

    const outlierCheck = wards.map((w) => {
      const totalOutlier =
        w.allConnectionsTotal > totalStats.upperFence || w.allConnectionsTotal < totalStats.lowerFence;
      const pctOutlier =
        w.nonMeteredPctCalculated > nonMeteredPctStats.upperFence ||
        w.nonMeteredPctCalculated < nonMeteredPctStats.lowerFence;
      return {
        wardCode: w.wardCode,
        wardName: w.wardName,
        zoneDivision: w.zoneDivision,
        allConnectionsTotal: w.allConnectionsTotal,
        nonMeteredPctCalculated: w.nonMeteredPctCalculated,
        totalOutlier,
        pctOutlier,
        verificationNote:
          totalOutlier || pctOutlier
            ? 'Statistical IQR flag for further administrative review (not evidence of service issues)'
            : 'Within normal IQR range',
      };
    });

    // Zone summary
    const zoneMap = new Map<string, { zone: string; wards: number; metered: number; nonMetered: number; total: number }>();
    for (const w of wards) {
      if (!zoneMap.has(w.zoneDivision)) {
        zoneMap.set(w.zoneDivision, { zone: w.zoneDivision, wards: 0, metered: 0, nonMetered: 0, total: 0 });
      }
      const z = zoneMap.get(w.zoneDivision)!;
      z.wards += 1;
      z.metered += w.meteredTotal;
      z.nonMetered += w.nonMeteredTotal;
      z.total += w.allConnectionsTotal;
    }

    res.json({
      dataset: ds,
      descriptiveStats: {
        allConnections: totalStats,
        meteredConnections: meteredStats,
        nonMeteredConnections: nonMeteredStats,
        nonMeteredSharePct: nonMeteredPctStats,
        commercialConnections: commercialStats,
        domesticConnections: domesticStats,
        industrialConnections: industrialStats,
      },
      zoneSummary: Array.from(zoneMap.values()).map((z) => ({
        ...z,
        nonMeteredPct: z.total > 0 ? Number(((z.nonMetered / z.total) * 100).toFixed(2)) : 0,
      })),
      outlierAnalysis: outlierCheck,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Data Dictionary
app.get('/api/data-dictionary', (_req, res) => {
  res.json({ entries: DATA_DICTIONARY_ENTRIES });
});

// Data Sources & Provenance
app.get('/api/sources', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const db = getDb();
    const validations = db
      .prepare(`SELECT check_name as checkName, expected_value as expectedValue, actual_value as actualValue, passed, details, checked_at as checkedAt FROM data_validations WHERE dataset_id = ?`)
      .all(ds.id);

    res.json({
      sourceMetadata: SOURCE_METADATA,
      expectedValidationTotals: EXPECTED_VALIDATION_TOTALS,
      activeDataset: ds,
      validations,
      futureDatasetsStatus: [
        { department: 'Roads & Traffic (Concretization)', status: 'Pending Import', availableRecords: 0, note: 'Template ready for future municipal CSV/Excel upload' },
        { department: 'Municipal Education', status: 'Pending Import', availableRecords: 0, note: 'Awaiting verified ward-level dataset' },
        { department: 'Public Healthcare Facilities', status: 'Pending Import', availableRecords: 0, note: 'Awaiting verified BMC dispensary & hospital dataset' },
        { department: 'Water Infrastructure & Reservoirs', status: 'Pending Import', availableRecords: 0, note: 'Distinct from connection count snapshot' },
        { department: 'Solid Waste Management', status: 'Pending Import', availableRecords: 0, note: 'Awaiting verified ward-level tonnage dataset' },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ETL Pipeline status and manual re-run
app.get('/api/etl/status', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const db = getDb();
    const stages = db
      .prepare(
        `SELECT stage_number as stageNumber, stage_key as stageKey, title, description,
                input_summary as inputSummary, output_summary as outputSummary,
                technologies, status, executed_at as executedAt, metrics_json as metricsJson
         FROM etl_stages WHERE dataset_id = ? ORDER BY stage_number ASC`
      )
      .all(ds.id) as Array<{
      stageNumber: number;
      stageKey: string;
      title: string;
      description: string;
      inputSummary: string;
      outputSummary: string;
      technologies: string;
      status: string;
      executedAt: string;
      metricsJson: string | null;
    }>;

    const validations = db
      .prepare(
        `SELECT id, check_name as checkName, expected_value as expectedValue, actual_value as actualValue,
                passed, details, checked_at as checkedAt
         FROM data_validations WHERE dataset_id = ? ORDER BY id ASC`
      )
      .all(ds.id);

    res.json({
      dataset: ds,
      stages: stages.map((s) => ({
        ...s,
        technologies: JSON.parse(s.technologies),
        metrics: s.metricsJson ? JSON.parse(s.metricsJson) : undefined,
      })),
      validations,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/etl/reprocess', (req, res) => {
  try {
    const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
    if (actorRole !== 'Administrator' && actorRole !== 'Data Analyst') {
      return res.status(403).json({ error: 'Only Administrator or Data Analyst roles can trigger ETL reprocessing.' });
    }
    const result = runEtlAndStoreDataset({
      importedBy: `${actorRole} (Manual Reprocess)`,
      changeSummary: 'Triggered manual 10-stage ETL reprocessing & Power BI CSV refresh from source workbook',
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Data Quality & Monitoring
app.get('/api/quality', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const db = getDb();
    const wards = getAllActiveWardRows(ds.id);
    const validations = db
      .prepare(
        `SELECT id, check_name as checkName, expected_value as expectedValue, actual_value as actualValue,
                passed, details, checked_at as checkedAt
         FROM data_validations WHERE dataset_id = ?`
      )
      .all(ds.id) as Array<{ id: number; checkName: string; expectedValue: string; actualValue: string; passed: number; details: string; checkedAt: string }>;

    const datasets = db
      .prepare(
        `SELECT id, dataset_name as datasetName, version, source, reference_date as referenceDate,
                import_date as importDate, record_count as recordCount, status,
                imported_by as importedBy, change_summary as changeSummary, is_active as isActive
         FROM municipal_datasets ORDER BY id DESC`
      )
      .all();

    const requiredFieldsPerRow = 15;
    const totalCells = wards.length * requiredFieldsPerRow;
    let filledCells = 0;
    let numericValidCells = 0;
    const totalNumericCells = wards.length * 10;
    const wardCodesSeen = new Set<string>();
    let duplicateCount = 0;
    const varianceRows: Array<{
      wardCode: string;
      sourcePct: number;
      calculatedPct: number;
      diff: number;
      meteredSumDiff: number;
      nonMeteredSumDiff: number;
    }> = [];

    for (const w of wards) {
      if (wardCodesSeen.has(w.wardCode)) duplicateCount++;
      wardCodesSeen.add(w.wardCode);

      const fields = [
        w.wardCode, w.meteredCm, w.meteredDm, w.meteredInd, w.meteredTotal,
        w.nonMeteredCm, w.nonMeteredDm, w.nonMeteredInd, w.nonMeteredTotal,
        w.allConnectionsTotal, w.nonMeteredPctCalculated, w.nonMeteredPctSource,
        w.referenceDate, w.sourceBasis, w.sourceUrl,
      ];
      filledCells += fields.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;

      const nums = [
        w.meteredCm, w.meteredDm, w.meteredInd, w.meteredTotal,
        w.nonMeteredCm, w.nonMeteredDm, w.nonMeteredInd, w.nonMeteredTotal,
        w.allConnectionsTotal, w.nonMeteredPctCalculated,
      ];
      numericValidCells += nums.filter((n) => Number.isFinite(n) && n >= 0).length;

      const meteredSumDiff = w.meteredTotal - (w.meteredCm + w.meteredDm + w.meteredInd);
      const nonMeteredSumDiff = w.nonMeteredTotal - (w.nonMeteredCm + w.nonMeteredDm + w.nonMeteredInd);
      varianceRows.push({
        wardCode: w.wardCode,
        sourcePct: w.nonMeteredPctSource,
        calculatedPct: w.nonMeteredPctCalculated,
        diff: Number((w.nonMeteredPctCalculated - w.nonMeteredPctSource).toFixed(4)),
        meteredSumDiff,
        nonMeteredSumDiff,
      });
    }

    const completenessRate = totalCells > 0 ? Number(((filledCells / totalCells) * 100).toFixed(2)) : 0;
    const duplicateRate = wards.length > 0 ? Number(((duplicateCount / wards.length) * 100).toFixed(2)) : 0;
    const passedChecks = validations.filter((v) => v.passed === 1).length;
    const validationPassRate = validations.length > 0 ? Number(((passedChecks / validations.length) * 100).toFixed(2)) : 0;
    const numericValidityRate = totalNumericCells > 0 ? Number(((numericValidCells / totalNumericCells) * 100).toFixed(2)) : 0;
    const wardCoverageRate = Number(((wardCodesSeen.size / 24) * 100).toFixed(2));

    res.json({
      dataset: ds,
      metrics: {
        completenessRate,
        filledCells,
        totalCells,
        duplicateRate,
        duplicateCount,
        validationPassRate,
        passedChecks,
        totalChecks: validations.length,
        numericValidityRate,
        wardCoverageRate,
        wardsCovered: wardCodesSeen.size,
        schemaConsistency: 100,
        sourceVerified: true,
        referenceDateAvailable: Boolean(ds.referenceDate),
      },
      formulas: [
        {
          name: 'Completeness Rate',
          formula: '(Filled Required Fields / Total Required Fields) × 100',
          result: `${completenessRate}% (${filledCells}/${totalCells})`,
          limitation: 'Measures presence of values, not real-world accuracy of BMC meter readings.',
        },
        {
          name: 'Duplicate Rate',
          formula: '(Duplicate Ward Records / Total Ward Records) × 100',
          result: `${duplicateRate}% (${duplicateCount}/${wards.length})`,
          limitation: 'Checks primary key uniqueness after Grand Total exclusion.',
        },
        {
          name: 'Validation Pass Rate',
          formula: '(Passed Reconciliation Checks / Total Checks) × 100',
          result: `${validationPassRate}% (${passedChecks}/${validations.length})`,
          limitation: 'Reconciles against published Praja May 2025 RTI totals; cannot detect errors in the underlying RTI release itself.',
        },
        {
          name: 'Ward Coverage Rate',
          formula: '(Distinct Valid BMC Ward Codes / 24 Official Wards) × 100',
          result: `${wardCoverageRate}% (${wardCodesSeen.size}/24)`,
          limitation: 'Covers administrative wards A–T; does not capture sub-ward/slum pocket granularity.',
        },
      ],
      validations: validations.map((v) => ({ ...v, passed: v.passed === 1 })),
      varianceRows,
      versions: datasets,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/quality/error-log.csv', (_req, res) => {
  try {
    const ds = getActiveDataset();
    const db = getDb();
    const validations = db
      .prepare(`SELECT check_name, expected_value, actual_value, passed, details, checked_at FROM data_validations WHERE dataset_id = ?`)
      .all(ds.id) as Array<Record<string, unknown>>;

    const lines = ['Check_Name,Expected_Value,Actual_Value,Status,Details,Checked_At'];
    for (const v of validations) {
      lines.push(
        [
          `"${String(v.check_name).replace(/"/g, '""')}"`,
          `"${String(v.expected_value).replace(/"/g, '""')}"`,
          `"${String(v.actual_value).replace(/"/g, '""')}"`,
          v.passed === 1 ? 'PASSED' : 'FAILED',
          `"${String(v.details).replace(/"/g, '""')}"`,
          `"${String(v.checked_at)}"`,
        ].join(',')
      );
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="BMC_Data_Quality_Validation_Log.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Dataset Versions
app.get('/api/datasets', (_req, res) => {
  const db = getDb();
  const versions = db
    .prepare(
      `SELECT id, dataset_name as datasetName, version, source, source_url as sourceUrl,
              reference_date as referenceDate, import_date as importDate, file_format as fileFormat,
              record_count as recordCount, status, imported_by as importedBy,
              change_summary as changeSummary, is_active as isActive
       FROM municipal_datasets ORDER BY id DESC`
    )
    .all();
  res.json({ versions });
});

// Dataset Import Centre (Preview & Confirmed Commit)
app.post('/api/import/preview', upload.single('file'), (req, res) => {
  try {
    const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
    if (actorRole !== 'Administrator' && actorRole !== 'Data Analyst') {
      return res.status(403).json({ error: 'Only Administrator or Data Analyst roles can upload datasets.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file format. Upload .xlsx, .xls, or .csv.' });
    }

    const preview = inspectWorkbookBuffer(req.file.buffer);
    const requiredCols = ['Ward', 'Metered_CM', 'Metered_DM', 'Metered_IND', 'NonMetered_CM', 'NonMetered_DM', 'NonMetered_IND'];
    const missingColumns = requiredCols.filter((c) => !preview.detectedHeaders.includes(c));

    res.json({
      fileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      missingColumns,
      compatible: missingColumns.length === 0 && preview.wardRowCount > 0,
      ...preview,
    });
  } catch (err) {
    res.status(400).json({ error: `Failed to parse uploaded file: ${(err as Error).message}` });
  }
});

app.post('/api/import/commit', upload.single('file'), (req, res) => {
  try {
    const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
    if (actorRole !== 'Administrator') {
      return res.status(403).json({ error: 'Explicit Administrator role is required to commit a new dataset version.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file attached for commit.' });
    }
    const confirmed = String(req.body.confirmed || '') === 'true';
    if (!confirmed) {
      return res.status(400).json({ error: 'Explicit overwrite confirmation is required before committing.' });
    }

    const datasetName = String(req.body.datasetName || req.file.originalname);
    const changeSummary = String(req.body.changeSummary || `Imported ${req.file.originalname} via Dataset Import Centre`);

    // Backup original workbook before replacing if desired
    const backupName = `BMC_Water_Connections_backup_${Date.now()}.xlsx`;
    if (fs.existsSync(WORKBOOK_PATH)) {
      fs.copyFileSync(WORKBOOK_PATH, path.join(path.dirname(WORKBOOK_PATH), backupName));
    }

    const result = runEtlAndStoreDataset({
      workbookBuffer: req.file.buffer,
      datasetName,
      importedBy: actorRole,
      changeSummary: `${changeSummary} (Prior workbook backed up as ${backupName})`,
    });

    res.json({ ok: true, backupName, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Locality Survey (Sheet 4 implementation — distinct from BMC official data)
app.get('/api/surveys', (_req, res) => {
  const db = getDb();
  const surveys = db
    .prepare(
      `SELECT id, survey_date as surveyDate, ward_code as wardCode, locality_or_block as localityOrBlock,
              respondent_type as respondentType, water_source as waterSource, is_metered as isMetered,
              supply_hours_per_day as supplyHoursPerDay, supply_regularity as supplyRegularity,
              interruptions_per_month as interruptionsPerMonth, pressure_adequacy as pressureAdequacy,
              main_water_issue as mainWaterIssue, observation_notes as observationNotes, submitted_at as submittedAt
       FROM locality_surveys ORDER BY id DESC`
    )
    .all();
  res.json({ surveys });
});

app.post('/api/surveys', (req, res) => {
  try {
    const body = req.body;
    if (!body.wardCode || !body.localityOrBlock || !body.surveyDate) {
      return res.status(400).json({ error: 'Survey date, ward code, and locality/block are required.' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO locality_surveys (
          survey_date, ward_code, locality_or_block, respondent_type, water_source, is_metered,
          supply_hours_per_day, supply_regularity, interruptions_per_month, pressure_adequacy,
          main_water_issue, observation_notes, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(body.surveyDate),
        String(body.wardCode),
        String(body.localityOrBlock).trim(),
        String(body.respondentType || 'Resident'),
        String(body.waterSource || 'BMC Piped Supply'),
        String(body.isMetered || 'Yes'),
        Number(body.supplyHoursPerDay || 0),
        String(body.supplyRegularity || 'Daily'),
        Number(body.interruptionsPerMonth || 0),
        String(body.pressureAdequacy || 'Adequate'),
        String(body.mainWaterIssue || 'None reported'),
        String(body.observationNotes || '').trim(),
        now
      );

    logAudit(
      String(req.headers['x-user-role'] || 'Public Visitor'),
      'SURVEY_SUBMITTED',
      `survey:${result.lastInsertRowid}`,
      `Voluntary locality field observation logged for Ward ${body.wardCode} (${body.localityOrBlock})`
    );
    res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Local Business Connect (Consumer Discovery, Retailer Registration, Admin Approval, Engagement)
app.get('/api/businesses', (req, res) => {
  const db = getDb();
  const statusFilter = String(req.query.status || 'all');
  const wardFilter = String(req.query.ward || 'ALL');
  const categoryFilter = String(req.query.category || 'ALL');
  const search = String(req.query.search || '').trim().toLowerCase();
  const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');

  const rows = db
    .prepare(
      `SELECT b.id, b.business_name as businessName, b.category, b.ward_code as wardCode, b.locality,
              b.address, b.description, b.products_services as productsServices, b.opening_hours as openingHours,
              b.contact_phone as contactPhone, b.contact_email as contactEmail, b.consent_given as consentGiven,
              b.verification_status as verificationStatus, b.owner_email as ownerEmail,
              b.created_at as createdAt, b.updated_at as updatedAt,
              (SELECT COUNT(*) FROM business_engagements e WHERE e.business_id = b.id AND e.event_type = 'profile_view') as viewsCount,
              (SELECT COUNT(*) FROM business_engagements e WHERE e.business_id = b.id AND e.event_type = 'enquiry') as enquiriesCount,
              (SELECT COUNT(*) FROM business_engagements e WHERE e.business_id = b.id AND e.event_type = 'contact_click') as contactClicksCount
       FROM businesses b
       ORDER BY b.id DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const filtered = rows.filter((b) => {
    // Public visitors only see verified consented listings unless requesting own/admin
    if (actorRole === 'Public Visitor' && b.verificationStatus !== 'verified') return false;
    if (statusFilter !== 'all' && b.verificationStatus !== statusFilter) return false;
    if (wardFilter !== 'ALL' && b.wardCode !== wardFilter) return false;
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (search) {
      const hay = `${b.businessName} ${b.category} ${b.locality} ${b.wardCode} ${b.productsServices} ${b.description}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  res.json({ businesses: filtered });
});

app.post('/api/businesses', (req, res) => {
  try {
    const b = req.body;
    if (!b.businessName || !b.category || !b.wardCode || !b.locality || !b.consentGiven) {
      return res.status(400).json({
        error: 'Business name, category, ward code, locality, and explicit public listing consent are required.',
      });
    }
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO businesses (
          business_name, category, ward_code, locality, address, description,
          products_services, opening_hours, contact_phone, contact_email,
          consent_given, verification_status, owner_email, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
      )
      .run(
        String(b.businessName).trim(),
        String(b.category).trim(),
        String(b.wardCode).trim(),
        String(b.locality).trim(),
        String(b.address || '').trim(),
        String(b.description || '').trim(),
        String(b.productsServices || '').trim(),
        String(b.openingHours || '09:00 AM - 09:00 PM').trim(),
        String(b.contactPhone || '').trim(),
        String(b.contactEmail || '').trim(),
        b.consentGiven ? 1 : 0,
        String(b.ownerEmail || b.contactEmail || 'retailer@local.in').trim(),
        now,
        now
      );

    logAudit(
      String(req.headers['x-user-role'] || 'Retailer'),
      'BUSINESS_REGISTERED',
      `business:${result.lastInsertRowid}`,
      `Registered "${b.businessName}" in Ward ${b.wardCode} (${b.locality}) — awaiting admin verification`
    );

    res.status(201).json({ ok: true, id: Number(result.lastInsertRowid), status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/businesses/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM businesses WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
    if (!existing) return res.status(404).json({ error: 'Business listing not found.' });

    const { verificationStatus, businessName, category, locality, address, description, productsServices, openingHours, contactPhone, contactEmail } = req.body;

    if (verificationStatus && actorRole !== 'Administrator') {
      return res.status(403).json({ error: 'Only Administrator role can approve or reject business listings.' });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE businesses SET
        business_name = COALESCE(?, business_name),
        category = COALESCE(?, category),
        locality = COALESCE(?, locality),
        address = COALESCE(?, address),
        description = COALESCE(?, description),
        products_services = COALESCE(?, products_services),
        opening_hours = COALESCE(?, opening_hours),
        contact_phone = COALESCE(?, contact_phone),
        contact_email = COALESCE(?, contact_email),
        verification_status = COALESCE(?, verification_status),
        updated_at = ?
       WHERE id = ?`
    ).run(
      businessName ?? null,
      category ?? null,
      locality ?? null,
      address ?? null,
      description ?? null,
      productsServices ?? null,
      openingHours ?? null,
      contactPhone ?? null,
      contactEmail ?? null,
      verificationStatus ?? null,
      now,
      id
    );

    logAudit(
      actorRole,
      verificationStatus ? `BUSINESS_${String(verificationStatus).toUpperCase()}` : 'BUSINESS_UPDATED',
      `business:${id}`,
      `Updated business #${id} (${existing.business_name})`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/businesses/:id/engage', (req, res) => {
  try {
    const id = Number(req.params.id);
    const eventType = String(req.body.eventType || 'profile_view');
    if (!['profile_view', 'search_match', 'contact_click', 'enquiry', 'feedback'].includes(eventType)) {
      return res.status(400).json({ error: 'Invalid engagement event type.' });
    }
    const db = getDb();
    db.prepare(`INSERT INTO business_engagements (business_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?)`).run(
      id,
      eventType,
      req.body.metadata ? JSON.stringify(req.body.metadata) : null,
      new Date().toISOString()
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/businesses/:id/enquiry', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { senderName, senderContact, message } = req.body;
    if (!senderName || !senderContact || !message) {
      return res.status(400).json({ error: 'Name, contact details, and enquiry message are required.' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO business_enquiries (business_id, sender_name, sender_contact, message, created_at) VALUES (?, ?, ?, ?, ?)`).run(
      id,
      String(senderName).trim(),
      String(senderContact).trim(),
      String(message).trim(),
      now
    );
    db.prepare(`INSERT INTO business_engagements (business_id, event_type, metadata, created_at) VALUES (?, 'enquiry', ?, ?)`).run(
      id,
      JSON.stringify({ source: 'consumer_portal' }),
      now
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/business-impact', (_req, res) => {
  const db = getDb();
  const totalRegistered = (db.prepare(`SELECT COUNT(*) as cnt FROM businesses`).get() as { cnt: number }).cnt;
  const verifiedCount = (db.prepare(`SELECT COUNT(*) as cnt FROM businesses WHERE verification_status = 'verified'`).get() as { cnt: number }).cnt;
  const pendingCount = (db.prepare(`SELECT COUNT(*) as cnt FROM businesses WHERE verification_status = 'pending'`).get() as { cnt: number }).cnt;
  const categoriesCount = (db.prepare(`SELECT COUNT(DISTINCT category) as cnt FROM businesses`).get() as { cnt: number }).cnt;

  const engagements = db
    .prepare(`SELECT event_type as eventType, COUNT(*) as count FROM business_engagements GROUP BY event_type`)
    .all() as Array<{ eventType: string; count: number }>;

  const engMap: Record<string, number> = {
    profile_view: 0,
    search_match: 0,
    contact_click: 0,
    enquiry: 0,
    feedback: 0,
  };
  for (const e of engagements) engMap[e.eventType] = e.count;

  const byCategory = db
    .prepare(`SELECT category, COUNT(*) as count FROM businesses GROUP BY category ORDER BY count DESC`)
    .all();

  const byWard = db
    .prepare(
      `SELECT b.ward_code as wardCode, COUNT(*) as businessCount, r.metered_cm + r.non_metered_cm as bmcCommercialConnections
       FROM businesses b
       LEFT JOIN water_connections_raw r ON r.ward_code = b.ward_code AND r.dataset_id = (SELECT id FROM municipal_datasets WHERE is_active = 1 LIMIT 1)
       GROUP BY b.ward_code
       ORDER BY businessCount DESC`
    )
    .all();

  res.json({
    hasRealData: totalRegistered > 0,
    summary: {
      totalRegistered,
      verifiedCount,
      pendingCount,
      categoriesCount,
      profileViews: engMap.profile_view,
      consumerSearches: engMap.search_match,
      contactActions: engMap.contact_click,
      enquiries: engMap.enquiry,
    },
    byCategory,
    byWard,
  });
});

// Global Smart Search respecting permissions
app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
  if (!q) return res.json({ results: [] });

  const ds = getActiveDataset();
  const db = getDb();
  const results: Array<{ type: string; title: string; subtitle: string; route: string }> = [];

  const wards = getAllActiveWardRows(ds.id).filter((w) =>
    `${w.wardCode} ${w.wardName} ${w.majorLocalities} ${w.zoneDivision}`.toLowerCase().includes(q)
  );
  for (const w of wards.slice(0, 6)) {
    results.push({
      type: 'BMC Ward',
      title: w.wardName,
      subtitle: `${w.zoneDivision} · ${w.allConnectionsTotal.toLocaleString('en-IN')} water connections`,
      route: `/wards?selected=${encodeURIComponent(w.wardCode)}`,
    });
  }

  const dictMatches = DATA_DICTIONARY_ENTRIES.filter((d) =>
    `${d.fieldName} ${d.description}`.toLowerCase().includes(q)
  );
  for (const d of dictMatches.slice(0, 4)) {
    results.push({
      type: 'Data Field',
      title: d.fieldName,
      subtitle: `${d.status} · ${d.dataType}`,
      route: '/explorer',
    });
  }

  const bizRows = db
    .prepare(`SELECT id, business_name as businessName, category, ward_code as wardCode, locality, verification_status as verificationStatus FROM businesses`)
    .all() as Array<{ id: number; businessName: string; category: string; wardCode: string; locality: string; verificationStatus: string }>;

  for (const b of bizRows) {
    if (actorRole === 'Public Visitor' && b.verificationStatus !== 'verified') continue;
    if (`${b.businessName} ${b.category} ${b.locality} ${b.wardCode}`.toLowerCase().includes(q)) {
      results.push({
        type: 'Local Business',
        title: b.businessName,
        subtitle: `${b.category} · Ward ${b.wardCode} (${b.locality})`,
        route: '/businesses',
      });
    }
  }

  if ('praja opencity rti march 2025 water connections'.includes(q)) {
    results.push({
      type: 'Data Source',
      title: SOURCE_METADATA.datasetTitle,
      subtitle: SOURCE_METADATA.primaryReport,
      route: '/sources',
    });
  }

  res.json({ results: results.slice(0, 12) });
});

// Audit Logs (restricted to Admin & Analyst)
app.get('/api/audit-logs', (req, res) => {
  const actorRole = String(req.headers['x-user-role'] || 'Public Visitor');
  if (actorRole !== 'Administrator' && actorRole !== 'Data Analyst') {
    return res.status(403).json({ error: 'Audit logs are restricted to Administrator and Data Analyst roles.' });
  }
  const db = getDb();
  const logs = db
    .prepare(
      `SELECT id, actor_role as actorRole, action, resource, details, created_at as createdAt
       FROM audit_logs ORDER BY id DESC LIMIT 100`
    )
    .all();
  res.json({ logs });
});

// Power BI Integration Status
app.get('/api/powerbi/status', (_req, res) => {
  const embeddedConfigured = Boolean(
    process.env.POWERBI_EMBED_URL && process.env.POWERBI_CLIENT_ID && process.env.POWERBI_WORKSPACE_ID
  );
  const pbixPath = path.resolve(process.cwd(), 'powerbi', 'BMC_Water_Connections_Analytics.pbix');
  const pbixExists = fs.existsSync(pbixPath);
  const csvFiles = fs.existsSync(POWERBI_EXPORTS_DIR)
    ? fs.readdirSync(POWERBI_EXPORTS_DIR).filter((f) => f.endsWith('.csv'))
    : [];

  res.json({
    embeddedConfigured,
    pbixExists,
    pbixFileName: 'BMC_Water_Connections_Analytics.pbix',
    csvExports: csvFiles,
    themeAvailable: fs.existsSync(path.resolve(process.cwd(), 'powerbi', 'BMC_PowerBI_Theme.json')),
    mScriptAvailable: fs.existsSync(path.resolve(process.cwd(), 'powerbi', 'PowerQuery_Transformations.m')),
    daxDocsAvailable: fs.existsSync(path.resolve(process.cwd(), 'powerbi', 'PowerBI_DAX_Measures.md')),
  });
});

// Exports & Downloads
app.get('/api/exports/cleaned.csv', (req, res) => {
  const ds = getActiveDataset();
  const wardFilter = String(req.query.ward || '').trim();
  const zoneFilter = String(req.query.zone || '').trim();
  let wards = getAllActiveWardRows(ds.id);
  if (wardFilter && wardFilter !== 'ALL') wards = wards.filter((w) => w.wardCode === wardFilter);
  if (zoneFilter && zoneFilter !== 'ALL') wards = wards.filter((w) => w.zoneDivision === zoneFilter);

  const headers = [
    'Ward', 'Zone_Division', 'Metered_CM', 'Metered_DM', 'Metered_IND', 'Metered_Total',
    'NonMetered_CM', 'NonMetered_DM', 'NonMetered_IND', 'NonMetered_Total',
    'All_Connections_Total', 'NonMetered_Pct_Calculated', 'NonMetered_Pct_Source', 'Reference_Date',
  ];
  const lines = [headers.join(',')];
  for (const w of wards) {
    lines.push(
      [
        w.wardCode, `"${w.zoneDivision}"`, w.meteredCm, w.meteredDm, w.meteredInd, w.meteredTotal,
        w.nonMeteredCm, w.nonMeteredDm, w.nonMeteredInd, w.nonMeteredTotal,
        w.allConnectionsTotal, w.nonMeteredPctCalculated, w.nonMeteredPctSource, `"${w.referenceDate}"`,
      ].join(',')
    );
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="BMC_Water_Connections_Cleaned_March2025.csv"');
  res.send(lines.join('\n'));
});

app.get('/api/exports/workbook.xlsx', (_req, res) => {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    return res.status(404).json({ error: 'Source workbook not found.' });
  }
  res.download(WORKBOOK_PATH, 'BMC_Water_Connections_Ward_Data.xlsx');
});

app.get('/api/exports/powerbi-csv/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const fullPath = path.join(POWERBI_EXPORTS_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Requested Power BI export CSV not found.' });
  }
  res.download(fullPath, safeName);
});

app.get('/api/exports/powerbi-asset/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const fullPath = path.resolve(process.cwd(), 'powerbi', safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Requested Power BI deliverable file not found.' });
  }
  res.download(fullPath, safeName);
});

app.get('/api/exports/python-etl', (_req, res) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'bmc_water_etl.py');
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: 'Python ETL script not found.' });
  }
  res.download(scriptPath, 'bmc_water_etl.py');
});

app.get('/api/openapi.json', (_req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Mumbai Civic Data Intelligence Portal API',
      version: '1.0.0',
      description: 'REST API for BMC Water Connections analytics, 10-stage ETL validation, Power BI exports, Locality Surveys, and Local Business Connect.',
    },
    paths: {
      '/api/dashboard': { get: { summary: 'Get filtered dashboard KPIs and chart series' } },
      '/api/explorer': { get: { summary: 'Paginated & sorted BMC water connection explorer' } },
      '/api/wards': { get: { summary: 'All 24 BMC wards with category & metering breakdown' } },
      '/api/analytics/stats': { get: { summary: 'Descriptive statistics, quartiles, and IQR outlier flags' } },
      '/api/etl/status': { get: { summary: '10-stage ETL pipeline status & validation checks' } },
      '/api/etl/reprocess': { post: { summary: 'Trigger ETL pipeline reprocessing (Analyst/Admin)' } },
      '/api/quality': { get: { summary: 'Data quality metrics, formulas, and version history' } },
      '/api/import/preview': { post: { summary: 'Preview uploaded XLSX/CSV before commit' } },
      '/api/import/commit': { post: { summary: 'Commit validated dataset version (Admin)' } },
      '/api/surveys': { get: { summary: 'List voluntary field observations' }, post: { summary: 'Submit locality survey' } },
      '/api/businesses': { get: { summary: 'Search local businesses' }, post: { summary: 'Register retailer' } },
      '/api/exports/cleaned.csv': { get: { summary: 'Download filtered/cleaned CSV' } },
      '/api/exports/workbook.xlsx': { get: { summary: 'Download source 4-sheet XLSX workbook' } },
    },
  });
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumbai Civic Data Intelligence Portal running on http://localhost:${PORT}`);
  });
}

startServer();
