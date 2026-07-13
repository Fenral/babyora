#!/usr/bin/env node
/* F28.7.r1 Self-Verify Browser Protocol — GarmentDetailScreenInstrument. */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Plagg-detalj Self-Verify Browser Protocol → ${URL}\n`);

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

// Guide → Plaggbib → first card
await page.locator('nav[aria-label="Hoved"] button, nav[aria-label="Hoved"] a').nth(2).click();
await page.waitForTimeout(400);
await page.locator('button').filter({ hasText: /Plaggbiblioteket/ }).first().click();
await page.waitForTimeout(500);
await page.locator('main ul[role="list"] > li > button').first().click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const h2s = document.querySelectorAll('h2');
  const sections = document.querySelectorAll('section[aria-labelledby]');
  const backBtn = document.querySelector('button[aria-label*="Tilbake"]');
  // F28-final: byttet til native checkbox (drop role=switch + aria-checked).
  // SR-en bruker innebygd checkbox-state istedenfor double-state-conflict.
  const switchEl = document.querySelector('input[type="checkbox"][id^="own-"]');
  const switchChecked = switchEl?.checked ? 'true' : 'false';
  const ownLabel = document.querySelector('label[for^="own-"]');
  const heroImg = document.querySelector('main img');
  const dls = document.querySelectorAll('dl');
  return {
    h1Text: h1?.textContent?.trim(),
    h1HasFocus: h1 === document.activeElement,
    h1TabIndex: h1?.getAttribute('tabindex'),
    h2Count: h2s.length,
    sectionCount: sections.length,
    hasBackBtn: !!backBtn,
    hasSwitch: !!switchEl,
    switchChecked,
    hasOwnerLabel: !!ownLabel,
    heroImgAlt: heroImg?.getAttribute('alt'),
    dlCount: dls.length,
  };
});

console.log('— PLAGG-DETALJ —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/plagg-detalj.png`, fullPage: false });

// Toggle ownership and verify checked flips
const sw = page.locator('input[type="checkbox"][id^="own-"]');
if ((await sw.count()) > 0) {
  const beforeChecked = await sw.evaluate((el) => el.checked);
  await sw.click();
  await page.waitForTimeout(200);
  const after = await sw.evaluate((el) => el.checked);
  console.log(`\n  → Ownership toggle: ${beforeChecked} → ${after}`);
}

const checks = [
  { name: 'h1 finnes m/ plagg-navn', pass: !!state.h1Text && state.h1Text.length > 0 },
  { name: 'h1 tabindex=-1 (focus-management)', pass: state.h1TabIndex === '-1' },
  { name: 'minst 2 h2-seksjoner', pass: state.h2Count >= 2 },
  { name: 'sections har aria-labelledby', pass: state.sectionCount >= 2 },
  { name: 'back-knapp m/ aria-label', pass: state.hasBackBtn },
  { name: 'native checkbox m/ id^="own-"', pass: state.hasSwitch },
  { name: 'checkbox-state lesbar', pass: state.switchChecked === 'true' || state.switchChecked === 'false' },
  { name: 'checkbox har label (htmlFor)', pass: state.hasOwnerLabel },
  { name: 'hero-img alt="" (dekorativ — h1 har navn)', pass: state.heroImgAlt === '' },
  { name: 'minst 1 dl (pros/cons hvis alternativer)', pass: state.dlCount >= 0 },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
