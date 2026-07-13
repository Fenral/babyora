#!/usr/bin/env node
/* Nano Banana 2 — generate 4 Babyora avatar PNGs (lag 1-4).
 * Cost ~$0.039 × 4 ≈ $0.16 ≈ 1.6 NOK.
 *
 * Usage:
 *   node scripts/generate-avatars.mjs            # generate all 4
 *   node scripts/generate-avatars.mjs --force    # re-run even if exists
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

const STYLE_BASE = `Modern flat illustration of a friendly Norwegian toddler (about 14 months old) standing facing the camera, smiling softly.
Style: warm hand-drawn character illustration with light texture and soft shading, gentle rounded shapes, slight playful asymmetry — NOT generic 3D-render.
Palette: warm terracotta orange (#D9651F) as accent on clothing, soft cream/off-white skin tone, deep navy (#0F172A) for details and outlines.
Background: SOLID BRIGHT MAGENTA (#FF00FF) covering the entire canvas — this is a chroma-key background that will be removed in post-processing. The magenta MUST be fully saturated #FF00FF, no gradient, no shadow, no scenery, no other color anywhere in the background. The character must NEVER use magenta or pink tones — only the background is magenta.
Composition: full body, centered, square 1:1, character occupies ~80% of vertical space.
Constraints: NO text, NO logos, NO speech bubbles, NO accessories beyond what's described, NO realistic photographic style, NO background of any color.`;

const PROMPTS = [
  {
    id: "lag-1",
    distinction: "Wearing only thin woolen base layer: long-sleeve cream wool shirt and matching wool pants. Bare feet, no hat. Looks comfortable and warm-but-light for mild weather.",
  },
  {
    id: "lag-2",
    distinction: "Wearing a soft terracotta fleece onesie (full-body fleece suit) over the wool base layer. Snug fit. Bare feet, no hat. Looks cozy for cool weather.",
  },
  {
    id: "lag-3",
    distinction: "Wearing a puffy terracotta winter snowsuit (full-body padded jacket-and-trousers in one) with a small cream-colored knit beanie. Bare hands. Soft snow boots. Looks ready for cold weather.",
  },
  {
    id: "lag-4",
    distinction: "Fully bundled for deep winter: puffy terracotta winter snowsuit + cream knit pompom hat + cream chunky scarf + small cream mittens + cream felted boots. Cheeks slightly rosy. Looks ready for snow and wind.",
  },
];

const FORCE = process.argv.includes("--force");
const OUT_DIR = join(ROOT, "public", "avatars");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

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

for (const p of PROMPTS) {
  const outPath = join(OUT_DIR, `${p.id}.png`);
  if (!FORCE && existsSync(outPath)) {
    console.log(`skip ${p.id} (exists)`);
    continue;
  }
  const fullPrompt = `${STYLE_BASE}\n\nSpecific outfit: ${p.distinction}`;
  console.log(`generating ${p.id}...`);
  try {
    const buf = await generate(fullPrompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${outPath} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`  ${p.id} failed:`, e.message);
  }
}
console.log("done");
