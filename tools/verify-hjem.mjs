/**
 * Result-first Home verification against the built application.
 *
 * Run after `npm run build`: node tools/verify-hjem.mjs
 * The verifier deliberately does not click anything. Home must settle directly
 * on the result without exposing the retired CTA/scan experience there.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

async function availablePort(fallback) {
  const net = await import('node:net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(typeof address === 'object' ? address.port : fallback));
    });
    server.on('error', () => resolve(fallback));
  });
}

const PORT = Number(process.env.VERIFY_PORT ?? await availablePort(4183));
const BASE = `http://localhost:${PORT}`;
const gates = [];
const gate = (name, passed, detail) => gates.push({ name, passed, detail });

async function waitForServer(url, server, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`preview exited with code ${server.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Preview is not accepting connections yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`preview did not answer at ${url}`);
}

const server = spawn(process.execPath, [VITE_CLI, 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
  shell: false,
});

let browser;
const jsErrors = [];

async function openHome(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, colorScheme: 'light' });
  page.on('pageerror', (error) => jsErrors.push(String(error)));
  await page.addInitScript(() => {
    localStorage.setItem('babyora.theme', JSON.stringify({ state: { mode: 'light' }, version: 0 }));
  });
  await page.route('**/api/forecast*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(forecastPartlyCloudy1C()),
  }));
  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.locator('.hjm-result').waitFor({ state: 'visible', timeout: 8_000 });
  await page.locator('.hjm-journey-rail[data-loop-ready="true"]').waitFor({ state: 'visible', timeout: 3_000 });
  return page;
}

try {
  await waitForServer(BASE, server);
  browser = await chromium.launch();
  const page = await openHome({ width: 430, height: 932 });

  const initial = await page.evaluate(() => {
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const result = document.querySelector('.hjm-result');
    const strip = document.querySelector('.hjm-strip');
    return {
      result: visible(result),
      strip: visible(strip),
      title: result?.querySelector('h1')?.textContent?.trim() ?? '(missing)',
      resultCount: document.querySelectorAll('.hjm-result').length,
      stripCount: document.querySelectorAll('.hjm-strip').length,
      currentLegacy: document.querySelectorAll('.hjm-cta, .hjm-scan-overlay, .hjm-scanline').length,
    };
  });
  gate(
    '0. Home opens directly on one result and one weather strip',
    initial.result && initial.strip && initial.resultCount === 1 && initial.stripCount === 1,
    `result=${initial.resultCount} strip=${initial.stripCount} title="${initial.title}"`,
  );
  gate(
    '1. settled result has no retired CTA or scan',
    initial.currentLegacy === 0,
    `legacy nodes=${initial.currentLegacy}`,
  );

  const mascot = await page.evaluate(async () => {
    const seam = document.querySelector('.hjm-result-mascot-seam');
    const image = seam?.querySelector('img');
    if (!(seam instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return null;
    const read = () => {
      const rect = image.getBoundingClientRect();
      return {
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        transform: getComputedStyle(image).transform,
      };
    };
    const before = read();
    await new Promise((resolve) => setTimeout(resolve, 650));
    return {
      before,
      after: read(),
      loaded: image.complete && image.naturalWidth > 0,
      animations: seam.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length,
      legacyMascots: document.querySelectorAll('.hjm-mascot, .hjm-mascot-anchor').length,
    };
  });
  const mascotStable = mascot !== null && JSON.stringify(mascot.before) === JSON.stringify(mascot.after);
  gate(
    '2. result mascot is a loaded, static seam',
    mascot !== null && mascot.loaded && mascot.animations === 0 && mascot.legacyMascots === 0 && mascotStable,
    mascot === null
      ? 'result mascot seam is missing'
      : `loaded=${mascot.loaded} running animations=${mascot.animations} legacy mascots=${mascot.legacyMascots} stable=${mascotStable}`,
  );

  const bands = await page.evaluate(() => {
    const rail = document.querySelector('.hjm-journey-rail');
    if (!(rail instanceof HTMLElement)) return null;
    const cards = Array.from(rail.children).filter((element) => element.matches('[data-loop-band]'));
    const count = (name) => cards.filter((element) => element.getAttribute('data-loop-band') === name).length;
    const clones = cards.filter((element) => element.getAttribute('data-loop-band') !== 'canonical');
    const canonical = cards.filter((element) => element.getAttribute('data-loop-band') === 'canonical');
    return {
      leading: count('leading'),
      canonical: canonical.length,
      trailing: count('trailing'),
      total: cards.length,
      clonesHidden: clones.every((element) => element.getAttribute('aria-hidden') === 'true' && element.inert),
      canonicalExposed: canonical.every((element) => element.getAttribute('aria-hidden') === null && !element.inert),
      overviewCount: rail.querySelectorAll('[data-hjm-overview-card="true"]').length,
      garmentCount: rail.querySelectorAll('[data-hjm-journey-card="true"]').length,
    };
  });
  const equalBands = bands !== null
    && bands.canonical > 1
    && bands.leading === bands.canonical
    && bands.trailing === bands.canonical
    && bands.total === bands.canonical * 3;
  gate(
    '3. rail has three equal accessible loop bands',
    equalBands && bands.clonesHidden && bands.canonicalExposed
      && bands.overviewCount === 1 && bands.garmentCount === bands.canonical - 1,
    bands === null
      ? 'rail is missing'
      : `leading/canonical/trailing=${bands.leading}/${bands.canonical}/${bands.trailing} clones hidden=${bands.clonesHidden}`,
  );

  const loop = await page.evaluate(async () => {
    const rail = document.querySelector('.hjm-journey-rail');
    if (!(rail instanceof HTMLElement)) return null;
    const cards = Array.from(rail.children);
    const logicalCount = cards.length / 3;
    const nearestIndex = () => {
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const next = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (next < distance) {
          distance = next;
          nearest = index;
        }
      });
      return nearest;
    };
    const centerOn = async (index) => {
      const card = cards[index];
      rail.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
      rail.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 300));
      return nearestIndex();
    };
    const initialIndex = nearestIndex();
    const afterLeading = await centerOn(0);
    const afterTrailing = await centerOn(cards.length - 1);
    return { logicalCount, initialIndex, afterLeading, afterTrailing };
  });
  const inCanonical = (index) => loop !== null
    && index >= loop.logicalCount
    && index < loop.logicalCount * 2;
  gate(
    '4. infinite rail starts central and normalizes both clone bands',
    loop !== null && inCanonical(loop.initialIndex) && inCanonical(loop.afterLeading) && inCanonical(loop.afterTrailing),
    loop === null
      ? 'rail is missing'
      : `logical=${loop.logicalCount} indices initial/leading/trailing=${loop.initialIndex}/${loop.afterLeading}/${loop.afterTrailing}`,
  );

  const geometry = await page.evaluate(() => {
    const rail = document.querySelector('.hjm-journey-rail');
    if (!(rail instanceof HTMLElement)) return null;
    const cards = Array.from(rail.children);
    const viewport = rail.getBoundingClientRect();
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let activeIndex = 0;
    let activeDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < activeDistance) {
        activeDistance = distance;
        activeIndex = index;
      }
    });
    const active = cards[activeIndex].getBoundingClientRect();
    const previous = cards[activeIndex - 1]?.getBoundingClientRect();
    const next = cards[activeIndex + 1]?.getBoundingClientRect();
    const intersectionWidth = (rect) => rect
      ? Math.max(0, Math.min(viewport.right, rect.right) - Math.max(viewport.left, rect.left))
      : 0;
    return {
      centerError: Math.abs((active.left + active.right) / 2 - (viewport.left + viewport.right) / 2),
      previousPeek: intersectionWidth(previous),
      nextPeek: intersectionWidth(next),
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  gate(
    '5. active card is centered with equal neighbour previews',
    geometry !== null
      && geometry.centerError <= 2
      && geometry.previousPeek >= 24
      && geometry.nextPeek >= 24
      && Math.abs(geometry.previousPeek - geometry.nextPeek) <= 2
      && geometry.documentOverflow <= 1,
    geometry === null
      ? 'rail is missing'
      : `center error=${geometry.centerError.toFixed(1)} px peeks=${geometry.previousPeek.toFixed(1)}/${geometry.nextPeek.toFixed(1)} px document overflow=${geometry.documentOverflow}px`,
  );

  const depth = await page.evaluate(() => {
    const root = document.querySelector('.hjem-monter--result');
    const card = document.querySelector('[data-loop-band="canonical"] .hjm-journey-card-inner');
    if (!(root instanceof HTMLElement) || !(card instanceof HTMLElement)) return null;
    const rootStyle = getComputedStyle(root);
    const poolStyle = getComputedStyle(root, '::before');
    const cardStyle = getComputedStyle(card);
    const shadows = cardStyle.boxShadow.split(/,(?![^()]*\))/u).map((shadow) => ({
      inset: /\binset\b/u.test(shadow),
      offsets: Array.from(shadow.matchAll(/(-?\d+(?:\.\d+)?)px/gu), (match) => Number(match[1])).slice(0, 2),
    }));
    const lowerRightShadow = shadows.some(({ inset, offsets }) => !inset && offsets[0] > 0 && offsets[1] > 0);
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      canvasImage: rootStyle.backgroundImage,
      poolImage: poolStyle.backgroundImage,
      canvasColor: rootStyle.backgroundColor,
      cardColor: cardStyle.backgroundColor,
      boxShadow: cardStyle.boxShadow,
      insetHighlight: shadows.some(({ inset }) => inset),
      lowerRightShadow,
    };
  });
  gate(
    '6. Mineral Garden result canvas is neutral with upper-left light depth',
    depth !== null
      && depth.theme === 'light'
      && depth.canvasImage === 'none'
      && depth.poolImage === 'none'
      && depth.canvasColor !== depth.cardColor
      && depth.insetHighlight
      && depth.lowerRightShadow,
    depth === null
      ? 'result root or canonical card is missing'
      : `theme=${depth.theme} canvas=${depth.canvasColor} card=${depth.cardColor} gradient=${depth.canvasImage} inset=${depth.insetHighlight} lower-right shadow=${depth.lowerRightShadow}`,
  );

  const compact = await openHome({ width: 375, height: 667 });
  const compactGeometry = await compact.evaluate(() => {
    const visibleRect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
    const strip = visibleRect('.hjm-strip');
    const result = visibleRect('.hjm-result');
    const rail = visibleRect('.hjm-journey-rail');
    const bars = Array.from(document.querySelectorAll('nav,[class*="tab"]'))
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.height > 40 && rect.top > window.innerHeight * 0.55);
    const barTop = bars.length ? Math.min(...bars.map((rect) => rect.top)) : window.innerHeight;
    return {
      stripVisible: strip !== null && strip.top >= 0 && strip.bottom <= window.innerHeight,
      resultStartsBeforeBar: result !== null && result.top < barTop,
      railStartsBeforeBar: rail !== null && rail.top < barTop,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      legacy: document.querySelectorAll('.hjm-cta, .hjm-scan-overlay, .hjm-scanline').length,
    };
  });
  await compact.close();
  gate(
    '7. result-first geometry remains usable at 375x667',
    compactGeometry.stripVisible
      && compactGeometry.resultStartsBeforeBar
      && compactGeometry.railStartsBeforeBar
      && compactGeometry.documentOverflow <= 1
      && compactGeometry.legacy === 0,
    `strip visible=${compactGeometry.stripVisible} result/rail before tab bar=${compactGeometry.resultStartsBeforeBar}/${compactGeometry.railStartsBeforeBar} overflow=${compactGeometry.documentOverflow}px legacy=${compactGeometry.legacy}`,
  );

  await page.close();
  if (jsErrors.length) gate('8. no browser JavaScript errors', false, jsErrors.join('; '));
  else gate('8. no browser JavaScript errors', true, '');
} catch (error) {
  gate('verifier completed', false, String(error?.message ?? error));
} finally {
  if (browser) await browser.close();
  server.kill();
}

const width = Math.max(...gates.map(({ name }) => name.length));
console.log('\n-- verify-hjem: result-first Home contract --');
for (const result of gates) {
  console.log(`  ${result.passed ? 'PASS' : 'FAIL'} ${result.name.padEnd(width)}  ${result.detail}`);
}
const failures = gates.filter(({ passed }) => !passed).length;
console.log(`\n${gates.length - failures}/${gates.length} gates passed.`);
process.exit(failures ? 1 : 0);
