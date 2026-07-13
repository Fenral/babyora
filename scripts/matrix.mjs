#!/usr/bin/env node
/**
 * P3.1 — Snapshot-matrise for wool-layers.
 *
 * Kjorer motoren over alle kombinasjoner av temp, vind, nedbor, alder
 * og aktivitet. Skriver ut review/MATRIX.md som menneske kan skumme
 * pa ti minutter.
 *
 * Kjor: node scripts/matrix.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recommend } from '../src/lib/wool-layers/recommend.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

const TEMPS = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];
const VINDS = [0, 4, 8, 12];
const NEDBOR = [
  { label: 'tort',  precipMmH: 0,   symbolCode: 'partlycloudy_day' },
  { label: 'yr',    precipMmH: 0.5, symbolCode: 'lightrain' },
  { label: 'regn',  precipMmH: 2,   symbolCode: 'rain' },
  { label: 'sno',   precipMmH: 1,   symbolCode: 'snow' },
];
const ALDRE = [2, 8, 18, 30];

// vogn-vaken / vogn-sover / baeresele / utelek / soevn / bilstol
const CASES = [
  { label: 'vogn-vaken', activity: 'vogn', vognMode: 'awake', bilstol: false },
  { label: 'vogn-sover', activity: 'vogn', vognMode: 'sleeping', bilstol: false },
  { label: 'baeresele',  activity: 'baeresele' },
  { label: 'utelek',     activity: 'utelek' },
  { label: 'soevn',      activity: 'soevn' },
  { label: 'bilstol',    activity: 'vogn', vognMode: 'awake', bilstol: true },
];

function feelsLike(tempC, windMs) {
  // Forenklet vindkjoling — kun for matrix-input. Motoren har sin egen.
  if (tempC > 10 || windMs < 1.5) return tempC;
  return Math.round(13.12 + 0.6215 * tempC - 11.37 * Math.pow(windMs * 3.6, 0.16) + 0.3965 * tempC * Math.pow(windMs * 3.6, 0.16));
}

function summarizeLayers(rec) {
  // Bruk ⋅ (bullet) som intern separator slik at markdown-tabell ikke
  // brytes opp av pipe-tegnet '|'.
  const items = rec.layers
    .filter((l) => l.items.length > 0)
    .map((l) => `${l.category[0].toUpperCase()}: ${l.items.slice(0, 2).join(', ')}`);
  return items.join(' ⋅ ') || '(tomt)';
}

const sections = [];
sections.push(`# wool-layers snapshot-matrise\n\nGenerert ${new Date().toISOString()}\n`);
sections.push(`Kjor: \`node scripts/matrix.mjs\`\n`);
sections.push(`Hver tabell viser plagg-sammensetning per (temp, vind, nedbor).\nBruk dette til a finne celler som virker urimelige.\n`);

for (const c of CASES) {
  for (const alder of ALDRE) {
    const heading = `\n## ${c.label} · ${alder} mnd\n`;
    sections.push(heading);
    sections.push(`| temp \\ vind+nedbor | ${VINDS.flatMap((v) => NEDBOR.map((n) => `${v} m/s ${n.label}`)).join(' | ')} |`);
    sections.push(`|${'---|'.repeat(VINDS.length * NEDBOR.length + 1)}`);

    for (const temp of TEMPS) {
      const row = [`**${temp}°**`];
      for (const v of VINDS) {
        for (const n of NEDBOR) {
          try {
            const rec = recommend({
              weather: {
                tempC: temp,
                feelsLikeC: feelsLike(temp, v),
                windMs: v,
                precipMmH: n.precipMmH,
                symbolCode: n.symbolCode,
              },
              child: { ageMonths: alder },
              activity: c.activity,
              vognMode: c.vognMode,
              context: c.bilstol ? { bilstol: true } : undefined,
            });
            row.push(summarizeLayers(rec));
          } catch (e) {
            row.push(`(ERR: ${e.message.slice(0, 40)})`);
          }
        }
      }
      sections.push(`| ${row.join(' | ')} |`);
    }
  }
}

const outDir = join(ROOT, 'review');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'MATRIX.md'), sections.join('\n'));
console.log(`Skrev review/MATRIX.md (${sections.length} linjer)`);
