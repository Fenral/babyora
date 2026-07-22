/**
 * R3 (2026-07-14) — E2E-røyktest: bygget app booter, rendrer og kaster
 * ingen uncaught errors. Gjenbruker playwright-devDependency-en som
 * product-audit-verktøyet allerede eier — ingen nye avhengigheter.
 *
 * Kjøres med `npm run e2e` ETTER `npm run build` (server dist/ via
 * vite preview). To scenarioer:
 *   1. Fersk bruker: onboarding-flaten rendres (main + h1).
 *   2. ?seed=demo: app-skallet rendres med bunn-nav «Hjem».
 *
 * Feil = exit 1 (CI-gate). Vær-fetch mot met.no kan feile i CI — det er en
 * håndtert app-tilstand og feiler IKKE røyktesten (kun uncaught errors gjør).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const BASE = `http://127.0.0.1:${PORT}`;
const require = createRequire(import.meta.url);
const VITE_CLI = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

function fail(msg: string): never {
  throw new Error(`SMOKE FAIL: ${msg}`);
}

async function waitForServer(url: string, server: ChildProcess, timeoutMs = 30_000): Promise<void> {
  let spawnError: Error | null = null;
  server.once('error', (error) => {
    spawnError = error;
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) {
      throw new Error(`Preview-prosessen avsluttet før oppstart med kode ${server.exitCode}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ikke oppe ennå
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`preview-server svarte ikke på ${url} innen ${timeoutMs} ms`);
}

async function waitForExit(server: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (server.exitCode !== null || server.signalCode !== null) return true;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    server.once('exit', onExit);
  });
}

async function waitForPortRelease(url: string, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Preview-port ${PORT} ble ikke frigitt innen ${timeoutMs} ms`);
}

async function stopPreviewServer(server: ChildProcess): Promise<void> {
  if (server.exitCode === null && server.signalCode === null) {
    server.kill();
    if (!(await waitForExit(server, 5_000))) {
      server.kill('SIGKILL');
      if (!(await waitForExit(server, 5_000))) {
        throw new Error('Preview-prosessen avsluttet ikke etter tvungen terminering');
      }
    }
  }
  await waitForPortRelease(BASE);
  console.log(`SMOKE PREVIEW STOPPED: port=${PORT}`);
}

async function checkPage(
  browser: Browser,
  url: string,
  assertVisible: string,
  label: string,
  inspect?: (page: Page) => Promise<void>,
): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    // «Failed to load resource»-støy dekkes presist av response-sjekken under.
    if (msg.type() === 'error' && !/Failed to load resource/i.test(msg.text())) {
      errors.push(`console.error: ${msg.text()}`);
    }
  });
  page.on('response', (res) => {
    // Vær-proxyen /api/forecast finnes ikke i vite preview (serverless) —
    // manglende vær er en håndtert app-tilstand (useWeather error-state).
    // Alle ANDRE 4xx/5xx (assets, chunks) er ekte defekter i dist.
    if (res.status() >= 400 && !/\/api\/forecast/.test(res.url())) {
      errors.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try {
    await page.locator(assertVisible).first().waitFor({ state: 'visible', timeout: 15_000 });
  } catch {
    fail(`${label}: fant ikke synlig «${assertVisible}» på ${url}`);
  }

  // Nettverksfeil mot met.no er håndtert app-tilstand — filtrer bort.
  await inspect?.(page);

  const fatal = errors.filter((e) => !/met\.no|Failed to fetch|NetworkError|ERR_INTERNET|ERR_NAME/i.test(e));
  if (fatal.length > 0) {
    fail(`${label}: uncaught errors:\n  ${fatal.join('\n  ')}`);
  }
  console.log(`SMOKE OK: ${label}`);
  await page.close();
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  try {
    server = spawn(process.execPath, [VITE_CLI, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
    });
    await waitForServer(BASE, server);

    browser = await chromium.launch();
    // 1) Fersk bruker → onboarding (main-landemerke med h1 per steg)
    await checkPage(browser, BASE, 'main h1', 'onboarding rendrer', async (page) => {
      const cta = await page.getByRole('button', { name: /Fortsett/ }).boundingBox();
      const viewport = page.viewportSize();
      if (!cta || !viewport || cta.y + cta.height > viewport.height) {
        fail('onboarding: Fortsett-knappen er ikke fullt synlig ved 390x844');
      }

      const video = page.locator('.ob-baby-video');
      await video.waitFor({ state: 'attached', timeout: 5_000 });
      await page.waitForFunction(() => {
        const element = document.querySelector<HTMLVideoElement>('.ob-baby-video');
        return Boolean(element && !element.paused);
      });

      await page.locator('#ob-name-input').fill('Test');
      await page.getByRole('button', { name: /Fortsett/ }).click();
      await page.locator('.ob-baby-hero.compact .ob-baby-poster').waitFor({ state: 'visible' });
      if (await page.locator('.ob-baby-video').count()) {
        fail('onboarding: signaturvideoen skal ikke repeteres paa senere steg');
      }
      await page.getByRole('button', { name: 'Tilbake' }).click();
      await page.getByRole('heading', { name: 'Hva heter babyen?' }).waitFor();

      if (await page.locator('.ob-baby-video').count()) {
        fail('onboarding: signaturvideoen startet paa nytt etter frem og tilbake');
      }
    });

    // 2) Videoen avsluttes til det rolige stillbildet.
    const settledPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await settledPage.goto(BASE, { waitUntil: 'domcontentloaded' });
    const settledVideo = settledPage.locator('.ob-baby-video');
    await settledVideo.waitFor({ state: 'attached', timeout: 5_000 });
    await settledVideo.waitFor({ state: 'detached', timeout: 6_000 });
    await settledPage.locator('.ob-baby-poster').waitFor({ state: 'visible' });
    await settledPage.close();
    console.log('SMOKE OK: onboarding-video avsluttes til stillbilde');

    // 3) Mediefeil fjerner videoen, mens stillbildet blir staaende.
    const fallbackPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await fallbackPage.route('**/babyora-intro-v3.mp4', (route) => route.abort());
    await fallbackPage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await fallbackPage.locator('.ob-baby-poster').waitFor({ state: 'visible' });
    await fallbackPage.locator('.ob-baby-video').waitFor({ state: 'detached', timeout: 5_000 });
    await fallbackPage.close();
    console.log('SMOKE OK: onboarding-video har stillbilde-fallback');

    // 4) Demo-seed → app-skall med bunn-nav
    await checkPage(browser, `${BASE}/?seed=demo`, 'text=Hjem', 'app-skall (demo) rendrer');

    console.log('SMOKE PASS: 4/4 scenarioer grønne');
  } finally {
    try {
      await browser?.close();
    } finally {
      if (server) await stopPreviewServer(server);
    }
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
