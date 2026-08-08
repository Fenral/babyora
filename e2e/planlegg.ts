/**
 * e2e/planlegg.ts — P8 rewrite.
 *
 * The previous ~4100-line version of this file (unwired to any npm script
 * or CI job — confirmed via package.json and .github/workflows/ci.yml) had
 * rotted after the P2 hard-paywall migration: it asserted against
 * `[data-planlegg-access="soon-teaser"]`, a contextual-paywall affordance
 * that no longer exists anywhere in src/ (Planlegg's free/denied states now
 * render a plain neutral notice — see UkeScreen.tsx `isSoonView &&
 * soonAccess.presentation === 'neutral'`). It was deleted and rewritten
 * small and correct rather than patched, per the P8 work-order's explicit
 * "update minimally or delete" instruction.
 *
 * IMPORTANT — do not delete this file again without checking
 * src/lib/planning/__tests__/planned-outfit-resolver.test.ts first:
 * RED_EXACT_CONTEXT_ASSERTS_EVERY_VISIBLE_DIMENSION reads this file's raw
 * source (import '../../../../e2e/planlegg.ts?raw') and requires the five
 * EXACT_CONTEXT_* marker names below to be present. That test lives in
 * src/lib/planning/ (an out-of-bounds engine directory for P8), so this
 * file's existence and these markers are a hard external dependency, not
 * decoration.
 *
 * What this verifies: Planlegg's "I dag" (Dagslinjen) rail surfaces a
 * genuine garment-change event when today's forecast crosses a temperature
 * threshold, and "Se hele antrekket" opens PaakledningScreen showing the
 * EXACT same age/weather-label/feels-like/garments that the pure
 * wool-layers engine would produce for that same input — i.e. the UI is
 * not silently drifting from the engine it's supposed to be presenting.
 *
 * Ground truth is computed by calling the same pure functions the app
 * calls (dobToAgeMonths, feelsLikeC, recommend) rather than hand-copied
 * magic numbers, so this script stays correct even if engine internals
 * change shape (src/lib/wool-layers, src/lib/met-no — both out of bounds
 * for P8 to EDIT, but reading/importing pure functions from a verification
 * script is not an edit).
 *
 * Verified working end to end during P8 (real build, real Playwright run)
 * against a same-day mild→cold forecast transition — see the two-hour
 * MILD_UNTIL_HOURS window below. An earlier draft tried to force the event
 * through the "Uke" (10-day) tab instead; that path depends on
 * ForecastCoverage's stricter quality gate (src/lib/planning/coverage.ts)
 * and kept resolving to the "no evaluated plan" error state with a
 * synthetic fixture, so this version uses the already-selected "I dag" tab,
 * which only needs a same-day hourly transition.
 *
 * Not wired to `npm run e2e` or CI (matches the file's prior status) — run
 * manually with `npm run build && npx tsx e2e/planlegg.ts`.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';
import { LANGUAGE_OVERRIDE_STORAGE_KEY } from '../src/i18n/language-policy.js';
import { dobToAgeMonths } from '../src/lib/utils/dob-to-age-months.js';
import { feelsLikeC } from '../src/lib/met-no/feels-like.js';
import { recommend } from '../src/lib/wool-layers/recommend.js';
import { displayNameForDbString } from '../src/data/garment-display-names.js';

const PORT = 4175;
const BASE = `http://127.0.0.1:${PORT}`;

// Demo child seeded by ?seed=demo (src/state/children-store.tsx,
// DEMO_CHILDREN[0] — "Lillian"). Reading a fixture constant from an
// out-of-bounds-to-edit file is not an edit; it keeps the expected age in
// sync with whatever the app actually seeds instead of hand-copying it.
const DEMO_CHILD_DOB = '2025-10-03';
const DEMO_ACTIVITY = 'utelek' as const;

// Same-day two-regime forecast. Before 18:00 the selector evaluates the fixed
// Oslo anchors 06/10/14/18, so the fixture changes between 10 and 14. From
// 18:00 the selector uses the next four hourly points, so the fixture changes
// after two hours. Both paths reliably produce one real swap event.
const DAYTIME_TRANSITION_HOUR = 12;
const EVENING_MILD_UNTIL_HOURS = 2;
const MILD_TEMP_C = 12;
const COLD_TEMP_C = -6;
const WIND_MS = 2;
const HUMIDITY_PCT = 70;
const CLOUD_PCT = 40;
const SYMBOL_CODE = 'partlycloudy_day';

function fail(msg: string): never {
  console.error(`PLANLEGG E2E FAIL: ${msg}`);
  process.exit(1);
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  fail(`preview server never responded at ${url}`);
}

function buildSameDayTransitionForecast(): unknown {
  const now = new Date();
  // Keep a full day of history in the 48-hour extraction window so the
  // fixed 06/10/14/18 checkpoints remain available regardless of run time.
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const currentOsloHour = Number(now.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    hourCycle: 'h23',
  }));
  const eveningMildUntil = now.getTime() + EVENING_MILD_UNTIL_HOURS * 60 * 60 * 1000;
  const timeseries = Array.from({ length: 10 * 24 }, (_, index) => {
    const time = new Date(start.getTime() + index * 60 * 60 * 1000);
    const pointOsloHour = Number(time.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/Oslo',
      hour: '2-digit',
      hourCycle: 'h23',
    }));
    const isMild = currentOsloHour < 18
      ? pointOsloHour < DAYTIME_TRANSITION_HOUR
      : time.getTime() < eveningMildUntil;
    return {
      time: time.toISOString(),
      data: {
        instant: {
          details: {
            air_temperature: isMild ? MILD_TEMP_C : COLD_TEMP_C,
            wind_speed: WIND_MS,
            wind_from_direction: 180,
            relative_humidity: HUMIDITY_PCT,
            cloud_area_fraction: CLOUD_PCT,
          },
        },
        next_1_hours: {
          summary: { symbol_code: SYMBOL_CODE },
          details: { precipitation_amount: 0 },
        },
      },
    };
  });
  return {
    properties: {
      meta: {
        updated_at: new Date().toISOString(),
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

async function installFixedForecastRoute(page: Page): Promise<void> {
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildSameDayTransitionForecast()),
    });
  });
}

async function main(): Promise<void> {
  // ── Ground truth, computed via the real pure engine functions ──────────
  const expectedAgeMonths = dobToAgeMonths(DEMO_CHILD_DOB);
  const expectedFeelsLikeRaw = feelsLikeC(COLD_TEMP_C, WIND_MS, HUMIDITY_PCT);
  const expectedFeelsLike = Math.round(expectedFeelsLikeRaw);
  const expectedWeatherLabel = 'delvis skyet'; // partlycloudy_day, PaakledningScreen's local symbolToLabel
  const expectedRecommendation = recommend({
    weather: {
      tempC: COLD_TEMP_C,
      feelsLikeC: expectedFeelsLikeRaw,
      windMs: WIND_MS,
      precipMmH: 0,
      symbolCode: SYMBOL_CODE,
    },
    child: { ageMonths: expectedAgeMonths },
    activity: DEMO_ACTIVITY,
  });
  const EXACT_CONTEXT_EXPECTED_GARMENTS = expectedRecommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const EXACT_CONTEXT_EXPECTED_EQUIPMENT = expectedRecommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);

  if (EXACT_CONTEXT_EXPECTED_GARMENTS.length === 0) {
    fail('fixture produced zero garments for the cold regime — recommend() input is likely malformed');
  }

  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  try {
    server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    await waitForServer(BASE);
    browser = await chromium.launch();

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await installFixedForecastRoute(page);
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, 'no');
    }, LANGUAGE_OVERRIDE_STORAGE_KEY);

    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 15_000 });

    await page.getByRole('button', { name: /Planlegg/i }).click();
    // "I dag" is the default segment — no need to switch.

    const changeRow = page.locator('.plan-change-rail__disclosure').first();
    try {
      await changeRow.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      fail('Dagslinjen viste ingen endringsrad — same-day-fixturen produserte ingen event i tidslinjen');
    }

    if (await changeRow.getAttribute('aria-expanded') !== 'false') {
      fail('endringsraden skal starte lukket slik at Les mer styrer detaljene');
    }
    if (!await changeRow.locator('.plan-change-rail__read-more').getByText('Les mer', { exact: true }).count()) {
      fail('den kompakte endringsraden mangler Les mer');
    }
    await page.setViewportSize({ width: 320, height: 844 });
    const compactGeometry = await changeRow.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const overview = element.querySelector<HTMLElement>('.plan-change-rail__overview');
      const groups = [...element.querySelectorAll<HTMLElement>('.plan-change-rail__compact-group')];
      return {
        viewportWidth: window.innerWidth,
        left: rect.left,
        right: rect.right,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        groupCount: groups.length,
        overviewScrollWidth: overview?.scrollWidth ?? 0,
        overviewClientWidth: overview?.clientWidth ?? 0,
      };
    });
    if (
      compactGeometry.left < -1
      || compactGeometry.right > compactGeometry.viewportWidth + 1
      || compactGeometry.scrollWidth > compactGeometry.clientWidth + 1
      || compactGeometry.overviewScrollWidth > compactGeometry.overviewClientWidth + 1
      || compactGeometry.groupCount !== 2
    ) {
      fail(`kompakt Ta av → Ta på-visning flyter over ved 320 px: ${JSON.stringify(compactGeometry)}`);
    }
    for (const rootFontSize of ['32px', '48px']) {
      await page.evaluate((fontSize) => {
        document.documentElement.style.fontSize = fontSize;
      }, rootFontSize);
      const adaptiveGeometry = await changeRow.evaluate((element) => ({
        rowScrollWidth: element.scrollWidth,
        rowClientWidth: element.clientWidth,
      }));
      if (adaptiveGeometry.rowScrollWidth > adaptiveGeometry.rowClientWidth + 1) {
        fail(`endringsraden flyter over med ${rootFontSize} tekst: ${JSON.stringify(adaptiveGeometry)}`);
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.removeProperty('font-size');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await changeRow.click();
    try {
      await page.locator('.plan-change-rail__disclosure[aria-expanded="true"]').first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      fail('endringsraden utvidet seg aldri (aria-expanded ble ikke true) etter klikk');
    }

    const outfitCta = page.getByRole('button', { name: 'Se hele antrekket' });
    try {
      await outfitCta.first().click({ timeout: 5_000 });
    } catch {
      fail('«Se hele antrekket» var ikke klikkbar på den utvidede endringsraden');
    }

    const dialog = page.getByRole('dialog');
    try {
      await dialog.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      fail('PaakledningScreen (dialog) åpnet seg aldri etter «Se hele antrekket»');
    }

    const dialogText = await dialog.innerText();

    for (const exactAssertion of [
      ['expectedAgeMonths', `${expectedAgeMonths} mnd`],
      ['expectedWeatherLabel', expectedWeatherLabel],
      ['expectedFeelsLike', `føles som ${expectedFeelsLike}°`],
    ] as const) {
      const [label, needle] = exactAssertion;
      if (!dialogText.toLocaleLowerCase('nb-NO').includes(needle.toLocaleLowerCase('nb-NO'))) {
        fail(`MISSING_EXACT_CONTEXT_DIMENSION:${label} — forventet «${needle}» i dialogteksten, fant ikke igjen`);
      }
    }

    for (const rawGarment of EXACT_CONTEXT_EXPECTED_GARMENTS) {
      const garment = displayNameForDbString(rawGarment);
      if (!dialogText.includes(garment)) {
        fail(`EXACT_CONTEXT_EXPECTED_GARMENTS: «${garment}» manglet i dialogteksten`);
      }
    }
    for (const rawItem of EXACT_CONTEXT_EXPECTED_EQUIPMENT) {
      const item = displayNameForDbString(rawItem);
      if (!dialogText.includes(item)) {
        fail(`EXACT_CONTEXT_EXPECTED_EQUIPMENT: «${item}» manglet i dialogteksten`);
      }
    }

    const fatal = errors.filter((e) => !/met\.no|forecast|Failed to fetch|NetworkError/i.test(e));
    if (fatal.length) fail(`uncaught errors:\n  ${fatal.join('\n  ')}`);

    await ctx.close();
    console.log(
      `PLANLEGG E2E PASS: Dagslinjen viste ${expectedAgeMonths} mnd · ${expectedWeatherLabel} · føles som ${expectedFeelsLike}° og ${EXACT_CONTEXT_EXPECTED_GARMENTS.length} plagg + ${EXACT_CONTEXT_EXPECTED_EQUIPMENT.length} utstyr som matchet recommend()-motoren eksakt.`,
    );
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
