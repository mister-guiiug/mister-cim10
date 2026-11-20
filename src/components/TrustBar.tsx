import { useOnline } from '@mister-guiiug/dev-pwa-config/react/use-online';
import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../i18n';

/**
 * QUEL RÉFÉRENTIEL RÉPOND, ET OÙ RESTENT LES DONNÉES — sans ouvrir Paramètres.
 *
 * Une ligne de texte d'appoint et deux points d'état, plus des pilules : un
 * badge, dit Astryx, ne se pose que sur un état qui demande d'agir, et « le
 * référentiel local est prêt » est l'état normal. Le point vert n'est que
 * redondant avec le texte, jamais seul porteur du sens.
 */
export function TrustBar() {
  const isOnline = useOnline();
  const who = useSettingsStore(s => s.who);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const { t } = useI18n();

  const omsJoignable = isOnline && who.proxyUrl.trim() !== '';

  return (
    <div className="trust-bar" role="status" aria-label={t('trust.label')}>
      <span className="trust-item">
        <span className="status-dot status-dot--ok" aria-hidden="true" />
        {t('trust.localReady')}
      </span>
      <span className="trust-item">
        <span
          className={
            omsJoignable
              ? 'status-dot status-dot--ok'
              : 'status-dot status-dot--warn'
          }
          aria-hidden="true"
        />
        {omsJoignable ? t('trust.omsReady') : t('trust.omsUnavailable')}
      </span>
      {/* Le seuil est rangé en fraction (0,4) : l'afficher tel quel donnait
          « Seuil ≥ 0.4 % » à côté des « 40 % » de Paramètres. */}
      <span className="trust-item">
        {t('trust.threshold', {
          pct: String(Math.round(minConfidence * 100)),
        })}
      </span>
      <span className="trust-item trust-item--end">{t('trust.privacy')}</span>
    </div>
  );
}
