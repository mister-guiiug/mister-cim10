/**
 * Tests E2E critiques pour mister-cim10
 */

import { test, expect } from '@playwright/test';

test.describe('mister-cim10 - Fonctionnalités critiques @critical', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test("page d'accueil se charge correctement", async ({ page }) => {
    await expect(
      page.locator('h1, h2, main, #app, body').first()
    ).toBeVisible();
  });

  /**
   * LE PARCOURS QUI MANQUAIT : coter un terme ABSENT du compte-rendu.
   *
   * Rien n'est saisi dans le compte-rendu, rien n'est analysé — c'est tout
   * l'intérêt. On tape « diabète » dans la recherche de code, on ajoute E11.9
   * aux diagnostics retenus, et on l'exporte. Sans passer par « Analyser »,
   * ce parcours était impossible : le seul champ de l'écran filtrait des
   * suggestions qui n'existaient pas.
   *
   * Les assertions ne dépendent d'aucune classe CSS : rôles et libellés
   * accessibles seulement. Un test qui interroge `.result, .entry, [data-code]`
   * — trois sélecteurs dont aucun n'existe dans cette application — passe quoi
   * qu'il arrive, et c'est ce que faisait la version précédente de ce test.
   */
  test('recherche d’un code par libellé, puis export @critical', async ({
    page,
  }) => {
    await page.goto('/');

    const searchInput = page.getByRole('searchbox', {
      name: /chercher un code|search an icd-10 code/i,
    });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('diabète');

    const results = page.getByRole('list', {
      name: /résultats de la recherche|code search results/i,
    });
    await expect(results).toBeVisible();
    const ligneE11 = results.getByRole('listitem').filter({ hasText: 'E11.9' });
    await expect(ligneE11).toHaveCount(1);

    await ligneE11.getByRole('button').click();

    // Le code est passé dans les diagnostics retenus…
    const retenus = page.locator('.panel--validated');
    await expect(retenus.getByText('E11.9').first()).toBeVisible();
    // …et le bouton de la ligne de recherche dit qu'il y est déjà.
    await expect(ligneE11.getByRole('button')).toBeDisabled();

    // …et l'export part avec lui.
    const downloadPromise = page.waitForEvent('download');
    await retenus
      .getByRole('button', { name: /texte \(\.txt\)|text \(\.txt\)/i })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^cim10-.*\.txt$/);
  });

  /**
   * « Retrouver le dossier d'hier » : enregistrer sous un nom, tout effacer,
   * rouvrir. Le compte-rendu doit revenir mot pour mot.
   */
  test('dossier enregistré, effacé, rouvert @critical', async ({ page }) => {
    await page.goto('/');

    const cr = page.getByRole('textbox', {
      name: /texte du compte-rendu|report text/i,
    });
    await cr.fill('Patient hypertendu suivi depuis 2019.');

    // Le bloc des dossiers est un <details> replié par défaut.
    await page.locator('.sessions-block > summary').click();

    await page
      .getByRole('textbox', { name: /nom du dossier|name of the case/i })
      .fill('séjour du 12/05');
    await page.getByRole('button', { name: /^(enregistrer|save)$/i }).click();

    await cr.fill('');
    await expect(cr).toHaveValue('');

    await page.getByRole('button', { name: /rouvrir|reopen/i }).click();
    // La confirmation vient du ConfirmDialog du socle, pas de `window.confirm`.
    await page.locator('[data-dwc="confirm-confirm"]').click();

    await expect(cr).toHaveValue('Patient hypertendu suivi depuis 2019.');
  });

  /**
   * Le canal de retour. Le lien du pied de page (socle `AppFooter issues`) doit
   * pointer sur le gabarit d'anomalie du compte ET arriver prérempli : sans la
   * version et l'environnement, la première réponse à tout signalement est
   * « quelle version ? ». Le lien est recalculé AU CLIC, on lit donc l'attribut
   * après avoir cliqué.
   */
  test('pied de page — « Signaler un problème » prérempli @critical', async ({
    page,
  }) => {
    await page.goto('/');

    const lien = page.locator('a[data-dwc="footer-issues"]').first();
    await expect(lien).toBeVisible();

    const href = await lien.getAttribute('href');
    expect(href).toContain(
      'https://github.com/mister-guiiug/mister-cim10/issues/new'
    );
    const params = new URL(href as string).searchParams;
    expect(params.get('template')).toBe('bug.yml');
    // La version qui tourne, et l'écran + le navigateur d'où part le rapport.
    expect(params.get('version')).toBeTruthy();
    expect(params.get('environnement')).toContain('écran');
  });

  test('navigation responsive', async ({ page }) => {
    // `body` est visible par construction : l'assertion précédente
    // (`body, main, #app`) passait sur n'importe quelle page, y compris une
    // page blanche. On interroge le plan de travail et la barre basse.
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('[data-dwc="bottom-nav"]')).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('[data-dwc="bottom-nav"]')).toBeVisible();
  });

  test('accessibilité - navigation clavier', async ({ page }) => {
    await page.goto('/');

    // Le premier Tab doit déplacer le focus hors du <body> : soit un élément
    // interactif (skip-link, bouton…), soit la zone de contenu focalisable
    // (<main tabindex="-1">, cible de skip-link — pattern a11y valide).
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe('BODY');
  });

  test('performance - chargement initial < 4s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(4000);
  });

  test('thème - toggle light/dark', async ({ page }) => {
    // Le bouton de thème vit désormais sur la page Paramètres (le drawer
    // de navigation a été remplacé par une BottomNav).
    await page.goto('/');
    await page
      .locator('a[href*="parametres"], a[href*="settings"]')
      .first()
      .click();

    const themeButton = page.locator('button[data-dwc="theme-toggle"]');
    await expect(themeButton).toBeVisible();

    // Le ThemeToggle du socle cycle clair → sombre → système : un clic change
    // toujours la préférence, donc le nom accessible recalculé du bouton
    // (3 libellés distincts). On vérifie le libellé (déterministe) plutôt que
    // data-theme, qui peut rester identique sur la transition système→clair
    // quand l'OS est déjà clair.
    const initialLabel = await themeButton.getAttribute('aria-label');
    await themeButton.click();
    const newLabel = await themeButton.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });

  test('paramètres - accès et navigation', async ({ page }) => {
    await page.goto('/');

    // Sans `if`, volontairement : le lien EXISTE (barre basse du socle). Une
    // condition ici ne protégeait de rien — elle transformait sa disparition
    // en test vert.
    await page
      .locator('a[href*="parametres"], a[href*="settings"]')
      .first()
      .click();
    await expect(page).toHaveURL(/parametres|settings/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  /**
   * Une recherche sans réponse doit LE DIRE. Un champ qui se vide en silence
   * laisse croire à une panne ; ici, le référentiel embarqué est un
   * échantillon, et c'est exactement ce que le message rappelle.
   */
  test('recherche - une requête sans réponse le dit @critical', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByRole('searchbox', {
        name: /chercher un code|search an icd-10 code/i,
      })
      .fill('xyz123abc456');

    await expect(
      page.getByText(
        /aucun code du référentiel embarqué|no code in the built-in reference/i
      )
    ).toBeVisible();
  });

  /**
   * Hors connexion, la recherche répond quand même : le dictionnaire CIM-10 est
   * EMBARQUÉ dans le bundle, il n'y a aucun appel réseau à faire. C'est la
   * promesse du README (« fonctionne hors connexion »), et l'assertion
   * précédente — `toHaveCount(await …count())` — était vraie par construction.
   */
  test('hors connexion - la recherche de code répond @critical', async ({
    page,
  }) => {
    await page.goto('/');
    await page.context().setOffline(true);

    await page
      .getByRole('searchbox', {
        name: /chercher un code|search an icd-10 code/i,
      })
      .fill('diabète');

    const results = page.getByRole('list', {
      name: /résultats de la recherche|code search results/i,
    });
    await expect(results.getByRole('listitem').first()).toBeVisible();
    await expect(
      results.getByRole('listitem').filter({ hasText: 'E11.9' })
    ).toHaveCount(1);
  });
});
