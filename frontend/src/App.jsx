import React, { useState } from 'react';
import { AppProvider, useApp, CURRENT_USER } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

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
import PrinterMaster from './pages/PrinterMaster';

function AppInner() {
  const { currentScreen } = useApp();
  const [time, setTime] = useState('');

  // Clock for action bar
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

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
      case 'issues':        return <IssuesTracker />;
      case 'printermaster': return <PrinterMaster />;
      default:              return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        {renderScreen()}
        <div className="act-bar">
          <div className="act-info">
            Logged in as <span>{CURRENT_USER}</span> · <span>{time}</span>
          </div>
          <div className="act-btns">
            <button className="btn btn-ghost btn-sm">Clear</button>
            <button className="btn btn-success btn-sm">Save</button>
          </div>
        </div>
      </div>
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
