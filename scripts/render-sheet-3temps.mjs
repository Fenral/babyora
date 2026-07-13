#!/usr/bin/env node
/* F28.18: Render Påkledning-sheet med EKTE temp-overrides via debug
 * URL-param. Bruker ?temp=N&cond=X på Forsiden så ALT (gradient, temp-
 * tekst, condition, plagg-anbefaling) endres synkront når temp endrer.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';

const CASES = [
  { name: 'cold', temp: -6, cond: 'snow' },
  { name: 'mild', temp: 14, cond: 'partlycloudy_day' },
  { name: 'warm', temp: 28, cond: 'fair_day' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const c of CASES) {
  const url = `${BASE}?seed=demo&temp=${c.temp}&cond=${c.cond}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator('button, a').filter({ hasText: /Se p[åa]kledning/ }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `verify/paakledning-f28-20-${c.name}.png` });
  console.log(`saved ${c.name} (${c.temp}°)`);
  // Close sheet for next iteration
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

await browser.close();
