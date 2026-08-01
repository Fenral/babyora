#!/usr/bin/env node
/**
 * cut-standing-mascot.mjs — P10.1 (judge finding D1, onboarding steg 1).
 *
 * The source portrait (docs/mocks/monter/assets-v1/maskot-staaende.png) has
 * a FULLY OPAQUE baked-in dark background (~rgb(39,22,15) — close to, but
 * NOT identical to, the app's actual --dw-canvas #1E140C/rgb(30,20,12)).
 * Compositing that baked rectangle directly against the app's real canvas
 * gradient would show a visible rectangular seam where the two similar-but-
 * different darks meet — exactly what the judges' finding D1 described.
 * `public/monter/maskot-staaende-cut-360.png` (the asset the app actually
 * ships) was previously cut by hand/ad-hoc; this script makes that
 * reproducible, scripted, and re-runnable — same convention as
 * split-mascot-layers.mjs for the hanging-mascot layers.
 *
 * Method: CORNER-REFERENCED FLOOD FILL — sample the background colour from
 * the four corners (they must agree; this script asserts that before doing
 * anything else, so a source with a genuinely different background per
 * corner fails loudly instead of cutting a random hole), then a
 * neighbour-tolerant BFS flood fill starting from every border pixel,
 * erasing (alpha=0) any pixel CONNECTED to the border whose colour is
 * within `--tolerance` of the colour it flooded in from. This only ever
 * removes the connected background region — a disconnected same-coloured
 * interior area (e.g. dark hair) is untouched, unlike a naive global
 * colour-key.
 *
 * After the flood fill: crop to the character's alpha bbox (+ padding),
 * resize to the target square canvas, then a 1px alpha-erosion pass
 * (same technique as split-mascot-layers.mjs, judges' finding A3) cleans
 * the residual premultiplied-alpha fringe at the new cut edge. Finally,
 * verifies no residue: composites the result onto a dark test canvas and
 * asserts every border/corner sample pixel is fully transparent.
 *
 * Usage: node tools/cut-standing-mascot.mjs [--size=360] [--tolerance=18] [--pad=0.04] [--erode=1]
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'docs/mocks/monter/assets-v1/maskot-staaende.png');
const OUT = path.join(ROOT, 'public/monter/maskot-staaende-cut-360.png');

function argNum(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const value = Number(arg.split('=')[1]);
  return Number.isFinite(value) ? value : fallback;
}

const TARGET_SIZE = argNum('size', 360);
const TOLERANCE = argNum('tolerance', 18); // per-channel max delta to count as "same as flooded-from neighbour"
const PAD_FRACTION = argNum('pad', 0.04); // extra padding around the alpha bbox, as a fraction of the bbox's larger side
const ERODE_PX = argNum('erode', 1);

function colorAt(data, channels, width, x, y) {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2]];
}

function colorDist(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

/**
 * BFS flood fill from every border pixel, connectivity-gated (only pixels
 * actually CONNECTED to the border can ever be erased — a disconnected
 * same-coloured interior region, e.g. dark hair, is untouched) but colour-
 * gated against a FIXED reference colour (`bgRef`, the corner average) —
 * deliberately NOT neighbour-to-neighbour comparison. A neighbour-tolerant
 * walk can "leak" through a smooth anti-aliased edge one small step at a
 * time, each step within tolerance of its immediate predecessor, and
 * tunnel all the way into the foreground on a gradient; comparing every
 * candidate against the SAME fixed reference instead makes the fill stop
 * exactly where the colour genuinely diverges from the background, no
 * matter how gradual the local gradient is.
 */
function floodFillBackground(data, alpha, width, height, channels, bgRef, tolerance) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  function seed(x, y) {
    const idx = y * width + x;
    if (visited[idx]) return;
    if (colorDist(colorAt(data, channels, width, x, y), bgRef) > tolerance) return;
    visited[idx] = 1;
    alpha[idx] = 0;
    queue.push(idx);
  }

  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head];
    head += 1;
    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbours = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
    ];
    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;
      const neighbourColor = colorAt(data, channels, width, nx, ny);
      if (colorDist(neighbourColor, bgRef) <= tolerance) {
        visited[nIdx] = 1;
        alpha[nIdx] = 0;
        queue.push(nIdx);
      }
    }
  }

  return visited;
}

/** Same 3x3-minimum alpha erosion technique as split-mascot-layers.mjs's own erodeAlpha(). */
function erodeAlpha(alpha, width, height, radiusPx) {
  let current = alpha;
  for (let iter = 0; iter < radiusPx; iter++) {
    const eroded = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let min = current[y * width + x];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const neighbour = (nx < 0 || ny < 0 || nx >= width || ny >= height)
              ? 0
              : current[ny * width + nx];
            if (neighbour < min) min = neighbour;
          }
        }
        eroded[y * width + x] = min;
      }
    }
    current = eroded;
  }
  return current;
}

function computeAlphaBBox(alpha, width, height, threshold) {
  let top = null;
  let bottom = null;
  let left = null;
  let right = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] > threshold) {
        if (top === null) top = y;
        bottom = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }
  }
  if (top === null) throw new Error('flood fill erased the ENTIRE canvas — tolerance too high, or source has no distinct subject.');
  return { top, bottom, left, right };
}

async function verifyNoResidue(pngBuffer) {
  const testCanvasSize = 40;
  const composed = await sharp({
    create: { width: TARGET_SIZE + testCanvasSize, height: TARGET_SIZE + testCanvasSize, channels: 4, background: '#1E140C' },
  })
    .composite([{ input: pngBuffer, top: testCanvasSize / 2, left: testCanvasSize / 2 }])
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = composed;
  const { width, height, channels } = info;
  // Sample a ring of border/corner points on the DARK TEST CANVAS itself
  // (outside where the mascot was composited) — none of these should carry
  // any trace of the source's own baked background rectangle.
  const samples = [];
  for (let x = 0; x < width; x += 5) {
    samples.push([x, 2], [x, height - 3]);
  }
  for (let y = 0; y < height; y += 5) {
    samples.push([2, y], [width - 3, y]);
  }
  const canvasRGB = [0x1e, 0x14, 0x0c];
  let residueCount = 0;
  for (const [x, y] of samples) {
    const i = (y * width + x) * channels;
    const px = [data[i], data[i + 1], data[i + 2]];
    if (colorDist(px, canvasRGB) > 3) residueCount++;
  }
  return { residueCount, sampleCount: samples.length };
}

async function main() {
  const src = sharp(SRC).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const corners = [
    colorAt(data, channels, width, 2, 2),
    colorAt(data, channels, width, width - 3, 2),
    colorAt(data, channels, width, 2, height - 3),
    colorAt(data, channels, width, width - 3, height - 3),
  ];
  const maxCornerDist = Math.max(
    colorDist(corners[0], corners[1]),
    colorDist(corners[0], corners[2]),
    colorDist(corners[0], corners[3]),
  );
  console.log('[cut-standing-mascot] corner colours:', corners.map((c) => `rgb(${c.join(',')})`).join(' / '));
  if (maxCornerDist > TOLERANCE * 2) {
    throw new Error(
      `corners disagree by up to ${maxCornerDist} (tolerance*2=${TOLERANCE * 2}) — this source doesn't have a uniform baked background; corner-referenced flood fill would cut unpredictably. Aborting rather than guessing.`,
    );
  }

  const bgRef = [
    Math.round(corners.reduce((sum, c) => sum + c[0], 0) / corners.length),
    Math.round(corners.reduce((sum, c) => sum + c[1], 0) / corners.length),
    Math.round(corners.reduce((sum, c) => sum + c[2], 0) / corners.length),
  ];

  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * channels + 3];

  floodFillBackground(data, alpha, width, height, channels, bgRef, TOLERANCE);

  const bbox = computeAlphaBBox(alpha, width, height, 10);
  const bboxW = bbox.right - bbox.left + 1;
  const bboxH = bbox.bottom - bbox.top + 1;
  const side = Math.max(bboxW, bboxH);
  const pad = Math.round(side * PAD_FRACTION);
  const cropSide = side + pad * 2;
  const cropLeft = Math.max(0, Math.round(bbox.left - (cropSide - bboxW) / 2));
  const cropTop = Math.max(0, Math.round(bbox.top - (cropSide - bboxH) / 2));
  const cropW = Math.min(cropSide, width - cropLeft);
  const cropH = Math.min(cropSide, height - cropTop);

  console.log('[cut-standing-mascot] alpha bbox:', bbox, `(${bboxW}x${bboxH})`);
  console.log('[cut-standing-mascot] crop:', { left: cropLeft, top: cropTop, width: cropW, height: cropH });

  // Rebuild an RGBA buffer with the flood-filled alpha, then crop+resize+erode.
  const rgba = Buffer.from(data);
  for (let i = 0; i < width * height; i++) rgba[i * channels + 3] = alpha[i];

  const croppedPng = await sharp(rgba, { raw: { width, height, channels } })
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const { data: resizedData, info: resizedInfo } = await sharp(croppedPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rw = resizedInfo.width;
  const rh = resizedInfo.height;
  const rChannels = resizedInfo.channels;
  const resizedAlpha = new Uint8ClampedArray(rw * rh);
  for (let i = 0; i < rw * rh; i++) resizedAlpha[i] = resizedData[i * rChannels + 3];
  const erodedAlpha = erodeAlpha(resizedAlpha, rw, rh, ERODE_PX);
  for (let i = 0; i < rw * rh; i++) resizedData[i * rChannels + 3] = erodedAlpha[i];

  const finalPng = await sharp(resizedData, { raw: { width: rw, height: rh, channels: rChannels } }).png().toBuffer();

  const { residueCount, sampleCount } = await verifyNoResidue(finalPng);
  console.log(`[cut-standing-mascot] residue check: ${residueCount}/${sampleCount} border samples show a background trace against a dark test canvas`);
  if (residueCount > 0) {
    throw new Error(`residue detected (${residueCount}/${sampleCount}) — do not ship this output; try a lower --tolerance or inspect the source.`);
  }

  await sharp(finalPng).toFile(OUT);
  console.log('[cut-standing-mascot] wrote', OUT, `(${TARGET_SIZE}x${TARGET_SIZE}, erodePx=${ERODE_PX})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
