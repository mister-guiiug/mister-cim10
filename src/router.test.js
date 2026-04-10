import { describe, it, expect, afterEach } from 'vitest';
import { getRoute, hrefForRoute, getDocumentTitle, ROUTE_META } from './router.js';

describe('hrefForRoute', () => {
  it('retourne #/ pour accueil', () => {
    expect(hrefForRoute('home')).toBe('#/');
  });
  it('retourne #/parametres', () => {
    expect(hrefForRoute('parametres')).toBe('#/parametres');
  });
});

describe('getDocumentTitle', () => {
  it('couvre toutes les routes du registre', () => {
    for (const key of Object.keys(ROUTE_META)) {
      const t = getDocumentTitle(/** @type {any} */ (key));
      expect(t.length).toBeGreaterThan(3);
    }
  });
});

describe('getRoute', () => {
  const original = window.location.hash;

  afterEach(() => {
    window.location.hash = original;
  });

  it('détecte parametres', () => {
    window.location.hash = '#/parametres';
    expect(getRoute()).toBe('parametres');
  });

  it('ignore la query string dans le hash', () => {
    window.location.hash = '#/parametres?cfg=abc';
    expect(getRoute()).toBe('parametres');
  });

  it('détecte aide', () => {
    window.location.hash = '#/aide';
    expect(getRoute()).toBe('aide');
  });

  it('défaut accueil pour hash vide ou inconnu', () => {
    window.location.hash = '';
    expect(getRoute()).toBe('home');
    window.location.hash = '#/foo';
    expect(getRoute()).toBe('home');
  });
});
