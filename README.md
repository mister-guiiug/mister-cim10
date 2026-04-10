# Mister CIM-10

PWA d’aide à la cotation **CIM-10** : saisie ou dictée d’un compte-rendu, suggestions de codes, validation / modification / rejet, export **JSON** et **CSV**. Tout le traitement se fait **dans le navigateur**.

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
| `src/main.js` | Interface, dictée, validation, export |
| `src/analyzer.js` | Suggestions à partir du texte |
| `src/icd10-data.js` | Échantillon de codes / synonymes FR |
| `src/speech.js` | Web Speech API |
| `public/` | Manifest PWA, favicon, service worker |
| `docs/context.md` | Documentation produit |

## Licence et responsabilité

[MIT](LICENSE) — Copyright (c) 2026 Guillaume GUERIN.

Usage sous votre responsabilité ; l’application ne remplace pas les référentiels officiels ni le jugement professionnel.
