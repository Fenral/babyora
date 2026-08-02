/* Sols portkrav (runde 21a): «En CSS transform-origin er ETT punkt, ikke en
   hel gripelinje. Bare pivotpunktet star automatisk stille; to hender pa hver
   side vil bevege seg i sma buer. Mal begge kontaktpunktene separat.
   Maks 1 px vertikal gli per hand.»

   Malingen er geometrisk og eksakt: rotasjon θ om pivot flytter et punkt i
   horisontal avstand d vertikalt med d*sin(θ). Handenes faktiske x hentes
   fra ALFAKANALEN i kontaktsonen, ikke fra oyemal. */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const sharp = require('sharp');

const EL = 205;        // px maskoten rendres i
const PIVOT_X = 0.52;  // transform-origin x
const CONTACT_ROWS = [388, 392, 396, 400]; // fingersonen (nederste solide rad = 402)
const ANGLES = [3.2, 2.5, 2.0, 1.5, 1.0];

const { data, info } = await sharp('b1-assets/maskot.png').raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;
const A = (x, y) => data[(y * info.width + x) * ch + (ch - 1)];

const pivotPx = PIVOT_X * info.width;
const groups = { venstre: [], hoyre: [] };
for (const y of CONTACT_ROWS) {
  for (let x = 0; x < info.width; x += 1) {
    if (A(x, y) > 128) groups[x < pivotPx ? 'venstre' : 'hoyre'].push(x);
  }
}

console.log(`bilde ${info.width}x${info.height}, pivot x = ${Math.round(pivotPx)} px (${PIVOT_X * 100} %)`);
const hands = Object.entries(groups).map(([navn, xs]) => {
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const far = navn === 'venstre' ? Math.min(...xs) : Math.max(...xs); // ytterste kontaktpunkt
  const dEl = (Math.abs(cx - pivotPx) / info.width) * EL;
  const dFar = (Math.abs(far - pivotPx) / info.width) * EL;
  console.log(`  ${navn} hand: ${xs.length} px i kontaktsonen, tyngdepunkt x=${cx.toFixed(0)}, ` +
              `ytterkant x=${far} → d=${dEl.toFixed(1)} / ytterst ${dFar.toFixed(1)} CSS-px`);
  return { navn, dEl, dFar };
});

console.log('\nvertikal gli (d*sin θ) — tyngdepunkt / ytterste kontaktpunkt:');
for (const a of ANGLES) {
  const s = Math.sin((a * Math.PI) / 180);
  const rows = hands.map((h) => `${h.navn} ${(h.dEl * s).toFixed(2)}/${(h.dFar * s).toFixed(2)}`);
  const worst = Math.max(...hands.map((h) => h.dFar * s));
  console.log(`  ${a.toString().padStart(3)}°  ${rows.join('   ')}   ${worst <= 1 ? '✓ BESTATT' : '✗ STRYKER'}`);
}
const dMax = Math.max(...hands.map((h) => h.dFar));
console.log(`\nstorste vinkel som holder 1px-kravet ogsa ytterst: ${((Math.asin(Math.min(1, 1 / dMax)) * 180) / Math.PI).toFixed(2)}°`);
