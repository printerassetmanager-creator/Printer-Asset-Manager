import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ManageTerminals from '../components/ApplicationSupport/ManageTerminals';
import LiveTerminalChart from '../components/ApplicationSupport/LiveTerminalChart';
import TerminalManagement from '../components/ApplicationSupport/TerminalManagement';
import { applicationSupportAPI } from '../utils/api';
import '../styles/applicationSupport.css';

export default function ApplicationSupport() {
  const { user, supportMode, appSupportTab, setAppSupportTab } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const userSupportType = user?.support_type || user?.supportType;

  // Role-based access control
  const isAppSupportAdmin = user?.role === 'admin' && (userSupportType === 'application' || userSupportType === 'both');
  const isAppSupportUser = userSupportType === 'application' || userSupportType === 'both';
  const isSuperAdmin = user?.role === 'super_admin';

  // Super admin gets all access, app support admin gets admin features, app support users get user features
  const canAccessAdminFeatures = isSuperAdmin || isAppSupportAdmin;
  const canAccessUserFeatures = isSuperAdmin || isAppSupportUser;

  const loadDashboard = async () => {
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
  };

  useEffect(() => {
    if (supportMode === 'application' && canAccessUserFeatures) {
      loadDashboard();
      const intervalId = setInterval(loadDashboard, 60000);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [supportMode, canAccessUserFeatures]);

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

  if (isChartFullscreen) {
    return <LiveTerminalChart onExit={() => setIsChartFullscreen(false)} />;
  }

  return (
    <div className="app-support-container">
      {/* Tab Content */}
      <div className="app-support-content">
        {appSupportTab === 'dashboard' && (
          <div className="app-dashboard">
            <div className="app-dashboard-header">
              <div>
                <h2>Dashboard</h2>
                <p>Active users refresh automatically every 1 minute</p>
              </div>
              <div className="dashboard-header-actions">
                <span className="app-dashboard-role">{canAccessAdminFeatures ? 'Admin Access' : 'User Access'}</span>
              </div>
            </div>

            {dashboardError && <div className="alert alert-error">{dashboardError}</div>}

            {loadingDashboard && !dashboard ? (
              <div className="app-dashboard-empty">Loading dashboard...</div>
            ) : (
              <LiveTerminalChart
                inline
                onFullScreen={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                  setIsChartFullscreen(true);
                }}
              />
            )}

            <div className="app-dashboard-panel">
              <h3>Server Load</h3>
              {(dashboard?.servers || []).length ? (
                <div className="app-dashboard-list">
                  {(dashboard?.servers || []).map((server) => {
                    const isHigh = Number(server.active_users || 0) >= Number(server.max_users || 30);
                    return (
                    <div key={server.id} className={`app-dashboard-row ${isHigh ? 'server-row-high' : ''}`}>
                      <div>
                        <strong>{server.name}</strong>
                        <span>{server.terminal_code} - {server.status || 'unknown'}{server.last_error ? ` - ${server.last_error}` : ''}</span>
                      </div>
                      <em>{server.active_users || 0}/{server.max_users || 30}</em>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="app-dashboard-empty">No server data available yet.</div>
              )}
            </div>
          </div>
        )}

        {appSupportTab === 'terminals' && <ManageTerminals canManage={canAccessAdminFeatures} onInventoryChange={loadDashboard} />}

        {appSupportTab === 'terminal-management' && <TerminalManagement canManage={canAccessUserFeatures} dashboard={dashboard} />}

        {appSupportTab === 'monitor-terminal' && (
          <div className="tab-content">
            <h2>Monitor Terminal</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}

        {appSupportTab === 'user-workspace' && canAccessUserFeatures && (
          <div className="tab-content">
            <h2>User Workspace</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
