import { defineConfig } from 'vite';

const GTM_ID = 'GTM-W4SRNX5C';
const GA_ID = 'G-64VBY2ZJBX';
const GSC_TOKEN = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

/** Injecte Google Tag Manager et Google Analytics uniquement dans le build de production (GitHub Pages). */
function analyticsPlugin() {
  return {
    name: 'inject-analytics',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const gtmHeadSnippet = `<!-- Google Tag Manager -->\n    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>\n    <!-- End Google Tag Manager -->`;
        const ga4Snippet = `<!-- Google tag (gtag.js) -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;
        const bodySnippet = `<!-- Google Tag Manager (noscript) -->\n    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n    <!-- End Google Tag Manager (noscript) -->`;
        return html
          .replace('</head>', `    ${gtmHeadSnippet}\n    ${ga4Snippet}\n    <meta name="google-site-verification" content="${GSC_TOKEN}" />\n  </head>`)
          .replace('<body>', `<body>\n    ${bodySnippet}`);
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
  },
  plugins: command === 'build' ? [analyticsPlugin()] : [],
}));
