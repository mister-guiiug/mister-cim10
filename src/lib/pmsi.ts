import type { RolePmsi, ValidatedDiagnostic } from '../types/index';

/**
 * LE RÔLE D'UN DIAGNOSTIC DANS UN RÉSUMÉ PMSI.
 *
 * Un résumé d'hospitalisation porte UN diagnostic principal (DP), au plus un
 * diagnostic relié (DR), et des diagnostics associés significatifs (DAS). La
 * liste des retenus avait déjà un ordre (« l'ordre est une donnée », cf.
 * `diagnostics.ts`) ; il lui manquait de dire lequel est le DP — un
 * codeur DIM le recopiait à la main dans son logiciel.
 *
 * TOUT DIAGNOSTIC EST UN DAS TANT QU'ON NE DIT PAS AUTRE CHOSE. C'est la
 * sémantique du PMSI (ce qui est codé et n'est ni DP ni DR est associé), et
 * c'est surtout la seule valeur par défaut qui ne décide rien à la place du
 * professionnel : le DP n'est JAMAIS désigné d'office, même pour le premier
 * code retenu, qui peut très bien être un symptôme.
 */

/** Le rôle d'un diagnostic, `das` quand rien n'est dit (ou illisible). */
export function roleEffectif(v: Pick<ValidatedDiagnostic, 'role'>): RolePmsi {
  return v.role === 'dp' || v.role === 'dr' ? v.role : 'das';
}

/**
 * La liste est-elle un résumé PMSI ? Oui dès qu'un DP ou un DR y est désigné.
 *
 * C'est ce qui décide si les exports portent les rôles. Un médecin qui ne
 * fait que lister des codes n'a que faire d'une colonne « DAS » sur chaque
 * ligne ; celui qui a désigné un DP en a besoin partout.
 */
export function estResumePmsi(
  liste: readonly Pick<ValidatedDiagnostic, 'role'>[]
): boolean {
  return liste.some(v => roleEffectif(v) !== 'das');
}

/** L'abréviation imprimée dans les exports — un sigle français, en toute langue. */
export const SIGLE_ROLE: Record<RolePmsi, string> = {
  dp: 'DP',
  dr: 'DR',
  das: 'DAS',
};

/**
 * La liste où l'élément `id` a reçu le rôle `role`, ou `null` si rien ne
 * change (élément introuvable, ou rôle déjà le sien).
 *
 * UN SEUL DP, UN SEUL DR : désigner un DP rétrograde l'ancien en DAS, de même
 * pour le DR. Et le rôle PLACE le diagnostic : le DP passe en tête, le DR
 * juste après lui. L'ordre de la liste étant celui des exports, la liste
 * affichée reste ainsi le résumé tel qu'il partira — les flèches restent
 * libres ensuite.
 */
export function attribuerRole(
  liste: readonly ValidatedDiagnostic[],
  id: string,
  role: RolePmsi
): ValidatedDiagnostic[] | null {
  const cible = liste.find(v => v.id === id);
  if (!cible || roleEffectif(cible) === role) return null;

  const avecRoles = liste.map(v => {
    if (v.id === id) return { ...v, role };
    if (role !== 'das' && roleEffectif(v) === role)
      return { ...v, role: 'das' as const };
    return v;
  });
  if (role === 'das') return avecRoles;

  const element = avecRoles.find(v => v.id === id)!;
  const autres = avecRoles.filter(v => v.id !== id);
  const rang =
    role === 'dp' ? 0 : autres.findIndex(v => roleEffectif(v) === 'dp') + 1;
  autres.splice(rang, 0, element);
  return autres;
}
