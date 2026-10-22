import { test, expect } from '@playwright/test';
test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
});

test('microphone keeps its original slot and releases every track', async ({ page }) => {
  await page.addInitScript(() => {
    window.testStreams = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await original(options);
      window.testStreams.push(stream);
      return stream;
    };
  });
  await page.goto('/');
  await page.locator('#micRecord').click();
  await expect(page.locator('#micRecord')).toHaveText('Stop recording');
  await page.locator('[data-select="1"]').click();
  await page.waitForTimeout(600);
  await page.locator('#micRecord').click();
  await expect(page.locator('.slot-name').first()).toContainText('Voice');
  await expect(page.locator('.slot-name').nth(1)).toHaveText('Your sound goes here');
  expect(
    await page.evaluate(() =>
      window.testStreams.every((s) => s.getTracks().every((t) => t.readyState === 'ended')),
    ),
  ).toBe(true);
  await expect(page.locator('#micRecord')).toHaveText('Record microphone');
});
