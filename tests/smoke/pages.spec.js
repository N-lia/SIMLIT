import { test, expect } from '@playwright/test'
import { FIELD_TOPICS } from '../../src/data/topics.js'
import { expectPage, seedApp, trackErrors } from './helpers.js'

// Routes reachable without a saved profile.
const PUBLIC_PAGES = ['landing', 'getNow', 'welcome', 'fieldOfStudy']

// Routes that expect an onboarded user.
const PROFILE_PAGES = [
  'profile',
  'simulationSelect',
  'tarotCards',
  'myNotes',
  'engineeringField',
  'bioData',
  'hobbies',
]

test.describe('app pages', () => {
  for (const pageId of PUBLIC_PAGES) {
    test(`${pageId} renders for a new visitor`, async ({ page }) => {
      const errors = trackErrors(page)
      await seedApp(page, { profile: null })
      await page.goto(`/#/${pageId}`)
      await expectPage(page, pageId)
      expect(errors).toEqual([])
    })
  }

  for (const pageId of PROFILE_PAGES) {
    test(`${pageId} renders for an onboarded user`, async ({ page }) => {
      const errors = trackErrors(page)
      await seedApp(page)
      await page.goto(`/#/${pageId}`)
      await expectPage(page, pageId)
      expect(errors).toEqual([])
    })
  }

  test('profile route falls back to landing without a profile', async ({ page }) => {
    await seedApp(page, { profile: null })
    await page.goto('/#/profile')
    await expectPage(page, 'landing')
  })
})

test.describe('simulation catalog per field', () => {
  for (const subfieldId of Object.keys(FIELD_TOPICS)) {
    test(`${subfieldId} topic list renders`, async ({ page }) => {
      const errors = trackErrors(page)
      await seedApp(page, {
        profile: { name: 'Smoke Test', selectedField: subfieldId, selectedSubfield: subfieldId },
      })
      await page.goto('/#/simulationSelect')
      await expectPage(page, 'simulationSelect')
      expect(errors).toEqual([])
    })
  }
})
