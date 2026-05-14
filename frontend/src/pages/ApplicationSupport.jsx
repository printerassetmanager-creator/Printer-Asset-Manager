import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { applicationSupportAPI } from '../utils/api';
import '../styles/applicationSupport.css';

import ManageTerminals from '../components/ApplicationSupport/ManageTerminals';
import LiveTerminalChart from '../components/ApplicationSupport/LiveTerminalChart';
import MonitorTerminal from '../components/ApplicationSupport/MonitorTerminal';
import ServerPerformance from '../components/ApplicationSupport/ServerPerformance';
import ServerCleanup from '../components/ApplicationSupport/ServerCleanup';
import TerminalManagement from '../components/ApplicationSupport/TerminalManagement';

const LoadingSection = () => <div className="app-dashboard-empty">Loading...</div>;

export default function ApplicationSupport() {
  const { user, supportMode, appSupportTab, setAppSupportTab } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [inventory, setInventory] = useState([]);
  const userSupportType = user?.support_type || user?.supportType;

  const isAppSupportAdmin = useMemo(
    () => user?.role === 'admin' && (userSupportType === 'application' || userSupportType === 'both'),
    [user?.role, userSupportType]
  );
  const isAppSupportUser = useMemo(
    () => userSupportType === 'application' || userSupportType === 'both',
    [userSupportType]
  );
  const isSuperAdmin = user?.role === 'super_admin';

  const canAccessAdminFeatures = useMemo(
    () => isSuperAdmin || isAppSupportAdmin,
    [isSuperAdmin, isAppSupportAdmin]
  );
  const canAccessUserFeatures = useMemo(
    () => isSuperAdmin || isAppSupportUser,
    [isSuperAdmin, isAppSupportUser]
  );

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError('');
    try {
      const { data } = await applicationSupportAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      setDashboardError(error.response?.data?.error || 'Failed to load application support dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const { data } = await applicationSupportAPI.getInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  }, []);

  const refreshInventory = useCallback(() => {
    loadInventory();
    setDashboardRefreshKey(prev => prev + 1); // Trigger refresh for components that need it
  }, [loadInventory]);

  const refreshDashboard = useCallback(async () => {
    setDashboardRefreshKey((key) => key + 1);
    await loadDashboard();
  }, [loadDashboard]);


  useEffect(() => {
    if (supportMode === 'application' && canAccessUserFeatures) {
      loadDashboard();
      loadInventory();
      const intervalId = setInterval(() => {
        loadDashboard();
      }, 60000);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [supportMode, canAccessUserFeatures, loadDashboard, loadInventory]);

  useEffect(() => {
    if (appSupportTab === 'admin-users' || appSupportTab === 'admin-settings') {
      setAppSupportTab('dashboard');
    }
  }, [appSupportTab, setAppSupportTab]);

  useEffect(() => {
    if (appSupportTab === 'cleanup-server' && !isSuperAdmin) {
      setAppSupportTab('dashboard');
    }
  }, [appSupportTab, isSuperAdmin, setAppSupportTab]);

  if (supportMode !== 'application' || !canAccessUserFeatures) {
    return (
      <div className="app-support-error">
        <h2>Access Denied</h2>
        <p>You don't have access to Application Support. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="app-support-container">
      {/* Tab Content */}
      <div className="app-support-content">
        {appSupportTab === 'dashboard' && (
          <div className="app-dashboard">
            <div className="app-dashboard-header">
              <div>
                <h2>Application Support</h2>
                <p>Manage application support terminals and servers</p>
              </div>
            </div>

            {dashboardError && <div className="alert alert-error">{dashboardError}</div>}

            {loadingDashboard && !dashboard ? (
              <div className="app-dashboard-empty">Loading dashboard...</div>
            ) : (
              <>
                <LiveTerminalChart
                  inline
                  onFullScreen={() => setIsChartFullscreen(true)}
                  refreshSignal={dashboardRefreshKey}
                />
                <div className="app-dashboard-grid" style={{ marginTop: '22px' }}>
                </div>
              </>
            )}
          </div>
        )}

        {appSupportTab === 'terminals' && (
          <div className="tab-content">
            <ManageTerminals canManage={canAccessAdminFeatures} onInventoryChange={refreshInventory} />
          </div>
        )}

        {appSupportTab === 'terminal-management' && (
          <div className="tab-content">
            <TerminalManagement canManage={canAccessUserFeatures} dashboard={dashboard} />
          </div>
        )}

        {appSupportTab === 'monitor-terminal' && (
          <div className="tab-content">
            <MonitorTerminal canManage={canAccessAdminFeatures} />
          </div>
        )}

        {appSupportTab === 'server-performance' && (
          <div className="tab-content">
            <ServerPerformance canManage={canAccessAdminFeatures} />
          </div>
        )}

        {appSupportTab === 'cleanup-server' && (
          <div className="tab-content">
            <ServerCleanup isSuperAdmin={isSuperAdmin} inventory={inventory} onInventoryRefresh={refreshInventory} />
          </div>
        )}

        {appSupportTab === 'user-workspace' && canAccessUserFeatures && (
          <div className="tab-content">
            <h2>User Workspace</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}
      </div>

      {isChartFullscreen && (
        <div className="fullscreen-chart-overlay">
          <LiveTerminalChart onExit={() => setIsChartFullscreen(false)} />
        </div>
      )}
    </div>
  );
}
