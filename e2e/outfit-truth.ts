import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { runOutfitInventoryV1 } from '../scripts/outfit/inventory-v1.js';

const PORT = 4197;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const FIXTURE_PATH = '/e2e/fixtures/outfit-truth.html';
const SUPPORTED_CASES = Object.freeze(['component-matrix', 'production-app-routes'] as const);
type HarnessCase = typeof SUPPORTED_CASES[number];
type ExpectedFlag = boolean | undefined;

function parseArguments(argv: readonly string[]): Readonly<{ caseName: HarnessCase; expectedFlag: ExpectedFlag }> {
  let caseName: string | undefined;
  let expectedFlag: ExpectedFlag;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    const [flag, inline] = argument.split('=', 2);
    const value = inline ?? argv[index + 1];
    if (flag === '--case') {
      if (caseName !== undefined || value === undefined || inline === undefined && argv[++index] === undefined) {
        throw new Error('Use exactly one --case <component-matrix|production-app-routes>');
      }
      caseName = value;
    } else if (flag === '--expected-flag') {
      if (expectedFlag !== undefined || (value !== 'true' && value !== 'false')) {
        throw new Error('Use --expected-flag true or --expected-flag false at most once');
      }
      expectedFlag = value === 'true';
      if (inline === undefined) index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!SUPPORTED_CASES.includes(caseName as HarnessCase)) {
    throw new Error(`Missing or unsupported --case. Supported: ${SUPPORTED_CASES.join(', ')}`);
  }
  return { caseName: caseName as HarnessCase, expectedFlag };
}

function parseRgb(value: string): readonly [number, number, number] {
  const channels = value.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Expected computed RGB color, got ${value}`);
  return channels as [number, number, number];
}

function luminance(channels: readonly [number, number, number]): number {
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(parseRgb(foreground));
  const b = luminance(parseRgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function waitForServer(server: ChildProcess, output: readonly string[]): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Fixture Vite process exited before ready: ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${BASE_URL}${FIXTURE_PATH}`);
      if (response.ok) return;
    } catch {
      // The owned loopback server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Fixture Vite server did not become ready: ${output.join('').slice(-8000)}`);
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill('SIGTERM');
  const deadline = Date.now() + 5_000;
  while (server.exitCode === null && server.signalCode === null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
}

async function mount(page: Page, fixtureCase: 'one' | 'four' | 'five' | 'ten' | 'eleven' | 'unavailable', axis: 'kald' | 'mild' | 'varm') {
  const fixtureErrors: string[] = [];
  const captureFixtureError = (error: Error) => fixtureErrors.push(error.message);
  page.on('pageerror', captureFixtureError);
  const loaded = await page.evaluate(() => window.__OUTFIT_TRUTH_FIXTURE__ !== undefined).catch(() => false);
  if (!loaded) await page.goto(`${BASE_URL}${FIXTURE_PATH}`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => window.__OUTFIT_TRUTH_FIXTURE__ !== undefined, undefined, { timeout: 10_000 });
  } catch (error) {
    throw new Error(`Fixture API did not load: ${fixtureErrors.join('\n') || await page.locator('body').innerText()}`, { cause: error });
  } finally {
    page.off('pageerror', captureFixtureError);
  }
  return page.evaluate(async ({ fixtureCase: nextCase, axis: nextAxis }) => {
    const api = window.__OUTFIT_TRUTH_FIXTURE__;
    if (api === undefined) throw new Error('fixture API missing');
    return api.mount(nextCase, nextAxis);
  }, { fixtureCase, axis });
}

async function assertSupportedCell(
  page: Page,
  count: 1 | 4 | 5 | 10,
  width: number,
  textScale: 1 | 2,
  theme: 'light' | 'dark',
  axis: 'kald' | 'mild' | 'varm',
  forcedColors: 'none' | 'active',
  reducedMotion: 'no-preference' | 'reduce',
): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: theme, forcedColors, reducedMotion });
  const fixtureCase = count === 1 ? 'one' : count === 4 ? 'four' : count === 5 ? 'five' : 'ten';
  const summary = await mount(page, fixtureCase, axis);
  if (summary.kind !== 'supported' || summary.garmentCount !== count) throw new Error('Fixture bundle cardinality drift');
  await page.evaluate(({ nextTheme, nextTextScale }) => {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.fontSize = nextTextScale === 2 ? '200%' : '100%';
  }, { nextTheme: theme, nextTextScale: textScale });
  const heading = page.getByRole('heading', { name: 'Ta p\u00e5 innerst f\u00f8rst', exact: true });
  if (await heading.count() !== 1) throw new Error(`Exact outfit heading is missing: ${(await page.getByRole('heading').allTextContents()).join('|')}`);
  const map = page.locator('[data-outfit-map-mode]');
  const expectedMode = count <= 4 ? 'spacious' : 'compact-rails';
  if (await map.getAttribute('data-outfit-map-mode') !== expectedMode) throw new Error(`Expected ${expectedMode} map mode`);
  if (await map.locator('[data-outfit-map-node]').count() !== count) throw new Error('Map node cardinality drift');
  if (await map.locator('[data-outfit-connector]').count() !== count) throw new Error('Connector cardinality drift');
  if (await page.locator('[data-outfit-row]').count() !== count) throw new Error('Row cardinality drift');
  const orders = await page.locator('[data-outfit-row]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-outfit-row')));
  const mapOrders = await page.locator('[data-outfit-map-node]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-outfit-map-node')));
  if (orders.join('|') !== mapOrders.join('|')) throw new Error('Map and ordered rows diverged');
  const layout = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('#outfit-truth-root');
    const caption = document.querySelector<HTMLElement>('.outfit-active-caption');
    const mapElement = document.querySelector<HTMLElement>('.outfit-map');
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-outfit-map-node]')];
    const rows = [...document.querySelectorAll<HTMLElement>('[data-outfit-row]')];
    const connector = document.querySelector<SVGElement>('[data-outfit-connector]');
    if (root === null || caption === null || mapElement === null || connector === null) {
      throw new Error(`Missing layout primitive: ${JSON.stringify({ root: root !== null, caption: caption !== null, map: mapElement !== null, connector: connector !== null })}`);
    }
    const nodeRects = nodes.map((node) => node.getBoundingClientRect());
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      captionPosition: getComputedStyle(caption).position,
      captionAfterMap: caption.getBoundingClientRect().top >= mapElement.getBoundingClientRect().bottom,
      minTargets: [...nodes, ...rows].every((element) => {
        const rect = element.getBoundingClientRect(); return rect.width >= 44 && rect.height >= 44;
      }),
      clipped: [...nodes, ...rows, caption].some((element) => {
        const rect = element.getBoundingClientRect(); const rootRect = root.getBoundingClientRect();
        return rect.left < rootRect.left - 1 || rect.right > rootRect.right + 1;
      }),
      connectorStroke: getComputedStyle(connector).stroke,
      canvas: getComputedStyle(document.body).backgroundColor,
      forcedAdjust: getComputedStyle(nodes[0]!).forcedColorAdjust,
      normalWidth: getComputedStyle(connector).strokeWidth,
      nodeRects: nodeRects.map((rect) => [rect.x, rect.y, rect.width, rect.height]),
    };
  });
  if (layout.overflow > 0 || layout.clipped || layout.captionPosition === 'absolute' || !layout.captionAfterMap || !layout.minTargets) {
    throw new Error(`Layout contract failed at ${count}/${width}/${textScale}: ${JSON.stringify(layout)}`);
  }
  if (forcedColors === 'none' && contrastRatio(layout.connectorStroke, layout.canvas) < 3) {
    throw new Error(`Inactive connector contrast is below 3:1 at ${theme}/${axis}`);
  }
  if (forcedColors === 'active' && layout.forcedAdjust !== 'auto') throw new Error('Forced colors did not retain system adjustment');
  if (!(width === 320 && textScale === 1 && theme === 'light' && axis === 'mild' && forcedColors === 'none' && reducedMotion === 'no-preference')) return;
  const firstRow = page.locator('[data-outfit-row]').first();
  const firstNode = page.locator('[data-outfit-map-node]').first();
  await firstRow.focus();
  await page.keyboard.press('Enter');
  if (await firstRow.getAttribute('aria-pressed') !== 'true' || await firstNode.getAttribute('aria-pressed') !== 'true') {
    throw new Error('Paired persistent selection failed');
  }
  if (!await firstRow.evaluate((element) => document.activeElement === element)) throw new Error('Selection stole row focus');
  await firstNode.hover({ force: true });
  const activeGeometry = await page.evaluate((inactiveWidth) => {
    const active = document.querySelector<SVGElement>('[data-outfit-connector].is-highlighted')!;
    return {
      activeWidth: getComputedStyle(active).strokeWidth,
      inactiveWidth,
      activeDash: getComputedStyle(active).strokeDasharray,
      inactiveDash: 'none',
    };
  }, layout.normalWidth);
  if (activeGeometry.activeWidth === activeGeometry.inactiveWidth || activeGeometry.activeDash === activeGeometry.inactiveDash) {
    throw new Error('Active connector lacks width and pattern distinction');
  }
  await firstNode.hover({ position: { x: 1, y: 1 }, force: true });
  await page.mouse.move(width - 1, 899);
  await firstRow.focus();
  await page.keyboard.press(' ');
  await page.keyboard.press('Escape');
  if (await firstRow.getAttribute('aria-pressed') !== 'true') throw new Error('Escape cleared persistent selection');
  const stableGeometry = await page.locator('[data-outfit-map-node]').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height];
  }));
  if (JSON.stringify(layout.nodeRects) !== JSON.stringify(stableGeometry)) throw new Error('Highlight changed map geometry');
}

async function assertElevenListOnly(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none', reducedMotion: 'reduce' });
  const summary = await mount(page, 'eleven', 'mild');
  if (summary.kind !== 'unsupported-cardinality' || summary.garmentCount !== 11) throw new Error('Exact 11 fixture missing');
  if (await page.locator('.outfit-list > ol > li').count() !== 11) throw new Error('List-only fallback did not render all eleven rows');
  const oracle = runOutfitInventoryV1();
  if (oracle.maxGarmentCase === null || oracle.maxGarmentItems.length !== 11) throw new Error('Candidate-local inventory has no exact eleven case');
  const rendered = await page.locator('.outfit-list > ol > li').allTextContents();
  const expected = oracle.maxGarmentItems.map((label, index) => `${index + 1}. ${label}`);
  if (rendered.join('|') !== expected.join('|')) throw new Error('List-only fixture diverged from candidate-local inventory oracle');
  for (const forbidden of ['[data-outfit-map-mode]', '[data-outfit-connector]', '[data-avatar-truth]', '[data-outfit-row]', '.outfit-alternative']) {
    if (await page.locator(forbidden).count() !== 0) throw new Error(`List-only fallback rendered forbidden ${forbidden}`);
  }
  const registrations = await page.evaluate(() => window.__OUTFIT_TRUTH_FIXTURE__?.registrations() ?? []);
  if (registrations.length !== 0) throw new Error('List-only fallback registered an outfit row');
  const motion = await page.locator('.outfit-truth-panel').evaluate((element) => getComputedStyle(element).transitionDuration);
  if (motion.split(',').some((value) => Number.parseFloat(value) > 0.001)) throw new Error(`List-only fallback has motion eligibility: ${motion}`);
}

async function assertComponentMatrix(page: Page): Promise<void> {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  for (const count of [1, 4, 5, 10] as const) {
    for (const width of [320, 390, 560] as const) {
      for (const textScale of [1, 2] as const) {
        for (const theme of ['light', 'dark'] as const) {
          for (const axis of ['kald', 'mild', 'varm'] as const) {
            for (const forcedColors of ['none', 'active'] as const) {
              for (const reducedMotion of ['no-preference', 'reduce'] as const) {
                await assertSupportedCell(page, count, width, textScale, theme, axis, forcedColors, reducedMotion);
              }
            }
          }
        }
      }
    }
  }
  await assertElevenListOnly(page);
  if (failures.length > 0) throw new Error(`Browser page errors: ${failures.join('\n')}`);
}

async function assertProductionRoutes(page: Page, expectedFlag: ExpectedFlag): Promise<void> {
  const flagSource = readFileSync(join(process.cwd(), 'src/lib/outfit/feature-flags.ts'), 'utf8');
  const enabled = /OUTFIT_TRUTH_V1_AVAILABLE\s*=\s*true/u.test(flagSource);
  if (expectedFlag !== undefined && enabled !== expectedFlag) {
    throw new Error(`Expected feature flag ${expectedFlag}, found ${enabled}`);
  }
  await page.goto(`${BASE_URL}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  if (!enabled) {
    if (await page.locator('.outfit-truth-panel').count() !== 0) throw new Error('False flag mounted production OutfitTruthPanel');
    return;
  }
  const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
  const screenSource = readFileSync(join(process.cwd(), 'src/screens/PaakledningScreen.tsx'), 'utf8');
  for (const required of ['produceOutfitBundle', 'producerSeed', 'registerOutfitRow']) {
    if (!appSource.includes(required)) throw new Error(`Enabled App route contract missing ${required}`);
  }
  if (!screenSource.includes('OutfitTruthPanel')) throw new Error('Enabled Paakledning route lacks panel contract');
  // These are production UI contracts: no fixture mount and no bundle injection is allowed here.
  const homeAction = page.locator('#hjem-current-outfit-trigger');
  if (await homeAction.count() !== 1) throw new Error('Production Hjem outfit action is missing');
  await homeAction.waitFor({ state: 'visible', timeout: 10_000 });
  await homeAction.click();
  const currentDialog = page.getByRole('dialog', { name: 'Dagens antrekk', exact: true });
  await currentDialog.waitFor({ state: 'visible', timeout: 10_000 });
  if (await currentDialog.locator('.outfit-truth-panel').count() !== 1) throw new Error('Current production dialog did not mount real panel');
  await page.getByRole('button', { name: 'Lukk dagens antrekk', exact: true }).click();
  await currentDialog.waitFor({ state: 'hidden', timeout: 10_000 });
  if (!await homeAction.evaluate((element) => document.activeElement === element)) throw new Error('Current dialog did not restore trigger focus');
  await homeAction.click();
  await currentDialog.waitFor({ state: 'visible', timeout: 10_000 });
  await page.getByRole('button', { name: 'Lukk dagens antrekk', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Planlegg', exact: true }).click();
  const disclosure = page.locator('.plan-change-rail__disclosure').first();
  await disclosure.waitFor({ state: 'visible', timeout: 10_000 });
  await disclosure.click();
  const plannedAction = page.getByRole('button', { name: 'Se hele antrekket', exact: true }).first();
  if (await plannedAction.count() === 0) throw new Error('Production Uke outfit action is missing');
  await plannedAction.click();
  const plannedDialog = page.getByRole('dialog', { name: 'Planlagt antrekk', exact: true });
  await plannedDialog.waitFor({ state: 'visible', timeout: 10_000 });
  if (await plannedDialog.locator('.outfit-truth-panel').count() !== 1) throw new Error('Planned production dialog did not mount real panel');
  await page.getByRole('button', { name: 'Lukk planlagt antrekk', exact: true }).click();
}

async function main(): Promise<void> {
  const { caseName, expectedFlag } = parseArguments(process.argv.slice(2));
  const output: string[] = [];
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  try {
    server = spawn(process.execPath, [VITE_CLI, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      cwd: process.cwd(), shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const capture = (chunk: Buffer) => { output.push(chunk.toString()); if (output.join('').length > 12_000) output.splice(0, output.length - 12); };
    server.stdout?.on('data', capture); server.stderr?.on('data', capture);
    await waitForServer(server, output);
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Europe/Oslo' });
    const page = await context.newPage();
    if (caseName === 'component-matrix') await assertComponentMatrix(page);
    else await assertProductionRoutes(page, expectedFlag);
    await context.close();
  } finally {
    try { await browser?.close(); } finally { if (server !== null) await stopServer(server); }
  }
  console.log(`OUTFIT TRUTH HARNESS PASS: case=${caseName}`);
}

main().catch((error) => {
  console.error(`OUTFIT TRUTH HARNESS FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
