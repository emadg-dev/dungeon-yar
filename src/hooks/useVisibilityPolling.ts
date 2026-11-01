import { useEffect, useRef } from 'react';

export interface UseVisibilityPollingOptions {
  onPoll: () => Promise<void> | void;
  intervalMs?: number;
  enabled?: boolean;
}

export function useVisibilityPolling({
  onPoll,
  intervalMs = 15000,
  enabled = true,
}: UseVisibilityPollingOptions) {
  const savedCallback = useRef(onPoll);

  useEffect(() => {
    savedCallback.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) return;

    let timer: NodeJS.Timeout | null = null;

    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Pause while page is hidden to save mobile battery
      }
      try {
        await savedCallback.current();
      } catch {
        // Suppress polling error in background
      }
    };

    timer = setInterval(tick, intervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        tick(); // Poll immediately when returning to tab
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
