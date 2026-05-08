import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import useSessionTimeout from './hooks/useSessionTimeout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PrinterDashboard = lazy(() => import('./pages/PrinterDashboard'));
const HealthCheckup = lazy(() => import('./pages/HealthCheckup'));
const PmForm = lazy(() => import('./pages/PmForm'));
const ViewPrinters = lazy(() => import('./pages/ViewPrinters'));
const VlanActivity = lazy(() => import('./pages/VlanActivity'));
const BackupPrinters = lazy(() => import('./pages/BackupPrinters'));
const SpareParts = lazy(() => import('./pages/SpareParts'));
const HpPrinters = lazy(() => import('./pages/HpPrinters'));
const LabelRecipes = lazy(() => import('./pages/LabelRecipes'));
const UpcomingPM = lazy(() => import('./pages/UpcomingPM'));
const DueOverdue = lazy(() => import('./pages/DueOverdue'));
const IssuesTracker = lazy(() => import('./pages/IssuesTracker'));
const ILearn = lazy(() => import('./pages/ILearn'));
const PrinterMaster = lazy(() => import('./pages/PrinterMaster'));
const UserApprovals = lazy(() => import('./pages/UserApprovals'));
const PrintMonitarBot = lazy(() => import('./pages/PrintMonitarBot'));
const ApplicationSupport = lazy(() => import('./pages/ApplicationSupport'));

// Auth Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

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
  const [showUserProfile, setShowUserProfile] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const userSupportType = user?.support_type || user?.supportType;

  const closeUserProfile = () => {
    setShowUserProfile(false);
  };

  const handleLogout = () => {
    logout();
    closeUserProfile();
  };

  const handleSessionExpire = (reason) => {
    logout();
    closeUserProfile();
  };

  useSessionTimeout(handleSessionExpire, 20, isAuthenticated);

  // Handle support mode changes
  React.useEffect(() => {
    if (!isSuperAdmin && userSupportType === 'application' && supportMode !== 'application') {
      setSupportMode('application');
      return;
    }

    if (!isSuperAdmin && userSupportType === 'technical' && supportMode !== 'desktop') {
      setSupportMode('desktop');
      return;
    }

    const allowedApplicationModeScreens = ['appsupport', 'userapprovals'];

    if (supportMode === 'application' && !allowedApplicationModeScreens.includes(currentScreen)) {
      setCurrentScreen('appsupport');
    } else if (supportMode === 'desktop' && currentScreen === 'appsupport') {
      setCurrentScreen('dashboard');
    }
  }, [supportMode, currentScreen, setCurrentScreen, setSupportMode, isSuperAdmin, userSupportType]);

  const handleLoginSuccess = (result) => {
    if (result && result.screen) {
      if (result.screen === 'register') {
        setAuthScreen('register');
      } else if (result.screen === 'forgot-password') {
        setAuthScreen('forgot-password');
      }
      return;
    }

    const token = localStorage.getItem('authToken');
    loginUser(result, token);
    setCurrentScreen('dashboard');
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
        <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center' }}>Loading...</div>}>
          {authScreen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
          {authScreen === 'register' && <Register onBack={handleBackToLogin} />}
          {authScreen === 'forgot-password' && <ForgotPassword onBack={handleBackToLogin} />}
        </Suspense>
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
      case 'login': return <Login onLoginSuccess={handleLoginSuccess} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main-area">
        <Topbar onUserClick={() => setShowUserProfile(true)} onLogout={handleLogout} />
        <Suspense fallback={<div className="screen loading">Loading...</div>}>
          {renderScreen()}
        </Suspense>
        <div className="act-bar">
          <div className="act-info">
            Logged in as <span>{user?.email}</span>
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
        <Suspense fallback={<div className="screen loading">Loading...</div>}>
          <UserProfile user={user} onClose={closeUserProfile} onLogout={handleLogout} />
        </Suspense>
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
