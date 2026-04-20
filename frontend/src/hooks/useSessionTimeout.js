import { useEffect, useRef } from 'react';

const useSessionTimeout = (onSessionExpire, timeoutMinutes = 10, isAuthenticated = true) => {
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningShownRef = useRef(false);
  const onSessionExpireRef = useRef(onSessionExpire);

  useEffect(() => {
    onSessionExpireRef.current = onSessionExpire;
  }, [onSessionExpire]);

  useEffect(() => {
    const clearTimers = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };

    const expireSession = (reason) => {
      console.warn(`Session expired due to ${reason}`);
      onSessionExpireRef.current(reason);
    };

    const resetInactivityTimer = () => {
      warningShownRef.current = false;
      clearTimers();

      if (timeoutMinutes > 1) {
        warningTimerRef.current = setTimeout(() => {
          if (!warningShownRef.current) {
            warningShownRef.current = true;
            const message = 'Your session will expire in 1 minute due to inactivity.';
            console.warn(message);

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Session Expiring', { body: message });
            }
          }
        }, (timeoutMinutes - 1) * 60 * 1000);
      }

      inactivityTimerRef.current = setTimeout(() => {
        expireSession('inactivity');
      }, timeoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      if (!document.hidden) {
        resetInactivityTimer();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimers();
        inactivityTimerRef.current = setTimeout(() => {
          expireSession('inactivity');
        }, timeoutMinutes * 60 * 1000);
        return;
      }

      resetInactivityTimer();
    };

    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    resetInactivityTimer();

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFocus = () => {
      if (!document.hidden) {
        resetInactivityTimer();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearTimers();
    };
  }, [timeoutMinutes, isAuthenticated]);
};

export default useSessionTimeout;
