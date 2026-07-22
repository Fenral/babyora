import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173';
const outputDir = 'verify/onboarding-responsive';
mkdirSync(outputDir, { recursive: true });

const viewports = [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'iphone-15', width: 390, height: 844 },
  { name: 'iphone-15-pro-max', width: 430, height: 932 },
];

const browser = await chromium.launch({ headless: true });
let failures = 0;

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'dark',
    geolocation: { latitude: 63.4305, longitude: 10.3951 },
    permissions: ['geolocation'],
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.ob-screen').waitFor();

  const assertLayout = async (label) => {
    await page.waitForTimeout(400);
    const metrics = await page.evaluate(() => {
      const cta = document.querySelector('.ob-cta-zone')?.getBoundingClientRect();
      const h1 = document.querySelector('h1')?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        ctaVisible: !!cta && cta.top < window.innerHeight && cta.bottom <= window.innerHeight + 1,
        titleVisible: !!h1 && h1.top >= 0 && h1.top < window.innerHeight,
      };
    });
    const pass = !metrics.horizontalOverflow && metrics.ctaVisible && metrics.titleVisible;
    if (!pass) failures += 1;
    console.log(`${pass ? '✓' : '✗'} ${viewport.name} ${label}`, metrics);
  };

  await assertLayout('step-1');
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-1.png` });

  await page.locator('#ob-name-input').fill('Lillian');
  await page.locator('.ob-cta-zone .ob-btn-primary').click();
  await assertLayout('step-2');
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-2.png` });

  await page.locator('#ob-birth-date').fill('2024-06-15');
  await page.locator('.ob-cta-zone .ob-btn-primary').click();
  await assertLayout('step-3');
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-3.png` });

  await page.getByRole('button', { name: 'Bruk posisjonen min' }).click();
  await page.getByText('Brukes som hjemsted for dagens vær').waitFor();
  await page.locator('.ob-cta-zone .ob-btn-primary').click();
  await assertLayout('step-4');
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-4.png` });

  await page.locator('.ob-cta-zone .ob-btn-primary').click();
  await assertLayout('welcome');
  await page.screenshot({ path: `${outputDir}/${viewport.name}-welcome.png` });
  await context.close();
}

await browser.close();
process.exitCode = failures > 0 ? 1 : 0;
