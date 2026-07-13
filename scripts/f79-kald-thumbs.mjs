#!/usr/bin/env node
/* F79: 5 tilbehørs-/vinterplagg-thumbs i clay for kald-dag-stress-test
 * av komposisjons-mønsteret (Påkledning A). Gjenbrukes i F80-batch.
 * Magenta chroma-key-pipeline. Kost: 5 × ~$0.134 ≈ ~7 NOK.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
mkdirSync(RAW, { recursive: true });

const BASE_RULES = `A single piece of baby clothing/accessory, floating, shaped
with soft internal volume as if worn by a chubby 10-month-old baby who is
invisible. NOT flat, NOT folded, NOT a product photo.
Soft 3D claymation render, hand-sculpted plasticine, matte material, soft
top-left studio lighting, premium app-mascot quality.
Item fills ~75-80% of canvas, centered, front-facing, square 1:1.
No text, no watermarks. The item must never contain magenta/pink.
BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF), flat and uniform,
covering all canvas outside the item. No gradient, no checkerboard.`;

const ITEMS = [
  { id: 'lag-5-lue', text: `A warm knitted baby beanie/lue in deep heather purple-grey (#5C5470) with a small soft pom-pom on top and fold-up ribbed brim, rounded to fit a baby head, visible chunky knit stitches.` },
  { id: 'lag-6-votter', text: `A PAIR of small baby mittens/votter in warm coral-rust (#B85A3C), thumbless baby style with ribbed cuffs, shown side by side angled slightly toward each other, soft wool clay texture.` },
  { id: 'lag-7-sokker', text: `A PAIR of thick wool baby socks in warm oat/cream (#C8B99A) with ribbed cuffs, shaped as if filled by tiny baby feet, shown side by side, cozy chunky knit texture.` },
  { id: 'lag-8-dress', text: `A one-piece padded baby winter overall/vinterdress in deep forest-slate (#3A5248) with hood, front zip, soft puffy quilted sections, shaped as if filled by a complete chubby baby body — full torso, both legs, both arms slightly out, empty hood on top.` },
  { id: 'lag-9-ullongs', text: `Thin wool baby long-johns/leggings (ullongs) in soft heather grey-blue (#7A8699), snug thin-knit texture (thinner than outdoor pants), both legs shaped as if filled by chubby baby legs, ribbed waist and ankle cuffs.` },
];

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

for (const item of ITEMS) {
  const rawPath = join(RAW, `${item.id}-raw.png`);
  const t0 = Date.now();
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${BASE_RULES}\n\nITEM: ${item.text}` }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
    }),
  });
  if (!res.ok) { console.error(`feil ${item.id}: HTTP ${res.status}`); continue; }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) { console.error(`feil ${item.id}: ingen bildedata`); continue; }
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
  await key(rawPath, join(DIR, `${item.id}.png`));
  console.log(`ok   ${item.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
console.log('kald-thumbs ferdig');
