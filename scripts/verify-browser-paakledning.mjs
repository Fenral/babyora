#!/usr/bin/env node
/* F28.5.r1 Self-Verify Browser Protocol — InstrumentLayerSheet (Påkledning). */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'http://localhost:4173';
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Påkledning Self-Verify Browser Protocol → ${URL}\n`);

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

// Click "Se påkledning" CTA on Forsiden to open the sheet
const cta = page.locator('button, a').filter({ hasText: /Se p[åa]kledning/ }).first();
if ((await cta.count()) === 0) {
  console.error('FATAL: CTA "Se påkledning" ikke funnet på Forsiden.');
  await browser.close();
  exit(1);
}
await cta.click();
await page.waitForTimeout(500);

const state = await page.evaluate(() => {
  const dlg = document.querySelector('dialog[open]');
  const dlgContainer = dlg?.querySelector('.instr-app.atmosphere');
  const titledBy = dlg?.getAttribute('aria-labelledby');
  const titleEl = titledBy ? document.getElementById(titledBy) : null;
  const ol = dlg?.querySelector('ol[aria-label]');
  const h3s = dlg?.querySelectorAll('h3') ?? [];
  // F28.17 (V0 A2): chips → inline tekst-liste; finn tilbehør-p i stedet
  const tilbeohorH3 = [...(dlg?.querySelectorAll('h3') ?? [])].find((h) => /Tilbeh/.test(h.textContent ?? ''));
  const tilbeohorTextP = tilbeohorH3?.parentElement?.querySelector('p');
  const ctaBtn = dlg?.querySelector('[data-instr-level="interactive"]');
  const ctaLabel = ctaBtn?.getAttribute('aria-label') ?? '';
  const closeBtn = dlg?.querySelector('[aria-label="Lukk lag-detaljer"]');
  return {
    dialogOpen: !!dlg,
    isAtmosphereContainer: !!dlgContainer,
    aria_labelledby: titledBy,
    titleText: titleEl?.textContent?.trim() ?? null,
    olAriaLabel: ol?.getAttribute('aria-label'),
    h3Count: h3s.length,
    h3Texts: [...h3s].map((h) => h.textContent?.trim()),
    chipUlExists: !!tilbeohorTextP,
    chipCount: tilbeohorTextP?.textContent?.split(',').length ?? 0,
    ctaExists: !!ctaBtn,
    ctaLabel,
    closeBtnExists: !!closeBtn,
  };
});

console.log('— PÅKLEDNING SHEET (open) —');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/paakledning.png`, fullPage: false });
console.log(`  → ${OUT}/paakledning.png written`);

// Press ESC to verify native dialog cancel-handler
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const afterEsc = await page.evaluate(() => !!document.querySelector('dialog[open]'));
console.log(`\n  → ESC lukker dialog: ${!afterEsc ? 'JA' : 'NEI'}`);

const checks = [
  { name: 'dialog er åpen', pass: state.dialogOpen },
  { name: 'sheet bruker .instr-app.atmosphere (Sone 1)', pass: state.isAtmosphereContainer },
  { name: 'aria-labelledby peker på title', pass: !!state.aria_labelledby && !!state.titleText },
  { name: 'title inneholder "Slik kler du"', pass: /Slik kler du/.test(state.titleText ?? '') },
  { name: 'ol m/ aria-label finnes', pass: !!state.olAriaLabel },
  { name: 'minst 3 h3 (1 per lag + Tilbehør)', pass: state.h3Count >= 3 },
  { name: 'h3 eyebrow er Ytterlag', pass: state.h3Texts[0] === 'Ytterlag' },
  { name: 'tilbehør inline tekst-liste (F28.17 V0)', pass: state.chipUlExists },
  { name: '≥1 tilbehør-element', pass: state.chipCount >= 1 },
  { name: 'CTA InteractiveBlock m/ aria-label', pass: state.ctaExists && /Klar for tur/i.test(state.ctaLabel) },
  { name: 'close-btn finnes', pass: state.closeBtnExists },
  { name: 'ESC lukker dialog', pass: !afterEsc },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
