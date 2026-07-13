#!/usr/bin/env node
/* F27 contrast-verifier.
 * Usage:
 *   node scripts/verify-contrast.mjs '#AD4B2A' '#F4EEE7' [--min=4.5]
 *   node scripts/verify-contrast.mjs --pairs
 *
 * --pairs runs ALL F27 critical pairs (a11y-lead's worst-case list) and
 * exits 0 if all pass, 1 otherwise.
 */
import { argv, exit } from 'node:process';

// Parse #RRGGBB → [r,g,b] (0..255)
function hex2rgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

// sRGB channel → linear
function srgb2lin(v) {
  v = v / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// WCAG relative luminance
function luminance([r, g, b]) {
  return 0.2126 * srgb2lin(r) + 0.7152 * srgb2lin(g) + 0.0722 * srgb2lin(b);
}

// WCAG 2.2 contrast ratio
function contrast(fg, bg) {
  const lF = luminance(hex2rgb(fg));
  const lB = luminance(hex2rgb(bg));
  const [lo, hi] = lF < lB ? [lF, lB] : [lB, lF];
  return (hi + 0.05) / (lo + 0.05);
}

// APCA Lc — simplified (uses Y-only, no polarity-flipping)
function apcaLc(fg, bg) {
  const yFg = Math.pow(luminance(hex2rgb(fg)), 0.56);
  const yBg = Math.pow(luminance(hex2rgb(bg)), 0.57);
  const Sapc = (yBg - yFg) * 1.14;
  const lc = Math.abs(Sapc) < 0.001 ? 0 : (Sapc > 0 ? Sapc - 0.027 : Sapc + 0.027) * 100;
  return Math.abs(lc);
}

// F27 critical palette pairs from a11y-lead
const F27_PAIRS = [
  { name: 'ink-900 on sand-bg', fg: '#2B2522', bg: '#F4EEE7', min: 7.0, note: 'body text — must be ≥7:1 AAA' },
  { name: 'ink-700 on sand-bg', fg: '#5A514C', bg: '#F4EEE7', min: 4.5, note: 'secondary text' },
  { name: 'ink-500 on sand-bg', fg: '#8A7F78', bg: '#F4EEE7', min: 3.0, note: 'tertiary / inactive nav (UI component)' },
  { name: 'terracotta-600 NEW on sand-bg', fg: '#AD4B2A', bg: '#F4EEE7', min: 4.5, note: 'a11y-lead REWORK from C45F38→AD4B2A' },
  { name: 'terracotta-600 NEW on surface', fg: '#AD4B2A', bg: '#FBF8F4', min: 4.5, note: 'on surface block' },
  { name: 'surface on terracotta-600', fg: '#FBF8F4', bg: '#AD4B2A', min: 4.5, note: 'white-on-terracotta (CTA arrow bg)' },
  { name: 'status-cold NEW on sand-bg', fg: '#5A7E99', bg: '#F4EEE7', min: 3.0, note: 'a11y-lead REWORK from 6E92AD' },
  { name: 'status-warn on sand-bg', fg: '#C45F38', bg: '#F4EEE7', min: 3.0, note: 'unchanged' },
  { name: 'status-ok on sand-bg', fg: '#6E8B6A', bg: '#F4EEE7', min: 3.0, note: 'unchanged' },
];

const args = argv.slice(2);

if (args.includes('--pairs')) {
  let pass = 0, fail = 0;
  console.log('F27 contrast pairs — WCAG 2.2 verification\n');
  console.log('PAIR'.padEnd(46) + 'RATIO'.padEnd(10) + 'MIN'.padEnd(8) + 'STATUS');
  console.log('-'.repeat(80));
  for (const p of F27_PAIRS) {
    const r = contrast(p.fg, p.bg);
    const ok = r >= p.min;
    const status = ok ? '✓ PASS' : '✗ FAIL';
    console.log(p.name.padEnd(46) + r.toFixed(2).padEnd(10) + p.min.toFixed(1).padEnd(8) + status);
    if (!ok) console.log(`   note: ${p.note}`);
    ok ? pass++ : fail++;
  }
  console.log('-'.repeat(80));
  console.log(`Total: ${pass} pass, ${fail} fail`);
  exit(fail === 0 ? 0 : 1);
}

// single-pair mode
if (args.length < 2) {
  console.error('Usage: node verify-contrast.mjs <fg-hex> <bg-hex> [--min=4.5]');
  console.error('   or: node verify-contrast.mjs --pairs');
  exit(2);
}

const [fg, bg, ...rest] = args;
const minArg = rest.find(a => a.startsWith('--min='));
const min = minArg ? parseFloat(minArg.split('=')[1]) : 4.5;

const r = contrast(fg, bg);
const lc = apcaLc(fg, bg);
console.log(`fg=${fg} bg=${bg}`);
console.log(`WCAG ratio: ${r.toFixed(3)}  (min ${min})  ${r >= min ? '✓ PASS' : '✗ FAIL'}`);
console.log(`APCA Lc:    ${lc.toFixed(1)}`);
exit(r >= min ? 0 : 1);
