#!/usr/bin/env node
/* F28.11.r1 Self-Verify Browser Protocol — OnboardingScreenInstrument. */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Onboarding Self-Verify → ${BASE_URL}\n`);

const HEADLESS = process.env.HEADLESS !== '0';
const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
// Clear localStorage to trigger onboarding
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const step1 = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Fremgang i oppsett"]');
  const lis = nav?.querySelectorAll('li');
  const currentLi = nav?.querySelector('li[aria-current="step"]');
  const h1 = document.querySelector('h1');
  const nameInput = document.querySelector('input[id="onb-name"]');
  const submitBtn = document.querySelector('button[type="submit"]');
  return {
    hasNav: !!nav,
    stepCount: lis?.length,
    currentLabel: currentLi?.getAttribute('aria-label'),
    h1Text: h1?.textContent?.trim(),
    h1Focused: h1 === document.activeElement,
    hasNameInput: !!nameInput,
    nameAutocomplete: nameInput?.getAttribute('autocomplete'),
    submitBtnLabel: submitBtn?.getAttribute('aria-label') ?? submitBtn?.textContent?.trim(),
  };
});
console.log('— STEG 1 —');
console.log(JSON.stringify(step1, null, 2));
await page.screenshot({ path: `${OUT}/onboarding-step1.png`, fullPage: false });

// Try submit without name → should show error
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(300);
const validation = await page.evaluate(() => {
  const input = document.querySelector('input[id="onb-name"]');
  const live = document.querySelector('[aria-live="polite"]');
  return {
    invalid: input?.getAttribute('aria-invalid'),
    errVisible: live?.textContent?.trim().length ?? 0 > 0,
  };
});
console.log('\n— STEG 1 (empty submit) —');
console.log(JSON.stringify(validation, null, 2));

// Fill name and go to step 2
await page.locator('input[id="onb-name"]').fill('Lillian');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(400);

const step2 = await page.evaluate(() => {
  const currentLi = document.querySelector('li[aria-current="step"]');
  const h1 = document.querySelector('h1');
  const dobInput = document.querySelector('input[id="onb-dob"]');
  return {
    currentLabel: currentLi?.getAttribute('aria-label'),
    h1Contains: /Lillian/.test(h1?.textContent ?? ''),
    h1Focused: h1 === document.activeElement,
    hasDobInput: !!dobInput,
  };
});
console.log('\n— STEG 2 —');
console.log(JSON.stringify(step2, null, 2));
await page.screenshot({ path: `${OUT}/onboarding-step2.png`, fullPage: false });

// Fill DOB and proceed to step 3
await page.locator('input[id="onb-dob"]').fill('2024-06-15');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(400);

const step3 = await page.evaluate(() => {
  const currentLi = document.querySelector('li[aria-current="step"]');
  const h1 = document.querySelector('h1');
  const gpsBtn = document.querySelector('button[aria-describedby="onb-gps-hjelp"]');
  const cityInput = document.querySelector('input[id="onb-city"]');
  const safetySection = document.querySelector('section[aria-labelledby="onb-safety-h"]');
  const ackCheckbox = safetySection?.querySelector('input[type="checkbox"]');
  return {
    currentLabel: currentLi?.getAttribute('aria-label'),
    h1Text: h1?.textContent?.trim(),
    hasGpsBtn: !!gpsBtn,
    hasCityInput: !!cityInput,
    hasSafetySection: !!safetySection,
    hasAckCheckbox: !!ackCheckbox,
  };
});
console.log('\n— STEG 3 —');
console.log(JSON.stringify(step3, null, 2));
await page.screenshot({ path: `${OUT}/onboarding-step3.png`, fullPage: false });

const checks = [
  { name: 'STEG 1: nav m/ aria-label', pass: step1.hasNav },
  { name: 'STEG 1: 3 steps', pass: step1.stepCount === 3 },
  { name: 'STEG 1: aria-current på første', pass: /Steg 1 av 3/.test(step1.currentLabel ?? '') },
  { name: 'STEG 1: h1 inneholder navn-spørsmål', pass: /heter/i.test(step1.h1Text ?? '') },
  { name: 'STEG 1: h1 har fokus etter mount', pass: step1.h1Focused },
  { name: 'STEG 1: input autocomplete=given-name', pass: step1.nameAutocomplete === 'given-name' },
  { name: 'STEG 1: feilmelding via aria-live polite (ikke role=alert)', pass: validation.invalid === 'true' },
  { name: 'STEG 2: aria-current på andre', pass: /Steg 2 av 3/.test(step2.currentLabel ?? '') },
  { name: 'STEG 2: h1 referer til navn (Lillian)', pass: step2.h1Contains },
  { name: 'STEG 2: h1 fokuseres ved steg-bytte', pass: step2.h1Focused },
  { name: 'STEG 2: date-input', pass: step2.hasDobInput },
  { name: 'STEG 3: aria-current på tredje', pass: /Steg 3 av 3/.test(step3.currentLabel ?? '') },
  { name: 'STEG 3: h1 inneholder bor-spørsmål', pass: /bor/i.test(step3.h1Text ?? '') },
  { name: 'STEG 3: GPS-knapp', pass: step3.hasGpsBtn },
  { name: 'STEG 3: city-input', pass: step3.hasCityInput },
  { name: 'STEG 3: safety-section m/ aria-labelledby', pass: step3.hasSafetySection },
  { name: 'STEG 3: ack-checkbox', pass: step3.hasAckCheckbox },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
