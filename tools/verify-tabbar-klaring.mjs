/**
 * verify-tabbar-klaring — ingen skjerm skjuler innhold bak den flytende
 * tab-baren.
 *
 * ══ HVORFOR ═══════════════════════════════════════════════════════════════
 *
 * Revisjonen mot produksjonsbygget 2026-08-06 ga fire blokkerende funn. TRE
 * av dem var samme feil på tre ulike skjermer:
 *   · Plaggbiblioteket — «+ Legg til plagg» dekker Planlegg-fanen helt
 *   · TOG             — temperatur-skyveren, skjermens ENESTE betjenings-
 *                       element, tegnes bak baren
 *   · Varm eller kald — hovedhandlingen «Ferdig →» ligger bak baren
 *
 * Jeg hadde rettet den fjerde (Innstillinger) samme dag, som ett enkelttilfelle.
 * Det var feil størrelse på fiksen: --dw-tabbar-clearance fantes allerede og
 * ble brukt av fire skjermer, mens de andre sto utenfor. En regel som må
 * huskes per skjerm, blir glemt per skjerm.
 *
 * ══ HVA DEN MÅLER ═════════════════════════════════════════════════════════
 *
 * Den åpner PRODUKSJONSBYGGET, går til hver skjerm, ruller til bunns, og
 * spør nettleseren hvilke elementer som faktisk overlapper tab-barens
 * rektangel. Ikke om et token er brukt — om piksler kolliderer.
 *
 * Bare INTERAKTIVE og TEKSTBÆRENDE elementer teller. En dekorativ gradient
 * som strekker seg under baren er meningen; en knapp er det ikke.
 *
 * ══ HVA DEN IKKE ER ═══════════════════════════════════════════════════════
 *
 * Den ser bare det som er i DOM-et ved måletidspunktet. En skjerm som først
 * viser knappen etter et valg, må få sin egen oppføring i SKJERMER under —
 * ellers måler porten en tilstand ingen forelder er i.
 */
import { chromium } from 'playwright';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

const BASE = process.argv[2] ?? 'http://localhost:4173';

/** Hver skjerm: hvordan man kommer dit, fra et rent lager. */
const SKJERMER = [
  { navn: 'Hjem', vei: [] },
  { navn: 'Plan', vei: [{ tekst: /^Planlegg$/ }] },
  { navn: 'Innstillinger', vei: [{ tekst: /^Familie$/ }] },
  { navn: 'TOG', vei: [{ tekst: /^Familie$/ }, { tekst: /Soveguiden/i }] },
  { navn: 'Varm eller kald', vei: [{ tekst: /^Familie$/ }, { tekst: /Varm eller kald/i }] },
  { navn: 'Første vinter', vei: [{ tekst: /^Familie$/ }, { tekst: /Første vinter/i }] },
  {
    navn: 'Plaggbiblioteket',
    vei: [
      { tekst: /Finn dagens antrekk/i, vent: 4500 },
      { tekst: /Detaljer/i, vent: 900 },
      { tekst: /Se alternativer i biblioteket/i, vent: 1200 },
    ],
  },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'nb-NO',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});
await context.route('**/api/forecast**', (r) => r.fulfill({
  status: 200, contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()),
}));

const brudd = [];
let maalt = 0;

for (const skjerm of SKJERMER) {
  const page = await context.newPage();
  try {
    await page.goto(BASE + '/?seed=demo', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
    await page.goto(BASE + '/?seed=demo', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1200);

    for (const steg of skjerm.vei) {
      await page.getByText(steg.tekst).first().click({ timeout: 10_000 });
      await page.waitForTimeout(steg.vent ?? 700);
    }

    /* MÅL BÅDE I HVILE OG RULLET TIL BUNNS.
       Første utgave rullet FØRST og målte etterpå. Den var grønn på 7/7 —
       mens et dommerpanel samtidig meldte BLOKKERENDE på «Ferdig →» i Varm
       eller kald. Målt: ved hvile overlapper knappen baren med 50 px; etter
       rulling gjør den det ikke.

       Porten flyttet altså siden til en tilstand der feilen ikke fantes, og
       rapporterte fravær som fravær av feil. «Rullet til bunns» er ikke
       verstefallet — det er ETT tilfelle, og hviletilstanden er den
       forelderen møter først. */
    const maalTilstand = () => page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Hovednavigasjon"], .bottom-tab-bar');
      if (!bar) return { feil: 'fant ikke tab-baren' };
      const b = bar.getBoundingClientRect();

      const teller = (el) => {
        if (bar.contains(el)) return false;                 // barens egne barn
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        if (Number(cs.opacity) < 0.05) return false;
        const interaktiv = el.matches('button, a, input, select, [role="button"], [role="slider"], [role="tab"]');
        const egenTekst = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join('').length > 0;
        return interaktiv || egenTekst;
      };

      const treff = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!teller(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const overlapp = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        const bredde = Math.min(r.right, b.right) - Math.max(r.left, b.left);
        if (overlapp > 2 && bredde > 2) {
          treff.push({
            tag: el.tagName.toLowerCase(),
            klasse: (el.className || '').toString().slice(0, 40),
            tekst: (el.textContent || '').trim().slice(0, 40),
            px: Math.round(overlapp),
          });
        }
      }
      // Bare de ytterste: en knapp OG dens span teller som ett funn.
      return { barTop: Math.round(b.top), treff: treff.slice(0, 6) };
    });

    const iHvile = await maalTilstand();
    await page.evaluate(() => {
      const rullbare = [...document.querySelectorAll('*')].filter((e) =>
        e.scrollHeight > e.clientHeight + 20
        && /auto|scroll/.test(getComputedStyle(e).overflowY));
      rullbare.forEach((e) => { e.scrollTop = e.scrollHeight; });
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(700);
    const rullet = await maalTilstand();

    maalt += 1;
    for (const [tilstand, funn] of [['i hvile', iHvile], ['rullet', rullet]]) {
      if (funn.feil) {
        brudd.push({ skjerm: skjerm.navn, tilstand, tekst: funn.feil, px: 0 });
        continue;
      }
      for (const t of funn.treff) {
        brudd.push({
          skjerm: skjerm.navn,
          tilstand,
          tekst: t.tekst || '<' + t.tag + ' ' + t.klasse + '>',
          px: t.px,
        });
      }
    }
  } catch (e) {
    brudd.push({ skjerm: skjerm.navn, tekst: 'KUNNE IKKE MÅLES: ' + String(e.message).split('\n')[0].slice(0, 90), px: 0 });
  } finally {
    await page.close();
  }
}
await browser.close();

/* IKKE-VAKUØSITET: en port som ikke nådde skjermene sine, har ikke målt noe. */
if (maalt < SKJERMER.length) {
  console.error('Bare ' + maalt + ' av ' + SKJERMER.length + ' skjermer ble målt.');
}

if (brudd.length === 0) {
  console.log(maalt + '/' + SKJERMER.length + ' skjermer målt — ingen innhold bak tab-baren.');
  process.exit(0);
}

console.log('');
console.log('INNHOLD BAK TAB-BAREN — ' + brudd.length + ' treff på ' + maalt + ' målte skjermer');
console.log('');
for (const b of brudd) {
  console.log('  · ' + b.skjerm.padEnd(18) + '[' + b.tilstand.padEnd(7) + '] ' + (b.px ? String(b.px).padStart(3) + ' px bak baren  ' : '') + '«' + b.tekst + '»');
}
console.log('');
console.log('  Skjermroten mangler --dw-tabbar-clearance som bunn-luft, eller et');
console.log('  flytende element er posisjonert uten å ta høyde for baren.');
console.log('');
process.exit(1);
