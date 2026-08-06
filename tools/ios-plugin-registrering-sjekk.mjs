/**
 * Vakt mot feilen som kostet en TestFlight-runde (2026-08-07).
 *
 * Capacitor 8 laster IKKE plugins ved å skanne Objective-C-runtime. Se
 * node_modules/@capacitor/ios/.../CapacitorBridge.swift:registerPlugins() —
 * den registrerer kun klassene i `packageClassList` fra capacitor.config.json,
 * og den lista genereres av `cap sync` fra npm-pakker. Et app-lokalt plugin
 * kompilerer, lenker og signerer helt fint, og er likevel usynlig for JS-en.
 *
 * Feilen kan derfor ikke oppdages av `npm run build`, av tsc, av lint eller av
 * at bygget blir grønt. Den viser seg først på en enhet. Denne kontrollen
 * flytter den fram til et sekund på Windows.
 *
 * Regelen: for hvert app-lokalt iOS-plugin (Swift-klasse som arver CAPPlugin
 * under ios/App/App/) MÅ det finnes en `registerPluginInstance(<Klasse>())`
 * i en CAPBridgeViewController-subklasse, OG storyboardet må faktisk peke på
 * den subklassen. Peker storyboardet fortsatt på CAPBridgeViewController,
 * kjøres aldri registreringen — koden ser riktig ut og gjør ingenting.
 *
 *   node tools/ios-plugin-registrering-sjekk.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROT, 'ios', 'App', 'App');
const STORYBOARD = join(APP, 'Base.lproj', 'Main.storyboard');

let feil = 0;
const sjekk = (ok, tekst) => {
  console.log(`${ok ? 'OK  ' : 'FEIL'} ${tekst}`);
  if (!ok) feil++;
};

function swiftFiler(mappe) {
  const ut = [];
  for (const navn of readdirSync(mappe, { withFileTypes: true })) {
    const p = join(mappe, navn.name);
    if (navn.isDirectory()) ut.push(...swiftFiler(p));
    else if (navn.name.endsWith('.swift')) ut.push(p);
  }
  return ut;
}

if (!existsSync(APP)) {
  console.error('Fant ikke ios/App/App — kjør fra repo-roten.');
  process.exit(2);
}

const filer = swiftFiler(APP).map((f) => ({ f, t: readFileSync(f, 'utf8') }));

// 1. Hvilke app-lokale plugins finnes?
const plugins = filer
  .flatMap(({ t }) => [...t.matchAll(/class\s+(\w+)\s*:\s*CAPPlugin\b/g)].map((m) => m[1]));

// 2. Hvilke registreres?
const registrerte = filer
  .flatMap(({ t }) => [...t.matchAll(/registerPluginInstance\(\s*(\w+)\s*\(\s*\)\s*\)/g)].map((m) => m[1]));

// 3. Hvilken klasse peker storyboardet på?
const sb = readFileSync(STORYBOARD, 'utf8');
const vcTreff = sb.match(/customClass="([^"]+)"/);
const vcKlasse = vcTreff ? vcTreff[1] : null;

// 4. Er den klassen en CAPBridgeViewController-subklasse i prosjektet?
const bridgeSubklasser = filer
  .flatMap(({ t }) => [...t.matchAll(/class\s+(\w+)\s*:\s*CAPBridgeViewController\b/g)].map((m) => m[1]));

console.log(`app-lokale plugins: ${plugins.join(', ') || '(ingen)'}`);
console.log(`registrert med registerPluginInstance: ${registrerte.join(', ') || '(ingen)'}`);
console.log(`storyboardets viewController: ${vcKlasse ?? '(ukjent)'}`);
console.log('');

// Ikke-vakuøsitet: uten plugins måler kontrollen ingenting.
sjekk(plugins.length > 0, `fant minst ett app-lokalt plugin å kontrollere (${plugins.length})`);

for (const p of plugins) {
  sjekk(registrerte.includes(p), `${p} registreres med registerPluginInstance`);
}

if (plugins.length > 0) {
  sjekk(
    vcKlasse !== null && bridgeSubklasser.includes(vcKlasse),
    `storyboardet peker på en egen CAPBridgeViewController-subklasse (${vcKlasse}) — ` +
      `ellers kjøres registreringen aldri`,
  );
  sjekk(
    vcKlasse !== 'CAPBridgeViewController',
    'storyboardet peker IKKE på Capacitors egen CAPBridgeViewController',
  );
}

// Filene må også være med i Xcode-prosjektet, ellers kompileres de ikke.
const pbx = readFileSync(join(ROT, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'), 'utf8');
for (const k of new Set([...bridgeSubklasser, ...plugins])) {
  const iSources = new RegExp(`${k}\\.swift in Sources`).test(pbx);
  sjekk(iSources, `${k}.swift ligger i App-targetets Sources`);
}

// pbxproj-ID-er må være unike. Da denne fila ble håndredigert 2026-08-07 ble
// BA...15 og BA...05 gjenbrukt — ID-er widget-targetet allerede eide. Xcode
// ville da knyttet «BabyoraViewController.swift in Sources» til feil fil.
// Ingen kompilator fanger det; teksten ser riktig ut i diffen.
const defLinjer = [...pbx.matchAll(/^\t*([0-9A-F]{24}) \/\* (.*?) \*\/ = \{/gm)];
const teller = new Map();
for (const [, id, navn] of defLinjer) {
  if (!teller.has(id)) teller.set(id, []);
  teller.get(id).push(navn);
}
const duplikater = [...teller.entries()].filter(([, navn]) => navn.length > 1);
sjekk(
  duplikater.length === 0,
  duplikater.length === 0
    ? 'ingen pbxproj-ID er definert to ganger'
    : `pbxproj-ID gjenbrukt: ${duplikater.map(([id, n]) => `${id} → ${n.join(' + ')}`).join('; ')}`,
);

// Klammebalanse: en halvskrevet håndredigering gir et prosjekt Xcode nekter å åpne.
const aapne = (pbx.match(/\{/g) ?? []).length;
const lukkede = (pbx.match(/\}/g) ?? []).length;
sjekk(aapne === lukkede, `pbxproj har balanserte klammer (${aapne}/${lukkede})`);

console.log('');
if (feil) {
  console.error(`${feil} feil — et plugin ville vært usynlig for JS-en på enhet.`);
  process.exit(1);
}
console.log('Alle app-lokale iOS-plugins er registrert og kompilert inn.');
