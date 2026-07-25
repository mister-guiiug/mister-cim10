import { registerSW } from 'virtual:pwa-register';
import { messages } from './i18n/messages';
import { LOCALE_STORAGE_KEY } from './i18n';

const UPDATE_BANNER_ID = 'sw-update-banner';

/**
 * Bannière injectée hors de React (avant le montage), donc hors du contexte
 * i18n : on relit la locale persistée dans localStorage pour choisir la langue.
 */
function bannerStrings() {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return (stored === 'en' ? messages.en : messages.fr).pwa;
}

/** Référence vers l'updater du Service Worker, posée à l'enregistrement. */
let updateSWFn: ((reload?: boolean) => Promise<void>) | undefined;

/**
 * Recharge l'application en récupérant la dernière version : active un SW en
 * attente s'il y en a un, puis recharge. Repli sur un rechargement direct
 * (dev, ou aucune mise à jour en attente).
 */
export function reloadApp(): void {
  void updateSWFn?.(true);
  setTimeout(() => window.location.reload(), 600);
}

function showUpdateBanner(updateServiceWorker: (reload?: boolean) => void) {
  if (document.getElementById(UPDATE_BANNER_ID)) return;
  const bar = document.createElement('div');
  bar.id = UPDATE_BANNER_ID;
  bar.className = 'sw-update-banner';
  bar.setAttribute('role', 'status');
  bar.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(165deg,var(--accent),var(--accent-dim));color:var(--btn-primary-fg);padding:0.75rem 1rem;display:flex;align-items:center;justify-content:center;gap:1rem;font-family:system-ui,sans-serif;font-size:0.9rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  const s = bannerStrings();
  bar.innerHTML = `
    <p class="sw-update-banner__text" style="margin:0;">${s.updateAvailable}</p>
    <button type="button" class="sw-update-banner__btn primary" style="background:var(--btn-primary-fg);color:var(--accent);border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${s.updateAction}</button>
  `;
  document.body.appendChild(bar);
  bar.querySelector('.sw-update-banner__btn')?.addEventListener('click', () => {
    updateServiceWorker(true);
  });
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      showUpdateBanner(() => updateSW(true));
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
    onRegistered(registration) {
      console.log('[PWA] Service worker registered', registration);
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration error', error);
    },
  });
  updateSWFn = updateSW;
}
