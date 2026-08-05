// Fase 9-bevis: screenshots av alle prototyper × scenarier fra lab-shellen.
// Kjøres ETTER `npm run build:lab`. Skriver til docs/design-lab/appendix/fase9-bevis/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'design-lab', 'appendix', 'fase9-bevis');
mkdirSync(OUT, { recursive: true });

const PORT = 4181;
const BASE = `http://127.0.0.1:${PORT}/lab/`;
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const server = spawn(process.execPath, [VITE, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort', '--config', 'docs/design-lab/lab/vite.config.ts'], { cwd: ROOT, stdio: 'ignore' });

const PROTOTYPER = ['P1', 'P2', 'P3', 'P4', 'Null'];
const SCENARIER = ['normal-dag', 'grensevaer', 'sovende-vognbarn', 'bilstol', 'manglende-vaerdata', 'endret-vaer', 'utlopt-raad', 'ny-omsorgsperson', 'dynamic-type', 'utendorslys'];

try {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try { const r = await fetch(BASE); if (r.ok) break; } catch {}
    if (Date.now() > deadline) throw new Error('preview startet ikke');
    await new Promise((r) => setTimeout(r, 300));
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  let antall = 0;
  for (const proto of PROTOTYPER) {
    const fane = page.locator('nav[aria-label="Prototyper"] button').filter({ hasText: new RegExp(`^${proto}`, 'i') }).first();
    if (!(await fane.count()) || (await fane.isDisabled())) { console.log(`HOPPER ${proto} (mangler/disabled)`); continue; }
    await fane.click();
    await page.waitForTimeout(400);
    for (const scen of SCENARIER) {
      await page.selectOption('select', { value: scen }).catch(() => {});
      await page.waitForTimeout(600);
      const forstaatt = page.locator('button').filter({ hasText: /Jeg forstår/i }).first();
      if (await forstaatt.count()) { await forstaatt.click(); await page.waitForTimeout(600); }
      await page.screenshot({ path: join(OUT, `${proto.toLowerCase()}--${scen}.png`), fullPage: true });
      antall++;
    }
  }

  // Tidslinje-bevis for P3/P4: spol klokka i utvalgte scenarier og fang overgangene.
  for (const proto of ['P3', 'P4', 'P1']) {
    const fane = page.locator('nav[aria-label="Prototyper"] button').filter({ hasText: new RegExp(`^${proto}`, 'i') }).first();
    if (!(await fane.count()) || (await fane.isDisabled())) continue;
    await fane.click();
    await page.selectOption('select', { value: 'endret-vaer' }).catch(() => {});
    await page.waitForTimeout(500);
    const ok2 = page.locator('button').filter({ hasText: /Jeg forstår/i }).first();
    if (await ok2.count()) { await ok2.click(); await page.waitForTimeout(500); }
    for (const steg of [1, 2, 3]) {
      const spol = page.locator('section[aria-label="Virtuell klokke"] button').first();
      if (await spol.count()) { await spol.click(); await page.waitForTimeout(500); }
      await page.screenshot({ path: join(OUT, `${proto.toLowerCase()}--tidslinje-${steg}.png`), fullPage: true });
      antall++;
    }
  }

  await browser.close();
  console.log(`FERDIG: ${antall} skjermbevis i docs/design-lab/appendix/fase9-bevis/`);
} finally {
  server.kill();
}
