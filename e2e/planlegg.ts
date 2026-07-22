import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';
import { PLANLEGG_E2E_FIXTURES, type PlanleggE2EFixture } from './fixtures/planlegg.js';

const PORT = 4191;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SUPPORTED_CASES = Object.keys(PLANLEGG_E2E_FIXTURES);

function parseCase(argv: readonly string[]): string {
  const inline = argv.find((value) => value.startsWith('--case='));
  const flagIndex = argv.indexOf('--case');
  const selected = inline?.slice('--case='.length) ?? (flagIndex >= 0 ? argv[flagIndex + 1] : undefined);

  if (!selected || !(selected in PLANLEGG_E2E_FIXTURES)) {
    throw new Error(
      `Ukjent eller manglende --case ${selected ?? '(mangler)'}. Støttede case: ${SUPPORTED_CASES.join(', ')}`,
    );
  }
  return selected;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview-prosessen starter fortsatt.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
}

function collectFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/i.test(message.text())) {
      failures.push(`console.error: ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (!/\/api\/forecast|met\.no/i.test(request.url())) {
      failures.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !/\/api\/forecast/.test(response.url())) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

async function runHarness(page: Page, fixture: PlanleggE2EFixture): Promise<void> {
  const failures = collectFailures(page);
  await page.goto(`${BASE_URL}${fixture.path}`, { waitUntil: 'domcontentloaded' });

  const main = page.locator('main');
  await main.waitFor({ state: 'visible', timeout: 15_000 });
  const mainCount = await main.count();
  if (mainCount !== 1) {
    throw new Error(`Forventet nøyaktig ett app-eid main-landemerke, fant ${mainCount}`);
  }

  const navigation = page.getByRole('navigation').first();
  await navigation.waitFor({ state: 'visible', timeout: 15_000 });
  for (const label of ['Hjem', 'Planlegg', 'Guide', 'Familie']) {
    const item = navigation.getByRole('button', { name: new RegExp(`^${label}`) });
    await item.waitFor({ state: 'visible', timeout: 10_000 });
  }

  await page.waitForTimeout(250);
  if (failures.length > 0) {
    throw new Error(`Browserfeil:\n  ${failures.join('\n  ')}`);
  }
}

async function main(): Promise<void> {
  const caseName = parseCase(process.argv.slice(2));
  const fixture = PLANLEGG_E2E_FIXTURES[caseName as keyof typeof PLANLEGG_E2E_FIXTURES];
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;

  try {
    server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    await waitForServer(BASE_URL);

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: fixture.viewport,
      timezoneId: fixture.timeZone,
    });
    const page = await context.newPage();
    await runHarness(page, fixture);
    await context.close();

    console.log(`PLANLEGG HARNESS PASS: case=${caseName} fixture=${fixture.id}`);
  } finally {
    await browser?.close();
    if (server && !server.killed) server.kill();
  }
}

main().catch((error) => {
  console.error(`PLANLEGG HARNESS FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
