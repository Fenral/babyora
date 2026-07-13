#!/usr/bin/env node
/* Nano Banana 2 — generate 7 Babyora avatar-tier PNGs (A1-A7).
 *
 * Cost ~$0.039 × 7 ≈ $0.27 ≈ 2.7 NOK.
 *
 * Each tier shows a Norwegian toddler dressed for that warmth tier
 * (outermost worn layer is what defines the tier). Used in HomeScreen
 * avatar position — clickable to OutfitScreen.
 *
 * Usage:
 *   node scripts/generate-avatar-tiers.mjs            # generate all 7
 *   node scripts/generate-avatar-tiers.mjs --force    # re-run even if exists
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
  console.error("missing GEMINI_API_KEY");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE_BASE = `Create a soft 3D claymation-style illustration of a single happy Norwegian baby (about 14 months old) standing facing the camera, dressed for a specific weather scenario.

STYLE:
- Soft 3D claymation, like a hand-sculpted plasticine figure
- Warm matte material rendering — visible 3D depth, form, and volume
- NOT a flat 2D illustration, NOT photorealistic
- Slightly rounded, soft edges (clay-like surface, not sharp polygons)
- Premium mobile-app character design, like the figurines in modern children's stop-motion films
- Consistent baby character across all 7 avatars: same face, same body proportions, same pose, ONLY THE OUTFIT VARIES

COMPOSITION:
- full body, centered, square 1:1
- baby occupies approximately 75% of canvas vertical
- front-facing view, arms slightly out at the sides, relaxed natural stance
- no rotation, no perspective distortion
- no background scene, no environment

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the baby
- chroma-key for post-processing to transparent
- NO gradient, NO scenery, NO shadow ground, NO floor

LIGHTING:
- soft top-left light source on the figure
- subtle natural matte shading showing 3D form
- visible material softness on clay surfaces
- NO drop shadow on the background (background will be removed)
- NO ambient shadow extending beyond the figure shape

SKIN AND CHARACTER (consistent across all 7):
- soft warm beige / cream skin tone with subtle 3D shading
- gentle rounded cheeks with slight rosy blush
- small button nose, large warm brown eyes
- soft tufts of light brown hair (covered by hat in winter tiers)
- friendly, content expression with soft smile
- the same baby character — only outfit changes between tiers

PALETTE for clothing (matches Babyora identity):
- warm orange (#FF6B35-ish), deep muted navy (#0F172A-ish), warm beige (#D9C7A0-ish), dusty brown, soft gray, cream
- The orange/terracotta is the signature accent color — use it on at least one visible garment per tier (e.g., jacket, hat, or boots)
- NO saturated bright primaries, NO playful candy colors
- NO patterns or prints
- The baby must NEVER use magenta or pink tones — only the background is magenta

STRICT RULES:
- no text, no logos, no numbers, no brand marks
- no flat 2D look — must be visibly 3D claymation
- no realistic photograph style
- no hand-drawn wobble or sketchy lines
- no high-gloss plastic look — must feel like matte clay
- no magenta tint on baby edges

CLEAN SURFACES (CRITICAL):
- absolutely NO marks, smudges, stains, dirt, bruises, or blemishes anywhere on the body, face, cheeks, chin, arms, legs, or feet
- absolutely NO marks, smudges, or stains on the clothing or accessories
- all skin tones are perfectly clean, smooth, and uniform — only soft natural shading
- all fabric and clothing surfaces are perfectly clean — only soft natural folds and shading
- no rendering artifacts, no shadow blobs on skin, no rendered dust speckles`;

const AVATARS = [
  {
    id: "avatar-A1",
    label: "Sommer-base (varm dag)",
    outfit:
      "OUTFIT:\nThe baby wears only a thin cotton short-sleeve bodysuit in soft cream tone with bare legs and bare feet — minimal outfit for warm summer weather. NO hat, NO head covering, NO scarf — the head is bare except for soft tufts of light brown hair on top.",
  },
  {
    id: "avatar-A2",
    label: "Mild-base (mild dag)",
    outfit:
      "OUTFIT:\nThe baby wears a long-sleeve wool bodysuit in warm light beige tone, paired with thin warm beige cotton pants. Bare feet, no hat. Cozy for a mild day.",
  },
  {
    id: "avatar-A3",
    label: "Kjølig mellomlag",
    outfit:
      "OUTFIT:\nThe baby wears a soft wool mid-layer sweater (warm taupe tone) over a thin wool bodysuit, paired with dusty brown wool pants. Soft baby slippers on feet. Thin knit beanie in soft cream tone. Cozy for a cool day.",
  },
  {
    id: "avatar-A4",
    label: "Lett yttertøy (vogn)",
    outfit:
      "OUTFIT:\nThe baby wears a one-piece padded stroller overall (light kjøredress) in dusty brown tone with a soft hood. Small mittens, soft baby boots in warm taupe. Ready for a cool stroller ride.",
  },
  {
    id: "avatar-A5",
    label: "Vinter (frost)",
    outfit:
      "OUTFIT:\nThe baby wears a full padded winter snowsuit (vinterkjøredress) in deep muted navy tone with hood up showing soft cream fur trim, thick wool mittens in dusty brown, sturdy winter boots in dark charcoal tone. Ready for frost.",
  },
  {
    id: "avatar-A6",
    label: "Ekstrem vinter",
    outfit:
      "OUTFIT:\nThe baby wears a heavily insulated puffy winter snowsuit in deep charcoal tone with visible quilt channels, hood up with a thick wool balaclava underneath showing only the face, puffy down-filled mittens in deep muted navy tone, heavily insulated winter boots in charcoal. Cheeks slightly rosy from cold. Ready for severe frost.",
  },
  {
    id: "avatar-A7",
    label: "Søvn (sovepose)",
    outfit:
      "OUTFIT:\nThe baby wears a sleeveless quilted infant sleep sack (sovepose) in soft warm beige tone that wraps around the legs in an envelope shape, paired with a long-sleeve cotton bodysuit visible above the sleep sack at the chest and arms. Bare hands and a sleepy soft expression. The baby is standing but looks ready for bed.",
  },
  {
    id: "avatar-A1-hat",
    label: "Sommer-base + solhatt",
    outfit:
      "OUTFIT:\nThe baby wears only a thin cotton short-sleeve bodysuit in soft cream tone with bare legs and bare feet — minimal outfit for warm summer weather. On the head: a soft straw-brimmed sun hat (solhatt) in warm cream/beige tone with a subtle wide brim that shades the face, sitting naturally on the head. The hat is matte clay material, not glossy.",
  },
  {
    id: "avatar-A2-hat",
    label: "Mild-base + lue",
    outfit:
      "OUTFIT:\nThe baby wears a long-sleeve wool bodysuit in warm light beige tone, paired with thin warm beige cotton pants. Bare feet. On the head: a thin soft knit beanie (lue) in soft cream or dusty-brown tone, snug but not tight, covering the top of the head and ears. Cozy for a mild day.",
  },
];

async function generate(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 400)}`);
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!imagePart) throw new Error("no image part in response: " + JSON.stringify(json).slice(0, 400));
  return Buffer.from(imagePart.inlineData.data, "base64");
}

const FORCE = process.argv.includes("--force");
const OUT_DIR = join(ROOT, "public", "avatars");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

console.log(`generating ${AVATARS.length} avatar-tier PNGs...`);
for (const a of AVATARS) {
  const outPath = join(OUT_DIR, `${a.id}.png`);
  if (!FORCE && existsSync(outPath)) {
    console.log(`skip ${a.id} (exists)`);
    continue;
  }
  const fullPrompt = `${STYLE_BASE}\n\n${a.outfit}`;
  console.log(`generating ${a.id} — ${a.label}...`);
  try {
    const buf = await generate(fullPrompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${outPath} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`  ${a.id} failed:`, e.message);
  }
}
console.log("done");
