import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * EN BUNN-FADE SKAL SI «DET ER MER UNDER» — ALDRI DEMPE EN TRYKKFLATE.
 *
 * Målt 2026-08-06: «Hvorfor akkurat dette?» er skjermens eneste vei til
 * begrunnelsen, og den er SISTE element i .hjm-result. Rullet til bunns
 * hvilte den derfor midt i bunn-faden. Målt i det levende DOM-et: containeren
 * spente y 334–1161, faden startet på 92 % (y 1095), og lenken lå på
 * y 1117–1161 — bunnen nøyaktig der masken var blitt helt gjennomsiktig.
 *
 * Teksten er #A79A82 med opacity 1, altså 6,5:1 mot lerretet. Ut av masken
 * kom den som 2,1:1. Et dommerpanel målte den som skjermens svakeste element
 * — svakere enn dekorativ metatekst — uten å kunne se hvorfor, fordi fargen
 * i koden er riktig. Faden er ikke synlig noe sted i kilden til lenken.
 *
 * Etter rettingen målte samme piksel 6,61:1 i revisjonens eget skjermbilde.
 *
 * PORTEN MÅLER TO TING, OG DE MÅ HENGE SAMMEN:
 *   1. faden har FAST høyde, ikke prosent — 8 % av containeren betyr ulik
 *      fade for hvert antrekk, og en affordance som endrer seg med innholdet
 *      kan ikke dimensjoneres mot noe;
 *   2. containeren har MINST like mye bunn-luft som faden er høy, slik at
 *      faden alltid lander på tom plass når man er rullet til bunns.
 *
 * Verdien leses ut av CSS-en og sammenlignes med seg selv. Settes faden til
 * 80 px uten at luften følger med, blir porten rød — det er nettopp den
 * uparede endringen som brakte feilen inn.
 */
const CSS = resolve(process.cwd(), 'src/components/hjem/hjem-monter.css');

function regel(navn: string): string {
  const src = readFileSync(CSS, 'utf8').replace(/\r\n/g, '\n');
  const i = src.indexOf(navn);
  if (i < 0) throw new Error(`fant ikke regelen ${navn}`);
  const start = src.indexOf('{', i);
  const slutt = src.indexOf('}', start);
  return src.slice(start, slutt);
}

function px(body: string, egenskap: RegExp): number | null {
  const m = egenskap.exec(body);
  return m ? Number(m[1]) : null;
}

describe('bunn-faden spiser ikke en trykkflate', () => {
  const body = regel(".hjm-result[data-scrollable='true']");

  it('faden har fast høyde i piksler, ikke prosent av innholdet', () => {
    const hoyde = px(body, /--hjm-fade-hoyde:\s*(\d+)px/u);
    expect(
      hoyde,
      'Faden mangler --hjm-fade-hoyde i piksler. Sto den i prosent, ville '
      + 'et barn med fire plagg fått en annen fade enn et med åtte, og '
      + 'bunn-luften under kunne ikke dimensjoneres mot den.',
    ).not.toBeNull();
    expect(hoyde).toBeGreaterThan(0);

    // Masken må faktisk BRUKE variabelen — ellers måler tallet ingenting.
    expect(
      /mask-image:[\s\S]*var\(--hjm-fade-hoyde\)/u.test(body),
      'mask-image bruker ikke --hjm-fade-hoyde. Da er variabelen en '
      + 'kommentar, ikke en måling.',
    ).toBe(true);
  });

  it('bunn-luften er minst like høy som faden', () => {
    const hoyde = px(body, /--hjm-fade-hoyde:\s*(\d+)px/u) ?? 0;
    const luft = /padding-bottom:\s*var\(--hjm-fade-hoyde\)/u.test(body)
      ? hoyde
      : px(body, /padding-bottom:\s*(\d+)px/u) ?? 0;

    expect(
      luft,
      `Bunn-luften (${luft}px) er mindre enn faden (${hoyde}px). Da hviler `
      + 'det siste elementet i containeren INNE i faden når man har rullet '
      + 'til bunns. Sist det skjedde ble «Hvorfor akkurat dette?» dempet '
      + 'fra 6,5:1 til 2,1:1 — skjermens eneste tillitslenke, gjort til '
      + 'dens svakeste element av en maske ment som en høflighet.',
    ).toBeGreaterThanOrEqual(hoyde);
  });

  it('iOS-varianten står ved siden av standardvarianten', () => {
    /* Capacitor-målet er WKWebView, der mask-image alene er funksjonelt
       dødt. En fade som bare finnes i standardegenskapen ville vært borte
       på telefonen — altså grønn port, ingen fade. */
    expect(body).toMatch(/-webkit-mask-image:/u);
    expect(body).toMatch(/(?<!-webkit-)mask-image:/u);
  });
});
