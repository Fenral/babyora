/* Eierfunn: «Det er ikke plass til CTA. Den ma vare synlig over fold.»
   Maler hvor den vertikale plassen faktisk gar, og om CTA-en er fri av den
   flytende tabbaren — pa eierens faktiske Safari-viewport OG i den ekte
   appens viewport (Capacitor har verken Safari-banner eller nettleserlinje). */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const VIEWPORTS = [
  { navn: 'eierens Safari (15 Pro Max, artifact)', w: 430, h: 681 },
  { navn: 'samme telefon, EKTE app (Capacitor)', w: 430, h: 932 },
  { navn: 'iPhone SE — minste stottede', w: 375, h: 667 },
  { navn: 'iPhone 13/14', w: 390, h: 844 },
];

const browser = await chromium.launch();
for (const v of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
  await page.goto(pathToFileURL(process.cwd() + '/b1-slice.html').href);
  await page.waitForTimeout(350);
  const m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const cta = r('#b-hjem .cta');
    const tab = r('.tabbar');
    const panel = r('#hjempanel');
    const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
    return {
      panelTop: Math.round(panel.top), panelH: Math.round(panel.height),
      ctaTop: Math.round(cta.top), ctaBottom: Math.round(cta.bottom),
      tabTop: Math.round(tab.top),
      trustBottom: Math.round(r('.trust').bottom),
      deler: {
        toppluft: Math.round(panel.top),
        panel: Math.round(panel.height),
        overskrift: h('.h-serif'),
        underlinje: h('.subline'),
        cta: h('.cta'),
        trust: h('.trust'),
      },
    };
  });
  const kl = v.h - m.ctaBottom;
  const bakTab = m.ctaBottom > m.tabTop;
  console.log(`\n── ${v.navn} (${v.w}x${v.h}) ──`);
  console.log(`  CTA: ${m.ctaTop} → ${m.ctaBottom}   tabbar starter ${m.tabTop}   fold ${v.h}`);
  console.log(`  CTA helt synlig over fold: ${m.ctaBottom <= v.h ? 'JA' : 'NEI (' + (m.ctaBottom - v.h) + 'px under)'}`);
  console.log(`  CTA fri av tabbaren:       ${bakTab ? 'NEI (' + (m.ctaBottom - m.tabTop) + 'px bak den)' : 'JA'}`);
  console.log(`  trust-linjen slutter ${m.trustBottom} (tabbar ${m.tabTop}) → ${m.trustBottom > m.tabTop ? 'SKJULT bak tabbaren' : 'synlig'}`);
  console.log(`  plassregnskap: ${Object.entries(m.deler).map(([k, val]) => `${k} ${val}`).join(' · ')}`);
  await page.close();
}
await browser.close();
