# DESIGN.md — Mister CIM-10

Direction verrouillée : **Clinical Console** (variante A, 03/10/2026).

> Aide à la cotation CIM-10 pour professionnels de santé (médecins, DIM, TIM).
> Posture : logiciel métier dense et crédible, pas PWA « produit indie ».

## Memorable thing

« Un poste de cotation sérieux : on voit tout de suite où on en est, et on copie pour le DPI en un geste. »

## Visual thesis

Console clinique desktop-first : trois colonnes stables (compte-rendu → suggestions → retenus), chrome sombre, accent teal sobre, codes en mono. Peu d’ornement. La confiance (référentiel local / OMS / seuil) est permanente.

## Typography

| Rôle                 | Police                                        | Notes                 |
| -------------------- | --------------------------------------------- | --------------------- |
| UI                   | **IBM Plex Sans**                             | 400 / 500 / 600 / 700 |
| Codes, pourcentages  | **IBM Plex Mono**                             | tabular-nums          |
| Interdit en primaire | Inter, Roboto, Arial, DM Sans, system-ui seul |                       |

Échelle : conserver les tokens `--text-2xs` … `--text-2xl` de `src/style.css`.

## Color

### Clair

| Token                          | Valeur                          | Usage                           |
| ------------------------------ | ------------------------------- | ------------------------------- |
| `--bg`                         | `#e8eef5`                       | Fond page (ardoise claire)      |
| `--surface`                    | `#ffffff`                       | Panneaux                        |
| `--surface2`                   | `#d5dee9`                       | Bordures / surfaces secondaires |
| `--text`                       | `#0f172a`                       | Encre                           |
| `--muted`                      | `#5b6b7c`                       | Secondaire                      |
| `--accent`                     | `#0b6e6a`                       | CTA, liens actifs, marque       |
| `--accent-dim`                 | `#0a5c59`                       | Hover primary                   |
| `--ok` / `--warn` / `--danger` | verts / ambre / rouge cliniques | Confiance, alertes              |
| `--nav`                        | `#0b1f33`                       | Bandeau haut desktop            |

### Sombre

| Token       | Valeur    |
| ----------- | --------- |
| `--bg`      | `#0c1222` |
| `--surface` | `#151b2e` |
| `--accent`  | `#2dd4bf` |
| `--text`    | `#f1f5f9` |

Pas de dégradés violets, pas de glow marketing, pas de fond crème/terracotta.

## Layout

- **≥ 1280 px** : grille 3 colonnes `cr | suggestions | retenus` ; retenus sticky.
- **1024–1279 px** : 2 colonnes (travail empilé à gauche, retenus à droite).
- **&lt; 1024 px** : une colonne ; `BottomNav` fixe ; rappel « N retenus ».
- Largeur app : jusqu’à ~1400 px en console, plus le plafond historique 920 px.

## Navigation

- **Desktop (≥ 1024 px)** : liens Cotation / Paramètres / Aide dans le header ; barre basse masquée.
- **Mobile** : `BottomNav` du socle (Accueil → libellé Cotation).

## Trust bar

Sous le header, toujours visible sur l’accueil :

1. Statut CIM-10 local (prêt)
2. Statut OMS (joignable / indisponible)
3. Seuil de confiance
4. Rappel privacy (données sur l’appareil)

## Components / patterns

| Pattern           | Règle                                                            |
| ----------------- | ---------------------------------------------------------------- |
| Panneaux          | Surface blanche, bordure `--surface2`, radius **8px**            |
| CTA primaire      | Un par zone : Analyser · Valider · **Copier pour DPI**           |
| Export            | Presse-papiers = geste principal ; CSV/JSON/print secondaires    |
| Cartes suggestion | Bord gauche = niveau de confiance ; badge source CIM-10 / CIM-11 |
| BrandMark         | Croix médicale, fond navy, accent **teal** (aligné `--accent`)   |
| Workflow 1→2→3    | Compact dans le header accueil ; pas de setup guide              |

## Motion

- Transitions courtes (`--transition: 0.16s`)
- Respect `prefers-reduced-motion`
- Pas d’animations décoratives ; pulse micro uniquement pendant la dictée

## Anti-patterns (refusés)

- Bottom-nav seule sur grand écran
- Rangée de boutons d’export tous égaux
- Teal « glow » + cards trop arrondies (12–18px) comme identité
- Logo sky (`#38bdf8`) désaligné de l’accent UI
- Happy talk / onboarding long devant le geste Analyser

## Source maquette

`~/.gstack/projects/mister-cim10/designs/enterprise-ux-20261003/` — `approved.json` variante **A**.
