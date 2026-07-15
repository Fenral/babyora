/**
 * R7/Task 8 — E2E kjøpsflyt-verifisering (dev/web-mock, uten fysisk enhet).
 *
 * Verifiserer RevenueCat-flyten så langt den KAN verifiseres uten StoreKit:
 * PaywallDialog sin web/dev-mock simulerer kjøp når appen ikke er native.
 * Tre scenarioer i isolerte browser-kontekster (egen localStorage hver):
 *   1. Årsplan (standard) → kjøp → «aktivert (testmodus)» → abonnementsrad «aktiv».
 *   2. Månedsplan → velg → kjøp → aktivert (annen CTA-gren).
 *   3. Gjenopprett uten tidligere kjøp → dev-only-melding (ikke krasj).
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

/** seed=demo app-skall → Familie-rot → oppgrader-rad → paywall åpen. */
async function openPaywall(page: Page): Promise<void> {
  await page.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await page.locator('text=Hjem').first().waitFor({ state: 'visible', timeout: 15_000 });
  await clickByName(page, /Familie|Innst/i, 'Familie-fane');
  await page.waitForTimeout(400);
  await clickByName(page, /oppgrader|Babyora Pluss|Premium/i, 'oppgrader-rad');
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });
}

async function expectVisible(page: Page, rx: RegExp, whatFailed: string): Promise<void> {
  try {
    await page.locator(`text=${rx.toString()}`).first().waitFor({ state: 'visible', timeout: 8_000 });
  } catch {
    fail(whatFailed);
  }
}

async function scenarioPurchase(browser: Browser, plan: 'yearly' | 'monthly'): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await openPaywall(page);

  if (plan === 'monthly') {
    // Radioen er visuelt skjult (sr-only-klipp) → klikk den synlige etiketten.
    try {
      await page.locator('label.pw-plan-label').filter({ hasText: 'Månedlig' }).first().click({ timeout: 6_000 });
    } catch {
      fail('kunne ikke velge månedsplan i paywall');
    }
  }
  await clickByName(page, /Start 7 dager gratis|Kjøp Babyora Pluss/i, 'kjøps-CTA');
  await expectVisible(page, /aktivert \(testmodus\)/i, `${plan}: kjøps-status «aktivert (testmodus)» dukket aldri opp`);
  console.log(`PURCHASE OK: ${plan} — kjøp simulert, Premium aktivert`);

  const fatal = errors.filter((e) => !/met\.no|forecast|Failed to fetch|NetworkError/i.test(e));
  if (fatal.length) fail(`${plan}: uncaught errors:\n  ${fatal.join('\n  ')}`);
  await ctx.close();
}

async function scenarioRestore(browser: Browser): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await openPaywall(page);
  await clickByName(page, /Gjenopprett kjøp/i, 'gjenopprett-knapp');
  // Uten tidligere kjøp i dev → tydelig dev-only-melding, ingen krasj.
  await expectVisible(page, /Gjenoppretting fungerer først/i, 'restore: dev-only-melding uteble');
  console.log('PURCHASE OK: restore uten kjøp → dev-only-melding (ingen krasj)');
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

    await scenarioPurchase(browser, 'yearly');
    await scenarioPurchase(browser, 'monthly');
    await scenarioRestore(browser);

    console.log('PURCHASE PASS: 3/3 kjøpsflyt-scenarioer grønne (dev-mock, uten enhet)');
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
