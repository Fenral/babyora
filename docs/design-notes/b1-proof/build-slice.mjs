/* Bygger b1-slice.html fra b1-slice.template.html.
   Artifact-CSP tillater ingen eksterne verter, sa assetene ma inline-es.
   Naiv inlining duplikerer hver asset per forekomst (ullsett-tykt brukes
   3 steder) og blaser filen opp til det dobbelte — pa mobil betyr det
   dobbel nedlasting. Derfor: ETT data-URI per asset i et IMG-kart,
   markup far data-img="navn", JS-strenger far IMG['navn']. */
import { readFileSync, writeFileSync } from 'node:fs';

const ALIAS = { vaer: 'vaer-delvis-skyet' };
const tpl = readFileSync('b1-slice.template.html', 'utf8');

const names = [...new Set([...tpl.matchAll(/\{\{IMG_([a-z0-9-]+)\}\}/g)].map((m) => m[1]))];
const uri = Object.fromEntries(
  names.map((n) => [n, `data:image/png;base64,${readFileSync(`b1-assets/${ALIAS[n] || n}.png`).toString('base64')}`]),
);

let out = tpl
  .replace(/src="\{\{IMG_([a-z0-9-]+)\}\}"/g, 'data-img="$1"')
  .replace(/'\{\{IMG_([a-z0-9-]+)\}\}'/g, "IMG['$1']");

const leftover = out.match(/\{\{IMG_[a-z0-9-]+\}\}/g);
if (leftover) throw new Error(`Uhandtert bildeplassholder: ${[...new Set(leftover)].join(', ')}`);

const map =
  '\nconst IMG=' +
  JSON.stringify(uri) +
  ';\ndocument.querySelectorAll("[data-img]").forEach(el=>{el.src=IMG[el.dataset.img];});\n';
out = out.replace('<script>', '<script>' + map);

writeFileSync('b1-slice.html', out);
const raw = names.reduce((a, n) => a + uri[n].length, 0);
console.log(`b1-slice.html: ${(out.length / 1048576).toFixed(2)} MB`);
console.log(`  ${names.length} unike assets, ${(raw / 1048576).toFixed(2)} MB bildedata (ingen duplikater)`);
