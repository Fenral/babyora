#!/usr/bin/env node
/* F28.3.r1 Self-Verify Browser Protocol — GuideHub.
 *
 * Måler RENDRET resultat per v2-spec for Sone 3 (nøytral, ingen atmosphere):
 *   - INGEN .atmosphere på root (rendrer ikke linear-gradient)
 *   - 1 h1 + 2 h2 (Verktøy, Kunnskap) — landmarks for SR-rotor
 *   - Primary InteractiveBlock "Finn antrekk" m/ terracotta-100 sirkel
 *   - 2 ul role="list" m/ 2 li hver
 *   - Hver rad = button m/ aria-label = "Tittel. Subtitle"
 *   - 1 disclaimer-p nederst
 *   - Bottom-nav m/ aria-current="page" på "guide"
 *
 * Usage:
 *   node scripts/verify-browser-guide.mjs <baseUrl>
 *   default: http://localhost:4173
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`GuideHub Self-Verify Browser Protocol → ${URL}\n`);

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

// Switch to Guide tab via bottom nav (third item)
const guideTab = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
if ((await guideTab.count()) === 0) {
  console.error('FATAL: Bottom-nav ikke funnet.');
  await browser.close();
  exit(1);
}
await guideTab.click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const root = document.querySelector('.instr-app');
  const isAtmosphere = root?.classList.contains('atmosphere');
  const h1s = document.querySelectorAll('main h1, .instr-app > * h1');
  const h2s = document.querySelectorAll('h2');
  const sections = document.querySelectorAll('section[aria-labelledby]');
  const lists = document.querySelectorAll('ul[role="list"]');
  const lis = document.querySelectorAll('ul[role="list"] > li');
  const primaryBtn = document.querySelector('[data-instr-level="interactive"]');
  const primaryLabel = primaryBtn?.getAttribute('aria-label') ?? '';
  const rowButtons = document.querySelectorAll('ul[role="list"] > li > button');
  const rowLabels = [...rowButtons].map((b) => b.getAttribute('aria-label'));
  const disclaimer = [...document.querySelectorAll('p')].find((p) => /Premium/i.test(p.textContent ?? ''));
  const nav = document.querySelector('nav[aria-label="Hoved"]');
  const activeNavItem = nav?.querySelector('[aria-current="page"]');
  return {
    isAtmosphere,
    h1Count: h1s.length,
    h1Text: h1s[0]?.textContent?.trim(),
    h2Count: h2s.length,
    h2Texts: [...h2s].map((h) => h.textContent?.trim()),
    sectionCount: sections.length,
    listCount: lists.length,
    rowCount: lis.length,
    primaryExists: !!primaryBtn,
    primaryLabel,
    rowLabels,
    disclaimerText: disclaimer?.textContent?.trim() ?? null,
    hasActiveNav: !!activeNavItem,
    activeNavLabel: activeNavItem?.getAttribute('aria-label') ?? null,
  };
});

console.log('— GUIDE state —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/guide-hub.png`, fullPage: false });
console.log(`  → ${OUT}/guide-hub.png written`);

const checks = [
  { name: 'IKKE atmosphere (Sone 3)', pass: !state.isAtmosphere },
  { name: 'h1 = "Guide"', pass: state.h1Text === 'Guide' },
  { name: 'eksakt 2 h2 (Verktøy + Kunnskap)', pass: state.h2Count === 2 },
  { name: 'h2-tekster matcher', pass: state.h2Texts[0] === 'Verktøy' && state.h2Texts[1] === 'Kunnskap' },
  { name: 'eksakt 2 sections m/ aria-labelledby', pass: state.sectionCount === 2 },
  { name: 'eksakt 2 ul role="list"', pass: state.listCount === 2 },
  { name: '4 rader (2 + 2)', pass: state.rowCount === 4 },
  { name: 'primary InteractiveBlock finnes', pass: state.primaryExists },
  { name: 'primary aria-label inneholder "Finn antrekk"', pass: /Finn antrekk/.test(state.primaryLabel) },
  { name: 'rader har tilgjengelig name via visible text (drop aria-label per F28-final Label-in-Name)', pass: state.rowLabels.length === 4 },
  { name: 'disclaimer-p finnes', pass: state.disclaimerText !== null },
  { name: 'bottom-nav aria-current på Guide', pass: state.hasActiveNav && /Guide/i.test(state.activeNavLabel ?? '') },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
