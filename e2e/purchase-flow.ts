/**
 * R7/Task 8 (2026-07-15) — E2E kjøpsflyt-test (dev/web-mock).
 *
 * Verifiserer RevenueCat-kjøpsflyten så langt den KAN verifiseres uten en
 * fysisk enhet: PaywallDialog sin web/dev-mock simulerer et vellykket kjøp
 * når appen ikke kjører på native (isRevenueCatConfigured() ||
 * !Capacitor.isNativePlatform()). Flyten som dekkes:
 *   1. ?seed=demo → app-skall (ikke-Premium).
 *   2. Familie-rot → «oppgrader»-rad → PaywallDialog åpnes.
 *   3. Standardplan (årlig) forhåndsvalgt → trykk CTA.
 *   4. Status «aktivert (testmodus)» vises → setPremium(true) er wiret.
 *   5. Etter auto-lukk: abonnementsraden viser «Babyora Pluss aktiv»
 *      (entitlement-gating reagerer på den nye tilstanden).
 *
 * Det som IKKE dekkes her (krever enhet/sandbox): ekte StoreKit-kjøp,
 * kvitteringsvalidering, restorePurchases mot ekte Apple-ID, trial→belastning.
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
      // ikke oppe ennå
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
}

async function clickByName(page: Page, pattern: RegExp, label: string): Promise<void> {
  const btn = page.getByRole('button', { name: pattern });
  try {
    await btn.first().click({ timeout: 10_000 });
  } catch {
    fail(`fant ikke klikkbar «${label}» (${pattern})`);
  }
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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

    await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
    await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 15_000 });

    // Familie-rot → oppgrader-rad → paywall
    await clickByName(page, /Familie|Innst/i, 'Familie-fane');
    await page.waitForTimeout(400);
    await clickByName(page, /oppgrader|Babyora Pluss|Premium/i, 'oppgrader-rad');

    // PaywallDialog: CTA (årlig standard → «Start 7 dager gratis»)
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });
    await clickByName(page, /Start 7 dager gratis|Kjøp Babyora Pluss/i, 'kjøps-CTA');

    // Kjøp simulert → status «aktivert (testmodus)»
    try {
      await page.locator('text=/aktivert \\(testmodus\\)/i').first().waitFor({ state: 'visible', timeout: 8_000 });
    } catch {
      fail('kjøps-status «aktivert (testmodus)» dukket aldri opp — setPremium ikke wiret?');
    }
    console.log('PURCHASE OK: kjøpsflyt simulert, Premium aktivert');

    // Auto-lukk (1400ms) → abonnementsraden reflekterer Premium-tilstand
    await page.waitForTimeout(1800);
    try {
      await page.locator('text=/Babyora Pluss aktiv/i').first().waitFor({ state: 'visible', timeout: 8_000 });
    } catch {
      fail('abonnementsraden viste ikke «Babyora Pluss aktiv» etter kjøp — entitlement-gating reagerte ikke');
    }
    console.log('PURCHASE OK: entitlement-gating reagerer på ny Premium-tilstand');

    const fatal = errors.filter((e) => !/met\.no|Failed to fetch|NetworkError|forecast/i.test(e));
    if (fatal.length > 0) fail(`uncaught errors:\n  ${fatal.join('\n  ')}`);

    console.log('PURCHASE PASS: kjøpsflyt grønn (dev-mock, uten enhet)');
    await page.close();
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
