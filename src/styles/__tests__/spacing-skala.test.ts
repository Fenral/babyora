/**
 * AVSTANDSSKALAEN — porten som gjør driften synlig og bare lar den krympe.
 *
 * `--dw-space-*` ble ikke valgt, den ble MÅLT. `tools/spacing-detektor.mjs`
 * leser hver avstandsverdi i `src/` og skriver histogrammet; denne porten
 * kjører den samme detektoren og holder to tall i sjakk:
 *
 *   1. Hvor mange avstander står UTENFOR rutenettet (dagens drift: et gulv)
 *   2. At skalaen fortsatt er den målte — endres et trinn, må målingen
 *      kjøres på nytt og tallet forsvares, ikke bare skrives om
 *
 * HVORFOR DETEKTOREN, IKKE ET LAGRET HISTOGRAM: leser porten en JSON-fil på
 * disk, verifiserer den en artefakt som kan være foreldet. Nøyaktig den
 * fellen ble oppdaget samme dag i `verify:hjem`, som kjørte mot forrige
 * bygg og derfor stille kunne godkjenne gammel kode. Porten måler kilden.
 *
 * IKKE-VAKUØSITET: porten rapporterer hvor mange verdier den faktisk fant.
 * Null mål = rødt. En port som består på fravær er ikke en port — det er
 * sjuende gang den regelen har vært nødvendig i dette arbeidet.
 *
 * KLASSENE HOLDES FRA HVERANDRE. Første forslag talte `44px` som et
 * avstandstrinn med «19 treff». Det finnes NULL 44px i en avstandsegenskap;
 * alle er høyde eller bredde. Å telle en høyde som en avstand kjøper dekning
 * man ikke har, og porten ville ha meldt grønt på et falskt tall.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { funn } from '../../../tools/spacing-detektor.mjs';

const TOKENFIL = readFileSync(join(process.cwd(), 'src/styles/design-tokens-v2.css'), 'utf8');

/** Skalaen slik den er DEKLARERT — leses av tokenfilen, ikke duplisert her. */
function deklarertSkala(): number[] {
  const ut: number[] = [];
  for (const m of TOKENFIL.matchAll(/--dw-space-(\d+)\s*:\s*(\d+)px/gu)) {
    ut.push(Number(m[2]));
  }
  return ut.sort((a, b) => a - b);
}

const avstander = (funn as Array<{ px: number; klasse: string; fil: string; linje: number }>)
  .filter((f) => f.klasse === 'avstand');

/* Negative verdier er OPTISKE nudger, ikke avstander. De står på
   unntakslisten sammen med safe-area og målte ankere: et skalatrinn ville
   vært feil der, ikke bare ukurant. */
const positive = avstander.filter((f) => f.px > 0);

/**
 * DAGENS DRIFT, målt av porten selv 2026-08-04: 78 av 724 avstander (10,8 %)
 * treffer ikke et trinn. Ni av dem er store engangsverdier (108, 130, 100,
 * 90, 50, 40, 30, 28, 26) som hører hjemme på unntakslisten — detektoren
 * leser den ikke ennå, så de teller med i gulvet inntil videre. Tallet er et GULV. Fase 3 driver det mot null; det skal aldri
 * heves for å få porten grønn.
 */
const DRIFT_GULV = 78;

describe('avstandsskalaen', () => {
  it('IKKE-VAKUØSITET: detektoren fant faktisk avstander å måle', () => {
    expect(avstander.length, 'null avstandsverdier funnet — porten måler ingenting')
      .toBeGreaterThan(400);
    const filer = new Set(avstander.map((f) => f.fil));
    expect(filer.size, 'avstander funnet i under 10 filer — skopet er for smalt')
      .toBeGreaterThan(10);
    console.log(`\n  spacing-skala: ${avstander.length} avstander i ${filer.size} filer\n`);
  });

  it('skalaen i tokenfilen er den målte — 2-punkts rutenett 2..24 pluss 32', () => {
    /* Verdiene er ikke et designvalg tatt i et vakuum: et 4-punktsrutenett
       ble målt til 46,3 % dekning mot 2-punktets 89,2 %. Endres denne lista,
       er det en beslutning som krever ny måling — derfor står den her, slik
       at en stille endring blir rød. */
    expect(deklarertSkala()).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32]);
  });

  it('størrelsesmålene er deklarert og er GEOMETRI, ikke avstand', () => {
    for (const token of ['--dw-size-touch', '--dw-size-cta', '--dw-size-row']) {
      expect(TOKENFIL, `${token} mangler`).toContain(`${token}:`);
    }
    /* Trykkmålet er et GULV. Tre flater ligger i dag over det (48, 64, 64),
       og et forslag om å «normalisere» dem ned til 44 ble felt: tre
       reduksjoner og null økninger, solgt som at trykkmålet ble tokenisert. */
    const m = /--dw-size-touch:\s*(\d+)px/u.exec(TOKENFIL);
    expect(m, '--dw-size-touch er ikke en px-verdi').not.toBeNull();
    expect(Number(m![1]), 'trykkmålet kan ikke være under 44 px (WCAG 2.5.8)')
      .toBeGreaterThanOrEqual(44);
  });

  it(`driften utenfor rutenettet er ikke ØKT over gulvet på ${DRIFT_GULV}`, () => {
    const skala = new Set(deklarertSkala());
    const utenfor = positive.filter((f) => !skala.has(f.px));
    const perVerdi = new Map<number, number>();
    for (const f of utenfor) perVerdi.set(f.px, (perVerdi.get(f.px) ?? 0) + 1);
    const oversikt = [...perVerdi.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([px, n]) => `${px}px×${n}`)
      .join('  ');

    console.log(`\n  utenfor rutenettet: ${utenfor.length}/${positive.length} `
      + `(${((utenfor.length / positive.length) * 100).toFixed(1)} %)\n  ${oversikt}\n`);

    expect(
      utenfor.length,
      `${utenfor.length} avstander utenfor rutenettet mot gulvet ${DRIFT_GULV}. `
      + 'Gulvet kan bare KRYMPE — hev det aldri for å få porten grønn.\n  '
      + oversikt,
    ).toBeLessThanOrEqual(DRIFT_GULV);
  });

  it('dekningen holder seg over 85 % — under det lager skalaen mer arbeid enn den sparer', () => {
    const skala = new Set(deklarertSkala());
    const truffet = positive.filter((f) => skala.has(f.px)).length;
    const prosent = (truffet / positive.length) * 100;
    console.log(`\n  dekning: ${truffet}/${positive.length} = ${prosent.toFixed(1)} %\n`);
    expect(prosent, `dekning ${prosent.toFixed(1)} % — en skala som ikke treffer koden, `
      + 'gjør hver avstand til en migreringsoppgave').toBeGreaterThan(85);
  });
});
