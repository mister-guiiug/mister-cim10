import { useMediaQuery } from '@mister-guiiug/dev-pwa-config/react/use-media-query';
import type { Vue } from '../../store/vueStore';

/**
 * LES TROIS DISPOSITIONS D'ASTRYX. « Compacte » quand la fenêtre a moins de
 * 768 px de large OU moins de 500 de haut (un téléphone en paysage reste un
 * téléphone) : une région à la fois, choisie par des onglets. « Moyenne » dès
 * 768 : le travail à gauche (compte-rendu OU suggestions), les retenus à
 * droite. « Large » dès 1 024 : les trois colonnes côte à côte.
 */
export type Disposition = 'compacte' | 'moyenne' | 'large';

export function useDisposition(): Disposition {
  const moyenne = useMediaQuery('(min-width: 768px)');
  const large = useMediaQuery('(min-width: 1024px)');
  const basse = useMediaQuery('(max-height: 499.98px)');
  if (basse || !moyenne) return 'compacte';
  return large ? 'large' : 'moyenne';
}

/** Les régions que des onglets choisissent, selon la disposition. */
export function regionsEnOnglets(disposition: Disposition): Vue[] {
  if (disposition === 'compacte') return ['cr', 'suggestions', 'retenus'];
  if (disposition === 'moyenne') return ['cr', 'suggestions'];
  return [];
}

/**
 * La région réellement affichée parmi celles en onglets : en disposition
 * moyenne, les retenus sont toujours visibles à droite, et un onglet
 * « Retenus » choisi au téléphone se lit comme les suggestions.
 */
export function vueAffichee(disposition: Disposition, vue: Vue): Vue {
  return disposition === 'moyenne' && vue === 'retenus' ? 'suggestions' : vue;
}
