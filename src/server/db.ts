import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { DATA_DIR, ensureDirectories } from './workbookGenerator.ts';
import { BMC_WARDS_METADATA } from './seedData.ts';

let dbInstance: DatabaseSync | null = null;

export function runTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  ensureDirectories();
  const dbPath = path.join(DATA_DIR, 'civic_portal.db');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS municipal_datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_name TEXT NOT NULL,
      version TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      reference_date TEXT NOT NULL,
      import_date TEXT NOT NULL,
      file_format TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      imported_by TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS wards (
      ward_code TEXT PRIMARY KEY,
      ward_name TEXT NOT NULL,
      zone_division TEXT NOT NULL,
      major_localities TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS water_connections_raw (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      ward_code TEXT NOT NULL,
      metered_cm INTEGER NOT NULL,
      metered_dm INTEGER NOT NULL,
      metered_ind INTEGER NOT NULL,
      metered_total INTEGER NOT NULL,
      non_metered_cm INTEGER NOT NULL,
      non_metered_dm INTEGER NOT NULL,
      non_metered_ind INTEGER NOT NULL,
      non_metered_total INTEGER NOT NULL,
      all_connections_total INTEGER NOT NULL,
      non_metered_pct_calculated REAL NOT NULL,
      non_metered_pct_source REAL NOT NULL,
      reference_date TEXT NOT NULL,
      source_basis TEXT NOT NULL,
      source_url TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES municipal_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (ward_code) REFERENCES wards(ward_code)
    );

    CREATE INDEX IF NOT EXISTS idx_raw_dataset_ward ON water_connections_raw(dataset_id, ward_code);

    CREATE TABLE IF NOT EXISTS water_connections_fact (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      ward_code TEXT NOT NULL,
      connection_category TEXT NOT NULL CHECK(connection_category IN ('Commercial', 'Domestic', 'Industrial')),
      meter_status TEXT NOT NULL CHECK(meter_status IN ('Metered', 'Non-Metered')),
      connection_count INTEGER NOT NULL,
      reference_date TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES municipal_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (ward_code) REFERENCES wards(ward_code)
    );

    CREATE INDEX IF NOT EXISTS idx_fact_dataset_ward_cat ON water_connections_fact(dataset_id, ward_code, connection_category, meter_status);

    CREATE TABLE IF NOT EXISTS data_validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      check_name TEXT NOT NULL,
      expected_value TEXT NOT NULL,
      actual_value TEXT NOT NULL,
      passed INTEGER NOT NULL,
      details TEXT NOT NULL,
      checked_at TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES municipal_datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS etl_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      stage_number INTEGER NOT NULL,
      stage_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      input_summary TEXT NOT NULL,
      output_summary TEXT NOT NULL,
      technologies TEXT NOT NULL,
      status TEXT NOT NULL,
      executed_at TEXT NOT NULL,
      metrics_json TEXT,
      FOREIGN KEY (dataset_id) REFERENCES municipal_datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS locality_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_date TEXT NOT NULL,
      ward_code TEXT NOT NULL,
      locality_or_block TEXT NOT NULL,
      respondent_type TEXT NOT NULL,
      water_source TEXT NOT NULL,
      is_metered TEXT NOT NULL,
      supply_hours_per_day REAL NOT NULL,
      supply_regularity TEXT NOT NULL,
      interruptions_per_month INTEGER NOT NULL,
      pressure_adequacy TEXT NOT NULL,
      main_water_issue TEXT NOT NULL,
      observation_notes TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (ward_code) REFERENCES wards(ward_code)
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      category TEXT NOT NULL,
      ward_code TEXT NOT NULL,
      locality TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      products_services TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      consent_given INTEGER NOT NULL DEFAULT 1,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
      owner_email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (ward_code) REFERENCES wards(ward_code)
    );

    CREATE INDEX IF NOT EXISTS idx_business_ward_status ON businesses(ward_code, verification_status, category);

    CREATE TABLE IF NOT EXISTS business_engagements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('profile_view', 'search_match', 'contact_click', 'enquiry', 'feedback')),
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_engagement_biz ON business_engagements(business_id, event_type);

    CREATE TABLE IF NOT EXISTS business_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      sender_contact TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Seed canonical 24 BMC Wards metadata
  const insertWard = db.prepare(`
    INSERT OR IGNORE INTO wards (ward_code, ward_name, zone_division, major_localities)
    VALUES (?, ?, ?, ?)
  `);
  runTransaction(db, () => {
    for (const w of BMC_WARDS_METADATA) {
      insertWard.run(w.wardCode, w.wardName, w.zoneDivision, w.majorLocalities);
    }
  });

  dbInstance = db;
  return db;
}

export function logAudit(actorRole: string, action: string, resource: string, details: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (actor_role, action, resource, details, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(actorRole, action, resource, details, new Date().toISOString());
}
