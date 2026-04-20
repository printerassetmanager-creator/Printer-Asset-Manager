import { useEffect, useRef } from 'react';

const useSessionTimeout = (onSessionExpire, timeoutMinutes = 15, isAuthenticated = true) => {
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningShownRef = useRef(false);

  const resetInactivityTimer = () => {
    warningShownRef.current = false;
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Show warning 1 minute before timeout
    warningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        const message = `Your session will expire in 1 minute due to inactivity.`;
        console.warn(message);
        // Optionally show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Expiring', { body: message });
        }
      }
    }, (timeoutMinutes - 1) * 60 * 1000);

    // Auto logout after timeout
    inactivityTimerRef.current = setTimeout(() => {
      console.warn('Session expired due to inactivity');
      onSessionExpire('inactivity');
    }, timeoutMinutes * 60 * 1000);
  };

  const handleActivity = () => {
    resetInactivityTimer();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Browser is hidden/minimized - start logout timer
      console.warn('Browser hidden - inactive session mode');
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      
      // Logout after 5 minutes of being hidden
      inactivityTimerRef.current = setTimeout(() => {
        console.warn('Session expired - browser window hidden');
        onSessionExpire('hidden');
      }, 5 * 60 * 1000);
    } else {
      // Browser is now visible/active again
      console.log('Browser visible again - resetting session timer');
      resetInactivityTimer();
    }
  };

  useEffect(() => {
    // Only setup if authenticated
    if (!isAuthenticated) {
      // Cleanup if user logs out
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      return;
    }

    // Initial setup
    resetInactivityTimer();

    // Activity event listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Window focus/blur listeners
    const handleFocus = () => {
      console.log('Window focused');
      if (!document.hidden) resetInactivityTimer();
    };

    const handleBlur = () => {
      console.log('Window blurred');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [timeoutMinutes, onSessionExpire, isAuthenticated]);
};

export default useSessionTimeout;
