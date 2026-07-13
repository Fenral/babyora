#!/usr/bin/env node
/* F79 Phase 4c: Base-baby v2 — EKTE spedbarns-anatomi.
 *
 * Sivert 2026-07-02: «Jeg syns fortsatt ikke barnet ligner en baby.»
 * v1-basen leser som toddler/dukke: for moden ansiktsgeometri, voksent
 * hårfeste-mønster, for lange lemmer. Genererer 3 kandidater med
 * eksplisitt infant-anatomi; vinneren blir ny base for edit-kjeden.
 *
 * Kost: 3 × ~$0.134 ≈ ~4,2 NOK.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
const DIR = join(ROOT, 'public', 'avatars', 'f79-poc');

const BABY_ANATOMY = `
A BABY — a real INFANT around 9-11 months old. NOT a toddler, NOT a small
child, NOT a doll. Infant anatomy is CRITICAL and non-negotiable:

HEAD & FACE (most important):
- The head is VERY large relative to the body: roughly 1/3 of total height
- Huge round forehead taking up the top half of the head
- Facial features sit LOW on the face (eyes at or below the vertical
  midline of the head)
- Big round dark eyes, wide-set
- Tiny button nose, small soft mouth, gentle smile
- Very chubby round cheeks, soft double chin, NO jawline definition
- Small low-set ears

HAIR: only a soft light wisp of fine baby down on top of the head —
almost bald, NO hairline pattern, NO styled hair (adult hairline patterns
make it look like a middle-aged man).

BODY:
- Short, round, chubby body; round soft belly sticking out
- Short chubby arms and legs with soft fat rolls at wrists and thighs
- Tiny hands and feet
- Standing with feet apart in a slightly unsteady, wide baby stance,
  arms held slightly out for balance (typical new-stander posture)
- Wearing ONLY a simple soft white/cream cloth diaper

STYLE: Soft 3D claymation render, hand-sculpted plasticine feel, matte
material, soft studio lighting from TOP-LEFT, premium app-mascot quality
(Pixar-baby proportions, not doll proportions). NOT glossy, NOT
photorealistic, NOT flat vector.

CANVAS: TRANSPARENT BACKGROUND (PNG alpha), no scenery, tiny soft contact
shadow under the feet OK. Centered, baby occupies ~65-70% of canvas
height, generous transparent margin, square 1:1. Front-facing, calm and
friendly. No text, no watermarks.

This exact image becomes the frozen positioning reference for a dressing
animation — keep the pose simple, symmetric, stable.`.trim();

const KANDIDATER = [
  { id: 'base-v2a', tweak: 'Emphasis: maximum baby-ness — extra large head ratio (nearly 1/3), extra chubby cheeks, very round belly.' },
  { id: 'base-v2b', tweak: 'Emphasis: soft warmth — gentle warm skin tone with rosy cheeks, slightly tilted head for charm, tiny tuft of light-brown down.' },
  { id: 'base-v2c', tweak: 'Emphasis: app-mascot clarity — cleaner simpler clay forms, slightly bigger eyes, reads perfectly at 200px size.' },
];

async function gen({ id, tweak }) {
  const outPath = join(DIR, `${id}.png`);
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${id}`);
    return;
  }
  const body = {
    contents: [{ parts: [{ text: `${BABY_ANATOMY}\n\n${tweak}` }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  };
  const t0 = Date.now();
  const res = await fetch(`${base}/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`feil ${id}: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    return;
  }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith('image/'),
  );
  if (!part) {
    console.error(`feil ${id}: ingen bildedata`);
    return;
  }
  writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`ok   ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

for (const k of KANDIDATER) await gen(k);
console.log('base-v2-kandidater ferdig');
