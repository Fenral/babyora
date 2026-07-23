import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import * as ReactRuntime from 'react';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PLANLEGG_E2E_FIXTURES,
  type PlanleggE2EFixture,
} from './fixtures/planlegg.js';

const PORT = 4191;
const BASE_URL = `http://127.0.0.1:${PORT}`;
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
    || !ukeSource.includes('useWeather(lat, lon, FALLBACK_REF_HOUR, refreshKey)')
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

async function waitForServer(
  url: string,
  server: ChildProcess,
  timeoutMs = 30_000,
): Promise<void> {
  let spawnError: Error | null = null;
  server.once('error', (error) => {
    spawnError = error;
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) {
      throw new Error(`Preview-prosessen avsluttet før oppstart med kode ${server.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview-prosessen starter fortsatt.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
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
        state: { isPremium: true, lastSyncedAt: 1 },
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

async function openPlanlegg(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  const planButton = page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Planlegg/u });
  await planButton.waitFor({ state: 'visible', timeout: 15_000 });
  await planButton.click();
  await page.getByRole('heading', { level: 1, name: 'Planlegg', exact: true })
    .waitFor({ state: 'attached', timeout: 15_000 });
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
  if (!(await context.innerText()).includes('Lillian · Trondheim')) {
    throw new Error(`Synlig barn-/stedskontekst avvek: ${await context.innerText()}`);
  }
  const radios = screen.getByRole('radio');
  if (
    await radios.count() !== 2
    || await screen.getByRole('radio', { name: 'I dag', exact: true }).count() !== 1
    || await screen.getByRole('radio', { name: 'Uke', exact: true }).count() !== 1
    || await screen.getByText('Snart', { exact: true }).count() !== 0
  ) {
    throw new Error('Planlegg skal bare ha native I dag/Uke-kontrollen');
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
    await page.getByRole('radio').count() !== 2
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

async function beginEntitlementRefresh(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('planlegg:e2e-entitlement-begin'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
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
    || !appSource.includes("decideAccess('future_plan'")
    || !appSource.includes('Capacitor.isNativePlatform()')
    || !ukeSource.includes('localDate(day.date) === nextCalendarDate')
  ) {
    throw new Error(
      'RED_PLANLEGG_ACCESS_REVIEW_REPAIR: native cache må isoleres og i morgen må være eksakt neste kalenderdag',
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
    /sammen|familie|begge foreldre|alle som passer barnet|omsorgsperson|automatisk sted|overalt|snart/iu
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
  await page.locator('[data-planlegg-access="free-week-comparison"]')
    .waitFor({ state: 'visible', timeout: 15_000 });

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
    || await page.locator('[data-planlegg-access="free-week-comparison"]').count() !== 1
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

async function main(): Promise<void> {
  const caseName = parseCase(process.argv.slice(2));
  const fixture = PLANLEGG_CASES[caseName];
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

  try {
    const configuredNativeAccess = caseName === 'access';
    server = spawn(
      process.execPath,
      [
        VITE_CLI,
        ...(configuredNativeAccess ? [] : ['preview']),
        '--host',
        '127.0.0.1',
        '--port',
        String(PORT),
        '--strictPort',
      ],
      {
        stdio: 'ignore',
        shell: false,
        windowsHide: true,
        env: configuredNativeAccess
          ? {
              ...process.env,
              VITE_REVENUECAT_PUBLIC_KEY_ANDROID: 'planlegg-e2e-public-key',
            }
          : process.env,
      },
    );
    await waitForServer(BASE_URL, server);

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
    } else {
      await installDeterministicPage(
        page,
        forecastState,
        caseName === 'access',
      );
      if (caseName === 'semantic-rail') {
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
      if (server) await stopPreviewServer(server);
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
