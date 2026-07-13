#!/usr/bin/env node
/* F79: Re-generer jakka for Morgennatt — #1E4750 drukner mot mørk
 * indigo-canvas (1,69:1). Ny tone #35707F (3,93/3,08 verst-case).
 * Regenererer: (1) produkt-thumb, (2) stage-4 (re-edit av stage-3-raw).
 * Magenta chroma-key-pipeline (samme som f79-final-pipeline.mjs).
 * Kost: 2 × ~$0.134 ≈ ~2,8 NOK.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  try {
    API_KEY = readFileSync('C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt', 'utf8').trim();
  } catch {}
}
if (!API_KEY) { console.error('mangler GEMINI_API_KEY'); process.exit(1); }

const API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${API_KEY}`;
const DIR = join(ROOT, 'public', 'avatars', 'f79-poc');
const RAW = join(DIR, 'raw');

const STYLE = `Soft 3D claymation render, hand-sculpted plasticine feel, matte
material, soft studio lighting from TOP-LEFT, premium app-mascot quality.`;
const MAGENTA = `BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF) covering
ALL canvas outside the subject. Flat, uniform, no gradient, no checkerboard.
Subject must never contain magenta/pink.`;

const img = (p) => ({ inlineData: { mimeType: 'image/png', data: readFileSync(p).toString('base64') } });

async function gen(parts, rawPath, label) {
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  };
  const t0 = Date.now();
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new Error(`${label}: ingen bildedata`);
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`gen  ${label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

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
      const target = Math.round((g + Math.min(r, b)) / 2);
      data[i] = Math.min(r, target + 10);
      data[i + 2] = Math.min(b, target + 10);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
  console.log(`key  ${outPath.split(/[\\/]/).pop()}`);
}

/* 1: produkt-thumb */
const thumbRaw = join(RAW, 'lag-4-jakke-morgennatt.png');
await gen(
  [{ text: `A single piece of baby clothing, floating, shaped with soft internal
volume as if a chubby 10-month-old baby is inside it but invisible. NOT flat,
NOT folded. ${STYLE}
GARMENT: Open baby outdoor jacket in medium petrol teal (#35707F — clearly
lighter and more teal than deep navy) with soft hood, worn-open front gap,
slightly puffy matte clay, both sleeves slightly out.
Garment fills ~80% of canvas, centered, front-facing, square 1:1. No text.
${MAGENTA}` }],
  thumbRaw, 'jakke-thumb',
);
await key(thumbRaw, join(DIR, 'lag-4-jakke.png'));

/* 2: stage-4 re-edit fra stage-3-raw */
const s4Raw = join(RAW, 'stage-4-morgennatt.png');
await gen(
  [
    img(join(RAW, 'stage-3-final.png')),
    { text: `IMAGE EDITING TASK. The attached image is a claymation baby (wearing
coral bodysuit, blue-grey pants, marigold knitted sweater) on solid magenta.

ADD exactly one garment: an open outdoor jacket in medium petrol teal
(#35707F — clearly lighter and more teal than deep navy) with a soft hood
behind the neck. Worn OPEN with a wide front gap so the marigold sweater
stays clearly visible. Sleeves cover the arms, hint of coral cuff at wrists.
Slightly puffy matte clay.

Change NOTHING else: same baby, face, pose, proportions, scale, position,
top-left lighting, claymation style. KEEP THE SOLID MAGENTA BACKGROUND flat
and uniform. Jacket must never contain magenta/pink. Square 1:1, no text.` },
  ],
  s4Raw, 'stage-4',
);
await key(s4Raw, join(DIR, 'stage-4.png'));

console.log('\njakke oppdatert for Morgennatt (thumb + stage-4).');
