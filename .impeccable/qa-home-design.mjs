import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { forecastPartlyCloudy1C } from '../e2e/fixtures/forecast-1c-partlycloudy.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const server = spawn(process.execPath, [vite, 'preview', '--port', '4317', '--strictPort'], {
  stdio: 'ignore',
});

for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    if ((await fetch('http://localhost:4317')).ok) break;
  } catch {
    // Preview is not accepting connections yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const browser = await chromium.launch();
const cases = [
  { name: 'home-320', width: 320, height: 667, safeTop: 20, safeBottom: 0, detail: false },
  { name: 'home-393', width: 393, height: 852, safeTop: 59, safeBottom: 34, detail: false },
  { name: 'detail-393', width: 393, height: 852, safeTop: 59, safeBottom: 34, detail: true },
];

for (const current of cases) {
  const page = await browser.newPage({
    viewport: { width: current.width, height: current.height },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  await page.addInitScript(([safeTop, safeBottom]) => {
    addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = `.hjem-monter{padding-top:max(24px, calc(${safeTop}px + 12px)) !important}
        :root{--dw-tabbar-clearance:calc(90px + ${safeBottom}px)}`;
      document.head.append(style);
    });
  }, [current.safeTop, current.safeBottom]);
  await page.route('**/api/forecast*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(forecastPartlyCloudy1C()),
  }));
  await page.goto('http://localhost:4317/?seed=demo');
  await page.locator('.hjm-journey-rail[data-loop-ready="true"]').waitFor({ state: 'visible' });
  if (current.detail) {
    await page.locator('.hjm-journey-progress-side--end .hjm-journey-nav-button').click();
    await page.waitForTimeout(700);
  }
  const path = `C:/Users/siver/AppData/Local/Temp/${current.name}.png`;
  await page.screenshot({ path });
  console.log(path);
  await page.close();
}

await browser.close();
server.kill();
