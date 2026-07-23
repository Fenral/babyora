import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../forecast';

const upstreamBody = JSON.stringify({
  properties: {
    meta: { updated_at: '2026-02-12T08:12:00.000Z', units: {} },
    timeseries: [],
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('forecast proxy cache policy', () => {
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
    ['upstream network failure', () => Promise.reject(new TypeError('offline')), 502],
    ['upstream HTTP failure', () => Promise.resolve(new Response('', { status: 503 })), 503],
  ])('keeps automatic %s responses explicitly no-store', async (
    _label,
    upstreamResult,
    status,
  ) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(upstreamResult));

    const response = await handler(new Request(
      'https://babyora.test/api/forecast?lat=69.6492&lon=18.9553&cacheScope=memory-only',
    ));

    expect(response.status).toBe(status);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
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
});
