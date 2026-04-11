# Mister CIM-10

[![Deploy](https://github.com/mister-guiiug/mister-CIM10/actions/workflows/pages.yml/badge.svg)](https://github.com/mister-guiiug/mister-CIM10/actions/workflows/pages.yml)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

PWA d'aide à la cotation **CIM-10** : saisie ou dictée d'un compte-rendu, suggestions de codes, validation / modification / rejet, export **TXT** et **CSV**. Tout le traitement se fait **dans le navigateur**.

## Fonctionnalités

- **Analyse de texte** — suggestions de codes CIM-10 à partir d'un compte-rendu saisi ou dicté, issues du dictionnaire intégré et/ou de l’API OMS (ICD-11).
- **Validation en un clic** — valider, modifier ou rejeter chaque proposition ; les codes OMS sont affichés en premier.
- **Indicateur de pertinence** — badge coloré (Élevée / Moyenne / Faible) à la place d'un pourcentage brut.
- **Validation du format de code** — vérification du format CIM-10 (`[A-Z]\d{2}(\.\d{1,4})?`) lors de la modification manuelle, avec message d’avertissement inline.
- **Terme parent** — pour un sous-code (ex. `E11.65`), le libellé de la rubrique parente (`E11`) est affiché en contexte.
- **Recherche manuelle** — ajouter un diagnostic directement par code ou libellé ; interroge l’API OMS si configurée (avec fallback local).
- **Réordonnancement** — boutons ↑ / ↓ pour changer l’ordre des diagnostics retenus avant l’export.
- **Sauvegarde automatique** — les diagnostics validés sont conservés dans le navigateur et retrouvés après rechargement.
- **Historique des textes** — les 5 derniers comptes-rendus analysés sont mémorisés, rappelables ou supprimables individuellement.
- **Nouvelle session** — réinitialisation complète (compte-rendu + diagnostics) en un clic avec confirmation.
- **Raccourci clavier** — `Ctrl+Entrée` (ou `Cmd+Entrée`) pour lancer l’analyse depuis le textarea.
- **Impression / PDF** — bouton « Imprimer / PDF » avec feuille de style dédiée (mise en page propre, sans l’interface).
- **Export** — fichier texte (`.txt`) et tableur (`.csv`), partage par e-mail ou API Partager.
- **PWA** — installable, fonctionne hors ligne, thème clair / sombre.

Le [contexte produit et le périmètre fonctionnel](docs/context.md) sont décrits dans `docs/context.md`.

**[Accéder à l'application](https://mister-guiiug.github.io/mister-CIM10/)**

## Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus récent (le déploiement CI utilise la 22).

## Commandes

```bash
npm install
npm run dev      # développement — http://localhost:5173
npm run build    # production dans dist/
npm run preview  # prévisualisation du build local
```

## Lancer en local et déboguer (VS Code / Cursor)

1. Ouvrir le dossier du dépôt dans l’éditeur.
2. **Exécuter** : menu *Run* → *Start Debugging* (**F5**), ou panneau *Run and Debug* → choisir une configuration :
   - **Déboguer : Chrome + Vite** ou **Déboguer : Edge + Vite** — démarre `npm run dev` puis ouvre le navigateur avec le débogueur (points d’arrêt dans `src/*.js`).
   - **Déboguer : Chrome (serveur déjà lancé)** — si vous avez déjà lancé `npm run dev` dans un terminal.
3. Prérequis : extension **Debugger for JavaScript** (souvent incluse) ; sous Windows, **Edge** est disponible via le type `msedge`.

Les tâches sont définies dans `.vscode/tasks.json` et les profils de lancement dans `.vscode/launch.json`.

## API OMS (ICD-11)

L’activation des requêtes vers l’[ICD API](https://icd.who.int/icdapi) nécessite en pratique un **proxy** (CORS). Un script **Cloudflare Worker** est fourni dans [`workers/`](workers/README.md) : déployez-le, configurez `ALLOWED_ORIGINS`, puis indiquez son URL dans l’application.

## Publication sur GitHub Pages

1. Dépôt GitHub nommé **`mister-cim10`** (ou adapter `base` dans `vite.config.js` pour qu’il corresponde à `/<nom-du-dépôt>/`).
2. Dans **Settings → Pages** : source **GitHub Actions** (pas une branche `gh-pages` manuelle pour ce workflow).
3. Pousser sur la branche **`main`** : le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) exécute `npm ci`, `npm run build` et publie le contenu de **`dist/`**.

URL typique : `https://<votre-compte>.github.io/mister-cim10/`.

## Structure du dépôt

| Élément | Rôle |
|---------|------|
| `src/workspace.js` | Interface principale, analyse, validation, export |
| `src/analyzer.js` | Suggestions locales à partir du texte |
| `src/who-icd-api.js` | Intégration API OMS (ICD-11) |
| `src/icd10-data.js` | Échantillon de codes / synonymes FR |
| `src/speech.js` | Web Speech API |
| `src/export-report.js` | Export TXT, CSV, e-mail, partage |
| `public/` | Manifest PWA, favicon, service worker |
| `workers/` | Proxy CORS Cloudflare Worker (optionnel) |
| `docs/context.md` | Documentation produit |

## Licence et responsabilité

[MIT](LICENSE) — Copyright (c) 2026 Guillaume GUERIN.

Usage sous votre responsabilité ; l’application ne remplace pas les référentiels officiels ni le jugement professionnel.
