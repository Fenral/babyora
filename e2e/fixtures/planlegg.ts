export type PlanleggE2EFixture = Readonly<{
  id: string;
  path: string;
  viewport: Readonly<{ width: number; height: number }>;
  timeZone: 'Europe/Oslo';
  containment?: Readonly<{
    childrenStorageRaw: string;
    activeChildId: string;
    locationPrefStorageRaw: string;
    forecastCacheKey: string;
    forecastFetchedAt: number;
  }>;
}>;

export const PLANLEGG_E2E_FIXTURES = Object.freeze({
  snart: Object.freeze({
    id: 'planlegg-snart-readiness-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  harness: Object.freeze({
    id: 'planlegg-harness-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'location-containment': Object.freeze({
    id: 'planlegg-location-containment-v1',
    path: '/',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
    containment: Object.freeze({
      childrenStorageRaw: JSON.stringify([{
        id: 'containment-child',
        name: 'Mina Test',
        dob: '2025-10-03',
        city: 'Fastheim',
        lat: 63.4305,
        lon: 10.3951,
        color: '#4F8A6A',
        avatarKey: 'lillian',
        canRoll: 'unknown',
        materialPreference: 'best_for_conditions',
      }]),
      activeChildId: 'containment-child',
      locationPrefStorageRaw: JSON.stringify({
        state: { mode: 'auto' },
        version: 0,
      }),
      forecastCacheKey: 'metno:63.43,10.40',
      forecastFetchedAt: Date.parse('2026-02-12T08:25:00.000Z'),
    }),
  }),
}) satisfies Readonly<Record<string, PlanleggE2EFixture>>;
