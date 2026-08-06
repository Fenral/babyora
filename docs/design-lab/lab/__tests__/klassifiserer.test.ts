/**
 * Kontrakttest §4.1 — modusklassifisereren, TABELLDREVET.
 *
 * Hver rad = input-kombinasjon → forventet modus (og der prioritet er
 * poenget: forventet regel-id). Fasit for de ti scenariene er beregnet fra
 * motorens faktiske utfall (probe 2026-08-06) og sanity-sjekket mot
 * regeltabellens semantikk — ikke avledet av koden som testes.
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import { hentFakta, type NoytraleFakta } from '../felles/fakta';
import { klassifiser, klassifiserDetaljert } from '../p1/klassifiserer';
import { REGELTABELL, type Modus } from '../p1/regeltabell';

function fakta(id: string, overstyr: Partial<Scenario> = {}): NoytraleFakta {
  const scenario = scenarioForId(id);
  if (!scenario) throw new Error(`ukjent scenario: ${id}`);
  return hentFakta({ ...scenario, ...overstyr });
}

/* ---------------------------------------------------------------- *
 * Rad-fasit for alle ti scenariene fra scenarier.ts
 *
 * Motorutfall bak fasiten (feels-som / band / flagg):
 *  normal-dag         2.5 / kald         / ingen      → normal
 *  grensevaer        −4.3 / frost        / SB-2 soft  → folg-med
 *  sovende-vognbarn  −8.3 / streng_frost / ingen      → avvik (sover i frost)
 *  bilstol          −13.1 / streng_frost / HB-9 m.fl. → avvik (bilstol-regel)
 *  manglende-vaerdata  —  / —            / —          → degradert
 *  endret-vaer       −5.9 / frost        / ingen      → folg-med (1,1° fra
 *    −7-grensen ≤ vindmålingens deklarerte usikkerhetsbånd ±2° ved 7 m/s —
 *    grensevær-marginen er maks(hysterese 1°, usikkerhetsbånd), Sols avvik a)
 *  utlopt-raad         —  / —            / —          → degradert
 *  ny-omsorgsperson   2.5 / kald         / ingen      → normal
 *  dynamic-type       2.5 / kald         / ingen      → normal
 *  utendorslys       −7.4 / streng_frost / CK-6 hard  → avvik (hard-safety)
 * ---------------------------------------------------------------- */
const SCENARIO_FASIT: ReadonlyArray<[id: string, forventet: Modus]> = [
  ['normal-dag', 'normal'],
  ['grensevaer', 'folg-med'],
  ['sovende-vognbarn', 'avvik'],
  ['bilstol', 'avvik'],
  ['manglende-vaerdata', 'degradert'],
  ['endret-vaer', 'folg-med'],
  ['utlopt-raad', 'degradert'],
  ['ny-omsorgsperson', 'normal'],
  ['dynamic-type', 'normal'],
  ['utendorslys', 'avvik'],
];

describe('klassifiserer — de ti scenariene (tabelldrevet)', () => {
  it('fasiten dekker nøyaktig alle scenarier i fikstursettet (ikke-vakuøs)', () => {
    expect(SCENARIO_FASIT.map(([id]) => id).sort()).toEqual(
      SCENARIER.map((s) => s.id).sort(),
    );
    // Alle fire modi er representert i fasiten — testen kan ikke bestås
    // av en klassifiserer som alltid svarer det samme.
    expect(new Set(SCENARIO_FASIT.map(([, m]) => m))).toEqual(
      new Set(['normal', 'folg-med', 'avvik', 'degradert']),
    );
  });

  it.each(SCENARIO_FASIT)('%s → %s', (id, forventet) => {
    expect(klassifiser(fakta(id))).toBe(forventet);
  });
});

describe('klassifiserer — prioritet ved kombinasjoner (Sols krav)', () => {
  it('bilstol + kulde + sovende barn → avvik med bilstol-regelen øverst', () => {
    const kombo = fakta('bilstol', { vognMode: 'sleeping' });
    const resultat = klassifiserDetaljert(kombo);
    expect(resultat.modus).toBe('avvik');
    expect(resultat.regel.id).toBe('bilstol-kulde');
  });

  it('sovende i frost UTEN bilstol → avvik via sovende-frost-regelen', () => {
    const resultat = klassifiserDetaljert(fakta('sovende-vognbarn'));
    expect(resultat.modus).toBe('avvik');
    expect(resultat.regel.id).toBe('sovende-frost');
  });

  it('hard safety-hendelse alene → avvik via hard-safety-regelen', () => {
    const resultat = klassifiserDetaljert(fakta('utendorslys'));
    expect(resultat.modus).toBe('avvik');
    expect(resultat.regel.id).toBe('hard-safety');
  });

  it('regeltabellen rangerer bilstol foran sovende foran generisk hard-safety', () => {
    const prioritet = (id: string) => {
      const regel = REGELTABELL.find((r) => r.id === id);
      if (!regel) throw new Error(`regel mangler i tabellen: ${id}`);
      return regel.prioritet;
    };
    expect(prioritet('bilstol-kulde')).toBeLessThan(prioritet('sovende-frost'));
    expect(prioritet('sovende-frost')).toBeLessThan(prioritet('hard-safety'));
  });

  it('grensevær uten flagg → folg-med via grensevaer-regelen', () => {
    // Syntetisk: vindstille 5 °C → føles-som 5.0, eksakt på kjolig/kald-grensen.
    const resultat = klassifiserDetaljert(
      fakta('normal-dag', {
        weather: { tempC: 5, windMs: 0, precipMmH: 0, symbolCode: 'clearsky_day' },
      }),
    );
    expect(resultat.modus).toBe('folg-med');
    expect(resultat.regel.id).toBe('grensevaer');
  });
});

describe('klassifiserer — ukjent/motstridende gir ALDRI normal', () => {
  const ugyldigeVarianter: ReadonlyArray<[navn: string, lag: () => NoytraleFakta]> = [
    [
      'aktivitet mangler',
      () => {
        const f = fakta('normal-dag');
        return { ...f, kontekst: { ...f.kontekst, activity: undefined as never } };
      },
    ],
    [
      'ukjent aktivitet',
      () => {
        const f = fakta('normal-dag');
        return { ...f, kontekst: { ...f.kontekst, activity: 'sykkel' as never } };
      },
    ],
    [
      'tempC er NaN',
      () => {
        const f = fakta('normal-dag');
        return { ...f, vaergrunnlag: { ...f.vaergrunnlag!, tempC: Number.NaN } };
      },
    ],
    [
      'feelsLikeC mangler',
      () => {
        const f = fakta('normal-dag');
        return {
          ...f,
          vaergrunnlag: { ...f.vaergrunnlag!, feelsLikeC: undefined as never },
        };
      },
    ],
    [
      'datakvalitet ok men værgrunnlag mangler (selvmotsigende)',
      () => {
        const f = fakta('normal-dag');
        return { ...f, vaergrunnlag: null };
      },
    ],
    [
      'band mangler',
      () => {
        const f = fakta('normal-dag');
        return {
          ...f,
          vaergrunnlag: { ...f.vaergrunnlag!, band: undefined as never },
        };
      },
    ],
    [
      'kontekst mangler helt',
      () => {
        const f = fakta('normal-dag');
        return { ...f, kontekst: undefined as never };
      },
    ],
  ];

  it.each(ugyldigeVarianter)('%s → avvik (aldri normal)', (_navn, lag) => {
    const modus = klassifiser(lag());
    expect(modus).not.toBe('normal');
    expect(modus).toBe('avvik');
  });

  it('motstridende kontekst (bilstol && utelek) → avvik via motstridende-regelen', () => {
    const resultat = klassifiserDetaljert(
      fakta('bilstol', { activity: 'utelek', vognMode: undefined }),
    );
    expect(resultat.modus).toBe('avvik');
    expect(resultat.regel.id).toBe('motstridende-kontekst');
  });

  it('vognMode uten vogn-aktivitet → avvik (motstridende)', () => {
    const f = fakta('normal-dag');
    const mutert: NoytraleFakta = {
      ...f,
      kontekst: { ...f.kontekst, activity: 'utelek', vognMode: 'awake' },
    };
    expect(klassifiser(mutert)).toBe('avvik');
  });
});

describe('regeltabellen — struktur (mutasjonsvern)', () => {
  it('er eksplisitt, unik og dekker alle fire modi', () => {
    const ids = REGELTABELL.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(REGELTABELL.map((r) => r.modus))).toEqual(
      new Set(['normal', 'folg-med', 'avvik', 'degradert']),
    );
  });

  it('normal finnes KUN som siste fallback-regel', () => {
    const normale = REGELTABELL.filter((r) => r.modus === 'normal');
    expect(normale).toHaveLength(1);
    const maksPrioritet = Math.max(...REGELTABELL.map((r) => r.prioritet));
    expect(normale[0].prioritet).toBe(maksPrioritet);
  });
});
