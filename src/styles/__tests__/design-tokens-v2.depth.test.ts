/**
 * Dybdekontrakten — struktur-invariant per tema.
 *
 * BAKGRUNN (B1-kalibrering 2026-08-02): lys modus falt STILLE ut av
 * dybdekontrakten fordi en tema-selektor overstyrte hele `box-shadow`-
 * stabelen med en flat treskygge. Eieren oppdaget det som «den lyse føles
 * flatere enn den mørke»; kontrakten var beskrevet i prosa (art bible) men
 * implementert som hardkodede verdier flere steder — ingenting hindret et
 * tema i å miste den.
 *
 * Denne testen håndhever den eksterne portdommen: «Lagstrukturen defineres
 * én gang; temaene får kun overstyre fargetokens. data-mode/tema-selektorer
 * får aldri erstatte box-shadow-stabelen.»
 *
 * Testen leser CSS-kilden direkte (ikke computed style i jsdom, som ikke
 * løser var()-kjeder i box-shadow) og verifiserer at:
 *  1. --dw-depth-* er definert ÉN gang (kun i :root) — aldri i et tema.
 *  2. Hvert høydenivå har riktig antall skyggelag.
 *  3. Alle tre temablokkene definerer det komplette fargesettet.
 *  4. CTA-ens brede skygge er dempet mot den generelle brede i BEGGE temaer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(process.cwd(), 'src/styles/design-tokens-v2.css'), 'utf8');

const COLOR_TOKENS = [
  '--dw-sh-contact',
  '--dw-sh-mid',
  '--dw-sh-broad',
  '--dw-sh-contact-cta',
  '--dw-sh-broad-cta',
] as const;

/** Antall skyggelag = antall toppnivå-kommaer + 1 (var()-innhold har ingen kommaer). */
function layerCount(value: string): number {
  return value.split(',').filter((part) => part.includes('px')).length;
}

function declaredValue(token: string, occurrence = 0): string {
  const matches = [...CSS.matchAll(new RegExp(`${token}:\\s*([^;]+);`, 'g'))];
  const found = matches[occurrence];
  expect(found, `${token} (forekomst ${occurrence}) mangler`).toBeDefined();
  return found![1]!.trim();
}

function alphaOf(rgba: string): number {
  const m = rgba.match(/rgba\([^)]*?,\s*([\d.]+)\s*\)/);
  expect(m, `fant ingen alfa i «${rgba}»`).not.toBeNull();
  return Number(m![1]);
}

describe('dybdekontrakten — struktur defineres én gang', () => {
  it.each(['--dw-depth-hero', '--dw-depth-raised', '--dw-depth-action', '--dw-depth-selected'])(
    '%s er definert nøyaktig én gang (aldri overstyrt av et tema)',
    (token) => {
      const count = [...CSS.matchAll(new RegExp(`${token}:`, 'g'))].length;
      expect(count).toBe(1);
    },
  );

  it('hero og raised har tre skyggelag (kontakt + mellom + bred)', () => {
    expect(layerCount(declaredValue('--dw-depth-hero'))).toBe(3);
    expect(layerCount(declaredValue('--dw-depth-raised'))).toBe(3);
  });

  it('action har to lag og selected to lag — aldri én identisk treskygge på alt', () => {
    expect(layerCount(declaredValue('--dw-depth-action'))).toBe(2);
    expect(layerCount(declaredValue('--dw-depth-selected'))).toBe(2);
  });

  it('alle høydenivåer bygger utelukkende på farge-tokenene', () => {
    for (const level of ['--dw-depth-hero', '--dw-depth-raised', '--dw-depth-action', '--dw-depth-selected']) {
      const value = declaredValue(level);
      const literals = value.match(/rgba?\(/g);
      expect(literals, `${level} har hardkodet farge: ${value}`).toBeNull();
    }
  });

  it('skyggelagene forskyves ned-HØYRE (key-lyset står øvre venstre)', () => {
    for (const level of ['--dw-depth-hero', '--dw-depth-raised']) {
      // Ett lag = «<x>px <y>px <blur>px [<spread>px] var(--token)». Bare de TO
      // første lengdene er forskyvning — blur/spread sier ingenting om retning.
      const layers = declaredValue(level)
        .split(/,(?![^(]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => layer.includes('px'));
      expect(layers.length).toBe(3);
      for (const layer of layers) {
        const lengths = [...layer.matchAll(/(-?\d+)px/g)].map((m) => Number(m[1]));
        const [x, y] = lengths;
        expect(x, `${level} «${layer}»: x-forskyvning må være ≥0`).toBeGreaterThanOrEqual(0);
        expect(y, `${level} «${layer}»: y-forskyvning må være >0`).toBeGreaterThan(0);
      }
    }
  });
});

describe('dybdekontrakten — temaene overstyrer KUN farger', () => {
  it.each(COLOR_TOKENS)('%s er definert i alle tre temablokkene (mørk + 2 lys)', (token) => {
    const count = [...CSS.matchAll(new RegExp(`${token}:`, 'g'))].length;
    expect(count).toBe(3);
  });

  it('CTA-ens brede skygge er dempet mot den generelle brede i BEGGE temaer', () => {
    for (let block = 0; block < 3; block += 1) {
      const broad = alphaOf(declaredValue('--dw-sh-broad', block));
      const broadCta = alphaOf(declaredValue('--dw-sh-broad-cta', block));
      expect(broadCta, `blokk ${block}: CTA-skyggen leser som amberglød, ikke dybde`).toBeLessThan(broad);
    }
  });

  it('lys modus bruker VARME skygger — aldri nesten-svart (leser som grått skitt på krem)', () => {
    for (const block of [1, 2]) {
      for (const token of ['--dw-sh-contact', '--dw-sh-mid', '--dw-sh-broad'] as const) {
        const value = declaredValue(token, block);
        const rgb = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
        expect(rgb, `${token} i blokk ${block} er ikke rgba`).not.toBeNull();
        const [r, g, b] = [Number(rgb![1]), Number(rgb![2]), Number(rgb![3])];
        expect(r, `${token}: for mørk til å være en varm romskygge`).toBeGreaterThan(60);
        expect(r, `${token}: rødkanalen må dominere (varm tone)`).toBeGreaterThan(b);
        expect(g, `${token}: grønnkanalen skal ligge mellom rød og blå`).toBeGreaterThan(b);
      }
    }
  });
});
