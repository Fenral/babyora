#!/usr/bin/env node
/* Re-generate 3 sovepose-PNG-er som kom som triptyk (3 poser side-by-side)
 * eller hadde despill-rester. Prompt-fix: eksplisitt SINGLE garment.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("missing GEMINI_API_KEY"); process.exit(1); }

const MODEL = "gemini-3-pro-image-preview";
const base = "https://generativelanguage.googleapis.com/v1beta";
const OUT = join(ROOT, "review", "nano-banana-pro", "full-run", "garments");

const CREAM_NOTE = `BACKGROUND-FIT (IMPORTANT):
- This asset will be shown on a warm cream app background (#FAF6EF).
- Use warm, slightly desaturated Nordic tones that sit harmoniously on warm cream.
- Any near-white must be a WARM ivory/cream — never a cold bluish white, never pink.
- The signature accent is warm terracotta / burnt orange (#C8643C-ish); use it for accents.`;

const STYLE = `Create a high-quality product-style illustration of a SINGLE baby sleep sack for a mobile app UI.

ABSOLUTELY CRITICAL — SINGULARITY:
- EXACTLY ONE sleep sack centered in the frame
- DO NOT show variants, sizes, or multiple sleep sacks side-by-side
- DO NOT show the same garment in multiple colors
- ONE garment, ONE silhouette, dead center

STYLE:
- clean Scandinavian minimalism
- semi-realistic (NOT flat icon, NOT photo)
- premium product illustration

COMPOSITION:
- ONE centered garment, fills ~70% of frame
- balanced padding on all sides
- front-facing view, no rotation
- no background scene

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the garment
- chroma-key for post-processing — will be stripped to transparent
- the garment must NEVER use magenta, pink, fuchsia
- completely clean magenta fill, no gradients

LIGHTING:
- soft top-left light source on the garment
- NO drop shadow under garment
- shading only INSIDE the garment

COLOR:
- muted Nordic palette, warm ivory/beige
- TERRACOTTA (#C8643C-ish) for snap buttons and trim only
- NEVER use cold white, pink, lavender, or lilac

${CREAM_NOTE}`;

const GARMENTS = {
  "sovepose-0-5-tog": "ONE single VERY LIGHT 0.5 TOG baby sleep sack (sleeveless envelope shape). Extremely thin (almost like a thin cotton sheet bag), soft WARM ivory tone. Shoulder snaps in TERRACOTTA. ABSOLUTELY ONLY ONE.",
  "sovepose-1-0-tog": "ONE single LIGHT 1.0 TOG baby sleep sack (sleeveless envelope shape). Minimal light padding — clearly reads as thin/light sack. Soft warm beige tone with TERRACOTTA shoulder snaps. ABSOLUTELY ONLY ONE.",
  "sovepose-3-5-tog": "ONE single WARMEST 3.5 TOG baby sleep sack (sleeveless envelope shape). Visibly THICK heavy padding (down or wool fill). Deep warm beige tone with TERRACOTTA shoulder snaps. ABSOLUTELY ONLY ONE.",
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

for (const [id, detail] of Object.entries(GARMENTS)) {
  const outPath = join(OUT, `${id}.png`);
  console.log(`re-generating ${id}...`);
  try {
    const buf = await generate(`${STYLE}\n\nGARMENT:\n${detail}`);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${buf.length} bytes`);
  } catch (e) {
    console.error(`  ${id} FAILED:`, e.message);
  }
}
console.log("done — re-run scripts/postprocess-full-run.mjs to refresh transparent/ + on-cream/");
