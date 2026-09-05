import { useEffect, type ReactNode } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { BottomNav } from '@mister-guiiug/dev-pwa-config/react/bottom-nav';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { useI18n } from './i18n';
import type { AppRoute } from './types/index';

function pathToRoute(pathname: string): AppRoute {
  const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (segment === 'parametres') return 'parametres';
  if (segment === 'aide') return 'aide';
  return 'home';
}

const ROUTE_TITLE_KEY: Record<
  AppRoute,
  'doc.home' | 'doc.settings' | 'doc.help'
> = {
  home: 'doc.home',
  parametres: 'doc.settings',
  aide: 'doc.help',
};

const HomeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const SettingsIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);

const HelpIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4" />
    <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
  </svg>
);

/**
 * Les trois destinations de la barre basse. La barre vient du socle
 * (structure, `aria-current`, « Page actuelle » lu) ; les routes, icônes et
 * libellés restent déclarés ici, au seul endroit qui les connaît.
 */
const NAV_ITEMS: Array<{
  to: string;
  labelKey: 'nav.home' | 'nav.settings' | 'nav.help';
  end: boolean;
  icon: ReactNode;
}> = [
  { to: '/', labelKey: 'nav.home', end: true, icon: HomeIcon },
  {
    to: '/parametres',
    labelKey: 'nav.settings',
    end: false,
    icon: SettingsIcon,
  },
  { to: '/aide', labelKey: 'nav.help', end: false, icon: HelpIcon },
];

export function App() {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const route = pathToRoute(location.pathname);
    document.title = t(ROUTE_TITLE_KEY[route]);
    const main = document.getElementById('main-content');
    if (main) {
      requestAnimationFrame(() => main.focus({ preventScroll: false }));
    }
  }, [location, t]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/parametres" element={<SettingsPage />} />
        <Route path="/aide" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav
        className="bottom-nav"
        label={t('nav.primary')}
        // HashRouter : `window.location.pathname` ne bouge jamais — le chemin
        // courant vient du routeur, et le socle calcule l'état actif.
        currentPath={location.pathname}
        items={NAV_ITEMS.map(({ to, labelKey, end, icon }) => ({
          href: to,
          label: t(labelKey),
          icon,
          end,
        }))}
        // Le socle 3.32.0 a élargi `linkComponent` à `ComponentType<any>` :
        // le type refusait jusque-là tout composant à prop OBLIGATOIRE, donc
        // précisément `Link` et son `to` — l'usage que sa propre documentation
        // donne en exemple. Cinq apps portaient la même conversion.
        //
        // `Link` plutôt que `NavLink` : l'état actif (aria-current,
        // data-current) est déjà calculé par le socle, inutile deux fois.
        linkComponent={Link}
        hrefProp="to"
      />
    </>
  );
}
