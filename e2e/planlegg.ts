import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  chromium,
  type Browser,
  type Frame,
  type Page,
  type Response,
} from 'playwright';
import * as ReactRuntime from 'react';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PLANLEGG_E2E_FIXTURES,
  type PlanleggE2EFixture,
} from './fixtures/planlegg.js';
import {
  validateReviewRecords,
  type CandidateSnapshot,
  type IndependentReviewReceipt,
  type ReviewCandidateRecord,
} from '../scripts/snart/review-gate.js';
import { validateClimateBundle } from '../scripts/snart/validate-climate-pack.js';

const PORT = 4191;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OWNED_PRODUCTION_ARTIFACT_PREFIX = 'babyora-planlegg-production-';
const VITE_MANIFEST_RELATIVE_PATH = '.vite/manifest.json';
const SNART_PRODUCTION_LAZY_ENTRIES = Object.freeze([
  'src/screens/UkeScreen.tsx',
  'src/screens/FamilieScreen.tsx',
] as const);
// eslint-disable-next-line no-control-regex -- A 7-bit ANSI CSI sequence starts with ESC.
const ANSI_CSI_SEQUENCE = /\u001B\[[0-?]*[ -/]*[@-~]/gu;
const SNART_BROWSER_PREWARM_IDENTIFIER = ['prewarm', 'Vite', 'Module', 'Graph'].join('');
const SNART_DYNAMIC_MODULE_PATH_IMPORT = /\breturn\s+import\s*\(\s*modulePath\s*\)/u;
const PLANLEGG_CASES = Object.freeze({
  ...PLANLEGG_E2E_FIXTURES,
  'semantic-rail': Object.freeze({
    id: 'planlegg-semantic-rail-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'exact-context': Object.freeze({
    id: 'planlegg-exact-context-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'automatic-location': Object.freeze({
    id: 'planlegg-automatic-location-v1',
    path: '/',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
    containment: PLANLEGG_E2E_FIXTURES['location-containment'].containment,
  }),
  'composition-primitives': Object.freeze({
    id: 'planlegg-composition-primitives-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  composition: Object.freeze({
    id: 'planlegg-composition-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'composition-matrix': Object.freeze({
    id: 'planlegg-composition-matrix-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  access: Object.freeze({
    id: 'planlegg-access-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'route-migration': Object.freeze({
    id: 'planlegg-route-migration-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  'native-polish': Object.freeze({
    id: 'planlegg-native-polish-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
  all: Object.freeze({
    id: 'planlegg-all-no-media-v1',
    path: '/?seed=demo',
    viewport: Object.freeze({ width: 390, height: 844 }),
    timeZone: 'Europe/Oslo',
  }),
}) satisfies Readonly<Record<string, PlanleggE2EFixture>>;
type PlanleggCase = keyof typeof PLANLEGG_CASES;
type ForecastMode =
  | 'zero'
  | 'one'
  | 'many'
  | 'partial'
  | 'today-only'
  | 'missing-tomorrow'
  | 'week-changes';
type ForecastDelivery = 'success' | 'pending' | 'error';
type ForecastState = {
  mode: ForecastMode;
  delivery?: ForecastDelivery;
  temperatureC?: number;
};
type ViteManifestChunk = Readonly<Record<string, unknown>>;
type ProductionArtifactAccess = Readonly<{
  requireFile: (relativePath: string) => void;
  readFile: (relativePath: string) => string;
}>;
type MainFrameNavigationObservation = Readonly<{
  url: string;
  status: number | null;
}>;

const SUPPORTED_CASES = Object.keys(PLANLEGG_CASES);
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const FIXED_NOW = new Date('2026-02-12T08:30:00.000Z');
const EXACT_CONTEXT_EXPECTED_GARMENTS = Object.freeze([
  'tykt ullsett',
  'tykke ullsokker',
  'ull-mellomlag',
  'vinterdress',
  'lue m/ ull',
  'tykke votter',
  'halsedisse',
]);
const EXACT_CONTEXT_EXPECTED_EQUIPMENT = Object.freeze([] as string[]);
const SNART_INIT_SCRIPT = String.raw`
(() => {
  const state = new URL(window.location.href).searchParams.get('snart-e2e') || 'plus';
  const fixedHome = state === 'unsupported'
    ? { city: 'Ukjent', lat: 60, lon: 11 }
    : { city: 'Oslo', lat: 59.9139, lon: 10.7522 };
  const automatic = state === 'automatic-b1'
    ? { mode: 'auto', place: { city: 'Bergen', lat: 60.3913, lon: 5.3221 } }
    : state === 'automatic-b2'
      ? { mode: 'auto', place: { city: 'Troms\u00f8', lat: 69.6492, lon: 18.9553 } }
      : undefined;
  window.__BABYORA_PLANLEGG_E2E__ = {
    testOnlySoonAvailability: true,
    entitlement: state === 'loading' ? 'loading' : state === 'free' ? 'free' : 'plus',
    fixedHome,
    automatic,
    climateProfile: state === 'invalid-hash' ? 'invalid-hash' : undefined,
    profileScope: state === 'profile-b' ? 'b' : 'a',
    windowLocalDate: state === 'emptyable'
      ? '2026-01-01'
      : state === 'retained'
        ? '2026-06-01'
        : state === 'window-b'
          ? '2026-02-13'
          : '2026-02-12',
  };
  const recordTransport = function (kind, payload) {
    window.__babyoraSoonTransport = window.__babyoraSoonTransport || [];
    window.__babyoraSoonTransport.push(kind + ':' + String(payload == null ? '' : payload));
  };
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    recordTransport('fetch', typeof input === 'string' ? input : input.toString());
    return nativeFetch(input, init);
  };
  const nativeBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = function (url, data) {
    recordTransport('beacon', String(url) + ':' + String(data == null ? '' : data));
    return nativeBeacon(url, data);
  };
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    recordTransport('xhr', String(method) + ':' + String(url));
    return nativeOpen.call(this, method, url, ...rest);
  };
})();
`;

type SnartHookSnapshot = Readonly<{
  testOnlySoonAvailability: true;
  entitlement: 'loading' | 'free' | 'plus';
  fixedHome: Readonly<{ city: string; lat: number; lon: number }>;
  automatic?: Readonly<{
    mode: 'auto';
    place: Readonly<{ city: string; lat: number; lon: number }>;
  }>;
  climateProfile?: 'invalid-hash';
  profileScope: 'a' | 'b';
  windowLocalDate: string;
}>;

type StatusNoticeState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; onRetry: () => void }>
  | Readonly<{ status: 'offline'; cachedAtIso: string; onRetry: () => void }>
  | Readonly<{ status: 'partial' }>
  | Readonly<{ status: 'ready' }>;

type ForecastRow = Readonly<{
  atIso: string;
  tempC: number;
  feelsLikeC: number;
  symbolCode: string;
}>;

async function assertCompositionPrimitives(): Promise<void> {
  const statusPath = join(process.cwd(), 'src/components/planning/PlanleggStatusNotice.tsx');
  const forecastPath = join(process.cwd(), 'src/components/planning/ForecastDisclosure.tsx');
  if (!existsSync(statusPath) || !existsSync(forecastPath)) {
    throw new Error(
      'RED_PLANLEGG_STATUS_FORECAST_CONTRACT: de rene status- og prognoseprimitivene mangler',
    );
  }

  (globalThis as typeof globalThis & { React?: typeof ReactRuntime }).React = ReactRuntime;
  const statusModule = await import(pathToFileURL(statusPath).href) as unknown as {
    PlanleggStatusNotice: ComponentType<{ state: StatusNoticeState }>;
  };
  const forecastModule = await import(pathToFileURL(forecastPath).href) as unknown as {
    ForecastDisclosure: ComponentType<{
      open: boolean;
      onToggle: () => void;
      rows: readonly ForecastRow[];
    }>;
  };
  const renderStatus = (state: StatusNoticeState) => renderToStaticMarkup(
    ReactRuntime.createElement(statusModule.PlanleggStatusNotice, { state }),
  );

  const loading = renderStatus({ status: 'loading' });
  if (
    !loading.includes('role="status"')
    || !loading.includes('aria-live="polite"')
    || !loading.includes('Henter dagens plan')
  ) {
    throw new Error('Loading-status mangler én høflig Planlegg-status eller eksakt copy');
  }
  const error = renderStatus({ status: 'error', onRetry: () => undefined });
  if (
    !error.includes('Vi fikk ikke oppdatert planen')
    || !error.includes('Prøv å hente planen')
    || !error.includes('<button')
  ) {
    throw new Error('No-cache-feil mangler sannferdig retry-presentasjon');
  }
  const offline = renderStatus({
    status: 'offline',
    cachedAtIso: '2026-02-12T08:00:00.000Z',
    onRetry: () => undefined,
  });
  if (!offline.includes('Du er frakoblet') || !offline.includes('09:00')) {
    throw new Error('Cached offline-status mangler Europe/Oslo-tid');
  }
  const partial = renderStatus({ status: 'partial' });
  if (!partial.includes('bare tidspunktene Babyora har værdata for')) {
    throw new Error('Partial-status mangler avgrenset evidenscopy');
  }
  if (renderStatus({ status: 'ready' }) !== '') {
    throw new Error('Ready-status skal ikke legge til en ekstra statusflate');
  }

  const closedForecast = renderToStaticMarkup(ReactRuntime.createElement(
    forecastModule.ForecastDisclosure,
    {
      open: false,
      onToggle: () => undefined,
      rows: [{
        atIso: '2026-02-12T09:00:00.000Z',
        tempC: -4,
        feelsLikeC: -7,
        symbolCode: 'fair_day',
      }],
    },
  ));
  if (
    !closedForecast.includes('Vis full værprognose')
    || !closedForecast.includes('aria-expanded="false"')
    || closedForecast.includes('Føles som')
  ) {
    throw new Error('Lukket prognose-disclosure er ikke kontrollert eller lekker rader');
  }

  const ukeSource = readFileSync(
    join(process.cwd(), 'src/screens/UkeScreen.tsx'),
    'utf8',
  );
  if (
    ukeSource.includes('buildPlanningRailRows(')
    || ukeSource.includes('preferredEventId: events[0]')
    || !ukeSource.includes('viewModel.rows')
    || !ukeSource.includes('viewModel.candidateEventIds')
    || !ukeSource.includes('viewModel.nextAction')
    || !ukeSource.includes('viewModel.verdict')
  ) {
    throw new Error(
      'RED_REVIEW_AGGREGATE_AUTHORITY: komposisjonen må konsumere modellens rader, kandidater, handling og verdict uten ekstern gjenberegning',
    );
  }
  if (
    !ukeSource.includes("resolvePlanningViewAccess('today'")
    || !ukeSource.includes("resolvePlanningViewAccess('week'")
    || !ukeSource.includes('const planCapability = viewAccess.capability')
  ) {
    throw new Error(
      'RED_REVIEW_FREE_TODAY_ACCESS: I dag må bruke today_home, mens bare Uke kan kreve future_plan',
    );
  }
  if (
    ukeSource.includes('key={requestKey}')
    || !/useWeather\(lat, lon, FALLBACK_REF_HOUR, refreshKey(?:,|\))/u.test(ukeSource)
  ) {
    throw new Error(
      'RED_REVIEW_IN_PLACE_REFRESH: retry må oppdatere vær i samme PlanleggData-instans slik at selection-repair faktisk kjøres',
    );
  }
  if (
    !ukeSource.includes('const latestPlanningEvaluationRef = useRef(planningEvaluation)')
    || !ukeSource.includes('latestPlanningEvaluationRef.current = planningEvaluation')
    || !ukeSource.includes('latestPlanningEvaluation.events')
    || !ukeSource.includes('latestPlanningEvaluation.contextsByEventId')
  ) {
    throw new Error(
      'RED_REVIEW_STALE_CALLBACK_FRESHNESS: beholdte callbacks må slå opp event og map fra siste evaluation ved kalltid',
    );
  }
  if (
    !ukeSource.includes('className="planlegg-screen ba-temp-root"')
    || !readFileSync(join(process.cwd(), 'src/screens/UkeScreen.css'), 'utf8')
      .includes('background: var(--bg-canvas)')
  ) {
    throw new Error(
      'RED_REVIEW_ACTIVE_TEMP_CANVAS: temperaturaksen må treffe den deklarerte token-roten og faktisk male canvas',
    );
  }
}

function parseCase(argv: readonly string[]): PlanleggCase {
  const inline = argv.find((value) => value.startsWith('--case='));
  const flagIndex = argv.indexOf('--case');
  const selected = inline?.slice('--case='.length)
    ?? (flagIndex >= 0 ? argv[flagIndex + 1] : undefined);

  if (!selected || !(selected in PLANLEGG_CASES)) {
    throw new Error(
      `Ukjent eller manglende --case ${selected ?? '(mangler)'}. Støttede case: ${SUPPORTED_CASES.join(', ')}`,
    );
  }
  return selected as PlanleggCase;
}

function fixtureTemperature(
  localHour: number,
  mode: ForecastMode,
  temperatureC?: number,
): number {
  if (temperatureC !== undefined) return temperatureC;
  if (mode === 'zero') return 4;
  if (mode === 'one') return localHour < 15 ? -8 : 14;
  if (localHour < 8) return -12;
  if (localHour < 12) return 1;
  if (localHour < 16) return 15;
  return -3;
}

function buildForecast(mode: ForecastMode, temperatureC?: number): unknown {
  const start = Date.parse('2026-02-11T23:00:00.000Z');
  const timeseries = Array.from({ length: 72 }, (_, index) => {
    const instant = new Date(start + index * 60 * 60 * 1000);
    const dayOffset = Math.floor(index / 24);
    const localHour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Oslo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(instant));
    const raining = mode === 'many' && localHour >= 12 && localHour < 15;
    return {
      time: instant.toISOString(),
      data: {
        instant: {
          details: {
            air_temperature: mode === 'week-changes'
              ? [-12, 2, 15][dayOffset % 3]!
              : fixtureTemperature(localHour, mode, temperatureC),
            wind_speed: mode === 'many' && localHour >= 16 ? 6 : 2,
            wind_from_direction: 180,
            relative_humidity: 72,
            cloud_area_fraction: raining ? 95 : 35,
          },
        },
        next_1_hours: {
          summary: { symbol_code: raining ? 'rain' : 'fair_day' },
          details: { precipitation_amount: raining ? 2 : 0 },
        },
      },
    };
  }).filter((_point, index) => (
    (mode !== 'partial' || index % 3 === 0)
    && (mode !== 'today-only' || index < 24)
    && (
      mode !== 'missing-tomorrow'
      || new Date(start + index * 60 * 60 * 1000).toLocaleDateString('en-CA', {
        timeZone: 'Europe/Oslo',
      }) !== '2026-02-13'
    )
  ));
  return {
    properties: {
      meta: {
        updated_at: '2026-02-12T08:00:00.000Z',
        units: {
          air_temperature: 'celsius',
          wind_speed: 'm/s',
          wind_from_direction: 'degrees',
          relative_humidity: '%',
          cloud_area_fraction: '%',
          precipitation_amount: 'mm',
        },
      },
      timeseries,
    },
  };
}

function parseRgb(value: string): readonly [number, number, number] {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(value.trim());
  if (hex) {
    return [
      Number.parseInt(hex[1]!, 16),
      Number.parseInt(hex[2]!, 16),
      Number.parseInt(hex[3]!, 16),
    ];
  }
  const channels = value.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Ukjent rgb: ${value}`);
  return channels as [number, number, number];
}

function relativeLuminance([red, green, blue]: readonly [number, number, number]): number {
  const linear = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function hasOwnedViteUrlSignal(output: readonly string[]): boolean {
  const serverLog = output.join('').replace(ANSI_CSI_SEQUENCE, '');
  return new RegExp(
    `Local:\\s+http://127\\.0\\.0\\.1:${PORT}/`,
    'u',
  ).test(serverLog);
}

function assertOwnedViteUrlSignalParser(): void {
  const sgrWrappedLocalUrl = [
    '\u001B[1m\u001B[32m➜\u001B[39m\u001B[22m  '
    + '\u001B[1mLocal\u001B[22m:   '
    + '\u001B[36mhttp://127.0.0.1:4191/\u001B[39m\r\n',
  ];
  const foreignOrNonMatchingOutput = [
    ['\u001B[1mLocal\u001B[22m: http://192.0.2.10:4191/\r\n'],
    ['\u001B[1mLocal\u001B[22m: http://127.0.0.1:4192/\r\n'],
    ['Network: http://127.0.0.1:4191/\r\n'],
  ];
  if (!hasOwnedViteUrlSignal(sgrWrappedLocalUrl)) {
    throw new Error('Vite ownership parser rejected its SGR-wrapped local URL');
  }
  if (foreignOrNonMatchingOutput.some(hasOwnedViteUrlSignal)) {
    throw new Error('Vite ownership parser accepted a foreign or non-matching URL');
  }
}

async function waitForServer(
  url: string,
  server: ChildProcess,
  output: readonly string[],
  timeoutMs = 30_000,
): Promise<void> {
  let spawnError: Error | null = null;
  server.once('error', (error) => {
    spawnError = error;
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Preview-prosessen avsluttet før oppstart med kode ${server.exitCode}`);
    }
    const ownedReady = hasOwnedViteUrlSignal(output);
    if (ownedReady) {
      try {
        const response = await fetch(url);
        if (
          response.ok
          && server.exitCode === null
          && server.signalCode === null
        ) {
          console.log(`PLANLEGG OWNED SERVER READY: pid=${server.pid ?? 'unknown'} url=${url}`);
          return;
        }
      } catch {
        // Den eide Vite-prosessen har annonsert URL-en, men svarer ikke ennå.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (output.length > 0) console.error(`PLANLEGG SERVER LOG:\n${output.join('')}`);
  throw new Error(`Preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
}

function requireOwnedProductionArtifactRoot(artifactRoot: string): string {
  const resolvedRoot = resolve(artifactRoot);
  const relativeToTemp = relative(resolve(tmpdir()), resolvedRoot).replaceAll('\\', '/');
  if (
    isAbsolute(relativeToTemp)
    || relativeToTemp === '..'
    || relativeToTemp.startsWith('../')
    || !basename(resolvedRoot).startsWith(OWNED_PRODUCTION_ARTIFACT_PREFIX)
  ) {
    throw new Error(`Refusing unsafe production-artifact path: ${resolvedRoot}`);
  }
  return resolvedRoot;
}

function removeOwnedProductionArtifact(artifactRoot: string): void {
  const resolvedRoot = requireOwnedProductionArtifactRoot(artifactRoot);
  rmSync(resolvedRoot, { recursive: true, force: true });
  if (existsSync(resolvedRoot)) {
    throw new Error(`Owned production artifact still exists after cleanup: ${resolvedRoot}`);
  }
  console.log(`PLANLEGG PRODUCTION ARTIFACT REMOVED: ${resolvedRoot}`);
}

function buildOwnedSnartProductionArtifact(): string {
  const artifactRoot = mkdtempSync(
    join(tmpdir(), OWNED_PRODUCTION_ARTIFACT_PREFIX),
  );
  try {
    const output = execFileSync(
      process.execPath,
      [
        VITE_CLI,
        'build',
        '--manifest',
        '--outDir',
        artifactRoot,
        '--emptyOutDir',
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env, VITE_PLANLEGG_E2E: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    console.log(
      `PLANLEGG OWNED PRODUCTION BUILD READY: outDir=${artifactRoot} `
      + `logBytes=${Buffer.byteLength(output)}`,
    );
    return artifactRoot;
  } catch (error) {
    let cleanupError = '';
    try {
      removeOwnedProductionArtifact(artifactRoot);
    } catch (cleanupFailure) {
      cleanupError = ` cleanup=${cleanupFailure instanceof Error
        ? cleanupFailure.message
        : String(cleanupFailure)}`;
    }
    throw new Error(
      `Owned Snart production build failed:${cleanupError} `
      + `${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function createProductionArtifactAccess(
  artifactRoot: string,
): ProductionArtifactAccess {
  const resolvedRoot = requireOwnedProductionArtifactRoot(artifactRoot);
  const requireFile = (relativePath: string): string => {
    if (!relativePath || isAbsolute(relativePath)) {
      throw new Error(`Production manifest contains an unsafe file path: ${relativePath}`);
    }
    const absolutePath = resolve(resolvedRoot, relativePath);
    const relativePathFromRoot = relative(resolvedRoot, absolutePath).replaceAll('\\', '/');
    if (
      relativePathFromRoot === '..'
      || relativePathFromRoot.startsWith('../')
      || isAbsolute(relativePathFromRoot)
      || !existsSync(absolutePath)
      || !statSync(absolutePath).isFile()
    ) {
      throw new Error(`Production manifest references a missing or unsafe file: ${relativePath}`);
    }
    return absolutePath;
  };
  return {
    requireFile: (relativePath) => {
      requireFile(relativePath);
    },
    readFile: (relativePath) => readFileSync(requireFile(relativePath), 'utf8'),
  };
}

function requireViteManifestChunk(
  manifest: Readonly<Record<string, unknown>>,
  key: string,
): ViteManifestChunk {
  const chunk = manifest[key];
  if (!chunk || typeof chunk !== 'object' || Array.isArray(chunk)) {
    throw new Error(`Production manifest is missing chunk ${key}`);
  }
  return chunk as ViteManifestChunk;
}

function readManifestStringArray(
  chunk: ViteManifestChunk,
  field: string,
  key: string,
): readonly string[] {
  const value = chunk[field];
  if (value === undefined) return [];
  if (
    !Array.isArray(value)
    || value.some((item) => typeof item !== 'string' || item.length === 0)
  ) {
    throw new Error(`Production manifest ${key}.${field} must be a string array`);
  }
  return value as string[];
}

function validateOwnedProductionManifest(
  manifestValue: unknown,
  artifacts: ProductionArtifactAccess,
): readonly string[] {
  if (!manifestValue || typeof manifestValue !== 'object' || Array.isArray(manifestValue)) {
    throw new Error('Production manifest must be an object');
  }
  const manifest = manifestValue as Readonly<Record<string, unknown>>;
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visited.has(key)) return;
    const chunk = requireViteManifestChunk(manifest, key);
    const file = chunk.file;
    if (typeof file !== 'string' || file.length === 0) {
      throw new Error(`Production manifest ${key}.file must be a non-empty string`);
    }
    visited.add(key);
    artifacts.requireFile(file);
    for (const field of ['css', 'assets'] as const) {
      for (const referencedFile of readManifestStringArray(chunk, field, key)) {
        artifacts.requireFile(referencedFile);
      }
    }
    for (const field of ['imports', 'dynamicImports'] as const) {
      for (const referencedChunk of readManifestStringArray(chunk, field, key)) {
        visit(referencedChunk);
      }
    }
  };

  for (const sourcePath of SNART_PRODUCTION_LAZY_ENTRIES) {
    const entry = requireViteManifestChunk(manifest, sourcePath);
    if (entry.src !== sourcePath || entry.isDynamicEntry !== true) {
      throw new Error(`Production manifest did not emit lazy entry ${sourcePath}`);
    }
    visit(sourcePath);
  }

  const familyEntry = requireViteManifestChunk(
    manifest,
    'src/screens/FamilieScreen.tsx',
  );
  if (typeof familyEntry.file !== 'string') {
    throw new Error('Production Familie chunk lacks its emitted file');
  }
  const familyChunk = artifacts.readFile(familyEntry.file);
  if (!familyChunk.includes('Bytt barn') || !familyChunk.includes('Innstillinger')) {
    throw new Error('Production Familie chunk did not compile the Innstillinger graph');
  }
  return [...visited].sort();
}

function assertProductionManifestValidator(): void {
  const manifestFixture = {
    'src/screens/UkeScreen.tsx': {
      file: 'assets/uke.js',
      src: 'src/screens/UkeScreen.tsx',
      isDynamicEntry: true,
      imports: ['_shared.js'],
    },
    'src/screens/FamilieScreen.tsx': {
      file: 'assets/familie.js',
      src: 'src/screens/FamilieScreen.tsx',
      isDynamicEntry: true,
      imports: ['_shared.js'],
    },
    '_shared.js': { file: 'assets/shared.js' },
  };
  const files = new Map([
    ['assets/uke.js', 'uke'],
    ['assets/familie.js', 'Bytt barn Innstillinger'],
    ['assets/shared.js', 'shared'],
  ]);
  const access = (availableFiles: ReadonlyMap<string, string>): ProductionArtifactAccess => ({
    requireFile: (path) => {
      if (!availableFiles.has(path)) throw new Error(`missing fixture file ${path}`);
    },
    readFile: (path) => {
      const value = availableFiles.get(path);
      if (value === undefined) throw new Error(`missing fixture file ${path}`);
      return value;
    },
  });
  const verified = validateOwnedProductionManifest(manifestFixture, access(files));
  if (
    !verified.includes('src/screens/UkeScreen.tsx')
    || !verified.includes('src/screens/FamilieScreen.tsx')
    || !verified.includes('_shared.js')
  ) {
    throw new Error('Production manifest fixture did not traverse its lazy chunk graph');
  }
  const missingReference = new Map(files);
  missingReference.delete('assets/shared.js');
  let rejectedMissingReference = false;
  try {
    validateOwnedProductionManifest(manifestFixture, access(missingReference));
  } catch {
    rejectedMissingReference = true;
  }
  if (!rejectedMissingReference) {
    throw new Error('Production manifest fixture accepted a missing referenced file');
  }
}

function requireOwnedProductionManifest(
  artifactRoot: string,
  server: ChildProcess,
  output: readonly string[],
): void {
  if (server.exitCode !== null || server.signalCode !== null) {
    throw new Error('Owned preview stopped before production-manifest readiness');
  }
  try {
    const artifacts = createProductionArtifactAccess(artifactRoot);
    const manifest = JSON.parse(artifacts.readFile(VITE_MANIFEST_RELATIVE_PATH)) as unknown;
    const verified = validateOwnedProductionManifest(manifest, artifacts);
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error('Owned preview stopped during production-manifest validation');
    }
    console.log(
      `PLANLEGG OWNED MANIFEST READY: pid=${server.pid ?? 'unknown'} `
      + `lazy=${SNART_PRODUCTION_LAZY_ENTRIES.join(',')} files=${verified.length} `
      + 'innstillinger=true',
    );
  } catch (error) {
    if (output.length > 0) console.error(`PLANLEGG SERVER LOG:\n${output.join('')}`);
    throw new Error(
      `Owned production-manifest readiness failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

async function waitForExit(server: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (server.exitCode !== null || server.signalCode !== null) return true;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    server.once('exit', onExit);
  });
}

async function waitForPortRelease(url: string, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Preview-port ${PORT} ble ikke frigitt innen ${timeoutMs} ms`);
}

async function stopPreviewServer(server: ChildProcess): Promise<void> {
  if (server.exitCode === null && server.signalCode === null) {
    server.kill();
    if (!(await waitForExit(server, 5_000))) {
      server.kill('SIGKILL');
      if (!(await waitForExit(server, 5_000))) {
        throw new Error('Preview-prosessen avsluttet ikke etter tvungen terminering');
      }
    }
  }
  await waitForPortRelease(BASE_URL);
  console.log(`PLANLEGG PREVIEW STOPPED: port=${PORT}`);
}

function collectFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/i.test(message.text())) {
      failures.push(`console.error: ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    const navigationAbortedImage = request.resourceType() === 'image'
      && request.failure()?.errorText === 'net::ERR_ABORTED';
    if (
      request.resourceType() !== 'font'
      && !navigationAbortedImage
      && !/\/api\/forecast|met\.no|fonts\.gstatic\.com/i.test(request.url())
    ) {
      failures.push(
        `requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !/\/api\/forecast/.test(response.url())) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

function createMainFrameNavigationCounter() {
  const observations: MainFrameNavigationObservation[] = [];
  return {
    record: (url: string, status: number | null) => {
      observations.push({ url, status });
    },
    snapshot: () => ({
      count: observations.length,
      observations: observations.map((observation) => ({ ...observation })),
    }),
  };
}

function assertMainFrameNavigationCounter(): void {
  const counter = createMainFrameNavigationCounter();
  if (counter.snapshot().count !== 0) {
    throw new Error('Main-frame navigation counter did not start empty');
  }
  counter.record('http://127.0.0.1:4191/?unexpected=reload', 200);
  const observed = counter.snapshot();
  if (
    observed.count !== 1
    || observed.observations[0]?.url !== 'http://127.0.0.1:4191/?unexpected=reload'
    || observed.observations[0]?.status !== 200
  ) {
    throw new Error('Main-frame navigation counter lost URL or status evidence');
  }
}

function createStageMainFrameNavigationGuard(
  page: Page,
  stage: string,
  browserSignals: readonly string[],
  serverOutput: readonly string[],
) {
  const counter = createMainFrameNavigationCounter();
  const navigationStatuses = new Map<string, number>();
  let observedFailure: Error | null = null;
  let rejectUnexpectedNavigation: (error: Error) => void = () => undefined;
  const unexpectedNavigation = new Promise<never>((_resolve, reject) => {
    rejectUnexpectedNavigation = reject;
  });
  const failureFor = (
    observation: MainFrameNavigationObservation,
    count: number,
  ) => new Error(
    `Unexpected main-frame navigation during ${stage}: count=${count} `
    + `url=${observation.url} status=${observation.status ?? 'unavailable'}\n`
    + `browserSignals=${browserSignals.slice(-20).join('\n') || '(none)'}\n`
    + `serverOutput=${
      serverOutput.join('').replace(ANSI_CSI_SEQUENCE, '').slice(-4_000) || '(none)'
    }`,
  );
  const onResponse = (response: Response) => {
    const request = response.request();
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigationStatuses.set(response.url(), response.status());
    }
  };
  const onFrameNavigated = (frame: Frame) => {
    if (frame !== page.mainFrame()) return;
    const observation = {
      url: frame.url(),
      status: navigationStatuses.get(frame.url()) ?? null,
    };
    counter.record(observation.url, observation.status);
    const count = counter.snapshot().count;
    observedFailure = failureFor(observation, count);
    rejectUnexpectedNavigation(observedFailure);
  };
  page.on('response', onResponse);
  page.on('framenavigated', onFrameNavigated);
  return {
    unexpectedNavigation,
    assertNoUnexpectedNavigation: () => {
      if (observedFailure) throw observedFailure;
      const snapshot = counter.snapshot();
      if (snapshot.count !== 0) {
        const observation = snapshot.observations[snapshot.observations.length - 1]!;
        throw failureFor(observation, snapshot.count);
      }
    },
    dispose: () => {
      page.off('response', onResponse);
      page.off('framenavigated', onFrameNavigated);
    },
  };
}

async function installDeterministicPage(
  page: Page,
  forecastState: ForecastState,
  configuredNativeFixture = false,
): Promise<void> {
  await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(() => {
    const params = new URL(window.location.href).searchParams;
    const isPremium = params.get('access') !== 'free';
    localStorage.setItem('babyora.subscription', JSON.stringify({
      state: { isPremium, lastSyncedAt: 1 },
      version: 0,
    }));
  });
  if (configuredNativeFixture) {
    await page.addInitScript({
      content: `
        (() => {
          if (new URL(window.location.href).searchParams.get('runtime') === 'web') {
            return;
          }
          const customerInfo = (premium) => ({
            customerInfo: {
              entitlements: {
                active: premium ? { premium: { identifier: 'premium' } } : {},
              },
            },
          });
          let premium = false;
          let pending = false;
          let initialized = false;
          const resolvers = [];
          const initialize = () => {
            if (initialized) return;
            const fixture = new URL(window.location.href).searchParams.get('entitlement');
            premium = fixture === 'plus';
            pending = fixture === 'loading';
            initialized = true;
          };
          window.addEventListener('planlegg:e2e-entitlement-begin', () => {
            initialize();
            pending = true;
          });
          window.addEventListener('planlegg:e2e-entitlement-settle', (event) => {
            initialized = true;
            premium = event.detail;
            pending = false;
            const result = customerInfo(premium);
            for (const resolve of resolvers.splice(0)) resolve(result);
          });
          window.CapacitorCustomPlatform = { name: 'android' };
          window.Capacitor = {
            PluginHeaders: [{
              name: 'Purchases',
              methods: [
                'setLogLevel',
                'configure',
                'getCustomerInfo',
                'getOfferings',
                'purchasePackage',
                'restorePurchases',
              ].map((name) => ({ name, rtype: 'promise' })),
            }],
            nativePromise: (_plugin, method) => {
              if (method === 'getCustomerInfo') {
                initialize();
                if (pending) {
                  return new Promise((resolve) => resolvers.push(resolve));
                }
                return Promise.resolve(customerInfo(premium));
              }
              if (method === 'getOfferings') {
                return Promise.resolve({ current: null });
              }
              if (method === 'restorePurchases') {
                premium = true;
                return Promise.resolve(customerInfo(true));
              }
              return Promise.resolve({});
            },
          };
        })();
      `,
    });
  }
  await page.route('**/api/forecast?**', async (route) => {
    while (forecastState.delivery === 'pending') {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    if (forecastState.delivery === 'error') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'deterministic forecast failure' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildForecast(
        forecastState.mode,
        forecastState.temperatureC,
      )),
    });
  });
}

type LocationContainmentCounters = Readonly<{
  permission: number;
  geolocation: number;
  geocode: number;
  forecast: number;
}>;

async function installLocationContainmentPage(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const containment = fixture.containment;
  if (!containment) throw new Error('location-containment-fixturen mangler lagringskontrakt');
  const fixedForecast = buildForecast('many');

  await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(
    ({ stored, forecast }) => {
      const counters = { permission: 0, geolocation: 0, geocode: 0, forecast: 0 };
      Object.defineProperty(window, '__locationContainmentCounters', {
        configurable: false,
        value: counters,
      });
      localStorage.setItem('babyora:children:v2', stored.childrenStorageRaw);
      localStorage.setItem('babyora:activeChildId:v2', stored.activeChildId);
      localStorage.setItem('babyora.location-pref', stored.locationPrefStorageRaw);
      localStorage.setItem(stored.forecastCacheKey, JSON.stringify({
        version: 1,
        fetchedAt: stored.forecastFetchedAt,
        data: forecast,
      }));
      localStorage.setItem('babyora.subscription', JSON.stringify({
        state: { isPremium: false, lastSyncedAt: 1 },
        version: 0,
      }));

      if (navigator.permissions) {
        const query = window.Function(
          'counters',
          'return function query() { counters.permission += 1; return Promise.resolve({ state: "granted", onchange: null }); };',
        )(counters) as Permissions['query'];
        Object.defineProperty(navigator, 'permissions', {
          configurable: true,
          value: { query },
        });
      }
      const getCurrentPosition = window.Function(
        'counters',
        'return function getCurrentPosition() { counters.geolocation += 1; };',
      )(counters) as Geolocation['getCurrentPosition'];
      const watchPosition = window.Function(
        'counters',
        'return function watchPosition() { counters.geolocation += 1; return 1; };',
      )(counters) as Geolocation['watchPosition'];
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition,
          watchPosition,
          clearWatch: window.Function('return function clearWatch() {};')(),
        },
      });
    },
    { stored: containment, forecast: fixedForecast },
  );
  await page.route('**/api/forecast?**', async (route) => {
    await page.evaluate(() => {
      const target = window as typeof window & {
        __locationContainmentCounters: { forecast: number };
      };
      target.__locationContainmentCounters.forecast += 1;
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixedForecast),
    });
  });
  await page.route(/nominatim\.openstreetmap\.org\/(?:reverse|search)/u, async (route) => {
    await page.evaluate(() => {
      const target = window as typeof window & {
        __locationContainmentCounters: { geocode: number };
      };
      target.__locationContainmentCounters.geocode += 1;
    });
    await route.fulfill({ status: 500, body: 'unexpected geocode' });
  });
}

async function readLocationContainmentCounters(page: Page): Promise<LocationContainmentCounters> {
  return page.evaluate(() => {
    const target = window as typeof window & {
      __locationContainmentCounters: LocationContainmentCounters;
    };
    return { ...target.__locationContainmentCounters };
  });
}

async function runLocationContainment(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const containment = fixture.containment;
  if (!containment) throw new Error('location-containment-fixturen mangler lagringskontrakt');
  const failures = collectFailures(page);

  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('navigation').first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(50);
  const startupCounters = await readLocationContainmentCounters(page);
  if (Object.values(startupCounters).some((count) => count !== 0)) {
    throw new Error(`Lagret auto utførte I/O ved startup/resume: ${JSON.stringify(startupCounters)}`);
  }

  await page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Familie/u })
    .click();
  const autoSwitch = page.getByRole('switch', { name: 'Bruk posisjon automatisk' });
  await autoSwitch.waitFor({ state: 'visible', timeout: 15_000 });
  if (await autoSwitch.getAttribute('aria-checked') !== 'true') {
    throw new Error('Stored auto må kunne slås av selv om implementasjonen er utilgjengelig');
  }
  const automaticLocationGroup = page.getByRole('group', {
    name: 'Bruk posisjon automatisk — på, men utilgjengelig',
  });
  if (
    await automaticLocationGroup.getByText('Posisjon brukes ikke', { exact: true }).count() !== 1
    || await automaticLocationGroup.getByText('Henter vær der du er', { exact: true }).count() !== 0
  ) {
    throw new Error('Stored auto må beskrive den effektive, utilgjengelige runtime-tilstanden');
  }
  await autoSwitch.click();
  if (
    await autoSwitch.getAttribute('aria-checked') !== 'false'
    || await page.evaluate(() => JSON.parse(localStorage.getItem('babyora.location-pref') ?? '{}')
      ?.state?.mode) !== 'manual'
  ) {
    throw new Error('Auto-til-manual off må forbli ubetinget');
  }

  await autoSwitch.click();
  if (await page.getByRole('dialog', { name: 'Bruk posisjon automatisk' }).count() !== 0) {
    throw new Error('Blokkert manual-to-auto må ikke åpne permission-dialogen');
  }
  const hiddenConfirm = page.locator(
    'dialog[aria-labelledby="auto-location-title"] button[aria-label^="Tillat posisjon"]',
  );
  if (await hiddenConfirm.count() !== 1) {
    throw new Error('Containment-caset fant ikke den monterte confirm-handleren');
  }
  await hiddenConfirm.evaluate((button) => (button as HTMLButtonElement).click());
  await page.waitForTimeout(50);

  const finalState = await page.evaluate(() => ({
    mode: JSON.parse(localStorage.getItem('babyora.location-pref') ?? '{}')?.state?.mode,
    childBytes: localStorage.getItem('babyora:children:v2'),
  }));
  const finalCounters = await readLocationContainmentCounters(page);
  if (
    finalState.mode !== 'manual'
    || finalState.childBytes !== containment.childrenStorageRaw
    || Object.values(finalCounters).some((count) => count !== 0)
  ) {
    throw new Error(`Containment avvek: ${JSON.stringify({
      mode: finalState.mode,
      childBytesEqual: finalState.childBytes === containment.childrenStorageRaw,
      counters: finalCounters,
    })}`);
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
  console.log(
    `LOCATION CONTAINMENT: counters=${JSON.stringify(finalCounters)} childBytesEqual=true mode=manual media=none`,
  );
}

async function installAutomaticLocationPage(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const containment = fixture.containment;
  if (!containment) throw new Error('automatic-location-fixturen mangler lagringskontrakt');
  const fixedForecast = buildForecast('week-changes');
  await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(
    ({ stored, forecast }) => {
      const counters = { permission: 0, geolocation: 0, geocode: 0, forecast: 0 };
      const positions = [
        { lat: 59.9139, lon: 10.7522 },
        { lat: 60.3913, lon: 5.3221 },
        { lat: 59.9139, lon: 10.7522 },
        { lat: 60.3913, lon: 5.3221 },
        { lat: 59.9139, lon: 10.7522 },
        { lat: 60.3913, lon: 5.3221 },
        { lat: 59.9139, lon: 10.7522 },
        { lat: 60.3913, lon: 5.3221 },
      ];
      Object.defineProperty(window, '__locationContainmentCounters', {
        configurable: false,
        value: counters,
      });
      const children = JSON.parse(stored.childrenStorageRaw);
      children.push({
        ...children[0],
        id: 'containment-child-2',
        name: 'Oskar Test',
        city: 'Andreheim',
        lat: 62.4722,
        lon: 6.1495,
      });
      if (!localStorage.getItem('babyora:children:v2')) {
        localStorage.setItem('babyora:children:v2', JSON.stringify(children));
      }
      if (!localStorage.getItem('babyora:activeChildId:v2')) {
        localStorage.setItem('babyora:activeChildId:v2', stored.activeChildId);
      }
      if (!localStorage.getItem('babyora.location-pref')) {
        localStorage.setItem('babyora.location-pref', JSON.stringify({
          state: { mode: 'manual', automaticPlace: null, generation: 0 },
          version: 0,
        }));
      }
      if (!localStorage.getItem(stored.forecastCacheKey)) {
        localStorage.setItem(stored.forecastCacheKey, JSON.stringify({
          version: 1,
          fetchedAt: stored.forecastFetchedAt,
          data: forecast,
        }));
      }
      if (!localStorage.getItem('babyora.subscription')) {
        localStorage.setItem('babyora.subscription', JSON.stringify({
          state: { isPremium: true, lastSyncedAt: 1 },
          version: 0,
        }));
      }
      Object.defineProperty(window, '__holdAutoLocation', {
        configurable: true,
        writable: true,
        value: false,
      });
      Object.defineProperty(window, '__pendingAutoLocations', {
        configurable: false,
        value: [],
      });
      const getCurrentPosition = window.Function(
        'counters',
        'positions',
        `return function getCurrentPosition(success) {
          var index = Math.min(counters.geolocation, positions.length - 1);
          var position = positions[index];
          counters.geolocation += 1;
          var deliver = function deliver() {
            success({
              coords: {
                latitude: position.lat,
                longitude: position.lon,
                accuracy: 5,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          };
          if (window.__holdAutoLocation) {
            window.__pendingAutoLocations.push(deliver);
          } else {
            deliver();
          }
        };`,
      )(counters, positions) as Geolocation['getCurrentPosition'];
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition,
          watchPosition: window.Function('return function watchPosition() { return 1; };')(),
          clearWatch: window.Function('return function clearWatch() {};')(),
        },
      });
    },
    { stored: containment, forecast: buildForecast('many') },
  );
  await page.route('**/api/forecast?**', async (route) => {
    await page.evaluate(() => {
      const target = window as typeof window & {
        __locationContainmentCounters: { forecast: number };
      };
      target.__locationContainmentCounters.forecast += 1;
    });
    const requestUrl = new URL(route.request().url());
    const latitude = Number(requestUrl.searchParams.get('lat'));
    const locationForecast = latitude < 60
      ? buildForecast('week-changes')
      : fixedForecast;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(locationForecast),
    });
  });
  await page.route(/nominatim\.openstreetmap\.org\/reverse/u, async (route) => {
    const url = new URL(route.request().url());
    const lat = Number(url.searchParams.get('lat'));
    const city = lat < 60 ? 'Oslo' : 'Bergen';
    await page.evaluate(() => {
      const target = window as typeof window & {
        __locationContainmentCounters: { geocode: number };
      };
      target.__locationContainmentCounters.geocode += 1;
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lat: String(lat),
        lon: url.searchParams.get('lon'),
        display_name: city,
        address: { city },
      }),
    });
  });
}

async function runAutomaticLocation(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const containment = fixture.containment;
  if (!containment) throw new Error('automatic-location-fixturen mangler lagringskontrakt');
  const failures = collectFailures(page);
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  const navigation = page.getByRole('navigation').first();
  await navigation.waitFor({ state: 'visible', timeout: 15_000 });
  const startup = await readLocationContainmentCounters(page);
  const startupStorage = await page.evaluate(() => Object.fromEntries(
    Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)]),
  ));
  const seededChildBytes = startupStorage['babyora:children:v2'];
  if (startup.geolocation !== 0 || startup.geocode !== 0) {
    throw new Error(`Manual startup utførte lokasjons-I/O: ${JSON.stringify(startup)}`);
  }

  await navigation.getByRole('button', { name: /^Familie/u }).click();
  const autoSwitch = page.getByRole('switch', { name: 'Bruk posisjon automatisk' });
  await autoSwitch.waitFor({ state: 'visible', timeout: 15_000 });
  if (await autoSwitch.getAttribute('aria-checked') !== 'false') {
    throw new Error('Manual-fixturen startet ikke med auto av');
  }
  await page.evaluate(() => {
    (window as typeof window & { __holdAutoLocation: boolean }).__holdAutoLocation = true;
  });
  await autoSwitch.click();
  const cancelledDialog = page.getByRole('dialog', { name: 'Bruk posisjon automatisk' });
  await cancelledDialog.waitFor({ state: 'visible', timeout: 15_000 });
  await cancelledDialog.getByRole('button', { name: /^Tillat posisjon/u }).click();
  await page.waitForFunction(() => (
    (window as typeof window & {
      __locationContainmentCounters: LocationContainmentCounters;
    }).__locationContainmentCounters.geolocation === 1
  ));
  await page.keyboard.press('Escape');
  await cancelledDialog.waitFor({ state: 'detached', timeout: 15_000 });
  await page.evaluate(() => {
    const target = window as typeof window & {
      __holdAutoLocation: boolean;
      __pendingAutoLocations: Array<() => void>;
    };
    target.__holdAutoLocation = false;
    target.__pendingAutoLocations.splice(0).forEach((deliver) => deliver());
  });
  await page.waitForTimeout(50);
  const cancelled = await readLocationContainmentCounters(page);
  if (
    cancelled.geolocation !== 1
    || cancelled.geocode !== 0
    || await autoSwitch.getAttribute('aria-checked') !== 'false'
  ) {
    throw new Error(`Avbrutt aktivering fullførte arbeid: ${JSON.stringify(cancelled)}`);
  }

  await page.evaluate(() => {
    (window as typeof window & { __holdAutoLocation: boolean }).__holdAutoLocation = true;
  });
  await autoSwitch.click();
  const unmountedDialog = page.getByRole('dialog', { name: 'Bruk posisjon automatisk' });
  await unmountedDialog.waitFor({ state: 'visible', timeout: 15_000 });
  await unmountedDialog.getByRole('button', { name: /^Tillat posisjon/u }).click();
  await page.waitForFunction(() => (
    (window as typeof window & {
      __locationContainmentCounters: LocationContainmentCounters;
    }).__locationContainmentCounters.geolocation === 2
  ));
  await navigation.getByRole('button', { name: /^Hjem/u })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await unmountedDialog.waitFor({ state: 'detached', timeout: 15_000 });
  await page.evaluate(() => {
    const target = window as typeof window & {
      __holdAutoLocation: boolean;
      __pendingAutoLocations: Array<() => void>;
    };
    target.__holdAutoLocation = false;
    target.__pendingAutoLocations.splice(0).forEach((deliver) => deliver());
  });
  await page.waitForTimeout(50);
  const unmounted = await readLocationContainmentCounters(page);
  const unmountedMode = await page.evaluate(() => (
    JSON.parse(localStorage.getItem('babyora.location-pref') ?? '{}')?.state?.mode
  ));
  if (
    unmounted.geolocation !== 2
    || unmounted.geocode !== 0
    || unmountedMode !== 'manual'
  ) {
    throw new Error(`Avmontert Settings fullførte aktivering: ${JSON.stringify(unmounted)}`);
  }
  await navigation.getByRole('button', { name: /^Familie/u }).click();
  await autoSwitch.waitFor({ state: 'visible', timeout: 15_000 });

  await page.evaluate(() => {
    (window as typeof window & { __holdAutoLocation: boolean }).__holdAutoLocation = true;
  });
  await autoSwitch.click();
  const permissionDialog = page.getByRole('dialog', { name: 'Bruk posisjon automatisk' });
  await permissionDialog.waitFor({ state: 'visible', timeout: 15_000 });
  await permissionDialog.getByRole('button', { name: /^Tillat posisjon/u }).click();
  await page.waitForFunction(() => (
    (window as typeof window & {
      __locationContainmentCounters: LocationContainmentCounters;
    }).__locationContainmentCounters.geolocation === 3
  ));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(50);
  const activationResume = await readLocationContainmentCounters(page);
  if (activationResume.geolocation !== 3 || activationResume.geocode !== 0) {
    throw new Error(`Resume dupliserte pågående Settings-aktivering: ${
      JSON.stringify(activationResume)
    }`);
  }
  await page.evaluate(() => {
    const target = window as typeof window & {
      __holdAutoLocation: boolean;
      __pendingAutoLocations: Array<() => void>;
    };
    target.__holdAutoLocation = false;
    target.__pendingAutoLocations.splice(0).forEach((deliver) => deliver());
  });
  await permissionDialog.waitFor({ state: 'detached', timeout: 15_000 });
  try {
    await page.waitForFunction(() => (
      JSON.parse(localStorage.getItem('babyora.location-pref') ?? '{}')?.state?.mode === 'auto'
    ), undefined, { timeout: 5_000 });
  } catch {
    const activationState = await page.evaluate(() => ({
      pref: localStorage.getItem('babyora.location-pref'),
      counters: (window as typeof window & {
        __locationContainmentCounters: LocationContainmentCounters;
      }).__locationContainmentCounters,
    }));
    throw new Error(`Aktivering ble ikke lagret som auto: ${JSON.stringify({
      ...activationState,
      failures,
    })}`);
  }
  const activated = await readLocationContainmentCounters(page);
  if (activated.geolocation !== 3 || activated.geocode !== 1) {
    throw new Error(`Eksplisitt aktivering var ikke én stabil suksess: ${JSON.stringify(activated)}`);
  }

  const storageAfterActivation = await page.evaluate(() => ({
    childBytes: localStorage.getItem('babyora:children:v2'),
    locationKeys: Object.keys(localStorage)
      .filter((key) => key.startsWith('nominatim:'))
      .sort(),
  }));
  if (
    storageAfterActivation.childBytes !== seededChildBytes
    || storageAfterActivation.locationKeys.length !== 0
  ) {
    throw new Error(`Auto-posisjon lekket til varig lagring: ${JSON.stringify({
      childBytesEqual: storageAfterActivation.childBytes === seededChildBytes,
      locationKeys: storageAfterActivation.locationKeys,
    })}`);
  }

  await navigation.getByRole('button', { name: /^Hjem/u }).click();
  await page.getByText('Nåværende sted · Oslo', { exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });
  const currentCta = page.getByRole('button', { name: 'Se dagens antrekk' });
  await currentCta.waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.includes('Se dagens antrekk'));
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await currentCta.click();
  const currentDialog = page.getByRole('dialog', { name: 'Mina Test' });
  await currentDialog.waitFor({ state: 'visible', timeout: 15_000 });
  const situation = currentDialog.locator('section[aria-label="Dagens situasjon"]');
  const currentSituationBeforeRefresh = await situation.innerText();
  const currentGarmentsBeforeRefresh = await currentDialog
    .locator('section[aria-labelledby="planned-garments-title"]')
    .innerText();
  const currentWhyBeforeRefresh = await currentDialog
    .locator('section[aria-labelledby="planned-why-title"]')
    .innerText();
  if (!currentSituationBeforeRefresh.includes('Nåværende sted · Oslo · Utelek')) {
    throw new Error(`Dagens Outfit mistet eksakt Oslo-kontekst: ${currentSituationBeforeRefresh}`);
  }

  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(() => (
    (window as typeof window & {
      __locationContainmentCounters: LocationContainmentCounters;
    }).__locationContainmentCounters.geolocation === 4
  ));
  await page.waitForTimeout(50);
  if (
    await situation.innerText() !== currentSituationBeforeRefresh
    || await currentDialog.locator('section[aria-labelledby="planned-garments-title"]')
      .innerText() !== currentGarmentsBeforeRefresh
    || await currentDialog.locator('section[aria-labelledby="planned-why-title"]')
      .innerText() !== currentWhyBeforeRefresh
  ) {
    throw new Error('Åpent dagens Outfit fikk endret sted, vær eller anbefaling');
  }
  await currentDialog.getByRole('button', { name: 'Lukk dagens antrekk' }).click();
  await currentDialog.waitFor({ state: 'detached' });
  try {
    await page.waitForFunction(() => (
      document.activeElement?.id === 'hjem-current-outfit-trigger'
    ), undefined, { timeout: 2_000 });
  } catch {
    throw new Error('Dagens Outfit returnerte ikke fokus til åpneren');
  }
  await page.getByText('Nåværende sted · Bergen', { exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });

  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.getByText('Nåværende sted · Oslo', { exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });
  await navigation.getByRole('button', { name: /^Planlegg/u }).click();
  const weekRadio = page.getByRole('radio', { name: 'Uke', exact: true });
  await weekRadio.waitFor({ state: 'visible', timeout: 15_000 });
  await weekRadio.evaluate((radio) => (radio as HTMLInputElement).click());
  const futureRail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await futureRail.waitFor({ state: 'visible', timeout: 15_000 });
  let futureOutfit = futureRail.getByRole('button', { name: 'Se hele antrekket' }).first();
  if (await futureOutfit.count() === 0) {
    const disclosure = futureRail.locator('button[aria-expanded]').first();
    try {
      await disclosure.waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      const diagnostic = await page.evaluate(() => ({
        rail: document.querySelector('[aria-label="Antrekksendringer gjennom dagen"]')?.textContent,
        counters: (window as typeof window & {
          __locationContainmentCounters: LocationContainmentCounters;
        }).__locationContainmentCounters,
      }));
      throw new Error(`Fremtidig Outfit manglet endringsrad: ${JSON.stringify(diagnostic)}`);
    }
    await disclosure.evaluate((button) => (button as HTMLButtonElement).click());
    futureOutfit = futureRail.getByRole('button', { name: 'Se hele antrekket' }).first();
  }
  await futureOutfit.waitFor({ state: 'visible', timeout: 15_000 });
  await futureOutfit.click();
  const futureDialog = page.getByRole('dialog', { name: 'Mina Test' });
  await futureDialog.waitFor({ state: 'visible', timeout: 15_000 });
  const futureSituation = futureDialog.locator('section[aria-label="Planlagt situasjon"]');
  const futureSituationBeforeRefresh = await futureSituation.innerText();
  const futureGarmentsBeforeRefresh = await futureDialog
    .locator('section[aria-labelledby="planned-garments-title"]')
    .innerText();
  const futureWhyBeforeRefresh = await futureDialog
    .locator('section[aria-labelledby="planned-why-title"]')
    .innerText();
  if (!futureSituationBeforeRefresh.includes('Nåværende sted · Oslo · Utelek')) {
    throw new Error('Fremtidig Outfit manglet automatisk Oslo-kontekst');
  }
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  try {
    await page.waitForFunction(() => (
      (window as typeof window & {
        __locationContainmentCounters: LocationContainmentCounters;
      }).__locationContainmentCounters.geolocation === 6
    ), undefined, { timeout: 5_000 });
  } catch {
    throw new Error(
      `Fremtidig Outfit utløste ikke én resume: ${
        JSON.stringify(await readLocationContainmentCounters(page))
      }`,
    );
  }
  await page.waitForTimeout(50);
  if (
    await futureSituation.innerText() !== futureSituationBeforeRefresh
    || await futureDialog.locator('section[aria-labelledby="planned-garments-title"]')
      .innerText() !== futureGarmentsBeforeRefresh
    || await futureDialog.locator('section[aria-labelledby="planned-why-title"]')
      .innerText() !== futureWhyBeforeRefresh
  ) {
    throw new Error('Åpent fremtidig Outfit fikk endret sted, vær eller anbefaling');
  }
  await futureDialog.getByRole('button', { name: 'Lukk planlagt antrekk' }).click();
  await futureDialog.waitFor({ state: 'detached' });

  await navigation.getByRole('button', { name: /^Familie/u }).click();
  await page.evaluate(() => {
    (window as typeof window & { __holdAutoLocation: boolean }).__holdAutoLocation = true;
  });
  const childSwitchButton = page.getByRole('button', { name: 'Bytt barn — 2 barn' });
  await childSwitchButton.waitFor({ state: 'visible', timeout: 15_000 });
  await childSwitchButton.click();
  let childDialog = page.getByRole('dialog', { name: 'Bytt barn' });
  await childDialog.getByRole('radio', { name: 'Bytt til Oskar Test' }).click();
  await childDialog.waitFor({ state: 'detached' });
  try {
    await page.waitForFunction(() => (
      (window as typeof window & {
        __locationContainmentCounters: LocationContainmentCounters;
      }).__locationContainmentCounters.geolocation === 7
    ), undefined, { timeout: 5_000 });
  } catch {
    throw new Error(`Første barn-bytte startet ikke location: ${
      JSON.stringify(await readLocationContainmentCounters(page))
    }`);
  }
  await childSwitchButton.click();
  childDialog = page.getByRole('dialog', { name: 'Bytt barn' });
  await childDialog.getByRole('radio', { name: 'Bytt til Mina Test' }).click();
  await childDialog.waitFor({ state: 'detached' });
  try {
    await page.waitForFunction(() => (
      (window as typeof window & {
        __locationContainmentCounters: LocationContainmentCounters;
      }).__locationContainmentCounters.geolocation === 8
    ), undefined, { timeout: 5_000 });
  } catch {
    throw new Error(`Andre barn-bytte startet ikke location: ${
      JSON.stringify(await readLocationContainmentCounters(page))
    }`);
  }
  await page.evaluate(() => {
    const target = window as typeof window & {
      __holdAutoLocation: boolean;
      __pendingAutoLocations: Array<() => void>;
    };
    target.__holdAutoLocation = false;
    target.__pendingAutoLocations.splice(0).forEach((deliver) => deliver());
  });
  await navigation.getByRole('button', { name: /^Hjem/u }).click();
  await page.getByText('Nåværende sted · Bergen', { exact: true })
    .waitFor({ state: 'visible', timeout: 5_000 });
  if ((await readLocationContainmentCounters(page)).geocode !== 2) {
    throw new Error('Barn-bytte omgikk den øktbundne reverse-geocode-cachen');
  }
  if (
    await page.evaluate(() => localStorage.getItem('babyora:activeChildId:v2'))
      !== containment.activeChildId
  ) {
    throw new Error('Barn-bytte gjenopprettet ikke det opprinnelige aktive barnet');
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('navigation').first()
    .waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByText('Nåværende sted · Oslo', { exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });
  const reloadCounters = await readLocationContainmentCounters(page);
  if (reloadCounters.geolocation !== 1 || reloadCounters.geocode !== 1) {
    throw new Error(`Reload gjenbrukte eller dupliserte automatisk sted: ${JSON.stringify(reloadCounters)}`);
  }
  await page.getByRole('navigation').first()
    .getByRole('button', { name: /^Familie/u })
    .click();
  const switchAfterContexts = page.getByRole('switch', { name: 'Bruk posisjon automatisk' });
  await switchAfterContexts.waitFor({ state: 'visible', timeout: 15_000 });
  const premiumBytes = startupStorage['babyora.subscription'];
  await page.evaluate((bytes) => {
    localStorage.setItem('babyora.subscription', JSON.stringify({
      state: { isPremium: false, lastSyncedAt: 2 },
      version: 0,
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'babyora.subscription',
      newValue: localStorage.getItem('babyora.subscription'),
    }));
    void bytes;
  }, premiumBytes);
  const unavailableGroup = page.getByRole('group', {
    name: 'Bruk posisjon automatisk — på, men utilgjengelig',
  });
  await unavailableGroup.getByText('Posisjon brukes ikke', { exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });
  const callsBeforeOff = await readLocationContainmentCounters(page);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(50);
  const callsAfterDowngrade = await readLocationContainmentCounters(page);
  if (
    callsAfterDowngrade.geolocation !== callsBeforeOff.geolocation
    || callsAfterDowngrade.geocode !== callsBeforeOff.geocode
  ) {
    throw new Error('Nedgradering tillot senere location-I/O');
  }
  await switchAfterContexts.click();
  if (await switchAfterContexts.getAttribute('aria-checked') !== 'false') {
    throw new Error('Auto kunne ikke slås av etter aktivering');
  }
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(50);
  const callsAfterOff = await readLocationContainmentCounters(page);
  if (
    callsAfterOff.geolocation !== callsBeforeOff.geolocation
    || callsAfterOff.geocode !== callsBeforeOff.geocode
  ) {
    throw new Error('Manual off tillot senere location-I/O');
  }
  await page.evaluate((bytes) => {
    if (bytes === null) localStorage.removeItem('babyora.subscription');
    else localStorage.setItem('babyora.subscription', bytes);
  }, premiumBytes);

  const finalState = await page.evaluate(() => ({
    childBytes: localStorage.getItem('babyora:children:v2'),
    forbiddenKeys: Object.keys(localStorage)
      .filter((key) => key.startsWith('nominatim:'))
      .sort(),
  }));
  if (
    finalState.childBytes !== seededChildBytes
    || finalState.forbiddenKeys.length !== 0
  ) {
    throw new Error('Posisjonsoppdatering endret fast hjem eller skrev geokode-cache');
  }
  const finalStorage = await page.evaluate(() => Object.fromEntries(
    Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)]),
  ));
  for (const [key, value] of Object.entries(startupStorage)) {
    if (key === 'babyora.location-pref' || key === 'babyora:activeChildId:v2') continue;
    if (finalStorage[key] !== value) {
      throw new Error(`Automatisk flyt endret varig byteinnhold for ${key}`);
    }
  }
  const newPersistentKeys = Object.keys(finalStorage)
    .filter((key) => !(key in startupStorage))
    .filter((key) => key !== 'babyora.location-pref');
  if (newPersistentKeys.length > 0) {
    throw new Error(`Automatisk flyt opprettet nye storage-nøkler: ${newPersistentKeys.join(', ')}`);
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
  console.log(
    `AUTOMATIC LOCATION: counters=${JSON.stringify(await readLocationContainmentCounters(page))} childBytesEqual=true media=none`,
  );
}

async function enterPlanlegg(page: Page): Promise<void> {
  const planButton = page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Planlegg/u });
  await planButton.waitFor({ state: 'visible', timeout: 15_000 });
  await planButton.click();
  await page.getByRole('heading', { level: 1, name: 'Planlegg', exact: true })
    .waitFor({ state: 'attached', timeout: 15_000 });
}

async function openPlanlegg(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await enterPlanlegg(page);
}

async function startLiveRegionTrace(page: Page): Promise<void> {
  await page.evaluate(() => {
    const tracedWindow = window as typeof window & {
      __planleggLiveTrace?: string[];
      __planleggLiveObserver?: MutationObserver;
    };
    tracedWindow.__planleggLiveObserver?.disconnect();
    tracedWindow.__planleggLiveTrace = [];
    const initialText = document
      .querySelector<HTMLElement>('[role="status"][aria-live="polite"]')
      ?.innerText.replace(/\s+/gu, ' ').trim();
    if (initialText) tracedWindow.__planleggLiveTrace.push(initialText);
    const owner = document.querySelector<HTMLElement>('.planlegg-screen');
    if (!owner) throw new Error('Planlegg-roten mangler for live-sporing');
    const record = window.Function(`
      const tracedWindow = window;
      const text = document
        .querySelector('[role="status"][aria-live="polite"]')
        ?.innerText.replace(/\\s+/gu, ' ').trim();
      if (!text) return;
      const trace = tracedWindow.__planleggLiveTrace;
      if (trace.at(-1) !== text) trace.push(text);
    `) as MutationCallback;
    tracedWindow.__planleggLiveObserver = new MutationObserver(record);
    tracedWindow.__planleggLiveObserver.observe(owner, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
}

async function readLiveRegionTrace(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => {
    const tracedWindow = window as typeof window & { __planleggLiveTrace?: string[] };
    return [...(tracedWindow.__planleggLiveTrace ?? [])];
  });
}

async function reloadPlanlegg(
  page: Page,
  path: string,
  forecastState: ForecastState,
  mode: ForecastMode,
): Promise<void> {
  forecastState.mode = mode;
  forecastState.delivery = 'success';
  forecastState.temperatureC = undefined;
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('metno:')) localStorage.removeItem(key);
    }
  });
  await openPlanlegg(page, path);
}

async function assertSingleMain(page: Page): Promise<void> {
  const main = page.locator('main');
  await main.waitFor({ state: 'visible', timeout: 15_000 });
  const mainCount = await main.count();
  if (mainCount !== 1) {
    throw new Error(`Forventet nøyaktig ett app-eid main-landemerke, fant ${mainCount}`);
  }
}

async function runHarness(page: Page, fixture: PlanleggE2EFixture): Promise<void> {
  const failures = collectFailures(page);
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });

  await assertSingleMain(page);
  const navigation = page.getByRole('navigation').first();
  await navigation.waitFor({ state: 'visible', timeout: 15_000 });
  for (const label of ['Hjem', 'Planlegg', 'Guide', 'Familie']) {
    const item = navigation.getByRole('button', { name: new RegExp(`^${label}`) });
    await item.waitFor({ state: 'visible', timeout: 10_000 });
  }

  await page.waitForTimeout(250);
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

async function runRouteMigration(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const failures = collectFailures(page);
  await page.addInitScript(() => {
    localStorage.setItem('babyora.subscription', JSON.stringify({
      state: { isPremium: true, lastSyncedAt: 1 },
      version: 0,
    }));
    localStorage.setItem(
      'babyora:vinterprogram:start',
      String(Date.now() - (8 * 7 * 24 * 60 * 60 * 1000)),
    );
    (window as Window & { __BABYORA_PLANLEGG_E2E__?: unknown })
      .__BABYORA_PLANLEGG_E2E__ = {
        testOnlySoonAvailability: true,
        entitlement: 'plus',
        fixedHome: { city: 'Oslo', lat: 59.9139, lon: 10.7522 },
      };
  });

  const guideButton = page.getByRole('navigation').first().getByRole('button', {
    name: /^Guide/u,
  });
  const planButton = page.getByRole('navigation').first().getByRole('button', {
    name: /^Planlegg/u,
  });
  const openGuide = async () => {
    await guideButton.click();
    await page.getByRole('heading', { name: 'Guide', exact: true }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  };
  const assertSnartRequest = async () => {
    const soon = page.getByRole('radio', { name: 'Snart', exact: true });
    await soon.waitFor({ state: 'visible', timeout: 15_000 });
    if (!(await soon.isChecked())) {
      throw new Error('Snart-dispatcheren valgte ikke Snart-visningen');
    }
    await page.locator('.snart-plan').waitFor({ state: 'visible', timeout: 15_000 });
    if (await page.locator('main#main').evaluate((element) => document.activeElement === element) !== true) {
      throw new Error('Snart-ruten flyttet ikke fokus til Appens main-landemerke');
    }
  };

  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  await openGuide();
  await page.getByRole('button', {
    name: 'Forbered deg på sesongen — Se historiske månedsnormaler for stedet ditt',
    exact: true,
  }).click();
  await assertSnartRequest();

  await page.getByRole('radio', { name: 'I dag', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.getByRole('navigation').first().getByRole('button', { name: /^Hjem/u }).click();
  await planButton.click();
  if (!(await page.getByRole('radio', { name: 'I dag', exact: true }).isChecked())) {
      throw new Error('En konsumert Snart-request ble spilt av på nytt etter rootbytte');
  }

  await openGuide();
  await page.getByRole('button', { name: /Første vinter/u }).click();
  await page.getByRole('button', { name: /Uke 8: Forbered neste periode/u }).click();
  await page.getByRole('button', { name: 'Se historiske månedsnormaler', exact: true }).click();
  await assertSnartRequest();

  if (await page.getByText(/Min garderobe|Mine plagg/u).count() !== 0) {
    throw new Error('Route-migreringen etterlot synlig garderobeløfte');
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

async function runComposition(
  page: Page,
  fixture: PlanleggE2EFixture,
): Promise<void> {
  const failures = collectFailures(page);
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Planlegg/u })
    .click();
  await assertSingleMain(page);

  const screen = page.locator('section.planlegg-screen[aria-labelledby="planlegg-title"]');
  await screen.waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined);
  if (await screen.count() !== 1) {
    throw new Error(
      'RED_PLANLEGG_COMPOSITION_CONTRACT: Planlegg mangler én naturlig section under appens main',
    );
  }
  await screen.getByRole('heading', { level: 1, name: 'Planlegg', exact: true }).waitFor();
  const context = screen.locator('.planlegg-screen__context');
  if (!/Lillian\s*·.*Trondheim/u.test(await context.innerText())) {
    throw new Error(`Synlig barn-/stedskontekst avvek: ${await context.innerText()}`);
  }
  const radios = screen.getByRole('radio');
  if (
    await radios.count() !== 3
    || await screen.getByRole('radio', { name: 'I dag', exact: true }).count() !== 1
    || await screen.getByRole('radio', { name: 'Uke', exact: true }).count() !== 1
    || await screen.getByRole('radio', { name: 'Snart', exact: true }).count() !== 1
  ) {
    throw new Error('Planlegg skal ha én native I dag/Uke/Snart-kontroll');
  }

  const answer = screen.locator('.planlegg-screen__answer');
  const rail = screen.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  const forecast = screen.getByRole('button', { name: 'Vis full værprognose' });
  await answer.waitFor({ state: 'visible', timeout: 15_000 });
  await rail.waitFor({ state: 'visible', timeout: 15_000 });
  await forecast.waitFor({ state: 'visible', timeout: 15_000 });
  const ordered = await screen.locator(
    '.planlegg-screen__header, .planlegg-screen__views, .planlegg-screen__answer, .planlegg-screen__rail, .planlegg-forecast',
  ).evaluateAll((elements) => elements.map((element) => element.className));
  if (
    ordered.length !== 5
    || !String(ordered[0]).includes('header')
    || !String(ordered[1]).includes('views')
    || !String(ordered[2]).includes('answer')
    || !String(ordered[3]).includes('rail')
    || !String(ordered[4]).includes('forecast')
  ) {
    throw new Error(`Planlegg-hierarkiet avvek: ${ordered.join(' > ')}`);
  }

  const obsolete = [
    'Time for time',
    '10 dager fremover',
    'Se forslag for',
    'Varsler',
    'Velg sted',
  ];
  const screenText = await screen.innerText();
  for (const copy of obsolete) {
    if (screenText.includes(copy)) throw new Error(`Foreldet Planlegg-copy står igjen: ${copy}`);
  }
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    screen: document.querySelector<HTMLElement>('.planlegg-screen')!
      .scrollWidth - document.querySelector<HTMLElement>('.planlegg-screen')!.clientWidth,
  }));
  if (overflow.document > 0 || overflow.screen > 0) {
    throw new Error(`Horisontal overflow: ${JSON.stringify(overflow)}`);
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

async function runSemanticRail(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: ForecastState,
): Promise<void> {
  const failures = collectFailures(page);

  await openPlanlegg(page, fixture.path);
  await assertSingleMain(page);
  let rail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await rail.waitFor({ state: 'visible', timeout: 15_000 });
  if (await rail.locator(':scope > li').count() !== 1) {
    throw new Error('Zero-event rail skal ha nøyaktig én statisk li');
  }
  if (await rail.getByRole('button').count() !== 0) {
    throw new Error('Zero-event rail skal være ikke-interaktiv');
  }
  await rail.getByText('Samme antrekk i de vurderte tidspunktene').waitFor();

  await reloadPlanlegg(page, fixture.path, forecastState, 'one');
  rail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await rail.waitFor({ state: 'visible', timeout: 15_000 });
  const oneDisclosure = rail.locator('button[aria-expanded]');
  if (await oneDisclosure.count() !== 1) {
    throw new Error(`One-event rail skal ha én disclosure, fant ${await oneDisclosure.count()}`);
  }

  await reloadPlanlegg(page, fixture.path, forecastState, 'many');
  rail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await rail.waitFor({ state: 'visible', timeout: 15_000 });
  const directTags = await rail.locator(':scope > *').evaluateAll(
    (elements) => elements.map((element) => element.tagName),
  );
  if (directTags.some((tag) => tag !== 'LI')) {
    throw new Error(`Rail har direkte barn som ikke er li: ${directTags.join(', ')}`);
  }

  const disclosures = rail.locator('button[aria-expanded]');
  const disclosureCount = await disclosures.count();
  if (disclosureCount < 2) {
    throw new Error(`Many-event rail trenger minst to disclosures, fant ${disclosureCount}`);
  }
  for (let index = 0; index < disclosureCount; index++) {
    const disclosure = disclosures.nth(index);
    const box = await disclosure.boundingBox();
    if (!box || box.height < 44 || box.width < 44) {
      throw new Error(`Disclosure ${index} bryter 44px-målet`);
    }
    if (!(await disclosure.locator('time').getAttribute('datetime'))) {
      throw new Error(`Disclosure ${index} mangler datetime`);
    }
    const marker = disclosure.locator('[data-marker-shape][data-kind]');
    if (await marker.count() !== 1) {
      throw new Error(`Disclosure ${index} mangler redundant type+shape-markør`);
    }
  }

  const target = disclosures.nth(1);
  const wasExpanded = await target.getAttribute('aria-expanded');
  await target.focus();
  await page.keyboard.press('Enter');
  const expectedExpanded = wasExpanded === 'true' ? 'false' : 'true';
  if (await target.getAttribute('aria-expanded') !== expectedExpanded) {
    throw new Error('Enter endret ikke den kontrollerte disclosure-tilstanden');
  }

  const previews = rail.locator('img');
  const previewCount = await previews.count();
  for (let index = 0; index < previewCount; index++) {
    if (await previews.nth(index).getAttribute('alt') !== '') {
      throw new Error('Plaggpreview skal være dekorativ med tom alt');
    }
  }
  const maxPreviewCount = await rail.locator('.plan-change-rail__detail-inner').evaluateAll(
    (details) => Math.max(0, ...details.map(
      (detail) => detail.querySelectorAll('img').length,
    )),
  );
  if (maxPreviewCount > 3) {
    throw new Error(`En detalj viser ${maxPreviewCount} previews; maksimum er tre`);
  }

  if (
    await page.getByRole('radio').count() !== 3
    || await page.getByRole('radio', { checked: true }).count() !== 1
  ) {
    throw new Error('Segmentkontrollen skal være én kontrollert native radiogruppe');
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

async function runExactContext(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: ForecastState,
): Promise<void> {
  const failures = collectFailures(page);
  await openPlanlegg(page, fixture.path);
  await assertSingleMain(page);

  const rail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await rail.waitFor({ state: 'visible', timeout: 15_000 });
  const expandedDisclosure = rail.locator('button[aria-expanded="true"]').first();
  await expandedDisclosure.waitFor({ state: 'visible' });
  const selectedEventTime = await expandedDisclosure.locator('time').getAttribute('datetime');
  if (!selectedEventTime) throw new Error('Valgt event mangler eksakt ISO-tid');

  const outfitCta = rail.getByRole('button', { name: 'Se hele antrekket' }).first();
  await outfitCta.waitFor({ state: 'visible' });
  const scrollContainer = page.locator('main#main');
  await scrollContainer.evaluate((element) => {
    element.scrollTop = 120;
  });
  await outfitCta.focus();
  const scrollBefore = await scrollContainer.evaluate((element) => element.scrollTop);
  await outfitCta.click();

  const dialog = page.getByRole('dialog', { name: 'Lillian' });
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  const title = dialog.getByRole('heading', { name: 'Lillian' });
  await title.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.activeElement?.id === 'planned-outfit-title');

  const situationText = await dialog
    .locator('section[aria-label="Planlagt situasjon"]')
    .innerText();
  if (!situationText.includes('Trondheim · Utelek')) {
    throw new Error(`Planlagt sted/aktivitet avvek: ${situationText}`);
  }
  const expectedLocalTime = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(selectedEventTime)).replace('.', ':');
  if (
    !situationText.toLocaleLowerCase('nb-NO').includes('12. februar')
    || !situationText.includes(expectedLocalTime)
  ) {
    throw new Error(`Planlagt dato avvek fra event ${selectedEventTime}: ${situationText}`);
  }
  const selectedLocalHour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(selectedEventTime)));
  const expectedTemperature = fixtureTemperature(selectedLocalHour, 'many');
  const expectedAgeMonths = 4;
  const expectedWeatherLabel = 'lettskyet';
  const expectedFeelsLike = -1;
  if (
    !situationText.includes(`${expectedAgeMonths} mnd`)
    || !situationText.includes(expectedWeatherLabel)
    || !situationText.includes(
      `${expectedTemperature}° (føles som ${expectedFeelsLike}°)`,
    )
  ) {
    throw new Error(`Planlagt barn/vær avvek: ${situationText}`);
  }
  if (/(?:Vogn|Sover|Våkent)/u.test(situationText)) {
    throw new Error(`Utelek-plan fikk uventet vognmodus: ${situationText}`);
  }
  const garmentSection = dialog.locator(
    'section[aria-labelledby="planned-garments-title"]',
  );
  const garmentItems = (await garmentSection.locator('ol > li').allTextContents())
    .map((item) => item.trim());
  if (
    garmentItems.length !== EXACT_CONTEXT_EXPECTED_GARMENTS.length
    || garmentItems.some(
      (item, index) => item !== EXACT_CONTEXT_EXPECTED_GARMENTS[index],
    )
  ) {
    throw new Error(
      `Planlagt plagg-rekkefølge avvek: ${JSON.stringify(garmentItems)}`,
    );
  }
  const equipmentItems = (await garmentSection
    .getByRole('heading', { name: 'Utstyr', exact: true })
    .locator('xpath=following-sibling::ul[1]/li')
    .allTextContents())
    .map((item) => item.trim());
  if (
    equipmentItems.length !== EXACT_CONTEXT_EXPECTED_EQUIPMENT.length
    || equipmentItems.some(
      (item, index) => item !== EXACT_CONTEXT_EXPECTED_EQUIPMENT[index],
    )
  ) {
    throw new Error(`Planlagt utstyr avvek: ${JSON.stringify(equipmentItems)}`);
  }
  if (!(await dialog.textContent())?.includes('Tilgang: today_home')) {
    throw new Error('Planlagt tilgangsdimensjon mangler');
  }
  const whyText = await dialog
    .locator('section[aria-labelledby="planned-why-title"]')
    .innerText();
  const expectedWind = selectedLocalHour >= 16 ? 6 : 2;
  const expectedPrecipitation = selectedLocalHour >= 12 && selectedLocalHour < 15 ? 2 : 0;
  if (
    !whyText.includes(`${expectedWind} m/s`)
    || !whyText.includes(`${expectedPrecipitation} mm/t`)
  ) {
    throw new Error(`Planlagt vind/nedbør avvek: ${whyText}`);
  }

  await dialog.getByRole('button', { name: 'Lukk planlagt antrekk' }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.waitForFunction(
    () => document.activeElement?.textContent?.includes('Se hele antrekket'),
  );
  if (await expandedDisclosure.getAttribute('aria-expanded') !== 'true') {
    throw new Error('Valgt event ble ikke bevart gjennom Outfit-drillen');
  }
  const scrollAfter = await scrollContainer.evaluate((element) => element.scrollTop);
  if (scrollAfter !== scrollBefore) {
    throw new Error(`Scroll ble ikke bevart: før=${scrollBefore}, etter=${scrollAfter}`);
  }

  await reloadPlanlegg(page, fixture.path, forecastState, 'zero');
  const staleRail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await staleRail.waitFor({ state: 'visible', timeout: 15_000 });
  if (await staleRail.getByRole('button', { name: 'Se hele antrekket' }).count() !== 0) {
    throw new Error('CTA skulle forsvinne etter at event-settet ble fjernet');
  }
  if (await page.getByRole('dialog').count() !== 0) {
    throw new Error('Fjernet event navigerte feilaktig til Outfit');
  }
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

const SNART_PRIOR_PLAN_IDS = ['01-13', '01-14', '01-15'] as const;
const SNART_CONTRACT_PATH =
  '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
const SNART_PACK_PATH = 'src/data/snart/climate-1991-2020-v1.json';
const SNART_MANIFEST_PATH = 'src/data/snart/climate-1991-2020-v1.manifest.json';
const SNART_BUILDER_PATH = 'scripts/snart/build-climate-pack.ts';
const SNART_EVIDENCE_DIR = '.planning/phases/01-planlegg-dagslinjen/evidence';
const ROUTE_MIGRATION_BASE_SHA = '191586faae773c53d2eed6c769cf5ec4c847c433';

function sha256Bytes(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function gitText(root: string, arguments_: readonly string[]): string {
  return execFileSync('git', [...arguments_], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitBlob(root: string, revision: string, path: string): Buffer {
  return execFileSync('git', ['show', `${revision}:${path}`], {
    cwd: root,
    encoding: null,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function candidateChangedPaths(
  root: string,
  planId: string,
  gitSha: string,
): string[] {
  const lines = gitText(root, [
    'log',
    '--first-parent',
    '--format=%H%x09%s',
    gitSha,
  ]).split(/\r?\n/u).filter(Boolean);
  let scopedCommitCount = 0;
  let baseSha: string | undefined;
  for (const line of lines) {
    const tab = line.indexOf('\t');
    if (tab < 1) throw new Error(`Snart readiness kunne ikke lese historikken for ${planId}`);
    const hash = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    if (subject.includes(`(${planId})`)) {
      scopedCommitCount += 1;
      continue;
    }
    if (scopedCommitCount > 0) {
      baseSha = hash;
      break;
    }
    throw new Error(`Snart readiness fant ikke ${planId}-kandidaten på oppgitt SHA`);
  }
  if (scopedCommitCount === 0) {
    throw new Error(`Snart readiness fant ingen commits for ${planId}`);
  }
  const arguments_ = baseSha
    ? ['diff', '--name-only', '--diff-filter=ACDMRTUXB', `${baseSha}..${gitSha}`]
    : ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', gitSha];
  return gitText(root, arguments_)
    .split(/\r?\n/u)
    .map((path) => path.trim().replaceAll('\\', '/'))
    .filter(Boolean)
    .sort();
}

function gitBundleSha256(
  root: string,
  paths: readonly string[],
  revision = 'HEAD',
): string {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) {
    hash.update(path);
    hash.update('\0');
    hash.update(gitBlob(root, revision, path));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function validatePriorSnartReadiness(
  root: string,
  fixture: NonNullable<PlanleggE2EFixture['snartReadiness']>,
): void {
  const currentContractSha256 = sha256Bytes(gitBlob(root, 'HEAD', SNART_CONTRACT_PATH));
  const currentPackSha256 = sha256Bytes(gitBlob(root, 'HEAD', SNART_PACK_PATH));
  const candidateRecords = new Map<string, ReviewCandidateRecord>();

  for (const planId of SNART_PRIOR_PLAN_IDS) {
    const candidate = JSON.parse(readFileSync(
      join(root, SNART_EVIDENCE_DIR, `${planId}-candidate.json`),
      'utf8',
    )) as ReviewCandidateRecord;
    const receiptA = JSON.parse(readFileSync(
      join(root, SNART_EVIDENCE_DIR, `${planId}-review-a.json`),
      'utf8',
    )) as IndependentReviewReceipt;
    const receiptB = JSON.parse(readFileSync(
      join(root, SNART_EVIDENCE_DIR, `${planId}-review-b.json`),
      'utf8',
    )) as IndependentReviewReceipt;
    const expectedTuple = fixture.priorCandidates[planId];
    if (
      candidate.candidate.gitSha !== expectedTuple.gitSha
      || candidate.candidate.treeSha !== expectedTuple.treeSha
      || candidate.candidate.contractSha256 !== expectedTuple.contractSha256
      || candidate.candidate.packSha256 !== expectedTuple.packSha256
      || candidate.candidate.evidenceSha256 !== expectedTuple.evidenceSha256
    ) {
      throw new Error(`Snart readiness fant endret kandidat-tuple for ${planId}`);
    }
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', candidate.candidate.gitSha, 'HEAD'], {
        cwd: root,
        stdio: 'ignore',
      });
    } catch {
      throw new Error(`Snart readiness fant ikke ${planId}-kandidaten som ancestor av HEAD`);
    }
    const snapshot: CandidateSnapshot = {
      changedPaths: candidateChangedPaths(root, planId, candidate.candidate.gitSha),
      clean: true,
      contractPath: candidate.paths.contract,
      contractSha256: sha256Bytes(gitBlob(
        root,
        candidate.candidate.gitSha,
        candidate.paths.contract,
      )),
      gitSha: candidate.candidate.gitSha,
      packPath: candidate.paths.pack,
      packSha256: sha256Bytes(gitBlob(
        root,
        candidate.candidate.gitSha,
        candidate.paths.pack,
      )),
      treeSha: gitText(root, ['rev-parse', `${candidate.candidate.gitSha}^{tree}`]),
      worktreePath: root.replaceAll('\\', '/'),
    };
    const result = validateReviewRecords({
      candidate,
      receiptA,
      receiptB,
      snapshot,
    });
    if (!result.valid || result.gateStatus !== 'PASS') {
      throw new Error(`Snart readiness review-port feilet for ${planId}`);
    }
    if (
      currentContractSha256 !== candidate.candidate.contractSha256
      || currentPackSha256 !== candidate.candidate.packSha256
    ) {
      throw new Error(`Snart readiness fant contract-/pack-drift etter ${planId}`);
    }
    candidateRecords.set(planId, candidate);
  }

  const modelPaths = candidateRecords.get('01-14')?.repository.changedPaths ?? [];
  const uiSessionPaths = (candidateRecords.get('01-15')?.repository.changedPaths ?? [])
    .filter((path) => path !== 'src/screens/UkeScreen.tsx');
  const priorEvidencePaths = SNART_PRIOR_PLAN_IDS.flatMap((planId) => [
    `${SNART_EVIDENCE_DIR}/${planId}-candidate.json`,
    `${SNART_EVIDENCE_DIR}/${planId}-review-a.json`,
    `${SNART_EVIDENCE_DIR}/${planId}-review-b.json`,
  ]);
  if (
    gitBundleSha256(root, modelPaths) !== fixture.modelBundleSha256
    || gitBundleSha256(root, uiSessionPaths)
      !== gitBundleSha256(root, uiSessionPaths, ROUTE_MIGRATION_BASE_SHA)
    || gitBundleSha256(root, priorEvidencePaths) !== fixture.priorEvidenceBundleSha256
  ) {
    throw new Error('Snart readiness fant modell-, UI/session- eller evidence-drift');
  }

  const manifest = gitBlob(root, 'HEAD', SNART_MANIFEST_PATH);
  const builder = gitBlob(root, 'HEAD', SNART_BUILDER_PATH);
  if (
    sha256Bytes(manifest) !== fixture.manifestSha256
    || sha256Bytes(builder) !== fixture.builderSha256
  ) {
    throw new Error('Snart readiness fant manifest- eller builder-drift');
  }

  const temporaryRoot = mkdtempSync(join(tmpdir(), 'babyora-snart-readiness-'));
  const previousWorkingDirectory = process.cwd();
  try {
    for (const path of [
      SNART_CONTRACT_PATH,
      SNART_PACK_PATH,
      SNART_MANIFEST_PATH,
      SNART_BUILDER_PATH,
    ]) {
      const target = join(temporaryRoot, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, gitBlob(root, 'HEAD', path));
    }
    process.chdir(temporaryRoot);
    const report = validateClimateBundle({
      contractPath: join(temporaryRoot, SNART_CONTRACT_PATH),
      dataDir: join(temporaryRoot, 'src/data/snart'),
    });
    if (
      !report.valid
      || report.packSha256 !== currentPackSha256
      || report.manifestSha256 !== fixture.manifestSha256
    ) {
      throw new Error('Snart readiness offline data-validator avviste bunten');
    }
  } finally {
    process.chdir(previousWorkingDirectory);
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

async function beginEntitlementRefresh(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('planlegg:e2e-entitlement-begin'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function hasForbiddenSnartBrowserPrewarm(source: string): boolean {
  return source.includes(SNART_BROWSER_PREWARM_IDENTIFIER)
    || SNART_DYNAMIC_MODULE_PATH_IMPORT.test(source);
}

function assertSnartBrowserPrewarmSourceGuard(harness: string): void {
  const forbiddenIdentifierFixture = [
    'async function ',
    SNART_BROWSER_PREWARM_IDENTIFIER,
    '(modulePath) {}',
  ].join('');
  const forbiddenDynamicImportFixture = [
    'async function load(modulePath) { ',
    'return ',
    'import',
    '(modulePath); }',
  ].join('');
  if (
    !hasForbiddenSnartBrowserPrewarm(forbiddenIdentifierFixture)
    || !hasForbiddenSnartBrowserPrewarm(forbiddenDynamicImportFixture)
  ) {
    throw new Error('Snart browser-prewarm source guard accepted a forbidden fixture');
  }
  if (hasForbiddenSnartBrowserPrewarm(harness)) {
    throw new Error('Snart browser-prewarm source guard rejected the current harness');
  }
}

async function runSoonReadiness(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: ForecastState,
  serverOutput: readonly string[],
): Promise<void> {
  const root = process.cwd();
  const availability = readFileSync(join(root, 'src/lib/premium/plus-features.ts'), 'utf8');
  const session = readFileSync(join(root, 'src/lib/planning/snart-session.ts'), 'utf8');
  const privacy = readFileSync(join(root, 'src/lib/planning/__tests__/snart-privacy-contract.test.ts'), 'utf8');
  const uke = readFileSync(join(root, 'src/screens/UkeScreen.tsx'), 'utf8');
  const harness = readFileSync(join(root, 'e2e/planlegg.ts'), 'utf8');
  if (!fixture.snartReadiness) {
    throw new Error('Snart readiness-fixturen mangler frosne kandidat- og bundlehasher');
  }
  validatePriorSnartReadiness(root, fixture.snartReadiness);
  assertSnartBrowserPrewarmSourceGuard(harness);
  const soonCapability = availability.match(/soon_preparation:\s*(true|false)/u)?.[1];
  if (
    (soonCapability !== 'false' && soonCapability !== 'true')
    || !/family_sharing:\s*false/u.test(availability)
    || !/personal_calibration:\s*false/u.test(availability)
    || !session.includes('projectSnartSession')
    || !session.includes('createSnartSessionEvaluator')
    || !privacy.includes('localStorage')
    || !privacy.includes('indexedDB')
    || !privacy.includes('CacheStorage')
    || !privacy.includes('automatic')
    || !uke.includes('requestedPlanView')
    || !uke.includes('requestedPlanViewToken')
    || !uke.includes('onConsumeRequestedPlanView')
    || !uke.includes("setTab('soon')")
    || SNART_INIT_SCRIPT.includes('__name')
    || SNART_INIT_SCRIPT.includes('window.__name')
    || !harness.includes('page.addInitScript({ content: SNART_INIT_SCRIPT })')
  ) {
    throw new Error('Snart readiness preflight mangler låst capability-, privacy-, contract- eller tidligere evidence-binding');
  }

  const requests: string[] = [];
  const browserSignals: string[] = [];
  const fatalBrowserSignals: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => browserSignals.push(`console:${message.type()}:${message.text()}`));
  page.on('pageerror', (error) => {
    const signal = `pageerror:${error.message}`;
    browserSignals.push(signal);
    fatalBrowserSignals.push(signal);
  });
  page.on('requestfailed', (request) => {
    const signal = `requestfailed:${request.url()}:${request.failure()?.errorText ?? ''}`;
    browserSignals.push(signal);
    fatalBrowserSignals.push(signal);
  });
  await page.addInitScript({ content: SNART_INIT_SCRIPT });
  forecastState.delivery = 'success';
  forecastState.mode = 'many';
  const observedTransport: string[] = [];
  const assertNoFatalBrowserSignal = (stage: string) => {
    if (fatalBrowserSignals.length > 0) {
      throw new Error(
        `Snart browser runtime failed at ${stage}: ${fatalBrowserSignals.join('\n')}`,
      );
    }
  };
  const expectedHook = (state: string): SnartHookSnapshot => {
    const automatic = state === 'automatic-b1'
      ? { mode: 'auto' as const, place: { city: 'Bergen', lat: 60.3913, lon: 5.3221 } }
      : state === 'automatic-b2'
        ? { mode: 'auto' as const, place: { city: 'Tromsø', lat: 69.6492, lon: 18.9553 } }
        : undefined;
    return {
      testOnlySoonAvailability: true,
      entitlement: state === 'loading' ? 'loading' : state === 'free' ? 'free' : 'plus',
      fixedHome: state === 'unsupported'
        ? { city: 'Ukjent', lat: 60, lon: 11 }
        : { city: 'Oslo', lat: 59.9139, lon: 10.7522 },
      ...(automatic ? { automatic } : {}),
      ...(state === 'invalid-hash' ? { climateProfile: 'invalid-hash' as const } : {}),
      profileScope: state === 'profile-b' ? 'b' : 'a',
      windowLocalDate: state === 'emptyable'
        ? '2026-01-01'
        : state === 'retained'
          ? '2026-06-01'
          : state === 'window-b'
            ? '2026-02-13'
            : '2026-02-12',
    };
  };
  const assertHookSnapshot = async (state: string) => {
    assertNoFatalBrowserSignal(`hook:${state}`);
    const actual = await page.evaluate(() => JSON.stringify(
      (window as Window & { __BABYORA_PLANLEGG_E2E__?: unknown })
        .__BABYORA_PLANLEGG_E2E__ ?? null,
    ));
    const expected = JSON.stringify(expectedHook(state));
    if (actual !== expected) {
      throw new Error(
        `Snart E2E hook mismatch for ${state}: expected=${expected} actual=${actual}`,
      );
    }
  };
  const navigateSoonState = async (
    state: string,
    path = `${fixture.path}&snart-e2e=${state}`,
  ) => {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
    await assertHookSnapshot(state);
    await enterPlanlegg(page);
    assertNoFatalBrowserSignal(`planlegg:${state}`);
  };
  const captureTransport = async () => {
    assertNoFatalBrowserSignal('capture-transport');
    const events = await page.evaluate(() => (
      (window as Window & { __babyoraSoonTransport?: string[] }).__babyoraSoonTransport ?? []
    )).catch(() => [] as string[]);
    observedTransport.push(...events);
  };
  const openSoonState = async (state: string) => {
    await captureTransport();
    await navigateSoonState(state);
    await page.getByRole('radio', { name: 'Snart', exact: true })
      .evaluate((radio) => (radio as HTMLInputElement).click());
    const plan = page.locator('.snart-plan');
    await plan.waitFor({ state: 'visible', timeout: 15_000 });
    assertNoFatalBrowserSignal(`render:${state}`);
    return plan;
  };
  const readSoonSignature = async () => page.locator('.snart-plan').evaluate((element) => JSON.stringify({
    text: element.textContent?.replace(/\s+/gu, ' ').trim() ?? '',
    items: [...element.querySelectorAll<HTMLElement>('[data-snart-item]')]
      .map((item) => item.dataset.snartItem ?? ''),
    actions: [...element.querySelectorAll<HTMLButtonElement>('button[data-concept-id]')]
      .map((button) => button.dataset.conceptId ?? ''),
  }));
  try {
    await navigateSoonState('plus', fixture.path);
  } catch (error) {
    const documentExcerpt = await page.locator('body').innerText().catch(() => '(body unavailable)');
    throw new Error(
      `Snart cold production navigation failed at ${page.url()}: ${documentExcerpt.slice(0, 1_500)}\n${browserSignals.join('\n')}\n${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const soon = page.getByRole('radio', { name: 'Snart', exact: true });
  try {
    await soon.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    throw new Error(`Snart control absent: ${await page.locator('body').innerText()} hook=${await page.evaluate(() => JSON.stringify((window as Window & { __BABYORA_PLANLEGG_E2E__?: unknown }).__BABYORA_PLANLEGG_E2E__))} signals=${browserSignals.join('\n')} ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  await soon.evaluate((radio) => (radio as HTMLInputElement).click());
  const ready = page.locator('.snart-plan');
  try {
    await ready.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    throw new Error(`Snart model did not render: ${await page.locator('body').innerText()} ${browserSignals.join('\n')} ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  const rendered = await ready.innerText();
  if (
    !/1991–2020/iu.test(rendered)
    || !/Har allerede/iu.test(rendered)
    || requests.some((url) => /thredds|frost/iu.test(url))
  ) {
    throw new Error('Plus Snart mangler modellresultat eller utførte forbudt runtime-klimaforespørsel');
  }
  const firstSoonAction = ready.getByRole('button', { name: 'Har allerede', exact: true }).first();
  const actionBox = await firstSoonAction.boundingBox();
  if (!actionBox || actionBox.width < 44 || actionBox.height < 44) {
    throw new Error(`Snart-action must be at least 44 by 44: ${JSON.stringify(actionBox)}`);
  }
  for (let index = 0; index < 24; index += 1) {
    if (await firstSoonAction.evaluate((element) => document.activeElement === element)) break;
    await page.keyboard.press('Tab');
  }
  if (!await firstSoonAction.evaluate((element) => document.activeElement === element && element.matches(':focus-visible'))) {
    throw new Error('Snart-action could not receive keyboard focus-visible state');
  }
  const focusStyle = await firstSoonAction.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  if (focusStyle.outlineStyle === 'none' || Number.parseFloat(focusStyle.outlineWidth) < 1) {
    throw new Error(`Snart-action lacks a visible focus outline: ${JSON.stringify(focusStyle)}`);
  }
  await page.emulateMedia({ forcedColors: 'active' });
  const forcedActionStyle = await firstSoonAction.evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderStyle: style.borderStyle, borderWidth: style.borderWidth, outlineStyle: style.outlineStyle };
  });
  if (
    (forcedActionStyle.borderStyle === 'none' || Number.parseFloat(forcedActionStyle.borderWidth) < 1)
    && forcedActionStyle.outlineStyle === 'none'
  ) {
    throw new Error(`Snart-action lacks a forced-colors border or outline: ${JSON.stringify(forcedActionStyle)}`);
  }
  await page.emulateMedia({ forcedColors: 'none' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const soonZoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  if (soonZoomOverflow > 0) throw new Error(`Snart overflows horizontally at 200% text: ${soonZoomOverflow}`);

  const snapshot = () => page.evaluate(async () => JSON.stringify({
    url: location.href,
    history: history.state,
    local: Object.entries(localStorage).sort(),
    session: Object.entries(sessionStorage).sort(),
    indexedDb: await indexedDB.databases().then((items) => items.map((item) => item.name).sort()),
    caches: await caches.keys(),
  }));
  const beforeMark = await snapshot();
  const mark = ready.getByRole('button', { name: 'Har allerede', exact: true }).first();
  await mark.focus();
  await page.keyboard.press('Enter');
  const afterMark = await snapshot();
  if (afterMark !== beforeMark) throw new Error('Har allerede skrev URL/history eller browser storage');
  if (await ready.getByRole('button', { name: 'Har allerede', exact: true }).count() >= 6) {
    throw new Error('Har allerede oppdaterte ikke den in-memory baserte modellen');
  }
  await captureTransport();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await assertHookSnapshot('plus');
  await enterPlanlegg(page);
  assertNoFatalBrowserSignal('planlegg:reload-plus');
  await page.getByRole('radio', { name: 'Snart', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await ready.waitFor({ state: 'visible', timeout: 15_000 });
  if (await ready.getByRole('button', { name: 'Har allerede', exact: true }).count() < 1) {
    throw new Error('Reload resetter ikke Har allerede-sessionen');
  }
  await captureTransport();
  const externalRequests = requests.filter((url) => !url.startsWith(BASE_URL));
  const leaked = [...browserSignals, ...observedTransport, ...externalRequests].filter((entry) => (
    /snart|lillian|eskil|2025-10-03|2023-12-03|already|har allerede/iu.test(entry)
  ));
  if (leaked.length > 0) {
    throw new Error(`Snart lekket til browser-signal eller transport: ${leaked.join(', ')}`);
  }

  await navigateSoonState('emptyable');
  await page.getByRole('radio', { name: 'Snart', exact: true }).evaluate((radio) => (radio as HTMLInputElement).click());
  const emptyable = page.locator('.snart-plan');
  await emptyable.waitFor({ state: 'visible' });
  while (await emptyable.getByRole('button', { name: 'Har allerede', exact: true }).count() > 0) {
    await emptyable.getByRole('button', { name: 'Har allerede', exact: true }).first().evaluate((button) => (button as HTMLButtonElement).click());
  }
  if (!/Ingenting å forberede/iu.test(await emptyable.innerText()) || await emptyable.locator('[data-snart-item]').count() !== 0) throw new Error('January actionable fixture did not reach model empty');

  const retained = await openSoonState('retained');
  while (await retained.getByRole('button', { name: 'Har allerede', exact: true }).count() > 0) {
    await retained.getByRole('button', { name: 'Har allerede', exact: true }).first()
      .evaluate((button) => (button as HTMLButtonElement).click());
  }
  if (
    await retained.locator('[data-snart-item]').count() < 1
    || !/Ikke fremhevet for perioden/iu.test(await retained.innerText())
  ) {
    throw new Error('Warm Snart did not retain not_highlighted after all actions were marked');
  }

  await navigateSoonState('free');
  const freeSoon = page.getByRole('radio', { name: 'Snart', exact: true });
  await freeSoon.evaluate((radio) => (radio as HTMLInputElement).click());
  const teaser = page.locator('[data-planlegg-access="soon-teaser"]');
  await teaser.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.locator('.snart-plan').count() !== 0
    || !(await teaser.innerText()).includes('Se historiske forberedelser med Babyora Plus')
  ) {
    throw new Error('Free Snart viste råd eller manglet den sannferdige Plus-teaseren');
  }
  const paywallTrigger = teaser.getByRole('button', {
    name: 'Se historiske forberedelser med Babyora Plus',
    exact: true,
  });
  await paywallTrigger.click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15_000 });
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15_000 });
  if (await page.evaluate(() => document.activeElement?.textContent?.includes('Se historiske forberedelser') !== true)) {
    throw new Error('Free Snart-paywall returnerte ikke fokus til teaseren');
  }

  await navigateSoonState('loading');
  await page.getByRole('radio', { name: 'Snart', exact: true }).evaluate((radio) => (radio as HTMLInputElement).click());
  await page.locator('[data-planlegg-access="neutral"]').waitFor({ state: 'visible' });
  if (await page.locator('.snart-plan, [data-planlegg-access="soon-teaser"]').count() !== 0) throw new Error('Loading leaked Snart advice');
  await navigateSoonState('unsupported');
  await page.getByRole('radio', { name: 'Snart', exact: true }).evaluate((radio) => (radio as HTMLInputElement).click());
  const unavailable = page.locator('.snart-plan');
  await unavailable.waitFor({ state: 'visible' });
  if (!/ikke godt nok historisk grunnlag/iu.test(await unavailable.innerText()) || await unavailable.locator('[data-snart-item]').count() !== 0) throw new Error('Unsupported home did not fail closed');

  const invalidHash = await openSoonState('invalid-hash');
  if (
    !/ikke godt nok historisk grunnlag/iu.test(await invalidHash.innerText())
    || await invalidHash.locator('[data-snart-item]').count() !== 0
  ) {
    throw new Error('Invalid climate-profile hash did not fail closed');
  }

  const navigationForAge = page.getByRole('navigation').first();
  const familyRoot = navigationForAge.getByRole('button', { name: /^Familie/u });
  const switchChild = page.getByRole('button', { name: /Bytt barn/u });
  const familyNavigationGuard = createStageMainFrameNavigationGuard(
    page,
    'familie-click',
    browserSignals,
    serverOutput,
  );
  try {
    await Promise.race([
      familyRoot.click(),
      familyNavigationGuard.unexpectedNavigation,
    ]);
    await Promise.race([
      familyRoot.waitFor({ state: 'visible', timeout: 15_000 }),
      familyNavigationGuard.unexpectedNavigation,
    ]);
    familyNavigationGuard.assertNoUnexpectedNavigation();
    if (
      await Promise.race([
        familyRoot.getAttribute('aria-current'),
        familyNavigationGuard.unexpectedNavigation,
      ]) !== 'page'
    ) {
      throw new Error('Familie root did not become current before child-switch readiness');
    }
    assertNoFatalBrowserSignal('familie-root-current');
    try {
      await Promise.race([
        switchChild.waitFor({ state: 'visible', timeout: 15_000 }),
        familyNavigationGuard.unexpectedNavigation,
      ]);
    } catch (error) {
      familyNavigationGuard.assertNoUnexpectedNavigation();
      assertNoFatalBrowserSignal('familie-child-switch-wait');
      const mainText = await page.locator('main#main').innerText()
        .catch(() => '(main unavailable)');
      throw new Error(
        `Familie route became current but its child-switch UI did not become ready: ${
          mainText.slice(0, 1_500)
        }`,
        { cause: error },
      );
    }
    familyNavigationGuard.assertNoUnexpectedNavigation();
    assertNoFatalBrowserSignal('familie-child-switch-ready');
  } finally {
    familyNavigationGuard.dispose();
  }
  await switchChild.evaluate((button) => (button as HTMLButtonElement).click());
  const childDialog = page.getByRole('dialog', { name: 'Bytt barn' });
  await childDialog.getByRole('radio', { name: /Bytt til Eskil/u }).click();
  await navigationForAge.getByRole('button', { name: /^Planlegg/u }).click();
  await page.getByRole('radio', { name: 'Snart', exact: true }).evaluate((radio) => (radio as HTMLInputElement).click());
  const ageUnavailable = page.locator('.snart-plan');
  await ageUnavailable.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    !/ikke godt nok historisk grunnlag/iu.test(await ageUnavailable.innerText())
    || await ageUnavailable.locator('[data-snart-item]').count() !== 0
  ) {
    throw new Error('Age-ineligible existing child did not yield an empty Snart-unavailable state');
  }
  await navigationForAge.getByRole('button', { name: /^Familie/u }).click();
  await page.getByRole('button', { name: /Bytt barn/u })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.getByRole('dialog', { name: 'Bytt barn' })
    .getByRole('radio', { name: /Bytt til Lillian/u }).click();

  const automaticB1 = await openSoonState('automatic-b1');
  const automaticB1Signature = await readSoonSignature();
  const automaticB1Context = await page.locator('.planlegg-screen__context').innerText();
  if (!/Nåværende sted\s*·\s*Bergen/iu.test(automaticB1Context)) {
    throw new Error(`Automatic B1-fixturen påvirket ikke synlig stedskontekst: ${automaticB1Context}`);
  }
  if (await automaticB1.locator('[data-snart-item]').count() < 1) {
    throw new Error('Automatic B1 manglet fast-hjem-basert Snart-resultat');
  }

  const automaticB2 = await openSoonState('automatic-b2');
  const automaticB2Signature = await readSoonSignature();
  const automaticB2Context = await page.locator('.planlegg-screen__context').innerText();
  if (!/Nåværende sted\s*·\s*Tromsø/iu.test(automaticB2Context)) {
    throw new Error(`Automatic B2-fixturen påvirket ikke synlig stedskontekst: ${automaticB2Context}`);
  }
  if (
    automaticB2Signature !== automaticB1Signature
    || await automaticB2.locator('[data-snart-item]').count() < 1
  ) {
    throw new Error('Fast hjem A ga ulikt Snart-resultat under automatic place B1/B2');
  }

  const resetPlan = await openSoonState('plus');
  const firstResetAction = resetPlan.locator('button[data-concept-id]').first();
  const resetConceptId = await firstResetAction.getAttribute('data-concept-id');
  if (!resetConceptId) throw new Error('Reset-fixturen manglet markérbart Snart-konsept');
  await firstResetAction.evaluate((button) => (button as HTMLButtonElement).click());
  const hasConceptAction = (conceptId: string) => page
    .locator('.snart-plan button[data-concept-id]')
    .evaluateAll(
      (buttons, expected) => buttons.some(
        (button) => button.getAttribute('data-concept-id') === expected,
      ),
      conceptId,
    );
  if (await hasConceptAction(resetConceptId)) {
    throw new Error('Har allerede fjernet ikke valgt konsept før reset');
  }

  const mainNavigation = page.getByRole('navigation', { name: 'Hovednavigasjon' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mainNavigation.getByRole('button', { name: 'Hjem', exact: true }).click();
  await page.locator('.planlegg-screen').waitFor({ state: 'detached', timeout: 15_000 });
  await mainNavigation.getByRole('button', { name: 'Planlegg', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('heading', { level: 1, name: 'Planlegg', exact: true })
    .waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('radio', { name: 'Snart', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.locator('.snart-plan').waitFor({ state: 'visible', timeout: 15_000 });
  if (!await hasConceptAction(resetConceptId)) {
    throw new Error('Unmount/remount resetter ikke Har allerede-sessionen');
  }

  await page.locator(`.snart-plan button[data-concept-id="${resetConceptId}"]`)
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.evaluate(() => {
    const target = window as Window & {
      __BABYORA_PLANLEGG_E2E__?: Record<string, unknown>;
    };
    const current = target.__BABYORA_PLANLEGG_E2E__;
    if (!current) throw new Error('Snart E2E-fixturen mangler ved profilbytte');
    target.__BABYORA_PLANLEGG_E2E__ = { ...current, profileScope: 'profile-b' };
  });
  await page.getByRole('radio', { name: 'I dag', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.getByRole('radio', { name: 'Snart', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.locator('.snart-plan').waitFor({ state: 'visible', timeout: 15_000 });
  if (!await hasConceptAction(resetConceptId)) {
    throw new Error('Profilbytte resetter ikke Har allerede-sessionen');
  }

  await page.locator(`.snart-plan button[data-concept-id="${resetConceptId}"]`)
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.evaluate(() => {
    const target = window as Window & {
      __BABYORA_PLANLEGG_E2E__?: Record<string, unknown>;
    };
    const current = target.__BABYORA_PLANLEGG_E2E__;
    if (!current) throw new Error('Snart E2E-fixturen mangler ved vindubytte');
    target.__BABYORA_PLANLEGG_E2E__ = { ...current, windowLocalDate: '2026-02-13' };
  });
  await page.getByRole('radio', { name: 'I dag', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.getByRole('radio', { name: 'Snart', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.locator('.snart-plan').waitFor({ state: 'visible', timeout: 15_000 });
  if (!await hasConceptAction(resetConceptId)) {
    throw new Error('Nytt Snart-vindu resetter ikke Har allerede-sessionen');
  }

  await captureTransport();
  const finalLeaks = [
    ...browserSignals,
    ...observedTransport,
    ...requests.filter((url) => !url.startsWith(BASE_URL)),
  ].filter((entry) => (
    /snart|lillian|eskil|2025-10-03|2023-12-03|already|har allerede/iu.test(entry)
  ));
  if (finalLeaks.length > 0) {
    throw new Error(`Snart lekket under A/B- eller resetmatrisen: ${finalLeaks.join(', ')}`);
  }
  const htmlLeaks = await page.content();
  if (/2025-10-03|2023-12-03|\b(?:childId|child_id|birthLocalDate|actionTimestamp)\b/iu.test(htmlLeaks)) {
    throw new Error('Snart DOM leaked a raw DOB, child-id field name, or action timestamp');
  }
  const availabilityAfter = readFileSync(
    join(root, 'src/lib/premium/plus-features.ts'),
    'utf8',
  );
  if (availabilityAfter !== availability) {
    throw new Error('Snart readiness endret capability-bytes under kontrollen');
  }
  assertNoFatalBrowserSignal('snart-final');
}

async function settleEntitlement(page: Page, premium: boolean): Promise<void> {
  await page.evaluate((nextPremium) => {
    window.dispatchEvent(new CustomEvent(
      'planlegg:e2e-entitlement-settle',
      { detail: nextPremium },
    ));
  }, premium);
}

async function runAccess(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: ForecastState,
): Promise<void> {
  const ukeSource = readFileSync(join(process.cwd(), 'src/screens/UkeScreen.tsx'), 'utf8');
  const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
  if (
    !ukeSource.includes('resolvePlanningViewAccess')
    || !ukeSource.includes('Se uke med Babyora Plus')
    || !ukeSource.includes('data-planlegg-access="neutral"')
    || !ukeSource.includes(
      "paywallOpen && viewAccess.access.state !== 'neutral'",
    )
    || !appSource.includes("decideAccess('future_plan'")
    || !appSource.includes('Capacitor.isNativePlatform()')
    || !ukeSource.includes('localDate(day.date) === nextCalendarDate')
  ) {
    throw new Error(
      'RED_PLANLEGG_ACCESS_REVIEW_REPAIR: neutral paywall, native cache, Today downgrade og eksakt i morgen må holdes',
    );
  }

  const failures = collectFailures(page);
  const freePath = `${fixture.path}${fixture.path.includes('?') ? '&' : '?'}access=free&entitlement=free`;

  forecastState.delivery = 'success';
  forecastState.mode = 'many';
  await openPlanlegg(page, freePath);
  const todayRail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  await todayRail.waitFor({ state: 'visible', timeout: 15_000 });
  const freeTodayOutfit = todayRail.getByRole('button', { name: 'Se hele antrekket' }).first();
  await freeTodayOutfit.waitFor({ state: 'visible', timeout: 15_000 });
  await freeTodayOutfit.click();
  const todayDialog = page.getByRole('dialog', { name: 'Lillian' });
  await todayDialog.waitFor({ state: 'visible', timeout: 15_000 });
  if (!(await todayDialog.innerText()).includes('Tilgang: today_home')) {
    throw new Error('Free I dag mistet komplett Outfit ved konfigurert sted');
  }
  await todayDialog.getByRole('button', { name: 'Lukk planlagt antrekk' }).click();
  await todayDialog.waitFor({ state: 'detached' });

  const weekRadio = page.getByRole('radio', { name: 'Uke', exact: true });
  await weekRadio.evaluate((radio) => (radio as HTMLInputElement).click());
  const comparison = page.locator('[data-planlegg-access="free-week-comparison"]');
  await comparison.waitFor({ state: 'visible', timeout: 15_000 });
  const comparisonRows = comparison.locator('[data-weather-comparison]');
  const freeWeekAction = page.getByRole('button', {
    name: 'Se uke med Babyora Plus',
    exact: true,
  });
  await freeWeekAction.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await comparisonRows.count() !== 1
    || await page.locator('.planlegg-screen__answer').count() !== 0
    || await page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' }).count() !== 0
    || await page.getByRole('button', { name: 'Se hele antrekket' }).count() !== 0
    || await page.locator('[aria-label="Planlagt situasjon"]').count() !== 0
    || await page.locator('[data-planlegg-paid-material]').count() !== 0
  ) {
    throw new Error('Free Uke lekket råd, Outfit, kontekst eller skjult Plus-DOM');
  }

  const main = page.locator('main#main');
  await main.evaluate((element) => {
    element.scrollTop = 90;
  });
  const scrollBeforePaywall = await main.evaluate((element) => element.scrollTop);
  await freeWeekAction.click();
  const paywall = page.getByRole('dialog');
  await paywall.waitFor({ state: 'visible', timeout: 15_000 });
  const paywallText = await paywall.innerText();
  if (
    /sammen|familie|begge foreldre|alle som passer barnet|omsorgsperson|overalt|snart/iu
      .test(paywallText)
  ) {
    throw new Error(`Paywall lovet deaktivert funksjon: ${paywallText}`);
  }
  await page.keyboard.press('Escape');
  await paywall.waitFor({ state: 'detached' });
  if (
    await freeWeekAction.evaluate((button) => document.activeElement === button) !== true
    || await weekRadio.isChecked() !== true
    || await main.evaluate((element) => element.scrollTop) !== scrollBeforePaywall
  ) {
    throw new Error('Kontekstuell paywall mistet triggerfokus, Uke-valg eller scroll');
  }

  await freeWeekAction.click();
  const refreshPaywall = page.getByRole('dialog');
  await refreshPaywall.waitFor({ state: 'visible', timeout: 15_000 });
  await beginEntitlementRefresh(page);
  await refreshPaywall.waitFor({ state: 'detached', timeout: 15_000 });
  const neutralWeek = page.locator('[data-planlegg-access="neutral"]');
  await neutralWeek.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await weekRadio.isChecked() !== true
    || await page.getByRole('dialog').count() !== 0
    || await page.getByText('Se uke med Babyora Plus', { exact: true }).count() !== 0
    || await page.locator('[data-planlegg-access="plus-week"]').count() !== 0
  ) {
    throw new Error('Entitlement-lasting beholdt paywall/låst innhold eller mistet Uke-valget');
  }
  await settleEntitlement(page, false);
  await comparison.waitFor({ state: 'visible', timeout: 15_000 });

  await freeWeekAction.click();
  const fastRefreshPaywall = page.getByRole('dialog');
  await fastRefreshPaywall.waitFor({ state: 'visible', timeout: 15_000 });
  await beginEntitlementRefresh(page);
  await settleEntitlement(page, false);
  await fastRefreshPaywall.waitFor({ state: 'detached', timeout: 15_000 });
  await comparison.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.getByRole('dialog').count() !== 0
    || await freeWeekAction.evaluate((button) => document.activeElement === button) !== true
  ) {
    throw new Error(
      'Rask entitlement-avklaring lot paywall gjenoppstÃ¥ eller mistet triggerfokus',
    );
  }

  await freeWeekAction.click();
  const allowedRefreshPaywall = page.getByRole('dialog');
  await allowedRefreshPaywall.waitFor({ state: 'visible', timeout: 15_000 });
  await beginEntitlementRefresh(page);
  await allowedRefreshPaywall.waitFor({ state: 'detached', timeout: 15_000 });
  await neutralWeek.waitFor({ state: 'visible', timeout: 15_000 });
  await settleEntitlement(page, true);
  await page.locator('[data-planlegg-access="plus-week"]')
    .waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.getByRole('dialog').count() !== 0
    || await main.evaluate((element) => document.activeElement === element) !== true
  ) {
    throw new Error('Tillatt entitlement-avklaring mistet trygt hovedfokus');
  }

  await reloadPlanlegg(page, freePath, forecastState, 'missing-tomorrow');
  await page.getByRole('radio', { name: 'Uke', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  const unavailable = page.locator('[data-planlegg-access="free-week-unavailable"]');
  await unavailable.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.locator('[data-weather-comparison]').count() !== 0
    || await page.locator('.planlegg-screen__answer').count() !== 0
    || await page.getByRole('button', { name: 'Se hele antrekket' }).count() !== 0
  ) {
    throw new Error('Free Uke uten fremtidsevidens materialiserte sammenligning eller råd');
  }

  const webPurchasePath = `${freePath}&runtime=web`;
  await reloadPlanlegg(page, webPurchasePath, forecastState, 'many');
  await page.getByRole('radio', { name: 'Uke', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.getByRole('button', {
    name: 'Se uke med Babyora Plus',
    exact: true,
  }).click();
  const webPurchasePaywall = page.getByRole('dialog');
  await webPurchasePaywall.waitFor({ state: 'visible', timeout: 15_000 });
  await Promise.all([
    webPurchasePaywall.getByRole('status').getByText(
      'Babyora Pluss aktivert (testmodus).',
      { exact: true },
    ).waitFor({ state: 'visible', timeout: 15_000 }),
    webPurchasePaywall.getByRole('button', {
      name: /Start 7 dager gratis|Kjøp Babyora Pluss/u,
    }).click(),
  ]);
  await page.clock.fastForward(2_000);
  await webPurchasePaywall.waitFor({ state: 'detached', timeout: 15_000 });
  await page.locator('[data-planlegg-access="plus-week"]')
    .waitFor({ state: 'visible', timeout: 15_000 });
  if (await main.evaluate((element) => document.activeElement === element) !== true) {
    throw new Error('Vellykket web-kjøp mistet aktiveringsstatus eller hovedfokus');
  }

  await reloadPlanlegg(page, freePath, forecastState, 'many');
  await page.getByRole('radio', { name: 'Uke', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  await page.getByRole('button', {
    name: 'Se uke med Babyora Plus',
    exact: true,
  }).click();
  const restorePaywall = page.getByRole('dialog');
  await restorePaywall.waitFor({ state: 'visible', timeout: 15_000 });
  await Promise.all([
    restorePaywall.getByRole('status').getByText(
      'Babyora Pluss aktivert.',
      { exact: true },
    ).waitFor({ state: 'visible', timeout: 15_000 }),
    restorePaywall.getByRole('button', { name: 'Gjenopprett kjøp' }).click(),
  ]);
  await page.clock.fastForward(2_000);
  await restorePaywall.waitFor({ state: 'detached', timeout: 15_000 });
  await page.locator('[data-planlegg-access="plus-week"]')
    .waitFor({ state: 'visible', timeout: 15_000 });
  if (await main.evaluate((element) => document.activeElement === element) !== true) {
    throw new Error('Vellykket restore mistet aktiveringsstatus eller hovedfokus');
  }

  const loadingPath = `${fixture.path}${fixture.path.includes('?') ? '&' : '?'}entitlement=loading`;
  forecastState.delivery = 'success';
  await reloadPlanlegg(page, loadingPath, forecastState, 'week-changes');
  const loadingTodayRail = page.getByRole('list', {
    name: 'Antrekksendringer gjennom dagen',
  });
  await loadingTodayRail.waitFor({ state: 'visible', timeout: 15_000 });
  const loadingWeekRadio = page.getByRole('radio', { name: 'Uke', exact: true });
  await loadingWeekRadio.evaluate((radio) => (radio as HTMLInputElement).click());
  const startupNeutralWeek = page.locator('[data-planlegg-access="neutral"]');
  await startupNeutralWeek.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await loadingWeekRadio.isChecked() !== true
    || await page.getByRole('dialog').count() !== 0
    || await page.locator('[data-planlegg-paid-material]').count() !== 0
    || await page.getByText('Se uke med Babyora Plus', { exact: true }).count() !== 0
    || await page.locator('[data-planlegg-access="plus-week"]').count() !== 0
  ) {
    throw new Error('Cachet Plus under startup-lasting viste paywall, betalt innhold eller låst handling');
  }

  await settleEntitlement(page, true);
  const plusMaterial = page.locator('[data-planlegg-access="plus-week"]');
  await plusMaterial.waitFor({ state: 'visible', timeout: 15_000 });
  const futureRail = plusMaterial.getByRole('list', {
    name: 'Antrekksendringer gjennom dagen',
  });
  await futureRail.waitFor({ state: 'visible', timeout: 15_000 });
  let futureOutfit = futureRail
    .getByRole('button', { name: 'Se hele antrekket' })
    .first();
  if (await futureOutfit.count() === 0) {
    const firstFutureEvent = futureRail.locator('button[aria-expanded]').first();
    await firstFutureEvent.evaluate((button) => (button as HTMLButtonElement).click());
    futureOutfit = futureRail
      .getByRole('button', { name: 'Se hele antrekket' })
      .first();
  }
  await futureOutfit.waitFor({ state: 'visible', timeout: 15_000 });
  await futureOutfit.click();
  const plannedDialog = page.getByRole('dialog', { name: 'Lillian' });
  await plannedDialog.waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => document.activeElement?.id === 'planned-outfit-title');
  if (!(await plannedDialog.innerText()).includes('Tilgang: future_plan')) {
    throw new Error('Plus Uke åpnet ikke et autorisert fremtidig Outfit');
  }

  await beginEntitlementRefresh(page);
  await plannedDialog.waitFor({ state: 'detached', timeout: 15_000 });
  const downgradeNeutral = page.locator('[data-planlegg-access="neutral"]');
  await downgradeNeutral.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await loadingWeekRadio.isChecked() !== true
    || await page.locator('[aria-label="Planlagt situasjon"]').count() !== 0
    || await page.locator('[data-planlegg-access="plus-week"]').count() !== 0
    || await main.evaluate((element) => document.activeElement === element) !== true
  ) {
    throw new Error('Live nedgradering beholdt betalt DTO/DOM eller mistet trygt hovedfokus');
  }
  await settleEntitlement(page, false);
  const downgradedTodayRadio = page.getByRole('radio', {
    name: 'I dag',
    exact: true,
  });
  await downgradedTodayRadio.waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' })
    .waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await downgradedTodayRadio.isChecked() !== true
    || await page.locator('[data-planlegg-access="free-week-comparison"]').count() !== 0
  ) {
    throw new Error('Live Plus-tap gjenopprettet ikke en gyldig I dag-visning');
  }

  await page.evaluate(() => {
    const key = 'babyora.subscription';
    const nextValue = JSON.stringify({
      state: { isPremium: true, lastSyncedAt: Date.now() },
      version: 0,
    });
    localStorage.setItem(key, nextValue);
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: nextValue,
      storageArea: localStorage,
    }));
  });
  await page.waitForTimeout(50);
  if (
    await page.locator('[data-planlegg-access="plus-week"]').count() !== 0
    || await downgradedTodayRadio.isChecked() !== true
  ) {
    throw new Error('Native fersk avvisning ble overstyrt av cachet storage-true');
  }

  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
  console.log(
    `PLANLEGG ACCESS: fixture=${fixture.id} states=free-valid,free-unavailable,loading,plus,downgrade media=none`,
  );
}

async function runCompositionMatrix(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: ForecastState,
): Promise<void> {
  const failures = collectFailures(page);
  forecastState.delivery = 'pending';
  await openPlanlegg(page, fixture.path);
  const loadingStatus = page.getByRole('status').filter({
    hasText: 'Henter dagens plan',
  });
  await loadingStatus.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
  if (await loadingStatus.count() !== 1) {
    throw new Error(
      'RED_PLANLEGG_STATE_MATRIX_CONTRACT: loading-evidens kan ikke holdes og observeres deterministisk',
    );
  }

  const liveOwnerSelector = '[role="status"][aria-live="polite"]';
  if (await page.locator(liveOwnerSelector).count() !== 1) {
    throw new Error('Loading skal ha nøyaktig én høflig live-eier');
  }
  if (
    await page.locator('.planlegg-status__skeleton-verdict').count() !== 1
    || await page.locator('.planlegg-status__skeleton-rail').count() !== 1
  ) {
    throw new Error('Loading skal reservere både verdict- og Dagslinje-geometri');
  }

  forecastState.delivery = 'error';
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('metno:')) localStorage.removeItem(key);
    }
  });
  await openPlanlegg(page, fixture.path);
  const retry = page.getByRole('button', { name: 'Prøv å hente planen', exact: true });
  await retry.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.getByRole('heading', { name: 'Vi fikk ikke oppdatert planen' }).count() !== 1
    || await page.locator(liveOwnerSelector).count() !== 1
  ) {
    throw new Error('No-cache-feil mangler heading, retry eller eneste live-eier');
  }
  const errorViews = page.locator('.planlegg-screen__views');
  if (
    await errorViews.getAttribute('aria-disabled') !== 'true'
    || await errorViews.getAttribute('inert') === null
  ) {
    throw new Error('No-cache-feil skal gjøre sannhetsavhengige visningsvalg utilgjengelige');
  }
  await startLiveRegionTrace(page);
  forecastState.delivery = 'success';
  forecastState.mode = 'many';
  await retry.click();
  await page.locator('.planlegg-screen__answer').waitFor({ state: 'visible', timeout: 15_000 });
  if (await page.locator(liveOwnerSelector).count() !== 0) {
    throw new Error('Ready skal ikke beholde en støyende live-eier');
  }
  const errorRecoveryTrace = await readLiveRegionTrace(page);
  if (
    errorRecoveryTrace.filter((entry) => entry.includes('Vi fikk ikke oppdatert planen')).length !== 1
    || errorRecoveryTrace.filter((entry) => entry.includes('Henter dagens plan')).length !== 1
  ) {
    throw new Error(
      `Feil/retry skal gi én DOM-kadens per meningsfulle status: ${JSON.stringify(errorRecoveryTrace)}`,
    );
  }

  forecastState.delivery = 'error';
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ key, fetchedAt, data }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      fetchedAt,
      data,
    }));
  }, {
    key: 'metno:63.43,10.40',
    fetchedAt: FIXED_NOW.getTime() - 2 * 60 * 60 * 1000,
    data: buildForecast('many'),
  });
  const planButton = page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Planlegg/u });
  await planButton.click();
  const offline = page.getByRole('status').filter({ hasText: 'Du er frakoblet' });
  await offline.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    !(await offline.innerText()).includes('07:30')
    || await page.locator('.planlegg-screen__answer').count() !== 1
    || await page.locator(liveOwnerSelector).count() !== 1
  ) {
    throw new Error(
      `Cached offline skal beholde plan, timestamp og én live-eier: `
      + `status=${JSON.stringify(await offline.innerText())}, `
      + `answer=${await page.locator('.planlegg-screen__answer').count()}, `
      + `live=${await page.locator(liveOwnerSelector).count()}`,
    );
  }
  const offlineRail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
  const offlineDisclosures = offlineRail.locator('button[aria-expanded]');
  if (await offlineDisclosures.count() < 2) {
    throw new Error('Offline refresh-fixturen må ha en valgt event som kan fjernes');
  }
  await offlineDisclosures.nth(1).click();
  const staleOutfitAction = await offlineRail
    .getByRole('button', { name: 'Se hele antrekket' })
    .elementHandle();
  if (!staleOutfitAction) {
    throw new Error('Valgt offline-event mangler CTA før refresh');
  }
  const focusedDuringRefresh = page.getByRole('radio', { name: 'I dag', exact: true });
  await focusedDuringRefresh.focus();
  await focusedDuringRefresh.evaluate((radio) => {
    const tracedWindow = window as typeof window & { __planleggRefreshFocus?: Element };
    tracedWindow.__planleggRefreshFocus = radio;
  });
  await startLiveRegionTrace(page);
  forecastState.delivery = 'success';
  forecastState.mode = 'zero';
  await offline.getByRole('button', { name: 'Prøv å hente planen', exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await offlineRail.getByText('Samme antrekk i de vurderte tidspunktene')
    .waitFor({ state: 'visible', timeout: 15_000 });
  const staleActionWasRemoved = await staleOutfitAction.evaluate(
    (button) => !button.isConnected,
  );
  const keptSameFocusedControl = await focusedDuringRefresh.evaluate((radio) => {
    const tracedWindow = window as typeof window & { __planleggRefreshFocus?: Element };
    return tracedWindow.__planleggRefreshFocus === radio && document.activeElement === radio;
  });
  const offlineRecoveryTrace = await readLiveRegionTrace(page);
  if (
    await offlineRail.locator('button[aria-expanded]').count() !== 0
    || await offlineRail.getByRole('button', { name: 'Se hele antrekket' }).count() !== 0
    || await page.getByRole('dialog').count() !== 0
    || !staleActionWasRemoved
    || !keptSameFocusedControl
    || await page.locator(liveOwnerSelector).count() !== 0
    || offlineRecoveryTrace.filter((entry) => entry.includes('Du er frakoblet')).length !== 1
    || offlineRecoveryTrace.filter((entry) => entry.includes('Henter dagens plan')).length !== 1
  ) {
    throw new Error(
      `In-place refresh skal kjøre persisted repair, avvise stale CTA og bevare samme fokusnode: `
      + `${JSON.stringify({ keptSameFocusedControl, staleActionWasRemoved, offlineRecoveryTrace })}`,
    );
  }

  forecastState.delivery = 'success';
  forecastState.mode = 'partial';
  forecastState.temperatureC = undefined;
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('metno:')) localStorage.removeItem(key);
    }
  });
  await openPlanlegg(page, fixture.path);
  const partial = page.getByRole('status').filter({
    hasText: 'bare tidspunktene Babyora har værdata for',
  });
  await partial.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.locator(liveOwnerSelector).count() !== 1
    || await page.getByText(/hele dagen|time for time/iu).count() !== 0
  ) {
    throw new Error('Partial skal avgrense evidensen uten heldagspåstand');
  }

  for (const mode of ['zero', 'one', 'many'] as const) {
    await reloadPlanlegg(page, fixture.path, forecastState, mode);
    const rail = page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' });
    await rail.waitFor({ state: 'visible', timeout: 15_000 });
    const disclosureCount = await rail.locator('button[aria-expanded]').count();
    if (
      (mode === 'zero' && disclosureCount !== 0)
      || (mode === 'one' && disclosureCount !== 1)
      || (mode === 'many' && disclosureCount < 2)
    ) {
      throw new Error(`${mode}-state fikk ${disclosureCount} disclosures`);
    }
  }

  const premiumWeekRadio = page.getByRole('radio', { name: 'Uke', exact: true });
  await premiumWeekRadio.evaluate((radio) => (radio as HTMLInputElement).click());
  await page.locator('.planlegg-screen__answer').waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await page.getByRole('list', { name: 'Antrekksendringer gjennom dagen' }).count() !== 1
    || await page.getByText('Antrekk videre i uka er tilgjengelig med Babyora Pluss').count() !== 0
  ) {
    throw new Error('Premium Uke skal være en ekte aggregert plan, ikke en død eller markedsførende flate');
  }
  await page.getByRole('radio', { name: 'I dag', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());

  const freePath = `${fixture.path}${fixture.path.includes('?') ? '&' : '?'}access=free`;
  await openPlanlegg(page, freePath);
  const freeTodayOutfit = page
    .getByRole('list', { name: 'Antrekksendringer gjennom dagen' })
    .getByRole('button', { name: 'Se hele antrekket' })
    .first();
  await freeTodayOutfit.waitFor({ state: 'visible', timeout: 15_000 });
  await freeTodayOutfit.click();
  const freeTodayDialog = page.getByRole('dialog');
  await freeTodayDialog.waitFor({ state: 'visible', timeout: 15_000 });
  if (!(await freeTodayDialog.innerText()).includes('Tilgang: today_home')) {
    throw new Error('Free I dag skal åpne exact Outfit med today_home-tilgang');
  }
  await freeTodayDialog.getByRole('button', { name: 'Lukk planlagt antrekk' }).click();
  await freeTodayDialog.waitFor({ state: 'detached' });
  await page.getByRole('radio', { name: 'Uke', exact: true })
    .evaluate((radio) => (radio as HTMLInputElement).click());
  const freeWeekContext = page.locator(
    '[data-planlegg-access="free-week-comparison"]',
  );
  await freeWeekContext.waitFor({ state: 'visible', timeout: 15_000 });
  if (
    await freeWeekContext.locator('[data-weather-comparison]').count() !== 1
    || await page.locator('.planlegg-screen__answer').count() !== 0
    || await page.getByRole('button', {
      name: 'Se uke med Babyora Plus',
      exact: true,
    }).count() !== 1
    || await page.getByRole('button', { name: 'Se hele antrekket' }).count() !== 0
    || await page.locator('.planlegg-forecast').count() !== 0
    || await page.locator(liveOwnerSelector).count() !== 0
  ) {
    throw new Error(
      'Free Uke skal gi nøyaktig én værsammenligning uten plan, Outfit eller full prognose',
    );
  }
  await reloadPlanlegg(page, fixture.path, forecastState, 'many');

  const screen = page.locator('.planlegg-screen');
  const verticalOwners = await page.locator('body *').evaluateAll((elements) => (
    elements
      .filter((element) => {
        const overflowY = getComputedStyle(element).overflowY;
        return overflowY === 'auto' || overflowY === 'scroll';
      })
      .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}`)
  ));
  if (verticalOwners.length !== 1 || !verticalOwners[0]?.startsWith('main#main.')) {
    throw new Error(`App-main skal eie eneste vertikale scroll: ${verticalOwners.join(', ')}`);
  }

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const zoomOverflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    screen: document.querySelector<HTMLElement>('.planlegg-screen')!
      .scrollWidth - document.querySelector<HTMLElement>('.planlegg-screen')!.clientWidth,
  }));
  if (zoomOverflow.document > 0 || zoomOverflow.screen > 0) {
    throw new Error(`200% tekst skapte horisontal overflow: ${JSON.stringify(zoomOverflow)}`);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });

  const forecastToggle = page.locator('.planlegg-forecast__toggle');
  await forecastToggle.waitFor({ state: 'visible', timeout: 15_000 });
  if (!(await forecastToggle.innerText()).includes('Vis full værprognose')) {
    throw new Error(`Prognose-disclosure startet i feil tilstand: ${await forecastToggle.innerText()}`);
  }
  await forecastToggle.focus();
  await page.keyboard.press('Enter');
  if (
    await forecastToggle.getAttribute('aria-expanded') !== 'true'
    || await page.evaluate(() => document.activeElement?.textContent?.includes('Skjul full værprognose')) !== true
  ) {
    throw new Error('Tastatur åpnet ikke prognosen med stabilt fokus');
  }

  const weekRadio = page.getByRole('radio', { name: 'Uke', exact: true });
  await weekRadio.focus();
  await page.keyboard.press('Space');
  const todayRadio = page.getByRole('radio', { name: 'I dag', exact: true });
  await todayRadio.focus();
  await page.keyboard.press('Space');
  if (
    await todayRadio.isChecked() !== true
    || await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.checked) !== true
    || await page.locator(liveOwnerSelector).count() !== 0
  ) {
    throw new Error('Visningsbytte skal være kontrollert, fokusstabilt og stille');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const durations = await page.evaluate(() => {
    const values = [
      getComputedStyle(document.querySelector<HTMLElement>('.planlegg-forecast__toggle span')!)
        .transitionDuration,
      getComputedStyle(document.querySelector<HTMLElement>('.plan-change-rail__detail')!)
        .transitionDuration,
    ];
    return values.flatMap((value) => value.split(',')).map((value) => Number.parseFloat(value));
  });
  if (durations.some((duration) => duration > 0.001)) {
    throw new Error(`Reduced motion beholdt overgang: ${durations.join(', ')}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  const temperatureCases = [
    { name: 'extreme-cold', value: -50, axis: 'kald' },
    { name: 'cold', value: -5, axis: 'kald' },
    { name: 'mild', value: 10, axis: 'mild' },
    { name: 'warm', value: 25, axis: 'varm' },
    { name: 'extreme-heat', value: 55, axis: 'varm' },
  ] as const;
  const contrast = async (theme: 'light' | 'dark') => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate((nextTheme) => {
      document.documentElement.dataset.theme = nextTheme;
    }, theme);
    await page.waitForTimeout(50);
    const colors = await page.evaluate(() => {
      const planlegg = document.querySelector<HTMLElement>('.planlegg-screen')!;
      const planleggStyle = getComputedStyle(planlegg);
      const selectedControl = document.querySelector<HTMLElement>(
        '.segmented-control__segment.is-checked',
      )!;
      const selectedControlStyle = getComputedStyle(selectedControl);
      const controlGroup = document.querySelector<HTMLElement>('.segmented-control__group')!;
      const action = document.querySelector<HTMLElement>('.plan-change-rail__outfit')!;
      return {
        background: planleggStyle.backgroundColor,
        normal: getComputedStyle(
          document.querySelector<HTMLElement>('.planlegg-screen__context')!,
        ).color,
        large: getComputedStyle(
          document.querySelector<HTMLElement>('.planlegg-screen__verdict')!,
        ).color,
        controlForeground: selectedControlStyle.color,
        controlBackground: selectedControlStyle.backgroundColor,
        controlSurface: getComputedStyle(controlGroup).backgroundColor,
        focus: planleggStyle.getPropertyValue('--focus-ring').trim(),
        action: getComputedStyle(action).color,
      };
    });
    return {
      normal: contrastRatio(colors.normal, colors.background),
      large: contrastRatio(colors.large, colors.background),
      control: contrastRatio(colors.controlForeground, colors.controlBackground),
      focusCanvas: contrastRatio(colors.focus, colors.background),
      focusSurface: contrastRatio(colors.focus, colors.controlSurface),
      action: contrastRatio(colors.action, colors.background),
    };
  };
  const temperatureBackgrounds = new Set<string>();
  const failingContrast: string[] = [];
  for (const temperatureCase of temperatureCases) {
    forecastState.delivery = 'success';
    forecastState.mode = 'many';
    forecastState.temperatureC = temperatureCase.value;
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('metno:')) localStorage.removeItem(key);
      }
    });
    await openPlanlegg(page, fixture.path);
    await screen.waitFor({ state: 'visible', timeout: 15_000 });
    if (await screen.getAttribute('data-temp') !== temperatureCase.axis) {
      throw new Error(`${temperatureCase.name} fikk feil temperaturakse`);
    }
    temperatureBackgrounds.add(await screen.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ));
    for (const theme of ['light', 'dark'] as const) {
      const pairs = await contrast(theme);
      failingContrast.push(...Object.entries(pairs)
        .filter(([kind, ratio]) => (
          ratio < (kind === 'large' || kind.startsWith('focus') ? 3 : 4.5)
        ))
        .map(([kind, ratio]) => `${temperatureCase.name}.${theme}.${kind}=${ratio}`));
    }
  }
  if (temperatureBackgrounds.size < 3) {
    throw new Error(
      `Temperaturaksen malte færre enn tre distinkte canvas: ${[...temperatureBackgrounds].join(', ')}`,
    );
  }
  if (failingContrast.length > 0) {
    throw new Error(`AA-kontrast avvek: ${failingContrast.join(', ')}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.emulateMedia({ forcedColors: 'active' });
  const forcedRadio = page.getByRole('radio', { name: 'I dag', exact: true });
  await forcedRadio.focus();
  const forcedStyles = await forcedRadio
    .locator('xpath=..')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderStyle: style.borderStyle,
        borderWidth: style.borderWidth,
        forcedColorAdjust: style.forcedColorAdjust,
      };
    });
  if (
    forcedStyles.borderStyle === 'none'
    || Number.parseFloat(forcedStyles.borderWidth) < 1
    || forcedStyles.forcedColorAdjust !== 'auto'
    || await forcedRadio.evaluate((element) => element !== document.activeElement)
  ) {
    throw new Error(`Forced colors mangler systemkant/fokus: ${JSON.stringify(forcedStyles)}`);
  }
  await page.emulateMedia({ forcedColors: 'none' });

  for (const root of ['Hjem', 'Planlegg', 'Guide', 'Familie']) {
    await page
      .getByRole('navigation')
      .first()
      .getByRole('button', { name: new RegExp(`^${root}`, 'u') })
      .click();
    await page.waitForTimeout(180);
    await page.locator('main#main').waitFor({ state: 'visible', timeout: 15_000 });
    const routeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (routeOverflow > 0) throw new Error(`${root}-roten fikk horisontal overflow`);
  }

  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

function assertNativePolishSourceContracts(): void {
  const haptics = readFileSync(join(process.cwd(), 'src/lib/haptics/system.ts'), 'utf8');
  const bottomNav = readFileSync(join(process.cwd(), 'src/components/BottomTabBar.tsx'), 'utf8');
  const bottomNavCss = readFileSync(join(process.cwd(), 'src/components/BottomTabBar.css'), 'utf8');
  const changedPaths = execFileSync(
    'git',
    ['diff', '--name-only', '561c470fccd826ef7decd594e781f885113f016a', 'HEAD'],
    { cwd: process.cwd(), encoding: 'utf8' },
  ).split(/\r?\n/u).filter(Boolean);
  const allowedPaths = new Set([
    'src/lib/haptics/system.ts',
    'src/lib/haptics/__tests__/system.test.ts',
    'src/components/BottomTabBar.tsx',
    'src/components/BottomTabBar.css',
    'src/components/__tests__/BottomTabBar.test.tsx',
    'e2e/planlegg.ts',
  ]);

  if (haptics.match(/navigator\s*\.\s*vibrate|prefersReducedMotion|WEB_VIBRATE_PATTERNS/u)) {
    throw new Error('Native-haptics source contract forbids browser vibration and reduced-motion gating');
  }
  if (
    !haptics.includes('selectionChanged()')
    || !haptics.includes('selectionEnd()')
    || !haptics.includes('isHapticsOn()')
  ) {
    throw new Error('Native-haptics source contract lacks the selection sequence or preference gate');
  }
  if (
    !bottomNav.includes('TAB_DEFS')
    || !bottomNav.includes('decideRootChange')
    || /useState|onFocus|onBlur|style=/u.test(bottomNav)
  ) {
    throw new Error('Bottom navigation must use TAB_DEFS, pure change decisions and CSS focus state');
  }
  for (const requiredCss of [
    'min-inline-size: 44px',
    'min-block-size: 44px',
    ':focus-visible',
    'outline: 3px',
    'env(safe-area-inset-bottom',
    '@media (forced-colors: active)',
  ]) {
    if (!bottomNavCss.includes(requiredCss)) {
      throw new Error(`Bottom navigation CSS contract is missing ${requiredCss}`);
    }
  }
  const outOfScope = changedPaths.filter((path) => !allowedPaths.has(path));
  if (outOfScope.length > 0) {
    throw new Error(`01-18 source scope drift: ${outOfScope.join(', ')}`);
  }
  if (changedPaths.some((path) => /\.(?:png|jpe?g|webp|gif|mp4|webm|zip)$/iu.test(path))) {
    throw new Error('No-media candidate contains a newly changed media artifact');
  }
}

async function runNativePolish(page: Page, fixture: PlanleggE2EFixture): Promise<void> {
  assertNativePolishSourceContracts();
  const failures = collectFailures(page);
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });
  const navigation = page.getByRole('navigation', { name: 'Hovednavigasjon' });
  await navigation.waitFor({ state: 'visible', timeout: 15_000 });
  const buttons = navigation.getByRole('button');
  if (await buttons.count() !== 4) throw new Error('Bottom navigation must expose exactly four roots');

  for (const label of ['Hjem', 'Planlegg', 'Guide', 'Familie']) {
    const button = navigation.getByRole('button', { name: label, exact: true });
    const box = await button.boundingBox();
    if (!box || box.width < 44 || box.height < 44) {
      throw new Error(`${label} does not meet the 44px target contract`);
    }
  }
  if (await navigation.locator('button[aria-current="page"]').count() !== 1) {
    throw new Error('Bottom navigation must expose exactly one current root');
  }

  const plan = navigation.getByRole('button', { name: 'Planlegg', exact: true });
  await plan.click();
  await plan.waitFor({ state: 'visible', timeout: 15_000 });
  if (await navigation.locator('button[aria-current="page"]').getAttribute('aria-current') !== 'page') {
    throw new Error('Selected root lost aria-current semantics');
  }
  const activeState = await plan.evaluate((element) => {
    const icon = element.querySelector('svg');
    const label = element.querySelector('.bottom-tab-bar__label');
    const indicator = element.querySelector('.bottom-tab-bar__indicator');
    return {
      activeClass: element.classList.contains('bottom-tab-bar__button--active'),
      strokeWidth: icon ? getComputedStyle(icon).strokeWidth : '',
      labelWeight: label ? Number.parseInt(getComputedStyle(label).fontWeight, 10) : 0,
      indicatorBackground: indicator ? getComputedStyle(indicator).backgroundColor : '',
      pointerFocusVisible: element.matches(':focus-visible'),
    };
  });
  if (
    !activeState.activeClass
    || Number.parseFloat(activeState.strokeWidth) < 2
    || activeState.labelWeight < 600
    || activeState.indicatorBackground === 'rgba(0, 0, 0, 0)'
    || activeState.pointerFocusVisible
  ) {
    throw new Error(`Active root lacks redundant state or pointer focus contract: ${JSON.stringify(activeState)}`);
  }

  const guide = navigation.getByRole('button', { name: 'Guide', exact: true });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await guide.evaluate((element) => document.activeElement === element)) break;
    await page.keyboard.press('Tab');
  }
  if (!await guide.evaluate((element) => document.activeElement === element)) {
    throw new Error('Keyboard traversal could not reach the Guide root');
  }
  const focusState = await guide.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      focusVisible: element.matches(':focus-visible'),
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
    };
  });
  if (
    !focusState.focusVisible
    || Number.parseFloat(focusState.outlineWidth) < 3
    || Number.parseFloat(focusState.outlineOffset) < 3
  ) {
    throw new Error(`Keyboard focus-visible contract failed: ${JSON.stringify(focusState)}`);
  }
  await page.keyboard.press('Enter');
  if (await guide.getAttribute('aria-current') !== 'page') {
    throw new Error('Keyboard activation did not change the root');
  }

  await page.emulateMedia({ forcedColors: 'active' });
  const forcedState = await guide.evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderWidth: style.borderWidth, outlineWidth: style.outlineWidth };
  });
  if (Number.parseFloat(forcedState.borderWidth) < 1 || Number.parseFloat(forcedState.outlineWidth) < 3) {
    throw new Error(`Forced-colors active/focus state failed: ${JSON.stringify(forcedState)}`);
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (await navigation.locator('button[aria-current="page"]').count() !== 1) {
    throw new Error('Reduced-motion root navigation lost its active state');
  }

  if (failures.length > 0) throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
}

async function main(): Promise<void> {
  assertOwnedViteUrlSignalParser();
  assertProductionManifestValidator();
  assertMainFrameNavigationCounter();
  const caseName = parseCase(process.argv.slice(2));
  const fixture = PLANLEGG_CASES[caseName];
  if (caseName === 'all') {
    for (const nextCase of SUPPORTED_CASES.filter((name) => name !== 'all')) {
      execFileSync(
        process.execPath,
        [require.resolve('tsx/cli'), 'e2e/planlegg.ts', '--case', nextCase],
        { cwd: process.cwd(), stdio: 'inherit' },
      );
    }
    console.log(`PLANLEGG HARNESS PASS: case=${caseName} fixture=${fixture.id}`);
    return;
  }
  if (caseName === 'composition-primitives') {
    await assertCompositionPrimitives();
    console.log(`PLANLEGG HARNESS PASS: case=${caseName} fixture=${fixture.id}`);
    return;
  }
  const forecastState: ForecastState = {
    mode: caseName === 'semantic-rail' ? 'zero' : 'many',
  };
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  let productionArtifactRoot: string | null = null;

  try {
    const configuredNativeAccess = caseName === 'access';
    const e2eSoon = caseName === 'snart' || caseName === 'route-migration';
    const serverOutput: string[] = [];
    if (e2eSoon) {
      productionArtifactRoot = buildOwnedSnartProductionArtifact();
    }
    const viteModeArguments = e2eSoon
      ? ['preview', '--outDir', productionArtifactRoot!]
      : configuredNativeAccess
        ? []
        : ['preview'];
    server = spawn(
      process.execPath,
      [
        VITE_CLI,
        ...viteModeArguments,
        '--host',
        '127.0.0.1',
        '--port',
        String(PORT),
        '--strictPort',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true,
        env: configuredNativeAccess
          ? {
              ...process.env,
              VITE_REVENUECAT_PUBLIC_KEY_ANDROID: 'planlegg-e2e-public-key',
            }
          : e2eSoon
            ? { ...process.env, VITE_PLANLEGG_E2E: 'true' }
            : process.env,
      },
    );
    const captureServerOutput = (chunk: Buffer) => {
      serverOutput.push(chunk.toString());
      if (serverOutput.join('').length > 12_000) serverOutput.splice(0, serverOutput.length - 12);
    };
    server.stdout?.on('data', captureServerOutput);
    server.stderr?.on('data', captureServerOutput);
    await waitForServer(BASE_URL, server, serverOutput);
    if (e2eSoon) {
      requireOwnedProductionManifest(productionArtifactRoot!, server, serverOutput);
    }

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: fixture.viewport,
      timezoneId: fixture.timeZone,
    });
    const page = await context.newPage();
    if (caseName === 'harness') {
      await runHarness(page, fixture);
    } else if (caseName === 'location-containment') {
      await installLocationContainmentPage(page, fixture);
      await runLocationContainment(page, fixture);
    } else if (caseName === 'automatic-location') {
      await installAutomaticLocationPage(page, fixture);
      await runAutomaticLocation(page, fixture);
    } else {
      await installDeterministicPage(
        page,
        forecastState,
        caseName === 'access',
      );
      if (caseName === 'snart') {
        await runSoonReadiness(page, fixture, forecastState, serverOutput);
      } else if (caseName === 'route-migration') {
        await runRouteMigration(page, fixture);
      } else if (caseName === 'native-polish') {
        await runNativePolish(page, fixture);
      } else if (caseName === 'semantic-rail') {
        await runSemanticRail(page, fixture, forecastState);
      } else if (caseName === 'composition') {
        await runComposition(page, fixture);
      } else if (caseName === 'composition-matrix') {
        await runCompositionMatrix(page, fixture, forecastState);
      } else if (caseName === 'access') {
        await runAccess(page, fixture, forecastState);
      } else {
        await runExactContext(page, fixture, forecastState);
      }
    }
    await context.close();
  } finally {
    try {
      await browser?.close();
    } finally {
      try {
        if (server) await stopPreviewServer(server);
      } finally {
        if (productionArtifactRoot) {
          removeOwnedProductionArtifact(productionArtifactRoot);
        }
      }
    }
  }

  console.log(`PLANLEGG HARNESS PASS: case=${caseName} fixture=${fixture.id}`);
}

main().catch((error) => {
  console.error(
    `PLANLEGG HARNESS FAIL: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
