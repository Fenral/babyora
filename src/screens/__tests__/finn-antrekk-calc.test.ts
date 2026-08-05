/**
 * finn-antrekk-calc — P10/JOB4 pure decision-function tests (CTA-driven
 * scan model). No DOM needed — same convention as scan-orchestration.test.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  ctaLabelFor,
  nextPhaseAfterParamChange,
  paramsChanged,
  resultDemotedFor,
  showCtaFor,
  showResultFor,
  type CommittedParams,
} from '../finn-antrekk-calc';

const BASE: CommittedParams = { tempC: -4, windMs: 3, precipMmH: 0, activityUi: 'lek' };

describe('paramsChanged', () => {
  it('is false when nothing is committed yet', () => {
    expect(paramsChanged(null, BASE)).toBe(false);
  });

  it('is false when the current values exactly match the committed snapshot', () => {
    expect(paramsChanged(BASE, { ...BASE })).toBe(false);
  });

  it.each<[keyof CommittedParams, unknown]>([
    ['tempC', -5],
    ['windMs', 4],
    ['precipMmH', 1],
    ['activityUi', 'vogn'],
  ])('is true when only %s differs', (key, value) => {
    expect(paramsChanged(BASE, { ...BASE, [key]: value })).toBe(true);
  });
});

describe('nextPhaseAfterParamChange — CTA-driven flow: no recompute on slider change until CTA', () => {
  it('idle stays idle when sliders move — never auto-computes before the first CTA tap', () => {
    expect(nextPhaseAfterParamChange('idle', null, { ...BASE, tempC: 10 })).toBe('idle');
  });

  it('scanning is untouched by parameter drift mid-flight (the 400ms snapshot already happened at tap time)', () => {
    expect(nextPhaseAfterParamChange('scanning', BASE, { ...BASE, windMs: 9 })).toBe('scanning');
  });

  it('a result that is already stale stays stale (no double-transition) while unadjusted further', () => {
    expect(nextPhaseAfterParamChange('stale', BASE, { ...BASE, tempC: 2 })).toBe('stale');
  });

  it('fresh + unchanged params stays fresh (result matches sliders — no re-arm)', () => {
    expect(nextPhaseAfterParamChange('fresh', BASE, { ...BASE })).toBe('fresh');
  });

  it('fresh + a slider adjustment re-arms to stale (owner spec: "adjusting any slider re-arms the CTA")', () => {
    expect(nextPhaseAfterParamChange('fresh', BASE, { ...BASE, precipMmH: 2 })).toBe('stale');
  });

  it('fresh with no committed snapshot at all is a defensive no-op (stays fresh, never crashes)', () => {
    expect(nextPhaseAfterParamChange('fresh', null, BASE)).toBe('fresh');
  });

  /* ══ DoD fase 5, punkt 3: STALE-LÅSEN SLIPPER TAKET ══════════════════════
     Overgangen gikk bare én vei. Dro man en slider og dro den TILBAKE, sto
     fasen på 'stale' selv om appen hadde nøyaktig det svaret liggende — og
     et CTA-trykk brente 3,2 sekunders seremoni på å produsere et resultat
     som var bit for bit identisk med det som allerede sto på skjermen.
     En seremoni som kjører uten å endre noe undergraver seremonien de
     gangene den faktisk betyr noe. */

  it('stale + parametrene tilbake til det committede snapshotet blir fresh igjen', () => {
    expect(
      nextPhaseAfterParamChange('stale', BASE, { ...BASE }),
      'stale-låsen holder fast i et svar appen allerede har',
    ).toBe('fresh');
  });

  it('angre-veien er symmetrisk med re-arm-veien — samme snapshot, motsatt fortegn', () => {
    /* Rundturen må lukke seg: fram, tilbake, og tilbake til utgangspunktet.
       Uten denne kunne én retning virke mens den andre stille sto stille. */
    const endret = { ...BASE, tempC: BASE.tempC + 3 };
    expect(nextPhaseAfterParamChange('fresh', BASE, endret)).toBe('stale');
    expect(nextPhaseAfterParamChange('stale', BASE, endret)).toBe('stale');
    expect(nextPhaseAfterParamChange('stale', BASE, { ...BASE })).toBe('fresh');
  });

  it('hver enkelt parameter kan angres, ikke bare temperaturen', () => {
    /* Uten denne kunne implementasjonen sammenlignet ÉTT felt og bestått.
       Fire felt, fire runturer. */
    const felter = [
      { ...BASE, tempC: BASE.tempC + 1 },
      { ...BASE, windMs: BASE.windMs + 1 },
      { ...BASE, precipMmH: BASE.precipMmH + 1 },
      { ...BASE, activityUi: BASE.activityUi === 'lek' ? 'vogn' : 'lek' } as typeof BASE,
    ];
    for (const endret of felter) {
      expect(nextPhaseAfterParamChange('fresh', BASE, endret)).toBe('stale');
      expect(nextPhaseAfterParamChange('stale', BASE, { ...BASE })).toBe('fresh');
    }
  });

  it('stale UTEN committed snapshot rører seg ikke — det finnes intet svar å kalle ferskt', () => {
    /* Defensiv: `committed === null` betyr at ingenting er beregnet. Å kalle
       den tilstanden 'fresh' ville påstått at et svar finnes. */
    expect(nextPhaseAfterParamChange('stale', null, BASE)).toBe('stale');
  });
});

describe('ctaLabelFor', () => {
  it('reads "Finn antrekk" for idle (never scanned)', () => {
    expect(ctaLabelFor('idle')).toBe('Finn antrekk');
  });

  it('reads "Finn antrekk" while scanning (micropass owns the CTA area, but the label constant is still this)', () => {
    expect(ctaLabelFor('scanning')).toBe('Finn antrekk');
  });

  it('reads "Finn antrekk" while fresh (not surfaced — showCtaFor hides it — but the label itself is not "Beregn på nytt" here)', () => {
    expect(ctaLabelFor('fresh')).toBe('Finn antrekk');
  });

  it('reads "Beregn på nytt" once re-armed (stale)', () => {
    expect(ctaLabelFor('stale')).toBe('Beregn på nytt');
  });
});

describe('showCtaFor — mirrors HjemMonter\'s own result-current (no CTA when the result already matches)', () => {
  it('shows for idle', () => { expect(showCtaFor('idle')).toBe(true); });
  it('hides for scanning (micropass replaces it)', () => { expect(showCtaFor('scanning')).toBe(false); });
  it('hides for fresh (result already matches — no CTA needed)', () => { expect(showCtaFor('fresh')).toBe(false); });
  it('shows for stale (re-armed)', () => { expect(showCtaFor('stale')).toBe(true); });
});

describe('showResultFor / resultDemotedFor — result stays visible, only demoted, never hidden once it exists', () => {
  it('no result section before the first committed calculation', () => {
    expect(showResultFor(null)).toBe(false);
  });

  it('result section appears and stays once something is committed', () => {
    expect(showResultFor(BASE)).toBe(true);
  });

  it('fresh result is not demoted', () => {
    expect(resultDemotedFor('fresh')).toBe(false);
  });

  it('stale result IS demoted (still shown — resultDemotedFor only controls opacity, showResultFor still true)', () => {
    expect(resultDemotedFor('stale')).toBe(true);
    expect(showResultFor(BASE)).toBe(true);
  });

  it('scanning does not demote an existing (not-yet-touched) result', () => {
    expect(resultDemotedFor('scanning')).toBe(false);
  });
});
