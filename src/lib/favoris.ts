/**
 * Les favoris : les codes qu'on cote tous les jours, à un geste des
 * diagnostics retenus.
 *
 * ILS NE SONT PAS UN HISTORIQUE, et c'est ce qui décide de la borne. Les
 * dossiers enregistrés font sortir le plus ancien quand la place manque ; un
 * favori, lui, a été CHOISI — le faire disparaître en silence parce qu'on en
 * a choisi un autre serait trahir ce choix. La liste pleine REFUSE donc, et le
 * dit.
 *
 * L'ORDRE EST CELUI DE LA CLASSIFICATION, pas celui de l'ajout : un code se
 * retrouve à la même place d'un jour à l'autre, et l'œil apprend où chercher.
 */
import type { FavoriteCode } from '../types/index';

/**
 * Au-delà de cent, une liste plate sans recherche cesse d'être un raccourci —
 * et la recherche de codes, elle, existe déjà.
 */
export const MAX_FAVORIS = 100;

export type ResultatBascule = 'ajoute' | 'retire' | 'plein';

/** Ordre de la classification (`E11.65` avant `E11.9`). */
export function trierFavoris(liste: readonly FavoriteCode[]): FavoriteCode[] {
  return [...liste].sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Met un code en favori, ou l'en retire s'il y était. Un code suffit à
 * identifier un favori : les formes CIM-10 et CIM-11 ne se chevauchent pas (la
 * seconde lettre d'un code CIM-11 est une lettre, jamais un chiffre).
 */
export function basculerFavori(
  liste: readonly FavoriteCode[],
  favori: Omit<FavoriteCode, 'addedAt'>,
  maintenant: number = Date.now()
): { favoris: FavoriteCode[]; resultat: ResultatBascule } {
  if (liste.some(f => f.code === favori.code)) {
    return {
      favoris: liste.filter(f => f.code !== favori.code),
      resultat: 'retire',
    };
  }
  if (liste.length >= MAX_FAVORIS) {
    return { favoris: [...liste], resultat: 'plein' };
  }
  return {
    favoris: trierFavoris([...liste, { ...favori, addedAt: maintenant }]),
    resultat: 'ajoute',
  };
}

function estObjet(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Relecture défensive d'une liste venue du stockage ou d'une sauvegarde :
 * écarte ce qui n'a pas de code ou de libellé, dédoublonne, borne, trie. Rend
 * `[]` sur tout ce qui n'est pas un tableau — un champ absent (instantané
 * d'avant les favoris) compris.
 */
export function favorisValides(value: unknown): FavoriteCode[] {
  if (!Array.isArray(value)) return [];
  const vus = new Set<string>();
  const favoris: FavoriteCode[] = [];
  for (const f of value) {
    if (!estObjet(f)) continue;
    if (typeof f.code !== 'string' || typeof f.label !== 'string') continue;
    if (f.code === '' || vus.has(f.code)) continue;
    vus.add(f.code);
    favoris.push({
      code: f.code,
      label: f.label,
      source: f.source === 'api' ? 'api' : 'local',
      addedAt: typeof f.addedAt === 'number' ? f.addedAt : 0,
    });
    if (favoris.length >= MAX_FAVORIS) break;
  }
  return trierFavoris(favoris);
}
