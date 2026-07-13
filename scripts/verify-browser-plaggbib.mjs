#!/usr/bin/env node
/* F28.6.r1 Self-Verify Browser Protocol — PlaggbibliotekScreenInstrument. */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Plaggbib Self-Verify Browser Protocol → ${URL}\n`);

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

// Guide tab → Plaggbiblioteket
await page.locator('nav[aria-label="Hoved"] button, nav[aria-label="Hoved"] a').nth(2).click();
await page.waitForTimeout(400);
await page.locator('button').filter({ hasText: /Plaggbiblioteket/ }).first().click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const filterGroup = document.querySelector('[role="group"][aria-label*="Filtrer"]');
  const chips = filterGroup?.querySelectorAll('button[aria-pressed]') ?? [];
  const allePressed = chips[0]?.getAttribute('aria-pressed');
  const h2s = document.querySelectorAll('main h2');
  const sections = document.querySelectorAll('main section[aria-labelledby]');
  const lists = document.querySelectorAll('main ul[role="list"]');
  const cards = document.querySelectorAll('main ul[role="list"] > li > button');
  // F28-final v2: role="status" impliserer aria-live="polite".
  // Match begge attributter for å være robust mot fremtidig endring.
  const live = document.querySelector('[role="status"], [aria-live="polite"]');
  const liveText = live?.textContent ?? '';
  const backBtn = document.querySelector('button[aria-label*="Tilbake"]');
  return {
    h1Text: h1?.textContent?.trim(),
    hasFilterGroup: !!filterGroup,
    chipCount: chips.length,
    allePressed,
    h2Count: h2s.length,
    sectionCount: sections.length,
    listCount: lists.length,
    cardCount: cards.length,
    liveText,
    hasBackBtn: !!backBtn,
    firstCardAriaLabel: cards[0]?.getAttribute('aria-label') ?? '',
  };
});

console.log('— PLAGGBIB (alle) —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/plaggbib-alle.png`, fullPage: false });

// Filter on "Innerst"
await page.locator('[role="group"][aria-label*="Filtrer"] button[aria-pressed]').nth(1).click();
await page.waitForTimeout(300);
const filtered = await page.evaluate(() => {
  const h2s = document.querySelectorAll('main h2');
  const liveText = document.querySelector('[role="status"], [aria-live="polite"]')?.textContent ?? '';
  return { h2Count: h2s.length, liveText };
});
console.log('\n— PLAGGBIB (Innerst filter) —');
console.log(JSON.stringify(filtered, null, 2));
await page.screenshot({ path: `${OUT}/plaggbib-innerst.png`, fullPage: false });

const checks = [
  { name: 'h1 = Plaggbiblioteket', pass: state.h1Text === 'Plaggbiblioteket' },
  { name: 'filter-group m/ aria-label', pass: state.hasFilterGroup },
  { name: '6 chips (Alle + 5 kategorier)', pass: state.chipCount === 6 },
  { name: '"Alle" aria-pressed="true" som default', pass: state.allePressed === 'true' },
  { name: '5 h2-seksjoner ved Alle', pass: state.h2Count === 5 },
  { name: '5 sections m/ aria-labelledby', pass: state.sectionCount === 5 },
  { name: '5 ul role="list"', pass: state.listCount === 5 },
  { name: '≥10 plagg-cards totalt', pass: state.cardCount >= 10 },
  { name: 'aria-live announcement med antall', pass: /Viser.*plagg/.test(state.liveText) },
  { name: 'back-knapp finnes', pass: state.hasBackBtn },
  { name: 'card aria-label uten "åpne detaljer"', pass: !!state.firstCardAriaLabel && !/åpne detaljer/.test(state.firstCardAriaLabel) },
  { name: 'filter "Innerst" gir 1 h2', pass: filtered.h2Count === 1 },
  { name: 'filter-bytte oppdaterer aria-live', pass: /Innerst/.test(filtered.liveText) },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
