/**
 * Skjermbilde av Hjem i begge temaer, til for/etter-sammenligning.
 *   node tools/skjermbilde-hjem.mjs <merkelapp>
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
const PORT = 4211;

mkdirSync(UT, { recursive: true });
const srv = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 80; i += 1) {
  try { if ((await fetch(`http://localhost:${PORT}`)).ok) break; } catch { /* ikke oppe */ }
  await new Promise((r) => setTimeout(r, 300));
}
/* SAFE-AREA MA SIMULERES. Desktop-Chromium rapporterer env(safe-area-inset-top)
   som 0, mens en iPhone gir 20-59 px. Uten dette viser skjermbildet appen
   ~50 px hoyere enn den faktisk star pa telefon — eieren fanget det som
   «jeg trodde avataren var ca pa midten», og han hadde rett: feilen la i
   maleriggen, ikke i appen. Vedtak «skjermbilde-safe-area» i vedtak.json. */
const SAFE = { topp: Number(process.env.SAFE_TOP ?? 59), bunn: Number(process.env.SAFE_BOTTOM ?? 34) };
const b = await chromium.launch();
for (const tema of ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: tema });
  await p.addInitScript(([t, bn]) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = `.hjem-monter{padding-top:max(24px, calc(${t}px + 12px)) !important}
        :root{--dw-tabbar-clearance:calc(90px + ${bn}px)}`;
      document.head.append(s);
    });
  }, [SAFE.topp, SAFE.bunn]);
  await p.route('**/api/forecast*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto(`http://localhost:${PORT}/?seed=demo`);
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${UT}/${MERKE}-${tema}.png` });
  console.log(`  ${UT}/${MERKE}-${tema}.png`);
  await p.close();
}
await b.close();
srv.kill();
