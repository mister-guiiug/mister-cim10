import { defineConfig, type Plugin, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaSeoPlugin } from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { cspPlugin } from '@mister-guiiug/dev-pwa-config/vite-csp';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'node:fs';
import { versionPlugin } from '@mister-guiiug/dev-pwa-config/vite-version';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};
// Date du build (YYYY-MM-DD) — repère « quelle version est déployée », utile
// avec le bouton « Recharger l'application » des Paramètres.
const buildDate = new Date().toISOString().slice(0, 10);

// GTM-W4SRNX5C et G-64VBY2ZJBX ont quitté ce fichier ; écrits ici, ils
// partaient au build sans condition. Puis Google est parti tout entier
// (ADR 0012) : la mesure est une clé de projet PostHog, en variable de dépôt
// `VITE_POSTHOG_KEY`, lue par `ConsentBanner` et chargée seulement après
// l'accord. Sur une app qui reçoit du texte clinique, c'était le motif du
// chantier — pas la qualité de la mesure.
const GSC_TOKEN = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

const analyze = process.env.ANALYZE === '1';

/** Injecte la balise de vérification de propriété Google, au build de production. */
function analyticsPlugin(): Plugin {
  return {
    name: 'inject-analytics',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          /*
           * SEULE LA VÉRIFICATION DE PROPRIÉTÉ RESTE ICI.
           *
           * Ce plugin injectait aussi, au build et SANS AUCUNE CONDITION, le
           * bootstrap de Google Tag Manager, son iframe `noscript`, le script
           * `gtag/js` et un `gtag('config', …)`. Tout cela partait dans le
           * `<head>`, donc AVANT le premier rendu, donc avant que quiconque
           * ait pu accepter quoi que ce soit — et avant même que le mode
           * consentement de Google ait pu déclarer son état par défaut, qui
           * n'a aucun effet rétroactif une fois le tag évalué.
           *
           * La mesure passe désormais par `ConsentBanner` : rien n'est injecté
           * tant que l'utilisateur n'a pas accepté, et les identifiants
           * viennent des variables du dépôt au lieu d'être écrits ici.
           *
           * La balise ci-dessous ne dépose rien chez l'utilisateur : elle
           * prouve à Google que le domaine est à nous. Elle n'a pas à attendre
           * un consentement.
           */
          {
            tag: 'meta',
            injectTo: 'head',
            attrs: {
              name: 'google-site-verification',
              content: GSC_TOKEN,
            },
          },
        ];
      },
    },
  };
}

// Production : site projet GitHub Pages — https://<user>.github.io/mister-cim10/
// `VITE_BASE_PATH` (Lighthouse CI avec « / », déploiement famille) prioritaire.
/**
 * L'ORIGINE de la passerelle OMS, pour la CSP.
 *
 * `VITE_WHO_PROXY_URL` porte une adresse complète (`https://hôte`, parfois avec
 * un chemin) ; `connect-src` veut une SOURCE — schéma et hôte. On ne recopie
 * donc pas la variable : on en extrait l'origine, et une valeur illisible est
 * ignorée plutôt que de fabriquer une directive invalide qui ferait taire toute
 * la politique.
 */
function origineDeLaPasserelle(): string[] {
  const brut = (process.env.VITE_WHO_PROXY_URL ?? '').trim();
  if (brut === '') return [];
  try {
    return [new URL(brut).origin];
  } catch {
    return [];
  }
}

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
          /*
           * LE MORCEAU SENTRY GARDE SON NOM, SANS EMPREINTE — parce qu'il est
           * exclu du précache (`globIgnores` plus bas) et qu'une URL empreintée
           * y meurt à chaque déploiement.
           *
           * Le service worker sert la coquille précachée jusqu'à ce que
           * l'utilisateur accepte la mise à jour ; cette coquille demande
           * l'ANCIENNE empreinte, que le déploiement suivant a supprimée de
           * `assets/`. Mesuré en production sur mister-qowa le 22/09/2026 :
           * HTTP 404, « Échec du chargement pour le module » dans la console.
           * `initSentry` avale l'échec (son `try/catch`), donc l'application ne
           * casse pas — elle rapporte ses erreurs à personne, sans le dire.
           *
           * Rien n'est perdu au cache : GitHub Pages répond
           * `Cache-Control: max-age=600` sur TOUS les fichiers, empreinte ou pas.
           *
           * `pwa-doctor` tient l'invariant depuis le socle 6.8.0
           * (règle `chunk-hors-precache`).
           */
          chunkFileNames: chunk =>
            chunk.name === 'sentry'
              ? 'assets/sentry.js'
              : 'assets/[name]-[hash].js',
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const norm = id.replace(/\\/g, '/');
            // Sentry est chargé par un `import()` que `loader` rend
            // analysable. Sans cette ligne il tomberait dans `vendor`,
            // qui est PRÉCHARGÉ : mesuré sur miss-uwh, 381,9 kB
            // préchargés au lieu de 227,2 — pour un total gzip identique
            // à 0,1 kB près. Le total ne voit pas la différence,
            // `bundleBudget.preloadGzipKb` si.
            if (norm.includes('/@sentry/')) return 'sentry';
            // ET POSTHOG POUR LA MÊME RAISON, EN PLUS GRAVE. Sentry préchargé
            // coûtait du poids ; PostHog préchargé casse une PROMESSE : l'ADR
            // 0012 dit que rien n'est chargé avant l'accord, et le socle ne
            // l'appelle qu'après. Sans cette ligne, la bibliothèque tombe
            // dans `vendor`, qui est PRÉCHARGÉ — elle serait donc
            // téléchargée chez un visiteur qui refuse. C'est `preloadGzipKb`
            // qui le voit, jamais le total.
            if (norm.includes('/posthog-js/')) return 'posthog';

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

            return 'vendor';
          },
        },
      },
    },
    plugins: [
      // AVANT cspPlugin : il pose un script inline dans le <head>, que la
      // CSP doit hacher après coup ; et il écrit version.json au build.
      versionPlugin({ manifest: true, define: false }),
      ...(command === 'build' ? [analyticsPlugin()] : []),
      react(),
      tailwindcss(),
      // SEO partagé famille : canonical/OG via placeholders index.html +
      // sitemap.xml/robots.txt générés au build. La MESURE, elle, n'est plus
      // ici du tout : `ConsentBanner` la monte à l'exécution, après accord.
      // `analyticsPlugin()` ci-dessus ne pose plus que la balise de
      // vérification de propriété Google, qui ne dépose rien chez le visiteur.
      pwaSeoPlugin({
        siteName: 'Mister CIM-10',
        basePath,
        logoPath: '/icon-512.png',
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
      // LA CSP VIENT DU SOCLE, ET PLUS D'UNE BALISE ÉCRITE À LA MAIN.
      //
      // Cette app est celle où ça coûtait le plus cher. Elle reçoit du texte
      // clinique, elle embarque un DSN Sentry — et sa `<meta>` recopiée dans
      // `index.html` n'a jamais autorisé `sentry.io`. Quand le socle a ouvert
      // `connect-src` à l'hôte du DSN pour tout le parc, le 19/09/2026, elle
      // n'a rien reçu : aucune montée de paquet n'atteint une chaîne de
      // caractères. Sa remontée d'erreurs était entièrement morte, et rien ne
      // pouvait le dire — exactement la panne qui avait déjà coupé les deux
      // modes réseau de cette app quand la passerelle OMS manquait ici.
      //
      // Le greffon apporte en prime `script-src` par HASH des scripts inline
      // en production, au lieu de `'unsafe-inline'`.
      cspPlugin({
        dev: command === 'serve',
        // Ouvre les hôtes de PostHog — le nuage EUROPÉEN (ADR 0012).
        analytics: true,
        // `*.who.int` : l'API CIM de l'OMS, telle que la balise l'autorisait
        // déjà.
        //
        // LA PASSERELLE EST DÉSORMAIS COUVERTE — et c'est ce qui rend le mode
        // OMS praticable. La limite notée ici valait tant que son adresse
        // n'existait qu'à l'exécution : une politique figée au build ne peut
        // pas autoriser un hôte qu'elle ne connaît pas, et le navigateur
        // coupait l'appel avant qu'il ne parte. Maintenant que l'adresse vient
        // de `VITE_WHO_PROXY_URL`, le build la connaît.
        //
        // Elle reste NON couverte pour une passerelle saisie à la main dans les
        // Réglages : c'est la même limite, réduite au cas où l'utilisateur
        // apporte son propre relais. Rien ne peut la lever sans ouvrir
        // `connect-src` à tout, ce qui coûterait plus que ça ne rend.
        connectSrc: ["'self'", 'https://*.who.int', ...origineDeLaPasserelle()],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
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
          short_name: 'Mister CIM10',
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
          /*
           * LE MORCEAU SENTRY HORS DU PRÉCACHE, sans quoi le découpage
           * ci-dessus ne servirait à rien : `globPatterns` ramasse TOUT le
           * JS émis, `import()` ou pas. Mesuré le 16/09/2026 sur la
           * production de deux apps du parc, 345 et 463 KiB bruts de SDK
           * téléchargés par chaque visiteur — sans qu’aucun DSN soit posé.
           *
           * Hors précache, il est cherché sur le réseau à la première
           * erreur, et jamais si l’observabilité reste éteinte. Ne pas
           * l’avoir hors ligne est sans conséquence : rapporter une erreur
           * demande le réseau.
           */
          globIgnores: ['**/sentry.js', '**/sentry-*.js'],
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
