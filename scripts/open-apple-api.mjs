/**
 * Åpner Edge med Klemeg-profilen rett til Apple App Store Connect → Integrations.
 *
 * Bruk:
 *   node scripts/open-apple-api.mjs
 *
 * Browseren forblir åpen til du lukker den.
 * Cookies persistes i .playwright-edge-profile/ (samme profil som bootstrap-stores.mjs).
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

const TARGET = 'https://appstoreconnect.apple.com/access/integrations/api/team';

console.log('Åpner Edge med Klemeg-profil…');
console.log(`Mål: ${TARGET}\n`);

const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'msedge',
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});

const page = browser.pages()[0] ?? (await browser.newPage());
await page.goto(TARGET, { waitUntil: 'domcontentloaded' }).catch(() => {});

console.log('Edge er åpen. Hvis du må logge inn — gjør det nå.');
console.log('Når du er på "App Store Connect API"-fanen, fortsett i Claude.');
console.log('Lukk Edge når du er ferdig.\n');

// Hold prosessen i live
await new Promise(() => {});
