#!/usr/bin/env node

import { copyFile, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { startBakeoffServer } from './serve-bakeoff.mjs';

const STATIC_PORT = 4174;
const externalBaseUrl = process.argv[2];
const BASE_URL = externalBaseUrl ?? `http://127.0.0.1:${STATIC_PORT}`;
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'evidence', 'onboarding-imagery', 'bakeoff');
const MOCK_PATH = '/docs/mocks/onboarding-imagery-bakeoff/';
const VIEWPORT = { width: 390, height: 844 };
const arms = ['k0', 'k1', 'k2', 'k3'];

await mkdir(OUTPUT, { recursive: true });

function url(query) {
  return `${BASE_URL}${MOCK_PATH}?${new URLSearchParams(query)}`;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

async function participantContext(browser, options = {}) {
  return browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: options.theme ?? 'dark',
    reducedMotion: options.reducedMotion ?? 'no-preference',
  });
}

async function assertPhoneGeometry(page, label) {
  const metrics = await page.locator('.device').evaluate((device) => ({
    scrollWidth: device.scrollWidth,
    clientWidth: device.clientWidth,
    scrollHeight: device.scrollHeight,
    clientHeight: device.clientHeight,
  }));
  if (metrics.scrollWidth > metrics.clientWidth) throw new Error(`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  const smallButtons = await page.locator('button:visible').evaluateAll((buttons) => buttons
    .map((button) => ({ text: button.textContent?.trim(), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height }))
    .filter((button) => button.width < 44 || button.height < 44));
  if (smallButtons.length) throw new Error(`${label}: controls below 44pt ${JSON.stringify(smallButtons)}`);
  const clippedButtons = await page.locator('button:visible').evaluateAll((buttons) => buttons
    .map((button) => {
      const buttonBox = button.getBoundingClientRect();
      const deviceBox = button.closest('.device').getBoundingClientRect();
      return { text: button.textContent?.trim(), clipped: buttonBox.top < deviceBox.top || buttonBox.bottom > deviceBox.bottom };
    })
    .filter(button => button.clipped));
  if (clippedButtons.length) throw new Error(`${label}: clipped controls ${JSON.stringify(clippedButtons)}`);
  return metrics;
}

async function captureFirstFrames(browser, consoleErrors) {
  for (const theme of ['light', 'dark']) {
    for (const arm of arms) {
      const context = await participantContext(browser, { theme });
      const page = await context.newPage();
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`${arm}/${theme}: ${message.text()}`); });
      await page.goto(url({ arm, frame: '1', theme, state: 'normal', text: 'normal', motion: 'full', mode: 'participant' }), { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUTPUT, `${arm}-first-${theme}.png`) });
      await writeFile(path.join(OUTPUT, `${arm}-first-${theme}.aria.txt`), await page.locator('.device').ariaSnapshot(), 'utf8');
      await assertPhoneGeometry(page, `${arm}/${theme}/first`);
      await context.close();
    }
  }
}

async function captureStates(browser, consoleErrors) {
  const cases = [
    ['k1-offline-dark', { arm: 'k1', frame: '1', theme: 'dark', state: 'offline', text: 'normal', motion: 'full' }],
    ['k1-slow-light', { arm: 'k1', frame: '1', theme: 'light', state: 'slow', text: 'normal', motion: 'full' }],
    ['k2-reduce-motion-dark', { arm: 'k2', frame: '1', theme: 'dark', state: 'normal', text: 'normal', motion: 'reduce' }],
    ['k3-large-text-dark', { arm: 'k3', frame: '1', theme: 'dark', state: 'normal', text: 'large', motion: 'full' }],
    ['k3-location-error-light', { arm: 'k3', frame: '3', theme: 'light', state: 'error', text: 'normal', motion: 'full' }],
  ];
  for (const [name, query] of cases) {
    const context = await participantContext(browser, { theme: query.theme, reducedMotion: query.motion === 'reduce' ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`${name}: ${message.text()}`); });
    await page.goto(url({ ...query, mode: 'participant' }), { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT, `${name}.png`) });
    await writeFile(path.join(OUTPUT, `${name}.aria.txt`), await page.locator('.device').ariaSnapshot(), 'utf8');
    await assertPhoneGeometry(page, name);
    if (name === 'k2-reduce-motion-dark') {
      const duration = await page.locator('.process-dot').evaluate(element => getComputedStyle(element).animationDuration);
      if (!['0s', '0.000001s', '1e-06s'].includes(duration)) throw new Error(`Reduce Motion is not static: ${duration}`);
    }
    await context.close();
  }
}

async function captureComparison(browser) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1740, height: 980 }, deviceScaleFactor: 1, colorScheme: theme });
    const page = await context.newPage();
    await page.goto(url({ arm: 'k0', frame: '1', theme, state: 'normal', text: 'normal', motion: 'full', compare: '1' }), { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT, `k0-k3-first-frame-side-by-side-${theme}.png`), fullPage: true });
    await context.close();
  }
}

async function measureFlows(browser, consoleErrors) {
  const flows = [];
  for (const arm of arms) {
    const context = await participantContext(browser, { theme: 'dark' });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`${arm}/flow: ${message.text()}`); });
    const navigationStart = performance.now();
    await page.goto(url({ arm, frame: '1', theme: 'dark', state: 'normal', text: 'normal', motion: 'full', mode: 'participant' }), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__babyoraBakeoff?.ready === true);
    const firstInteractiveMs = performance.now() - navigationStart;
    await page.locator('#baby-name').fill('Mina');
    const firstAction = performance.now();
    let finalCtaStart = null;
    let interactions = 0;
    while (await page.getByRole('heading', { name: 'Dagens lag' }).count() === 0) {
      const previousFrame = await page.evaluate(() => window.__babyoraBakeoff.frame);
      if (previousFrame === 5) finalCtaStart = performance.now();
      await page.locator('[data-action="next"]').click();
      interactions += 1;
      if (interactions > 8) throw new Error(`${arm}: result not reached`);
      await page.waitForFunction(frame => window.__babyoraBakeoff.frame > frame, previousFrame, { timeout: 5000 });
    }
    const toResultMs = performance.now() - firstAction;
    const finalCtaToResultMs = finalCtaStart === null ? null : performance.now() - finalCtaStart;
    await page.screenshot({ path: path.join(OUTPUT, `${arm}-first-result-dark.png`) });
    await writeFile(path.join(OUTPUT, `${arm}-first-result-dark.aria.txt`), await page.locator('.device').ariaSnapshot(), 'utf8');
    await assertPhoneGeometry(page, `${arm}/result`);
    flows.push({
      arm,
      firstInteractiveMs: round(firstInteractiveMs),
      firstActionToResultMs: round(toResultMs),
      finalCtaToResultMs: round(finalCtaToResultMs),
      valueClaimVisibleAtFirstFrame: ['k2', 'k3'].includes(arm),
      interactions,
    });
    await context.close();
  }
  return flows;
}

async function verifyResume(browser) {
  const context = await participantContext(browser, { theme: 'dark' });
  const page = await context.newPage();
  await page.goto(url({ arm: 'k3', frame: '3', theme: 'dark', state: 'normal', mode: 'participant' }));
  await page.waitForFunction(() => window.__babyoraBakeoff?.ready === true);
  await page.goto(`${BASE_URL}${MOCK_PATH}?arm=k3&theme=dark&resume=warm&mode=participant`);
  await page.waitForFunction(() => window.__babyoraBakeoff?.ready === true);
  const frame = await page.evaluate(() => window.__babyoraBakeoff.frame);
  await context.close();
  if (frame !== 2) throw new Error(`Warm resume expected frame 2, received ${frame}`);
  return { expectedFrame: 2, restoredFrame: frame, passed: true };
}

async function captureMotionVideo(browser) {
  const videoDir = path.join(OUTPUT, '.video-temp');
  await mkdir(videoDir, { recursive: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, recordVideo: { dir: videoDir, size: VIEWPORT } });
  const page = await context.newPage();
  await page.goto(url({ arm: 'k2', frame: '1', theme: 'dark', state: 'normal', text: 'normal', motion: 'full', mode: 'participant' }), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  const video = page.video();
  await context.close();
  const rawPath = await video.path();
  await copyFile(rawPath, path.join(OUTPUT, 'k2-motion-proxy-dark.webm'));
  await unlink(rawPath);
}

const localServer = externalBaseUrl ? null : await startBakeoffServer(STATIC_PORT);
const browser = await chromium.launch({ headless: true });
const consoleErrors = [];
try {
  await captureFirstFrames(browser, consoleErrors);
  await captureStates(browser, consoleErrors);
  await captureComparison(browser);
  const flows = await measureFlows(browser, consoleErrors);
  const resume = await verifyResume(browser);
  await captureMotionVideo(browser);
  const metrics = {
    capturedAt: new Date().toISOString(),
    sourceCommit: process.env.GITHUB_SHA ?? 'working-tree-after-d81a94d',
    viewport: { ...VIEWPORT, deviceScaleFactor: 2 },
    fixture: { location: 'Oslo', temperatureC: 4, feelsLikeC: 1, ageMonths: 10, activity: 'trilletur' },
    flows,
    resume,
    consoleErrors,
    caveats: [
      'Headless Chromium-måling på lokal mock er ikke native enhetsytelse eller brukertest.',
      'K2-videoen dokumenterer CSS-proxyen; ingen Higgsfield-generering er utført.',
      'K1-fotoet er en Pexels-teststimulus, ikke en produksjonsgodkjent asset.',
    ],
  };
  await writeFile(path.join(OUTPUT, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  if (consoleErrors.length) throw new Error(`Console errors: ${JSON.stringify(consoleErrors)}`);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
  if (localServer) await new Promise(resolve => localServer.close(resolve));
}
