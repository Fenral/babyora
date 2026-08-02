/* Portdom runde 22c: «Kontakt- og handskyggen ma ligge utenfor wrapperen og
   ikke skaleres.» Ligger skyggen inne i det skalerte laget, presses offset og
   blur sammen — skyggen «puster» selv om lyset star helt stille. */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(pathToFileURL(process.cwd() + '/b1-slice.html').href);
await page.waitForTimeout(400);

const r = await page.evaluate(async () => {
  const wrap = document.querySelector('.mascotwrap');
  const pose = document.querySelector('.mascotpose');
  const snap = () => ({ filter: getComputedStyle(wrap).filter, transform: getComputedStyle(wrap).transform });
  const before = snap();
  document.querySelector('#b-hjem .cta').click();
  await new Promise((res) => setTimeout(res, 450));
  return { before, after: snap(), pose: getComputedStyle(pose).transform };
});

console.log('── Skyggen skal IKKE skaleres (portdom 22c) ──');
console.log(`  skyggelaget (.mascotwrap) filter for : ${r.before.filter}`);
console.log(`  skyggelaget (.mascotwrap) filter etter: ${r.after.filter}`);
console.log(`  skyggelaget transform for/etter: ${r.before.transform} / ${r.after.transform}`);
console.log(`  bevegelsen ligger pa .mascotpose: ${r.pose}`);
const uendret = r.before.filter === r.after.filter && r.before.transform === r.after.transform;
const poseBeveger = r.pose !== 'none' && r.pose !== r.before.transform;
console.log(`  skyggen uskalert gjennom boyningen: ${uendret ? '✓ JA' : '✗ NEI'}`);
console.log(`  bevegelsen skjer pa et annet lag enn skyggen: ${poseBeveger ? '✓ JA' : '✗ NEI'}`);
await browser.close();
