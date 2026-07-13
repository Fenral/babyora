#!/usr/bin/env node
/* F27.0 token-checker.
 *
 * Greps src/styles/instrument-tokens.css for ALL required v2-tokens
 * + a11y-lead-mandated value updates. Reports presence + correctness.
 * Exit 0 if all pass, 1 otherwise.
 */
import { readFileSync, existsSync } from 'node:fs';
import { exit } from 'node:process';

const TOKEN_FILE = 'src/styles/instrument-tokens.css';

if (!existsSync(TOKEN_FILE)) {
  console.error(`MISSING: ${TOKEN_FILE}`);
  exit(1);
}

const css = readFileSync(TOKEN_FILE, 'utf8');

const REQUIRED = [
  // 0.1 core ink palette
  { id: '0.1', token: '--ink-300:', value: '#C9C0B9' },
  { id: '0.1', token: '--ink-500:', value: '#8A7F78' },
  { id: '0.1', token: '--ink-700:', value: '#5A514C' },
  { id: '0.1', token: '--ink-900:', value: '#2B2522' },

  // 0.2 terracotta — a11y-lead REWORK: bump 600 to #AD4B2A
  { id: '0.2', token: '--terracotta-100:', value: '#F6E3D9' },
  { id: '0.2', token: '--terracotta-400:', value: '#D98A6A' },
  { id: '0.2', token: '--terracotta-500:', value: '#C45F38' },
  { id: '0.2', token: '--terracotta-600:', value: '#AD4B2A' },

  // 0.3 + 0.4 status (a11y-lead REWORK: cold to #5A7E99)
  { id: '0.3', token: '--status-cold:', value: '#5A7E99' },
  { id: '0.4', token: '--status-warn:', value: '#C45F38' },
  { id: '0.4', token: '--status-ok:', value: '#6E8B6A' },

  // 0.5 shadows
  { id: '0.5', token: '--shadow-surface:', value: null },
  { id: '0.5', token: '--shadow-interactive:', value: null },
  { id: '0.5', token: '--shadow-ground:', value: null },

  // 0.7 focus-ring per atmosphere
  { id: '0.7', token: '[data-atmosphere="cold"]', value: null },
  { id: '0.7', token: '[data-atmosphere="mild"]', value: null },
  { id: '0.7', token: '[data-atmosphere="warm"]', value: null },
  { id: '0.7', token: '--focus-ring:', value: null },
  { id: '0.7', token: '--focus-ring-halo:', value: null },

  // 0.8 easing
  { id: '0.8', token: '--ease-standard:', value: 'cubic-bezier(0.32, 0.72, 0, 1)' },

  // 0.9 durations
  { id: '0.9', token: '--dur-fast:', value: '180ms' },
  { id: '0.9', token: '--dur-base:', value: '240ms' },
  { id: '0.9', token: '--dur-slow:', value: '320ms' },

  // 0.10 typography scale
  { id: '0.10', token: '--font-display-xl:', value: '72px' },
  { id: '0.10', token: '--font-display-m:', value: '56px' },
  { id: '0.10', token: '--font-h1:', value: '28px' },
  { id: '0.10', token: '--font-h2:', value: '20px' },
  { id: '0.10', token: '--font-body-strong:', value: '16px' },
  { id: '0.10', token: '--font-body:', value: '16px' },
  { id: '0.10', token: '--font-caption:', value: '13px' },
  { id: '0.10', token: '--font-micro:', value: '12px' },

  // 0.11 atmosphere tokens (9)
  { id: '0.11', token: '--bg-cold-top:', value: null },
  { id: '0.11', token: '--bg-cold-mid:', value: null },
  { id: '0.11', token: '--bg-cold-bottom:', value: null },
  { id: '0.11', token: '--bg-mild-top:', value: null },
  { id: '0.11', token: '--bg-mild-mid:', value: null },
  { id: '0.11', token: '--bg-mild-bottom:', value: null },
  { id: '0.11', token: '--bg-warm-top:', value: null },
  { id: '0.11', token: '--bg-warm-mid:', value: null },
  { id: '0.11', token: '--bg-warm-bottom:', value: null },

  // 0.12 spacing 8px-grid
  { id: '0.12', token: '--space-1:', value: '4px' },
  { id: '0.12', token: '--space-2:', value: '8px' },
  { id: '0.12', token: '--space-3:', value: '12px' },
  { id: '0.12', token: '--space-4:', value: '16px' },
  { id: '0.12', token: '--space-5:', value: '24px' },
  { id: '0.12', token: '--space-6:', value: '32px' },
  { id: '0.12', token: '--space-7:', value: '48px' },
  { id: '0.12', token: '--space-8:', value: '64px' },

  // 0.13 tnum utility
  { id: '0.13', token: '.tnum', value: null },

  // 0.5 surface
  { id: 'A0', token: '--surface:', value: '#FBF8F4' },
  { id: 'A0', token: '--surface-border:', value: null },
];

const FORBIDDEN = [
  // 0.14 no SERIF FONT FAMILIES — sans-serif fallback is OK
  // Block specific serif families that v2-spec forbids
  { id: '0.14', pattern: /(Iowan|Charter|Georgia|DM Serif|Playfair|Lora|Merriweather|Tinos|Cormorant)/i, name: 'serif font family (drop all serif per v2-spec)' },
];

let pass = 0, fail = 0;
const failures = [];

console.log('F27.0 instrument-tokens.css verification\n');
console.log('TASK'.padEnd(8) + 'TOKEN'.padEnd(38) + 'EXPECT'.padEnd(28) + 'STATUS');
console.log('-'.repeat(95));

for (const r of REQUIRED) {
  const hasToken = css.includes(r.token);
  let ok = hasToken;
  let detail = hasToken ? 'present' : 'MISSING';

  if (hasToken && r.value) {
    // Look for the value on the same line as the token
    const lineRe = new RegExp(r.token.replace(/[\[\]"\.]/g, '\\$&') + '[^;\\n]*?' + r.value.replace(/[()]/g, '\\$&'));
    if (lineRe.test(css)) {
      detail = `present + value ${r.value}`;
    } else {
      ok = false;
      detail = `present but value ≠ ${r.value}`;
    }
  }

  const status = ok ? '✓' : '✗';
  console.log(r.id.padEnd(8) + r.token.padEnd(38) + (r.value ?? '(present)').toString().padEnd(28) + status);
  if (ok) pass++;
  else { fail++; failures.push(`${r.id}: ${r.token} — ${detail}`); }
}

for (const f of FORBIDDEN) {
  const hit = f.pattern.test(css);
  const status = hit ? '✗' : '✓';
  console.log(f.id.padEnd(8) + `FORBIDDEN: ${f.name}`.padEnd(66) + status);
  if (hit) { fail++; failures.push(`${f.id}: forbidden pattern found — ${f.name}`); }
  else pass++;
}

console.log('-'.repeat(95));
console.log(`Total: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  - ' + f);
}
exit(fail === 0 ? 0 : 1);
