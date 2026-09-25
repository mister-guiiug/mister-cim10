/**
 * Les raccourcis clavier : lesquels, sur quelle plateforme, et où ils se
 * taisent.
 *
 * TROIS RÈGLES, ET CHACUNE A SA RAISON.
 *
 * 1. **La touche lue est `key`, pas `code`.** Sur un clavier AZERTY, le Z est
 *    là où le QWERTY a son W : `code` vaudrait `KeyW`. `key` rend ce qui est
 *    gravé sur la touche, et c'est elle que l'utilisateur presse.
 * 2. **Le modificateur suit la plateforme.** ⌘ sur Mac, Ctrl ailleurs. Et ⌘Y
 *    n'y est PAS « Rétablir » : Safari et Chrome y ouvrent l'historique, qu'on
 *    confisquerait.
 * 3. **Annuler / rétablir se taisent dans un champ de saisie.** Le
 *    compte-rendu a sa propre annulation, celle du navigateur ; la détourner
 *    vers la liste des diagnostics, c'est effacer le texte qu'on voulait
 *    récupérer.
 */

/** Ce qu'on lit d'un `KeyboardEvent` — assez pour un double de test. */
export interface ToucheLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  /** Composition en cours (saisie asiatique, touches mortes) : pas un raccourci. */
  isComposing?: boolean;
}

interface NavigateurLike {
  platform?: string;
  userAgentData?: { platform?: string };
}

/** Mac, iPhone, iPad : ⌘ plutôt que Ctrl. */
export function estApple(
  nav: NavigateurLike | undefined = globalThis.navigator as
    NavigateurLike | undefined
): boolean {
  const plateforme = nav?.userAgentData?.platform || nav?.platform || '';
  return /mac|iphone|ipad|ipod|ios/i.test(plateforme);
}

/**
 * Ctrl+Entrée — ⌘+Entrée sur Mac. Les deux modificateurs sont acceptés
 * partout : sur PC la touche Windows n'arrive jamais jusqu'à la page, et sur
 * Mac Ctrl+Entrée ne fait rien d'autre dans une zone de texte.
 */
export function estRaccourciAnalyse(touche: ToucheLike): boolean {
  return (
    touche.key === 'Enter' &&
    (touche.ctrlKey || touche.metaKey) &&
    !touche.shiftKey &&
    !touche.altKey &&
    touche.isComposing !== true
  );
}

export type ActionHistorique = 'annuler' | 'retablir';

/**
 * Ctrl+Z annule, Ctrl+Maj+Z et Ctrl+Y rétablissent (⌘Z et ⌘⇧Z sur Mac).
 * Alt exclu : Ctrl+Alt, c'est AltGr sur bien des claviers, et AltGr+Z y
 * produit un caractère.
 */
export function actionHistorique(
  touche: ToucheLike,
  apple: boolean
): ActionHistorique | null {
  if (touche.altKey || touche.isComposing === true) return null;
  if (!(apple ? touche.metaKey : touche.ctrlKey)) return null;
  const lettre = touche.key.toLowerCase();
  if (lettre === 'z') return touche.shiftKey ? 'retablir' : 'annuler';
  if (lettre === 'y' && !apple && !touche.shiftKey) return 'retablir';
  return null;
}

/** Les champs `<input>` où l'on ne tape pas de texte. */
const ENTREES_SANS_TEXTE = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/**
 * La cible d'une frappe est-elle un endroit où l'on écrit — donc où Ctrl+Z
 * appartient au navigateur ?
 */
export function estChampEditable(cible: EventTarget | null): boolean {
  if (cible === null || !('tagName' in cible)) return false;
  const element = cible as HTMLElement;
  const balise = element.tagName;
  if (balise === 'TEXTAREA') {
    const zone = element as HTMLTextAreaElement;
    return !zone.readOnly && !zone.disabled;
  }
  if (balise === 'INPUT') {
    const champ = element as HTMLInputElement;
    const type = (champ.getAttribute('type') ?? 'text').toLowerCase();
    return !ENTREES_SANS_TEXTE.has(type) && !champ.readOnly && !champ.disabled;
  }
  // `isContentEditable` n'existe pas dans jsdom : l'attribut, lui, se lit
  // partout, et un ancêtre éditable rend éditable tout ce qu'il contient.
  return (
    typeof element.closest === 'function' &&
    element.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}
