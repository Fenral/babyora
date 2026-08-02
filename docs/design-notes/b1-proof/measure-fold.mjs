/* Eierfunn: «Det er ikke plass til CTA. Den ma vare synlig over fold.»

   Portdom 23 om METODEN: «Definer kravet etter 100dvh minus safe areas og
   tabbar, ikke etter iPhone-modell. Ved standard tekststorrelse bor CTA ha
   minst 12-16 px klaring til tabbaren. Ved stor Dynamic Type er scrolling
   akseptabelt.»

   Derfor maler denne ikke navngitte telefoner, men SVEIPER hoyden og finner
   den laveste tilgjengelige hoyden der kravet fortsatt holder. Det tallet
   overlever nye modeller; en enhetsliste gjor ikke det. */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const MIN_KLARING = 12;   // px mot tabbaren, portdom 23
const BREDDE = 375;       // smaleste stottede bredde

const browser = await chromium.launch();
const mal = async (h) => {
  const page = await browser.newPage({ viewport: { width: BREDDE, height: h } });
  await page.goto(pathToFileURL(process.cwd() + '/b1-slice.html').href);
  await page.waitForTimeout(260);
  const r = await page.evaluate(() => {
    const b = (s) => document.querySelector(s).getBoundingClientRect();
    return { ctaBunn: b('#b-hjem .cta').bottom, tabTopp: b('.tabbar').top };
  });
  await page.close();
  return Math.round(r.tabTopp - r.ctaBunn);
};

console.log(`krav: CTA-en skal ha ≥ ${MIN_KLARING} px klaring til tabbaren, ved ${BREDDE} px bredde\n`);
let laveste = null;
for (let h = 560; h <= 760; h += 10) {
  const k = await mal(h);
  const ok = k >= MIN_KLARING;
  if (ok && laveste === null) laveste = h;
  if (!ok) laveste = null;                       // ma holde sammenhengende oppover
  console.log(`  tilgjengelig hoyde ${h} px → klaring ${String(k).padStart(4)} px  ${ok ? '✓' : '✗'}`);
}
console.log(`\nlaveste hoyde som bestar sammenhengende: ${laveste ?? 'ingen'} px`);
console.log(`til sammenligning: iPhone SE gir 667 px, iPhone 13 gir 844 px,`);
console.log(`og eierens Safari med nettleserkrom malte 681 px.`);
await browser.close();
process.exitCode = laveste !== null && laveste <= 667 ? 0 : 1;
