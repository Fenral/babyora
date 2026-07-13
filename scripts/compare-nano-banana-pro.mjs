#!/usr/bin/env node
/* Nano Banana Pro (Gemini 3 Pro Image) — transparent, cream-tuned asset sample.
 *
 * Generates a small representative sample with the NEWER image model
 * (gemini-3-pro-image-preview, aka "Nano Banana Pro") into review/nano-banana-pro/,
 * WITHOUT touching live public/ assets, so quality can be compared side-by-side
 * against the current gemini-2.5-flash-image PNGs.
 *
 * Direction (agreed with product owner):
 *  - transparent output (magenta chroma-key here -> knocked out in postprocess-review.mjs)
 *  - palette tuned to sit on the app's warm cream background (#FAF6EF)
 *  - avatars rendered as a YOUNGER baby (not a toddler)
 *  - avatar consistency via reference image: generate A1 first, then condition A6 on it
 *  - A6 uses the brand terracotta accent (not the primary red the old model produced)
 *
 * Cost ~$0.134 per image (Pro). Sample = 5 images ≈ $0.67.
 *
 * Usage:
 *   node scripts/compare-nano-banana-pro.mjs --list-models     # verify model availability
 *   node scripts/compare-nano-banana-pro.mjs --only=kortermet-body   # single test image
 *   node scripts/compare-nano-banana-pro.mjs                   # full 5-image sample
 *   node scripts/compare-nano-banana-pro.mjs --model=gemini-3-pro-image   # override model id
 *
 * After generating, run: node scripts/postprocess-review.mjs   # transparency + contact shadow
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
    try {
      API_KEY = readFileSync(p, "utf8").trim();
      if (API_KEY) break;
    } catch {}
  }
}
if (!API_KEY) {
  console.error("missing GEMINI_API_KEY — set it in the environment and re-run.");
  process.exit(1);
}

const args = process.argv.slice(2);
const modelArg = args.find((a) => a.startsWith("--model="));
const MODEL = modelArg ? modelArg.split("=")[1] : "gemini-3-pro-image-preview";
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.split("=")[1] : null;
const base = "https://generativelanguage.googleapis.com/v1beta";

const OUT_DIR = join(ROOT, "review", "nano-banana-pro");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// --- verification gate: list available models -----------------------------
if (args.includes("--list-models")) {
  const res = await fetch(`${base}/models?key=${API_KEY}&pageSize=200`);
  if (!res.ok) {
    console.error(`ListModels ${res.status}: ${(await res.text()).slice(0, 400)}`);
    process.exit(1);
  }
  const json = await res.json();
  const imageModels = (json.models ?? []).map((m) => m.name).filter((n) => /image/i.test(n));
  console.log("image-capable models:");
  for (const n of imageModels) console.log("  " + n);
  const found = (json.models ?? []).some((m) => m.name.endsWith(MODEL));
  console.log(`\ntarget MODEL "${MODEL}" available: ${found ? "YES" : "NO"}`);
  process.exit(found ? 0 : 2);
}

// --- shared palette note: tuned for the app's warm cream background --------
const CREAM_NOTE = `BACKGROUND-FIT (IMPORTANT):
- This asset will be shown on a warm cream app background (#FAF6EF).
- Use warm, slightly desaturated Nordic tones that sit harmoniously on warm cream.
- Any near-white must be a WARM ivory/cream — never a cold bluish white, never pink.
- The signature accent is warm terracotta / burnt orange (#C8643C-ish); use it for accents.`;

// --- prompt material -------------------------------------------------------
const GARMENT_STYLE = `Create a high-quality product-style illustration of a baby clothing item for a mobile app UI.

STYLE:
- clean Scandinavian minimalism
- semi-realistic (NOT flat icon, NOT photo)
- looks like a premium product illustration used in a high-end mobile app
- soft, tactile, material-aware rendering

COMPOSITION:
- centered garment on canvas
- fills ~80% of frame
- perfectly balanced padding on all sides
- front-facing view, no rotation
- no background scene, no environment

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the garment shape
- this is a chroma-key background used for post-processing — it will be stripped to transparent
- the garment itself must NEVER use magenta, pink, fuchsia, or hot-pink tones
- completely clean magenta fill, no gradients, no texture, no scenery

LIGHTING:
- soft top-left light source ON THE GARMENT ITSELF (illuminate the fabric)
- subtle natural shading on the garment
- NO ambient shadow on the background (the background will be removed)
- NO drop shadow under the garment
- shading and depth must be INSIDE the garment shape only
- no hard shadows, no dramatic contrast

MATERIAL RENDERING (VERY IMPORTANT):
- wool: slightly fuzzy texture, matte surface, subtle fiber noise
- cotton: softer, smoother, slightly lighter shading
- outerwear: smoother, slightly structured, light quilting or seam definition
- rubber boots: more contrast, firmer highlights, clear sole edge
- knit items (hat, mittens): visible knit structure but subtle

DETAILING:
- realistic seams, cuffs, folds
- gentle depth and volume (not flat)
- no over-detailing, keep it clean and simplified
- edges should be soft but precise (no blur)

COLOR:
- muted Nordic palette, natural and slightly desaturated
- avoid overly vibrant or playful tones
- near-white items must be a WARM ivory/cream (never pink, never cool white)
- example tones: warm beige, dusty brown, soft gray, deep muted navy (for outerwear)

${CREAM_NOTE}

CONSISTENCY REQUIREMENTS:
- same perspective and scale as other garments in set
- consistent lighting direction (top-left)
- consistent thickness of outlines (very subtle or none)

UI-READINESS:
- must look good at small sizes (mobile list view)
- strong silhouette recognition
- no unnecessary micro-details that disappear when scaled down`;

const AVATAR_STYLE = `Create a soft 3D claymation-style illustration of a single happy young Norwegian BABY (about 6–9 months old) facing the camera, dressed for a specific weather scenario.

BABY PROPORTIONS (IMPORTANT — must read clearly as a baby, not a toddler):
- large head-to-body ratio (classic infant proportions, head noticeably big)
- chubby, rounded, pudgy limbs; soft round belly; short little arms and legs
- soft full cheeks, tiny button nose, large warm eyes, very little soft hair
- tender, gentle, innocent baby expression with a soft smile
- NOT a confident standing toddler — softer, rounder, more infant-like

STYLE:
- Soft 3D claymation, like a hand-sculpted plasticine figure
- Warm matte material rendering — visible 3D depth, form, and volume
- NOT a flat 2D illustration, NOT photorealistic
- Slightly rounded, soft edges (clay-like surface, not sharp polygons)
- Premium mobile-app character design, like figurines in modern children's stop-motion films
- Consistent baby character across all tiers: same face, same body proportions, same pose, ONLY THE OUTFIT VARIES

COMPOSITION:
- full body, centered, square 1:1
- baby occupies approximately 75% of canvas vertical
- front-facing view, arms slightly out at the sides, soft natural baby stance
- no rotation, no perspective distortion
- no background scene, no environment

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the baby
- chroma-key for post-processing to transparent
- NO gradient, NO scenery, NO shadow ground, NO floor

LIGHTING:
- soft top-left light source on the figure
- subtle natural matte shading showing 3D form
- NO drop shadow on the background (background will be removed)
- NO ambient shadow extending beyond the figure shape

SKIN AND CHARACTER (consistent across all tiers):
- soft warm beige / cream skin tone with subtle 3D shading
- gentle rounded cheeks with slight rosy blush
- the same baby character — only outfit changes between tiers

${CREAM_NOTE}

STRICT RULES:
- no text, no logos, no numbers, no brand marks
- no flat 2D look — must be visibly 3D claymation
- no realistic photograph style
- no high-gloss plastic look — must feel like matte clay
- no magenta or pink tint on the baby

CLEAN SURFACES (CRITICAL):
- absolutely NO marks, smudges, stains, dirt, bruises, or blemishes on body, face or clothing
- all skin and fabric surfaces are perfectly clean — only soft natural shading and folds
- no rendering artifacts, no shadow blobs on skin, no dust speckles`;

// --- garment sample (text-only) --------------------------------------------
const GARMENTS = [
  {
    id: "kortermet-body",
    detail: `GARMENT:\nshort-sleeve cotton bodysuit for baby (inner layer), snap buttons at bottom, soft WARM cream / ivory tone (not pink, not cool white).`,
  },
  {
    id: "tynt-teppe",
    detail: `GARMENT:\nthin folded baby blanket (cotton or muslin), clearly THIN and flat (not puffy, not padded), soft warm cream tone with subtle woven texture and edge detail.`,
  },
  {
    id: "sovepose-1-0-tog",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, light 1.0 TOG warmth), envelope shape with shoulder snaps, MINIMAL light padding so it clearly reads as a thin/light sack, soft warm beige tone.`,
  },
];

// --- avatar sample (A1 anchor -> A6 conditioned on A1) ----------------------
const AVATAR_A1 = {
  id: "avatar-A1",
  detail: `OUTFIT:\nThe baby wears only a thin cotton short-sleeve bodysuit in soft warm cream tone with bare chubby legs and bare feet — minimal outfit for warm summer weather. NO hat, NO head covering — the head is bare except for a little soft hair on top.`,
};
const AVATAR_A6 = {
  id: "avatar-A6",
  detail: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression) — only the outfit changes. The baby wears a heavily insulated puffy winter snowsuit in deep charcoal tone with visible quilt channels, hood up with a thick wool balaclava underneath showing only the face, puffy down-filled mittens in WARM TERRACOTTA / burnt-orange tone (the signature brand accent), heavily insulated winter boots in charcoal. Cheeks slightly rosy from cold. Ready for severe frost.`,
};

async function generate(prompt, refBuffers = []) {
  const endpoint = `${base}/models/${MODEL}:generateContent?key=${API_KEY}`;
  const parts = [];
  for (const buf of refBuffers) {
    parts.push({ inlineData: { mimeType: "image/png", data: buf.toString("base64") } });
  }
  parts.push({ text: prompt });
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 500)}`);
  }
  const json = await res.json();
  const respParts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = respParts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!imagePart) throw new Error("no image part in response: " + JSON.stringify(json).slice(0, 500));
  return Buffer.from(imagePart.inlineData.data, "base64");
}

async function run(id, prompt, refBuffers = []) {
  const outPath = join(OUT_DIR, `${id}.png`);
  console.log(`generating ${id}${refBuffers.length ? " (with reference image)" : ""}...`);
  const buf = await generate(prompt, refBuffers);
  writeFileSync(outPath, buf);
  console.log(`  wrote ${outPath} (${buf.length} bytes)`);
  return buf;
}

// Resolve the A1 anchor buffer: reuse on disk if present, else generate it.
async function ensureA1() {
  const p = join(OUT_DIR, "avatar-A1.png");
  if (existsSync(p)) return readFileSync(p);
  return run(AVATAR_A1.id, `${AVATAR_STYLE}\n\n${AVATAR_A1.detail}`);
}

console.log(`model=${MODEL} — output -> review/nano-banana-pro/`);

const wantGarment = (g) => !ONLY || ONLY === g.id;
const wantAvatar = (id) => !ONLY || ONLY === id;

// garments (independent, text-only)
for (const g of GARMENTS) {
  if (!wantGarment(g)) continue;
  try {
    await run(g.id, `${GARMENT_STYLE}\n\n${g.detail}`);
  } catch (e) {
    console.error(`  ${g.id} failed:`, e.message);
  }
}

// avatars: A1 first (anchor), then A6 conditioned on A1
let a1buf = null;
if (wantAvatar("avatar-A1")) {
  try {
    a1buf = await run(AVATAR_A1.id, `${AVATAR_STYLE}\n\n${AVATAR_A1.detail}`);
  } catch (e) {
    console.error(`  avatar-A1 failed:`, e.message);
  }
}
if (wantAvatar("avatar-A6")) {
  try {
    if (!a1buf) a1buf = await ensureA1(); // need the anchor for consistency
    await run(AVATAR_A6.id, `${AVATAR_STYLE}\n\n${AVATAR_A6.detail}`, [a1buf]);
  } catch (e) {
    console.error(`  avatar-A6 failed:`, e.message);
  }
}

console.log("done — next: node scripts/postprocess-review.mjs");
