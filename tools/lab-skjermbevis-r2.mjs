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
//  5. P2: kald/trygg/varm kandidat i normal-dag, sovende-vognbarn OG
//     dynamic-type (storTekst — kollisjonsbevis i stor tekst),
//     årsakskjeden, og «Kan ikke beregnes» med deaktiverte chips.
//     NB: kandidatId er selens PROP (default 'trygg') og er ikke
//     URL-eksponert — kald/varm konstrueres derfor via chip-interaksjon
//     på deltakerflaten (samme mutasjon som forhaandsdefinertKandidat:
//     fjern kritiske lag / legg til VARM_TILLEGG), og posisjonen
//     VERIFISERES i figurens tekstparitet (figcaption).
//     KOLLISJONSVAKT (Sols runde 2, P1): for hvert posisjonsbevis måles
//     bounding boxes for figurens [data-spor]-elementer (grenseetikett,
//     terskellinje, kandidatmarkør) — parvis overlapp er rødt.
//  6. P3 endret-vaer: V1-brief, V2-brief (handlingen SKAL være endret —
//     verifiseres tekstlig), og EKTE utløp (klokka spolt forbi gyldigTil).
//     SPOLING skjer via selens window.__lab.spol(min) — P3/P4 har ingen
//     tidskontroller i deltaker-DOM-en lenger (Sols runde 2, P1), og det
//     verifiseres eksplisitt at spoleknapper/klokkepanel/hendelseslogg
//     IKKE finnes i deltakerens flate. Forkastet forsinket V1 verifiseres
//     i selens logg (window.__lab.hendelser()), ikke i deltaker-DOM.
//  7. P4: brief → «Åpne hele protokollen» → protokoll → retur, med
//     tekstlig verifisert briefId+versjon-kontinuitet, i normal-dag og
//     endret-vaer (delta + første protokollhandling verifisert).
//     ÉN PRIMÆRHANDLING (Sols runde 2, P1): briefen skal ha nøyaktig ett
//     [data-primaerhandling]-element («Neste steg: …»), og deltaet skal
//     stå som sekundær opplysning («Endring senere i protokollen: …»).
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

/**
 * Deltakermodus-kontrakten: ingen operatørutstyr i deltakerens flate.
 * Runde 3 (Sols P1): dekker også prototypenes tidligere egne kontroller —
 * «Simulert klokke», spoleknapper og hendelseslogg skal IKKE finnes i
 * deltaker-DOM-en (tidsstyring skjer via window.__lab, utenfor DOM-en).
 */
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
  bekreft(
    `${merkelapp}: ingen klokke-/spolekontroller eller logg i deltaker-DOM`,
    !/Simulert klokke/.test(tekst) &&
      !/Spol \+|Spol til neste/.test(tekst) &&
      !/Hendelseslogg/.test(tekst) &&
      (await page.getByRole('button', { name: /^Spol/ }).count()) === 0,
    'spoleknapper/klokkepanel/hendelseslogg synlig i deltakermodus',
  );
}

/**
 * Spoling via selens window.__lab (LabVinduAPI) — operatør-/automatiserings-
 * kanalen UTENFOR deltakerens DOM. Feiler hardt hvis API-et mangler.
 */
async function spolLab(page, min) {
  await page.evaluate((m) => {
    if (!window.__lab) throw new Error('window.__lab mangler — selen eksponerer ikke klokkestyring');
    window.__lab.spol(m);
  }, min);
  await page.waitForTimeout(250);
}

/** Selens hendelseslogg lest utenfor DOM-en (window.__lab.hendelser()). */
async function labHendelser(page) {
  return page.evaluate(() => (window.__lab ? window.__lab.hendelser() : []));
}

/**
 * KOLLISJONSVAKT (Sols runde 2, P1): måler bounding boxes for figurens
 * [data-spor]-elementer og feiler ved parvis overlapp. Krever at alle
 * tre sportyper faktisk er til stede (ikke-vakuøst: 2 grenseetiketter,
 * 2 terskellinjer, 1 kandidatmarkør).
 */
async function sjekkKollisjonsfri(page, merkelapp) {
  const rekter = await page.evaluate(() => {
    const ut = [];
    for (const el of document.querySelectorAll('figure [data-spor]')) {
      const r = el.getBoundingClientRect();
      ut.push({ spor: el.getAttribute('data-spor'), x: r.x, y: r.y, w: r.width, h: r.height });
    }
    return ut;
  });
  const antall = (spor) => rekter.filter((r) => r.spor === spor).length;
  const overlapp = [];
  for (let i = 0; i < rekter.length; i++) {
    for (let j = i + 1; j < rekter.length; j++) {
      const a = rekter[i];
      const b = rekter[j];
      const bredde = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const hoyde = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (bredde > 0 && hoyde > 0) {
        overlapp.push(`${a.spor}×${b.spor} (${Math.round(bredde)}×${Math.round(hoyde)} px)`);
      }
    }
  }
  bekreft(
    `${merkelapp}: null kollisjon (etikett/terskel/markør i separate spor)`,
    antall('grenseetikett') === 2 &&
      antall('terskellinje') === 2 &&
      antall('kandidatmarkor') === 1 &&
      overlapp.length === 0,
    overlapp.length > 0
      ? `overlapp: ${overlapp.join('; ')}`
      : `spor-elementer: ${rekter.map((r) => r.spor).join(', ') || 'ingen'}`,
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

/** 5) P2: tre kandidater × tre scenarier (inkl. storTekst) + kollisjonsvakt
 *     + årsakskjede + maskert. */
async function p2Kandidater(page) {
  console.log('\n[5] P2 — kald/trygg/varm (inkl. storTekst), kollisjonsvakt, årsakskjede, maskert');
  for (const scenario of ['normal-dag', 'sovende-vognbarn', 'dynamic-type']) {
    // TRYGG: selens default-kandidat (kandidatId='trygg') — anbefalingen.
    await aapne(page, 'p2', scenario);
    krev(
      `p2-${scenario}-trygg: posisjon i-spennet`,
      /i trygt spenn/i.test(await figurtekst(page)),
      await figurtekst(page),
    );
    await sjekkKollisjonsfri(page, `p2-${scenario}-trygg`);
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
    await sjekkKollisjonsfri(page, `p2-${scenario}-varm`);
    await skudd(page, `05-p2-${scenario}--varm-over-tak`);

    // KALD: fjern kritiske lag til kandidaten står under gulvet.
    await aapne(page, 'p2', scenario);
    krev(
      `p2-${scenario}-kald: posisjon under-gulv`,
      await lagKaldKandidat(page),
      await figurtekst(page),
    );
    await sjekkKollisjonsfri(page, `p2-${scenario}-kald`);
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

/** 6) P3: V1 → V2 (handlingsendring verifisert) → ekte utløp.
 *     Spoling via window.__lab — deltaker-DOM-en er uten tidskontroller. */
async function p3Tidslinje(page) {
  console.log('\n[6] P3 endret-vaer — V1, V2 og ekte utløp (spolt via window.__lab)');
  await aapne(page, 'p3', 'endret-vaer');
  await sjekkDeltakerRen(page, 'p3-v1');

  const v1Tekst = await seksjonstekst(page, 'Simulert widget');
  const handlingV1 = await widgetHandling(page, 'Simulert widget');
  krev('p3-v1: Brief #1 gjeldende', /Brief #1\b/.test(v1Tekst));
  krev('p3-v1: handling lest fra widgeten', handlingV1 !== null, 'fant ingen handling');
  console.log(`  V1-handling: «${handlingV1}»`);
  await skudd(page, '06-p3-endret-vaer--1-v1-brief');

  // Spol +30 via selens window-API: V2 ankommer (10:20) og forsinket V1
  // forkastes (10:30) — ingen spoleknapp finnes i deltakerflaten.
  await spolLab(page, 30);
  const v2Tekst = await seksjonstekst(page, 'Simulert widget');
  const handlingV2 = await widgetHandling(page, 'Simulert widget');
  krev('p3-v2: Brief #2 gjeldende', /Brief #2\b/.test(v2Tekst));
  krev(
    'p3-v2: handlingen er ENDRET fra V1 (Sols P3-P1)',
    handlingV2 !== null && handlingV2 !== handlingV1,
    `V1=«${handlingV1}» V2=«${handlingV2}»`,
  );
  console.log(`  V2-handling: «${handlingV2}»`);
  const hendelser = await labHendelser(page);
  bekreft(
    'p3-v2: forsinket V1 forkastet — logget i SELENS logg (window.__lab), utenfor deltaker-DOM',
    hendelser.some(
      (h) => h.event === 'brief-forkastet' && h.detalj && h.detalj.versjon === 1,
    ),
    `sele-loggen har ${hendelser.length} innslag uten brief-forkastet v1`,
  );
  bekreft(
    'p3-v2: forkastelsen står IKKE i deltakerens flate',
    !/Forkastet/.test(await kroppstekst(page)),
  );
  await sjekkDeltakerRen(page, 'p3-v2');
  await skudd(page, '06-p3-endret-vaer--2-v2-brief');

  // Ekte utløp: spol klokka forbi gyldigTil 11:45 (10:30 → 12:00).
  for (let i = 0; i < 3; i++) await spolLab(page, 30);
  const utloptTekst = await seksjonstekst(page, 'Simulert widget');
  krev(
    'p3-utlop: maskert ETTER at klokka passerte gyldigTil',
    utloptTekst.includes('Må beregnes på nytt') && /utløpt/.test(utloptTekst),
    utloptTekst.slice(0, 200),
  );
  krev(
    'p3-utlop: det aktive rådet er fjernet fra flaten',
    handlingV2 !== null && !utloptTekst.includes(handlingV2),
    'V2-handlingen vises fortsatt i widgeten',
  );
  bekreft(
    'p3-utlop: selens diskrete klokkemerke viser tid forbi 11:45',
    /kl\. 1[2-9]:\d{2} · lab/.test(await kroppstekst(page)),
  );
  await sjekkDeltakerRen(page, 'p3-utlop');
  await skudd(page, '06-p3-endret-vaer--3-utlopt-maskert');
}

/** 7) P4: overgang ende-til-ende med versjonskontinuitet + ÉN primærhandling.
 *     Spoling via window.__lab — deltaker-DOM-en er uten tidskontroller. */
async function p4Overgang(page) {
  console.log('\n[7] P4 — brief → protokoll → retur (spolt via window.__lab)');
  for (const { scenario, spolFoerst } of [
    { scenario: 'normal-dag', spolFoerst: false },
    { scenario: 'endret-vaer', spolFoerst: true },
  ]) {
    await aapne(page, 'p4', scenario);
    // endret-vaer: spol til V2 slik at deltaet + endret handling er aktive.
    if (spolFoerst) await spolLab(page, 30);
    await sjekkDeltakerRen(page, `p4-${scenario}`);

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

    // ÉN PRIMÆRHANDLING (Sols runde 2, P1): nøyaktig ett
    // [data-primaerhandling]-element, og det bærer «Neste steg: …».
    const primaer = page.locator(
      'section[aria-label="Simulert brief-flate"] [data-primaerhandling]',
    );
    krev(
      `p4-${scenario}: nøyaktig ÉN primærhandling i brief-DOM`,
      (await primaer.count()) === 1,
      `fant ${await primaer.count()} elementer med data-primaerhandling`,
    );
    const primaerTekst = (await primaer.first().innerText()).trim();
    krev(
      `p4-${scenario}: primærhandlingen er «Neste steg: …»`,
      /^Neste steg: .+/.test(primaerTekst),
      primaerTekst,
    );
    console.log(`  Primærhandling: «${primaerTekst}»`);

    if (scenario === 'endret-vaer') {
      krev(
        'p4-endret-vaer: deltaet synlig (referanse til i går)',
        /i går/.test(briefTekst),
        briefTekst.slice(0, 200),
      );
      // Deltaet er SEKUNDÆR opplysning — innrammet, aldri et andre
      // imperativ med primær vekt.
      krev(
        'p4-endret-vaer: deltaet står som «Endring senere i protokollen: …»',
        briefTekst.includes('Endring senere i protokollen: legg ull-jakke'),
        briefTekst.slice(0, 300),
      );
      bekreft(
        'p4-endret-vaer: lagendringen er IKKE primærhandlingen',
        !/^Neste steg: Legg ull-jakke/.test(primaerTekst),
        primaerTekst,
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
