/**
 * T2 steg 1 — MÅLEINSTRUMENTET.
 *
 * Bakgrunn: det finnes null maskinell verifikasjon av appens Hjem-flate i dag.
 * `docs/design-notes/b1-proof/verify-cta.mjs` måler kun proofen (en frittstående
 * HTML-fil). Appens komponenttester bruker `renderToStaticMarkup` — de kan ikke
 * se timing, bevegelse, remount eller stillhet. Art bible-en formulerer likevel
 * kravene som MÅLTE (jf. «maskinmålt, ikke vurdert med øyet»).
 *
 * Derfor: dette skriptet er bygget FØR ombyggingen, og skal være RØDT nå.
 * Er det grønt fra start, er det feil skrevet.
 *
 * Kjøres etter `npm run build`:  node tools/verify-hjem.mjs
 * Exit 1 hvis noen port stryker.
 *
 * Portene er de samme som proofen allerede består, oversatt til appens DOM:
 * VIKTIG: hver port krever at oppfoerselen FINNES. Foerste utkast besto 7 av 8
 * fordi ingenting skjedde — en port som passerer paa fravaer er ikke en port.
 * Derfor har hver port en FORUTSETNING i tillegg til kravet.
 *
 *   1. maskoten BOYER seg, og blir staaende forankret mens den gjor det
 *   2. instrumentet hopper ikke i høyde
 *   3. de to posene dekker alltid ≥ 0,999 til sammen (krysstoningsregelen)
 *   4. håndgli ≤ 1,00 px per hånd (portdom 21)
 *   5. bevegelsen er interpolert, ikke et hopp
 *   6. ≥ 500 ms full stillstand før resultatet kommer (eierkrav)
 *   7. kun én flate synlig gjennom momentet
 *   8. ingenting beveger seg i hvile før CTA trykkes
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const PORT = Number(process.env.VERIFY_PORT ?? 4183);
const BASE = `http://localhost:${PORT}`;
const MIN_STILLHET_MS = 500;
const MAKS_HANDGLI_PX = 1.0;

/** Håndenes posisjon i maskotens lokale koordinater, alfa-målt i
 *  docs/design-notes/b1-proof/measure-hands.mjs. Relativt til transform-origin. */
const HENDER = { venstre: [-34.5, 0.1], hoyre: [34.3, 0.1] };

const porter = [];
const port = (navn, bestatt, detalj) => porter.push({ navn, bestatt, detalj });

async function ventPaServer(url, server, timeoutMs = 30_000) {
  const frist = Date.now() + timeoutMs;
  while (Date.now() < frist) {
    if (server.exitCode !== null) throw new Error(`preview døde med kode ${server.exitCode}`);
    try { if ((await fetch(url)).ok) return; } catch { /* ikke oppe ennå */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview svarte ikke på ${url}`);
}

const matrise = (t) => {
  const m = t?.match(/matrix\(([^)]+)\)/);
  return m ? m[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
};
const yForskyvning = (t, [px, py]) => { const [, b, , d] = matrise(t); return b * px + d * py; };
const vinkel = (t) => { const [a, b] = matrise(t); return (Math.atan2(b, a) * 180) / Math.PI; };

const server = spawn(process.execPath, [VITE_CLI, 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit', shell: false,
});
let browser;
try {
  await ventPaServer(BASE, server);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const jsFeil = [];
  page.on('pageerror', (e) => jsFeil.push(String(e)));

  // Deterministisk vær — met.no er låst motormappe, så vi avskjærer på nettverket
  // i stedet for å endre appkode.
  await page.route('**/api/forecast*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      tempC: 1, feelsLikeC: -3, symbol: 'partlycloudy_day', windMs: 2.4, precipMmPerHour: 0,
      updatedAt: new Date('2026-08-03T08:00:00Z').toISOString(), place: 'Trondheim',
    }) }));

  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const finnes = await page.evaluate(() => ({
    maskot: !!document.querySelector('.hjm-mascot-normal'),
    panel: !!document.querySelector('.hjm-panel-slot'),
    cta: !!document.querySelector('.hjm-cta'),
  }));
  if (!finnes.maskot || !finnes.panel || !finnes.cta) {
    port('flaten finnes', false, `maskot=${finnes.maskot} panel=${finnes.panel} cta=${finnes.cta}`);
  } else {
    // ── 8. hvile ──────────────────────────────────────────────────────────
    const hvile = await page.evaluate(async () => {
      const les = () => [...document.querySelectorAll('.hjm-mascot, .hjm-scanline, .hjm-panel-slot')]
        .map((e) => { const c = getComputedStyle(e); return c.transform + '|' + c.opacity; }).join(' ');
      const a = les();
      await new Promise((r) => setTimeout(r, 800));
      return { for: a, etter: les() };
    });
    port('8. ingenting beveger seg i hvile', hvile.for === hvile.etter, '');

    // ── 1-5, 7. CTA-momentet ──────────────────────────────────────────────
    const prover = await page.evaluate(async () => {
      const ut = [];
      const norm = document.querySelector('.hjm-mascot-normal');
      const cur = document.querySelector('.hjm-mascot-curious');
      const beveger = norm?.parentElement ?? norm;
      const panel = document.querySelector('.hjm-panel-slot');
      const t0 = performance.now();
      window.__t0 = t0;
      document.querySelector('.hjm-cta').click();
      await new Promise((res) => {
        const tikk = () => {
          const cs = getComputedStyle(beveger);
          ut.push({
            transform: cs.transform,
            oNorm: Number(getComputedStyle(norm).opacity),
            oCur: cur ? Number(getComputedStyle(cur).opacity) : 0,
            top: norm.offsetTop, left: norm.offsetLeft,
            panelH: panel.offsetHeight,
            flater: document.querySelectorAll('[data-screen]:not([hidden])').length || 1,
          });
          if (performance.now() - t0 < 700) requestAnimationFrame(tikk); else res();
        };
        requestAnimationFrame(tikk);
      });
      return ut;
    });

    const posisjoner = new Set(prover.map((p) => `${p.top}/${p.left}`)).size;
    const vinklerAlle = [...new Set(prover.map((p) => vinkel(p.transform).toFixed(2)))];
    const boyerSeg = vinklerAlle.length > 1;          // FORUTSETNING: noe skjer
    port('1. maskoten bøyer seg OG står forankret', boyerSeg && posisjoner === 1,
      boyerSeg ? `${posisjoner} layoutposisjoner` : 'INGEN BØYNING — funksjonen finnes ikke');

    const hoyder = [...new Set(prover.map((p) => p.panelH))];
    port('2. instrumentet hopper ikke i høyde', hoyder.length === 1 || hoyder.length > 8,
      `${hoyder.length} høyder (1 = låst, >8 = jevn åpning, 2-8 = HOPP)`);

    const minDekning = Math.min(...prover.map((p) => p.oNorm + p.oCur));
    const harPoseskifte = new Set(prover.map((p) => p.oCur.toFixed(2))).size > 1;
    port('3. poseskifte skjer OG dekning ≥ 0,999', harPoseskifte && minDekning >= 0.999,
      harPoseskifte ? `laveste ${minDekning.toFixed(3)}` : 'INGEN POSEKRYSSTONING — funksjonen finnes ikke');

    const hvile0 = prover[0].transform, boyd = prover[prover.length - 1].transform;
    const gli = Object.entries(HENDER).map(([n, p]) =>
      [n, Math.abs(yForskyvning(boyd, p) - yForskyvning(hvile0, p))]);
    const verst = Math.max(...gli.map(([, v]) => v));
    const roterer = Math.abs(vinkel(boyd) - vinkel(hvile0)) > 0.05;
    port(`4. rotasjon finnes OG håndgli ≤ ${MAKS_HANDGLI_PX} px`, roterer && verst <= MAKS_HANDGLI_PX,
      roterer ? gli.map(([n, v]) => `${n} ${v.toFixed(2)}`).join(', ') : 'INGEN ROTASJON å måle gli mot');

    const vinkler = [...new Set(prover.map((p) => vinkel(p.transform).toFixed(2)))];
    port('5. bevegelsen er interpolert, ikke et hopp', vinkler.length > 8,
      `${vinkler.length} distinkte vinkler`);

    port('7. kun én flate synlig gjennom momentet',
      new Set(prover.map((p) => p.flater)).size === 1 && prover[0].flater === 1,
      `${[...new Set(prover.map((p) => p.flater))].join('/')} samtidige flater`);

    // ── 6. stillstand ─────────────────────────────────────────────────────
    const stille = await page.evaluate(async () => {
      const ut = [];
      const se = () => [...document.querySelectorAll('.hjm-mascot, .hjm-scanline, .hjm-panel-slot, .hjm-rows, .hjm-synth')]
        .map((e) => { const c = getComputedStyle(e); return c.transform + '|' + c.opacity; }).join(' ');
      await new Promise((res) => {
        const tikk = () => {
          const t = performance.now() - window.__t0;
          if (t >= 2000) ut.push({ t: Math.round(t), s: se() });
          if (t < 3400) requestAnimationFrame(tikk); else res();
        };
        requestAnimationFrame(tikk);
      });
      return ut;
    });
    let sisteEndring = stille.length ? stille[0].t : 0;
    for (let i = 1; i < stille.length; i += 1) if (stille[i].s !== stille[i - 1].s) sisteEndring = stille[i].t;
    // Appens egen scanlengde, ikke en antatt verdi.
    const scanMs = await page.evaluate(() => window.__scanDuration ?? 3200);
    const stillhet = scanMs - sisteEndring;
    port(`6. ≥ ${MIN_STILLHET_MS} ms stillstand før resultatet`, stillhet >= MIN_STILLHET_MS,
      `${stillhet} ms (siste bevegelse ${sisteEndring} ms)`);

    if (jsFeil.length) port('ingen JS-feil', false, jsFeil.join('; '));
  }
} catch (e) {
  port('kjørte i det hele tatt', false, String(e.message ?? e));
} finally {
  if (browser) await browser.close();
  server.kill();
}

const bredde = Math.max(...porter.map((p) => p.navn.length));
console.log('\n── verify-hjem: porter mot den EKTE appen ──');
for (const p of porter) {
  console.log(`  ${p.bestatt ? '✓' : '✗'} ${p.navn.padEnd(bredde)}  ${p.detalj}`);
}
const stryk = porter.filter((p) => !p.bestatt).length;
console.log(`\n${porter.length - stryk}/${porter.length} porter bestått.` +
  (stryk ? `  ${stryk} stryker — som forventet før T2 er bygget.` : ''));
process.exit(stryk ? 1 : 0);
