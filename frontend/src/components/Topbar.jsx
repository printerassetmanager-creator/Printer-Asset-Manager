import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const screenTitles = {
  issues: 'Issues Tracker',
  dashboard: 'Dashboard',
  printerdashboard: 'Printer Dashboard',
  health: 'Health Checkup',
  pmform: 'PM Pasted Form',
  viewprinters: 'View Printers',
  vlan: 'VLAN Activity',
  spare: 'Spare Parts',
  hp: 'HP Printers',
  recipe: 'Label Recipes',
  upcoming: 'Upcoming PM',
  dueoverdue: 'PM Due / Overdue',
  printermaster: 'Printer Master',
};

const screenMeta = {
  issues: 'Log, track and resolve printer issues - auto-deleted after 10 days',
  dashboard: 'Live overview - Jabil Circuit Pvt Ltd',
  printerdashboard: 'KPI, search and live printer status table',
  health: 'Enter PM No to auto-fetch all details',
  pmform: 'Log preventive maintenance - all fields editable',
  viewprinters: 'Live ping status - all printers',
  vlan: 'Manage VLAN ports, MAC address, switch and location',
  spare: 'Spare parts inventory and usage log',
  hp: 'HP inkjet/laser printer management + cartridge tracking',
  recipe: 'Label design recipes - searchable by name, make, DPI, model',
  upcoming: 'PMs due within the next 5 days',
  dueoverdue: 'PM due and overdue tracker',
  printermaster: 'Admin - add / edit / delete printers from master database',
};

export default function Topbar() {
  const { currentScreen } = useApp();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="topbar">
      <div>
        <div className="tb-title">{screenTitles[currentScreen] || currentScreen}</div>
        <div className="tb-meta">{screenMeta[currentScreen] || ''}</div>
      </div>
      <div className="tb-right">
        <div className="time-chip">{time}</div>
        <div className="live-pill"><div className="live-dot"></div>Live</div>
      </div>
    </div>
  );
}
