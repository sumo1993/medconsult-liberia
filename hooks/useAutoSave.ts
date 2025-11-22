import { useEffect, useRef, useState } from 'react';

interface AutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, delay = 30000, enabled = true }: AutoSaveOptions) {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousDataRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === previousDataRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);
        await onSave(data);
        setLastSaved(new Date());
        previousDataRef.current = currentData;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auto-save failed');
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  const saveNow = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      setLastSaved(new Date());
      previousDataRef.current = JSON.stringify(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
  };
}
