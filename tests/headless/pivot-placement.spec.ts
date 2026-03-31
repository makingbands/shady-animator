import { test, expect } from '@playwright/test';

test('user can place a pivot point', async ({ page }) => {
  const port = process.env.CI_STATIC_PORT || '4173';
  await page.goto(`http://localhost:${port}/`);

  const canvas = page.locator('canvas#main');
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas bounding box not found");

  const clickX =  box.x + 200;
  const clickY =  box.y + 150;

  await page.mouse.click(clickX, clickY);

  const pivot = await page.evaluate(() => window.__uiLastOutput);
  expect(pivot.x).toBeGreaterThan(0);
  expect(pivot.y).toBeGreaterThan(0);
});