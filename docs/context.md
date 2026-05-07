# Mister CIM-10 — contexte produit

## Objectif

Application web **PWA** pour faciliter la **cotation CIM-10** à partir de comptes-rendus médicaux libres : saisie ou dictée, suggestions de codes, validation utilisateur, export des diagnostics retenus (application **Mister CIM-10**).

## Cahier des charges initial

- Site web **PWA**, hébergé sur **GitHub** via **GitHub Pages**.
- **Formulaire** de saisie ; sur téléphone, possibilité de **dicter** le texte (reconnaissance vocale navigateur).
- **Analyser** le texte pour en extraire des **diagnostics** plausibles.
- **Identifier et structurer** des codes CIM-10 pour aider à une cotation alignée avec les bonnes pratiques (le guide méthodologique officiel reste la référence humaine).
- L'utilisateur **valide**, **modifie** ou **rejette** chaque suggestion **en un clic**.
- **Exporter** les données validées (fichiers téléchargeables).

## État d'implémentation

| Besoin                                               | Statut                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| PWA (manifest, service worker)                       | Livré (`vite-plugin-pwa` Workbox `generateSW`)                                   |
| Formulaire + analyse locale                          | Livré (composants React + [`src/lib/analyzer.ts`](../src/lib/analyzer.ts))       |
| Suggestions CIM-10 + actions Valider / Rejeter       | Livré ([`SuggestionsPanel.tsx`](../src/features/workspace/SuggestionsPanel.tsx)) |
| Indicateur de pertinence (Élevée / Moyenne / Faible) | Livré                                                                            |
| Sauvegarde automatique de session (localStorage)     | Livré (Zustand `workspaceStore`)                                                 |
| Nouvelle session (réinitialisation complète)         | Livré ([`CrPanel.tsx`](../src/features/workspace/CrPanel.tsx))                   |
| Export TXT / CSV / JSON                              | Livré ([`ExportBar.tsx`](../src/features/workspace/ExportBar.tsx))               |
| Export e-mail / Web Share                            | Livré                                                                            |
| Impression / PDF                                     | Livré (`window.print()`)                                                         |
| Annotations par code validé                          | Livré (champ Note dans `ValidatedPanel`)                                         |
| Sauvegarde/restauration globale .json                | Livré ([`SettingsPage.tsx`](../src/pages/SettingsPage.tsx))                      |
| Partage du paramétrage par lien                      | Livré (bouton Partager dans Paramètres)                                          |
| Page Aide complète                                   | Livré ([`HelpPage.tsx`](../src/pages/HelpPage.tsx))                              |
| Déploiement GitHub Pages                             | Livré via **GitHub Actions** (`.github/workflows/pages.yml`)                     |
| **À reprendre depuis l'ancienne version**            |                                                                                  |
| Dictée (Web Speech API)                              | Reporté — store prêt, hook `useSpeechRecognition` à écrire                       |
| Recherche manuelle de code (autocomplete)            | Reporté — à ajouter dans `SuggestionsPanel`                                      |
| Sessions nommées (multi-session)                     | Reporté — `LS_KEYS.SESSIONS` réservé                                             |
| Favoris ⭐                                           | Reporté — `LS_KEYS.FAVORITES` réservé                                            |
| Annuler/Rétablir (Ctrl+Z)                            | Reporté — pile d'actions Zustand                                                 |
| Highlight des termes repérés dans le CR              | Reporté — composant à ajouter dans `CrPanel`                                     |
| Appel réel API OMS ICD-11 (autocodage)               | Reporté — `// TODO` dans `HomePage.handleAnalyze`, store prêt                    |
| Réordonnancement des diagnostics validés (↑ / ↓)     | Reporté — la liste affiche dans l'ordre de validation                            |
| Historique des comptes-rendus (5 derniers)           | Reporté                                                                          |
| Raccourci clavier Ctrl+Entrée                        | Reporté                                                                          |

## Architecture technique (résumé)

- **Stack** : React 19 + react-router-dom 7 (HashRouter) + Tailwind 4 + Zustand 5, build **Vite 7**, sans backend.
- **TypeScript** : strict, cible ES2025, configs partagées via [`@mister-guiiug/dev-config`](../../dev-config/README.md).
- **Données** : référentiel CIM-10 **d'exemple** embarqué ([`src/icd10-data.ts`](../src/icd10-data.ts)), enrichissable.
- **Analyse** : correspondance textuelle normalisée (libellés et synonymes) en local avec correspondance **floue par trigrammes Jaccard** (tolère fautes de frappe/STT) — voir [`src/lib/analyzer.ts`](../src/lib/analyzer.ts).
- **State** : deux stores Zustand : `settingsStore` (mode, seuil de confiance, identifiants OMS, disclaimer) et `workspaceStore` (texte CR, suggestions, validés, filtre, rejets).
- **Confidentialité** : sans option OMS, **aucun envoi** du compte-rendu ; avec l'OMS (option à brancher), des **segments de texte** transitent vers votre **proxy** puis vers les serveurs WHO.
- **Build** : sortie dans `dist/` ; en production, `base` Vite = `/mister-cim10/` (site projet `https://<utilisateur>.github.io/mister-cim10/`).

## Migration React (mai 2026)

L'application a été entièrement réécrite en React. Les anciens fichiers (`workspace.ts`, `pages.ts`, `*-html.ts`, `header-chrome.ts`, `nav-drawer.ts`, `dialog-ui.ts`, `enhancements-integration.ts`, `ui-helpers.js`, `router.ts`) ont été supprimés ; la logique pure (analyzer, theme, storage) a été déplacée dans `src/lib/`. Voir le bloc « Migration vanilla TS → React » du [README](../README.md).

## Limites et usage responsable

- L'outil est une **aide à la décision**, pas un substitut à l'expertise clinique ni au **guide méthodologique** et aux référentiels officiels (ATIH, CIM-10, versions nationales).
- Le jeu de codes fourni est un **échantillon** : il doit être **remplacé ou complété** pour un usage réel en production.
- La **confiance** affichée est **indicative** (score interne), pas une probabilité clinique.

## Confidentialité

Traitement **100 % local** dans le navigateur pour l'analyse et l'export ; aucune persistance serveur dans cette version.

## API et référentiels publics (suggestions)

- **OMS — ICD API** : l'OMS propose une **API REST** documentée pour parcourir les classifications, y compris **ICD-10** et surtout **ICD-11** (hébergement cloud, authentification selon les usages). Point d'entrée documentation : [https://icd.who.int/icdapi](https://icd.who.int/icdapi) et [documentation API v2](https://icd.who.int/docs/icd-api/APIDoc-Version2/). Utile pour **recherche / arborescence / libellés officiels**, pas pour un moteur de cotation française « clé en main ».
- **FHIR** : des serveurs de **terminologie** (ex. Ontoserver, Snowstorm) exposent souvent des **CodeSystem** / **ValueSet** ; l'intégration ICD dépend de l'instance (souvent ICD-10-CM US ou SNOMED mappé). À évaluer selon votre stack et votre juridiction.
- **France (CIM-10 FR / PMSI)** : les libellés et règles métiers relèvent surtout de l'**ATIH** et des guides de cotation ; il n'existe en général **pas** d'API publique unique équivalente à « toute la CIM-10 française en JSON gratuite ». Les jeux de données ouverts passent plutôt par des **téléchargements** ou portails sectoriels (à vérifier sur [data.gouv.fr](https://www.data.gouv.fr) et le site ATIH).
- **Tiers** : des services type **icd10api.com** proposent des recherches par code ou libellé (quotas, conditions d'usage, souvent orientés **ICD-10-CM**). Vérifier la conformité légale et la version de la nomenclature avant usage clinique ou facturation.

Pour intégrer une API dans cette PWA, il faudrait un **proxy** ou des appels avec **clé** côté serveur (les clés ne doivent pas être exposées dans le dépôt public).

## Évolutions possibles

- **Reprise des fonctionnalités reportées** ci-dessus (dictée, recherche manuelle, sessions, favoris, undo/redo, OMS).
- **Import d'un référentiel complet** — glisser-déposer ou sélection d'un fichier JSON pour remplacer `icd10-data.ts` en mémoire sans rebuild.
- **Analyse LLM** — brancher un service d'analyse (LLM ou API) avec consentement, clés et hébergement adaptés.
- **Serveur FHIR** — interroger un serveur de terminologie (Ontoserver, Snowstorm) pour la recherche de codes.

Pour l'installation locale et la publication sur GitHub Pages, voir le [README à la racine du dépôt](../README.md).
