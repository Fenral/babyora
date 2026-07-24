export type PlanleggE2EFixture = Readonly<{
  id: string;
  path: string;
  viewport: Readonly<{ width: number; height: number }>;
  timeZone: 'Europe/Oslo';
  snartReadiness?: Readonly<{
    priorCandidates: Readonly<Record<'01-13' | '01-14' | '01-15', Readonly<{
      gitSha: string;
      treeSha: string;
      contractSha256: string;
      packSha256: string;
      evidenceSha256: string;
    }>>>;
    manifestSha256: string;
    builderSha256: string;
    modelBundleSha256: string;
    uiSessionBundleSha256: string;
    priorEvidenceBundleSha256: string;
  }>;
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
    snartReadiness: Object.freeze({
      priorCandidates: Object.freeze({
        '01-13': Object.freeze({
          gitSha: '2f510d4a8d9b97a50430223bdbc94570b880393e',
          treeSha: '2b017730aef66ed556c08349f0ec3e5a9402d56c',
          contractSha256: 'f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033',
          packSha256: 'e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b',
          evidenceSha256: 'eb8c744589497fb9917114bfa2ab4c03a3ece22ea575ef4ee50799eb30317545',
        }),
        '01-14': Object.freeze({
          gitSha: '1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31',
          treeSha: '75b9251c5981d7fe894575ff9263441701afc693',
          contractSha256: 'f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033',
          packSha256: 'e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b',
          evidenceSha256: '9f8fa471a2c9fc3723155bd4a9b3a82eeab066ce838d2051fae85e6cee186c8a',
        }),
        '01-15': Object.freeze({
          gitSha: 'cd95820d4edcaf9357058f01b17cd37c9f8209a0',
          treeSha: 'a04e21046c794d74f5b6fa579e42df82621ee000',
          contractSha256: 'f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033',
          packSha256: 'e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b',
          evidenceSha256: '43be1aadae4eec239cfb566b63bb0ad7c153c5adb9aa7fad57b2d6b4883cdcd7',
        }),
      }),
      manifestSha256: 'a20244cfbe3129ed360ac33f592718bb1a58d7f208d07987d076660f4fd700aa',
      builderSha256: '7f651d485dfd35a4b60cf2dc74b3e8091215cdd2496f80e4cb094fc55eba9399',
      modelBundleSha256: '01bce64fa05f3069892931204264f376339f7059aacad7408c06a7d5530ca8f6',
      uiSessionBundleSha256: '480c7ce2835fcb21658d779b1956c0b79007770ea0bf71178718008040a3bf33',
      priorEvidenceBundleSha256: '33492fe07edfe1f3fb9134295da07e12bd0e8bdccb626c994b65245b7485896b',
    }),
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
