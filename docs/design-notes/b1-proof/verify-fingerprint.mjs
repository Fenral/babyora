/* Verifiserer de fire veiene i portdom 25s fingerprint-modell, sa eieren far
   en mock som faktisk oppforer seg som forslaget — ikke en som ser slik ut. */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
const feil = [];
page.on('pageerror', (e) => feil.push(String(e)));
await page.goto(pathToFileURL(process.cwd() + '/b1-slice.html').href);
await page.waitForTimeout(450);

const cta = () => page.evaluate(() => document.getElementById('cta').textContent.trim().replace(/\s+/g, ' '));
const trust = () => page.evaluate(() => document.getElementById('trust').textContent);
const skjerm = () => page.evaluate(() => document.querySelector('.screen.on').id);

console.log('1. Forste gang, ingen cache');
console.log(`   knapp: «${await cta()}»  ·  linje: «${await trust()}»`);

const t0 = Date.now();
await page.click('#cta');
await page.waitForFunction(() => document.querySelector('.screen.on').id === 's-res', null, { timeout: 6000 });
const seremoni = Date.now() - t0;
console.log(`   → seremoni spilt, resultat etter ${seremoni} ms  ${seremoni > 3000 ? '✓ full 3,2 s' : '✗ for kort'}`);

await page.click('.sumstrip');
await page.waitForTimeout(500);
console.log('\n2. Tilbake til Hjem, samme forhold');
console.log(`   knapp: «${await cta()}»  ·  linje: «${await trust()}»`);
const t1 = Date.now();
await page.click('#cta');
await page.waitForFunction(() => document.querySelector('.screen.on').id === 's-res', null, { timeout: 6000 });
const direkte = Date.now() - t1;
console.log(`   → resultat etter ${direkte} ms  ${direkte < 900 ? '✓ direkte push, ingen seremoni' : '✗ spilte seremoni likevel'}`);

await page.click('.sumstrip');
await page.waitForTimeout(500);
console.log('\n3. Endrer aktivitet → signaturen brytes');
await page.click('#akt button:nth-child(2)');
await page.waitForTimeout(250);
console.log(`   knapp: «${await cta()}»  ·  linje: «${await trust()}»`);
const t2 = Date.now();
await page.click('#cta');
await page.waitForFunction(() => document.querySelector('.screen.on').id === 's-res', null, { timeout: 6000 });
const igjen = Date.now() - t2;
console.log(`   → seremoni etter ${igjen} ms  ${igjen > 3000 ? '✓ ny beregning' : '✗ brukte cache pa endret signatur'}`);

await page.click('.sumstrip');
await page.waitForTimeout(500);
console.log('\n4. Tilbake til opprinnelig aktivitet → den gamle cachen gjelder IKKE');
await page.click('#akt button:nth-child(1)');
await page.waitForTimeout(250);
console.log(`   knapp: «${await cta()}»  (signaturen er ny igjen, forrige cache var for «I vogn»)`);

console.log(`\nskjerm til slutt: ${await skjerm()}  ·  JS-feil: ${feil.length ? feil.join('; ') : 'ingen'}`);
await browser.close();
