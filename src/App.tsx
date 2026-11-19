import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext.tsx';
import { PortalLayout } from './components/PortalLayout.tsx';
import { HomeDashboardPage } from './pages/HomeDashboardPage.tsx';
import { DataExplorerPage } from './pages/DataExplorerPage.tsx';
import { WaterConnectionsPage } from './pages/WaterConnectionsPage.tsx';
import { WardAnalyticsPage } from './pages/WardAnalyticsPage.tsx';
import { PowerBiAnalyticsPage } from './pages/PowerBiAnalyticsPage.tsx';
import { AdvancedAnalyticsPage } from './pages/AdvancedAnalyticsPage.tsx';
import { EtlPipelinePage } from './pages/EtlPipelinePage.tsx';
import { DataQualityPage } from './pages/DataQualityPage.tsx';
import { DataSourcesPage } from './pages/DataSourcesPage.tsx';
import { BusinessConnectPage } from './pages/BusinessConnectPage.tsx';
import { BusinessImpactPage } from './pages/BusinessImpactPage.tsx';
import { SystemWorkflowPage } from './pages/SystemWorkflowPage.tsx';
import { DataImportPage } from './pages/DataImportPage.tsx';
import { ReportsExportsPage } from './pages/ReportsExportsPage.tsx';
import { AboutProjectPage } from './pages/AboutProjectPage.tsx';

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <PortalLayout>
          <Routes>
            <Route path="/" element={<HomeDashboardPage />} />
            <Route path="/explorer" element={<DataExplorerPage />} />
            <Route path="/connections" element={<WaterConnectionsPage />} />
            <Route path="/wards" element={<WardAnalyticsPage />} />
            <Route path="/powerbi" element={<PowerBiAnalyticsPage />} />
            <Route path="/analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="/etl" element={<EtlPipelinePage />} />
            <Route path="/quality" element={<DataQualityPage />} />
            <Route path="/sources" element={<DataSourcesPage />} />
            <Route path="/businesses" element={<BusinessConnectPage />} />
            <Route path="/impact" element={<BusinessImpactPage />} />
            <Route path="/workflow" element={<SystemWorkflowPage />} />
            <Route path="/import" element={<DataImportPage />} />
            <Route path="/exports" element={<ReportsExportsPage />} />
            <Route path="/about" element={<AboutProjectPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortalLayout>
      </BrowserRouter>
    </RoleProvider>
  );
}
