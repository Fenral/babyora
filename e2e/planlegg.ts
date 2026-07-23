import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
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
}) satisfies Readonly<Record<string, PlanleggE2EFixture>>;
type PlanleggCase = keyof typeof PLANLEGG_CASES;
type ForecastMode = 'zero' | 'one' | 'many';

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

function fixtureTemperature(localHour: number, mode: ForecastMode): number {
  if (mode === 'zero') return 4;
  if (mode === 'one') return localHour < 15 ? -8 : 14;
  if (localHour < 8) return -12;
  if (localHour < 12) return 1;
  if (localHour < 16) return 15;
  return -3;
}

function buildForecast(mode: ForecastMode): unknown {
  const start = Date.parse('2026-02-11T23:00:00.000Z');
  const timeseries = Array.from({ length: 72 }, (_, index) => {
    const instant = new Date(start + index * 60 * 60 * 1000);
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
            air_temperature: fixtureTemperature(localHour, mode),
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
  });
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
    if (
      request.resourceType() !== 'font'
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
  forecastState: { mode: ForecastMode },
): Promise<void> {
  await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(() => {
    localStorage.setItem('babyora.subscription', JSON.stringify({
      state: { isPremium: true, lastSyncedAt: 1 },
      version: 0,
    }));
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('metno:')) localStorage.removeItem(key);
    }
  });
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildForecast(forecastState.mode)),
    });
  });
}

async function openPlanlegg(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  const planButton = page
    .getByRole('navigation')
    .first()
    .getByRole('button', { name: /^Planlegg/u });
  await planButton.waitFor({ state: 'visible', timeout: 15_000 });
  await planButton.click();
  await page.getByRole('heading', { name: /time-for-time prognose/u })
    .waitFor({ state: 'attached', timeout: 15_000 });
}

async function reloadPlanlegg(
  page: Page,
  path: string,
  forecastState: { mode: ForecastMode },
  mode: ForecastMode,
): Promise<void> {
  forecastState.mode = mode;
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

async function runSemanticRail(
  page: Page,
  fixture: PlanleggE2EFixture,
  forecastState: { mode: ForecastMode },
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
  forecastState: { mode: ForecastMode },
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
  const scrollContainer = page.locator('.ba-temp-root').first();
  await scrollContainer.evaluate((element) => {
    element.scrollTop = 120;
  });
  const scrollBefore = await scrollContainer.evaluate((element) => element.scrollTop);
  await outfitCta.focus();
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
  if (!(await dialog.textContent())?.includes('Tilgang: future_plan')) {
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

async function main(): Promise<void> {
  const caseName = parseCase(process.argv.slice(2));
  const fixture = PLANLEGG_CASES[caseName];
  if (caseName === 'composition-primitives') {
    await assertCompositionPrimitives();
    console.log(`PLANLEGG HARNESS PASS: case=${caseName} fixture=${fixture.id}`);
    return;
  }
  const forecastState: { mode: ForecastMode } = {
    mode: caseName === 'semantic-rail' ? 'zero' : 'many',
  };
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;

  try {
    server = spawn(
      process.execPath,
      [
        VITE_CLI,
        'preview',
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
    } else {
      await installDeterministicPage(page, forecastState);
      if (caseName === 'semantic-rail') {
        await runSemanticRail(page, fixture, forecastState);
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
