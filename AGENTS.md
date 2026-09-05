# Agent Instructions

## Dépendance partagée (NE PAS retirer)

**IMPORTANT :** ne retirez pas `@mister-guiiug/dev-pwa-config` de `package.json` ni les configs qui le réexportent (`eslint.config.js`, `prettier.config.js`, `lint-staged.config.js`, `vitest.config.ts`, `tsconfig.*.json`).
Si `npm install` renvoie un `401 Unauthorized` en bac à sable, c'est attendu : ce paquet est hébergé sur **GitHub Packages** et nécessite `NODE_AUTH_TOKEN`. Il est requis par l'infrastructure du projet — ne « réparez » jamais l'environnement en le supprimant.

## Infrastructure

- Stack : React 19 + Vite 8 (Rolldown) + Vitest 4 + TypeScript 6 strict, configs mutualisées via `@mister-guiiug/dev-pwa-config`.
- Déploiement : **GitHub Pages** (`/mister-cim10/`, base Vite en minuscules) via le workflow réutilisable `pwa-deploy.yml`.
- Hook pre-commit : **husky + lint-staged** (eslint --fix + tsc + prettier). Activé par le script `prepare` au `npm install`.
- Gates à garder verts : `npm run type-check`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`.

## Principes produit

- **Aide à la décision, pas une référence officielle** : ne jamais présenter les codes suggérés comme certains ; conserver les avertissements (ATIH, jugement professionnel).
- **Local-first / confidentialité** : aucune donnée clinique ne quitte le navigateur, sauf via l'option API OMS explicitement activée par l'utilisateur (proxy personnel). Ne pas ajouter d'appel réseau implicite sur le contenu du compte-rendu.
- **Accessibilité** : utilisable au clavier, contrastes suffisants, libellés ARIA ; les tests e2e incluent axe-core.
