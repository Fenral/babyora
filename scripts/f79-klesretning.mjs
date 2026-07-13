#!/usr/bin/env node
/* F79 Phase 3: 4 klesretning-prøver via Nano Banana Pro.
 *
 * Samme baby (referanse: avatar-A2.png) kledd i samme 3-lags antrekk med
 * Brevann-avledede plaggfarger, rendret i 4 ulike stil-retninger.
 * Panelet velger stil; vinneren styrer Phase 4 (layer-stack PoC).
 *
 * Plaggfarger fra docs/F79/farge-analyse.md (Brevann-nedstrøms):
 *   innerst  korall/terrakotta  ~hue 25-40, C>=0.12  → ca #D96B4A
 *   mellom   marigold/oker      ~hue 75-85           → ca #D9962B
 *   ytterst  dyp petrol          ~hue 220, lav L      → ca #1E4750
 *
 * Kost: 4 × ~$0.134 (gemini-3-pro-image) ≈ $0.54 ≈ ~6 NOK.
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
  } catch {
    /* ikke funnet */
  }
}
if (!API_KEY) {
  console.error('mangler GEMINI_API_KEY (env eller nøkkelfil)');
  process.exit(1);
}

const MODEL = 'gemini-3-pro-image';
const base = 'https://generativelanguage.googleapis.com/v1beta';

const REF_IMAGE = join(ROOT, 'public', 'avatars', 'avatar-A2.png');

const OUTFIT = `
THE SAME BABY as the reference image (same face shape, same proportions, same
character — a friendly toddler around 14 months old), standing, front-facing,
full body visible head to toe.

The baby wears exactly THREE visible clothing layers (Norwegian layered dressing):
1. INNER layer: long-sleeve wool bodysuit in warm coral/terracotta (#D96B4A) —
   visible at the collar and at the wrist cuffs peeking out from the mid layer.
2. MID layer: knitted wool sweater in golden marigold/ochre (#D9962B) —
   the main visible torso garment.
3. OUTER layer: open jacket/shell in deep petrol blue-green (#1E4750) —
   worn open so the marigold mid layer shows underneath.
Plus simple soft pants in a muted tone that complements the palette.

All three layer colors must be clearly distinguishable at small sizes.
The face is calm and friendly. No text, no logos, no numbers, no watermarks.
TRANSPARENT BACKGROUND (PNG with alpha — no background color, no scenery,
no ground shadow rectangle; a soft contact shadow under the feet is OK).
Centered subject with generous transparent margin. Square 1:1 composition.
`.trim();

const STYLES = [
  {
    id: 'stil-a-strikk',
    label: 'A — Skandinavisk strikk-realisme',
    style: `STYLE: Soft Scandinavian storybook textile illustration. Visible knitted
wool texture on the sweater (clear knit stitches), soft brushed wool feel on the
bodysuit, matte woven texture on the jacket. Warm, tactile, hand-illustrated
children's book quality (think modern Nordic picture books). Soft edges, gentle
shading, NOT photorealistic, NOT 3D-rendered, NOT flat vector.`,
  },
  {
    id: 'stil-b-clay',
    label: 'B — Myk 3D clay-render',
    style: `STYLE: Soft 3D claymation render, like a hand-sculpted plasticine
character. Matte clay material with visible volume and soft studio lighting from
top-left. Rounded, chunky, premium app-mascot quality (think modern 3D app
illustrations — Not Boring / Alan Mind grade). Subtle surface imperfections that
feel handmade. NOT glossy plastic, NOT photorealistic, NOT flat.`,
  },
  {
    id: 'stil-c-flat',
    label: 'C — Flat vektor-illustrativ',
    style: `STYLE: Clean flat vector illustration with bold simple shapes and
minimal shading (one soft shadow tone per color max). Confident thick-and-thin
outlines in a warm dark ink tone. Modern editorial app illustration quality
(think Headspace / Gentler Streak). Crisp edges, NOT 3D, NOT textured, NOT
photorealistic.`,
  },
  {
    id: 'stil-d-akvarell',
    label: 'D — Akvarell/organisk',
    style: `STYLE: Soft watercolor illustration with organic edges, gentle paper
texture within the shapes, colors bleeding slightly at boundaries. Loose but
controlled — premium hand-painted children's book quality. Light ink line work
holding the forms together. NOT digital-flat, NOT 3D, NOT photorealistic.`,
  },
];

const OUT_DIR = join(ROOT, 'public', 'avatars', 'f79-poc');
mkdirSync(OUT_DIR, { recursive: true });

const refB64 = readFileSync(REF_IMAGE).toString('base64');

async function generer({ id, label, style }) {
  const outPath = join(OUT_DIR, `${id}.png`);
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${id} (finnes allerede)`);
    return { id, skipped: true };
  }

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/png', data: refB64 } },
          { text: `Use the attached image ONLY as a character reference for the baby's identity and proportions (do NOT copy its clothing or its rendering style).\n\n${OUTFIT}\n\n${style}` },
        ],
      },
    ],
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
    console.error(`feil ${id}: HTTP ${res.status} — ${errBody.slice(0, 400)}`);
    return { id, ok: false };
  }

  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith('image/'),
  );
  if (!part) {
    console.error(`feil ${id}: ingen bildedata i svaret`);
    console.error(JSON.stringify(json).slice(0, 500));
    return { id, ok: false };
  }

  writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`ok   ${id} «${label}» (${elapsed}s) → ${outPath}`);
  return { id, ok: true };
}

console.log(`genererer ${STYLES.length} stil-prøver via ${MODEL}...`);
const results = [];
for (const v of STYLES) results.push(await generer(v));

const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => r.ok === false).length;
console.log(`\nferdig: ${ok} generert, ${failed} feilet`);
if (failed > 0) process.exit(1);
