#!/usr/bin/env node
/* F26 Nano Banana Avatar Round 2 — Instrument-DNA spec (Copilot-godkjent).
 *
 * Generates 7 baby-avatarer (A1-A7) for Babyora's "Forside Instrument"-design.
 * Strict spec per Copilot's million-dollar-app dialog (2026-06-17 23:30):
 *
 *   "avataren skal være et måleinstrument med menneskelig varme,
 *    ikke en figur brukeren blir kjent med."
 *
 * STRIKSE REGLER (lock):
 * - fast kamera (samme iso-perspektiv, samme avstand for alle 7)
 * - fast brennvidde (~50mm-equivalent feel)
 * - svært kontrollert lys (samme studio-rig for alle 7)
 * - fast pose (kropp-front, hender 30° fra body, føtter parallelt)
 * - svært kontrollert materialkvalitet (matte stoff, ingen gloss)
 * - minimal søthet, maksimal lesbarhet
 * - ansikt nøytralt, ingen smil, øyne hvilende ned 5°
 * - klær = visuelt fokus, ikke ansikt/proporsjoner
 *
 * COST: gemini-3-pro-image ~$0.134/PNG × 7 = ~$0.94 (~10 NOK).
 * Forhåndsgodkjent av Sivert 2026-06-18.
 *
 * Usage:
 *   node scripts/generate-avatars-instrument.mjs --test     # A2 + A6 only ($0.27)
 *   node scripts/generate-avatars-instrument.mjs            # all 7 ($0.94)
 *   node scripts/generate-avatars-instrument.mjs --only=A2  # single avatar
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  const candidates = [
    "/c/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/nano banan 2.txt",
    "C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/nano banan 2.txt",
  ];
  for (const p of candidates) {
    try { API_KEY = readFileSync(p, "utf8").trim(); if (API_KEY) break; } catch {}
  }
}
if (!API_KEY) { console.error("missing GEMINI_API_KEY"); process.exit(1); }

const args = process.argv.slice(2);
const modelArg = args.find((a) => a.startsWith("--model="));
const MODEL = modelArg ? modelArg.split("=")[1] : "gemini-3-pro-image-preview";
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.split("=")[1] : null;
const outDirArg = args.find((a) => a.startsWith("--out="));
const TEST = args.includes("--test");
const base = "https://generativelanguage.googleapis.com/v1beta";

const OUT_DIR = outDirArg
  ? join(ROOT, "review", outDirArg.split("=")[1])
  : join(ROOT, "review", "avatars-instrument-round2");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// =========================================================================
// SHARED INSTRUMENT-SPEC (locked, applies to all 7 avatars)
// =========================================================================
const INSTRUMENT_SPEC = `STYLE — INSTRUMENT-GRADE 3D BABY AVATAR

CONTEXT
This avatar is a precision instrument in a weather-to-clothing decision tool
for parents. It is NOT a mascot. NOT a character. NOT a doll. It must read
as a measuring device with human warmth — never as a toy.

CAMERA (locked across all 7 avatars in the set)
- Fixed iso-perspective: 5° downward tilt, 0° rotation, head-and-body in frame
- Fixed focal length: 50mm-equivalent feel (no wide-angle distortion)
- Fixed distance: full body visible with even padding on all sides
- Centered composition, no canted angles

LIGHTING (locked — same studio rig for every avatar)
- Soft key light: 45° from upper-left, daylight color temperature (~5500K)
- Soft fill light: 135° from upper-right, half-intensity of key
- No harsh shadows. No rim light. No dramatic contrast.
- Gentle ambient that grounds the figure in the scene

POSE (locked — same pose for every avatar)
- Body facing forward, fully visible
- Arms relaxed, hands held 30° from body at sides (not crossed, not raised)
- Feet parallel and grounded on a soft horizontal surface
- Spine straight, slight natural stance
- Same pose for A1–A7; only the clothing changes

FACE & EXPRESSION (critical for instrument feel)
- Neutral expression. No smile. No frown. Calm and centered.
- Eyes resting downward by ~5°, soft gaze
- Minimal facial detail — readable, not characterful
- Skin: matte, natural, warm undertone
- Hair: simple, soft, brown or dark blond

PROPORTIONS (must read as a baby, NOT a toddler or doll)
- Approximate age: 8–12 months
- Large head-to-body ratio (classic infant proportions)
- Soft round cheeks, but never exaggerated
- Short, slightly chunky limbs
- Avoid stylized "kawaii" features (no oversize eyes, no big sparkles)

MATERIAL & RENDERING
- Soft 3D claymation feel — tactile, premium product photography quality
- Matte fabric on clothing (no gloss, no shine)
- Subtle SSS (subsurface scattering) on skin for warmth
- No texture noise. No grain. No DOF blur.
- Edges precise but not sharp

CLOTHING IS THE PRIMARY FOCUS
- Clothing details must be CLEARLY visible and identifiable
- Fabric should suggest warmth-level by visual weight
- All garment colors fit Babyora's warm palette:
  - off-white / cream (#F4EFE6)
  - terracotta accent (#C0632F) — main brand color, used sparingly
  - muted navy / slate (#2E3848)
  - warm beige (#D9C9AC)
  - never use pure white, pure black, pink, neon, or saturated red

BACKGROUND
- Transparent PNG (alpha channel)
- No floor, no shadows, no scene
- The figure will be placed on a soft gradient stage in the app

NO MAGENTA. NO CHROMA-KEY. Output transparent PNG directly via alpha channel.

CONSISTENCY
- Same baby (same face, same proportions, same skin tone) across all 7
- Only clothing differs
- Same lighting/camera/pose for every tier`;

// =========================================================================
// PER-AVATAR CLOTHING SPECS (the only difference between A1–A7)
// =========================================================================
const AVATARS = {
  A1: {
    label: "Warm summer day (15-22°C, calm)",
    clothing: `
- Short-sleeve cream cotton body (off-white/ivory)
- Cream cotton shorts to mid-thigh
- Bare feet
- No outer layer
- Optional: thin terracotta sun hat (tiny brim)`,
  },
  A2: {
    label: "Mild dag (12-17°C, mild wind)",
    clothing: `
- Long-sleeve cream cotton body
- Soft warm-beige cotton trousers
- Light terracotta thin jacket (UNZIPPED, open, casual)
- Soft slip-on shoes in matching warm tone
- No hat`,
  },
  A3: {
    label: "Cool autumn (5-12°C, breezy)",
    clothing: `
- Long-sleeve cream wool body
- Warm-beige wool trousers
- Terracotta merino wool sweater layer over body
- Soft brown leather-feel boots
- Optional: thin cream knit beanie`,
  },
  A4: {
    label: "Cold day (-5 to 5°C, windy)",
    clothing: `
- Cream wool base layer (visible at neck/wrists)
- Warm-beige wool middle layer
- Terracotta padded jacket with hood
- Warm-beige padded trousers
- Brown winter boots with grip sole
- Cream knit beanie with subtle terracotta band`,
  },
  A5: {
    label: "Cold + wet (rain, 5-12°C)",
    clothing: `
- Long-sleeve cream cotton body
- Cream wool middle layer
- Slate-navy rain jacket (matte, slightly textured — like wax cotton)
- Slate-navy rain trousers
- Yellow-mustard rubber boots (visible, clean)
- Slate-navy rain hood (down, resting on shoulders)`,
  },
  A6: {
    label: "Deep winter (-15 to -5°C, snow)",
    clothing: `
- Cream merino wool base (visible at collar)
- Warm-beige thick wool middle layer
- One-piece warm-beige snowsuit (zipped to top) with terracotta zip-tape detail
- Hood up, framing face with soft cream wool lining
- Warm-brown winter boots (insulated, visible texture)
- Cream knit mittens dangling from sleeves
- Cream knit scarf tucked into collar`,
  },
  A7: {
    label: "Extreme heat (>25°C, sun)",
    clothing: `
- Short-sleeve cream lightweight cotton body
- Lightweight cream cotton shorts
- Bare feet
- Wide-brim terracotta sun hat (clearly visible, brim casting subtle shadow)
- No outer layer`,
  },
};

// =========================================================================
// Build the per-tier prompt
// =========================================================================
function buildPrompt(tier) {
  const spec = AVATARS[tier];
  if (!spec) throw new Error(`Unknown tier: ${tier}`);

  return `${INSTRUMENT_SPEC}

CLOTHING FOR TIER ${tier} (${spec.label}):
${spec.clothing}

OUTPUT
- Single transparent PNG, 1024×1024
- Centered figure with even padding
- No floor shadow, no environment
- Strict adherence to camera/lighting/pose spec above

REJECT-CONDITIONS (must avoid):
- smiling, laughing, or open mouth
- any "cute character" or "doll" feel
- toddler or older child proportions
- pure white or pure black anywhere
- pink, neon, or saturated red
- glossy or metallic materials
- harsh shadows or rim lighting
- camera angle other than 5° downward
- pose other than the locked pose`;
}

// =========================================================================
// API call
// =========================================================================
async function generate(tier) {
  const prompt = buildPrompt(tier);
  const url = `${base}/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  console.log(`[${tier}] generating (${AVATARS[tier].label})...`);
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[${tier}] FAILED ${res.status}: ${errText.slice(0, 500)}`);
    return null;
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart) {
    console.error(`[${tier}] no image in response:`, JSON.stringify(json).slice(0, 500));
    return null;
  }
  const buf = Buffer.from(imgPart.inlineData.data, "base64");
  const outPath = join(OUT_DIR, `avatar-${tier}.png`);
  writeFileSync(outPath, buf);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[${tier}] saved → ${outPath} (${(buf.length / 1024).toFixed(0)} kB, ${dt}s)`);
  return outPath;
}

// =========================================================================
// Main
// =========================================================================
const tiers = ONLY ? [ONLY] : TEST ? ["A2", "A6"] : Object.keys(AVATARS);
console.log(`Generating ${tiers.length} avatar(s) → ${OUT_DIR}`);
console.log(`Model: ${MODEL}`);
console.log(`Est. cost: $${(tiers.length * 0.134).toFixed(2)}`);
console.log("");

for (const tier of tiers) {
  await generate(tier);
}

console.log("\nDONE.");
