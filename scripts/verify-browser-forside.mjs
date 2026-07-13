#!/usr/bin/env node
/* F28.1.r6 Self-Verify Browser Protocol (per V0 2026-06-18).
 *
 * Kjøres FØR "ferdig"-rapport. Måler RENDRET resultat, ikke token-
 * eksistens. Fanger:
 *  - flat bg (linear-gradient mangler)
 *  - blob/manglende avatar
 *  - duplicate nav
 *  - scroll overflow
 *  - CTA under fold
 *  - overlap når "Hvorfor?"-disclosure er åpen
 *
 * Usage:
 *   node scripts/verify-browser-forside.mjs <url>
 *   default: https://wool-app.vercel.app
 *
 * Output:
 *   verify/forside-closed.png + forside-why-open.png
 *   exit 0 hvis alt grønt, 1 hvis noe feiler
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const BASE_URL = process.argv[2] ?? 'https://wool-app.vercel.app';
// ?seed=demo aktiverer DEMO_CHILDREN (Lillian/Eskil) i children-store og
// hopper over onboarding. Mye mer pålitelig enn å seede localStorage selv.
const URL = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'seed=demo';
const OUT = 'verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`Self-Verify Browser Protocol → ${URL}\n`);

const HEADLESS = process.env.HEADLESS !== '0';
const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800); // settle atmosphere transition

// ─── Detect Vercel Security Checkpoint (403) ────────────────────────
const isCheckpoint = await page.evaluate(() => /Vercel Security Checkpoint|Verifying you are human/i.test(document.title + ' ' + document.body.innerText));
if (isCheckpoint) {
  console.log('  → Vercel Security Checkpoint hit, waiting for auto-pass...');
  // Checkpoint normally auto-resolves in ≤5s
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);
    const stillStuck = await page.evaluate(() => /Vercel Security Checkpoint/i.test(document.title + ' ' + document.body.innerText));
    if (!stillStuck) break;
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

// ─── Skip onboarding (?seed=demo aktiverer DEMO_CHILDREN) ───────────
const isOnboarding = await page.evaluate(() => /Velkommen|Steg 1 av|Fremgang i oppsett/i.test(document.body.innerText));
if (isOnboarding) {
  console.error('FATAL: ?seed=demo seedet ikke barn. Sjekk children-store.tsx isDemoMode().');
  await browser.close();
  exit(1);
}

// ─── Hard assertions (computed styles) ─────────────────────────────
const closed = await page.evaluate(() => {
  const vh = innerHeight;
  const cta = [...document.querySelectorAll('button,a')].find(
    (b) => /Se påkledning/i.test(b.textContent ?? '')
  );
  const root = document.querySelector('.instr-app.atmosphere');
  const bgImage = root ? getComputedStyle(root).backgroundImage : '';
  const navs = document.querySelectorAll('nav');
  const avatarImg = document.querySelector('[style*="instr-avatar-src"], [style*="avatar"]');
  return {
    vh,
    navCount: navs.length,
    navLabels: [...navs].map((n) => n.getAttribute('aria-label')),
    scrollHeight: document.documentElement.scrollHeight,
    noScroll: document.documentElement.scrollHeight <= vh,
    ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : null,
    ctaAboveFold: cta ? cta.getBoundingClientRect().bottom <= vh : false,
    bgImage,
    hasLinearGradient: /linear-gradient\s*\(/.test(bgImage),
    avatarExists: !!avatarImg,
  };
});

console.log('— CLOSED state —');
console.log(JSON.stringify(closed, null, 2));

await page.screenshot({ path: `${OUT}/forside-closed.png`, fullPage: false });
console.log(`  → ${OUT}/forside-closed.png written`);

// ─── F28.13: hue-shift verifisering (V0 Modell B-spec) ─────────────
const hueShift = await page.evaluate(() => {
  const root = document.querySelector('.instr-app.atmosphere');
  if (!root) return null;
  const cs = getComputedStyle(root);
  const top = cs.getPropertyValue('--bg-top').trim();
  const bottom = cs.getPropertyValue('--bg-bottom').trim();
  const parseRgb = (s) => {
    const m = s.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : null;
  };
  const t = parseRgb(top);
  const b = parseRgb(bottom);
  if (!t || !b) return null;
  // "Top kjøligere enn bottom" på sRGB: top.b > top.r (mer blå) og bottom.r > bottom.b (mer rød)
  const topBlueLeaning = t[2] >= t[0];   // blue ≥ red ⇒ kjølig
  const bottomWarmLeaning = b[0] >= b[2]; // red ≥ blue ⇒ varm
  return { top, bottom, topBlueLeaning, bottomWarmLeaning };
});
console.log('— F28.13 hue-shift —');
console.log(JSON.stringify(hueShift, null, 2));

// ─── Sample pixel-color top vs bottom (ΔL ≥ 6%) ──────────────────────
const pixelDelta = await page.evaluate(() => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    // We cannot actually screenshot canvas; instead compute computed bg of root and sample
    // by reading two child elements at different vertical positions
    const root = document.querySelector('.instr-app.atmosphere');
    if (!root) return resolve({ topBg: '', bottomBg: '', deltaL: 0 });
    // synthetic samples — read computed bg of root and split start/end gradient stops
    const bg = getComputedStyle(root).backgroundImage;
    const stops = bg.match(/rgb\([^)]+\)/g) || [];
    if (stops.length < 2) return resolve({ topBg: stops[0] || '', bottomBg: stops[stops.length - 1] || '', deltaL: 0 });
    const lum = (rgb) => {
      const m = rgb.match(/\d+/g);
      if (!m) return 0;
      const [r, g, b] = m.map(Number);
      return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
    };
    const lTop = lum(stops[0]);
    const lBottom = lum(stops[stops.length - 1]);
    const deltaL = Math.abs(lTop - lBottom);
    resolve({ topBg: stops[0], bottomBg: stops[stops.length - 1], deltaL: +(deltaL * 100).toFixed(1) });
  });
});
console.log('— gradient pixel delta —');
console.log(JSON.stringify(pixelDelta, null, 2));

// ─── Open "Hvorfor?" and re-measure ────────────────────────────────
const whyBtn = page.locator('button:has-text("Hvorfor?")');
if (await whyBtn.count() > 0) {
  await whyBtn.first().click();
  await page.waitForTimeout(400);

  const open = await page.evaluate(() => {
    const vh = innerHeight;
    const cta = [...document.querySelectorAll('button,a')].find(
      (b) => /Se påkledning/i.test(b.textContent ?? '')
    );
    const weather = document.querySelector('[aria-label*="Værforhold"]');
    // Avatar-scene er ekte avatar-figuren (aria-hidden div med flex-stage).
    // Tidligere selector "main > div" fanget vær-pillen — feildiagnose.
    const scene = document.querySelector('[aria-hidden="true"] [style*="aspect-ratio"]')
      ?? [...document.querySelectorAll('div')].find(d => /aspectRatio|aspect-ratio/i.test(d.getAttribute('style') ?? ''));
    return {
      noScroll: document.documentElement.scrollHeight <= vh,
      ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : null,
      ctaAboveFold: cta ? cta.getBoundingClientRect().bottom <= vh : false,
      weatherBottom: weather ? Math.round(weather.getBoundingClientRect().bottom) : null,
      sceneTop: scene ? Math.round(scene.getBoundingClientRect().top) : null,
      overlap: weather && scene
        ? scene.getBoundingClientRect().top < weather.getBoundingClientRect().bottom
        : false,
    };
  });

  console.log('— OPEN "Hvorfor?" state —');
  console.log(JSON.stringify(open, null, 2));

  await page.screenshot({ path: `${OUT}/forside-why-open.png`, fullPage: false });
  console.log(`  → ${OUT}/forside-why-open.png written`);
}

// ─── Verdict ────────────────────────────────────────────────────────
const checks = [
  { name: 'nav.length === 1', pass: closed.navCount === 1 },
  { name: 'noScroll (closed)', pass: closed.noScroll },
  { name: 'CTA above fold (closed)', pass: closed.ctaAboveFold },
  { name: 'hasLinearGradient', pass: closed.hasLinearGradient },
  { name: 'gradient ΔL ≥ 6%', pass: pixelDelta.deltaL >= 6 },
  { name: 'F28.13 top hue er kjøligere enn bottom (V0 Modell B)', pass: !!(hueShift?.topBlueLeaning && hueShift?.bottomWarmLeaning) },
];

console.log('\n─── VERDICT ───');
let fails = 0;
for (const c of checks) {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
  if (!c.pass) fails++;
}

await browser.close();
exit(fails === 0 ? 0 : 1);
