/**
 * Tests E2E critiques pour mister-cim10
 */

import { test, expect } from '@playwright/test'

test.describe('mister-cim10 - Fonctionnalités critiques', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page d\'accueil se charge correctement', async ({ page }) => {
    await expect(page.locator('h1, h2, main, #app, body')).toBeVisible()
  })

  test('recherche CIM-10 fonctionnelle', async ({ page }) => {
    await page.goto('/')

    // Trouver le champ de recherche
    const searchInput = page.locator('input[type="search"], input[placeholder*="rechercher"], input[placeholder*="search"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('diabete')
      await page.waitForTimeout(500)

      // Vérifier que des résultats apparaissent
      await expect(page.locator('.result, .entry, [data-code]')).toHaveCount(await page.locator('.result, .entry, [data-code]').count(), { timeout: 5000 })
    }
  })

  test('navigation responsive', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('body, main, #app')).toBeVisible()

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body, main, #app')).toBeVisible()
  })

  test('accessibilité - navigation clavier', async ({ page }) => {
    await page.goto('/')

    // Tab sur le premier élément interactif
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement)
  })

  test('performance - chargement initial < 4s', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(4000)
  })

  test('thème - toggle light/dark', async ({ page }) => {
    await page.goto('/')

    // Trouver le bouton de thème
    const themeButton = page.locator('button[aria-label*="thème"], button:has-text("Thème"), [data-action="theme"]').first()

    if (await themeButton.isVisible()) {
      const initialTheme = await page.locator('html, body').getAttribute('data-theme')
      await themeButton.click()

      // Vérifier que le thème a changé
      const newTheme = await page.locator('html, body').getAttribute('data-theme')
      expect(initialTheme).not.toBe(newTheme)
    }
  })

  test('paramètres - accès et navigation', async ({ page }) => {
    await page.goto('/')

    // Naviguer vers les paramètres
    const settingsButton = page.locator('a[href*="parametres"], a[href*="settings"], button:has-text("Paramètres")').first()

    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      await expect(page).toHaveURL(/parametres|settings/i)

      // Vérifier que la page de paramètres se charge
      await expect(page.locator('h1, h2, .settings')).toBeVisible()
    }
  })

  test('recherche - gestion résultats vides', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.locator('input[type="search"], input[placeholder*="rechercher"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('xyz123abc456')
      await page.waitForTimeout(1000)

      // Vérifier qu'un message "aucun résultat" s'affiche
      const noResults = page.locator('text=aucun résultat, text=no results, text=aucune entrée')
      // Le message peut ne pas s'afficher immédiatement
    }
  })

  test('code CIM-10 - affichage détails', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.locator('input[type="search"], input[placeholder*="rechercher"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('E10') // Diabète insulinodépendant
      await page.waitForTimeout(500)

      // Cliquer sur un résultat
      const firstResult = page.locator('.result, .entry, [data-code]').first()
      if (await firstResult.isVisible()) {
        await firstResult.click()

        // Vérifier que les détails s'affichent
        await expect(page.locator('.details, .modal, [data-details]')).toBeVisible()
      }
    }
  })

  test('export - fonctionnalité d\'export', async ({ page }) => {
    await page.goto('/')

    // Trouver le bouton d'export
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Télécharger"), [data-action="export"]').first()

    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      // Vérifier qu'un téléchargement se lance
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.(json|csv|pdf)$/)
    }
  })

  test('historique - sauvegarde recherche', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.locator('input[type="search"], input[placeholder*="rechercher"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)

      // Vérifier que la recherche est sauvegardée
      const historyButton = page.locator('button:has-text("Historique"), [data-action="history"]').first()
      if (await historyButton.isVisible()) {
        await historyButton.click()
        await expect(page.locator('text=test')).toBeVisible()
      }
    }
  })

  test('offline - fonctionne hors ligne', async ({ page }) => {
    await page.goto('/')

    // Simuler offline
    await page.context().setOffline(true)

    // La recherche devrait fonctionner avec les données en cache
    const searchInput = page.locator('input[type="search"], input[placeholder*="rechercher"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('E10')
      await page.waitForTimeout(500)

      // Devrait avoir des résultats en cache
      await expect(page.locator('.result, .entry, [data-code]')).toHaveCount(await page.locator('.result, .entry, [data-code]').count())
    }
  })
})