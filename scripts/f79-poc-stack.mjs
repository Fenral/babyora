#!/usr/bin/env node
/* F79 Phase 4: Layer-stack PoC — frossen clay-base + plagg-overlays + vær-ikon.
 *
 * ANATOMI-HYPOTESEN: hvert plagg genereres MED base-bildet som posisjons-
 * referanse og instrueres til å lande på NØYAKTIG samme canvas-posisjon,
 * slik at overlay-PNG-en kan legges rett oppå basen uten transform.
 *
 * Steg 1: base (clay-baby i bleie, mer hår enn stil-b-prøven)
 * Steg 2: 4 plagg-overlays sekvensielt, hver med basen som referanse
 * Steg 3: 1 vær-ikon (klarvær, clay-sol i marigold)
 *
 * Kost: 6 × ~$0.134 ≈ $0.80 ≈ ~8,5 NOK.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  try {
    API_KEY = readFileSync(
      'C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt',
      'utf8',
    ).trim();
  } catch {}
}
if (!API_KEY) {
  console.error('mangler GEMINI_API_KEY');
  process.exit(1);
}

const MODEL = 'gemini-3-pro-image';
const base = 'https://generativelanguage.googleapis.com/v1beta';
const OUT_DIR = join(ROOT, 'public', 'avatars', 'f79-poc');
mkdirSync(OUT_DIR, { recursive: true });

const STYLE = `Soft 3D claymation render, hand-sculpted plasticine feel, matte
material, soft studio lighting from TOP-LEFT, premium app-mascot quality.
NOT glossy, NOT photorealistic, NOT flat vector.`;

async function call(parts, outPath, label) {
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  };
  const startedAt = Date.now();
  const res = await fetch(`${base}/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`feil ${label}: HTTP ${res.status} — ${errBody.slice(0, 300)}`);
    return false;
  }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith('image/'),
  );
  if (!part) {
    console.error(`feil ${label}: ingen bildedata`);
    console.error(JSON.stringify(json).slice(0, 400));
    return false;
  }
  writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`ok   ${label} (${((Date.now() - startedAt) / 1000).toFixed(1)}s) → ${outPath}`);
  return true;
}

const img = (p) => ({
  inlineData: { mimeType: 'image/png', data: readFileSync(p).toString('base64') },
});

const force = process.argv.includes('--force');
const skipIf = (p, label) => {
  if (existsSync(p) && !force) {
    console.log(`hopper over ${label} (finnes)`);
    return true;
  }
  return false;
};

/* ---------- Steg 1: BASE ---------- */
const BASE_PATH = join(OUT_DIR, 'base.png');
if (!skipIf(BASE_PATH, 'base')) {
  const ok = await call(
    [
      img(join(OUT_DIR, 'stil-b-clay.png')),
      {
        text: `Use the attached image ONLY as style and character reference (same
baby character, same claymation rendering, same lighting) — do NOT copy its
clothing.

Create the BASE STATE of this baby for a dressing animation:
- Same friendly toddler (~14 months), standing, front-facing, full body
  head to toe, arms relaxed slightly out from the body
- Wearing ONLY a simple soft white/cream diaper — bare torso, bare arms,
  bare legs, bare feet
- Give the baby slightly MORE soft wispy light-brown hair than the
  reference (the reference is too bald/doll-like) and a warm gentle
  expression
- ${STYLE}
- TRANSPARENT BACKGROUND (PNG alpha). No scenery. A tiny soft contact
  shadow under the feet is OK.
- Centered, generous transparent margin (baby occupies ~70% of canvas
  height), square 1:1
- No text, no watermarks

CRITICAL: This exact image becomes the positioning reference for garment
overlays — keep the pose simple, symmetric and stable.`,
      },
    ],
    BASE_PATH,
    'base',
  );
  if (!ok) process.exit(1);
}

/* ---------- Steg 2: PLAGG-OVERLAYS ---------- */
const OVERLAY_RULES = `THE ATTACHED IMAGE IS THE EXACT BABY THE GARMENT MUST FIT.

Output ONLY the garment — absolutely no baby, no skin, no face, no hair,
no other garments — floating on a FULLY TRANSPARENT background.

POSITIONING (CRITICAL): Same square 1:1 canvas as the attached image.
Place and scale the garment EXACTLY where it would sit when worn by the
attached baby — so that overlaying your output directly on top of the
attached image (same size, no offset) dresses the baby perfectly. Match
the baby's pose: arms slightly out, legs straight.

SHAPE: The garment has internal volume, shaped as if the baby's body is
inside it but invisible (bent at the same joints, same proportions).
NOT flat, NOT folded, NOT a product photo.

${STYLE}
Same TOP-LEFT lighting as the attached image so shading matches when
stacked. No text, no watermarks.`;

const GARMENTS = [
  {
    id: 'lag-1-body',
    text: `GARMENT: Long-sleeve wool bodysuit (inner layer) in warm coral/
terracotta (#D96B4A), with small snap buttons at the crotch. Covers torso,
both arms to the wrists, and the diaper area. Soft brushed wool surface.`,
  },
  {
    id: 'lag-2-bukse',
    text: `GARMENT: Soft wool baby pants (covering both legs from waist to
ankles) in a muted blue-grey petrol tone (#5A7480), elastic waistband.
Both legs shaped as if filled by the baby's legs, ankle cuffs visible.
They sit OVER the lower part of the bodysuit (waistband slightly below
where the bodysuit torso ends).`,
  },
  {
    id: 'lag-3-genser',
    text: `GARMENT: Knitted wool sweater (mid layer) in golden marigold/ochre
(#D9962B) with clearly visible chunky knit stitches. Covers torso and both
arms, slightly shorter sleeves than the bodysuit so a hint of coral cuff
would show at the wrists (leave the wrist area open/ending just before
the wrist). Hem ends at the hips, OVER the pants waistband.`,
  },
  {
    id: 'lag-4-jakke',
    text: `GARMENT: Open outdoor jacket/shell (outer layer) in deep petrol
blue-green (#1E4750) with a soft hood resting on the back. Worn OPEN —
the front is unzipped showing a wide gap where the sweater underneath
would be visible. Covers shoulders, both arms fully to the wrists, torso
sides. Slightly puffy, matte technical-fabric-in-clay feel.`,
  },
];

for (const g of GARMENTS) {
  const p = join(OUT_DIR, `${g.id}.png`);
  if (skipIf(p, g.id)) continue;
  const ok = await call(
    [img(BASE_PATH), { text: `${OVERLAY_RULES}\n\n${g.text}` }],
    p,
    g.id,
  );
  if (!ok) console.error(`  (${g.id} feilet — fortsetter med resten)`);
}

/* ---------- Steg 3: VÆR-IKON ---------- */
const SUN_PATH = join(ROOT, 'public', 'weather-3d');
mkdirSync(SUN_PATH, { recursive: true });
const sunFile = join(SUN_PATH, 'klarvaer.png');
if (!skipIf(sunFile, 'klarvaer')) {
  await call(
    [
      {
        text: `A single volumetric 3D sun icon for a premium weather app.
${STYLE}
The sun is a soft rounded clay sphere in warm golden marigold (#D9962B
core, slightly lighter #E8B04B highlights) with 8 short rounded chunky
clay rays around it. Gentle, friendly, calm — NOT cartoonish smiley,
NO face. Subtle matte surface with soft top-left lighting.
TRANSPARENT BACKGROUND (PNG alpha), centered, generous margin,
square 1:1. No text, no watermarks.`,
      },
    ],
    sunFile,
    'klarvaer',
  );
}

console.log('\nPoC-generering ferdig.');
