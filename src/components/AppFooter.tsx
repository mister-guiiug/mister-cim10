import { AppFooter as SocleAppFooter } from '@mister-guiiug/dev-pwa-config/react/app-footer';
import {
  SPONSOR_URL,
  repoUrl,
} from '@mister-guiiug/dev-pwa-config/apps-catalog';
import { useI18n } from '../i18n';
import { PrivacyNotice } from './PrivacyNotice';

/**
 * LE PIED DE PAGE : ce que l'app fait des comptes-rendus, puis les liens.
 *
 * CE QUE LE SOCLE APPORTE. Les liens externes sécurisés, les icônes, les URL
 * tirées du catalogue famille (`repoUrl('mister-cim10')`, `SPONSOR_URL`), et
 * depuis 6.34 « Signaler un problème » et « Proposer une idée », préremplis.
 *
 * LA MENTION DE CONFIDENTIALITÉ PASSE DANS LE `<footer>` (prop `children`,
 * rendue avant les liens). Elle était posée à côté, dans un `<div>`, hors du
 * repère « informations de contenu » que lisent les lecteurs d'écran, et en
 * corps de texte : la plus grosse chose du pied de page était sa note.
 *
 * LA VERSION REVIENT, sans le lien mort. Le numéro renvoyait à
 * `releases/tag/vX.Y.Z`, et aucune app du parc ne crée de tag : 404 garanti,
 * d'où son retrait. Elle renvoie maintenant aux commits de `main`, et dit la
 * date du build et le commit — ce qu'on demande d'abord à qui signale un
 * problème. Le bandeau de mise à jour reste le seul à annoncer une nouvelle
 * version (`updates: false`).
 */
export function AppFooter() {
  const { t } = useI18n();
  const depot = repoUrl('mister-cim10');
  return (
    <div className="app-footer">
      <SocleAppFooter
        issues
        className="footer-actions"
        repoUrl={depot}
        sponsorUrl={SPONSOR_URL}
        sourceLabel={t('footer.source')}
        sponsorLabel={t('footer.coffee')}
        version={{
          details: true,
          updates: false,
          releaseUrl: `${depot}/commits/main`,
        }}
      >
        <PrivacyNotice />
      </SocleAppFooter>
    </div>
  );
}
