/* Eierfunn: «Mener det gikk fra lyst til mørkt på listen.»
   Finner vitrinens kanter ved KANTDETEKSJON (ikke faste andeler — de traff
   radnumrene), og sampler deretter en stripe rett innenfor venstre kant.
   Der er det bare bakgrunn: ingen tall, ingen plate, ingen tekst. */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const sharp = require('sharp');

for (const fil of process.argv.slice(2)) {
  const { data, info } = await sharp(fil).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const L = (x, y) => {
    const i = (y * info.width + x) * ch;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };

  // 1. Finn vitrinens venstre kant: skann vannrett pa midten etter randlinja.
  const yMid = Math.round(info.height * 0.5);
  let venstre = -1;
  for (let x = Math.round(info.width * 0.02); x < info.width * 0.2; x += 1) {
    if (L(x, yMid) - L(x - 3, yMid) > 4) { venstre = x; break; }
  }
  if (venstre < 0) { console.log(`\n── ${fil}: fant ikke vitrinekanten`); continue; }

  // 2. Stripe rett innenfor kanten (ren bakgrunn i vitrinens venstre padding).
  const x0 = venstre + Math.round(info.width * 0.012);
  const x1 = venstre + Math.round(info.width * 0.024);
  const strip = (y) => { let s = 0; for (let x = x0; x <= x1; x += 1) s += L(x, y); return s / (x1 - x0 + 1); };

  // 3. Finn vitrinens topp og bunn langs den stripa.
  const bg = strip(Math.round(info.height * 0.14)); // over vitrinen
  let topp = -1, bunn = -1;
  for (let y = Math.round(info.height * 0.16); y < info.height * 0.9; y += 1) {
    if (topp < 0 && strip(y) > bg + 2.5) topp = y;
    if (topp > 0 && y > topp + 40 && strip(y) < bg + 1) { bunn = y; break; }
  }
  if (bunn < 0) bunn = Math.round(info.height * 0.78);

  console.log(`\n── ${fil} (${info.width}x${info.height}) ──`);
  console.log(`  vitrinen: x fra ${venstre}, y ${topp}–${bunn} (hoyde ${bunn - topp})`);
  const pkt = [0.06, 0.25, 0.5, 0.75, 0.94];
  const verdier = pkt.map((p) => {
    const y = Math.round(topp + (bunn - topp) * p);
    return { p, y, l: strip(y) };
  });
  for (const v of verdier) console.log(`  ${(v.p * 100).toFixed(0).padStart(3)} % ned i vitrinen (y=${v.y})  luminans ${v.l.toFixed(1)}`);
  const fall = verdier[0].l - verdier[verdier.length - 1].l;
  console.log(`  fall topp→bunn: ${fall.toFixed(1)} luminanstrinn  → ` +
    (fall > 3 ? 'LYST OVERST, MORKT NEDERST' : fall < -3 ? 'MORKT OVERST — feil retning' : 'FLAT'));
}
