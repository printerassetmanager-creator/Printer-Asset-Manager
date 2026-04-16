import React, { createContext, useContext, useState, useEffect } from 'react';
import { issuesAPI } from '../utils/api';

const AppContext = createContext(null);

export const CURRENT_USER = 'aniket.patil';
export const IS_ADMIN = ['aniket.patil', 'admin'].includes(CURRENT_USER);

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [openIssues, setOpenIssues] = useState(0);

  const refreshIssueCount = async () => {
    try {
      const { data } = await issuesAPI.getAll();
      setOpenIssues(data.filter(i => i.status === 'open').length);
    } catch {}
  };

  useEffect(() => { refreshIssueCount(); }, []);

  return (
    <AppContext.Provider value={{ currentScreen, setCurrentScreen, openIssues, refreshIssueCount }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
