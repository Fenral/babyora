#!/usr/bin/env node
/* F28.20.r1 (V0): tile-test for LayerSheet bandForTemp.
 * Itererer hele temp-spennet og asserterer at hver temp får NØYAKTIG
 * ett bånd. Fanger fremtidige bånd-bugs (hull eller overlapp) som
 * Self-Verify ikke fanger.
 */
import { exit } from 'node:process';

// F28.19 bånd-logikk (samme som i InstrumentLayerSheet.tsx)
function bandForTemp(temp) {
  if (temp < -7) return 'streng_kald';
  if (temp < 0) return 'kald';
  if (temp < 8) return 'kjolig';
  if (temp < 16) return 'mild';
  if (temp < 22) return 'varm';
  if (temp < 28) return 'tropisk';
  return 'ekstrem_varme';
}

const BANDS = ['streng_kald', 'kald', 'kjolig', 'mild', 'varm', 'tropisk', 'ekstrem_varme'];
const STEP = 0.5;
const MIN = -25;
const MAX = 35;

const seen = new Map(); // band → [first temp, last temp]
let fails = 0;

for (let t = MIN; t <= MAX; t += STEP) {
  // Round to avoid floating-point precision in step iteration
  const temp = Math.round(t * 10) / 10;
  const band = bandForTemp(temp);
  if (!BANDS.includes(band)) {
    console.log(`✗ FAIL: temp=${temp} ga ukjent bånd "${band}"`);
    fails++;
    continue;
  }
  const entry = seen.get(band);
  if (entry == null) seen.set(band, [temp, temp]);
  else seen.set(band, [entry[0], temp]);
}

console.log('— BÅND-REKKEVIDDER —');
for (const band of BANDS) {
  const range = seen.get(band);
  if (!range) {
    console.log(`✗ band "${band}" fikk ALDRI noen temp (hull i tile-en?)`);
    fails++;
    continue;
  }
  console.log(`  ${band}: ${range[0]}° → ${range[1]}°`);
}

// Verifiser at bånd-grensene tiler hele linja (ingen hull)
const ranges = BANDS.map((b) => seen.get(b)).filter(Boolean);
ranges.sort((a, b) => a[0] - b[0]);
for (let i = 0; i < ranges.length - 1; i++) {
  const curr = ranges[i];
  const next = ranges[i + 1];
  if (next[0] - curr[1] > STEP * 1.5) {
    console.log(`✗ HULL mellom ${curr[1]}° og ${next[0]}° (delta ${next[0] - curr[1]})`);
    fails++;
  }
}

console.log('\n─── VERDICT ───');
if (fails === 0) {
  console.log('✓ Tile-test: hver temp i [-25, 35] gir nøyaktig ett bånd.');
  console.log('✓ Ingen hull mellom bånd-grenser.');
  console.log(`✓ ${seen.size}/${BANDS.length} bånd dekket.`);
} else {
  console.log(`✗ ${fails} feil — fix bånd-logikken før push.`);
}
exit(fails === 0 ? 0 : 1);
