/**
 * Spawn Chromium med persistent profil + remote-debug-port for Copilot-loop.
 *
 * Bruk:
 *   node scripts/copilot-browser-spawn.mjs
 *
 * Hva som skjer:
 *   1. Chromium starter med eget vindu (headed)
 *   2. Persistent user-data-dir = ./.playwright-copilot-profile/
 *      (cookies + login cacher mellom kjøringer)
 *   3. Remote-debug-port 9224 — Claude kan kobles til via CDP
 *   4. Naviger automatisk til M365 Copilot
 *   5. Du logger inn (én gang)
 *   6. Vinduet forblir åpent — Claude tar over via Playwright.connectOverCDP
 *
 * Stoppe: Ctrl+C i terminalen, eller lukk Chromium-vinduet.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_DIR = path.join(__dirname, '..', '.playwright-copilot-profile');
const CDP_PORT = 9224;

console.log('🌐 Starter Chromium med Copilot-profil...');
console.log(`   Profil: ${PROFILE_DIR}`);
console.log(`   CDP-port: ${CDP_PORT}`);

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: [
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-blink-features=AutomationControlled',
  ],
  acceptDownloads: false,
  bypassCSP: true,
  ignoreHTTPSErrors: true,
});

const page = context.pages()[0] ?? (await context.newPage());

console.log('✅ Chromium åpnet.');
console.log('   Navigerer til M365 Copilot...');

await page.goto('https://m365.cloud.microsoft/chat/', { waitUntil: 'load' });

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📋 NESTE STEG:');
console.log('  1. Logg inn i Copilot-vinduet med din M365-konto');
console.log('  2. Når Copilot-chat er klar: si fra til Claude');
console.log('  3. Claude kobler seg på via CDP-port', CDP_PORT);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Vinduet og denne prosessen forblir åpne. Trykk Ctrl+C for å stoppe.');

// Hold prosessen åpen så Claude kan connectOverCDP senere
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopper...');
  await context.close();
  process.exit(0);
});

// Wait forever (eller til Ctrl+C)
await new Promise(() => {});
