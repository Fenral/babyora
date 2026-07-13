#!/usr/bin/env node
/* Runde 4 — fikser 2 PNG-er Sivert flagget som kuttet på galleriet:
 *   - varmepose-dun (kuttet i toppen)
 *   - vinterdress-isolert (kuttet i bunnen)
 *
 * Prompt-fix: kraftig fokus på "FULL ITEM VISIBLE, BALANCED PADDING ABOVE
 * AND BELOW", + eksplisitte top/bottom-detaljer som modellen må vise.
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

const STRICT_FRAMING = `STRICT FRAMING RULES (NON-NEGOTIABLE):
- The ENTIRE garment must be visible in the frame from top to bottom
- BALANCED padding of empty magenta background ON ALL FOUR SIDES (top, bottom, left, right)
- ~15% padding above the topmost point of the garment
- ~15% padding below the bottommost point of the garment
- DO NOT crop the top edge — the entire hood/opening must be visible
- DO NOT crop the bottom edge — the entire footed end / ankle cuffs must be visible
- The garment should fill approximately 65–70% of canvas height, NOT 100%
- Center the garment vertically within the frame

STRICT BACKGROUND RULES:
- The ENTIRE area around the garment MUST be pure BRIGHT MAGENTA #FF00FF
- NO gray, blue-gray, purple, pink, lavender, or any other background
- Pure flat magenta for chroma-key removal

NOT ALLOWED OUTPUT TYPES:
- NO software screenshots, NO Photoshop interface
- NO mockup with multiple angle views
- NO front+back comparison
- NO swatch grids
- ONE single product illustration on flat magenta. Period.

STYLE: clean Scandinavian minimalism, semi-realistic, premium mobile app illustration.
LIGHTING: soft top-left light ON the item, NO drop shadow on bg.
COLOR: muted Nordic palette. Brand accent is warm TERRACOTTA (#C8643C) — use for zipper pulls and trim.

BACKGROUND-FIT (IMPORTANT):
- This asset will be shown on a warm cream app background (#FAF6EF).
- Use warm, slightly desaturated Nordic tones that sit harmoniously on warm cream.`;

const GARMENTS = {
  "varmepose-dun": `${STRICT_FRAMING}

GARMENT:
ONE single PUFFY DOWN-FILLED pram footmuff / warmer-bag (varmepose dun) for a baby pram.

CRITICAL — FULL TOP-TO-BOTTOM:
- TOP: the OPEN hood/opening where baby's head would peek out must be FULLY visible at the top of the frame, with magenta padding ABOVE it
- BOTTOM: the rounded foot-end of the footmuff must be FULLY visible at the bottom of the frame, with magenta padding BELOW it
- The full elongated egg-shape silhouette must read from top to bottom
- Show the footmuff laid flat as a single elongated bag-shape

DETAILS:
- Visibly QUILTED padded shell with horizontal channel-quilt pattern
- Deep charcoal tone
- Side zipper running full length with TERRACOTTA zipper pull
- Warm beige fleece-look lining peeking out at the open top
- Integrated rounded foot-pouch at the bottom

The garment must NEVER be cropped at top or bottom — show the COMPLETE footmuff.`,

  "vinterdress-isolert": `${STRICT_FRAMING}

GARMENT:
ONE single INSULATED two-piece winter baby snowsuit (vinterdress isolert) — JACKET + PANTS shown together as a set.

CRITICAL — FULL TOP-TO-BOTTOM:
- TOP: the COLLAR or HOOD of the jacket must be FULLY visible at the top of the frame, with magenta padding ABOVE it
- BOTTOM: the ankle-cuffs of the pants must be FULLY visible at the bottom of the frame, with magenta padding BELOW it
- Show jacket on top, pants directly below, both fully in frame
- The complete head-to-ankle assembly must read

DETAILS:
- Visibly QUILTED puffy down-filled construction with diamond quilt pattern
- Deep charcoal tone
- Jacket: full-zip front with TERRACOTTA zipper pull, hood-collar or stand-up collar
- Pants: elastic waist + elastic ankle-cuffs, matching diamond quilt pattern
- Jacket and pants displayed close together as a coordinated 2-piece set
- Optional: jacket slightly overlapping or just above the pants — but BOTH FULLY VISIBLE

The garment set must NEVER be cropped at top or bottom — show BOTH pieces COMPLETELY.`,
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

console.log(`model=${MODEL} — runde 4 (${Object.keys(GARMENTS).length} bilder)`);
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
console.log("\ndone — kjør postprocess-full-run.mjs deretter");
