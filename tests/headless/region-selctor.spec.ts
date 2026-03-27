/**
 * resource: tests/headless/region-selection.spec.ts
 * goal: Validate UI region selection behavior in browser
 * channel: playwright
 * handoff: epoch.mm.shady-animator.v1.1.step10.integration
 */

import { test, expect } from '@playwright/test';

test('user can drag to create a region', async ({ page }) => {
  const port = process.env.CI_STATIC_PORT || '4173';
  await page.goto(`http://localhost:${port}/`);

  const canvas = page.locator('canvas#main');

  const box = await canvas.boundingBox();
  const startX = box.x + 20;
  const startY = box.y + 20;
  const endX = box.x + 120;
  const endY = box.y + 80;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY);
  await page.mouse.up();

  const region = await page.evaluate(() => window.__lastRegion);
  expect(region.width).toBeGreaterThan(0);
  expect(region.height).toBeGreaterThan(0);
});