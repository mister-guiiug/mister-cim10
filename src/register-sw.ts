import { registerSW } from 'virtual:pwa-register';

const UPDATE_BANNER_ID = 'sw-update-banner';

function showUpdateBanner(updateServiceWorker) {
  if (document.getElementById(UPDATE_BANNER_ID)) return;
  const bar = document.createElement('div');
  bar.id = UPDATE_BANNER_ID;
  bar.className = 'sw-update-banner';
  bar.setAttribute('role', 'status');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(165deg,var(--accent),var(--accent-dim));color:var(--btn-primary-fg);padding:0.75rem 1rem;display:flex;align-items:center;justify-content:center;gap:1rem;font-family:system-ui,sans-serif;font-size:0.9rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  bar.innerHTML = `
    <p class="sw-update-banner__text" style="margin:0;">🎨 Nouveau logo ! Une mise à jour est disponible.</p>
    <button type="button" class="sw-update-banner__btn primary" style="background:var(--btn-primary-fg);color:var(--accent);border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">Mettre à jour</button>
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
    }
  });
}
