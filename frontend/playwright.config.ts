import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for the SOLENNE booking system.
 *
 * Prerequisites before running:
 *   1. Flask dev server running:  python app.py          (port 5000)
 *   2. Vite dev server running:   cd frontend && npm run dev  (port 5173)
 *   3. Browsers installed:        npx playwright install chromium
 *
 * Run tests:  cd frontend && npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      // Uses the system-installed Google Chrome — no separate browser download needed.
      // If Chrome is not installed, fall back: change channel to 'msedge' for Edge.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
})
