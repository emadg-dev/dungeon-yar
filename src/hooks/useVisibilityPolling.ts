import { useEffect, useRef } from 'react';

export interface UseVisibilityPollingOptions {
  onPoll: (signal?: AbortSignal) => Promise<void> | void;
  intervalMs?: number;
  enabled?: boolean;
}

export function useVisibilityPolling({
  onPoll,
  intervalMs = 15000,
  enabled = true,
}: UseVisibilityPollingOptions) {
  const savedCallback = useRef(onPoll);
  const abortControllerRef = useRef<AbortController | null>(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    savedCallback.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) return;

    let timer: NodeJS.Timeout | null = null;
    let isDisposed = false;

    const scheduleNext = (delay: number) => {
      if (timer) clearTimeout(timer);
      if (isDisposed) return;
      timer = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Pause while page is hidden to save mobile battery
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      try {
        await savedCallback.current(ac.signal);
        errorCountRef.current = 0;
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          errorCountRef.current = Math.min(errorCountRef.current + 1, 6);
        }
      } finally {
        if (abortControllerRef.current === ac) {
          abortControllerRef.current = null;
        }
        if (!isDisposed && (typeof document === 'undefined' || !document.hidden)) {
          // Jitter backoff if errors occur
          const jitter = Math.random() * 800;
          const nextInterval = errorCountRef.current > 0
            ? Math.min(60000, intervalMs * Math.pow(1.5, errorCountRef.current) + jitter)
            : intervalMs;
          scheduleNext(nextInterval);
        }
      }
    };

    // Initial tick
    scheduleNext(intervalMs);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        if (timer) clearTimeout(timer);
      } else {
        errorCountRef.current = 0;
        tick(); // Poll immediately when returning to tab
      }
    };

    const handleOnline = () => {
      errorCountRef.current = 0;
      tick();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isDisposed = true;
      if (timer) clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [intervalMs, enabled]);
}
