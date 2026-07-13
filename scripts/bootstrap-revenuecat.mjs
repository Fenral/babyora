/**
 * Bootstrap RevenueCat for Klemeg.
 *
 * Kjøres ETTER (eller parallelt med) bootstrap-stores.mjs.
 * Bruker samme .playwright-edge-profile/ — du logger inn én gang.
 *
 *   node scripts/bootstrap-revenuecat.mjs
 *
 * Hva scriptet gjør:
 * 1. Åpner RevenueCat dashboard
 * 2. Venter på at du logger inn
 * 3. Forsøker å klikke "Create project" / åpner Klemeg-projekt
 * 4. Stopper for at du gjør verifisering før "Save"
 * 5. Pinger deg på hvor API-keys hentes
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(__dirname, '..', '.playwright-edge-profile');

if (!existsSync(PROFILE_DIR)) {
  mkdirSync(PROFILE_DIR, { recursive: true });
}

const KLEMEG = {
  projectName: 'Klemeg',
  iosBundleId: 'no.klemeg.app',
  androidPackage: 'no.klemeg.app',
  appleAppName: 'Klemeg iOS',
  androidAppName: 'Klemeg Android',
};

async function pause(label, seconds = 60) {
  console.log(`\n⏸  ${label}`);
  console.log(`   Venter ${seconds}s — bruk tiden til å logge inn / verifisere.`);
  console.log(`   Trykk Ctrl+C for å avbryte.\n`);
  await new Promise((r) => setTimeout(r, seconds * 1000));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Klemeg RevenueCat-bootstrap via Playwright');
  console.log('='.repeat(60));
  console.log(`Edge-profil: ${PROFILE_DIR}\n`);

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1400, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] ?? (await browser.newPage());

  console.log('💸 RevenueCat — åpner…');
  await page.goto('https://app.revenuecat.com/', { waitUntil: 'domcontentloaded' });

  if (page.url().includes('/login') || page.url().includes('/signin')) {
    await pause('Logg inn på RevenueCat', 90);
  }

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  console.log(`Nåværende URL: ${page.url()}`);

  // RevenueCat har et "+ New project" eller "Projects" → "Klemeg"-flow
  console.log('Søker etter "New project" eller "Create"-knapp…');
  const createBtn = page.locator(
    'button:has-text("New project"), a:has-text("New project"), button:has-text("Create project")',
  ).first();

  if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await createBtn.click();
    console.log('Klikket "New project"');
    await page.waitForTimeout(1500);
  } else {
    console.log('Fant ikke "New project". Du kan navigere selv til Projects → Klemeg.');
  }

  await pause(
    `Opprett prosjektet (eller åpne eksisterende). Foreslåtte verdier:
       - Project name: ${KLEMEG.projectName}
       - Apps: iOS + Android
       - iOS bundle ID: ${KLEMEG.iosBundleId}
       - Android package: ${KLEMEG.androidPackage}
       - Apple app name: ${KLEMEG.appleAppName}
       - Android app name: ${KLEMEG.androidAppName}
       - App Store Connect API key: koble fra Apple Connect → Users → Integrations
       - Google Play service account: opprett via Google Cloud → IAM
     Når app-er er lagt til:
       - Gå til API Keys
       - Kopier "iOS Public SDK Key" (appl_xxx) — lim i .env.local
       - Kopier "Android Public SDK Key" (goog_xxx) — lim i .env.local
       - Legg samme i Codemagic-gruppe 'klemeg_revenuecat'`,
    300,
  );

  console.log('\nNeste — opprett Entitlement og Offerings:');
  console.log(`
    1. Entitlements → + New entitlement → ID: "premium"
    2. Products → + New product →
       - "monthly" → link App Store-ID no.klemeg.app.monthly + Play SKU klemeg_premium_monthly
       - "quarterly" → 3-måneds-IDene
       - "yearly" → års-IDene
    3. Tildel alle 3 products → entitlement "premium"
    4. Offerings → + New offering "default" → legg til alle 3 packages
       (Apple Reviewer godkjenner kjøp via dette offering ved review)
  `);

  await pause('Fullfør Entitlement + Products + Offerings', 240);

  console.log('\n✅ RevenueCat-bootstrap ferdig.');
  console.log('   Verifiser at API-keys er kopiert til .env.local og Codemagic.');
  console.log('   Nettleseren forblir åpen. Lukk når du er ferdig.');

  await new Promise(() => {});
}

main().catch((err) => {
  console.error('\n❌ Feil:', err.message);
  process.exit(1);
});
