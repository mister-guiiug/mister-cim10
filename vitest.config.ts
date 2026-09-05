import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { baseTestOptions } from '@mister-guiiug/dev-pwa-config/vitest-base';

export default defineConfig({
  test: baseTestOptions,
  resolve: {
    alias: {
      // `virtual:pwa-register` n'existe que dans un build servi par
      // vite-plugin-pwa : hors de là, Vite refuse de transformer le module qui
      // l'importe, et le test échoue à la RÉSOLUTION. Le `vi.mock` de
      // `vitest-setup` agit trop tard pour ça — il faut un vrai fichier.
      //
      // Celui du socle est PILOTABLE (`swStub.needRefresh()`), là où les doubles
      // écrits à la main sont muets : ils prouvent qu'un composant se monte,
      // jamais qu'un bandeau peut s'afficher.
      'virtual:pwa-register': fileURLToPath(
        import.meta
          .resolve('@mister-guiiug/dev-pwa-config/testing/pwa-register')
      ),
    },
  },
});
