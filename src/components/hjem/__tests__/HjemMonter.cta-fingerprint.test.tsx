/**
 * HjemMonter × eier-override v4 — fingerprintet er koblet til CTA-en.
 *
 * FØR denne endringen sa Hjem alltid «Finn dagens antrekk» og spilte alltid
 * 3,2 s, uansett om appen allerede holdt svaret. Hver `reveal`-forventning i
 * denne filen ville derfor ha strøket. Hver av dem har i tillegg en
 * FORUTSETNING i samme test eller rett ved siden av: den samme komponenten,
 * med tom cache, må fortsatt si «Finn dagens antrekk» — ellers ville testen
 * kunne bestått på at teksten var byttet ut overalt.
 *
 * Mockingen er den samme som HjemMonter.test.tsx bruker (og av samme grunn):
 * repoet har ingen jsdom, `renderToStaticMarkup` kjører aldri effekter, så
 * fase og cache settes direkte. Fingerprinten er derimot EKTE — den regnes ut
 * her med den samme `computeScanResultKey` komponenten selv bruker, av den
 * samme anbefalingen og det samme været som sendes inn som props. Hardkodet
 * nøkkelstreng ville ha bevist ingenting.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../lib/wool-layers/types.js';
import type { ScanCoordinatorState } from '../../../lib/scan/coordinator.js';
import type { ScanCacheSlot } from '../../../lib/scan/types.js';
import { localDateKey } from '../../../lib/scan/types.js';
import { computeScanResultKey } from '../../../lib/scan/result-key.js';
import {
  CTA_CEREMONY_LINE,
  CTA_REVEAL_LINE,
  rememberResultKey,
  resultKeyScope,
  sessionResultKeys,
} from '../cta-fingerprint.js';

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
const markFullScanPlayedEver = vi.fn();

vi.mock('../../../state/scan-cache-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../state/scan-cache-store.js')>();
  return {
    ...actual,
    useScanCache: (
      selector: (state: {
        slots: Record<string, ScanCacheSlot>;
        commitSlot: typeof commitSlot;
        markFullScanPlayedEver: typeof markFullScanPlayedEver;
      }) => unknown,
    ) => selector({ slots: mockedSlots, commitSlot, markFullScanPlayedEver }),
  };
});

const { HjemMonter } = await import('../HjemMonter.js');

const CHILD_ID = 'child-1';
const LAT = 63.43;
const LON = 10.39;
const NOW = {
  tempC: 1, feelsLikeC: -3, windMs: 4, windDir: 180, precipMmH: 0,
  symbolCode: 'partlycloudy_day', observedAt: new Date('2026-08-03T08:00:00Z'),
};

function recommendationFor(activity: RecommendInput['activity']) {
  return recommend({
    weather: {
      tempC: NOW.tempC, feelsLikeC: NOW.feelsLikeC, windMs: NOW.windMs,
      precipMmH: NOW.precipMmH, humidity: 78, symbolCode: NOW.symbolCode, uvIndex: 0,
    },
    child: { ageMonths: 9, canRoll: true },
    activity,
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
  });
}

/** Den EKTE nøkkelen komponenten selv vil regne ut for de samme propsene. */
function fingerprintFor(activity: RecommendInput['activity']): string {
  return computeScanResultKey(recommendationFor(activity), {
    tempC: NOW.tempC, feelsLikeC: NOW.feelsLikeC, windMs: NOW.windMs,
    precipMmH: NOW.precipMmH, symbolCode: NOW.symbolCode,
  });
}

function props(activity: 'utelek' | 'vogn' = 'utelek') {
  return {
    cityLabel: 'Trondheim',
    lat: LAT,
    lon: LON,
    now: NOW,
    weatherStatus: 'ready' as const,
    activity,
    onActivityChange: vi.fn(),
    childId: CHILD_ID,
    childName: 'Lillian',
    ageMonths: 9,
    recommendation: recommendationFor(activity),
    onStartDressing: vi.fn(),
    startDressingDisabled: false,
    reducedMotion: false,
    outfitTransitionStatus: 'idle' as const,
    onOpenAdjust: vi.fn(),
    onOpenWarmColdGuide: vi.fn(),
    onRetryWeather: vi.fn(),
    onOpenPlaggbib: vi.fn(),
  };
}

function slotWith(resultKey: string, activity: 'utelek' | 'vogn'): ScanCacheSlot {
  return {
    identity: {
      childId: CHILD_ID,
      dateKey: localDateKey(),
      placeKey: `place:${LAT.toFixed(3)},${LON.toFixed(3)}`,
      activity,
      engineVersion: '2026-07',
    },
    resultKey,
    completedAt: Date.now(),
    scanPlayedInFullToday: true,
  };
}

beforeEach(() => {
  mockedState = { phase: 'weather-ready' };
  mockedSlots = {};
  sessionResultKeys.clear();
  commitSlot.mockClear();
  markFullScanPlayedEver.mockClear();
  for (const fn of Object.values(scanMethods)) (fn as Mock).mockClear();
});
afterEach(() => {
  mockedSlots = {};
  sessionResultKeys.clear();
});

describe('Hjem-CTA-en leser fingerprintet FØR trykket', () => {
  it('tom cache → «Finn dagens antrekk», seremoni-linja og data-cta-path="ceremony"', () => {
    const html = renderToStaticMarkup(<HjemMonter {...props()} />);
    expect(html).toContain('Finn dagens antrekk');
    expect(html).toContain(CTA_CEREMONY_LINE);
    expect(html).toContain('data-cta-path="ceremony"');
    expect(html).not.toContain('Vis dagens antrekk');
  });

  it('persistert slot med NØYAKTIG dagens fingerprint → «Vis dagens antrekk» + reveal-linja', () => {
    const key = fingerprintFor('utelek');
    mockedSlots = { [CHILD_ID]: slotWith(key, 'utelek') };
    const html = renderToStaticMarkup(<HjemMonter {...props()} />);
    expect(html).toContain('Vis dagens antrekk');
    expect(html).toContain(CTA_REVEAL_LINE);
    expect(html).toContain('data-cta-path="reveal"');
    expect(html).not.toContain('Finn dagens antrekk');
  });

  it('slot fra en ANNEN aktivitet, men samme utfall → reveal (nøkkeloppslag, ikke identitets-oppslag)', () => {
    // Slotten ble beregnet for vogn; nøkkelen den bærer er likevel utelek sin
    // fingerprint — altså ble antrekket identisk, og det finnes ikke noe nytt
    // å vise fram. getSlotForIdentity ville ha forkastet denne slotten.
    const key = fingerprintFor('utelek');
    mockedSlots = { [CHILD_ID]: slotWith(key, 'vogn') };
    const html = renderToStaticMarkup(<HjemMonter {...props('utelek')} />);
    expect(html).toContain('Vis dagens antrekk');
  });

  it('slot med en ANNEN fingerprint → fortsatt seremoni (cachen får ikke lyve)', () => {
    const utelek = fingerprintFor('utelek');
    const vogn = fingerprintFor('vogn');
    expect(vogn).not.toBe(utelek); // FORUTSETNING: nøklene skiller faktisk
    mockedSlots = { [CHILD_ID]: slotWith(vogn, 'vogn') };
    const html = renderToStaticMarkup(<HjemMonter {...props('utelek')} />);
    expect(html).toContain('Finn dagens antrekk');
    expect(html).toContain('data-cta-path="ceremony"');
  });

  it('slot fra en TIDLIGERE dag teller ikke, selv om nøkkelen skulle være lik', () => {
    const key = fingerprintFor('utelek');
    mockedSlots = {
      [CHILD_ID]: { ...slotWith(key, 'utelek'), identity: { ...slotWith(key, 'utelek').identity, dateKey: '2000-01-01' } },
    };
    const html = renderToStaticMarkup(<HjemMonter {...props()} />);
    expect(html).toContain('Finn dagens antrekk');
  });

  it('nøkkel appen landet tidligere i økten (tom slot) → reveal — dette er «fram og tilbake»-tilfellet', () => {
    const key = fingerprintFor('utelek');
    // FORUTSETNING: uten øktminnet er nøyaktig samme render seremoni-veien.
    expect(renderToStaticMarkup(<HjemMonter {...props()} />)).toContain('data-cta-path="ceremony"');

    rememberResultKey(sessionResultKeys, resultKeyScope(CHILD_ID, localDateKey()), key);
    const html = renderToStaticMarkup(<HjemMonter {...props()} />);
    expect(html).toContain('Vis dagens antrekk');
    expect(html).toContain('data-cta-path="reveal"');
  });

  it('øktminnet for et ANNET barn smitter ikke over', () => {
    rememberResultKey(
      sessionResultKeys,
      resultKeyScope('et-annet-barn', localDateKey()),
      fingerprintFor('utelek'),
    );
    expect(renderToStaticMarkup(<HjemMonter {...props()} />)).toContain('Finn dagens antrekk');
  });

  it('offline-grenen bruker samme plan — ingen nøkkel uten vær, altså aldri et «Vis»-løfte', () => {
    const html = renderToStaticMarkup(
      <HjemMonter {...props()} weatherStatus="offline" now={null} />,
    );
    expect(html).toContain('Vi klarer oss med sist kjente vær');
    expect(html).toContain('Finn dagens antrekk');
    expect(html).toContain('data-cta-path="ceremony"');
  });

  it('stale-CTA-en merker hvilken vei den tar: «Beregn på nytt» er seremoni, «Se antrekk for …» er inline', () => {
    const identity = slotWith('k', 'utelek').identity;
    mockedState = { phase: 'result-stale', identity, lastResultKey: 'k', reason: 'weather-basis' };
    expect(renderToStaticMarkup(<HjemMonter {...props()} />)).toContain('data-cta-path="ceremony"');

    mockedState = { phase: 'result-stale', identity, lastResultKey: 'k', reason: 'identity-changed' };
    expect(renderToStaticMarkup(<HjemMonter {...props()} />)).toContain('data-cta-path="inline"');
  });
});

/**
 * Selve trykket er ikke observerbart uten jsdom (se filhodet). Veien det tar
 * er derimot lesbar i kilden, og den er kablet til NØYAKTIG samme `ctaPlan`
 * som `data-cta-path` over renders fra — så kjeden «hva står på knappen» →
 * «hva skjer når du trykker» er lukket i begge ender.
 */
describe('trykk-veien er kablet til den samme planen', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/components/hjem/HjemMonter.tsx'),
    'utf8',
  ).replace(/\r\n/gu, '\n');

  const tapHandler = source.slice(
    source.indexOf('const handleFindOutfitTap = useCallback'),
    source.indexOf('const handleStaleCtaTap'),
  );

  it('handleFindOutfitTap forgrener på ctaPlan.path og går rett til det cachede svaret ved reveal', () => {
    expect(tapHandler).toContain("if (ctaPlan.path === 'reveal') {");
    expect(tapHandler).toContain('revealCachedResult(resultKey);');
  });

  it('seremoni-veien er uendret: full 3,2 s-koreografi med haptikk-planen', () => {
    expect(tapHandler).toContain('runPreLandingHapticSchedule(fullScanHapticSchedule(FULL_SCAN_DURATION_MS));');
    expect(tapHandler).toContain('runTimer(FULL_SCAN_DURATION_MS, completeScan);');
  });

  const reveal = source.slice(
    source.indexOf('const revealCachedResult = useCallback'),
    source.indexOf('const handleFindOutfitTap'),
  );

  it('reveal-veien starter INGEN timer og INGEN avhukings-haptikk — det er hele poenget', () => {
    expect(reveal).not.toContain('runTimer(');
    expect(reveal).not.toContain('runPreLandingHapticSchedule(');
    expect(reveal).toContain('scan.scanCompleted(resultKey);');
  });

  it('reveal-veien setter isFresh(false) — et cachet svar skal stå der, ikke animere inn', () => {
    expect(reveal).toContain('setIsFresh(false);');
  });

  it('reveal-veien legger nøkkelen i minnet, slik at et bytte tilbake også treffer', () => {
    expect(reveal).toContain('rememberResultKey(sessionResultKeys, resultKeyMemoryScope, resultKey);');
  });

  it('Reduce Motion er URØRT: reveal-veien forgrener ikke på reducedMotion (den er allerede momentan)', () => {
    expect(reveal).not.toContain('reducedMotion');
    expect(tapHandler).not.toContain('reducedMotion');
    // runTimer eier fortsatt den ENE reduced-motion-regelen, uendret.
    expect(source).toContain('if (reducedMotion || durationMs <= 0) {');
  });

  it('«Beregn på nytt» går via planRecalc og kan spille full seremoni', () => {
    const staleHandler = source.slice(
      source.indexOf('const handleStaleCtaTap = useCallback'),
      source.indexOf('const handleSkip'),
    );
    expect(staleHandler).toContain('const plan = planRecalc(reason);');
    expect(staleHandler).toContain('runPreLandingHapticSchedule(fullScanHapticSchedule(plan.durationMs));');
    expect(staleHandler).toContain('runTimer(plan.durationMs, () => completeRecalc(true));');
    expect(staleHandler).toContain('runTimer(plan.durationMs, completeRecalc);');
  });

  it('skip-knappen står — uendret av v4', () => {
    expect(source).toContain('onSkip={handleSkip}');
  });

  it('ScanOverlay får lengden som FAKTISK kjører — en full omberegning skal ikke stoppe scanlinjen etter 220 ms', () => {
    expect(source).toContain('const totalDurationMs = isFullScan ? FULL_SCAN_DURATION_MS : recalcDurationMs;');
    expect(source).toContain('setRecalcDurationMs(plan.durationMs);');
    // …og inline justering setter den eksplisitt tilbake, så en tidligere
    // «Beregn på nytt» ikke etterlater 3,2 s på en 220 ms-omberegning.
    expect(source).toContain('setRecalcDurationMs(QUICK_RECALC_DURATION_MS);');
    expect(source).toContain('useState<number>(QUICK_RECALC_DURATION_MS)');
  });
});
