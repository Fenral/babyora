import { readFileSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';

const PORT = 4318;
const BASE_URL = `http://127.0.0.1:${PORT}`;
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
  page.on('pageerror', (error) => {
    console.error(`fixture page error: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`fixture console error: ${message.text()}`);
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
      data-feels-like-c="${options.tempC ?? 28}"
      data-symbol-code="clearsky_day"
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
  await page.waitForSelector('body[data-fixture-ready="true"]');
  return page;
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
      firstState === 'ready',
      `${width}px: expected ready, received ${firstState}/${firstReason}`
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
    requestedCase === 'coordinator',
    'Use --case coordinator for this bounded harness',
  );
  assertProductionWiring();
  const server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(PORT),
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  server.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  let browser: Browser | null = null;
  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });
    await runCoordinatorCase(browser);
    console.log('home-outfit-motion coordinator: PASS');
  } finally {
    await browser?.close();
    server.kill();
  }
}

await main();
