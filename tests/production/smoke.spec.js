import { test, expect } from '@playwright/test';
test('built studio loads under its CSP, exports audio and retains license notices', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.locator('.step')).toHaveCount(272);
  await page.locator('#play').click();
  await expect(page.locator('.step.playing')).toHaveCount(17);
  await page.locator('#stop').click();
  await page.locator('#exportTail').uncheck();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.wav$/);
  await page.locator('#language').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await (await page.request.get('/THIRD_PARTY_NOTICES.txt')).text()).toContain('Lucide');
  expect(await (await page.request.get('/LICENSE.txt')).text()).toContain('MIT License');
  expect(errors).toEqual([]);
});
