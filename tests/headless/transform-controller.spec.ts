import { test, expect } from '@playwright/test';

test('user can rotate and scale a region', async ({ page }) => {
  const port = process.env.CI_STATIC_PORT || '4173';
  await page.goto(`http://localhost:${port}/`);

  const canvas = page.locator('canvas#main');
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not visible");

  // Click to place region
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 120);
  await page.mouse.up();

  // Click to place pivot
  await page.mouse.click(box.x + 70, box.y + 70);

  // Drag rotation handle
  await page.mouse.move(box.x + 70, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 30);
  await page.mouse.up();

  const transform = await page.evaluate(() => window.__uiLastOutput);
  expect(transform.rotation).not.toBe(0);
});