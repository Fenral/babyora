#!/usr/bin/env node
/* F28.8.r1 Self-Verify Browser Protocol — GuideScreenInstrument (Finn antrekk). */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Finn antrekk Self-Verify Browser Protocol → ${URL}\n`);

const HEADLESS = process.env.HEADLESS !== '0';
const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('klemeg:isPremium', 'true'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Guide → Finn antrekk
await page.locator('nav[aria-label="Hoved"] button, nav[aria-label="Hoved"] a').nth(2).click();
await page.waitForTimeout(400);
await page.locator('button').filter({ hasText: /Finn antrekk/ }).first().click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const root = document.querySelector('.instr-app');
  const isAtmosphereClass = root?.classList.contains('atmosphere');
  const dataAtm = root?.getAttribute('data-atmosphere');
  const h1 = document.querySelector('h1');
  const radioGroups = document.querySelectorAll('[role="radiogroup"]');
  const radios = document.querySelectorAll('[role="radio"]');
  const ctaBtn = document.querySelector('[data-instr-level="interactive"]');
  // F28-final v3: aria-label droppet per Label-in-Name. Lese visible text via innerText.
  const ctaLabel = ctaBtn?.getAttribute('aria-label') ?? ctaBtn?.textContent ?? '';
  return {
    isAtmosphereClass,
    dataAtm,
    h1Text: h1?.textContent?.trim(),
    radioGroupCount: radioGroups.length,
    radioCount: radios.length,
    ctaLabel,
  };
});

console.log('— FINN ANTREKK (Våken) —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/finn-antrekk-vaken.png`, fullPage: false });

// Switch to Søvn-modus (should hide 3 sub-radiogroups)
const soevnTab = page.locator('[role="radio"]').filter({ hasText: /Søvn/ });
await soevnTab.click();
await page.waitForTimeout(400);

const soevnState = await page.evaluate(() => {
  const radioGroups = document.querySelectorAll('[role="radiogroup"]');
  return { radioGroupCount: radioGroups.length };
});
console.log('\n— FINN ANTREKK (Søvn) —');
console.log(JSON.stringify(soevnState, null, 2));
await page.screenshot({ path: `${OUT}/finn-antrekk-soevn.png`, fullPage: false });

const checks = [
  { name: 'IKKE .atmosphere klasse (Sone 2 tone-hint, ikke full)', pass: !state.isAtmosphereClass },
  { name: 'data-atmosphere settes (focus-ring atmosphere-aware)', pass: !!state.dataAtm },
  { name: 'h1 = Finn antrekket', pass: state.h1Text === 'Finn antrekket' },
  { name: 'Våken: 4 radiogroups (Modus + Aktivitet + Vind + Regn)', pass: state.radioGroupCount === 4 },
  { name: 'Våken: minst 11 radio-buttons', pass: state.radioCount >= 11 },
  { name: 'CTA inneholder "lag" via visible eller aria-label', pass: /lag/.test(state.ctaLabel) },
  { name: 'Søvn: 1 radiogroup (kun Modus — 3 skjult via DOM removal)', pass: soevnState.radioGroupCount === 1 },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
