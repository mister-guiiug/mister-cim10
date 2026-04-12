const UPDATE_BANNER_ID = 'sw-update-banner';

let reloadOnNextController = false;

function showUpdateBanner(registration) {
  if (document.getElementById(UPDATE_BANNER_ID)) return;
  const bar = document.createElement('div');
  bar.id = UPDATE_BANNER_ID;
  bar.className = 'sw-update-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `
    <p class="sw-update-banner__text">Une nouvelle version de l’application est disponible.</p>
    <button type="button" class="sw-update-banner__btn primary">Mettre à jour</button>
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
