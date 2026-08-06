// Ærlighetsvakt for lab-lenken: feiler (exit 1) hvis den påståtte
// DOM-tilstanden ikke finnes. Samme prinsipp som lab-skjermbevis-r2.mjs.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');
const BASE_DIR = dirname(fileURLToPath(import.meta.url));
const LAB = 'https://babyora-lab.vercel.app/';

const CASES = [
  // Hver mustContain er et bærende element for ARMEN, ikke felles skall —
  // ellers ville testen bestå selv om feil prototype ble servert.
  { id: 'p1-bilstol', url: `${LAB}?modus=deltaker&arm=p1&scenario=bilstol`, mustContain: ['Steg 1 av', 'Stopp hvis'] },
  { id: 'p2-standard', url: `${LAB}?modus=deltaker&arm=p2&scenario=vanlig`, mustContain: ['holder dette?'] },
  { id: 'p2-kald', url: `${LAB}?modus=deltaker&arm=p2&scenario=vanlig&kandidat=kald`, mustContain: ['holder dette?'] },
  { id: 'p3-vanlig', url: `${LAB}?modus=deltaker&arm=p3&scenario=vanlig`, mustContain: ['gjelder til', 'widget'] },
  { id: 'p4-vanlig', url: `${LAB}?modus=deltaker&arm=p4&scenario=vanlig`, mustContain: ['gjelder til'] },
  // Mutasjonsbevis: ugyldig arm SKAL ikke gi deltakerflate (feiler hvis
  // testen ovenfor bare måler at «noe» rendres).
  { id: 'ugyldig-arm', url: `${LAB}?modus=deltaker&arm=p9&scenario=vanlig`, mustNotContain: ['Steg 1 av'] },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let feil = 0;
const tekster = new Map();

for (const c of CASES) {
  await page.goto(c.url, { waitUntil: 'networkidle', timeout: 45000 });
  // Forskningsforbeholdet må bekreftes manuelt (bekreftet=1 er forbudt i foreldretest)
  const knapp = page.getByRole('button', { name: /Jeg forstår/i });
  const harDisclaimer = await knapp.count();
  if (harDisclaimer) await knapp.first().click();
  await page.waitForTimeout(1200);
  const tekst = (await page.locator('body').innerText()).trim();
  tekster.set(c.id, tekst);
  const lav = tekst.toLowerCase();
  const tom = tekst.length < 40;
  const mangler = (c.mustContain ?? []).filter((t) => !lav.includes(t.toLowerCase()));
  const forbudt = (c.mustNotContain ?? []).filter((t) => lav.includes(t.toLowerCase()));
  const status = tom || mangler.length || forbudt.length ? 'FEIL' : 'OK';
  if (status === 'FEIL') feil++;
  console.log(
    `${status} ${c.id} · disclaimer=${harDisclaimer ? 'ja' : 'nei'} · tegn=${tekst.length}` +
      (mangler.length ? ` · mangler=${mangler.join(',')}` : '') +
      (forbudt.length ? ` · skulle IKKE hatt=${forbudt.join(',')}` : ''),
  );
  await page.screenshot({ path: join(BASE_DIR, `lab-lenke-${c.id}.png`) });
}

await browser.close();

// Differansekrav: &kandidat=kald MÅ gi en annen flate enn P2s standard.
// Uten dette ville foreldretestens P2-oppgave måle samme kandidat hver gang.
const std = tekster.get('p2-standard') ?? '';
const kald = tekster.get('p2-kald') ?? '';
if (std && kald && std === kald) {
  console.log('FEIL p2-kandidat · &kandidat=kald ga IDENTISK flate som standard');
  feil++;
} else if (std && kald) {
  console.log('OK  p2-kandidat · &kandidat=kald gir en annen flate enn standard');
}

if (feil) { console.error(`${feil} case(r) feilet — lenken er IKKE verifisert.`); process.exit(1); }
console.log('Alle case rendret innhold på den utlagte lenken.');
