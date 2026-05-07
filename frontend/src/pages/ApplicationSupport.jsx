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
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const [cleanupError, setCleanupError] = useState('');

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

  const loadCleanupStatus = useCallback(async () => {
    setCleanupError('');
    try {
      const { data } = await applicationSupportAPI.getServerCleanupStatus();
      setCleanupStatus(data);
    } catch (error) {
      setCleanupError(error.response?.data?.error || 'Failed to load server cleanup status');
    }
  }, []);

  useEffect(() => {
    if (supportMode === 'application' && canAccessUserFeatures) {
      loadDashboard();
      loadCleanupStatus();
      const intervalId = setInterval(() => {
        loadDashboard();
        loadCleanupStatus();
      }, 60000);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [supportMode, canAccessUserFeatures, loadDashboard, loadCleanupStatus]);

  useEffect(() => {
    if (appSupportTab === 'admin-users' || appSupportTab === 'admin-settings') {
      setAppSupportTab('dashboard');
    }
  }, [appSupportTab, setAppSupportTab]);

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
                />
                <div className="app-dashboard-grid" style={{ marginTop: '22px' }}>
                  <div className="app-dashboard-panel" style={{ minHeight: '180px' }}>
                    <h3>Cleanup Manager</h3>
                    {cleanupError ? (
                      <div className="alert alert-error">{cleanupError}</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>Last cleanup</div>
                        <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700' }}>
                          {cleanupStatus?.created_at ? new Date(cleanupStatus.created_at).toLocaleString() : 'No cleanup run yet'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                          <div>
                            <div className="app-dashboard-label">Server</div>
                            <div style={{ color: '#e2e8f0' }}>{cleanupStatus?.server_name || '--'}</div>
                          </div>
                          <div>
                            <div className="app-dashboard-label">Status</div>
                            <div style={{ color: cleanupStatus?.status === 'success' ? '#22c55e' : '#f97316' }}>{cleanupStatus?.status || 'idle'}</div>
                          </div>
                          <div>
                            <div className="app-dashboard-label">Space freed</div>
                            <div style={{ color: '#e2e8f0' }}>{cleanupStatus?.space_freed_bytes ? `${(cleanupStatus.space_freed_bytes / 1024 / 1024).toFixed(1)} MB` : '0 MB'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {appSupportTab === 'terminals' && (
          <ManageTerminals canManage={canAccessAdminFeatures} onInventoryChange={loadDashboard} />
        )}

        {appSupportTab === 'terminal-management' && (
          <TerminalManagement canManage={canAccessUserFeatures} dashboard={dashboard} />
        )}

        {appSupportTab === 'monitor-terminal' && (
          <MonitorTerminal canManage={canAccessAdminFeatures} />
        )}

        {appSupportTab === 'server-performance' && (
          <ServerPerformance canManage={canAccessAdminFeatures} />
        )}

        {appSupportTab === 'cleanup-server' && (
          <ServerCleanup isSuperAdmin={isSuperAdmin} />
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
