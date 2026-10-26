import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      setWakeLockSentinel(sentinel);
      setIsActive(true);

      sentinel.addEventListener('release', () => {
        setIsActive(false);
        setWakeLockSentinel(null);
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsActive(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
      } catch {}
      setWakeLockSentinel(null);
      setIsActive(false);
    }
  }, [wakeLockSentinel]);

  const toggleWakeLock = useCallback(async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }, [isActive, requestWakeLock, releaseWakeLock]);

  // Re-request on visibilitychange if was active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockSentinel !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLockSentinel, requestWakeLock]);

  return {
    isSupported,
    isActive,
    toggleWakeLock,
  };
}
