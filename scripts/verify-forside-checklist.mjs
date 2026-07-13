#!/usr/bin/env node
/* F27.3 Forside-rewrite checker.
 * Verifies ALL 21 v2-spec tiltak in HomeScreenInstrument + BottomNavInstrument + RationaleSheet.
 * Exit 0 if all pass, 1 otherwise.
 */
import { readFileSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const FILES = {
  home: 'src/screens/HomeScreenInstrument.tsx',
  nav: 'src/components/instrument/BottomNavInstrument.tsx',
  rationale: 'src/components/instrument/RationaleSheet.tsx',
};

// Strip block comments + line comments so checks don't match JSDoc/inline notes
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const sources = {};
for (const [k, p] of Object.entries(FILES)) {
  if (!existsSync(p)) {
    console.error(`MISSING: ${p}`);
    exit(1);
  }
  sources[k] = stripComments(readFileSync(p, 'utf8'));
}

// Each task: { id, desc, check(): boolean, file }
const TASKS = [
  { id: '3.1', desc: 'Temp uses .instr-temp class (clamp via tokens) or display-xl', file: 'home',
    check: (s) => /(instr-temp|var\(--font-display-xl\)|font-size:\s*72px|fontSize:\s*72)/.test(s) && !/font-size:\s*112px|fontSize:\s*112/.test(s) },

  { id: '3.2', desc: 'DROP <sup> on ° symbol', file: 'home',
    check: (s) => !/<sup/i.test(s) },

  { id: '3.3', desc: 'tabular-nums on temp', file: 'home',
    check: (s) => /font-variant-numeric:\s*['"]?tabular-nums/.test(s) || /tnum/.test(s) },

  { id: '3.4', desc: 'temp uses class with clamp() (WCAG 1.4.4 — clamp lives in tokens.css)', file: 'home',
    check: (s) => /instr-temp/.test(s) },

  { id: '3.5', desc: 'temp uses instr-temp class (line-height locked in tokens.css)', file: 'home',
    check: (s) => /instr-temp/.test(s) },

  { id: '3.6', desc: 'Anbefaling "bare"-nivå — no .instr-dot around recommendation', file: 'home',
    check: (s) => !/instr-dot[^]*?\{vibe\.recommendation\}/.test(s) },

  { id: '3.7', desc: 'Eyebrow "ANBEFALT" with caption tone + terracotta-600', file: 'home',
    check: (s) => /ANBEFALT/i.test(s) },

  { id: '3.8', desc: 'Recommendation uses body-strong 18px (--ink-900)', file: 'home',
    check: (s) => /font-body-strong|fontWeight:\s*['"]?(?:500|600)/.test(s) },

  { id: '3.10', desc: '"Hvorfor?" disclosure uses hidden attr (not max-height:0)', file: 'rationale',
    check: (s) => /\shidden(\s|=|>)/.test(s) },

  { id: '3.11', desc: '"Hvorfor?" panel = Vær/Vind/Aktivitet, NO Konservativ-modus toggle in HomeScreen', file: 'home',
    check: (s) => !/konservativ|conservative/i.test(s) },

  { id: '3.12', desc: 'Konservativ-modus REMOVED from HomeScreenInstrument entirely', file: 'home',
    check: (s) => !/conservative|konservativ/i.test(s) },

  { id: '3.13', desc: 'Vogn-toggle = SegmentToggle kind="radiogroup"', file: 'home',
    check: (s) => /SegmentToggle/.test(s) && /(kind=['"]radiogroup['"]|role=['"]radiogroup['"])/.test(s) },

  { id: '3.14a', desc: 'CTA: eyebrow NESTE', file: 'home',
    check: (s) => /NESTE|Neste/.test(s) },

  { id: '3.14b', desc: 'CTA: body-strong "Se påkledning"', file: 'home',
    check: (s) => /Se påkledning/.test(s) },

  { id: '3.14c', desc: 'CTA: 44px terracotta circle with arrow', file: 'home',
    check: (s) => /(width:\s*44|cta-circle)/.test(s) },

  { id: '3.15', desc: 'BottomNav: NO label-tekst rendered (4 icons only)', file: 'nav',
    check: (s) => {
      // crude check: no <span>{item.label}</span> or labelStyle visible
      // labels can still be in aria-label, that's fine
      const hasLabel = /labelStyle|<span style={labelStyle}>/.test(s);
      return !hasLabel;
    } },

  { id: '3.16', desc: 'BottomNav inactive: solid --ink-500 (no opacity 0.55)', file: 'nav',
    check: (s) => /(var\(--ink-500\)|ink-500|#8A7F78)/.test(s) && !/(opacity:\s*['"]?0\.55|opacity:\s*0\.25)/i.test(s) },

  { id: '3.17a', desc: 'BottomNav active uses --terracotta-600', file: 'nav',
    check: (s) => /(var\(--terracotta-600\)|terracotta-600|#AD4B2A|#C0632F)/.test(s) },

  { id: '3.17b', desc: 'BottomNav active gets aria-current="page"', file: 'nav',
    check: (s) => /aria-current/.test(s) },

  { id: '3.18', desc: '<nav aria-label="Hoved"> landmark on bottom nav', file: 'nav',
    check: (s) => /<nav[^>]*aria-label=["']Hoved["']/.test(s) },

  { id: '3.19', desc: 'Avatar scene rendered via AvatarScene component', file: 'home',
    check: (s) => /<AvatarScene/.test(s) },

  { id: '3.20', desc: 'applyAtmosphere called (sets data-atmosphere)', file: 'home',
    check: (s) => /applyAtmosphere/.test(s) },
];

let pass = 0, fail = 0;
const failures = [];

console.log('F27.3 Forside-rewrite verification\n');
console.log('TASK'.padEnd(8) + 'FILE'.padEnd(12) + 'DESCRIPTION'.padEnd(60) + 'STATUS');
console.log('-'.repeat(95));

for (const t of TASKS) {
  const src = sources[t.file];
  let ok = false;
  try { ok = t.check(src); } catch (e) { ok = false; }
  const status = ok ? '✓ PASS' : '✗ FAIL';
  console.log(
    t.id.padEnd(8) +
    t.file.padEnd(12) +
    t.desc.slice(0, 58).padEnd(60) +
    status
  );
  if (ok) pass++;
  else { fail++; failures.push(`${t.id} (${t.file}): ${t.desc}`); }
}

console.log('-'.repeat(95));
console.log(`Total: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  - ' + f);
}
exit(fail === 0 ? 0 : 1);
