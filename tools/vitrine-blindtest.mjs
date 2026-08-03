/**
 * BLIND VITRINETEST — den avgjørende riggporten (portdom 28).
 *
 * Bakgrunn: premisset om at ~36 plagg måtte re-genereres for riggdrift var
 * ARVET, ikke målt. Da jeg målte fire like plagg i begge sett, spriket
 * differansene, og jeg konkluderte «ingen riggforskjell».
 *
 * Portdommen rettet resonnementet: «Målingen viser ikke *samme rigg*. Den
 * viser: ingen konsistent global forskyvning i disse fire parene med dette
 * målet.» To grunner:
 *   1. Fire par er for lite. 95 %-intervallene er svært brede (varme −0,13
 *      til +0,20) — det holder ikke til en ekvivalenskonklusjon.
 *   2. Helplaggssnitt SKJULER lysriggen. Key og fill endrer høylys og skygger
 *      ulikt, og materialinteraksjon kan gi motsatt retning mellom plagg. En
 *      riggforskjell behøver derfor ikke peke likt på alle akser.
 *
 * Nok til å felle premisset om en KOLLEKTIV feil — ikke nok til å friskmelde.
 *
 * Den avgjørende porten er derfor den komponerte vitrinen, ikke kolorimetri
 * per asset: «Hvis dommere ikke stabilt kan identifisere hvilken batch et
 * plagg kommer fra, er riggkoherensen praktisk bestått.»
 *
 * Dette verktøyet lager blindarket og måler det portdommen ba om i tillegg
 * til snittet: P10/P50/P90-luminans, venstre–høyre key/fill, og høylysenes
 * fargetemperatur.
 *
 *   node tools/vitrine-blindtest.mjs
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const RUTE = 72;   // faktisk visningsstørrelse i vitrinen (portdom 28)
const UT = 'tools/garment-audit';

/** Blandet sett: begge batcher, seks samtidig, inkludert krem og marine. */
const SETT = [
  { fil: 'docs/design-notes/b1-proof/ullsett-tykt.png', batch: 'proof' },
  { fil: 'public/monter/klippet/plagg-ullsokker.png', batch: 'app' },
  { fil: 'docs/design-notes/b1-proof/ull-mellomlag-tykt.png', batch: 'proof' },
  { fil: 'public/monter/klippet/plagg-vinterdress.png', batch: 'app' },
  { fil: 'docs/design-notes/b1-proof/lue-m-ull.png', batch: 'proof' },
  { fil: 'public/monter/klippet/plagg-balaklava.png', batch: 'app' },
  { fil: 'public/monter/klippet/plagg-tykt-ullsett.png', batch: 'app' },
  { fil: 'docs/design-notes/b1-proof/votter-tykke.png', batch: 'proof' },
  { fil: 'public/monter/klippet/plagg-ull-mellomlag.png', batch: 'app' },
  { fil: 'docs/design-notes/b1-proof/vinterdress.png', batch: 'proof' },
  { fil: 'public/monter/klippet/plagg-langermet-ullbody.png', batch: 'app' },
  { fil: 'docs/design-notes/b1-proof/ullsokker.png', batch: 'proof' },
];

/** Metrikkene portdommen ba om UTOVER snittet. */
async function metrikk(sti) {
  const { data, info } = await sharp(sti).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const L = [], venstre = [], hoyre = [], hoylys = [];
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const i = (y * W + x) * ch;
    if (data[i + 3] < 200) continue;
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    L.push(l);
    (x < W / 2 ? venstre : hoyre).push(l);
    hoylys.push({ l, r: data[i], b: data[i + 2] });
  }
  if (!L.length) return null;
  L.sort((a, b) => a - b);
  const p = (q) => L[Math.min(L.length - 1, Math.floor(q * L.length))];
  const snitt = (xs) => xs.reduce((a, c) => a + c, 0) / xs.length;
  // Fargetemperatur i HOYLYSENE: der lysets egen farge dominerer over
  // materialets. Topp 10 % luminans.
  hoylys.sort((a, b) => b.l - a.l);
  const topp = hoylys.slice(0, Math.max(1, Math.floor(hoylys.length * 0.1)));
  return {
    p10: p(0.10), p50: p(0.50), p90: p(0.90),
    keyFill: snitt(venstre) / (snitt(hoyre) || 1),
    hoylysVarme: snitt(topp.map((h) => h.r - h.b)),
  };
}

mkdirSync(UT, { recursive: true });

const rader = [];
for (const s of SETT) {
  const m = await metrikk(s.fil);
  rader.push({ ...s, ...m });
}

console.log('\n── blind vitrinetest: metrikkene portdom 28 ba om ──');
console.log('  (batch skjult i selve arket — den står her BARE for analysen)\n');
console.log('  batch  P10    P50    P90    key/fill  høylys-varme  fil');
for (const r of rader) {
  console.log(`  ${r.batch.padEnd(6)} ${r.p10.toFixed(0).padStart(4)}  ${r.p50.toFixed(0).padStart(4)}  ` +
    `${r.p90.toFixed(0).padStart(4)}   ${r.keyFill.toFixed(3)}     ${r.hoylysVarme.toFixed(1).padStart(5)}      ` +
    r.fil.split('/').pop());
}
const per = (b, k) => { const xs = rader.filter((r) => r.batch === b).map((r) => r[k]); return xs.reduce((a, c) => a + c, 0) / xs.length; };
console.log('\n  akse            proof     app      differanse');
for (const k of ['p10', 'p50', 'p90', 'keyFill', 'hoylysVarme']) {
  const a = per('proof', k), b = per('app', k);
  console.log(`  ${k.padEnd(14)} ${a.toFixed(3).padStart(7)}  ${b.toFixed(3).padStart(7)}   ${(a - b >= 0 ? '+' : '')}${(a - b).toFixed(3)}`);
}
console.log('\n  key/fill er venstre/høyre-luminans. Er lysriggen lik, skal forholdet');
console.log('  ligge på samme side av 1,0 i begge batcher — det er den aksen som');
console.log('  faktisk avslører lysretning, og som helplaggssnittet skjuler.');

// ── blindarket ─────────────────────────────────────────────────────────────
for (const [navn, bg, plate] of [
  ['espresso', { r: 30, g: 20, b: 12 }, { r: 58, g: 43, b: 27 }],
  ['krem', { r: 241, g: 233, b: 218 }, { r: 253, g: 249, b: 242 }],
]) {
  const kol = 6, rader2 = Math.ceil(SETT.length / kol), pad = 18;
  const lag = await Promise.all(SETT.map(async (s, i) => ({
    input: await sharp({ create: { width: RUTE, height: RUTE, channels: 4, background: { ...plate, alpha: 1 } } })
      .composite([{ input: await sharp(s.fil).resize(RUTE - 12, RUTE - 12,
        { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), left: 6, top: 6 }])
      .png().toBuffer(),
    left: pad + (i % kol) * (RUTE + pad), top: pad + ((i / kol) | 0) * (RUTE + pad),
  })));
  await sharp({ create: { width: pad + kol * (RUTE + pad), height: pad + rader2 * (RUTE + pad),
    channels: 4, background: { ...bg, alpha: 1 } } })
    .composite(lag).png().toFile(`${UT}/blindtest-${navn}.png`);
}
writeFileSync(`${UT}/blindtest-fasit.json`, JSON.stringify(
  SETT.map((s, i) => ({ posisjon: i + 1, batch: s.batch, fil: s.fil })), null, 2));
console.log(`\n  ark: ${UT}/blindtest-espresso.png og -krem.png (72 px, umerket)`);
console.log(`  fasit: ${UT}/blindtest-fasit.json — åpnes FØRST etter at dommen er avgitt.`);
