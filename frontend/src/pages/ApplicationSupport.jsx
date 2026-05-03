import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ManageTerminals from '../components/ApplicationSupport/ManageTerminals';
import '../styles/applicationSupport.css';

export default function ApplicationSupport() {
  const { user, supportMode } = useApp();
  const [activeTab, setActiveTab] = useState('terminals');

  // Role-based access control
  const isAppSupportAdmin = user?.role === 'admin' && user?.support_type === 'application';
  const isAppSupportUser = user?.support_type === 'application';
  const isSuperAdmin = user?.role === 'super_admin';
  const isTechnicalSupport = user?.support_type === 'technical';

  // Super admin gets all access, app support admin gets admin features, app support users get user features
  const canAccessAdminFeatures = isSuperAdmin || isAppSupportAdmin;
  const canAccessUserFeatures = isSuperAdmin || isAppSupportUser || (isTechnicalSupport && supportMode === 'application');

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
      <div className="app-support-header">
        <h1>Application Support Management</h1>
        <p>Manage and monitor application support operations</p>
      </div>

      {/* Tab Navigation */}
      <div className="app-support-tabs">
        <button
          className={`tab-btn ${activeTab === 'terminals' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminals')}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6h8M4 8h6M4 10h7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span>Manage Terminals</span>
        </button>

        {canAccessAdminFeatures && (
          <>
            <button
              className={`tab-btn ${activeTab === 'admin-users' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-users')}
            >
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 13.5c0-2 2.5-3.5 6-3.5s6 1.5 6 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>Admin Users</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'admin-settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-settings')}
            >
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 5v3l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Settings</span>
            </button>
          </>
        )}

        {canAccessUserFeatures && (
          <button
            className={`tab-btn ${activeTab === 'user-workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-workspace')}
          >
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1 4h14v10a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1 4h14v2H1z" fill="currentColor" fillOpacity="0.3"/>
              <path d="M4 9h8M4 11.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span>User Workspace</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="app-support-content">
        {activeTab === 'terminals' && <ManageTerminals />}
        
        {activeTab === 'admin-users' && canAccessAdminFeatures && (
          <div className="tab-content">
            <h2>Admin Users Management</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}

        {activeTab === 'admin-settings' && canAccessAdminFeatures && (
          <div className="tab-content">
            <h2>Application Support Settings</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}

        {activeTab === 'user-workspace' && canAccessUserFeatures && (
          <div className="tab-content">
            <h2>User Workspace</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
