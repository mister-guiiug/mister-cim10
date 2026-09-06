# Mister CIM-10

[![Application en ligne](https://img.shields.io/badge/Application-En%20ligne-brightgreen?style=for-the-badge)](https://mister-guiiug.github.io/mister-CIM10/)
[![License](https://img.shields.io/badge/Licence-MIT-blue?style=for-the-badge)](https://github.com/mister-guiiug/mister-cim10/blob/main/LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Soutenir-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> **Aide à la cotation CIM-10 dans votre navigateur.**
> Saisissez un compte-rendu médical, obtenez des suggestions de codes — ou cherchez un code par son libellé —, validez-les et exportez-les. Sans installation, sans compte, sans envoi de données.

**[▶ Accéder à l'application](https://mister-guiiug.github.io/mister-CIM10/)**

---

## Pour qui ?

Mister CIM-10 s'adresse aux **professionnels de santé** (médecins, DIM, techniciens d'information médicale) qui souhaitent disposer d'une aide rapide à la cotation CIM-10 directement dans leur navigateur, sans dépendance à un logiciel métier.

> ⚠️ **Cet outil est une aide à la décision, pas une référence clinique officielle.**
> Il ne remplace pas le guide méthodologique de l'ATIH ni le jugement professionnel.
> Le jeu de codes embarqué est un échantillon — vérifiez toujours avec les référentiels officiels.

---

## Comment l'utiliser

1. **Ouvrez l'application** — aucune installation requise, fonctionne dans Chrome, Edge, Firefox ou Safari.
2. **Saisissez** votre compte-rendu dans la zone de texte (sur mobile, le micro du clavier de votre téléphone fonctionne comme dans n'importe quel champ de saisie).
3. **Lancez l'analyse** avec le bouton **Analyser** — les codes CIM-10 suggérés apparaissent aussitôt.
4. **Validez ou rejetez** chaque suggestion en un clic ; ajoutez une note libre sur un code retenu.
5. **Cherchez un code** par son libellé pour coter un terme qui n'est pas dans le compte-rendu, et ajoutez-le aux diagnostics retenus.
6. **Exportez** la liste finale en fichier texte (`.txt`), tableur (`.csv`) ou JSON, ou imprimez-la directement.

Vous pouvez **enregistrer le dossier en cours sous un nom** (jusqu'à cinq) et le rouvrir plus tard : le compte-rendu et les diagnostics retenus reviennent tels quels.

L'application peut être **installée sur votre appareil** (bouton d'installation du navigateur) et fonctionne **hors connexion** une fois installée.

---

## Fonctionnalités

### Analyse

| Fonctionnalité               | Ce que ça fait                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Analyse du texte libre**   | Propose des codes CIM-10 à partir de votre compte-rendu, via le dictionnaire intégré ou l'API OMS (CIM-11) si configurée   |
| **Indicateur de pertinence** | Chaque suggestion est qualifiée : Élevée / Moyenne / Faible, avec son pourcentage                                          |
| **Seuil de confiance**       | Réglable dans les paramètres : les suggestions en dessous du seuil ne s'affichent pas                                      |
| **Filtre des suggestions**   | Restreignez la liste affichée par code, libellé ou terme repéré                                                            |
| **Terme repéré**             | Un clic sur le terme qui a déclenché la suggestion le sélectionne dans le compte-rendu                                     |
| **Comparer** (terme parent)  | Pour un sous-code (ex. `E11.65`), affiche la rubrique parente (`E11`) et les codes apparentés, chacun ajoutable en un clic |

### Recherche et saisie d'un code

| Fonctionnalité           | Ce que ça fait                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chercher un code**     | Par libellé, synonyme ou code (`diabète`, `dt2`, `E11`) — y compris sans accent ou mal orthographié. Pour coter un terme absent du compte-rendu |
| **Saisie manuelle**      | Si vous connaissez déjà le code, saisissez-le avec son libellé                                                                                  |
| **Détection de doublon** | Un code déjà retenu n'est pas ajouté deux fois, et l'application le signale                                                                     |
| **Note libre**           | Annotez un diagnostic retenu ; la note suit dans les exports texte, CSV et JSON                                                                 |

### Confort d'utilisation

| Fonctionnalité                | Ce que ça fait                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Sauvegarde automatique**    | Compte-rendu, diagnostics retenus et réglages sont mémorisés dans le navigateur — ils sont là si vous rechargez la page       |
| **Dossiers enregistrés**      | Enregistrez le travail en cours sous un nom (jusqu'à cinq), rouvrez-le ou supprimez-le                                        |
| **Nouvelle session**          | Réinitialisez le compte-rendu et les diagnostics en un clic, avec confirmation — les dossiers enregistrés, eux, restent       |
| **Sauvegarde / restauration** | Exportez toutes vos données dans un fichier `.json` et rechargez-les sur un autre appareil (le mot secret OMS n'y figure pas) |
| **Thème et langue**           | Clair / sombre / système, interface en français ou en anglais                                                                 |
| **Hors connexion**            | Une fois chargée ou installée, l'application fonctionne sans réseau (sauf l'option OMS)                                       |

### Export et partage

| Fonctionnalité              | Ce que ça fait                                                                    |
| --------------------------- | --------------------------------------------------------------------------------- |
| **Export TXT / CSV / JSON** | Téléchargez la liste de codes validés en texte brut, tableur ou JSON              |
| **Copier la liste**         | Les codes retenus dans le presse-papiers, prêts à coller dans votre logiciel      |
| **Impression / PDF**        | Imprimez ou enregistrez en PDF en un clic (mise en page propre, sans l'interface) |
| **Partage**                 | Partagez par e-mail ou via l'API Web Share (selon le navigateur)                  |
| **Partage du paramétrage**  | Un lien qui reprend le mode d'analyse et la connexion OMS — jamais le mot secret  |

### Ce qui n'existe pas encore

Ces fonctions ont été annoncées ici par le passé alors qu'elles n'étaient pas
dans le code. Elles sont listées comme ce qu'elles sont — à venir — plutôt que
retirées en silence :

- **Dictée dans l'application** : il n'y a pas de bouton « Dictée ». Sur mobile, le micro du clavier fonctionne dans la zone de saisie comme dans n'importe quel champ.
- **Contrôle du format d'un code saisi** : la saisie manuelle vérifie que le code n'est pas vide et qu'il n'est pas déjà retenu, rien de plus.
- **Réordonner les diagnostics retenus** : l'ordre est celui de la validation (le plus récent en tête).
- **Modifier un code retenu** : retirez-le et ajoutez le bon.
- **Raccourci clavier pour lancer l'analyse** : passez par le bouton **Analyser**.
- **Favoris** et **annuler / rétablir**.

---

## Confidentialité et données

La protection des données est une priorité pour un outil traitant des informations médicales.

| Mode                    | Données transmises                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sans option API OMS** | **Aucune donnée ne quitte votre navigateur.** Tout est traité localement.                                                                        |
| **Avec option API OMS** | Des fragments du compte-rendu transitent vers votre proxy personnel, puis vers les serveurs de l'OMS (`id.who.int`). Vous contrôlez votre proxy. |

- Aucun compte utilisateur requis.
- Aucun stockage serveur.
- Les données de session restent dans le **stockage local de votre navigateur** (effacées en vidant le cache).

---

## Questions fréquentes

**L'application fonctionne-t-elle sans connexion ?**
Oui, une fois chargée (ou installée), elle est disponible hors ligne. L'option API OMS nécessite une connexion.

**Les codes proposés sont-ils fiables ?**
Le dictionnaire embarqué est un échantillon à titre d'exemple. Les suggestions sont indicatives — vérifiez toujours avec le guide méthodologique officiel (ATIH).

**Puis-je l'utiliser sur téléphone ou tablette ?**
Oui. L'application est responsive et installable sur iOS et Android via le bouton d'installation du navigateur.

**Y a-t-il des frais ?**
Non, l'application est gratuite et open source (licence MIT).

---

## Soutenir le projet

Si l'outil vous est utile, vous pouvez soutenir son développement :

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

---

<details>
<summary><strong>Documentation technique (développeurs)</strong></summary>

### Stack

| Couche       | Technologie                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework UI | [React 19](https://react.dev/) (depuis la migration de mai 2026)                                                                                                                                            |
| Routing      | [react-router-dom 7](https://reactrouter.com/) (HashRouter)                                                                                                                                                 |
| Build        | [Vite 8](https://vitejs.dev/) (Rolldown, cible ES2025)                                                                                                                                                      |
| Style        | [Tailwind CSS 4](https://tailwindcss.com/) + classes legacy de [`style.css`](src/style.css)                                                                                                                 |
| State        | [Zustand 5](https://zustand-demo.pmnd.rs/) — `settingsStore`, `workspaceStore`                                                                                                                              |
| Tests        | [Vitest 4](https://vitest.dev/) (jsdom) + [Testing Library React](https://testing-library.com/) + [Playwright](https://playwright.dev/) + [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) |
| Qualité      | TypeScript ~6.0 strict + ESLint 9 flat + Prettier 3, mutualisés via [`@mister-guiiug/dev-pwa-config`](../dev-pwa-config/README.md)                                                                          |
| Monitoring   | [web-vitals 4](https://web.dev/vitals/)                                                                                                                                                                     |
| PWA          | [`vite-plugin-pwa 1.3`](https://vite-pwa-org.netlify.app/) (Workbox `generateSW`)                                                                                                                           |
| Proxy CORS   | [Cloudflare Workers](workers/README.md) (optionnel)                                                                                                                                                         |
| CI/CD        | GitHub Actions → GitHub Pages                                                                                                                                                                               |

### Démarrage local

**Pré-requis** : [Node.js](https://nodejs.org/) ≥ 20.

```bash
git clone https://github.com/mister-guiiug/mister-CIM10.git
cd mister-CIM10
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/
npm run preview
```

### Tests

```bash
npm test             # Vitest unitaires (jsdom)
npm run test:watch   # Vitest mode watch
npm run test:e2e     # Playwright (full app + a11y)
npm run type-check   # TypeScript strict (tsc -b ; noEmit hérité du socle)
npm run lint         # ESLint flat config
```

Setup partagé : [`src/test/setup.ts`](src/test/setup.ts) charge `@testing-library/jest-dom/vitest`. Les options Vitest viennent de [`@mister-guiiug/dev-pwa-config/vitest-base`](../dev-pwa-config/vitest-base.js) (jsdom + globals + passWithNoTests).

### Débogage VS Code / Cursor

F5 → choisir une configuration :

- **Déboguer : Chrome + Vite** — démarre le serveur et ouvre le navigateur avec le débogueur.
- **Déboguer : Chrome (serveur déjà lancé)** — si `npm run dev` tourne déjà.

### API OMS (ICD-11) et proxy CORS

L'accès direct à l'[ICD API OMS](https://icd.who.int/icdapi) est bloqué par CORS. Un proxy Cloudflare Worker est fourni dans [`workers/`](workers/README.md) :

1. Copier `workers/wrangler.toml.example` → `workers/wrangler.toml`.
2. `wrangler deploy` (compte Cloudflare gratuit).
3. Configurer `ALLOWED_ORIGINS`, puis renseigner l'URL dans les paramètres de l'application.

### Déploiement sur GitHub Pages

1. Nommer le dépôt `mister-cim10` (ou adapter `base` dans [`vite.config.ts`](vite.config.ts)).
2. **Settings → Pages** : source → **GitHub Actions**.
3. Pousser sur `main` : le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) exécute `npm ci && npm run build` et publie `dist/`.

### Structure du dépôt

```
src/
├── App.tsx                       Router (HashRouter) + 3 routes (home / parametres / aide)
├── main.tsx                      Entry React + DialogProvider + bootstrap (theme, SW, web vitals)
├── components/                   AppHeader, AppFooter, BrandMark, DialogProvider, PwaUpdates, SocleLabelsBridge
├── pages/                        HomePage, SettingsPage, HelpPage
├── features/workspace/           CrPanel, SessionsPanel, SuggestionsPanel, ValidatedPanel, CodeSearch, ExportBar
├── store/                        settingsStore (Zustand), workspaceStore (Zustand)
├── hooks/                        useDialog
├── lib/
│   ├── analyzer.ts               suggestFromText + searchIcdCodes — logique pure (TS strict)
│   ├── app-store.ts              instantané versionné { v, data } + migration 0 → 1
│   ├── constants.ts              LS_KEYS (les deux clés hors instantané)
│   ├── icd-hierarchy.ts          getFamily — code parent et codes apparentés
│   ├── oms.ts                    client OAuth2 + autocodage CIM-11 via la passerelle
│   ├── settings.ts               lecture/écriture des réglages (façade sur app-store)
│   ├── storage.ts                sauvegarde/restauration .json (module `backup` du socle)
│   └── storage-migration.ts      passage des clés historiques sous le préfixe cim10_
├── types/index.ts                AnalyzeMode, AnalysisResult, ValidatedDiagnostic, SavedSession, WhoSettings
├── i18n/                         catalogue FR + EN (chrome applicatif uniquement)
├── icd10-data.ts                 Échantillon de codes / synonymes FR
├── style.css                     Styles legacy (classes réutilisées par les composants React)
└── tailwind.css                  @import 'tailwindcss'
workers/                          Proxy CORS Cloudflare Worker (optionnel)
public/                           Manifest PWA, icônes
scripts/                          Génération d'icônes
docs/context.md                   Contexte produit détaillé
```

Le thème, les Web Vitals, l'enregistrement du service worker et le bandeau de
mise à jour ne sont plus des fichiers de ce dépôt : ils viennent de
[`@mister-guiiug/dev-pwa-config`](https://github.com/mister-guiiug/dev-pwa-config)
et sont montés dans [`src/main.tsx`](src/main.tsx).

### Persistance

Tout l'état de l'application tient dans **un instantané versionné** —
`{ v, data }` sous la clé `cim10_data` — servi par `createVersionedStore` du
socle : chaîne de migrations qui monte d'un cran à la fois, validation, et
**copie de côté avant toute perte possible** (`cim10_data.backup-v0`,
`…backup-illisible`). L'état d'avant, réparti en dix clés `localStorage`
séparées, est repris par la migration 0 → 1 au premier démarrage, puis les clés
d'origine sont retirées.

Deux clés restent hors de l'instantané, chacune pour une raison précise :
`cim10_who_icd_client_secret` (le fichier de sauvegarde exclut le mot secret
**par son nom de clé** — fondu dans l'instantané, il repartirait en clair) et
`dwc_theme`, qui appartient au socle et se lit avant l'exécution du bundle.

### Migration vanilla TS → React (mai 2026)

L'application a été entièrement réécrite en **React 19 + react-router-dom 7 + Tailwind 4 + Zustand 5**, en remplacement du runtime vanilla TS et du router maison. Les ~4 400 lignes de DOM-manipulation ([`workspace.ts`](https://github.com/mister-guiiug/mister-cim10/commits/main/src/workspace.ts), `pages.ts`, `*-html.ts`, `header-chrome.ts`, `nav-drawer.ts`, `dialog-ui.ts`, `enhancements-integration.ts`, `ui-helpers.js`) ont été remplacées par ~2 700 lignes de composants React TS strict. La logique pure (analyzer, données, theme, storage) a été conservée et reportée dans `src/lib/`.

Fonctionnalités encore absentes du code, et ce qu'il faudrait pour chacune :

- Reconnaissance vocale (bouton « Dictée ») — `useSpeechRecognition` à brancher sur `CrPanel`
- Favoris — aucune clé n'est réservée, tout est à faire
- Annuler / rétablir (Ctrl+Z) — pile d'actions à empiler dans `workspaceStore`
- Réordonnancement des diagnostics retenus — `ValidatedPanel` affiche dans l'ordre de validation
- Raccourci clavier pour lancer l'analyse — aucun gestionnaire de touche dans `src/`
- Contrôle du format d'un code saisi — `ManualEntryForm` ne vérifie que le vide et le doublon

Livrées depuis, et donc sorties de cette liste : la **recherche manuelle d'un
code** ([`CodeSearch.tsx`](src/features/workspace/CodeSearch.tsx), sur le moteur
de trigrammes de `analyzer.ts` appelé dans l'autre sens), les **sessions
nommées** ([`SessionsPanel.tsx`](src/features/workspace/SessionsPanel.tsx)), la
**sélection du terme repéré** dans le compte-rendu (`CrPanel`), et l'**appel réel
à l'API OMS** ([`lib/oms.ts`](src/lib/oms.ts), invoqué par
`HomePage.handleAnalyze`).

</details>

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.

Utilisation sous votre entière responsabilité. Cet outil ne remplace pas les référentiels officiels ni le jugement clinique.
