/**
 * Automatisk gjennomgang av den utlagte laben — erstatter eierens manuelle
 * klikking gjennom 4 retninger × 10 scenarier, IKKE foreldretesten.
 *
 * Playwright kan måle om flaten fungerer, viser gyldighet, degraderer ved
 * utløp og har store nok trykkflater. Den kan ikke bli forvirret, nøle
 * eller misforstå — og det er nettopp det foreldretesten måler.
 *
 * Hver påstand har en fasit i DOM-en, og sveipet feiler (exit 1) hvis en
 * påstand mangler dekning. To mutasjonsledd sikrer at kontrollene ikke
 * består vakuøst.
 *
 *   node tools/lab-sveip.mjs [--base https://babyora-lab.vercel.app/] [--bilder <mappe>]
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../package.json', import.meta.url));
const { chromium } = require('playwright');

const arg = (navn, standard) => {
  const i = process.argv.indexOf(navn);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : standard;
};
const BASE = arg('--base', 'https://babyora-lab.vercel.app/');
const BILDER = arg('--bilder', null);
if (BILDER) mkdirSync(BILDER, { recursive: true });

const ARMER = ['p1', 'p2', 'p3', 'p4'];
const SCENARIER = [
  'normal-dag', 'grensevaer', 'sovende-vognbarn', 'bilstol', 'manglende-vaerdata',
  'endret-vaer', 'utlopt-raad', 'ny-omsorgsperson', 'dynamic-type', 'utendorslys',
];
// Bindende forbudsliste, speiler lab/felles/tekst.ts.
const FORBUDT = [/verifisert/i, /stemte\s+\d+\s+av\s+\d+/i];

const funn = [];
const meld = (alvor, arm, scenario, tekst) => {
  funn.push({ alvor, arm, scenario, tekst });
  console.log(`${alvor === 'feil' ? 'FEIL' : 'MERK'} ${arm}/${scenario}: ${tekst}`);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function aapne(url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  const k = page.getByRole('button', { name: /Jeg forstår/i });
  if (await k.count()) await k.first().click();
  await page.waitForTimeout(700);
}

let antall = 0;
for (const arm of ARMER) {
  for (const scenario of SCENARIER) {
    antall++;
    await aapne(`${BASE}?modus=deltaker&arm=${arm}&scenario=${scenario}`);
    const tekst = (await page.locator('body').innerText()).trim();

    if (tekst.length < 60) meld('feil', arm, scenario, `flaten er tom eller nesten tom (${tekst.length} tegn)`);
    for (const re of FORBUDT) {
      if (re.test(tekst)) meld('feil', arm, scenario, `forbudt retorikk: ${re}`);
    }
    // Operatørkontroller skal ALDRI lekke inn i deltakerflaten (Sols FELLES-P0).
    for (const lekkasje of ['Spol +', 'Hendelseslogg', 'Vis rekkefølge', 'Skjul operatørpanel']) {
      if (tekst.includes(lekkasje)) meld('feil', arm, scenario, `operatørkontroll lekker inn: «${lekkasje}»`);
    }
    // Trykkflater: Apples minstemål er 44 pt.
    const smaa = await page.$$eval('button, a[href], [role=button]', (els) =>
      els
        .filter((e) => e.offsetParent !== null)
        .map((e) => ({ t: (e.innerText || '').trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height) }))
        .filter((x) => x.h > 0 && x.h < 44),
    );
    if (smaa.length) {
      meld('merk', arm, scenario, `${smaa.length} trykkflate(r) under 44 px: ${smaa.map((s) => `${s.t || '(uten tekst)'} ${s.h}px`).join(', ')}`);
    }
    // Vannrett rulling på 390 px betyr avkuttet innhold.
    const bredde = await page.evaluate(() => document.documentElement.scrollWidth);
    if (bredde > 392) meld('feil', arm, scenario, `siden ruller sidelengs (${bredde} px bred)`);

    if (BILDER) await page.screenshot({ path: join(BILDER, `${arm}-${scenario}.png`) });
  }
}

// Utløpsdegradering: den ENESTE kontrollen som beveger tiden. P3/P4 leverer
// uten app-åpning, så flaten må endre seg av seg selv når rådet går ut.
for (const arm of ['p1', 'p3', 'p4']) {
  await aapne(`${BASE}?modus=deltaker&arm=${arm}&scenario=normal-dag`);
  const foer = (await page.locator('body').innerText()).trim();
  const harApi = await page.evaluate(() => typeof window.__lab?.spol === 'function');
  if (!harApi) { meld('feil', arm, 'utløp', 'window.__lab.spol mangler — kan ikke flytte klokka'); continue; }
  await page.evaluate(() => window.__lab.spol(300));
  await page.waitForTimeout(1200);
  const etter = (await page.locator('body').innerText()).trim();
  if (foer === etter) meld('feil', arm, 'utløp', 'flaten er uendret 5 timer etter utstedelse — ingen degradering');
  else if (!/beregnes på nytt|gjaldt til|utløpt/i.test(etter)) {
    meld('feil', arm, 'utløp', 'flaten endret seg, men sier ikke at rådet er utløpt');
  } else console.log(`OK   ${arm}/utløp: flaten degraderte av seg selv`);
  if (BILDER) await page.screenshot({ path: join(BILDER, `${arm}-utlopt-etter-spoling.png`) });
}

// Mutasjonsledd 1: ugyldig arm skal IKKE gi deltakerflate.
await aapne(`${BASE}?modus=deltaker&arm=p9&scenario=normal-dag`);
const ugyldig = (await page.locator('body').innerText());
if (!/Operatør/i.test(ugyldig)) meld('feil', 'p9', 'mutasjon', 'ugyldig arm ga ikke operatørmodus — låsen holder ikke');
else console.log('OK   mutasjon: ugyldig arm faller til operatørmodus');

// Mutasjonsledd 2: forbudslisten må kunne slå ut. Hvis dette IKKE meldes,
// måler forbudskontrollen over ingenting.
if (!FORBUDT.some((re) => re.test('dette er verifisert')) ) {
  meld('feil', '-', 'mutasjon', 'forbudslisten treffer ikke engang en kjent brudd-streng');
} else console.log('OK   mutasjon: forbudslisten slår ut på kjent brudd');

await browser.close();

const feil = funn.filter((f) => f.alvor === 'feil');
const merk = funn.filter((f) => f.alvor === 'merk');
console.log(`\n${antall} kombinasjoner gjennomgått. ${feil.length} feil, ${merk.length} merknader.`);
if (feil.length) process.exit(1);
console.log('Ingen feil funnet i den automatiske gjennomgangen.');
