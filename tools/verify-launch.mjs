/**
 * verify-launch.mjs — måler åpningsflaten mot åpningskontraktens §8.
 *
 * Kontrakten stiller krav som ikke lar seg vurdere ved å se på koden:
 *
 *   «Ingen hvit, svart eller feil-tematisert mellomframe.»
 *   «Oppstart forsinkes aldri kunstig.»
 *
 * Det første er en FARGE i den aller første malte rammen. Det andre er en
 * VARIGHET. Begge må måles i en ekte nettleser, på den bygde appen.
 *
 * IKKE-VAKUØSITET: porten sjekker først at åpningsflaten i det hele tatt
 * fantes. Fant den ingen, ville alle målene under bestått på fravær — en app
 * uten åpningsflate har trivielt ingen feilfarget mellomframe.
 *
 *   node tools/verify-launch.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

async function ledigPort() {
  const net = await import('node:net');
  return new Promise((res) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

const PORT = await ledigPort();
const BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 100; i += 1) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* ikke oppe */ }
  await new Promise((r) => setTimeout(r, 300));
}

const browser = await chromium.launch();
const { forecastPartlyCloudy1C } = await import('../e2e/fixtures/forecast-1c-partlycloudy.js');

/** Lerretsverdiene åpningsflaten SKAL ha, per tema. */
const LERRET = { dark: [30, 20, 12], light: [249, 245, 235] };
const naer = (a, b, slakk = 10) => a.every((v, i) => Math.abs(v - b[i]) <= slakk);

const funn = [];
let feil = 0;
const meld = (ok, tekst) => {
  if (!ok) feil += 1;
  funn.push(`  ${ok ? '✓' : '✗'} ${tekst}`);
};

for (const tema of ['dark', 'light']) {
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: tema,
  });
  await p.route('**/api/forecast*', (r) => r.fulfill({
    contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()),
  }));

  const start = Date.now();
  await p.goto(BASE, { waitUntil: 'commit' });

  /* Aller første malte ramme. `commit` betyr at dokumentet har begynt å
     ankomme — knipser vi her, ser vi det brukeren ser først. */
  const forste = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 60 } });
  const { data } = await (await import('sharp')).default(forste).raw()
    .toBuffer({ resolveWithObject: true });
  const piksel = [data[0], data[1], data[2]];

  meld(
    naer(piksel, LERRET[tema]),
    `${tema}: første malte ramme er lerretsfargen — rgb(${piksel.join(',')}), `
    + `ventet rgb(${LERRET[tema].join(',')})`,
  );

  /* IKKE-VAKUØSITET: fantes flaten i det hele tatt? */
  const fantes = await p.evaluate(() => document.getElementById('launch') !== null);
  meld(fantes, `${tema}: åpningsflaten fantes i dokumentet`);

  /* Ordmerket skal være der, og ta temaets blekk via currentColor. */
  const merke = await p.evaluate(() => {
    const el = document.querySelector('#launch svg');
    if (el === null) return null;
    const r = el.getBoundingClientRect();
    return { bredde: Math.round(r.width), venstre: Math.round(r.left), farge: getComputedStyle(el).color };
  });
  meld(merke !== null && merke.bredde > 80, `${tema}: ordmerket er tegnet (${merke?.bredde ?? 0} px bredt)`);
  /* MÅLT 2026-08-05: første utgave krevde `venstre < 195` — halve skjermen.
     Portens egen mutasjonsprøve avslørte hullet: et SENTRERT ordmerke starter
     på 82 px og gikk rett gjennom. Terskelen var tatt ut av lufta, ikke ut av
     kontrakten.
     §1 sier «venstrejustert på det globale gridet», og gridets innrykk er
     24 px. Kravet er derfor at merket STARTER der, med litt slakk for
     safe-area på en telefon med hakk. */
  const GRID_INNRYKK = 24;
  meld(
    merke !== null && merke.venstre <= GRID_INNRYKK + 8,
    `${tema}: ordmerket er VENSTREJUSTERT på gridet (${merke?.venstre ?? '?'} px, `
    + `krav ≤ ${GRID_INNRYKK + 8} — et sentrert merke ville ligget på ~82)`,
  );

  /* Flaten skal SLIPPE — og ikke etter en timer. */
  await p.waitForFunction(() => document.getElementById('launch') === null, { timeout: 8000 })
    .then(() => meld(true, `${tema}: flaten slapp etter ${Date.now() - start} ms`))
    .catch(() => meld(false, `${tema}: flaten ble STÅENDE — appen ser ut som den henger`));

  await p.close();
}

/* «Forsinkes aldri kunstig»: flaten skal ikke ha en fast varighet. Finner vi
   en setTimeout med et tall som ligner en visningstid i kilden, er det
   nettopp en kunstig forsinkelse. */
const kilde = (await import('node:fs')).readFileSync('src/lib/launch-handoff.ts', 'utf8');
const timere = [...kilde.matchAll(/setTimeout\([^,]+,\s*(\d+)/gu)].map((m) => Number(m[1]));
const mistenkelige = timere.filter((ms) => ms >= 600 && ms < 4000);
meld(
  mistenkelige.length === 0,
  `ingen kunstig visningstid i handoff-en (fant timere: ${timere.join(', ') || 'ingen'})`,
);

await browser.close();
server.kill();

console.log('\n── verify-launch: åpningskontrakten §1 + §8 ──');
for (const f of funn) console.log(f);
console.log(`\n${funn.length - feil}/${funn.length} mål bestått.`);
process.exitCode = feil === 0 ? 0 : 1;
