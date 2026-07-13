/**
 * P6 — Playwright review-shot generator (FORBEREDT, IKKE KJØR).
 *
 * Genererer skjermbilder for Fable 5 review-loop. Per arbeidsordren
 * skal denne ALDRI startes uten eksplisitt beskjed fra Sivert.
 *
 * Kjør:
 *   npx playwright test scripts/review-shots.ts
 *
 * Output:
 *   review/shots/{timestamp}/{viewport}/{screen}.png
 *
 * Viewports:
 *   - 430×900 (iPhone 15 Pro Max)
 *   - 360×780 (smale Android)
 *
 * Skjermer:
 *   - onboarding steg 1, 2, 3
 *   - Hjem (vogn-våken, vogn-sover, utelek, bilstol på)
 *   - antrekk-siden
 *   - en plagg-side (lue eller body)
 *   - Guide-kalkulatoren (5° + vind/yr, og −10° + tørt)
 *   - Uke i dag
 *   - Uke 10 dager
 *   - Innstillinger
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SHOTS_DIR = join('review', 'shots', TIMESTAMP);

const VIEWPORTS = [
  { name: '430x900', width: 430, height: 900 },
  { name: '360x780', width: 360, height: 780 },
];

async function seedMockUser(page: Page): Promise<void> {
  await page.evaluate(() => {
    const mock = {
      children: [{
        id: 'lillian',
        name: 'Lillian',
        dob: '2025-04-15',
        city: 'Trondheim',
        lat: 63.4305,
        lon: 10.3951,
        color: '#E8643C',
        canRoll: 'yes',
      }],
      activeId: 'lillian',
    };
    window.localStorage.setItem('klemeg:children', JSON.stringify(mock.children));
    window.localStorage.setItem('klemeg:activeChildId', mock.activeId);
    window.localStorage.setItem('klemeg:onboardingComplete', '1');
  });
  await page.reload();
}

for (const vp of VIEWPORTS) {
  test.describe(`review-shots ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('onboarding steg 1-3', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await expect(page.getByText(/velkommen|navn/i).first()).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(dir, 'onb-1.png') });
      await page.getByLabel(/navn/i).fill('Lillian');
      await page.getByRole('button', { name: /neste/i }).click();
      await page.screenshot({ path: join(dir, 'onb-2.png') });
      await page.getByLabel(/fødselsdato/i).fill('2025-04-15');
      await page.getByRole('button', { name: /neste/i }).click();
      await page.screenshot({ path: join(dir, 'onb-3.png') });
    });

    test('Hjem — vogn-våken, vogn-sover, utelek, bilstol', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await seedMockUser(page);

      // Vogn-våken (default)
      await page.screenshot({ path: join(dir, 'hjem-vogn-vaken.png') });

      // Bytt til vogn-sover
      await page.evaluate(() => window.localStorage.setItem('babyora:vognMode', 'sleeping'));
      await page.reload();
      await page.screenshot({ path: join(dir, 'hjem-vogn-sover.png') });

      // Bytt til utelek
      await page.getByRole('button', { name: /utelek/i }).click();
      await page.screenshot({ path: join(dir, 'hjem-utelek.png') });

      // Bilstol toggle (tilbake til vogn)
      await page.getByRole('button', { name: /vogn/i }).click();
      await page.evaluate(() => window.localStorage.setItem('babyora:bilstol', '1'));
      await page.reload();
      await page.screenshot({ path: join(dir, 'hjem-bilstol.png') });
    });

    test('antrekk-side + plagg-side', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await seedMockUser(page);
      await page.getByRole('button', { name: /se hele antrekket|hele dagen/i }).first().click();
      await page.screenshot({ path: join(dir, 'antrekk.png') });
      // TODO: klikk inn på et plagg
    });

    test('Guide-kalkulator', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await seedMockUser(page);
      // TODO: klikk på Guide-tab, fyll inn 5° + vind + yr, screenshot
      await page.screenshot({ path: join(dir, 'guide-placeholder.png') });
    });

    test('Uke i dag + 10 dager', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await seedMockUser(page);
      await page.getByRole('button', { name: /uke/i }).click();
      await page.screenshot({ path: join(dir, 'uke-idag.png') });
      await page.getByRole('radio', { name: /10 dager/i }).click();
      await page.screenshot({ path: join(dir, 'uke-10dager.png') });
    });

    test('Innstillinger', async ({ page }) => {
      const dir = join(SHOTS_DIR, vp.name);
      mkdirSync(dir, { recursive: true });
      await page.goto('http://localhost:5173/');
      await seedMockUser(page);
      await page.getByRole('button', { name: /innstillinger/i }).click();
      await page.screenshot({ path: join(dir, 'innstillinger.png') });
    });
  });
}
