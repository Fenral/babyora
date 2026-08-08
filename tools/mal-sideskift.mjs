/**
 * mal-sideskift.mjs — maaler om sideskiftet er FYSISK.
 *
 * ══ HVORFOR DETTE VERKTOEYET BLE SKREVET OM ══
 *
 * Foerste utgave produserte en FALSK NEGATIV som kostet en tilbakerulling av
 * kode som virket. Et dommerpanel felte den med et minimalt eksperiment paa
 * samme pakkeversjoner. Tre feil, alle i MAALINGEN:
 *
 *   1. DEN LESTE ETT BILDE OG RAPPORTERTE DET SOM EN SERIE.
 *      `opacity` og `getAnimations()` ble hentet fra det FOERSTE bildet der
 *      to sider laa i DOM-en — der animasjonen ennaa ikke har startet. Det
 *      bildet er alltid «opacity 1.00/0.00, animasjoner 0/0», i enhver
 *      korrekt overgang. Jeg leste det som «opacity 1 hele veien» og «null
 *      animasjoner», og konkluderte med at ingenting animerte. Bildet ETTER
 *      viste 0,76 og én animasjon.
 *
 *   2. DEN MALTE BARE HIERARKIET. Eierens nyeste bestilling gjør også
 *      hovedfanene retningsstyrte. Derfor måles nå Hjem -> Planlegg OG
 *      Planlegg -> Hjem, i tillegg til drill inn/tilbake.
 *
 *   3. Transform-uttrekkeren hadde uescapede parenteser og traff bare `matrix(...)`.
 *      For `matrix3d(...)` ga den 0 — «ingen bevegelse» for noe som beveger
 *      seg.
 *
 * Laerdommen er den samme som har gaatt igjen i hele dette arbeidet, men et
 * hakk verre: jeg krevde ikke-vakuoesitet av hver port i src/, og ga saa mitt
 * eget maaleverktoey fritak. Et instrument uten fasit er ikke et instrument.
 * Derfor har hver overgangstype under en FORVENTNING, og verktoeyet sier fra
 * naar virkeligheten avviker fra den — i begge retninger.
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

/**
 * OVERGANGENE, hver med sin FASIT.
 *
 * `retning` er fasiten på x-aksen: +1 betyr at ny side kommer fra høyre,
 * -1 at den kommer fra venstre. Begge flater skal bevege seg samtidig.
 */
const OVERGANGER = [
  {
    navn: 'fane -> fane fram (Hjem -> Planlegg)',
    vei: [{ fane: 'Planlegg' }],
    retning: 1,
    restrained: true,
    hvorfor: 'ny fane kommer 16 px fra høyre, gammel går 12 px mot venstre',
  },
  {
    navn: 'fane -> fane tilbake (Planlegg -> Hjem)',
    vei: [{ fane: 'Planlegg' }, { fane: 'Hjem' }],
    retning: -1,
    restrained: true,
    hvorfor: 'retningen speiles når brukeren går tilbake i fanerekken',
  },
  {
    navn: 'fane -> drill (Familie -> Soveguiden)',
    vei: [{ fane: 'Familie' }, { trykk: 'Soveguiden' }],
    retning: 1,
    fullBredde: 'inngang',
    hvorfor: 'drillen kommer inn fra høyre mens fanen gjør kort parallax mot venstre',
  },
  {
    navn: 'drill -> fane (tilbake fra Soveguiden)',
    vei: [{ fane: 'Familie' }, { trykk: 'Soveguiden' }, { tilbake: true }],
    retning: -1,
    fullBredde: 'utgang',
    hvorfor: 'drillen går full bredde mot høyre mens fanen kommer kort inn fra venstre',
  },
];

/* DRILL -> DRILL FINNES IKKE I APPEN, og det ble malt fram 2026-08-05:
   hver drill-skjerm far bare `onBack={closeDrill}` (App.tsx), saa
   veien ut av en drill gaar alltid tilbake til en fane. Foerste utgave av
   dette verktoeyet hadde en fasit for drill -> drill og meldte AVVIK i det
   uendelige — en port som krever en overgang appen ikke har, kan aldri
   bestaa. Kommer en drill-til-drill-vei senere, skal den inn her. */

/** x-leddet ut av en transform. Haandterer bade matrix og matrix3d. */
function xAv(t) {
  if (!t || t === 'none') return 0;
  const m3 = /matrix3d\(([^)]+)\)/u.exec(t);
  if (m3) { const d = m3[1].split(',').map(Number); return d.length === 16 ? d[12] : 0; }
  const m = /matrix\(([^)]+)\)/u.exec(t);
  if (!m) return 0;
  const d = m[1].split(',').map(Number);
  return d.length === 6 ? d[4] : 0;
}

async function mål(overgang, reducedMotion) {
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  /* Instrumentet bruker norske kontrollnavn som en fast test-fixture. SprÃ¥ket
     settes eksplisitt fordi produksjonspolicyen med vilje velger engelsk for
     enheter uten svensk/dansk region. */
  await p.addInitScript(() => {
    localStorage.setItem('babyora:languageOverride', 'no');
  });
  await p.route('**/api/forecast*', (r) => r.fulfill({
    contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);

  /* Alle steg UNNTATT det siste er navigering. Det siste er det vi maaler. */
  const steg = overgang.vei;
  for (const s of steg.slice(0, -1)) {
    if (s.fane) {
      const b = p.locator('nav button, [class*="tab"] button').filter({ hasText: new RegExp(s.fane, 'iu') }).first();
      if (await b.count() === 0) { await p.close(); return { feil: `fant ikke fanen ${s.fane}` }; }
      await b.click();
    } else if (s.trykk) {
      const b = p.locator('button, [role="button"]').filter({ hasText: new RegExp(s.trykk, 'iu') }).first();
      if (await b.count() === 0) { await p.close(); return { feil: `fant ikke «${s.trykk}»` }; }
      await b.scrollIntoViewIfNeeded().catch(() => {});
      await b.click();
    } else if (s.tilbake) {
      /* Tilbake-knappen har aria-label="Tilbake" (ScreenHeader.tsx:50 og
         TogGuideScreen.tsx:883). Første utgave lette etter TEKST i knappen
         — men den har bare et ikon, så den fant aldri noe, og drill -> drill
         kunne ikke måles i det hele tatt. */
      const b = p.getByLabel('Tilbake').first();
      if (await b.count() === 0) { await p.close(); return { feil: 'fant ikke tilbake-knappen' }; }
      await b.click();
    }
    await p.waitForTimeout(900);
  }

  const siste = steg[steg.length - 1];
  const r = await p.evaluate(async ({ tekst, erTilbake }) => {
    /* SELEKTOREN MAA IKKE TREFFE WRAPPEREN SELV.
       Tredje falske negativ fra dette verktoeyet, 2026-08-05: `.ba-sideskift`
       ER en `main > div`, saa en kombinert selektor plukket BADE cellen og
       sidene i den. Cellen staar alltid stille, og siden den kom foerst i
       dokumentet, ble den lest som «den avgaaende siden» — som dermed aldri
       flyttet seg, uansett hvor riktig koden var.
       Er cellen der, er sidene barna hennes. Ellers (gammel struktur eller
       redusert bevegelse) er de main > div. Aldri begge deler. */
    const sider = () => {
      const celle = document.querySelector('.ba-sideskift');
      return celle
        ? [...celle.children]
        : [...document.querySelectorAll('.app-shell > main > div')];
    };
    const skall = document.querySelector('nav, [class*="tabbar"], [class*="TabBar"]');
    const skallFør = skall ? Math.round(skall.getBoundingClientRect().top) : null;
    const skallVenstreFør = skall ? Math.round(skall.getBoundingClientRect().left) : null;

    const knapp = erTilbake
      ? document.querySelector('[aria-label="Tilbake"]')
      : [...document.querySelectorAll('button, [role="button"]')]
        .find((b) => new RegExp(tekst, 'iu').test(b.textContent || ''));
    if (!knapp) return { feil: erTilbake ? 'fant ikke tilbake-knappen' : `fant ikke «${tekst}»` };
    knapp.click();

    /* HELE SERIEN, ikke ett bilde. Det var feil nummer én. */
    const serie = [];
    for (let i = 0; i < 60; i += 1) {
      const s = sider();
      serie.push({
        antall: s.length,
        transform: s.map((e) => getComputedStyle(e).transform),
        routeKeys: s.map((e) => e.getAttribute('data-route-key')),
        opacity: s.map((e) => Number(getComputedStyle(e).opacity)),
        animasjoner: s.map((e) => (e.getAnimations ? e.getAnimations().length : -1)),
        skallTop: skall ? Math.round(skall.getBoundingClientRect().top) : null,
        skallVenstre: skall ? Math.round(skall.getBoundingClientRect().left) : null,
      });
      await new Promise((res) => requestAnimationFrame(res));
    }
    return { serie, skallFør, skallVenstreFør };
  }, { tekst: siste.trykk || siste.fane || '', erTilbake: Boolean(siste.tilbake) });

  await p.close();
  return r;
}

let stryk = 0;
for (const o of OVERGANGER) {
  const r = await mål(o, false);
  console.log(`\n── ${o.navn} ──`);
  if (r.feil) { console.log(`  KOM IKKE FRAM: ${r.feil}`); stryk += 1; continue; }

  const to = r.serie.filter((f) => f.antall === 2);
  if (to.length === 0) {
    console.log('  FORUTSETNING FEILET: aldri to sider i DOM-en — ingen overgang aa maale');
    stryk += 1;
    continue;
  }

  const begge = to.filter((f) => f.transform.every((t) => Math.abs(xAv(t)) > 1));
  const retningsbilder = to.filter((f) => {
    const x = f.transform.map(xAv);
    return x[0] * o.retning < -1 && x[1] * o.retning > 1;
  });
  const fadet = to.filter((f) => f.opacity.some((v) => v < 0.99));
  const animert = to.filter((f) => f.animasjoner.some((n) => n > 0));
  const skallFlyttY = r.serie.map((f) => f.skallTop).filter((v) => v !== null)
    .reduce((maks, v) => Math.max(maks, Math.abs(v - r.skallFør)), 0);
  const skallFlyttX = r.serie.map((f) => f.skallVenstre).filter((v) => v !== null)
    .reduce((maks, v) => Math.max(maks, Math.abs(v - r.skallVenstreFør)), 0);
  const maksPerSide = [0, 1].map((indeks) => to.reduce(
    (maks, f) => Math.max(maks, Math.abs(xAv(f.transform[indeks]))),
    0,
  ));

  console.log(`  bilder med to sider           : ${to.length}`);
  console.log(`  ruter (gammel/ny)             : ${to[0]?.routeKeys.join(' / ')}`);
  console.log(`  x-serie (gammel/ny)           : ${to.slice(0, 10).map((f) => f.transform.map((t) => Math.round(xAv(t))).join('/')).join('  ')}`);
  console.log(`  opacity-serie                 : ${to.slice(0, 6).map((f) => f.opacity.map((v) => v.toFixed(2)).join('/')).join('  ')}`);
  console.log(`  bilder der BEGGE flytter seg  : ${begge.length}`);
  console.log(`  bilder med riktig retning     : ${retningsbilder.length}`);
  console.log(`  maks x, gammel/ny             : ${maksPerSide.map(Math.round).join(' / ')} px`);
  console.log(`  bilder med fade / animasjon   : ${fadet.length} / ${animert.length}`);
  console.log(`  skallet flyttet seg maks x/y  : ${skallFlyttX} / ${skallFlyttY} px`);

  const samtidigOgRiktig = begge.length > 0 && retningsbilder.length > 0;
  const avstandOk = o.restrained
    ? maksPerSide.every((x) => x >= 10 && x <= 18)
    : o.fullBredde === 'inngang'
      ? maksPerSide[1] >= 300
      : o.fullBredde === 'utgang'
        ? maksPerSide[0] >= 300
        : true;
  const ok = samtidigOgRiktig && avstandOk && fadet.length > 0 && animert.length > 0;
  console.log(`  FASIT: ${o.hvorfor}`);
  console.log(`  -> ${ok ? 'OK' : 'AVVIK'}`);
  if (!ok) stryk += 1;
  if (skallFlyttX > 1 || skallFlyttY > 1) {
    console.log('  -> AVVIK: tabbaren skal staa stille');
    stryk += 1;
  }
}

/* Redusert bevegelse: ingenting skal bevege seg. */
{
  const r = await mål(OVERGANGER[0], true);
  console.log('\n── redusert bevegelse ──');
  if (r.feil) { console.log(`  ${r.feil}`); }
  else {
    const beveget = r.serie.filter((f) => f.transform.some((t) => Math.abs(xAv(t)) > 1));
    console.log(`  bilder med forflytning: ${beveget.length}`);
    console.log(`  -> ${beveget.length === 0 ? 'OK: direkte bytte' : 'AVVIK: noe beveger seg'}`);
    if (beveget.length > 0) stryk += 1;
  }
}

await browser.close();
server.kill();
console.log(`\n${stryk === 0 ? 'Alle overgangene stemmer med fasiten.' : `${stryk} avvik.`}`);
process.exit(stryk ? 1 : 0);
