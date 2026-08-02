/* Eierfunn: «Gir lyset i bakgrunnen noen mening na?»

   Art bible, bindende: «key-lyset sikter pa skjermens HOVEDMOTIV — Hjem =
   maskoten.» Lyspoolen er ankret pa en fast PROSENT av skjermen (37 %/-10 %),
   men etter at lufta ble fordelt (portdom 24) sitter maskoten ikke lenger pa
   den prosenten. Denne malingen finner poolens faktiske lyseste punkt og
   sammenligner med maskotens faktiske senter. */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');
const sharp = require('sharp');

const browser = await chromium.launch();
for (const h of [667, 932]) {
  const page = await browser.newPage({ viewport: { width: 430, height: h }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(process.cwd() + '/b1-slice.html').href);
  await page.waitForTimeout(450);
  await page.evaluate(() => { document.getElementById('stage').dataset.mode = 'dark'; });
  await page.waitForTimeout(200);
  const geo = await page.evaluate(() => {
    const m = document.querySelector('.mascotwrap').getBoundingClientRect();
    return { cx: m.left + m.width / 2, cy: m.top + m.height * 0.35, top: m.top };  // hodet, ikke hele boksen
  });
  const buf = await page.screenshot();
  await page.close();

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const L = (x, y) => { const i = (y * info.width + x) * ch;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; };

  // Finn poolens lyseste punkt i BAKGRUNNEN: skann et rutenett, hopp over
  // panelet, maskoten, ordmerket og knappene ved a holde oss i venstre marg
  // og over/under dem.
  let best = { l: -1, x: 0, y: 0 };
  for (let y = 10; y < h - 70; y += 3) {   // hopp over proof-knappen nede
    for (let x = 2; x < 17; x += 2) {          // venstre marg: panelet starter pa x=20
      const l = L(Math.round(x * 2), Math.round(y * 2));
      if (l > best.l) best = { l, x, y };
    }
  }
  console.log(`\n── ${430}x${h} ──`);
  console.log(`  maskotens hode:      y ${Math.round(geo.cy)}  (${((geo.cy / h) * 100).toFixed(0)} % ned)`);
  console.log(`  veggens lyseste punkt: y ${best.y}  (${((best.y / h) * 100).toFixed(0)} % ned)  luminans ${best.l.toFixed(1)}`);
  const avvik = Math.round(geo.cy - best.y);
  console.log(`  avvik: lyset ligger ${Math.abs(avvik)} px ${avvik > 0 ? 'OVER' : 'under'} motivet` +
    `  ${Math.abs(avvik) < 60 ? '✓ treffer' : '✗ bommer'}`);
}
await browser.close();
