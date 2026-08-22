import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../forecast';

const upstreamForecast = {
  properties: {
    meta: {
      updated_at: '2026-02-12T08:12:00.000Z',
      units: {
        air_temperature: 'celsius',
        precipitation_amount: 'mm',
        wind_speed: 'm/s',
        wind_from_direction: 'degrees',
        relative_humidity: '%',
        cloud_area_fraction: '%',
      },
    },
    timeseries: [{
      time: '2026-02-12T09:00:00.000Z',
      data: {
        instant: {
          details: {
            air_temperature: -3,
            wind_speed: 4.2,
            wind_from_direction: 0,
            relative_humidity: 70,
            cloud_area_fraction: 50,
          },
        },
        next_1_hours: {
          summary: { symbol_code: 'partlycloudy_day' },
          details: { precipitation_amount: 0 },
        },
      },
    }],
  },
};
const upstreamBody = JSON.stringify(upstreamForecast);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('forecast proxy cache policy', () => {
  it.each([
    ['missing latitude', 'lon=10.3951'],
    ['missing longitude', 'lat=63.4305'],
    ['blank latitude', 'lat=&lon=10.3951'],
    ['non-finite latitude', 'lat=Infinity&lon=10.3951'],
    ['latitude outside range', 'lat=90.0001&lon=10.3951'],
    ['longitude outside range', 'lat=63.4305&lon=-180.0001'],
  ])('rejects %s before contacting met.no', async (_label, query) => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(`https://snudly.test/api/forecast?${query}`));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'invalid_coordinates',
      retryable: false,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('rejects non-GET methods before contacting met.no', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=63.4305&lon=10.3951',
      { method: 'POST' },
    ));

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('keeps fixed/manual GET responses on the reviewed shared-cache policy', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(upstreamBody));
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=63.4305&lon=10.3951',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control'))
      .toBe('s-maxage=900, stale-while-revalidate=600');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeNull();
    expect(upstream).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.objectContaining({ cache: 'no-store' }),
    );
    expect(upstream).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringMatching(/^Snudly\/\d/),
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('marks automatic coordinates no-store at browser, CDN and upstream seams', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(upstreamBody));
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=69.6492&lon=18.9553&cacheScope=memory-only',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('Cache-Control')).not.toContain('s-maxage');
    expect(upstream).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it.each([
    ['upstream network failure', () => Promise.reject(new TypeError('offline'))],
    ['upstream HTTP failure', () => Promise.resolve(new Response('', { status: 503 }))],
  ])('retries automatic %s once and returns a typed no-store failure', async (
    _label,
    upstreamResult,
  ) => {
    const upstream = vi.fn().mockImplementation(upstreamResult);
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=69.6492&lon=18.9553&cacheScope=memory-only',
    ));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: 'upstream_unavailable',
      retryable: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('retries a timed-out upstream once, then returns a typed 504', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const upstream = vi.fn().mockRejectedValue(timeout);
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://snudly.test/api/forecast?lat=69.6492&lon=18.9553',
    ));

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({
      code: 'timeout',
      retryable: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('preserves a safe 429 and Retry-After without looping', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('upstream details', {
      status: 429,
      headers: { 'Retry-After': '45' },
    }));
    vi.stubGlobal('fetch', upstream);

    const response = await handler(new Request(
      'https://snudly.test/api/forecast?lat=63.4305&lon=10.3951',
    ));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('45');
    await expect(response.json()).resolves.toEqual({
      error: 'Værtjenesten har for mange forespørsler. Prøv igjen senere.',
      code: 'rate_limited',
      retryable: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['invalid JSON', '{not-json'],
    ['invalid forecast shape', JSON.stringify({ properties: { timeseries: [] } })],
  ])('rejects %s at the proxy boundary without caching it', async (_label, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));

    const response = await handler(new Request(
      'https://snudly.test/api/forecast?lat=63.4305&lon=10.3951',
    ));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: 'invalid_payload',
      retryable: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
  });

  it('keeps an automatic upstream body-read failure explicitly no-store', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockRejectedValue(new TypeError('body stream failed')),
    } as unknown as Response));

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=69.6492&lon=18.9553&cacheScope=memory-only',
    ));

    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
  });

  it('rate-limits repeated uncached requests from one client', async () => {
    const upstream = vi.fn().mockImplementation(
      () => Promise.resolve(new Response(upstreamBody)),
    );
    vi.stubGlobal('fetch', upstream);
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

    const request = () => new Request(
      'https://babyora.test/api/forecast?lat=69.6492&lon=18.9553&cacheScope=memory-only',
      { headers: { 'x-forwarded-for': '198.51.100.42' } },
    );

    for (let index = 0; index < 30; index += 1) {
      const response = await handler(request());
      expect(response.status).toBe(200);
    }

    const response = await handler(request());

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(upstream).toHaveBeenCalledTimes(30);
  });
});
