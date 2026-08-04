/**
 * KONTRAKTER UTEN FORBRUKERE FELLES — tokenklasser, ikke «brukt minst én gang».
 *
 * Bakgrunn (laerdom-hjem-2026-08-03.md §«Kontrakter uten forbrukere»):
 * `--dw-depth-*` ble skrevet etter eierfunnet «den lyse føles flatere enn den
 * mørke», ble strukturtestet — og hadde NULL forbrukere i `src/`. Skjermen som
 * utløste funnet stod utenfor kontrakten funnet skapte. Samme mønster ett nivå
 * opp: `--dw-lys-vinkel`/`--dw-kant-key`/`--dw-kant-fill` fra portdom 27 ble
 * kun referert av testen som sjekket at de FANTES.
 *
 * Regelen derfra: «en test som sjekker at et token EKSISTERER, må også sjekke
 * at noe FORBRUKER det.» Vedtak `kontrakt-har-forbruker`, status
 * «uportert-sjekk» fram til denne filen.
 *
 * SOLS FORBEDRING (DoD fase 2): «brukt minst én gang» kan tilfredsstilles av
 * tilfeldig bruk og beviser ingenting. Hvert token klassifiseres derfor på
 * PREFIKS/FAMILIE:
 *
 *   obligatorisk-kontrakt  MÅ ha en forbruker i src utenfor tester.
 *                          Familien er en bindende kontrakt med et vedtak bak seg.
 *   avledningsprimitiv     Bygger et annet token. Må ha ENTEN egen forbruker
 *                          ELLER mate en obligatorisk kontrakt som selv er forbrukt.
 *   primitiv               Palett/skala. KAN stå ubrukt — et rampetrinn eller et
 *                          skalatrinn uten forbruker er normalt, ikke gjeld.
 *   reservert / deprecated Eksplisitte lister (de eneste som føres per token).
 *
 * TRE FELLER DENNE PORTEN ER BYGD FOR Å UNNGÅ
 *
 * 1. «Finnes i en fil» er ikke forbruk. `--dw-sh-broad` nevnes i tokenfila —
 *    men bare fordi `--dw-depth-hero` bygger på den. Tokenfil-internt forbruk
 *    telles SEPARAT, aldri som forbruk. Et naivt søk melder disse grønne.
 *
 * 2. Kommentarer er ikke forbruk. `src/components/BottomTabBar.css:9` skriver
 *    `var(--dw-tabbar-clearance)` inne i en `/* *\/`-blokk. Uten stripping
 *    teller den filen som forbruker av et token den ikke rører. Det er samme
 *    feilklasse som accent-300-porten møtte i dag, der `indexOf('@media')`
 *    traff ordet i filens EGEN kommentar og kuttet skopet. Testen ASSERTERER
 *    at nettopp denne filen ikke telles.
 *
 * 3. En port som ikke fant målene sine, har ikke bestått. «Er skopet stort
 *    nok» duger ikke — det måler bytes. Porten navngir derfor både filene og
 *    tokenene den skal finne, og både de forbrukte (positiv kontroll) og de
 *    uforbrukte (negativ kontroll). Slutter detektoren å se noe som helst,
 *    eller begynner den å se alt, ryker en av de to.
 *
 * MUTASJONSKONTRAKT (to ledd, kjørt 2026-08-04):
 *   a) `.hjm-panel::before` sin `linear-gradient(var(--dw-lys-vinkel), ...)`
 *      kommentert ut i hjem-monter.css → RØD, med --dw-lys-vinkel,
 *      --dw-kant-key og --dw-kant-fill navngitt. (Bevisst gjort som en
 *      KOMMENTAR: det muterer forbruket og kommentarstrippingen samtidig.)
 *   b) gjenopprettet → GRØNN.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROT = process.cwd();
const TOKENFIL = 'src/styles/design-tokens-v2.css';

/* ────────────────────────────────────────────────────────────────────────
   KLASSIFISERINGEN — på FAMILIE, aldri per token.
   Familien er første ledd etter `--dw-`: `--dw-m-push-back` → `m`,
   `--dw-plate-kant` → `plate`, `--dw-ink-panel-hi` → `ink`.
   ──────────────────────────────────────────────────────────────────────── */
type Klasse = 'obligatorisk-kontrakt' | 'avledningsprimitiv' | 'primitiv';

/**
 * Obligatoriske kontrakter. Hver familie her har et vedtak eller en portdom
 * bak seg — det er DERFOR den er obligatorisk, ikke fordi den er viktig.
 */
const OBLIGATORISK: Readonly<Record<string, string>> = {
  m: 'bevegelseskontrakten (vedtak «bevegelsestokens», tokenfila §Bevegelseskontrakten)',
  ease: 'bevegelseskontrakten — én kurve for hele appen',
  depth: 'dybdekontrakten (vedtak «dybdekontrakt» + «dybdekontrakt-forbrukes»)',
  lys: 'lysvektoren, portdom 27 — «lysretningen skal ikke variere»',
  kant: 'kantlyset, portdom 27 — avledet av lysvektoren',
  pool: 'veggens lyspool (vedtak «lyspool-folger-motivet», last 2026-08-04, port 10 i verify-hjem)',
  rom: 'rommets fall — naer/fjern ende av lysvektoren. Snur roller per tema (vedtak «lyspool-folger-motivet»)',
  focus: 'fokusringen (vedtak «fokusring», WCAG 1.4.11)',
  plate: 'plaggplaten, portdom 25 — lokal terskel, egne tokens',
  tabbar: 'den flytende tab-baren + klaringen (DoD fase 3: «gjettede bunn-tall → --dw-tabbar-clearance»)',
};

/**
 * Avledningsprimitiver: finnes for å BYGGE et annet token. `--dw-sh-broad`
 * har null direkte forbrukere og skal ha det — den lever inne i
 * `--dw-depth-hero`. Men den får ikke være foreldreløs: kjeden må ende i en
 * obligatorisk kontrakt som SELV er forbrukt.
 */
const AVLEDNINGSPRIMITIV: Readonly<Record<string, string>> = {
  sh: 'skyggefargene som --dw-depth-* bygges av (tokenfila §Dybdekontrakten)',
};

/**
 * Primitiver: palett og skalaer. Et rampetrinn eller skalatrinn uten forbruker
 * er normalt. `--dw-accent-700` er lys-modus' `--dw-accent`-verdi gitt et
 * navngitt rampetrinn; at ingen skriver `var(--dw-accent-700)` betyr ikke at
 * fargen er ubrukt. DoD fase 2B fødes `--dw-space-*` bevisst som primitiv.
 */
const PRIMITIV: Readonly<Record<string, string>> = {
  canvas: 'valørstigen · nivå 0',
  panel: 'valørstigen · petrol-instrument',
  raised: 'valørstigen · nivå 2',
  interactive: 'valørstigen · nivå 2b',
  overlay: 'valørstigen · nivå 3',
  accent: 'amber-RAMPEN (300/500/700/pressed) — en palett, ikke en kontrakt',
  ink: 'tekstrampene (espresso + panel)',
  w: 'værfamilien — panelnyanser',
  edge: 'monter-lysets kjerne',
  hairline: 'linjefarge',
  r: 'radie-skalaen',
  space: 'avstandsskalaen — utledet av tools/spacing-detektor.mjs. Foedes som primitiv (DoD fase 2B)',
  size: 'stoerrelsesmaal: trykkmaal, CTA-hoeyde, radhoeyde-gulv. Geometri, ikke avstand',
  shadow: 'legacy flat hev-skygge (--dw-shadow-raise)',
  success: 'semantikk',
  warning: 'semantikk',
  danger: 'semantikk',
  text: 'typografi-skalaen (Sol: primitiv)',
  font: 'font-stakkene (Sol: primitiv)',
};

/** Kun disse to føres per token. Begge er TOMME i dag — det er ikke juks, det
 *  er tilstanden: ingen `--dw-*` er merket reservert eller utfaset. Reglene
 *  under gjelder likevel, så listene ikke kan råtne når de først tas i bruk. */
const RESERVERT: readonly string[] = [];
const DEPRECATED: readonly string[] = [];

/* ────────────────────────────────────────────────────────────────────────
   BASELINE — gulvet kan bare KRYMPE.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * EIERRAPPORTERT FUNN. Kan ALDRI baselines.
 *
 * `--dw-m-push` / `--dw-m-push-back` er ikke et tall i en rapport: eieren
 * meldte 2026-08-04 at «appen bytter skjerm uten bevegelse». Vedtak
 * `sideskift-er-fysiske`, status «brutt», DoD fase 3B. De telles derfor som
 * to PERMANENTE, NAVNGITTE brudd utenfor gulvet — aldri absorbert i et tall
 * der de blir usynlige. Blir vedtaket låst uten at tokenene er forbrukt,
 * SKAL denne porten bli rød.
 */
const EIERRAPPORTERT: readonly string[] = ['--dw-m-push', '--dw-m-push-back'];
const EIERRAPPORTERT_VEDTAK = 'sideskift-er-fysiske';

/**
 * BASELINE, målt 2026-08-04: fire obligatoriske kontrakter uten forbruker,
 * i tillegg til de to eierrapporterte over. Alle fire er bevegelsestokens som
 * kun nevnes i sin egen test — «ren intensjon», seks av ti bevegelsestokens.
 *
 * TALLET KAN BARE KRYMPE. DoD fase 3 ratsjer det til null, og null blir da
 * nytt låst gulv. Tar et token i bruk: slett linjen her OG senk tallet i
 * SAMME endring — ellers lyver registeret om hvor mye som gjenstår, og det er
 * nøyaktig slik `.hjm-synth` fikk stå i port 6 med null treff.
 */
const BASELINE_BRUDD: readonly string[] = [
  '--dw-m-handoff', // innhold byttes i samme ramme — ingen flate gjør det ennå
  '--dw-m-step', // steg → steg i Kle på; stepperen er ikke bygget (fase 4)
  '--dw-m-bow-out', // maskoten retter seg opp; bow-in brukes, bow-out ikke
  '--dw-m-atmo', // lyspoolens krysstoning ved skjermbytte (fase 3B)
];
const BASELINE = 4;

/**
 * Primitiver uten forbruker i dag. IKKE brudd — primitiver kan stå ubrukt.
 * Registeret finnes for å gjøre kartleggingens tall etterprøvbart: 12 tokens
 * uten forbruker = 2 eierrapporterte + 4 baseline + disse 6. Hver av dem er
 * navngitt, så ingen av dem kan forsvinne inn i et tall.
 *
 * Samme ratsjettregel: får en av dem en forbruker, slett linjen her.
 */
const UBRUKTE_PRIMITIVER: readonly string[] = [
  '--dw-accent-700', // = lys-modus' --dw-accent-verdi, navngitt rampetrinn
  '--dw-text-hero', // hero-temperaturen Fraunces-regelen henger på
  '--dw-font-data', // tabellsifre; 8 skjermer mangler tabular-nums (fase 3)
  '--dw-sh-broad', // avledning: bygger --dw-depth-hero / --dw-depth-raised
  '--dw-sh-broad-cta', // avledning: bygger --dw-depth-action
  '--dw-sh-contact-cta', // avledning: bygger --dw-depth-action
  /* AVSTANDSSKALAEN + STORRELSESMAALENE, fodt 2026-08-04 (DoD fase 2B:
     «ny skala fodes som primitiv»). De har null forbrukere FORDI ingenting
     er migrert enna — fase 3 er sveipen som gir dem forbrukere.
     Ratsjetten: far et trinn en forbruker, SLETT linjen her. Da kan lista
     bare krympe, og en skala som aldri ble tatt i bruk blir synlig i stedet
     for a ligge stille i tokenfilen. Skalaen er MALT, ikke valgt:
     tools/spacing-detektor.mjs, 2-punkt dekker 89,2 % mot 4-punktets 46,3 %. */
  '--dw-space-2',
  '--dw-space-4',
  '--dw-space-6',
  '--dw-space-8',
  '--dw-space-10',
  '--dw-space-12',
  '--dw-space-14',
  '--dw-space-16',
  '--dw-space-18',
  '--dw-space-20',
  '--dw-space-22',
  '--dw-space-24',
  '--dw-space-32',
  '--dw-size-touch', // trykkmaal-gulv 44px; handheves i dag kun som button{min-height}
  '--dw-size-cta', // referanse-CTA-ens hoyde; forbrukes naar Button ekstraheres
  '--dw-size-row', // radhoyde-gulv 62px; malt 3 steder, var prosa i doktrinen
];

/* ────────────────────────────────────────────────────────────────────────
   PARSING — kommentarer strippes FØRST, i alle tre stilflater.
   ──────────────────────────────────────────────────────────────────────── */

/** `/* *\/` finnes i både CSS, TS og CSS-i-template-literal. */
export function utenBlokkommentar(kilde: string): string {
  return kilde.replace(/\/\*[\s\S]*?\*\//gu, '');
}

/**
 * `//` til linjeslutt, men ALDRI inne i en streng — ellers spiser den
 * `'https://…'` og halve linjen med den. Skanner tegn for tegn og holder
 * styr på anførselstegn.
 */
export function utenLinjekommentar(kilde: string): string {
  return kilde
    .split('\n')
    .map((linje) => {
      let sitat: string | null = null;
      for (let i = 0; i < linje.length; i += 1) {
        const c = linje[i]!;
        if (sitat) {
          if (c === '\\') i += 1;
          else if (c === sitat) sitat = null;
        } else if (c === "'" || c === '"' || c === '`') {
          sitat = c;
        } else if (c === '/' && linje[i + 1] === '/') {
          return linje.slice(0, i);
        }
      }
      return linje;
    })
    .join('\n');
}

function renset(kilde: string, sti: string): string {
  const uten = utenBlokkommentar(kilde);
  // `//` er ikke en kommentar i CSS — der er `url(//host)` lovlig.
  return /\.(ts|tsx|js|jsx)$/u.test(sti) ? utenLinjekommentar(uten) : uten;
}

/**
 * Forbruk av et token. To former, begge ekte:
 *   var(--dw-x)        CSS-fil, CSS i <style>{`…`} og inline CSSProperties
 *   '--dw-x'           JS-siden: element.style.setProperty('--dw-x', …) og
 *                      style={{ ['--dw-x']: v }}. Ingen src-fil bruker denne
 *                      formen i dag; den er med fordi et token som TAS i bruk
 *                      slik ellers ville blitt meldt som brudd.
 */
const VAR_FORM = /var\(\s*(--dw-[a-z0-9-]+)/giu;
const STRENG_FORM = /['"`](--dw-[a-z0-9-]+)['"`]/giu;

export function forbrukteTokens(kilde: string, sti = 'x.css'): Set<string> {
  const ren = renset(kilde, sti);
  const ut = new Set<string>();
  for (const m of ren.matchAll(VAR_FORM)) ut.add(m[1]!);
  for (const m of ren.matchAll(STRENG_FORM)) ut.add(m[1]!);
  return ut;
}

function filer(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === 'node_modules') continue;
      filer(sti, ut);
    } else ut.push(sti);
  }
  return ut;
}

function relstil(sti: string): string {
  return relative(ROT, sti).split(sep).join('/');
}

/* ────────────────────────────────────────────────────────────────────────
   MÅLINGEN
   ──────────────────────────────────────────────────────────────────────── */

const TOKENKILDE = readFileSync(join(ROT, TOKENFIL), 'utf8');
const TOKENKILDE_REN = utenBlokkommentar(TOKENKILDE);

/** Deklarasjonene. Verdien beholdes for å kunne følge avledningskjeden. */
const DEKLARERT = new Map<string, string[]>();
for (const m of TOKENKILDE_REN.matchAll(/(--dw-[a-z0-9-]+)\s*:\s*([^;]+);/giu)) {
  const navn = m[1]!;
  if (!DEKLARERT.has(navn)) DEKLARERT.set(navn, []);
  DEKLARERT.get(navn)!.push(m[2]!.trim());
}

/** token → tokens som refererer det INNE i tokenfila (aldri forbruk). */
const AVLEDET_AV = new Map<string, string[]>();
for (const [navn, verdier] of DEKLARERT) {
  for (const v of verdier) {
    for (const m of v.matchAll(VAR_FORM)) {
      const mål = m[1]!;
      if (!AVLEDET_AV.has(mål)) AVLEDET_AV.set(mål, []);
      if (!AVLEDET_AV.get(mål)!.includes(navn)) AVLEDET_AV.get(mål)!.push(navn);
    }
  }
}

/** Skopet: all src-kode utenom tester og utenom tokenfila selv. */
const SKOP = filer(join(ROT, 'src')).filter((sti) => {
  const r = relstil(sti);
  if (r === TOKENFIL) return false;
  if (r.includes('/__tests__/')) return false;
  if (/\.(test|spec)\.[jt]sx?$/u.test(r)) return false;
  return /\.(css|ts|tsx|js|jsx)$/u.test(r);
});

/** token → filer i src som faktisk forbruker det. */
const FORBRUKERE = new Map<string, string[]>();
for (const sti of SKOP) {
  const r = relstil(sti);
  for (const t of forbrukteTokens(readFileSync(sti, 'utf8'), r)) {
    if (!FORBRUKERE.has(t)) FORBRUKERE.set(t, []);
    FORBRUKERE.get(t)!.push(r);
  }
}

function familie(token: string): string {
  return token.replace(/^--dw-/u, '').split('-')[0]!;
}

function klasse(token: string): Klasse | 'ukjent' {
  const f = familie(token);
  if (f in OBLIGATORISK) return 'obligatorisk-kontrakt';
  if (f in AVLEDNINGSPRIMITIV) return 'avledningsprimitiv';
  if (f in PRIMITIV) return 'primitiv';
  return 'ukjent';
}

const utenForbruker = (t: string): boolean => (FORBRUKERE.get(t) ?? []).length === 0;

const ALLE_TOKENS = [...DEKLARERT.keys()].sort();
const UTEN_FORBRUKER = ALLE_TOKENS.filter(utenForbruker);
const OBLIGATORISKE = ALLE_TOKENS.filter((t) => klasse(t) === 'obligatorisk-kontrakt');
const BRUDD = OBLIGATORISKE.filter(utenForbruker);
const BRUDD_MOT_GULV = BRUDD.filter((t) => !EIERRAPPORTERT.includes(t));

/* ────────────────────────────────────────────────────────────────────────
   1. IKKE-VAKUØSITET — porten beviser at den fant MÅLENE SINE.
   ──────────────────────────────────────────────────────────────────────── */

/** Filer som MÅ være i skopet. Faller globben, faller disse først. */
const ANKERFILER = [
  'src/components/hjem/hjem-monter.css', // referanseskjermen
  'src/components/BottomTabBar.css',
  'src/screens/UkeScreen.css', // eneste skjerm med egen CSS-fil
  'src/styles/design-tokens.css', // legacy-aliaslaget
  'src/App.tsx',
  'src/screens/InnstillingerScreen.tsx', // 6230 linjer, 190 CSSProperties
  'src/components/instrument/VerticalGauge.tsx', // CSS i template-literal
] as const;

/** Tokens som MÅ finnes som deklarasjon. Endres tokenfila, sier disse fra. */
const ANKERTOKENS = [
  '--dw-m-feedback', '--dw-m-state', '--dw-m-handoff', '--dw-m-push',
  '--dw-m-push-back', '--dw-m-step', '--dw-m-bow-in', '--dw-m-bow-out',
  '--dw-m-marker', '--dw-m-atmo', '--dw-ease',
  '--dw-depth-hero', '--dw-depth-raised', '--dw-depth-action', '--dw-depth-selected',
  '--dw-lys-vinkel', '--dw-kant-key', '--dw-kant-fill',
  '--dw-focus', '--dw-focus-panel',
  '--dw-plate', '--dw-plate-kant',
  '--dw-tabbar-clearance',
] as const;

/**
 * POSITIV KONTROLL. Disse er beviselig forbrukt, og de er valgt med vilje:
 * lys-vinkel/kant-trioen er NØYAKTIG de tre lærdomsnotatet navngir som
 * «refereres kun av testen som sjekker at de finnes» — de ble forbrukt
 * 2026-08-04. Ser ikke detektoren dem, ser den ingenting.
 */
const MÅ_VÆRE_FORBRUKT = [
  '--dw-lys-vinkel', '--dw-kant-key', '--dw-kant-fill',
  '--dw-depth-hero', '--dw-depth-action',
  '--dw-m-feedback', '--dw-m-bow-in', '--dw-m-marker', '--dw-ease',
  '--dw-tabbar-clearance', '--dw-focus-panel', '--dw-plate',
] as const;

describe('ikke-vakuøsitet — porten fant målene sine', () => {
  it('skopet inneholder de navngitte ankerfilene', () => {
    const sett = new Set(SKOP.map(relstil));
    const mangler = ANKERFILER.filter((f) => !sett.has(f));
    expect(
      mangler,
      `disse filene er ikke i skopet — globben peker feil sted:\n  ${mangler.join('\n  ')}`,
    ).toEqual([]);
    expect(SKOP.length, 'for få filer skannet — skopet har kollapset').toBeGreaterThanOrEqual(200);
  });

  it('tokenfila ga de navngitte ankertokenene', () => {
    const mangler = ANKERTOKENS.filter((t) => !DEKLARERT.has(t));
    expect(
      mangler,
      `disse er ikke funnet som deklarasjon i ${TOKENFIL} — parseren eller fila har endret seg:\n  ${mangler.join('\n  ')}`,
    ).toEqual([]);
    expect(DEKLARERT.size, 'for få --dw-*-deklarasjoner funnet').toBeGreaterThanOrEqual(70);
  });

  it('KLASSIFISERINGEN ER TOTAL — ingen familie slipper inn uklassifisert', () => {
    // Uten denne kan et nytt token snike seg inn og bli verken målt eller
    // fritatt. En port som ikke vet at et token finnes, er taus om det.
    const ukjente = ALLE_TOKENS.filter((t) => klasse(t) === 'ukjent');
    expect(
      ukjente.map((t) => `${t} (familie «${familie(t)}»)`),
      'nye tokenfamilier uten klasse. Legg familien i OBLIGATORISK, ' +
      'AVLEDNINGSPRIMITIV eller PRIMITIV — klassifisering er en beslutning, ikke en default.',
    ).toEqual([]);
  });

  it('POSITIV KONTROLL: kjente forbrukte tokens blir faktisk sett som forbrukt', () => {
    const tapt = MÅ_VÆRE_FORBRUKT.filter(utenForbruker);
    expect(
      tapt,
      'detektoren finner ikke forbruk som beviselig finnes. Enten er skopet ' +
      'kuttet, eller så leser regexet feil form:\n  ' + tapt.join('\n  '),
    ).toEqual([]);
  });

  it('NEGATIV KONTROLL: kommentarer teller ikke som forbruk', () => {
    /* Den levende fella: BottomTabBar.css nevner var(--dw-tabbar-clearance)
       KUN inne i sin egen filhode-kommentar. Uten stripping ville filen stått
       som forbruker av et token den ikke rører — nøyaktig samme feil som da
       et søk etter «@media» traff ordet i filens egen prosa og kuttet skopet. */
    const sti = 'src/components/BottomTabBar.css';
    const raa = readFileSync(join(ROT, sti), 'utf8');
    expect(
      raa.includes('var(--dw-tabbar-clearance'),
      `FIKSTURET ER BORTE: ${sti} nevner ikke lenger var(--dw-tabbar-clearance) i ` +
      'kommentar. Finn en annen fil med samme egenskap, ellers slutter denne ' +
      'kontrollen å bevise noe.',
    ).toBe(true);
    expect(
      raa.replace(/\/\*[\s\S]*?\*\//gu, '').includes('var(--dw-tabbar-clearance'),
      `FIKSTURET ER ENDRET: ${sti} forbruker nå tokenet på ekte. Velg et nytt fikstur.`,
    ).toBe(false);
    expect(
      FORBRUKERE.get('--dw-tabbar-clearance') ?? [],
      'kommentarstrippingen er borte — en kommentar telles som forbruk',
    ).not.toContain(sti);
  });

  it('rapporterer filer skannet, mål funnet og brudd', () => {
    const fordeling = new Map<string, number>();
    for (const t of ALLE_TOKENS) fordeling.set(klasse(t), (fordeling.get(klasse(t)) ?? 0) + 1);
    const kunAlias = ALLE_TOKENS.filter(
      (t) => (FORBRUKERE.get(t) ?? []).length === 1
        && FORBRUKERE.get(t)![0] === 'src/styles/design-tokens.css',
    );
    console.log(
      `\n  forbruker-klasser: ${SKOP.length} filer skannet · ${DEKLARERT.size} --dw-*-deklarasjoner` +
      `\n    klasser: ${[...fordeling].map(([k, n]) => `${k} ${n}`).join(' · ')}` +
      `\n    uten forbruker i src: ${UTEN_FORBRUKER.length}` +
      ` (${BRUDD.length} obligatoriske = ${EIERRAPPORTERT.length} eierrapportert + ${BRUDD_MOT_GULV.length} mot gulvet ${BASELINE}` +
      `, ${UTEN_FORBRUKER.length - BRUDD.length} primitiver som får stå ubrukt)` +
      `\n    EIERRAPPORTERT (utenfor gulvet): ${EIERRAPPORTERT.join(', ')}` +
      `\n    mot gulvet: ${BRUDD_MOT_GULV.join(', ') || '—'}` +
      `\n    kun forbrukt av legacy-aliaslaget: ${kunAlias.join(', ') || '—'}\n`,
    );
    expect(DEKLARERT.size).toBeGreaterThan(0);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   2. SELVTEST AV DETEKTOREN — den ser det den lover å se.
   ──────────────────────────────────────────────────────────────────────── */
describe('detektoren selv', () => {
  it('ser var() i CSS, i template-literal-CSS og i inline CSSProperties', () => {
    expect([...forbrukteTokens('.a { color: var(--dw-ink-hi); }')]).toEqual(['--dw-ink-hi']);
    expect([...forbrukteTokens('const s = `.a { box-shadow: var( --dw-depth-hero ); }`', 'a.tsx')])
      .toEqual(['--dw-depth-hero']);
    expect([...forbrukteTokens("style={{ transition: 'opacity var(--dw-m-handoff)' }}", 'a.tsx')])
      .toEqual(['--dw-m-handoff']);
  });

  it('ser strengformen — setProperty og CSS-variabel som nøkkel', () => {
    expect([...forbrukteTokens("el.style.setProperty('--dw-m-atmo', v)", 'a.ts')])
      .toEqual(['--dw-m-atmo']);
    expect([...forbrukteTokens('style={{ ["--dw-plate"]: c }}', 'a.tsx')]).toEqual(['--dw-plate']);
  });

  it('ser IKKE et token som bare står i en blokkommentar', () => {
    expect([...forbrukteTokens('/* bruker var(--dw-m-push) en gang */ .a { color: red; }')])
      .toEqual([]);
  });

  it('ser IKKE et token som bare står i en linjekommentar i TS', () => {
    expect([...forbrukteTokens('// samme var(--dw-m-step) som i proofen\nconst a = 1;', 'a.ts')])
      .toEqual([]);
  });

  it('spiser ikke kode når // står inne i en streng', () => {
    expect([...forbrukteTokens("const u = 'https://x'; const s = 'var(--dw-focus)';", 'a.ts')])
      .toEqual(['--dw-focus']);
  });

  it('teller ikke en DEKLARASJON som forbruk', () => {
    // «--dw-m-push: 340ms» er tokenet som fødes, ikke noen som bruker det.
    expect([...forbrukteTokens('.x { --dw-m-push: 340ms; }')]).toEqual([]);
  });

  it('familien leses av første ledd, ikke av vilkårlig understreng', () => {
    expect(familie('--dw-m-push-back')).toBe('m');
    expect(familie('--dw-plate-kant')).toBe('plate'); // ikke «kant»
    expect(familie('--dw-ink-panel-hi')).toBe('ink'); // ikke «panel»
    expect(familie('--dw-sh-broad-cta')).toBe('sh');
  });
});

/* ────────────────────────────────────────────────────────────────────────
   3. REGELEN — obligatoriske kontrakter MÅ ha en forbruker.
   ──────────────────────────────────────────────────────────────────────── */
describe('obligatoriske kontrakter har forbrukere', () => {
  it('ingen NY obligatorisk kontrakt uten forbruker (baseline-ratsjett)', () => {
    const nye = BRUDD_MOT_GULV.filter((t) => !BASELINE_BRUDD.includes(t));
    expect(
      nye.map((t) => `${t} — familie «${familie(t)}»: ${OBLIGATORISK[familie(t)]}`),
      'Ny kontrakt uten forbruker i src. Det er nøyaktig feilklassen fra ' +
      'lærdomsnotatet: kontrakten er skrevet, unit-testet og aldri rendret. ' +
      'Enten forbruk tokenet, eller klassifiser familien som primitiv med en begrunnelse.',
    ).toEqual([]);
  });

  it('gulvet holder og kan bare krympe', () => {
    expect(
      BRUDD_MOT_GULV.length,
      `${BRUDD_MOT_GULV.length} obligatoriske kontrakter uten forbruker mot et gulv på ${BASELINE}: ` +
      BRUDD_MOT_GULV.join(', '),
    ).toBeLessThanOrEqual(BASELINE);
    expect(BASELINE_BRUDD.length, 'BASELINE og BASELINE_BRUDD er ute av takt').toBe(BASELINE);
  });

  it('REGISTERET LYVER IKKE: hver baseline-oppføring er fortsatt et ekte brudd', () => {
    /* Den viktigste enkeltassertionen i fila. En detektor som begynner å
       MATCHE FOR MYE — tester som slipper inn i skopet, kommentarstrippingen
       som ryker, tokenfila som teller seg selv — vil melde 0 brudd og se
       fantastisk ut. Da ryker denne i stedet. */
    const nedbetalt = BASELINE_BRUDD.filter((t) => !utenForbruker(t));
    expect(
      nedbetalt.map((t) => `${t} → ${(FORBRUKERE.get(t) ?? []).join(', ')}`),
      'Disse har fått forbrukere. Slett linjen fra BASELINE_BRUDD og senk ' +
      'BASELINE i SAMME endring, så registeret aldri lyver om restgjelden.',
    ).toEqual([]);
    const ukjent = BASELINE_BRUDD.filter((t) => !DEKLARERT.has(t));
    expect(ukjent, 'baseline peker på tokens som ikke finnes lenger').toEqual([]);
  });

  it('registeret over ubrukte PRIMITIVER lyver heller ikke', () => {
    const nedbetalt = UBRUKTE_PRIMITIVER.filter((t) => !utenForbruker(t));
    expect(
      nedbetalt.map((t) => `${t} → ${(FORBRUKERE.get(t) ?? []).join(', ')}`),
      'Disse primitivene har fått forbrukere — slett linjen fra UBRUKTE_PRIMITIVER.',
    ).toEqual([]);
    // Reconciliering mot kartleggingen: 12 = 2 + 4 + 6, hver enkelt navngitt.
    const navngitt = new Set([...EIERRAPPORTERT, ...BASELINE_BRUDD, ...UBRUKTE_PRIMITIVER]);
    const unavngitt = UTEN_FORBRUKER.filter((t) => !navngitt.has(t));
    expect(
      unavngitt.map((t) => `${t} (${klasse(t)})`),
      'Tokens uten forbruker som ikke står i noe register. Primitiver får stå ' +
      'ubrukt, men de skal være SYNLIGE — ellers vokser en usett rest.',
    ).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   4. EIERRAPPORTERTE FUNN — aldri baselines, aldri usynlige.
   ──────────────────────────────────────────────────────────────────────── */
type Vedtak = { id: string; status: string; merknad?: string };
const REGISTER = JSON.parse(
  readFileSync(join(ROT, 'docs/design-notes/vedtak.json'), 'utf8'),
) as { vedtak: Vedtak[] };

describe('eierrapporterte funn kan aldri baselines', () => {
  it('de eierrapporterte tokenene står ikke i noe gulv', () => {
    const smuglet = EIERRAPPORTERT.filter(
      (t) => BASELINE_BRUDD.includes(t) || UBRUKTE_PRIMITIVER.includes(t),
    );
    expect(
      smuglet,
      'et eierrapportert funn er flyttet inn i et baseline-register. Det er ' +
      'akkurat det som ikke er lov — eieren meldte dette, ikke instrumentene.',
    ).toEqual([]);
    expect(EIERRAPPORTERT.every((t) => DEKLARERT.has(t)), 'unntaket peker på tokens som ikke finnes').toBe(true);
  });

  it(`er bundet til vedtak «${EIERRAPPORTERT_VEDTAK}» og frigjøres først når det låses`, () => {
    const v = REGISTER.vedtak.find((x) => x.id === EIERRAPPORTERT_VEDTAK);
    expect(v, `vedtak «${EIERRAPPORTERT_VEDTAK}» finnes ikke i registeret`).toBeDefined();
    const uten = EIERRAPPORTERT.filter(utenForbruker);
    if (v!.status === 'laast') {
      // Låst vedtak + null forbrukere = nøyaktig løgnen dybdekontrakten fortalte.
      expect(
        uten,
        `vedtak «${EIERRAPPORTERT_VEDTAK}» er LÅST, men disse har fortsatt null ` +
        'forbrukere i src. Appen bytter da fortsatt skjerm uten bevegelse:\n  ' + uten.join('\n  '),
      ).toEqual([]);
    } else {
      expect(
        uten,
        `vedtaket står som «${v!.status}» mens tokenene er tatt i bruk — sett det til «laast».`,
      ).toEqual([...EIERRAPPORTERT]);
      console.log(
        `\n  PERMANENT BRUDD (eierrapportert, utenfor gulvet): ${EIERRAPPORTERT.join(', ')}` +
        `\n    vedtak «${EIERRAPPORTERT_VEDTAK}» = ${v!.status} · ratsjes i DoD fase 3B\n`,
      );
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────
   5. AVLEDNINGSKJEDEN — et --dw-sh-* uten egen forbruker må mate noe forbrukt.
   ──────────────────────────────────────────────────────────────────────── */
describe('avledningsprimitiver er ikke foreldreløse', () => {
  const avledede = ALLE_TOKENS.filter((t) => klasse(t) === 'avledningsprimitiv');

  it('IKKE-VAKUØSITET: det finnes avledningsprimitiver å måle', () => {
    expect(avledede.length, 'ingen avledningsprimitiver funnet — regelen måler ingenting')
      .toBeGreaterThanOrEqual(5);
  });

  it('hver av dem har enten egen forbruker eller mater en forbrukt kontrakt', () => {
    const foreldrelose: string[] = [];
    for (const t of avledede) {
      if (!utenForbruker(t)) continue;
      const foreldre = AVLEDET_AV.get(t) ?? [];
      const levende = foreldre.filter((p) => !utenForbruker(p));
      if (levende.length === 0) {
        foreldrelose.push(
          `${t} — 0 forbrukere i src, bygget inn i [${foreldre.join(', ') || 'ingenting'}] som selv er ubrukt`,
        );
      }
    }
    expect(
      foreldrelose,
      'foreldreløse avledningsprimitiver. Et token som verken brukes direkte ' +
      'eller bygger noe som brukes, er død vekt som ser levende ut for et ' +
      '«finnes i en fil»-søk:\n  ' + foreldrelose.join('\n  '),
    ).toEqual([]);
  });

  it('tokenfil-internt forbruk telles ALDRI som forbruk', () => {
    // --dw-sh-broad refereres 2 ganger inne i tokenfila og 0 ganger i src.
    // Ser porten den som forbrukt, er hele fila vakuøs.
    expect(AVLEDET_AV.get('--dw-sh-broad') ?? [], 'kjeden --dw-sh-broad → --dw-depth-* er borte')
      .toContain('--dw-depth-hero');
    expect(FORBRUKERE.get('--dw-sh-broad') ?? []).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   6. RESERVERT / DEPRECATED — de eneste per-token-listene.
   Begge er TOMME i dag. Reglene står klare så listene ikke kan råtne den
   dagen de tas i bruk; de påstår ikke å ha målt noe nå.
   ──────────────────────────────────────────────────────────────────────── */
describe('reservert- og deprecated-listene råtner ikke', () => {
  it('hvert oppført token finnes fortsatt i tokenfila', () => {
    const spøkelser = [...RESERVERT, ...DEPRECATED].filter((t) => !DEKLARERT.has(t));
    expect(spøkelser, 'listene peker på tokens som er slettet').toEqual([]);
  });

  it('et deprecated token har ingen forbrukere igjen', () => {
    const lever = DEPRECATED.filter((t) => !utenForbruker(t));
    expect(
      lever.map((t) => `${t} → ${(FORBRUKERE.get(t) ?? []).join(', ')}`),
      'Et token med forbrukere er ikke utfaset, det er i bruk. Enten flytt ' +
      'forbrukerne, eller ta tokenet av deprecated-lista.',
    ).toEqual([]);
  });

  it('reservert og deprecated overlapper ikke, og er ikke obligatoriske', () => {
    const begge = RESERVERT.filter((t) => DEPRECATED.includes(t));
    expect(begge, 'et token kan ikke være både reservert og utfaset').toEqual([]);
    const motstrid = [...RESERVERT, ...DEPRECATED].filter((t) => klasse(t) === 'obligatorisk-kontrakt');
    expect(motstrid, 'et obligatorisk kontrakttoken kan ikke samtidig være reservert/utfaset').toEqual([]);
  });
});
