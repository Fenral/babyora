#!/usr/bin/env node
/* Nano Banana 2 image generator for Klemeg character + onboarding assets.
 *
 * Generates:
 *   - 7 transparent weather-character variants (sommer → streng frost)
 *   - 4 onboarding scenes (steg 1 navn, steg 2 fødselsdato, steg 3 sted, ferdig)
 *
 * Reads GEMINI_API_KEY from the user's nano-banana key file.
 *
 * Cost: ~$0.039 per image × 11 images ≈ $0.43 ≈ 5 NOK.
 *
 * Usage:
 *   node scripts/generate-klemeg-characters.mjs                # everything
 *   node scripts/generate-klemeg-characters.mjs --only=klemeg-kald  # one prompt
 *   node scripts/generate-klemeg-characters.mjs --force        # overwrite existing
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

// ── API key loader ─────────────────────────────────────────────
let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  try {
    API_KEY = readFileSync(
      'C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt',
      'utf8',
    ).trim();
  } catch {
    /* fall through */
  }
}
if (!API_KEY) {
  console.error('missing GEMINI_API_KEY');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ── Shared style guidelines (Klemeg character) ─────────────────
const CHARACTER_BRIEF = `
This is "Lillian", the recurring character of Klemeg — a Norwegian baby-dressing
app for children 0-2 years. She is a 14-month-old toddler with soft cheeks,
small rounded features, dark brown hair peeking out under whatever hat she wears,
and warm light skin. Her expression is calm and content — never exaggerated.

Visual technique: soft watercolor with subtle pencil-line outline. Edges are
delicate, not harsh. Texture suggests handmade paper. NOT vector-flat,
NOT cartoon-glossy, NOT 3D-rendered.

Color palette (use these and only these):
- Amber #D4A574 (soft warm yellow, used for jackets/hats accents)
- Deep ink #1A1612 (linework, eyes, hair)
- Warm sand #F5EFE6 (skin highlights, light surfaces)
- Terracotta #C97A5D (cheeks, accent garments)
- Muted forest green #6B7F5C (sweaters, pants)
- Off-white #FBF8F3

ABSOLUTELY DO NOT:
- Use sharp/saturated colors (no neon, no pure red, no pure blue)
- Render faces in cartoon-bigeyes style
- Add text, captions, watermarks, or logos
- Add multiple children — only ONE child per image
- Add adults, animals, or background characters
- Use harsh shadows or strong drop-shadows
- Show feeding bottles, pacifiers, or branded items
`.trim();

const TRANSPARENT_BRIEF = `
Output: 1024×1024 square with PURE TRANSPARENT background. No backdrop, no scenery,
no shadow ground. Just the character isolated on transparent — must look natural
when composited over any solid color or gradient.

The character should be CENTERED and occupy ~70% of the canvas (vertical).
She should be seated or standing in a relaxed pose — no action, no movement.
View her from the front, slightly 3/4 angle. Eyes looking softly forward.
`.trim();

// ── Weather-character variants (7) ─────────────────────────────
const CHARACTER_VARIANTS = [
  {
    id: 'klemeg-sommer',
    note: 'Dressed for hot summer (≥22 °C). Short-sleeve cotton body in cream/white. Small sun hat in soft amber straw color. Bare arms and legs. Sandals or barefoot. Expression: gentle, calm. Suggesting a warm summer morning.',
  },
  {
    id: 'klemeg-varm',
    note: 'Dressed for warm weather (16–22 °C). Long-sleeve light cotton top in muted forest green. Light cream trousers. Small light cap. A few wisps of hair peeking under the cap. Looks comfortable, not hot.',
  },
  {
    id: 'klemeg-mild',
    note: 'Dressed for mild weather (10–16 °C). Thin wool body visible under a soft amber fleece-style jacket. Cream knit pants. A thin cap in terracotta. Holding a small autumn leaf casually.',
  },
  {
    id: 'klemeg-kjolig',
    note: 'Dressed for cool weather (5–10 °C). Fleece overall in muted forest green. Knit cap in amber. Tiny mittens. Soft boots in cream. A slightly pinker tone in the cheeks suggesting cool morning air.',
  },
  {
    id: 'klemeg-kald',
    note: 'Dressed for cold weather (0–5 °C). Full winter snowsuit in soft amber-yellow. Knit cap with small ear flaps. Warm mittens in terracotta. Insulated boots. Slightly rosy cheeks. Looks bundled and content.',
  },
  {
    id: 'klemeg-frost',
    note: 'Dressed for frost (-7 to 0 °C). Heavy winter snowsuit in cream with terracotta accents. Knit balaclava covering most of the head, just face visible. Thick mittens. Insulated winter boots. Cheeks more rose-touched. Suggests serious winter Norway day.',
  },
  {
    id: 'klemeg-streng-frost',
    note: 'Dressed for severe frost (<-7 °C). Double-layered wool under a heavy down-style snowsuit in soft cream. Full balaclava in muted forest green, only the eyes visible. Heavy mittens, thick insulated boots. Stands very still as if minimizing movement in extreme cold. Steam-suggestion near the mouth area (very subtle). Cheeks visibly rose-bright.',
  },
];

// ── Onboarding scenes (4) ─────────────────────────────────────
const ONBOARDING_BRIEF = `
${CHARACTER_BRIEF}

This image is part of the Klemeg app's onboarding sequence — a hand-illustrated
watercolor scene with INTEGRATED background. Unlike the weather-character set,
THIS image SHOULD have a scenic background (cream-paper texture, soft hand-painted).

Composition: 1024×1366 portrait (mobile-screen aspect). Lillian is the focal
point. The background is gentle and decorative — supports her, doesn't compete.
Each scene supports a specific onboarding step.

Wear consistent yellow jacket and knit cap across all 4 scenes (signature outfit).

ABSOLUTELY DO NOT: include text, UI elements, app mockups, multiple children,
adult figures, brand logos, or photographic elements.
`.trim();

const ONBOARDING_VARIANTS = [
  {
    id: 'onboarding-step1-name',
    note: 'Scene: Lillian sitting on warm sandy ground, playing with a small autumn leaf or twig. Soft sand color undertones in the background. A few fallen leaves scattered around her. Mood: curious, content, "just met you" introduction feeling.',
  },
  {
    id: 'onboarding-step2-birthday',
    note: 'Scene: Lillian sitting cross-legged, holding a small teddy bear gently in her lap. Warm cream paper-texture background, sparse — perhaps a single dried twig or birch leaf to one side. Mood: cozy, reflective, "tell me about you" feeling.',
  },
  {
    id: 'onboarding-step3-location',
    note: 'Scene: Lillian standing at the edge of a stylized small Norwegian river or fjord, with a distant minimalist suggestion of birch trees and church spires (like Trondheim Nidaros silhouette) in soft watercolor. She faces the viewer with a calm gaze. Mood: rooted, place-specific, "where are you" feeling.',
  },
  {
    id: 'onboarding-step4-ready',
    note: 'Scene: Lillian sitting on a low stone wall by a stylized fjord at golden hour — soft warm amber sky background, fjord water in muted petrol tones. She looks toward the horizon, peaceful. Mood: ready, "let us begin" feeling. The most evocative of the four scenes.',
  },
];

// ── Build prompt list ──────────────────────────────────────────
const allPrompts = [
  ...CHARACTER_VARIANTS.map((v) => ({
    ...v,
    base: `${CHARACTER_BRIEF}\n\n${TRANSPARENT_BRIEF}`,
    category: 'character',
  })),
  ...ONBOARDING_VARIANTS.map((v) => ({
    ...v,
    base: ONBOARDING_BRIEF,
    category: 'onboarding',
  })),
];

// ── CLI parsing ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const force = argv.includes('--force');
const only = argv.find((a) => a.startsWith('--only='))?.slice(7);

const CHAR_OUT = join(ROOT, 'public', 'illustrations', 'characters');
const ONB_OUT = join(ROOT, 'public', 'illustrations', 'onboarding');
mkdirSync(CHAR_OUT, { recursive: true });
mkdirSync(ONB_OUT, { recursive: true });

function outDir(category) {
  return category === 'character' ? CHAR_OUT : ONB_OUT;
}

// ── Generator ──────────────────────────────────────────────────
async function generate({ id, base, note, category }) {
  const outPath = join(outDir(category), `${id}.png`);
  if (!force && existsSync(outPath)) {
    console.log(`skip ${id} (exists)`);
    return { id, skipped: true };
  }

  const fullPrompt = `${base}\n\nVariant-specific instruction: ${note}`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  const startedAt = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`fail ${id}: HTTP ${res.status} — ${errBody.slice(0, 200)}`);
    return { id, ok: false, error: `HTTP ${res.status}` };
  }

  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) {
    console.error(`fail ${id}: no inline image data in response`);
    return { id, ok: false, error: 'no image data' };
  }

  const buf = Buffer.from(part.inlineData.data, 'base64');
  writeFileSync(outPath, buf);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`ok   ${id} (${(buf.length / 1024).toFixed(0)}kB, ${elapsed}s) → ${outPath}`);
  return { id, ok: true, category };
}

// ── Run ────────────────────────────────────────────────────────
const targets = only ? allPrompts.filter((p) => p.id === only) : allPrompts;
if (!targets.length) {
  console.error(`no prompt matches ${only}`);
  process.exit(1);
}

console.log(`generating ${targets.length} image(s) via ${MODEL}…`);
const results = [];
for (const p of targets) {
  results.push(await generate(p));
}

const ok = results.filter((r) => r.ok).length;
const skipped = results.filter((r) => r.skipped).length;
const failed = results.filter((r) => r.ok === false).length;
console.log(`\ndone: ${ok} generated, ${skipped} skipped, ${failed} failed`);
if (failed > 0) process.exit(1);
