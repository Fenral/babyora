#!/usr/bin/env node
/* Runde 5 — 3 PNG-er Sivert flagget:
 *   - vinterdress-isolert: kom som TRIPTYK igjen i runde 4 (modellen tolker
 *     «2-piece set» som «flere sett»). Eskalert prompt: vis jakke ALENE.
 *   - sovepose-1-0-tog: grå bg-rest (despill fail / modellen brukte grå bg)
 *   - sovepose-3-0-3-5-tog: kuttet på bunnen
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
- NOT gray, NOT blue-gray, NOT purple, NOT pink, NOT lavender, NOT any other color
- Pure flat magenta for chroma-key removal
- The garment itself must NEVER use magenta or pink

STRICT FRAMING:
- The ENTIRE garment visible from top to bottom
- BALANCED magenta padding on ALL FOUR sides (~15% on each)
- DO NOT crop top, bottom, left, or right
- Garment fills ~65-70% of canvas height, centered vertically

NOT ALLOWED:
- NO software screenshots, NO Photoshop interface
- NO mockup with multiple angle views
- NO front+back comparison
- NO variant grids (e.g. 3 garments side-by-side)
- ONE single product on flat magenta. Period.

STYLE: clean Scandinavian minimalism, semi-realistic, premium mobile app illustration.
LIGHTING: soft top-left light. NO drop shadow on bg.
COLOR: muted Nordic palette. Brand accent: warm TERRACOTTA (#C8643C) for zipper pulls and trim.

BACKGROUND-FIT: will be shown on warm cream #FAF6EF — use warm Nordic tones.`;

const GARMENTS = {
  // Endret strategi: bare vis JAKKE. Modellen tolker "2-piece set"
  // som "vis flere sett". Vinterkjøredress dekker den fulle 2-piece-versjonen.
  "vinterdress-isolert": `${STRICT}

GARMENT:
ONE single INSULATED winter baby JACKET (vinterdress isolert — only the jacket part).

ABSOLUTELY CRITICAL:
- EXACTLY ONE jacket — NOT a set, NOT a pair, NOT a comparison
- NOT showing pants alongside the jacket
- NOT showing two or three jackets in a row
- DEAD CENTER, one single jacket only

JACKET DETAILS:
- Visibly QUILTED puffy down-filled construction with diamond quilt pattern
- Deep charcoal tone
- Full-zip front with TERRACOTTA zipper pull
- Hood up (or stand-up insulated collar)
- Long sleeves with elastic cuffs
- Hem at hip-level (jacket length, NOT a one-piece coverall)
- Show full jacket: hood to hem, with magenta padding above and below

ONE jacket. Just ONE.`,

  "sovepose-1-0-tog": `${STRICT}

GARMENT:
ONE single LIGHT 1.0 TOG baby sleep sack (sleeveless envelope shape).

ABSOLUTELY CRITICAL:
- EXACTLY ONE sleep sack — NOT 2 or 3 side-by-side
- The BACKGROUND must be PURE FLAT MAGENTA #FF00FF — no gray, no shadow on bg
- The sleep sack itself is BEIGE/CREAM, the background is MAGENTA — they are DIFFERENT colors

DETAILS:
- Minimal light padding (clearly reads as thin/light)
- Soft warm beige tone (NOT pink, NOT magenta, NOT lavender, NOT gray)
- TERRACOTTA shoulder snaps
- Envelope shape: wider at shoulders, tapering toward feet
- Full top-to-bottom visible with balanced padding

ONE sleep sack on FLAT MAGENTA bg.`,

  "sovepose-3-0-3-5-tog": `${STRICT}

GARMENT:
ONE single WARM 3.0–3.5 TOG baby sleep sack (sleeveless envelope shape).

ABSOLUTELY CRITICAL — FULL TOP-TO-BOTTOM:
- The ENTIRE sleep sack must be visible: from shoulder-snaps at top to rounded foot-end at bottom
- DO NOT crop the bottom — the rounded base where baby's feet would be must be FULLY in frame
- ~15% magenta padding above the shoulder snaps
- ~15% magenta padding below the rounded foot-end
- Garment fills ~70% of canvas height, NOT 100%

DETAILS:
- Visibly THICK warm padding (clearly warmer than 2.5, less than 3.5)
- Deep warm beige tone
- TERRACOTTA shoulder snaps
- Envelope shape: wider at shoulders, tapering and rounding at the bottom

ONE sleep sack, full top-to-bottom, on FLAT MAGENTA bg.`,
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

console.log(`model=${MODEL} — runde 5 (${Object.keys(GARMENTS).length} bilder)`);
for (const [id, prompt] of Object.entries(GARMENTS)) {
  const outPath = join(OUT, `${id}.png`);
  console.log(`re-generating ${id}...`);
  try {
    const buf = await generate(prompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${buf.length} bytes`);
  } catch (e) {
    console.error(`  ${id} FAILED:`, e.message);
  }
}
console.log("\ndone");
