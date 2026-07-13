#!/usr/bin/env node
/* F28.4.r1 Self-Verify Browser Protocol — Innstillinger. */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Settings Self-Verify Browser Protocol → ${URL}\n`);

const HEADLESS = process.env.HEADLESS !== '0';
const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const settingsTab = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(3);
if ((await settingsTab.count()) === 0) {
  console.error('FATAL: Bottom-nav settings tab ikke funnet.');
  await browser.close();
  exit(1);
}
await settingsTab.click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const root = document.querySelector('.instr-app');
  const isAtmosphere = root?.classList.contains('atmosphere');
  const h1 = document.querySelector('h1');
  const h2s = document.querySelectorAll('h2');
  const groups = document.querySelectorAll('[role="group"][aria-labelledby]');
  const switchEl = document.querySelector('[role="switch"]');
  const switchChecked = switchEl?.getAttribute('aria-checked');
  // F28-final v3: aria-label flyttet fra role=group wrapper TIL <button role="switch">
  // (aria-specialist: gruppe rundt enkel switch er redundant).
  const switchLabel = document.querySelector('[role="switch"][aria-label*="Konservativ"]');
  const infoRows = document.querySelectorAll('[data-row-type="info"]');
  const switchRows = document.querySelectorAll('[data-row-type="switch"]');
  return {
    isAtmosphere,
    h1Text: h1?.textContent?.trim(),
    h2Texts: [...h2s].map((h) => h.textContent?.trim()),
    h2Count: h2s.length,
    groupCount: groups.length,
    hasSwitch: !!switchEl,
    switchChecked,
    hasSwitchAriaLabel: !!switchLabel,
    infoRowCount: infoRows.length,
    switchRowCount: switchRows.length,
  };
});

console.log('— SETTINGS state —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/settings.png`, fullPage: false });

// Click the switch to verify state toggles
const switchEl = page.locator('[role="switch"]');
if ((await switchEl.count()) > 0) {
  await switchEl.click();
  await page.waitForTimeout(200);
  const afterClick = await page.evaluate(() => document.querySelector('[role="switch"]')?.getAttribute('aria-checked'));
  console.log(`\n  → Switch klikket: aria-checked=${afterClick}`);
}

const checks = [
  { name: 'IKKE atmosphere (Sone 3)', pass: !state.isAtmosphere },
  { name: 'h1 = Innstillinger', pass: state.h1Text === 'Innstillinger' },
  { name: '4 h2-seksjoner', pass: state.h2Count === 4 },
  { name: 'h2: Profil + Premium + Vær + Om', pass: state.h2Texts.join('|') === 'Profil|Premium|Vær|Om' },
  { name: '4 grupper m/ aria-labelledby', pass: state.groupCount === 4 },
  { name: 'role="switch" finnes', pass: state.hasSwitch },
  { name: 'switch starter som Av (aria-checked="false")', pass: state.switchChecked === 'false' },
  { name: 'switch har aria-label', pass: state.hasSwitchAriaLabel },
  { name: '6 info-rader (Barn/Sted/Født/Datakilde/Versjon/Bygget)', pass: state.infoRowCount === 6 },
  { name: '1 switch-rad', pass: state.switchRowCount === 1 },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
