/**
 * CTA over fold pa minste stottede enhet (portdom 23).
 * Kjorer Sols rekkefolge trinn for trinn og maler gevinsten per steg,
 * saa vi vet hvilke som faktisk trengs — ikke gjetter.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';
const req = createRequire(import.meta.url);
const { chromium } = req('playwright');
const VITE = join(dirname(req.resolve('vite/package.json')), 'bin', 'vite.js');
const net = await import('node:net');
const PORT = await new Promise((r) => { const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 80; i += 1) { try { if ((await fetch('http://localhost:' + PORT)).ok) break; } catch { /* */ }
  await new Promise((r) => setTimeout(r, 300)); }

/* iPhone SE 2/3: 375x667, safe-area topp 20, ingen bunn-inset. */
const KOMPAKT = [
  '.hjm-panel-slot[data-with-mascot="true"]{margin-top:108px}',
  '.hjm-panel{padding:20px 22px 14px}',
  '.hjm-cta{margin-top:14px}',
  '.hjm-ask{font-size:22px}',
].join(' ');
const STEG = [
  ['0. som i dag', ''],
  ['1. skjul trust-linjen', '.hjm-trust{display:none}'],
  ['2. + overheng 130->108', '.hjm-trust{display:none} .hjm-panel-slot[data-with-mascot="true"]{margin-top:108px}'],
  ['3. + Lillian inn i panelet', '.hjm-trust{display:none} .hjm-panel-slot[data-with-mascot="true"]{margin-top:108px} .hjm-child{display:none}'],
  ['4. kompaktpakke UTEN a skjule noe', KOMPAKT],
  ['5. kompaktpakke + Lillian flyttet', KOMPAKT + ' .hjm-child{display:none}'],
];
const b = await chromium.launch();
console.log('iPhone SE 375x667, safe-area 20 px\n');
console.log('steg                          CTA-bunn  tabbar  klaring');
for (const [navn, css] of STEG) {
  const p = await b.newPage({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
  await p.route('**/api/forecast*', (r) => r.fulfill({ contentType: 'application/json',
    body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto('http://localhost:' + PORT + '/?seed=demo');
  await p.addStyleTag({ content: '.hjem-monter{padding-top:32px !important}' + css });
  await p.waitForTimeout(2400);
  const g = await p.evaluate(() => {
    const cta = document.querySelector('.hjm-cta');
    const barer = [...document.querySelectorAll('nav,[class*="tab"]')].map((e) => e.getBoundingClientRect())
      .filter((x) => x.height > 40 && x.top > window.innerHeight * 0.6);
    const bar = barer.length ? Math.min(...barer.map((x) => x.top)) : window.innerHeight;
    return { cta: cta ? Math.round(cta.getBoundingClientRect().bottom) : null, bar: Math.round(bar) };
  });
  const kl = g.bar - g.cta;
  console.log(navn.padEnd(30) + String(g.cta).padStart(5) + String(g.bar).padStart(9) + String(kl).padStart(9) + (kl >= 12 ? '  OK' : '  UNDER'));
  if (kl >= 12) { await p.screenshot({ path: 'tools/hjem-skjermbilder/fold-se-lost.jpg', type: 'jpeg', quality: 90 }); }
  await p.close();
}
await b.close(); srv.kill();
