// tests/headless/basic-smoke.spec.ts
/**
 * resource: tests/headless/basic-smoke.spec.ts
 * goal: Provide a minimal Playwright smoke test for Shady Animator
 * channel: playwright
 * handoff: epoch.mm.shady-animator.v1.1.ci.smoke
 */

import { test, expect } from '@playwright/test';

test('loads Shady Animator root page', async ({ page }) => {
  const port = process.env.CI_STATIC_PORT || '4173';
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Shady Animator/i);
});