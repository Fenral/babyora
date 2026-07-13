/**
 * Nominatim-klient (OpenStreetMap-geokoding).
 *
 * Iter 24 Steg 3: brukes av LocationPicker i SettingsScreen for å erstatte
 * den hardkodede 8-by-listen.
 *
 * Nominatim-vilkår (https://operations.osmfoundation.org/policies/nominatim/):
 * - Maksimum 1 request per sekund
 * - Identifiser app via User-Agent (skal være app-navn + kontakt)
 * - Cache aggressivt
 * - Ikke last hele datasett — bare ad-hoc søk
 */

const BASE_SEARCH = 'https://nominatim.openstreetmap.org/search';
const BASE_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

// User-Agent ignoreres av browser-fetch men sendes via Capacitor native HTTP
const USER_AGENT = 'wool-app/0.1 (https://github.com/Fenral/wool-app)';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 timer — adresser endrer seg sjelden
const CACHE_PREFIX = 'nominatim:';

type CachedEntry<T> = { fetchedAt: number; data: T };

export type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
  city: string | null;
};

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ fetchedAt: Date.now(), data }),
    );
  } catch {
    // localStorage fullt eller blokkert — ignorer
  }
}

/** Forward-geokode: tekst → kandidat-liste. Begrenset til 5 treff. */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = readCache<GeocodeResult[]>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_SEARCH}?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1&accept-language=nb`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const raw = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: { city?: string; town?: string; village?: string; municipality?: string };
  }>;

  const results: GeocodeResult[] = raw.map((r) => ({
    lat: Number(r.lat),
    lon: Number(r.lon),
    displayName: r.display_name,
    city:
      r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.municipality ?? null,
  }));

  writeCache(cacheKey, results);
  return results;
}

/** Reverse-geokode: koordinat → adresse/by. Returnerer null hvis ingen match. */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = readCache<GeocodeResult | null>(cacheKey);
  if (cached !== null) return cached;

  const url = `${BASE_REVERSE}?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&format=json&zoom=10&addressdetails=1&accept-language=nb`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    if (res.status === 404) {
      writeCache(cacheKey, null);
      return null;
    }
    throw new Error(`Nominatim HTTP ${res.status}`);
  }
  const raw = (await res.json()) as {
    lat: string;
    lon: string;
    display_name?: string;
    address?: { city?: string; town?: string; village?: string; municipality?: string };
    error?: string;
  };
  if (raw.error) {
    writeCache(cacheKey, null);
    return null;
  }

  const result: GeocodeResult = {
    lat,
    lon,
    displayName: raw.display_name ?? '',
    city:
      raw.address?.city ?? raw.address?.town ?? raw.address?.village ?? raw.address?.municipality ?? null,
  };
  writeCache(cacheKey, result);
  return result;
}
