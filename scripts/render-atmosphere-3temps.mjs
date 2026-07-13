#!/usr/bin/env node
/* F28.13: Render Forsiden ved 3 temperaturer (-4°, 14°, 28°) som bevis
 * til V0 at (a) toppen er kjølig på alle tre, og (b) varmen øker
 * cold→warm. Bytter --bg-{top,mid,bottom} via inline-style etter at
 * appen har mountet (matcher hva applyAtmosphere ville gjort for den
 * temperaturen).
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const URL = (process.argv[2] ?? 'http://localhost:4173') + '?seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const STOPS = {
  cold: { top: 'rgb(188, 203, 214)', mid: 'rgb(207, 211, 211)', bottom: 'rgb(226, 219, 207)' },
  mild: { top: 'rgb(207, 213, 216)', mid: 'rgb(224, 220, 213)', bottom: 'rgb(242, 228, 210)' },
  warm: { top: 'rgb(214, 218, 216)', mid: 'rgb(231, 222, 210)', bottom: 'rgb(248, 226, 204)' },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();

for (const [bucket, stops] of Object.entries(STOPS)) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate((s) => {
    const root = document.querySelector('.instr-app.atmosphere');
    if (!root) return;
    root.style.setProperty('--bg-top', s.stops.top);
    root.style.setProperty('--bg-mid', s.stops.mid);
    root.style.setProperty('--bg-bottom', s.stops.bottom);
    root.dataset.atmosphere = s.bucket;
  }, { bucket, stops });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const root = document.querySelector('.instr-app.atmosphere');
    return root ? getComputedStyle(root).backgroundImage : '';
  });
  console.log(`${bucket}: ${m.slice(0, 200)}`);
  await page.screenshot({ path: `${OUT}/forside-${bucket}.png`, fullPage: false });
  console.log(`  → ${OUT}/forside-${bucket}.png written`);
}

await browser.close();
exit(0);
