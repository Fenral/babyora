/**
 * Result-first Home verification against the built application.
 *
 * Run after `npm run build`: node tools/verify-hjem.mjs
 *
 * Home is one vertical, numbered garment list. Every row is the target and
 * opens a native bottom sheet. The compact weather panel has one independent
 * situation selector; the avatar may bridge the weather and list surfaces,
 * but its visible pixels may never cover weather controls or garment content.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const VIEWPORTS = Object.freeze([
  { width: 320, height: 700 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
]);

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
  page.on('pageerror', (error) => jsErrors.push(`${viewport.width}px: ${String(error)}`));
  await page.addInitScript(() => {
    localStorage.setItem('babyora.theme', JSON.stringify({ state: { mode: 'light' }, version: 0 }));
  });
  await page.route('**/api/forecast*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(forecastPartlyCloudy1C()),
  }));
  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.hjm-result-list .hjm-row').first().waitFor({ state: 'visible', timeout: 8_000 });
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('.hjm-result-list img,[data-result-avatar-seam] img'));
    await Promise.all(images.map((image) => image instanceof HTMLImageElement
      ? image.decode().catch(() => undefined)
      : Promise.resolve()));
  });
  // Let the optional first-result row stagger and responsive seam observers settle.
  await page.waitForTimeout(520);
  return page;
}

async function measureLayout(page) {
  return page.evaluate(() => {
    const list = document.querySelector('.hjm-result-list');
    const strip = document.querySelector('.hjm-strip');
    const situation = document.querySelector('.hjm-strip__situation');
    const situationValue = situation?.querySelector('strong');
    const situationCaret = situation?.querySelector(':scope > svg:last-child');
    if (!(list instanceof HTMLOListElement)
      || !(strip instanceof HTMLElement)
      || !(situation instanceof HTMLButtonElement)
      || !(situationValue instanceof HTMLElement)
      || !(situationCaret instanceof SVGElement)) return null;

    const rowItems = Array.from(list.children).filter((element) => element.matches('.hjm-row-item'));
    const rows = rowItems
      .map((item) => item.querySelector(':scope > button.hjm-row'))
      .filter((row) => row instanceof HTMLButtonElement);
    const rowRects = rows.map((row) => row.getBoundingClientRect());
    const orderedVertically = rowRects.every((rect, index) => (
      index === 0 || rect.top >= rowRects[index - 1].bottom - 1
    ));
    const listRect = list.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const situationRect = situation.getBoundingClientRect();
    const valueRect = situationValue.getBoundingClientRect();
    const caretRect = situationCaret.getBoundingClientRect();
    const thumbnails = Array.from(list.querySelectorAll('.hjm-thumb'));
    const images = Array.from(list.querySelectorAll('.hjm-thumb img'));
    const imagesContained = images.every((image) => {
      const imageRect = image.getBoundingClientRect();
      const thumb = image.closest('.hjm-thumb');
      if (!(thumb instanceof HTMLElement)) return false;
      const thumbRect = thumb.getBoundingClientRect();
      return imageRect.left >= thumbRect.left - 1
        && imageRect.right <= thumbRect.right + 1
        && imageRect.top >= thumbRect.top - 1
        && imageRect.bottom <= thumbRect.bottom + 1;
    });
    const realImages = images.filter((image) => !image.currentSrc.startsWith('data:image/svg+xml')).length;
    const listStyle = getComputedStyle(list);
    const root = document.querySelector('.hjem-monter--result');
    const rootStyle = root instanceof HTMLElement ? getComputedStyle(root) : null;
    const stripButtons = strip.querySelectorAll('button');
    const forbiddenCarousel = document.querySelectorAll([
      '.hjm-journey-rail',
      '.hjm-journey-progress',
      '.hjm-journey-nav-button',
      '.hjm-journey-dots',
      '[data-loop-band]',
    ].join(','));

    return {
      width: window.innerWidth,
      resultCount: document.querySelectorAll('.hjm-result').length,
      stripCount: document.querySelectorAll('.hjm-strip').length,
      listCount: document.querySelectorAll('.hjm-result-list').length,
      rowItems: rowItems.length,
      rowButtons: rows.length,
      rowChevrons: list.querySelectorAll('.hjm-row-next svg').length,
      rowAriaLabels: rows.every((row) => (row.getAttribute('aria-label') ?? '').trim().length > 0),
      orderedVertically,
      minRowHeight: rowRects.length ? Math.min(...rowRects.map((rect) => rect.height)) : 0,
      listOverflow: list.scrollWidth - list.clientWidth,
      documentOverflow: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ) - window.innerWidth,
      listInsideViewport: listRect.left >= -1 && listRect.right <= window.innerWidth + 1,
      forbiddenCarousel: forbiddenCarousel.length,
      listOverflowStyle: listStyle.overflowX,
      thumbnails: thumbnails.length,
      minThumbnailSize: thumbnails.length
        ? Math.min(...thumbnails.map((thumb) => {
          const rect = thumb.getBoundingClientRect();
          return Math.min(rect.width, rect.height);
        }))
        : 0,
      images: images.length,
      realImages,
      imagesLoaded: images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
      imagesContained,
      imagesUseContain: images.every((image) => getComputedStyle(image).objectFit === 'contain'),
      stripTag: strip.tagName,
      stripButtons: stripButtons.length,
      situationHeight: situationRect.height,
      situationInsideStrip: situationRect.left >= stripRect.left - 1
        && situationRect.right <= stripRect.right + 1
        && situationRect.top >= stripRect.top - 1
        && situationRect.bottom <= stripRect.bottom + 1,
      situationAria: situation.getAttribute('aria-label') ?? '',
      inlineCaretGap: caretRect.left - valueRect.right,
      caretInsideSituation: caretRect.left >= situationRect.left - 1
        && caretRect.right <= situationRect.right + 1
        && caretRect.top >= situationRect.top - 1
        && caretRect.bottom <= situationRect.bottom + 1,
      theme: document.documentElement.getAttribute('data-theme'),
      rootBackground: rootStyle?.backgroundColor ?? '',
      rootBackgroundImage: rootStyle?.backgroundImage ?? '',
      listBackground: listStyle.backgroundColor,
      listShadow: listStyle.boxShadow,
      legacy: document.querySelectorAll('.hjm-cta, .hjm-scan-overlay, .hjm-scanline').length,
    };
  });
}

async function measureMascotSeam(page) {
  return page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('[data-result-avatar-seam] img'));
    const image = images[0];
    const strip = document.querySelector('.hjm-strip');
    const list = document.querySelector('.hjm-result-list');
    if (!(image instanceof HTMLImageElement)
      || !(strip instanceof HTMLElement)
      || !(list instanceof HTMLElement)) return null;

    await image.decode();
    const imageRect = image.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) return null;
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const scaleX = imageRect.width / canvas.width;
    const scaleY = imageRect.height / canvas.height;
    const threshold = 32;
    let alphaTop = Number.POSITIVE_INFINITY;
    let alphaBottom = Number.NEGATIVE_INFINITY;
    let weightedAlpha = 0;
    let weightedVisibleAlpha = 0;

    const rangeRects = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return [];
      const range = document.createRange();
      range.selectNodeContents(element);
      return Array.from(range.getClientRects());
    };
    const wholeRect = (selector) => {
      const element = document.querySelector(selector);
      return element instanceof Element ? [element.getBoundingClientRect()] : [];
    };
    const protectedRects = {
      temperature: rangeRects('.hjm-s-temp'),
      metadata: rangeRects('.hjm-s-meta'),
      weatherIcon: wholeRect('.hjm-s-weather'),
      situationPin: wholeRect('.hjm-strip__situation > svg:first-child'),
      situationLabel: rangeRects('.hjm-strip__situation-label'),
      situationValue: rangeRects('.hjm-strip__situation strong'),
      situationCaret: wholeRect('.hjm-strip__situation > svg:last-child'),
      title: rangeRects('.hjm-result-copy h1'),
      subtitle: rangeRects('.hjm-result-copy .hjm-sub'),
      firstRowNumber: rangeRects('.hjm-result-list .hjm-row:first-child .hjm-num'),
      firstRowThumbnail: wholeRect('.hjm-result-list .hjm-row:first-child .hjm-thumb'),
      firstRowText: rangeRects('.hjm-result-list .hjm-row:first-child .hjm-row-text'),
      // Bevar 44px trefflaten (målt separat i gate 2), men beskytt den
      // synlige chevronen her. Maskoten er pointer-events:none og kan trygt
      // henge over den usynlige delen av radens målflate uten å skjule en
      // handling eller fange trykk.
      firstRowChevron: wholeRect('.hjm-result-list .hjm-row:first-child .hjm-row-next svg'),
    };
    const protectedHits = Object.fromEntries(Object.keys(protectedRects).map((name) => [name, 0]));

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = rgba[(y * canvas.width + x) * 4 + 3];
        if (alpha <= threshold) continue;
        const left = imageRect.left + x * scaleX;
        const top = imageRect.top + y * scaleY;
        const right = left + scaleX;
        const bottom = top + scaleY;
        const weight = alpha / 255;
        alphaTop = Math.min(alphaTop, top);
        alphaBottom = Math.max(alphaBottom, bottom);
        weightedAlpha += weight;
        if (right > 0 && left < window.innerWidth && bottom > 0 && top < window.innerHeight) {
          weightedVisibleAlpha += weight;
        }
        for (const [name, rects] of Object.entries(protectedRects)) {
          if (rects.some((rect) => (
            Math.min(right, rect.right) > Math.max(left, rect.left)
            && Math.min(bottom, rect.bottom) > Math.max(top, rect.top)
          ))) protectedHits[name] += 1;
        }
      }
    }

    if (!Number.isFinite(alphaTop) || !Number.isFinite(alphaBottom)) return null;
    return {
      avatarCount: images.length,
      loaded: image.complete && image.naturalWidth > 0,
      expandedCopy: document.querySelector('.hjm-result-seam')?.getAttribute('data-expanded-copy'),
      expandedWeather: document.querySelector('.hjm-result-seam')?.getAttribute('data-expanded-weather'),
      stripHeight: stripRect.height,
      weatherOverlap: stripRect.bottom - alphaTop,
      listOverlap: alphaBottom - listRect.top,
      visibleAlphaRatio: weightedAlpha === 0 ? 0 : weightedVisibleAlpha / weightedAlpha,
      protectedHits,
    };
  });
}

async function verifySheet(page) {
  const trigger = page.locator('.hjm-result-list .hjm-row').first();
  const rowLabel = (await trigger.locator('.hjm-g-name').textContent())?.trim() ?? '';
  await trigger.evaluate((element) => element.setAttribute('data-verify-detail-trigger', 'true'));
  await trigger.click();
  const sheet = page.locator('dialog.hgd-sheet[data-garment-detail-sheet][open]');
  await sheet.waitFor({ state: 'visible', timeout: 3_000 });
  // Arket bruker den delte, 400ms iOS-drawer-overgangen. Mål den ferdige
  // native flaten, ikke en mellomframe på vei inn fra bunnen.
  await page.waitForFunction(() => (
    document.querySelector('dialog.hgd-sheet[data-garment-detail-sheet]')
      ?.getAttribute('data-motion-phase') === 'settled'
  ), undefined, { timeout: 1_000 });
  const open = await page.evaluate(() => {
    const dialog = document.querySelector('dialog.hgd-sheet[data-garment-detail-sheet][open]');
    const close = dialog?.querySelector('.hgd-sheet__close');
    const image = dialog?.querySelector('.hgd-sheet__image img');
    const heading = dialog?.querySelector('#hgd-sheet-title');
    if (!(dialog instanceof HTMLDialogElement)
      || !(close instanceof HTMLButtonElement)
      || !(image instanceof HTMLImageElement)
      || !(heading instanceof HTMLElement)) return null;
    const rect = dialog.getBoundingClientRect();
    const closeRect = close.getBoundingClientRect();
    const backdropStyle = getComputedStyle(dialog, '::backdrop');
    return {
      isModal: dialog.matches(':modal'),
      heading: heading.textContent?.trim() ?? '',
      bottomGap: window.innerHeight - rect.bottom,
      insideViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1
        && rect.top >= -1 && rect.bottom <= window.innerHeight + 1,
      closeSize: Math.min(closeRect.width, closeRect.height),
      imageLoaded: image.complete && image.naturalWidth > 0,
      hasHandle: dialog.querySelector('.hgd-sheet__handle') !== null,
      backdropColor: backdropStyle.backgroundColor,
      backdropFilter: backdropStyle.backdropFilter || backdropStyle.webkitBackdropFilter,
      ariaLabelledBy: dialog.getAttribute('aria-labelledby') ?? '',
    };
  });
  await sheet.locator('.hgd-sheet__close').click();
  await page.waitForFunction(() => !document.querySelector('dialog.hgd-sheet[open]'));
  await page.waitForTimeout(80);
  const focusReturned = await page.evaluate(() => (
    document.activeElement === document.querySelector('[data-verify-detail-trigger="true"]')
  ));
  return { rowLabel, open, focusReturned };
}

async function verifySituationSheet(page) {
  const trigger = page.locator('.hjm-strip__situation');
  const before = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    return {
      strip: rectFor('.hjm-strip'),
      list: rectFor('.hjm-result-list'),
      avatar: rectFor('[data-result-avatar-seam]'),
    };
  });
  await trigger.click();
  const sheet = page.locator('dialog.hcs-sheet[data-home-situation-sheet][open]');
  await sheet.waitFor({ state: 'visible', timeout: 3_000 });
  await page.waitForTimeout(48);
  const opening = await page.evaluate(() => {
    const dialog = document.querySelector('dialog.hcs-sheet[data-home-situation-sheet][open]');
    if (!(dialog instanceof HTMLDialogElement)) return null;
    const rect = dialog.getBoundingClientRect();
    const close = dialog.querySelector('.hcs-sheet__close');
    const focus = document.activeElement;
    const runningMotion = dialog.getAnimations().some((animation) => (
      animation.playState === 'running' || animation.currentTime !== null
    ));
    return {
      isModal: dialog.matches(':modal'),
      bottomGap: window.innerHeight - rect.bottom,
      radioCount: dialog.querySelectorAll('[role="radio"]').length,
      switchCount: dialog.querySelectorAll('[role="switch"]').length,
      labelledBy: dialog.getAttribute('aria-labelledby') ?? '',
      closeSize: close instanceof HTMLElement
        ? Math.min(close.getBoundingClientRect().width, close.getBoundingClientRect().height)
        : 0,
      focusInside: focus instanceof Node && dialog.contains(focus),
      runningMotion,
    };
  });
  await page.waitForTimeout(420);
  const settled = await page.evaluate(() => {
    const dialog = document.querySelector('dialog.hcs-sheet[data-home-situation-sheet][open]');
    if (!(dialog instanceof HTMLDialogElement)) return null;
    const rect = dialog.getBoundingClientRect();
    const close = dialog.querySelector('.hcs-sheet__close');
    const focus = document.activeElement;
    return {
      isModal: dialog.matches(':modal'),
      bottomGap: window.innerHeight - rect.bottom,
      radioCount: dialog.querySelectorAll('[role="radio"]').length,
      switchCount: dialog.querySelectorAll('[role="switch"]').length,
      labelledBy: dialog.getAttribute('aria-labelledby') ?? '',
      closeSize: close instanceof HTMLElement
        ? Math.min(close.getBoundingClientRect().width, close.getBoundingClientRect().height)
        : 0,
      focusInside: focus instanceof Node && dialog.contains(focus),
    };
  });
  const open = settled === null
    ? null
    : { ...settled, runningMotion: opening?.runningMotion ?? false };
  const during = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    return {
      strip: rectFor('.hjm-strip'),
      list: rectFor('.hjm-result-list'),
      avatar: rectFor('[data-result-avatar-seam]'),
    };
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.hcs-sheet[open]'));
  await page.waitForTimeout(80);
  const focusReturned = await page.evaluate(() => (
    document.activeElement === document.querySelector('.hjm-strip__situation')
  ));
  const drift = Object.fromEntries(Object.entries(before).map(([key, beforeRect]) => {
    const duringRect = during[key];
    if (beforeRect === null || duringRect === null) return [key, Infinity];
    return [key, Math.max(
      Math.abs(beforeRect.x - duringRect.x),
      Math.abs(beforeRect.y - duringRect.y),
      Math.abs(beforeRect.width - duringRect.width),
      Math.abs(beforeRect.height - duringRect.height),
    )];
  }));
  return { open, focusReturned, drift };
}

try {
  await waitForServer(BASE, server);
  browser = await chromium.launch();

  const measurements = [];
  const pages = [];
  for (const viewport of VIEWPORTS) {
    const page = await openHome(viewport);
    pages.push(page);
    measurements.push({
      viewport,
      layout: await measureLayout(page),
      seam: await measureMascotSeam(page),
    });
  }

  const primary = measurements.find(({ viewport }) => viewport.width === 393)?.layout ?? null;
  gate(
    '0. Home opens directly on one result, weather strip and garment list',
    primary !== null
      && primary.resultCount === 1
      && primary.stripCount === 1
      && primary.listCount === 1
      && primary.rowItems > 0,
    primary === null
      ? '393px Home contract is missing'
      : `result/strip/list=${primary.resultCount}/${primary.stripCount}/${primary.listCount} rows=${primary.rowItems}`,
  );

  const retiredPassed = measurements.every(({ layout }) => layout !== null
    && layout.legacy === 0
    && layout.forbiddenCarousel === 0);
  gate(
    '1. retired CTA, scan and horizontal carousel are absent',
    retiredPassed,
    measurements.map(({ viewport, layout }) => layout === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px legacy/carousel=${layout.legacy}/${layout.forbiddenCarousel}`).join('; '),
  );

  const verticalPassed = measurements.every(({ layout }) => layout !== null
    && layout.rowItems === layout.rowButtons
    && layout.rowButtons === layout.rowChevrons
    && layout.rowAriaLabels
    && layout.orderedVertically
    && layout.minRowHeight >= 44
    && layout.listOverflow <= 1
    && layout.documentOverflow <= 1
    && layout.listInsideViewport);
  gate(
    '2. every garment is one accessible vertical row with a 44px target',
    verticalPassed,
    measurements.map(({ viewport, layout }) => layout === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px rows/buttons/chevrons=${layout.rowItems}/${layout.rowButtons}/${layout.rowChevrons} min=${layout.minRowHeight.toFixed(1)}px list/doc overflow=${layout.listOverflow}/${layout.documentOverflow}px ordered=${layout.orderedVertically}`).join('; '),
  );

  const imagesPassed = measurements.every(({ layout }) => layout !== null
    && layout.thumbnails === layout.rowItems
    && layout.images === layout.rowItems
    && layout.realImages === layout.rowItems
    && layout.minThumbnailSize >= 44
    && layout.imagesLoaded
    && layout.imagesContained
    && layout.imagesUseContain);
  gate(
    '3. every garment has a loaded, contained illustration',
    imagesPassed,
    measurements.map(({ viewport, layout }) => layout === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px images=${layout.realImages}/${layout.rowItems} loaded=${layout.imagesLoaded} contained=${layout.imagesContained} min thumb=${layout.minThumbnailSize.toFixed(1)}px`).join('; '),
  );

  const selectorPassed = measurements.every(({ layout }) => layout !== null
    && layout.stripTag === 'SECTION'
    && layout.stripButtons === 1
    && layout.situationHeight >= 44
    && layout.situationInsideStrip
    && layout.situationAria.trim().length > 0
    && layout.inlineCaretGap >= -4
    && layout.inlineCaretGap <= 12
    && layout.caretInsideSituation);
  gate(
    '4. weather has one independent situation selector with an inline caret',
    selectorPassed,
    measurements.map(({ viewport, layout }) => layout === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px strip=${layout.stripTag} buttons=${layout.stripButtons} target=${layout.situationHeight.toFixed(1)}px caret gap=${layout.inlineCaretGap.toFixed(1)}px`).join('; '),
  );

  const seamPassed = measurements.every(({ seam }) => seam !== null
    && seam.avatarCount === 1
    && seam.loaded
    && seam.weatherOverlap > 0
    && seam.listOverlap > 0
    && seam.visibleAlphaRatio >= 0.96
    && Object.values(seam.protectedHits).every((hits) => hits === 0));
  gate(
    '5. avatar bridges weather and list without covering content or the selector',
    seamPassed,
    measurements.map(({ viewport, seam }) => seam === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px weather/list=${seam.weatherOverlap.toFixed(1)}/${seam.listOverlap.toFixed(1)}px hits=${JSON.stringify(seam.protectedHits)} visible=${(seam.visibleAlphaRatio * 100).toFixed(1)}%`).join('; '),
  );

  const depthPassed = measurements.every(({ layout }) => layout !== null
    && layout.theme === 'light'
    && layout.rootBackgroundImage === 'none'
    && layout.rootBackground !== layout.listBackground
    && layout.listShadow !== 'none'
    && /\binset\b/u.test(layout.listShadow));
  gate(
    '6. Mineral Garden list is a raised surface on the light canvas',
    depthPassed,
    measurements.map(({ viewport, layout }) => layout === null
      ? `${viewport.width}px=missing`
      : `${viewport.width}px theme=${layout.theme} canvas/list=${layout.rootBackground}/${layout.listBackground} inset=${/\binset\b/u.test(layout.listShadow)}`).join('; '),
  );

  const sheetPage = pages[1];
  const sheetResult = await verifySheet(sheetPage);
  const sheetPassed = sheetResult.open !== null
    && sheetResult.open.isModal
    && sheetResult.open.heading === sheetResult.rowLabel
    && sheetResult.open.bottomGap >= 0
    && sheetResult.open.bottomGap <= 24
    && sheetResult.open.insideViewport
    && sheetResult.open.closeSize >= 43.5
    && sheetResult.open.imageLoaded
    && sheetResult.open.hasHandle
    && sheetResult.open.ariaLabelledBy === 'hgd-sheet-title'
    && sheetResult.open.backdropColor !== 'rgba(0, 0, 0, 0)'
    && sheetResult.open.backdropFilter !== 'none'
    && sheetResult.focusReturned;
  gate(
    '7. a garment row opens the bottom sheet and close restores focus',
    sheetPassed,
    sheetResult.open === null
      ? 'bottom sheet is missing'
      : `modal=${sheetResult.open.isModal} heading match=${sheetResult.open.heading === sheetResult.rowLabel} bottom=${sheetResult.open.bottomGap.toFixed(1)}px close=${sheetResult.open.closeSize.toFixed(1)}px image=${sheetResult.open.imageLoaded} backdrop=${sheetResult.open.backdropFilter} focus=${sheetResult.focusReturned}`,
  );

  const situationResult = await verifySituationSheet(sheetPage);
  const situationPassed = situationResult.open !== null
    && situationResult.open.isModal
    && situationResult.open.bottomGap >= 0
    && situationResult.open.bottomGap <= 24
    && situationResult.open.radioCount === 3
    && situationResult.open.switchCount === 1
    && situationResult.open.labelledBy === 'hcs-sheet-title'
    && situationResult.open.closeSize >= 43.5
    && situationResult.open.focusInside
    && situationResult.open.runningMotion
    && situationResult.focusReturned
    && Object.values(situationResult.drift).every((value) => value <= 1);
  gate(
    '8. situation opens with the same bottom-sheet motion without moving Home',
    situationPassed,
    situationResult.open === null
      ? 'situation sheet is missing'
      : `modal=${situationResult.open.isModal} bottom=${situationResult.open.bottomGap.toFixed(1)}px radio/switch=${situationResult.open.radioCount}/${situationResult.open.switchCount} label=${situationResult.open.labelledBy} close=${situationResult.open.closeSize.toFixed(1)}px focus-in=${situationResult.open.focusInside} motion=${situationResult.open.runningMotion} focus-return=${situationResult.focusReturned} drift=${JSON.stringify(situationResult.drift)}`,
  );

  const largeTextPage = await openHome({ width: 393, height: 852 });
  await largeTextPage.addStyleTag({ content: `
    .hjm-strip .hjm-s-meta{font-size:24px!important;line-height:1.32!important}
    .hjm-strip .hjm-s-temp{font-size:60px!important}
    .hjm-result-copy h1{font-size:56px!important;line-height:1.12!important}
    .hjm-result-copy .hjm-sub{font-size:30px!important;line-height:1.4!important}
    .hjm-result-list .hjm-g-name{font-size:26px!important;line-height:1.2!important}
    .hjm-result-list .hjm-g-role{font-size:22px!important;line-height:1.25!important}
  ` });
  await largeTextPage.waitForFunction(() => (
    document.querySelector('.hjm-result-seam')?.getAttribute('data-expanded-copy') === 'true'
  ));
  await largeTextPage.waitForTimeout(180);
  const largeTextLayout = await measureLayout(largeTextPage);
  const largeTextSeam = await measureMascotSeam(largeTextPage);
  const largeTextOrder = await largeTextPage.evaluate(() => {
    const copy = document.querySelector('[data-result-copy]')?.getBoundingClientRect();
    const strip = document.querySelector('.hjm-strip')?.getBoundingClientRect();
    return copy && strip ? copy.bottom <= strip.top + 1 : false;
  });
  await largeTextPage.close();
  const largeTextPassed = largeTextLayout !== null
    && largeTextSeam !== null
    && largeTextSeam.expandedCopy === 'true'
    && largeTextOrder
    && largeTextLayout.minRowHeight >= 44
    && largeTextLayout.documentOverflow <= 1
    && largeTextLayout.listOverflow <= 1
    && Object.values(largeTextSeam.protectedHits).every((hits) => hits === 0);
  gate(
    '8. 200% text keeps reading order, row targets and collision safety',
    largeTextPassed,
    largeTextLayout === null || largeTextSeam === null
      ? 'large-text Home contract is missing'
      : `expanded=${largeTextSeam.expandedCopy} copy before weather=${largeTextOrder} min row=${largeTextLayout.minRowHeight.toFixed(1)}px overflow=${largeTextLayout.documentOverflow}px hits=${JSON.stringify(largeTextSeam.protectedHits)}`,
  );

  for (const page of pages) await page.close();
  gate(
    '9. no browser JavaScript errors',
    jsErrors.length === 0,
    jsErrors.join('; '),
  );
} catch (error) {
  gate('verifier completed', false, String(error?.stack ?? error?.message ?? error));
} finally {
  if (browser) await browser.close();
  server.kill();
}

const width = Math.max(...gates.map(({ name }) => name.length));
console.log('\n-- verify-hjem: vertical-list Home contract --');
for (const result of gates) {
  console.log(`  ${result.passed ? 'PASS' : 'FAIL'} ${result.name.padEnd(width)}  ${result.detail}`);
}
const failures = gates.filter(({ passed }) => !passed).length;
console.log(`\n${gates.length - failures}/${gates.length} gates passed.`);
process.exit(failures ? 1 : 0);
