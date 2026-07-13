#!/usr/bin/env node
/* Nano Banana 2 — generate Babyora garment illustrations with anatomic placement.
 *
 * Cost ~$0.039 per garment.
 *
 * Usage:
 *   node scripts/generate-garments.mjs --set=test    # generate fase 1 test-set (8 plagg)
 *   node scripts/generate-garments.mjs --set=all     # generate all 61
 *   node scripts/generate-garments.mjs --set=test --force   # re-run even if exists
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

const STYLE_BASE = `Create a high-quality product-style illustration of a baby clothing item for a mobile app UI.

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
- muted Nordic palette
- color should feel natural and slightly desaturated
- avoid overly vibrant or playful tones
- example tones:
  - warm beige
  - dusty brown
  - soft gray
  - deep muted navy (for outerwear)

CONSISTENCY REQUIREMENTS:
- same perspective and scale as other garments in set
- consistent lighting direction (top-left)
- consistent shadow strength
- consistent thickness of outlines (very subtle or none)

UI-READINESS:
- must look good at small sizes (mobile list view)
- strong silhouette recognition
- no unnecessary micro-details that disappear when scaled down

STRICT RULES:
- no text
- no logos
- no human models
- no background objects
- no patterns unless part of material (e.g. knit)
- no stylization drift
- no shadows extending beyond the garment shape
- no magenta tint on the garment edges (clean separation between garment and chroma-key)

OUTPUT:
- square format (1:1)
- high resolution
- crisp edges`;

const GARMENTS = [
  {
    id: "langermet-ullbody",
    set: "test",
    detail: `GARMENT:\nlong-sleeve wool bodysuit for baby (inner layer), snap buttons at bottom, warm light beige / oat tone.`,
  },
  {
    id: "ull-bukse",
    set: "test",
    detail: `GARMENT:\nsoft wool baby pants (mid layer), elastic waistband, slightly loose fit, dusty brown tone.`,
  },
  {
    id: "ull-mellomlag",
    set: "test",
    detail: `GARMENT:\nsoft wool baby sweater (mid layer), crew neckline, long sleeves, warm taupe tone.`,
  },
  {
    id: "vinterdress",
    set: "test",
    detail: `GARMENT:\nbaby winter snowsuit (outer layer), padded, hooded, full-body suit, deep muted navy tone.`,
  },
  {
    id: "lue",
    set: "test",
    detail: `GARMENT:\nknitted wool beanie for baby, simple folded edge, soft gray tone.`,
  },
  {
    id: "vintersko",
    set: "test",
    detail: `GARMENT:\nbaby winter boots, slightly chunky, matte rubber sole, dark charcoal tone with warm leather hint.`,
  },
  {
    id: "votter",
    set: "test",
    detail: `GARMENT:\npair of knitted wool baby mittens shown side-by-side, ribbed cuff, soft light gray tone.`,
  },
  {
    id: "sovepose-2-5-tog",
    set: "test",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, medium 2.5 TOG warmth), envelope shape with shoulder snaps, light padding, soft warm beige tone.`,
  },

  // ─── PHASE 2 ─── 53 plagg ───────────────────────────────────────

  // Innerst (12 nye)
  {
    id: "kortermet-body",
    set: "phase2",
    detail: `GARMENT:\nshort-sleeve cotton bodysuit for baby (inner layer), snap buttons at bottom, soft cream / off-white tone.`,
  },
  {
    id: "kortermet-ullbody",
    set: "phase2",
    detail: `GARMENT:\nshort-sleeve wool bodysuit for baby (inner layer), snap buttons at bottom, warm light beige / oat tone.`,
  },
  {
    id: "langermet-body",
    set: "phase2",
    detail: `GARMENT:\nlong-sleeve cotton bodysuit for baby (inner layer), snap buttons at bottom, soft cream / off-white tone.`,
  },
  {
    id: "langermet-ullbody-tynn",
    set: "phase2",
    detail: `GARMENT:\nthin long-sleeve wool bodysuit for baby (light inner layer), thinner fabric than standard wool, snap buttons at bottom, soft warm beige tone.`,
  },
  {
    id: "ullsett-tynt",
    set: "phase2",
    detail: `GARMENT:\ntwo-piece thin wool base layer set for baby (long-sleeve top + matching leggings, shown side-by-side), warm light beige tone.`,
  },
  {
    id: "ullsett-tykt",
    set: "phase2",
    detail: `GARMENT:\ntwo-piece thick wool base layer set for baby (long-sleeve top + matching leggings, shown side-by-side), chunkier knit than thin version, dusty brown tone.`,
  },
  {
    id: "to-ullsett",
    set: "phase2",
    detail: `GARMENT:\ntwo wool base layer sets shown layered on top of each other (one slightly behind the other suggesting double-layering), warm beige tones with subtle differentiation.`,
  },
  {
    id: "t-skjorte",
    set: "phase2",
    detail: `GARMENT:\nplain short-sleeve t-shirt for child (cotton, inner layer for warm weather), soft cream tone.`,
  },
  {
    id: "shorts",
    set: "phase2",
    detail: `GARMENT:\nplain cotton shorts for child, elastic waistband, warm taupe tone.`,
  },
  {
    id: "lett-bukse",
    set: "phase2",
    detail: `GARMENT:\nlightweight casual trousers for child (cotton or jersey), elastic waistband, soft sand tone.`,
  },
  {
    id: "bleie",
    set: "phase2",
    detail: `GARMENT:\nmodern reusable cloth diaper for baby, hook-and-loop tab closure, soft cream / off-white tone.`,
  },
  {
    id: "ullsokker",
    set: "phase2",
    detail: `GARMENT:\npair of wool socks for baby shown side-by-side, ribbed cuff, soft warm beige tone.`,
  },

  // Mellomlag (7 nye)
  {
    id: "tynn-bukse",
    set: "phase2",
    detail: `GARMENT:\nthin mid-layer trousers for child (jersey or fleece), elastic waistband, soft gray tone.`,
  },
  {
    id: "tynn-ull-mellomlag",
    set: "phase2",
    detail: `GARMENT:\nthin wool mid-layer top for baby (long-sleeve sweater), crew neckline, warm light beige tone.`,
  },
  {
    id: "ull-mellomlag-tykt",
    set: "phase2",
    detail: `GARMENT:\nthick wool mid-layer top for baby (chunky knit sweater), crew neckline, deep dusty brown tone.`,
  },
  {
    id: "ull-jakke",
    set: "phase2",
    detail: `GARMENT:\nwool jacket for baby (full-zip front, mid-layer), warm taupe tone with subtle zipper line.`,
  },
  {
    id: "tynn-pyjamas",
    set: "phase2",
    detail: `GARMENT:\nthin two-piece cotton pyjamas for baby (long-sleeve top + matching bottoms, shown side-by-side), soft cream tone.`,
  },
  {
    id: "pyjamas",
    set: "phase2",
    detail: `GARMENT:\nstandard two-piece cotton pyjamas for baby (long-sleeve top + matching bottoms, shown side-by-side), warm beige tone.`,
  },
  {
    id: "ull-pyjamas",
    set: "phase2",
    detail: `GARMENT:\ntwo-piece wool pyjamas for baby (long-sleeve top + matching bottoms, shown side-by-side), ribbed knit texture, dusty brown tone.`,
  },

  // Yttertøy (7 nye)
  {
    id: "lett-kjoredress",
    set: "phase2",
    detail: `GARMENT:\nlight one-piece stroller overall for baby (outer layer, thin shell, full body suit), soft gray tone with subtle zipper line.`,
  },
  {
    id: "kjoredress",
    set: "phase2",
    detail: `GARMENT:\nstandard one-piece stroller overall for baby (outer layer, padded full body suit with hood), warm dusty brown tone.`,
  },
  {
    id: "vinterkjoredress",
    set: "phase2",
    detail: `GARMENT:\nwinter one-piece stroller overall for baby (outer layer, heavily padded full body suit with hood), deep muted navy tone.`,
  },
  {
    id: "vinterkjoredress-isolert",
    set: "phase2",
    detail: `GARMENT:\nheavily insulated winter one-piece stroller overall for baby (outer layer, puffy quilted full body suit with insulated hood), deep muted charcoal tone.`,
  },
  {
    id: "vinterdress-isolert",
    set: "phase2",
    detail: `GARMENT:\nheavily insulated two-piece winter outdoor overall for toddler (puffy quilted jacket + bib pants, shown as one stacked composition with jacket above bib pants), deep muted charcoal tone.`,
  },
  {
    id: "regntoy-skall",
    set: "phase2",
    detail: `GARMENT:\nchildren's two-piece rain set (jacket + rain trousers, shown side-by-side), smooth matte waterproof shell finish, soft slate blue tone.`,
  },
  {
    id: "vindtett-skall",
    set: "phase2",
    detail: `GARMENT:\nslim windproof shell jacket for child (outer layer, smooth matte finish with hood and zipper), soft slate gray tone.`,
  },

  // Ekstra · Hodeplagg (4 nye)
  {
    id: "solhatt",
    set: "phase2",
    detail: `GARMENT:\nchildren's sun hat with wide brim and chin strap, soft sand / cream tone.`,
  },
  {
    id: "lue-tynn",
    set: "phase2",
    detail: `GARMENT:\nthin knit cotton beanie for baby, simple folded edge, soft cream tone.`,
  },
  {
    id: "lue-m-ull",
    set: "phase2",
    detail: `GARMENT:\nthick wool beanie for baby with ear flaps and braided ties, deep warm brown tone.`,
  },
  {
    id: "balaklava",
    set: "phase2",
    detail: `GARMENT:\nchildren's wool balaclava (full head hood with face opening, covering ears and neck), deep muted navy tone.`,
  },

  // Ekstra · Hender (4 nye)
  {
    id: "votter-tynne",
    set: "phase2",
    detail: `GARMENT:\npair of thin knit mittens for baby shown side-by-side, ribbed cuff, soft cream tone.`,
  },
  {
    id: "votter-tykke",
    set: "phase2",
    detail: `GARMENT:\npair of thick chunky wool mittens for baby shown side-by-side, ribbed cuff, dusty brown tone.`,
  },
  {
    id: "votter-dun",
    set: "phase2",
    detail: `GARMENT:\npair of puffy down-filled mittens for baby shown side-by-side, visible quilted padding, deep muted navy tone.`,
  },
  {
    id: "vindvotter-skall",
    set: "phase2",
    detail: `GARMENT:\npair of windproof shell mittens for baby shown side-by-side, smooth matte finish with elastic cuff, slate gray tone.`,
  },

  // Ekstra · Hals (1 ny)
  {
    id: "hals",
    set: "phase2",
    detail: `GARMENT:\nchildren's wool neck warmer / buff (tube shape), ribbed knit, warm dusty brown tone.`,
  },

  // Ekstra · Føtter (4 nye)
  {
    id: "sko",
    set: "phase2",
    detail: `GARMENT:\npair of children's casual everyday shoes shown side-by-side, hook-and-loop strap closure, warm light beige tone with darker sole.`,
  },
  {
    id: "toffel-sko",
    set: "phase2",
    detail: `GARMENT:\npair of soft baby slipper shoes shown side-by-side (felted wool or soft leather, indoor / carrier use), warm taupe tone.`,
  },
  {
    id: "sandaler",
    set: "phase2",
    detail: `GARMENT:\npair of children's summer sandals shown side-by-side, soft straps, warm sand tone with darker sole.`,
  },
  {
    id: "vintersko-isolerte",
    set: "phase2",
    detail: `GARMENT:\npair of heavily insulated children's winter boots shown side-by-side, puffy quilted upper with chunky matte rubber sole, deep muted charcoal tone.`,
  },

  // Ekstra · Vogn-tilbehør (8 nye)
  {
    id: "tynt-teppe",
    set: "phase2",
    detail: `GARMENT:\nthin folded baby blanket (cotton or muslin), soft cream tone with subtle edge detail.`,
  },
  {
    id: "dunteppe",
    set: "phase2",
    detail: `GARMENT:\nfolded puffy down blanket for stroller, visible quilted channels, warm beige tone.`,
  },
  {
    id: "varmepose-lett",
    set: "phase2",
    detail: `GARMENT:\nlight stroller footmuff (elongated envelope shape), thin fleece-lined shell, soft gray tone with zipper.`,
  },
  {
    id: "varmepose",
    set: "phase2",
    detail: `GARMENT:\nstandard padded stroller footmuff (elongated envelope shape with hood opening), warm dusty brown tone.`,
  },
  {
    id: "varmepose-dun",
    set: "phase2",
    detail: `GARMENT:\nheavily down-filled stroller footmuff (puffy quilted envelope shape), deep muted navy tone with cream fur trim hint.`,
  },
  {
    id: "sauekinn-i-vogn",
    set: "phase2",
    detail: `GARMENT:\nsheepskin stroller liner (rounded rectangular pelt with visible soft wool texture at edges), natural cream wool tone.`,
  },
  {
    id: "regntrekk",
    set: "phase2",
    detail: `GARMENT:\ntransparent stroller rain cover (clear plastic dome shape with visible structural seams), neutral edge trim.`,
  },
  {
    id: "regnponcho-over-baeresele",
    set: "phase2",
    detail: `GARMENT:\nrain poncho designed to cover both parent and baby in a carrier (long flared shape with large hood opening), smooth matte waterproof shell, slate gray tone.`,
  },

  // Ekstra · Søvn (4 nye)
  {
    id: "sovepose-0-5-tog",
    set: "phase2",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, very thin 0.5 TOG summer warmth), envelope shape with shoulder snaps, almost flat with minimal padding, soft cream tone.`,
  },
  {
    id: "sovepose-1-0-tog",
    set: "phase2",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, light 1.0 TOG warmth), envelope shape with shoulder snaps, light padding, soft warm beige tone.`,
  },
  {
    id: "sovepose-3-0-3-5-tog",
    set: "phase2",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, thick 3.0-3.5 TOG winter warmth), envelope shape with shoulder snaps, puffy quilted padding, dusty brown tone.`,
  },
  {
    id: "sovepose-3-5-tog",
    set: "phase2",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, heaviest 3.5 TOG winter warmth), envelope shape with shoulder snaps, very puffy quilted padding, deep muted navy tone.`,
  },

  // Ekstra · Hud (1 ny)
  {
    id: "ansiktskrem",
    set: "phase2",
    detail: `GARMENT:\nsmall tube of children's face cream (smooth cylindrical container with cap, standing upright), soft cream / off-white tone with subtle cap detail.`,
  },

  // ─── ALTERNATIVER (ikke-ull) + nye TOG-trinn ─── kjør: --set=alternatives ───
  // Brukes i Min garderobe / pros-cons-sammenligning. Hold samme STYLE_BASE.
  {
    id: "tynn-fleece",
    set: "alternatives",
    detail: `GARMENT:\nthin fleece baby mid-layer top (lighter weight than wool sweater), crew neckline, long sleeves, smooth synthetic fleece texture, cool light grey tone.`,
  },
  {
    id: "fleecedress",
    set: "alternatives",
    detail: `GARMENT:\nfleece baby overall / one-piece (mid layer), full-length zipper hinted, soft synthetic fleece, mid grey tone.`,
  },
  {
    id: "fleecejakke",
    set: "alternatives",
    detail: `GARMENT:\nfleece baby jacket (mid layer), full front zipper line, stand-up collar, soft synthetic fleece texture, slate grey tone.`,
  },
  {
    id: "fleecebukse",
    set: "alternatives",
    detail: `GARMENT:\nfleece baby trousers (mid layer), elastic waistband, soft synthetic fleece, mid grey tone.`,
  },
  {
    id: "tynne-sko",
    set: "alternatives",
    detail: `GARMENT:\nlightweight thin baby shoes (soft everyday shoe, not winter boot), single Velcro strap hinted, warm light grey tone.`,
  },
  {
    id: "tykk-fleece",
    set: "alternatives",
    detail: `GARMENT:\nthick fleece baby sweater (warm mid layer), crew neckline, long sleeves, chunkier than thin fleece, charcoal grey tone.`,
  },
  {
    id: "fleecevotter",
    set: "alternatives",
    detail: `GARMENT:\npair of fleece baby mittens shown side-by-side, smooth synthetic fleece (not knitted), soft mid grey tone.`,
  },
  {
    id: "bomullssokker",
    set: "alternatives",
    detail: `GARMENT:\npair of cotton baby socks shown side-by-side, ribbed cuff hinted, soft white tone.`,
  },
  {
    id: "bomullssett",
    set: "alternatives",
    detail: `GARMENT:\ntwo-piece cotton baby base layer set (long-sleeve top + leggings) laid flat side by side, soft white tone.`,
  },
  {
    id: "sovepose-1-5-tog",
    set: "alternatives",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, 1.5 TOG, between light and medium warmth), envelope shape with shoulder snaps, light-medium padding, warm light grey tone.`,
  },
  {
    id: "sovepose-2-0-tog",
    set: "alternatives",
    detail: `GARMENT:\nbaby sleep sack (sleeveless, 2.0 TOG, just below medium warmth), envelope shape with shoulder snaps, medium padding, soft mid grey tone.`,
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

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const setArg = args.find((a) => a.startsWith("--set="));
const SET = setArg ? setArg.split("=")[1] : "test";

const OUT_DIR = join(ROOT, "public", "illustrations", "garments");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const filtered = SET === "all" ? GARMENTS : GARMENTS.filter((g) => g.set === SET);
console.log(`generating ${filtered.length} garments (set=${SET})...`);

for (const g of filtered) {
  const outPath = join(OUT_DIR, `${g.id}.png`);
  if (!FORCE && existsSync(outPath)) {
    console.log(`skip ${g.id} (exists)`);
    continue;
  }
  const fullPrompt = `${STYLE_BASE}\n\n${g.detail}`;
  console.log(`generating ${g.id}...`);
  try {
    const buf = await generate(fullPrompt);
    writeFileSync(outPath, buf);
    console.log(`  wrote ${outPath} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`  ${g.id} failed:`, e.message);
  }
}
console.log("done");
