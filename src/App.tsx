import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import type { AppRoute } from './types/index';

function pathToRoute(pathname: string): AppRoute {
  const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (segment === 'parametres') return 'parametres';
  if (segment === 'aide') return 'aide';
  return 'home';
}

const ROUTE_TITLES: Record<AppRoute, string> = {
  home: 'Mister CIM-10',
  parametres: 'Paramètres — Mister CIM-10',
  aide: 'Aide — Mister CIM-10',
};

export function App() {
  const location = useLocation();

  useEffect(() => {
    const route = pathToRoute(location.pathname);
    document.title = ROUTE_TITLES[route];
    const main = document.getElementById('main-content');
    if (main) {
      requestAnimationFrame(() => main.focus({ preventScroll: false }));
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/parametres" element={<SettingsPage />} />
      <Route path="/aide" element={<HelpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
