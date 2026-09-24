import { useI18n } from '../i18n';

/**
 * La mention de confidentialité : aucune donnée clinique sur nos serveurs, et
 * ce qui part vers la passerelle OMS quand elle répond.
 *
 * SON PROPRE FICHIER, pour une raison de règle et non de goût. Le pied de page
 * (`AppFooter`) la porte avec les liens de la famille, que la règle du
 * 06/09/2026 réserve à l'accueil et aux Réglages. L'Aide garde la mention sans
 * les liens : ce que l'app fait des comptes-rendus mérite d'être dit partout
 * où on l'explique. Exportée depuis le fichier du pied de page, `pwa-doctor`
 * aurait relié l'Aide aux liens par cet export.
 */
export function PrivacyNotice() {
  const { t } = useI18n();
  return <p className="footer-privacy">{t('footer.privacy')}</p>;
}
