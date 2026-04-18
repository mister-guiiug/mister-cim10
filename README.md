# Mister CIM-10

[![Application en ligne](https://img.shields.io/badge/Application-En%20ligne-brightgreen?style=for-the-badge)](https://mister-guiiug.github.io/mister-CIM10/)
[![License](https://img.shields.io/badge/Licence-MIT-blue?style=for-the-badge)](https://github.com/mister-guiiug/mister-cim10/blob/main/LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Soutenir-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> **Aide à la cotation CIM-10 dans votre navigateur.**
> Saisissez ou dictez un compte-rendu médical, obtenez des suggestions de codes, validez-les et exportez-les — sans installation, sans compte, sans envoi de données.

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
2. **Saisissez ou dictez** votre compte-rendu dans la zone de texte (microphone disponible sur mobile).
3. **Lancez l'analyse** avec le bouton ou `Ctrl+Entrée` — les codes CIM-10 suggérés apparaissent aussitôt.
4. **Validez, modifiez ou rejetez** chaque suggestion en un clic. Réordonnez les codes si besoin.
5. **Exportez** la liste finale en fichier texte (`.txt`) ou tableur (`.csv`), ou imprimez-la directement.

L'application peut être **installée sur votre appareil** (bouton d'installation du navigateur) et fonctionne **hors connexion** une fois installée.

---

## Fonctionnalités

### Analyse

| Fonctionnalité | Ce que ça fait |
|---|---|
| **Analyse du texte libre** | Propose des codes CIM-10 à partir de votre compte-rendu, via le dictionnaire intégré ou l'API OMS (ICD-11) si configurée |
| **Indicateur de pertinence** | Chaque suggestion est qualifiée : Élevée / Moyenne / Faible |
| **Terme parent** | Pour un sous-code (ex. `E11.65`), le libellé de la rubrique parente (`E11`) est rappelé pour le contexte |
| **Recherche manuelle** | Retrouvez un code par son libellé ou saisissez-le directement si vous le connaissez |

### Validation et saisie

| Fonctionnalité | Ce que ça fait |
|---|---|
| **Valider / Modifier / Rejeter** | Traitez chaque proposition en un clic ; modifiez librement le code si besoin |
| **Contrôle du format** | L'application vérifie que le code saisi respecte le format CIM-10 et vous avertit en cas d'erreur |
| **Réordonner les codes** | Changez l'ordre des diagnostics retenus avant l'export avec les boutons ↑ / ↓ |

### Confort d'utilisation

| Fonctionnalité | Ce que ça fait |
|---|---|
| **Dictée vocale** | Parlez directement dans l'application (selon le navigateur et l'appareil) |
| **Sauvegarde automatique** | Vos diagnostics validés sont mémorisés dans le navigateur — ils sont là si vous rechargez la page |
| **Historique des comptes-rendus** | Les 5 derniers textes analysés sont mémorisés et rappelables en un clic |
| **Nouvelle session** | Réinitialisez tout (texte + diagnostics) en un clic, avec confirmation |
| **Raccourci clavier** | `Ctrl+Entrée` (ou `Cmd+Entrée` sur Mac) pour lancer l'analyse rapidement |

### Export et partage

| Fonctionnalité | Ce que ça fait |
|---|---|
| **Export TXT / CSV** | Téléchargez la liste de codes validés en texte brut ou tableur |
| **Impression / PDF** | Imprimez ou enregistrez en PDF en un clic (mise en page propre, sans l'interface) |
| **Partage** | Partagez par e-mail ou via l'API Web Share (selon le navigateur) |

---

## Confidentialité et données

La protection des données est une priorité pour un outil traitant des informations médicales.

| Mode | Données transmises |
|---|---|
| **Sans option API OMS** | **Aucune donnée ne quitte votre navigateur.** Tout est traité localement. |
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

| Couche | Technologie |
|---|---|
| Build | [Vite 6](https://vitejs.dev/) |
| Tests | [Vitest 3](https://vitest.dev/) |
| Runtime | HTML / CSS / JS vanilla — sans framework |
| PWA | Service Worker généré par `scripts/postbuild-sw.mjs` |
| Proxy CORS | [Cloudflare Workers](workers/README.md) (optionnel) |
| CI/CD | GitHub Actions → GitHub Pages |

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
npm test             # exécution unique
npm run test:watch   # mode watch
```

Vitest + jsdom, couvre `analyzer.js`, `router.js`, `export-report.js`, `settings-share.js`.

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

1. Nommer le dépôt `mister-cim10` (ou adapter `base` dans `vite.config.js`).
2. **Settings → Pages** : source → **GitHub Actions**.
3. Pousser sur `main` : le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) exécute `npm ci && npm run build` et publie `dist/`.

### Structure du dépôt

```
src/
  analyzer.js        Suggestions locales (texte → code CIM-10)
  who-icd-api.js     Intégration API OMS ICD-11 (OAuth2)
  icd10-data.js      Échantillon de codes / synonymes FR
  workspace.js       Interface principale — analyse, validation, export
  export-report.js   Export TXT, CSV, e-mail, Web Share
  speech.js          Web Speech API
  router.js          Routeur SPA
workers/             Proxy CORS Cloudflare Worker (optionnel)
public/              Manifest PWA, icônes
scripts/             Génération d'icônes, post-build SW
docs/context.md      Contexte produit détaillé
```

</details>

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN. 

Utilisation sous votre entière responsabilité. Cet outil ne remplace pas les référentiels officiels ni le jugement clinique.
