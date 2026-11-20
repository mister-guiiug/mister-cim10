import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { useI18n } from '../i18n';
import type { AppRoute } from '../types/index';

function pathToRoute(pathname: string): AppRoute {
  const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (segment === 'parametres') return 'parametres';
  if (segment === 'aide') return 'aide';
  return 'home';
}

/**
 * LA BARRE HAUTE, ET RIEN D'AUTRE : la marque, puis la navigation au bureau.
 *
 * Elle portait aussi l'accroche, les étapes 1 → 2 → 3, l'avertissement et la
 * barre d'état : 230 px avant le premier champ. Les étapes sont devenues les
 * onglets de l'espace de travail (au téléphone) et les titres numérotés de ses
 * colonnes (au bureau) ; l'avertissement et l'état, une ligne au-dessus du
 * travail, sur l'accueil seulement.
 */
export function AppHeader() {
  const location = useLocation();
  const route = pathToRoute(location.pathname);
  const isHome = route === 'home';
  const { t } = useI18n();

  const lien = (cible: AppRoute, to: string, libelle: string) => (
    <Link
      to={to}
      className={
        route === cible ? 'app-top-nav-link is-current' : 'app-top-nav-link'
      }
      aria-current={route === cible ? 'page' : undefined}
    >
      {libelle}
    </Link>
  );

  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <Link to="/" className="brand-link">
          <BrandMark />
          {/* Le `h1` de l'accueil : celui que lisent les moteurs et les
              lecteurs d'écran. Ailleurs, chaque page porte le sien. */}
          {isHome ? (
            <h1 className="app-title">Mister CIM-10</h1>
          ) : (
            <p className="app-title">Mister CIM-10</p>
          )}
        </Link>
        <nav className="app-top-nav" aria-label={t('nav.primary')}>
          {lien('home', '/', t('nav.home'))}
          {lien('parametres', '/parametres', t('nav.settings'))}
          {lien('aide', '/aide', t('nav.help'))}
        </nav>
      </div>
    </header>
  );
}
