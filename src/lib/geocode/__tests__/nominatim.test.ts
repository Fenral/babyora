import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocode } from '../nominatim';

const NOW_MS = Date.parse('2026-02-12T09:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

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

function response(data: unknown, ok = true, status = 200): Response {
  return { ok, status, json: vi.fn().mockResolvedValue(data) } as unknown as Response;
}

function reversePayload(lat: number, lon: number, city = 'Tromsø') {
  return {
    lat: String(lat),
    lon: String(lon),
    display_name: `${city}, Norge`,
    address: { city },
  };
}

describe('reverseGeocode cache scope', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses no-store memory only and never cross-hits a persistent same-coordinate entry', async () => {
    const lat = 69.6492;
    const lon = 18.9553;
    const persistentResult = {
      lat,
      lon,
      displayName: 'Fast hjem',
      city: 'Fast hjem',
    };
    const { storage } = installStorage({
      'nominatim:reverse:69.6492,18.9553': JSON.stringify({
        fetchedAt: NOW_MS,
        data: persistentResult,
      }),
    });
    const fetchMock = vi.fn().mockResolvedValue(response(reversePayload(lat, lon)));
    vi.stubGlobal('fetch', fetchMock);

    const automatic = await reverseGeocode(lat, lon, {
      cacheScope: 'memory-only',
    });
    const automaticAgain = await reverseGeocode(lat, lon, {
      cacheScope: 'memory-only',
    });

    expect(automatic?.city).toBe('Tromsø');
    expect(automaticAgain).toEqual(automatic);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();

    await expect(reverseGeocode(lat, lon)).resolves.toEqual(persistentResult);
  });

  it('caches a memory-only null hit explicitly without storage or a second request', async () => {
    const { storage } = installStorage();
    const fetchMock = vi.fn().mockResolvedValue(response({}, false, 404));
    vi.stubGlobal('fetch', fetchMock);

    await expect(reverseGeocode(69.7001, 18.9001, {
      cacheScope: 'memory-only',
    })).resolves.toBeNull();
    await expect(reverseGeocode(69.7001, 18.9001, {
      cacheScope: 'memory-only',
    })).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('expires memory-only entries and keeps the in-process cache bounded', async () => {
    const { storage } = installStorage();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      const lat = Number(parsed.searchParams.get('lat'));
      const lon = Number(parsed.searchParams.get('lon'));
      return Promise.resolve(response(reversePayload(lat, lon, `By ${lat}`)));
    });
    vi.stubGlobal('fetch', fetchMock);

    for (let index = 0; index < 33; index += 1) {
      await reverseGeocode(60 + index / 100, 10, {
        cacheScope: 'memory-only',
      });
    }
    await reverseGeocode(60, 10, { cacheScope: 'memory-only' });
    expect(fetchMock).toHaveBeenCalledTimes(34);

    vi.setSystemTime(NOW_MS + DAY_MS + 1);
    await reverseGeocode(60.32, 10, { cacheScope: 'memory-only' });
    expect(fetchMock).toHaveBeenCalledTimes(35);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
