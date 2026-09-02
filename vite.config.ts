import { defineConfig, type Plugin, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaSeoPlugin } from '@mister-guiiug/dev-wpa-config/vite-pwa-base';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};
// Date du build (YYYY-MM-DD) — repère « quelle version est déployée », utile
// avec le bouton « Recharger l'application » des Paramètres.
const buildDate = new Date().toISOString().slice(0, 10);

const GTM_ID = 'GTM-W4SRNX5C';
const GA_ID = 'G-64VBY2ZJBX';
const GSC_TOKEN = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

const analyze = process.env.ANALYZE === '1';

/** Injecte Google Tag Manager et Google Analytics uniquement dans le build de production. */
function analyticsPlugin(): Plugin {
  return {
    name: 'inject-analytics',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'meta',
            injectTo: 'head',
            attrs: { name: 'google-site-verification', content: GSC_TOKEN },
          },
          {
            tag: 'script',
            injectTo: 'head',
            children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          },
          {
            tag: 'script',
            injectTo: 'head',
            attrs: {
              async: true,
              src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
            },
          },
          {
            tag: 'script',
            injectTo: 'head',
            children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          },
          {
            tag: 'noscript',
            injectTo: 'body-prepend',
            children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          },
        ];
      },
    },
  };
}

// Production : site projet GitHub Pages — https://<user>.github.io/mister-cim10/
// `VITE_BASE_PATH` (Lighthouse CI avec « / », déploiement famille) prioritaire.
export default defineConfig(({ command }) => {
  const basePath =
    process.env.VITE_BASE_PATH ??
    (command === 'build' ? '/mister-cim10/' : '/');
  return {
    base: basePath,
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_TIME__: JSON.stringify(buildDate),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const norm = id.replace(/\\/g, '/');

            // React et écosystème
            if (
              norm.includes('/react-dom/') ||
              norm.includes('/node_modules/react/') ||
              norm.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            // Router séparé
            if (norm.includes('/react-router/')) {
              return 'router';
            }

            // State manager
            if (norm.includes('/zustand/')) {
              return 'zustand';
            }

            // Tailwind runtime
            if (
              norm.includes('/tailwindcss/') ||
              norm.includes('/@tailwindcss/')
            ) {
              return 'tailwind';
            }

            // PWA
            if (
              norm.includes('/vite-plugin-pwa/') ||
              norm.includes('/workbox-')
            ) {
              return 'pwa';
            }

            // PNGJS pour les images
            if (norm.includes('/pngjs/')) {
              return 'image-processing';
            }

            return 'vendor';
          },
        },
      },
    },
    plugins: [
      ...(command === 'build' ? [analyticsPlugin()] : []),
      react(),
      tailwindcss(),
      // SEO partagé famille : canonical/OG via placeholders index.html +
      // sitemap.xml/robots.txt générés au build. L'analytics reste géré par
      // analyticsPlugin() local (GTM + GA4 + GSC).
      pwaSeoPlugin({
        siteName: 'Mister CIM-10',
        basePath,
        logoPath: '/icon-192.png',
        // Script anti-FOUC engendré par le socle (theme-boot), injecté en tête
        // de <head>. Il interroge `(prefers-color-scheme: dark)` avec repli
        // clair — l'ancienne IIFE maison interrogeait `light` avec repli
        // sombre (même défaut corrigé sur miss-badminton). `legacyKeys` migre
        // la préférence déjà stockée sous `app_theme` vers la clé famille
        // `dwc_theme`, partagée avec ThemeProvider/useTheme.
        themeBoot: { legacyKeys: ['app_theme'] },
        // Deux <meta name="theme-color"> par schéma (attribut media) : la
        // barre du navigateur suit le système dès le premier rendu ; le choix
        // explicite contraire au système est couvert par ThemeProvider.
        themeColor: { light: '#eef2f7', dark: '#0c1222' },
      }),
      VitePWA({
        // `'prompt'`, et non `'autoUpdate'`. Avec `autoUpdate`, le module
        // engendré `virtual:pwa-register` n'appelle JAMAIS `onNeedRefresh` (il
        // n'écoute que `activated`, et recharge la page de lui-même), et
        // `updateServiceWorker(true)` y est un no-op déclaré :
        //
        //   const updateServiceWorker = async () => {
        //     await registerPromise;
        //     if (!auto) sendSkipWaitingMessage?.();
        //   };
        //
        // Le bandeau de mise à jour que l'app portait — traduit fr/en, avec son
        // bouton — était donc structurellement incapable d'apparaître, et le
        // bouton « Recharger l'application » ne faisait que recharger la même
        // version depuis le cache. `'prompt'` retire aussi `skipWaiting` et
        // `clientsClaim` du service worker engendré, ce qui laisse un worker EN
        // ATTENTE : c'est lui que le bandeau active. Les 13 autres apps de la
        // famille qui affichent un bandeau sont toutes en `'prompt'`.
        registerType: 'prompt',
        includeAssets: ['icon-192.png', 'icon-512.png'],
        manifest: {
          id: basePath,
          lang: 'fr',
          name: 'Mister CIM10',
          short_name: 'CIM10',
          description: 'Explorateur interactif de la classification CIM10',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshots/mobile.png',
              sizes: '824x1830',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Écran d’accueil sur mobile',
            },
            {
              src: 'screenshots/wide.png',
              sizes: '2560x1600',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Écran d’accueil sur ordinateur',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: !process.env.CI,
            }) as PluginOption,
          ]
        : []),
    ],
  };
});
