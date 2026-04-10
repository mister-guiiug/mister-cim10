/**
 * Après `vite build`, génère `dist/sw.js` avec liste de precache dérivée de `dist/index.html`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distHtml = path.join(root, 'dist', 'index.html');
const outSw = path.join(root, 'dist', 'sw.js');

/** @param {string} base préfixe type `/cotation-cim10` ou `` */
/** @param {string} sub chemin relatif, ex. `index.html` */
function assetPath(base, sub) {
  const clean = sub.replace(/^\//, '');
  if (!base) return `/${clean}`;
  return `${base.replace(/\/$/, '')}/${clean}`.replace(/\/+/g, '/');
}

function extractPrecachePaths(html) {
  const urls = new Set();
  const reHref = /href="(\/[^"]+\.(?:css|webmanifest|png|svg))"/g;
  const reSrc = /src="(\/[^"]+\.js)"/g;
  let m;
  while ((m = reHref.exec(html))) urls.add(m[1]);
  while ((m = reSrc.exec(html))) urls.add(m[1]);

  const sample = [...urls].find((u) => u.includes('/assets/'));
  const base = sample ? sample.split('/assets/')[0] : '';

  urls.add(base ? `${base}/` : '/');
  urls.add(assetPath(base, 'index.html'));
  urls.add(assetPath(base, 'icon-192.png'));
  urls.add(assetPath(base, 'icon-512.png'));

  return [...urls].sort();
}

const html = fs.readFileSync(distHtml, 'utf8');
const precache = extractPrecachePaths(html);

const swSource = `/* Généré par scripts/postbuild-sw.mjs — ne pas éditer à la main */
const CACHE = 'cotation-cim10-v3';
const PRECACHE_URLS = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache
        .addAll(
          PRECACHE_URLS.map((pathname) => {
            try {
              return new URL(pathname, self.location.origin).href;
            } catch {
              return pathname;
            }
          })
        )
        .catch((err) => console.warn('[sw] precache', err))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

fs.writeFileSync(outSw, swSource, 'utf8');
console.log('[postbuild-sw] wrote', outSw, 'precache count:', precache.length);
