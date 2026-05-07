import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  cycleThemePreference,
  getResolvedTheme,
  getStoredThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(
    getStoredThemePreference
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(getResolvedTheme);

  // Sync avec le système quand la préférence est 'system'.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (getStoredThemePreference() !== 'system') return;
      const next = getResolvedTheme();
      applyTheme(next);
      setResolved(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const cycle = useCallback(() => {
    const next = cycleThemePreference();
    setPreference(next);
    setResolved(getResolvedTheme());
  }, []);

  return { preference, resolved, cycle };
}
