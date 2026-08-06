/**
 * P2 «SPENNET» — kollisjonstest for spennfiguren (Sols fase 11 runde 2,
 * P1: «I kaldtilstanden ligger 'Deres antrekk', stiplet linje og 'Under
 * kaldgulvet' oppå hverandre. […] Gi grenseetikett, terskellinje og
 * kandidatmarkør separate spor; legg til kollisjonstest ved standard og
 * stor tekst.»)
 *
 * Strategien er STRUKTURELL separasjon (dedikerte rader i blokkflyt),
 * og testen håndhever strukturen som gjør overlapp umulig:
 *  1. Figuren bruker ALDRI absolutt posisjonering (ingenting kan legges
 *     oppå noe annet).
 *  2. Grenseetikett (2), terskellinje (2) og kandidatmarkør (1) finnes
 *     som egne data-spor-elementer — og ingen av dem er nøstet i et
 *     annet spor-element.
 *  3. Markøren rendres i sonen dommen plasserer den i (kald → under
 *     kaldgulvet, varm → over varmetaket) — kollisjonsutsatt tilstand
 *     er faktisk den som testes (ikke-vakuøsitet).
 *
 * Dekker kald- OG varmtilstand ved standard (normal-dag), invertert
 * søvn (sovende-vognbarn), storTekst (dynamic-type) og høykontrast
 * (utendorslys). Pikselmålt bekreftelse (bounding boxes i ekte layout)
 * gjøres i tools/lab-skjermbevis-r2.mjs.
 */

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { scenarioForId, type Scenario } from '../felles/scenarier';
import { klokkeForScenario } from '../felles/sele/klokke';
import { Prototype } from '../p2/index';
import { KANDIDAT_IDER, type KandidatId } from '../p2/spennmodell';

/* ------------------------------------------------------------------ *
 * Render-hjelpere
 * ------------------------------------------------------------------ */

function scenario(id: string): Scenario {
  const s = scenarioForId(id);
  if (!s) throw new Error(`ukjent scenario: ${id}`);
  return s;
}

function figurMarkup(scenarioId: string, kandidatId: KandidatId): string {
  const s = scenario(scenarioId);
  const html = renderToStaticMarkup(
    createElement(Prototype, {
      scenario: s,
      klokke: klokkeForScenario(s),
      kandidatId,
    }),
  );
  const start = html.indexOf('<figure');
  const slutt = html.indexOf('</figure>');
  if (start < 0 || slutt < 0) {
    throw new Error(`${scenarioId}/${kandidatId}: fant ingen figur i markup`);
  }
  return html.slice(start, slutt + '</figure>'.length);
}

type SporElement = { spor: string; ytre: string };

/**
 * Minimal balansert tag-skanner over Reacts statiske markup (velformet,
 * ingen void-elementer i figuren): returnerer outerHTML for hvert
 * element med data-spor-attributt.
 */
function sporElementer(html: string): SporElement[] {
  const re = /<(\/)?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const stakk: { navn: string; spor: string | null; start: number }[] = [];
  const ut: SporElement[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [hele, lukk, navn] = m;
    if (!lukk) {
      const spor = /data-spor="([^"]+)"/.exec(hele);
      stakk.push({ navn, spor: spor ? spor[1] : null, start: m.index });
    } else {
      const aapnet = stakk.pop();
      if (!aapnet || aapnet.navn !== navn) {
        throw new Error(`ubalansert markup ved </${navn}>`);
      }
      if (aapnet.spor !== null) {
        ut.push({ spor: aapnet.spor, ytre: html.slice(aapnet.start, re.lastIndex) });
      }
    }
  }
  return ut;
}

function antall(elementer: SporElement[], spor: string): number {
  return elementer.filter((e) => e.spor === spor).length;
}

/* ------------------------------------------------------------------ *
 * Kombinasjonene: kald/trygg/varm × standard, invertert søvn,
 * storTekst og høykontrast
 * ------------------------------------------------------------------ */

const SCENARIO_IDS = [
  'normal-dag', // standard tekst, kaldgulvet er hard grense
  'sovende-vognbarn', // invertert: varmetaket er hard grense (søvn)
  'dynamic-type', // storTekst 1.4×
  'utendorslys', // høykontrast
] as const;

const POSISJONSFRASE: Record<KandidatId, string> = {
  kald: 'under kaldgulvet',
  trygg: 'i trygt spenn',
  varm: 'over varmetaket',
};

const GRENSEETIKETT_FOR_KANDIDAT: Record<'kald' | 'varm', string> = {
  kald: 'Under kaldgulvet',
  varm: 'Over varmetaket',
};

describe('P2-kollisjonstest: etikett, terskellinje og markør har separate spor', () => {
  for (const scenarioId of SCENARIO_IDS) {
    for (const kandidatId of KANDIDAT_IDER) {
      it(`${scenarioId} / ${kandidatId}: strukturen gjør overlapp umulig`, () => {
        const figur = figurMarkup(scenarioId, kandidatId);

        // 1) Ingen absolutt posisjonering i figuren — ingenting KAN
        //    legges oppå noe annet.
        expect(figur).not.toMatch(/position\s*:\s*absolute/i);

        // 2) Alle tre spor finnes i riktig antall (ikke-vakuøst) …
        const elementer = sporElementer(figur);
        expect(antall(elementer, 'grenseetikett')).toBe(2);
        expect(antall(elementer, 'terskellinje')).toBe(2);
        expect(antall(elementer, 'kandidatmarkor')).toBe(1);

        // … og ingen spor-element er nøstet i et annet spor-element:
        // hvert outerHTML bærer nøyaktig sin egen data-spor-forekomst.
        for (const e of elementer) {
          expect(
            (e.ytre.match(/data-spor=/g) ?? []).length,
            `${scenarioId}/${kandidatId}: ${e.spor} nøster et annet spor`,
          ).toBe(1);
        }

        // 3) Kollisjonsutsatt tilstand er faktisk rendret: dommen i
        //    figcaption matcher kandidaten (mutasjonskobling — testen er
        //    ikke grønn på en trygg markør når kald/varm var bestilt).
        expect(figur).toContain(POSISJONSFRASE[kandidatId]);
      });
    }
  }

  for (const scenarioId of SCENARIO_IDS) {
    for (const kandidatId of ['kald', 'varm'] as const) {
      it(`${scenarioId} / ${kandidatId}: markøren er egen rad ETTER grenseetiketten i samme sone`, () => {
        const figur = figurMarkup(scenarioId, kandidatId);
        const etikettIdx = figur.indexOf(GRENSEETIKETT_FOR_KANDIDAT[kandidatId]);
        const markorIdx = figur.indexOf('data-spor="kandidatmarkor"');
        expect(etikettIdx).toBeGreaterThanOrEqual(0);
        expect(markorIdx).toBeGreaterThanOrEqual(0);
        // Markørraden kommer etter sonens etikett i dokumentflyten —
        // egen rad under etiketten, aldri samme rad/lag.
        expect(markorIdx).toBeGreaterThan(etikettIdx);
        // Etiketten selv inneholder aldri markøren.
        const etikett = sporElementer(figur).filter((e) => e.spor === 'grenseetikett');
        for (const e of etikett) {
          expect(e.ytre).not.toContain('Deres antrekk');
        }
      });
    }
  }

  it('mutasjonsbevis for skanneren: nøstede spor-elementer oppdages', () => {
    const nostet =
      '<div data-spor="grenseetikett"><span data-spor="kandidatmarkor">x</span></div>';
    const elementer = sporElementer(nostet);
    const ytterste = elementer.find((e) => e.spor === 'grenseetikett');
    expect(ytterste).toBeTruthy();
    expect((ytterste!.ytre.match(/data-spor=/g) ?? []).length).toBeGreaterThan(1);
  });
});
