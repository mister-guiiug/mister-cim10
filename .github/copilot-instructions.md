# Copilot instructions — Mister CIM-10

## Rôle de l'application

PWA sans backend pour aider les professionnels de santé à coter des diagnostics CIM-10 à partir d'un compte-rendu médical libre. Traitement 100 % local par défaut ; API OMS ICD-11 optionnelle via proxy.

---

## Architecture des modules (`src/`)

| Fichier | Responsabilité |
|---|---|
| `analyzer.ts` | Moteur de suggestions : matching textuel exact + flou (trigrammes Jaccard) sur `icdEntries`. **Aucun effet de bord.** Entrée : texte brut. Sortie : tableau de hits avec `code`, `label`, `score`, `confidence`. |
| `icd10-data.ts` | Référentiel CIM-10 embarqué (échantillon). Tableau `icdEntries[]` : `{ code, label, synonyms[] }`. À remplacer ou enrichir pour un usage production. |
| `workspace.ts` | État de session (diagnostics validés, suggestions en cours, dictée). Gère l'UI de la page principale, orchestre `analyzer`, `storage`, `speech`, `export-report`. |
| `storage.ts` | Couche localStorage isolée. Toutes les clés `LS_*` sont déclarées ici. Aucune logique métier. |
| `app-settings.ts` | Lecture/écriture des paramètres utilisateur (mode d'analyse, crédentiels OMS, proxy, seuil de confiance). |
| `app-constants.ts` | Constantes UI globales (texte du footer). |
| `router.ts` | Routeur hash (`#/`, `#/parametres`, `#/aide`). Pas de framework. |
| `who-icd-api.ts` | Appels à l'API OMS ICD-11 (OAuth2 via proxy). Token mis en cache en mémoire. Jamais appelé sans action explicite de l'utilisateur. |
| `export-report.ts` | Génération des exports TXT, CSV, JSON, mailto, Web Share. Sans effet de bord sur l'état. |
| `speech.ts` | Abstraction `SpeechRecognition` navigateur (`lang: 'fr-FR'`, continu, résultats intérimaires). |
| `dialog-ui.ts` | `showConfirm` / `showAlert` — dialogues accessibles sans dépendance UI externe. |
| `html-utils.ts` | `escapeHtml` et utilitaires de construction HTML en chaîne. |
| `home-html.ts`, `header-html.ts`, `header-chrome.ts`, `help-page-html.ts`, `settings-form-html.ts` | Templates HTML rendus en chaîne de caractères. Pas de Virtual DOM, pas de framework. |
| `theme.ts` | Bascule clair/sombre via attribut `data-theme` sur `<html>`. |
| `nav-drawer.ts` | Tiroir de navigation mobile. |
| `pages.ts` | Orchestration du rendu des pages selon la route courante. |
| `main.ts` | Point d'entrée Vite. Monte l'application. |
| `register-sw.ts` | Enregistrement du service worker PWA. |
| `monitoring/web-vitals.ts` | Collecte des Web Vitals (lecture seule, pas de logique métier). |
| `random-id.ts` | Génère des identifiants uniques (`crypto.randomUUID` ou fallback). |
| `focus-utils.ts` | Gestion du focus clavier (accessibilité). |
| `enhancements-integration.ts` | Point d'intégration des améliorations UI progressives. |
| `ui-helpers.js` | Utilitaires UI bas niveau (animations, classes, etc.). |

---

## Conventions de code

### TypeScript / JavaScript

- **ESM strict** : tous les imports locaux incluent l'extension `.js` (même pour les fichiers `.ts`).
- **Pas de classes** : fonctions exportées nommées, pas d'instances.
- **`type` pour les types purs** (unions, alias), **`interface` pour les formes d'objets** utilisées en paramètre ou retour.
- `tsconfig.json` : `allowJs: true`, `checkJs: false`, `strict: false`. Les fichiers `.js` ne sont pas vérifiés.
- **Pas de framework UI** (React, Vue, Svelte…) : le HTML est construit en chaîne ou manipulé via les API DOM natives.
- **Pas de state manager** : l'état de session est dans `workspace.ts` (variables module), la persistance dans `storage.ts`.
- Les fonctions pures (sans effet de bord) sont préférées pour `analyzer`, `export-report`, `html-utils`.

### Nommage

- Fonctions exportées : `camelCase`.
- Constantes exportées : `SCREAMING_SNAKE_CASE` pour les clés `LS_*` et labels fixes.
- Types/interfaces : `PascalCase`.

### Sécurité et confidentialité

- **Ne jamais** envoyer le texte du compte-rendu à un serveur externe sans action explicite de l'utilisateur.
- Les crédentiels OMS (client ID / secret) sont stockés dans `localStorage`, jamais dans le code source ni dans les logs.
- Tout HTML inséré dans le DOM via `innerHTML` doit passer par `escapeHtml` ou être un template statique sans donnée utilisateur non filtrée.

---

## Tests

- **Framework** : Vitest.
- **Fichiers de test** : `*.test.ts` colocalisés dans `src/`.
- Les tests portent sur les fonctions **pures exportées** (`suggestFromText`, `buildSimpleReportText`, helpers de storage, router, etc.).
- Les fonctions dépendant du DOM ou de `localStorage` sont testées via des mocks Vitest (`vi.spyOn`, `vi.stubGlobal`).
- Ne pas tester les templates HTML bruts (chaînes) ni les appels réseau réels.

---

## Ce que cet outil ne fait PAS (ne pas proposer sans discussion)

- Pas de LLM embarqué (WebLLM, Transformers.js, appel OpenAI…) — décision délibérée : confidentialité + contrainte PWA offline.
- Pas de backend ni de base de données.
- Pas de framework UI (React, Vue…) — coût de bundle non justifié pour une SPA légère.
- Pas de compte utilisateur ni d'authentification.
- Pas d'analytics sur les données médicales — seul GTM/GA est injecté en production pour les métriques de performance (Web Vitals).

---

## Build et déploiement

- **Build** : `npm run dev` (Vite, mode dev) / `npm run build` (sortie `dist/`).
- **Base URL** en production : `/mister-cim10/` (GitHub Pages projet).
- **Tests** : `npm test` (Vitest).
- **E2E** : Playwright (`playwright.config.ts`), specs dans `e2e/`.
- **Déploiement** : GitHub Actions `.github/workflows/pages.yml` → GitHub Pages.
- **Proxy CORS OMS** : Cloudflare Worker, voir `workers/`.

---

## Référentiel CIM-10

`icd10-data.ts` contient un **échantillon** de démonstration. Pour un usage clinique réel, il doit être remplacé par un référentiel complet conforme à l'ATIH. Ne pas ajouter de codes au fichier embarqué sans vérification de la source officielle.
