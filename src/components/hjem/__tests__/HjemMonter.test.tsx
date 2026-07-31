/**
 * HjemMonter — state-switching integration tests.
 *
 * Both `useScanCoordinator` and `useScanCache` are mocked so each test can
 * put the orchestrator directly into a specific coordinator phase / cache
 * shape (weather-ready/scanning/result-current/result-stale/recalculating,
 * with or without a same-day cached slot) without needing to drive real
 * timers/effects through renderToStaticMarkup (which never runs effects —
 * see HjemMonter.tsx's own header doc on why the *decision* logic lives in
 * scan-orchestration.ts's pure functions instead, already covered by
 * scan-orchestration.test.ts). `useScanCache` is mocked rather than seeded
 * via the real zustand/persist store because persist's rehydration timing
 * is asynchronous and races with the synchronous render in a plain
 * renderToStaticMarkup test — a controllable fake keeps these tests fast
 * and deterministic. `getSlotForIdentity`/`shouldPlayFullScan` (the actual
 * P3 cache-matching logic) stay real via importOriginal, so the render-time
 * offline/cached-slot branches in HjemMonter still exercise real logic.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../lib/wool-layers/types.js';
import type { ScanCoordinatorState } from '../../../lib/scan/coordinator.js';
import type { ScanCacheSlot } from '../../../lib/scan/types.js';
import { localDateKey } from '../../../lib/scan/types.js';

const scanMethods = {
  weatherReady: vi.fn(),
  scanStarted: vi.fn(),
  scanCompleted: vi.fn(),
  identityChanged: vi.fn(),
  weatherBasisChanged: vi.fn(),
  recalcStarted: vi.fn(),
  recalcCompleted: vi.fn(),
  recalcFailed: vi.fn(),
  reset: vi.fn(),
};

let mockedState: ScanCoordinatorState = { phase: 'weather-ready' };

vi.mock('../../../hooks/useScanCoordinator.js', () => ({
  useScanCoordinator: () => ({
    getState: () => mockedState,
    subscribe: () => () => {},
    state: mockedState,
    ...scanMethods,
  }),
}));

let mockedSlots: Record<string, ScanCacheSlot> = {};
const commitSlot = vi.fn();

vi.mock('../../../state/scan-cache-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../state/scan-cache-store.js')>();
  return {
    ...actual, // keep the REAL getSlotForIdentity/shouldPlayFullScan/markScanPlayed
    useScanCache: (selector: (state: { slots: Record<string, ScanCacheSlot>; commitSlot: typeof commitSlot }) => unknown) =>
      selector({ slots: mockedSlots, commitSlot }),
  };
});

const { HjemMonter } = await import('../HjemMonter.js');

function fixedInput(overrides: Partial<RecommendInput> = {}): RecommendInput {
  return {
    weather: {
      tempC: 4,
      feelsLikeC: 1,
      windMs: 3,
      precipMmH: 0.3,
      humidity: 80,
      symbolCode: 'lightrain',
      uvIndex: 0,
    },
    child: { ageMonths: 9, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
    ...overrides,
  };
}

function baseProps() {
  const recommendation = recommend(fixedInput());
  return {
    cityLabel: 'Trondheim',
    lat: 63.43,
    lon: 10.39,
    now: {
      tempC: 4, feelsLikeC: 1, windMs: 3, windDir: 180, precipMmH: 0.3,
      symbolCode: 'lightrain', observedAt: new Date(),
    },
    weatherStatus: 'ready' as const,
    activity: 'utelek' as const,
    onActivityChange: vi.fn(),
    childId: 'child-1',
    childName: 'Lillian',
    ageMonths: 9,
    recommendation,
    onStartDressing: vi.fn(),
    startDressingDisabled: false,
    reducedMotion: false,
    outfitTransitionStatus: 'idle' as const,
    // P5
    onOpenAdjust: vi.fn(),
    onOpenWarmColdGuide: vi.fn(),
    onRetryWeather: vi.fn(),
    // P6
    onOpenPlaggbib: vi.fn(),
  };
}

beforeEach(() => {
  mockedSlots = {};
  commitSlot.mockClear();
  for (const fn of Object.values(scanMethods)) (fn as Mock).mockClear();
});
afterEach(() => {
  mockedSlots = {};
});

describe('HjemMonter — phase-driven view switching', () => {
  it('weather-ready: renders the WeatherScene panel + "Klar for en liten tur?" ask screen', () => {
    mockedState = { phase: 'weather-ready' };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} />);
    expect(html).toContain('Klar for en liten tur?');
    expect(html).toContain('Finn dagens antrekk');
    expect(html).toContain('Lillian · 9 måneder · Utelek');
    expect(html).toContain('data-nuance="rain"');
    expect(html).toContain('BABYORA');
  });

  it('scanning: renders the ScanOverlay choreography + status block, not the ask screen', () => {
    mockedState = {
      phase: 'scanning',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} />);
    expect(html).toContain('aria-label="Beregner antrekk"');
    expect(html).toContain('Kler på Lillian i tankene…');
    expect(html).not.toContain('Klar for en liten tur?');
  });

  it('recalculating: renders the same choreography with the "på nytt" copy', () => {
    mockedState = {
      phase: 'recalculating',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'vogn', engineVersion: 'v' },
      lastResultKey: 'k',
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} activity="vogn" />);
    expect(html).toContain('Kler på Lillian på nytt…');
  });

  it('result-current: renders the compact WeatherStrip + a full numbered ResultSurface, no mascot', () => {
    mockedState = {
      phase: 'result-current',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
      resultKey: 'k',
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} />);
    expect(html).toContain('Dagens antrekk');
    expect(html).toContain('aria-label="Juster vær, sted eller aktivitet"');
    expect(html).toContain('Kle på, steg for steg');
    expect(html).not.toContain('hjm-mascot');
  });

  it('result-stale (recalc-failed): shows the "Beregn på nytt" affordance per the architecture note', () => {
    mockedState = {
      phase: 'result-stale',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
      lastResultKey: 'k',
      reason: 'recalc-failed',
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} />);
    expect(html).toContain('Fikk ikke beregnet antrekket');
    expect(html).toContain('Beregn på nytt');
  });

  it('result-stale (identity-changed): shows the contextual "Se antrekk for vogn" copy', () => {
    mockedState = {
      phase: 'result-stale',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'vogn', engineVersion: 'v' },
      lastResultKey: 'k',
      reason: 'identity-changed',
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} activity="vogn" />);
    expect(html).toContain('Nytt antrekk for vogn?');
    expect(html).toContain('Se antrekk for vogn');
  });

  it('offline ask screen: weather-ready + status=offline + no cached slot for today shows the calm offline notice', () => {
    mockedState = { phase: 'weather-ready' };
    mockedSlots = {};
    const props = baseProps();
    const html = renderToStaticMarkup(
      <HjemMonter {...props} weatherStatus="offline" now={null} />,
    );
    expect(html).toContain('Vi klarer oss med sist kjente vær');
    expect(html).toContain('Prøv å hente været igjen');
  });

  it('weather-ready stays the plain ask screen (not offline) once a cached slot exists for today, even if weather later goes offline', () => {
    mockedState = { phase: 'weather-ready' };
    const dateKey = localDateKey();
    mockedSlots = {
      'child-1': {
        identity: { childId: 'child-1', dateKey, placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
        resultKey: 'k', completedAt: Date.now(), scanPlayedInFullToday: true,
      },
    };
    const props = baseProps();
    const html = renderToStaticMarkup(<HjemMonter {...props} weatherStatus="offline" now={null} />);
    expect(html).not.toContain('Vi klarer oss med sist kjente vær');
    expect(html).toContain('Klar for en liten tur?');
  });

  it('weather-ready still shows the offline notice when the only cached slot is from a PREVIOUS day', () => {
    mockedState = { phase: 'weather-ready' };
    mockedSlots = {
      'child-1': {
        identity: { childId: 'child-1', dateKey: '2000-01-01', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
        resultKey: 'k', completedAt: 0, scanPlayedInFullToday: true,
      },
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps()} weatherStatus="offline" now={null} />);
    expect(html).toContain('Vi klarer oss med sist kjente vær');
  });

  it('P9 state-audit: weatherStatus="error" (hard network failure, nothing cached — useWeather has no other status to report) ALSO shows the offline notice + retry, not a permanent "Henter vær…" dead end', () => {
    mockedState = { phase: 'weather-ready' };
    mockedSlots = {};
    const html = renderToStaticMarkup(
      <HjemMonter {...baseProps()} weatherStatus="error" now={null} />,
    );
    expect(html).toContain('Vi klarer oss med sist kjente vær');
    expect(html).toContain('Prøv å hente været igjen');
  });
});

describe('HjemMonter — mutual-exclusion guard against outfit-transition, at the orchestrator level', () => {
  it('renders no scan choreography at all while the outfit-transition coordinator is playing', () => {
    mockedState = {
      phase: 'scanning',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
    };
    const html = renderToStaticMarkup(
      <HjemMonter {...baseProps()} outfitTransitionStatus="playing" />,
    );
    expect(html).not.toContain('aria-label="Beregner antrekk"');
    expect(html).not.toContain('Kler på Lillian');
  });

  it('renders no scan choreography while the outfit-transition coordinator is captured or ready either', () => {
    mockedState = {
      phase: 'scanning',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
    };
    expect(renderToStaticMarkup(<HjemMonter {...baseProps()} outfitTransitionStatus="captured" />))
      .not.toContain('aria-label="Beregner antrekk"');
    expect(renderToStaticMarkup(<HjemMonter {...baseProps()} outfitTransitionStatus="ready" />))
      .not.toContain('aria-label="Beregner antrekk"');
  });

  it('renders the scan choreography again once the transition settles', () => {
    mockedState = {
      phase: 'scanning',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
    };
    const html = renderToStaticMarkup(
      <HjemMonter {...baseProps()} outfitTransitionStatus="settled" />,
    );
    expect(html).toContain('aria-label="Beregner antrekk"');
  });
});

describe('HjemMonter — garment fallback without images', () => {
  it('the result list renders correctly (with vitrine placeholders where no image is mapped) even for an unusual recommendation', () => {
    mockedState = {
      phase: 'result-current',
      identity: { childId: 'child-1', dateKey: '2026-07-31', placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: 'v' },
      resultKey: 'k',
    };
    const recommendation = recommend(fixedInput({ activity: 'soevn', child: { ageMonths: 4, canRoll: false } }));
    const html = renderToStaticMarkup(
      <HjemMonter {...baseProps()} recommendation={recommendation} />,
    );
    expect(html).toContain('<ol');
    expect(html).toContain('hjm-thumb');
  });
});
