/**
 * MUTASJONSPRØVE FOR KLE PÅ-PORTEN.
 *
 * Porten ble RETARGETET (navneoppgjøret 2026-08-05). En port som er skrevet
 * om til å bestå er ikke en port. Denne prøven injiserer ett brudd om gangen,
 * krever RØDT med en NAVNGITT melding, og gjenoppretter.
 *
 * Kontrakten er tobent: uten «restore → grønt» kan et brudd ha ødelagt noe
 * helt annet enn det målingen påstår at den fanget.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROT = 'c:/Users/siver/Downloads/trainer-marketplace-master1/babyora';
const KOMP = `${ROT}/src/components/klepaa/KlePaaStepper.tsx`;
const CSS = `${ROT}/src/components/klepaa/kle-paa-stepper.css`;
const PORT = 'src/components/klepaa/';
const APP = `${ROT}/src/App.tsx`;
const RUTE = `${ROT}/src/components/klepaa/kle-paa-rute.ts`;

/** Hver mutasjon: hva den bryter, og hvilken måling som SKAL se det. */
const MUTASJONER = [
  {
    navn: 'stegantallet hardkodes til 1',
    fil: KOMP,
    fra: '          {steps.map((s, i) => (\n            <div\n              className="kps-slide"',
    til: '          {steps.slice(0, 1).map((s, i) => (\n            <div\n              className="kps-slide"',
    forventer: 'FUNKSJON av listen',
  },
  {
    navn: 'etiketten er alltid «Neste»',
    fil: KOMP,
    fra: "          {paaSisteSteg ? 'Ferdig' : 'Neste'}",
    til: "          {'Neste'}",
    forventer: 'etiketten følger posisjonen',
  },
  {
    navn: 'bytt-raden vises uten alternativer',
    fil: KOMP,
    fra: '                {onSwap !== undefined && s.alternatives.length > 0 && (',
    til: '                {onSwap !== undefined && (',
    forventer: 'bytt-raden rendres for plagg uten alternativer',
  },
  {
    navn: 'navigasjonskroken fjernes fra «Forrige»',
    fil: KOMP,
    fra: '          data-kps="prev"\n',
    til: '',
    forventer: 'stabilt grep om navigasjonen',
  },
  {
    navn: 'to veier framover i samme steg',
    fil: KOMP,
    fra: '      <div className="kps-bottom">',
    til: '      <div className="kps-bottom">\n        <Button variant="ghost" size="cta" data-kps="next">Videre</Button>',
    forventer: 'to er to løfter om det samme',
  },
  {
    navn: '«Hopp over» settes inn igjen',
    fil: KOMP,
    fra: '        <Button\n          variant="ghost"\n          size="cta"\n          data-kps="prev"',
    til: '        <Button variant="quiet" size="cta" onClick={() => gaaTil(index + 1)}>Hopp over</Button>\n        <Button\n          variant="ghost"\n          size="cta"\n          data-kps="prev"',
    forventer: 'Hopp over',
  },
  {
    navn: 'rå varighet og kurve i stilarket',
    fil: CSS,
    fra: '  transition: transform var(--dw-m-step) var(--dw-ease);',
    til: '  transition: transform 200ms ease-out;',
    forventer: 'hardkodet bevegelse',
  },
  {
    navn: 'reduced-motion forkorter i stedet for å slå av',
    fil: CSS,
    fra: '  .kps-track { transition: none; }\n  .kps-dot { transition: none; }\n  .kps-swap-row { transition: none; }\n  .kps-swap-row:active { transform: none; }',
    til: '  .kps-track { transition-duration: var(--dw-m-feedback); }',
    forventer: 'slår ikke av',
  },
  {
    navn: 'reduced-motion-blokken slutter å nevne stepperen',
    fil: CSS,
    fra: '  .kps-track { transition: none; }\n  .kps-dot { transition: none; }\n  .kps-swap-row { transition: none; }\n  .kps-swap-row:active { transform: none; }',
    til: '  * { transition: none; }',
    forventer: 'styrer da ikke stepperen',
  },
  {
    navn: 'komponenten rendrer ingenting',
    fil: KOMP,
    fra: '  const paaSisteSteg = index === sisteIndex;',
    til: '  const paaSisteSteg = index === sisteIndex;\n  if (antall > 0) return null;',
    forventer: 'null steg',
  },

  /* ── SØMMEN. Den opprinnelige feilen: alt over kan være grønt mens
        CTA-en ikke når fram. ─────────────────────────────────────────── */
  {
    navn: 'SØM: overlayet kobles fra App.tsx igjen',
    fil: APP,
    fra: '            <KlePaaOverlay bundle={klePaaSteg} onClose={closePaakledning} />',
    til: '            <div />',
    forventer: 'bygget, portet og unådd',
  },
  {
    navn: 'SØM: rutevalget kalles ikke lenger',
    fil: APP,
    fra: '  const klePaaSteg = klePaaKildeFor(activeDrill);',
    til: '  const klePaaSteg = null as ReturnType<typeof klePaaKildeFor>;',
    forventer: 'kaller ikke klePaaKildeFor',
  },
  {
    navn: 'SØM: den gamle flaten fjernes som reserve',
    fil: APP,
    fra: '<PaakledningScreen',
    til: '<Paakledning_Screen',
    alle: true,
    forventer: 'ingen flate å falle til',
  },
  {
    navn: 'SØM: sekvensen åpnes også for planlagte antrekk',
    fil: RUTE,
    fra: "  if (drill.source !== 'current') return null;",
    til: '',
    forventer: 'ikke skal på med nå',
  },
  {
    navn: 'SØM: ustøttede bundler slipper gjennom til en tom stepper',
    fil: RUTE,
    fra: "  if (bundle === undefined || bundle.kind !== 'supported') return null;",
    til: '  if (bundle === undefined) return null;',
    forventer: 'ingen plaggliste å dele i steg',
  },
  {
    navn: 'SØM: CTA-en lander på listen igjen',
    fil: RUTE,
    fra: '  return { base: bundle.base, options: bundle.options };',
    til: '  return null;',
    forventer: 'lander ikke på sekvensen',
  },
];

function kjørPort() {
  try {
    const ut = execFileSync('npx', ['vitest', 'run', PORT], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    return { grønn: true, ut };
  } catch (e) {
    return { grønn: false, ut: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/* NULLPUNKTET. Er porten rød allerede, betyr ingen av mutasjonene noe. */
const start = kjørPort();
if (!start.grønn) {
  console.log('AVBRUTT: porten er rød FØR mutasjon. Ingen prøve er gyldig da.');
  console.log(start.ut.split('\n').slice(-25).join('\n'));
  process.exit(1);
}
console.log('nullpunkt: GRØNT\n');

const rader = [];
for (const m of MUTASJONER) {
  const original = readFileSync(m.fil, 'utf8');
  if (!original.includes(m.fra)) {
    rader.push({ navn: m.navn, dom: 'ANKER BOMMET', detalj: 'fant ikke teksten som skulle byttes' });
    continue;
  }
  writeFileSync(
    m.fil,
    m.alle === true ? original.split(m.fra).join(m.til) : original.replace(m.fra, m.til),
    'utf8',
  );
  const etter = kjørPort();
  writeFileSync(m.fil, original, 'utf8');

  const traff = etter.ut.includes(m.forventer);
  rader.push({
    navn: m.navn,
    dom: etter.grønn ? 'BESTO MUTASJONEN' : traff ? 'RØD, riktig måling' : 'RØD, men feil måling',
    detalj: etter.grønn
      ? 'porten så ikke bruddet'
      : traff
        ? `«${m.forventer}»`
        : `ventet «${m.forventer}» i meldingen`,
  });
  console.log(`${rader.at(-1).dom.padEnd(20)} ${m.navn}  — ${rader.at(-1).detalj}`);
}

/* ANDRE BEN: gjenopprettet skal være grønt igjen. */
const slutt = kjørPort();
console.log(`\ngjenopprettet: ${slutt.grønn ? 'GRØNT' : 'RØDT — en mutasjon ble ikke reversert!'}`);

const dårlige = rader.filter((r) => r.dom !== 'RØD, riktig måling');
console.log(`\n${rader.length - dårlige.length}/${rader.length} mutasjoner fanget av riktig måling`);
if (dårlige.length > 0) {
  console.log('\nIKKE FANGET:');
  for (const d of dårlige) console.log(`  ${d.dom}: ${d.navn} — ${d.detalj}`);
}
process.exit(dårlige.length === 0 && slutt.grønn ? 0 : 1);
