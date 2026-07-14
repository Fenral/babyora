/**
 * Motor 2.0 Task 16 — eksport av fagpersonens kontrollpakke.
 *
 * Genererer docs/superpowers/evidence/engine-v2-scenarios.json:
 * alle G01–G36 nøyaktig én gang, sortert på ID, med input, termisk behov,
 * valgte roller/materialer, sikkerhetsflagg, legacy-forskjell og blanke
 * beslutningsfelter. Byte-identisk output for samme kildekode: ingen
 * datoer, ingen commit-SHA, ingen tilfeldighet, ingen PII.
 *
 * Kjør: npm run engine:v2:review
 */

import { recommendV2 } from './recommend.js';
import { compareShadow } from './shadow-compare.js';
import { EngineV2Error } from './errors.js';
import { GOLD_SCENARIOS } from './__tests__/gold-scenarios.js';
import { recommend } from '../wool-layers/recommend.js';
import type { RecommendInputV2, Situation } from './types.js';
import type { RecommendInput } from '../wool-layers/types.js';

const SITUATION_TO_ACTIVITY: Record<Situation, RecommendInput['activity']> = {
  stroller_awake: 'vogn',
  carrier: 'baeresele',
  awake_low_mobility: 'utelek',
  active_play: 'utelek',
  calm_outdoors: 'utelek',
  mixed_day: 'utelek',
  indoor_sleep: 'soevn',
};

function toLegacyInput(input: RecommendInputV2): RecommendInput {
  return {
    weather: input.weather,
    child: { ageMonths: input.ageMonths },
    activity: SITUATION_TO_ACTIVITY[input.situation],
    ...(input.exposureMin !== undefined ? { exposureMin: input.exposureMin } : {}),
    ...(input.carrierUnderParentJacket !== undefined ? { innerJakke: input.carrierUnderParentJacket } : {}),
    ...(input.carSeat !== undefined ? { context: { bilstol: input.carSeat } } : {}),
    ...(input.childCalibration !== undefined ? { childCalibration: input.childCalibration } : {}),
  };
}

/** Blanke beslutningsfelter fagpersonen fyller ut (spec §20). */
const BLANK_REVIEW = {
  status: '' as '' | 'approved' | 'approved_with_copy_change' | 'rejected',
  begrunnelse: '',
  fagperson: '',
  dato: '',
  signatur: '',
};

export function buildReviewExport(): Record<string, unknown> {
  const scenarios: Array<Record<string, unknown>> = [];

  for (const scenario of GOLD_SCENARIOS) {
    const v2 = recommendV2(scenario.input);
    const legacy = recommend(toLegacyInput(scenario.input));
    const shadow = compareShadow(legacy, v2);
    scenarios.push({
      id: scenario.id,
      tittel: scenario.title,
      input: scenario.input,
      termiskBehov: v2.intent,
      valgtePlagg: v2.garments.map((g) => ({ rolle: g.role, materiale: g.material, variant: g.variantId, label: g.labelNb })),
      utstyr: v2.equipment.map((e) => ({ id: e.id, label: e.labelNb })),
      sikkerhetsflagg: v2.safetyFlags.map((f) => ({ kode: f.code, alvorlighet: f.severity, melding: f.message })),
      alvorlighet: v2.severity,
      forklaringer: v2.explanations.map((e) => e.code),
      fingerprint: v2.fingerprint,
      legacyForskjell: { status: shadow.status, grunner: shadow.reasons, detaljer: shadow.details },
      faglig: { ...BLANK_REVIEW },
    });
  }

  // Feilscenarioene G22/G35 — forventet avvisning, ingen anbefaling.
  for (const [id, tittel, input, expectedCode] of [
    ['G22', 'Ustøttet alder', { weather: { tempC: 5, feelsLikeC: 5, windMs: 2, precipMmH: 0 }, ageMonths: 25, situation: 'stroller_awake' }, 'unsupported_age'],
    ['G35', 'Ugyldig situasjon', { weather: { tempC: 5, feelsLikeC: 5, windMs: 2, precipMmH: 0 }, ageMonths: 24, situation: 'awake_low_mobility' }, 'invalid_situation_for_age'],
  ] as Array<[string, string, RecommendInputV2, string]>) {
    let observedCode = 'INGEN_FEIL';
    try {
      recommendV2(input);
    } catch (err) {
      observedCode = err instanceof EngineV2Error ? err.code : 'ukjent';
    }
    scenarios.push({
      id, tittel, input,
      forventetFeil: expectedCode,
      observertFeil: observedCode,
      faglig: { ...BLANK_REVIEW },
    });
  }

  scenarios.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return {
    pakke: 'Motor 2.0 faglig kontrollpakke',
    omfang: '0–24 måneder, utendørs + innesøvn-avvisning',
    antallScenarioer: scenarios.length,
    status: 'IKKE SIGNERT — ekstern faglig gjennomgang gjenstår (lanseringsport)',
    scenarioer: scenarios,
  };
}

