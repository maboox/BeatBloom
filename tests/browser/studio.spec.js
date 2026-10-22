import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.step')).toHaveCount(272);
});
test('transport starts, stops and never leaves a stale playhead', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.locator('#play').click();
  await expect(page.locator('.step.playing')).toHaveCount(17);
  await page.locator('#stop').click();
  await page.waitForTimeout(180);
  await expect(page.locator('.step.playing')).toHaveCount(0);
  await expect(page.locator('#time')).toHaveText('00:00.00');
  expect(errors).toEqual([]);
});
test('undo, mute, loop resizing and preset persistence', async ({ page }) => {
  const step = page.locator('[data-track="kick"][data-step="1"]');
  await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#undo').click();
  await expect(step).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#redo').click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-mute="kick"]').click();
  await expect(page.locator('[data-lane="kick"]')).toHaveClass(/muted/);
  await page.selectOption('#loopLength', '32');
  await expect(page.locator('.step')).toHaveCount(544);
  await page.selectOption('#pattern', 'house');
  await expect(page.locator('[data-track="kick"][data-step="16"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('#save').click();
  await page.reload();
  await page.locator('#load').click();
  await expect(page.locator('.step')).toHaveCount(544);
  await expect(page.locator('[data-lane="kick"]')).toHaveClass(/muted/);
});
test('invalid JSON is rejected without destroying the session', async ({ page }) => {
  const value = await page.locator('#bpm').inputValue();
  await page.locator('#projectUpload').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"pattern":{"kick":[true]},"length":999999}'),
  });
  await expect(page.locator('#toast')).toContainText('did not work');
  await expect(page.locator('#bpm')).toHaveValue(value);
  await expect(page.locator('.step')).toHaveCount(272);
});
test('sample filenames are text, portable samples roundtrip, and sample WAV is audible', async ({
  page,
}) => {
  const sample = await page.evaluate(async () => {
    const { encodeWav } = await import('/src/wav.js');
    const c = new OfflineAudioContext(1, 4410, 44100),
      b = c.createBuffer(1, 4410, 44100),
      a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.sin(i * 0.1) * 0.3;
    return [...new Uint8Array(encodeWav(b))];
  });
  await page.locator('#sampleUpload').setInputFiles({
    name: '<img src=x onerror=alert(1)>.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from(sample),
  });
  await expect(page.locator('.slot-name').first()).toContainText('<img');
  await expect(page.locator('#sampleSlots img')).toHaveCount(0);
  await page.locator('[data-track="sample"][data-step="0"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadProject').click(),
  ]);
  const path = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.beatbloom$/);
  page.on('dialog', (d) => d.accept());
  await page.locator('#projectUpload').setInputFiles(path);
  await expect(page.locator('#toast')).toContainText('Project and samples opened');
  await expect(page.locator('.slot-name').first()).toContainText('<img');
  const result = await page.evaluate(async () => {
    const { createProject } = await import('/src/model.js'),
      { renderWav } = await import('/src/audio.js');
    const p = createProject();
    p.length = 8;
    p.bpm = 120;
    p.fx = { filter: 14000, delay: 0, space: 0, master: 70 };
    p.pattern.sample[0] = true;
    const c = new OfflineAudioContext(1, 4410, 44100),
      b = c.createBuffer(1, 4410, 44100);
    b.getChannelData(0).fill(0.1);
    const data = await renderWav(p, [{ buffer: b }], { tail: false }),
      v = new DataView(data);
    let peak = 0;
    for (let i = 44; i < data.byteLength; i += 2)
      peak = Math.max(peak, Math.abs(v.getInt16(i, true)));
    return { peak, size: data.byteLength };
  });
  expect(result.peak).toBeGreaterThan(100);
  expect(result.size).toBe(44 + 44100 * 4);
});
test('keyboard recording routes piano and pads to separate lanes', async ({ page }) => {
  await page.locator('#record').click();
  await page.locator('#keyboardMode').check();
  await page.locator('h1').click();
  await page.keyboard.press('s');
  await expect(page.locator('[data-track="lead"].on')).not.toHaveCount(0);
  await page.locator('#stop').click();
  await expect(page.locator('#record')).toHaveAttribute('aria-pressed', 'false');
});
test('mobile and Persian layouts do not overflow and help is accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 2; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('#language').click();
  }
  await page.locator('#help').click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
test('WAV export has a real RIFF file and expected duration', async ({ page }) => {
  await page.locator('#exportTail').uncheck();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.wav$/);
  const fs = await import('node:fs/promises'),
    bytes = await fs.readFile(await download.path());
  expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
  expect(bytes.readUInt32LE(24)).toBe(44100);
  expect(bytes.length).toBe(44 + Math.ceil(((16 * 60) / 118 / 4) * 44100) * 4);
});
