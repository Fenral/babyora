import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractDailyAtHour, extractHourly, extractNow, fetchForecast } from '../client';
import type { MetForecast, MetTimePoint } from '../types';

const OFFICIAL_UNITS = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

/** Bygg et timeseries-punkt på LOKAL tid (så getHours() blir deterministisk
 *  uavhengig av test-TZ — new Date(y,m,d,h) tolkes lokalt). */
function point(
  y: number, m: number, d: number, h: number,
  tempC: number, windMs: number, symbol = 'cloudy',
): MetTimePoint {
  return {
    time: new Date(y, m, d, h, 0, 0).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: tempC,
          wind_speed: windMs,
          wind_from_direction: 0,
          relative_humidity: 70,
          cloud_area_fraction: 50,
        },
      },
      next_1_hours: { summary: { symbol_code: symbol }, details: { precipitation_amount: 0 } },
    },
  };
}

function utcPoint(
  time: string,
  tempC: number,
  symbol = 'cloudy',
): MetTimePoint {
  const value = point(2026, 1, 12, 9, tempC, 2, symbol);
  value.time = time;
  return value;
}

function forecast(points: MetTimePoint[]): MetForecast {
  return {
    properties: {
      meta: { updated_at: '2026-02-12T08:12:00.000Z', units: { ...OFFICIAL_UNITS } },
      timeseries: points,
    },
  };
}

function compactShapedForecast(): MetForecast {
  const start = Date.parse('2026-02-12T08:00:00.000Z');
  const points = Array.from({ length: 87 }, (_, index): MetTimePoint => ({
    ...point(2026, 1, 12, 8, -3 + (index % 4), 4.2, 'partlycloudy_day'),
    time: new Date(start + index * 60 * 60 * 1000).toISOString(),
  }));
  delete points.at(-1)!.data.next_1_hours;
  return forecast(points);
}

const NOW_ISO = '2026-02-12T09:00:00.000Z';
const NOW_MS = Date.parse(NOW_ISO);
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_STALE_AGE_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = 'metno:61.23,8.77';

function validForecast(...updatedAt: [unknown?]): MetForecast {
  const value = forecast([point(2026, 1, 12, 9, -3, 4.2, 'partlycloudy_day')]);
  value.properties.meta.updated_at = (updatedAt.length === 0
    ? '2026-02-12T08:12:00.000Z'
    : updatedAt[0]) as string;
  return value;
}

function response(data: unknown, ok = true, status = 200): Response {
  return { ok, status, json: vi.fn().mockResolvedValue(data) } as unknown as Response;
}

function installStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  } satisfies Storage;
  vi.stubGlobal('localStorage', storage);
  return { storage, values };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

describe('fetchForecast provenance and cache recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns explicit network provenance and writes a versioned envelope under the existing key', async () => {
    const data = validForecast();
    const { storage, values } = installStorage();
    const fetchMock = vi.fn().mockResolvedValue(response(data));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toEqual({
      forecast: data,
      metadata: {
        source: 'network',
        sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
        fetchedAt: NOW_MS,
        evaluatedAt: NOW_MS,
        cacheStatus: 'miss',
        stale: false,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/forecast?lat=61.2345&lon=8.7654',
      { headers: { Accept: 'application/json' } },
    );
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(CACHE_KEY) ?? '')).toEqual({
      version: 1,
      fetchedAt: NOW_MS,
      data,
    });
  });

  it.each([
    ['versioned', (fetchedAt: number, data: MetForecast) => ({ version: 1, fetchedAt, data })],
    ['legacy', (fetchedAt: number, data: MetForecast) => ({ fetchedAt, data })],
  ])('reads a valid %s cache entry at the exact TTL boundary', async (_kind, envelope) => {
    const data = validForecast();
    installStorage({ [CACHE_KEY]: JSON.stringify(envelope(NOW_MS - CACHE_TTL_MS, data)) });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toEqual({
      forecast: data,
      metadata: {
        source: 'cache',
        sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
        fetchedAt: NOW_MS - CACHE_TTL_MS,
        evaluatedAt: NOW_MS,
        cacheStatus: 'fresh',
        stale: false,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('classifies TTL plus one millisecond as stale and uses it only after network failure', async () => {
    const data = validForecast();
    const fetchedAt = NOW_MS - CACHE_TTL_MS - 1;
    installStorage({
      [CACHE_KEY]: JSON.stringify({ version: 1, fetchedAt, data }),
    });
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toEqual({
      forecast: data,
      metadata: {
        source: 'cache',
        sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
        fetchedAt,
        evaluatedAt: NOW_MS,
        cacheStatus: 'stale',
        stale: true,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('prefers a valid network response over a valid stale candidate', async () => {
    const stale = validForecast('2026-02-12T07:00:00.000Z');
    const network = validForecast('2026-02-12T08:45:00.000Z');
    installStorage({
      [CACHE_KEY]: JSON.stringify({
        version: 1,
        fetchedAt: NOW_MS - CACHE_TTL_MS - 1,
        data: stale,
      }),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(network)));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: network,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
  });

  it.each([
    ['corrupt JSON', '{'],
    ['missing envelope fields', JSON.stringify({ version: 1 })],
    ['non-finite fetchedAt', JSON.stringify({ version: 1, fetchedAt: 'NaN', data: validForecast() })],
    ['future fetchedAt', JSON.stringify({ version: 1, fetchedAt: NOW_MS + 1, data: validForecast() })],
    ['invalid forecast shape', JSON.stringify({ version: 1, fetchedAt: NOW_MS, data: { properties: {} } })],
  ])('ignores %s cache data and returns validated network evidence', async (_kind, raw) => {
    const network = validForecast();
    const { storage } = installStorage({ [CACHE_KEY]: raw });
    const fetchMock = vi.fn().mockResolvedValue(response(network));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: network,
      metadata: { source: 'network', stale: false },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledWith(CACHE_KEY);
  });

  it('evicts an empty-string cache value before surfacing a network failure', async () => {
    const { storage } = installStorage({ [CACHE_KEY]: '' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('offline');
    expect(storage.removeItem).toHaveBeenCalledWith(CACHE_KEY);
  });

  it.each([undefined, null, '', '   ', 'ikke-en-dato', '2026-02-30T08:12:00.000Z'])(
    'maps absent, blank or malformed updated_at %j to null',
    async (updatedAt) => {
      const data = validForecast(updatedAt);
      installStorage();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

      await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
        metadata: { sourceUpdatedAt: null },
      });
    },
  );

  it('accepts a live-shaped 87-point envelope and caches its terminal instant-only point', async () => {
    const data = compactShapedForecast();
    const { storage, values } = installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: data,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
    expect(data.properties.timeseries).toHaveLength(87);
    expect(data.properties.timeseries.at(-1)?.data.next_1_hours).toBeUndefined();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(CACHE_KEY) ?? '').data.properties.timeseries).toHaveLength(87);
  });

  it.each([
    ['missing temperature unit', 'air_temperature', undefined],
    ['Fahrenheit temperature', 'air_temperature', 'fahrenheit'],
    ['kilometres-per-hour wind', 'wind_speed', 'km/h'],
    ['inch precipitation', 'precipitation_amount', 'inch'],
    ['radian direction', 'wind_from_direction', 'radians'],
    ['fractional humidity', 'relative_humidity', 'fraction'],
    ['fractional cloud cover', 'cloud_area_fraction', 'fraction'],
  ])('rejects %s before ready state or cache write', async (_case, field, unit) => {
    const data = validForecast();
    if (unit === undefined) delete data.properties.meta.units[field];
    else data.properties.meta.units[field] = unit;
    const { storage } = installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('met.no: ugyldig prognose');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    ['point time', (data: MetForecast) => { data.properties.timeseries[0]!.time = 'not-a-time'; }],
    ['air temperature', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.air_temperature = Number.NaN; }],
    ['wind speed', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.wind_speed = Number.POSITIVE_INFINITY; }],
    ['wind direction', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.wind_from_direction = Number.NaN; }],
    ['humidity', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.relative_humidity = Number.NaN; }],
    ['cloud fraction', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.cloud_area_fraction = Number.NaN; }],
    ['one-hour precipitation', (data: MetForecast) => { data.properties.timeseries[0]!.data.next_1_hours!.details.precipitation_amount = Number.NaN; }],
    ['six-hour precipitation', (data: MetForecast) => {
      data.properties.timeseries[0]!.data.next_6_hours = {
        summary: { symbol_code: 'cloudy' },
        details: { precipitation_amount: Number.NaN },
      };
    }],
  ])('rejects an invalid network forecast with non-finite or malformed %s', async (_field, mutate) => {
    const data = validForecast();
    mutate(data);
    const { storage } = installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('met.no: ugyldig prognose');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not return an invalid stale entry when the network fails', async () => {
    const invalid = validForecast();
    invalid.properties.timeseries[0]!.data.instant.details.air_temperature = Number.NaN;
    installStorage({
      [CACHE_KEY]: JSON.stringify({
        version: 1,
        fetchedAt: NOW_MS - CACHE_TTL_MS - 1,
        data: invalid,
      }),
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('offline');
  });

  it('uses a validated stale entry after an HTTP failure', async () => {
    const data = validForecast();
    installStorage({
      [CACHE_KEY]: JSON.stringify({
        fetchedAt: NOW_MS - CACHE_TTL_MS - 1,
        data,
      }),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false, 503)));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: data,
      metadata: { source: 'cache', cacheStatus: 'stale', stale: true },
    });
  });

  it('evicts cache older than the conservative stale ceiling and never returns it', async () => {
    const data = validForecast('2026-02-12T03:30:00.000Z');
    const { storage } = installStorage({
      [CACHE_KEY]: JSON.stringify({
        version: 1,
        fetchedAt: NOW_MS - MAX_STALE_AGE_MS - 1,
        data,
      }),
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('offline');
    expect(storage.removeItem).toHaveBeenCalledWith(CACHE_KEY);
  });

  it.each([
    ['temperature above range', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.air_temperature = 100; }],
    ['negative wind', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.wind_speed = -0.1; }],
    ['wind direction below range', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.wind_from_direction = -1; }],
    ['humidity above 100', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.relative_humidity = 101; }],
    ['cloud fraction below zero', (data: MetForecast) => { data.properties.timeseries[0]!.data.instant.details.cloud_area_fraction = -1; }],
    ['negative precipitation', (data: MetForecast) => { data.properties.timeseries[0]!.data.next_1_hours!.details.precipitation_amount = -0.1; }],
    ['unknown symbol', (data: MetForecast) => { data.properties.timeseries[0]!.data.next_1_hours!.summary.symbol_code = 'surprise_tornado'; }],
  ])('rejects out-of-range or unknown %s evidence', async (_case, mutate) => {
    const data = validForecast();
    mutate(data);
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('met.no: ugyldig prognose');
  });

  it.each([
    'lightssleetshowersandthunder_day',
    'lightssnowshowersandthunder_polartwilight',
    'heavyrainandthunder',
    'cloudy',
  ])('accepts official MET symbol_code %s', async (symbolCode) => {
    const data = validForecast();
    data.properties.timeseries[0]!.data.next_1_hours!.summary.symbol_code = symbolCode;
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({ forecast: data });
  });

  it.each([
    'lightsleetshowersandthunder_day',
    'lightsnowshowersandthunder_day',
    'clearsky',
    'cloudy_day',
    'heavyrainandthunder_day',
  ])('rejects non-enum MET symbol_code %s', async (symbolCode) => {
    const data = validForecast();
    data.properties.timeseries[0]!.data.next_1_hours!.summary.symbol_code = symbolCode;
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('met.no: ugyldig prognose');
  });

  it.each([
    ['impossible calendar time', ['2026-02-30T08:00:00.000Z']],
    ['duplicate time', ['2026-02-12T08:00:00.000Z', '2026-02-12T08:00:00.000Z']],
    ['reverse time', ['2026-02-12T09:00:00.000Z', '2026-02-12T08:00:00.000Z']],
  ])('rejects %s in the forecast timeline', async (_case, times) => {
    const data = forecast(times.map((time, index) => {
      const item = point(2026, 1, 12, 8 + index, -3, 4.2);
      item.time = time;
      return item;
    }));
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).rejects.toThrow('met.no: ugyldig prognose');
  });

  it.each([
    ['future skew', '2026-02-12T09:05:00.001Z'],
    ['source too old', '2026-02-12T02:59:59.999Z'],
  ])('denies currentness when updated_at exceeds the %s policy', async (_case, updatedAt) => {
    const data = validForecast(updatedAt);
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(data)));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      metadata: { sourceUpdatedAt: null },
    });
  });

  it('evaluates network currentness only after response parsing and validation complete', async () => {
    const sourceAtStart = new Date(NOW_MS - (5 * 60 + 59) * 60 * 1000).toISOString();
    const data = validForecast(sourceAtStart);
    const pending = deferred<Response>();
    installStorage();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));

    const request = fetchForecast(61.2345, 8.7654);
    const acceptedAt = NOW_MS + 2 * 60 * 1000;
    vi.setSystemTime(acceptedAt);
    pending.resolve(response(data));

    await expect(request).resolves.toMatchObject({
      forecast: data,
      metadata: {
        source: 'network',
        sourceUpdatedAt: null,
        fetchedAt: acceptedAt,
        evaluatedAt: acceptedAt,
      },
    });
  });

  it('keeps persistent-cache commit age separate from its read evaluation clock', async () => {
    const evaluatedAt = Date.parse('2026-02-12T10:02:00.000Z');
    const fetchedAt = Date.parse('2026-02-12T09:55:00.000Z');
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    installStorage({
      [CACHE_KEY]: JSON.stringify({ version: 1, fetchedAt, data }),
    });
    vi.stubGlobal('fetch', vi.fn());
    vi.setSystemTime(evaluatedAt);

    const result = await fetchForecast(61.2345, 8.7654);

    expect(result.metadata).toMatchObject({
      source: 'cache',
      cacheStatus: 'fresh',
      fetchedAt,
      evaluatedAt,
    });
    expect(extractNow(result.forecast, result.metadata.evaluatedAt).observedAt.toISOString())
      .toBe('2026-02-12T10:00:00.000Z');
  });

  it('captures cache evaluation after storage retrieval crosses the TTL boundary', async () => {
    const startedAt = Date.parse('2026-02-12T09:59:59.000Z');
    const evaluatedAt = Date.parse('2026-02-12T10:00:01.000Z');
    const fetchedAt = Date.parse('2026-02-12T09:00:00.000Z');
    const data = validForecast();
    const raw = JSON.stringify({ version: 1, fetchedAt, data });
    const { storage } = installStorage({ [CACHE_KEY]: raw });
    storage.getItem.mockImplementation((key: string) => {
      vi.setSystemTime(evaluatedAt);
      return key === CACHE_KEY ? raw : null;
    });
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    vi.setSystemTime(startedAt);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: data,
      metadata: {
        source: 'cache',
        cacheStatus: 'stale',
        stale: true,
        fetchedAt,
        evaluatedAt,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('captures cache evaluation after structural validation crosses source and current intervals', async () => {
    const startedAt = Date.parse('2026-02-12T09:59:59.000Z');
    const evaluatedAt = Date.parse('2026-02-12T10:00:01.000Z');
    const fetchedAt = Date.parse('2026-02-12T09:55:00.000Z');
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    data.properties.meta.updated_at = '2026-02-12T04:00:00.000Z';
    const points = data.properties.timeseries;
    Object.defineProperty(data.properties, 'timeseries', {
      configurable: true,
      get: () => {
        vi.setSystemTime(evaluatedAt);
        return points;
      },
    });
    installStorage({ [CACHE_KEY]: '{}' });
    vi.spyOn(JSON, 'parse').mockImplementationOnce(() => ({
      version: 1,
      fetchedAt,
      data,
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.setSystemTime(startedAt);

    const result = await fetchForecast(61.2345, 8.7654);

    expect(result.metadata).toMatchObject({
      source: 'cache',
      cacheStatus: 'fresh',
      sourceUpdatedAt: null,
      fetchedAt,
      evaluatedAt,
    });
    expect(extractNow(result.forecast, result.metadata.evaluatedAt).observedAt.toISOString())
      .toBe('2026-02-12T10:00:00.000Z');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the newer success atomic when same-key successes resolve in reverse order', async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    const { values } = installStorage();
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise));
    const olderCall = fetchForecast(61.2345, 8.7654);
    const newerCall = fetchForecast(61.2345, 8.7654);
    const newerData = validForecast('2026-02-12T08:50:00.000Z');
    const olderData = validForecast('2026-02-12T08:20:00.000Z');

    newer.resolve(response(newerData));
    await expect(newerCall).resolves.toMatchObject({ forecast: newerData });
    older.resolve(response(olderData));
    await expect(olderCall).resolves.toMatchObject({ forecast: newerData });
    expect(JSON.parse(values.get(CACHE_KEY) ?? '').data).toEqual(newerData);
  });

  it('re-reads newer fresh cache before an older same-key failure can fall back', async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    installStorage();
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise));
    const olderCall = fetchForecast(61.2345, 8.7654);
    const newerCall = fetchForecast(61.2345, 8.7654);
    const newerData = validForecast('2026-02-12T08:50:00.000Z');

    newer.resolve(response(newerData));
    await expect(newerCall).resolves.toMatchObject({ forecast: newerData });
    older.reject(new TypeError('older offline'));
    await expect(olderCall).resolves.toMatchObject({
      forecast: newerData,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
  });

  it('prefers a newer in-memory commit when storage write throws and an older caller fails over stale cache', async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    const stale = validForecast('2026-02-12T07:00:00.000Z');
    const newerData = validForecast('2026-02-12T08:50:00.000Z');
    const { storage, values } = installStorage({
      [CACHE_KEY]: JSON.stringify({
        version: 1,
        fetchedAt: NOW_MS - CACHE_TTL_MS - 1,
        data: stale,
      }),
    });
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise));
    const olderCall = fetchForecast(61.2345, 8.7654);
    const newerCall = fetchForecast(61.2345, 8.7654);

    newer.resolve(response(newerData));
    await expect(newerCall).resolves.toMatchObject({ forecast: newerData });
    older.reject(new TypeError('older offline'));

    await expect(olderCall).resolves.toMatchObject({
      forecast: newerData,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
    expect(JSON.parse(values.get(CACHE_KEY) ?? '').data).toEqual(stale);
  });

  it('recomputes source currentness whenever a committed memory result is returned', async () => {
    const sourceAtCommit = new Date(NOW_MS - (5 * 60 + 59) * 60 * 1000).toISOString();
    const data = validForecast(sourceAtCommit);
    const { storage } = installStorage();
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(data))
      .mockRejectedValueOnce(new TypeError('offline')));

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      metadata: { sourceUpdatedAt: sourceAtCommit },
    });
    vi.setSystemTime(NOW_MS + 2 * 60 * 1000);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: data,
      metadata: {
        sourceUpdatedAt: null,
        evaluatedAt: NOW_MS + 2 * 60 * 1000,
      },
    });
  });

  it('uses one evaluation clock across network, persistent-cache and memory returns', async () => {
    const evaluatedAt = Date.parse('2026-02-12T10:30:00.000Z');
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    const cacheKey = 'metno:61.22,8.22';
    const { storage } = installStorage({
      [cacheKey]: JSON.stringify({
        version: 1,
        fetchedAt: Date.parse('2026-02-12T10:20:00.000Z'),
        data,
      }),
    });
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(data))
      .mockResolvedValueOnce(response(data))
      .mockRejectedValueOnce(new TypeError('offline')));
    vi.setSystemTime(evaluatedAt);

    const network = await fetchForecast(61.11, 8.11);
    const persistentCache = await fetchForecast(61.22, 8.22);
    await fetchForecast(61.33, 8.33);
    const memory = await fetchForecast(61.33, 8.33);
    const results = [network, persistentCache, memory];

    expect(results.map((result) => result.metadata.evaluatedAt))
      .toEqual([evaluatedAt, evaluatedAt, evaluatedAt]);
    expect(results.map((result) => (
      extractNow(result.forecast, result.metadata.evaluatedAt).observedAt.toISOString()
    ))).toEqual([
      '2026-02-12T10:00:00.000Z',
      '2026-02-12T10:00:00.000Z',
      '2026-02-12T10:00:00.000Z',
    ]);
  });

  it('validates a memory failure fallback before evaluating its TTL, source and current interval', async () => {
    const validationStartedAt = Date.parse('2026-02-12T09:59:59.000Z');
    const evaluatedAt = Date.parse('2026-02-12T10:00:01.000Z');
    const committedAt = Date.parse('2026-02-12T09:00:00.000Z');
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    data.properties.meta.updated_at = '2026-02-12T04:00:00.000Z';
    const cacheRaw = JSON.stringify({ version: 1, fetchedAt: committedAt, data });
    const { storage, values } = installStorage();
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(data))
      .mockImplementationOnce(() => {
        values.set(CACHE_KEY, cacheRaw);
        return Promise.reject(new TypeError('offline'));
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.setSystemTime(committedAt);
    await fetchForecast(61.2345, 8.7654);

    const points = data.properties.timeseries;
    Object.defineProperty(data.properties, 'timeseries', {
      configurable: true,
      get: () => {
        vi.setSystemTime(evaluatedAt);
        return points;
      },
    });
    vi.setSystemTime(validationStartedAt);

    const result = await fetchForecast(61.2345, 8.7654);

    expect(result.metadata).toMatchObject({
      source: 'cache',
      cacheStatus: 'stale',
      stale: true,
      sourceUpdatedAt: null,
      fetchedAt: committedAt,
      evaluatedAt,
    });
    expect(extractNow(result.forecast, result.metadata.evaluatedAt).observedAt.toISOString())
      .toBe('2026-02-12T10:00:00.000Z');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('validates an obsolete-success memory candidate before deciding whether it can supersede', async () => {
    const validationStartedAt = Date.parse('2026-02-12T09:59:59.000Z');
    const evaluatedAt = Date.parse('2026-02-12T10:00:01.000Z');
    const committedAt = Date.parse('2026-02-12T09:00:00.000Z');
    const older = deferred<Response>();
    const newerData = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    newerData.properties.meta.updated_at = '2026-02-12T04:00:00.000Z';
    const olderData = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', -1),
      utcPoint('2026-02-12T10:00:00.000Z', 12),
    ]);
    olderData.properties.meta.updated_at = '2026-02-12T08:00:00.000Z';
    const { storage } = installStorage();
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(response(newerData)));
    vi.setSystemTime(committedAt);
    const olderCall = fetchForecast(61.2345, 8.7654);
    await fetchForecast(61.2345, 8.7654);

    const points = newerData.properties.timeseries;
    Object.defineProperty(newerData.properties, 'timeseries', {
      configurable: true,
      get: () => {
        vi.setSystemTime(evaluatedAt);
        return points;
      },
    });
    vi.setSystemTime(validationStartedAt);
    older.resolve(response(olderData));

    await expect(olderCall).resolves.toMatchObject({
      forecast: olderData,
      metadata: {
        source: 'network',
        sourceUpdatedAt: '2026-02-12T08:00:00.000Z',
        fetchedAt: validationStartedAt,
        evaluatedAt: validationStartedAt,
      },
    });
  });

  it('commits an older valid success when a newer same-key request fails without cache', async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    const { values } = installStorage();
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise));
    const olderCall = fetchForecast(61.2345, 8.7654);
    const newerCall = fetchForecast(61.2345, 8.7654);
    const onlyValidData = validForecast('2026-02-12T08:20:00.000Z');

    newer.reject(new TypeError('newer offline'));
    await expect(newerCall).rejects.toThrow('newer offline');
    older.resolve(response(onlyValidData));

    await expect(olderCall).resolves.toMatchObject({
      forecast: onlyValidData,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
    expect(JSON.parse(values.get(CACHE_KEY) ?? '').data).toEqual(onlyValidData);
  });

  it('replaces stale cache with an older valid success after a newer same-key fallback', async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    const stale = validForecast('2026-02-12T07:00:00.000Z');
    const onlyValidData = validForecast('2026-02-12T08:20:00.000Z');
    const { values } = installStorage({
      [CACHE_KEY]: JSON.stringify({
        version: 1,
        fetchedAt: NOW_MS - CACHE_TTL_MS - 1,
        data: stale,
      }),
    });
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise));
    const olderCall = fetchForecast(61.2345, 8.7654);
    const newerCall = fetchForecast(61.2345, 8.7654);

    newer.reject(new TypeError('newer offline'));
    await expect(newerCall).resolves.toMatchObject({
      forecast: stale,
      metadata: { source: 'cache', cacheStatus: 'stale', stale: true },
    });
    older.resolve(response(onlyValidData));

    await expect(olderCall).resolves.toMatchObject({
      forecast: onlyValidData,
      metadata: { source: 'network', cacheStatus: 'miss', stale: false },
    });
    expect(JSON.parse(values.get(CACHE_KEY) ?? '').data).toEqual(onlyValidData);
  });
});

describe('extractNow acceptance clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fails closed at 09:00 when the first forecast point starts at 15:00', () => {
    const data = forecast([
      utcPoint('2026-02-12T15:00:00.000Z', 15),
    ]);

    expect(() => extractNow(data, Date.parse('2026-02-12T09:00:00.000Z')))
      .toThrow('met.no: mangler gjeldende en-timesintervall');
  });

  it('selects the 09:00 interval at 09:30 when 09:00 and 10:00 both exist', () => {
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', 9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);

    expect(extractNow(data, Date.parse('2026-02-12T09:30:00.000Z')))
      .toMatchObject({ tempC: 9, observedAt: new Date('2026-02-12T09:00:00.000Z') });
  });

  it('selects the 10:00 interval at the exact 10:00 boundary', () => {
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', 9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);

    expect(extractNow(data, Date.parse('2026-02-12T10:00:00.000Z')))
      .toMatchObject({ tempC: 10, observedAt: new Date('2026-02-12T10:00:00.000Z') });
  });

  it('fails closed when the covering point lacks one-hour evidence even if a later point has it', () => {
    const covering = utcPoint('2026-02-12T09:00:00.000Z', -20);
    delete covering.data.next_1_hours;
    const data = forecast([
      covering,
      utcPoint('2026-02-12T10:00:00.000Z', 15, 'clearsky_day'),
    ]);

    expect(() => extractNow(data, Date.parse('2026-02-12T09:30:00.000Z')))
      .toThrow('met.no: mangler en-timesbevis');
  });

  it('is deterministic from evaluatedAt and never consults Date.now internally', () => {
    const evaluatedAt = Date.parse('2026-02-12T09:30:00.000Z');
    const data = forecast([
      utcPoint('2026-02-12T09:00:00.000Z', 9),
      utcPoint('2026-02-12T10:00:00.000Z', 10),
    ]);
    const nowSpy = vi.spyOn(Date, 'now');

    vi.setSystemTime('2000-01-01T00:00:00.000Z');
    const first = extractNow(data, evaluatedAt);
    vi.setSystemTime('2040-01-01T00:00:00.000Z');
    const second = extractNow(data, evaluatedAt);

    expect(first).toEqual(second);
    expect(first.observedAt.toISOString()).toBe('2026-02-12T09:00:00.000Z');
    expect(nowSpy).not.toHaveBeenCalled();
  });

  it('accepts the official terminal instant-only point as raw data but never as current', () => {
    const data = compactShapedForecast();
    const terminal = data.properties.timeseries.at(-1)!;
    const evaluatedAt = Date.parse(terminal.time) + 30 * 60 * 1000;

    expect(() => extractNow(data, evaluatedAt)).toThrow('met.no: mangler en-timesbevis');
  });
});

describe('extractHourly', () => {
  it('inkluderer windMs fra instant-detaljene', () => {
    const fc = forecast([point(2026, 0, 1, 6, 2, 4.5)]);
    const [first] = extractHourly(fc, 1);
    expect(first?.windMs).toBe(4.5);
    expect(first?.tempC).toBe(2);
  });

  it('never exposes a six-hour precipitation total as an hourly recommendation input', () => {
    const sixHourPoint = point(2026, 0, 1, 6, 2, 4.5);
    delete sixHourPoint.data.next_1_hours;
    sixHourPoint.data.next_6_hours = {
      summary: { symbol_code: 'rain' },
      details: { precipitation_amount: 60 },
    };
    const fc = forecast([sixHourPoint]);

    expect(() => extractNow(fc, Date.parse(sixHourPoint.time) + 30 * 60 * 1000))
      .toThrow('met.no: mangler en-timesbevis');
    expect(extractHourly(fc, 1)).toEqual([]);
    expect(extractDailyAtHour(fc, 6, 1)[0]?.precipMmH).toBe(10);
  });

  it('fails closed when the actual current point lacks one-hour evidence', () => {
    const actualNow = point(2026, 0, 12, 9, -20, 2, 'cloudy');
    delete actualNow.data.next_1_hours;
    const later = point(2026, 0, 12, 10, 15, 2, 'clearsky_day');
    const fc = forecast([actualNow, later]);

    expect(() => extractNow(fc, Date.parse(actualNow.time) + 30 * 60 * 1000))
      .toThrow('met.no: mangler en-timesbevis');
  });
});

describe('extractDailyAtHour', () => {
  const fc = forecast([
    // dag 1
    point(2026, 0, 1, 6, 2, 3),
    point(2026, 0, 1, 12, 9, 3),
    point(2026, 0, 1, 18, 5, 3),
    // dag 2
    point(2026, 0, 2, 9, 1, 3),
    point(2026, 0, 2, 12, 8, 3),
    point(2026, 0, 2, 15, 6, 3),
  ]);

  it('velger punktet nærmest referansetimen (12) per dag', () => {
    const days = extractDailyAtHour(fc, 12, 10);
    expect(days).toHaveLength(2);
    expect(days[0]?.tempC).toBe(9); // dag 1 kl 12
    expect(days[1]?.tempC).toBe(8); // dag 2 kl 12
    expect(days[0]?.refHour).toBe(12);
  });

  it('bytter valgt punkt når referansetimen endres', () => {
    const days = extractDailyAtHour(fc, 6, 10);
    expect(days[0]?.tempC).toBe(2); // dag 1 kl 6 (eksakt)
    expect(days[1]?.tempC).toBe(1); // dag 2: 9 er nærmest 6 (av 9/12/15)
  });

  it('begrenser antall dager til `days`', () => {
    expect(extractDailyAtHour(fc, 12, 1)).toHaveLength(1);
  });
});
