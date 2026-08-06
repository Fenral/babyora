import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BLOKKERINGER, finnBlokkeringer } from '../verify-lanseringsklar.mjs';

/**
 * PORTEN SOM HOLDER LANSERINGSPORTEN ÆRLIG.
 *
 * verify-lanseringsklar.mjs lar interne bygg gå og nekter bare med
 * LANSERING=1. Den er altså STILLE i den daglige løypa — og en stille port
 * er nøyaktig den som råtner uten at noen merker det. Detektoren kan slutte
 * å treffe (filen flyttes, JSX-en skrives om) uten at ett eneste bygg blir
 * rødt, og da ville butikk-bygget passert på fravær.
 *
 * Denne testen kjører i den vanlige suiten og krever to ting:
 *   1. detektoren TREFFER på dagens kode — den ser panelet som faktisk står
 *      der (ikke-vakuøsitet),
 *   2. detektoren SLIPPER når panelet fjernes — ellers ville porten aldri
 *      kunne bli grønn, og da måtte noen skru den av for å lansere.
 *
 * Ledd 2 er det som gjør dette til en ekte to-beint kontrakt: en port som
 * bare kan si «nei» er like ubrukelig som en som bare kan si «ja».
 */
const SKJERM = resolve(process.cwd(), 'src/screens/InnstillingerScreen.tsx');

let original: string | null = null;

afterEach(() => {
  if (original !== null) {
    writeFileSync(SKJERM, original, 'utf8');
    original = null;
  }
});

describe('lanseringsporten kan både se og slippe', () => {
  it('hver blokkering navngir seg selv og sier hvordan den fjernes', () => {
    expect(BLOKKERINGER.length).toBeGreaterThan(0);
    for (const b of BLOKKERINGER) {
      expect(b.id, 'blokkering uten id').toBeTruthy();
      expect(b.hva.length, b.id + ': «hva» er for kort til å hjelpe').toBeGreaterThan(20);
      expect(b.hvorfor.length, b.id + ': mangler begrunnelse').toBeGreaterThan(40);
      expect(
        b.slikFjernes.length,
        b.id + ': sier ikke HVORDAN den fjernes. En blokkering uten '
        + 'oppskrift blir stående til noen tør gjette.',
      ).toBeGreaterThan(20);
    }
  });

  it('1 · detektoren SER widget-spike-panelet slik koden står i dag', () => {
    const funn = finnBlokkeringer().map((b) => b.id);
    expect(
      funn,
      'Detektoren finner ikke widget-spike-panelet. Enten er panelet '
      + 'fjernet — da skal blokkeringen ut av listen i samme endring — '
      + 'eller så treffer ikke detektoren lenger, og butikk-bygget ville '
      + 'passert på fravær.',
    ).toContain('widget-spike-panel');
  });

  it('2 · detektoren SLIPPER når panelet er fjernet', () => {
    original = readFileSync(SKJERM, 'utf8');
    const uten = original.replace(/^.*<WidgetSpikePanel\s*\/>.*$/gmu, '');
    expect(uten, 'monteringen ble ikke fjernet i mutasjonen').not.toContain('<WidgetSpikePanel />');
    writeFileSync(SKJERM, uten, 'utf8');

    const funn = finnBlokkeringer().map((b) => b.id);
    expect(
      funn,
      'Porten melder fortsatt blokkering etter at panelet er fjernet. '
      + 'Da kan den aldri bli grønn, og noen må skru den av for å lansere — '
      + 'som er verre enn ingen port.',
    ).not.toContain('widget-spike-panel');
  });

  it('3 · en UTKOMMENTERT montering teller ikke som montert', () => {
    original = readFileSync(SKJERM, 'utf8');
    const kommentert = original.replace(
      /(^\s*)<WidgetSpikePanel\s*\/>/mu,
      '$1{/* <WidgetSpikePanel /> */}',
    );
    writeFileSync(SKJERM, kommentert, 'utf8');
    expect(
      finnBlokkeringer().map((b) => b.id),
      'Detektoren teller en utkommentert montering som montert. Da ville '
      + 'porten stått rød etter at jobben var gjort — og et rødt lys som '
      + 'ikke kan slukkes blir ignorert.',
    ).not.toContain('widget-spike-panel');
  });
});
