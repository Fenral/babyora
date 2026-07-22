import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractDailyAtHour, extractHourly, fetchForecast } from '../client';
import type { MetForecast, MetTimePoint } from '../types';

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

function forecast(points: MetTimePoint[]): MetForecast {
  return {
    properties: {
      meta: { updated_at: '2026-02-12T08:12:00.000Z', units: {} },
      timeseries: points,
    },
  };
}

const NOW_ISO = '2026-02-12T09:00:00.000Z';
const NOW_MS = Date.parse(NOW_ISO);
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_KEY = 'metno:61.23,8.77';

function validForecast(updatedAt: unknown = '2026-02-12T08:12:00.000Z'): MetForecast {
  const value = forecast([point(2026, 1, 12, 9, -3, 4.2, 'partlycloudy_day')]);
  value.properties.meta.updated_at = updatedAt as string;
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
    installStorage({ [CACHE_KEY]: raw });
    const fetchMock = vi.fn().mockResolvedValue(response(network));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecast(61.2345, 8.7654)).resolves.toMatchObject({
      forecast: network,
      metadata: { source: 'network', stale: false },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, null, '', '   ', 'ikke-en-dato'])(
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
});

describe('extractHourly', () => {
  it('inkluderer windMs fra instant-detaljene', () => {
    const fc = forecast([point(2026, 0, 1, 6, 2, 4.5)]);
    const [first] = extractHourly(fc, 1);
    expect(first?.windMs).toBe(4.5);
    expect(first?.tempC).toBe(2);
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
