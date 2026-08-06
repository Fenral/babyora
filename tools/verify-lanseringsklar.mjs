/**
 * verify-lanseringsklar — ting som MÅ være borte før appen sendes til butikk.
 *
 * ══ HVORFOR DENNE FINNES ═══════════════════════════════════════════════════
 *
 * Eier ble spurt om «Widget-spike (testverktøy — fjernes)» skulle strammes
 * eller stå, og svarte: fjern det helt til slutt. Det er et fornuftig svar —
 * spiken trenger panelet PÅ TELEFONEN for å testes, og vakten
 * `!Capacitor.isNativePlatform() && !import.meta.env.DEV` slipper det derfor
 * gjennom på native med vilje.
 *
 * Men «til slutt» er ikke en mekanisme. Det er en hensikt, og hensikter
 * overlever ikke tolv commits og to uker. Hele denne økta har handlet om at
 * prosa ikke håndhever seg selv; et notat i en plan er nøyaktig like sterkt
 * som at noen husker å lese planen.
 *
 * ══ HVORFOR DEN IKKE FELLER BYGGET NÅ ══════════════════════════════════════
 *
 * Begge Codemagic-løpene (TestFlight, Play Internal) er INTERNE. Feller vi
 * dem, stanser vi spiken — altså det motsatte av det som ble bestemt.
 *
 * Porten er derfor todelt:
 *   · uten LANSERING=1  → skriver ut hva som gjenstår, og lar bygget gå
 *   · med  LANSERING=1  → nekter, med navn på hver blokkering
 *
 * Flagget settes når det bygges for butikk. Da kan panelet ikke bli med.
 *
 * ══ HVA DEN IKKE ER ════════════════════════════════════════════════════════
 *
 * Den erstatter ikke menneskeporten (to telefoner, begge temaer, mørkt rom).
 * Den fanger bare det en maskin KAN se: at bestemte navngitte ting er ute av
 * koden. Blir listen tom, skal denne filen slettes — ikke stå igjen og
 * bestå på fravær.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROT = process.cwd();

/**
 * Hver blokkering NAVNGIR seg selv og sier hvordan den fjernes.
 * `finnes()` returnerer true når blokkeringen fortsatt er der.
 */
export const BLOKKERINGER = [
  {
    id: 'widget-spike-panel',
    hva: 'Widget-spike-testpanelet er fortsatt montert i Innstillinger',
    hvorfor:
      'Vakten i WidgetSpikePanel.tsx er '
      + '«!Capacitor.isNativePlatform() && !import.meta.env.DEV» — den stenger '
      + 'bare PRODUKSJONS-WEB. På native, altså i selve app-bygget, rendres '
      + 'panelet. En forelder som åpner Innstillinger ville sett «Send '
      + 'test-brief · utløper om 2 min» med stiplet oransje ramme.',
    slikFjernes:
      'Fjern <WidgetSpikePanel /> og importen fra '
      + 'src/screens/InnstillingerScreen.tsx, og slett src/lib/widget/'
      + 'WidgetSpikePanel.tsx.',
    finnes() {
      const f = resolve(ROT, 'src/screens/InnstillingerScreen.tsx');
      if (!existsSync(f)) return false;
      const src = readFileSync(f, 'utf8');
      // Kommentarer strippes: en utkommentert montering er ikke montert.
      const kode = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      return /<WidgetSpikePanel\s*\/>/.test(kode);
    },
  },
];

export function finnBlokkeringer() {
  return BLOKKERINGER.filter((b) => b.finnes());
}

/* ── Kjøring ──────────────────────────────────────────────────────────────
   Filen er BÅDE en modul og et kjørbart skript. Uten dette skillet kjørte
   toppnivået — inkludert process.exit(0) — i det porten sin egen test
   importerte den, og drepte hele testkjøringen. Målt: «Test Files 1 failed,
   Tests: no tests». En fil som avslutter prosessen ved import kan ikke
   testes, og en port ingen kan teste er en port ingen vet virker. */
const kjoertDirekte = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (!kjoertDirekte) {
  // Importert som modul: eksportene over er alt kalleren skal ha.
} else {
  kjoer();
}

function kjoer() {
const erLansering = process.env.LANSERING === '1';
const gjenstaar = finnBlokkeringer();

if (gjenstaar.length === 0) {
  console.log('Lanseringsklar: ingen kjente blokkeringer igjen.');
  console.log('(Menneskeporten står fortsatt: to telefoner, begge temaer, mørkt rom.)');
  process.exit(0);
}

const linje = '─'.repeat(72);
console.log('');
console.log(linje);
console.log(erLansering
  ? '  BYGGET STANSES — ' + gjenstaar.length + ' ting må ut før butikk'
  : '  IKKE LANSERINGSKLAR — ' + gjenstaar.length + ' ting gjenstår (internt bygg fortsetter)');
console.log(linje);
for (const b of gjenstaar) {
  console.log('');
  console.log('  · ' + b.hva);
  console.log('    HVORFOR:  ' + b.hvorfor);
  console.log('    FJERNES:  ' + b.slikFjernes);
}
console.log('');
console.log(linje);
if (!erLansering) {
  console.log('  Sett LANSERING=1 når det bygges for butikk. Da nekter dette steget.');
  console.log(linje);
  console.log('');
  process.exit(0);
}
console.log('');
process.exit(1);
}
