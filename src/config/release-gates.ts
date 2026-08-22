export const RELEASE_COUNTRIES = ['NO', 'SE', 'DK'] as const;

export type ReleaseCountry = (typeof RELEASE_COUNTRIES)[number];
export type ReleaseAvailability = 'production' | 'pilot' | 'unavailable';
export type TranslationReadiness = 'release-ready' | 'pilot' | 'unavailable';
export type SafetyReviewStatus = 'approved' | 'pending' | 'unreviewed';

export interface AvailableReleaseGate {
  readonly country: ReleaseCountry;
  readonly availability: Exclude<ReleaseAvailability, 'unavailable'>;
  readonly translation: Exclude<TranslationReadiness, 'unavailable'>;
  readonly safetyReview: Exclude<SafetyReviewStatus, 'unreviewed'>;
  readonly publicRelease: boolean;
  readonly controlledPilot: boolean;
}

export interface UnavailableReleaseGate {
  readonly country: null;
  readonly availability: 'unavailable';
  readonly translation: 'unavailable';
  readonly safetyReview: 'unreviewed';
  readonly publicRelease: false;
  readonly controlledPilot: false;
}

export type CountryReleaseGate = AvailableReleaseGate | UnavailableReleaseGate;

export interface ReleaseContext {
  readonly country: unknown;
  readonly selectedLocale: string;
}

type ReleaseGateMap = {
  readonly [Country in ReleaseCountry]: AvailableReleaseGate & { readonly country: Country };
};

export const RELEASE_GATES = Object.freeze({
  NO: Object.freeze({
    country: 'NO',
    availability: 'production',
    translation: 'release-ready',
    safetyReview: 'approved',
    publicRelease: true,
    controlledPilot: false,
  }),
  SE: Object.freeze({
    country: 'SE',
    availability: 'pilot',
    translation: 'pilot',
    safetyReview: 'pending',
    publicRelease: false,
    controlledPilot: true,
  }),
  DK: Object.freeze({
    country: 'DK',
    availability: 'pilot',
    translation: 'pilot',
    safetyReview: 'pending',
    publicRelease: false,
    controlledPilot: true,
  }),
}) satisfies ReleaseGateMap;

const UNAVAILABLE_RELEASE_GATE = Object.freeze({
  country: null,
  availability: 'unavailable',
  translation: 'unavailable',
  safetyReview: 'unreviewed',
  publicRelease: false,
  controlledPilot: false,
}) satisfies UnavailableReleaseGate;

export function isReleaseCountry(value: unknown): value is ReleaseCountry {
  return typeof value === 'string' && (RELEASE_COUNTRIES as readonly string[]).includes(value);
}

/**
 * Resolves access from the country only. A selected language must never grant
 * production or pilot access for a country that has not passed its own gate.
 */
export function resolveReleaseGate({ country }: ReleaseContext): CountryReleaseGate {
  return isReleaseCountry(country) ? RELEASE_GATES[country] : UNAVAILABLE_RELEASE_GATE;
}
