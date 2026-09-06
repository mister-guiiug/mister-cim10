import { AppFooter as SocleAppFooter } from '@mister-guiiug/dev-pwa-config/react/app-footer';
import {
  SPONSOR_URL,
  repoUrl,
} from '@mister-guiiug/dev-pwa-config/apps-catalog';
import { useI18n } from '../i18n';

/**
 * Pied de page : les deux liens famille viennent du socle, la mention de
 * confidentialité reste ici.
 *
 * CE QUE LE SOCLE APPORTE. Les liens externes sécurisés (`target="_blank"` +
 * `rel="noopener noreferrer"`), les icônes GitHub et café — le SVG GitHub de
 * 700 caractères recopié ici est retiré — et les URL tirées du catalogue
 * famille au lieu d'être codées en dur : `repoUrl('mister-cim10')` rend
 * exactement `https://github.com/mister-guiiug/mister-cim10`, et `SPONSOR_URL`
 * la même adresse Buy Me a Coffee qu'auparavant.
 *
 * CE QUI RESTE LOCAL, et pourquoi :
 *   - la mention de confidentialité (« aucune donnée clinique… »), propre à
 *     l'app et que le composant partagé ne rend pas ;
 *   - les libellés, passés en props : l'app dit « Code source sur GitHub » et
 *     « ☕ Buy me a coffee », pas les « Code source » / « M'offrir un café »
 *     du socle ;
 *   - l'habillage en pastilles (`style.css`), retargeté sur les attributs
 *     `[data-dwc="footer-…"]`. Le socle livre la structure, l'app garde son
 *     univers.
 *
 * POURQUOI UN `<div>` ENVELOPPE ET NON UN `<footer>` : le composant du socle
 * rend déjà un `<footer>`, et le modèle de contenu de `footer` interdit un
 * `footer` descendant. Même forme que mister-molkky, mister-qowa et
 * miss-lookhouse.
 */
export function AppFooter() {
  const { t } = useI18n();
  return (
    <div className="app-footer">
      <p className="footer-privacy">{t('footer.privacy')}</p>
      <SocleAppFooter
        version
        issues
        className="footer-actions"
        repoUrl={repoUrl('mister-cim10')}
        sponsorUrl={SPONSOR_URL}
        sourceLabel={t('footer.source')}
        sponsorLabel={t('footer.coffee')}
      />
    </div>
  );
}
