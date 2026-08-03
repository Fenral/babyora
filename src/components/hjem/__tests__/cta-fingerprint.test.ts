/**
 * cta-fingerprint — eier-override v4 (PRODUCT.md 2026-08-03).
 *
 * Testene bruker EKTE fingerprints (recommend() + computeScanResultKey), ikke
 * oppdiktede strenger. Det er med vilje: en test som mater inn 'a' og 'b'
 * beviser bare at en Set fungerer. Her må nøklene faktisk komme fra motorens
 * utfall, og hver test som krever «kjent» har en FORUTSETNING som slår fast at
 * nøklene i utgangspunktet er FORSKJELLIGE — ellers ville testen bestått på
 * fravær (to identiske nøkler gjør enhver cache-logikk triviell).
 */
import { describe, expect, it } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../lib/wool-layers/types.js';
import {
  computeScanResultKey,
  type ScanResultKeyWeather,
} from '../../../lib/scan/result-key.js';
import { FULL_SCAN_DURATION_MS, QUICK_RECALC_DURATION_MS } from '../scan-orchestration.js';
import {
  CTA_CEREMONY_LABEL,
  CTA_CEREMONY_LINE,
  CTA_REVEAL_LABEL,
  CTA_REVEAL_LINE,
  createResultKeyMemory,
  knowsResultKey,
  planCta,
  planRecalc,
  rememberResultKey,
  resultKeyScope,
} from '../cta-fingerprint.js';

const WEATHER: ScanResultKeyWeather = {
  tempC: 1, feelsLikeC: -3, windMs: 4, precipMmH: 0, symbolCode: 'partlycloudy_day',
};

function input(activity: RecommendInput['activity']): RecommendInput {
  return {
    weather: {
      tempC: WEATHER.tempC,
      feelsLikeC: WEATHER.feelsLikeC,
      windMs: WEATHER.windMs,
      precipMmH: WEATHER.precipMmH,
      humidity: 78,
      symbolCode: WEATHER.symbolCode,
      uvIndex: 0,
    },
    child: { ageMonths: 9, canRoll: true },
    activity,
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
  };
}

const keyFor = (activity: RecommendInput['activity'], weather = WEATHER) =>
  computeScanResultKey(recommend(input(activity)), weather);

const K_UTELEK = keyFor('utelek');
const K_VOGN = keyFor('vogn');
const K_MILDERE = keyFor('utelek', { ...WEATHER, tempC: 9, feelsLikeC: 7 });

const SCOPE = resultKeyScope('barn-1', '2026-08-03');

describe('fingerprintene selv (forutsetningen alt annet hviler på)', () => {
  it('to ulike aktiviteter gir to ULIKE nøkler for samme vær — ellers hadde cache-testene vært innholdsløse', () => {
    expect(K_UTELEK).not.toBe(K_VOGN);
  });

  it('samme aktivitet + samme vær gir SAMME nøkkel (deterministisk fingerprint)', () => {
    expect(keyFor('utelek')).toBe(K_UTELEK);
  });

  it('et værskifte gir en ny nøkkel — cachen trenger ingen egen tidsregel for å bli ugyldig', () => {
    expect(K_MILDERE).not.toBe(K_UTELEK);
  });
});

describe('planCta — nøkkelen leses FØR trykket og velger tekst + vei', () => {
  it('ukjent fingerprint → «Finn dagens antrekk» og seremoni-veien', () => {
    const plan = planCta(K_UTELEK, null, createResultKeyMemory(), SCOPE);
    expect(plan.path).toBe('ceremony');
    expect(plan.label).toBe('Finn dagens antrekk');
    expect(plan.line).toBe(CTA_CEREMONY_LINE);
  });

  it('fingerprint som ligger i den persisterte slotten → «Vis dagens antrekk» og reveal-veien', () => {
    const plan = planCta(K_UTELEK, K_UTELEK, createResultKeyMemory(), SCOPE);
    expect(plan.path).toBe('reveal');
    expect(plan.label).toBe('Vis dagens antrekk');
    expect(plan.line).toBe(CTA_REVEAL_LINE);
  });

  it('fingerprint appen landet tidligere i økten → reveal, selv om slotten peker et annet sted', () => {
    const memory = createResultKeyMemory();
    rememberResultKey(memory, SCOPE, K_UTELEK);
    // FORUTSETNING: slotten holder en ANNEN nøkkel, så det er minnet — ikke
    // slotten — som må gjøre jobben her.
    expect(K_VOGN).not.toBe(K_UTELEK);
    expect(planCta(K_UTELEK, K_VOGN, memory, SCOPE).path).toBe('reveal');
  });

  it('slotten fra en ANNEN aktivitet teller når antrekket ble identisk (eierens egen note: «nothing new to show»)', () => {
    // Nøkkelen er utfallsbasert: har vogn og utelek gitt nøyaktig samme
    // plagg i samme vær, er nøkkelen den samme og det finnes ikke noe nytt.
    const identiskUtfall = K_UTELEK;
    expect(planCta(identiskUtfall, K_UTELEK, createResultKeyMemory(), SCOPE).path).toBe('reveal');
  });

  it('været har snudd → ukjent nøkkel → seremoni, selv om samme aktivitet nettopp ble beregnet', () => {
    const memory = createResultKeyMemory();
    rememberResultKey(memory, SCOPE, K_UTELEK);
    expect(planCta(K_MILDERE, K_UTELEK, memory, SCOPE).path).toBe('ceremony');
  });

  it('ingen nøkkel ennå (vær/motor ikke klar) → seremoni-planen, aldri et «Vis»-løfte om noe som ikke finnes', () => {
    const memory = createResultKeyMemory();
    rememberResultKey(memory, SCOPE, K_UTELEK);
    expect(planCta(null, K_UTELEK, memory, SCOPE)).toEqual({
      path: 'ceremony', label: CTA_CEREMONY_LABEL, line: CTA_CEREMONY_LINE,
    });
  });
});

describe('nøkkeloppslag, ikke ÉN plass (PRODUCT.md v4)', () => {
  it('aktivitet fram og tilbake: seremonien spilles ikke på nytt for et svar appen allerede holder', () => {
    const memory = createResultKeyMemory();

    // 1. utelek beregnes → slotten holder K_UTELEK.
    rememberResultKey(memory, SCOPE, K_UTELEK);
    expect(planCta(K_UTELEK, K_UTELEK, memory, SCOPE).path).toBe('reveal');

    // 2. bytt til vogn: ukjent utfall → seremoni, og scan-cache-store
    //    OVERSKRIVER den ene slotten med K_VOGN.
    expect(planCta(K_VOGN, K_UTELEK, memory, SCOPE).path).toBe('ceremony');
    rememberResultKey(memory, SCOPE, K_VOGN);

    // FORUTSETNING — «én plass»-oppførselen: uten nøkkelminnet ville et bytte
    // tilbake til utelek nå ha spilt hele seremonien på nytt.
    expect(planCta(K_UTELEK, K_VOGN, createResultKeyMemory(), SCOPE).path).toBe('ceremony');

    // 3. …men med nøkkeloppslaget kjenner appen fortsatt sitt eget svar.
    expect(planCta(K_UTELEK, K_VOGN, memory, SCOPE).path).toBe('reveal');
    expect(planCta(K_VOGN, K_VOGN, memory, SCOPE).path).toBe('reveal');
  });

  it('minnet er scopet til barn og dag — et annet barn eller en ny dag arver ikke svaret', () => {
    const memory = createResultKeyMemory();
    rememberResultKey(memory, SCOPE, K_UTELEK);
    expect(knowsResultKey(memory, SCOPE, K_UTELEK)).toBe(true);
    expect(knowsResultKey(memory, resultKeyScope('barn-2', '2026-08-03'), K_UTELEK)).toBe(false);
    expect(knowsResultKey(memory, resultKeyScope('barn-1', '2026-08-04'), K_UTELEK)).toBe(false);
  });

  it('rememberResultKey akkumulerer i samme scope i stedet for å erstatte', () => {
    const memory = createResultKeyMemory();
    rememberResultKey(memory, SCOPE, K_UTELEK);
    rememberResultKey(memory, SCOPE, K_VOGN);
    rememberResultKey(memory, SCOPE, K_UTELEK); // idempotent
    expect(memory.get(SCOPE)?.size).toBe(2);
  });
});

describe('planRecalc — eksplisitt «Beregn på nytt» spiller full seremoni', () => {
  it('vær-basis: full 3,2 s-koreografi', () => {
    expect(planRecalc('weather-basis')).toEqual({ durationMs: FULL_SCAN_DURATION_MS, ceremony: true });
  });

  it('mislykket omberegning: full 3,2 s-koreografi', () => {
    expect(planRecalc('recalc-failed')).toEqual({ durationMs: FULL_SCAN_DURATION_MS, ceremony: true });
  });

  it('identitets-endring (inline justering, «Se antrekk for vogn») beholder 220 ms', () => {
    expect(planRecalc('identity-changed')).toEqual({ durationMs: QUICK_RECALC_DURATION_MS, ceremony: false });
  });

  it('FORUTSETNING: de to veiene har faktisk ulik lengde — ellers måler testen ingenting', () => {
    expect(FULL_SCAN_DURATION_MS).toBeGreaterThan(QUICK_RECALC_DURATION_MS);
  });
});

describe('tekstkontrakten', () => {
  it('etikettene er eierens ordrett vedtatte, ikke omskrivninger', () => {
    expect(CTA_CEREMONY_LABEL).toBe('Finn dagens antrekk');
    expect(CTA_REVEAL_LABEL).toBe('Vis dagens antrekk');
  });

  it('linjene er forskjellige — de skal fortelle sannheten om hvilken vei du er på', () => {
    expect(CTA_REVEAL_LINE).not.toBe(CTA_CEREMONY_LINE);
  });

  it('ingen motorspråk: «analysert» er forbudt (art bible, fullføringsmarkøren)', () => {
    for (const tekst of [CTA_CEREMONY_LABEL, CTA_REVEAL_LABEL, CTA_CEREMONY_LINE, CTA_REVEAL_LINE]) {
      expect(tekst.toLowerCase()).not.toContain('analyser');
    }
  });

  it('linjene holder seg under PRODUCT.md sin 120-tegns notat-grense', () => {
    expect(CTA_CEREMONY_LINE.length).toBeLessThan(120);
    expect(CTA_REVEAL_LINE.length).toBeLessThan(120);
  });
});
