import { useOnline } from '@mister-guiiug/dev-pwa-config/react/use-online';
import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../i18n';
import { SourceMark } from './SourceMark';

/**
 * QUEL RÉFÉRENTIEL RÉPOND, ET OÙ RESTENT LES DONNÉES — sans ouvrir Paramètres.
 *
 * Livre / nuage disent *quel* référentiel ; la couleur dit s'il répond. Le
 * texte reste le porteur du sens (Astryx) — l'icône ne fait que reconnaître.
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
        <span className="trust-source trust-source--cim10" aria-hidden="true">
          <SourceMark source="local" size={13} />
        </span>
        {t('trust.localReady')}
      </span>
      <span className="trust-item">
        <span
          className={
            omsJoignable
              ? 'trust-source trust-source--cim11'
              : 'trust-source trust-source--warn'
          }
          aria-hidden="true"
        >
          <SourceMark source="api" size={13} />
        </span>
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
