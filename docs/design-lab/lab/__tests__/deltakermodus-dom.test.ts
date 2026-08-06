/**
 * P3/P4 — deltakerflaten er fri for operatørutstyr (Sols fase 11
 * runde 2, P1: «Første viewport viser 'Simulert klokke', spoleknapper og
 * hendelseslogg. […] Flytt tidsstyring og logg til separat operatørflate;
 * deltakeren skal bare se oppgaveprompt og produktflaten.»)
 *
 * Kilden til lekkasjen var PROTOTYPENES EGNE flater (p3/index.tsx og
 * p4/index.tsx rendret klokkepanel, spoleknapper og hendelseslogg selv —
 * ikke selen). Denne testen rendrer prototypene statisk for alle ti
 * scenarier og er rød hvis noe av operatørutstyret gjeninnføres i
 * komponentene. Automatisering/operatør styrer klokka via selens
 * window.__lab (LabVinduAPI) — utenfor deltakerens DOM; det live-DOM-et
 * (etter interaksjon) verifiseres i tillegg i tools/lab-skjermbevis-r2.mjs.
 */

import { describe, expect, it } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SCENARIER, type Scenario } from '../felles/scenarier';
import { klokkeForScenario, type LabKlokke } from '../felles/sele/klokke';
import type { LabVinduAPI } from '../felles/sele/deltakermodus';
import { Prototype as P3Prototype } from '../p3/index';
import { Prototype as P4Prototype } from '../p4/index';

type Props = { scenario: Scenario; klokke: LabKlokke };

const OPERATORUTSTYR: { navn: string; monster: RegExp }[] = [
  { navn: 'simulert klokke', monster: /Simulert klokke/ },
  { navn: 'spoleknapper', monster: /Spol \+|Spol til neste/ },
  { navn: 'hendelseslogg', monster: /Hendelseslogg/ },
  { navn: 'scenariovelger', monster: /<select/ },
  { navn: 'Williams-panel', monster: /Williams/ },
];

function markup(Komponent: ComponentType<Props>, scenario: Scenario): string {
  return renderToStaticMarkup(
    createElement(Komponent, { scenario, klokke: klokkeForScenario(scenario) }),
  );
}

describe('P3: prototypeflaten er uten operatørutstyr', () => {
  for (const s of SCENARIER) {
    it(`${s.id}: ingen klokke/spoling/logg — widgeten finnes`, () => {
      const html = markup(P3Prototype, s);
      // Ikke-vakuøst: produktflaten er faktisk rendret.
      expect(html).toContain('SIMULERT WIDGET');
      for (const { navn, monster } of OPERATORUTSTYR) {
        expect(monster.test(html), `${s.id}: ${navn} lekket inn i P3`).toBe(false);
      }
    });
  }
});

describe('P4: prototypeflaten er uten operatørutstyr', () => {
  for (const s of SCENARIER) {
    it(`${s.id}: ingen klokke/spoling/logg — brief-flaten finnes`, () => {
      const html = markup(P4Prototype, s);
      expect(html).toContain('SIMULERT BRIEF-FLATE');
      for (const { navn, monster } of OPERATORUTSTYR) {
        expect(monster.test(html), `${s.id}: ${navn} lekket inn i P4`).toBe(false);
      }
    });
  }
});

describe('window.__lab-kontrakten erstatter de synlige kontrollene', () => {
  it('LabVinduAPI eksponerer spol, naaISO og hendelser (typet kontrakt)', () => {
    // Kompileringstest: et objekt som oppfyller kontrakten — skjermbevis-
    // skriptet bruker nøyaktig disse tre.
    const api: LabVinduAPI = {
      spol: () => undefined,
      naaISO: () => '2026-01-15T10:15:00+01:00',
      hendelser: () => [],
    };
    expect(typeof api.spol).toBe('function');
    expect(typeof api.naaISO).toBe('function');
    expect(Array.isArray(api.hendelser())).toBe(true);
  });

  it('detektoren er reell: operatørstrengene fanges når de finnes', () => {
    const gammelFlate =
      '<section aria-label="Virtuell klokke"><p>Simulert klokke: 10:15</p>' +
      '<button>Spol +30 min</button></section><section>Hendelseslogg</section>';
    const treff = OPERATORUTSTYR.filter(({ monster }) => monster.test(gammelFlate));
    expect(treff.map((t) => t.navn)).toEqual([
      'simulert klokke',
      'spoleknapper',
      'hendelseslogg',
    ]);
  });
});
