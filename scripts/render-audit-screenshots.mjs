#!/usr/bin/env node
/* F35: Render screenshots av alle 11 F28-skjermer for audit-mock.
 * Output: wool-app/public/audit-mock/screenshots/{id}.png (390×844)
 *
 * Bruk:
 *   node scripts/render-audit-screenshots.mjs [baseUrl]
 *   default: http://127.0.0.1:4173
 *
 * Krever preview-server kjører.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit, argv } from 'node:process';

const BASE = argv[2] ?? 'http://127.0.0.1:4173';
const OUT = 'public/audit-mock/screenshots';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Skjerm-rutene: navn → URL-rute eller naviger-action
const SCREENS = [
  { id: 'forsiden', url: `${BASE}/?seed=demo`, prep: null },
  {
    id: 'paakledning',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const cta = page.locator('button, a').filter({ hasText: /Se p[åa]kledning/ }).first();
      await cta.click();
      await page.waitForTimeout(500);
    },
  },
  {
    id: 'uke',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      // Klikk Uke i bottom-nav (2. ikon)
      const ukeBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(1);
      await ukeBtn.click();
      await page.waitForTimeout(500);
    },
  },
  {
    id: 'guide',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(500);
    },
  },
  {
    id: 'innstillinger',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const gear = page.locator('button[aria-label*="Innstillinger" i], a[aria-label*="Innstillinger" i]').first();
      if ((await gear.count()) > 0) {
        await gear.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: 'plaggbib',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(300);
      const plaggbib = page.locator('button, a').filter({ hasText: /Plaggbiblioteket/ }).first();
      if ((await plaggbib.count()) > 0) {
        await plaggbib.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: 'plagg-detalj',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(300);
      const plaggbib = page.locator('button, a').filter({ hasText: /Plaggbiblioteket/ }).first();
      if ((await plaggbib.count()) > 0) {
        await plaggbib.click();
        await page.waitForTimeout(400);
        // Klikk første plagg
        const firstPlagg = page.locator('.plagg-card').first();
        if ((await firstPlagg.count()) > 0) {
          await firstPlagg.click();
          await page.waitForTimeout(500);
        }
      }
    },
  },
  {
    id: 'finn-antrekk',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(300);
      const finn = page.locator('button, a').filter({ hasText: /Finn antrekk/ }).first();
      if ((await finn.count()) > 0) {
        await finn.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: 'varm-kald',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(300);
      const vk = page.locator('button, a').filter({ hasText: /Varm.*kald/ }).first();
      if ((await vk.count()) > 0) {
        await vk.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: 'tog',
    url: `${BASE}/?seed=demo`,
    prep: async (page) => {
      const guideBtn = page.locator('nav[aria-label="Hoved"] a, nav[aria-label="Hoved"] button').nth(2);
      await guideBtn.click();
      await page.waitForTimeout(300);
      const tog = page.locator('button, a').filter({ hasText: /TOG/ }).first();
      if ((await tog.count()) > 0) {
        await tog.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: 'onboarding',
    url: `${BASE}/?seed=onboarding`, // forutsetter at seed kan tilbakestille
    prep: async (page) => {
      // Hvis onboarding ikke kommer opp via seed, kan vi clear localStorage
      await page.evaluate(() => window.localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
    },
  },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});

for (const screen of SCREENS) {
  const page = await ctx.newPage();
  try {
    await page.goto(screen.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    if (screen.prep) await screen.prep(page);
    await page.screenshot({ path: `${OUT}/${screen.id}.png`, fullPage: false });
    console.log(`✓ ${screen.id}.png`);
  } catch (e) {
    console.log(`✗ ${screen.id}: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(`\nFerdig — ${SCREENS.length} screenshots i ${OUT}/`);
exit(0);
