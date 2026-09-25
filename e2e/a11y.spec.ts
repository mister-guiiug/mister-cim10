// Suite a11y minimale (axe-core + Playwright) — template dev-pwa-config.
// Le tag @a11y permet de filtrer : `playwright test --grep @a11y`.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoA11yViolations } from '@mister-guiiug/dev-pwa-config/playwright-a11y';

test.describe('@a11y accessibilité', () => {
  test("page d'accueil sans violation WCAG A/AA", async ({ page }) => {
    await page.goto('/');
    await expectNoA11yViolations(page, AxeBuilder, expect);
  });

  /**
   * La page vide ne montre presque rien de ce qui s'est ajouté depuis : les
   * gestes sur les retenus (étoile, Monter / Descendre, Modifier), Annuler /
   * Rétablir, le panneau des favoris et le formulaire de saisie avec son
   * contrôle de format. On les fait paraître, PUIS on passe axe.
   */
  test('retenus, favoris et saisie contrôlée sans violation WCAG A/AA', async ({
    page,
  }) => {
    await page.goto('/');
    const recherche = page.getByRole('searchbox', {
      name: /chercher un code|search an icd-10 code/i,
    });
    await recherche.fill('diabète');
    const ligne = page
      .getByRole('list', {
        name: /résultats de la recherche|code search results/i,
      })
      .getByRole('listitem')
      .filter({ hasText: 'E11.9' });
    await ligne.getByRole('button', { name: /^(ajouter|add)$/i }).click();
    await ligne
      .getByRole('button', { name: /^(favori|favorite) E11\.9$/i })
      .click();
    await recherche.fill('hypertension');
    await page
      .getByRole('list', {
        name: /résultats de la recherche|code search results/i,
      })
      .getByRole('listitem')
      .filter({ hasText: 'I10' })
      .getByRole('button', { name: /^(ajouter|add)$/i })
      .click();
    await recherche.fill('');

    await page.locator('.favorites-block > summary').click();
    await page
      .getByRole('button', {
        name: /ajouter un code manuellement|add a code manually/i,
      })
      .click();
    const code = page.getByRole('textbox', {
      name: /code cim-10|icd-10 code/i,
    });
    await code.fill('e118');
    await code.blur();

    await expectNoA11yViolations(page, AxeBuilder, expect);
  });
});
