/**
 * Opérations pures sur la liste des diagnostics retenus.
 *
 * L'ORDRE EST UNE DONNÉE. C'est celui des exports (texte, CSV, JSON), de la
 * copie et de l'impression — et, en PMSI, le rang d'un diagnostic n'est pas
 * indifférent. Le déplacement vit donc ici, testé seul, et le magasin ne fait
 * que l'appeler.
 */

/**
 * La liste où l'élément `id` a avancé de `delta` places (`-1` : vers le haut),
 * ou `null` si le geste est impossible — élément introuvable, ou déjà au bord.
 * `null` et non la liste inchangée : l'appelant n'enregistre pas dans
 * l'historique un geste qui n'a rien fait.
 */
export function deplacer<T extends { id: string }>(
  liste: readonly T[],
  id: string,
  delta: number
): T[] | null {
  const depart = liste.findIndex(e => e.id === id);
  if (depart === -1 || delta === 0) return null;
  const arrivee = depart + delta;
  if (arrivee < 0 || arrivee >= liste.length) return null;
  const copie = [...liste];
  const [element] = copie.splice(depart, 1);
  copie.splice(arrivee, 0, element as T);
  return copie;
}

/**
 * La liste où l'élément `id` a reçu `correctif`, À SA PLACE. `null` si
 * l'élément est introuvable ou si rien ne change.
 */
export function remplacer<T extends { id: string }>(
  liste: readonly T[],
  id: string,
  correctif: Partial<Omit<T, 'id'>>
): T[] | null {
  const index = liste.findIndex(e => e.id === id);
  if (index === -1) return null;
  const courant = liste[index] as T;
  const suivant = { ...courant, ...correctif };
  const change = (Object.keys(correctif) as (keyof T)[]).some(
    cle => courant[cle] !== suivant[cle]
  );
  if (!change) return null;
  const copie = [...liste];
  copie[index] = suivant;
  return copie;
}
