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
- **Local-first / confidentialité** : aucune donnée clinique ne quitte le navigateur, sauf par deux voies — celles de la section « Confidentialité et données » du README :
  - **l'OMS (CIM-11)** : en ligne, et quand le build fournit une passerelle, des fragments du compte-rendu partent vers la passerelle du site, puis vers les serveurs de l'OMS (`id.who.int`) ; la passerelle relaie et ne conserve rien. Hors connexion ou sans passerelle, rien ne sort, et l'écran le dit.
  - **la dictée en ligne, après accord explicite** : quand le navigateur ne sait pas reconnaître la parole sur l'appareil, l'enregistrement de la voix part au service de reconnaissance de son éditeur (Google, Microsoft, Apple…). Rien ne démarre sans cet accord, gardé sur ce navigateur seulement, exclu des sauvegardes dans les deux sens et révocable dans Paramètres › Dictée. Sur l'appareil (`processLocally`), rien ne sort et rien n'est demandé.

  Ne pas ajouter d'appel réseau implicite sur le contenu du compte-rendu, ni d'envoi de la voix sans cet accord.

- **Accessibilité** : utilisable au clavier, contrastes suffisants, libellés ARIA ; les tests e2e incluent axe-core.
