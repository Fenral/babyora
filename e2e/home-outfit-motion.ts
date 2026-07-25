import { readFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const PORT = 4318;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const PRODUCTION_NOW = new Date('2026-02-12T12:00:00.000Z');
const PAGE_FAILURES = new WeakMap<Page, string[]>();
const requestedCase = process.argv[
  process.argv.indexOf('--case') + 1
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitForServer(server: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited early with ${server.exitCode}`);
    }
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Bounded local startup poll.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error('Timed out waiting for the local Vite fixture server');
}

function deterministicForecast(): unknown {
  const start = Date.parse('2026-02-11T23:00:00.000Z');
  return {
    properties: {
      meta: {
        updated_at: PRODUCTION_NOW.toISOString(),
        units: {
          air_temperature: 'celsius',
          wind_speed: 'm/s',
          wind_from_direction: 'degrees',
          relative_humidity: '%',
          cloud_area_fraction: '%',
          precipitation_amount: 'mm',
        },
      },
      timeseries: Array.from({ length: 72 }, (_, index) => ({
        time: new Date(start + index * 3_600_000).toISOString(),
        data: {
          instant: {
            details: {
              air_temperature: (() => {
                const localHour = (
                  new Date(start + index * 3_600_000).getUTCHours() + 1
                ) % 24;
                return localHour < 8
                  ? -8
                  : localHour < 12
                    ? 1
                    : localHour < 16 ? 28 : -3;
              })(),
              wind_speed: 2,
              wind_from_direction: 180,
              relative_humidity: 72,
              cloud_area_fraction: 35,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'fair_day' },
            details: { precipitation_amount: 0 },
          },
        },
      })),
    },
  };
}

async function installProductionInputs(page: Page): Promise<void> {
  await page.clock.install({ time: PRODUCTION_NOW });
  await page.addInitScript(() => {
    localStorage.setItem('babyora.subscription', JSON.stringify({
      state: { isPremium: true, lastSyncedAt: 1 },
      version: 0,
    }));
  });
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(deterministicForecast()),
    });
  });
}

async function runProductionSignature(browser: Browser): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    timezoneId: 'Europe/Oslo',
  });
  const page = await context.newPage();
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push(`console: ${message.text()}`);
    }
  });
  await installProductionInputs(page);
  await page.goto(`${BASE_URL}/?seed=demo`, { waitUntil: 'networkidle' });

  const stroller = page.getByRole('button', { name: 'I vogn', exact: true });
  await stroller.click();
  assert(await stroller.getAttribute('aria-pressed') === 'true',
    'compiled App did not activate the real 28C I vogn context');
  const source = page.locator('[data-outfit-transition-source]');
  await source.first().waitFor({ state: 'visible', timeout: 10_000 });
  const sourceIds = await source.evaluateAll((nodes) => nodes.map(
    (node) => (node as HTMLElement).dataset.outfitTransitionSource ?? '',
  ));
  assert(sourceIds.length > 0 && new Set(sourceIds).size === sourceIds.length,
    'compiled Home did not expose unique exact transition IDs');

  await page.locator('#hjem-current-outfit-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Lillian', exact: true });
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  const heading = dialog.getByRole('heading', { name: 'Lillian', exact: true });
  assert(await heading.evaluate((node) => document.activeElement === node),
    'semantic Outfit heading was not focused at T0');
  const targetIds = await dialog.locator('[data-outfit-row]').evaluateAll(
    (nodes) => nodes.map((node) => (node as HTMLElement).dataset.outfitRow ?? ''),
  );
  assert(JSON.stringify(targetIds) === JSON.stringify(sourceIds),
    'actual Home IDs did not map to actual Outfit rows in exact order');

  const overlay = page.locator('[data-outfit-transition-overlay]');
  await overlay.waitFor({ state: 'attached', timeout: 10_000 });
  assert(await overlay.getAttribute('aria-hidden') === 'true',
    'overlay is not semantic-hidden');
  assert((await overlay.evaluate((node) => getComputedStyle(node).pointerEvents)) === 'none',
    'overlay is not pointer-inert');
  assert(Number(await overlay.getAttribute('data-outfit-transition-duration-ms')) === 1_250,
    'overlay did not use the bounded 1250ms explanation');
  const clones = overlay.locator('[data-outfit-transition-clone]');
  assert(await clones.count() === sourceIds.length,
    'overlay clone count diverged from exact visible garment count');
  const destinationProof = await clones.evaluateAll((nodes) => nodes.map((node) => {
    const element = node as HTMLElement;
    return {
      id: element.dataset.outfitTransitionClone ?? '',
      x: Number(element.dataset.outfitTransitionTargetX),
      y: Number(element.dataset.outfitTransitionTargetY),
      width: Number(element.dataset.outfitTransitionTargetWidth),
      height: Number(element.dataset.outfitTransitionTargetHeight),
      end: Number(element.dataset.outfitTransitionEndMs),
    };
  }));
  const targetRects = await dialog.locator('[data-outfit-row]').evaluateAll(
    (nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  destinationProof.forEach((proof, index) => {
    const target = targetRects[index];
    assert(proof.id === sourceIds[index] && target !== undefined,
      'overlay destination ID/order diverged');
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      assert(Math.abs(proof[key] - target[key]) < 0.51,
        `overlay immutable ${key} did not equal the actual row`);
    }
    assert(proof.end === 1_250, 'clone completion exceeded shared clock');
  });
  assert(await dialog.locator('[data-transition-visual-state="landing"]').count() === 1,
    'semantic Outfit did not enter landing before explanation playback');
  await overlay.waitFor({ state: 'detached', timeout: 3_000 });
  assert(await page.locator('.app-shell').getAttribute('data-outfit-transition-state') === 'settled',
    'compiled App did not settle after completion');
  assert(await dialog.locator('[data-outfit-row]').count() === targetIds.length,
    'semantic Outfit DOM changed after settlement');

  await page.getByRole('button', { name: 'Lukk dagens antrekk', exact: true }).click();
  await page.locator('#hjem-current-outfit-trigger').press('Enter');
  await dialog.waitFor({ state: 'visible' });
  assert(await page.locator('[data-outfit-transition-overlay]').count() === 0,
    'same-triple keyboard replay created a duplicate overlay');
  await page.getByRole('button', { name: 'Lukk dagens antrekk', exact: true }).click();
  assert(
    failures.length === 0,
    `compiled App emitted fatal browser errors: ${failures.join(' | ')}`,
  );
  await context.close();
}

async function loadFixture(
  browser: Browser,
  options: Readonly<{
    width?: number;
    height?: number;
    reducedMotion?: 'reduce' | 'no-preference';
    forcedColors?: 'active' | 'none';
    omitSource?: boolean;
    theme?: 'light' | 'dark';
    tempC?: number;
    feelsLikeC?: number;
    symbolCode?: string;
    activity?: 'vogn' | 'baeresele' | 'utelek' | 'soevn';
    childCalibration?: -1 | 0 | 1;
    vognMode?: 'awake' | 'sleeping';
    appMotion?: 'allow' | 'reduce';
    duplicateLabels?: boolean;
  }> = {},
): Promise<Page> {
  const page = await browser.newPage({
    viewport: {
      width: options.width ?? 390,
      height: options.height ?? 844,
    },
    reducedMotion: options.reducedMotion ?? 'no-preference',
    forcedColors: options.forcedColors ?? 'none',
  });
  const failures: string[] = [];
  PAGE_FAILURES.set(page, failures);
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push(`console: ${message.text()}`);
    }
  });
  await page.goto(`${BASE_URL}/robots.txt`, {
    waitUntil: 'domcontentloaded',
  });
  await page.setContent(`
    <body
      data-omit-source="${options.omitSource === true}"
      data-theme="${options.theme ?? 'light'}"
      data-temp-c="${options.tempC ?? 28}"
      data-feels-like-c="${options.feelsLikeC ?? options.tempC ?? 28}"
      data-symbol-code="${options.symbolCode ?? 'clearsky_day'}"
      data-activity="${options.activity ?? 'vogn'}"
      data-child-calibration="${options.childCalibration ?? 0}"
      data-vogn-mode="${options.vognMode ?? 'awake'}"
      data-app-motion="${options.appMotion ?? 'allow'}"
      data-duplicate-labels="${options.duplicateLabels === true}"
    >
      <script type="module">
        import RefreshRuntime from '/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
      </script>
      <script type="module"
        src="/e2e/fixtures/home-outfit-motion.ts">
      </script>
    </body>
  `);
  try {
    await page.waitForSelector(
      'body[data-fixture-ready="true"]',
      { timeout: 10_000 },
    );
  } catch (error) {
    throw new Error(
      `fixture startup failed: ${failures.join(' | ') || String(error)}`,
      { cause: error },
    );
  }
  return page;
}

function assertNoPageErrors(page: Page, label: string): void {
  const failures = PAGE_FAILURES.get(page) ?? [];
  assert(
    failures.length === 0,
    `${label}: fatal browser errors: ${failures.join(' | ')}`,
  );
}

async function state(page: Page): Promise<string> {
  return page.evaluate(
    () => window.__homeOutfitMotionFixture?.state() ?? 'missing',
  );
}

async function runCoordinatorCase(browser: Browser): Promise<void> {
  for (const width of [320, 390]) {
    const page = await loadFixture(browser, { width });
    await page.click('#open-outfit');
    assert(
      await page.evaluate(
        () => window.__homeOutfitMotionFixture?.semanticT0(),
      ),
      `${width}px: dialog semantics/focus were not present at T0`,
    );
    await page.waitForTimeout(100);
    const firstState = await state(page);
    const firstReason = await page.evaluate(
      () => window.__homeOutfitMotionFixture?.reason(),
    );
    const firstItemCount = await page.evaluate(
      () => window.__homeOutfitMotionFixture?.itemIds.length,
    );
    const bundleDiagnostic = await page.evaluate(() => ({
      provenance: document.body.dataset.bundleProvenance,
      visibleCount: document.body.dataset.bundleVisibleCount,
    }));
    assert(
      firstState === 'ready' || firstState === 'playing',
      `${width}px: expected ready/playing, received ${firstState}/${firstReason}`
        + ` with ${firstItemCount} items ${JSON.stringify(bundleDiagnostic)}`,
    );
    assert(
      await page.locator('[data-outfit-transition-source]').count()
        === await page.locator('[data-outfit-transition-target]').count(),
      `${width}px: source and target item sets diverged`,
    );
    const sourceTruth = await page
      .locator('[data-outfit-transition-source]')
      .evaluateAll((nodes) => nodes.map((node) => {
        const element = node as HTMLElement;
        const style = getComputedStyle(element);
        const rectangle = element.getBoundingClientRect();
        return {
          itemId: element.dataset.outfitTransitionSource,
          label: element.textContent?.trim(),
          visible: (
            style.display !== 'none'
            && style.visibility !== 'hidden'
            && Number(style.opacity) > 0
            && rectangle.width > 0
            && rectangle.height > 0
          ),
        };
      }));
    const exactItemIds = await page.evaluate(
      () => window.__homeOutfitMotionFixture?.itemIds ?? [],
    );
    assert(
      JSON.stringify(sourceTruth.map(({ itemId }) => itemId))
        === JSON.stringify(exactItemIds),
      `${width}px: visible pill IDs diverged from adapter selection`,
    );
    assert(
      sourceTruth.every(({ label, visible }) => (
        visible && typeof label === 'string' && label.length > 0
      )),
      `${width}px: a transition source is not an actual visible labelled pill`,
    );
    await page.click('#close-outfit');
    assert(
      await page.evaluate(() => document.activeElement?.id)
        === 'open-outfit',
      `${width}px: focus did not return to opener`,
    );
    await page.click('#open-outfit');
    assert(
      await page.evaluate(
        () => window.__homeOutfitMotionFixture?.reason(),
      ) === 'already-attempted',
      `${width}px: replay policy attempted the same triple twice`,
    );
    await page.close();
  }

  const rapidPage = await loadFixture(browser);
  await rapidPage.evaluate(() => {
    const opener = document.getElementById('open-outfit');
    if (!(opener instanceof HTMLButtonElement)) {
      throw new Error('missing opener');
    }
    opener.click();
    opener.click();
  });
  assert(
    await rapidPage.locator('dialog[open]').count() === 1,
    'rapid activation created duplicate open dialogs',
  );
  assert(
    await rapidPage.evaluate(
      () => window.__homeOutfitMotionFixture?.semanticT0(),
    ),
    'rapid activation lost dialog semantics or initial focus',
  );
  assert(
    await rapidPage.evaluate(
      () => window.__homeOutfitMotionFixture?.openCount(),
    ) === 2,
    'rapid activation did not exercise two synchronous opener activations',
  );
  assert(
    await rapidPage.evaluate(
      () => window.__homeOutfitMotionFixture?.reason(),
    ) === 'already-attempted',
    'rapid activation did not settle the pending replay attempt',
  );
  const rapidRetention = await rapidPage.evaluate(
    () => window.__homeOutfitMotionFixture?.retention(),
  );
  assert(
    rapidRetention?.targetElementCount === 0
      && rapidRetention.hasActiveBundle === false
      && rapidRetention.hasScheduledReadiness === false,
    `rapid activation retained transient state: ${
      JSON.stringify(rapidRetention)
    }`,
  );
  assert(
    await rapidPage.evaluate(
      () => window.__homeOutfitMotionFixture?.lifecycleBindings(),
    ) === 1,
    'rapid activation duplicated lifecycle bindings',
  );
  await rapidPage.click('#close-outfit');
  assert(
    await rapidPage.evaluate(() => document.activeElement?.id)
      === 'open-outfit',
    'rapid activation close did not restore opener focus',
  );
  await rapidPage.click('#open-outfit');
  assert(
    await rapidPage.locator('dialog[open]').count() === 1
      && await rapidPage.evaluate(() => document.activeElement?.id)
        === 'close-outfit',
    'dialog did not reopen once with correct focus after rapid activation',
  );
  assert(
    await rapidPage.evaluate(
      () => window.__homeOutfitMotionFixture?.openCount(),
    ) === 3,
    'reopen after rapid activation did not remain single-path',
  );
  const reopenedRetention = await rapidPage.evaluate(
    () => window.__homeOutfitMotionFixture?.retention(),
  );
  assert(
    reopenedRetention?.targetElementCount === 0
      && reopenedRetention.hasScheduledReadiness === false,
    `already-attempted reopen retained target state: ${
      JSON.stringify(reopenedRetention)
    }`,
  );
  await rapidPage.close();

  for (const scenario of [
    { reducedMotion: 'reduce' as const },
    { forcedColors: 'active' as const },
    { theme: 'dark' as const, tempC: -8 },
    { theme: 'light' as const, tempC: 18 },
  ]) {
    const page = await loadFixture(browser, scenario);
    await page.click('#open-outfit');
    assert(
      await page.evaluate(
        () => window.__homeOutfitMotionFixture?.semanticT0(),
      ),
      `semantic T0 failed for ${JSON.stringify(scenario)}`,
    );
    if (scenario.reducedMotion === 'reduce') {
      assert(
        await page.evaluate(
          () => window.__homeOutfitMotionFixture?.reason(),
        ) === 'motion-ineligible',
        'reduced motion was not consumed as a static attempt',
      );
    }
    assert(
      await page.locator('[data-home-atmosphere="decorative"]').count() === 1,
      `same-snapshot atmosphere missing for ${JSON.stringify(scenario)}`,
    );
    await page.close();
  }

  const zoomPage = await loadFixture(browser);
  await zoomPage.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await zoomPage.click('#open-outfit');
  assert(
    await zoomPage.evaluate(
      () => window.__homeOutfitMotionFixture?.semanticT0(),
    ),
    '200% zoom blocked dialog semantics',
  );
  await zoomPage.close();

  const missingPage = await loadFixture(browser, { omitSource: true });
  await missingPage.click('#open-outfit');
  const missingReason = await missingPage.evaluate(
    () => window.__homeOutfitMotionFixture?.reason(),
  );
  const missingDiagnostic = await missingPage.evaluate(() => ({
    state: window.__homeOutfitMotionFixture?.state(),
    retention: window.__homeOutfitMotionFixture?.retention(),
    omitApplied: document.body.dataset.omitApplied,
    omitHomeCount: document.body.dataset.omitHomeCount,
    sourceCount: document.querySelectorAll(
      '[data-outfit-transition-source]',
    ).length,
  }));
  assert(
    missingReason === 'invalid-source',
    `missing source did not settle static: ${missingReason ?? 'no reason'} ${
      JSON.stringify(missingDiagnostic)
    }`,
  );
  assert(
    await missingPage.locator('dialog[open]').count() === 1,
    'missing source blocked semantic navigation',
  );
  await missingPage.close();

  for (const lifecycle of [
    'visibilitychange',
    'pagehide',
    'resize',
    'orientationchange',
    'scroll',
  ]) {
    const page = await loadFixture(browser);
    await page.click('#open-outfit');
    if (lifecycle === 'visibilitychange') {
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    } else {
      await page.evaluate((eventName) => {
        window.dispatchEvent(new Event(eventName));
      }, lifecycle);
    }
    assert(
      await state(page) === 'settled',
      `${lifecycle} did not settle the active attempt`,
    );
    await page.close();
  }

  const backPage = await loadFixture(browser);
  await backPage.click('#open-outfit');
  await backPage.evaluate(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  assert(
    await backPage.locator('dialog[open]').count() === 0,
    'native back did not close the dialog',
  );
  assert(
    await backPage.evaluate(() => document.activeElement?.id)
      === 'open-outfit',
    'native back did not restore focus',
  );
  await backPage.close();
}

async function runExpandedAcceptanceMatrix(browser: Browser): Promise<void> {
  const cardinalityEvidence: Array<Record<string, unknown>> = [];
  for (const count of [1, 4, 5, 10]) {
    const page = await loadFixture(browser);
    const result = await page.evaluate((requestedCount) => (
      window.__homeOutfitMotionFixture?.runCardinality(requestedCount)
    ), count);
    assert(result?.kind === 'animate', `${count}: eligibility did not animate`);
    assert(
      result.normalUiDurationMs >= 180
        && result.normalUiDurationMs <= 250,
      `${count}: canonical normal feedback escaped 180-250ms`,
    );
    const sourceIds = await page.locator(
      '#cardinality-lab [data-outfit-transition-source]',
    ).evaluateAll((nodes) => nodes.map(
      (node) => (node as HTMLElement).dataset.outfitTransitionSource,
    ));
    const targetIds = await page.locator(
      '#cardinality-lab [data-outfit-transition-target]',
    ).evaluateAll((nodes) => nodes.map(
      (node) => (node as HTMLElement).dataset.outfitTransitionTarget,
    ));
    const cloneIds = await page.locator(
      '[data-outfit-transition-clone]',
    ).evaluateAll((nodes) => nodes.map(
      (node) => (node as HTMLElement).dataset.outfitTransitionClone,
    ));
    assert(
      sourceIds.length === count
        && targetIds.length === count
        && cloneIds.length === count,
      `${count}: transition cardinality was truncated`,
    );
    assert(
      JSON.stringify(sourceIds) === JSON.stringify(targetIds)
        && JSON.stringify(sourceIds) === JSON.stringify(cloneIds),
      `${count}: source/target/clone identity sets diverged`,
    );
    assert(new Set(sourceIds).size === count,
      `${count}: branded item IDs were not unique`);
    if (count >= 4) {
      const duplicateLabels = await page.locator(
        '#cardinality-lab [data-outfit-transition-source]',
      ).evaluateAll((nodes) => nodes.slice(0, 2).map(
        (node) => node.textContent?.trim(),
      ));
      assert(
        duplicateLabels[0] === duplicateLabels[1]
          && sourceIds[0] !== sourceIds[1],
        `${count}: duplicate labels were not paired by branded identity`,
      );
    }
    assert(
      await page.locator('#cardinality-heading').count() === 1
        && await page.locator('#cardinality-lab button').count() === 1,
      `${count}: semantic Outfit heading/control missing at T0`,
    );
    const rowsSafe = await page.locator(
      '#cardinality-lab [data-outfit-row]',
    ).evaluateAll((nodes) => nodes.every((node) => (
      node.getAttribute('aria-hidden') !== 'true'
      && !node.hasAttribute('inert')
    )));
    assert(rowsSafe, `${count}: semantic rows were hidden or inert`);
    const overlay = page.locator('[data-outfit-transition-overlay]');
    assert(await overlay.getAttribute('aria-hidden') === 'true',
      `${count}: overlay was exposed to accessibility`);
    assert(await overlay.evaluate(
      (node) => getComputedStyle(node).pointerEvents,
    ) === 'none', `${count}: overlay intercepted input`);
    const duration = Number(
      await overlay.getAttribute('data-outfit-transition-duration-ms'),
    );
    const ends = await page.locator(
      '[data-outfit-transition-clone]',
    ).evaluateAll((nodes) => nodes.map(
      (node) => Number(
        (node as HTMLElement).dataset.outfitTransitionEndMs,
      ),
    ));
    assert(
      duration >= 900 && duration <= 1_400
        && ends.every((end) => end === duration),
      `${count}: explanation timing escaped the shared 900-1400ms clock`,
    );
    await overlay.waitFor({ state: 'detached', timeout: 3_000 });
    assertNoPageErrors(page, `cardinality ${count}`);
    cardinalityEvidence.push({
      count,
      normalUiDurationMs: result.normalUiDurationMs,
      duration,
      exactIds: true,
      overlayCleaned: true,
    });
    await page.close();
  }
  console.log(
    `matrix cardinality/timing: ${JSON.stringify(cardinalityEvidence)}`,
  );

  const atmospherePage = await loadFixture(browser, { tempC: 10 });
  const palettes = [
    { tempC: -8, expected: 'cold' },
    { tempC: 10, expected: 'mild' },
    { tempC: 28, expected: 'warm' },
  ] as const;
  const litConditions = [
    ['clearsky', 'sun'],
    ['partlycloudy', 'cloud'],
    ['rainshowers', 'rain'],
    ['snowshowers', 'snow'],
    ['rainshowersandthunder', 'storm'],
  ] as const;
  const lighting = [
    ['day', 'day'],
    ['night', 'night'],
    ['polartwilight', 'polar-twilight'],
  ] as const;
  let atmosphereRows = 0;
  for (const palette of palettes) {
    for (const [baseCode, expectedCondition] of litConditions) {
      for (const [suffix, expectedLighting] of lighting) {
        await atmospherePage.evaluate(
          ({ tempC, symbolCode }) => {
            window.__homeOutfitMotionFixture?.setAtmosphere(
              tempC,
              tempC,
              symbolCode,
            );
          },
          { tempC: palette.tempC, symbolCode: `${baseCode}_${suffix}` },
        );
        const actual = await atmospherePage.locator(
          '[data-home-atmosphere="decorative"]',
        ).evaluate((node) => ({
          palette: (node as HTMLElement).dataset.palette,
          condition: (node as HTMLElement).dataset.condition,
          lighting: (node as HTMLElement).dataset.lighting,
        }));
        assert(
          actual.palette === palette.expected
            && actual.condition === expectedCondition
            && actual.lighting === expectedLighting,
          `atmosphere cross-product mismatch: ${JSON.stringify(actual)}`,
        );
        atmosphereRows += 1;
      }
    }
    for (const [symbolCode, expectedCondition] of [
      ['fog', 'fog'],
      ['invalid-provider-symbol', 'unknown'],
    ] as const) {
      await atmospherePage.evaluate(
        ({ tempC, symbolCode: code }) => {
          window.__homeOutfitMotionFixture?.setAtmosphere(tempC, tempC, code);
        },
        { tempC: palette.tempC, symbolCode },
      );
      const actual = await atmospherePage.locator(
        '[data-home-atmosphere="decorative"]',
      ).evaluate((node) => ({
        palette: (node as HTMLElement).dataset.palette,
        condition: (node as HTMLElement).dataset.condition,
        lighting: (node as HTMLElement).dataset.lighting,
      }));
      assert(
        actual.palette === palette.expected
          && actual.condition === expectedCondition
          && actual.lighting === 'neutral',
        `neutral atmosphere mismatch: ${JSON.stringify(actual)}`,
      );
      atmosphereRows += 1;
    }
  }
  await atmospherePage.evaluate(() => {
    window.__homeOutfitMotionFixture?.setAtmosphere(null, null, null);
  });
  const neutral = await atmospherePage.locator(
    '[data-home-atmosphere="decorative"]',
  ).evaluate((node) => ({
    condition: (node as HTMLElement).dataset.condition,
    lighting: (node as HTMLElement).dataset.lighting,
  }));
  assert(
    neutral.condition === 'unknown' && neutral.lighting === 'neutral',
    'invalid atmosphere did not fail to neutral without clock inference',
  );
  await atmospherePage.click('#open-outfit');
  assert(
    await atmospherePage.evaluate(
      () => window.__homeOutfitMotionFixture?.semanticT0(),
    ),
    'neutral/static decoration blocked semantic recommendation navigation',
  );
  assertNoPageErrors(atmospherePage, 'atmosphere matrix');
  console.log(`matrix atmosphere rows: ${atmosphereRows}, invalid-neutral: PASS`);
  await atmospherePage.close();

  for (const theme of ['light', 'dark'] as const) {
    for (const temperature of [-8, 10, 28]) {
      const page = await loadFixture(browser, {
        theme,
        tempC: temperature,
      });
      const expectedPalette = temperature < 0
        ? 'cold'
        : temperature >= 24 ? 'warm' : 'mild';
      assert(
        await page.locator('[data-home-atmosphere="decorative"]')
          .getAttribute('data-palette') === expectedPalette,
        `${theme}/${temperature}: palette mismatch`,
      );
      assert(
        await page.evaluate(() => document.documentElement.dataset.theme)
          === theme,
        `${theme}/${temperature}: theme mismatch`,
      );
      await page.click('#open-outfit');
      assert(
        await page.evaluate(
          () => window.__homeOutfitMotionFixture?.semanticT0(),
        ),
        `${theme}/${temperature}: semantic state/focus depended on color`,
      );
      assertNoPageErrors(page, `${theme}/${temperature}`);
      await page.close();
    }
  }

  const forcedPage = await loadFixture(browser, { forcedColors: 'active' });
  await forcedPage.click('#open-outfit');
  assert(
    await forcedPage.evaluate(
      () => window.__homeOutfitMotionFixture?.semanticT0(),
    ),
    'forced colors blocked semantic state/focus',
  );
  assertNoPageErrors(forcedPage, 'forced colors');
  await forcedPage.close();

  const textPage = await loadFixture(browser, { width: 320 });
  await textPage.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await textPage.click('#open-outfit');
  const reflow = await textPage.evaluate(() => {
    const opener = document.getElementById('open-outfit')!
      .getBoundingClientRect();
    const closer = document.getElementById('close-outfit')!
      .getBoundingClientRect();
    return {
      horizontalScroll:
        document.documentElement.scrollWidth
        > document.documentElement.clientWidth,
      openerVisible: opener.width > 0 && opener.right <= window.innerWidth,
      closerVisible: closer.width > 0 && closer.right <= window.innerWidth,
      focusVisible: document.activeElement?.id === 'close-outfit',
    };
  });
  assert(
    !reflow.horizontalScroll
      && reflow.openerVisible
      && reflow.closerVisible
      && reflow.focusVisible,
    `200% text reflow failed: ${JSON.stringify(reflow)}`,
  );
  assertNoPageErrors(textPage, '200% text');
  await textPage.close();

  const contractPage = await loadFixture(browser, { duplicateLabels: true });
  const identity = await contractPage.evaluate(
    () => window.__homeOutfitMotionFixture?.identityMatrix(),
  );
  assert(
    identity?.exact === 'animate'
      && identity.snapshotId === 'identity-mismatch'
      && identity.recommendationFingerprint === 'identity-mismatch'
      && identity.transitionContextId === 'identity-mismatch',
    `identity triple contract failed: ${JSON.stringify(identity)}`,
  );
  const anchors = await contractPage.evaluate(
    () => window.__homeOutfitMotionFixture?.anchorMatrix(),
  );
  for (const [key, value] of Object.entries(anchors ?? {})) {
    assert(
      value.includes(key.startsWith('home') ? 'home' : 'outfit'),
      `${key}: anchor fault did not fail closed (${value})`,
    );
  }
  assert(Object.keys(anchors ?? {}).length === 8,
    'missing/zero/duplicate/mismatched anchor matrix was incomplete');
  const equipment = await contractPage.evaluate(() => ({
    equipment: window.__homeOutfitMotionFixture?.equipmentIds ?? [],
    candidates: window.__homeOutfitMotionFixture?.itemIds ?? [],
  }));
  assert(
    equipment.equipment.every(
      (itemId) => !equipment.candidates.includes(itemId),
    ),
    'equipment leaked into transition candidates',
  );
  await contractPage.locator('#open-outfit').press('Space');
  assert(
    await contractPage.evaluate(
      () => window.__homeOutfitMotionFixture?.semanticT0(),
    ),
    'Space activation did not mount semantic Outfit at T0',
  );
  await contractPage.waitForFunction(
    () => window.__homeOutfitMotionFixture?.state() === 'settled',
  );
  const events = await contractPage.evaluate(
    () => window.__homeOutfitMotionFixture?.events() ?? [],
  );
  const eventNames = events.map(({ name }) => name);
  const activationIndex = eventNames.indexOf('activation');
  const semanticIndex = eventNames.indexOf('semantic-t0');
  const landingIndex = eventNames.indexOf('landing-state');
  const explanationIndex = eventNames.indexOf('explanation-start');
  const cleanupIndex = eventNames.lastIndexOf('cleanup');
  assert(
    activationIndex >= 0
      && semanticIndex > activationIndex
      && landingIndex > semanticIndex
      && explanationIndex > landingIndex
      && cleanupIndex > explanationIndex,
    `named timing order failed: ${JSON.stringify(events)}`,
  );
  const eventAt = (name: string): number => (
    events.find((event) => event.name === name)?.atMs ?? Number.NaN
  );
  const semanticT0LatencyMs =
    eventAt('semantic-t0') - eventAt('activation');
  const explanationElapsedMs =
    eventAt('completed') - eventAt('explanation-start');
  assert(
    semanticT0LatencyMs >= 0 && semanticT0LatencyMs < 180,
    `semantic T0 was delayed behind visual feedback: ${semanticT0LatencyMs}`,
  );
  assert(
    explanationElapsedMs >= 900 && explanationElapsedMs <= 1_400,
    `measured explanation escaped 900-1400ms: ${explanationElapsedMs}`,
  );
  assert(
    await contractPage.locator('[data-outfit-transition-overlay]').count()
      === 0,
    'completed attempt retained an overlay',
  );
  const retention = await contractPage.evaluate(
    () => window.__homeOutfitMotionFixture?.retention(),
  );
  assert(
    retention?.targetElementCount === 0
      && retention.hasActiveBundle === false
      && retention.hasScheduledReadiness === false,
    `completed attempt retained deadline/state: ${JSON.stringify(retention)}`,
  );
  await contractPage.click('#close-outfit');
  await contractPage.click('#open-outfit');
  assert(
    await contractPage.evaluate(
      () => window.__homeOutfitMotionFixture?.reason(),
    ) === 'already-attempted',
    'same-triple replay did not settle statically',
  );
  await contractPage.click('#close-outfit');
  const changed = await contractPage.evaluate(
    () => window.__homeOutfitMotionFixture?.installNewTriple(),
  );
  assert(
    changed?.previousSnapshotId !== changed?.nextSnapshotId,
    'new triple did not change snapshot identity',
  );
  await contractPage.click('#open-outfit');
  await contractPage.locator(
    '[data-outfit-transition-overlay]',
  ).waitFor({ state: 'attached' });
  assertNoPageErrors(contractPage, 'identity/anchor/timing');
  console.log(
    `matrix named timing: ${JSON.stringify({
      canonicalNormalFeedbackMs:
        cardinalityEvidence[0]?.normalUiDurationMs,
      semanticT0LatencyMs,
      explanationElapsedMs,
      events,
    })}; identity/anchors: PASS`,
  );
  await contractPage.close();

  for (const scenario of [
    {
      label: 'app-reduce',
      reducedMotion: 'no-preference' as const,
      appMotion: 'reduce' as const,
    },
    {
      label: 'os-reduce',
      reducedMotion: 'reduce' as const,
      appMotion: 'allow' as const,
    },
    {
      label: 'app-allow-plus-os-reduce',
      reducedMotion: 'reduce' as const,
      appMotion: 'allow' as const,
    },
  ]) {
    const page = await loadFixture(browser, scenario);
    await page.click('#open-outfit');
    assert(
      await page.evaluate(
        () => window.__homeOutfitMotionFixture?.semanticT0(),
      )
        && await page.evaluate(
          () => window.__homeOutfitMotionFixture?.reason(),
        ) === 'motion-ineligible'
        && await page.locator('[data-outfit-transition-overlay]').count() === 0,
      `${scenario.label}: reduced path diverged from static semantics`,
    );
    const staticEvents = await page.evaluate(
      () => window.__homeOutfitMotionFixture?.events() ?? [],
    );
    assert(
      staticEvents.findIndex(({ name }) => name === 'landing-state')
        < staticEvents.findIndex(({ name }) => name === 'static-landing'),
      `${scenario.label}: static landing order was not preserved`,
    );
    assertNoPageErrors(page, scenario.label);
    await page.close();
  }

  const unmountPage = await loadFixture(browser);
  await unmountPage.click('#open-outfit');
  await unmountPage.evaluate(() => {
    window.__homeOutfitMotionFixture?.dispose();
  });
  const disposed = await unmountPage.evaluate(() => ({
    retention: window.__homeOutfitMotionFixture?.retention(),
    events: window.__homeOutfitMotionFixture?.events() ?? [],
  }));
  assert(
    disposed.retention?.disposed === true
      && disposed.retention.homeElementCount === 0
      && disposed.retention.targetElementCount === 0
      && disposed.retention.hasActiveBundle === false
      && disposed.retention.hasScheduledReadiness === false
      && disposed.events.some(({ name }) => name === 'abort:unmounted')
      && disposed.events.at(-1)?.name === 'cleanup',
    `unmount retained transient state: ${JSON.stringify(disposed)}`,
  );
  assertNoPageErrors(unmountPage, 'unmount');
  await unmountPage.close();
}

function assertProductionWiring(): void {
  const app = readFileSync('src/App.tsx', 'utf8');
  const home = readFileSync('src/screens/HjemScreen.tsx', 'utf8');
  assert(
    app.includes('useOutfitTransitionCoordinator'),
    'App does not own the coordinator hook',
  );
  assert(
    app.includes('captureBeforeNavigation'),
    'App does not capture before semantic navigation',
  );
  assert(
    home.includes('LivingHomeAtmosphere'),
    'Home is not wired to the same-snapshot atmosphere',
  );
  assert(
    home.includes('HomeGarmentPills')
      && home.includes('selectHomeSources')
      && home.includes('data-outfit-transition-source={source.itemId}'),
    'Home does not put adapter identity on its visible garment pills',
  );
  assert(
    !home.includes('base.garments'),
    'Home must not select transition identities from base.garments',
  );
  assert(
    !home.includes('HomeTransitionAnchor')
      && !home.includes('getHomeTransitionItemIds'),
    'Home retains the hidden/index-guessed source path',
  );
  assert(
    app.includes('selectHomeSources={outfitTransition.selectHomeSources}'),
    'App does not pass adapter-owned Home source selection',
  );
}

async function main(): Promise<void> {
  assert(
    requestedCase === 'coordinator'
      || requestedCase === 'signature'
      || requestedCase === 'all',
    'Use --case coordinator, signature, or all',
  );
  assertProductionWiring();

  if (requestedCase === 'signature' || requestedCase === 'all') {
    const build = spawnSync(process.execPath, [VITE_CLI, 'build'], {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
      encoding: 'utf8',
    });
    assert(build.status === 0 && build.error === undefined,
      `compiled production build failed: ${`${build.stdout ?? ''}${build.stderr ?? ''}`.slice(-4_000)}`);
    const preview = spawn(process.execPath, [
      VITE_CLI,
      'preview',
      '--host', '127.0.0.1',
      '--port', String(PORT),
      '--strictPort',
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let browser: Browser | null = null;
    try {
      await waitForServer(preview);
      browser = await chromium.launch({ headless: true });
      await runProductionSignature(browser);
      console.log('home-outfit-motion production signature: PASS');
    } finally {
      await browser?.close();
      preview.kill();
      await new Promise<void>((resolve) => {
        if (preview.exitCode !== null) resolve();
        else preview.once('exit', () => resolve());
      });
    }
  }

  if (
    requestedCase === 'coordinator'
    || requestedCase === 'signature'
    || requestedCase === 'all'
  ) {
    const server = spawn(process.execPath, [
      VITE_CLI,
      '--host', '127.0.0.1',
      '--port', String(PORT),
      '--strictPort',
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let browser: Browser | null = null;
    try {
      await waitForServer(server);
      browser = await chromium.launch({ headless: true });
      await runCoordinatorCase(browser);
      await runExpandedAcceptanceMatrix(browser);
      console.log('home-outfit-motion coordinator: PASS');
    } finally {
      await browser?.close();
      server.kill();
    }
  }
}

await main();
