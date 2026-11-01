import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseDebouncedSaveOptions<T> {
  value: T;
  onSave: (val: T) => Promise<void> | void;
  delay?: number;
}

export function useDebouncedSave<T>({ value, onSave, delay = 800 }: UseDebouncedSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const save = useCallback(
    async (val: T) => {
      try {
        setIsSaving(true);
        await onSave(val);
        setLastSavedAt(Date.now());
      } finally {
        setIsSaving(false);
      }
    },
    [onSave]
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay, save]);

  return { isSaving, lastSavedAt };
}
