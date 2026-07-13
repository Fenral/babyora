#!/usr/bin/env node
/* F28.9 + F28.10 Self-Verify Browser Protocol — Varm/kald + TOG. */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

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

console.log(`Varm/kald Self-Verify → ${URL}`);

// Guide → Varm/kald
await page.locator('nav[aria-label="Hoved"] button, nav[aria-label="Hoved"] a').nth(2).click();
await page.waitForTimeout(400);
await page.locator('button').filter({ hasText: /Varm eller kald/ }).first().click();
await page.waitForTimeout(500);

const vk = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const h2 = document.querySelector('h2');
  const sec = document.querySelector('section[aria-labelledby]');
  const signs = document.querySelectorAll('ul[role="list"] > li');
  const overheatingCard = document.querySelector('.overheating-check, [data-component*="overheating" i]');
  return {
    h1Text: h1?.textContent?.trim(),
    h2Text: h2?.textContent?.trim(),
    hasSection: !!sec,
    signCount: signs.length,
    // OverheatingCheckCard may render any class — just check there's content below ul
  };
});
console.log('— VARM/KALD —');
console.log(JSON.stringify(vk, null, 2));
await page.screenshot({ path: `${OUT}/varm-kald.png`, fullPage: false });

// Back to Guide
await page.locator('button[aria-label*="Tilbake"]').first().click();
await page.waitForTimeout(400);

// Now navigate to TOG. TOG is accessed from Plagg-detalj when sovepose viewed.
// But in v2 GuideHub has direct TOG card. Let me click TOG-guiden.
await page.locator('button').filter({ hasText: /TOG-guiden/ }).first().click();
await page.waitForTimeout(500);

const tog = await page.evaluate(() => {
  // TogGuideScreen may not be wired from GuideHub directly — fall back to sovepose path
  const h1 = document.querySelector('h1');
  const list = document.querySelector('ul[role="list"][aria-label*="Sovepose"]');
  const items = document.querySelectorAll('ul[role="list"][aria-label*="Sovepose"] > li');
  const togBadges = [...document.querySelectorAll('main span')].filter((s) => /TOG/.test(s.textContent ?? '')).length;
  return {
    h1Text: h1?.textContent?.trim(),
    hasList: !!list,
    itemCount: items.length,
    togBadgeCount: togBadges,
  };
});
console.log('\n— TOG-guiden —');
console.log(JSON.stringify(tog, null, 2));
await page.screenshot({ path: `${OUT}/tog-guiden.png`, fullPage: false });

const checks = [
  // Varm/kald
  { name: 'VK h1 = Varm eller kald?', pass: vk.h1Text === 'Varm eller kald?' },
  { name: 'VK h2 = Kjenn på riktig sted', pass: vk.h2Text === 'Kjenn på riktig sted' },
  { name: 'VK section m/ aria-labelledby', pass: vk.hasSection },
  { name: 'VK 3 signaler', pass: vk.signCount === 3 },
  // TOG
  { name: 'TOG h1 inneholder Sovepose eller TOG', pass: /TOG|Sovepose/.test(tog.h1Text ?? '') },
  { name: 'TOG ul aria-label "Sovepose"', pass: tog.hasList },
  { name: 'TOG 7 entries', pass: tog.itemCount === 7 },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
