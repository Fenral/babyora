#!/usr/bin/env node

import { copyFile, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { forecastPartlyCloudy1C } from '../../e2e/fixtures/forecast-1c-partlycloudy.js';

const BASE_URL = process.argv[2] ?? 'http://127.0.0.1:4173';
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'evidence', 'onboarding-imagery', 'baseline');
const VIEWPORT = { width: 390, height: 844 };

await mkdir(OUTPUT, { recursive: true });

function round(value) {
  return Math.round(value * 10) / 10;
}

async function installFixture(context) {
  await context.route('**/api/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()),
    });
  });
}

async function makeContext(browser, theme, options = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: options.reducedMotion ?? 'no-preference',
    geolocation: { latitude: 63.4305, longitude: 10.3951 },
    permissions: ['geolocation'],
    recordVideo: options.recordVideo
      ? { dir: OUTPUT, size: VIEWPORT }
      : undefined,
  });
  await installFixture(context);
  await context.addInitScript(({ forcedTheme, largeText }) => {
    const apply = () => {
      document.documentElement.dataset.theme = forcedTheme;
      if (largeText) document.documentElement.style.fontSize = '125%';
    };
    if (document.documentElement) apply();
    else document.addEventListener('DOMContentLoaded', apply, { once: true });
  }, { forcedTheme: theme, largeText: options.largeText ?? false });
  return context;
}

async function loadFresh(page) {
  const startedAt = performance.now();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('.ob-screen').waitFor({ state: 'visible' });
  const firstCta = page.locator('.ob-cta-zone .ob-btn-primary');
  await firstCta.waitFor({ state: 'visible' });
  return {
    startedAt,
    firstInteractiveMs: round(performance.now() - startedAt),
  };
}

async function completeFlow(page, theme) {
  await page.screenshot({ path: path.join(OUTPUT, `k0-step1-${theme}.png`) });
  const ariaStep1 = await page.locator('main').ariaSnapshot();
  await writeFile(path.join(OUTPUT, `k0-step1-${theme}.aria.txt`), `${ariaStep1}\n`, 'utf8');

  const interactionStartedAt = performance.now();
  await page.locator('#ob-name-input').fill('Iver');
  await page.getByRole('button', { name: /Fortsett/ }).click();
  await page.locator('#ob-birth-date').fill('2025-10-03');
  await page.getByRole('button', { name: /Fortsett/ }).click();
  await page.getByRole('button', { name: 'Bruk posisjonen min' }).click();
  await page.getByText('Brukes som hjemsted for dagens vær').waitFor();
  await page.getByRole('button', { name: /Fortsett med/ }).click();
  await page.screenshot({ path: path.join(OUTPUT, `k0-step4-${theme}.png`) });
  await page.getByRole('button', { name: 'Lag første antrekk' }).click();
  await page.getByRole('heading', { name: /Dagens råd er klart/ }).waitFor();
  await page.screenshot({ path: path.join(OUTPUT, `k0-welcome-${theme}.png`) });
  await page.getByRole('button', { name: 'Vis dagens antrekk' }).click();

  const homeCta = page.getByRole('button', { name: /Finn dagens antrekk|Vis dagens antrekk/ });
  await homeCta.waitFor({ state: 'visible' });
  const homeLabel = (await homeCta.textContent())?.trim() ?? '';
  const homeCtaPath = await homeCta.getAttribute('data-cta-path');
  const homeTappedAt = performance.now();
  await homeCta.click();
  await page.getByRole('heading', { name: 'Dagens antrekk' }).waitFor({ timeout: 10_000 });
  const firstResultAt = performance.now();
  // Resultatradene har en eksplisitt stagger. Første heading er «svaret
  // finnes»; stabil liste er første tidspunkt hele påkledningssvaret kan
  // skannes. Mål begge, ikke velg den peneste definisjonen i etterkant.
  await page.waitForTimeout(1_000);
  const settledResultAt = performance.now();
  await page.screenshot({ path: path.join(OUTPUT, `k0-first-recommendation-${theme}.png`) });
  const ariaResult = await page.locator('main').ariaSnapshot();
  await writeFile(path.join(OUTPUT, `k0-first-recommendation-${theme}.aria.txt`), `${ariaResult}\n`, 'utf8');

  return {
    automatedInteractionToFirstResultMs: round(firstResultAt - interactionStartedAt),
    automatedInteractionToSettledResultMs: round(settledResultAt - interactionStartedAt),
    homeCtaToFirstResultMs: round(firstResultAt - homeTappedAt),
    homeCtaToSettledResultMs: round(settledResultAt - homeTappedAt),
    homeCtaLabel: homeLabel,
    homeCtaPath,
    requiredProfileFields: ['fødselsdato', 'hjemsted', 'navn i faktisk fullføringsvakt'],
    automatedActions: 9,
  };
}

async function captureNoNameDeadEnd(browser) {
  const context = await makeContext(browser, 'light', { reducedMotion: 'reduce' });
  const page = await context.newPage();
  await loadFresh(page);
  await page.getByRole('button', { name: /Fortsett/ }).click();
  await page.locator('#ob-birth-date').fill('2025-10-03');
  await page.getByRole('button', { name: /Fortsett/ }).click();
  await page.getByRole('button', { name: 'Bruk posisjonen min' }).click();
  await page.getByText('Brukes som hjemsted for dagens vær').waitFor();
  await page.getByRole('button', { name: /Fortsett med/ }).click();
  const complete = page.getByRole('button', { name: 'Lag første antrekk' });
  const disabled = await complete.isDisabled();
  await page.screenshot({ path: path.join(OUTPUT, 'k0-no-name-dead-end-light.png') });
  await context.close();
  return disabled;
}

async function captureLargeTextAndReducedMotion(browser) {
  for (const [suffix, options] of [
    ['large-text', { largeText: true }],
    ['reduce-motion', { reducedMotion: 'reduce' }],
  ]) {
    const context = await makeContext(browser, 'dark', options);
    const page = await context.newPage();
    await loadFresh(page);
    await page.screenshot({ path: path.join(OUTPUT, `k0-step1-dark-${suffix}.png`) });
    await context.close();
  }
}

const browser = await chromium.launch();
const consoleErrors = [];
const results = {};

try {
  for (const theme of ['light', 'dark']) {
    const context = await makeContext(browser, theme, { recordVideo: theme === 'dark' });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${theme}: ${message.text()}`);
    });
    page.on('pageerror', (error) => consoleErrors.push(`${theme}: ${error.message}`));
    const load = await loadFresh(page);
    const flow = await completeFlow(page, theme);
    const video = page.video();
    await context.close();
    if (theme === 'dark' && video) {
      const rawVideoPath = await video.path();
      await copyFile(rawVideoPath, path.join(OUTPUT, 'k0-cold-to-first-recommendation-dark.webm'));
      await unlink(rawVideoPath);
    }
    results[theme] = { ...load, ...flow };
  }

  results.noNameCompletionDisabled = await captureNoNameDeadEnd(browser);
  await captureLargeTextAndReducedMotion(browser);
} finally {
  await browser.close();
}

const metrics = {
  capturedAt: new Date().toISOString(),
  sourceCommit: process.env.GIT_COMMIT ?? 'run `git rev-parse HEAD` alongside this file',
  viewport: VIEWPORT,
  measurementBoundary: 'Playwright web-preview lower bound; not physical-iPhone timing and not human task time.',
  results,
  consoleErrors,
};

await writeFile(path.join(OUTPUT, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(metrics, null, 2));
