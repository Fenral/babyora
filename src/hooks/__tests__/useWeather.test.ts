import { describe, expect, it, vi } from 'vitest';
import {
  createInitialWeatherRequestState,
  reduceWeatherRequestState,
  weatherStateFromForecastResult,
} from '../useWeather';
import type { ForecastFetchMetadata, ForecastFetchResult, MetForecast } from '../../lib/met-no/types';

const metadata = (overrides: Partial<ForecastFetchMetadata> = {}): ForecastFetchMetadata => ({
  source: 'network',
  sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
  fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
  cacheStatus: 'miss',
  stale: false,
  ...overrides,
});

const forecast = (tempC: number): MetForecast => ({
  properties: {
    meta: { updated_at: '2026-02-12T08:12:00.000Z', units: {} },
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

const result = (tempC: number, evidence = metadata()): ForecastFetchResult => ({
  forecast: forecast(tempC),
  metadata: evidence,
});

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

    expect(extractors.now).toHaveBeenCalledWith(resolved.forecast);
    expect(extractors.hourly).toHaveBeenCalledWith(resolved.forecast, 48);
    expect(extractors.daily).toHaveBeenCalledWith(resolved.forecast, 10);
    expect(extractors.dailyAtHour).toHaveBeenCalledWith(resolved.forecast, 12, 10);
    expect(extractors.now).not.toHaveBeenCalledWith(resolved);
    expect(state.forecast).toBe(resolved.forecast);
    expect(state.evidence?.metadata).toBe(resolved.metadata);
  });
});

describe('weather request lifecycle', () => {
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

  it('keeps the newer fetch key when promises resolve in reverse order', () => {
    let state = createInitialWeatherRequestState('old');
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 1, fetchKey: 'old' });
    state = reduceWeatherRequestState(state, { type: 'started', requestId: 2, fetchKey: 'new' });
    const newer = result(6, metadata({ sourceUpdatedAt: '2026-02-12T08:45:00.000Z' }));
    const older = result(-8, metadata({ sourceUpdatedAt: '2026-02-12T07:45:00.000Z' }));

    state = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 2, fetchKey: 'new', result: newer, refHour: 12,
    });
    const afterOlder = reduceWeatherRequestState(state, {
      type: 'resolved', requestId: 1, fetchKey: 'old', result: older, refHour: 12,
    });

    expect(afterOlder).toBe(state);
    expect(afterOlder.weather.now?.tempC).toBe(6);
    expect(afterOlder.weather.evidence?.metadata.sourceUpdatedAt).toBe('2026-02-12T08:45:00.000Z');
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
});
