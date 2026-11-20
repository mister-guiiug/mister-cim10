import { create } from 'zustand';

/**
 * LA RÉGION AFFICHÉE quand l'écran n'en montre qu'une ou deux (Astryx : trois
 * régions dès 1 024 px, deux dès 768, une en dessous). Pas de persistance :
 * on rouvre l'application sur le compte-rendu, c'est par là qu'on commence.
 */
export type Vue = 'cr' | 'suggestions' | 'retenus';

interface VueState {
  vue: Vue;
  setVue: (vue: Vue) => void;
}

export const useVueStore = create<VueState>(set => ({
  vue: 'cr',
  setVue: vue => set({ vue }),
}));
