/**
 * Skjermbilde av Paakledning-dialogen i begge temaer, med safe-area simulert
 * (vedtak skjermbilde-safe-area).
 *   node tools/skjermbilde-paakledning.mjs <merkelapp>
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const MERKE = process.argv[2] ?? 'na';
const UT = 'tools/hjem-skjermbilder';
const PORT = 4212;
const SAFE_TOPP = 59;

mkdirSync(UT, { recursive: true });
const srv = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 80; i += 1) {
  try { if ((await fetch(`http://localhost:${PORT}`)).ok) break; } catch { /* venter */ }
  await new Promise((r) => setTimeout(r, 300));
}
const b = await chromium.launch();
for (const tema of ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width: 430, height: Number(process.env.HOYDE ?? 932) }, deviceScaleFactor: 1.5, colorScheme: tema });
  await p.route('**/api/forecast*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto(`http://localhost:${PORT}/?seed=demo`);
  await p.addStyleTag({ content: `.pkl-dialog > div { padding-top: ${SAFE_TOPP + 12}px !important }` });
  await p.waitForTimeout(2200);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((k) => k.textContent?.includes('Planlegg'))?.click());
  await p.waitForTimeout(1400);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((k) => k.textContent?.includes('Se hele antrekket'))?.click());
  await p.waitForTimeout(1800);
  const harDialog = await p.evaluate(() => !!document.querySelector('.pkl-dialog[open]'));
  if (!harDialog) { console.log(`  ${tema}: DIALOGEN APNET IKKE`); await p.close(); continue; }
  await p.screenshot({ path: `${UT}/pkl-${MERKE}-${tema}.jpg`, type: 'jpeg', quality: 82 });
  console.log(`  ${UT}/pkl-${MERKE}-${tema}.jpg`);
  await p.close();
}
await b.close();
srv.kill();
