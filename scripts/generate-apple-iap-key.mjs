/**
 * Apple In-App Purchase Key generator via Playwright — v3.
 *
 * Strategi:
 * - Vent eksplisitt på at Issuer ID dukker opp (signal at React er ferdig)
 * - Klikk på "In-App Purchase"-link i sidemenyen istedenfor URL direkte
 * - Lengre timeouts + retries
 * - Eksplisitt saveAs til Downloads
 * - Tar screenshots underveis
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(__dirname, '..', '.playwright-edge-profile');
const OUTPUT_FILE = join(__dirname, '..', '.apple-iap-key.json');
const SCREENSHOT_DIR = join(__dirname, '..', '.playwright-screenshots');
const DOWNLOADS_DIR = join(homedir(), 'Downloads');

if (!existsSync(PROFILE_DIR)) mkdirSync(PROFILE_DIR, { recursive: true });
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const KEY_NAME = `Klemeg IAP ${Date.now().toString().slice(-4)}`;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function shot(page, label) {
  const path = join(SCREENSHOT_DIR, `${Date.now()}-${label}.png`);
  await page.screenshot({ path, fullPage: false }).catch(() => {});
  console.log(`  📷 ${label}.png`);
}

async function waitForRender(page, signalRegex, maxMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const txt = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (signalRegex.test(txt)) return true;
    await sleep(1000);
  }
  return false;
}

async function main() {
  console.log('Åpner Edge med Klemeg-profil…');
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] ?? (await browser.newPage());

  // Download-handler (saveAs til Downloads)
  page.on('download', async (dl) => {
    const target = join(DOWNLOADS_DIR, dl.suggestedFilename());
    await dl.saveAs(target).catch((e) => console.log(`saveAs err: ${e.message}`));
    console.log(`✅ Download → ${target}`);
  });

  console.log('Naviger til Integrations…');
  await page.goto('https://appstoreconnect.apple.com/access/integrations/api', {
    waitUntil: 'domcontentloaded',
  });

  if (page.url().includes('/login')) {
    console.log('⚠  Ikke innlogget. Venter 120s…');
    await sleep(120_000);
    await page.goto('https://appstoreconnect.apple.com/access/integrations/api', {
      waitUntil: 'domcontentloaded',
    });
  }

  console.log('Venter på at siden rendres (Issuer ID synlig)…');
  const ready = await waitForRender(page, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, 60_000);
  console.log(`  Side ferdig rendret: ${ready}`);
  await shot(page, '01-team-keys-loaded');

  // Klikk på "In-App Purchase" link i sidemeny
  console.log('Klikker "In-App Purchase" i sidemenyen…');
  const sideLink = page.getByRole('link', { name: 'In-App Purchase' }).first();
  if (await sideLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sideLink.click();
    console.log('  ✓ Sidemeny-link clicket');
  } else {
    // Fallback: direkte url
    await page.goto('https://appstoreconnect.apple.com/access/integrations/api/inapppurchase', { waitUntil: 'domcontentloaded' });
  }

  console.log('Venter på at In-App Purchase-siden rendres…');
  await sleep(3000);
  // Signal: enten Issuer ID eller "No Keys" / "Active" / "Generate"
  await waitForRender(page, /(in-app purchase|active|generate|issuer)/i, 30_000);
  await sleep(2000);
  await shot(page, '02-iap-loaded');

  const issuerId = await page.evaluate(() => {
    const m = document.body.innerText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    return m ? m[0] : null;
  });
  console.log(`Issuer ID: ${issuerId}`);

  // Dump alle button-targets så vi forstår UI
  const btnInventory = await page.evaluate(() => {
    return [...document.querySelectorAll('button, a')].map((el, idx) => {
      const r = el.getBoundingClientRect();
      return {
        idx,
        tag: el.tagName,
        text: el.textContent.trim().slice(0, 40),
        ariaLabel: (el.getAttribute('aria-label') || '').slice(0, 40),
        title: (el.getAttribute('title') || '').slice(0, 40),
        href: el.href ? el.href.slice(0, 80) : null,
        visible: r.width > 0 && r.height > 0,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      };
    }).filter(b => b.visible && (b.text.length < 30) && b.y < 600);
  });
  console.log('Buttons inventory:');
  btnInventory.forEach(b => {
    console.log(`  [${b.idx}] ${b.tag} "${b.text}" / aria="${b.ariaLabel}" / title="${b.title}" @ (${b.x},${b.y}) ${b.w}x${b.h}`);
  });

  // Forsøk å klikke "+" — søk gjennom alle små buttons uten label nær toppen
  console.log('Søker "+"-knapp…');
  const plusClicked = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('button')].filter(b => {
      const r = b.getBoundingClientRect();
      const txt = b.textContent.trim();
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      // "+" er en sirkulær blå ikon nær "Active (N)"-headingen
      return r.width > 18 && r.width < 50 && r.height > 18 && r.height < 50 &&
             r.top > 100 && r.top < 600 &&
             (txt === '' || txt === '+') &&
             !aria.includes('help') && !aria.includes('close') && !aria.includes('search');
    });
    if (candidates.length === 0) return { found: 0 };
    // Klikk første kandidat
    candidates[0].click();
    return { found: candidates.length, clicked: 0 };
  });
  console.log(`  Plus-kandidater: ${plusClicked.found} (klikket idx ${plusClicked.clicked})`);

  await sleep(2500);
  await shot(page, '03-after-plus');

  // Sjekk om dialog er åpen
  const dialogState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"], .modal, [class*="modal" i]');
    if (!dialog) return { open: false };
    const inputs = [...dialog.querySelectorAll('input[type="text"], input:not([type])')].map((i, idx) => ({
      idx, id: i.id, name: i.name, placeholder: i.placeholder, ariaLabel: i.getAttribute('aria-label'),
    }));
    return { open: true, inputs };
  });
  console.log(`Dialog open: ${dialogState.open}`);
  if (dialogState.inputs) console.log(`  Inputs: ${JSON.stringify(dialogState.inputs)}`);

  if (!dialogState.open) {
    console.log('⚠  Ingen dialog. Klikk "+" manuelt i Edge — venter 30s.');
    await sleep(30_000);
  }

  // Fyll inn navn
  const nameInput = page.locator('[role="dialog"] input[type="text"], [role="dialog"] input:not([type])').first();
  if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nameInput.click();
    await nameInput.fill(KEY_NAME);
    console.log(`✓ Fylt name: ${KEY_NAME}`);
  } else {
    console.log('⚠  Ingen name-input. Fyll manuelt + Generate — venter 30s.');
    await sleep(30_000);
  }
  await shot(page, '04-name-filled');

  await sleep(1000);

  // Generate
  const genBtn = page.locator('[role="dialog"]').getByRole('button', { name: /^generate$/i }).first();
  if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (!(await genBtn.isDisabled().catch(() => true))) {
      await genBtn.click();
      console.log('✓ Generate-clicked');
    }
  } else {
    console.log('⚠  Klikk Generate manuelt');
    await sleep(15_000);
  }

  await sleep(4000);
  await shot(page, '05-after-generate');

  // Vent på download-link og klikk
  console.log('Søker Download API Key-link…');
  const downloadPromise = page.waitForEvent('download', { timeout: 45_000 }).catch(() => null);

  let dlClicked = false;
  const tryClick = async (locator) => {
    if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await locator.click({ timeout: 3000 }).catch(() => {});
      return true;
    }
    return false;
  };

  for (const strat of [
    page.getByRole('link', { name: /download api key/i }),
    page.getByRole('button', { name: /download api key/i }),
    page.locator('a:has-text("Download API Key")'),
    page.locator('a:has-text("Download")').first(),
    page.locator('button:has-text("Download")').first(),
  ]) {
    if (await tryClick(strat)) { dlClicked = true; console.log('✓ Download-clicked'); break; }
  }

  if (!dlClicked) {
    console.log('⚠  Klikk Download MANUELT — saveAs vil fange filen.');
  }

  const download = await downloadPromise;
  if (download) {
    const target = join(DOWNLOADS_DIR, download.suggestedFilename());
    if (!existsSync(target)) {
      await download.saveAs(target).catch((e) => console.log(`saveAs err: ${e.message}`));
    }
    console.log(`✅ .p8 → ${target}`);
  } else {
    console.log('⚠  Ingen download-event registrert.');
  }

  await sleep(2000);
  await shot(page, '06-after-download');

  // Hent Key ID fra tabellen
  const keyId = await page.evaluate((name) => {
    const rows = [...document.querySelectorAll('tr')];
    for (const row of rows) {
      if (row.textContent.includes(name)) {
        const m = row.textContent.match(/\b[A-Z0-9]{10}\b/);
        return m ? m[0] : null;
      }
    }
    return null;
  }, KEY_NAME);
  console.log(`Key ID: ${keyId}`);

  const result = {
    issuerId,
    keyId,
    name: KEY_NAME,
    p8File: download ? join(DOWNLOADS_DIR, download.suggestedFilename()) : null,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`\nLagret: ${OUTPUT_FILE}`);
  console.log(JSON.stringify(result, null, 2));

  await new Promise(() => {});
}

main().catch((err) => {
  console.error('\n❌ Feil:', err.message);
  process.exit(1);
});
