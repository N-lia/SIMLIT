import { expect } from '@playwright/test'

export const TEST_PROFILE = {
  name: 'Smoke Test',
  university: 'CI University',
  selectedField: 'eng',
  selectedSubfield: 'statics',
  hobbies: ['Reading'],
  createdAt: '2026-01-01T00:00:00.000Z',
}

/**
 * Collects uncaught page errors and console errors so a test can assert the
 * page rendered cleanly.
 */
export function trackErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  return errors
}

/**
 * Seeds localStorage (and optionally the router's history snapshot) before
 * the app boots, so a test can open any route directly.
 */
export async function seedApp(page, { profile = TEST_PROFILE, route } = {}) {
  await page.addInitScript(({ profile, route }) => {
    // Init scripts also run inside iframes; only seed the top-level app.
    if (window.top !== window) return
    if (profile) {
      localStorage.setItem('simlit_profile', JSON.stringify(profile))
    } else {
      localStorage.removeItem('simlit_profile')
    }
    if (route && !sessionStorage.getItem('__smokeSeeded')) {
      sessionStorage.setItem('__smokeSeeded', '1')
      history.replaceState({ simlit: true, navDepth: 0, ...route }, '', `#/${route.history.at(-1)}`)
    }
  }, { profile, route })
}

export async function expectPage(page, pageId) {
  const root = page.locator('#root')
  await expect(root).toHaveAttribute('data-page', pageId)
  await expect(root).not.toHaveText('Page not found.')
  await expect(root.locator(':scope > *').first()).toBeVisible()
}
