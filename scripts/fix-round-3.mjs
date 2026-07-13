#!/usr/bin/env node
/* Runde 3 — fikser de 5 PNG-ene runde 2 ikke landet på.
 *
 * Strategi: ekstreme negative prompts for hver enkelt sin spesifikke failure mode.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("missing GEMINI_API_KEY"); process.exit(1); }

const MODEL = "gemini-3-pro-image-preview";
const base = "https://generativelanguage.googleapis.com/v1beta";
const OUT = join(ROOT, "review", "nano-banana-pro", "full-run", "garments");

const STRICT = `STRICT BACKGROUND RULES (NON-NEGOTIABLE):
- The ENTIRE area around the garment MUST be pure BRIGHT MAGENTA #FF00FF
- NO gray, NO blue-gray, NO purple, NO pink, NO lavender, NO cream as background
- The background must be a single flat magenta color (think: green-screen, but magenta)
- This is for chroma-key removal in post-processing
- The garment itself must NEVER use magenta or pink colors

NOT ALLOWED OUTPUT TYPES:
- NO software screenshots, NO Photoshop / Illustrator interface
- NO mockup with multiple angle views
- NO front+back comparison
- NO swatch / color variant grids
- NO product photography studio backgrounds

OUTPUT TYPE: ONE single product illustration on flat magenta. Period.

STYLE: clean Scandinavian minimalism, semi-realistic, premium mobile app illustration.
COMPOSITION: ONE centered garment, fills ~70% of frame, balanced padding, FULL item visible.
LIGHTING: soft top-left light ON the item, NO drop shadow on bg, NO ambient shadow.
COLOR: muted Nordic palette. Brand accent is warm TERRACOTTA (#C8643C) — use for snaps, zipper pulls, trim.`;

const GARMENTS = {
  "vinterkjoredress-isolert": `${STRICT}

GARMENT:
ONE single INSULATED winter baby ONE-PIECE PRAM SUIT (vinterkjøredress isolert).

CRITICAL — FULL ONE-PIECE:
- This is a HEAD-TO-ANKLE one-piece coverall, NOT a jacket
- Must show: hood at top, sleeves with cuffs, FULL BODY torso, FULL LEGS down to ankle cuffs
- ONE continuous garment from neck to feet — no separate jacket and pants
- Visibly QUILTED puffy down-filled construction with diamond quilt pattern
- Deep charcoal tone with TERRACOTTA zipper pull
- Hood up, front zipper full length

Show the COMPLETE pram suit on solid magenta background — hood, torso, sleeves, AND legs all visible.`,

  "vintersko": `${STRICT}

GARMENT:
ONE single pair of warm WINTER baby BOOTS shown together side-by-side.

CRITICAL — SOLE COLOR:
- Sole MUST be DEEP CHOCOLATE BROWN (#5C3A21-ish) or DEEP CHARCOAL
- Sole MUST NEVER be lilac, purple, pink, magenta, or any near-purple color
- The sole-to-canvas transition must be clean: deep brown sole sits on flat magenta bg

BOOT DETAILS:
- Deep charcoal felt-wool upper
- Warm beige fur trim at the top opening
- TERRACOTTA accent button on the outer side of each boot
- Sturdy deep-brown rubber sole with visible tread pattern

NEVER any purple/lilac/magenta tones in the sole or shadow under the boots.`,

  "kjoredress": `${STRICT}

GARMENT:
ONE single one-piece baby pram suit (kjøredress) — head-to-ankle coverall.

GARMENT COLOR: deep muted NAVY blue (the GARMENT only).
BACKGROUND COLOR: pure magenta #FF00FF (the BACKGROUND only).
THESE ARE DIFFERENT THINGS. DO NOT make the background blue.

DETAILS:
- Hood up, medium-weight outer shell with moderate insulation
- Front zipper full-length with TERRACOTTA zipper pull
- Cuffed sleeves and cuffed ankles
- FULL BODY one-piece visible from hood to ankle

Background must be FLAT MAGENTA, not gray, not blue, not any tint.`,

  "ull-pyjamas": `${STRICT}

GARMENT:
ONE SINGLE one-piece WOOL baby pajamas (footed sleeper).

CRITICAL — SINGULARITY:
- EXACTLY ONE garment, ONE silhouette, dead center
- DO NOT show front view AND back view
- DO NOT show two pajamas side-by-side
- Just ONE single pajama in front-facing pose

DETAILS:
- Visible subtle knit texture (merino wool)
- Soft warm beige tone (NOT pink, NOT lavender, NOT magenta)
- Front snap closure with TERRACOTTA snap buttons
- Footed sleeper (covers feet)
- BABY proportions: short wide torso, soft rounded shapes`,

  "lue": `${STRICT}

GARMENT:
ONE single warm WOOL BABY beanie illustration.

ABSOLUTELY NOT:
- NOT a Photoshop screenshot
- NOT inside any software interface (Photoshop, Illustrator, Figma, sketch tools)
- NOT showing layers panel, color panel, or any app chrome
- NOT a mockup showing the design process

ONLY the beanie itself, alone, centered, on flat magenta background.

BEANIE DETAILS:
- Visible chunky knit ribbed cuff covering the ears
- Soft tie-strings hanging down under the chin (baby-specific)
- Small pompom on top
- Warm beige tone
- BABY-sized: short and soft, fits a small infant head
- A clean isolated product illustration of the hat ONLY`,
};

async function generate(prompt) {
  const endpoint = `${base}/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!img) throw new Error("no image in response");
  return Buffer.from(img.inlineData.data, "base64");
}

console.log(`model=${MODEL} — runde 3 (${Object.keys(GARMENTS).length} bilder)`);
let ok = 0, failed = 0;
for (const [id, prompt] of Object.entries(GARMENTS)) {
  const outPath = join(OUT, `${id}.png`);
  console.log(`re-generating ${id}...`);
  try {
    const buf = await generate(prompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${buf.length} bytes`);
    ok++;
  } catch (e) {
    console.error(`  ${id} FAILED:`, e.message);
    failed++;
  }
}
console.log(`\ndone — ${ok} new, ${failed} failed`);
