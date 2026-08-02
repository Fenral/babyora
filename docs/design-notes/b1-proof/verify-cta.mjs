/* Maskinell verifikasjon av CTA-momentet og alternativ-regelen.
   Maler istedenfor a vurdere med oyet — det var oyet som lot lys modus
   falle ut av dybdekontrakten. */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const url = pathToFileURL(process.cwd() + '/b1-slice.html').href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);
await page.waitForTimeout(500);

// Ingenting skal bevege seg i det HVILENDE panelet. Analysestreken animerte
// ved sidelast og sveipet over vaeret for den forsvant (eierfunn i mock).
const hvile = await page.evaluate(async () => {
  const line = document.querySelector('.scanline');
  const les = () => getComputedStyle(line).transform + '|' + getComputedStyle(line).opacity;
  const a = les();
  await new Promise((r) => setTimeout(r, 700));
  return { for: a, etter: les() };
});
console.log('── Hvile for CTA ──');
console.log(`  analysestreken i ro: ${hvile.for === hvile.etter ? '✓ JA' : '✗ NEI — den beveger seg'} (${hvile.etter})`);

const angleOf = (t) => {
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const [a, b] = m[1].split(',').map(Number);
  return (Math.atan2(b, a) * 180) / Math.PI;
};

// ── 1. Sampler hver frame gjennom CTA-momentet ────────────────────────────
const samples = await page.evaluate(async () => {
  const out = [];
  const norm = document.querySelector('.mascot.m-normal'), wrap = document.querySelector('.mascotpose');
  const cur = document.querySelector('.mascot.m-curious');
  const panel = document.getElementById('hjempanel');
  const t0 = performance.now();
  window.__t0 = t0;
  document.querySelector('#b-hjem .cta').click();
  await new Promise((res) => {
    const tick = () => {
      const cs = getComputedStyle(wrap);
      out.push({
        t: Math.round(performance.now() - t0),
        transform: cs.transform,
        oNorm: Number(getComputedStyle(norm).opacity),
        oCur: Number(getComputedStyle(cur).opacity),
        offsetTop: wrap.offsetTop,
        offsetLeft: wrap.offsetLeft,
        panelH: panel.offsetHeight,
        screensOn: [...document.querySelectorAll('.screen.on')].map((s) => s.id).join(','),
      });
      if (performance.now() - t0 < 700) requestAnimationFrame(tick);
      else res();
    };
    requestAnimationFrame(tick);
  });
  return out;
});

const angles = samples.map((s) => angleOf(s.transform));
const uniq = [...new Set(angles.map((a) => a.toFixed(2)))];
const minCover = Math.min(...samples.map((s) => s.oNorm + s.oCur));
const posFixed =
  new Set(samples.map((s) => s.offsetTop + '/' + s.offsetLeft)).size === 1;
/* Panelet APNER seg nar det begynner a jobbe. Kravet er ikke lenger «last
   hoyde», men «ingen hopp»: mange mellomverdier, ikke to. */
const panelHoyder = [...new Set(samples.map((s) => s.panelH))];
const panelSmooth = panelHoyder.length > 8;
const screensFixed = new Set(samples.map((s) => s.screensOn));

// Sols portkrav: mal begge handkontaktpunktene separat, maks 1px vertikal gli.
// Handenes posisjon er alfa-malt (measure-hands.mjs), uttrykt i elementets
// lokale koordinater relativt til transform-origin.
const HANDS = { venstre: [-34.5, 0.1], hoyre: [34.3, 0.1] };
const matOf = (t) => {
  const m = t.match(/matrix\(([^)]+)\)/);
  return m ? m[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
};
const yOffset = (t, [px, py]) => { const [, b, , d] = matOf(t); return b * px + d * py; };
const rest = samples[0].transform;
const bowed = samples[samples.length - 1].transform;
const slip = Object.fromEntries(
  Object.entries(HANDS).map(([n, p]) => [n, Math.abs(yOffset(bowed, p) - yOffset(rest, p))]),
);

console.log('── CTA-momentet ──');
console.log(`  rotasjon: ${angles[0].toFixed(2)}° → ${Math.max(...angles).toFixed(2)}°, ` +
            `${uniq.length} distinkte mellomverdier (bevegelse, ikke hopp)`);
console.log(`  laveste samlede maskot-dekning: ${minCover.toFixed(3)} (krav ≥ 0,999)`);
const worstSlip = Math.max(...Object.values(slip));
console.log(`  handgli (portkrav ≤ 1,00 px): ` +
  Object.entries(slip).map(([n, v]) => `${n} ${v.toFixed(2)} px`).join(', ') +
  `  ${worstSlip <= 1 ? '✓ BESTATT' : '✗ STRYKER'}`);
const headTravel = (() => {
  const p = [0, -105]; // hodesenter relativt til pivot, i CSS-px
  const dy = yOffset(bowed, p) - yOffset(rest, p);
  const xOf = (t) => { const [a, , c] = matOf(t); return a * p[0] + c * p[1]; };
  const dx = xOf(bowed) - xOf(rest);
  return Math.hypot(dx, dy);
})();
console.log(`  hodets vandring gjennom boyningen: ${headTravel.toFixed(2)} px`);
console.log(`  maskotens layoutposisjon konstant: ${posFixed ? 'JA' : 'NEI'}`);
console.log(`  panelet apner seg jevnt: ${panelSmooth ? '✓ JA' : '✗ NEI — hopper'} ` +
  `(${samples[0].panelH} → ${Math.max(...panelHoyder)} px, ${panelHoyder.length} mellomverdier)`);
console.log(`  synlige skjermer gjennom hele momentet: ${[...screensFixed].join(' | ')}`);

// ── 2. Stopp-pausen: ekte stillstand mellom markor og push ───────────────
const still = await page.evaluate(async () => {
  const watch = [
    ['maskot', document.querySelector('.mascotwrap')],
    ['pose-normal', document.querySelector('.mascot.m-normal')],
    ['pose-nysgjerrig', document.querySelector('.mascot.m-curious')],
    ['analysestrek', document.querySelector('.scanline')],
    ['syntese', document.getElementById('synth')],
  ];
  const key = (el) => { const cs = getComputedStyle(el); return cs.transform + '|' + cs.opacity; };
  const out = [];
  await new Promise((res) => {
    const tick = () => {
      const t = performance.now() - window.__t0;
      if (t >= 2400) out.push({ t: Math.round(t), state: watch.map(([n, el]) => n + ':' + key(el)).join(' ') });
      if (t < 3195) requestAnimationFrame(tick);
      else res();
    };
    requestAnimationFrame(tick);
  });
  return out;
});
let lastChange = still[0].t;
for (let i = 1; i < still.length; i += 1) if (still[i].state !== still[i - 1].state) lastChange = still[i].t;
console.log(`\n── Stopp-pausen for pushen (eierkrav: 0,5 s) ──`);
console.log(`  siste bevegelse i noe element: ${lastChange} ms`);
console.log(`  full stillstand fram til push (3200 ms): ${3200 - lastChange} ms`);

await page.waitForTimeout(900);
const after = await page.evaluate(() => [...document.querySelectorAll('.screen.on')].map((s) => s.id).join(','));
console.log(`  etter scan: ${after}`);

// ── 3. Alternativ-regelen ────────────────────────────────────────────────
await page.click('#s-res .cta');
await page.waitForTimeout(500);
console.log('\n── Alternativ kun ved motorfunn ──');
const found = [];
for (let i = 0; i < 6; i += 1) {
  const row = await page.evaluate(() => {
    const l = document.querySelector('.kp-layer.on');
    const swap = l.querySelector('.kp-swap');
    return {
      name: l.querySelector('.kp-name').textContent,
      alt: swap ? swap.querySelector('b').textContent : null,
      labels: l.querySelectorAll('.kp-alt-label').length,
      plateY: Math.round(l.querySelector('.kp-plate').getBoundingClientRect().top),
    };
  });
  found.push(row);
  console.log(`  ${row.name.padEnd(22)} → ${row.alt ? 'FUNN: ' + row.alt : 'ingenting vist'}` +
              (row.alt ? '' : row.labels ? '  ⚠ etikett uten funn' : ''));
  if (i < 5) { await page.click('#kp-next'); await page.waitForTimeout(400); }
}
const withAlt = found.filter((f) => f.alt).length;
const ghostLabels = found.filter((f) => !f.alt && f.labels > 0).length;
console.log(`  ${withAlt} med alternativ, ${6 - withAlt} uten. Tomme etiketter: ${ghostLabels}`);
const plateYs = [...new Set(found.map((f) => f.plateY))];
console.log(`  plaggplatens y gjennom alle 6 steg: ${plateYs.join(', ')} ` +
            `(${plateYs.length === 1 ? 'forankret — ingen hopp' : 'HOPPER'})`);

console.log(`\nJS-feil: ${errors.length ? errors.join('; ') : 'ingen'}`);
await browser.close();
