import { defineConfig } from 'vite';

// Production : site projet GitHub Pages — https://<user>.github.io/mister-cim10/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mister-cim10/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
