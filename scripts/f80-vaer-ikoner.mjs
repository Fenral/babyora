#!/usr/bin/env node
/* F80: 4 clay-vær-ikoner (skyet, delvis-skyet, regn, taake) — samme regler
 * som scripts/f79-sno-ikon.mjs (NO face, no text, magenta bg, chroma-key).
 * klarvaer.png og sno.png finnes fra før i public/weather-3d/.
 *
 * Resumable: hopper over ikoner som er ferdige (--force for å regenerere).
 * Exit 0 kun hvis alle fire er OK.
 *
 * Kost: 4 × ~$0.134 ≈ $0,54 ≈ ~5,6 NOK.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  try {
    API_KEY = readFileSync(
      'C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt',
      'utf8',
    ).trim();
  } catch {}
}
if (!API_KEY) { console.error('mangler GEMINI_API_KEY'); process.exit(1); }

const API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${API_KEY}`;
const OUT = join(ROOT, 'public', 'weather-3d');
const RAW = join(OUT, 'raw');
mkdirSync(RAW, { recursive: true });

const FORCE = process.argv.includes('--force');

const ICONS = [
  {
    id: 'skyet',
    subject: 'cloud',
    text: `A soft rounded clay cloud in cool off-white (#E8ECF2), plump and
friendly with gently stacked rounded lobes. NO sun, NO precipitation —
just the cloud.`,
  },
  {
    id: 'delvis-skyet',
    subject: 'sun-behind-cloud',
    text: `A soft rounded clay sun in warm golden marigold (#D9962B core,
lighter #E8B04B highlights) peeking out HALF HIDDEN behind a soft rounded
clay cloud in cool off-white (#E8ECF2). A few short rounded chunky clay
sun rays visible on the exposed side. The cloud sits in front, slightly
lower.`,
  },
  {
    id: 'regn',
    subject: 'rain-cloud',
    text: `A soft rounded clay cloud in cool off-white (#E8ECF2) with 5-6
elongated rounded clay raindrops in petrol blue (#5A8CA8) falling below
it, gently staggered at different heights.`,
  },
  {
    id: 'taake',
    subject: 'fog',
    text: `Two to three soft horizontal rounded clay fog bands in muted
grey-lavender (#B8B4C8), stacked with gentle gaps between them, softly
rounded tapered ends, slightly offset from each other.`,
  },
];

const RULES = (subject, text) => `A single volumetric 3D ${subject} icon for a premium weather app.
Soft 3D claymation render, hand-sculpted plasticine, matte material, soft
top-left studio lighting. ${text}
Gentle and calm, NO face. Centered, generous margin, square 1:1. No text,
no watermarks. The icon must never contain magenta/pink.
BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF), flat and uniform,
covering all canvas outside the icon. No gradient, no checkerboard.`;

/* Chroma-key: magenta → alpha. Standard-varianten MED tredje despill-branch
 * (mag > 15) fra f79-kald-thumbs.mjs / f79-sno-ikon.mjs. */
async function key(rawPath, outPath) {
  const { data, info } = await sharp(rawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mag = Math.min(r, b) - g;
    if (mag > 90) data[i + 3] = 0;
    else if (mag > 40) {
      data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
      const avg = Math.round((r + b) / 2);
      data[i] = Math.min(r, avg - Math.round(mag * 0.35));
      data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
    } else if (mag > 15) {
      const t = Math.round((g + Math.min(r, b)) / 2);
      data[i] = Math.min(r, t + 10);
      data[i + 2] = Math.min(b, t + 10);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
}

let failed = 0;

for (const icon of ICONS) {
  const rawPath = join(RAW, `${icon.id}-raw.png`);
  const outPath = join(OUT, `${icon.id}.png`);

  try {
    if (!FORCE && existsSync(outPath) && existsSync(rawPath)) {
      console.log(`hopper over ${icon.id} (ferdig)`);
      continue;
    }
    if (!FORCE && existsSync(rawPath)) {
      await key(rawPath, outPath);
      console.log(`re-key ${icon.id} (raw fantes, ingen API-kost)`);
      continue;
    }
    const t0 = Date.now();
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: RULES(icon.subject, icon.text) }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
    const json = await res.json();
    const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!part) throw new Error('ingen bildedata');
    writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
    await key(rawPath, outPath);
    console.log(`ok   ${icon.id}.png (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (err) {
    failed++;
    console.error(`FEIL ${icon.id}: ${err.message ?? err}`);
  }
}

if (failed) {
  console.error(`\n${failed} av ${ICONS.length} ikoner feilet — kjør på nytt (resumable).`);
  process.exit(1);
}
console.log('\nferdig: alle 4 vær-ikoner klare i public/weather-3d/ (klarvaer + sno fantes fra før).');
