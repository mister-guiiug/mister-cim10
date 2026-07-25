import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { BottomNav } from './components/BottomNav';
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
      <BottomNav />
    </>
  );
}
