// F62 — Combinations audit
// Itererer aktivitet × tempBand × vind × precip × vognMode og rapporterer
// anomalier (sovepose i utelek, solhatt i kuld, manglende solhatt på varm,
// tier-inkonsistens). Skriver markdown-tabell til docs/F62-combinations-audit.md.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Vi bruker tsx programmatisk via dynamisk import — men siden tsx ikke alltid er
// tilgjengelig som ESM-loader, bruker vi i stedet en pre-bygget JS-import via
// vite-build/transpilering. Enklere: kjør med `node --experimental-strip-types`
// eller bruk tsx CLI. Fallback: les .js fra dist.
// I praksis kjører vi: `npx tsx scripts/audit-combinations.mjs`.

// Vi anbefaler å kjøre via: npm exec tsx scripts/audit-combinations.mjs

const { recommend } = await import(
  pathToFileURL(resolve(ROOT, 'src/lib/wool-layers/recommend.ts')).href
);
const { tierFromRecommendation, headwearFromRecommendation } = await import(
  pathToFileURL(resolve(ROOT, 'src/lib/avatar-tier.ts')).href
);

const TEMP_BANDS = [
  { label: 'ekstrem_kuld', feelsLikeC: -18 },
  { label: 'kuld',         feelsLikeC: -3 },
  { label: 'kjølig',       feelsLikeC: 7 },
  { label: 'mild',         feelsLikeC: 13 },
  { label: 'varm',         feelsLikeC: 19 },
  { label: 'tropisk',      feelsLikeC: 25 },
];

const WINDS = [0, 5, 10];
const PRECIPS = [0, 2, 8];
const VOGN_MODES = ['awake', 'sleeping'];

const results = [];
const anomalies = [];

const SOVN_RE = /sovepose|pyjamas/i;
const SOLHATT_RE = /solhatt|caps eller solhatt/i;

function flatItems(rec) {
  return rec.layers.flatMap((l) => l.items.map((i) => i.toLowerCase()));
}

function plaggCount(rec) {
  return rec.layers.reduce((sum, l) => sum + l.items.length, 0);
}

function isCold(label) {
  return label === 'kuld' || label === 'ekstrem_kuld';
}

function isWarmLike(label) {
  return label === 'varm' || label === 'tropisk';
}

const combos = [];
for (const activity of ['utelek', 'vogn']) {
  for (const band of TEMP_BANDS) {
    for (const wind of WINDS) {
      for (const precip of PRECIPS) {
        if (activity === 'vogn') {
          for (const vognMode of VOGN_MODES) {
            combos.push({ activity, band, wind, precip, vognMode });
          }
        } else {
          combos.push({ activity, band, wind, precip, vognMode: null });
        }
      }
    }
  }
}

for (const combo of combos) {
  const input = {
    activity: combo.activity,
    weather: {
      feelsLikeC: combo.band.feelsLikeC,
      tempC: combo.band.feelsLikeC,
      windMs: combo.wind,
      precipMmH: combo.precip,
    },
    child: { ageMonths: 14 },
  };
  if (combo.vognMode) input.vognMode = combo.vognMode;

  let rec;
  try {
    rec = recommend(input);
  } catch (err) {
    anomalies.push({
      combo,
      kind: 'crash',
      message: `recommend() kastet: ${err?.message ?? err}`,
    });
    continue;
  }

  const items = flatItems(rec);
  const tier = tierFromRecommendation(rec, combo.activity);
  const headwear = headwearFromRecommendation(rec);
  const count = plaggCount(rec);
  const allItems = items.join(', ');

  // Anomaly 1: sovepose i utelek
  if (combo.activity === 'utelek' && items.some((i) => /sovepose/i.test(i))) {
    anomalies.push({
      combo,
      kind: 'sovepose_in_utelek',
      message: 'Sovepose vises i utelek — skal kun være vogn+sleeping',
    });
  }

  // Anomaly 2: sovepose i vogn awake
  if (combo.activity === 'vogn' && combo.vognMode === 'awake'
      && items.some((i) => /sovepose/i.test(i))) {
    anomalies.push({
      combo,
      kind: 'sovepose_in_awake_vogn',
      message: 'Sovepose i våken vogn — skal kun ved sleeping-mode',
    });
  }

  // Anomaly 3: solhatt i kuld
  if (isCold(combo.band.label) && items.some((i) => SOLHATT_RE.test(i))) {
    anomalies.push({
      combo,
      kind: 'solhatt_in_cold',
      message: `Solhatt foreslått i ${combo.band.label} (${combo.band.feelsLikeC} °C)`,
    });
  }

  // Anomaly 4: manglende solhatt på varm/tropisk (kun ute, awake)
  const isAwake = combo.activity === 'utelek' || combo.vognMode === 'awake';
  if (isWarmLike(combo.band.label) && isAwake
      && !items.some((i) => SOLHATT_RE.test(i))) {
    anomalies.push({
      combo,
      kind: 'missing_solhatt_in_warm',
      message: `Mangler solhatt på ${combo.band.label} (${combo.band.feelsLikeC} °C) ${combo.activity}`,
    });
  }

  // Anomaly 5: tier-inkonsistens vs plagg-mengde
  // Tropisk/varm bør være A1/A2 med ≤3 items. Frost/ekstrem bør være A5/A6 med ≥5 items.
  if (isWarmLike(combo.band.label) && (tier === 'A5' || tier === 'A6')) {
    anomalies.push({
      combo,
      kind: 'tier_too_heavy_for_warm',
      message: `Tier ${tier} i ${combo.band.label} — for tungt`,
    });
  }
  if (combo.band.label === 'ekstrem_kuld' && (tier === 'A1' || tier === 'A2')) {
    anomalies.push({
      combo,
      kind: 'tier_too_light_for_cold',
      message: `Tier ${tier} i ekstrem_kuld — for lett`,
    });
  }

  results.push({
    combo,
    tier,
    headwear,
    count,
    items: allItems,
    rec,
  });
}

// Build markdown
const lines = [];
lines.push('# F62 — Combinations audit');
lines.push('');
lines.push(`Generert: ${new Date().toISOString()}`);
lines.push('');
lines.push(`**${results.length} kombinasjoner sjekket, ${anomalies.length} anomalier**`);
lines.push('');
lines.push('## Anomalier');
lines.push('');
if (anomalies.length === 0) {
  lines.push('_Ingen anomalier funnet._');
} else {
  lines.push('| Aktivitet | Bånd | Vind | Precip | VognMode | Type | Melding |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const a of anomalies) {
    const c = a.combo;
    lines.push(
      `| ${c.activity} | ${c.band.label} (${c.band.feelsLikeC}°) | ${c.wind} m/s | ${c.precip} mm/t | ${c.vognMode ?? '—'} | ${a.kind} | ${a.message} |`,
    );
  }
}
lines.push('');
lines.push('## Alle kombinasjoner');
lines.push('');
lines.push('| Aktivitet | Bånd | Vind | Precip | VognMode | Tier | Headwear | #plagg | Plagg |');
lines.push('|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
  const c = r.combo;
  lines.push(
    `| ${c.activity} | ${c.band.label} (${c.band.feelsLikeC}°) | ${c.wind} m/s | ${c.precip} mm/t | ${c.vognMode ?? '—'} | ${r.tier} | ${r.headwear} | ${r.count} | ${r.items} |`,
  );
}

const outPath = resolve(ROOT, 'docs/F62-combinations-audit.md');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`${results.length} kombinasjoner sjekket, ${anomalies.length} anomalier`);
console.log(`Skrev rapport til ${outPath}`);
