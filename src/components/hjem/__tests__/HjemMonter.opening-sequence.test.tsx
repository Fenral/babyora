/**
 * HjemMonter — P10/JOB1 opening-sequence wiring
 * (docs/design-notes/aapningssekvens-2026-08-01.md). Separate file from
 * HjemMonter.test.tsx so each test gets a clean module registry for the
 * per-boot ui-store slot (vitest isolates module state per FILE, not per
 * `it()` — see ui-store.test.ts's own header on why a reset hook exists
 * regardless). Same mocking convention as HjemMonter.test.tsx itself.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../lib/wool-layers/types.js';
import type { ScanCoordinatorState } from '../../../lib/scan/coordinator.js';
import type { ScanCacheSlot } from '../../../lib/scan/types.js';
import { localDateKey, WOOL_LAYERS_ENGINE_VERSION } from '../../../lib/scan/types.js';

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
    ...actual,
    useScanCache: (selector: (state: { slots: Record<string, ScanCacheSlot>; commitSlot: typeof commitSlot; hasPlayedFullScanEver: boolean }) => unknown) =>
      selector({ slots: mockedSlots, commitSlot, hasPlayedFullScanEver: false }),
  };
});

const { HjemMonter } = await import('../HjemMonter.js');
const { __resetOpeningBootSlotForTests, useUiStore } = await import('../../../state/ui-store.js');

function fixedInput(overrides: Partial<RecommendInput> = {}): RecommendInput {
  return {
    weather: {
      tempC: 4, feelsLikeC: 1, windMs: 3, precipMmH: 0.3, humidity: 80,
      symbolCode: 'lightrain', uvIndex: 0,
    },
    child: { ageMonths: 9, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
    ...overrides,
  };
}

function baseProps(reducedMotion: boolean) {
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
    reducedMotion,
    outfitTransitionStatus: 'idle' as const,
    onOpenAdjust: vi.fn(),
    onOpenWarmColdGuide: vi.fn(),
    onRetryWeather: vi.fn(),
    onOpenPlaggbib: vi.fn(),
  };
}

beforeEach(() => {
  mockedState = { phase: 'weather-ready' };
  mockedSlots = {};
  commitSlot.mockClear();
  for (const fn of Object.values(scanMethods)) fn.mockClear();
  __resetOpeningBootSlotForTests();
  useUiStore.setState({ hasSeenOpeningEver: false });
});
afterEach(() => {
  mockedSlots = {};
});

describe('HjemMonter — opening sequence: first-ever (fresh boot, no cache, motion allowed, never seen)', () => {
  it('renders the OpeningSequence layers and hides (not unmounts) MascotPeek', () => {
    const html = renderToStaticMarkup(<HjemMonter {...baseProps(false)} />);
    expect(html).toContain('class="hjm-opening-mascot-body"');
    expect(html).toContain('class="hjm-opening-mascot-hands"');
    expect(html).toContain('class="hjm-opening-edge-light"');
    expect(html).toContain('data-opening-hidden="true"');
    // The panel is wrapped so its lift can be driven by ref — WeatherScene itself is unaffected.
    expect(html).toContain('class="hjm-panel-lift-wrap"');
    expect(html).toContain('Klar for en liten tur?');
  });
});

describe('HjemMonter — opening sequence: reduced motion → exactly the normal tree, no sequence at all', () => {
  it('renders no opening layers, MascotPeek visible (not hidden)', () => {
    const html = renderToStaticMarkup(<HjemMonter {...baseProps(true)} />);
    expect(html).not.toContain('hjm-opening-mascot-body');
    expect(html).not.toContain('hjm-opening-mascot-hands');
    expect(html).not.toContain('hjm-opening-edge-light');
    expect(html).toContain('data-opening-hidden="false"');
    expect(html).toContain('Klar for en liten tur?');
  });
});

describe('HjemMonter — opening sequence: warm start (exact cache hit for today) → none, even on a never-before-seen device', () => {
  it('renders no opening layers even though hasSeenOpeningEver is false and motion is allowed', () => {
    const dateKey = localDateKey();
    mockedSlots = {
      'child-1': {
        // Must match HjemMonter's OWN computed identity EXACTLY (including
        // engineVersion) — getSlotForIdentity uses the full
        // sameScanIdentity comparison, unlike the offline-branch's looser
        // dateKey-only check HjemMonter.test.tsx's own cached-slot test
        // exercises.
        identity: { childId: 'child-1', dateKey, placeKey: 'place:63.430,10.390', activity: 'utelek', engineVersion: WOOL_LAYERS_ENGINE_VERSION },
        resultKey: 'k', completedAt: Date.now(), scanPlayedInFullToday: true,
      },
    };
    const html = renderToStaticMarkup(<HjemMonter {...baseProps(false)} />);
    expect(html).not.toContain('hjm-opening-mascot-body');
    expect(html).toContain('data-opening-hidden="false"');
  });
});

describe('HjemMonter — opening sequence: already seen once (persisted) → "cold" micro variant, not the full climb', () => {
  it('renders the layers (cold variant still shows both extra layers, just with a shorter/smaller motion — a timing difference, not structural)', () => {
    useUiStore.setState({ hasSeenOpeningEver: true });
    const html = renderToStaticMarkup(<HjemMonter {...baseProps(false)} />);
    expect(html).toContain('class="hjm-opening-mascot-body"');
    expect(html).toContain('data-opening-hidden="true"');
  });
});

describe('HjemMonter — opening sequence: per-boot dedup (never replays within the same boot)', () => {
  it('a second HjemMonter mount within the same boot (e.g. a tab-switch remount) gets NO sequence, even though every other condition would otherwise allow one', () => {
    const first = renderToStaticMarkup(<HjemMonter {...baseProps(false)} />);
    expect(first).toContain('hjm-opening-mascot-body');

    // Second mount, same boot (no reset in between) — the module-level slot is already claimed.
    const second = renderToStaticMarkup(<HjemMonter {...baseProps(false)} />);
    expect(second).not.toContain('hjm-opening-mascot-body');
    expect(second).toContain('data-opening-hidden="false"');
  });
});

describe('HjemMonter — end-state DOM equals the normal Hjem tree', () => {
  it('the "no sequence" render (reduced motion) is structurally IDENTICAL (mascot/panel wiring) to what completing a sequence hands off to — same MascotPeek, same panel-lift-wrap, both always mounted', () => {
    const html = renderToStaticMarkup(<HjemMonter {...baseProps(true)} />);
    // Exactly one mascot element, visible, at the same anchored markup MascotPeek always renders.
    expect(html.match(/class="hjm-mascot"/gu)?.length).toBe(1);
    expect(html).toContain('data-compact="false"');
    expect(html).toContain('data-opening-hidden="false"');
    // Exactly one panel section, wrapped by the (always-present, invisible) lift wrapper.
    expect(html.match(/class="hjm-panel"/gu)?.length).toBe(1);
  });
});
