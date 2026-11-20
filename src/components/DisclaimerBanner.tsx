import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../i18n';

/**
 * L'AVERTISSEMENT ATIH, en bandeau d'information au sens d'Astryx : un titre
 * court qui dit le statut (« Suggestions indicatives »), une phrase, une croix.
 * Masquable, parce qu'un bandeau d'information se ferme ; le rappel reste
 * dans l'Aide et dans chaque export. Il vivait dans l'en-tête, en troisième
 * bandeau avant le travail.
 */
export function DisclaimerBanner() {
  const dismissed = useSettingsStore(s => s.disclaimerDismissed);
  const dismiss = useSettingsStore(s => s.dismissDisclaimer);
  const { t } = useI18n();
  if (dismissed) return null;
  return (
    <div className="banner banner--info" role="note">
      <svg
        className="banner-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <p className="banner-text">
        <strong className="banner-title">{t('home.disclaimerTitle')}</strong>{' '}
        {t('home.disclaimerBody')}
      </p>
      <button
        type="button"
        className="ghost icon-btn banner-dismiss"
        aria-label={t('home.disclaimerHide')}
        onClick={dismiss}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
