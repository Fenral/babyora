export type PlanleggE2EFixture = Readonly<{
  id: string;
  path: string;
  viewport: Readonly<{ width: number; height: number }>;
  timeZone: 'Europe/Oslo';
}>;

export const PLANLEGG_E2E_FIXTURES = Object.freeze({
  harness: Object.freeze({
    id: 'planlegg-harness-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
}) satisfies Readonly<Record<string, PlanleggE2EFixture>>;
