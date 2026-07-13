#!/usr/bin/env node
/**
 * P9.1-P9.4 — komplett asset-regenerering i ny OKLCH-palett.
 *
 * Sekvens:
 *   1. Master v2 (forbedret prompt — armer mer mot kropp, sterkere blå-hvit bg)
 *   2. A1-A7 (7 tiers, alltid med master vedlagt for konsistens)
 *   3. Topp 14 plagg-thumbnails
 *
 * Output:
 *   review/asset-drafts/master-v{n}.png
 *   review/asset-drafts/avatar-A{n}.png
 *   review/asset-drafts/garment-{id}.png
 *
 * Innenfor 100 NOK-cap. Estimert: 22 forsøk × 0.4 NOK = ~9 NOK.
 *
 * Bruk: node scripts/regenerate-all-assets.mjs
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

const OUT_DIR = join(ROOT, 'review', 'asset-drafts');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─── Master prompt v2 (forbedret) ──────────────────────────────────────────
const MASTER_PROMPT = `A single toddler character named Lillian, stop-motion claymation style, soft matte plasticine clay texture with subtle handcrafted surface details, big friendly round dark-brown eyes, light brown short hair, warm natural light-beige skin tone. Standing pose facing the camera straight on. Arms close to the body, slightly bent at the elbows, hands hanging naturally — NOT outstretched. Feet stable, shoulder-width apart. Wearing only a cream long-sleeve knit wool bodysuit in color #F2E8D8 covering torso and arms; bare legs (skin tone) below the waist; bare feet. Eye-level camera, full figure visible, 10% margin around figure, no crop. Soft studio lighting: cool ambient fill (slightly blue, like overcast snow light) plus a gentle warm key light on the face. Flat solid background in cool snow-blue #F4F8FB across the entire frame. Subtle soft contact shadow under the feet only. Centered composition. No props, no floor line, no text, no logos.`;

const TIER_BASE = (tierName, plaggBeskrivelse) =>
  `Use the attached reference image of Lillian for character consistency. SAME face, SAME hair, SAME proportions, SAME pose (standing, arms close to body), SAME eye-level camera angle, SAME soft cool studio lighting, SAME flat #F4F8FB background, SAME claymation clay texture. ONLY change the clothing to: ${plaggBeskrivelse}. No beige textiles. No props, no text, no logos.`;

const A_TIERS = [
  {
    id: 'A1',
    name: 'Sommer-base',
    detail: 'a short-sleeve cotton bodysuit in cream off-white #F2E8D8, leaving the arms below the elbow bare and the legs bare (skin tone). Lightweight summer look.',
  },
  {
    id: 'A2',
    name: 'Mild-base',
    detail: 'a long-sleeve cream wool bodysuit (#F2E8D8) AND light cream wool pants (#F2E8D8) covering the legs. No shoes, bare feet. Mild-day base layer look.',
  },
  {
    id: 'A3',
    name: 'Kjølig mellomlag',
    detail: 'a chunky knit wool mid-layer sweater in muted teal #4FA3A5 as the outer visible top, AND matching teal #4FA3A5 wool pants. A small cream collar peeks at the neckline from a base layer underneath. Bare feet.',
  },
  {
    id: 'A4',
    name: 'Lett yttertøy',
    detail: 'a lightweight padded one-piece stroller suit (kjøredress) in deep navy blue #2C4A6E covering torso, arms, and legs. A cream wool collar peeks at the neckline. Soft hood lying down on the shoulders. Soft fabric boots in matching navy.',
  },
  {
    id: 'A5',
    name: 'Vinter',
    detail: 'a thick padded winter snowsuit (vinterkjøredress) in deep navy blue #2C4A6E covering the full body and arms. A small coral #E8643C trim at the hood opening. Hood lying back showing the head. Cream wool collar at the neckline. Soft padded boots in matching navy.',
  },
  {
    id: 'A6',
    name: 'Ekstrem vinter',
    detail: 'a heavily padded insulated winter snowsuit in deep navy blue #2C4A6E covering full body, arms, and feet. The hood is pulled UP over the head. Wearing a coral #E8643C knit beanie hat under the hood AND coral #E8643C knit mittens on both hands. Boots in matching navy.',
  },
  {
    id: 'A7',
    name: 'Søvn',
    detail: 'a sleeveless sleep sack (sovepose) in soft coral #E8643C that fully envelops the legs from the waist down. Above the sleep sack, the upper body shows a cream long-sleeve cotton bodysuit (#F2E8D8) with bare hands. No shoes (legs are inside the sleep sack). Calm sleepy expression but eyes open.',
  },
];

const PLAGG = [
  { id: 'langermet-body', label: 'long-sleeve cotton baby bodysuit, snap buttons at bottom', farge: '#F2E8D8 cream', kategori: 'innerst' },
  { id: 'langermet-ullbody', label: 'long-sleeve merino wool baby bodysuit, fine knit texture', farge: '#F2E8D8 warm cream', kategori: 'innerst' },
  { id: 'kortermet-body', label: 'short-sleeve cotton baby bodysuit, snap buttons at bottom', farge: '#F2E8D8 cream', kategori: 'innerst' },
  { id: 'ullsokker', label: 'a pair of small knitted wool baby socks shown side-by-side', farge: '#F2E8D8 cream wool', kategori: 'innerst' },
  { id: 'pyjamas', label: 'a baby pyjamas onesie with snap buttons, knee-length', farge: '#4FA3A5 muted teal', kategori: 'mellomlag' },
  { id: 'ull-pyjamas', label: 'a baby merino wool pyjamas onesie, fine knit', farge: '#4FA3A5 muted teal', kategori: 'mellomlag' },
  { id: 'ull-mellomlag', label: 'a chunky knit wool mid-layer sweater for a baby, crew-neck', farge: '#4FA3A5 muted teal', kategori: 'mellomlag' },
  { id: 'ull-bukse', label: 'soft wool baby pants with elastic waist, mid-weight', farge: '#4FA3A5 muted teal', kategori: 'mellomlag' },
  { id: 'kjoredress', label: 'a one-piece padded baby stroller overall (kjøredress) with hood lying down, full body', farge: '#2C4A6E deep navy blue', kategori: 'yttertoy' },
  { id: 'vinterkjoredress', label: 'a thick insulated baby winter snowsuit (vinterkjøredress) with hood and cream trim, full body', farge: '#2C4A6E deep navy blue', kategori: 'yttertoy' },
  { id: 'regntoy-skall', label: 'a lightweight waterproof baby rain shell jacket, hooded', farge: '#2C4A6E deep navy blue', kategori: 'yttertoy' },
  { id: 'lue', label: 'a knit wool baby beanie hat with a folded brim', farge: '#E8643C warm coral', kategori: 'ekstra' },
  { id: 'votter', label: 'a pair of knit wool baby mittens shown side-by-side', farge: '#E8643C warm coral', kategori: 'ekstra' },
  { id: 'sovepose-2-5-tog', label: 'a sleeveless quilted baby sleep sack (sovepose) 2.5 TOG, envelope shape', farge: '#E8643C warm coral', kategori: 'ekstra' },
];

const PLAGG_BASE = (plagg) =>
  `Same claymation matte plasticine clay material and soft cool studio lighting style as the typical Babyora reference. A single ${plagg.label} as a floating product shot, slight 3/4 angle from above, centered, on a flat solid background of cool snow-blue #F4F8FB. Soft subtle contact shadow below the garment. Dominant color: ${plagg.farge}. May include a single small neutral off-white detail (button, zipper). No character, no baby, no body, no props, no text, no logos.`;

// ─── Helper: kall Gemini ───────────────────────────────────────────────────

async function generate(prompt, imagePath = null) {
  const parts = [{ text: prompt }];
  if (imagePath) {
    const imageData = readFileSync(imagePath).toString('base64');
    parts.unshift({
      inlineData: { mimeType: 'image/png', data: imageData },
    });
  }
  const body = {
    contents: [{ parts }],
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
  const responseParts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = responseParts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) throw new Error('no image in response: ' + JSON.stringify(json).slice(0, 400));
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

// ─── Pipeline ──────────────────────────────────────────────────────────────

let usdSpent = 0;
const COST_PER = 0.039;

async function run(label, fn) {
  console.log(`\n▶ ${label}...`);
  try {
    const start = Date.now();
    await fn();
    usdSpent += COST_PER;
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✓ ${label} (${dur}s, total spent: $${usdSpent.toFixed(2)})`);
  } catch (e) {
    console.error(`  ✗ ${label}: ${e.message}`);
  }
}

// 1. Master v2
const masterPath = join(OUT_DIR, 'master-v2.png');
await run('master-v2', async () => {
  const buf = await generate(MASTER_PROMPT);
  writeFileSync(masterPath, buf);
});

// 2. A1-A7 (med master vedlagt)
for (const tier of A_TIERS) {
  const outPath = join(OUT_DIR, `avatar-${tier.id}.png`);
  await run(`${tier.id} — ${tier.name}`, async () => {
    const buf = await generate(TIER_BASE(tier.name, tier.detail), masterPath);
    writeFileSync(outPath, buf);
  });
}

// 3. Plagg-thumbnails (uten ref-bilde — egne floating product shots)
for (const plagg of PLAGG) {
  const outPath = join(OUT_DIR, `garment-${plagg.id}.png`);
  await run(`plagg ${plagg.id}`, async () => {
    const buf = await generate(PLAGG_BASE(plagg));
    writeFileSync(outPath, buf);
  });
}

console.log(`\n═══ Ferdig ═══`);
console.log(`Total spent: $${usdSpent.toFixed(2)} ≈ ${(usdSpent * 10.5).toFixed(1)} NOK`);
console.log(`Sjekk review/asset-drafts/ for resultat.`);
