# Mister CIM-10

[![Deploy](https://github.com/mister-guiiug/mister-CIM10/actions/workflows/pages.yml/badge.svg)](https://github.com/mister-guiiug/mister-CIM10/actions/workflows/pages.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> **PWA d'aide à la cotation CIM-10** — Saisissez ou dictez un compte-rendu médical, obtenez des suggestions de codes, validez-les et exportez-les en TXT/CSV. **Tout le traitement se fait dans le navigateur**, sans envoi de données (sauf option API OMS).

**[▶ Accéder à l'application](https://mister-guiiug.github.io/mister-CIM10/)**

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Débogage (VS Code / Cursor)](#débogage-vs-code--cursor)
- [Tests](#tests)
- [Structure du dépôt](#structure-du-dépôt)
- [API OMS (ICD-11)](#api-oms-icd-11)
- [Déploiement sur GitHub Pages](#déploiement-sur-github-pages)
- [Confidentialité](#confidentialité)
- [Licence](#licence)

---

## Fonctionnalités

### Analyse et suggestions

| Fonctionnalité | Description |
|---|---|
| **Analyse de texte** | Suggestions de codes CIM-10 issues du dictionnaire intégré et/ou de l'API OMS (ICD-11) |
| **Indicateur de pertinence** | Badge coloré Élevée / Moyenne / Faible |
| **Terme parent** | Pour un sous-code (ex. `E11.65`), le libellé de la rubrique parente (`E11`) est affiché |
| **Recherche manuelle** | Ajout d'un diagnostic par code ou libellé, avec fallback local si l'API OMS est absente |

### Validation et édition

| Fonctionnalité | Description |
|---|---|
| **Validation en un clic** | Valider, modifier ou rejeter chaque proposition |
| **Validation du format** | Vérification du format CIM-10 (`[A-Z]\d{2}(\.\d{1,4})?`) avec message inline |
| **Réordonnancement** | Boutons ↑ / ↓ pour trier les diagnostics retenus avant l'export |

### Productivité

| Fonctionnalité | Description |
|---|---|
| **Saisie ou dictée** | Reconnaissance vocale via Web Speech API |
| **Raccourci clavier** | `Ctrl+Entrée` / `Cmd+Entrée` pour lancer l'analyse |
| **Sauvegarde automatique** | Diagnostics conservés dans le navigateur (localStorage) |
| **Historique** | 5 derniers comptes-rendus rappelables ou supprimables |
| **Nouvelle session** | Réinitialisation complète en un clic avec confirmation |

### Export

| Fonctionnalité | Description |
|---|---|
| **Export TXT / CSV** | Fichiers téléchargeables directement |
| **Impression / PDF** | Feuille de style dédiée, sans l'interface |
| **Partage** | E-mail ou API Web Share |

### Application

- **PWA** installable, fonctionne hors ligne
- Thème **clair / sombre** automatique

Le [contexte produit et le périmètre complet](docs/context.md) sont détaillés dans `docs/context.md`.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Build | [Vite 6](https://vitejs.dev/) |
| Tests | [Vitest 3](https://vitest.dev/) |
| Runtime | Navigateur — HTML / CSS / JS vanilla (sans framework) |
| PWA | Service Worker généré par `scripts/postbuild-sw.mjs` |
| Proxy CORS | [Cloudflare Workers](workers/README.md) (optionnel) |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Démarrage rapide

**Pré-requis** : [Node.js](https://nodejs.org/) ≥ 20 (la CI utilise la 22).

```bash
# Cloner puis installer
git clone https://github.com/mister-guiiug/mister-CIM10.git
cd mister-CIM10
npm install

# Développement  →  http://localhost:5173
npm run dev

# Build de production  →  dist/
npm run build

# Prévisualiser le build local
npm run preview
```

---

## Débogage (VS Code / Cursor)

1. Ouvrir le dossier dans l'éditeur.
2. **F5** ou *Run → Start Debugging*, puis choisir une configuration :
   - **Déboguer : Chrome + Vite** / **Déboguer : Edge + Vite** — démarre `npm run dev` et ouvre le navigateur avec le débogueur attaché (points d'arrêt dans `src/*.js`).
   - **Déboguer : Chrome (serveur déjà lancé)** — si `npm run dev` tourne déjà dans un terminal.
3. Sous Windows, Edge est disponible via le type `msedge` (inclus dans VS Code).

> Les tâches sont dans `.vscode/tasks.json` et les profils de lancement dans `.vscode/launch.json`.

---

## Tests

```bash
npm test             # exécution unique
npm run test:watch   # mode watch (développement)
```

Les tests unitaires (Vitest + jsdom) couvrent `analyzer.js`, `router.js`, `export-report.js` et `settings-share.js`.

---

## Structure du dépôt

```
.
├── src/
│   ├── analyzer.js        # Suggestions locales (correspondance texte → code)
│   ├── who-icd-api.js     # Intégration API OMS ICD-11 (OAuth2)
│   ├── icd10-data.js      # Échantillon de codes / synonymes FR
│   ├── workspace.js       # Interface principale — analyse, validation, export
│   ├── export-report.js   # Export TXT, CSV, e-mail, Web Share
│   ├── speech.js          # Web Speech API
│   ├── router.js          # Routeur SPA
│   └── …                  # Composants UI, thème, PWA
├── workers/               # Proxy CORS Cloudflare Worker (optionnel)
├── public/                # Manifest PWA, icônes, service worker
├── scripts/               # Génération d'icônes, post-build SW
├── docs/context.md        # Contexte produit détaillé
└── .github/workflows/     # CI/CD GitHub Actions
```

---

## API OMS (ICD-11)

L'accès direct à l'[ICD API](https://icd.who.int/icdapi) est bloqué par CORS depuis le navigateur. Un proxy est donc nécessaire.

**Mise en place du proxy Cloudflare Worker :**

1. Copier `workers/wrangler.toml.example` → `workers/wrangler.toml`.
2. Déployer avec `wrangler deploy` (compte Cloudflare gratuit suffisant).
3. Configurer `ALLOWED_ORIGINS` dans le Worker.
4. Renseigner l'URL du Worker dans les paramètres de l'application.

Voir [`workers/README.md`](workers/README.md) pour le détail complet.

---

## Déploiement sur GitHub Pages

1. Nommer le dépôt **`mister-cim10`** (ou adapter `base` dans `vite.config.js`).
2. Dans **Settings → Pages** : source → **GitHub Actions** (pas de branche `gh-pages` manuelle).
3. Pousser sur **`main`** : le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) exécute `npm ci && npm run build` et publie `dist/`.

URL résultante : `https://<votre-compte>.github.io/mister-cim10/`

---

## Confidentialité

- **Sans option OMS** : traitement 100 % local, aucun envoi réseau.
- **Avec option OMS** : des segments du compte-rendu transitent vers votre proxy puis vers les serveurs WHO (`id.who.int`, `icdaccessmanagement.who.int`).
- Aucune persistance serveur dans cette version.

> L'application est une **aide à la décision**, pas un substitut à l'expertise clinique ni au guide méthodologique officiel (ATIH / CIM-10). Le jeu de codes embarqué est un **échantillon** à remplacer pour un usage réel en production.

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.

Usage sous votre entière responsabilité.
