import React, { createContext, useContext, useState, useEffect } from 'react';
import { issuesAPI } from '../utils/api';

const AppContext = createContext(null);

export const PLANT_LOCATIONS = ['B26', 'B1600', 'B1700', 'B1800'];

// Legacy support for CURRENT_USER - with error handling
let CURRENT_USER = 'guest';
let IS_ADMIN = false;
try {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsed = JSON.parse(userData);
    CURRENT_USER = parsed.email || 'guest';
    IS_ADMIN = parsed.role === 'admin';
  }
} catch (e) {
  console.warn('localStorage parsing error:', e);
}
export { CURRENT_USER, IS_ADMIN };

export const displayName = (user) => String(user || '')
  .split('.')
  .filter(Boolean)
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join(' ');

const getInitialScreen = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('screen') === 'issues' ? 'issues' : 'dashboard';
  } catch (e) {
    console.warn('URL parsing error:', e);
    return 'dashboard';
  }
};

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen);
  const [openIssues, setOpenIssues] = useState(0);
  const [selectedPlants, setSelectedPlants] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedPlants');
      return saved ? JSON.parse(saved) : PLANT_LOCATIONS;
    } catch (e) {
      console.warn('selectedPlants parsing error:', e);
      return PLANT_LOCATIONS;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('user parsing error:', e);
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      console.warn('authToken parsing error:', e);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!authToken);

  useEffect(() => {
    if (user && !authToken) {
      console.warn('User data exists without a valid auth token, clearing stale session.');
      try {
        localStorage.removeItem('user');
      } catch (e) {
        console.warn('localStorage error:', e);
      }
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [user, authToken]);

  // Persist selected plants to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('selectedPlants', JSON.stringify(selectedPlants));
    } catch (e) {
      console.warn('localStorage setItem error:', e);
    }
  }, [selectedPlants]);

  const refreshIssueCount = async () => {
    try {
      const { data } = await issuesAPI.getAll();
      setOpenIssues(data.filter(i => i.status === 'open').length);
    } catch (e) {
      console.warn('refreshIssueCount error:', e);
    }
  };

  const togglePlant = (plant) => {
    setSelectedPlants((prev) => {
      const updated = prev.includes(plant)
        ? prev.filter((p) => p !== plant)
        : [...prev, plant];
      return updated.length === 0 ? prev : updated; // Prevent deselecting all
    });
  };

  const selectAllPlants = () => {
    setSelectedPlants(PLANT_LOCATIONS);
  };

  const logout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch (e) {
      console.warn('localStorage error:', e);
    }
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  const loginUser = (userData, token) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', token);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
    setUser(userData);
    setAuthToken(token);
    setIsAuthenticated(!!userData && !!token);
  };

  useEffect(() => { refreshIssueCount(); }, []);

  return (
    <AppContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      openIssues,
      refreshIssueCount,
      selectedPlants,
      setSelectedPlants,
      togglePlant,
      selectAllPlants,
      user,
      authToken,
      setUser,
      setAuthToken,
      isAuthenticated,
      setIsAuthenticated,
      logout,
      loginUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
