import { test, expect } from '@playwright/test'
import { FIELD_TOPICS } from '../../src/data/topics.js'
import { expectPage, seedApp, trackErrors, TEST_PROFILE } from './helpers.js'

const implementedTopics = Object.entries(FIELD_TOPICS).flatMap(([subfieldId, field]) =>
  (field.topics || [])
    .filter(topic => topic.implemented)
    .map(topic => ({ subfieldId, topic })),
)

// Simulations rendered inside an iframe from public/<id>.html.
const IFRAME_SIMS = new Set(['wavelab', 'kirchhoff', 'heat_engine'])

test('catalog lists implemented simulations', () => {
  expect(implementedTopics.length).toBeGreaterThan(0)
})

for (const { subfieldId, topic } of implementedTopics) {
  test(`simulation ${subfieldId}/${topic.id} loads`, async ({ page }) => {
    const errors = trackErrors(page)
    await seedApp(page, {
      profile: { ...TEST_PROFILE, selectedSubfield: subfieldId },
      route: {
        history: ['profile', 'simulation'],
        navDepth: 1,
        selectedField: subfieldId,
        selectedSubfield: subfieldId,
        selectedTopic: topic.id,
      },
    })

    await page.goto('/#/simulation')
    await expectPage(page, 'simulation')

    const body = page.locator('.sim-body')
    // On success the loading notice is removed; on failure its text changes.
    await page.waitForFunction(() => {
      const loading = document.querySelector('.sim-body .sim-loading')
      return !loading || loading.textContent !== 'Loading simulation...'
    }, null, { timeout: 15_000 })
    await expect(body, 'simulation module failed to load').not.toContainText('Could not load this simulation.')
    await expect(body.locator('.sim-loading')).toHaveCount(0)
    await expect(body.locator('.coming-soon-wrap'), 'implemented topic has no simulation loader').toHaveCount(0)
    await expect(body.locator(':scope > *').first()).toBeVisible()

    if (IFRAME_SIMS.has(topic.id)) {
      const frameElement = body.locator('iframe')
      await expect(frameElement).toHaveAttribute('src', new RegExp(`${topic.id}\\.html$`))
      const response = await page.request.get(await frameElement.getAttribute('src'))
      expect(response.ok()).toBe(true)
      const frame = await (await frameElement.elementHandle()).contentFrame()
      await frame.waitForLoadState('load')
      await expect(frame.locator('body > *').first()).toBeAttached()
    }

    // Let the simulation run a few frames so render-loop errors surface.
    await page.waitForTimeout(750)
    expect(errors).toEqual([])
  })
}
