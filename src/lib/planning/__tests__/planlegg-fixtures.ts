/**
 * Wave 0 fixtures for Planlegg/Dagslinjen.
 *
 * Every value is invented and every clock is explicit. Later implementation
 * plans may import these fixtures, but must not turn their pending contracts
 * into evidence until the corresponding production slice exists.
 */

export const PLANLEGG_TIME_ZONE = 'Europe/Oslo' as const;
export const PLANLEGG_CLOCK_ISO = '2026-02-12T08:15:00.000Z' as const;
export const PLANLEGG_DST_SPRING_CLOCK_ISO = '2026-03-29T00:30:00.000Z' as const;
export const PLANLEGG_DST_FALL_FIRST_CLOCK_ISO = '2026-10-25T00:30:00.000Z' as const;
export const PLANLEGG_DST_FALL_SECOND_CLOCK_ISO = '2026-10-25T01:30:00.000Z' as const;

export const PLANLEGG_FORECAST_TTL_MS = 5 * 60 * 1000;
export const PLANLEGG_FORECAST_TTL_BOUNDARY_ISO = '2026-02-12T08:10:00.000Z' as const;
export const PLANLEGG_FORECAST_TTL_PLUS_ONE_ISO = '2026-02-12T08:09:59.999Z' as const;

type ForecastUpdatedAt = string | null | undefined;

type PlanningForecastFixture = Readonly<{
  id: string;
  source: 'network' | 'cache';
  receivedAt: string;
  updatedAt: ForecastUpdatedAt;
  points: readonly Readonly<{
    time: string;
    tempC: number;
    feelsLikeC: number;
    windMs: number;
    precipMmH: number;
    symbolCode: string;
  }>[];
}>;

const forecastPoints = Object.freeze([
  Object.freeze({
    time: '2026-02-12T08:00:00.000Z',
    tempC: -3,
    feelsLikeC: -7,
    windMs: 4.2,
    precipMmH: 0,
    symbolCode: 'partlycloudy_day',
  }),
  Object.freeze({
    time: '2026-02-12T11:00:00.000Z',
    tempC: 1,
    feelsLikeC: -2,
    windMs: 3.1,
    precipMmH: 0.4,
    symbolCode: 'lightsnow',
  }),
] as const);

const forecast = (
  id: string,
  source: PlanningForecastFixture['source'],
  receivedAt: string,
  updatedAt: ForecastUpdatedAt,
): PlanningForecastFixture => Object.freeze({ id, source, receivedAt, updatedAt, points: forecastPoints });

export const planningForecastFixture = Object.freeze({
  fresh: forecast('forecast-fresh', 'network', PLANLEGG_CLOCK_ISO, '2026-02-12T08:12:00.000Z'),
  cachedAtTtl: forecast(
    'forecast-cached-at-ttl',
    'cache',
    PLANLEGG_FORECAST_TTL_BOUNDARY_ISO,
    '2026-02-12T08:08:00.000Z',
  ),
  staleAtTtlPlusOne: forecast(
    'forecast-stale-at-ttl-plus-one',
    'cache',
    PLANLEGG_FORECAST_TTL_PLUS_ONE_ISO,
    '2026-02-12T08:07:00.000Z',
  ),
  missingUpdatedAt: forecast('forecast-missing-updated-at', 'network', PLANLEGG_CLOCK_ISO, undefined),
  nullUpdatedAt: forecast('forecast-null-updated-at', 'network', PLANLEGG_CLOCK_ISO, null),
  invalidUpdatedAt: forecast('forecast-invalid-updated-at', 'network', PLANLEGG_CLOCK_ISO, 'ikke-en-dato'),
});

export const planningChildFixture = Object.freeze({
  id: 'testbarn-planlegg-01',
  name: 'Testbarn Åse-Øivind med et svært langt, oppdiktet navn',
  dob: '2025-08-17',
  city: 'Prøvestedet ved Åsen – kun syntetiske data',
  lat: 61.2345,
  lon: 8.7654,
  materialPreference: 'best_for_conditions',
});

export const planningLocationFixture = Object.freeze({
  label: 'Fast testhjem · Øvre Prøvegrend med ekstra lang Unicode-tekst',
  latitude: 61.2345,
  longitude: 8.7654,
  source: 'configured-place' as const,
});

export const planningFinalizedRecommendationFixture = Object.freeze({
  id: 'finalized-recommendation-01',
  fingerprint: 'synthetic:base-mid-outer',
  orderedGarments: Object.freeze(['Ullbody', 'Mellomlag', 'Vinterdress']),
  equipment: Object.freeze(['Vognpose']),
  finalized: true as const,
});

export const planningAccessFixture = Object.freeze({
  free: Object.freeze({ status: 'resolved' as const, tier: 'free' as const }),
  plus: Object.freeze({ status: 'resolved' as const, tier: 'plus' as const }),
  loading: Object.freeze({ status: 'loading' as const, tier: null }),
});

export const planningSnartFixture = Object.freeze({
  approvedRulesGate: 'pending_approval' as const,
  approvedRuleIds: Object.freeze([] as string[]),
  states: Object.freeze({
    ready: Object.freeze({ status: 'ready' as const, groups: Object.freeze([] as string[]) }),
    empty: Object.freeze({ status: 'empty' as const, groups: Object.freeze([] as string[]) }),
    unavailable: Object.freeze({ status: 'unavailable' as const, groups: Object.freeze([] as string[]) }),
  }),
});
