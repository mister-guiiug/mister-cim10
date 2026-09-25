import type { Ref } from 'react';
import { useI18n } from '../../i18n';

interface BoutonDicteeProps {
  /** La dictée est demandée : préparation ou écoute. */
  actif: boolean;
  /** Le micro est ouvert. */
  ecoute: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Le bouton « Dictée », et lui seul.
 *
 * IL VIT DANS LE MORCEAU D'ENTRÉE, et c'est tout ce qui y vit de la dictée. La
 * logique, l'état et l'accord arrivent à la demande (`Dictation.tsx`) : il
 * fallait pourtant un bouton dès le premier affichage, puisqu'il n'est rendu
 * que si l'API existe. La doublure d'avant le chargement et le bouton de la
 * dictée chargée sont donc CE composant, pour ne différer en rien.
 *
 * UN NOM FIXE ET `aria-pressed`, comme tout bouton bascule : l'état change,
 * pas l'action. Le second clic arrête — ou abandonne la préparation.
 */
export function BoutonDictee({
  actif,
  ecoute,
  onClick,
  ref,
}: BoutonDicteeProps) {
  const { t } = useI18n();
  return (
    <button
      ref={ref}
      type="button"
      className={`mic${ecoute ? ' listening' : ''}`}
      aria-pressed={actif}
      title={actif ? t('dictation.titleStop') : t('dictation.titleStart')}
      onClick={onClick}
    >
      <svg
        className="mic-icon"
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" />
        <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2.5M5.5 15h5" />
      </svg>
      {t('dictation.button')}
    </button>
  );
}
