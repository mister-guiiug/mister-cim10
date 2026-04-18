const UPDATE_BANNER_ID = 'sw-update-banner';

let reloadOnNextController = false;

function showUpdateBanner(registration) {
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
    const w = registration.waiting;
    if (w) {
      reloadOnNextController = true;
      w.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  });
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const base = import.meta.env.BASE_URL;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadOnNextController) {
      reloadOnNextController = false;
      window.location.reload();
    }
  });

  navigator.serviceWorker
    .register(`${base}sw.js`, { scope: base })
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const nw = registration.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(registration);
          }
        });
      });
    })
    .catch(() => {});
}
