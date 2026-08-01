#!/usr/bin/env node
/**
 * split-mascot-layers.mjs — P10/JOB1 (opening sequence, docs/design-notes/
 * aapningssekvens-2026-08-01.md). Revised P10.1 (owner fix package, judge
 * findings A1/A3):
 *
 *  - public/monter/maskot-body.png — P10.1: the FULL, UNCROPPED source
 *    canvas (was previously cropped to end just below the fingertip
 *    line). Judges' finding A1 measured a visible gap (2-14px of bare
 *    canvas) between the OLD crop's bottom edge and the panel's top edge
 *    during the 180-620ms rise, plus that crop edge's own drop-shadow
 *    bleeding into the gap ("løsrevet dukke som svever" — a detached doll
 *    floating). The spec's own fix is explicit: render the FULL uncropped
 *    mascot image as the body layer — it sits z-below the opaque panel,
 *    so the lower part is naturally occluded, no crop needed. Occlusion
 *    is entirely a z-index/opaque-background job (see hjem-monter.css's
 *    own stacking comment), not a pixel-crop job — so this layer is now a
 *    straight alpha-cleaned copy of the source, same WxH, no `extract()`.
 *  - public/monter/maskot-hands.png — unchanged in INTENT: still CROPPED
 *    to a band starting just above the alpha-measured fingertip cut line
 *    down to the bottom of the alpha content (the fingers that overlap
 *    the panel edge). Positioned IN FRONT of the panel.
 *
 * Both outputs now also get a 1px ALPHA EROSION pass (judges' finding A3:
 * "maskot-hands.png has a light alpha fringe/halo against dark petrol —
 * clean the premultiplied edge ... e.g. erode 1px or unpremultiply").
 * Erosion (a 3x3 minimum-filter over the alpha channel) shrinks the
 * opaque region by ~1px at every edge, discarding the low-alpha "fringe"
 * ring where premultiplied-alpha source pixels blend a light background
 * colour into a partially-transparent edge pixel — that ring is what
 * reads as a pale halo once composited over dark petrol.
 *
 * The cut line (hands layer only) is computed as 79% of the ALPHA BBOX
 * height (not the full 512x512 canvas — there is transparent padding
 * around the character), matching the existing .hjm-mascot CSS comment:
 * "fingertuppene (79% av bildehøyden, målt fra alfa-bbox) lander 10px over
 * panelkanten".
 *
 * `--cut=0.79` / `--overlap=8` let you iterate the exact line without
 * editing the script — inspect the two PNGs after each run (Read tool
 * renders them) and re-run until the seam falls cleanly in the finger
 * area, never through the face/body. `--erode=1` controls the erosion
 * radius in pixels (0 disables it).
 *
 * Usage: node tools/split-mascot-layers.mjs [--cut=0.79] [--overlap=8] [--erode=1]
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
// P10.1 (judges' finding A3): erosion radius in px for the alpha-fringe
// cleanup pass below. 1px is enough to discard the premultiplied-alpha
// blend ring without visibly eating into the character's silhouette.
const ERODE_PX = argNum('erode', 1);

/**
 * P10.1 (judges' finding A3): erode the alpha channel by `radiusPx` — a
 * 3x3-per-iteration minimum filter (each pixel's alpha becomes the MIN of
 * its own value and its 8 neighbours') that shrinks the opaque region by
 * ~1px per iteration. This discards the low-alpha "fringe" ring that a
 * premultiplied-alpha source leaves at partially-transparent edge pixels
 * (a light background colour blended into the pixel's RGB, visible as a
 * pale halo once composited over dark petrol) without touching fully-
 * opaque interior pixels. Pure alpha-channel math — RGB is untouched, so
 * this never shifts the character's actual colours, only its silhouette
 * boundary by a subpixel amount.
 */
async function erodeAlpha(pngBuffer, radiusPx) {
  if (radiusPx <= 0) return pngBuffer;
  const image = sharp(pngBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * channels + 3];

  for (let iter = 0; iter < radiusPx; iter++) {
    const eroded = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let min = alpha[y * width + x];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const neighbour = (nx < 0 || ny < 0 || nx >= width || ny >= height)
              ? 0 // treat out-of-canvas as transparent so the outer edge erodes too
              : alpha[ny * width + nx];
            if (neighbour < min) min = neighbour;
          }
        }
        eroded[y * width + x] = min;
      }
    }
    alpha = eroded;
  }

  const out = Buffer.from(data);
  for (let i = 0; i < width * height; i++) out[i * channels + 3] = alpha[i];
  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

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

  // ── Body layer (P10.1, finding A1): the FULL uncropped source canvas —
  // no extract(). The opaque panel (z-index above this layer, see
  // hjem-monter.css) occludes everything below its own top edge; cropping
  // here only ever risked leaving a gap between an arbitrary crop line and
  // the ACTUAL panel edge (which shifts slightly per breakpoint/compact
  // mode). Alpha-eroded (finding A3) before writing.
  const bodyPng = await sharp(SRC).ensureAlpha().png().toBuffer();
  const bodyCleaned = await erodeAlpha(bodyPng, ERODE_PX);
  await sharp(bodyCleaned).toFile(OUT_BODY);

  // ── Hands layer: cropped band from (fingertipY - overlap) to bbox bottom,
  // alpha-eroded (finding A3 — this is the layer the judges specifically
  // flagged for a visible fringe against dark petrol).
  const handsTop = Math.max(0, fingertipY - OVERLAP_PX);
  const handsHeight = bbox.bottom - handsTop + 1;
  const handsPng = await sharp(SRC)
    .ensureAlpha()
    .extract({ left: 0, top: handsTop, width: bbox.width, height: handsHeight })
    .png()
    .toBuffer();
  const handsCleaned = await erodeAlpha(handsPng, ERODE_PX);
  await sharp(handsCleaned).toFile(OUT_HANDS);

  console.log('[split-mascot-layers] erodePx:', ERODE_PX);
  console.log('[split-mascot-layers] wrote', OUT_BODY, `(full uncropped canvas ${bbox.width}x${bbox.height}, occlusion handled by panel z-index/opacity)`);
  console.log('[split-mascot-layers] wrote', OUT_HANDS, `(source rows ${handsTop}..${bbox.bottom}, height ${handsHeight})`);
  console.log('[split-mascot-layers] hands layer top-offset within original canvas:', handsTop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
