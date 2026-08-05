import { chromium, type Page } from 'playwright';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { PAGE_CATALOG, RUBRIC_VERSION, VIEWPORT } from './config';
import type { CaptureAction, CaptureManifest, CaptureResult, PageId } from './types';

const BLOCKED_ACTIONS = new Set([
  'confirm-purchase', 'restore-purchase', 'delete-child', 'send-invitation',
  'enable-notifications', 'write-production', 'apply',
]);

/**
 * VÆRFIXTUREN — lånt fra e2e, ikke skrevet på nytt.
 *
 * FUNN 2026-08-05: revisjonen bygde sin EGEN fixtur, og den sendte
 * `properties.meta.units: {}`. Klienten (src/lib/met-no/client.ts) krever at
 * units matcher CONSUMED_UNIT_CONTRACT EKSAKT — svaret ble derfor forkastet,
 * appen falt til «sist kjente vær», og CTA-en sto DEAKTIVERT.
 *
 * Følgen var stille og alvorlig: tre av elleve skjermer kunne ikke nås, og
 * revisjonen rapporterte «8/11 fanget» uten å si at de tre manglet FORDI
 * fixturen var feil. Den målte åtte skjermer og sa god for seg selv.
 *
 * e2e/fixtures/forecast-1c-partlycloudy.js løste dette for lenge siden, og
 * dens eget filhode beskriver NØYAKTIG samme feil: «CTA-en sto disabled.
 * Alle portene strøk fordi knappen aldri ble trykket, ikke fordi funksjonen
 * manglet.» To fixturer for samme kontrakt er én fixtur for mye.
 */
export { forecastPartlyCloudy1C as buildForecastFixture } from '../../e2e/fixtures/forecast-1c-partlycloudy.js';

export function assertReadOnlyAction(action: string): void {
  if (BLOCKED_ACTIONS.has(action)) {
    throw new Error(`Blocked by read-only audit boundary: ${action}`);
  }
}

export interface CapturePlanItem {
  pageId: PageId;
  pageLabel: string;
  stateId: string;
  stateLabel: string;
  required: boolean;
  actions: CaptureAction[];
  expectedText?: string;
}

export function buildCapturePlan(): CapturePlanItem[] {
  return PAGE_CATALOG.flatMap((page) => page.states.map((state) => ({
    pageId: page.id,
    pageLabel: page.label,
    stateId: state.id,
    stateLabel: state.label,
    required: state.required,
    actions: [...state.actions],
    expectedText: state.expectedText,
  })));
}

function seededUrl(baseUrl: string, onboarding: boolean): string {
  const url = new URL(baseUrl);
  if (!onboarding) url.searchParams.set('seed', 'demo');
  return url.toString();
}

async function clickFirst(page: Page, candidates: ReturnType<Page['locator']>[]): Promise<void> {
  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.first().click({ timeout: 8_000 });
      return;
    }
  }
  throw new Error('Navigation target not found');
}

async function performAction(page: Page, action: CaptureAction): Promise<void> {
  assertReadOnlyAction(action.type);
  if (action.type === 'clear-storage') {
    await page.evaluate(() => window.localStorage.clear());
    return;
  }
  if (action.type === 'reload') {
    await page.reload({ waitUntil: 'networkidle' });
    return;
  }
  if (action.type === 'wait') {
    await page.waitForTimeout(action.milliseconds);
    return;
  }
  const pattern = new RegExp(action.type === 'tab' ? action.name : action.pattern, 'i');
  if (action.type === 'tab') {
    await clickFirst(page, [
      page.getByRole('button', { name: pattern }),
      page.locator('nav[aria-label="Hovednavigasjon"] button').filter({ hasText: pattern }),
    ]);
    await page.waitForTimeout(350);
    return;
  }
  if (action.type === 'button') {
    await clickFirst(page, [page.getByRole('button', { name: pattern }), page.locator('button').filter({ hasText: pattern })]);
    await page.waitForTimeout(350);
    return;
  }
  await clickFirst(page, [page.getByText(pattern), page.locator('button, a').filter({ hasText: pattern })]);
  await page.waitForTimeout(350);
}

async function validateScreenshot(file: string): Promise<void> {
  const info = await stat(file);
  if (info.size < 10_000) throw new Error(`Screenshot is unexpectedly small (${info.size} bytes)`);
}

export async function captureAudit(options: {
  baseUrl: string;
  runId: string;
  runDir: string;
}): Promise<CaptureManifest> {
  const screenshotsDir = join(options.runDir, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'nb-NO',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  await context.route('**/api/forecast**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildForecastFixture()) });
  });
  const captures: CaptureResult[] = [];

  try {
    for (const item of buildCapturePlan()) {
      const page = await context.newPage();
      const file = join(screenshotsDir, `${item.pageId}--${item.stateId}.png`);
      try {
        await page.goto(seededUrl(options.baseUrl, item.pageId === 'onboarding'), { waitUntil: 'networkidle', timeout: 30_000 });
        await page.waitForTimeout(500);
        for (const action of item.actions) await performAction(page, action);
        await page.evaluate(() => document.fonts.ready);
        if (item.expectedText) await page.getByText(new RegExp(item.expectedText, 'i')).first().waitFor({ timeout: 5_000 });
        await page.screenshot({ path: file, fullPage: false, animations: 'disabled' });
        await validateScreenshot(file);
        captures.push({
          pageId: item.pageId, pageLabel: item.pageLabel, stateId: item.stateId,
          stateLabel: item.stateLabel, required: item.required,
          file: relative(options.runDir, file).replaceAll('\\', '/'), status: 'captured', error: null,
          capturedAt: new Date().toISOString(),
        });
      } catch (error) {
        captures.push({
          pageId: item.pageId, pageLabel: item.pageLabel, stateId: item.stateId,
          stateLabel: item.stateLabel, required: item.required, file: null, status: 'failed',
          error: error instanceof Error ? error.message : String(error), capturedAt: new Date().toISOString(),
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const manifest: CaptureManifest = {
    runId: options.runId, rubricVersion: RUBRIC_VERSION, baseUrl: options.baseUrl,
    viewport: VIEWPORT, locale: 'nb-NO', createdAt: new Date().toISOString(), captures,
  };
  await writeFile(join(options.runDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}
