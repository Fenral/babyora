import { describe, expect, it, vi } from 'vitest';
import {
  createWeatherFetchIdentity,
  createInitialWeatherRequestState,
  reduceWeatherRequestState,
  selectWeatherForFetchKey,
  startWeatherRequest,
  weatherStateFromForecastResult,
} from '../useWeather';
import type {
  ForecastFetchMetadata,
  ForecastFetchResult,
  MetForecast,
  MetTimePoint,
} from '../../lib/met-no/types';

const OFFICIAL_UNITS = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

const metadata = (overrides: Partial<ForecastFetchMetadata> = {}): ForecastFetchMetadata => ({
  source: 'network',
  sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
  fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
  evaluatedAt: Date.parse('2026-02-12T08:15:00.000Z'),
  cacheStatus: 'miss',
  stale: false,
  ...overrides,
});

const forecast = (tempC: number): MetForecast => ({
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
});

const compactShapedForecast = (): MetForecast => {
  const start = Date.parse('2026-02-12T08:00:00.000Z');
  const points = Array.from({ length: 87 }, (_, index): MetTimePoint => ({
    time: new Date(start + index * 60 * 60 * 1000).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: -3 + (index % 4),
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
  }));
  delete points.at(-1)!.data.next_1_hours;
  return {
    properties: {
      meta: { updated_at: '2026-02-12T08:12:00.000Z', units: { ...OFFICIAL_UNITS } },
      timeseries: points,
    },
  };
};

const result = (tempC: number, evidence = metadata()): ForecastFetchResult => ({
  forecast: forecast(tempC),
  metadata: evidence,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}

describe('weather result unwrap', () => {
  it('passes only result.forecast to every weather extractor', () => {
    const resolved = result(-3);
    const extractors = {
      now: vi.fn(() => ({
        tempC: -3,
        feelsLikeC: -5,
        windMs: 2,
        windDir: 180,
        precipMmH: 0,
        symbolCode: 'cloudy',
        observedAt: new Date('2026-02-12T08:00:00.000Z'),
      })),
      hourly: vi.fn(() => []),
      daily: vi.fn(() => []),
      dailyAtHour: vi.fn(() => []),
    };

    const state = weatherStateFromForecastResult(resolved, 12, extractors);

    expect(extractors.now).toHaveBeenCalledWith(
      resolved.forecast,
      resolved.metadata.evaluatedAt,
    );
    expect(extractors.hourly).toHaveBeenCalledWith(resolved.forecast, 48);
    expect(extractors.daily).toHaveBeenCalledWith(resolved.forecast, 10);
    expect(extractors.dailyAtHour).toHaveBeenCalledWith(resolved.forecast, 12, 10);
    expect(extractors.now).not.toHaveBeenCalledWith(resolved);
    expect(state.forecast).toBe(resolved.forecast);
    expect(state.evidence?.metadata).toBe(resolved.metadata);
    expect(state.attribution).toBe('V\u00e6r fra met.no');
  });

  it('contains stale evidence in an explicit offline state without legacy weather inputs', () => {
    const stale = result(-3, metadata({
      source: 'cache', cacheStatus: 'stale', stale: true,
    }));

    const state = weatherStateFromForecastResult(stale, 12);

    expect(state.status).toBe('offline');
    expect(state.now).toBeNull();
    expect(state.hourly).toEqual([]);
    expect(state.daily).toEqual([]);
    expect(state.dailyAtHour).toEqual([]);
    expect(state.forecast).toBeNull();
    expect(state.offlineForecast).toBe(stale.forecast);
    expect(state.evidence?.metadata.stale).toBe(true);
  });

  it.each([undefined, 'ikke-en-dato'])(
    'contains missing or invalid updated_at %j without publishing current legacy weather',
    (updatedAt) => {
      const uncurrent = result(-3, metadata({ sourceUpdatedAt: null }));
      uncurrent.forecast.properties.meta.updated_at = updatedAt as string;

      const state = weatherStateFromForecastResult(uncurrent, 12);

      expect(state.status).toBe('offline');
      expect(state.now).toBeNull();
      expect(state.hourly).toEqual([]);
      expect(state.daily).toEqual([]);
      expect(state.dailyAtHour).toEqual([]);
      expect(state.forecast).toBeNull();
      expect(state.offlineForecast).toBe(uncurrent.forecast);
      expect(state.evidence?.metadata.sourceUpdatedAt).toBeNull();
      expect(state.evidence?.coverage.status).toBe('unavailable');
    },
  );

  it('accepts a terminal instant-only point but excludes it from extraction and coverage', () => {
    const data = compactShapedForecast();
    const resolved: ForecastFetchResult = { forecast: data, metadata: metadata() };

    const state = weatherStateFromForecastResult(resolved, 12);

    expect(state.status).toBe('ready');
    expect(state.forecast?.properties.timeseries).toHaveLength(87);
    expect(state.hourly).toHaveLength(48);
    expect(state.evidence?.coverage.points).toHaveLength(86);
    expect(state.evidence?.coverage.endIso).toBe(data.properties.timeseries[85]!.time);
  });

  it('fails closed when consumed-field units are missing or incompatible', () => {
    const invalid = result(-3);
    invalid.forecast.properties.meta.units.wind_speed = 'km/h';

    const state = weatherStateFromForecastResult(invalid, 12);

    expect(state).toMatchObject({
      status: 'error',
      now: null,
      forecast: null,
      offlineForecast: null,
      evidence: null,
    });
    expect(state.hourly).toEqual([]);
  });
});

describe('weather request lifecycle', () => {
  it('includes location source and cache scope in the fetch identity', () => {
    expect(createWeatherFetchIdentity(61, 8, 12)).toEqual({
      fetchKey: 'configured-place:persistent:61,8,12',
      cacheScope: 'persistent',
      source: 'configured-place',
    });
    expect(createWeatherFetchIdentity(61, 8, 12, {
      cacheScope: 'memory-only',
      source: 'automatic',
    })).toEqual({
      fetchKey: 'automatic:memory-only:61,8,12',
      cacheScope: 'memory-only',
      source: 'automatic',
    });
  });

  it('keeps persistent and automatic requests distinct for identical coordinates', async () => {
    const persistent = createWeatherFetchIdentity(61, 8, 12, {
      cacheScope: 'persistent',
      source: 'fixed-home',
    });
    const automatic = createWeatherFetchIdentity(61, 8, 12, {
      cacheScope: 'memory-only',
      source: 'automatic',
    });
    let state = createInitialWeatherRequestState(persistent.fetchKey);
    const oldRequest = deferred<ForecastFetchResult>();
    const newRequest = deferred<ForecastFetchResult>();
    const publish = async (
      promise: Promise<ForecastFetchResult>,
      requestId: number,
      fetchKey: string,
    ) => {
      const resolved = await promise;
      state = reduceWeatherRequestState(state, {
        type: 'resolved', requestId, fetchKey, result: resolved, refHour: 12,
      });
    };

    state = reduceWeatherRequestState(state, {
      type: 'started', requestId: 1, fetchKey: persistent.fetchKey,
    });
    const oldPublish = publish(oldRequest.promise, 1, persistent.fetchKey);
    state = reduceWeatherRequestState(state, {
      type: 'started', requestId: 2, fetchKey: automatic.fetchKey,
    });
    const newPublish = publish(newRequest.promise, 2, automatic.fetchKey);

    newRequest.resolve(result(6));
    await newPublish;
    oldRequest.resolve(result(-8));
    await oldPublish;

    expect(persistent.fetchKey).not.toBe(automatic.fetchKey);
    expect(state.activeFetchKey).toBe(automatic.fetchKey);
    expect(state.weather.now?.tempC).toBe(6);
  });

  it('publishes weather and matching evidence in one accepted resolution', () => {
    const started = reduceWeatherRequestState(
      createInitialWeatherRequestState('61,8,12'),
      { type: 'started', requestId: 1, fetchKey: '61,8,12' },
    );
    const resolved = result(-3, metadata({ source: 'cache', cacheStatus: 'fresh' }));
    const next = reduceWeatherRequestState(started, {
      type: 'resolved',
      requestId: 1,
      fetchKey: '61,8,12',
      result: resolved,
      refHour: 12,
    });

    expect(next.weather).toMatchObject({
      status: 'ready',
      now: { tempC: -3 },
      forecast: resolved.forecast,
      evidence: { metadata: resolved.metadata },
      error: null,
    });
  });

  it('keeps the newer fetch key when promises deliberately resolve in reverse order', async () => {
    let state = createInitialWeatherRequestState('old');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: 'old' });
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: 'new' });
    const newer = result(6, metadata({ sourceUpdatedAt: '2026-02-12T08:45:00.000Z' }));
    const older = result(-8, metadata({ sourceUpdatedAt: '2026-02-12T07:45:00.000Z' }));
    const deferred = () => {
      let resolve!: (value: ForecastFetchResult) => void;
      const promise = new Promise<ForecastFetchResult>((accept) => { resolve = accept; });
      return { promise, resolve };
    };
    const oldRequest = deferred();
    const newRequest = deferred();
    const publish = async (promise: Promise<ForecastFetchResult>, requestId: number, fetchKey: string) => {
      const resolved = await promise;
      state = reduceWeatherRequestState(state, {
        type: 'resolved', requestId, fetchKey, result: resolved, refHour: 12,
      });
    };
    const oldPublish = publish(oldRequest.promise, 1, 'old');
    const newPublish = publish(newRequest.promise, 2, 'new');

    newRequest.resolve(newer);
    await newPublish;
    const acceptedNewState = state;
    oldRequest.resolve(older);
    await oldPublish;

    expect(state).toBe(acceptedNewState);
    expect(state.weather.now?.tempC).toBe(6);
    expect(state.weather.evidence?.metadata.sourceUpdatedAt).toBe('2026-02-12T08:45:00.000Z');
  });

  it('ignores rejected or cancelled older requests after a newer start', () => {
    let state = createInitialWeatherRequestState('old');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: 'old' });
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: 'new' });

    const afterOldReject = reduceWeatherRequestState(state, {
      type: 'rejected', requestId: 1, fetchKey: 'old', error: new Error('old failed'),
    });

    expect(afterOldReject).toBe(state);
    expect(afterOldReject.weather.status).toBe('loading');
    expect(afterOldReject.weather.error).toBeNull();
  });

  it('fails closed on a rerender with a new key before the next effect starts', () => {
    let state = createInitialWeatherRequestState('old');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: 'old' });
    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 1, fetchKey: 'old', result: result(-8), refHour: 12,
    });
    expect(state.weather.now?.tempC).toBe(-8);

    const rendered = selectWeatherForFetchKey(state, 'new');

    expect(rendered).toMatchObject({
      status: 'loading',
      now: null,
      forecast: null,
      offlineForecast: null,
      evidence: null,
    });
    expect(rendered.hourly).toEqual([]);
  });

  it('executes the real lifecycle cleanup and suppresses resolution dispatch', async () => {
    const pending = deferred<ForecastFetchResult>();
    const dispatch = vi.fn();
    const lifecycle = startWeatherRequest({
      requestId: 7,
      fetchKey: '61,8,12',
      refHour: 12,
      load: () => pending.promise,
      dispatch,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'started', requestId: 7, fetchKey: '61,8,12',
    });

    lifecycle.cancel();
    pending.resolve(result(-3));
    await lifecycle.settled;

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
