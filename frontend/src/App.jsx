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
import SpareParts from './pages/SpareParts';
import HpPrinters from './pages/HpPrinters';
import LabelRecipes from './pages/LabelRecipes';
import UpcomingPM from './pages/UpcomingPM';
import DueOverdue from './pages/DueOverdue';
import IssuesTracker from './pages/IssuesTracker';
import ILearn from './pages/ILearn';
import PrinterMaster from './pages/PrinterMaster';
import UserApprovals from './pages/UserApprovals';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/UserProfile';

function AppInner() {
  const { currentScreen, isAuthenticated, user, logout, loginUser } = useApp();
  const [authScreen, setAuthScreen] = useState('login'); // login, register, forgot-password
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

  // Handle session expiration (either due to inactivity or browser hidden)
  const handleSessionExpire = (reason) => {
    console.log(`Auto-logout triggered: ${reason}`);
    logout();
    closeUserProfile();
  };

  // Auto log out after 10 minutes without web activity.
  useSessionTimeout(handleSessionExpire, 10, isAuthenticated);

  console.log('App rendering - isAuthenticated:', isAuthenticated, 'user:', user);

  // Clock for action bar
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Handle login success
  const handleLoginSuccess = (result) => {
    // Check if this is a navigation request (screen switch)
    if (result && result.screen) {
      if (result.screen === 'register') {
        setAuthScreen('register');
      } else if (result.screen === 'forgot-password') {
        setAuthScreen('forgot-password');
      }
    } else {
      // Successful login - result is a user object
      const token = localStorage.getItem('authToken');
      loginUser(result, token);
    }
  };

  // Handle back to login
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
        background: '#6c5ce7'
      }}>
        {authScreen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
        {authScreen === 'register' && <Register onBack={handleBackToLogin} />}
        {authScreen === 'forgot-password' && <ForgotPassword onBack={handleBackToLogin} />}
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':     return <Dashboard />;
      case 'printerdashboard': return <PrinterDashboard />;
      case 'health':        return <HealthCheckup />;
      case 'pmform':        return <PmForm />;
      case 'viewprinters':  return <ViewPrinters />;
      case 'vlan':          return <VlanActivity />;
      case 'spare':         return <SpareParts />;
      case 'hp':            return <HpPrinters />;
      case 'recipe':        return <LabelRecipes />;
      case 'upcoming':      return <UpcomingPM />;
      case 'dueoverdue':    return <DueOverdue />;
      case 'ilearn':        return <ILearn />;
      case 'issues':        return <IssuesTracker />;
      case 'printermaster': return isAdmin ? <PrinterMaster /> : <Dashboard />;
      case 'userapprovals': return isSuperAdmin ? <UserApprovals /> : <Dashboard />;
      default:              return <Dashboard />;
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
            <button className="btn btn-ghost btn-sm" onClick={() => setShowUserProfile(true)}>
              👤 Profile
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
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
