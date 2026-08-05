// Fase 1 Design Lab: ferske screenshots av kjerneflytene mot bygget dist/.
// Kjøres ETTER `npm run build`. Skriver til docs/design-lab/assets/fase1/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'design-lab', 'assets', 'fase1');
mkdirSync(OUT, { recursive: true });

const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const server = spawn(process.execPath, [VITE, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT, stdio: 'ignore',
});
try {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try { const r = await fetch(BASE); if (r.ok) break; } catch {}
    if (Date.now() > deadline) throw new Error('preview startet ikke');
    await new Promise((r) => setTimeout(r, 300));
  }

  // Preview server har ingen /api/forecast (serverless) — samme fikstur som
  // e2e/purchase-flow.ts, ellers rendres aldri anbefaling/gate.
  const buildForecast = () => {
    const start = Date.now() - 60 * 60 * 1000;
    const timeseries = Array.from({ length: 10 * 24 }, (_, index) => ({
      time: new Date(start + index * 60 * 60 * 1000).toISOString(),
      data: {
        instant: {
          details: {
            air_temperature: 5, wind_speed: 2, wind_from_direction: 180,
            relative_humidity: 70, cloud_area_fraction: 40,
          },
        },
        next_1_hours: { summary: { symbol_code: 'partlycloudy_day' }, details: { precipitation_amount: 0 } },
      },
    }));
    return {
      properties: {
        meta: {
          updated_at: new Date().toISOString(),
          units: {
            air_temperature: 'celsius', wind_speed: 'm/s', wind_from_direction: 'degrees',
            relative_humidity: '%', cloud_area_fraction: '%', precipitation_amount: 'mm',
          },
        },
        timeseries,
      },
    };
  };

  const browser = await chromium.launch();
  const shoot = async (name, url, { beforeShot } = {}) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.route('**/api/forecast?**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildForecast()) }));
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2500);
    if (beforeShot) await beforeShot(page);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log(`SHOT ${name}`);
    await ctx.close();
  };

  await shoot('01-onboarding-forste', BASE);
  await shoot('02-hjem-demo-premium', `${BASE}/?seed=demo`);
  await shoot('03-plan-tab', `${BASE}/?seed=demo`, {
    beforeShot: async (p) => {
      const tab = p.locator('nav button, [role="tablist"] button, nav a').filter({ hasText: /uke|plan|frem/i }).first();
      if (await tab.count()) { await tab.click(); await p.waitForTimeout(1500); }
    },
  });
  await shoot('04-familie', `${BASE}/?seed=demo`, {
    beforeShot: async (p) => {
      const tab = p.locator('nav button, [role="tablist"] button, nav a').filter({ hasText: /familie/i }).first();
      if (await tab.count()) { await tab.click(); await p.waitForTimeout(1500); }
    },
  });
  // Paywall: økt 1 gir fritt lesevindu; reload = økt 2 → hard gate vises automatisk.
  await shoot('05-hard-paywall', `${BASE}/?seed=demo&entitlement=none`, {
    beforeShot: async (p) => { await p.reload(); await p.waitForTimeout(5000); },
  });
  await shoot('06-anbefaling-resultat', `${BASE}/?seed=demo`, {
    beforeShot: async (p) => {
      const cta = p.locator('button, a').filter({ hasText: /finn dagens antrekk/i }).first();
      if (await cta.count()) { await cta.click(); await p.waitForTimeout(4000); }
    },
  });

  await browser.close();
  console.log('FERDIG: 6 screenshots i docs/design-lab/assets/fase1/');
} finally {
  server.kill();
}
