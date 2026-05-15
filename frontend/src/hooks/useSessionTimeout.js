import { useEffect, useRef } from 'react';

/**
 * Inactivity auto-logout hook.
 *
 * - Logs out after timeoutMinutes of user inactivity while visible.
 * - Also logs out if the browser/tab is hidden for timeoutMinutes.
 *
 * @param {Function} onSessionExpire - Callback when session expires
 * @param {number} timeoutMinutes - Minutes to wait after inactivity or hidden state
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
const useSessionTimeout = (onSessionExpire, timeoutMinutes = 20, isAuthenticated = true) => {
  const visibilityHiddenTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const warningShownRef = useRef(false);
  const onSessionExpireRef = useRef(onSessionExpire);

  useEffect(() => {
    onSessionExpireRef.current = onSessionExpire;
  }, [onSessionExpire]);

  useEffect(() => {
    const clearInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };

    const clearVisibilityTimers = () => {
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

    const clearTimers = () => {
      clearInactivityTimer();
      clearVisibilityTimers();
    };

    const expireSession = (reason) => {
      clearTimers();
      onSessionExpireRef.current(reason);
    };

    const resetInactivityTimer = () => {
      clearInactivityTimer();
      inactivityTimerRef.current = window.setTimeout(() => {
        expireSession('idle_timeout');
      }, timeoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      if (document.hidden) {
        return;
      }
      resetInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        warningShownRef.current = false;

        if (timeoutMinutes > 1) {
          warningTimerRef.current = window.setTimeout(() => {
            if (!warningShownRef.current && document.hidden) {
              warningShownRef.current = true;
              const message = `Your session will expire in 1 minute because the browser tab is hidden.`;
              console.warn(message);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Session Expiring', { body: message });
              }
            }
          }, (timeoutMinutes - 1) * 60 * 1000);
        }

        visibilityHiddenTimerRef.current = window.setTimeout(() => {
          if (document.hidden) {
            expireSession('browser_hidden');
          }
        }, timeoutMinutes * 60 * 1000);
      } else {
        clearVisibilityTimers();
        resetInactivityTimer();
      }
    };

    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetInactivityTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimers();
    };
  }, [timeoutMinutes, isAuthenticated]);
};

export default useSessionTimeout;
