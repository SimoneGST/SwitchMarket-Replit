import { useState, useCallback } from 'react';
import { AUTOFILL_CONFIDENCE_THRESHOLD as DEFAULT_THRESHOLD } from '../../../shared/assistant-config';

type Suggestion = any;

export function useClementeAssistant() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });
      if (!resp.ok) throw new Error('assistant request failed');
      const data = await resp.json();
  const s = data.suggestion || null;
  // If server included a threshold, prefer it; otherwise use shared default
  if (s && typeof s.autofillThreshold === 'number') s.autofillThreshold = Math.max(0, Math.min(1, s.autofillThreshold));
  setSuggestion(s);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err?.message || 'unknown');
      setLoading(false);
      throw err;
    }
  }, []);

  const clear = useCallback(() => { setSuggestion(null); setError(null); }, []);

  return { loading, suggestion, error, sendMessage, clear };
}
