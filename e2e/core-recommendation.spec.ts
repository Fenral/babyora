import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from 'playwright';

const PORT = Number(process.env.CORE_E2E_PORT ?? 4201);
const BASE = `http://127.0.0.1:${PORT}`;
const NOW = new Date('2026-08-22T08:00:00.000Z');
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

type ActivityCase = Readonly<{
  label: 'Utelek' | 'I vogn' | 'Bæresele' | 'Søvn inne';
  expectedContext: string;
}>;

const ACTIVITIES: readonly ActivityCase[] = Object.freeze([
  { label: 'Utelek', expectedContext: 'Utelek' },
  { label: 'I vogn', expectedContext: 'Vogn' },
  { label: 'Bæresele', expectedContext: 'Bæresele' },
  { label: 'Søvn inne', expectedContext: 'Søvn inne' },
]);

function fail(message: string): never {
  throw new Error(`CORE E2E FAIL: ${message}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

function deterministicForecast(tempC = -5): unknown {
  const start = NOW.getTime() - 60 * 60 * 1000;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [10.3951, 63.4305, 10] },
    properties: {
      meta: {
        updated_at: NOW.toISOString(),
        units: {
          air_temperature: 'celsius',
          precipitation_amount: 'mm',
          wind_speed: 'm/s',
          wind_from_direction: 'degrees',
          relative_humidity: '%',
          cloud_area_fraction: '%',
        },
      },
      timeseries: Array.from({ length: 72 }, (_, index) => ({
        time: new Date(start + index * 60 * 60 * 1000).toISOString(),
        data: {
          instant: {
            details: {
              air_temperature: tempC,
              wind_speed: 3,
              wind_from_direction: 180,
              relative_humidity: 75,
              cloud_area_fraction: 45,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'partlycloudy_day' },
            details: { precipitation_amount: 0 },
          },
          next_6_hours: {
            summary: { symbol_code: 'partlycloudy_day' },
            details: { precipitation_amount: 0 },
          },
        },
      })),
    },
  };
}

async function waitForServer(server: ChildProcess, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) fail(`preview avsluttet med kode ${server.exitCode}`);
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      // Preview starter fortsatt.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  fail(`preview svarte ikke innen ${timeoutMs} ms`);
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill();
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      server.kill('SIGKILL');
      resolve();
    }, 5_000);
    server.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function mobileContext(
  browser: Browser,
  options: Readonly<{
    geolocation?: Readonly<{ latitude: number; longitude: number }>;
    grantGeolocation?: boolean;
  }> = {},
): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: 'Europe/Oslo',
    reducedMotion: 'reduce',
    ...(options.geolocation ? { geolocation: options.geolocation } : {}),
  });
  if (options.grantGeolocation) {
    await context.grantPermissions(['geolocation'], { origin: BASE });
  }
  return context;
}

async function installClockAndForecast(page: Page, tempC = -5): Promise<void> {
  await page.clock.install({ time: NOW });
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(deterministicForecast(tempC)),
    });
  });
}

async function waitForWeatherReady(page: Page): Promise<void> {
  await page.getByRole('radiogroup', { name: 'Aktivitet' })
    .waitFor({ state: 'visible', timeout: 15_000 });
  const action = page.locator('button[data-cta-path]').filter({
    hasText: /Finn dagens antrekk|Vis dagens antrekk/u,
  });
  await action.first().waitFor({ state: 'visible', timeout: 10_000 });
  assert(await action.first().isEnabled(), 'anbefalingsknappen er deaktivert med gyldig vær');
}

async function calculateCurrentActivity(page: Page): Promise<void> {
  const action = page.locator('button[data-cta-path]').filter({
    hasText: /Finn dagens antrekk|Vis dagens antrekk/u,
  }).first();
  await action.click();
  await page.getByRole('heading', { name: 'Dagens antrekk', exact: true })
    .waitFor({ state: 'visible', timeout: 10_000 });
  const positions = await page.locator('.hjm-rows .hjm-num').allTextContents();
  assert(positions.length > 0, 'resultatet mangler nummererte plagg');
  assert(
    positions.every((value, index) => value.trim() === String(index + 1)),
    `plaggrekkefølgen er ikke kanonisk: ${positions.join(', ')}`,
  );
}

async function verifyOnboardingDeniedAndManual(browser: Browser): Promise<number> {
  const context = await mobileContext(browser);
  const page = await context.newPage();
  await installClockAndForecast(page);
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('#ob-name-input').fill('Ada');
    await page.getByRole('button', { name: /Fortsett/u }).click();
    await page.locator('#ob-birth-date').fill('2025-08-22');
    await page.getByRole('button', { name: /Fortsett/u }).click();

    await page.getByRole('button', { name: 'Bruk posisjonen min' }).click();
    await page.getByText('Posisjon er ikke tilgjengelig. Søk etter hjemstedet i stedet.')
      .waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByRole('combobox', { name: 'Søk etter by eller sted' }).fill('Trondheim');
    await page.getByRole('option', { name: 'Trondheim', exact: true }).first().click();
    await page.getByRole('button', { name: 'Fortsett med Trondheim' }).click();
    await page.getByRole('button', { name: 'Lag første antrekk' }).click();
    await page.getByRole('heading', { name: /Dagens råd er klart for Ada/u }).waitFor();
    await page.getByRole('button', { name: 'Vis dagens antrekk' }).click();
    await waitForWeatherReady(page);
    await calculateCurrentActivity(page);

    const startedAt = performance.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Dagens antrekk', exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 });
    const returningMs = Math.round(performance.now() - startedAt);
    assert(returningMs < 5_000, `cachet returflyt tok ${returningMs} ms`);
    console.log(`CORE E2E OK: onboarding + avvist posisjon + manuelt sted; retur=${returningMs}ms`);
    return returningMs;
  } finally {
    await context.close();
  }
}

async function verifyAutomaticLocation(browser: Browser): Promise<void> {
  const context = await mobileContext(browser, {
    geolocation: { latitude: 69.6492, longitude: 18.9553 },
    grantGeolocation: true,
  });
  const page = await context.newPage();
  let automaticForecastObserved = false;
  await page.clock.install({ time: NOW });
  await page.route('**/api/forecast?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('lat') === '69.6492' && url.searchParams.get('lon') === '18.9553') {
      automaticForecastObserved = true;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(deterministicForecast(-5)),
    });
  });
  await page.route('https://nominatim.openstreetmap.org/reverse?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lat: '69.6492',
        lon: '18.9553',
        display_name: 'Tromsø, Norge',
        address: { city: 'Tromsø' },
      }),
    });
  });
  try {
    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await waitForWeatherReady(page);
    await page.getByRole('navigation', { name: 'Hovednavigasjon' })
      .getByRole('button', { name: 'Familie', exact: true }).click();
    const toggle = page.getByRole('switch', { name: 'Bruk posisjon automatisk' });
    await toggle.click();
    const dialog = page.getByRole('dialog', { name: 'Bruk posisjon automatisk' });
    await dialog.getByRole('button', { name: /Tillat posisjon/u }).click();
    await page.getByText('Posisjon oppdatert — vær hentes for Tromsø.').waitFor();
    assert(await toggle.getAttribute('aria-checked') === 'true', 'automatisk posisjon ble ikke aktivert');
    await page.getByRole('navigation', { name: 'Hovednavigasjon' })
      .getByRole('button', { name: 'Hjem', exact: true }).click();
    await page.getByText(/Nåværende sted · Tromsø/u).waitFor({ timeout: 10_000 });
    assert(automaticForecastObserved, 'vær ble ikke hentet med automatisk posisjon');
    const persisted = await page.evaluate(() => localStorage.getItem('babyora.location-pref'));
    assert(persisted !== null && !persisted.includes('69.6492'), 'automatisk koordinat lekket til lagring');
    console.log('CORE E2E OK: automatisk posisjon + øktbundet værgrunnlag');
  } finally {
    await context.close();
  }
}

async function verifyActivity(browser: Browser, activity: ActivityCase): Promise<void> {
  const context = await mobileContext(browser);
  const page = await context.newPage();
  await installClockAndForecast(page);
  try {
    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await waitForWeatherReady(page);
    const radio = page.getByRole('radio', { name: activity.label, exact: true });
    await radio.click();
    assert(await radio.getAttribute('aria-checked') === 'true', `${activity.label} ble ikke valgt`);
    if (activity.label === 'Søvn inne') {
      await page.getByRole('slider', { name: 'Romtemperatur for søvn' }).fill('24');
    }
    await calculateCurrentActivity(page);
    await page.getByText(new RegExp(activity.expectedContext, 'u')).first().waitFor();
    if (activity.label === 'Søvn inne') {
      const result = await page.locator('.hjm-rows').innerText();
      assert(/0[,.]5 TOG/iu.test(result), 'varmt-rom-overstyringen valgte ikke 0,5 TOG');
      assert(!/2[,.]5 TOG/iu.test(result), 'varmt-rom-overstyringen lot 2,5 TOG stå igjen');
    }
    console.log(`CORE E2E OK: aktivitet ${activity.label}`);
  } finally {
    await context.close();
  }
}

async function verifyWeatherFailure(browser: Browser): Promise<void> {
  const context = await mobileContext(browser);
  const page = await context.newPage();
  await page.clock.install({ time: NOW });
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({ status: 503, body: 'unavailable' });
  });
  try {
    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await page.getByText('Får ikke tak i været akkurat nå.').waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Prøv å hente været igjen' }).waitFor();
    const action = page.locator('button[data-cta-path]').filter({
      hasText: /Finn dagens antrekk|Vis dagens antrekk/u,
    }).first();
    assert(!(await action.isEnabled()), 'værfeil lot brukeren beregne et nytt antrekk uten værgrunnlag');
    assert(await page.getByRole('heading', { name: 'Dagens antrekk', exact: true }).count() === 0,
      'værfeil viste et ubegrunnet antrekk');
    console.log('CORE E2E OK: bounded værfeil uten falskt resultat');
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  const server = spawn(
    process.execPath,
    [VITE_CLI, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    { stdio: 'ignore', shell: false, windowsHide: true },
  );
  let browser: Browser | null = null;
  try {
    await waitForServer(server);
    browser = await chromium.launch();
    const returningMs = await verifyOnboardingDeniedAndManual(browser);
    await verifyAutomaticLocation(browser);
    for (const activity of ACTIVITIES) await verifyActivity(browser, activity);
    await verifyWeatherFailure(browser);
    console.log(`CORE E2E PASS: 7/7 scenarioer; cachet retur ${returningMs}ms (<5000ms)`);
  } finally {
    await browser?.close();
    await stopServer(server);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
