/**
 * R7/Task 8 → P2 hard paywall (PRODUCT.md, 2026-07-31) — E2E kjøpsflyt-
 * verifisering (dev/web-mock, uten fysisk enhet).
 *
 * Verifiserer RevenueCat-flyten så langt den KAN verifiseres uten StoreKit:
 * PaywallDialog sin web/dev-mock simulerer kjøp når appen ikke er native.
 *
 * P2 innførte et HARD paywall: hele appen krever et aktivt Premium-
 * entitlement etter at onboarding er fullført OG den første reelle
 * anbefalingen er vist én gang (AppPaywallGate, mountet i App.tsx). Det
 * finnes ikke lenger noen kontekstuell paywall å klikke seg til fra
 * Innstillinger/Uke — testene her driver derfor kjøpsflyten DIREKTE via den
 * automatisk viste, ikke-avviselige gaten.
 *
 * P9 (duel §8 — paywall-armering, docs/design-notes/sol-duel-2026-07-31.md):
 * gaten vises IKKE lenger automatisk i SAMME økt som brukerens første
 * anbefaling — hun får lese den ferdig. Først NESTE app-økt (her: en
 * `page.reload()`, se waitForAutoShownGate under) viser veggen direkte.
 *
 * Testhåndtak (dokumentert i src/state/subscription-store.ts):
 *   ?seed=demo                    → demo-barn + MOCK PREMIUM (smoke/audit-
 *                                    kompatibel — AppPaywallGate slår aldri
 *                                    inn, se scenario «familie-manage»).
 *   ?seed=demo&entitlement=none   → demo-barn + IKKE-abonnerende bruker.
 *                                    Demo-barna hopper over onboarding, og
 *                                    Hjem viser sin første anbefaling nesten
 *                                    umiddelbart (økt 1 — fritt lesevindu,
 *                                    ingen gate ennå) → en reload (økt 2)
 *                                    viser AppPaywallGate sin ikke-avviselige
 *                                    paywall automatisk, uten noen ekstra klikk.
 *
 * Scenarioer (isolerte browser-kontekster — egen localStorage hver):
 *   1. gate-yearly   — gaten vises automatisk økt 2, ikke-avviselig (ingen
 *                       lukk-knapp, ESC/backdrop lukker IKKE). Betalingsvegg
 *                       v2 (§8): ingen forhåndsvalgt plan lenger — velger
 *                       Årlig aktivt, deretter kjøp → «aktivert (testmodus)»
 *                       → gaten lukker seg selv når kjøpet går gjennom.
 *   2. gate-monthly  — samme gate, velger Månedlig aktivt → kjøp → aktivert.
 *   3. gate-restore  — samme gate → «Gjenopprett kjøp» uten tidligere kjøp
 *                       → dev-only-melding, gaten forblir åpen (ingen krasj,
 *                       ingen falsk fremgang).
 *   4. familie-manage — ?seed=demo (default mock-abonnent) → AppPaywallGate
 *                       vises ALDRI → Familie-raden viser «Babyora Pluss
 *                       aktiv» og «Administrer abonnement» åpner
 *                       plattformens abonnements-URL i stedet for en
 *                       paywall (isPremium=true-grenen i
 *                       handlePremiumCtaClick).
 *
 * IKKE dekket (krever enhet/App Store Connect/sandbox): ekte StoreKit-kjøp,
 * kvitteringsvalidering, restore mot ekte Apple-ID, trial→belastning. Se
 * docs/APP-STORE-IAP-SETUP.md for eier-stegene.
 *
 * Kjøres med `npm run e2e:purchase` ETTER `npm run build`. Feil = exit 1.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';

const PORT = 4174;
const BASE = `http://localhost:${PORT}`;

function fail(msg: string): never {
  console.error(`PURCHASE FAIL: ${msg}`);
  process.exit(1);
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* ikke oppe ennå */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
}

async function clickByName(page: Page, pattern: RegExp, label: string): Promise<void> {
  try {
    await page.getByRole('button', { name: pattern }).first().click({ timeout: 10_000 });
  } catch {
    fail(`fant ikke klikkbar «${label}» (${pattern})`);
  }
}

async function expectVisible(page: Page, rx: RegExp, whatFailed: string): Promise<void> {
  try {
    await page.locator(`text=${rx.toString()}`).first().waitFor({ state: 'visible', timeout: 8_000 });
  } catch {
    fail(whatFailed);
  }
}

/** Record window.open(...) calls into a page-local array instead of letting
 *  Chromium actually try to open a popup — robust, no extra-page plumbing. */
async function installWindowOpenSpy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __openedUrls: string[] }).__openedUrls = [];
    const native = window.open.bind(window);
    window.open = (...args: Parameters<typeof window.open>) => {
      (window as unknown as { __openedUrls: string[] }).__openedUrls.push(String(args[0] ?? ''));
      return native(...args);
    };
  });
}

async function readOpenedUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __openedUrls?: string[] }).__openedUrls ?? []);
}

/**
 * `vite preview` doesn't serve `/api/forecast` (it's a serverless function —
 * see smoke.ts's own comment on this). Hjem only computes+shows a
 * recommendation once `useWeather` resolves real weather, and P2's
 * firstRecommendationSeenAt (which drives the auto-shown gate) is only set
 * once that recommendation is actually displayed — so every scenario here
 * needs a deterministic, always-successful forecast fixture, mirroring the
 * met.no LocationForecast shape (see e2e/planlegg.ts's own buildForecast for
 * the fuller version this is trimmed from).
 */
function buildFixedForecast(): unknown {
  // `updated_at` must be recent — the client marks a forecast "stale" (and
  // therefore never extracts `now`/status:'ready') once it's older than
  // MAX_SOURCE_AGE_MS (6h, src/lib/met-no/client.ts). The timeseries itself
  // starts a bit before "now" so extractNow() always finds a covering point.
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

async function installFixedForecastRoute(page: Page): Promise<void> {
  await page.route('**/api/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildFixedForecast()),
    });
  });
}

/**
 * ?seed=demo&entitlement=none → onboarding hoppes over (demo-barn) og Hjem
 * viser sin første anbefaling nesten umiddelbart (fast værfixture over),
 * som setter firstRecommendationSeenAt.
 *
 * P9 (duel §8 — paywall-armering, sol-duel-2026-07-31.md): AppPaywallGate
 * viser seg IKKE lenger automatisk i SAMME økt som den første anbefalingen
 * — brukeren får lese den ferdig («les ferdig»-vinduet,
 * subscription-store.ts sin recommendationGraceWindowActive). Først NESTE
 * app-økt (her: en `page.reload()` — samme localStorage/query-streng, fersk
 * modul-boot, samme prinsipp som en reell kald app-åpning) viser veggen
 * direkte, uten noe klikk. Denne hjelperen bekrefter BEGGE halvdelene:
 * ingen gate i økt 1 (fritt lesevindu), gate synlig i økt 2.
 */
async function waitForAutoShownGate(page: Page): Promise<void> {
  await installFixedForecastRoute(page);
  const url = `${BASE}/?seed=demo&entitlement=none`;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 15_000 });
  // La weather-ready-renderet (og dermed markFirstRecommendationSeen-
  // effekten) rekke å kjøre ferdig før vi sjekker at gaten IKKE dukket opp.
  await page.waitForTimeout(500);
  if (await page.getByRole('dialog').count() > 0 && await page.getByRole('dialog').isVisible()) {
    fail('paywall-armering (duel §8): gaten viste seg automatisk i SAMME økt som brukerens første anbefaling — hun skal få lese den ferdig først, gaten skal først vise seg NESTE app-økt');
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15_000 });
}

async function assertGateIsNonDismissable(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  if (await page.getByRole('button', { name: 'Lukk' }).count() > 0) {
    fail('ikke-avviselig gate rendret en lukk-knapp — dismissable=false er ikke wired');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (!(await dialog.isVisible())) {
    fail('ikke-avviselig gate lukket seg via ESC — dismissable=false er ikke håndhevet');
  }
  // Klikk et hjørne av viewporten — native <dialog> sin ::backdrop registrerer
  // klikket som target === dialogen selv (ikke et av dets barn).
  await page.mouse.click(4, 4);
  await page.waitForTimeout(200);
  if (!(await dialog.isVisible())) {
    fail('ikke-avviselig gate lukket seg via backdrop-klikk — dismissable=false er ikke håndhevet');
  }
}

async function scenarioGatePurchase(browser: Browser, plan: 'yearly' | 'monthly'): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await waitForAutoShownGate(page);
  await assertGateIsNonDismissable(page);

  // Betalingsvegg v2 (P10/JOB2, §8): INGEN forhåndsvalgt plan lenger — et
  // aktivt valg kreves for BEGGE scenarioene (også årlig, som tidligere var
  // default-forhåndsvalgt). CTA-en hviler («Velg en plan for å starte
  // gratis») til raden er valgt, deretter armeres den med plan+pris
  // («Start gratis – deretter …»).
  const planLabelText = plan === 'monthly' ? 'Månedlig' : 'Årlig';
  try {
    await page.locator('label.pw-plan-label').filter({ hasText: planLabelText }).first().click({ timeout: 6_000 });
  } catch {
    fail(`kunne ikke velge ${planLabelText}-planen i den ikke-avviselige gaten (v2: ingen forhåndsvalgt plan)`);
  }
  await clickByName(page, /Start gratis –/, `armert kjøps-CTA (${planLabelText} valgt)`);
  await expectVisible(page, /aktivert \(testmodus\)/i, `${plan}: kjøps-status «aktivert (testmodus)» dukket aldri opp i gaten`);
  console.log(`PURCHASE OK: gate-${plan} — kjøp simulert via den automatisk viste gaten, Premium aktivert`);

  // Gaten skal lukke seg selv (PaywallDialog sin egen suksess-animasjon) når
  // kjøpet har gått gjennom — appen bak (bunn-nav «Hjem») blir da nåbar.
  try {
    await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 6_000 });
  } catch {
    fail(`${plan}: gaten forble synlig etter vellykket kjøp — den skal lukke seg selv`);
  }
  await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 10_000 });
  console.log(`PURCHASE OK: gate-${plan} — gaten lukket seg selv, appen er igjen tilgjengelig`);

  const fatal = errors.filter((e) => !/met\.no|forecast|Failed to fetch|NetworkError/i.test(e));
  if (fatal.length) fail(`gate-${plan}: uncaught errors:\n  ${fatal.join('\n  ')}`);
  await ctx.close();
}

async function scenarioGateRestoreEmpty(browser: Browser): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await waitForAutoShownGate(page);
  await assertGateIsNonDismissable(page);

  await clickByName(page, /Gjenopprett kjøp/i, 'gjenopprett-knapp i gaten');
  await expectVisible(page, /Gjenoppretting fungerer først/i, 'gate-restore: dev-only-melding uteble');
  // Ingen falsk fremgang: gaten skal IKKE ha lukket seg — det finnes fortsatt
  // ikke noe aktivt kjøp.
  if (!(await page.getByRole('dialog').isVisible())) {
    fail('gate-restore: gaten forsvant etter en mislykket gjenoppretting — kun vellykket kjøp/gjenoppretting skal avansere');
  }
  console.log('PURCHASE OK: gate-restore — restore uten kjøp gir dev-only-melding, gaten forblir åpen (ingen krasj, ingen falsk fremgang)');
  await ctx.close();
}

/** ?seed=demo (uten entitlement-overstyring) → mock-abonnent som standard —
 *  AppPaywallGate skal ALDRI vises, og Familie-raden skal tilby «administrer
 *  abonnement» (ikke en paywall). Dekker «smoke/audit-flyter forblir grønne»
 *  fra oppgavebeskrivelsen. */
async function scenarioFamilieManageWhenPremium(browser: Browser): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await installWindowOpenSpy(page);

  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 15_000 });

  if (await page.getByRole('dialog').count() > 0 && await page.getByRole('dialog').isVisible()) {
    fail('familie-manage: AppPaywallGate viste seg for en ?seed=demo mock-abonnent — default demo-entitlement er ikke wired');
  }

  await clickByName(page, /Familie|Innst/i, 'Familie-fane');
  await expectVisible(page, /Babyora Pluss aktiv/i, 'familie-manage: premium-raden viste ikke «Babyora Pluss aktiv»');
  await clickByName(page, /Babyora Pluss aktiv|administrer abonnement/i, 'administrer abonnement-raden');
  await page.waitForTimeout(300);

  if (await page.getByRole('dialog').count() > 0 && await page.getByRole('dialog').isVisible()) {
    fail('familie-manage: klikk på en allerede-aktiv Premium-rad åpnet en paywall i stedet for abonnementsadministrasjon');
  }
  const opened = await readOpenedUrls(page);
  if (!opened.some((url) => /apple\.com\/account\/subscriptions|play\.google\.com\/store\/account\/subscriptions/i.test(url))) {
    fail(`familie-manage: forventet at «administrer abonnement» åpnet en butikk-URL, fikk: ${JSON.stringify(opened)}`);
  }
  console.log('PURCHASE OK: familie-manage — mock-abonnent unngår gaten og «administrer abonnement» åpner butikk-URL');
  await ctx.close();
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  try {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    await waitForServer(BASE);
    browser = await chromium.launch();

    await scenarioGatePurchase(browser, 'yearly');
    await scenarioGatePurchase(browser, 'monthly');
    await scenarioGateRestoreEmpty(browser);
    await scenarioFamilieManageWhenPremium(browser);

    console.log('PURCHASE PASS: 4/4 kjøpsflyt-scenarioer grønne (dev-mock, uten enhet)');
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
