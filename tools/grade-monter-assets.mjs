/**
 * grade-monter-assets — P9 asset-fargestandard (duel §13,
 * docs/design-notes/sol-duel-2026-07-31.md): "samme hvitbalanse/eksponering/
 * maks-metning/skyggeretning/bakgrunnsvarme på alle plagg; nøytral
 * "display stage"; plaggets faktiske farge beholdes alltid."
 *
 * Konservativ batch (bevisst IKKE en full display-stage-rebuild — den
 * krever ny fotografering/rendering av hvert plagg og er utenfor denne
 * pakkens omfang, se P9-rapporten): et ENKELT, mekanisk, reversibelt pass
 * over de 42 plagg-PNG-ene i public/monter/:
 *   1. Metnings-tak (`modulate({ saturation: SATURATION_CAP })`) — retter
 *      §13-funnet "oransje genser konkurrerer med CTA" MED et metnings-tak
 *      i stedet for omfarging (Sols egen fargeeierskap-tabell: plaggfarger
 *      ER innhold, farges aldri om — kun dempes ensartet).
 *   2. Normaliserer til konsistente maks-dimensjoner (cap, ikke tvungen
 *      oppskalering — `fit: 'inside'` bevarer sideforhold, rører ALDRI
 *      bilder som allerede er innenfor grensen).
 *
 * Rører ALDRI vær-ikonene (vaer-*.png) eller maskoten (maskot.png,
 * nylig bakgrunn-fjernet) — kun `plagg-*.png`.
 *
 * Idempotent: en manifest (MANIFEST_PATH) lagrer sha256 av hver fils
 * INNHOLD ETTER gradering. Et nytt kjør som finner uendret innhold hopper
 * over filen (unngår at metnings-taket komponeres/forsterkes ved gjentatte
 * kjøringer). Endres kildefilen (ny illustrasjon), avviker hashen fra
 * manifestet, og filen graderes på nytt.
 *
 * Kjøres: node tools/grade-monter-assets.mjs [--dry-run]
 * Exit 0 = fullført (uansett om noe faktisk ble gradert). Exit 1 = feil.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const MONTER_DIR = 'public/monter';
const MANIFEST_PATH = 'tools/monter-asset-grading-manifest.json';
/** duel §13: "maks-metning" — ETT tak for hele plagg-biblioteket, ikke omfarging. */
const SATURATION_CAP = 0.88;
/** Alle 42 kildene er allerede 512×512 — dette er en CAP (fit:'inside'), ikke en tvungen resize. */
const MAX_DIMENSION = 512;

const dryRun = process.argv.includes('--dry-run');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    console.error(`[grade-monter-assets] Klarte ikke å lese eksisterende manifest (${MANIFEST_PATH}), starter friskt: ${err.message}`);
    return {};
  }
}

async function main() {
  const files = (await readdir(MONTER_DIR))
    .filter((f) => f.startsWith('plagg-') && f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error(`[grade-monter-assets] Fant ingen plagg-*.png i ${MONTER_DIR} — avbryter.`);
    process.exit(1);
  }

  const manifest = await loadManifest();
  let graded = 0;
  let skipped = 0;
  const results = [];

  for (const file of files) {
    const filePath = join(MONTER_DIR, file);
    const before = await readFile(filePath);
    const beforeHash = sha256(before);
    const beforeMeta = await sharp(before).metadata();

    const entry = manifest[file];
    if (entry && entry.hash === beforeHash && entry.saturation === SATURATION_CAP && entry.maxDimension === MAX_DIMENSION) {
      skipped += 1;
      results.push({ file, status: 'skipped (allerede gradert, uendret siden sist)', width: beforeMeta.width, height: beforeMeta.height });
      continue;
    }

    const after = await sharp(before)
      .modulate({ saturation: SATURATION_CAP })
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    const afterMeta = await sharp(after).metadata();
    const afterHash = sha256(after);

    if (!dryRun) {
      await writeFile(filePath, after);
    }
    manifest[file] = {
      hash: dryRun ? beforeHash : afterHash,
      saturation: SATURATION_CAP,
      maxDimension: MAX_DIMENSION,
      gradedAt: new Date().toISOString(),
    };
    graded += 1;
    results.push({
      file,
      status: dryRun ? 'ville blitt gradert (--dry-run, ikke skrevet)' : 'gradert',
      width: afterMeta.width,
      height: afterMeta.height,
    });
  }

  for (const r of results) {
    console.log(`${r.status.padEnd(42)} ${r.file}  (${r.width}×${r.height})`);
  }

  if (!dryRun) {
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  console.log(`\n[grade-monter-assets] ${graded} gradert, ${skipped} hoppet over (uendret), av ${files.length} totalt.${dryRun ? ' (--dry-run: ingenting skrevet til disk)' : ` Manifest: ${MANIFEST_PATH}`}`);
}

main().catch((err) => {
  console.error('[grade-monter-assets] Feilet:', err);
  process.exit(1);
});
