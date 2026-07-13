/**
 * Kobler Apple iOS-app i RevenueCat via Playwright.
 * Laster opp .p8, fyller Issuer ID + Key ID + Bundle ID.
 *
 * Forutsetter at .apple-iap-key.json finnes med credentials.
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(__dirname, '..', '.playwright-edge-profile');
const SCREENSHOT_DIR = join(__dirname, '..', '.playwright-screenshots');
const KEY_FILE = join(__dirname, '..', '.apple-iap-key.json');

if (!existsSync(PROFILE_DIR)) mkdirSync(PROFILE_DIR, { recursive: true });
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

if (!existsSync(KEY_FILE)) {
  console.error('❌ .apple-iap-key.json mangler. Kjør generate-apple-iap-key.mjs først.');
  process.exit(1);
}

const apple = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
const PROJECT_ID = '4bd62d97'; // Klemeg RevenueCat-prosjekt
const BUNDLE_ID = 'no.klemeg.app';
const APP_NAME = 'Klemeg iOS';

if (!apple.issuerId || !apple.keyId || !apple.p8File) {
  console.error('❌ Mangler credentials i .apple-iap-key.json:', apple);
  process.exit(1);
}

if (!existsSync(apple.p8File)) {
  console.error(`❌ .p8-fila finnes ikke på disk: ${apple.p8File}`);
  process.exit(1);
}

console.log(`Apple credentials:
  Issuer ID: ${apple.issuerId}
  Key ID:    ${apple.keyId}
  .p8 file:  ${apple.p8File}
  Bundle ID: ${BUNDLE_ID}
`);

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function shot(page, label) {
  const path = join(SCREENSHOT_DIR, `${Date.now()}-rc-${label}.png`);
  await page.screenshot({ path, fullPage: false }).catch(() => {});
  console.log(`  📷 ${label}.png`);
}

async function main() {
  console.log('Åpner Edge med profil…');
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1400, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] ?? (await browser.newPage());

  console.log('Naviger til RevenueCat → new App Store app…');
  await page.goto(`https://app.revenuecat.com/projects/${PROJECT_ID}/new-app/app_store`, {
    waitUntil: 'domcontentloaded',
  });

  // Vent på at innlogging er ferdig — poll URL og DOM
  console.log('Sjekker innlogging-status…');
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const url = page.url();
    const loginVisible = await page.evaluate(() => {
      const txt = document.body.innerText.toLowerCase();
      return txt.includes('log in') || txt.includes('welcome back') || txt.includes('sign in');
    }).catch(() => false);
    const formReady = await page.evaluate(() => !!document.querySelector('#app-name')).catch(() => false);
    if (formReady) { console.log('  ✓ Form-side klar'); break; }
    if (loginVisible) {
      if (i === 0) console.log('  ⚠  RevenueCat login-side. Logg inn i Edge — venter inntil 3 min…');
      if (i % 10 === 9) console.log(`  ⏳ Fortsatt på login etter ${(i + 1) * 3}s`);
    } else {
      if (i === 5) console.log(`  ⏳ Venter på app-skjema… URL: ${url}`);
    }
    if (i === 30) {
      // Prøv re-navigation
      await page.goto(`https://app.revenuecat.com/projects/${PROJECT_ID}/new-app/app_store`, {
        waitUntil: 'domcontentloaded',
      }).catch(() => {});
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await sleep(2000);
  await shot(page, '01-new-app-store');

  console.log('Fyller App name + Bundle ID…');
  // App name
  const nameSetter = await page.evaluate((val) => {
    const el = document.querySelector('#app-name');
    if (!el) return false;
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }, APP_NAME);
  console.log(`  ✓ App name set: ${nameSetter}`);

  const bundleSetter = await page.evaluate((val) => {
    const el = document.querySelector('#bundleId');
    if (!el) return false;
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }, BUNDLE_ID);
  console.log(`  ✓ Bundle ID set: ${bundleSetter}`);

  await sleep(1000);

  // Klikk "Add new key" — for å opprette in-app purchase key
  console.log('Klikker "Add new key"…');
  const addNewKeyBtn = page.getByRole('button', { name: /add new key/i }).first();
  if (await addNewKeyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addNewKeyBtn.click();
    console.log('  ✓ Add new key clicket');
  } else {
    console.log('  ⚠  Fant ikke "Add new key". Klikk manuelt — venter 20s.');
    await sleep(20_000);
  }

  await sleep(2000);
  await shot(page, '02-key-dialog');

  // I dialogen: fyll Key Name + Key ID + Issuer ID + last opp .p8
  console.log('Fyller Key-dialog…');
  const fillResult = await page.evaluate((data) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'no dialog' };
    const inputs = [...dialog.querySelectorAll('input[type="text"], input:not([type])')];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const results = inputs.map((inp, idx) => {
      const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
      const placeholder = (inp.placeholder || '').toLowerCase();
      const labelText = (() => {
        let p = inp.parentElement;
        for (let i = 0; i < 6 && p; i++) {
          const l = p.querySelector('label');
          if (l) return l.textContent.trim().toLowerCase();
          p = p.parentElement;
        }
        return '';
      })();
      const ctx = `${aria} ${placeholder} ${labelText}`;
      let val = null;
      if (/key.?id/.test(ctx) && !/issuer/.test(ctx)) val = data.keyId;
      else if (/issuer/.test(ctx)) val = data.issuerId;
      else if (/name/.test(ctx)) val = 'RevenueCat Klemeg IAP Key';
      if (val) {
        inp.focus();
        setter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('blur', { bubbles: true }));
        return { idx, ctx, val, ok: true };
      }
      return { idx, ctx, val: null, ok: false };
    });
    return { ok: true, results };
  }, { keyId: apple.keyId, issuerId: apple.issuerId });
  console.log('  Fill results:', JSON.stringify(fillResult, null, 2));

  await sleep(1000);

  // Last opp .p8-fila
  console.log('Last opp .p8…');
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(apple.p8File);
    console.log(`  ✓ .p8 uploaded: ${apple.p8File}`);
  } else {
    console.log('  ⚠  Ingen file input synlig. Last opp manuelt.');
    await sleep(20_000);
  }

  await sleep(2000);
  await shot(page, '03-key-filled');

  // Klikk Save/Add i dialog
  console.log('Klikker Save i dialog…');
  const saveDialogBtn = page.locator('[role="dialog"]').getByRole('button', { name: /^(save|add|submit|create)$/i }).first();
  if (await saveDialogBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (!(await saveDialogBtn.isDisabled().catch(() => true))) {
      await saveDialogBtn.click();
      console.log('  ✓ Dialog Save clicket');
    }
  }

  await sleep(4000);
  await shot(page, '04-after-key-save');

  // Til slutt: klikk Save changes på app-form
  console.log('Klikker Save changes…');
  const saveAppBtn = page.getByRole('button', { name: /save changes/i }).first();
  if (await saveAppBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (!(await saveAppBtn.isDisabled().catch(() => true))) {
      await saveAppBtn.click();
      console.log('  ✓ Save changes clicket');
    } else {
      console.log('  ⚠  Save changes disabled.');
    }
  }

  await sleep(5000);
  await shot(page, '05-final');

  console.log(`\nFerdig. URL: ${page.url()}`);
  console.log('Sjekk Edge for å verifisere. Lukk når du er ferdig.');
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('\n❌ Feil:', err.message);
  process.exit(1);
});
