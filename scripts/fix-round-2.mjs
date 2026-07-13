#!/usr/bin/env node
/* Runde 2 fix etter Sivert-sweep av galleriet 2026-06-14.
 *
 * Adresserer:
 *  A. Triptyk/duplikat (7)  — eksplisitt singularitet
 *  B. Despill-rester (3)    — instrukser om garment-farger som ikke kolliderer med magenta-chroma-key
 *  C. Cut-off (1)           — balansert padding
 *  D. Voksen-look (5)       — BABY-proporsjoner + baby-spesifikke trekk
 *  E. Feil tykkelse (1+1)   — "no quilting" / "thinner shell"
 *
 * Auto-resume: ingen — alltid overskriver de spesifikke 17 PNG-ene.
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
- The signature accent is warm terracotta / burnt orange (#C8643C-ish); use it for accents.
- The GARMENT ITSELF must NEVER use magenta, pink, fuchsia, lilac, or hot-pink tones.
- The GARMENT ITSELF must NEVER use any near-purple, near-magenta, or rose color.`;

const SINGULAR = `ABSOLUTELY CRITICAL — SINGULARITY:
- EXACTLY ONE garment centered in the frame
- DO NOT show variants, sizes, multiple colors, or front+back views
- DO NOT show the same item in multiple poses
- ONE garment, ONE silhouette, dead center`;

const BABY_PROP = `BABY PROPORTIONS (CRITICAL — must read as BABY clothing, not adult):
- Short wide torso, short sleeves with cuffed wrists
- Tiny shoulder width, generous neckline for easy head-fit
- Soft rounded shapes, no sharp tailored lines
- Visibly sized for a 6-12 month infant — NOT a child or adult garment
- Looks adorable and chubby, NOT structured or grown-up`;

const STYLE_BASE = `Create a high-quality product-style illustration of a SINGLE baby clothing or accessory item for a mobile app UI.

STYLE:
- clean Scandinavian minimalism
- semi-realistic (NOT flat icon, NOT photo)
- premium product illustration

COMPOSITION:
- ONE centered item, fills ~70% of frame, FULL item visible (no cropping)
- balanced padding on all sides — top, bottom, left, right
- front-facing view, no rotation

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the item
- chroma-key for post-processing — will be stripped to transparent
- completely clean magenta fill, no gradients, no blue-gray tones

LIGHTING:
- soft top-left light source ON the item
- NO drop shadow under item, NO ambient shadow on bg
- shading only INSIDE the item shape

${CREAM_NOTE}`;

const GARMENTS = {
  // === A. Triptyk / duplikat ===
  "pyjamas": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single one-piece COTTON baby pajamas (footed sleeper, langermet body+bukse i ett), medium weight cotton. Soft WARM beige tone (not pink, not magenta, not lavender — only beige/cream). Front snap or zipper closure. ${BABY_PROP}`,

  "ull-pyjamas": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single one-piece WOOL baby pajamas (footed sleeper), visible subtle knit texture. Soft WARM beige tone (not pink, not magenta, not lavender — only beige/cream). Side-snap or front-snap closure. ${BABY_PROP}`,

  "tynn-bukse": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single pair of thin warm cotton baby pants (intermediate layer), soft warm beige tone, elastic waist, cuffed ankles, slightly thicker than 'lett-bukse'. ${BABY_PROP}`,

  "ull-bukse": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single pair of wool baby pants (mid layer), elastic waist, cuffed ankles, soft warm beige tone, visible knit texture. ${BABY_PROP}`,

  "lue-m-ull": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single BABY wool beanie with extra warm lining (lue m/ull). BABY-SPECIFIC: soft tie-strings hanging down under the chin (not adult beanie), small pompom on top, ear-flap-style longer sides covering ears, deep warm beige tone with subtle TERRACOTTA tie-strings. ${BABY_PROP}`,

  "vinterkjoredress-isolert": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single INSULATED winter baby one-piece pram suit (vinterkjøredress isolert) — visibly QUILTED puffy down-filled construction with diamond quilt pattern, hood up, deep charcoal tone, front zipper with TERRACOTTA zipper pull. ONLY ONE garment, NO front+back view comparison. ${BABY_PROP}`,

  "sauekinn-i-vogn": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single SHEEPSKIN pram liner (saueskinn i vogn) — soft natural sheepskin with visible fluffy wool fibers across the surface, warm beige / cream tone (NOT pink, NOT lilac, NOT magenta), shown laid flat as pram cover with subtle leather edge trim in warm tan.`,

  // === B. Despill-rester ===
  "toffel-sko": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single pair of soft baby SLIPPER-SHOES (tøffel-sko) shown together, soft warm beige fabric upper with DEEP BROWN leather sole (NEVER lilac, NEVER magenta sole), warm beige laces or velcro strap with TERRACOTTA accent button. ${BABY_PROP}`,

  "vintersko": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single pair of warm WINTER baby BOOTS shown together, deep charcoal felt-wool upper with warm beige fur trim at the top, sturdy DEEP BROWN rubber sole (NEVER lilac, NEVER magenta sole), TERRACOTTA accent button on the side. ${BABY_PROP}`,

  "kjoredress": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single one-piece baby pram suit (kjøredress), medium-weight outer shell with moderate insulation, hood up, deep muted NAVY blue tone (NOT gray-blue background — the GARMENT is navy, the BACKGROUND must be magenta), front zipper with TERRACOTTA zipper pull. ${BABY_PROP}`,

  // === C. Cut-off ===
  "ull-mellomlag-tykt": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single THICK wool mid-layer JACKET for baby — FULL garment visible from collar to hem with balanced padding above and below, dense visible knit weave, deep warm beige tone, full-zip front with TERRACOTTA zipper pull. ${BABY_PROP}`,

  // === D. Voksen-look ===
  "tynn-ull-mellomlag": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single THIN wool mid-layer cardigan for baby, button-up front with small TERRACOTTA buttons. ${BABY_PROP} — clearly BABY-sized: very short sleeves, wide chubby torso, oversized neck-opening, soft rolled cuffs. Soft warm cream tone, fine knit weave.`,

  "ull-mellomlag": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single wool mid-layer jacket for baby, full zipper at front with TERRACOTTA zipper pull, denser knit than thin version, warm beige tone. ${BABY_PROP} — very short BABY sleeves, wide chubby torso, soft rounded silhouette like a baby pullover.`,

  "ull-jakke": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single wool baby CARDIGAN, button-up front with small TERRACOTTA wooden buttons (NOT large adult buttons), soft warm beige tone, visible knit weave. ${BABY_PROP} — very short BABY sleeves, wide chubby torso, soft rolled neck.`,

  "lue-tynn": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single THIN lightweight cotton BABY beanie (lue tynn), single layer with soft TIE-STRINGS hanging down under the chin (baby-specific, NOT adult beanie), small soft top-knot or tiny pompom on top, soft warm beige tone, cuffed brim. ${BABY_PROP}`,

  "lue": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single warm WOOL BABY beanie, visible chunky knit ribbed cuff covering ears, soft TIE-STRINGS hanging down under chin (baby-specific), small pompom on top, warm beige tone. ${BABY_PROP}`,

  // === E. Feil tykkelse ===
  "lett-kjoredress": `${STYLE_BASE}\n\n${SINGULAR}\n\nGARMENT:\nONE single LIGHT one-piece baby pram suit (lett kjøredress). CRITICAL: this is a LIGHT outer layer — NO quilted padding, NO puffy down-fill, NO diamond quilt pattern. ONLY a THIN flat shell with smooth fabric (like a thin windbreaker for babies). Hood up, deep muted navy tone, front zipper with TERRACOTTA zipper pull. ${BABY_PROP}`,
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

console.log(`model=${MODEL} — runde 2 fix (${Object.keys(GARMENTS).length} bilder)`);
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
console.log(`\ndone — ${ok} new, ${failed} failed. Next: node scripts/postprocess-full-run.mjs`);
