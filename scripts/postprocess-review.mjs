#!/usr/bin/env node
/* Post-process review/nano-banana-pro/*.png:
 *  1) knock out the magenta (#FF00FF) chroma-key background -> real alpha transparency
 *     (with magenta despill on soft edges, same idea as remove-avatar-bg.mjs)
 *  2) bake in a soft elliptical contact shadow under the subject, so near-white
 *     items stay readable on the app's warm cream background (#FAF6EF)
 *
 * Originals are read from review/nano-banana-pro/ and transparent results written to
 * review/nano-banana-pro/transparent/. A cream-composited preview (for eyeballing how it
 * looks in-app) is written to review/nano-banana-pro/on-cream/.
 *
 * Usage: node scripts/postprocess-review.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "review", "nano-banana-pro");
const OUT_T = join(SRC, "transparent");
const OUT_C = join(SRC, "on-cream");
for (const d of [OUT_T, OUT_C]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

const MAGENTA = [255, 0, 255];
const FULLY_TRANSPARENT_DIST = 90;  // <= this distance from magenta -> fully transparent
const FULLY_OPAQUE_DIST = 170;      // >= this distance -> fully opaque (soft ramp between)
const CREAM = { r: 0xfa, g: 0xf6, b: 0xef };

// Knock out magenta -> RGBA buffer with alpha; returns {out, width, height, bbox}.
function keyOutMagenta(data, width, height) {
  const out = Buffer.alloc(data.length);
  data.copy(out);
  let minX = width, minY = height, maxX = 0, maxY = 0, opaque = 0;
  for (let i = 0; i < data.length; i += 4) {
    const dR = data[i] - MAGENTA[0];
    const dG = data[i + 1] - MAGENTA[1];
    const dB = data[i + 2] - MAGENTA[2];
    const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);
    let alpha;
    if (dist <= FULLY_TRANSPARENT_DIST) alpha = 0;
    else if (dist >= FULLY_OPAQUE_DIST) alpha = 255;
    else alpha = Math.round(((dist - FULLY_TRANSPARENT_DIST) / (FULLY_OPAQUE_DIST - FULLY_TRANSPARENT_DIST)) * 255);

    if (alpha < 255) {
      // magenta despill: magenta = high R + high B, low G -> pull R,B down toward G on edges
      if (data[i] > data[i + 1] && data[i + 2] > data[i + 1]) {
        out[i] = Math.min(data[i], data[i + 1] + 12);
        out[i + 2] = Math.min(data[i + 2], data[i + 1] + 12);
      }
    }
    out[i + 3] = alpha;

    if (alpha > 40) {
      const px = (i / 4) % width;
      const py = Math.floor(i / 4 / width);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      opaque++;
    }
  }
  const bbox = opaque ? { minX, minY, maxX, maxY } : { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  return { out, bbox };
}

// Build a blurred elliptical contact shadow sized to the subject bbox.
async function shadowLayer(width, height, bbox) {
  const objW = bbox.maxX - bbox.minX;
  const cx = (bbox.minX + bbox.maxX) / 2;
  const rx = Math.max(8, objW * 0.32);
  const ry = Math.max(4, objW * 0.07);
  const cy = Math.min(height - ry - 2, bbox.maxY - ry * 0.4); // just under the subject's feet
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="black" fill-opacity="0.28"/>
  </svg>`;
  return sharp(Buffer.from(svg)).blur(Math.max(3, ry * 0.9)).png().toBuffer();
}

const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith(".png")) : [];
if (!files.length) {
  console.error(`no PNGs in ${SRC} yet — run scripts/compare-nano-banana-pro.mjs first.`);
  process.exit(1);
}

for (const f of files) {
  const { data, info } = await sharp(readFileSync(join(SRC, f)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const { out, bbox } = keyOutMagenta(data, width, height);
  const subjectPng = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const shadowPng = await shadowLayer(width, height, bbox);

  // transparent result = shadow under subject, on a fully transparent canvas
  const transparent = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: shadowPng }, { input: subjectPng }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(OUT_T, f), transparent);

  // cream preview = same, flattened onto #FAF6EF (how it reads in-app)
  const onCream = await sharp({
    create: { width, height, channels: 4, background: { ...CREAM, alpha: 1 } },
  })
    .composite([{ input: transparent }])
    .png()
    .toBuffer();
  writeFileSync(join(OUT_C, f), onCream);

  console.log(`${f}: bbox ${bbox.minX},${bbox.minY}..${bbox.maxX},${bbox.maxY} -> transparent + on-cream`);
}
console.log(`done — transparent/ and on-cream/ written under ${SRC}`);
