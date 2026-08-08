/**
 * Focused browser QA for the region-language policy and the Home result rail.
 *
 * Runs directly against a local Vite server, so it exercises the current
 * source tree rather than a possibly stale dist/ build:
 *   npx tsx e2e/localization-carousel.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from 'playwright';

const PORT = Number(process.env.LOCALIZATION_CAROUSEL_PORT ?? 4177);
const BASE = `http://127.0.0.1:${PORT}`;
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const VIEWPORT = { width: 390, height: 844 } as const;

type LocaleScenario = Readonly<{
  locale: 'sv-SE' | 'da-DK' | 'nb-NO';
  resolvedLanguage: 'sv' | 'da' | 'en';
  onboardingHeading: string;
  mainNavigation: string;
  home: string;
  plan: string;
  viewLegend: string;
  today: string;
  tomorrow: string;
  findOutfit: RegExp;
  oldResultCta: string;
  detailHeading: string;
  factSummary: string;
  detailAction: string;
}>;

const SCENARIOS: readonly LocaleScenario[] = [
  {
    locale: 'sv-SE',
    resolvedLanguage: 'sv',
    factSummary: 'Bra att veta',
    detailAction: 'Visa detaljer',
    onboardingHeading: 'Vem klär vi på?',
    mainNavigation: 'Huvudnavigering',
    home: 'Hem',
    plan: 'Planera',
    viewLegend: 'Välj planvy',
    today: 'I dag',
    tomorrow: 'I morgon',
    findOutfit: /^(Hitta|Visa) dagens kläder$/u,
    oldResultCta: 'Klä på steg för steg',
    detailHeading: 'Se varje plagg',
  },
  {
    locale: 'da-DK',
    resolvedLanguage: 'da',
    factSummary: 'Godt at vide',
    detailAction: 'Se detaljer',
    onboardingHeading: 'Hvem klæder vi på?',
    mainNavigation: 'Hovednavigation',
    home: 'Hjem',
    plan: 'Planlæg',
    viewLegend: 'Vælg planvisning',
    today: 'I dag',
    tomorrow: 'I morgen',
    findOutfit: /^(Find|Vis) dagens tøj$/u,
    oldResultCta: 'Giv tøjet på trin for trin',
    detailHeading: 'Se hvert stykke tøj',
  },
  {
    locale: 'nb-NO',
    resolvedLanguage: 'en',
    factSummary: 'Good to know',
    detailAction: 'See details',
    onboardingHeading: 'Who are we dressing?',
    mainNavigation: 'Main navigation',
    home: 'Home',
    plan: 'Plan',
    viewLegend: 'Choose planning view',
    today: 'Today',
    tomorrow: 'Tomorrow',
    findOutfit: /^(Find|Show) today’s outfit$/u,
    oldResultCta: 'Dress step by step',
    detailHeading: 'Explore each garment',
  },
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitForServer(
  url: string,
  server: ChildProcess,
  timeoutMs = 30_000,
): Promise<void> {
  let spawnError: Error | null = null;
  server.once('error', (error) => { spawnError = error; });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (spawnError !== null) throw spawnError;
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before startup with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Vite did not answer at ${url} within ${timeoutMs} ms`);
}

async function waitForExit(server: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (server.exitCode !== null || server.signalCode !== null) return true;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    server.once('exit', onExit);
  });
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode === null && server.signalCode === null) {
    server.kill();
    if (!(await waitForExit(server, 5_000))) {
      server.kill('SIGKILL');
      if (!(await waitForExit(server, 5_000))) {
        throw new Error('Vite did not stop after forced termination');
      }
    }
  }
}

function buildForecast(): unknown {
  const start = Date.now() - 60 * 60 * 1000;
  const timeseries = Array.from({ length: 10 * 24 }, (_, index) => ({
    time: new Date(start + index * 60 * 60 * 1000).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: 7,
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

async function installForecast(page: Page): Promise<void> {
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildForecast()),
    });
  });
}

async function createContext(browser: Browser, locale: LocaleScenario['locale']): Promise<BrowserContext> {
  return browser.newContext({
    locale,
    viewport: VIEWPORT,
    reducedMotion: 'reduce',
  });
}

async function assertAutomaticOnboardingLanguage(
  context: BrowserContext,
  scenario: LocaleScenario,
): Promise<void> {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', {
    name: scenario.onboardingHeading,
    exact: true,
  }).waitFor({ state: 'visible', timeout: 15_000 });

  const languageState = await page.evaluate(() => ({
    htmlLanguage: document.documentElement.lang,
    persistedOverride: localStorage.getItem('babyora:languageOverride'),
  }));
  assert(
    languageState.htmlLanguage === scenario.resolvedLanguage,
    `${scenario.locale}: expected html lang ${scenario.resolvedLanguage}, got ${languageState.htmlLanguage}`,
  );
  assert(
    languageState.persistedOverride === null,
    `${scenario.locale}: automatic device language was incorrectly persisted as an override`,
  );
  await page.close();
}

async function assertPlanHasOnlyTodayAndTomorrow(
  page: Page,
  scenario: LocaleScenario,
): Promise<void> {
  const mainNav = page.getByRole('navigation', { name: scenario.mainNavigation });
  await mainNav.getByRole('button', { name: scenario.plan, exact: true }).click();

  const planScreen = page.locator('section.planlegg-screen');
  await planScreen.getByRole('heading', {
    name: scenario.plan,
    exact: true,
  }).waitFor({ state: 'visible', timeout: 10_000 });

  const viewGroup = planScreen.getByRole('group', { name: scenario.viewLegend });
  const radios = viewGroup.getByRole('radio');
  await radios.first().waitFor({ state: 'visible', timeout: 10_000 });
  const labels = (await viewGroup.locator('label').allInnerTexts()).map((label) => label.trim());
  assert(
    labels.length === 2,
    `${scenario.locale}: Plan rendered ${labels.length} views (${labels.join(', ')}), expected exactly two`,
  );
  assert(
    labels[0] === scenario.today && labels[1] === scenario.tomorrow,
    `${scenario.locale}: Plan views were ${JSON.stringify(labels)}, expected Today/Tomorrow only`,
  );

  const today = viewGroup.getByRole('radio', { name: scenario.today, exact: true });
  const tomorrow = viewGroup.getByRole('radio', { name: scenario.tomorrow, exact: true });
  assert(await today.isChecked(), `${scenario.locale}: Today was not the default Plan view`);
  await viewGroup.getByText(scenario.tomorrow, { exact: true }).click();
  assert(await tomorrow.isChecked(), `${scenario.locale}: Tomorrow could not be selected`);
}

type ScrollPosition = Readonly<{
  nearestTop: number;
  documentTop: number;
}>;

async function verticalScrollPosition(page: Page): Promise<ScrollPosition> {
  return page.locator('.hjm-journey-rail').evaluate((rail) => {
    let candidate = rail.parentElement;
    while (candidate !== null) {
      const style = getComputedStyle(candidate);
      if (
        /(auto|scroll|overlay)/u.test(style.overflowY)
        && candidate.scrollHeight > candidate.clientHeight + 1
      ) {
        break;
      }
      candidate = candidate.parentElement;
    }
    return {
      nearestTop: candidate?.scrollTop ?? document.scrollingElement?.scrollTop ?? 0,
      documentTop: document.scrollingElement?.scrollTop ?? 0,
    };
  });
}

async function waitForHorizontalMovement(
  page: Page,
  initialLeft: number,
  minimum: number,
): Promise<void> {
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const left = await page.locator('.hjm-journey-rail').evaluate((rail) => rail.scrollLeft);
    if (Math.abs(left - initialLeft) >= minimum) return;
    await page.waitForTimeout(50);
  }
  throw new Error(`Home result rail did not move at least ${minimum}px from its ${initialLeft}px start position`);
}

async function assertLoadedGarmentImages(page: Page, scenario: LocaleScenario): Promise<number> {
  const cards = page.locator('[data-hjm-journey-card="true"]');
  const count = await cards.count();
  assert(count > 1, `${scenario.locale}: result had ${count} garment cards; horizontal QA needs at least two`);

  const overviewImages = page.locator('.hjm-rows .hjm-thumb img');
  assert(
    await overviewImages.count() === count,
    `${scenario.locale}: compact overview and detail rail do not contain the same garments`,
  );

  const overviewPaths = await overviewImages.evaluateAll((images) => images.map((element) => (
    new URL((element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src).pathname
  )));
  const detailPaths = await cards.locator('.hjm-journey-image img').evaluateAll((images) => images.map((element) => (
    new URL((element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src).pathname
  )));
  assert(
    JSON.stringify(overviewPaths) === JSON.stringify(detailPaths),
    `${scenario.locale}: compact/detail garment order differs (${JSON.stringify({ overviewPaths, detailPaths })})`,
  );

  for (let index = 0; index < count; index += 1) {
    const image = overviewImages.nth(index);
    await image.waitFor({ state: 'visible', timeout: 5_000 });
    const state = await image.evaluate((element) => ({
      src: element.currentSrc || element.src,
      complete: element.complete,
      naturalWidth: element.naturalWidth,
    }));
    const pathname = state.src.startsWith('data:') ? state.src : new URL(state.src).pathname;
    assert(
      state.complete && state.naturalWidth >= 64 && /^\/illustrations\/garments\/[^/]+\.webp$/u.test(pathname),
      `${scenario.locale}: compact garment ${index + 1} was missing or generic (${pathname})`,
    );
  }

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    await card.evaluate((element) => {
      element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' });
    });
    const image = card.locator('.hjm-journey-image img');
    await image.waitFor({ state: 'visible', timeout: 5_000 });
    const handle = await image.elementHandle();
    assert(handle !== null, `${scenario.locale}: garment ${index + 1} image element disappeared`);
    await page.waitForFunction(
      (element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
      handle,
      { timeout: 5_000 },
    );

    const imageState = await image.evaluate((element) => ({
      src: element.currentSrc || element.src,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
    }));
    const pathname = imageState.src.startsWith('data:')
      ? imageState.src
      : new URL(imageState.src).pathname;
    assert(
      /^\/illustrations\/garments\/[^/]+\.webp$/u.test(pathname),
      `${scenario.locale}: garment ${index + 1} used a generic/placeholder source: ${pathname}`,
    );
    assert(
      imageState.naturalWidth >= 64 && imageState.naturalHeight >= 64,
      `${scenario.locale}: garment ${index + 1} image was too small or broken (${imageState.naturalWidth}x${imageState.naturalHeight})`,
    );
  }
  return count;
}

async function assertHomeResultCarousel(
  page: Page,
  scenario: LocaleScenario,
): Promise<number> {
  const mainNav = page.getByRole('navigation', { name: scenario.mainNavigation });
  await mainNav.getByRole('button', { name: scenario.home, exact: true }).click();

  const result = page.locator('section.hjm-result[data-scrollable="true"]');
  if (await result.count() === 0) {
    const findButton = page.locator('.hjm-cta[data-cta-path]');
    await findButton.waitFor({ state: 'visible', timeout: 15_000 });
    assert(
      scenario.findOutfit.test((await findButton.innerText()).trim()),
      `${scenario.locale}: Home outfit CTA was not localized`,
    );
    await findButton.click();
  }
  await result.waitFor({ state: 'visible', timeout: 15_000 });

  const avatarSeam = result.locator('[data-result-avatar-seam="true"]');
  await avatarSeam.waitFor({ state: 'visible', timeout: 5_000 });
  const avatar = avatarSeam.locator('img');
  await page.waitForFunction(
    (element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
    await avatar.elementHandle(),
    { timeout: 5_000 },
  );
  const avatarState = await avatar.evaluate((element) => ({
    pathname: new URL(element.currentSrc || element.src).pathname,
    width: element.naturalWidth,
  }));
  assert(
    avatarState.pathname === '/monter/maskot-resultat-sveip.webp' && avatarState.width >= 100,
    `${scenario.locale}: hanging result avatar was missing or broken (${JSON.stringify(avatarState)})`,
  );

  assert(
    await result.getByRole('button', { name: scenario.oldResultCta, exact: true }).count() === 0,
    `${scenario.locale}: removed main result CTA “${scenario.oldResultCta}” is still present`,
  );

  const rail = result.locator('.hjm-journey-rail');
  const overview = result.locator('.hjm-rows');
  await overview.waitFor({ state: 'visible', timeout: 5_000 });
  await result.getByRole('heading', { name: scenario.detailHeading, exact: true })
    .waitFor({ state: 'visible', timeout: 5_000 });
  assert(
    await result.evaluate((element) => {
      const overviewElement = element.querySelector('.hjm-rows');
      const railElement = element.querySelector('.hjm-journey-rail');
      return overviewElement !== null
        && railElement !== null
        && Boolean(overviewElement.compareDocumentPosition(railElement) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
    `${scenario.locale}: compact outfit overview does not come before the detail rail`,
  );

  const cards = result.locator('[data-hjm-journey-card="true"]');
  const cardCount = await cards.count();
  assert(cardCount >= 3, `${scenario.locale}: Mobbin peek QA needs at least three garment cards, got ${cardCount}`);

  const firstCard = cards.first();
  const factDisclosure = firstCard.locator('details.hjm-journey-fact');
  const factSummary = factDisclosure.locator('summary');
  const factContent = factDisclosure.locator('.hjm-journey-fact-content');
  const detailAction = firstCard.locator('button.hjm-journey-detail');
  assert(await factDisclosure.count() === 1, `${scenario.locale}: first card has no native fact disclosure`);
  assert(
    !(await factDisclosure.evaluate((element) => element.hasAttribute('open'))),
    `${scenario.locale}: Good to know is expanded by default`,
  );
  assert(
    (await factSummary.innerText()).trim() === scenario.factSummary,
    `${scenario.locale}: fact summary is not localized as ${scenario.factSummary}`,
  );
  assert(
    (await detailAction.innerText()).trim() === scenario.detailAction,
    `${scenario.locale}: direct detail action is not localized as ${scenario.detailAction}`,
  );
  const compactControls = await Promise.all([factSummary, detailAction].map(async (control) => {
    const box = await control.boundingBox();
    return box?.height ?? 0;
  }));
  assert(
    compactControls.every((height) => height >= 43.5),
    `${scenario.locale}: disclosure/detail controls are smaller than 44px (${JSON.stringify(compactControls)})`,
  );
  const collapsedCardBox = await firstCard.boundingBox();
  assert(
    collapsedCardBox !== null && collapsedCardBox.height < 480,
    `${scenario.locale}: default garment card is not compact (${collapsedCardBox?.height ?? 0}px)`,
  );
  assert(!(await factContent.isVisible()), `${scenario.locale}: closed fact content is still visible`);
  await factSummary.click();
  assert(
    await factDisclosure.evaluate((element) => element.hasAttribute('open')),
    `${scenario.locale}: Good to know did not expand`,
  );
  await factContent.waitFor({ state: 'visible', timeout: 2_000 });
  await factSummary.click();
  assert(
    !(await factDisclosure.evaluate((element) => element.hasAttribute('open'))),
    `${scenario.locale}: Good to know did not collapse again`,
  );

  await detailAction.click();
  const detailSheet = page.locator('dialog.plagg-detail-sheet[open]');
  await detailSheet.waitFor({ state: 'visible', timeout: 5_000 });
  await page.keyboard.press('Escape');
  await detailSheet.waitFor({ state: 'hidden', timeout: 5_000 });

  await rail.scrollIntoViewIfNeeded();
  const railContract = await rail.evaluate((element) => {
    const style = getComputedStyle(element);
    const first = element.children.item(0)?.getBoundingClientRect();
    const second = element.children.item(1)?.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: style.overflowX,
      scrollSnapType: style.scrollSnapType,
      touchAction: style.touchAction,
      firstLeft: first?.left ?? null,
      secondLeft: second?.left ?? null,
      secondRight: second?.right ?? null,
      railLeft: box.left,
      railRight: box.right,
      railCenter: box.left + box.width / 2,
      firstCenter: first === undefined ? null : first.left + first.width / 2,
      firstHeight: first?.height ?? 0,
      stride: first && second ? second.left - first.left : 0,
    };
  });
  assert(
    railContract.scrollWidth > railContract.clientWidth + 40,
    `${scenario.locale}: result rail has no real horizontal overflow`,
  );
  assert(
    railContract.overflowX === 'auto' || railContract.overflowX === 'scroll',
    `${scenario.locale}: result rail overflow-x is ${railContract.overflowX}, expected auto/scroll`,
  );
  assert(
    /x.*mandatory/u.test(railContract.scrollSnapType),
    `${scenario.locale}: result rail scroll-snap-type is ${railContract.scrollSnapType}`,
  );
  assert(
    railContract.touchAction.includes('pan-x') && railContract.touchAction.includes('pan-y'),
    `${scenario.locale}: result rail touch-action is ${railContract.touchAction}; one axis may trap the finger`,
  );
  assert(
    railContract.secondLeft !== null
      && railContract.secondRight !== null
      && railContract.secondLeft < railContract.railRight - 12
      && railContract.secondRight > railContract.railRight + 12,
    `${scenario.locale}: the next garment is not partially visible as a swipe affordance`,
  );
  assert(
    railContract.firstCenter !== null
      && Math.abs(railContract.firstCenter - railContract.railCenter) <= 2,
    `${scenario.locale}: first garment is not centered (${JSON.stringify({
      cardCenter: railContract.firstCenter,
      railCenter: railContract.railCenter,
    })})`,
  );
  assert(
    railContract.firstHeight < 480,
    `${scenario.locale}: collapsed card is ${railContract.firstHeight}px tall; expected under 480px`,
  );

  const progress = result.locator('.hjm-journey-progress .hjm-sr-only');
  const dots = result.locator('.hjm-journey-dots i');
  assert(await result.locator('.hjm-journey-nav-button').count() === 0, `${scenario.locale}: arrow pager is still rendered`);
  assert(await dots.count() === cardCount, `${scenario.locale}: dots do not match the ${cardCount} garment cards`);
  const progressAtFirst = (await progress.innerText()).trim();
  await rail.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    ([selector, initial]) => document.querySelector(selector)?.textContent?.trim() !== initial,
    ['.hjm-journey-progress .hjm-sr-only', progressAtFirst],
    { timeout: 3_000 },
  );
  const centeredPeek = await rail.evaluate((element) => {
    const previous = element.children.item(0)?.getBoundingClientRect();
    const active = element.children.item(1)?.getBoundingClientRect();
    const next = element.children.item(2)?.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return {
      activeCenter: active === undefined ? null : active.left + active.width / 2,
      railCenter: box.left + box.width / 2,
      leftPeek: previous === undefined ? 0 : previous.right - box.left,
      rightPeek: next === undefined ? 0 : box.right - next.left,
    };
  });
  assert(
    centeredPeek.activeCenter !== null
      && Math.abs(centeredPeek.activeCenter - centeredPeek.railCenter) <= 2,
    `${scenario.locale}: keyboard paging did not center garment 2 (${JSON.stringify(centeredPeek)})`,
  );
  assert(
    centeredPeek.leftPeek >= 12
      && centeredPeek.rightPeek >= 12
      && Math.abs(centeredPeek.leftPeek - centeredPeek.rightPeek) <= 3,
    `${scenario.locale}: neighbor peeks are not symmetric (${JSON.stringify(centeredPeek)})`,
  );

  const avatarBox = await avatar.boundingBox();
  const overviewBox = await overview.boundingBox();
  const railBox = await rail.boundingBox();
  assert(
    avatarBox !== null && overviewBox !== null && railBox !== null,
    `${scenario.locale}: avatar/overview/rail geometry was unavailable`,
  );
  assert(
    avatarBox.y < overviewBox.y && avatarBox.y + avatarBox.height > overviewBox.y,
    `${scenario.locale}: avatar does not visibly hang across the compact result seam`,
  );

  const progressBefore = (await progress.innerText()).trim();
  const verticalBefore = await verticalScrollPosition(page);
  const horizontalBefore = await rail.evaluate((element) => element.scrollLeft);
  assert(railBox.width > 0 && railBox.height > 0, `${scenario.locale}: result rail has zero geometry`);
  await page.mouse.move(
    railBox.x + Math.min(railBox.width / 2, railBox.width - 2),
    railBox.y + Math.min(railBox.height / 2, railBox.height - 2),
  );
  await page.mouse.wheel(Math.max(railContract.stride, 180), 0);
  await waitForHorizontalMovement(page, horizontalBefore, Math.max(24, railContract.stride * 0.45));
  await page.waitForTimeout(350);

  const progressAfter = (await progress.innerText()).trim();
  const verticalAfter = await verticalScrollPosition(page);
  assert(
    progressAfter !== progressBefore,
    `${scenario.locale}: native horizontal scroll moved, but active garment progress stayed at ${progressBefore}`,
  );
  assert(
    Math.abs(verticalAfter.nearestTop - verticalBefore.nearestTop) <= 3
      && Math.abs(verticalAfter.documentTop - verticalBefore.documentTop) <= 3,
    `${scenario.locale}: horizontal garment gesture hijacked vertical scroll (${JSON.stringify({ verticalBefore, verticalAfter })})`,
  );

  const garmentCount = await assertLoadedGarmentImages(page, scenario);

  await page.setViewportSize({ width: 320, height: VIEWPORT.height });
  const compactRowsFit = await result.locator('.hjm-row').evaluateAll((rows) => rows.map((row) => {
    const text = row.querySelector('.hjm-row-text')?.getBoundingClientRect();
    const detail = row.querySelector('.hjm-swap')?.getBoundingClientRect();
    return row.scrollWidth <= row.clientWidth + 1
      && text !== undefined
      && detail !== undefined
      && text.right <= detail.left + 1;
  }));
  assert(
    compactRowsFit.length === garmentCount && compactRowsFit.every(Boolean),
    `${scenario.locale}: compact garment rows overlap at 320px (${JSON.stringify(compactRowsFit)})`,
  );

  return garmentCount;
}

async function runScenario(browser: Browser, scenario: LocaleScenario): Promise<void> {
  const context = await createContext(browser, scenario.locale);
  try {
    await assertAutomaticOnboardingLanguage(context, scenario);

    const page = await context.newPage();
    const pageErrors: string[] = [];
    const imageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        imageErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    await installForecast(page);
    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation', { name: scenario.mainNavigation })
      .waitFor({ state: 'visible', timeout: 15_000 });

    assert(
      await page.locator('html').getAttribute('lang') === scenario.resolvedLanguage,
      `${scenario.locale}: demo app did not keep the resolved device language`,
    );
    await assertPlanHasOnlyTodayAndTomorrow(page, scenario);
    const garmentCount = await assertHomeResultCarousel(page, scenario);

    assert(pageErrors.length === 0, `${scenario.locale}: page errors:\n${pageErrors.join('\n')}`);
    assert(imageErrors.length === 0, `${scenario.locale}: image HTTP errors:\n${imageErrors.join('\n')}`);
    console.log(
      `QA OK ${scenario.locale} -> ${scenario.resolvedLanguage}: onboarding, Plan 2/2, carousel, ${garmentCount} garment images`,
    );
    await page.close();
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  try {
    server = spawn(
      process.execPath,
      [VITE_CLI, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
      { stdio: 'ignore', shell: false, windowsHide: true },
    );
    await waitForServer(BASE, server);
    browser = await chromium.launch();

    for (const scenario of SCENARIOS) {
      await runScenario(browser, scenario);
    }
    console.log('LOCALIZATION/CAROUSEL PASS: 3/3 locale scenarios green');
  } finally {
    try {
      await browser?.close();
    } finally {
      if (server !== null) await stopServer(server);
    }
  }
}

main().catch((error: unknown) => {
  console.error(`LOCALIZATION/CAROUSEL FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
