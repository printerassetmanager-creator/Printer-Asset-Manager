import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import useSessionTimeout from './hooks/useSessionTimeout';

import Dashboard from './pages/Dashboard';
import PrinterDashboard from './pages/PrinterDashboard';
import HealthCheckup from './pages/HealthCheckup';
import PmForm from './pages/PmForm';
import ViewPrinters from './pages/ViewPrinters';
import VlanActivity from './pages/VlanActivity';
import BackupPrinters from './pages/BackupPrinters';
import SpareParts from './pages/SpareParts';
import HpPrinters from './pages/HpPrinters';
import LabelRecipes from './pages/LabelRecipes';
import UpcomingPM from './pages/UpcomingPM';
import DueOverdue from './pages/DueOverdue';
import IssuesTracker from './pages/IssuesTracker';
import ILearn from './pages/ILearn';
import PrinterMaster from './pages/PrinterMaster';
import UserApprovals from './pages/UserApprovals';
import PrintMonitarBot from './pages/PrintMonitarBot';
import ApplicationSupport from './pages/ApplicationSupport';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/UserProfile';

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

function AppInner() {
  const { currentScreen, setCurrentScreen, isAuthenticated, user, logout, loginUser, supportMode, setSupportMode } = useApp();
  const [authScreen, setAuthScreen] = useState('login');
  const [time, setTime] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const closeUserProfile = () => {
    setShowUserProfile(false);
  };

  const handleLogout = () => {
    logout();
    closeUserProfile();
  };

  const handleSessionExpire = (reason) => {
    console.log(`Auto-logout triggered: ${reason}`);
    logout();
    closeUserProfile();
  };

  useSessionTimeout(handleSessionExpire, 20, isAuthenticated);

  console.log('App rendering - isAuthenticated:', isAuthenticated, 'user:', user);

  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Handle support mode changes
  React.useEffect(() => {
    if (supportMode === 'application' && currentScreen !== 'appsupport') {
      setCurrentScreen('appsupport');
    } else if (supportMode === 'desktop' && currentScreen === 'appsupport') {
      setCurrentScreen('dashboard');
    }
  }, [supportMode, currentScreen, setCurrentScreen]);

  const handleLoginSuccess = (result) => {
    if (result && result.screen) {
      if (result.screen === 'register') {
        setAuthScreen('register');
      } else if (result.screen === 'forgot-password') {
        setAuthScreen('forgot-password');
      }
    } else {
      const token = localStorage.getItem('authToken');
      loginUser(result, token);
    }
  };

  const handleBackToLogin = () => {
    setAuthScreen('login');
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#6c5ce7',
      }}>
        {authScreen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
        {authScreen === 'register' && <Register onBack={handleBackToLogin} />}
        {authScreen === 'forgot-password' && <ForgotPassword onBack={handleBackToLogin} />}
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard />;
      case 'printerdashboard': return <PrinterDashboard />;
      case 'printmonitarbot': return <PrintMonitarBot />;
      case 'health': return <HealthCheckup />;
      case 'pmform': return <PmForm />;
      case 'viewprinters': return <ViewPrinters />;
      case 'backupprinters': return <BackupPrinters />;
      case 'vlan': return <VlanActivity />;
      case 'spare': return <SpareParts />;
      case 'hp': return <HpPrinters />;
      case 'recipe': return <LabelRecipes />;
      case 'upcoming': return <UpcomingPM />;
      case 'dueoverdue': return <DueOverdue />;
      case 'ilearn': return <ILearn />;
      case 'issues': return <IssuesTracker />;
      case 'printermaster': return isAdmin ? <PrinterMaster /> : <Dashboard />;
      case 'userapprovals': return isSuperAdmin ? <UserApprovals /> : <Dashboard />;
      case 'appsupport': return <ApplicationSupport />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main-area">
        <Topbar onUserClick={() => setShowUserProfile(true)} />
        {renderScreen()}
        <div className="act-bar">
          <div className="act-info">
            Logged in as <span>{user?.email}</span> · <span>{time}</span>
          </div>
          <div className="act-btns">
            <button className="btn btn-sm action-pill action-pill-profile" onClick={() => setShowUserProfile(true)}>
              <span className="action-pill-icon"><ProfileIcon /></span>
              <span>Profile</span>
            </button>
            <button className="btn btn-sm action-pill action-pill-logout" onClick={handleLogout}>
              <span className="action-pill-icon"><LogoutIcon /></span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {showUserProfile && (
        <UserProfile user={user} onClose={closeUserProfile} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
