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
2. **Saisissez** votre compte-rendu dans la zone de texte, ou **dictez-le** avec le bouton **Dictée** quand le navigateur le propose (sur mobile, le micro du clavier fonctionne aussi, comme dans n'importe quel champ de saisie).
3. **Lancez l'analyse** avec le bouton **Analyser**, ou **Ctrl + Entrée** (⌘ + Entrée sur Mac) depuis le texte — les codes CIM-10 suggérés apparaissent aussitôt.
4. **Validez ou rejetez** chaque suggestion en un clic ; ajoutez une note libre sur un code retenu, **corrigez-le** avec **Modifier**, **réordonnez** la liste avec **Monter** / **Descendre**. Un faux pas s'**annule** (bouton **Annuler**, ou Ctrl + Z hors d'un champ de saisie).
5. **Cherchez un code** par son libellé pour coter un terme qui n'est pas dans le compte-rendu, ou reprenez-le dans vos **favoris** (l'étoile), et ajoutez-le aux diagnostics retenus.
6. **Exportez** la liste finale — dans l'ordre que vous lui avez donné — en fichier texte (`.txt`), tableur (`.csv`) ou JSON, ou imprimez-la directement.

Vous pouvez **enregistrer le dossier en cours sous un nom** (jusqu'à cinq) et le rouvrir plus tard : le compte-rendu et les diagnostics retenus reviennent tels quels.

L'application peut être **installée sur votre appareil** (bouton d'installation du navigateur) et fonctionne **hors connexion** une fois installée.

---

## Fonctionnalités

### Analyse

| Fonctionnalité               | Ce que ça fait                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Analyse du texte libre**   | Propose des codes à partir de votre compte-rendu : le dictionnaire CIM-10 intégré **et** l'API OMS (CIM-11), sans réglage  |
| **Indicateur de pertinence** | Chaque suggestion est qualifiée : Élevée / Moyenne / Faible, avec son pourcentage                                          |
| **Seuil de confiance**       | Réglable dans les paramètres : les suggestions en dessous du seuil ne s'affichent pas                                      |
| **Filtre des suggestions**   | Restreignez la liste affichée par code, libellé ou terme repéré                                                            |
| **Terme repéré**             | Un clic sur le terme qui a déclenché la suggestion le sélectionne dans le compte-rendu                                     |
| **Comparer** (terme parent)  | Pour un sous-code (ex. `E11.65`), affiche la rubrique parente (`E11`) et les codes apparentés, chacun ajoutable en un clic |

### Recherche et saisie d'un code

| Fonctionnalité              | Ce que ça fait                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chercher un code**        | Par libellé, synonyme ou code (`diabète`, `dt2`, `E11`) — y compris sans accent ou mal orthographié. Pour coter un terme absent du compte-rendu                                                                                                                                                                                |
| **Saisie manuelle**         | Si vous connaissez déjà le code, saisissez-le ; un code du référentiel embarqué reprend son libellé                                                                                                                                                                                                                            |
| **Contrôle du format**      | La saisie est remise en forme (`e11,9` ou `E 11 9` → `E11.9`, `a000` → `A00.0`) et ce qui n'a pas la forme d'un code CIM-10 est refusé, extensions ATIH comprises (`R53.+0`). Un code bien formé mais absent du référentiel embarqué — un échantillon — n'est pas bloqué : il est signalé, avec les codes de la même catégorie |
| **Détection de doublon**    | Un code déjà retenu n'est pas ajouté deux fois, et l'application le signale                                                                                                                                                                                                                                                    |
| **Modifier un code retenu** | Corrigez le code et le libellé à leur place dans la liste, avec le même contrôle de format ; Échap annule                                                                                                                                                                                                                      |
| **Favoris**                 | L'étoile d'un code — retenu, suggéré ou trouvé par la recherche — le range dans le panneau **Favoris**, d'où il s'ajoute aux diagnostics retenus en un geste (cent au plus)                                                                                                                                                    |
| **Note libre**              | Annotez un diagnostic retenu ; la note suit dans les exports texte, CSV et JSON                                                                                                                                                                                                                                                |

### Confort d'utilisation

| Fonctionnalité                | Ce que ça fait                                                                                                                                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sauvegarde automatique**    | Compte-rendu, diagnostics retenus et réglages sont mémorisés dans le navigateur — ils sont là si vous rechargez la page                                                                                                                                                    |
| **Dossiers enregistrés**      | Enregistrez le travail en cours sous un nom (jusqu'à cinq), rouvrez-le ou supprimez-le                                                                                                                                                                                     |
| **Nouvelle session**          | Réinitialisez le compte-rendu et les diagnostics en un clic, avec confirmation — les dossiers enregistrés, eux, restent                                                                                                                                                    |
| **Sauvegarde / restauration** | Exportez toutes vos données dans un fichier `.json` — favoris compris — et rechargez-les sur un autre appareil (le mot secret OMS et l'accord de dictée n'y figurent pas)                                                                                                  |
| **Dictée**                    | Bouton **Dictée** quand le navigateur sait reconnaître la parole : le texte s'insère au curseur, les mots en cours s'affichent à côté, un second clic arrête. Voir la confidentialité ci-dessous                                                                           |
| **Réordonner**                | **Monter** / **Descendre** sur chaque diagnostic retenu, au clavier comme à la souris ; l'ordre est celui des exports, de la copie et de l'impression                                                                                                                      |
| **Annuler / rétablir**        | Ajout, retrait, modification, déplacement, note, **Vider la liste** : tout geste sur les diagnostics retenus s'annule (cinquante pas en arrière), au bouton ou par Ctrl + Z / Ctrl + Maj + Z / Ctrl + Y hors d'un champ de saisie. Changer de dossier referme l'historique |
| **Raccourci clavier**         | Ctrl + Entrée (⌘ + Entrée sur Mac) dans le compte-rendu lance l'analyse                                                                                                                                                                                                    |
| **Thème et langue**           | Clair / sombre / système, interface en français ou en anglais                                                                                                                                                                                                              |
| **Hors connexion**            | Une fois chargée ou installée, l'application fonctionne sans réseau (sauf l'option OMS et la dictée en ligne)                                                                                                                                                              |

### Export et partage

| Fonctionnalité              | Ce que ça fait                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| **Export TXT / CSV / JSON** | Téléchargez la liste de codes validés en texte brut, tableur ou JSON, dans l'ordre de l'écran |
| **Copier la liste**         | Les codes retenus dans le presse-papiers, prêts à coller dans votre logiciel                  |
| **Impression / PDF**        | Imprimez ou enregistrez en PDF en un clic (mise en page propre, sans l'interface)             |
| **Partage**                 | Partagez par e-mail ou via l'API Web Share (selon le navigateur)                              |
| **Partage du paramétrage**  | Un lien qui reprend le paramétrage OMS (identifiant, version, langue) — jamais le mot secret  |

---

## Confidentialité et données

La protection des données est une priorité pour un outil traitant des informations médicales.

L'analyse interroge **deux référentiels** : le dictionnaire CIM-10 embarqué, qui répond dans la page, et l'OMS (CIM-11) par la passerelle. Il n'y a pas de réglage à choisir — et donc pas de mode « tout local » à sélectionner.

| Situation                              | Données transmises                                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hors connexion, ou sans passerelle** | **Aucune donnée ne quitte votre navigateur** : le dictionnaire embarqué répond seul, et l'application vous le dit à l'écran.                                                 |
| **En ligne, passerelle joignable**     | Des fragments du compte-rendu transitent vers la passerelle du site, puis vers les serveurs de l'OMS (`id.who.int`). La passerelle ne conserve rien : elle relaie et oublie. |

### La dictée

La reconnaissance vocale est celle du navigateur (API Web Speech), et c'est lui
qui décide où la parole est traitée. L'application ne s'en remet pas à lui
sans le dire :

| Situation                                                                              | Ce qui se passe                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Le navigateur reconnaît la parole sur l'appareil** (Chrome récent, `processLocally`) | La dictée s'en sert d'office, sans rien demander : **l'audio ne quitte pas l'appareil**. S'il faut d'abord télécharger le modèle de la langue, le navigateur le télécharge (« Préparation de la dictée… ») ; un second clic abandonne.                                                                                                    |
| **Sinon** (Edge, Safari, Chrome ancien…)                                               | Au premier usage, une boîte explique que **l'enregistrement de votre voix part au service de reconnaissance de l'éditeur du navigateur** (Google pour Chrome, Microsoft pour Edge, Apple pour Safari…), hors du contrôle de l'application, et qu'il ne faut **dicter aucune donnée identifiante**. Rien ne démarre sans accord explicite. |
| **Hors connexion, sans reconnaissance sur l'appareil**                                 | La dictée ne démarre pas et le dit.                                                                                                                                                                                                                                                                                                       |
| **Navigateur sans l'API** (Firefox…)                                                   | Pas de bouton **Dictée**. Le micro du clavier mobile reste disponible, sous la politique de confidentialité du clavier.                                                                                                                                                                                                                   |

L'accord est **mémorisé sur ce navigateur seulement** — il désigne le service
de SON éditeur — et **se retire dans Paramètres › Dictée**. Il ne part pas dans
le fichier de sauvegarde, et un fichier restauré ne peut pas en donner un.

- Aucun compte utilisateur requis.
- Aucun stockage serveur.
- Les données de session restent dans le **stockage local de votre navigateur** (effacées en vidant le cache).

---

## Questions fréquentes

**L'application fonctionne-t-elle sans connexion ?**
Oui, une fois chargée (ou installée), elle est disponible hors ligne. L'option API OMS nécessite une connexion, comme la dictée quand le navigateur ne reconnaît pas la parole sur l'appareil.

**La dictée envoie-t-elle ma voix quelque part ?**
Cela dépend du navigateur, et l'application vous le dit avant. Sur l'appareil, rien ne sort ; sinon, votre voix part au service de l'éditeur du navigateur, et seulement après votre accord — révocable dans les Paramètres. Voir [La dictée](#la-dictée).

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

L'accès direct à l'[ICD API OMS](https://icd.who.int/icdapi) est bloqué par CORS. Une passerelle Cloudflare Worker est fournie dans [`workers/`](workers/README.md), et **elle porte le compte OMS** : l'application arrive donc connectée, sans rien à saisir.

C'est la seule place possible pour ce compte. Une PWA est un bundle public : une variable `VITE_*` y est recopiée en clair, lisible par quiconque ouvre l'onglet Réseau. Le partage est donc :

| Valeur                                                       | Où                                      |
| ------------------------------------------------------------ | --------------------------------------- |
| `VITE_WHO_PROXY_URL`, `VITE_WHO_RELEASE_ID`, `VITE_WHO_LANG` | variables de dépôt (`vars`) — publiques |
| `WHO_CLIENT_ID`, `WHO_CLIENT_SECRET`                         | secrets **du worker**                   |

Qui préfère son propre compte OMS le saisit dans **Paramètres › Connexion OMS** : il substitue alors celui de la passerelle. L'adresse de la passerelle, elle, ne se saisit plus — la CSP n'en autorise qu'une, celle du build. Détails et déploiement : [`workers/README.md`](workers/README.md).

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
├── features/workspace/           CrPanel, SessionsPanel, SuggestionsPanel, ValidatedPanel, CodeSearch, ExportBar,
│                                 CodeEntryForm (saisie contrôlée), FavoritesPanel, FavoriteToggle,
│                                 BoutonDictee, Dictation (chargée à la demande)
├── store/                        settingsStore (Zustand), workspaceStore (Zustand, historique annuler / rétablir)
├── hooks/                        useDialog, useSpeechRecognition (dictée Web Speech)
├── lib/
│   ├── analyzer.ts               suggestFromText + searchIcdCodes — logique pure (TS strict)
│   ├── app-store.ts              instantané versionné { v, data } + migrations 0 → 1 → 2
│   ├── code-format.ts            normalisation et contrôle de forme d'un code CIM-10 / CIM-11
│   ├── constants.ts              LS_KEYS (mot secret OMS, thème — lus hors instantané)
│   ├── diagnostics.ts            déplacer / remplacer un diagnostic retenu à sa place
│   ├── dictee.ts                 détection de l'API (injectable), accord — lus avant la dictée
│   ├── dictee-moteur.ts          sur l'appareil ou en ligne, erreurs, insertion au curseur
│   ├── favoris.ts                bascule et relecture défensive des favoris (cent au plus)
│   ├── historique.ts             pile annuler / rétablir bornée (cinquante gestes)
│   ├── icd-hierarchy.ts          getFamily — code parent et codes apparentés
│   ├── raccourcis.ts             Ctrl+Entrée, Ctrl+Z / Ctrl+Y, plateforme, champs éditables
│   ├── oms.ts                    client OAuth2 + autocodage CIM-11 via la passerelle
│   ├── settings.ts               lecture/écriture des réglages (façade sur app-store)
│   ├── who-defaults.ts           réglages OMS fournis par le build (VITE_WHO_*)
│   ├── storage.ts                sauvegarde/restauration .json (module `backup` du socle)
│   └── storage-migration.ts      passage des clés historiques sous le préfixe cim10_
├── types/index.ts                AnalyzeMode, AnalysisResult, ValidatedDiagnostic, SavedSession, WhoSettings
├── i18n/                         catalogue FR + EN (chrome applicatif uniquement)
├── icd10-data.ts                 Échantillon de codes / synonymes FR
├── style.css                     Styles legacy (classes réutilisées par les composants React)
└── tailwind.css                  @import 'tailwindcss'
workers/                          Passerelle CORS Cloudflare Worker — porte le compte OMS en secrets
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
d'origine sont retirées. La migration 1 → 2 en RETIRE une : l'adresse de la
passerelle, que la CSP a privée de sens — elle vient du build, et la garder en
stockage laissait un réglage fantôme dans chaque sauvegarde.

Les **favoris** sont un champ de l'instantané (`favorites`), entré sans cran
de version : un champ ajouté que la validation comble quand il manque se lit
sur n'importe quel instantané de version 2. Ils partent donc avec la
sauvegarde, comme le reste.

Quelques clés restent hors de l'instantané, chacune pour une raison précise :
`cim10_who_icd_client_secret` (le fichier de sauvegarde exclut le mot secret
**par son nom de clé** — fondu dans l'instantané, il repartirait en clair),
`cim10_dictation_consent` (l'accord pour la dictée en ligne vaut pour le
service de CE navigateur : il est retiré de la sauvegarde **et** de la
restauration, pour qu'un fichier ne puisse ni l'emporter ni en donner un),
`cim10_locale` et `dwc_theme`, qui appartiennent au socle et se lisent avant le
premier rendu.

### Migration vanilla TS → React (mai 2026)

L'application a été entièrement réécrite en **React 19 + react-router-dom 7 + Tailwind 4 + Zustand 5**, en remplacement du runtime vanilla TS et du router maison. Les ~4 400 lignes de DOM-manipulation ([`workspace.ts`](https://github.com/mister-guiiug/mister-cim10/commits/main/src/workspace.ts), `pages.ts`, `*-html.ts`, `header-chrome.ts`, `nav-drawer.ts`, `dialog-ui.ts`, `enhancements-integration.ts`, `ui-helpers.js`) ont été remplacées par ~2 700 lignes de composants React TS strict. La logique pure (analyzer, données, theme, storage) a été conservée et reportée dans `src/lib/`.

Les fonctions que la réécriture avait laissées de côté sont toutes revenues
depuis : la **recherche manuelle d'un code**
([`CodeSearch.tsx`](src/features/workspace/CodeSearch.tsx), sur le moteur de
trigrammes de `analyzer.ts` appelé dans l'autre sens), les **sessions nommées**
([`SessionsPanel.tsx`](src/features/workspace/SessionsPanel.tsx)), la
**sélection du terme repéré** dans le compte-rendu (`CrPanel`), l'**appel réel à
l'API OMS** ([`lib/oms.ts`](src/lib/oms.ts), invoqué par
`HomePage.handleAnalyze`), puis le **contrôle du format d'un code**
([`lib/code-format.ts`](src/lib/code-format.ts), partagé par la saisie manuelle
et **Modifier** dans [`CodeEntryForm.tsx`](src/features/workspace/CodeEntryForm.tsx)),
le **réordonnancement** et l'**annuler / rétablir** des diagnostics retenus
([`lib/historique.ts`](src/lib/historique.ts), dans `workspaceStore`), les
**favoris** ([`lib/favoris.ts`](src/lib/favoris.ts), dans l'instantané), le
**raccourci Ctrl+Entrée** et la **dictée**
([`hooks/useSpeechRecognition.ts`](src/hooks/useSpeechRecognition.ts), chargé à la
demande par `CrPanel` via [`Dictation.tsx`](src/features/workspace/Dictation.tsx),
accord géré par [`lib/dictee.ts`](src/lib/dictee.ts)).

</details>

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.

Utilisation sous votre entière responsabilité. Cet outil ne remplace pas les référentiels officiels ni le jugement clinique.
