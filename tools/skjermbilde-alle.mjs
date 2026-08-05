/**
 * skjermbilde-alle.mjs — før/etter-bilder av hver skjerm i migreringen.
 *
 * Fase 3 er den første runden eieren skal SE forskjell på. Uten et «før»
 * tatt på nøyaktig samme sted finnes ingen sammenligning, bare påstander.
 *
 * Kjør:  node tools/skjermbilde-alle.mjs for
 *        node tools/skjermbilde-alle.mjs etter
 *
 * Skjermene nås slik en bruker ville gjort — trykk på tabbaren, trykk på
 * raden — ikke via en intern testluke. Da fanger bildet også at veien DIT
 * fortsatt virker.
 *
 * KJENT SVAKHET, MÅLT 2026-08-05 — les dette før du stoler på en pikseldiff.
 *
 * Planlegg viste 23,66 % forskjell mellom for og etter. Ingen av delene kom
 * fra migreringen: skjermen viste «Antrekket holder» i den ene runden og
 * «Planlagt antrekk» i den andre, fordi INNHOLDET avhenger av klokka og de
 * to rundene gikk en time fra hverandre.
 *
 * En pikseldiff er derfor bare gyldig for skjermer med deterministisk
 * innhold. For de tidsavhengige må for og etter tas i samme minutt, eller
 * klokka fryses. Til det er gjort, skal et utslag på Planlegg leses som
 * «uavklart», ikke som «endret».
 *
 * IKKE-VAKUØSITET: hver rute sjekker at et forventet element FINNES før den
 * knipser. Et bilde av feil skjerm, eller av en tom skjerm, er verre enn
 * ingen bilde — det ser ut som dekning.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const RUNDE = process.argv[2] === 'etter' ? 'etter' : 'for';
const UT = `tools/migrering-skjermbilder/${RUNDE}`;
mkdirSync(UT, { recursive: true });

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

const { forecastPartlyCloudy1C } = await import('../e2e/fixtures/forecast-1c-partlycloudy.js');
const browser = await chromium.launch();

/** Trykk på en tab i bunnlinjen. */
async function tab(p, navn) {
  const b = p.locator('nav button, [class*="tab"] button').filter({ hasText: new RegExp(navn, 'iu') }).first();
  if (await b.count() === 0) return false;
  await b.click();
  await p.waitForTimeout(800);
  return true;
}

/** Trykk på en rad/knapp med gitt tekst, hvor som helst på skjermen. */
async function trykk(p, tekst) {
  const b = p.locator('button, [role="button"]').filter({ hasText: new RegExp(tekst, 'iu') }).first();
  if (await b.count() === 0) return false;
  await b.scrollIntoViewIfNeeded().catch(() => {});
  await b.click();
  await p.waitForTimeout(900);
  return true;
}

/**
 * RUTER. `vei` navigerer; `anker` er beviset på at vi kom fram.
 * Kommer vi ikke fram, skrives det i rapporten — aldri et tomt bilde.
 */
const RUTER = [
  { navn: 'hjem', vei: async () => true, anker: 'h1' },
  { navn: 'planlegg', vei: (p) => tab(p, 'Planlegg'), anker: 'h1, h2' },
  { navn: 'familie', vei: (p) => tab(p, 'Familie'), anker: '[aria-labelledby="sec-verktoy"]' },
  {
    navn: 'tog-guide',
    vei: async (p) => (await tab(p, 'Familie')) && trykk(p, 'Soveguiden'),
    anker: 'h1, h2',
  },
  {
    navn: 'varm-eller-kald',
    vei: async (p) => (await tab(p, 'Familie')) && trykk(p, 'Varm eller kald'),
    anker: 'h1, h2',
  },
  {
    navn: 'vinterprogram',
    vei: async (p) => (await tab(p, 'Familie')) && trykk(p, 'Første vinter'),
    anker: 'h1, h2',
  },
  {
    navn: 'finn-antrekk',
    vei: (p) => trykk(p, 'Finn dagens antrekk'),
    anker: 'h1, h2',
    vent: 3600, // scan-koreografien tar 3,2 s
  },
];

const rapport = [];
for (const rute of RUTER) {
  for (const tema of ['dark', 'light']) {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema,
    });
    await p.route('**/api/forecast*', (r) => r.fulfill({
      contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
    await p.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2400);

    let kom = false;
    try { kom = await rute.vei(p); } catch { kom = false; }
    if (rute.vent) await p.waitForTimeout(rute.vent);

    if (!kom) {
      rapport.push(`${rute.navn}-${tema}: KOM IKKE FRAM — ingen bilde tatt`);
      await p.close();
      continue;
    }
    const anker = p.locator(rute.anker).first();
    if (await anker.count() === 0) {
      rapport.push(`${rute.navn}-${tema}: ankeret «${rute.anker}» finnes ikke — ingen bilde tatt`);
      await p.close();
      continue;
    }
    await p.screenshot({ path: `${UT}/${rute.navn}-${tema}.png` });
    rapport.push(`${rute.navn}-${tema}.png`);
    await p.close();
  }
}

await browser.close();
server.kill();
const feilet = rapport.filter((r) => r.includes('IKKE') || r.includes('finnes ikke'));
console.log(`\n── ${RUNDE}: ${rapport.length - feilet.length}/${rapport.length} bilder til ${UT} ──`);
for (const r of rapport) console.log(`  ${r}`);
if (feilet.length) console.log(`\n  ${feilet.length} ruter kom ikke fram — se over.`);
