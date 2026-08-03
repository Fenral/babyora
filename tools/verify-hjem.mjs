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
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

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

  // Deterministisk vær i met.no sitt EGNE format. Første utkast fant opp et
  // flatt objekt; klienten forkastet det, appen falt til «sist kjente vær» og
  // CTA-en sto disabled — så alle portene stryk fordi knappen aldri ble
  // trykket. met-no/ er låst; vi svarer riktig i stedet for å endre den.
  let ruteTruffet = 0;
  await page.route('**/api/forecast*', (route) => {
    ruteTruffet += 1;
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) });
  });

  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const finnes = await page.evaluate(() => ({
    maskot: !!document.querySelector('.hjm-mascot-normal'),
    panel: !!document.querySelector('.hjm-panel-slot'),
    cta: !!document.querySelector('.hjm-cta'),
    ctaAktiv: !!document.querySelector('.hjm-cta') && !document.querySelector('.hjm-cta').disabled,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '(ingen)',
  }));
  // RIGGPORT: uten denne måler resten ingenting. Den fanger nøyaktig feilen
  // første utkast hadde — grønne porter på en flate som aldri kom i gang.
  port('0. riggen virker: vær kom fram og CTA er aktiv', finnes.ctaAktiv,
    `rute truffet ${ruteTruffet}x · h1 «${finnes.h1}» · CTA ${finnes.ctaAktiv ? 'aktiv' : 'DEAKTIVERT'}`);
  if (!finnes.maskot || !finnes.panel || !finnes.ctaAktiv) {
    port('flaten er målbar', false, `maskot=${finnes.maskot} panel=${finnes.panel} cta-aktiv=${finnes.ctaAktiv}`);
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
      /* Ankeret er det som FLYTTER SEG. Bildene ligger inset:0 inni det og
         rapporterer alltid 0 — porten min besto derfor pa fravaer selv mens
         eieren sa maskoten hoppe 10 px opp og 17 px til hoyre. Tredje gang
         samme feilklasse: mal det oyet ser, ikke det som er lettest a lese. */
      const anker = document.querySelector('.hjm-mascot-anchor');
      const cur = document.querySelector('.hjm-mascot-curious');
      const beveger = norm?.parentElement ?? norm;
      const panel = document.querySelector('.hjm-panel-slot');
      /* BASELINE FOR TRYKKET. Uten den er en endring som skjer I selve
         trykkoyeblikket usynlig: forste rAF-prove kommer etter at layouten
         allerede har skiftet, og porten melder «1 posisjon» mens eieren ser
         maskoten hoppe. */
      {
        const a = anker.getBoundingClientRect();
        ut.push({ transform: getComputedStyle(beveger).transform,
          oNorm: Number(getComputedStyle(norm).opacity),
          oCur: cur ? Number(getComputedStyle(cur).opacity) : 0,
          top: Math.round(a.top), left: Math.round(a.left), bredde: Math.round(a.width),
          panelH: panel.offsetHeight,
          flater: document.querySelectorAll('[data-screen]:not([hidden])').length || 1 });
      }
      const t0 = performance.now();
      window.__t0 = t0;
      document.querySelector('.hjm-cta').click();   // aktiv, verifisert av port 0
      await new Promise((res) => {
        const tikk = () => {
          const cs = getComputedStyle(beveger);
          ut.push({
            transform: cs.transform,
            oNorm: Number(getComputedStyle(norm).opacity),
            oCur: cur ? Number(getComputedStyle(cur).opacity) : 0,
            top: Math.round(anker.getBoundingClientRect().top),
            left: Math.round(anker.getBoundingClientRect().left),
            bredde: Math.round(anker.getBoundingClientRect().width),
            panelH: panel.offsetHeight,
            flater: document.querySelectorAll('[data-screen]:not([hidden])').length || 1,
          });
          if (performance.now() - t0 < 700) requestAnimationFrame(tikk); else res();
        };
        requestAnimationFrame(tikk);
      });
      return ut;
    });

    const posisjoner = new Set(prover.map((p) => `${p.top}/${p.left}/${p.bredde}`)).size;
    const vinklerAlle = [...new Set(prover.map((p) => vinkel(p.transform).toFixed(2)))];
    const boyerSeg = vinklerAlle.length > 1;          // FORUTSETNING: noe skjer
    port('1. maskoten bøyer seg OG står forankret', boyerSeg && posisjoner === 1,
      boyerSeg ? `${posisjoner} layoutposisjoner` : 'INGEN BØYNING — funksjonen finnes ikke');

    // Samme frekvensfelle som port 5: «> 8 høyder» målte maskinen, ikke
    // apningen. Låst (én høyde) er alltid godkjent; endrer den seg, må
    // endringen være jevn — andel nye verdier blant prøvene der høyden faktisk
    // beveger seg.
    const hoyder = [...new Set(prover.map((p) => p.panelH))];
    const hEndrer = [];
    for (let i = 1; i < prover.length; i += 1) if (prover[i].panelH !== prover[i - 1].panelH) hEndrer.push(i);
    const hUnderveis = hEndrer.length
      ? prover.slice(hEndrer[0], hEndrer[hEndrer.length - 1] + 1) : [];
    const hAndel = hUnderveis.length > 1
      ? new Set(hUnderveis.map((p) => p.panelH)).size / hUnderveis.length : 0;
    port('2. instrumentet hopper ikke i høyde', hoyder.length === 1 || hAndel >= 0.5,
      hoyder.length === 1 ? '1 høyde — låst'
        : `${hoyder.length} høyder, andel ${hAndel.toFixed(2)} (krav ≥ 0,50, ellers HOPP)`);

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

    // «Interpolert» er ikke et antall — det er en ANDEL. Et fast krav om > 8
    // distinkte vinkler måler egentlig bildefrekvensen: på en treg maskin gir
    // ekte interpolasjon 8 prøver og stryker, mens et hopp på en rask maskin
    // gir 2 vinkler uansett hvor mange prøver som tas. Derfor måles andelen
    // NYE vinkler blant prøvene mens bevegelsen faktisk pågår. Et hopp gir 2
    // vinkler uansett frekvens; interpolasjon gir en ny verdi nesten hver
    // prøve. Terskel 0,5 tåler halvert bildefrekvens uten å slippe hoppet
    // gjennom. Minst 4 distinkte verdier kreves i tillegg, så et hopp med
    // ett mellomsteg ikke kan bestå på et lite utvalg.
    const iBevegelse = [];
    for (let i = 1; i < prover.length; i += 1) {
      const a = vinkel(prover[i - 1].transform).toFixed(2);
      const b = vinkel(prover[i].transform).toFixed(2);
      if (a !== b) iBevegelse.push(i);
    }
    const forste = iBevegelse[0] ?? 0;
    const siste = iBevegelse[iBevegelse.length - 1] ?? 0;
    const underveis = prover.slice(forste, siste + 1);
    const vinkler = [...new Set(underveis.map((p) => vinkel(p.transform).toFixed(2)))];
    const andel = underveis.length > 1 ? vinkler.length / underveis.length : 0;
    port('5. bevegelsen er interpolert, ikke et hopp',
      vinkler.length >= 4 && andel >= 0.5,
      underveis.length < 2 ? 'ingen bevegelse å måle — porten kan ikke bestå på fravær'
        : `${vinkler.length} vinkler på ${underveis.length} prøver (andel ${andel.toFixed(2)}, krav ≥ 0,50)`);

    port('7. kun én flate synlig gjennom momentet',
      new Set(prover.map((p) => p.flater)).size === 1 && prover[0].flater === 1,
      `${[...new Set(prover.map((p) => p.flater))].join('/')} samtidige flater`);

    // ── 6. stillstand ─────────────────────────────────────────────────────
    // Første utgave sammenlignet ÉN streng bygget av alle elementene. Da leste
    // porten resultatøyeblikket som «bevegelse»: scanline og radene forsvinner
    // fra DOM-en når svaret kommer, strengen endrer seg, og porten strøk på
    // selve hendelsen den skulle måle stillheten FØR. Nå spores hvert element
    // for seg, og bare elementer som finnes i BEGGE nabobilder sammenlignes —
    // da er montering og avmontering ikke bevegelse.
    const stille = await page.evaluate(async () => {
      const VELG = ['.hjm-mascot', '.hjm-scanline', '.hjm-panel-slot', '.hjm-rows', '.hjm-synth'];
      const se = () => VELG.flatMap((v) => [...document.querySelectorAll(v)].map((e, i) => {
        const c = getComputedStyle(e);
        return { id: `${v}#${i}`, s: `${c.transform}|${c.opacity}` };
      }));
      const ut = [];
      await new Promise((res) => {
        const tikk = () => {
          const t = performance.now() - window.__t0;
          ut.push({ t: Math.round(t), v: se() });
          if (t < 3600) requestAnimationFrame(tikk); else res();
        };
        requestAnimationFrame(tikk);
      });
      return ut;
    });
    // Appens egen scanlengde, ikke en antatt verdi.
    const scanMs = await page.evaluate(() => window.__scanDuration ?? 3200);
    let sisteEndring = 0;
    let bevegelserTotalt = 0;
    for (let i = 1; i < stille.length; i += 1) {
      if (stille[i].t > scanMs) break;               // etter svaret måler vi ikke
      for (const e of stille[i].v) {
        const f = stille[i - 1].v.find((x) => x.id === e.id);
        if (!f || f.s === e.s) continue;             // nytt element ≠ bevegelse
        bevegelserTotalt += 1;
        sisteEndring = stille[i].t;
      }
    }
    const stillhet = scanMs - sisteEndring;
    // FORUTSETNING: porten skal ikke kunne bestå på fravær. Kom svaret aldri,
    // eller beveget ingenting seg i det hele tatt, er «stillhet» meningsløst.
    const rakkOver = stille.length > 0 && stille[stille.length - 1].t >= scanMs;
    port(`6. ≥ ${MIN_STILLHET_MS} ms stillstand før resultatet`,
      rakkOver && bevegelserTotalt > 0 && stillhet >= MIN_STILLHET_MS,
      !rakkOver ? 'målevinduet dekket ikke svaret — ikke målt'
        : bevegelserTotalt === 0 ? 'ingen bevegelse i det hele tatt — porten kan ikke bestå på fravær'
          : `${stillhet} ms (siste av ${bevegelserTotalt} bevegelser: ${sisteEndring} ms)`);

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
