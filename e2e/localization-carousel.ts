/**
 * Focused browser QA for the region-language policy and the Home vertical result list.
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
  type Route,
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
  goodToKnow: string;
  alternatives: string;
  removedWhyToday: string;
  removedExploreHeading: string;
  removedSwipeHint: string;
  removedWhyFooter: string;
  openGarment: RegExp;
  detailOrder: RegExp;
  closeGarmentDetails: RegExp;
  situationSheetTitle: string;
  closeSituation: RegExp;
}>;

const SCENARIOS: readonly LocaleScenario[] = [
  {
    locale: 'sv-SE',
    resolvedLanguage: 'sv',
    goodToKnow: 'Bra att veta',
    alternatives: 'Alternativ',
    removedWhyToday: 'Varför i dag',
    removedExploreHeading: 'Se varje plagg',
    removedSwipeHint: 'Svep åt sidan, från innersta till yttersta lagret.',
    removedWhyFooter: 'Varför just de här kläderna?',
    onboardingHeading: 'Vem klär vi på?',
    mainNavigation: 'Huvudnavigering',
    home: 'Hem',
    plan: 'Planera',
    viewLegend: 'Välj planvy',
    today: 'I dag',
    tomorrow: 'I morgon',
    findOutfit: /^(Hitta|Visa) dagens kläder$/u,
    oldResultCta: 'Klä på steg för steg',
    openGarment: /^Visa .+/u,
    detailOrder: /^Plagg 1 av \d+ .* Innerlager$/u,
    closeGarmentDetails: /^St.ng plaggdetaljer$/u,
    situationSheetTitle: 'Vart ska ni?',
    closeSituation: /^St.ng situationsval$/u,
  },
  {
    locale: 'da-DK',
    resolvedLanguage: 'da',
    goodToKnow: 'Godt at vide',
    alternatives: 'Alternativer',
    removedWhyToday: 'Hvorfor i dag',
    removedExploreHeading: 'Se hvert stykke tøj',
    removedSwipeHint: 'Stryg til siden, fra det inderste til det yderste lag.',
    removedWhyFooter: 'Hvorfor netop dette tøj?',
    onboardingHeading: 'Hvem klæder vi på?',
    mainNavigation: 'Hovednavigation',
    home: 'Hjem',
    plan: 'Planlæg',
    viewLegend: 'Vælg planvisning',
    today: 'I dag',
    tomorrow: 'I morgen',
    findOutfit: /^(Find|Vis) dagens tøj$/u,
    oldResultCta: 'Giv tøjet på trin for trin',
    openGarment: /^Vis .+/u,
    detailOrder: /^Del 1 af \d+ .* Inderste lag$/u,
    closeGarmentDetails: /^Luk t.jdetaljer$/u,
    situationSheetTitle: 'Hvor skal I hen?',
    closeSituation: /^Luk situationsvalg$/u,
  },
  {
    locale: 'nb-NO',
    resolvedLanguage: 'en',
    goodToKnow: 'Good to know',
    alternatives: 'Alternatives',
    removedWhyToday: 'Why today',
    removedExploreHeading: 'Explore each garment',
    removedSwipeHint: 'Swipe sideways, from the base layer to the outer layer.',
    removedWhyFooter: 'Why this outfit?',
    onboardingHeading: 'Who are we dressing?',
    mainNavigation: 'Main navigation',
    home: 'Home',
    plan: 'Plan',
    viewLegend: 'Choose planning view',
    today: 'Today',
    tomorrow: 'Tomorrow',
    findOutfit: /^(Find|Show) today’s outfit$/u,
    oldResultCta: 'Dress step by step',
    openGarment: /^Show .+/u,
    detailOrder: /^Garment 1 of \d+ .* Base layer$/u,
    closeGarmentDetails: /^Close garment details$/u,
    situationSheetTitle: 'Where are you going?',
    closeSituation: /^Close situation picker$/u,
  },
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function assertNoViteErrorOverlay(page: Page, locale: string): Promise<void> {
  const overlay = page.locator('vite-error-overlay');
  if (await overlay.count() === 0) return;
  const message = await overlay.evaluate((element) => element.shadowRoot?.textContent?.trim() ?? 'unknown Vite error');
  throw new Error(`${locale}: Vite runtime overlay:\n${message}`);
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
  const fulfillForecast = async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildForecast()),
    });
  };
  await page.route('**/api/forecast?**', fulfillForecast);
  // Vite's development fallback can append the source extension before the
  // request reaches the route layer. Intercept both forms so browser QA is
  // never coupled to the Vercel edge-function parser.
  await page.route('**/api/forecast.ts?**', fulfillForecast);
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

async function assertLoadedGarmentImages(
  page: Page,
  list: ReturnType<Page['locator']>,
  scenario: LocaleScenario,
): Promise<number> {
  const images = list.locator('.hjm-thumb img');
  const count = await images.count();
  assert(count > 1, scenario.locale + ': expected at least two garment images, got ' + count);

  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    await image.waitFor({ state: 'visible', timeout: 5_000 });
    const handle = await image.elementHandle();
    assert(handle !== null, scenario.locale + ': garment image ' + (index + 1) + ' disappeared');
    await page.waitForFunction(
      (element) => element instanceof HTMLImageElement
        && element.complete
        && element.naturalWidth > 0
        && element.naturalHeight > 0,
      handle,
      { timeout: 5_000 },
    );

    const state = await image.evaluate((element) => ({
      src: element.currentSrc || element.src,
      width: element.naturalWidth,
      height: element.naturalHeight,
    }));
    const pathname = state.src.startsWith('data:') ? state.src : new URL(state.src).pathname;
    assert(
      /^\/illustrations\/garments\/[^/]+\.webp$/u.test(pathname),
      scenario.locale + ': garment ' + (index + 1) + ' used a generic source: ' + pathname,
    );
    assert(
      state.width >= 64 && state.height >= 64,
      scenario.locale + ': garment ' + (index + 1) + ' image was too small or broken ('
        + state.width + 'x' + state.height + ')',
    );
  }
  return count;
}

async function assertHomeResultList(
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
      scenario.locale + ': Home outfit CTA was not localized',
    );
    await findButton.click();
  }
  await result.waitFor({ state: 'visible', timeout: 15_000 });

  const strip = page.locator('section.hjm-strip');
  assert(await strip.count() === 1, scenario.locale + ': expected one weather information panel');
  assert(
    await page.locator('button.hjm-strip').count() === 0,
    scenario.locale + ': the whole weather panel is still an oversized button',
  );
  assert(
    (await strip.getAttribute('aria-label'))?.trim().length,
    scenario.locale + ': weather panel lost its localized accessible name',
  );

  const situationButton = strip.locator('button.hjm-strip__situation');
  assert(
    await situationButton.count() === 1,
    scenario.locale + ': weather panel must expose exactly one situation selector',
  );
  assert(
    (await situationButton.getAttribute('aria-label'))?.trim().length,
    scenario.locale + ': situation selector lost its localized accessible name',
  );
  assert(
    await situationButton.getAttribute('aria-haspopup') === 'dialog',
    scenario.locale + ': situation selector does not advertise its dialog',
  );
  const situationGeometry = await situationButton.evaluate((button) => {
    const panel = button.closest('.hjm-strip')?.getBoundingClientRect();
    const selected = button.querySelector('strong')?.getBoundingClientRect();
    const caret = button.querySelector('svg:last-child')?.getBoundingClientRect();
    const target = button.getBoundingClientRect();
    return {
      targetHeight: target.height,
      rightReserve: panel ? panel.right - target.right : -1,
      selectedToCaret: selected && caret ? caret.left - selected.right : -1,
    };
  });
  assert(
    situationGeometry.targetHeight >= 43.5,
    scenario.locale + ': situation selector is smaller than 44px',
  );
  assert(
    situationGeometry.rightReserve >= 48,
    scenario.locale + ': situation selector enters the avatar safety zone ('
      + situationGeometry.rightReserve + 'px reserve)',
  );
  assert(
    situationGeometry.selectedToCaret >= 0 && situationGeometry.selectedToCaret <= 16,
    scenario.locale + ': selector caret is detached from its value ('
      + situationGeometry.selectedToCaret + 'px)',
  );

  await situationButton.click();
  const situationSheet = page.locator('dialog.hcs-sheet[data-home-situation-sheet][open]');
  await situationSheet.waitFor({ state: 'visible', timeout: 5_000 });
  assert(
    await situationSheet.getByRole('heading', { name: scenario.situationSheetTitle, exact: true }).count() === 1,
    scenario.locale + ': situation sheet heading was not localized',
  );
  assert(
    await situationSheet.locator('[role="radio"]').count() === 3
      && await situationSheet.locator('[role="switch"]').count() === 1,
    scenario.locale + ': situation sheet lost its activity or car-seat controls',
  );
  await page.keyboard.press('Escape');
  await situationSheet.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForFunction(
    () => document.querySelector('button.hjm-strip__situation') === document.activeElement,
    undefined,
    { timeout: 3_000 },
  );
  await situationButton.press('Enter');
  await situationSheet.waitFor({ state: 'visible', timeout: 5_000 });
  assert(
    await situationSheet.getByRole('button', { name: scenario.closeSituation }).count() === 1,
    scenario.locale + ': situation sheet close control was not localized',
  );
  await page.keyboard.press('Escape');
  await situationSheet.waitFor({ state: 'hidden', timeout: 5_000 });

  const initialSituationValue = (await situationButton.locator('strong').innerText()).trim();
  await situationButton.click();
  await situationSheet.waitFor({ state: 'visible', timeout: 5_000 });
  await situationSheet.locator('[role="radio"][aria-checked="false"]').first().click();
  await situationSheet.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForFunction(
    (previousValue) => {
      const value = document.querySelector('button.hjm-strip__situation strong')?.textContent?.trim();
      return value !== undefined && value !== previousValue && !document.querySelector('dialog.hcs-sheet[open]');
    },
    initialSituationValue,
    { timeout: 5_000 },
  );

  const weatherIcon = strip.locator('.hjm-s-weather img');
  await weatherIcon.waitFor({ state: 'visible', timeout: 5_000 });
  const weatherIconState = await weatherIcon.evaluate((element) => ({
    pathname: new URL(element.currentSrc || element.src).pathname,
    complete: element.complete,
    naturalWidth: element.naturalWidth,
  }));
  assert(
    weatherIconState.complete
      && weatherIconState.naturalWidth > 0
      && /^\/monter\/vaer-[^/]+\.webp$/u.test(weatherIconState.pathname),
    scenario.locale + ': result weather icon was missing or generic ('
      + JSON.stringify(weatherIconState) + ')',
  );

  const avatarSeam = page.locator('.hjm-result-seam [data-result-avatar-seam="true"]');
  await avatarSeam.waitFor({ state: 'visible', timeout: 5_000 });
  const avatar = avatarSeam.locator('img');
  const avatarHandle = await avatar.elementHandle();
  assert(avatarHandle !== null, scenario.locale + ': result avatar disappeared');
  await page.waitForFunction(
    (element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
    avatarHandle,
    { timeout: 5_000 },
  );
  const avatarState = await avatar.evaluate((element) => ({
    pathname: new URL(element.currentSrc || element.src).pathname,
    width: element.naturalWidth,
  }));
  assert(
    avatarState.pathname === '/monter/maskot-resultat-sveip.webp' && avatarState.width >= 100,
    scenario.locale + ': hanging result avatar was missing or broken ('
      + JSON.stringify(avatarState) + ')',
  );

  assert(
    await result.getByRole('button', { name: scenario.oldResultCta, exact: true }).count() === 0,
    scenario.locale + ': removed main result CTA is still present',
  );
  assert(
    await result.locator(
      '.hjm-journey-rail, [data-hjm-overview-card], [data-hjm-journey-card], '
        + '.hjm-journey-progress, .hjm-journey-dots, [data-carousel-disclosure]',
    ).count() === 0,
    scenario.locale + ': retired horizontal carousel markup is still rendered',
  );
  assert(
    await result.getByText(scenario.removedExploreHeading, { exact: true }).count() === 0
      && await result.getByText(scenario.removedSwipeHint, { exact: true }).count() === 0
      && await result.getByText(scenario.removedWhyToday, { exact: true }).count() === 0
      && await result.getByRole('button', { name: scenario.removedWhyFooter, exact: true }).count() === 0,
    scenario.locale + ': retired carousel guidance or Why-today content is still visible',
  );

  const list = result.locator('ol.hjm-result-list[data-garment-count]');
  await list.waitFor({ state: 'visible', timeout: 5_000 });
  const rowItems = list.locator(':scope > li.hjm-row-item');
  const rowButtons = rowItems.locator(':scope > button.hjm-row');
  const rowCount = await rowButtons.count();
  assert(rowCount > 1, scenario.locale + ': vertical result list rendered ' + rowCount + ' rows');
  assert(
    Number(await list.getAttribute('data-garment-count')) === rowCount,
    scenario.locale + ': list count metadata does not match rendered rows',
  );
  assert(
    await rowItems.count() === rowCount,
    scenario.locale + ': each garment must be represented by one semantic list item',
  );

  const positions = (await rowItems.locator('.hjm-num').allInnerTexts()).map((value) => Number(value.trim()));
  const expectedPositions = Array.from({ length: rowCount }, (_, index) => index + 1);
  assert(
    JSON.stringify(positions) === JSON.stringify(expectedPositions),
    scenario.locale + ': dressing order was ' + JSON.stringify(positions)
      + ', expected ' + JSON.stringify(expectedPositions),
  );

  const labels = (await rowItems.locator('.hjm-g-name').allInnerTexts()).map((value) => value.trim());
  const roles = (await rowItems.locator('.hjm-g-role').allInnerTexts()).map((value) => value.trim());
  const ariaLabels = await rowButtons.evaluateAll((buttons) => buttons.map(
    (button) => button.getAttribute('aria-label') ?? '',
  ));
  assert(
    labels.length === rowCount && labels.every((label) => label.length > 0),
    scenario.locale + ': a garment row has no localized name',
  );
  assert(
    roles.length === rowCount && roles.every((role) => role.length > 0),
    scenario.locale + ': a garment row has no localized role',
  );
  assert(
    ariaLabels.every((label) => scenario.openGarment.test(label)),
    scenario.locale + ': garment row destinations were not localized ('
      + JSON.stringify(ariaLabels) + ')',
  );

  const listContract = await list.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    rowHeights: Array.from(element.querySelectorAll<HTMLElement>('button.hjm-row'))
      .map((row) => row.getBoundingClientRect().height),
  }));
  assert(
    listContract.scrollWidth <= listContract.clientWidth + 1,
    scenario.locale + ': vertical garment list has horizontal overflow',
  );
  assert(
    listContract.rowHeights.every((height) => height >= 43.5),
    scenario.locale + ': a garment row is smaller than 44px ('
      + JSON.stringify(listContract.rowHeights) + ')',
  );

  const garmentCount = await assertLoadedGarmentImages(page, list, scenario);
  assert(garmentCount === rowCount, scenario.locale + ': a garment row has no loaded image');

  const avatarBox = await avatar.boundingBox();
  const listBox = await list.boundingBox();
  assert(
    avatarBox !== null && listBox !== null
      && avatarBox.y < listBox.y
      && avatarBox.y + avatarBox.height > listBox.y,
    scenario.locale + ': avatar no longer hangs across the garment-list edge',
  );

  const firstRow = rowButtons.first();
  const firstName = labels[0];
  await firstRow.click();

  const sheet = page.locator('dialog.hgd-sheet[data-garment-detail-sheet][open]');
  await sheet.waitFor({ state: 'visible', timeout: 5_000 });
  assert(
    await sheet.getByRole('heading', { name: firstName, exact: true }).count() === 1,
    scenario.locale + ': garment sheet title does not match the activated row',
  );
  assert(
    scenario.detailOrder.test((await sheet.locator('.hgd-sheet__header > div > p').innerText()).trim()),
    scenario.locale + ': sheet order/role was not localized',
  );
  assert(
    await sheet.getByRole('heading', { name: scenario.goodToKnow, exact: true }).count() === 1,
    scenario.locale + ': sheet is missing its localized Good-to-know heading',
  );
  assert(
    (await sheet.locator('.hgd-sheet__fact > p').innerText()).trim().length > 0,
    scenario.locale + ': garment fact is empty',
  );
  const source = sheet.locator('.hgd-sheet__fact > a');
  assert(
    await source.count() === 1
      && (await source.getAttribute('href'))?.startsWith('http') === true
      && (await source.getAttribute('target')) === '_blank',
    scenario.locale + ': garment fact source link is missing or unsafe',
  );

  const sheetBox = await sheet.boundingBox();
  assert(
    sheetBox !== null && VIEWPORT.height - (sheetBox.y + sheetBox.height) <= 18,
    scenario.locale + ': garment detail is not anchored as a bottom sheet',
  );

  const alternativeButton = sheet.locator('button.hgd-sheet__alternatives');
  if (await alternativeButton.count() > 0) {
    assert(
      (await alternativeButton.innerText()).trim() === scenario.alternatives,
      scenario.locale + ': Alternatives action was not localized',
    );
    assert(
      await alternativeButton.getAttribute('aria-expanded') === 'false',
      scenario.locale + ': Alternatives disclosure did not start collapsed',
    );
    await alternativeButton.click();
    assert(
      await alternativeButton.getAttribute('aria-expanded') === 'true'
        && await sheet.locator('#hgd-alternative-comparison').count() === 1,
      scenario.locale + ': Alternatives disclosure did not reveal its comparison',
    );
  }

  const closeButton = sheet.getByRole('button', { name: scenario.closeGarmentDetails });
  assert(
    await closeButton.count() === 1,
    scenario.locale + ': sheet close control was not localized',
  );
  await closeButton.click();
  await sheet.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.locator('dialog.hgd-sheet[data-garment-detail-sheet]')
    .waitFor({ state: 'detached', timeout: 5_000 });
  await page.waitForFunction(
    () => document.querySelector('ol.hjm-result-list button.hjm-row') === document.activeElement,
    undefined,
    { timeout: 3_000 },
  );

  await firstRow.press('Enter');
  await page.locator('dialog.hgd-sheet[data-garment-detail-sheet][open]')
    .waitFor({ state: 'visible', timeout: 5_000 });
  await page.keyboard.press('Escape');
  await page.locator('dialog.hgd-sheet[data-garment-detail-sheet][open]')
    .waitFor({ state: 'hidden', timeout: 5_000 });
  await page.locator('dialog.hgd-sheet[data-garment-detail-sheet]')
    .waitFor({ state: 'detached', timeout: 5_000 });
  await page.waitForFunction(
    () => document.querySelector('ol.hjm-result-list button.hjm-row') === document.activeElement,
    undefined,
    { timeout: 3_000 },
  );

  await page.setViewportSize({ width: 320, height: VIEWPORT.height });
  const compactRowsFit = await list.locator('.hjm-row').evaluateAll((rows) => rows.map((row) => {
    const text = row.querySelector('.hjm-row-text')?.getBoundingClientRect();
    const destination = row.querySelector('.hjm-row-next')?.getBoundingClientRect();
    return row.scrollWidth <= row.clientWidth + 1
      && row.getBoundingClientRect().height >= 43.5
      && text !== undefined
      && destination !== undefined
      && text.right <= destination.left + 1;
  }));
  assert(
    compactRowsFit.length === garmentCount && compactRowsFit.every(Boolean),
    scenario.locale + ': vertical garment rows overlap at 320px ('
      + JSON.stringify(compactRowsFit) + ')',
  );
  const pageWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(
    pageWidth.scroll <= pageWidth.client + 1,
    scenario.locale + ': Home creates horizontal page scrolling at 320px ('
      + JSON.stringify(pageWidth) + ')',
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
    await assertNoViteErrorOverlay(page, scenario.locale);
    await assertPlanHasOnlyTodayAndTomorrow(page, scenario);
    const garmentCount = await assertHomeResultList(page, scenario);

    assert(pageErrors.length === 0, `${scenario.locale}: page errors:\n${pageErrors.join('\n')}`);
    assert(imageErrors.length === 0, `${scenario.locale}: image HTTP errors:\n${imageErrors.join('\n')}`);
    console.log(
      `QA OK ${scenario.locale} -> ${scenario.resolvedLanguage}: onboarding, Plan 2/2, vertical Home list, sheet, ${garmentCount} garment images`,
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

    const localeFilter = process.env.LOCALIZATION_LOCALE;
    const scenarios = localeFilter
      ? SCENARIOS.filter((scenario) => scenario.locale === localeFilter)
      : SCENARIOS;
    assert(scenarios.length > 0, 'No locale scenario matched ' + localeFilter);
    for (const scenario of scenarios) {
      await runScenario(browser, scenario);
    }
    console.log(
      'LOCALIZATION/HOME-LIST PASS: ' + scenarios.length + '/' + scenarios.length
        + ' locale scenarios green',
    );
  } finally {
    try {
      await browser?.close();
    } finally {
      if (server !== null) await stopServer(server);
    }
  }
}

main().catch((error: unknown) => {
  console.error(
    `LOCALIZATION/HOME-LIST FAIL: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
