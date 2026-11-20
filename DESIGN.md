# DESIGN.md — Mister CIM-10

Direction : **Clinical Console** (variante A, 03/10/2026), écrite depuis le
20/11/2026 dans la **grammaire d'Astryx**, le design system open source de Meta
(<https://astryx.atmeta.com/>).

> Aide à la cotation CIM-10 pour professionnels de santé (médecins, DIM, TIM).
> Posture : logiciel métier dense et crédible, pas PWA « produit indie ».

## Memorable thing

« Un poste de cotation sérieux : on voit tout de suite où on en est, et on copie pour le DPI en un geste. »

## Visual thesis

Console clinique : trois régions stables (compte-rendu → suggestions → retenus),
surfaces neutres, accent teal sobre, codes en mono. Peu d'ornement. La confiance
(référentiel local / OMS / seuil) est permanente.

## Astryx : la grammaire, pas le paquet

On reprend d'Astryx ses **noms** et ses **échelles** ; on n'installe pas
`@astryxdesign/core` (StyleX y est une dépendance obligatoire, le parc est en
Tailwind sur un socle commun, et la règle 3 du parc refuse une seconde
bibliothèque de composants — même choix que mister-uwh-tactic).

- **Une source** : `src/astryx.css`. Les couleurs, tailles, rayons, ombres,
  délais et calques n'existent que là ; `style.css` ne contient que des `var()`.
- **Un garde** : `src/astryx.test.ts` refuse une taille de texte, une couleur ou
  un rayon écrit en dur dans `style.css` (hors impression).
- Les composants du socle suivent : le contrat `--dwc-*` est branché sur les
  rôles d'Astryx (`src/tailwind.css`).
- Les anciens noms (`--accent`, `--text-sm`…) restent en alias, sans valeur,
  le temps que chaque règle soit réécrite.

## Typography

| Rôle                | Police            | Notes                 |
| ------------------- | ----------------- | --------------------- |
| UI                  | **IBM Plex Sans** | 400 / 500 / 600 / 700 |
| Codes, pourcentages | **IBM Plex Mono** | tabular-nums          |

Écart assumé : Astryx a une pile système ; un thème Astryx choisit ses polices,
celui-ci garde IBM Plex.

**Sept styles nommés, rien d'autre** (base 14 px, rapport 1,2) :
`heading-1` 24 · `heading-2` 20 · `heading-3` 17 · `heading-4` 14 semi-gras ·
`body` 14 · `label` 14 moyen · `supporting` 12. **Au doigt** (`pointer: coarse`),
`body`, `label` et `heading-4` passent à 16 px et `supporting` à 13, comme le
thème Neutral d'Astryx. Titres en casse de phrase : plus de capitales espacées.

## Color

Les rôles d'Astryx (`--color-<élément>-<rôle>`), valeurs neutres d'Astryx pour
les surfaces, encres et bordures ; l'accent reste le teal de la marque.

| Rôle                         | Clair     | Sombre    |
| ---------------------------- | --------- | --------- |
| `--color-background-body`    | `#f1f4f7` | `#111112` |
| `--color-background-surface` | `#ffffff` | `#1f1f22` |
| `--color-text-primary`       | `#0a1317` | `#dfe2e5` |
| `--color-text-secondary`     | `#445564` | `#b0b5bb` |
| `--color-accent`             | `#0b6e6a` | `#2dd4bf` |
| `--color-border-emphasized`  | `#7a8794` | `#7c838c` |

Écart assumé : la bordure accentuée d'Astryx (`#CCD3DB`) tient 1,5:1 ; le
pourtour d'un champ en exige 3 (WCAG 1.4.11). Pas de dégradés, pas de glow.

## Layout — les régions d'Astryx

| Fenêtre                           | Disposition | Ce qu'on voit                                                                             |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| **< 768 px, ou < 500 px de haut** | compacte    | Une région à la fois, choisie par trois onglets : **Texte · Suggestions · Retenus**       |
| **768 – 1 023 px**                | moyenne     | Deux onglets à gauche (Texte · Suggestions), les retenus toujours visibles à droite       |
| **≥ 1 024 px**                    | large       | Trois colonnes qui remplissent la fenêtre ; chacune défile seule, son titre reste en haut |

- **L'analyse ouvre les suggestions** quand elles sont dans un onglet ; chaque
  onglet porte son compte (suggestions à trancher, codes retenus).
- **Les colonnes ne sont pas des cartes** : une région de page est un titre, de
  l'espace et une bordure (Astryx : la carte est réservée à un objet qu'on
  pourrait retirer seul — un diagnostic retenu en est une).
- Largeur utile jusqu'à 100 rem.

## Navigation

- **≥ 1 024 px** : Cotation / Paramètres / Aide dans la barre haute ; barre basse masquée.
- **En dessous** : la barre basse du socle (Cotation, Paramètres, Aide).
- La barre haute ne porte que la marque et la navigation : ni accroche, ni étapes.

## Trust bar

Une ligne de texte d'appoint, avec deux points d'état : référentiel local,
OMS (joignable / indisponible), seuil de confiance (en %, comme Paramètres),
données sur l'appareil. Pas de pilules : un badge ne se pose que sur un état qui
demande d'agir. Au bureau et à la tablette, au-dessus du travail ; au téléphone,
sous le compte-rendu.

L'avertissement (« Suggestions indicatives… ATIH ») est un **bandeau
d'information** d'Astryx, masquable ; au téléphone, en tête de l'onglet
Suggestions.

## Components / patterns

| Pattern          | Règle                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Bouton principal | **Un par vue** : Analyser (compte-rendu), Copier pour DPI (retenus)                        |
| Valider          | Bouton secondaire à l'accent : neuf principaux n'en feraient plus aucun                    |
| Contrôles        | 32 px à la souris (`--size-element-md`), **44 px au doigt** (écart : Astryx s'arrête à 36) |
| Suggestion       | Une ligne de liste : code + libellé, puis confiance et terme repéré, puis les gestes       |
| Confiance        | Bord de début coloré + jauge + texte (jamais la couleur seule)                             |
| Export           | « Copier pour DPI » seul en évidence ; fichiers et envoi sous « Autres formats »           |
| Retenus          | Liste → export → « Ajouter un code » (recherche, favoris, saisie)                          |
| Rayons           | `inner` 4 · `element` 8 · `container` 12 · `full`                                          |
| BrandMark        | Croix médicale, fond navy, accent **teal**                                                 |

## Motion

- `--duration-fast` (175 ms), courbe `--ease-standard` d'Astryx
- `prefers-reduced-motion` : toutes les durées à 0
- Pas d'animations décoratives ; pulse micro uniquement pendant la dictée

## Anti-patterns (refusés)

- Une valeur visuelle écrite ailleurs que dans `astryx.css`
- Une région de page habillée en carte ; des cartes dans des cartes
- Plusieurs boutons principaux dans une même vue
- Une rangée de boutons d'export tous égaux, ou affichés grisés sur une liste vide
- Titres en capitales espacées
- Bottom-nav seule sur grand écran
- Happy talk / onboarding long devant le geste Analyser

## Sources

- Astryx : <https://astryx.atmeta.com/>, dépôt `meta/astryx`
  (`packages/core/src/theme/tokens.stylex.ts` pour les valeurs).
- Maquette d'origine : `~/.gstack/projects/mister-cim10/designs/enterprise-ux-20261003/`, variante **A**.
