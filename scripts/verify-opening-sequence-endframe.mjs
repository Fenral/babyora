#!/usr/bin/env node
/**
 * verify-opening-sequence-endframe.mjs — P10.1 (judge finding A5).
 *
 * ACCEPTANCE CHANGE: the opening sequence's end-frame is verified against
 * the APP'S OWN weather-ready render with the sequence suppressed (same
 * build, same theme) — not against docs/mocks/monter/hjem-weather-ready.html
 * (that mock is pre-P9 and has outdated header geometry, see the design
 * note's own "Akseptansekriterium for sluttbildet" section, added by this
 * same fix package).
 *
 * "Sequence suppressed" is not a special debug branch — it's the app's own
 * `reduced-motion` path (`decideOpeningVariant` returns 'none' whenever
 * `reducedMotion` is true, see src/components/hjem/opening-sequence.ts).
 * So both renders in this script are 100% real app code, real CSS, real
 * weather fixture — only the emulated `prefers-reduced-motion` media
 * feature differs between the two captures.
 *
 * Method:
 *   1. Build + serve `dist/` via `vite preview` (same artifact `npm run
 *      build` produces — this script assumes a build already ran, same
 *      convention as e2e/smoke.ts).
 *   2. Reference capture: fresh browser context, `reducedMotion: 'reduce'`,
 *      deterministic weather fixture, `?seed=demo` → weather-ready renders
 *      directly (no sequence) → screenshot `.hjem-monter`.
 *   3. Sequence capture: fresh browser context (so `hasSeenOpeningEver` is
 *      unset — first-ever variant), `reducedMotion: 'no-preference'`, SAME
 *      weather fixture, `?seed=demo` → wait for the ~900ms first-ever
 *      sequence to finish (`onComplete` hands off to the always-mounted
 *      WeatherScene — see OpeningSequence.tsx's own header comment on why
 *      this hand-off never remounts anything) → screenshot the SAME region.
 *   4. Raw-pixel diff via `sharp` (already a devDependency — no new
 *      dependency added for this). The `.hjm-fresh` freshness-timestamp
 *      element's own bounding box is excluded from the diff (its text is
 *      expected to differ by construction — two separate captures, distinct
 *      Date.now() reads).
 *
 * Exit 0 + prints the diff percentage when the excluded-region diff is
 * ~0 (< DIFF_THRESHOLD). Exit 1 otherwise. Run standalone with
 * `node scripts/verify-opening-sequence-endframe.mjs` after `npm run build`
 * — not wired into `npm run e2e` (that suite is a fast boot/error smoke
 * test; this is a slower, more surgical visual-regression check), but safe
 * to run in the same CI stage.
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.OPENING_ENDFRAME_PORT ?? 4195);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(ROOT, 'screenshots', 'p10.1-opening-endframe');
const DIFF_THRESHOLD = 0.005; // 0.5% of compared pixels — "~0" per the design note

function fail(msg) {
  console.error(`OPENING-ENDFRAME FAIL: ${msg}`);
  process.exitCode = 1;
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not answer ${url} within ${timeoutMs}ms`);
}

/** Same shape as purchase-flow.ts's buildFixedForecast — deterministic, always-ready, mild weather. */
function buildFixedForecast() {
  const start = Date.now() - 60 * 60 * 1000;
  const timeseries = Array.from({ length: 10 * 24 }, (_, index) => ({
    time: new Date(start + index * 60 * 60 * 1000).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: 5,
          wind_speed: 2,
          wind_from_direction: 180,
          relative_humidity: 70,
          cloud_area_fraction: 40,
        },
      },
      next_1_hours: {
        summary: { symbol_code: 'partlycloudy_day' },
        details: { precipitation_amount: 0 },
      },
    },
  }));
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

async function installFixedForecastRoute(page) {
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildFixedForecast()),
    });
  });
}

/** Bounding box of `.hjm-fresh` (the freshness-timestamp line) in CSS px, or null if not found. */
async function freshRect(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.hjm-fresh');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function captureReference(browser, theme) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await installFixedForecastRoute(page);
  await page.addInitScript((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.locator('.hjm-panel').first().waitFor({ state: 'visible', timeout: 15_000 });
  // Weather-ready needs the fixed-forecast fetch to resolve + render.
  await page.locator('.hjm-temp').first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(150); // settle any CSS transition triggered by data-theme
  const rect = await freshRect(page);
  const buffer = await page.locator('.hjem-monter').first().screenshot();
  await ctx.close();
  return { buffer, rect };
}

async function captureSequenceEndframe(browser, theme) {
  // Fresh context → hasSeenOpeningEver is unset in this context's
  // localStorage → decideOpeningVariant picks 'first-ever'.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await installFixedForecastRoute(page);
  await page.addInitScript((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.locator('.hjm-opening-mascot-body').first().waitFor({ state: 'attached', timeout: 15_000 });
  // FIRST_EVER_TOTAL_MS is 900ms — wait comfortably past it, then confirm
  // the sequence layers are gone (onComplete unmounted OpeningSequence).
  await page.locator('.hjm-opening-mascot-body').first().waitFor({ state: 'detached', timeout: 5_000 });
  await page.waitForTimeout(150); // settle
  const rect = await freshRect(page);
  const buffer = await page.locator('.hjem-monter').first().screenshot();
  await ctx.close();
  return { buffer, rect };
}

/** Blanks out `rect` (CSS px, same coordinate space as the screenshot since deviceScaleFactor=1 by default) in both buffers before diffing. */
async function blank(buffer, rect) {
  if (!rect) return buffer;
  const img = sharp(buffer);
  const meta = await img.metadata();
  const left = Math.max(0, Math.floor(rect.x));
  const top = Math.max(0, Math.floor(rect.y));
  const width = Math.min(meta.width - left, Math.ceil(rect.width) + 2);
  const height = Math.min(meta.height - top, Math.ceil(rect.height) + 2);
  if (width <= 0 || height <= 0) return buffer;
  return img
    .composite([{
      input: { create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } },
      left,
      top,
      blend: 'source', // fully overwrite that region with transparent-black in BOTH images identically
    }])
    .png()
    .toBuffer();
}

async function pixelDiffPercent(bufferA, bufferB) {
  const [a, b] = await Promise.all([
    sharp(bufferA).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(bufferB).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    throw new Error(`captures differ in size: ${a.info.width}x${a.info.height} vs ${b.info.width}x${b.info.height}`);
  }
  const { width, height, channels } = a.info;
  const total = width * height;
  let diffPixels = 0;
  for (let i = 0; i < total; i++) {
    const base = i * channels;
    const dr = Math.abs(a.data[base] - b.data[base]);
    const dg = Math.abs(a.data[base + 1] - b.data[base + 1]);
    const db = Math.abs(a.data[base + 2] - b.data[base + 2]);
    const da = Math.abs(a.data[base + 3] - b.data[base + 3]);
    // A per-channel tolerance of 12/255 absorbs benign AA/subpixel jitter
    // (font hinting, 1-line-per-run text rasterisation) without masking a
    // real layout/geometry/colour regression.
    if (dr > 12 || dg > 12 || db > 12 || da > 12) diffPixels++;
  }
  return diffPixels / total;
}

async function verifyTheme(browser, theme) {
  console.log(`[opening-endframe] capturing theme=${theme} …`);
  const [reference, sequence] = await Promise.all([
    captureReference(browser, theme),
    captureSequenceEndframe(browser, theme),
  ]);

  await mkdir(OUT_DIR, { recursive: true });
  const refPath = path.join(OUT_DIR, `reference-${theme}.png`);
  const seqPath = path.join(OUT_DIR, `sequence-endframe-${theme}.png`);
  await sharp(reference.buffer).toFile(refPath);
  await sharp(sequence.buffer).toFile(seqPath);

  const refBlanked = await blank(reference.buffer, reference.rect);
  const seqBlanked = await blank(sequence.buffer, sequence.rect);

  if (refBlanked.length === 0 || seqBlanked.length === 0) {
    fail(`${theme}: empty screenshot buffer`);
    return;
  }

  let diffPercent;
  try {
    diffPercent = await pixelDiffPercent(refBlanked, seqBlanked);
  } catch (err) {
    fail(`${theme}: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const diffImg = sharp(refBlanked);
  const diffPath = path.join(OUT_DIR, `diff-${theme}.png`);
  await diffImg.toFile(diffPath); // reference (post-blank) kept alongside for manual inspection

  console.log(`[opening-endframe] ${theme}: diff=${(diffPercent * 100).toFixed(3)}% (threshold ${(DIFF_THRESHOLD * 100).toFixed(2)}%)`);
  console.log(`[opening-endframe] ${theme}: reference=${refPath}`);
  console.log(`[opening-endframe] ${theme}: sequence-endframe=${seqPath}`);

  if (diffPercent > DIFF_THRESHOLD) {
    fail(`${theme}: end-frame diverges from the app's own weather-ready render by ${(diffPercent * 100).toFixed(3)}% (> ${(DIFF_THRESHOLD * 100).toFixed(2)}% threshold), excluding the freshness-timestamp region`);
    return;
  }
  console.log(`[opening-endframe] ${theme}: PASS (pixel-identical within tolerance)`);
}

async function main() {
  let server = null;
  let browser = null;
  try {
    server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
      cwd: ROOT,
    });
    await waitForServer(BASE);
    browser = await chromium.launch();

    for (const theme of ['dark', 'light']) {
      await verifyTheme(browser, theme);
    }

    if (process.exitCode) {
      console.error('OPENING-ENDFRAME: FAILED — see above');
    } else {
      console.log('OPENING-ENDFRAME PASS: both themes pixel-identical (excl. freshness timestamp)');
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

await main();
