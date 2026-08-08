import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
// Keep Sharp, a native CommonJS module, outside Vite's module graph.
const sharp = require('sharp') as typeof import('sharp');

const GARMENT_DIR = resolve(process.cwd(), 'public/illustrations/garments');
const ALPHA_THRESHOLD = 8;
const FRAME_WIDTH = 11;
const FRAME_HEIGHT = 6;
const IMAGE_FILL = 0.92;
const MIN_DOMINANT_FRAME_FRACTION = 0.53;
const CENTER_LIMITS = {
  minX: 0.48,
  maxX: 0.53,
  minY: 0.48,
  maxY: 0.57,
} as const;

type AlphaBox = Readonly<{
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}>;

type GarmentMeasurement = Readonly<{
  file: string;
  sourceWidth: number;
  sourceHeight: number;
  visiblePixels: number;
  box: AlphaBox | null;
  dominantFrameFraction: number | null;
}>;

const garmentFiles = readdirSync(GARMENT_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
  .map((entry) => entry.name)
  .sort();

async function measureGarment(file: string): Promise<GarmentMeasurement> {
  const { data, info } = await sharp(resolve(GARMENT_DIR, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let visiblePixels = 0;
  const alphaChannel = info.channels - 1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + alphaChannel];
      if (alpha <= ALPHA_THRESHOLD) continue;

      visiblePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (visiblePixels === 0) {
    return {
      file,
      sourceWidth: info.width,
      sourceHeight: info.height,
      visiblePixels,
      box: null,
      dominantFrameFraction: null,
    };
  }

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const box: AlphaBox = {
    width: boxWidth,
    height: boxHeight,
    // Include the half-pixel extent on each side of the inclusive bbox.
    centerX: (minX + maxX + 1) / (2 * info.width),
    centerY: (minY + maxY + 1) / (2 * info.height),
  };

  // Model an image occupying 92% of an 11:6 frame with object-fit: contain.
  const containScale = Math.min(
    (FRAME_WIDTH * IMAGE_FILL) / info.width,
    (FRAME_HEIGHT * IMAGE_FILL) / info.height,
  );
  const dominantFrameFraction = Math.max(
    (boxWidth * containScale) / FRAME_WIDTH,
    (boxHeight * containScale) / FRAME_HEIGHT,
  );

  return {
    file,
    sourceWidth: info.width,
    sourceHeight: info.height,
    visiblePixels,
    box,
    dominantFrameFraction,
  };
}

let measurements: readonly GarmentMeasurement[] = [];

describe('garment image composition', () => {
  beforeAll(async () => {
    measurements = await Promise.all(garmentFiles.map(measureGarment));
  }, 60_000);

  it('covers the complete active garment catalog', () => {
    expect(
      garmentFiles.length,
      `public/illustrations/garments contains only ${garmentFiles.length} WebP assets`,
    ).toBeGreaterThan(70);
  });

  it(`finds a nonempty alpha > ${ALPHA_THRESHOLD} bounding box for every asset`, () => {
    const failures = measurements
      .filter((measurement) => measurement.box === null)
      .map((measurement) => `${measurement.file}: visiblePixels=${measurement.visiblePixels}`);

    expect(failures, `Every garment needs visible pixels with alpha > ${ALPHA_THRESHOLD}`).toEqual([]);
  });

  it('keeps each visual bounding box centered in its source canvas', () => {
    const failures = measurements.flatMap((measurement) => {
      if (!measurement.box) {
        return [`${measurement.file}: cx=n/a, cy=n/a (empty alpha bbox)`];
      }

      const { centerX, centerY } = measurement.box;
      const isCentered = centerX >= CENTER_LIMITS.minX
        && centerX <= CENTER_LIMITS.maxX
        && centerY >= CENTER_LIMITS.minY
        && centerY <= CENTER_LIMITS.maxY;

      return isCentered
        ? []
        : [
          `${measurement.file}: cx=${centerX.toFixed(4)}, cy=${centerY.toFixed(4)}; `
          + `expected cx=${CENTER_LIMITS.minX.toFixed(2)}-${CENTER_LIMITS.maxX.toFixed(2)}, `
          + `cy=${CENTER_LIMITS.minY.toFixed(2)}-${CENTER_LIMITS.maxY.toFixed(2)}`,
        ];
    });

    expect(failures, 'Off-center garment silhouettes').toEqual([]);
  });

  it('keeps every contained silhouette large enough in the 11:6 garment frame', () => {
    const failures = measurements.flatMap((measurement) => {
      if (measurement.dominantFrameFraction === null || !measurement.box) {
        return [`${measurement.file}: dominant=n/a (empty alpha bbox)`];
      }

      if (measurement.dominantFrameFraction >= MIN_DOMINANT_FRAME_FRACTION) return [];

      return [
        `${measurement.file}: dominant=${measurement.dominantFrameFraction.toFixed(4)}, `
        + `bbox=${measurement.box.width}x${measurement.box.height}, `
        + `source=${measurement.sourceWidth}x${measurement.sourceHeight}; `
        + `expected >=${MIN_DOMINANT_FRAME_FRACTION.toFixed(2)}`,
      ];
    });

    expect(
      failures,
      `Silhouettes use object-fit: contain at ${Math.round(IMAGE_FILL * 100)}% in an 11:6 frame`,
    ).toEqual([]);
  });
});
