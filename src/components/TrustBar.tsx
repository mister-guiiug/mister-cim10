import { useOnline } from '@mister-guiiug/dev-pwa-config/react/use-online';
import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../i18n';

/**
 * Barre de confiance Clinical Console : le cotateur doit toujours savoir
 * quel référentiel répond et où restent les données — sans ouvrir Paramètres.
 */
export function TrustBar() {
  const isOnline = useOnline();
  const who = useSettingsStore(s => s.who);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const { t } = useI18n();

  const omsJoignable = isOnline && who.proxyUrl.trim() !== '';

  return (
    <div className="trust-bar" role="status" aria-label={t('trust.label')}>
      <span className="trust-pill">
        <span className="trust-dot trust-dot--ok" aria-hidden="true" />
        {t('trust.localReady')}
      </span>
      <span className="trust-pill">
        <span
          className={
            omsJoignable
              ? 'trust-dot trust-dot--ok'
              : 'trust-dot trust-dot--warn'
          }
          aria-hidden="true"
        />
        {omsJoignable ? t('trust.omsReady') : t('trust.omsUnavailable')}
      </span>
      <span className="trust-meta">
        {t('trust.threshold', { pct: String(minConfidence) })}
      </span>
      <span className="trust-meta trust-meta--end">{t('trust.privacy')}</span>
    </div>
  );
}
