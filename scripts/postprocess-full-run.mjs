#!/usr/bin/env node
/* Post-process review/nano-banana-pro/full-run/{garments,avatars}/*.png:
 *  1) knock out magenta (#FF00FF) → transparent alpha (with despill)
 *  2) bake in a soft elliptical contact shadow under each subject
 *
 * Writes:
 *   review/nano-banana-pro/full-run/transparent/{garments,avatars}/*.png
 *   review/nano-banana-pro/full-run/on-cream/{garments,avatars}/*.png
 *
 * Usage: node scripts/postprocess-full-run.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC_ROOT = join(ROOT, "review", "nano-banana-pro", "full-run");
const DIRS = ["garments", "avatars"];

const MAGENTA = [255, 0, 255];
const FULLY_TRANSPARENT_DIST = 90;
const FULLY_OPAQUE_DIST = 170;
const CREAM = { r: 0xfa, g: 0xf6, b: 0xef };

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

async function shadowLayer(width, height, bbox) {
  const objW = bbox.maxX - bbox.minX;
  const cx = (bbox.minX + bbox.maxX) / 2;
  const rx = Math.max(8, objW * 0.32);
  const ry = Math.max(4, objW * 0.07);
  const cy = Math.min(height - ry - 2, bbox.maxY - ry * 0.4);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="black" fill-opacity="0.22"/>
  </svg>`;
  return sharp(Buffer.from(svg)).blur(Math.max(3, ry * 0.9)).png().toBuffer();
}

async function process1(srcPath, outTransparent, outOnCream) {
  const { data, info } = await sharp(readFileSync(srcPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const { out, bbox } = keyOutMagenta(data, width, height);
  const subjectPng = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const shadowPng = await shadowLayer(width, height, bbox);
  const transparent = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: shadowPng }, { input: subjectPng }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(outTransparent, transparent);
  const onCream = await sharp({
    create: { width, height, channels: 4, background: { ...CREAM, alpha: 1 } },
  })
    .composite([{ input: transparent }])
    .png()
    .toBuffer();
  writeFileSync(outOnCream, onCream);
}

let total = 0;
for (const sub of DIRS) {
  const srcDir = join(SRC_ROOT, sub);
  const transDir = join(SRC_ROOT, "transparent", sub);
  const creamDir = join(SRC_ROOT, "on-cream", sub);
  for (const d of [transDir, creamDir]) if (!existsSync(d)) mkdirSync(d, { recursive: true });
  if (!existsSync(srcDir)) {
    console.log(`(skip ${sub} — no source dir)`);
    continue;
  }
  const files = readdirSync(srcDir).filter((f) => f.endsWith(".png"));
  console.log(`processing ${files.length} files in ${sub}/...`);
  for (const f of files) {
    await process1(join(srcDir, f), join(transDir, f), join(creamDir, f));
    total++;
  }
}
console.log(`done — ${total} files processed → transparent/ + on-cream/ under ${SRC_ROOT}`);
