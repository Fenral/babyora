/**
 * verify-launch.mjs — verifiserer Babyoras WEB launch-handoff.
 *
 * Native launch har egne plattformressurser og valideres ikke her. Denne
 * porten åpner den bygde webappen i en ekte nettleser og måler at:
 *
 * - første frame har riktig temalerret;
 * - avatar, vær og ordmerke er lastet, synlige og innenfor små skjermer;
 * - ordmerket er sentrert og har samme geometri i lyst og mørkt tema;
 * - flaten slipper når React har malt, uten kunstig visningstid.
 *
 * Kjør etter build: `npm run build && node tools/verify-launch.mjs`.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

async function ledigPort() {
  const net = await import('node:net');
  return new Promise((res) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
  });
}

const PORT = await ledigPort();
const BASE = `http://localhost:${PORT}`;
const server = spawn(
  process.execPath,
  [VITE, 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore' },
);

let serverKlar = false;
for (let i = 0; i < 100; i += 1) {
  try {
    if ((await fetch(BASE)).ok) {
      serverKlar = true;
      break;
    }
  } catch {
    /* preview er ikke oppe ennå */
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}

if (!serverKlar) {
  server.kill();
  throw new Error('Vite preview startet ikke. Kjør npm run build først.');
}

const browser = await chromium.launch();
const { forecastPartlyCloudy1C } = await import('../e2e/fixtures/forecast-1c-partlycloudy.js');

const LERRET = { dark: [30, 20, 12], light: [249, 245, 235] };
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];
const TEMAER = ['dark', 'light'];
const naer = (a, b, slakk = 10) => a.every((v, i) => Math.abs(v - b[i]) <= slakk);

const funn = [];
let feil = 0;
const meld = (ok, tekst) => {
  if (!ok) feil += 1;
  funn.push(`  ${ok ? '✓' : '✗'} ${tekst}`);
};

const rektangelTekst = (r) => (
  r === null
    ? 'mangler'
    : `${r.width.toFixed(1)}×${r.height.toFixed(1)} @ ${r.left.toFixed(1)},${r.top.toFixed(1)}`
);

const innenfor = (r, viewport) => (
  r !== null
  && r.left >= -0.5
  && r.top >= -0.5
  && r.right <= viewport.width + 0.5
  && r.bottom <= viewport.height + 0.5
);

const wordmarkGeometri = new Map();

try {
  /* Statisk måling: stans appskriptet slik at React ikke rekker å fjerne
     #launch mens vi måler. Inline tema- og launch-CSS kjører fortsatt. */
  for (const viewport of VIEWPORTS) {
    for (const tema of TEMAER) {
      const p = await browser.newPage({
        viewport,
        deviceScaleFactor: 1,
        colorScheme: tema,
        /* Mål sluttgeometri uten at 520 ms inngangen gjør tid til en variabel. */
        reducedMotion: 'reduce',
      });
      await p.route('**/*', (route) => {
        if (route.request().resourceType() === 'script') {
          return route.abort();
        }
        return route.continue();
      });

      await p.goto(BASE, { waitUntil: 'commit' });

      const forste = await p.screenshot({
        clip: { x: 0, y: 0, width: viewport.width, height: 60 },
      });
      const { data } = await sharp(forste).raw().toBuffer({ resolveWithObject: true });
      const piksel = [data[0], data[1], data[2]];
      const scenario = `${tema} ${viewport.width}×${viewport.height}`;

      meld(
        naer(piksel, LERRET[tema]),
        `${scenario}: første web-frame er temalerretet — rgb(${piksel.join(',')})`,
      );

      await p.waitForLoadState('domcontentloaded');
      await p.waitForFunction(() => {
        const bilder = [...document.querySelectorAll('#launch img')];
        return bilder.length >= 3 && bilder.every((img) => img.complete && img.naturalWidth > 0);
      }, { timeout: 5000 });

      const geometri = await p.evaluate(() => {
        const rect = (el) => {
          if (el === null) return null;
          const r = el.getBoundingClientRect();
          return {
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const lastet = (el) => {
          if (el === null) return false;
          const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
          return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
        };
        const synligOrdmerke = [...document.querySelectorAll('[data-launch-wordmark]')]
          .find((el) => getComputedStyle(el).display !== 'none') ?? null;

        const avatar = document.querySelector('[data-launch-avatar]');
        const hand = document.querySelector('[data-launch-hand]');
        const weather = document.querySelector('[data-launch-weather]');
        const signboard = document.querySelector('[data-launch-signboard]');
        const hero = document.querySelector('[data-launch-hero]');
        return {
          launchFinnes: document.getElementById('launch') !== null,
          hero: rect(hero),
          avatar: { rect: rect(avatar), lastet: lastet(avatar) },
          harEkstraHandlag: hand !== null,
          weather: { rect: rect(weather), lastet: lastet(weather) },
          signboard: { rect: rect(signboard), lastet: lastet(signboard) },
          wordmark: { rect: rect(synligOrdmerke), lastet: lastet(synligOrdmerke) },
          layerOrder: {
            avatar: Number(getComputedStyle(avatar).zIndex),
            weather: Number(getComputedStyle(weather).zIndex),
          },
        };
      });

      meld(geometri.launchFinnes, `${scenario}: web-åpningsflaten finnes`);
      for (const [navn, element] of [
        ['avatar', geometri.avatar],
        ['navneskilt', geometri.signboard],
        ['vær', geometri.weather],
        ['ordmerke', geometri.wordmark],
      ]) {
        const harFlate = element.rect !== null && element.rect.width > 0 && element.rect.height > 0;
        meld(
          harFlate && element.lastet,
          `${scenario}: ${navn} er lastet med flate (${rektangelTekst(element.rect)})`,
        );
        meld(
          innenfor(element.rect, viewport),
          `${scenario}: ${navn} er helt innenfor viewporten`,
        );
      }

      meld(
        !geometri.harEkstraHandlag,
        `${scenario}: ingen duplisert haand kan males foran skyen`,
      );

      const merke = geometri.wordmark.rect;
      const senterAvvik = merke === null
        ? Number.POSITIVE_INFINITY
        : Math.abs((merke.left + merke.width / 2) - viewport.width / 2);
      meld(
        senterAvvik <= 1,
        `${scenario}: ordmerket er sentrert (avvik ${Number.isFinite(senterAvvik) ? senterAvvik.toFixed(2) : '?'} px)`,
      );

      const avatar = geometri.avatar.rect;
      const weather = geometri.weather.rect;
      const signboard = geometri.signboard.rect;
      const weatherCenterX = weather === null
        ? Number.NEGATIVE_INFINITY
        : weather.left + weather.width / 2;
      const weatherIHand = avatar !== null && weather !== null
        && weatherCenterX >= avatar.left + avatar.width * 0.86
        && weatherCenterX <= avatar.right + avatar.width * 0.02
        && weather.bottom >= avatar.top + avatar.height * 0.82
        && weather.bottom <= avatar.top + avatar.height * 0.89;
      meld(weatherIHand, `${scenario}: vaermotivet lander geometrisk i den aapne haanden`);

      const lag = geometri.layerOrder;
      meld(
        lag.avatar < lag.weather,
        `${scenario}: skyen ligger foran tommelen`,
      );

      const barnOverSkilt = avatar !== null && signboard !== null
        && signboard.top > avatar.top + avatar.height * 0.75
        && signboard.top < avatar.bottom
        && signboard.bottom > avatar.bottom;
      meld(barnOverSkilt, `${scenario}: barnet overlapper navneskiltets toppkant`);

      const vmax = Math.max(viewport.width, viewport.height);
      const ventetHero = Math.min(0.3807 * vmax, 0.88 * viewport.width, 360);
      const ventetOrdmerke = ventetHero * (460 / 980);
      const nativeParitet = geometri.hero !== null && merke !== null
        && Math.abs(geometri.hero.width - ventetHero) <= 1
        && Math.abs(merke.width - ventetOrdmerke) <= 1
        && Math.abs(geometri.hero.height - ventetHero * (860 / 980)) <= 1;
      meld(
        nativeParitet,
        `${scenario}: skiltkomposisjonen følger native vmax-geometri`,
      );
      wordmarkGeometri.set(`${viewport.width}×${viewport.height}:${tema}`, merke);

      await p.close();
    }
  }

  for (const viewport of VIEWPORTS) {
    const nokkel = `${viewport.width}×${viewport.height}`;
    const dark = wordmarkGeometri.get(`${nokkel}:dark`);
    const light = wordmarkGeometri.get(`${nokkel}:light`);
    const lik = dark !== null && light !== null
      && Math.abs(dark.left - light.left) <= 0.5
      && Math.abs(dark.top - light.top) <= 0.5
      && Math.abs(dark.width - light.width) <= 0.5
      && Math.abs(dark.height - light.height) <= 0.5;
    meld(lik, `${nokkel}: ordmerkegeometrien er lik i lyst og mørkt tema`);
  }

  /* Ekte handoff: med appskriptet aktivt skal flaten slippe når React har
     malt. Vi legger ingen minimumstid på testen — raskest mulig er riktig. */
  for (const tema of TEMAER) {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: tema,
    });
    await p.route('**/api/forecast*', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()),
    }));

    const start = Date.now();
    await p.goto(BASE, { waitUntil: 'commit' });
    await p.waitForFunction(() => document.getElementById('launch') === null, { timeout: 8000 })
      .then(() => meld(true, `${tema}: web-flaten slapp etter ${Date.now() - start} ms`))
      .catch(() => meld(false, `${tema}: web-flaten ble stående — appen ser ut som den henger`));
    await p.close();
  }

  /* Query-gatet saktevisning: nøyaktig produksjonsbevegelse i 5× hastighet,
     etterfulgt av vanlig handoff. Den skal aldri lekke inn i appstarten. */
  {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await p.route('**/api/forecast*', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()),
    }));
    await p.goto(`${BASE}/?launch-preview=slow`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelector('#root > *') !== null, { timeout: 8000 });

    const previewKontrakt = await p.evaluate(() => {
      const launch = document.getElementById('launch');
      const sign = document.querySelector('[data-launch-signboard]');
      const avatar = document.querySelector('[data-launch-avatar]');
      const weather = document.querySelector('[data-launch-weather]');
      const style = (el) => getComputedStyle(el);
      return {
        mode: document.documentElement.getAttribute('data-launch-preview'),
        launchFinnes: launch !== null,
        staticNames: [style(sign).animationName, style(avatar).animationName],
        staticOpacity: [style(sign).opacity, style(avatar).opacity],
        weatherDuration: style(weather).animationDuration,
        weatherDelay: style(weather).animationDelay,
        weatherIteration: style(weather).animationIterationCount,
        weatherName: style(weather).animationName,
      };
    });
    meld(
      previewKontrakt.mode === 'slow' && previewKontrakt.launchFinnes,
      'saktevisning: query-modus holder launch-flaten etter at appen er klar',
    );
    meld(
      previewKontrakt.staticNames.every((name) => name === 'none')
        && previewKontrakt.staticOpacity.every((opacity) => opacity === '1'),
      'saktevisning: barnet og Babyora-skiltet er fullt synlige og statiske',
    );
    meld(
      previewKontrakt.weatherDuration === '2.1s'
        && previewKontrakt.weatherDelay === '0.9s'
        && previewKontrakt.weatherIteration === '1'
        && previewKontrakt.weatherName === 'launch-weather-in',
      'saktevisning: bare værets produksjonsbevegelse spilles 5× saktere',
    );

    const lesFase = async (time) => p.evaluate((currentTime) => {
      const launch = document.getElementById('launch');
      for (const animation of launch.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = currentTime;
      }
      const opacity = (selector) => Number(getComputedStyle(document.querySelector(selector)).opacity);
      return {
        sign: opacity('[data-launch-signboard]'),
        avatar: opacity('[data-launch-avatar]'),
        weather: opacity('[data-launch-weather]'),
      };
    }, time);

    const statiskFase = await lesFase(850);
    meld(
      statiskFase.sign > 0.999 && statiskFase.avatar > 0.999 && statiskFase.weather < 0.05,
      'saktevisning: bare været mangler før landingen starter',
    );
    const landingsFase = await lesFase(1400);
    meld(
      landingsFase.weather > 0.999,
      'saktevisning: skyen er ugjennomsiktig mens den lander foran tommelen',
    );
    const vaerFase = await lesFase(2950);
    meld(
      vaerFase.sign > 0.95 && vaerFase.avatar > 0.95 && vaerFase.weather > 0.5,
      'saktevisning: været lander i den statiske hånden',
    );

    const pauseVirker = await p.evaluate(() => {
      let hidden = true;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
      document.dispatchEvent(new Event('visibilitychange'));
      const paused = getComputedStyle(document.querySelector('[data-launch-weather]')).animationPlayState;
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      const running = getComputedStyle(document.querySelector('[data-launch-weather]')).animationPlayState;
      return { paused, running };
    });
    meld(
      pauseVirker.paused === 'paused' && pauseVirker.running !== 'paused',
      'saktevisning: visibilitychange pauser og fortsetter avspillingen',
    );
    await p.close();
  }

  {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    await p.route('**/api/forecast*', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()),
    }));
    const start = Date.now();
    await p.goto(`${BASE}/?launch-preview=slow`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.getElementById('launch') === null, { timeout: 8000 });
    const elapsed = Date.now() - start;
    meld(
      elapsed >= 2800 && elapsed < 5000,
      `saktevisning: slipper til appen etter faktisk væranimasjon og fade (${elapsed} ms)`,
    );
    await p.close();
  }

  {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    await p.route('**/*', (route) => {
      if (route.request().resourceType() === 'script') return route.abort();
      return route.continue();
    });
    await p.goto(`${BASE}/?launch-preview=slow`, { waitUntil: 'domcontentloaded' });
    const redusert = await p.evaluate(() => {
      const style = getComputedStyle(document.querySelector('[data-launch-weather]'));
      return { animationName: style.animationName, opacity: style.opacity };
    });
    meld(
      redusert.animationName === 'none' && redusert.opacity === '1',
      'saktevisning: Reduce Motion viser ferdig, statisk signatur',
    );
    await p.close();
  }

  {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    await p.route('**/api/forecast*', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastPartlyCloudy1C()),
    }));
    await p.goto(`${BASE}/?launch-preview=slow`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.getElementById('launch') === null, { timeout: 8000 })
      .then(() => meld(true, 'saktevisning: Reduce Motion bruker normal handoff og fanger ikke brukeren'))
      .catch(() => meld(false, 'saktevisning: Reduce Motion ble stående over appen'));
    await p.close();
  }

  /* En fast 600–3999 ms-timer ville vært kunstig merkevarevent. 4000 ms
     nødutgang og den korte DOM-oppryddingen regnes ikke som visningstid. */
  const kilde = readFileSync('src/lib/launch-handoff.ts', 'utf8');
  const timere = [...kilde.matchAll(/setTimeout\([^,]+,\s*(\d+)/gu)].map((m) => Number(m[1]));
  const mistenkelige = timere.filter((ms) => ms >= 600 && ms < 4000);
  meld(
    mistenkelige.length === 0,
    `ingen kunstig visningstid i web-handoff (fant timere: ${timere.join(', ') || 'ingen'})`,
  );
} finally {
  await browser.close();
  server.kill();
}

console.log('\n── verify-launch: web launch-handoff ──');
for (const f of funn) console.log(f);
console.log(`\n${funn.length - feil}/${funn.length} mål bestått.`);
process.exitCode = feil === 0 ? 0 : 1;
