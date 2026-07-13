#!/usr/bin/env node
/* Nano Banana 2 — generate 6 Lillian-shaped garment PNGs for dressup-animation.
 *
 * Cost ~$0.039 × 6 ≈ $0.24 ≈ ~2.5 NOK.
 *
 * Unlike scripts/generate-garments.mjs (which produces product-style flat
 * illustrations for plagg-lists), these PNGs are SHAPED to drape onto the
 * Lillian A1 avatar — bukse formet to two legs, votter spread to the sides
 * matching Lillian's arms, lue rounded to fit on a small baby head.
 *
 * Output: public/illustrations/dressup/
 *   (separate from public/illustrations/garments/ — those stay for lists)
 *
 * Usage:
 *   node scripts/generate-dressup-plagg.mjs           # generate missing
 *   node scripts/generate-dressup-plagg.mjs --force   # re-run all
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

const STYLE_BASE = `Create a soft 3D claymation-style illustration of a single piece of baby clothing, shaped as if it is about to drape onto a baby's body (the baby itself is NOT shown — only the garment, floating).

STYLE:
- Soft 3D claymation, like a hand-sculpted plasticine garment
- Warm matte material rendering with visible 3D depth and volume
- NOT a flat 2D illustration, NOT photorealistic
- Matches the visual style of a Norwegian baby-dressing app called Babyora
- Premium mobile-app illustration with rounded soft edges

SHAPE CRITICAL:
- The garment is shaped exactly as it would look ON a baby — already bent, curved, and proportioned to fit a 14-month-old baby body
- NOT laid flat like a product photo
- NOT folded
- The garment has internal volume — visible 3D form as if a baby is INSIDE the garment but invisible

COMPOSITION:
- garment fills 90-95% of the canvas (almost edge-to-edge)
- centered
- front-facing view
- no rotation, no perspective distortion
- the garment is the ONLY object in the frame

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the garment silhouette
- chroma-key for post-processing to transparent
- NO gradient, NO scenery, NO shadow ground

LIGHTING:
- soft top-left light source on the garment
- subtle natural matte shading showing 3D form
- NO drop shadow on the background
- shading INSIDE the garment shape only

COLOR PALETTE:
- muted Nordic palette: warm beige, dusty brown, deep muted navy, soft gray, cream, warm orange
- naturally desaturated
- garment must NEVER use magenta, pink, or fuchsia — only the background is magenta

STRICT RULES:
- no text, no logos, no numbers
- no baby body, no skin, no face — ONLY the garment, floating, but shaped as if filled by a baby body
- no hangers, no folds, no flat product shots
- no other objects
- no magenta edges on the garment
- no smudges, marks, or rendering artifacts

OUTPUT:
- square format 1:1
- high resolution
- crisp edges`;

const PLAGG = [
  {
    id: "lillian-ull-bukse",
    label: "Bukse formet til Lillian-bein",
    detail: `GARMENT:
Soft wool baby pants (mid layer) in dusty brown tone. The pants are shaped as if filled by two small toddler legs — both legs are bent slightly and visible (left leg and right leg form a clear silhouette), with an elastic waistband at the top. The leg openings show a small dark inner hollow where feet would emerge.
SHAPE: vertical layout, takes ~70% of canvas height, both legs symmetric, waistband on top. NO baby visible — just the pants holding their shape.`,
  },
  {
    id: "lillian-langermet-ullbody",
    label: "Body formet til Lillian-torso",
    detail: `GARMENT:
Long-sleeve wool bodysuit (inner layer) in warm light beige / oat tone. Snap buttons at the bottom. The body is shaped as if filled by a small toddler torso and arms — both sleeves extend OUT to the sides (NOT hanging down), the torso is curved with visible volume, the bottom flares slightly for the diaper area.
SHAPE: T-shape silhouette, arms extended horizontally to the sides at about shoulder height, fits a 14-month-old body. NO baby visible.`,
  },
  {
    id: "lillian-kjoredress",
    label: "Kjøredress formet til full Lillian-silhuett",
    detail: `GARMENT:
Baby stroller overall (one-piece padded kjøredress) in deep muted navy tone with a soft hood. The overall is shaped as if filled by a complete toddler body — full torso, both legs visible, both sleeves extending to the sides with mittens-style cuffs, hood empty on top. Soft puffy quilted appearance.
SHAPE: full-body silhouette like a tiny astronaut suit standing upright, hood at top, two legs at bottom, arms out to the sides. NO baby visible — just the empty suit holding its shape.`,
  },
  {
    id: "lillian-ullsokker",
    label: "Sokker formet til Lillian-føtter",
    detail: `GARMENT:
A pair of small knitted wool baby socks in warm beige tone, shown side-by-side as if filled by two tiny baby feet. Each sock has a rounded toe shape and a ribbed cuff at the top. The socks are spaced naturally apart (like feet standing together).
SHAPE: two socks side-by-side, each one foot-shaped with toe rounded forward, ribbed cuff visible at ankle. NO baby visible.`,
  },
  {
    id: "lillian-lue",
    label: "Lue formet til Lillian-hode",
    detail: `GARMENT:
A knitted wool baby beanie (lue) in soft cream / warm beige tone, shaped as if sitting on a small toddler head. The hat has a rounded dome shape (NOT flat), with a folded ribbed edge at the bottom. The interior is visible at the bottom opening, showing it would slide down onto a head.
SHAPE: rounded dome with a folded brim, side profile shows clear 3D volume, opening at the bottom faces the viewer slightly. NO head visible — just the hat holding its rounded shape.`,
  },
  {
    id: "lillian-votter",
    label: "Votter spent ut til Lillian-hender",
    detail: `GARMENT:
A pair of knitted wool baby mittens (votter) in soft light gray tone, shown SPREAD WIDE APART (NOT side-by-side touching) — left mitten on the far left of the canvas, right mitten on the far right, with empty magenta space between them. Each mitten is hand-shaped (thumb pointing slightly out), with a ribbed cuff at the wrist opening.
SHAPE: horizontal layout, two mittens separated by about 50% of canvas width, each one shaped as a small baby hand inside. NO arms or body visible — just the two mittens floating in their positions, ready to land on small hands.`,
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
const OUT_DIR = join(ROOT, "public", "illustrations", "dressup");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

console.log(`generating ${PLAGG.length} Lillian-shaped plagg PNGs...`);
for (const p of PLAGG) {
  const outPath = join(OUT_DIR, `${p.id}.png`);
  if (!FORCE && existsSync(outPath)) {
    console.log(`skip ${p.id} (exists)`);
    continue;
  }
  const fullPrompt = `${STYLE_BASE}\n\n${p.detail}`;
  console.log(`generating ${p.id} — ${p.label}...`);
  try {
    const buf = await generate(fullPrompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${outPath} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`  ${p.id} failed:`, e.message);
  }
}
console.log("done");
