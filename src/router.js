/** @typedef {'home' | 'parametres' | 'aide'} AppRoute */

/**
 * Métadonnées par route (titres, chemins hash). Pour ajouter une page : étendre ce registre + `getRoute`.
 * @type {Record<AppRoute, { documentTitle: string }>}
 */
export const ROUTE_META = {
  home: { documentTitle: 'Mister CIM-10' },
  parametres: { documentTitle: 'Paramètres — Mister CIM-10' },
  aide: { documentTitle: 'Aide — Mister CIM-10' },
};

/** @param {AppRoute} route */
export function getDocumentTitle(route) {
  const m = ROUTE_META[route];
  return m ? m.documentTitle : ROUTE_META.home.documentTitle;
}

/** @returns {AppRoute} */
export function getRoute() {
  const pathOnly = (location.hash || '').replace(/^#\/?/, '').split('?')[0] || '';
  const raw = pathOnly.split('/')[0] || '';
  if (raw === 'parametres') return 'parametres';
  if (raw === 'aide') return 'aide';
  return 'home';
}

/** @param {AppRoute} route */
export function hrefForRoute(route) {
  if (route === 'home') return '#/';
  return `#/${route}`;
}

/**
 * @param {() => void} onChange
 * @returns {() => void} cleanup
 */
export function startRouter(onChange) {
  const handler = () => onChange();
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
