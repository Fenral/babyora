// Fase 11 runde 2-bevis — deltakermodus-skjermbevis for Sols review.
//
// Kjøres ETTER `npm run build:lab`. Skriver til
// docs/design-lab/appendix/fase11-bevis/.
//
// Kontrakt (Sols «Krav for neste review», sol-review-fase10.md):
//  1. Første faktiske 390×844-viewport for alle fem armer — UTEN testsele
//     (deltakermodus: ?modus=deltaker&arm=…&scenario=…&bekreftet=1).
//  2. P1 bilstol: steg-for-steg-sekvens t.o.m. HB-9-steget, «Stemmer
//     ikke»-grenen, nakkekontrollen og kvitteringen.
//  3. P1 normal-dag: hel sløyfe (faseliste → bekreft → nakkekontroll →
//     Alt vel → kvittering).
//  4. P1 utilgjengelig: «Rådet er utløpt» og «Kan ikke beregnes».
//  5. P2: kald/trygg/varm kandidat i normal-dag og sovende-vognbarn,
//     årsakskjeden, og «Kan ikke beregnes» med deaktiverte chips.
//     NB: kandidatId er selens PROP (default 'trygg') og er ikke
//     URL-eksponert — kald/varm konstrueres derfor via chip-interaksjon
//     på deltakerflaten (samme mutasjon som forhaandsdefinertKandidat:
//     fjern kritiske lag / legg til VARM_TILLEGG), og posisjonen
//     VERIFISERES i figurens tekstparitet (figcaption).
//  6. P3 endret-vaer: V1-brief, V2-brief (handlingen SKAL være endret —
//     verifiseres tekstlig), og EKTE utløp (klokka spolt forbi gyldigTil
//     med prototypens egen spol-kontroll — Operatør-panelet finnes ikke i
//     deltakermodus) med verifisert maskering.
//  7. P4: brief → «Åpne hele protokollen» → protokoll → retur, med
//     tekstlig verifisert briefId+versjon-kontinuitet, i normal-dag og
//     endret-vaer (delta + første protokollhandling verifisert).
//  8. A11y: p1/p2 i dynamic-type (storTekst) og utendorslys (høykontrast).
//
// Sols P0 håndheves: hver påstått tilstand verifiseres i DOM-en før
// skjermbildet regnes som bevis. Kan tilstanden ikke verifiseres,
// feiler skriptet med exit 1 og klar melding.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'design-lab', 'appendix', 'fase11-bevis');
mkdirSync(OUT, { recursive: true });

const PORT = 4182;
const BASE = `http://127.0.0.1:${PORT}/lab/`;
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const server = spawn(
  process.execPath,
  [VITE, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort', '--config', 'docs/design-lab/lab/vite.config.ts'],
  { cwd: ROOT, stdio: 'ignore' },
);

/* ------------------------------------------------------------------ *
 * Verifiseringsbokholderi — Sols P0: bevis skal vise det bildeteksten
 * påstår. Feilede verifiseringer samles og gir exit 1 til slutt.
 * ------------------------------------------------------------------ */
const passert = [];
const feilet = [];
let antallSkudd = 0;

function bekreft(navn, betingelse, detalj = '') {
  if (betingelse) {
    passert.push(navn);
    console.log(`  PASS ${navn}`);
  } else {
    feilet.push(`${navn}${detalj ? ` — ${detalj}` : ''}`);
    console.error(`  FEIL ${navn}${detalj ? ` — ${detalj}` : ''}`);
  }
  return betingelse;
}

/** Hard verifisering: kaster og stopper seksjonen (sekvensen er ugyldig). */
function krev(navn, betingelse, detalj = '') {
  if (!bekreft(navn, betingelse, detalj)) {
    throw new Error(`Verifisering feilet: ${navn}${detalj ? ` — ${detalj}` : ''}`);
  }
}

async function skudd(page, navn, { fullPage = true } = {}) {
  await page.screenshot({ path: join(OUT, `${navn}.png`), fullPage });
  antallSkudd++;
  console.log(`  SKUDD ${navn}.png${fullPage ? '' : ' (viewport)'}`);
}

function deltakerURL(arm, scenario, ekstra = '') {
  return `${BASE}?modus=deltaker&arm=${arm}&scenario=${scenario}&bekreftet=1${ekstra}`;
}

async function aapne(page, arm, scenario, ekstra = '') {
  await page.goto(deltakerURL(arm, scenario, ekstra), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

async function kroppstekst(page) {
  return page.locator('body').innerText();
}

/** Deltakermodus-kontrakten: ingen operatørutstyr i deltakerens flate. */
async function sjekkDeltakerRen(page, merkelapp) {
  const tekst = await kroppstekst(page);
  bekreft(
    `${merkelapp}: uten testsele`,
    !tekst.includes('Operatør — scenario, klokke, logg') &&
      !/Williams/.test(tekst) &&
      !/Tøm logg|Last ned logg/.test(tekst) &&
      (await page.locator('select').count()) === 0,
    'operatørutstyr synlig i deltakermodus',
  );
}

/* ------------------------------------------------------------------ *
 * P1-hjelpere (avviksmodus: aktivt steg leses fra «Steg X av Y»-kortet)
 * ------------------------------------------------------------------ */
async function aktivtSteg(page) {
  return page.evaluate(() => {
    const ps = [...document.querySelectorAll('main p')];
    const teller = ps.find((p) => /^Steg \d+ av \d+$/.test((p.textContent ?? '').trim()));
    if (!teller) return null;
    const kort = teller.nextElementSibling;
    return {
      teller: teller.textContent.trim(),
      tekst: kort ? kort.innerText : '',
    };
  });
}

async function klikkKnapp(page, navnRegex) {
  await page.getByRole('button', { name: navnRegex }).first().click();
  await page.waitForTimeout(250);
}

/* ------------------------------------------------------------------ *
 * P2-hjelpere
 * ------------------------------------------------------------------ */
async function figurtekst(page) {
  const fig = page.locator('figure figcaption');
  return (await fig.count()) ? (await fig.first().innerText()).trim() : '';
}

const CHIPS = 'div[role="group"][aria-label="Kandidat-antrekk"] button';

/** Klikk av valgte chips (yttertøy-lignende først) til posisjonen nås. */
async function lagKaldKandidat(page) {
  for (let i = 0; i < 12; i++) {
    if (/under kaldgulvet/i.test(await figurtekst(page))) return true;
    const valgte = await page.locator(`${CHIPS}[aria-pressed="true"]`).all();
    if (valgte.length === 0) return false;
    const navn = await Promise.all(valgte.map((c) => c.innerText()));
    // Speiler forhaandsdefinertKandidat: varmest kategori (yttertøy) først.
    let indeks = navn.findIndex((n) => /dress|jakke|pose/i.test(n));
    if (indeks < 0) indeks = navn.findIndex((n) => /mellomlag|genser|sett/i.test(n));
    if (indeks < 0) indeks = 0;
    await valgte[indeks].click();
    await page.waitForTimeout(200);
  }
  return /under kaldgulvet/i.test(await figurtekst(page));
}

/** Legg til VARM_TILLEGG-chipsene (to ekstra mellomlag). */
async function lagVarmKandidat(page) {
  for (const navn of ['ekstra ullgenser', 'ekstra fleecegenser']) {
    await page.locator(CHIPS).filter({ hasText: navn }).first().click();
    await page.waitForTimeout(200);
  }
  return /over varmetaket/i.test(await figurtekst(page));
}

/* ------------------------------------------------------------------ *
 * P3/P4-hjelpere
 * ------------------------------------------------------------------ */
async function widgetHandling(page, seksjonsnavn) {
  return page.evaluate((navn) => {
    const seksjon = document.querySelector(`section[aria-label="${navn}"]`);
    if (!seksjon) return null;
    const stor = [...seksjon.querySelectorAll('p')].find(
      (p) => p.style.fontSize === '1.3em',
    );
    return stor ? stor.textContent.trim() : null;
  }, seksjonsnavn);
}

async function seksjonstekst(page, navn) {
  const s = page.locator(`section[aria-label="${navn}"]`);
  return (await s.count()) ? (await s.first().innerText()) : '';
}

const STEMPEL_RE = /Brief #(\d+) · (\S+) · utstedt/;

/* ------------------------------------------------------------------ *
 * Seksjonene
 * ------------------------------------------------------------------ */

/** 1) Første viewport for alle fem armer — IKKE fullPage. */
async function forsteViewport(page) {
  console.log('\n[1] Første viewport — fem armer i deltakermodus');
  const armer = [
    { arm: 'p1', prompt: 'Les tilstandslinjen' },
    { arm: 'p2', prompt: 'Holder dette' },
    { arm: 'p3', prompt: 'Les gjeldende brief' },
    { arm: 'p4', prompt: 'Les brief-flaten' },
  ];
  for (const { arm, prompt } of armer) {
    await aapne(page, arm, 'normal-dag');
    await sjekkDeltakerRen(page, `forste-viewport ${arm}`);
    bekreft(
      `forste-viewport ${arm}: oppgaveprompt synlig`,
      (await kroppstekst(page)).includes(prompt),
      `fant ikke «${prompt}»`,
    );
    await skudd(page, `01-forste-viewport--${arm}`, { fullPage: false });
  }
  await aapne(page, 'null', 'normal-dag', '&oppgave=paakledning');
  await sjekkDeltakerRen(page, 'forste-viewport null-paakledning');
  bekreft(
    'forste-viewport null: påkledningsprompt synlig',
    (await kroppstekst(page)).includes('Bestem hva barnet skal ha på'),
  );
  await skudd(page, '01-forste-viewport--null-paakledning', { fullPage: false });
}

/** 2) P1 bilstol-sekvensen: steg for steg t.o.m. HB-9 + gren + avslutning. */
async function p1Bilstol(page) {
  console.log('\n[2] P1 bilstol — avvikssekvens med HB-9');
  await aapne(page, 'p1', 'bilstol');
  krev('p1-bilstol: modus er Avvik', (await kroppstekst(page)).includes('Avvik'));

  let hb9Funnet = false;
  let hb9Steg = '';
  for (let i = 0; i < 25; i++) {
    const steg = await aktivtSteg(page);
    if (!steg) break; // fase 'ferdig'

    const erHb9 = !hb9Funnet && /bilstol/i.test(steg.tekst);
    const erNakkesjekk = /Kjenn på nakken før dere går/.test(steg.tekst);

    if (!hb9Funnet || erNakkesjekk) {
      const navn = erNakkesjekk
        ? '02-p1-bilstol--nakkekontroll'
        : `02-p1-bilstol--steg-${String(i + 1).padStart(2, '0')}${erHb9 ? '-hb9' : ''}`;
      await skudd(page, navn);
    }

    if (erHb9) {
      hb9Funnet = true;
      hb9Steg = steg.teller;
      bekreft(
        'p1-bilstol: HB-9-steget nevner dress',
        /dress/i.test(steg.tekst),
        steg.tekst.slice(0, 120),
      );
      // «Stemmer ikke»-grenen på selve HB-9-steget: korreksjonen skal synes.
      await klikkKnapp(page, /^Stemmer ikke$/);
      const korr = await kroppstekst(page);
      krev(
        'p1-bilstol: korreksjon synlig etter «Stemmer ikke»',
        korr.includes('Bytt eller fjern ett lag'),
      );
      await skudd(page, '02-p1-bilstol--stemmer-ikke');
    }

    if (erNakkesjekk) {
      krev(
        'p1-bilstol: autoritetslinjen på nakkekontrollen',
        steg.tekst.includes('Protokollen ser været. Du ser barnet.'),
      );
    }

    await klikkKnapp(page, /^(Bekreft — gjort|Neste)$/);

    if (erNakkesjekk) break;
  }

  krev('p1-bilstol: HB-9-steget funnet i sekvensen', hb9Funnet);
  console.log(`  HB-9-plassering: ${hb9Steg}`);

  const slutt = await kroppstekst(page);
  krev('p1-bilstol: kvittering etter sløyfen', /god tur/.test(slutt) && /Grunnlag:/.test(slutt));
  await skudd(page, '02-p1-bilstol--kvittering');
}

/** 3) P1 normal-dag: hel sløyfe. */
async function p1Normal(page) {
  console.log('\n[3] P1 normal-dag — hel sløyfe');
  await aapne(page, 'p1', 'normal-dag');
  const start = await kroppstekst(page);
  krev(
    'p1-normal: faseinndelt liste (Vanlig dag + faser)',
    start.includes('Vanlig dag') &&
      /på barnet/i.test(start) &&
      /i vognen/i.test(start),
  );
  await skudd(page, '03-p1-normal--1-faseliste');

  await klikkKnapp(page, /bekreft alt$/);
  const kontroll = await kroppstekst(page);
  krev(
    'p1-normal: nakkekontroll-flaten etter bekreft',
    kontroll.includes('Kjenn på nakken før dere går') &&
      kontroll.includes('Alt vel — nakken er sjekket') &&
      kontroll.includes('Protokollen ser været. Du ser barnet.'),
  );
  await skudd(page, '03-p1-normal--2-nakkekontroll');

  await klikkKnapp(page, /^Alt vel — nakken er sjekket$/);
  const ferdig = await kroppstekst(page);
  krev('p1-normal: «Alt vel» kvittert', /god tur/.test(ferdig));
  await skudd(page, '03-p1-normal--3-alt-vel', { fullPage: false });

  krev('p1-normal: kvittering med grunnlag', /Grunnlag:/.test(ferdig));
  await skudd(page, '03-p1-normal--4-kvittering');
}

/** 4) P1 utilgjengelig: utløpt + kan ikke beregnes. */
async function p1Utilgjengelig(page) {
  console.log('\n[4] P1 utilgjengelig — utløpt og manglende data');
  await aapne(page, 'p1', 'utlopt-raad');
  const utlopt = await kroppstekst(page);
  krev(
    'p1-utlopt: topptekst «Rådet er utløpt» + «Beregn på nytt»',
    utlopt.includes('Rådet er utløpt') && utlopt.includes('Beregn på nytt'),
  );
  bekreft(
    'p1-utlopt: ingen aktiv-semantikk (verken «Avvik» eller «Gjelder til»)',
    !/Gjelder til \d/.test(utlopt) && !/\bAvvik\b/.test(utlopt),
    'utløpt råd bærer fortsatt aktiv-semantikk',
  );
  await skudd(page, '04-p1-utlopt--topptekst');

  await aapne(page, 'p1', 'manglende-vaerdata');
  const mangler = await kroppstekst(page);
  krev(
    'p1-mangler: «Kan ikke beregnes» + «Beregn på nytt»',
    mangler.includes('Kan ikke beregnes') && mangler.includes('Beregn på nytt'),
  );
  bekreft(
    'p1-mangler: ingen utløpssemantikk ved datamangel',
    !/utløpt|gjaldt til/i.test(mangler),
  );
  await skudd(page, '04-p1-mangler--kan-ikke-beregnes');
}

/** 5) P2: tre kandidater × to scenarier + årsakskjede + maskert. */
async function p2Kandidater(page) {
  console.log('\n[5] P2 — kald/trygg/varm, årsakskjede og maskert');
  for (const scenario of ['normal-dag', 'sovende-vognbarn']) {
    // TRYGG: selens default-kandidat (kandidatId='trygg') — anbefalingen.
    await aapne(page, 'p2', scenario);
    krev(
      `p2-${scenario}-trygg: posisjon i-spennet`,
      /i trygt spenn/i.test(await figurtekst(page)),
      await figurtekst(page),
    );
    await skudd(page, `05-p2-${scenario}--trygg-i-spennet`);

    // VARM: + to mellomlag (VARM_TILLEGG) → over taket.
    krev(
      `p2-${scenario}-varm: posisjon over-tak`,
      await lagVarmKandidat(page),
      await figurtekst(page),
    );
    if (scenario === 'sovende-vognbarn') {
      bekreft(
        'p2-sovende-varm: varmetaket er hard grense (invertert)',
        /hard(e)? grense/i.test(await figurtekst(page)),
        await figurtekst(page),
      );
    }
    await skudd(page, `05-p2-${scenario}--varm-over-tak`);

    // KALD: fjern kritiske lag til kandidaten står under gulvet.
    await aapne(page, 'p2', scenario);
    krev(
      `p2-${scenario}-kald: posisjon under-gulv`,
      await lagKaldKandidat(page),
      await figurtekst(page),
    );
    await skudd(page, `05-p2-${scenario}--kald-under-gulv`);
  }

  // Årsakskjeden: én chip-endring → «hva flyttet markøren» synlig.
  await aapne(page, 'p2', 'normal-dag');
  await page.locator(CHIPS).filter({ hasText: 'ekstra teppe' }).first().click();
  await page.waitForTimeout(250);
  const forklaring = await page.locator('p[aria-live="polite"]').innerText();
  krev(
    'p2-aarsakskjede: endringsforklaring viser markørbevegelsen',
    /markøren/.test(forklaring) &&
      /(steg mot taket|falt mot gulvet|sto i ro)/.test(forklaring),
    forklaring,
  );
  await skudd(page, '05-p2--aarsakskjede');

  // Maskert (mangler data): «Kan ikke beregnes», deaktiverte chips,
  // ingen utløpssemantikk.
  await aapne(page, 'p2', 'manglende-vaerdata');
  const mangler = await kroppstekst(page);
  krev(
    'p2-mangler: «Kan ikke beregnes» + gjenoppretting',
    mangler.includes('Kan ikke beregnes') && mangler.includes('Hent værdata på nytt'),
  );
  krev(
    'p2-mangler: chips er deaktivert',
    (await page.locator('div[role="group"] button[disabled]').count()) > 0,
  );
  bekreft(
    'p2-mangler: ingen utløpssemantikk ved datamangel',
    !/utløpt|gjaldt til/i.test(mangler),
  );
  await skudd(page, '05-p2--manglende-vaerdata');
}

/** 6) P3: V1 → V2 (handlingsendring verifisert) → ekte utløp. */
async function p3Tidslinje(page) {
  console.log('\n[6] P3 endret-vaer — V1, V2 og ekte utløp');
  await aapne(page, 'p3', 'endret-vaer');

  const v1Tekst = await seksjonstekst(page, 'Simulert widget');
  const handlingV1 = await widgetHandling(page, 'Simulert widget');
  krev('p3-v1: Brief #1 gjeldende', /Brief #1\b/.test(v1Tekst));
  krev('p3-v1: handling lest fra widgeten', handlingV1 !== null, 'fant ingen handling');
  console.log(`  V1-handling: «${handlingV1}»`);
  await skudd(page, '06-p3-endret-vaer--1-v1-brief');

  // Spol +30: V2 ankommer (10:20) og forsinket V1 forkastes (10:30).
  await klikkKnapp(page, /^Spol \+30 min$/);
  const v2Tekst = await seksjonstekst(page, 'Simulert widget');
  const handlingV2 = await widgetHandling(page, 'Simulert widget');
  krev('p3-v2: Brief #2 gjeldende', /Brief #2\b/.test(v2Tekst));
  krev(
    'p3-v2: handlingen er ENDRET fra V1 (Sols P3-P1)',
    handlingV2 !== null && handlingV2 !== handlingV1,
    `V1=«${handlingV1}» V2=«${handlingV2}»`,
  );
  console.log(`  V2-handling: «${handlingV2}»`);
  bekreft(
    'p3-v2: forsinket V1 forkastet synlig i hendelsesloggen',
    /Forkastet: Brief #1/.test(await kroppstekst(page)),
  );
  await skudd(page, '06-p3-endret-vaer--2-v2-brief');

  // Ekte utløp: spol klokka forbi gyldigTil 11:45 (10:30 → 12:00).
  for (let i = 0; i < 3; i++) await klikkKnapp(page, /^Spol \+30 min$/);
  const utloptTekst = await seksjonstekst(page, 'Simulert widget');
  krev(
    'p3-utlop: maskert ETTER at klokka passerte gyldigTil',
    utloptTekst.includes('Må beregnes på nytt') && /utløpt/.test(utloptTekst),
    utloptTekst.slice(0, 200),
  );
  krev(
    'p3-utlop: det aktive rådet er fjernet fra flaten',
    !utloptTekst.includes(handlingV2 ?? ' '),
    'V2-handlingen vises fortsatt i widgeten',
  );
  bekreft(
    'p3-utlop: klokka viser tid forbi 11:45',
    /Simulert klokke: 1[2-9]:/.test(await kroppstekst(page)),
  );
  await skudd(page, '06-p3-endret-vaer--3-utlopt-maskert');
}

/** 7) P4: overgang ende-til-ende med versjonskontinuitet. */
async function p4Overgang(page) {
  console.log('\n[7] P4 — brief → protokoll → retur');
  for (const { scenario, spolFoerst } of [
    { scenario: 'normal-dag', spolFoerst: false },
    { scenario: 'endret-vaer', spolFoerst: true },
  ]) {
    await aapne(page, 'p4', scenario);
    // endret-vaer: spol til V2 slik at deltaet + endret handling er aktive.
    if (spolFoerst) await klikkKnapp(page, /^Spol \+30 min$/);

    const briefTekst = await seksjonstekst(page, 'Simulert brief-flate');
    const stempelBrief = briefTekst.match(STEMPEL_RE);
    krev(
      `p4-${scenario}: briefId+versjon synlig på brief-flaten`,
      stempelBrief !== null,
      briefTekst.slice(0, 160),
    );
    krev(
      `p4-${scenario}: første protokollhandling («Steg 1 av …») på briefen`,
      /Steg 1 av \d+/.test(briefTekst),
    );
    if (scenario === 'endret-vaer') {
      krev(
        'p4-endret-vaer: deltaet synlig (referanse til i går)',
        /i går/.test(briefTekst),
        briefTekst.slice(0, 200),
      );
    }
    await skudd(page, `07-p4-${scenario}--1-brief`);

    await klikkKnapp(page, /^Åpne hele protokollen/);
    const protokollTekst = await seksjonstekst(page, 'Protokollovergang');
    const stempelProtokoll = protokollTekst.match(STEMPEL_RE);
    krev(
      `p4-${scenario}: protokollflaten viser SAMME briefId+versjon`,
      stempelProtokoll !== null &&
        stempelBrief !== null &&
        stempelProtokoll[1] === stempelBrief[1] &&
        stempelProtokoll[2] === stempelBrief[2],
      `brief=${stempelBrief?.[0]} protokoll=${stempelProtokoll?.[0]}`,
    );
    krev(
      `p4-${scenario}: kontinuitetslinjen navngir briefen`,
      protokollTekst.includes('Samme brief som flaten'),
    );
    console.log(`  Kontinuitet: Brief #${stempelBrief[1]} · ${stempelBrief[2]}`);
    await skudd(page, `07-p4-${scenario}--2-protokoll`);

    await klikkKnapp(page, /^Lukk protokollen$/);
    const returTekst = await seksjonstekst(page, 'Simulert brief-flate');
    const stempelRetur = returTekst.match(STEMPEL_RE);
    krev(
      `p4-${scenario}: retur viser samme brief uendret`,
      stempelRetur !== null &&
        stempelRetur[1] === stempelBrief[1] &&
        stempelRetur[2] === stempelBrief[2],
    );
    await skudd(page, `07-p4-${scenario}--3-retur`);
  }
}

/** 8) A11y: storTekst (dynamic-type) og høykontrast (utendorslys). */
async function a11y(page) {
  console.log('\n[8] A11y — dynamic-type og utendørslys');
  for (const arm of ['p1', 'p2']) {
    await aapne(page, arm, 'dynamic-type');
    const stor = await page.evaluate(() =>
      [...document.querySelectorAll('main div')].some(
        (d) => parseFloat(d.style.fontSize) >= 22,
      ),
    );
    krev(`a11y-${arm}-storTekst: rotskala ≥ 22 px (1.4×)`, stor);
    await skudd(page, `08-a11y-${arm}--stor-tekst`);

    await aapne(page, arm, 'utendorslys');
    const svart = await page.evaluate(() =>
      [...document.querySelectorAll('main div')].some(
        (d) => d.style.color === 'rgb(0, 0, 0)' || d.style.color === '#000000',
      ),
    );
    krev(`a11y-${arm}-hoykontrast: ren sort tekstfarge`, svart);
    await skudd(page, `08-a11y-${arm}--hoykontrast`);
  }
}

/* ------------------------------------------------------------------ *
 * Kjøring
 * ------------------------------------------------------------------ */
try {
  const frist = Date.now() + 30_000;
  for (;;) {
    try {
      const r = await fetch(BASE);
      if (r.ok) break;
    } catch {
      /* preview ikke oppe ennå */
    }
    if (Date.now() > frist) throw new Error('vite preview startet ikke — kjørte du npm run build:lab?');
    await new Promise((r) => setTimeout(r, 300));
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  const seksjoner = [
    forsteViewport,
    p1Bilstol,
    p1Normal,
    p1Utilgjengelig,
    p2Kandidater,
    p3Tidslinje,
    p4Overgang,
    a11y,
  ];
  for (const seksjon of seksjoner) {
    try {
      await seksjon(page);
    } catch (e) {
      feilet.push(`${seksjon.name}: seksjonen stoppet — ${e.message}`);
      console.error(`  SEKSJON FEILET (${seksjon.name}): ${e.message}`);
    }
  }

  await browser.close();

  console.log(`\nFERDIG: ${antallSkudd} skjermbevis i docs/design-lab/appendix/fase11-bevis/`);
  console.log(`Verifiseringer: ${passert.length} passert, ${feilet.length} feilet.`);
  if (feilet.length > 0) {
    console.error('\nFEILEDE VERIFISERINGER (bevis kan ikke leveres):');
    for (const f of feilet) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
} finally {
  server.kill();
}
