import React, { useState } from 'react';
import { useApp, PLANT_LOCATIONS } from '../context/AppContext';

const initials = (email) => {
  if (!email) return 'U';
  const parts = email.split('@')[0].split('.');
  return parts.map(p => p[0].toUpperCase()).join('');
};

const displayName = (fullName) => fullName || 'User';
const roleLabel = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'User';
};

export default function Sidebar() {
  const { currentScreen, setCurrentScreen, appSupportTab, setAppSupportTab, openIssues, selectedPlants, togglePlant, selectAllPlants, user, supportMode, setSupportMode } = useApp();
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [showLabelPrinterGroup, setShowLabelPrinterGroup] = useState(true);

  const ni = (name) => `ni${currentScreen === name ? ' active' : ''}`;
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const appTitle = supportMode === 'application' ? 'IT Support Activities' : 'Printer Asset Manager';
  const isApplicationMode = supportMode === 'application';
  const showPlantSelector = !isApplicationMode;
  const userSupportType = user?.support_type || user?.supportType;
  const isApplicationSupportUser = userSupportType === 'application' || userSupportType === 'both';
  const appSupportNi = (tab) => `ni${currentScreen === 'appsupport' && appSupportTab === tab ? ' active' : ''}`;
  const labelPrinterScreens = ['viewprinters', 'health', 'pmform', 'backupprinters', 'upcoming', 'dueoverdue'];
  const isLabelPrinterActive = labelPrinterScreens.includes(currentScreen);
  const openAppSupportTab = (tab) => {
    setAppSupportTab(tab);
    setCurrentScreen('appsupport');
    if (isApplicationSupportUser) {
      setSupportMode('application');
    }
  };

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo-container">
          <img src="/jabil-logo.svg" alt="JABIL Logo" className="sb-logo" />
        </div>
        <div className="version-info" style={{fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '4px'}}>v1.0.0</div>
        <div className="co">Jabil Circuit Pvt Ltd</div>
        <div className="ti">{appTitle}</div>
      </div>
      <div className="sb-user">
        <div className="av">{initials(user?.email)}</div>
        <div className="sb-user-info">
          <div className="un">{displayName(user?.fullName)}</div>
          <div className="ur">{user?.email} &nbsp;<span className="badge b-admin" style={{fontSize:'9px',padding:'1px 5px'}}>{roleLabel(user?.role)}</span></div>
        </div>
      </div>

      {showPlantSelector && (
        <div className="sb-plant-selector">
          <div className="sb-plant-label">Plant Location</div>
          <div className="sb-plant-dropdown-wrapper">
            <button 
              className="sb-plant-button"
              onClick={() => setShowPlantDropdown(!showPlantDropdown)}
              title="Select plant locations to filter data"
            >
              <span className="sb-plant-count">
                {selectedPlants.length === PLANT_LOCATIONS.length
                  ? 'All Locations'
                  : `${selectedPlants.length} Selected`}
              </span>
              <svg className={`sb-plant-caret ${showPlantDropdown ? 'open' : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showPlantDropdown && (
              <div className="sb-plant-menu">
                {PLANT_LOCATIONS.map(plant => (
                  <label key={plant} className="sb-plant-item">
                    <input
                      type="checkbox"
                      checked={selectedPlants.includes(plant)}
                      onChange={() => togglePlant(plant)}
                    />
                    <span className="sb-plant-name">{plant}</span>
                  </label>
                ))}
                <div className="sb-plant-divider"></div>
                <div className="sb-plant-buttons">
                  <button
                    className="sb-plant-select-all"
                    onClick={selectAllPlants}
                  >
                    Select All
                  </button>
                  <button
                    className="sb-plant-done"
                    onClick={() => setShowPlantDropdown(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          {selectedPlants.length > 0 && (
            <div className="sb-plant-tags">
              {selectedPlants.map(plant => (
                <span key={plant} className="sb-plant-tag">{plant}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sb-nav">
        {isApplicationMode ? (
          <>
            <div className={appSupportNi('dashboard')} onClick={() => openAppSupportTab('dashboard')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="9" y="1" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="1" y="9" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="9" y="9" width="6" height="6" rx="1" fill="#4a7fd4"/></svg>
              <span className="ni-label">Dashboard</span>
            </div>
            <div className={appSupportNi('terminals')} onClick={() => openAppSupportTab('terminals')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="11" rx="1.2" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M4 6h8M4 8h6M4 10h7" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Terminal and Server</span>
            </div>
            <div className={appSupportNi('terminal-management')} onClick={() => openAppSupportTab('terminal-management')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="8" rx="1.2" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 13h6M8 10v3" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/><path d="M5 6h6" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Terminal Management</span>
            </div>
            <div className={appSupportNi('monitor-terminal')} onClick={() => openAppSupportTab('monitor-terminal')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="10" rx="1.2" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M4 8h2l1-2 2 4 1-2h2" stroke="#4a7fd4" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14h6" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="ni-label">Monitor Terminal</span>
            </div>
            <div className={appSupportNi('server-performance')} onClick={() => openAppSupportTab('server-performance')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="10" rx="1.2" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M4 5.5h8M4 8h5M4 10.5h7" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/><path d="M5 14h6" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="ni-label">Server Performance</span>
            </div>
            <div className={appSupportNi('cleanup-server')} onClick={() => openAppSupportTab('cleanup-server')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M3 3.5h10v2H3v-2z" fill="#4a7fd4"/><path d="M4 6.5h8v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M6 9h4" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="ni-label">Cleanup Server</span>
            </div>
            <div className={appSupportNi('user-workspace')} onClick={() => openAppSupportTab('user-workspace')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M1 4h14v10a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M1 4h14v2H1z" fill="#4a7fd4" fillOpacity="0.3"/><path d="M4 9h8M4 11.5h6" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">User Workspace</span>
            </div>
          </>
        ) : (
          <>
            <div className={ni('dashboard')} onClick={() => setCurrentScreen('dashboard')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="9" y="1" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="1" y="9" width="6" height="6" rx="1" fill="#4a7fd4"/><rect x="9" y="9" width="6" height="6" rx="1" fill="#4a7fd4"/></svg>
              <span className="ni-label">Dashboard</span>
            </div>
            <div className={ni('printerdashboard')} onClick={() => setCurrentScreen('printerdashboard')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="10" rx="1.4" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M4 14h8M8 12v2" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/><path d="M4 6h8M4 8.5h5" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Printer Dashboard</span>
            </div>
            <div className={ni('printmonitarbot')} onClick={() => setCurrentScreen('printmonitarbot')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="8" height="6" rx="1.2" stroke="#3db87a" strokeWidth="1.2"/><path d="M4 10.5h4M3.5 13h7" stroke="#3db87a" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12.5" cy="5" r="1.5" fill="#3db87a"/><path d="M11.5 9l1-1 1 1 1.5-1.5" stroke="#3db87a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="ni-label">Print Monitar Bot</span>
            </div>

            {/* Label Printer Group */}
            <div className={`ni-group${isLabelPrinterActive ? ' active' : ''}`}>
              <div className="ni-group-header" onClick={() => setShowLabelPrinterGroup(!showLabelPrinterGroup)}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 6h6M5 9h6M5 12h3" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Label Printer</span>
              <svg className={`ni-group-caret ${showLabelPrinterGroup ? 'open' : ''}`} viewBox="0 0 16 16" fill="none" style={{marginLeft: 'auto', width: '14px', height: '14px'}}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              </div>
            </div>

            {showLabelPrinterGroup && (
              <>
                <div className={ni('viewprinters')} onClick={() => setCurrentScreen('viewprinters')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="#4a7fd4" strokeWidth="1.2"/></svg>
                  <span className="ni-label">View Printers</span>
                </div>
                <div className={ni('health')} onClick={() => setCurrentScreen('health')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M3 8h3l1.5-2.5 2 5L11 8h2" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="ni-label">Health Checkup</span>
                </div>
                <div className={ni('pmform')} onClick={() => setCurrentScreen('pmform')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
                  <span className="ni-label">PM Pasted Form</span>
                </div>
                <div className={ni('backupprinters')} onClick={() => setCurrentScreen('backupprinters')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="9" height="10" rx="1.4" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M6 1.8v2.4M4.2 6.4h4.8M4.2 9h4.8" stroke="#4a7fd4" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 8.5h3M12.5 7v3" stroke="#3db87a" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span className="ni-label">Backup Printers</span>
                </div>
                <div className={ni('upcoming')} onClick={() => setCurrentScreen('upcoming')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="9" r="5.5" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M8 6v3l2 1.5" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/><path d="M5.5 2h5" stroke="#4a7fd4" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span className="ni-label">Upcoming PM</span>
                </div>
                <div className={ni('dueoverdue')} onClick={() => setCurrentScreen('dueoverdue')} style={{paddingLeft: '40px'}}>
                  <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M8 5v3" stroke="#e05252" strokeWidth="1.6" strokeLinecap="round"/><circle cx="8" cy="11.5" r=".9" fill="#e05252"/></svg>
                  <span className="ni-label">PM Due / Overdue</span>
                </div>
              </>
            )}
            <div className={ni('vlan')} onClick={() => setCurrentScreen('vlan')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="2.5" r="2" stroke="#4a7fd4" strokeWidth="1.2"/><circle cx="2.5" cy="13" r="2" stroke="#4a7fd4" strokeWidth="1.2"/><circle cx="13.5" cy="13" r="2" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M8 4.5v4M8 8.5L2.5 11M8 8.5l5.5 2.5" stroke="#4a7fd4" strokeWidth="1"/></svg>
              <span className="ni-label">VLAN Activity</span>
            </div>
            <div className={ni('spare')} onClick={() => setCurrentScreen('spare')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="9" rx="1.5" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 5V4a3 3 0 016 0v1" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 9.5h6M8 7.5v4" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Spare Parts</span>
            </div>
            <div className={ni('hp')} onClick={() => setCurrentScreen('hp')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="1.5" stroke="#22d3ee" strokeWidth="1.2"/><path d="M4 4V3a1 1 0 012 0v1M10 4V3a1 1 0 012 0v1" stroke="#22d3ee" strokeWidth="1.2"/><circle cx="8" cy="8" r="1.5" fill="#22d3ee"/></svg>
              <span className="ni-label" style={{color:'#22d3ee'}}>HP Printers</span>
            </div>
            <div className={ni('recipe')} onClick={() => setCurrentScreen('recipe')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#4a7fd4" strokeWidth="1.2"/><path d="M5 6h6M5 9h6M5 12h3" stroke="#4a7fd4" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="ni-label">Label Recipes</span>
            </div>

            <div className={ni('ilearn')} onClick={() => setCurrentScreen('ilearn')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="#3db87a" strokeWidth="1.2"/><path d="M7 5h2v4h-2zM8 11a.5.5 0 100-1 .5.5 0 000 1z" fill="#3db87a"/></svg>
              <span className="ni-label">i Learn</span>
            </div>

            <div className={ni('issues')} onClick={() => setCurrentScreen('issues')}>
              <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="#e05252" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 6v3" stroke="#e05252" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="11" r=".8" fill="#e05252"/></svg>
              <span className="ni-label">Issues Tracker</span>
              {openIssues > 0 && <span className="nb">{openIssues}</span>}
            </div>
          </>
        )}
      </div>

      {isSuperAdmin && (
        <div className="adm-section">
          <div className="adm-lbl">Super Admin Only</div>
          <div className={`ni adm-ni${currentScreen === 'userapprovals' ? ' active' : ''}`} onClick={() => setCurrentScreen('userapprovals')}>
            <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="#e8a020" strokeWidth="1.2"/><path d="M2 13.5c0-2 2.5-3.5 6-3.5s6 1.5 6 3.5" stroke="#e8a020" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span className="ni-label">User Management</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="adm-section">
          <div className="adm-lbl">Admin Only</div>
          <div className={`ni adm-ni${currentScreen === 'printermaster' ? ' active' : ''}`} onClick={() => setCurrentScreen('printermaster')}>
            <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="#e8a020" strokeWidth="1.2"/><path d="M5 5V3h6v2" stroke="#e8a020" strokeWidth="1.2"/><circle cx="8" cy="9.5" r="1.8" fill="#e8a020"/></svg>
            <span className="ni-label">Printer Master</span>
          </div>
        </div>
      )}

      {(user?.support_type === 'application' || user?.support_type === 'both' || user?.supportType === 'application' || user?.supportType === 'both') && !isApplicationMode && (
        <div className="adm-section">
          <div className="adm-lbl">Application Support</div>
          <div className={`ni adm-ni${currentScreen === 'appsupport' ? ' active' : ''}`} onClick={() => openAppSupportTab('dashboard')}>
            <svg className="ni-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="11" rx="1.2" stroke="#22d3ee" strokeWidth="1.2"/><path d="M4 6h8M4 8h6M4 10h7" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round"/></svg>
            <span className="ni-label" style={{color:'#22d3ee'}}>App Support</span>
          </div>
        </div>
      )}
    </div>
  );
}
