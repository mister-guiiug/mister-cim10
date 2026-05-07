import { LS_KEYS } from './constants';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function getStoredThemePreference(): ThemePreference {
  const s = localStorage.getItem(LS_KEYS.THEME);
  if (s === 'light' || s === 'dark' || s === 'system') return s;
  return 'system';
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getStoredThemePreference();
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return pref;
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg')
      .trim();
    if (bg) meta.setAttribute('content', bg);
  }
}

export function applyResolvedTheme(): void {
  applyTheme(getResolvedTheme());
}

export function persistTheme(theme: ThemePreference): void {
  localStorage.setItem(LS_KEYS.THEME, theme);
  applyTheme(getResolvedTheme());
}

export function cycleThemePreference(): ThemePreference {
  const cur = getStoredThemePreference();
  const next: ThemePreference =
    cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
  persistTheme(next);
  return next;
}
