import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const screenTitles = {
  issues: 'Issues Tracker',
  dashboard: 'Dashboard',
  printerdashboard: 'Printer Dashboard',
  printmonitarbot: 'Print Monitar Bot',
  health: 'Health Checkup',
  pmform: 'PM Pasted Form',
  viewprinters: 'View Printers',
  backupprinters: 'Backup Printers',
  vlan: 'VLAN Activity',
  spare: 'Spare Parts',
  hp: 'HP Printers',
  recipe: 'Label Recipes',
  upcoming: 'Upcoming PM',
  dueoverdue: 'PM Due / Overdue',
  ilearn: 'i Learn',
  printermaster: 'Printer Master',
  userapprovals: 'User Management',
  appsupport: 'Application Support',
};

const screenMeta = {
  issues: 'Log, track and resolve printer issues - auto-deleted after 10 days',
  dashboard: 'Live overview - Jabil Circuit Pvt Ltd',
  printerdashboard: 'KPI, search and live printer status table',
  printmonitarbot: 'Bot workspace for print monitoring flows and automation',
  health: 'Enter PM No to auto-fetch all details',
  pmform: 'Log preventive maintenance - all fields editable',
  viewprinters: 'Live ping status - all printers',
  backupprinters: 'Manage standby label printers for printer-down fallback usage',
  vlan: 'This section is under development',
  spare: 'Spare parts inventory and usage log',
  hp: 'HP inkjet/laser printer management + cartridge tracking',
  recipe: 'Label design recipes - searchable by name, make, DPI, model',
  upcoming: 'PMs due within the next 5 days',
  dueoverdue: 'PM due and overdue tracker',
  ilearn: 'Learning platform - search issues and follow step-by-step guides with images',
  printermaster: 'Admin - add / edit / delete printers from master database',
  userapprovals: 'Super admin - approve, reject, delete and manage user accounts',
  appsupport: 'Manage application support terminals and servers',
};

function ProfileIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="5" r="2.5" fill="currentColor" />
      <path d="M3 13c0-2.2 2.2-3.8 5-3.8s5 1.6 5 3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v8.4a1.3 1.3 0 0 0 1.3 1.3H6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8h6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Topbar({ onUserClick, onLogout }) {
  const { currentScreen, user, supportMode, setSupportMode } = useApp();
  const [time, setTime] = useState('');
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const userSupportType = user?.support_type || user?.supportType;
  const hasTechnicalAccess = isSuperAdmin || userSupportType === 'technical' || userSupportType === 'both';
  const hasApplicationAccess = isSuperAdmin || userSupportType === 'application' || userSupportType === 'both';

  const canSwitchSupportMode = hasTechnicalAccess && hasApplicationAccess;

  const handleSupportModeChange = (mode) => {
    if ((mode === 'desktop' && hasTechnicalAccess) || (mode === 'application' && hasApplicationAccess)) {
      setSupportMode(mode);
    }
    setShowSupportDropdown(false);
  };

  const showAccountActions = supportMode === 'application';

  return (
    <div className="topbar">
      <div>
        <div className="tb-title">{screenTitles[currentScreen] || currentScreen}</div>
        <div className="tb-meta">{screenMeta[currentScreen] || ''}</div>
      </div>
      
      {canSwitchSupportMode && (
        <div className="tb-center">
          <div className="support-mode-selector">
            <button 
              className="support-mode-button"
              onClick={() => setShowSupportDropdown(!showSupportDropdown)}
            >
              <span>{supportMode === 'desktop' ? 'Desktop Support' : 'Application Support'}</span>
              <svg className={`support-caret ${showSupportDropdown ? 'open' : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showSupportDropdown && (
              <div className="support-mode-menu">
                {hasTechnicalAccess && (
                  <button 
                    className={`support-mode-item ${supportMode === 'desktop' ? 'active' : ''}`}
                    onClick={() => handleSupportModeChange('desktop')}
                  >
                    Desktop Support
                  </button>
                )}
                {hasApplicationAccess && (
                  <button 
                    className={`support-mode-item ${supportMode === 'application' ? 'active' : ''}`}
                    onClick={() => handleSupportModeChange('application')}
                  >
                    Application Support
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="tb-right">
        {showAccountActions && (
          <div className="topbar-account-actions">
            <button type="button" className="topbar-account-btn topbar-profile-btn" onClick={onUserClick}>
              <span><ProfileIcon /></span>
              Profile
            </button>
            <button type="button" className="topbar-account-btn topbar-logout-btn" onClick={onLogout}>
              <span><LogoutIcon /></span>
              Logout
            </button>
          </div>
        )}
        <div className="tb-signature">Developed by :- Aniket Bhosale</div>
        <div className="time-chip">{time}</div>
        <div className="live-pill"><div className="live-dot"></div>Live</div>
      </div>
    </div>
  );
}
