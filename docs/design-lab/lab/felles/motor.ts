/**
 * Motoradapter for design-laben.
 *
 * Tar et Scenario og kaller dagens produksjonsmotor URØRT:
 *  - recommend() fra src/lib/wool-layers (hele pipelinen: modifiers →
 *    conflicts → soft blocks → hard safety → finalizeSafety-grensen)
 *  - feelsLikeC() fra src/lib/met-no/feels-like
 *
 * Ulikt produksjonsappen kables `vognMode` og `context.bilstol` her
 * (spec §2.1 — felles sikkerhetsgjeld, aktiveres én gang for alle fire
 * prototyper). Adapteren beregner ALDRI egne plagg — den oversetter kun
 * scenario → RecommendInput og pakker resultatet.
 */

import { recommend } from '@lib/wool-layers/recommend';
import { feelsLikeC } from '@lib/met-no/feels-like';
import type { Recommendation, TempBand } from '@lib/wool-layers/types';
import type { SafetyFlag } from '@lib/wool-layers/safety';
import type { Scenario, ScenarioWeather } from './scenarier';

export type MotorOk = {
  status: 'ok';
  recommendation: Recommendation;
  feelsLikeC: number;
  band: TempBand;
};

export type MotorDegradert = {
  status: 'degradert';
  recommendation: null;
  feelsLikeC: null;
  band: null;
  /** Klarspråk-årsak til degraderingen (vises aldri som teknisk feilkode). */
  aarsak: string;
};

export type MotorResultat = MotorOk | MotorDegradert;

/**
 * Kjør motoren for et vilkårlig værsett i scenariets kontekst.
 * Brukes direkte for delta-scenariet (i går vs. i dag) — samme barn,
 * samme aktivitet, to værdatasett.
 */
export function kjorMotorForVaer(
  weather: ScenarioWeather,
  scenario: Scenario,
): MotorOk {
  const feels = feelsLikeC(weather.tempC, weather.windMs);
  const recommendation = recommend({
    weather: {
      tempC: weather.tempC,
      feelsLikeC: feels,
      windMs: weather.windMs,
      precipMmH: weather.precipMmH,
      symbolCode: weather.symbolCode,
    },
    child: { ageMonths: scenario.child.ageMonths },
    activity: scenario.activity,
    vognMode: scenario.vognMode,
    context: { bilstol: scenario.bilstol ?? false },
  });
  return {
    status: 'ok',
    recommendation,
    feelsLikeC: feels,
    band: recommendation.tempBand,
  };
}

/**
 * Hovedinngang: scenario → motorresultat.
 *
 * Degradert når værdata mangler ELLER rådets gyldighet er passert (INV-2:
 * et utløpt råd har mistet påstandsstatus — det skal ikke re-serveres,
 * det skal maskeres strukturelt til ny beregning finnes).
 */
export function kjorMotor(scenario: Scenario): MotorResultat {
  if (scenario.weather === null) {
    return {
      status: 'degradert',
      recommendation: null,
      feelsLikeC: null,
      band: null,
      aarsak: 'Værdata er ikke tilgjengelig akkurat nå.',
    };
  }
  if (scenario.flags.utlopt) {
    return {
      status: 'degradert',
      recommendation: null,
      feelsLikeC: null,
      band: null,
      aarsak: `Rådet gjaldt til ${scenario.gyldigTil} og må beregnes på nytt.`,
    };
  }
  return kjorMotorForVaer(scenario.weather, scenario);
}

/** Hard blocks = HIGH/CRITICAL; soft = MEDIUM/LOW. NONE vises ikke. */
export function delFlags(flags: SafetyFlag[] | undefined): {
  hard: SafetyFlag[];
  soft: SafetyFlag[];
} {
  const hard: SafetyFlag[] = [];
  const soft: SafetyFlag[] = [];
  for (const f of flags ?? []) {
    if (f.severity === 'HIGH' || f.severity === 'CRITICAL') hard.push(f);
    else if (f.severity === 'MEDIUM' || f.severity === 'LOW') soft.push(f);
  }
  return { hard, soft };
}
