# Mister CIM-10 — contexte produit

## Objectif

Application web **PWA** pour faciliter la **cotation CIM-10** à partir de comptes-rendus médicaux libres : saisie ou dictée, suggestions de codes, validation utilisateur, export des diagnostics retenus (application **Mister CIM-10**).

## Cahier des charges initial

- Site web **PWA**, hébergé sur **GitHub** via **GitHub Pages**.
- **Formulaire** de saisie ; sur téléphone, possibilité de **dicter** le texte (reconnaissance vocale navigateur).
- **Analyser** le texte pour en extraire des **diagnostics** plausibles.
- **Identifier et structurer** des codes CIM-10 pour aider à une cotation alignée avec les bonnes pratiques (le guide méthodologique officiel reste la référence humaine).
- L’utilisateur **valide**, **modifie** ou **rejette** chaque suggestion **en un clic**.
- **Exporter** les données validées (fichiers téléchargeables).

## État d’implémentation

| Besoin | Statut |
|--------|--------|
| PWA (manifest, service worker) | Livré (`public/manifest.webmanifest`, `public/sw.js`) |
| Formulaire + analyse locale | Livré (`src/main.js`, `src/analyzer.js`) |
| Dictée (Web Speech API) | Livré si le navigateur le permet (`src/speech.js`) |
| Suggestions CIM-10 + actions Valider / Modifier / Rejeter | Livré |
| Export JSON et CSV | Livré |
| Déploiement GitHub Pages | Livré via **GitHub Actions** (`.github/workflows/pages.yml`) |

## Architecture technique (résumé)

- **Stack** : HTML/CSS/JS, build **Vite 6**, sans backend.
- **Données** : référentiel CIM-10 **d’exemple** embarqué (`src/icd10-data.js`), enrichissable.
- **Analyse** : correspondance textuelle normalisée (libellés et synonymes) en local ; en option, appels à l’[**ICD API OMS**](https://icd.who.int/icdapi) (OAuth2) pour l’**autocodage ICD-11 MMS** (`src/who-icd-api.js`), si l’utilisateur renseigne identifiant / secret et une **URL de proxy** (le navigateur bloque en général l’accès direct à l’OMS pour cause de **CORS** ; voir `workers/`).
- **Confidentialité** : sans option OMS, **aucun envoi** du compte-rendu ; avec l’OMS, des **segments de texte** transitent vers votre **proxy** puis vers les serveurs WHO (`id.who.int`, `icdaccessmanagement.who.int`).
- **Build** : sortie dans `dist/` ; en production, `base` Vite = `/mister-cim10/` (site projet `https://<utilisateur>.github.io/mister-cim10/`).

## Limites et usage responsable

- L’outil est une **aide à la décision**, pas un substitut à l’expertise clinique ni au **guide méthodologique** et aux référentiels officiels (ATIH, CIM-10, versions nationales).
- Le jeu de codes fourni est un **échantillon** : il doit être **remplacé ou complété** pour un usage réel en production.
- La **confiance** affichée est **indicative** (score interne), pas une probabilité clinique.

## Confidentialité

Traitement **100 % local** dans le navigateur pour l’analyse et l’export ; aucune persistance serveur dans cette version.

## API et référentiels publics (suggestions)

- **OMS — ICD API** : l’OMS propose une **API REST** documentée pour parcourir les classifications, y compris **ICD-10** et surtout **ICD-11** (hébergement cloud, authentification selon les usages). Point d’entrée documentation : [https://icd.who.int/icdapi](https://icd.who.int/icdapi) et [documentation API v2](https://icd.who.int/docs/icd-api/APIDoc-Version2/). Utile pour **recherche / arborescence / libellés officiels**, pas pour un moteur de cotation française « clé en main ».
- **FHIR** : des serveurs de **terminologie** (ex. Ontoserver, Snowstorm) exposent souvent des **CodeSystem** / **ValueSet** ; l’intégration ICD dépend de l’instance (souvent ICD-10-CM US ou SNOMED mappé). À évaluer selon votre stack et votre juridiction.
- **France (CIM-10 FR / PMSI)** : les libellés et règles métiers relèvent surtout de l’**ATIH** et des guides de cotation ; il n’existe en général **pas** d’API publique unique équivalente à « toute la CIM-10 française en JSON gratuite ». Les jeux de données ouverts passent plutôt par des **téléchargements** ou portails sectoriels (à vérifier sur [data.gouv.fr](https://www.data.gouv.fr) et le site ATIH).
- **Tiers** : des services type **icd10api.com** proposent des recherches par code ou libellé (quotas, conditions d’usage, souvent orientés **ICD-10-CM**). Vérifier la conformité légale et la version de la nomenclature avant usage clinique ou facturation.

Pour intégrer une API dans cette PWA, il faudrait un **proxy** ou des appels avec **clé** côté serveur (les clés ne doivent pas être exposées dans le dépôt public).

## Évolutions possibles

- Charger un fichier JSON complet de codes / synonymes (export local ou ETL depuis un référentiel autorisé).
- Brancher l’**ICD API OMS** ou un serveur FHIR pour la **recherche** de codes, en complément des synonymes FR métier.
- Brancher un service d’analyse (LLM ou API) avec consentement, clés et hébergement adaptés.
- Intégration d’un validateur de format de code CIM-10.

Pour l’installation locale et la publication sur GitHub Pages, voir le [README à la racine du dépôt](../README.md).
