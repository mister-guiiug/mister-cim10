import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const GTM_ID = 'GTM-W4SRNX5C';
const GA_ID = 'G-64VBY2ZJBX';
const GSC_TOKEN = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

/** Injecte Google Tag Manager et Google Analytics uniquement dans le build de production. */
function analyticsPlugin() {
  return {
    name: 'inject-analytics',
    transformIndexHtml: {
      order: 'post',
      /** @param {string} _html */
      handler(_html) {
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
            attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` },
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
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mister-cim10/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          const norm = id.replace(/\\/g, '/')

          // Séparer PWA
          if (norm.includes('/vite-plugin-pwa/') || norm.includes('/workbox-')) {
            return 'pwa'
          }

          // PNGJS pour les images
          if (norm.includes('/pngjs/')) {
            return 'image-processing'
          }

          return 'vendor'
        },
      },
    },
  },
  plugins: [
    ...(command === 'build' ? [analyticsPlugin()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
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
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
}));
