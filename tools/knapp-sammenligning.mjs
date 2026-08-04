import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';
const req = createRequire(process.cwd() + '/package.json');
const { chromium } = req('playwright');
const VITE = join(dirname(req.resolve('vite/package.json')), 'bin', 'vite.js');
const net = await import('node:net');
const PORT = await new Promise((r) => { const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 80; i++) { try { if ((await fetch('http://localhost:' + PORT)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 300)); }

/* Kremknappen: nøyaktig Fables forslag, men KUN knappen — alt annet står. */
const KREM = `.hjm-cta { background: var(--dw-ink-hi) !important; color: var(--dw-canvas) !important;
    box-shadow: inset 0 1px 0 rgba(255,251,242,.55), var(--dw-depth-raised) !important;
    position: relative; }
  .hjm-cta::before { content:''; position:absolute; left:0; top:50%;
    transform:translateY(-50%); width:3px; height:24px; border-radius:0 2px 2px 0;
    background: var(--dw-accent); }`;

const b = await chromium.launch();
for (const tema of ['dark', 'light']) {
  for (const [navn, css] of [['oransje', ''], ['krem', KREM]]) {
    const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: tema });
    await p.route('**/api/forecast*', (r) => r.fulfill({ contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()) }));
    await p.goto('http://localhost:' + PORT + '/?seed=demo');
    await p.addStyleTag({ content: '.hjem-monter{padding-top:71px !important}' + css });
    await p.waitForTimeout(2400);
    await p.screenshot({ path: `tools/hjem-skjermbilder/knapp-${navn}-${tema}.jpg`, type: 'jpeg', quality: 88 });
    console.log(`  ${navn} ${tema}`);
    await p.close();
  }
}
await b.close(); srv.kill();
