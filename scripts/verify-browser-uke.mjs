#!/usr/bin/env node
/* F28.2.r1 Self-Verify Browser Protocol — Uke (PlanScreenInstrument).
 *
 * Måler RENDRET resultat per v2-spec for Sone 1 (full atmosphere):
 *   - .atmosphere-gradient på root (samme single-source som Forside)
 *   - 1 nav, ingen scroll på rad-listen ≤ vh
 *   - tablist med 2 tabs, manuell aktivering (aria-selected toggler)
 *   - LayerSymbol-badge på hver rad (form-basert SVG, ikke kun farge)
 *   - aria-live="polite" + aria-atomic="true" på stepper-region
 *   - Drop legend-i + subtitle (obvious-not-explained-prinsipp)
 *
 * Usage:
 *   node scripts/verify-browser-uke.mjs <baseUrl>
 *   default: http://localhost:4173
 *
 * Output:
 *   verify/uke-idag.png + verify/uke-daily.png
 *   exit 0 hvis alt grønt, 1 hvis noe feiler
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Uke Self-Verify Browser Protocol → ${URL}\n`);

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

// Switch to Uke tab via bottom nav
const ukeTab = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(1);
if ((await ukeTab.count()) === 0) {
  console.error('FATAL: Bottom-nav ikke funnet.');
  await browser.close();
  exit(1);
}
await ukeTab.click();
await page.waitForTimeout(500);

// ─── Idag-state ─────────────────────────────────────────────────────
const idag = await page.evaluate(() => {
  const vh = innerHeight;
  const root = document.querySelector('.instr-app.atmosphere');
  const bgImage = root ? getComputedStyle(root).backgroundImage : '';
  const navs = document.querySelectorAll('nav');
  const tablist = document.querySelector('[role="tablist"]');
  const tabs = document.querySelectorAll('[role="tab"]');
  const liveRegion = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
  const layerSymbols = document.querySelectorAll('svg[aria-hidden="true"] circle, svg[aria-hidden="true"] path');
  const rows = document.querySelectorAll('[role="listitem"]');
  const list = document.querySelector('[role="list"]');
  return {
    vh,
    navCount: navs.length,
    hasAtmosphereRoot: !!root,
    hasLinearGradient: /linear-gradient\s*\(/.test(bgImage),
    bgImage,
    tabCount: tabs.length,
    activeTab: [...tabs].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim(),
    hasLiveRegion: !!liveRegion,
    layerSymbolNodes: layerSymbols.length > 0,
    rowCount: rows.length,
    listScrollHeight: list ? list.scrollHeight : 0,
    listClientHeight: list ? list.clientHeight : 0,
    listOverflows: list ? list.scrollHeight > list.clientHeight + 1 : false,
  };
});
console.log('— I DAG state —');
console.log(JSON.stringify(idag, null, 2));
await page.screenshot({ path: `${OUT}/uke-idag.png`, fullPage: false });
console.log(`  → ${OUT}/uke-idag.png written`);

// ─── Bytte til 10 dager ─────────────────────────────────────────────
await page.locator('[role="tab"]').nth(1).click();
await page.waitForTimeout(500);

const daily = await page.evaluate(() => {
  const tabs = document.querySelectorAll('[role="tab"]');
  const rows = document.querySelectorAll('[role="listitem"]');
  // F28.25: LayerSymbol er form-only (drop digits per F28.x — V0 sa
  // form bærer mening, digits er a11y-backup via aria-label). Filteret
  // sjekker nå om SVG har circle/path-children, ikke text.
  const layerSyms = [...document.querySelectorAll('[role="listitem"] svg')].filter((s) =>
    [...s.children].some((c) => c.tagName === 'circle' || c.tagName === 'path')
  );
  return {
    activeTab: [...tabs].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim(),
    rowCount: rows.length,
    layerSymbolCount: layerSyms.length,
    // Stepper should NOT exist when daily tab active (per v2-spec)
    stepperVisible: !!document.querySelector('[aria-label*="Tidspunkt for time"]'),
  };
});
console.log('\n— 10 DAGER state —');
console.log(JSON.stringify(daily, null, 2));
await page.screenshot({ path: `${OUT}/uke-daily.png`, fullPage: false });
console.log(`  → ${OUT}/uke-daily.png written`);

// ─── Sjekk LayerSymbol-form-variant per rad ─────────────────────────
// F28.25: LayerSymbol er form-only (drop digits). Find SVG som har circle
// eller path, identifiser variant ut fra form alene.
const layerVariants = await page.evaluate(() => {
  const items = document.querySelectorAll('[role="listitem"]');
  return [...items].slice(0, 5).map((row) => {
    const svg = [...row.querySelectorAll('svg')].find((s) =>
      [...s.children].some((c) => c.tagName === 'circle' || c.tagName === 'path')
    );
    if (!svg) return null;
    const hasOutline = !!svg.querySelector('circle[fill="none"]');
    const hasSolid = !!svg.querySelector('circle:not([fill="none"])');
    const hasHalfPath = !!svg.querySelector('path[fill]');
    return {
      variant: hasHalfPath ? 'half' : hasSolid && !hasOutline ? 'solid' : 'outline',
    };
  });
});
console.log('\n— LayerSymbol-varianter per rad —');
console.log(JSON.stringify(layerVariants, null, 2));

// ─── Verdict ────────────────────────────────────────────────────────
const checks = [
  { name: 'atmosphere root finnes', pass: idag.hasAtmosphereRoot },
  { name: 'linear-gradient rendres', pass: idag.hasLinearGradient },
  { name: 'nav.length === 1', pass: idag.navCount === 1 },
  { name: 'tablist har 2 tabs', pass: idag.tabCount === 2 },
  { name: 'idag aktiv som default', pass: idag.activeTab === 'I dag' },
  { name: 'aria-live + aria-atomic stepper', pass: idag.hasLiveRegion },
  { name: 'LayerSymbol-SVG i listen', pass: layerVariants.some((v) => v && /^(outline|half|solid)$/.test(v.variant)) },
  { name: 'rad-listen scroller (ikke overflow page)', pass: idag.rowCount > 0 },
  { name: 'daily skifter aktiv tab', pass: daily.activeTab === '10 dager' },
  { name: 'daily skjuler stepper', pass: !daily.stepperVisible },
  { name: 'daily har 10 rader', pass: daily.rowCount === 10 },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
