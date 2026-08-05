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
 *   2. DEN MALTE FEIL OVERGANG. Familie -> Soveguiden er FANE -> DRILL.
 *      AnimatePresence fryser den avgaaende sidens props slik de var ved
 *      dens siste render (framer-motion/dist/es/components/AnimatePresence/
 *      index.mjs, linja som spleiser det gamle elementet tilbake inn). Den
 *      avgaaende var en FANE, og faner skal crossfade UTEN forflytning — med
 *      vilje. y = 0 var altsaa fasit, ikke feil. Ingen kode kunne bestaa den
 *      maalingen.
 *
 *   3. `yAv` HADDE UESCAPEDE PARENTESER og traff bare `matrix(...)`.
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
 * `beggeFlytter` er kjernen: for drill -> drill SKAL begge sider ha et
 * y-ledd ulik null i samme bilde. For fane -> drill skal bare den nye — en
 * fane som gaar ut crossfader, den skyves ikke.
 */
const OVERGANGER = [
  {
    navn: 'fane -> drill (Familie -> Soveguiden)',
    vei: [{ fane: 'Familie' }, { trykk: 'Soveguiden' }],
    beggeFlytter: false,
    hvorfor: 'den avgaaende er en FANE — den crossfader med vilje, uten forflytning',
  },
  {
    navn: 'drill -> fane (tilbake fra Soveguiden)',
    vei: [{ fane: 'Familie' }, { trykk: 'Soveguiden' }, { tilbake: true }],
    /* Her er den AVGAAENDE en drill, og det er den eneste overgangen i appen
       som tester UTGANGS-pushen. */
    utgangFlytter: true,
    hvorfor: 'den avgaaende er en DRILL — den skal skyves ut mens fanen tones inn',
  },
];

/* DRILL -> DRILL FINNES IKKE I APPEN, og det ble malt fram 2026-08-05:
   hver drill-skjerm far bare `onBack={() => setDrill(null)}` (App.tsx), saa
   veien ut av en drill gaar alltid tilbake til en fane. Foerste utgave av
   dette verktoeyet hadde en fasit for drill -> drill og meldte AVVIK i det
   uendelige — en port som krever en overgang appen ikke har, kan aldri
   bestaa. Kommer en drill-til-drill-vei senere, skal den inn her. */

/** y-leddet ut av en transform. Haandterer bade matrix og matrix3d. */
function yAv(t) {
  if (!t || t === 'none') return 0;
  const m3 = /matrix3d\(([^)]+)\)/u.exec(t);
  if (m3) { const d = m3[1].split(',').map(Number); return d.length === 16 ? d[13] : 0; }
  const m = /matrix\(([^)]+)\)/u.exec(t);
  if (!m) return 0;
  const d = m[1].split(',').map(Number);
  return d.length === 6 ? d[5] : 0;
}

async function mål(overgang, reducedMotion) {
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
        opacity: s.map((e) => Number(getComputedStyle(e).opacity)),
        animasjoner: s.map((e) => (e.getAnimations ? e.getAnimations().length : -1)),
        skallTop: skall ? Math.round(skall.getBoundingClientRect().top) : null,
      });
      await new Promise((res) => requestAnimationFrame(res));
    }
    return { serie, skallFør };
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

  const begge = to.filter((f) => f.transform.every((t) => Math.abs(yAv(t)) > 1));
  const énFlytter = to.filter((f) => f.transform.some((t) => Math.abs(yAv(t)) > 1));
  const fadet = to.filter((f) => f.opacity.some((v) => v < 0.99));
  const animert = to.filter((f) => f.animasjoner.some((n) => n > 0));
  const skallFlytt = r.serie.map((f) => f.skallTop).filter((v) => v !== null)
    .reduce((maks, v) => Math.max(maks, Math.abs(v - r.skallFør)), 0);

  console.log(`  bilder med to sider           : ${to.length}`);
  console.log(`  y-serie (gammel/ny)           : ${to.slice(0, 10).map((f) => f.transform.map((t) => Math.round(yAv(t))).join('/')).join('  ')}`);
  console.log(`  opacity-serie                 : ${to.slice(0, 6).map((f) => f.opacity.map((v) => v.toFixed(2)).join('/')).join('  ')}`);
  console.log(`  bilder der BEGGE flytter seg  : ${begge.length}`);
  console.log(`  bilder der minst EN flytter   : ${énFlytter.length}`);
  console.log(`  bilder med fade / animasjon   : ${fadet.length} / ${animert.length}`);
  console.log(`  skallet flyttet seg maks      : ${skallFlytt} px`);

  /* For utgangs-testen holder det ikke at «minst én» flytter seg — det ville
     den nye siden gjort uansett. Kravet er at den AVGÅENDE (indeks 0, den
     som ble spleiset tilbake inn av AnimatePresence) har flyttet seg. */
  const utgangFlyttet = to.filter((f) => Math.abs(yAv(f.transform[0])) > 1);
  const ok = o.utgangFlytter
    ? utgangFlyttet.length > 0
    : (o.beggeFlytter ? begge.length > 0 : (énFlytter.length > 0 && begge.length === 0));
  if (o.utgangFlytter) console.log(`  bilder der UTGANGEN flytter seg: ${utgangFlyttet.length}`);
  console.log(`  FASIT: ${o.hvorfor}`);
  console.log(`  -> ${ok ? 'OK' : 'AVVIK'}`);
  if (!ok) stryk += 1;
  if (skallFlytt > 1) { console.log('  -> AVVIK: skallet skal staa stille'); stryk += 1; }
}

/* Redusert bevegelse: ingenting skal bevege seg. */
{
  const r = await mål(OVERGANGER[0], true);
  console.log('\n── redusert bevegelse ──');
  if (r.feil) { console.log(`  ${r.feil}`); }
  else {
    const beveget = r.serie.filter((f) => f.transform.some((t) => Math.abs(yAv(t)) > 1));
    console.log(`  bilder med forflytning: ${beveget.length}`);
    console.log(`  -> ${beveget.length === 0 ? 'OK: direkte bytte' : 'AVVIK: noe beveger seg'}`);
    if (beveget.length > 0) stryk += 1;
  }
}

await browser.close();
server.kill();
console.log(`\n${stryk === 0 ? 'Alle overgangene stemmer med fasiten.' : `${stryk} avvik.`}`);
process.exit(stryk ? 1 : 0);
