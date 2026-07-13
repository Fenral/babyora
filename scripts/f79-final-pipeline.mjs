#!/usr/bin/env node
/* F79 Phase 4d: FINAL asset-pipeline med magenta chroma-key.
 *
 * Funn: gemini-3-pro-image leverer IKKE ekte alpha — «transparent
 * bakgrunn» bakes som hvit/sjakkbrett-piksler (verifisert: hasAlpha=false
 * på alle F79-assets). Etablert repo-mønster (generate-dressup-plagg.mjs):
 * generer på solid MAGENTA (#FF00FF) og chroma-key til alpha med sharp.
 *
 * Pipeline:
 *  1. base-final: v2b-ansikt (varme/Pixar) + v2a-positur (symmetrisk
 *     stående), spedbarns-anatomi, magenta bg
 *  2. stage-1..4: edit-kjede på magenta
 *  3. lag-1..4 produkt-thumbs + klarvær-sol: regenerert på magenta
 *  4. sharp chroma-key → ekte alpha + despill, overskriver de kanoniske
 *     filnavnene (stage-N.png, lag-*.png, klarvaer.png) som demo/mocks
 *     allerede peker på.
 *
 * Kost: 10 × ~$0.134 ≈ ~14 NOK.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
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

const MODEL = 'gemini-3-pro-image';
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const DIR = join(ROOT, 'public', 'avatars', 'f79-poc');
const RAW = join(DIR, 'raw');
import { mkdirSync } from 'node:fs';
mkdirSync(RAW, { recursive: true });

const MAGENTA_RULE = `BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF)
covering ALL canvas outside the subject silhouette. Flat, uniform — NO
gradient, NO checkerboard, NO scenery, NO shadow on the background.
The subject itself must NEVER contain magenta, pink or fuchsia.
This is a chroma-key background for post-processing.`;

const STYLE = `Soft 3D claymation render, hand-sculpted plasticine feel, matte
material, soft studio lighting from TOP-LEFT, premium app-mascot quality
(Pixar-grade). NOT glossy, NOT photorealistic, NOT flat vector.`;

async function gen(parts, rawName) {
  const rawPath = join(RAW, rawName);
  if (existsSync(rawPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${rawName} (raw finnes)`);
    return rawPath;
  }
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  };
  const t0 = Date.now();
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${rawName}: HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new Error(`${rawName}: ingen bildedata`);
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`gen  ${rawName} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return rawPath;
}

const img = (p) => ({ inlineData: { mimeType: 'image/png', data: readFileSync(p).toString('base64') } });

/* Chroma-key: magenta → alpha, med despill på kant-piksler */
async function key(rawPath, outPath) {
  const { data, info } = await sharp(rawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // magenta-nærhet: høy R og B, lav G
    const mag = Math.min(r, b) - g;
    if (mag > 90) {
      data[i + 3] = 0; // full transparent
    } else if (mag > 40) {
      // kant-sone: delvis alpha + despill (trekk magenta-kast ut)
      data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
      const avg = Math.round((r + b) / 2);
      data[i] = Math.min(r, avg - Math.round(mag * 0.35));
      data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
    }
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath);
  const st = await sharp(outPath).stats();
  console.log(`key  ${outPath.split(/[\\/]/).pop()} (alpha mean ${Math.round(st.channels[3].mean)})`);
}

/* ---------- 1. BASE-FINAL ---------- */
const BASE_RAW = await gen(
  [
    img(join(DIR, 'base-v2b.png')),
    {
      text: `Use the attached image as CHARACTER AND WARMTH reference: same baby
face (big warm dark eyes with catchlights, rosy cheeks, tiny button nose,
soft smile, warm skin tone, wispy light baby down on top of the head).

Create this exact baby in a NEW composition:
- A real INFANT ~10 months old: head ≈ 1/3 of total height, huge round
  forehead, facial features LOW on the face, chubby cheeks, soft double
  chin, NO jawline. Short chubby arms and legs with soft fat rolls at
  wrists and thighs, round soft belly, tiny hands and feet.
- POSE (critical — this is the frozen base for a dressing animation):
  standing STRAIGHT and SYMMETRIC, front-facing, feet apart in a stable
  wide baby stance, both arms held slightly out from the body for
  balance. NOT walking, NOT turned, NOT tilted.
- Wearing ONLY a simple soft white/cream cloth diaper.
- ${STYLE}
- Centered, baby occupies ~65-70% of canvas height, square 1:1.
- No text, no watermarks.
${MAGENTA_RULE}`,
    },
  ],
  'base-final.png',
);

/* ---------- 2. STAGE-KJEDE på magenta ---------- */
const EDIT_RULES = `IMAGE EDITING TASK. The attached image is the current state
of a claymation baby for a dressing animation, on a solid magenta
chroma-key background.

Edit the image by ADDING exactly one garment as described below.

ABSOLUTE CONSTRAINTS:
- Change NOTHING else: same baby, same face, same expression, same hair,
  same pose, same proportions, same scale, same position in frame, same
  top-left lighting, same claymation style.
- KEEP THE SOLID MAGENTA (#FF00FF) BACKGROUND exactly as it is — flat and
  uniform, no gradient, no checkerboard.
- Garments already worn stay EXACTLY as they are (except where naturally
  covered by the new garment).
- The new garment fits the baby's body naturally: correct joints, correct
  volume, clay material. The garment must never contain magenta/pink.
- No text, no watermarks. Full edited image, same square 1:1.`;

const STAGES = [
  { id: 'stage-1', text: `ADD: A long-sleeve wool bodysuit (inner layer) in warm coral/terracotta (#D96B4A) with small snap buttons at the crotch. Covers torso, both arms to the wrists, and the diaper area (white diaper hidden under it). Soft brushed wool clay. Legs stay bare.` },
  { id: 'stage-2', text: `ADD: Soft wool baby pants in muted blue-grey petrol (#5A7480), elastic waistband at the natural waist OVER the lower bodysuit, ankle cuffs above the bare feet. Both legs filled naturally. Coral bodysuit torso and sleeves stay fully visible.` },
  { id: 'stage-3', text: `ADD: A knitted wool sweater (mid layer) in golden marigold/ochre (#D9962B) with clearly visible chunky knit stitches, OVER the coral bodysuit torso. Sleeves end just before the wrists so a thin coral cuff stays visible at each wrist. Hem at the hips over the pants waistband. Pants and feet unchanged.` },
  { id: 'stage-4', text: `ADD: An open outdoor jacket (outer layer) in deep petrol blue-green (#1E4750) with a soft hood behind the neck. Worn OPEN with a wide front gap so the marigold sweater stays clearly visible. Sleeves cover the arms, hint of coral cuff at wrists. Slightly puffy matte clay. Everything else unchanged.` },
];

let prevRaw = BASE_RAW;
for (const s of STAGES) {
  prevRaw = await gen([img(prevRaw), { text: `${EDIT_RULES}\n\n${s.text}` }], `${s.id}-final.png`);
}

/* ---------- 3. PRODUKT-THUMBS + SOL på magenta ---------- */
const THUMB_RULES = `A single piece of baby clothing, floating, shaped with soft
internal volume as if a chubby 10-month-old baby is inside it but invisible
(bent at natural joints). NOT flat, NOT folded, NOT a product photo on a
surface. ${STYLE} Garment fills ~80% of canvas, centered, front-facing,
square 1:1. No text, no watermarks. The garment must never contain
magenta/pink. ${MAGENTA_RULE}`;

const THUMBS = [
  { id: 'lag-1-body', text: `Long-sleeve wool bodysuit in warm coral/terracotta (#D96B4A), snap buttons at the crotch, soft brushed wool clay surface. T-shape: both sleeves slightly out to the sides.` },
  { id: 'lag-2-bukse', text: `Soft wool baby pants in muted blue-grey petrol (#5A7480), elastic waistband, both legs shaped as if filled by chubby baby legs, ribbed ankle cuffs.` },
  { id: 'lag-3-genser', text: `Knitted wool baby sweater in golden marigold/ochre (#D9962B) with big chunky visible knit stitches, both sleeves slightly out, ribbed hem and cuffs.` },
  { id: 'lag-4-jakke', text: `Open baby outdoor jacket in deep petrol blue-green (#1E4750) with soft hood, worn-open front gap, slightly puffy matte clay, both sleeves slightly out.` },
];
for (const t of THUMBS) {
  await gen([{ text: `${THUMB_RULES}\n\nGARMENT: ${t.text}` }], `${t.id}-final.png`);
}

await gen(
  [{ text: `A single volumetric 3D sun icon for a premium weather app. ${STYLE}
Soft rounded clay sphere in warm golden marigold (#D9962B core, lighter
#E8B04B highlights) with 8 short rounded chunky clay rays. Friendly and
calm, NO face. Centered, generous margin, square 1:1. No text.
The sun must never contain magenta/pink. ${MAGENTA_RULE}` }],
  'klarvaer-final.png',
);

/* ---------- 4. CHROMA-KEY alle → kanoniske filnavn ---------- */
console.log('\nchroma-keyer...');
await key(join(RAW, 'base-final.png'), join(DIR, 'base.png'));
copyFileSync(join(DIR, 'base.png'), join(DIR, 'stage-0.png'));
for (const s of STAGES) await key(join(RAW, `${s.id}-final.png`), join(DIR, `${s.id}.png`));
for (const t of THUMBS) await key(join(RAW, `${t.id}-final.png`), join(DIR, `${t.id}.png`));
await key(join(RAW, 'klarvaer-final.png'), join(ROOT, 'public', 'weather-3d', 'klarvaer.png'));

console.log('\nferdig: alle kanoniske F79-assets har nå ekte alpha.');
