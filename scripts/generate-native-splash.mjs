#!/usr/bin/env node
/**
 * Builds Babyora's launch signature from the canonical Monter character,
 * partly-cloudy weather mark, and official wordmark.
 *
 * Output is intentionally split from `resources/icon.png`: running the
 * Capacitor asset generator against `resources/native-splash` updates only
 * splash resources and can never rewrite the app icon by accident.
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_SIZE = 2732;
const LIGHT_BACKGROUND = '#F2F5F1';
// Native splash velges av operativsystemet før appens lagrede temavalg kan
// leses. Begge kilder bruker derfor produktets lyse standard, slik at en ny
// installasjon på en mørk telefon ikke blinker espresso før Mineral Garden.
const DARK_BACKGROUND = LIGHT_BACKGROUND;

const AVATAR = path.join(ROOT, 'public/monter/maskot-resultat-sveip.webp');
const WEATHER = path.join(ROOT, 'public/monter/vaer-delvis-skyet.webp');
const WORDMARK_REVERSE = path.join(ROOT, 'public/brand/babyora-wordmark-reverse.svg');

const OUTPUT_DIR = path.join(ROOT, 'resources/native-splash');

// A square source is aspect-filled by iOS. A tall iPhone exposes only the
// central ~46% of its width, while landscape exposes the central ~46% of its
// height. Every meaningful pixel stays inside this conservative center band.
const SAFE_MIN = 800;
const SAFE_MAX = SOURCE_SIZE - SAFE_MIN;
const HERO_WIDTH = 1040;
const HERO_TOP = 800;

async function trimmedPng(input, width) {
  return sharp(input)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width, withoutEnlargement: false })
    .png()
    .toBuffer();
}

async function buildSign() {
  const wordmarkSvg = await readFile(WORDMARK_REVERSE);
  const wordmark = await trimmedPng(wordmarkSvg, 460);
  const shadow = await sharp(Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="980" height="250">
      <rect x="18" y="12" width="944" height="214" rx="36" fill="#1D3E34" fill-opacity="0.18"/>
    </svg>
  `)).blur(10).png().toBuffer();
  const plate = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="980" height="250">
      <rect x="1" y="4" width="978" height="220" rx="36" fill="#164B43"
        stroke="#C9DDD5" stroke-opacity="0.72" stroke-width="2"/>
      <path d="M48 6 H932" stroke="#FAFFFD" stroke-opacity="0.34" stroke-width="2"
        stroke-linecap="round"/>
    </svg>
  `);

  return sharp({
    create: {
      width: 980,
      height: 250,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: plate, left: 0, top: 0 },
      { input: wordmark, left: 260, top: 95 },
    ])
    .png()
    .toBuffer();
}

async function buildHero() {
  // The sign is behind the child, so the lower arm hangs over its top edge.
  // Weather is painted last, directly over the avatar: the cloud stays visibly
  // in front of the thumb wherever their alpha shapes overlap.
  const avatar = await trimmedPng(AVATAR, 900);
  const weather = await trimmedPng(WEATHER, 210);
  const sign = await buildSign();
  const avatarMeta = await sharp(avatar).metadata();
  const canvasWidth = 980;
  const canvasHeight = Math.max(860, avatarMeta.height ?? 0);
  const hero = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: sign, left: 0, top: 610 },
      { input: avatar, left: 0, top: 0 },
      { input: weather, left: 735, top: 445 },
    ])
    .png()
    .toBuffer();

  return hero;
}

function assertInsideSafeBand({ left, top, width, height }, label) {
  const right = left + width;
  const bottom = top + height;
  if (left < SAFE_MIN || right > SAFE_MAX || top < SAFE_MIN - 120 || bottom > SAFE_MAX + 180) {
    throw new Error(
      `${label} escapes launch safe band: ${JSON.stringify({ left, top, right, bottom })}`,
    );
  }
}

async function buildSplash({ background, output, heroSource }) {
  const hero = await sharp(heroSource).resize({ width: HERO_WIDTH }).png().toBuffer();

  const heroMeta = await sharp(hero).metadata();
  const heroWidth = heroMeta.width ?? 0;
  const heroHeight = heroMeta.height ?? 0;
  const heroLeft = Math.round((SOURCE_SIZE - heroWidth) / 2);

  assertInsideSafeBand(
    { left: heroLeft, top: HERO_TOP, width: heroWidth, height: heroHeight },
    'launch hero',
  );

  await sharp({
    create: {
      width: SOURCE_SIZE,
      height: SOURCE_SIZE,
      channels: 4,
      background,
    },
  })
    .composite([{ input: hero, left: heroLeft, top: HERO_TOP }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);

  return {
    output: path.relative(ROOT, output),
    hero: { left: heroLeft, top: HERO_TOP, width: heroWidth, height: heroHeight },
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const heroSource = await buildHero();

  const light = await buildSplash({
    background: LIGHT_BACKGROUND,
    output: path.join(OUTPUT_DIR, 'splash.png'),
    heroSource,
  });
  const dark = await buildSplash({
    background: DARK_BACKGROUND,
    output: path.join(OUTPUT_DIR, 'splash-dark.png'),
    heroSource,
  });

  console.log('[generate-native-splash] wrote launch sources');
  console.table([light, dark]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
