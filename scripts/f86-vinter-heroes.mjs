#!/usr/bin/env node
/* F86-F5: Leksjons-heroer for «Første vinter med baby» (8 stk) + 1 cover.
 *
 * Samme etablerte pipeline som f79-final-pipeline.mjs: gemini-3-pro-image
 * på solid magenta (#FF00FF) → sharp chroma-key til ekte alpha + despill.
 * Motiver er OBJEKT/SCENE-baserte (plagg, vogn, termometer) — ikke
 * baby-ansikter — per F82.8-lærdommen («for dokkeaktig» gjaldt
 * AI-lifestyle-babyer). Stil matcher appens clay-assets (F80a).
 *
 * Kost: 9 × ~$0.134 ≈ ~13 NOK. Resumable: hopper over raw som finnes.
 * Output: public/illustrations/vinterprogram/{id}.png (transparent, 1:1).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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
if (!API_KEY) { console.error('mangler GEMINI_API_KEY'); process.exit(1); }

const MODEL = 'gemini-3-pro-image';
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const DIR = join(ROOT, 'public', 'illustrations', 'vinterprogram');
const RAW = join(DIR, 'raw');
mkdirSync(RAW, { recursive: true });

const MAGENTA_RULE = `BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF)
covering ALL canvas outside the subject silhouette. Flat, uniform — NO
gradient, NO checkerboard, NO scenery, NO shadow on the background.
The subject itself must NEVER contain magenta, pink or fuchsia.
This is a chroma-key background for post-processing.`;

const STYLE = `Soft 3D claymation render, hand-sculpted plasticine feel, matte
material, soft studio lighting from TOP-LEFT, premium app-illustration
quality (Pixar-grade prop art). NOT glossy, NOT photorealistic, NOT flat
vector. Color palette: warm cream, deep forest green, muted terracotta,
soft lavender-grey, mustard accents — cozy Nordic winter feel.
Single centered still-life composition, generous margin to canvas edges.
NO text, NO letters, NO logos, NO human faces.`;

const HEROES = [
  {
    id: 'ull-mot-huden',
    scene: `A soft knitted wool baby bodysuit (cream colored with visible chunky
knit texture) gently draped next to a ball of merino yarn with a loose
thread curling toward the viewer. Convey softness against skin.`,
  },
  {
    id: 'lag-pa-lag',
    scene: `Three baby garments fanned out in a neat overlapping stack, front to
back: a thin cream wool bodysuit, a forest-green fleece mid-layer, and a
terracotta winter overall. Clearly three distinct layers, like cards fanned.`,
  },
  {
    id: 'vind-skjult-faktor',
    scene: `A small knitted baby beanie and a tiny scarf caught mid-air by a gust
of wind, scarf streaming sideways, with 5-6 stylized clay snowflakes and
two curved wind-swoosh ribbons in soft lavender-grey.`,
  },
  {
    id: 'vogn-baeresele-lek',
    scene: `A charming small baby pram (forest green with cream canopy and warm
wooden handle) standing beside a soft structured baby carrier (terracotta),
side by side like two friendly options.`,
  },
  {
    id: 'sjekk-nakken',
    scene: `A tiny knitted baby sweater (cream colored with chunky knit texture
and a forest-green collar) seen from the BACK, standing upright as if worn,
with three small rounded mustard-yellow clay warmth-waves rising gently out
of the neck opening. Conveys "check the warmth at the neck". Garment only —
no baby, no hands, no people.`,
  },
  {
    id: 'sove-ute-vinter',
    scene: `A cozy baby pram (deep green) with a thick mustard-yellow sleeping bag
tucked inside, under a crescent clay moon and three small stars floating
above. Peaceful nighttime nap-outside mood.`,
  },
  {
    id: 'frost-dager',
    scene: `A rounded vintage-style clay thermometer showing very cold (bulb and
low column in soft blue), leaning against a pair of tiny knitted baby
mittens (terracotta) dusted with a few clay snowflakes.`,
  },
  {
    id: 'din-garderobe-din-anbefaling',
    scene: `A small open wardrobe cabinet (warm wood tone) with three tiny baby
garments hanging inside on little hangers (wool bodysuit, fleece jacket,
winter overall) and one folded on a shelf, with a small mustard star badge
on the cabinet door. Personal, organized, proud feel.`,
  },
  {
    id: 'cover',
    scene: `A hero still-life for a winter learning program: a ball of cream
merino yarn, a tiny knitted baby beanie resting on it, one terracotta
mitten leaning against them, and four clay snowflakes floating around.
Inviting "learn winter dressing" mood, slightly larger composition.`,
  },
];

async function gen(hero) {
  const rawPath = join(RAW, `${hero.id}.png`);
  if (existsSync(rawPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${hero.id} (raw finnes)`);
    return rawPath;
  }
  const body = {
    contents: [{ parts: [{ text: `${hero.scene}\n\n${STYLE}\n\n${MAGENTA_RULE}` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  };
  const t0 = Date.now();
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${hero.id}: HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new Error(`${hero.id}: ingen bildedata`);
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`gen  ${hero.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return rawPath;
}

/* Chroma-key: magenta → alpha, med despill (samme som f79-final-pipeline) */
async function key(rawPath, outPath) {
  const { data, info } = await sharp(rawPath)
    .resize(1024, 1024, { fit: 'inside' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mag = Math.min(r, b) - g;
    if (mag > 90) {
      data[i + 3] = 0;
    } else if (mag > 40) {
      data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
      const avg = Math.round((r + b) / 2);
      data[i] = Math.min(r, avg - Math.round(mag * 0.35));
      data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
    }
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath);
  const st = await sharp(outPath).stats();
  console.log(`key  ${outPath.split(/[\\/]/).pop()} (alpha mean ${Math.round(st.channels[3].mean)})`);
}

for (const hero of HEROES) {
  const raw = await gen(hero);
  await key(raw, join(DIR, `${hero.id}.png`));
}
console.log('F86-heroer ferdig →', DIR);
