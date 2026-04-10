import { defineConfig } from 'vite';

// Production : site projet GitHub Pages — https://<user>.github.io/cotation-cim10/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cotation-cim10/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
