#!/usr/bin/env node
/* F62.1: Sjekk-nakke dark-mode-variant via Nano Banana Pro.
 *
 * F62 leverte en light-mode-optimert PNG (warm cream + terracotta) som "svever"
 * mot mørk warm-grey surface i dark-mode. Denne genererer 3 desaturerte varianter
 * tilpasset oklch(0.30 0.008 68)-bakgrunn.
 *
 * Kost: ~$0.13/bilde (Pro) × 3 ≈ $0.39 ≈ ~4 NOK. Innenfor spend-cap.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
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

const PROMPT = `
Baby illustration for dark-mode UI. Composition: parent's adult hand reaching from
the side and gently placing two fingers on the back of a baby's neck (back-of-neck
2-finger temperature check). The baby is shown from behind/three-quarter back,
seated or held, wearing a soft collared garment.

Use DESATURATED WARM tones suitable for a dark warm-grey background:
- Skin: muted golden-tan around #C8A57E (avoid bright pink or peach)
- Collar/garment: darker muted terracotta-rust around #9C4A2E (NOT bright orange)
- Line-art / outlines: warm dark brown around #5C4332 (softer than pure black)
- Hair: warm dark brown
- Optional very subtle warm shadow under the body

Style: flat-vector storybook illustration, soft rounded shapes, friendly and calm,
hand-drawn feel. NOT photorealistic, NOT 3D-rendered, NOT glossy.

TRANSPARENT BACKGROUND (PNG with alpha channel — no background color, no rectangle).
Same proportions and composition as the existing light version so it can swap in
the same UI slot at 96×128 px. Centered subject, generous transparent margin.

The whole illustration should feel cohesive when placed on a dark warm-grey
surface (oklch(0.30 0.008 68), roughly #4a443f). Avoid pure white, avoid bright
saturated colors, avoid harsh neon, avoid any text/letters/numbers/watermarks.
`.trim();

const VARIANTS = [
  {
    id: 'sjekk-nakke-dark-v1',
    note: 'Softer, slightly more muted palette. Baby slightly turned toward viewer.',
  },
  {
    id: 'sjekk-nakke-dark-v2',
    note: 'A touch warmer terracotta on the collar, slightly more contrast in outlines.',
  },
  {
    id: 'sjekk-nakke-dark-v3',
    note: 'Most subdued — minimal outlines, soft fill-only feel, closest to silhouette.',
  },
];

const OUT_DIR = join(ROOT, 'public', 'illustrations');
mkdirSync(OUT_DIR, { recursive: true });

async function generer({ id, note }) {
  const outPath = join(OUT_DIR, `${id}.png`);
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${id} (finnes allerede)`);
    return { id, skipped: true };
  }

  const prompt = `${PROMPT}\n\nVariant: ${note}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
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
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) {
    console.error(`feil ${id}: ingen bildedata i svaret`);
    console.error(JSON.stringify(json).slice(0, 500));
    return { id, ok: false };
  }

  writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`ok   ${id} (${elapsed}s) → ${outPath}`);
  return { id, ok: true };
}

console.log(`genererer ${VARIANTS.length} varianter via ${MODEL}...`);
const results = [];
for (const v of VARIANTS) results.push(await generer(v));

const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => r.ok === false).length;
console.log(`\nferdig: ${ok} generert, ${failed} feilet`);

// Kopier v1 til default sjekk-nakke-dark.png hvis den finnes
const v1Path = join(OUT_DIR, 'sjekk-nakke-dark-v1.png');
const defaultPath = join(OUT_DIR, 'sjekk-nakke-dark.png');
if (existsSync(v1Path)) {
  copyFileSync(v1Path, defaultPath);
  console.log(`kopiert v1 → sjekk-nakke-dark.png (default)`);
}

if (failed > 0) process.exit(1);
