import { test, expect } from '@playwright/test';

test('offline master zero is silent from the first sample', async ({ page }) => {
  await page.goto('/');
  const peak = await page.evaluate(async () => {
    const { createProject } = await import('/src/model.js');
    const { renderWav } = await import('/src/audio.js');
    const p = createProject();
    p.length = 8;
    p.fx.master = 0;
    p.pattern.kick[0] = true;
    const data = new DataView(await renderWav(p, [], { tail: false }));
    let peak = 0;
    for (let i = 44; i < data.byteLength; i += 2)
      peak = Math.max(peak, Math.abs(data.getInt16(i, true)));
    return peak;
  });
  expect(peak).toBe(0);
});

test('future samples start on their scheduled audio timestamp', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { AudioEngine } = await import('/src/audio.js');
    const c = new OfflineAudioContext(2, 44100, 44100);
    const b = c.createBuffer(1, 4410, 44100);
    for (let i = 0; i < 4410; i++) b.getChannelData(0)[i] = Math.sin(i * 0.1) * 0.3;
    const engine = new AudioEngine(c, { filter: 14000, delay: 0, space: 0, master: 70 }, [
      { buffer: b },
    ]);
    engine.sample(0, 0.5, { overlap: true });
    const a = (await c.startRendering()).getChannelData(0);
    return {
      early: Math.max(...a.slice(0, 22050).map(Math.abs)),
      late: Math.max(...a.slice(23000, 26000).map(Math.abs)),
    };
  });
  expect(result.early).toBe(0);
  expect(result.late).toBeGreaterThan(0.01);
});

test('dense future scheduling leaves silent gaps between offline notes', async ({ page }) => {
  await page.goto('/');
  const gap = await page.evaluate(async () => {
    const { AudioEngine } = await import('/src/audio.js');
    const c = new OfflineAudioContext(1, 16 * 44100, 44100);
    const engine = new AudioEngine(c, { filter: 14000, delay: 0, space: 0, master: 70 });
    for (let i = 0; i < 160; i++) engine.tone(440, i * 0.1, 0.015, 'sine', 0.2, 0.002);
    const a = (await c.startRendering()).getChannelData(0);
    return Math.max(...a.slice(3300, 3900).map(Math.abs));
  });
  expect(gap).toBeLessThan(0.000001);
});

test('piano recording preserves exact pitch in the portable project', async ({ page }) => {
  await page.goto('/');
  await page.locator('#record').click();
  await page.locator('#keyboardMode').check();
  await page.locator('h1').click();
  await page.keyboard.press('s');
  await page.locator('#stop').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadProject').click(),
  ]);
  const fs = await import('node:fs/promises');
  const p = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(p.leadNotes).toContain('C#3');
  expect(p.notes).not.toContain('C#3');
});

test('runtime requests stay on the app origin', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:5173/') && !r.url().startsWith('ws:'))
      external.push(r.url());
  });
  await page.goto('/');
  await page.locator('#play').click();
  await page.locator('#stop').click();
  expect(external).toEqual([]);
});
