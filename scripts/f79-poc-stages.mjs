#!/usr/bin/env node
/* F79 Phase 4b: Stage-kjede via edit-modus — anatomi-garantert påkledning.
 *
 * Runde 1 (f79-poc-stack.mjs) beviste at "posisjonert overlay"-instruks
 * ignoreres: plagg rendres produkt-sentrert. Ny strategi: EDIT-KJEDE.
 * Hvert steg redigerer forrige stage-bilde: «legg på plagget, endre
 * INGENTING annet». Anatomi garantert fordi babyen aldri re-tegnes.
 *
 * stage-0 = base.png (finnes)
 * stage-1 = + korall ullbody
 * stage-2 = + petrol-grå bukse
 * stage-3 = + marigold strikkegenser
 * stage-4 = + åpen petrol jakke
 *
 * Overlays ekstraheres etterpå som piksel-diff (scripts/f79-extract-overlays.mjs).
 * Kost: 4 × ~$0.134 ≈ ~5,6 NOK.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
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

const EDIT_RULES = `IMAGE EDITING TASK. The attached image is the current state
of a claymation baby character for a dressing animation.

Edit the image by ADDING exactly one garment as described below.

ABSOLUTE CONSTRAINTS:
- Change NOTHING else: same baby, same face, same expression, same hair,
  same pose (arms slightly out, legs straight), same proportions, same
  camera, same scale, same position in frame, same top-left lighting,
  same soft claymation style, same transparent background, same soft
  contact shadow under the feet.
- Any garment already worn in the attached image stays EXACTLY as it is
  (except where the new garment naturally covers it).
- The new garment fits the baby's body naturally: correct joints, correct
  volume, clay material.
- No text, no watermarks. Output the full edited image, same square 1:1.`;

const STAGES = [
  {
    id: 'stage-1',
    from: 'base.png',
    text: `ADD: A long-sleeve wool bodysuit (inner layer) in warm coral/
terracotta (#D96B4A) with small snap buttons at the crotch. It covers the
torso, both arms to the wrists, and the diaper area (the white diaper is
now hidden under the bodysuit). Soft brushed wool clay surface. Legs stay
bare.`,
  },
  {
    id: 'stage-2',
    from: 'stage-1.png',
    text: `ADD: Soft wool baby pants in muted blue-grey petrol (#5A7480),
elastic waistband sitting at the natural waist OVER the lower part of the
coral bodysuit, ankle cuffs just above the bare feet. Both legs filled
naturally. The coral bodysuit torso and sleeves stay fully visible.`,
  },
  {
    id: 'stage-3',
    from: 'stage-2.png',
    text: `ADD: A knitted wool sweater (mid layer) in golden marigold/ochre
(#D9962B) with clearly visible chunky knit stitches, worn OVER the coral
bodysuit torso. Sleeves end just before the wrists so a thin coral cuff
of the bodysuit stays visible at each wrist. The sweater hem ends at the
hips, over the pants waistband. Pants and feet unchanged.`,
  },
  {
    id: 'stage-4',
    from: 'stage-3.png',
    text: `ADD: An open outdoor jacket (outer layer) in deep petrol
blue-green (#1E4750) with a soft hood resting behind the neck. Worn OPEN
with a wide front gap so the marigold sweater stays clearly visible on
the chest. Jacket sleeves cover the arms; keep a hint of coral cuff at
the wrists. Slightly puffy matte clay. Pants, feet, face, hair unchanged.`,
  },
];

async function editStep({ id, from, text }) {
  const outPath = join(DIR, `${id}.png`);
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`hopper over ${id} (finnes)`);
    return true;
  }
  const srcPath = join(DIR, from);
  if (!existsSync(srcPath)) {
    console.error(`mangler kilde ${from} for ${id}`);
    return false;
  }
  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/png', data: readFileSync(srcPath).toString('base64') } },
          { text: `${EDIT_RULES}\n\n${text}` },
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
    console.error(`feil ${id}: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    return false;
  }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith('image/'),
  );
  if (!part) {
    console.error(`feil ${id}: ingen bildedata — ${JSON.stringify(json).slice(0, 300)}`);
    return false;
  }
  writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
  console.log(`ok   ${id} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
  return true;
}

// stage-0 = kopi av base for komplett sekvens
const s0 = join(DIR, 'stage-0.png');
if (!existsSync(s0)) copyFileSync(join(DIR, 'base.png'), s0);

console.log('genererer 4 stages via edit-kjede...');
for (const s of STAGES) {
  const ok = await editStep(s);
  if (!ok) {
    console.error(`stage-kjeden brutt ved ${s.id} — stopper (senere stages avhenger av denne)`);
    process.exit(1);
  }
}
console.log('\nstage-kjede ferdig: stage-0..stage-4');
