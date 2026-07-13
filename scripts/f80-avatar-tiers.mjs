#!/usr/bin/env node
/* F80: vær-tier-varianter av avataren via edit-kjede fra eksisterende
 * F79-stages (public/avatars/f79-poc/raw/). Magenta beholdes gjennom
 * kjeden, chroma-key til slutt (samme mønster som f79-final-pipeline.mjs).
 *
 * Tiers (A2=stage-2, A3=stage-3, A4=stage-4-morgennatt finnes fra før):
 *   tier-A1-sommer  ← edit av base-final    (kortermet lys bomullsbody + solhatt)
 *   tier-A5-vinter  ← edit av stage-3-final (vinterdress OVER alt + lue)
 *   tier-A6-ekstrem ← edit av tier-A5-raw   (+ votter + tykt ullskjerf)
 *   tier-A7-sovn    ← edit av stage-1-final (sovepose, armene ute)
 *
 * Resumable: hopper over raws som finnes (--force for å regenerere).
 * Exit 0 kun hvis alle fire tiers er OK.
 *
 * Kost: 4 × ~$0.134 ≈ $0,54 ≈ ~5,6 NOK.
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

const API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${API_KEY}`;
const DIR = join(ROOT, 'public', 'avatars', 'f79-poc');
const RAW = join(DIR, 'raw');
mkdirSync(RAW, { recursive: true });

/* EDIT_RULES gjenbrukt ORDRETT fra scripts/f79-final-pipeline.mjs. */
const EDIT_RULES = `IMAGE EDITING TASK. The attached image is the current state
of a claymation baby for a dressing animation, on a solid magenta
chroma-key background.

Edit the image by ADDING exactly one garment as described below.

ABSOLUTE CONSTRAINTS:
- Change NOTHING else: same baby, same face, same expression, same hair,
  same pose, same proportions, same scale, same position in frame, same
  top-left lighting, same claymation style.
- KEEP THE SOLID MAGENTA (#FF00FF) BACKGROUND exactly as it is — flat and
  uniform, no gradient, no checkerboard.
- Garments already worn stay EXACTLY as they are (except where naturally
  covered by the new garment).
- The new garment fits the baby's body naturally: correct joints, correct
  volume, clay material. The garment must never contain magenta/pink.
- No text, no watermarks. Full edited image, same square 1:1.`;

const img = (p) => ({ inlineData: { mimeType: 'image/png', data: readFileSync(p).toString('base64') } });

async function gen(parts, rawName) {
  const rawPath = join(RAW, rawName);
  if (existsSync(rawPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${rawName} (raw finnes)`);
    return rawPath;
  }
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  };
  const t0 = Date.now();
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${rawName}: HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new Error(`${rawName}: ingen bildedata`);
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`gen  ${rawName} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return rawPath;
}

/* Chroma-key: magenta → alpha. Standard-varianten MED tredje despill-branch
 * (mag > 15) fra f79-kald-thumbs.mjs. */
async function key(rawPath, outPath) {
  const { data, info } = await sharp(rawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mag = Math.min(r, b) - g;
    if (mag > 90) data[i + 3] = 0;
    else if (mag > 40) {
      data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
      const avg = Math.round((r + b) / 2);
      data[i] = Math.min(r, avg - Math.round(mag * 0.35));
      data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
    } else if (mag > 15) {
      const t = Math.round((g + Math.min(r, b)) / 2);
      data[i] = Math.min(r, t + 10);
      data[i + 2] = Math.min(b, t + 10);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
  const st = await sharp(outPath).stats();
  console.log(`key  ${outPath.split(/[\\/]/).pop()} (alpha mean ${Math.round(st.channels[3].mean)})`);
}

/* Kilde-stages fra F79 (må finnes i raw/ — sjekkes før vi bruker penger). */
const SRC_BASE = join(RAW, 'base-final.png');
const SRC_STAGE1 = join(RAW, 'stage-1-final.png');
const SRC_STAGE3 = join(RAW, 'stage-3-final.png');
for (const src of [SRC_BASE, SRC_STAGE1, SRC_STAGE3]) {
  if (!existsSync(src)) { console.error(`mangler kilde-stage: ${src}`); process.exit(1); }
}

try {
  /* ---------- tier-A1-sommer: base-final (bleie) + body + solhatt ---------- */
  const A1_RAW = await gen(
    [img(SRC_BASE), { text: `${EDIT_RULES}

ADD: A short-sleeve light cotton baby bodysuit in warm cream (#E8DFCE)
with snap buttons at the crotch, covering the torso and the diaper area
(white diaper hidden under it), AND a soft cotton sun hat with a wide brim
in warm oat (#D9C79E) sitting gently on the baby's head (wispy hair peeking
out at the front). Arms below the short sleeves and both legs stay bare.` }],
    'tier-A1-sommer-raw.png',
  );

  /* ---------- tier-A5-vinter: stage-3 (body+bukse+genser) + vinterdress + lue ---------- */
  const A5_RAW = await gen(
    [img(SRC_STAGE3), { text: `${EDIT_RULES}

ADD: A one-piece padded baby winter overall in deep forest-slate (#3A5248)
with hood (hood down behind the neck), front zip and soft puffy quilted
sections, worn OVER everything the baby is currently wearing — it covers
the marigold sweater and the petrol pants completely, only a thin marigold
collar edge may stay visible at the neck. Full torso, both arms and both
legs covered, feet stay as they are. AND a warm knitted baby beanie in deep
heather purple-grey (#5C5470) with a small soft pom-pom and fold-up ribbed
brim covering the hair and ears.` }],
    'tier-A5-vinter-raw.png',
  );

  /* ---------- tier-A6-ekstrem: edit av tier-A5-raw + votter + skjerf ---------- */
  const A6_RAW = await gen(
    [img(A5_RAW), { text: `${EDIT_RULES}

ADD: A PAIR of small baby wool mittens in warm coral-rust (#B85A3C),
thumbless baby style with ribbed cuffs, covering BOTH hands, AND a thick
chunky-knit wool scarf in warm oat/cream (#C8B99A) wrapped snugly around
the neck over the winter overall collar, with one soft short end hanging
down the chest. Winter overall, beanie and everything else unchanged.` }],
    'tier-A6-ekstrem-raw.png',
  );

  /* ---------- tier-A7-sovn: stage-1 (korall body) + sovepose ---------- */
  const A7_RAW = await gen(
    [img(SRC_STAGE1), { text: `${EDIT_RULES}

ADD: A baby sleeping bag (sleep sack) in soft muted sage green (#A9B8A2),
sleeveless with soft shoulder straps: a rounded bag-like shape from the
chest DOWN that fully encloses both legs (the bare legs disappear inside
the rounded bag, which softly tapers to a plump rounded bottom). BOTH ARMS
STAY OUT and free, still showing the coral bodysuit sleeves. Face, head and
pose of the upper body unchanged.` }],
    'tier-A7-sovn-raw.png',
  );

  /* ---------- chroma-key → kanoniske tier-filnavn ---------- */
  console.log('\nchroma-keyer...');
  await key(A1_RAW, join(DIR, 'tier-A1-sommer.png'));
  await key(A5_RAW, join(DIR, 'tier-A5-vinter.png'));
  await key(A6_RAW, join(DIR, 'tier-A6-ekstrem.png'));
  await key(A7_RAW, join(DIR, 'tier-A7-sovn.png'));

  console.log('\nferdig: tier-A1-sommer, tier-A5-vinter, tier-A6-ekstrem, tier-A7-sovn har ekte alpha.');
  console.log('(A2=stage-2, A3=stage-3, A4=stage-4-morgennatt fantes fra før.)');
} catch (err) {
  console.error(`\nFEIL: ${err.message ?? err}`);
  console.error('kjør på nytt — ferdige raws hoppes over (resumable).');
  process.exit(1);
}
