/**
 * Bootstrap App Store Connect + Play Console for Klemeg.
 *
 * KJØRES LOKALT — ikke i CI. Krever at Sivert er innlogget og godkjenner 2FA.
 *
 *   node scripts/bootstrap-stores.mjs
 *
 * Hva scriptet gjør:
 * 1. Åpner Edge med dedikert profil (./.playwright-edge-profile/)
 * 2. Navigerer til App Store Connect → ber deg logge inn første gang
 * 3. Forsøker å opprette Klemeg-app
 * 4. Navigerer til Play Console → ber deg logge inn første gang
 * 5. Forsøker å opprette Klemeg-app
 *
 * RISIKO:
 * - Apple/Google har anti-automation. Kontoen kan bli flagget hvis brukt
 *   aggressivt. Vi bruker bevisst ENGANGS-navigasjon + lange ventetider.
 * - Hvis du ser captcha eller "Verify it's you" → AVBRYT og opprett manuelt.
 * - Scriptet stopper FØR "Save"/"Create"-knapp så du kan verifisere data
 *   visuelt før det blir permanent.
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
  appName: 'Klemeg',
  bundleId: 'no.klemeg.app',
  skuIos: 'klemeg-ios-1',
  skuAndroid: 'klemeg-android-1',
  primaryLanguage: 'Norwegian',
  appleTeamId: 'PL9G26C26C',
};

async function pause(label, seconds = 60) {
  console.log(`\n⏸  ${label}`);
  console.log(`   Venter ${seconds}s — bruk denne tiden til å logge inn / godkjenne 2FA / verifisere.`);
  console.log(`   Trykk Ctrl+C i denne terminalen for å avbryte.\n`);
  await new Promise((r) => setTimeout(r, seconds * 1000));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Klemeg store-bootstrap via Playwright');
  console.log('='.repeat(60));
  console.log(`Edge-profil: ${PROFILE_DIR}`);
  console.log('Husk: scriptet stopper før "Save". Du må klikke selv for å bekrefte.\n');

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1400, height: 900 },
    // Mindre detekterbart enn default
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] ?? (await browser.newPage());

  // ─── APP STORE CONNECT ───────────────────────────────────────
  console.log('\n📱 App Store Connect — åpner…');
  await page.goto('https://appstoreconnect.apple.com/apps', { waitUntil: 'domcontentloaded' });

  const isOnLogin = page.url().includes('/login');
  if (isOnLogin) {
    await pause('Logg inn på Apple ID + 2FA', 90);
  }

  // Vent på at "My Apps" eller liknende laster
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  // Forsøk å finne "+" knapp eller "Add New App"
  console.log('Søker etter "+ Add"-knapp på App Store Connect…');
  const addBtn = page.locator('button:has-text("+"), a:has-text("Add New App")').first();
  if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await addBtn.click();
    console.log('Klikket "+ Add"');
    await page.waitForTimeout(1500);

    // Velg "New App" hvis menyen åpner
    const newAppOption = page.locator('text="New App"').first();
    if (await newAppOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await newAppOption.click();
      console.log('Valgte "New App"');
    }
  } else {
    console.log('Fant ikke "+ Add"-knapp. App-listen ser sannsynligvis annerledes ut.');
    console.log('STOPP HER og opprett manuelt i nettleseren. Scriptet venter…');
  }

  await pause(
    'Fyll inn Klemeg-data manuelt i dialogen + klikk "Create"',
    180,
  );
  console.log(`Forslag:
    - Platforms: iOS
    - Name: ${KLEMEG.appName}
    - Primary Language: ${KLEMEG.primaryLanguage}
    - Bundle ID: ${KLEMEG.bundleId} (må finnes i Identifiers — Team ${KLEMEG.appleTeamId})
    - SKU: ${KLEMEG.skuIos}
    - User Access: Full Access`);

  // ─── PLAY CONSOLE ────────────────────────────────────────────
  console.log('\n🤖 Play Console — åpner…');
  await page.goto('https://play.google.com/console/u/0/developers', {
    waitUntil: 'domcontentloaded',
  });

  if (page.url().includes('accounts.google.com')) {
    await pause('Logg inn på Google + 2FA', 90);
  }

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  console.log('Søker etter "Create app"-knapp på Play Console…');
  const createAppBtn = page.locator('button:has-text("Create app")').first();
  if (await createAppBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await createAppBtn.click();
    console.log('Klikket "Create app"');
  } else {
    console.log('Fant ikke "Create app"-knapp. STOPP HER og opprett manuelt.');
  }

  await pause(
    'Fyll inn Klemeg-data manuelt + klikk "Create app"',
    180,
  );
  console.log(`Forslag:
    - App name: ${KLEMEG.appName}
    - Default language: norsk (no-NO) / Norsk (norsk bokmål)
    - App or game: App
    - Free or paid: Free (med IAP)
    - Declarations: ja på begge sjekkbokser`);

  console.log('\n✅ Scriptet ferdig. Sjekk nettleseren og bekreft manuelt.');
  console.log('   Nettleseren forblir åpen. Lukk når du er ferdig.');

  // Vent på Ctrl+C — scriptet avslutter ikke automatisk
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('\n❌ Feil:', err.message);
  process.exit(1);
});
