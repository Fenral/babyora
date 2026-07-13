#!/usr/bin/env node
/* F29 verify-fan-out — parallell exekvering av verify-scripts.
 *
 * Hvorfor: F28-loopen committer mange ganger per dag. Sekvensiell
 * `node verify-tokens.mjs && node verify-contrast.mjs && ...` tar
 * 12-30s per runde. Parallell fan-out komprimerer til wall-clock
 * = lengste-script. På 4-5 scripts er besparelsen 3-5x.
 *
 * Bruk:
 *   node scripts/verify-all.mjs                 # alt (12+ scripts)
 *   node scripts/verify-all.mjs --screen=paakledning
 *   node scripts/verify-all.mjs --screen=sone1  # forside+uke+paakledning
 *   node scripts/verify-all.mjs --screen=forside --base=http://127.0.0.1:4173
 *
 * Sivert valgte 2026-06-19: «Kun verify-fan-out per commit».
 * Adversarial review + parallell skjerm-arbeid SKIPP for nå.
 */
import { spawn } from 'node:child_process';
import { exit, argv } from 'node:process';

const args = new Map();
for (const a of argv.slice(2)) {
  if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=');
    args.set(k, v ?? true);
  }
}

const BASE = args.get('base') ?? 'http://127.0.0.1:4173';
const SCREEN = args.get('screen') ?? 'all';

// Always-on: rene logikk-scripts uten browser-dep
const ALWAYS = [
  { name: 'tokens', cmd: 'verify-tokens.mjs', args: [] },
  { name: 'contrast', cmd: 'verify-contrast.mjs', args: ['--pairs'] },
  { name: 'tile-bands', cmd: 'verify-tile-bands.mjs', args: [] },
];

// Per-skjerm: browser-baserte verify-scripts. Krever preview-server.
const SCREENS = {
  forside: [
    { name: 'browser:forside', cmd: 'verify-browser-forside.mjs', args: [BASE] },
    { name: 'forside-checklist', cmd: 'verify-forside-checklist.mjs', args: [BASE] },
  ],
  paakledning: [
    { name: 'browser:paakledning', cmd: 'verify-browser-paakledning.mjs', args: [BASE] },
  ],
  uke: [
    { name: 'browser:uke', cmd: 'verify-browser-uke.mjs', args: [BASE] },
    { name: 'uke-symbol', cmd: 'verify-uke-layer-symbol-consistency.mjs', args: [BASE] },
  ],
  guide: [{ name: 'browser:guide', cmd: 'verify-browser-guide.mjs', args: [BASE] }],
  settings: [{ name: 'browser:settings', cmd: 'verify-browser-settings.mjs', args: [BASE] }],
  plaggbib: [{ name: 'browser:plaggbib', cmd: 'verify-browser-plaggbib.mjs', args: [BASE] }],
  'plagg-detalj': [{ name: 'browser:plagg-detalj', cmd: 'verify-browser-plagg-detalj.mjs', args: [BASE] }],
  'finn-antrekk': [{ name: 'browser:finn-antrekk', cmd: 'verify-browser-finn-antrekk.mjs', args: [BASE] }],
  'varmkald-tog': [{ name: 'browser:varmkald-tog', cmd: 'verify-browser-varmkald-tog.mjs', args: [BASE] }],
  onboarding: [{ name: 'browser:onboarding', cmd: 'verify-browser-onboarding.mjs', args: [BASE] }],
};

// Aliaser for grupper
const GROUPS = {
  sone1: ['forside', 'uke', 'paakledning'],
  all: Object.keys(SCREENS),
};

function resolveScripts(screen) {
  const jobs = [...ALWAYS];
  if (screen === 'none') return jobs;
  const targets = GROUPS[screen] ?? (SCREENS[screen] ? [screen] : null);
  if (!targets) {
    console.error(`ukjent --screen=${screen}. Gyldige: ${[...Object.keys(SCREENS), ...Object.keys(GROUPS)].join(', ')}`);
    exit(2);
  }
  for (const s of targets) jobs.push(...SCREENS[s]);
  return jobs;
}

function runOne(job) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const child = spawn('node', [`scripts/${job.cmd}`, ...job.args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    const out = [];
    const err = [];
    child.stdout.on('data', (d) => out.push(d.toString()));
    child.stderr.on('data', (d) => err.push(d.toString()));
    child.on('close', (code) => {
      const ms = Math.round(performance.now() - t0);
      resolve({
        name: job.name,
        cmd: job.cmd,
        args: job.args,
        exitCode: code ?? 0,
        ms,
        stdoutTail: out.join('').trim().split('\n').slice(-3).join('\n'),
        stderrTail: err.join('').trim().split('\n').slice(-3).join('\n'),
      });
    });
    child.on('error', (e) => {
      const ms = Math.round(performance.now() - t0);
      resolve({
        name: job.name,
        cmd: job.cmd,
        args: job.args,
        exitCode: 127,
        ms,
        stdoutTail: '',
        stderrTail: `spawn-feil: ${e.message}`,
      });
    });
  });
}

const jobs = resolveScripts(SCREEN);
console.log(`verify-fan-out (${SCREEN}) — ${jobs.length} scripts parallelt mot ${BASE}\n`);

const t0 = performance.now();
const results = await Promise.all(jobs.map(runOne));
const totalMs = Math.round(performance.now() - t0);
const sequentialMs = results.reduce((s, r) => s + r.ms, 0);

let fails = 0;
for (const r of results) {
  const mark = r.exitCode === 0 ? '✓' : '✗';
  const pad = r.name.padEnd(26);
  const ms = `${r.ms}ms`.padStart(7);
  console.log(`  ${mark} ${pad} ${ms}`);
  if (r.exitCode !== 0) {
    fails++;
    if (r.stderrTail) console.log(`    stderr: ${r.stderrTail.replaceAll('\n', '\n            ')}`);
    if (r.stdoutTail) console.log(`    stdout: ${r.stdoutTail.replaceAll('\n', '\n            ')}`);
  }
}

const speedup = sequentialMs > 0 ? (sequentialMs / totalMs).toFixed(1) : '1.0';
console.log(`\n${fails === 0 ? '✓' : '✗'} ${results.length - fails}/${results.length} grønt — wall-clock ${totalMs}ms (sekvensielt ville vært ${sequentialMs}ms, ${speedup}x speedup)`);

exit(fails === 0 ? 0 : 1);
