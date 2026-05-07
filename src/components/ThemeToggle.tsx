import { useTheme } from '../hooks/useTheme';

const SUN_PATH = (
  <svg
    className="theme-switch-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M17.66 6.34l1.41-1.41M4.93 19.07l1.41-1.41" />
  </svg>
);

const MOON_PATH = (
  <svg
    className="theme-switch-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export function ThemeToggle() {
  const { preference, resolved, cycle } = useTheme();

  let label: string;
  if (preference === 'system') {
    label =
      resolved === 'light'
        ? 'Thème automatique (affichage clair, suit l’appareil). Clic pour thème clair fixe.'
        : 'Thème automatique (affichage sombre, suit l’appareil). Clic pour thème clair fixe.';
  } else if (preference === 'light') {
    label = 'Thème clair fixe. Clic pour thème sombre fixe.';
  } else {
    label = 'Thème sombre fixe. Clic pour thème automatique.';
  }

  const showSun = resolved === 'dark';

  return (
    <button
      type="button"
      className={`theme-switch theme-switch--${resolved}`}
      aria-pressed={resolved === 'dark'}
      aria-label={label}
      title={label}
      onClick={cycle}
    >
      <span className="theme-switch-glow" aria-hidden="true" />
      <span className="theme-switch-face">
        <span
          className={`theme-switch-layer theme-switch-layer--sun ${showSun ? 'is-visible' : ''}`}
        >
          {SUN_PATH}
        </span>
        <span
          className={`theme-switch-layer theme-switch-layer--moon ${!showSun ? 'is-visible' : ''}`}
        >
          {MOON_PATH}
        </span>
      </span>
    </button>
  );
}
