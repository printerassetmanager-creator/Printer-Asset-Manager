import { useEffect, useRef } from 'react';

/**
 * Auto-logout hook that logs out only if:
 * - Browser is minimized/closed AND hidden for timeoutMinutes (default 20 min)
 * - Does NOT logout during inactivity while browser window is visible
 * 
 * @param {Function} onSessionExpire - Callback when session expires
 * @param {number} timeoutMinutes - Minutes to wait after browser is hidden before logout (default 20)
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
const useSessionTimeout = (onSessionExpire, timeoutMinutes = 20, isAuthenticated = true) => {
  const visibilityHiddenTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningShownRef = useRef(false);
  const onSessionExpireRef = useRef(onSessionExpire);

  useEffect(() => {
    onSessionExpireRef.current = onSessionExpire;
  }, [onSessionExpire]);

  useEffect(() => {
    const clearTimers = () => {
      if (visibilityHiddenTimerRef.current) {
        clearTimeout(visibilityHiddenTimerRef.current);
        visibilityHiddenTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      warningShownRef.current = false;
    };

    const expireSession = (reason) => {
      console.warn(`Session expired: Browser hidden for ${timeoutMinutes} minutes`);
      onSessionExpireRef.current(reason);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Browser is now hidden (minimized or closed tab)
        console.log(`Browser hidden - will logout in ${timeoutMinutes} minutes`);
        warningShownRef.current = false;

        // Start timer: after timeoutMinutes, logout
        if (timeoutMinutes > 1) {
          warningTimerRef.current = setTimeout(() => {
            if (!warningShownRef.current && document.hidden) {
              warningShownRef.current = true;
              const message = `Your session will expire in 1 minute because browser is hidden.`;
              console.warn(message);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Session Expiring', { body: message });
              }
            }
          }, (timeoutMinutes - 1) * 60 * 1000);
        }

        visibilityHiddenTimerRef.current = setTimeout(() => {
          if (document.hidden) {
            expireSession('browser_hidden');
          }
        }, timeoutMinutes * 60 * 1000);
      } else {
        // Browser is now visible - cancel logout timer
        console.log('Browser visible - logout timer canceled');
        clearTimers();
      }
    };

    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimers();
    };
  }, [timeoutMinutes, isAuthenticated]);
};

export default useSessionTimeout;
