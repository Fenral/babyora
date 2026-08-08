import { reverseGeocode } from '../../lib/geocode/nominatim';

export type ResolvedOnboardingPlace = Readonly<{
  city: string;
  lat: number;
  lon: number;
}>;

function roundCoordinate(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Turns the phone's coordinates into the city shown and persisted by
 * onboarding. Automatic coordinates use memory-only geocode caching so a
 * failed lookup never leaves a coordinate cache behind on the device.
 */
export async function resolveOnboardingPlace(
  latitude: number,
  longitude: number,
): Promise<ResolvedOnboardingPlace> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid onboarding coordinates');
  }

  const result = await reverseGeocode(latitude, longitude, {
    cacheScope: 'memory-only',
  });
  const city = result?.city?.trim();
  if (!city) {
    throw new Error('No city found for onboarding coordinates');
  }

  return {
    city,
    lat: roundCoordinate(latitude),
    lon: roundCoordinate(longitude),
  };
}
