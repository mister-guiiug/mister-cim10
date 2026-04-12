const LS_THEME = 'app_theme';

/** @returns {'light' | 'dark' | 'system'} */
export function getStoredThemePreference() {
  const s = localStorage.getItem(LS_THEME);
  if (s === 'light' || s === 'dark' || s === 'system') return s;
  return 'system';
}

/** @returns {'light' | 'dark'} thème effectivement affiché */
export function getResolvedTheme() {
  if (getStoredThemePreference() === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return getStoredThemePreference() === 'light' ? 'light' : 'dark';
}

/** @param {'light' | 'dark'} theme */
export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', t === 'light' ? '#eef2f7' : '#0c1222');
  }
}

/** Applique la préférence stockée (y compris « système ») sans écrire le stockage. */
export function applyResolvedTheme() {
  applyTheme(getResolvedTheme());
}

/** @param {'light' | 'dark' | 'system'} theme */
export function persistTheme(theme) {
  const t = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
  localStorage.setItem(LS_THEME, t);
  applyTheme(getResolvedTheme());
}

/** Cycle : automatique → clair → sombre → automatique. */
export function cycleThemePreference() {
  const cur = getStoredThemePreference();
  const next = cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
  persistTheme(next);
  return next;
}

let mqListenerBound = false;

/** À appeler une fois au démarrage : réagit au changement d’apparence système si préférence = système. */
export function wireSystemThemeListener() {
  if (mqListenerBound || typeof window === 'undefined' || !window.matchMedia) return;
  mqListenerBound = true;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => {
    if (getStoredThemePreference() !== 'system') return;
    applyTheme(getResolvedTheme());
    const btn = document.getElementById('theme-toggle');
    if (btn) syncThemeToggleButton(btn);
  });
}

const ICON_SUN = `<svg class="theme-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M17.66 6.34l1.41-1.41M4.93 19.07l1.41-1.41"/></svg>`;

const ICON_MOON = `<svg class="theme-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;

/** @param {HTMLElement | null} btn */
export function syncThemeToggleButton(btn) {
  if (!btn) return;
  const eff = getResolvedTheme();
  const pref = getStoredThemePreference();
  btn.setAttribute('aria-pressed', eff === 'dark' ? 'true' : 'false');
  let label;
  if (pref === 'system') {
    label =
      eff === 'light'
        ? 'Thème automatique (affichage clair, suit l’appareil). Clic pour thème clair fixe.'
        : 'Thème automatique (affichage sombre, suit l’appareil). Clic pour thème clair fixe.';
  } else if (pref === 'light') {
    label = 'Thème clair fixe. Clic pour thème sombre fixe.';
  } else {
    label = 'Thème sombre fixe. Clic pour thème automatique.';
  }
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.classList.toggle('theme-switch--dark', eff === 'dark');
  btn.classList.toggle('theme-switch--light', eff === 'light');
  const active = eff === 'dark' ? 'sun' : 'moon';
  btn.innerHTML = `
    <span class="theme-switch-glow" aria-hidden="true"></span>
    <span class="theme-switch-face">
      <span class="theme-switch-layer theme-switch-layer--sun ${active === 'sun' ? 'is-visible' : ''}">${ICON_SUN}</span>
      <span class="theme-switch-layer theme-switch-layer--moon ${active === 'moon' ? 'is-visible' : ''}">${ICON_MOON}</span>
    </span>
  `;
}

export function wireThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  syncThemeToggleButton(btn);
  btn.addEventListener('click', () => {
    cycleThemePreference();
    syncThemeToggleButton(btn);
  });
}
