/**
 * T9A — §5-cachematrisen (aapningskontrakt-2026-08-01 §5) som faktisk
 * tilstandsmaskin i vær-laget + §6 resume ≠ ny prosess:
 *
 *  - FERSK: vis umiddelbart (synkron bootstrap-hydrering), ingen spinner.
 *  - GAMMEL: vis sist-kjente umiddelbart + fetchedAt for «Sist oppdatert …»,
 *    revalider i bakgrunnen, stille oppdatering (reduceren wiper aldri
 *    samme fetchKey).
 *  - INGEN: missing + reservert-geometri-forløp («Henter vær …», CTA av).
 *  - FEIL: strukturen beholdes, sist-kjente data + retry.
 *
 * Motorvern (releasekrav): GAMMEL/FEIL-data blir ALDRI motor-input — `now`
 * forblir null; kun lastKnownNow (visning) settes.
 */
import { describe, expect, it } from 'vitest';
import {
  bootstrapWeatherRequestState,
  createInitialWeatherRequestState,
  readPersistentForecastCache,
  reduceWeatherRequestState,
  weatherStateFromForecastResult,
  WEATHER_FRESH_MS,
  WEATHER_STALE_MS,
} from '../useWeather';
import type {
  ForecastFetchMetadata,
  ForecastFetchResult,
  MetForecast,
} from '../../lib/met-no/types';

const OFFICIAL_UNITS = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

const NOW = Date.parse('2026-02-12T08:30:00.000Z');

function forecast(tempC: number): MetForecast {
  return {
    properties: {
      meta: { updated_at: '2026-02-12T08:12:00.000Z', units: { ...OFFICIAL_UNITS } },
      timeseries: [{
        time: '2026-02-12T08:00:00.000Z',
        data: {
          instant: {
            details: {
              air_temperature: tempC,
              wind_speed: 2,
              wind_from_direction: 180,
              relative_humidity: 70,
              cloud_area_fraction: 40,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'cloudy' },
            details: { precipitation_amount: 0 },
          },
        },
      }],
    },
  };
}

function metadata(overrides: Partial<ForecastFetchMetadata> = {}): ForecastFetchMetadata {
  return {
    source: 'network',
    sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
    fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
    evaluatedAt: Date.parse('2026-02-12T08:15:00.000Z'),
    cacheStatus: 'miss',
    stale: false,
    ...overrides,
  };
}

function result(tempC: number, evidence = metadata()): ForecastFetchResult {
  return { forecast: forecast(tempC), metadata: evidence };
}

function storageWith(entry: unknown): Pick<Storage, 'getItem'> {
  return {
    getItem: (key: string) => (key === 'metno:61.00,8.00' ? JSON.stringify(entry) : null),
  };
}

describe('weather freshness state machine (T9A, §5-cachematrisen)', () => {
  it('FERSK: nettverksresultat gir freshness=fresh med fetchedAt + sist-kjente for visning', () => {
    const state = weatherStateFromForecastResult(result(-3), 12);
    expect(state.status).toBe('ready');
    expect(state.freshness).toEqual({
      kind: 'fresh',
      fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
      revalidating: false,
    });
    expect(state.lastKnownNow?.tempC).toBe(-3);
    expect(state.lastKnownAt).toBe(Date.parse('2026-02-12T08:15:00.000Z'));
  });

  it('GAMMEL: stale cache-resultat eksponerer sist-kjente KUN for visning, aldri motor-input', () => {
    const stale = result(-3, metadata({ source: 'cache', cacheStatus: 'stale', stale: true }));
    const state = weatherStateFromForecastResult(stale, 12);
    expect(state.status).toBe('offline');
    // Motorvern: motor-inngangene forblir tomme (uendret motoroutput).
    expect(state.now).toBeNull();
    expect(state.hourly).toEqual([]);
    // Visningen har sist-kjente data + tidsstempel for en sann friskhetslinje.
    expect(state.freshness.kind).toBe('stale');
    expect(state.lastKnownNow?.tempC).toBe(-3);
    expect(state.lastKnownAt).toBe(stale.metadata.fetchedAt);
  });

  it('INGEN: tom starttilstand er missing med henting i gang', () => {
    const state = createInitialWeatherRequestState('61,8,12').weather;
    expect(state.status).toBe('loading');
    expect(state.freshness).toEqual({ kind: 'missing', revalidating: true });
    expect(state.lastKnownNow).toBeNull();
  });

  it('FEIL: avvist foresporsel beholder strukturen + sist-kjente data og gir error-freshness', () => {
    let state = createInitialWeatherRequestState('61,8,12');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: '61,8,12' });
    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 1, fetchKey: '61,8,12', result: result(-3), refHour: 12,
    });
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: '61,8,12' });
    state = reduceWeatherRequestState(state, {
      type: 'rejected', requestId: 2, fetchKey: '61,8,12', error: new Error('nettet borte'),
    });
    expect(state.weather.status).toBe('error');
    expect(state.weather.error).toBe('nettet borte');
    // Strukturen beholdt: dataene fra forrige suksess star fortsatt.
    expect(state.weather.now?.tempC).toBe(-3);
    expect(state.weather.lastKnownNow?.tempC).toBe(-3);
    expect(state.weather.freshness).toEqual({
      kind: 'error',
      lastFetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
      revalidating: false,
    });
  });

  it('resume/revalidering (§6): ny foresporsel for SAMME fetchKey wiper aldri synlige data', () => {
    let state = createInitialWeatherRequestState('61,8,12');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: '61,8,12' });
    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 1, fetchKey: '61,8,12', result: result(-3), refHour: 12,
    });
    // Resume/retry: samme nokkel - dataene skal sta mens revalideringen gar.
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: '61,8,12' });
    expect(state.weather.status).toBe('ready');
    expect(state.weather.now?.tempC).toBe(-3);
    expect(state.weather.freshness).toMatchObject({ kind: 'fresh', revalidating: true });
    // Nye data lander stille (ingen mellomliggende tom tilstand).
    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 2, fetchKey: '61,8,12', result: result(1), refHour: 12,
    });
    expect(state.weather.now?.tempC).toBe(1);
    expect(state.weather.freshness).toMatchObject({ kind: 'fresh', revalidating: false });
  });

  it('nytt fetchKey (annet sted) wiper fortsatt - feil steds vaer vises aldri', () => {
    let state = createInitialWeatherRequestState('old');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: 'old' });
    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 1, fetchKey: 'old', result: result(-3), refHour: 12,
    });
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: 'new' });
    expect(state.weather.status).toBe('loading');
    expect(state.weather.now).toBeNull();
    expect(state.weather.freshness).toEqual({ kind: 'missing', revalidating: true });
  });
});

describe('persistent cache bootstrap (T9A kaldstart: cachet Hjem umiddelbart)', () => {
  it('leser met-no-klientens persistente cache-format og aksepterer gyldig alder', () => {
    const fetchedAt = NOW - 10 * 60 * 1000;
    const hit = readPersistentForecastCache(
      61, 8, NOW,
      storageWith({ version: 1, fetchedAt, data: forecast(-3) }),
    );
    expect(hit).not.toBeNull();
    expect(hit?.fetchedAt).toBe(fetchedAt);
    expect(hit?.ageMs).toBe(10 * 60 * 1000);
  });

  it('avviser fremtidige, for gamle og korrupte cache-oppforinger trygt', () => {
    expect(readPersistentForecastCache(61, 8, NOW, storageWith({
      fetchedAt: NOW + 60_000, data: forecast(-3),
    }))).toBeNull();
    expect(readPersistentForecastCache(61, 8, NOW, storageWith({
      fetchedAt: NOW - WEATHER_STALE_MS - 1, data: forecast(-3),
    }))).toBeNull();
    expect(readPersistentForecastCache(61, 8, NOW, storageWith({ hei: 'korrupt' }))).toBeNull();
    expect(readPersistentForecastCache(61, 8, NOW, {
      getItem: () => 'ikke json i det hele tatt',
    })).toBeNull();
    expect(readPersistentForecastCache(61, 8, NOW, null)).toBeNull();
  });

  it('FERSK cache hydreres synkront til ready pa forste render - ingen spinner-frame', () => {
    const fetchedAt = NOW - 10 * 60 * 1000;
    const state = bootstrapWeatherRequestState(
      'key', 61, 8, 12, 'persistent', NOW,
      storageWith({ version: 1, fetchedAt, data: forecast(-3) }),
    );
    expect(state.weather.status).toBe('ready');
    expect(state.weather.now?.tempC).toBe(-3);
    expect(state.weather.freshness).toMatchObject({ kind: 'fresh', fetchedAt });
  });

  it('GAMMEL cache hydreres til visnings-tilstand (offline + sist-kjente), aldri motor-input', () => {
    const fetchedAt = NOW - (WEATHER_FRESH_MS + 30 * 60 * 1000);
    const state = bootstrapWeatherRequestState(
      'key', 61, 8, 12, 'persistent', NOW,
      storageWith({ version: 1, fetchedAt, data: forecast(-3) }),
    );
    expect(state.weather.status).toBe('offline');
    expect(state.weather.now).toBeNull();
    expect(state.weather.lastKnownNow?.tempC).toBe(-3);
    expect(state.weather.freshness).toMatchObject({ kind: 'stale', fetchedAt });
  });

  it('INGEN cache og memory-only-scope (automatisk posisjon) gir vanlig lasteforlop', () => {
    const missing = bootstrapWeatherRequestState('key', 61, 8, 12, 'persistent', NOW, {
      getItem: () => null,
    });
    expect(missing.weather.status).toBe('loading');
    expect(missing.weather.freshness.kind).toBe('missing');
    // Personvern: memory-only leser aldri den persistente cachen.
    const fetchedAt = NOW - 10 * 60 * 1000;
    const memoryOnly = bootstrapWeatherRequestState(
      'key', 61, 8, 12, 'memory-only', NOW,
      storageWith({ version: 1, fetchedAt, data: forecast(-3) }),
    );
    expect(memoryOnly.weather.status).toBe('loading');
    expect(memoryOnly.weather.now).toBeNull();
  });
});
