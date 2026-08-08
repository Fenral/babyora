import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocode } from '../../../lib/geocode/nominatim';
import { resolveOnboardingPlace } from '../resolve-onboarding-place';

vi.mock('../../../lib/geocode/nominatim', () => ({
  reverseGeocode: vi.fn(),
}));

const reverseGeocodeMock = vi.mocked(reverseGeocode);

describe('resolveOnboardingPlace', () => {
  beforeEach(() => {
    reverseGeocodeMock.mockReset();
  });

  it('returns the reverse-geocoded city and rounded coordinates', async () => {
    reverseGeocodeMock.mockResolvedValue({
      city: ' København ',
      lat: 55.676098,
      lon: 12.568337,
      displayName: 'København, Danmark',
    });

    await expect(resolveOnboardingPlace(55.676098, 12.568337)).resolves.toEqual({
      city: 'København',
      lat: 55.6761,
      lon: 12.5683,
    });
    expect(reverseGeocodeMock).toHaveBeenCalledWith(55.676098, 12.568337, {
      cacheScope: 'memory-only',
    });
  });

  it.each([null, { city: null, lat: 1, lon: 2, displayName: '' }])(
    'rejects %j so onboarding can require a manual city',
    async (result) => {
      reverseGeocodeMock.mockResolvedValue(result);
      await expect(resolveOnboardingPlace(59.91, 10.75)).rejects.toThrow(
        'No city found',
      );
    },
  );
});
