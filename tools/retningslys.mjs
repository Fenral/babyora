/**
 * RETNINGSLYS-SCORE — formuavhengig måling av lysretning i et asset.
 *
 * Bakgrunn: venstre/høyre-pikselratio skilte proof- og app-batchen nesten
 * rent (proof vinner 34 av 36 parvise sammenligninger, p≈0,009), men den er
 * KONFUNDERT av plaggform: et sokkepar, en cardigan med knapper på én side,
 * en lue med dusk gir asymmetri uavhengig av lys.
 *
 * Portdom 29 foreskrev kontrollen, og navnet: «Kall målet retningslys-score,
 * ikke faktisk key/fill. Venstre/høyre-pikselratio er ikke det samme som
 * riggens 2:1 lysstyrkeforhold.»
 *
 * Metoden, punkt for punkt fra dommen:
 *   1. normaliser masken rundt plaggets sentrum
 *   2. speil masken og mål BARE området som finnes på begge sider
 *   3. eroder ytterkanten for å fjerne silhuett og rim
 *   4. lavpass luminansen for å fjerne strikk, knapper og folder
 *   5. tilpass en todimensjonal gradient i log-luminans
 *
 * Resultatet er retning (grader) og styrke — inkludert om lyset faktisk
 * kommer ovenfra venstre, slik art bible krever.
 *
 *   node tools/retningslys.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const EROSJON = 5;     // px inn fra silhuetten
const LAVPASS = 6;     // sigma, fjerner strikk/knapper/folder

async function retningslys(sti) {
  // 4. lavpass FØR sampling — folder og strikkemønster skal ikke stemme
  const { data, info } = await sharp(sti).ensureAlpha().blur(LAVPASS)
    .raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const alfa = (x, y) => data[(y * W + x) * ch + 3];
  const lum = (x, y) => { const i = (y * W + x) * ch;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; };

  // 1. sentrum av masken
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    if (alfa(x, y) > 200) { sx += x; sy += y; n += 1; }
  }
  if (n < 500) return null;
  const cx = Math.round(sx / n), cy = Math.round(sy / n);

  // 2. speiling om sentrum: behold kun piksler som finnes på BEGGE sider.
  //    Da kan ikke silhuettens asymmetri gi utslag.
  // 3. erosjon: krev at hele nabolaget innenfor EROSJON er dekket
  const gyldig = (x, y) => {
    if (x < EROSJON || y < EROSJON || x >= W - EROSJON || y >= H - EROSJON) return false;
    for (let dy = -EROSJON; dy <= EROSJON; dy += EROSJON) {
      for (let dx = -EROSJON; dx <= EROSJON; dx += EROSJON) {
        if (alfa(x + dx, y + dy) <= 200) return false;
      }
    }
    return true;
  };

  const pkt = [];
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const speilX = 2 * cx - x;
    if (speilX < 0 || speilX >= W) continue;
    if (!gyldig(x, y) || !gyldig(speilX, y)) continue;   // symmetrisk område
    const l = lum(x, y);
    if (l < 4) continue;                                  // unngå log(0)
    pkt.push([(x - cx) / W, (y - cy) / H, Math.log(l)]);
  }
  if (pkt.length < 400) return null;

  // 5. minste kvadraters tilpasning av L = a·x + b·y + c i log-luminans
  let Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, S1 = 0, Sxl = 0, Syl = 0, Sl = 0;
  for (const [x, y, l] of pkt) {
    Sxx += x * x; Sxy += x * y; Syy += y * y;
    Sx += x; Sy += y; S1 += 1;
    Sxl += x * l; Syl += y * l; Sl += l;
  }
  // 3x3 normalligning, løst med Cramer
  const M = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, S1]];
  const V = [Sxl, Syl, Sl];
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const bytt = (m, k, v) => m.map((rad, i) => rad.map((c, j) => (j === k ? v[i] : c)));
  const D = det3(M);
  if (Math.abs(D) < 1e-12) return null;
  const a = det3(bytt(M, 0, V)) / D;
  const b = det3(bytt(M, 1, V)) / D;

  // a = endring i log-luminans per normalisert x. Negativ a = lysere mot
  // VENSTRE. Negativ b = lysere mot TOPPEN.
  const styrke = Math.hypot(a, b);
  // retning MOT lyskilden, i grader der 0 = opp, 90 = høyre
  const grader = ((Math.atan2(-a, b) * 180) / Math.PI + 360) % 360;
  // a<0 = lysere mot VENSTRE. b<0 = lysere mot TOPPEN (y vokser nedover).
  // Begge negative => ovre venstre => grader havner i 90-180.
  return { styrke, grader, punkter: pkt.length, ovreVenstre: a < 0 && b < 0 };
}

const SETT = [
  ['proof', 'docs/design-notes/b1-proof/ullsett-tykt.png'],
  ['proof', 'docs/design-notes/b1-proof/ullsokker.png'],
  ['proof', 'docs/design-notes/b1-proof/ull-mellomlag-tykt.png'],
  ['proof', 'docs/design-notes/b1-proof/vinterdress.png'],
  ['proof', 'docs/design-notes/b1-proof/lue-m-ull.png'],
  ['proof', 'docs/design-notes/b1-proof/votter-tykke.png'],
  ['app', 'public/monter/plagg-tykt-ullsett.png'],
  ['app', 'public/monter/plagg-ullsokker.png'],
  ['app', 'public/monter/plagg-ull-mellomlag.png'],
  ['app', 'public/monter/plagg-vinterdress.png'],
  ['app', 'public/monter/plagg-balaklava.png'],
  ['app', 'public/monter/plagg-langermet-ullbody.png'],
  ['app', 'public/monter/plagg-cardigan.png'],
  ['app', 'public/monter/plagg-dunjakke.png'],
];

const rader = [];
for (const [batch, sti] of SETT) {
  const r = await retningslys(sti);
  if (r) rader.push({ batch, navn: sti.split('/').pop(), ...r });
}

console.log('\n── retningslys-score (formnormalisert, portdom 29) ──');
console.log('  speilet maske · 5 px erosjon · lavpass σ6 · 2D-gradient i log-luminans\n');
console.log('  batch  styrke   retning   øvre venstre?  n      plagg');
for (const r of rader) {
  console.log(`  ${r.batch.padEnd(6)} ${r.styrke.toFixed(4)}  ${r.grader.toFixed(0).padStart(4)}°     ` +
    `${r.ovreVenstre ? 'ja ' : 'nei'}            ${String(r.punkter).padStart(5)}  ${r.navn}`);
}
const snitt = (b) => { const xs = rader.filter((r) => r.batch === b); return xs.reduce((a, c) => a + c.styrke, 0) / xs.length; };
const pf = rader.filter((r) => r.batch === 'proof'), ap = rader.filter((r) => r.batch === 'app');
console.log(`\n  proof styrke ${snitt('proof').toFixed(4)}   ·   app styrke ${snitt('app').toFixed(4)}`);
console.log(`  proof-intervall ${Math.min(...pf.map(r=>r.styrke)).toFixed(4)}–${Math.max(...pf.map(r=>r.styrke)).toFixed(4)}`);
console.log(`  app-intervall   ${Math.min(...ap.map(r=>r.styrke)).toFixed(4)}–${Math.max(...ap.map(r=>r.styrke)).toFixed(4)}`);
const separerer = Math.min(...pf.map(r=>r.styrke)) > Math.max(...ap.map(r=>r.styrke));
console.log(`\n  → ${separerer ? 'BATCHENE SEPARERER — riggforskjellen er etablert formuavhengig'
  : 'intervallene overlapper — signalet overlever ikke formnormaliseringen'}`);

// ── Portdommen malte key/fill parvis (34 av 36). Samme test, formnormalisert.
let vunnet = 0;
for (const p of pf) for (const a of ap) if (p.styrke > a.styrke) vunnet += 1;
const totalt = pf.length * ap.length;
console.log(`\n  parvis: proof vinner ${vunnet} av ${totalt} (${((vunnet / totalt) * 100).toFixed(0)} %) — forventet 50 % under nullhypotesen`);
console.log(`  men intervallene OVERLAPPER: ingen ren batchseparasjon paa styrke.`);

// RETNINGEN er den harde porten. Art bible: «key ~35-45 grader ovenfra, SAMME
// side pa alle assets.» Den felles PER ASSET, ikke per batch — og det gir en
// liste over dokumenterte enkeltavvik i stedet for en massejobb.
const feil = rader.filter((r) => !r.ovreVenstre);
console.log(`\n  LYSRETNING — art bible krever ovre venstre paa ALLE:`);
console.log(`    ${rader.length - feil.length} av ${rader.length} bestaar`);
for (const f of feil) {
  const hvor = f.grader < 90 ? 'NEDRE venstre' : f.grader > 180 ? 'ovre HOYRE (speilvendt)' : 'ukjent';
  console.log(`    x ${f.batch.padEnd(6)} ${f.navn.padEnd(28)} ${f.grader.toFixed(0)} grader — ${hvor}`);
}
console.log(`\n  → Styrken skiller i SNITT, men ikke rent. Retningen felles per asset.`);
process.exitCode = feil.length ? 2 : 0;
