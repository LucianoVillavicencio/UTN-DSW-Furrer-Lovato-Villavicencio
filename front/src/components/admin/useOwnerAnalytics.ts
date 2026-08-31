import { useState } from 'react';
import { getAnalyticsOverview } from '../../services/analytics.service';
import type { AnalyticsOverview } from '../../types/analytics';

// Owns the owner password and the financial overview it unlocks. The
// password lives here and nowhere else: not localStorage, not
// sessionStorage, not a module-level variable, not context. Leaving the tab
// discards it, which is the whole retention policy — there is no cached
// "unlocked" boolean independent of the password value itself.
export const useOwnerAnalytics = () => {
  const [password, setPassword] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'day' | 'month'>('month');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = async (candidate: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsOverview(candidate, { granularity });
      setOverview(data);
      setPassword(candidate);
      return true;
    } catch (err) {
      // The backend's message says whether it was the password or a missing
      // configuration, which is more useful than a generic string.
      setError(err instanceof Error ? err.message : 'No se pudo desbloquear.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async (next: 'day' | 'month') => {
    if (password === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsOverview(password, { granularity: next });
      setOverview(data);
      setGranularity(next);
    } catch (err) {
      // The panel keeps showing the previous data with the error above it
      // rather than blanking: a transient failure must not read as "the gym
      // earned nothing".
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    } finally {
      setIsLoading(false);
    }
  };

  const lock = () => {
    setPassword(null);
    setOverview(null);
    setError(null);
  };

  return {
    isUnlocked: password !== null,
    overview,
    isLoading,
    error,
    granularity,
    unlock,
    reload,
    lock,
  };
};
