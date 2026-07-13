#!/usr/bin/env node
/* Full-katalog regenerering med Nano Banana Pro (gemini-3-pro-image-preview).
 *
 * Genererer:
 *  - 60+ plagg (uavhengige, text-only) → review/nano-banana-pro/full-run/garments/
 *  - 9 avatarer (A1..A7 + A1-hat + A2-hat) → review/nano-banana-pro/full-run/avatars/
 *    (A1 er anker; alle andre kondisjoneres på A1 for ansiktskonsistens)
 *
 * Auto-resume: skipper bilder som allerede ligger på disk.
 * Postprocess (chroma-key magenta → transparent) kjøres etterpå av et separat skript.
 *
 * Kostnad: ~70 bilder × $0.134 ≈ $9.40 ≈ ~100 NOK (godkjent av Sivert).
 *
 * Usage:
 *   node scripts/generate-all-pro.mjs                 # alle, resume fra disk
 *   node scripts/generate-all-pro.mjs --only=lue,votter   # bare disse
 *   node scripts/generate-all-pro.mjs --avatars-only
 *   node scripts/generate-all-pro.mjs --garments-only
 *   node scripts/generate-all-pro.mjs --force         # overskriv eksisterende
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("missing GEMINI_API_KEY — set it in the environment and re-run.");
  process.exit(1);
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const AVATARS_ONLY = args.includes("--avatars-only");
const GARMENTS_ONLY = args.includes("--garments-only");
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? new Set(onlyArg.split("=")[1].split(",")) : null;
const MODEL = "gemini-3-pro-image-preview";
const base = "https://generativelanguage.googleapis.com/v1beta";

const OUT_ROOT = join(ROOT, "review", "nano-banana-pro", "full-run");
const OUT_GARM = join(OUT_ROOT, "garments");
const OUT_AVAT = join(OUT_ROOT, "avatars");
for (const d of [OUT_GARM, OUT_AVAT]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

// --- shared cream note (matches scripts/compare-nano-banana-pro.mjs) --------
const CREAM_NOTE = `BACKGROUND-FIT (IMPORTANT):
- This asset will be shown on a warm cream app background (#FAF6EF).
- Use warm, slightly desaturated Nordic tones that sit harmoniously on warm cream.
- Any near-white must be a WARM ivory/cream — never a cold bluish white, never pink.
- The signature accent is warm terracotta / burnt orange (#C8643C-ish); use it for accents.`;

const GARMENT_STYLE = `Create a high-quality product-style illustration of a baby clothing or accessory item for a mobile app UI.

STYLE:
- clean Scandinavian minimalism
- semi-realistic (NOT flat icon, NOT photo)
- looks like a premium product illustration used in a high-end mobile app
- soft, tactile, material-aware rendering

COMPOSITION:
- centered item on canvas, fills ~80% of frame, perfectly balanced padding
- front-facing view, no rotation
- no background scene, no environment

BACKGROUND:
- SOLID BRIGHT MAGENTA (#FF00FF) covering ALL canvas area outside the item shape
- chroma-key for post-processing — will be stripped to transparent
- the item itself must NEVER use magenta, pink, fuchsia, or hot-pink tones
- completely clean magenta fill, no gradients, no texture, no scenery

LIGHTING:
- soft top-left light source ON THE ITEM ITSELF
- subtle natural shading inside the item shape
- NO ambient shadow on the background
- NO drop shadow under the item
- shading and depth must be INSIDE the item shape only

MATERIAL RENDERING (VERY IMPORTANT):
- wool: slightly fuzzy texture, matte surface, subtle fiber noise
- cotton: softer, smoother, slightly lighter shading
- outerwear: smoother, slightly structured, light quilting or seam definition
- rubber/leather boots: more contrast, firmer highlights, clear sole edge
- knit items (hat, mittens): visible knit structure but subtle
- blankets/sacks: visible fold, drape, fabric softness

DETAILING:
- realistic seams, cuffs, folds
- gentle depth and volume (not flat)
- no over-detailing
- edges should be soft but precise (no blur)

COLOR:
- muted Nordic palette, natural and slightly desaturated
- avoid overly vibrant or playful tones
- near-white items must be a WARM ivory/cream (never pink, never cool white)
- example tones: warm beige, dusty brown, soft gray, deep muted navy (for outerwear)
- the BRAND ACCENT is warm terracotta (#C8643C-ish) — use it for snap buttons, zipper pulls, mitten trims, or other small focal points where it fits naturally

${CREAM_NOTE}

CONSISTENCY REQUIREMENTS:
- same perspective and scale as other items in the set
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
- NO drop shadow on the background
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

// --- full garment dictionary ----------------------------------------------
// detail = item-specific description appended to GARMENT_STYLE
const GARMENTS = {
  // Innerst
  "kortermet-body": "short-sleeve cotton baby bodysuit, snap buttons at bottom, soft WARM cream / ivory tone (not pink, not cool white).",
  "kortermet-ullbody": "short-sleeve MERINO WOOL baby bodysuit (warmer than cotton variant), subtle visible knit texture, soft warm cream tone.",
  "langermet-body": "long-sleeve cotton baby bodysuit, snap buttons at bottom and crotch, soft warm cream tone.",
  "langermet-ullbody": "long-sleeve MERINO WOOL baby bodysuit, subtle visible knit texture, soft warm cream tone.",
  "langermet-ullbody-tynn": "long-sleeve THIN merino wool baby bodysuit, finer thinner knit than standard ullbody, soft warm cream tone, lightweight feel.",
  "ullsett-tynt": "two-piece THIN wool set (long-sleeve top + matching wool pants) shown laid together, soft warm cream tone, fine knit.",
  "ullsett-tykt": "two-piece THICK wool set (long-sleeve top + matching wool pants), denser visible knit, warm beige tone.",
  "to-ullsett": "TWO wool sets stacked / overlapping (a thin one and a thick one), shown together as a pair, warm cream + beige.",
  "t-skjorte": "short-sleeve cotton baby T-shirt, soft warm cream tone, simple round neckline.",
  "shorts": "short cotton baby shorts, soft warm beige tone, elastic waist.",
  "lett-bukse": "thin lightweight cotton baby pants, soft warm beige tone, elastic waist.",
  "bleie": "modern disposable baby diaper (clean nappy product), soft warm white / cream tone, subtle absorbent texture, no character print.",
  "ullsokker": "pair of small WOOL baby socks shown together, warm beige tone, visible knit ribbing at the cuff.",

  // Mellomlag
  "tynn-bukse": "thin warm baby pants (intermediate layer), soft warm beige tone, elastic waist, slightly thicker than 'lett-bukse'.",
  "tynn-ull-mellomlag": "THIN wool mid-layer jacket for baby (full-zip or button-up), fine knit, soft warm cream tone.",
  "ull-mellomlag": "wool mid-layer jacket for baby, full zipper at front, denser knit than the thin version, warm beige tone.",
  "ull-mellomlag-tykt": "THICK wool mid-layer jacket for baby, dense visible knit, deep warm beige tone, full-zip.",
  "ull-jakke": "wool baby cardigan / jacket, button-up or zip front, soft warm beige tone, visible knit weave.",
  "ull-bukse": "wool baby pants (mid layer), elastic waist, soft warm beige tone, visible knit texture.",
  "tynn-pyjamas": "thin one-piece cotton baby pajamas (footed sleeper), soft warm cream tone, simple snap closures.",
  "pyjamas": "one-piece cotton baby pajamas (footed sleeper), medium weight, soft warm beige tone.",
  "ull-pyjamas": "one-piece WOOL baby pajamas (footed sleeper), visible knit texture, soft warm beige tone.",

  // Yttertøy
  "lett-kjoredress": "LIGHT one-piece baby pram suit (lett kjøredress), thin shell, light insulation, hood, deep muted navy or warm charcoal tone, front zipper.",
  "kjoredress": "one-piece baby pram suit (kjøredress), medium-weight outer shell with moderate insulation, hood, deep muted navy tone, front zipper.",
  "vinterkjoredress": "WINTER one-piece baby pram suit (vinterkjøredress), thick padded shell, hood, deep muted navy or charcoal tone, sturdy front zipper with TERRACOTTA accent on the zipper pull.",
  "vinterkjoredress-isolert": "INSULATED winter one-piece baby pram suit (vinterkjøredress isolert), visibly QUILTED puffy down-filled construction, hood, deep charcoal tone, front zipper with terracotta zipper pull.",
  "vinterdress": "two-piece WINTER baby snowsuit (vinterdress) — jacket + pants set shown together, deep muted navy tone, hood on jacket, terracotta zipper pull.",
  "vinterdress-isolert": "INSULATED two-piece winter baby snowsuit (vinterdress isolert), visibly QUILTED puffy down-filled jacket + pants set, deep charcoal tone, terracotta zipper pull.",
  "regntoy-skall": "RAIN shell jacket + pants set for baby (regntøy/skall), slick rubberized fabric, deep muted navy tone, hood, no insulation (thin shell).",
  "vindtett-skall": "WINDPROOF light shell jacket for baby (vindtett skall), thin non-insulated wind-blocking outer, soft warm beige or sand tone, hood, simple front zip.",

  // Hodeplagg
  "solhatt": "wide-brim baby SUN HAT (solhatt) in warm cream cotton with a soft fabric tie-string under chin.",
  "lue-tynn": "thin lightweight cotton baby beanie (lue tynn), single layer, soft warm beige tone, simple cuff.",
  "lue": "warm WOOL baby beanie (lue), visible chunky knit ribbed cuff, warm beige tone.",
  "lue-m-ull": "warm WOOL baby beanie with extra lining (lue m/ull), visible chunky knit, deep warm beige tone, cozy thick feel.",
  "balaklava": "warm WOOL baby BALACLAVA covering head + neck (face opening only), visible knit, deep warm beige tone.",

  // Hender
  "votter-tynne": "pair of THIN cotton baby mittens shown together, soft warm cream tone, simple cuff.",
  "votter": "pair of warm WOOL baby mittens shown together, visible knit texture, warm beige tone with a subtle TERRACOTTA cuff trim.",
  "votter-tykke": "pair of THICK wool baby mittens shown together, dense visible knit, deep warm beige tone with TERRACOTTA cuff trim.",
  "votter-dun": "pair of PUFFY DOWN-FILLED baby mittens shown together, deep charcoal puffy quilted shell, warm TERRACOTTA cuff trim.",
  "vindvotter-skall": "pair of WINDPROOF SHELL baby mittens shown together, slick deep navy or charcoal water/wind-resistant fabric, no visible insulation.",

  // Hals
  "hals": "tube-style baby NECK WARMER (hals/snood), soft wool knit, warm beige tone, visible knit pattern.",

  // Føtter
  "sko": "pair of simple soft-sole baby SHOES shown together, warm beige leather or canvas, no laces visible (velcro / slip-on style).",
  "toffel-sko": "pair of soft baby SLIPPER-SHOES (tøffel-sko), soft fabric upper with leather sole, warm beige tone, cozy indoor-outdoor feel.",
  "sandaler": "pair of summer baby SANDALS shown together, warm beige leather straps with velcro closure, light soles.",
  "vintersko": "pair of warm WINTER baby BOOTS shown together, deep charcoal upper with warm beige fur trim at the top, sturdy rubber sole.",
  "vintersko-isolerte": "pair of INSULATED winter baby boots shown together, thicker than standard vintersko, visible puffy padding, deep charcoal upper with TERRACOTTA accent on lacing or trim, sturdy rubber sole.",

  // Vogn-tilbehør
  "tynt-teppe": "thin folded baby blanket (cotton or muslin), clearly THIN and flat (not puffy, not padded), soft warm cream tone with subtle woven texture and edge detail.",
  "dunteppe": "PUFFY DOWN baby BLANKET, visibly quilted and padded, soft warm cream or sand tone, looks warm and cozy.",
  "varmepose-lett": "LIGHT pram footmuff / warmer-bag for baby (varmepose lett), thin shell, light insulation, deep muted navy tone, side zipper.",
  "varmepose": "standard pram footmuff / warmer-bag (varmepose), medium-weight insulation, deep muted navy or charcoal tone, side zipper, integrated foot pouch.",
  "varmepose-dun": "PUFFY DOWN-FILLED pram footmuff (varmepose dun), visibly quilted padded shell, deep charcoal tone, side zipper with TERRACOTTA zipper pull.",
  "sauekinn-i-vogn": "SHEEPSKIN pram liner (saueskinn i vogn) — soft natural sheepskin with visible fluffy wool fibers, warm beige / cream tone, shown laid flat as pram cover.",
  "regntrekk": "transparent baby pram RAIN COVER (regntrekk), clear plastic shape draped over an implied pram, very subtle outline only, just a hint of structure.",
  "regnponcho-over-baeresele": "baby RAIN PONCHO designed to cover a front baby carrier — soft rain-shell fabric in deep muted navy with hood and integrated baby carrier shape.",

  // Søvn
  "sovepose-0-5-tog": "VERY LIGHT 0.5 TOG baby sleep sack (sleeveless), envelope shape, extremely thin (almost like a thin cotton sheet bag), soft warm cream tone, shoulder snaps in TERRACOTTA.",
  "sovepose-1-0-tog": "baby sleep sack (sleeveless, light 1.0 TOG warmth), envelope shape with shoulder snaps, MINIMAL light padding so it clearly reads as a thin/light sack, soft warm beige tone with TERRACOTTA shoulder snaps.",
  "sovepose-2-5-tog": "MEDIUM 2.5 TOG baby sleep sack (sleeveless), envelope shape, moderate padding (clearly thicker than 1.0 but not as bulky as 3.5), warm beige tone with TERRACOTTA shoulder snaps.",
  "sovepose-3-0-3-5-tog": "WARM 3.0–3.5 TOG baby sleep sack (sleeveless), envelope shape, visibly THICK warm padding, deep warm beige tone, TERRACOTTA shoulder snaps.",
  "sovepose-3-5-tog": "WARMEST 3.5 TOG baby sleep sack (sleeveless), envelope shape, visibly THICK heavy padding (down or wool fill), deep warm beige or warm gray tone, TERRACOTTA shoulder snaps.",

  // Hud
  "ansiktskrem": "small jar of baby FACE CREAM, simple clean tub container, soft warm cream or beige label, minimalist Scandinavian product design — no text, just a clean tub shape.",
};

// --- avatar dictionary -----------------------------------------------------
// outfit = outfit-specific description appended to AVATAR_STYLE
// refId = reference image (always A1 except A1 itself, for facial consistency)
const AVATARS = {
  "avatar-A1": {
    outfit: `OUTFIT:\nThe baby wears only a thin cotton short-sleeve bodysuit in soft warm cream tone with bare chubby legs and bare feet — minimal outfit for warm summer weather. NO hat, NO head covering — the head is bare except for a little soft hair on top.`,
    refId: null, // anchor — no reference
  },
  "avatar-A1-hat": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears the same thin cotton short-sleeve bodysuit as A1 plus a wide-brim warm cream SUN HAT (solhatt) with a soft fabric tie-string under chin. Bare chubby legs and bare feet.`,
    refId: "avatar-A1",
  },
  "avatar-A2": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears a long-sleeve wool bodysuit (langermet ullbody) in soft warm cream tone plus thin wool pants in warm beige. Bare feet, no socks. NO hat — head bare with a little soft hair.`,
    refId: "avatar-A1",
  },
  "avatar-A2-hat": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears the same long-sleeve wool bodysuit + thin wool pants as A2 plus a soft warm wool beanie (lue) in warm beige tone. Bare feet.`,
    refId: "avatar-A1",
  },
  "avatar-A3": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears a wool mid-layer jacket (ull-mellomlag) as the OUTERMOST visible layer — warm beige knit with a front zipper, plus wool pants in matching warm beige. A wool beanie in warm beige covers the head. Soft wool socks on the feet.`,
    refId: "avatar-A1",
  },
  "avatar-A4": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears a LIGHT one-piece baby pram suit (lett kjøredress) — thin shell, light insulation, deep muted navy tone, front zipper with TERRACOTTA zipper pull. Hood up with a soft wool beanie peeking out underneath. Small warm boots on the feet.`,
    refId: "avatar-A1",
  },
  "avatar-A5": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears a winter one-piece pram suit (vinterkjøredress) — thicker padded shell than A4, deep muted navy or charcoal, front zipper with TERRACOTTA zipper pull, hood up with a wool balaclava peeking out around the face. Warm winter boots on the feet.`,
    refId: "avatar-A1",
  },
  "avatar-A6": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby wears a heavily insulated puffy winter snowsuit in deep charcoal tone with visible quilt channels, hood up with a thick wool balaclava underneath showing only the face, puffy down-filled mittens in WARM TERRACOTTA / burnt-orange tone (the signature brand accent), heavily insulated winter boots in charcoal. Cheeks slightly rosy from cold. Ready for severe frost.`,
    refId: "avatar-A1",
  },
  "avatar-A7": {
    outfit: `OUTFIT:\nThe SAME baby as the reference image (identical face, proportions, skin and expression). The baby is shown INSIDE a soft warm beige SLEEP SACK (sovepose) — sleeveless envelope shape covering torso and legs, only the head and tiny arms peek out at the top, TERRACOTTA shoulder snaps. NO hat. Soft sleeping expression — peaceful, calm, slightly drowsy (eyes can be soft / half-open, not deeply asleep).`,
    refId: "avatar-A1",
  },
};

// --- API call --------------------------------------------------------------
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

async function runOne(outPath, prompt, refBuffers = []) {
  if (!FORCE && existsSync(outPath)) {
    return { skipped: true, buf: readFileSync(outPath) };
  }
  console.log(`  generating ${outPath.split(/[\\/]/).slice(-2).join("/")}${refBuffers.length ? " (with ref)" : ""}...`);
  const buf = await generate(prompt, refBuffers);
  writeFileSync(outPath, buf);
  console.log(`    wrote ${buf.length} bytes`);
  return { skipped: false, buf };
}

// --- main ------------------------------------------------------------------
console.log(`model=${MODEL} — outputs under ${OUT_ROOT.replace(ROOT, "")}/`);

// 1) garments (independent, text-only) — could be parallelized but Gemini API
//    is rate-limited; serial is robust and ~30s/image.
if (!AVATARS_ONLY) {
  console.log(`\n=== GARMENTS (${Object.keys(GARMENTS).length}) ===`);
  let ok = 0, skipped = 0, failed = 0;
  for (const [id, detail] of Object.entries(GARMENTS)) {
    if (ONLY && !ONLY.has(id)) continue;
    const outPath = join(OUT_GARM, `${id}.png`);
    try {
      const r = await runOne(outPath, `${GARMENT_STYLE}\n\nGARMENT:\n${detail}`);
      if (r.skipped) skipped++;
      else ok++;
    } catch (e) {
      console.error(`  ${id} FAILED:`, e.message);
      failed++;
    }
  }
  console.log(`garments: ${ok} new, ${skipped} skipped (already on disk), ${failed} failed`);
}

// 2) avatars — A1 anchor first, others conditioned on A1
if (!GARMENTS_ONLY) {
  console.log(`\n=== AVATARS (${Object.keys(AVATARS).length}) ===`);

  // Always materialize A1 first if needed (anchor for the others)
  const a1Path = join(OUT_AVAT, "avatar-A1.png");
  let a1buf = null;
  const a1Spec = AVATARS["avatar-A1"];
  if (!ONLY || ONLY.has("avatar-A1")) {
    try {
      const r = await runOne(a1Path, `${AVATAR_STYLE}\n\n${a1Spec.outfit}`);
      a1buf = r.buf;
    } catch (e) {
      console.error(`  avatar-A1 FAILED:`, e.message);
    }
  } else if (existsSync(a1Path)) {
    a1buf = readFileSync(a1Path);
  }

  let ok = 0, skipped = 0, failed = 0;
  for (const [id, spec] of Object.entries(AVATARS)) {
    if (id === "avatar-A1") continue;
    if (ONLY && !ONLY.has(id)) continue;
    const outPath = join(OUT_AVAT, `${id}.png`);
    try {
      const refs = [];
      if (spec.refId === "avatar-A1") {
        if (!a1buf) {
          if (existsSync(a1Path)) a1buf = readFileSync(a1Path);
          else throw new Error("anchor avatar-A1.png not generated yet — run A1 first");
        }
        refs.push(a1buf);
      }
      const r = await runOne(outPath, `${AVATAR_STYLE}\n\n${spec.outfit}`, refs);
      if (r.skipped) skipped++;
      else ok++;
    } catch (e) {
      console.error(`  ${id} FAILED:`, e.message);
      failed++;
    }
  }
  console.log(`avatars: ${ok} new, ${skipped} skipped, ${failed} failed`);
}

console.log("\ndone — next: node scripts/postprocess-full-run.mjs");
