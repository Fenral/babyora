#!/usr/bin/env node
/**
 * P9.1 — Master-referanse for Lillian-claymation i ny OKLCH-palett.
 *
 * Eneste output: review/asset-drafts/master.png
 *
 * Sivert: «Godkjenn masteren FØR du går videre. Den er kontrakten.»
 * Ingen A-tiers eller plagg-PNG-er genereres før master er godkjent.
 *
 * Bruk: node scripts/regenerate-master.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  const candidates = [
    'C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/nano banan 2.txt',
  ];
  for (const p of candidates) {
    try {
      API_KEY = readFileSync(p, 'utf8').trim();
      if (API_KEY) break;
    } catch {}
  }
}
if (!API_KEY) {
  console.error('missing GEMINI_API_KEY');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const MASTER_PROMPT = `A single toddler character "Lillian", stop-motion claymation style, soft matte clay texture with subtle handcrafted surface, big friendly eyes, light brown hair, warm natural skin tone. Standing pose, facing camera, arms relaxed slightly out from body, feet apart and stable. Wearing only a cream long-sleeve wool bodysuit (#F2E8D8). Eye-level camera, full figure with 10% margin, no crop. Soft studio lighting: cool ambient fill (slightly blue, like overcast snow light) with a gentle warm key light on the face. Flat solid background #F4F8FB. No props, no floor line, only a very soft contact shadow under the feet. Centered composition.`;

async function generate(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 400)}`);
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) throw new Error('no image in response: ' + JSON.stringify(json).slice(0, 400));
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

const OUT_DIR = join(ROOT, 'review', 'asset-drafts');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

console.log('generating P9 master-referanse for Lillian...');
console.log('budget: ~0.4 NOK per attempt, max 2 attempts = ~0.8 NOK');

try {
  const buf = await generate(MASTER_PROMPT);
  const outPath = join(OUT_DIR, 'master.png');
  writeFileSync(outPath, buf);
  console.log(`✓ wrote ${outPath} (${buf.length} bytes)`);
  console.log('\nNeste steg: vis bildet til Sivert for godkjenning.');
  console.log('  IKKE generere A1-A7 før master er bekreftet.');
} catch (e) {
  console.error('master failed:', e.message);
  process.exit(1);
}
