#!/usr/bin/env node
/* Post-process garment PNGs: chroma-key magenta background → transparent RGBA.
 *
 * Adaptive corner-sampling + despill — same strategy as remove-avatar-bg.mjs.
 * For garment PNGs the corner samples should always hit the magenta background
 * since garments are placed in known anatomic zones away from canvas edges.
 *
 * Usage:
 *   node scripts/normalize-garments.mjs              # all PNGs in garments/
 *   node scripts/normalize-garments.mjs --id=lue     # single PNG by id
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FULLY_TRANSPARENT_DIST = 35;
const FULLY_OPAQUE_DIST = 90;

function sampleBg(data, width, height, channels) {
  const SAMPLE_BOX = 24;
  const margin = 4;
  const regions = [
    [margin, margin],
    [width - margin - SAMPLE_BOX, margin],
    [margin, height - margin - SAMPLE_BOX],
    [width - margin - SAMPLE_BOX, height - margin - SAMPLE_BOX],
  ];
  const samples = [];
  for (const [x0, y0] of regions) {
    for (let dy = 0; dy < SAMPLE_BOX; dy++) {
      for (let dx = 0; dx < SAMPLE_BOX; dx++) {
        const i = ((y0 + dy) * width + (x0 + dx)) * channels;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  return samples[Math.floor(samples.length / 2)];
}

async function processFile(filepath) {
  const { data, info } = await sharp(readFileSync(filepath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected 4 channels, got ${channels}`);

  // Skip if already normalized (corners are transparent)
  const c1 = (10 * width + 10) * 4;
  const c2 = ((height - 10) * width + (width - 10)) * 4;
  if (data[c1 + 3] === 0 && data[c2 + 3] === 0) {
    return { skipped: true, bg: null, size: 0 };
  }

  const bg = sampleBg(data, width, height, channels);
  const out = Buffer.alloc(data.length);
  data.copy(out);

  for (let i = 0; i < data.length; i += 4) {
    const dR = data[i] - bg[0];
    const dG = data[i + 1] - bg[1];
    const dB = data[i + 2] - bg[2];
    const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);
    let alpha;
    if (dist <= FULLY_TRANSPARENT_DIST) {
      alpha = 0;
    } else if (dist >= FULLY_OPAQUE_DIST) {
      alpha = 255;
    } else {
      const t = (dist - FULLY_TRANSPARENT_DIST) / (FULLY_OPAQUE_DIST - FULLY_TRANSPARENT_DIST);
      alpha = Math.round(t * 255);
    }
    // Despill magenta/pink tint on garment edges:
    // magenta has high R + high B, low G — clamp R and B if both exceed G
    if (alpha < 255) {
      const greenSpill = data[i + 2] > data[i + 1] && data[i] > data[i + 1];
      if (greenSpill) {
        out[i] = Math.min(data[i], data[i + 1] + 10);
        out[i + 2] = Math.min(data[i + 2], data[i + 1] + 10);
      }
    }
    out[i + 3] = alpha;
  }

  const png = await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(filepath, png);
  return { size: png.length, bg };
}

const args = process.argv.slice(2);
const idArg = args.find((a) => a.startsWith("--id="));
const id = idArg ? idArg.split("=")[1] : null;

const DIR = "public/illustrations/garments";
const files = readdirSync(DIR).filter((f) =>
  f.endsWith(".png") && (id ? f === `${id}.png` : true),
);

if (files.length === 0) {
  console.error(`no PNGs found in ${DIR}${id ? ` matching ${id}` : ""}`);
  process.exit(1);
}

console.log(`normalizing ${files.length} garment PNG(s)...`);
let processed = 0, skipped = 0;
for (const f of files) {
  const filepath = join(DIR, f);
  try {
    const result = await processFile(filepath);
    if (result.skipped) {
      skipped++;
      console.log(`  ${f}: skip (already transparent)`);
    } else {
      processed++;
      console.log(`  ${f}: bg≈rgb(${result.bg.join(",")})  ${result.size}B`);
    }
  } catch (e) {
    console.error(`  ${f} failed:`, e.message);
  }
}
console.log(`done — processed ${processed}, skipped ${skipped}`);
