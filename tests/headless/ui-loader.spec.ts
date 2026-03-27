/**
 * resource: tests/headless/ui-loader.spec.ts
 * goal: Ensure declarative loader initializes RegionSelector in browser
 * channel: playwright
 * handoff: epoch.mm.shady-animator.v1.2.ui.loader-integration
 */

import { test, expect } from '@playwright/test';

test('UI loader initializes RegionSelector', async ({ page }) => {
  const port = process.env.CI_STATIC_PORT || '4173';
  await page.goto(`http://localhost:${port}/`);

  const exists = await page.evaluate(() => {
    return typeof window.__uiLastOutput !== 'undefined';
  });

  expect(exists).toBe(true);
});