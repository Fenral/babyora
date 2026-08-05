/**
 * Maaler sideskiftet i den EKTE appen.
 *
 * Vedtaket «sideskift-er-fysiske» sier tre ting som kan males:
 *   1. BEGGE flater beveger seg samtidig — ikke etter hverandre
 *   2. Skallet (ordmerket, tabbaren) staar stille
 *   3. Reduced Motion kollapser til direkte bytte, uten bevegelse
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const net = await import('node:net');
const PORT = await new Promise((r) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); });
});
const BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 100; i += 1) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* ikke oppe */ }
  await new Promise((r) => setTimeout(r, 300));
}

const { forecastPartlyCloudy1C } = await import('../e2e/fixtures/forecast-1c-partlycloudy.js');
const browser = await chromium.launch();

async function mål(reducedMotion) {
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  await p.route('**/api/forecast*', (r) => r.fulfill({
    contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  /* Naviger til Familie forst, der drill-radene bor. */
  const fane = p.locator('nav button, [class*="tab"] button').filter({ hasText: /Familie/iu }).first();
  if (await fane.count() > 0) { await fane.click(); await p.waitForTimeout(800); }

  /* Start en drill og prøv 30 ganger gjennom overgangen. */
  const prøver = await p.evaluate(async () => {
    /* «Finn dagens antrekk» bytter IKKE side — den kjorer scannen inne paa
       Hjem. Forste maaling brukte den og fant null bevegelse, som var riktig
       svar paa feil sporsmaal. En ekte DRILL er verktoyradene paa Familie. */
    if (!document.querySelector('.ba-sideskift')) {
      return { feil: 'wrapperen .ba-sideskift finnes ikke i DOM-en' };
    }
    const knapp = [...document.querySelectorAll('button')]
      .find((b) => /Soveguiden/iu.test(b.textContent || ''));
    if (!knapp) return { feil: 'fant ikke verktoyraden — kom jeg til Familie?' };
    const sider = () => [...document.querySelectorAll('.ba-sideskift > *')];
    /* Skallet er det som IKKE bytter: tabbaren. Forste maaling brukte
       .hjm-brand, som bor INNE i Hjem — den flyttet seg fordi hele siden
       gjorde det. Da malte jeg sideskiftet og kalte det skallet. */
    const brand = document.querySelector('nav, [class*="tabbar"], [class*="TabBar"]');
    const brandFør = brand ? brand.getBoundingClientRect().top : null;

    knapp.click();
    const ut = [];
    for (let i = 0; i < 40; i += 1) {
      const s = sider();
      ut.push({
        antall: s.length,
        transformer: s.map((e) => getComputedStyle(e).transform),
        raa: s.map((e) => e.style.transform || '(ingen inline)'),
        opacity: s.map((e) => getComputedStyle(e).opacity),
        animasjoner: s.map((e) => e.getAnimations ? e.getAnimations().length : -1),
        klasser: s.map((e) => e.className),
        topp: s.map((e) => Math.round(e.getBoundingClientRect().top)),
        brandTop: brand ? Math.round(brand.getBoundingClientRect().top) : null,
      });
      await new Promise((r) => requestAnimationFrame(r));
    }
    return { prøver: ut, brandFør: brandFør === null ? null : Math.round(brandFør) };
  });
  await p.close();
  return prøver;
}

for (const rm of [false, true]) {
  const r = await mål(rm);
  const merkelapp = rm ? 'REDUSERT BEVEGELSE' : 'NORMAL';
  if (r.feil) { console.log(`${merkelapp}: ${r.feil}`); continue; }

  /* Bilder der TO sider er i DOM-en OG begge har en transform ulik none. */
  /* «transform !== none» duger ikke: den som har kommet FRAM star paa
     matrix(1,0,0,1,0,0), som er en transform men ikke en forflytning.
     Vi maaler y-leddet: begge ma vaere FLYTTET samtidig. */
  const yAv = (t) => {
    const m = /matrix(([^)]+))/u.exec(t || '');
    if (!m) return 0;
    const d = m[1].split(',').map(Number);
    return d.length === 6 ? d[5] : 0;
  };
  const samtidig = r.prøver.filter((f) => f.antall === 2
    && f.transformer.every((t) => Math.abs(yAv(t)) > 1));
  const eksempel = r.prøver.find((f) => f.antall === 2);
  if (eksempel) {
    console.log('  computed transform : ' + eksempel.transformer.join('  |  '));
    console.log('  inline transform   : ' + eksempel.raa.join('  |  '));
    console.log('  klasser            : ' + eksempel.klasser.join('  |  '));
    console.log('  topp-posisjon      : ' + eksempel.topp.join(' px  |  ') + ' px');
    console.log('  opacity            : ' + eksempel.opacity.join('  |  '));
    console.log('  antall animasjoner : ' + eksempel.animasjoner.join('  |  '));
    const yAlle = r.prøver.filter((x) => x.antall === 2)
      .map((x) => x.transformer.map((t) => Math.round(yAv(t))).join('/'));
    console.log('  y-forflytning gjennom overgangen (side1/side2):');
    console.log('    ' + yAlle.join('   '));
  }
  const toSider = r.prøver.filter((f) => f.antall === 2).length;
  const brandFlytt = r.prøver
    .map((f) => f.brandTop)
    .filter((v) => v !== null)
    .reduce((maks, v) => Math.max(maks, Math.abs(v - r.brandFør)), 0);

  console.log(`\n${merkelapp}`);
  console.log(`  bilder med to sider i DOM-en : ${toSider} av ${r.prøver.length}`);
  console.log(`  bilder der BEGGE har transform: ${samtidig.length}`);
  console.log(`  ordmerket flyttet seg maks   : ${brandFlytt} px`);
  if (rm) {
    console.log(`  -> ${samtidig.length === 0 ? 'OK: ingen bevegelse ved redusert bevegelse' : 'FEIL: noe beveger seg'}`);
  } else {
    console.log(`  -> ${samtidig.length > 0 ? 'OK: begge flater beveger seg SAMTIDIG' : 'FEIL: de beveger seg ikke samtidig'}`);
    console.log(`  -> ${brandFlytt <= 1 ? 'OK: skallet star stille' : 'FEIL: skallet flytter seg'}`);
  }
}

await browser.close();
server.kill();
