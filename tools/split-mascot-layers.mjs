#!/usr/bin/env node
/**
 * split-mascot-layers.mjs — P10/JOB1 (opening sequence, docs/design-notes/
 * aapningssekvens-2026-08-01.md).
 *
 * One-off asset-prep script: cuts public/monter/maskot.png into two layers
 * along the alpha-measured fingertip line, per the spec's production-path
 * decision ("Hender-foran-laget produseres ved å skjære eksisterende
 * maskot-PNG i to langs den alfa-målte fingertupp-linjen — ingen generativ
 * produksjon ... garantert pikselmatch"):
 *
 *  - public/monter/maskot-body.png  — full canvas (same WxH as source),
 *    everything BELOW the cut line erased to transparent. Positioned
 *    BEHIND the panel in OpeningSequence (same top-offset math the
 *    existing .hjm-mascot CSS already uses for the single-layer image).
 *  - public/monter/maskot-hands.png — CROPPED to a band starting just
 *    above the cut line down to the bottom of the alpha content (the
 *    fingers that overlap the panel edge). Positioned IN FRONT of the
 *    panel.
 *
 * The cut line is computed as 79% of the ALPHA BBOX height (not the full
 * 512x512 canvas — there is transparent padding around the character),
 * matching the existing .hjm-mascot CSS comment: "fingertuppene (79% av
 * bildehøyden, målt fra alfa-bbox) lander 10px over panelkanten".
 *
 * `--cut=0.79` / `--overlap=8` let you iterate the exact line without
 * editing the script — inspect the two PNGs after each run (Read tool
 * renders them) and re-run until the seam falls cleanly in the finger
 * area, never through the face/body.
 *
 * Usage: node tools/split-mascot-layers.mjs [--cut=0.79] [--overlap=8]
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public/monter/maskot.png');
const OUT_BODY = path.join(ROOT, 'public/monter/maskot-body.png');
const OUT_HANDS = path.join(ROOT, 'public/monter/maskot-hands.png');

function argNum(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const value = Number(arg.split('=')[1]);
  return Number.isFinite(value) ? value : fallback;
}

const CUT_FRACTION = argNum('cut', 0.79);
// Overlap (px, at native image resolution) so the two layers share a sliver
// of pixels at the seam — avoids a hairline transparent gap when composited
// (body's bottom edge and hands' top edge both cover the seam row).
const OVERLAP_PX = argNum('overlap', 8);
const ALPHA_THRESHOLD = argNum('alphaThreshold', 10);

async function computeAlphaBBox(image) {
  const { data, info } = await image
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let top = null;
  let bottom = null;
  let left = null;
  let right = null;

  for (let y = 0; y < height; y++) {
    let rowHasContent = false;
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > ALPHA_THRESHOLD) {
        rowHasContent = true;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }
    if (rowHasContent) {
      if (top === null) top = y;
      bottom = y;
    }
  }

  if (top === null) {
    throw new Error('maskot.png appears fully transparent — no alpha content found.');
  }
  return { top, bottom, left, right, width, height };
}

async function main() {
  const src = sharp(SRC);
  const bbox = await computeAlphaBBox(src);
  const bboxHeight = bbox.bottom - bbox.top + 1;
  const fingertipY = bbox.top + Math.round(CUT_FRACTION * bboxHeight);

  console.log('[split-mascot-layers] source:', SRC);
  console.log('[split-mascot-layers] canvas:', `${bbox.width}x${bbox.height}`);
  console.log('[split-mascot-layers] alpha bbox:', bbox);
  console.log('[split-mascot-layers] bboxHeight:', bboxHeight);
  console.log('[split-mascot-layers] cutFraction:', CUT_FRACTION, '→ fingertipY (image px):', fingertipY);
  console.log('[split-mascot-layers] overlapPx:', OVERLAP_PX);

  // ── Body layer: full-width crop of rows [0, fingertipY + overlap]. ──────
  // (Extract, not "erase in place" — libvips composite blend modes don't
  // reliably zero out alpha the way a naive overwrite might suggest; a
  // straight extract is simpler AND guaranteed correct.) Canvas HEIGHT
  // shrinks to just the kept rows — OpeningSequence.tsx positions this
  // layer by its own top-offset (0, same as the source image) since that's
  // all that's needed; it no longer needs to match the original 512px
  // canvas exactly.
  const bodyBottomKeep = Math.min(bbox.height - 1, fingertipY + OVERLAP_PX);
  const bodyHeight = bodyBottomKeep + 1;
  await sharp(SRC)
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: bbox.width, height: bodyHeight })
    .png()
    .toFile(OUT_BODY);

  // ── Hands layer: cropped band from (fingertipY - overlap) to bbox bottom.
  const handsTop = Math.max(0, fingertipY - OVERLAP_PX);
  const handsHeight = bbox.bottom - handsTop + 1;
  await sharp(SRC)
    .ensureAlpha()
    .extract({ left: 0, top: handsTop, width: bbox.width, height: handsHeight })
    .png()
    .toFile(OUT_HANDS);

  console.log('[split-mascot-layers] wrote', OUT_BODY, `(kept rows 0..${bodyBottomKeep})`);
  console.log('[split-mascot-layers] wrote', OUT_HANDS, `(source rows ${handsTop}..${bbox.bottom}, height ${handsHeight})`);
  console.log('[split-mascot-layers] hands layer top-offset within original canvas:', handsTop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
