/**
 * E2E — Critical booking journey: homepage → service → date → slot → form → confirmation
 *
 * Prerequisites:
 *   - Flask dev server on port 5000 (seeds services on startup)
 *   - Vite dev server on port 5173 (proxies /api to Flask)
 *   - At least one available time slot seeded for a future date.
 *     Run: python slots.py   from the project root to seed slots.
 *   - Run: cd frontend && npm run test:e2e
 *
 * BookingPage structure (for selector reference):
 *   Step 0: select#service-select, input#date-picker, button "See Available Times →"
 *   Step 1: div[role="listbox"] > button[role="option"] (time slots)
 *   Step 2: input#client-name, input#client-email, input#client-phone, button[type="submit"]
 */

import { test, expect, type Page } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when Flask API is reachable on port 5000. */
async function isFlaskUp(page: Page): Promise<boolean> {
  try {
    const resp = await page.request.get('/api/services', { timeout: 3000 })
    return resp.ok()
  } catch {
    return false
  }
}

/** Skip the current test with a clear message when Flask isn't running. */
async function requireFlask(page: Page): Promise<void> {
  if (!(await isFlaskUp(page))) {
    test.skip(true, 'Flask not running on port 5000 — start with: python app.py')
  }
}

/** Find the first future date (up to 30 days out) that has ≥1 open slot for service 1. */
async function findAvailableDate(page: Page): Promise<string | null> {
  const today = new Date()
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const resp = await page.request.get(`/api/slots?service_id=1&date=${iso}`)
    if (resp.ok()) {
      const slots: unknown[] = await resp.json()
      if (Array.isArray(slots) && slots.length > 0) return iso
    }
  }
  return null
}

/** Navigate booking wizard through Step 0 (service + date) and return to Step 1. */
async function reachSlotStep(page: Page): Promise<string | null> {
  await page.goto('/book')
  await expect(page.locator('#main-content')).toBeVisible()

  // Wait for services to load then select the first service (index 0 = service_id 1)
  const serviceSelect = page.locator('#service-select')
  await expect(serviceSelect).toBeVisible({ timeout: 8000 })
  await expect(serviceSelect.locator('option')).not.toHaveCount(0)
  await serviceSelect.selectOption({ index: 0 })

  const slotDate = await findAvailableDate(page)
  if (!slotDate) return null

  await page.locator('#date-picker').fill(slotDate)
  await page.locator('#date-picker').press('Tab')

  await page.locator('button', { hasText: 'See Available Times' }).click()
  return slotDate
}

// ── Accessibility basics ──────────────────────────────────────────────────────

test.describe('Accessibility — skip link and landmarks', () => {
  test('skip-to-main link is focusable and targets #main-content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('#main-content landmark exists on /book', async ({ page }) => {
    await page.goto('/book')
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('nav links are keyboard-reachable on homepage', async ({ page }) => {
    await page.goto('/')
    const navFocusable = page.locator('nav a, nav button')
    await expect(navFocusable.first()).toBeVisible()
    expect(await navFocusable.count()).toBeGreaterThan(0)
  })
})

// ── Homepage ──────────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads and shows a Book link', async ({ page }) => {
    await page.goto('/')
    const bookLink = page.locator('a[href="/book"]').first()
    await expect(bookLink).toBeVisible()
  })

  test('clicking Book CTA navigates to /book', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/book"]').first().click()
    await expect(page).toHaveURL('/book')
    await expect(page.locator('#main-content')).toBeVisible()
  })
})

// ── Booking wizard — Step 0 ───────────────────────────────────────────────────

test.describe('Booking wizard — Step 0 (service + date)', () => {
  test('service dropdown loads options from API', async ({ page }) => {
    await requireFlask(page)
    await page.goto('/book')
    const serviceSelect = page.locator('#service-select')
    await expect(serviceSelect).toBeVisible({ timeout: 8000 })
    // Options (excluding blank placeholder) should be present
    const options = serviceSelect.locator('option')
    await expect(options).toHaveCount(await options.count())
    expect(await options.count()).toBeGreaterThan(1)
  })

  test('"See Available Times" button requires both service and date', async ({ page }) => {
    await requireFlask(page)
    await page.goto('/book')

    // Wait for services to load — the component auto-selects the first service and
    // defaults to today, so the button becomes enabled as soon as services resolve.
    const serviceSelect = page.locator('#service-select')
    await expect(serviceSelect).toBeVisible({ timeout: 8000 })
    await expect(serviceSelect.locator('option')).not.toHaveCount(0)

    const nextBtn = page.locator('button', { hasText: 'See Available Times' })
    await expect(nextBtn).toBeEnabled()

    // Clearing the date disables the button
    await page.locator('#date-picker').fill('')
    await expect(nextBtn).toBeDisabled()

    // Setting the date re-enables it
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.locator('#date-picker').fill(tomorrow.toISOString().slice(0, 10))
    await expect(nextBtn).toBeEnabled()
  })
})

// ── Booking wizard — Full critical journey ────────────────────────────────────

test.describe('Booking journey — full flow', () => {
  test('service → date → slot → form → confirmation page', async ({ page }) => {
    await requireFlask(page)
    // ── Steps 0: service + date ──
    const slotDate = await reachSlotStep(page)
    if (!slotDate) {
      test.skip(true, 'No available slots in next 30 days — run: python slots.py')
      return
    }

    // ── Step 1: pick a time slot ──
    const slotBtn = page.locator('[role="listbox"] button[role="option"]').first()
    await expect(slotBtn).toBeVisible({ timeout: 8000 })
    await slotBtn.click()

    // Expect step 2 to appear (contact form)
    await expect(page.locator('#client-name')).toBeVisible({ timeout: 5000 })

    // ── Step 2: fill contact form ──
    await page.locator('#client-name').fill('E2E Test User')
    await page.locator('#client-email').fill('e2etest@example.com')
    await page.locator('#client-phone').fill('9876543210')

    // ── Submit ──
    await page.locator('button[type="submit"]').click()

    // ── Confirmation page ──
    await expect(page).toHaveURL(/\/confirm\/[A-Za-z0-9_-]{20,}/, { timeout: 12000 })
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.locator('body')).toContainText('E2E Test User')
  })
})

// ── Booking wizard — Validation ───────────────────────────────────────────────

test.describe('Booking form — validation', () => {
  test('submitting empty form shows required-field errors', async ({ page }) => {
    await requireFlask(page)
    const slotDate = await reachSlotStep(page)
    if (!slotDate) {
      test.skip(true, 'No available slots — cannot reach form step')
      return
    }

    const slotBtn = page.locator('[role="listbox"] button[role="option"]').first()
    await expect(slotBtn).toBeVisible({ timeout: 8000 })
    await slotBtn.click()

    // Wait for form to appear, then submit empty
    await expect(page.locator('#client-name')).toBeVisible({ timeout: 5000 })
    await page.locator('button[type="submit"]').click()

    // At least one role="alert" error should appear
    const firstError = page.locator('[role="alert"]').first()
    await expect(firstError).toBeVisible({ timeout: 3000 })
  })

  test('invalid email shows an error message', async ({ page }) => {
    await requireFlask(page)
    const slotDate = await reachSlotStep(page)
    if (!slotDate) {
      test.skip(true, 'No available slots — cannot reach form step')
      return
    }

    const slotBtn = page.locator('[role="listbox"] button[role="option"]').first()
    await expect(slotBtn).toBeVisible({ timeout: 8000 })
    await slotBtn.click()

    await expect(page.locator('#client-name')).toBeVisible({ timeout: 5000 })
    await page.locator('#client-name').fill('Test Person')
    await page.locator('#client-email').fill('not-an-email')
    await page.locator('#client-phone').fill('9000000000')

    await page.locator('button[type="submit"]').click()

    // Either the booking-field inline error or browser native :invalid fires
    const inlineError = page.locator('#client-email-error')
    const nativeInvalid = page.locator('#client-email:invalid')
    const hasInline = await inlineError.isVisible({ timeout: 2000 }).catch(() => false)
    const hasNative = (await nativeInvalid.count()) > 0
    expect(hasInline || hasNative, 'Expected an email validation error').toBeTruthy()
  })
})
