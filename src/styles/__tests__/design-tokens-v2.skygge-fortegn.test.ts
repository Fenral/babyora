/**
 * SKYGGENS FORTEGN — en skygge som lysner er en glød.
 *
 * Bakgrunn (2026-08-03/04): `--dw-depth-action` ga i mørk modus en «skygge»
 * som var 3,3x LYSERE enn lerretet. Det fantes ingen piksel rundt CTA-en som
 * var mørkere enn bakgrunnen. Knappen hadde ikke dybde, den emitterte lys.
 *
 * Verre: `design-tokens-v2.depth.test.ts` HÅNDHEVET at den brede CTA-skyggen
 * var dempet mot den generelle brede — og meldte grønt, mens fortegnet var
 * feil. Testen målte styrken på noe som pekte motsatt vei. Dempingen kunne
 * aldri løse det: rgb(105,62,36) er lysere enn rgb(30,20,12), så ENHVER alfa
 * over 0 lysner. Det var fortegnet, ikke magnituden.
 *
 * Sol: «Ravglød stryker. CTA-en skal være matt og hevet, ikke emittere lys.»
 * Impeccable v4 craft floor: «shadows carry an offset and a soft blur. A
 * zero-offset colored halo is decoration.»
 *
 * Denne testen måler det som faktisk må holde: HVER `--dw-sh-*`, komposittert
 * over sitt eget temas `--dw-canvas` ved sin egen alfa, skal ha LAVERE
 * relativ luminans enn lerretet. I begge temaer.
 *
 * IKKE-VAKUØSITET (kontrollrevisjonen 2026-08-04): testen rapporterer hvor
 * mange tokens den faktisk fant og målte. Null mål = rødt. Det var nettopp
 * en port som ikke fant noe å måle som lot dette stå i månedsvis.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(process.cwd(), 'src/styles/design-tokens-v2.css'), 'utf8');

type Rgba = { r: number; g: number; b: number; a: number };

function lesHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lesRgba(verdi: string): Rgba | null {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+([\d.]+))?\s*\)/u.exec(verdi);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
}

/** WCAG relativ luminans. */
function luminans({ r, g, b }: { r: number; g: number; b: number }): number {
  const k = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}

/** Skyggefargen lagt over lerretet ved sin egen alfa. */
function komposittert(sh: Rgba, canvas: { r: number; g: number; b: number }) {
  return {
    r: sh.r * sh.a + canvas.r * (1 - sh.a),
    g: sh.g * sh.a + canvas.g * (1 - sh.a),
    b: sh.b * sh.a + canvas.b * (1 - sh.a),
  };
}

/** Trekker ut kroppen til en blokk ved å telle klammer. */
function blokk(start: RegExp): string {
  const m = start.exec(CSS);
  if (!m) return '';
  let dybde = 0;
  let i = m.index + m[0].length - 1;
  const fra = i + 1;
  for (; i < CSS.length; i += 1) {
    if (CSS[i] === '{') dybde += 1;
    else if (CSS[i] === '}') {
      dybde -= 1;
      if (dybde === 0) return CSS.slice(fra, i);
    }
  }
  return '';
}

/** Alle --dw-sh-*-deklarasjoner i en blokk, siste vinner. */
function skyggerI(kropp: string): Map<string, Rgba> {
  const ut = new Map<string, Rgba>();
  for (const m of kropp.matchAll(/(--dw-sh-[a-z0-9-]+)\s*:\s*([^;]+);/gu)) {
    const farge = lesRgba(m[2]!);
    if (farge) ut.set(m[1]!, farge);
  }
  return ut;
}

function canvasI(kropp: string, fallback: string): { r: number; g: number; b: number } {
  const m = /--dw-canvas:\s*(#[0-9A-Fa-f]{6})/u.exec(kropp);
  return lesHex(m ? m[1]! : fallback);
}

const rot = blokk(/:root\s*\{/u);
const lys = blokk(/:root\[data-theme="light"\]\s*\{/u);

const TEMAER = [
  { navn: 'mørk (:root)', skygger: skyggerI(rot), canvas: canvasI(rot, '#1E140C') },
  {
    navn: 'lys ([data-theme="light"])',
    // Lys arver alt som ikke er redeklarert.
    skygger: new Map([...skyggerI(rot), ...skyggerI(lys)]),
    canvas: canvasI(lys, '#F9F5EB'),
  },
];

describe('skyggens fortegn — en skygge som lysner er en glød', () => {
  it('IKKE-VAKUØSITET: fant faktisk tokens å måle i begge temaer', () => {
    for (const t of TEMAER) {
      expect(t.skygger.size, `${t.navn}: null --dw-sh-* funnet — porten måler ingenting`)
        .toBeGreaterThanOrEqual(5);
    }
    console.log(`\n  skygge-fortegn: målte ${TEMAER.map((t) => `${t.skygger.size} tokens i ${t.navn}`).join(', ')}\n`);
  });

  for (const tema of TEMAER) {
    it(`${tema.navn}: hver --dw-sh-* komposittert over lerretet er MØRKERE enn lerretet`, () => {
      const lC = luminans(tema.canvas);
      const gloder: string[] = [];
      for (const [navn, sh] of tema.skygger) {
        const l = luminans(komposittert(sh, tema.canvas));
        if (l >= lC) {
          gloder.push(`${navn} → L ${l.toFixed(5)} mot lerretets ${lC.toFixed(5)} (${(l / lC).toFixed(2)}x LYSERE)`);
        }
      }
      expect(gloder, `disse lysner i stedet for å mørkne:\n  ${gloder.join('\n  ')}`).toEqual([]);
    });
  }

  it('CTA-ens brede skygge er fortsatt DEMPET mot den generelle brede', () => {
    // Den opprinnelige portdommen står: CTA-en skal ikke rope. Men dempingen
    // måles nå på riktig side av lerretet — begge er mørkere, CTA-ens er
    // mindre mørk.
    const { skygger, canvas } = TEMAER[0]!;
    const lC = luminans(canvas);
    const bred = skygger.get('--dw-sh-broad');
    const bredCta = skygger.get('--dw-sh-broad-cta');
    expect(bred, '--dw-sh-broad mangler').toBeDefined();
    expect(bredCta, '--dw-sh-broad-cta mangler').toBeDefined();
    const fBred = luminans(komposittert(bred!, canvas)) / lC;
    const fCta = luminans(komposittert(bredCta!, canvas)) / lC;
    expect(fCta, `CTA-ens brede (${fCta.toFixed(2)}x) skal være MINDRE mørk enn den generelle (${fBred.toFixed(2)}x)`)
      .toBeGreaterThan(fBred);
  });
});
