/**
 * skjermbilde-6b.mjs — de nye og endrede flatene fra fase 4, 5 og 6B.
 *
 * `skjermbilde-alle.mjs` dekker sju ruter fra fase 3. Denne dekker det som
 * er kommet siden: Kle på-stepperen (helt ny), Justers utdaterte tilstand og
 * skip-knapp, og de fire skjermene 6B rørte.
 *
 * IKKE-VAKUØSITET, samme regel som søsterverktøyet: hver rute sjekker at et
 * forventet ANKER finnes før den knipser. Et bilde av feil skjerm ser ut som
 * dekning uten å være det, og det er verre enn ingen bilde.
 *
 *   node tools/skjermbilde-6b.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const UT = 'tools/skjermbilder-6b';
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

const tab = async (p, navn) => {
  const b = p.locator('nav button, [class*="tab"] button').filter({ hasText: new RegExp(navn, 'iu') }).first();
  if (await b.count() === 0) return false;
  await b.click();
  await p.waitForTimeout(800);
  return true;
};

const trykk = async (p, tekst) => {
  const b = p.locator('button, [role="button"]').filter({ hasText: new RegExp(tekst, 'iu') }).first();
  if (await b.count() === 0) return false;
  await b.scrollIntoViewIfNeeded().catch(() => {});
  await b.click();
  await p.waitForTimeout(900);
  return true;
};

/** Hjems CTA → 3,2 s seremoni → resultat. Veien til både stepper og resultat. */
const tilResultat = async (p) => {
  if (!await trykk(p, 'Finn dagens antrekk')) return false;
  await p.waitForTimeout(3800);
  return true;
};

const RUTER = [
  {
    navn: '00a-landing',
    tekst: 'NY: aapningsflaten. Malt fra aller forste frame, for React finnes.',
    url: '?seed=demo',
    /* Knipses MENS flaten staar. Den slipper naar appen har malt, saa vi
       maa ta bildet for den rekker det — derfor commit, ikke load. */
    raa: true,
    vei: async () => true,
    anker: '#launch',
  },
  {
    navn: '00-onboarding',
    tekst: 'Onboarding. Forste skjerm en ny bruker ser — appens standardtema er morkt.',
    url: '',
    vei: async () => true,
    anker: '.ob-screen, h1, h2',
  },
  {
    navn: '01-hjem',
    tekst: 'Hjem i hvile. Maskoten står stille; lyset kommer fra øvre venstre.',
    vei: async () => true,
    anker: 'h1',
  },
  {
    navn: '02-scan',
    tekst: 'Seremonien, 3,2 sekunder. «Vis svaret med en gang» finnes nå også i Juster.',
    vei: async (p) => { await trykk(p, 'Finn dagens antrekk'); await p.waitForTimeout(1400); return true; },
    anker: '.hjm-panel, [class*="scan"]',
  },
  {
    navn: '03-resultat',
    tekst: 'Resultatet. Herfra går CTA-en «Kle på, steg for steg».',
    vei: tilResultat,
    anker: 'h1',
  },
  {
    navn: '04-klepaa-steg1',
    tekst: 'NY: Kle på-stepperen. Ett plagg per steg — det knappen alltid har lovet.',
    vei: async (p) => (await tilResultat(p)) && trykk(p, 'Kle på, steg for steg'),
    anker: '.kle-paa-stepper',
  },
  {
    navn: '05-klepaa-steg2',
    tekst: 'Neste steg. Sveip eller «Neste»; skallet står stille, bare sporet flytter seg.',
    vei: async (p) => {
      if (!(await tilResultat(p)) || !(await trykk(p, 'Kle på, steg for steg'))) return false;
      return trykk(p, 'Neste');
    },
    anker: '.kle-paa-stepper',
  },
  {
    navn: '06-juster',
    tekst: 'Juster. Dra en måler og svaret merkes «Utdatert» — i ord, ikke bare i farge.',
    vei: async (p) => (await tilResultat(p)) && trykk(p, 'Juster'),
    anker: 'h1, h2',
  },
  {
    navn: '06b-familie',
    tekst: 'Familie er Innstillinger — fanen rendrer den skjermen direkte.',
    vei: (p) => tab(p, 'Familie'),
    anker: 'h1, h2',
  },
  {
    navn: '07-planlegg',
    tekst: 'Planlegg. Plaggplaten var en hardkodet mørk firkant i lys modus.',
    vei: (p) => tab(p, 'Planlegg'),
    anker: 'h1, h2',
  },
  {
    navn: '08-tog-guide',
    tekst: 'Soveguiden. Temperaturskalaen var udeklarert — midten forsvant i lys modus.',
    vei: async (p) => (await tab(p, 'Familie')) && trykk(p, 'Soveguiden'),
    anker: 'h1, h2',
  },
  {
    navn: '09-varm-eller-kald',
    tekst: 'Varm eller kald. Nakke-orben pulserte i evighet; nå tre ganger, så ro.',
    vei: async (p) => (await tab(p, 'Familie')) && trykk(p, 'Varm eller kald'),
    anker: 'h1, h2',
  },
  {
    navn: '10-plaggbibliotek',
    tekst: 'Plaggbiblioteket. Siste rad og FAB lå bak tab-baren.',
    /* Biblioteket har ingen egen fane — det nas via en plaggrad i
       resultatet, gjennom plaggarket. Ruten gar derfor samme vei en
       bruker ville gatt. */
    vei: async (p) => {
      if (!await tilResultat(p)) return false;
      const rad = p.locator('.hjm-row, [class*="row"] button, li button').first();
      if (await rad.count() === 0) return false;
      await rad.click();
      await p.waitForTimeout(900);
      return trykk(p, 'Se alternativer i biblioteket');
    },
    anker: 'h1, h2',
  },
];

const rapport = [];
for (const rute of RUTER) {
  for (const tema of ['dark', 'light']) {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema,
    });
    await p.route('**/api/forecast*', (r) => r.fulfill({
      contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()),
    }));
    /* Onboarding vises bare uten barn i familien, sa den ruten ma IKKE
       seede. De ovrige seeder, ellers havner de i onboarding i stedet. */
    await p.goto(`${BASE}/${rute.url ?? '?seed=demo'}`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(rute.raa === true ? 90 : 2400);

    let kom = false;
    try { kom = await rute.vei(p); } catch { kom = false; }
    if (!kom) {
      rapport.push(`${rute.navn}-${tema}: KOM IKKE FRAM`);
      await p.close();
      continue;
    }
    const anker = p.locator(rute.anker).first();
    if (await anker.count() === 0) {
      rapport.push(`${rute.navn}-${tema}: ANKERET «${rute.anker}» MANGLER`);
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
const feilet = rapport.filter((r) => r.includes('KOM IKKE') || r.includes('MANGLER'));
console.log(`\n── ${rapport.length - feilet.length}/${rapport.length} bilder til ${UT} ──`);
for (const r of rapport) console.log(`  ${r}`);
if (feilet.length > 0) console.log(`\n  ${feilet.length} ruter kom ikke fram.`);
