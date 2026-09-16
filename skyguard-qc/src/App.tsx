import React, { useState } from 'react';
import { PageId, Station, AnomalyAlert } from './types';
import { STATIONS as MOCK_STATIONS, ALERTS as MOCK_ALERTS } from './data/mockData';
import { fetchStations, fetchAlerts } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';

import { DashboardPage } from './pages/DashboardPage';
import { StationsPage } from './pages/StationsPage';
import { StationDetailPage } from './pages/StationDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { ObservationDetailPage } from './pages/ObservationDetailPage';
import { PerformancePage } from './pages/PerformancePage';
import { SensorHealthPage } from './pages/SensorHealthPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { ReportsPage } from './pages/ReportsPage';
import { DemoScenariosPage } from './pages/DemoScenariosPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';
import { LiveStreamPage } from './pages/LiveStreamPage';
import { TopographyBackground } from './components/common/TopographyBackground';

import { Boxes, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from './utils/motion';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedStationId, setSelectedStationId] = useState<string>('Bengaluru_HAL');
  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert>(MOCK_ALERTS[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stations, setStations] = useState<Station[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [apiStations, apiAlerts] = await Promise.all([
          fetchStations(),
          fetchAlerts()
        ]);
        setStations(apiStations);
        setAlerts(apiAlerts);
        setBackendError(false);
      } catch (err) {
        console.warn("API unavailable.", err);
        setBackendError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
    setCurrentPage('station-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAlert = (alert: AnomalyAlert) => {
    setSelectedAlert(alert);
    setCurrentPage('observation-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased relative overflow-x-hidden">
      {/* Continuous Viewport Topography Background */}
      <TopographyBackground />

      {/* Deep Navy Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        activeAlertCount={alerts.filter(a => a.status === 'active').length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out relative z-10 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
        }`}
      >
        {/* Simplified Restrained Top Bar */}
        <TopBar
          onMenuToggle={() => setMobileOpen(true)}
          alerts={alerts}
          onAlertSelect={handleSelectAlert}
          onNavigate={handleNavigate}
        />

        {backendError && (
          <div className="bg-rose-500 text-white text-center py-2 text-sm font-semibold z-20 relative shadow-sm">
            Backend connection lost. Data presented may be incomplete or unavailable.
          </div>
        )}

        {/* Dynamic Page Rendering */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                {...transitions.page}
                className="flex items-center justify-center h-[50vh] text-slate-500 font-medium text-sm"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Establishing uplink with SkyGuard network...
                </div>
              </motion.div>
            ) : stations.length === 0 ? (
              <motion.div
                key="empty"
                {...transitions.page}
                className="flex items-center justify-center h-[50vh] text-rose-500 font-medium text-sm"
              >
                Error: SkyGuard network unavailable. No stations found.
              </motion.div>
            ) : (
              <motion.div
                key={currentPage}
                {...transitions.page}
                className="w-full"
              >
                {currentPage === 'dashboard' && (
                  <DashboardPage
                    stations={stations}
                    alerts={alerts}
                    onSelectStation={handleSelectStation}
                    onSelectAlert={handleSelectAlert}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentPage === 'stations' && (
                  <StationsPage
                    stations={stations}
                    onSelectStation={handleSelectStation}
                  />
                )}

                {currentPage === 'station-details' && (
                  <StationDetailPage
                    stationId={selectedStationId}
                    stations={stations}
                    alerts={alerts}
                    onBack={() => handleNavigate('stations')}
                    onSelectAlert={handleSelectAlert}
                  />
                )}

                {currentPage === 'alerts' && (
                  <AlertsPage
                    alerts={alerts}
                    onSelectAlert={handleSelectAlert}
                  />
                )}

                {currentPage === 'observation-details' && (
                  <ObservationDetailPage
                    alert={selectedAlert}
                    onBack={() => handleNavigate('alerts')}
                    onNavigateToStation={handleSelectStation}
                  />
                )}

                {currentPage === 'performance' && <PerformancePage />}

                {currentPage === 'health' && (
                  <SensorHealthPage
                    stations={stations}
                    onSelectStation={handleSelectStation}
                  />
                )}

                {currentPage === 'explorer' && (
                  <DataExplorerPage stations={stations} />
                )}

                {currentPage === 'reports' && (
                  <ReportsPage stations={stations} alerts={alerts} />
                )}

                {currentPage === 'scenarios' && <DemoScenariosPage />}

                {currentPage === 'architecture' && <ArchitecturePage />}

                {currentPage === 'settings' && <SettingsPage />}

                {currentPage === 'live' && <LiveStreamPage stations={stations} />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>


      </div>
    </div>
  );
}
