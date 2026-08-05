/**
 * Måler --dw-ink-demoted mot alle papirflater, i begge temaer — med PORTENS
 * egen parser, ikke en linjenummer-heuristikk. (Første forsøk delte temaene
 * på «linje > 380» og leste lys som mørk. Filen hadde vokst.)
 */
import { readFileSync } from 'node:fs';

const RAA = readFileSync(
  'c:/Users/siver/Downloads/trainer-marketplace-master1/babyora/src/styles/design-tokens-v2.css',
  'utf8',
).replace(/\r\n/g, '\n');
const CSS = RAA.replace(/\/\*[\s\S]*?\*\//g, '');

function blokk(css, apner) {
  const start = css.indexOf(apner);
  if (start < 0) throw new Error(`fant ikke «${apner}»`);
  let dybde = 0;
  for (let i = start + apner.length - 1; i < css.length; i += 1) {
    if (css[i] === '{') dybde += 1;
    else if (css[i] === '}') {
      dybde -= 1;
      if (dybde === 0) return css.slice(start, i);
    }
  }
  throw new Error(`«${apner}» ble aldri lukket`);
}
function dekl(t) {
  const ut = new Map();
  for (const m of t.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) ut.set(m[1], m[2].trim());
  return ut;
}

const MORK = dekl(blokk(CSS, ':root {'));
const VALGT_LYS = dekl(blokk(CSS, ':root[data-theme="light"] {'));
const AUTO_LYS = dekl(
  blokk(blokk(CSS, '@media (prefers-color-scheme: light) {'), ':root:not([data-theme="dark"]) {'),
);

const tabell = (tema, lys) => {
  const t = new Map(MORK);
  if (tema === 'lys') for (const [k, v] of lys) t.set(k, v);
  return t;
};

function hex(navn, t) {
  const v = t.get(navn);
  if (v === undefined) throw new Error(`${navn} er ikke deklarert`);
  const m = /var\(\s*(--[\w-]+)/.exec(v);
  return m ? hex(m[1], t) : v;
}

const h2r = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lum = (r) => {
  const s = r.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
const kon = (a, b) => {
  const x = lum(h2r(a));
  const y = lum(h2r(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const FLATER = [
  '--dw-canvas',
  '--dw-canvas-glow',
  '--dw-raised',
  '--dw-plate',
  '--dw-interactive',
  '--dw-overlay',
];

const brudd = [];
for (const [tema, lys] of [
  ['mork', VALGT_LYS],
  ['lys', VALGT_LYS],
  ['lys-auto', AUTO_LYS],
]) {
  const t = tabell(tema.startsWith('lys') ? 'lys' : 'mork', lys);
  const d = hex('--dw-ink-demoted', t);
  console.log(`\n=== ${tema.toUpperCase()}  --dw-ink-demoted ${d} ===`);
  for (const flate of FLATER) {
    const bg = hex(flate, t);
    const k = kon(d, bg);
    const under = k < 4.5;
    if (under) brudd.push(`${tema} ${flate} ${k.toFixed(2)}`);
    console.log(`  ${flate.padEnd(20)}${bg}  ${k.toFixed(2)}:1${under ? '   ← UNDER 4,5' : ''}`);
  }
}
console.log(`\n${brudd.length === 0 ? 'HOLDER PÅ ALLE FLATER' : `${brudd.length} brudd: ${brudd.join(', ')}`}`);
