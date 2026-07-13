#!/usr/bin/env node
/* F80: hodeplagg-varianter av clay-stagene (Sivert: «Avatar må ha hodeplagg
 * når det er relevant. Det er nesten det viktigste med appen»).
 *
 * Edit-kjede fra eksisterende stage-raws (magenta) → +lue / +solhatt → key.
 * Kombinasjoner: solhatt på stage-1/2 (varmt), lue på stage-2/3/4 (kjølig/kaldt).
 * Manglende kombo faller tilbake til bar stage i koden.
 * Kost: 5 × ~$0.134 ≈ ~7 NOK.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
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

const EDIT_RULES = `IMAGE EDITING TASK. The attached image is a claymation baby
for a dressing app, on a solid magenta chroma-key background.

Edit the image by ADDING exactly one item of headwear as described below.

ABSOLUTE CONSTRAINTS:
- Change NOTHING else: same baby, same face, same expression, same pose,
  same proportions, same scale, same position in frame, same top-left
  lighting, same claymation style. ALL garments already worn stay EXACTLY
  as they are.
- KEEP THE SOLID MAGENTA (#FF00FF) BACKGROUND flat and uniform.
- The headwear fits the baby's head naturally (correct size, sits properly).
- The headwear must never contain magenta/pink.
- No text, no watermarks. Full edited image, same square 1:1.`;

const LUE = `ADD: A warm knitted baby beanie (lue) in deep heather purple-grey
(#5C5470) with a small soft pom-pom on top and a fold-up ribbed brim, knitted
clay texture, fitted snugly on the baby's head with a bit of forehead visible.`;

const SOLHATT = `ADD: A soft baby sun hat (solhatt) in light oat/cream cotton
(#E4D8C2) with a gentle floppy brim all the way around, matte fabric clay
texture, sitting comfortably on the baby's head.`;

const VARIANTS = [
  { out: 'stage-1-solhatt', from: 'stage-1-final.png', add: SOLHATT },
  { out: 'stage-2-solhatt', from: 'stage-2-final.png', add: SOLHATT },
  { out: 'stage-2-lue', from: 'stage-2-final.png', add: LUE },
  { out: 'stage-3-lue', from: 'stage-3-final.png', add: LUE },
  { out: 'stage-4-lue', from: 'stage-4-morgennatt.png', add: LUE },
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

for (const v of VARIANTS) {
  const rawOut = join(RAW, `${v.out}-raw.png`);
  const finalOut = join(DIR, `${v.out}.png`);
  if (existsSync(finalOut) && !process.argv.includes('--force')) {
    console.log(`hopper over ${v.out}`);
    continue;
  }
  const t0 = Date.now();
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/png', data: readFileSync(join(RAW, v.from)).toString('base64') } },
          { text: `${EDIT_RULES}\n\n${v.add}` },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
    }),
  });
  if (!res.ok) { console.error(`feil ${v.out}: HTTP ${res.status}`); continue; }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) { console.error(`feil ${v.out}: ingen bildedata`); continue; }
  writeFileSync(rawOut, Buffer.from(part.inlineData.data, 'base64'));
  await key(rawOut, finalOut);
  console.log(`ok   ${v.out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
console.log('hodeplagg-varianter ferdig');
