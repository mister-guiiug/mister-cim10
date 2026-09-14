/**
 * Rend les deux images sans coin transparent : le maskable Android (512) et
 * l'icône d'accueil iOS (180), depuis `public/icon-maskable.svg`.
 *
 * POURQUOI UN SVG À PART, ET PLUS UNE CHAÎNE DANS LE SCRIPT. `generate-icons.mjs`
 * fabriquait le maskable en RÉÉCRIVANT le dessin, en dur, dans un gabarit de
 * chaîne — une deuxième copie de la croix, des pastilles et des deux dégradés,
 * qui n'avait aucun moyen de suivre `favicon.svg`. Le dessin vit maintenant
 * dans un fichier, et le commentaire de ce fichier dit ce qui l'écarte de la
 * source : les coins du fond, et le voile de brillance.
 *
 * POURQUOI L'ICÔNE APPLE EST ICI. Elle n'était produite par RIEN. Le script ne
 * la listait pas, aucun autre ne l'écrivait : `public/apple-touch-icon.png`
 * était un fichier orphelin, que plus personne ne pouvait régénérer à
 * l'identique. Elle sort désormais de la même source que le maskable.
 *
 * iOS n'accepte pas la transparence pour l'icône d'accueil : il comble
 * lui-même ce qui en porte, historiquement par du noir. Une source à fond perdu
 * n'a aucun coin à combler — et c'est aussi pourquoi `npm run icons` porte
 * `--no-apple` : le générateur du socle l'écrirait par défaut, aplatie sur son
 * `--bg`.
 *
 * Aucune réduction : sans le voile de brillance, le dessin tient dans la zone
 * de sécurité — pastilles à 24,0 pour une limite à 25,6 en repère 64.
 *
 * Exécuter : npm run icons:maskable
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

// `density` : sans elle, sharp pixellise le SVG à 72 ppp AVANT de
// redimensionner, et les dégradés en ressortent bandés.
const rend = (taille, nom) =>
  sharp(join(racine, 'public', 'icon-maskable.svg'), { density: 384 })
    .resize(taille, taille)
    .png()
    .toFile(join(racine, 'public', nom));

await rend(512, 'icon-maskable-512.png');
await rend(180, 'apple-touch-icon.png');

console.log(
  'public/icon-maskable-512.png (512×512) et public/apple-touch-icon.png (180×180) écrits, à fond perdu.'
);
