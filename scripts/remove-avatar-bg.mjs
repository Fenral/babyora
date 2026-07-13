#!/usr/bin/env node
/* Post-process: knock out the near-uniform background of avatar PNGs and save as RGBA.
 * Adaptive per image: samples the 4 corners to estimate background color,
 * then uses Euclidean distance in RGB for a soft alpha ramp.
 *
 * Globs public/avatars/*.png and skips files that already have transparent corners.
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

const DIR = "public/avatars";
const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));

let processed = 0, skipped = 0;
for (const f of files) {
  const inPath = join(DIR, f);
  const { data, info } = await sharp(readFileSync(inPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) {
    console.error(`  ${f}: expected 4 channels, got ${channels}`);
    continue;
  }

  // Skip if already normalized (corners are transparent)
  const c1 = (10 * width + 10) * 4;
  const c2 = ((height - 10) * width + (width - 10)) * 4;
  if (data[c1 + 3] === 0 && data[c2 + 3] === 0) {
    skipped++;
    console.log(`  ${f}: skip (already transparent)`);
    continue;
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
    if (alpha < 255) {
      // Despill magenta tint (high R + high B, low G)
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
  writeFileSync(inPath, png);
  processed++;
  console.log(`  ${f}: bg≈rgb(${bg.join(",")})  ${png.length}B`);
}
console.log(`done — processed ${processed}, skipped ${skipped}`);
