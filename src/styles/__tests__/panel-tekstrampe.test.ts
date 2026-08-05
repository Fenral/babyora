/**
 * PANEL-TEKSTRAMPEN — espresso-blekk hører ikke hjemme på petrol.
 *
 * Bakgrunn: petrol-instrumentet (`.hjm-panel`, `.hjm-strip`,
 * `.planlegg-weather`) er TEMA-KONSTANT. Espresso-rampen (`--dw-ink-hi/mid/
 * low`), streken (`--dw-hairline`) og semantikkfargene FLIPPER med temaet.
 * En tema-flippende farge på en tema-konstant flate er per definisjon riktig
 * i høyden ett av temaene. Impeccable målte 1,78–2,88:1 i lys modus — og
 * alle funnene lå i tilstandene som bærer dårlige nyheter.
 *
 * Sol-blokker 4 (presiseringen denne porten er skrevet etter): ordinære
 * instrumentverdier i panel-skopet får ikke bruke espresso-rampen, hairline
 * eller semantiske farger — MEN eksplisitte statuskomponenter (stale-badge,
 * offline, feil) står på en NAVNGITT allowlist og SKAL bruke semantikk.
 * Allowlisten gir rett til SEMANTIKK, aldri til espresso-rampen: en
 * stale-badge som bruker `--dw-ink-mid` er brudd like fullt.
 *
 * ── HVORFOR SKOPET UTLEDES AV JSX, IKKE AV SELEKTORTEKST ─────────────────
 * Port nr. 7 i lærdomstabellen (`hjem-monter.p8-light-mode.test.ts`) greper
 * `#rrggbb`-litteraler og er derfor strukturelt blind for nøyaktig de
 * `var()`-baserte feilene som står igjen. Den nærliggende reparasjonen —
 * «finn reglene som setter en petrol-flate som background, og ta deres
 * etterkommere» — ble prøvd og MÅLT, og den er også feil:
 *   · `.hjm-skip` og `.hjm-stale-badge` er DOM-etterkommere av panelet,
 *     ikke selektor-etterkommere. De faller ut.
 *   · `.planlegg-forecast__*` lever BÅDE på canvas og inne i petrol. Tar man
 *     dem på selektornavn, flagges canvas-varianten falskt.
 * Derfor: skopet leses ut av JSX-treet. Hver `className="hjm-panel" |
 * "hjm-strip" | "planlegg-weather"` er en PANELROT; alt som rendres inne i
 * rotens JSX-undertre er panel-skop.
 *
 * ── SKOPET KRYSSER FILGRENSER (retting etter angrep 2026-08-04) ──────────
 * Første utkast leste bare statiske `className="…"` I SAMME FIL. Angrepet
 * viste hva det koster: TO av fem panelrøtter var tomme skall, fordi de
 * delegerer alt innhold til en barnekomponent i en annen fil.
 *   · `FinnAntrekkScreen.tsx` sin `.hjm-panel` inneholder KUN `<VerticalGauge>`
 *     → hele instrumentet bor i `src/components/instrument/vertical-gauge.css`.
 *     Porten bestod dermed på FRAVÆR: `.fa-gauge-label` kunne byttes fra
 *     `--dw-ink-panel-mid` (tema-konstant #C6CFC4, 7,63:1) til `--dw-ink-mid`
 *     (1,99:1 i lys modus, altså nøyaktig bruddklassen headeren navner) uten
 *     at ett eneste assert rørte seg.
 *   · `UkeScreen.tsx` sin `.planlegg-weather` delegerer prognosen til
 *     `<ForecastDisclosure>` → `.planlegg-forecast__*` i `UkeScreen.css`.
 *     Både et nytt `--dw-ink-low` DER, og SLETTING av overstyringen som i dag
 *     holder espresso unna petrol, passerte grønt.
 * Nå følges undertreet på tvers av filer: store-forbokstav-tagger slås opp
 * via importsetningen (eller en lokal funksjon i samme fil), komponentens
 * egen funksjonskropp tas inn i skopet, og det gjentas rekursivt med et
 * besøkt-sett mot sykluser. `{children}` inne i et panel-undertre løses ved
 * å følge KALLSTEDENE til den omsluttende komponenten. Klarer porten ikke å
 * følge noe, havner det i `UFULGTE` og gjør porten RØD — blindhet skal aldri
 * kunne passere som grønt.
 *
 * ── DELT vs EKSKLUSIV ────────────────────────────────────────────────────
 * Klasser som ALDRI rendres utenfor et panel er «eksklusive» — enhver
 * CSS-regel som nevner dem er panel-scoped. Klasser som rendres begge steder
 * er «delte» — de teller kun når selektoren OGSÅ nevner en panelrot.
 * ÆRLIG MÅLING: `DELTE` er tom i dag (se console.log fra kjøringen). Grenen
 * er altså et VERN FOR MORGENDAGEN — den dagen `<ForecastDisclosure>` eller
 * `<VerticalGauge>` også monteres på espresso-canvas — ikke forklaringen på
 * at porten har null falske positive i dag. Det er samme-komponent-
 * begrensningen som gir null falske positive nå. Byggerens opprinnelige
 * prosa ga porten kreditt for et vern den ikke utøvde; dette er rettelsen.
 *
 * ── VERN (kaskade-overstyring) ───────────────────────────────────────────
 * `.planlegg-forecast__toggle { color: var(--dw-ink-hi) }` er espresso — men
 * inne i petrol overstyres den av `.planlegg-weather .planlegg-forecast__toggle
 * { color: var(--dw-ink-panel-hi) }`. Basen er altså ikke et LEVENDE brudd,
 * den er en canvas-variant med et vern. Porten teller derfor ikke basen —
 * men den KREVER at vernet finnes, er navngitt i `FORVENTEDE_VERN`, og at
 * det faktisk vinner kaskaden. Fjernes vernet blir porten rød to ganger:
 * bruddtallet stiger OG det navngitte vernet mangler.
 *
 * ── HEVEDE ØYER ──────────────────────────────────────────────────────────
 * `.fa-gauge-step` bruker `--dw-ink-hi` + `--dw-hairline`, men setter SIN
 * EGEN flate `background: var(--dw-raised)` — en flate som flipper med temaet
 * akkurat som blekket. Doktrinens premiss (flippende blekk på tema-KONSTANT
 * flate) gjelder da ikke. Unntaket er MÅLT og BUNDET til premisset sitt:
 * forsvinner bakgrunnen, forsvinner unntaket. Se `HEVEDE_ØYER`.
 *
 * ── IKKE-VAKUØSITET ──────────────────────────────────────────────────────
 * Porten beviser at den fant MÅLENE SINE, ikke bare at skopet er stort:
 *   1. hver forventede panelrot-fil er faktisk funnet
 *   2. hver klasse i en NAVNGITT forventningsliste er faktisk i skopet
 *      (inkludert de som bare nås ved å krysse en filgrense)
 *   3. hver skopklasse har faktisk minst én CSS-regel (ellers er porten
 *      blind akkurat der)
 *   4. hvert forbudt token er faktisk deklarert i tokenfilen (en omdøping
 *      skal ikke tømme forbudet i stillhet)
 *   5. hver allowlistet klasse er faktisk i skopet (en allowlist som navner
 *      noe som ikke rendres, er død)
 *   6. hver `style={ident}` og hver dynamisk `className={…}` lar seg slå opp
 *   7. DET OMVENDTE: hver panelrot bidrar med minst `MIN_KLASSER_PER_ROT`
 *      egne skopklasser, og ingen barnekomponent/`{children}` er ufulgt.
 *      Uten (7) kan et helt panel falle ut av målingen i stillhet — som det
 *      gjorde til og med 2026-08-04.
 *   8. hvert navngitt vern og hvert hevet øy er faktisk BRUKT — et register
 *      som ikke fritar noe er dødt og skal fjernes, ikke stå og se ut som
 *      et vern.
 * KOMMENTARER STRIPPES FØRST i både CSS og TSX. Fellen er dokumentert: et
 * søk etter `@media` traff ordet inne i filens EGEN kommentar og kuttet
 * skopet før målene. Strippingen erstatter med mellomrom, så både
 * linjenumre og tegnposisjoner står urørt.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROT = process.cwd();

/* ══════════════════════ REGISTRE ══════════════════════ */

/**
 * BASELINE — dagens antall brudd som GULV. Porten feiler ved ØKNING **og**
 * ved at gulvet ikke er senket etter en retting (se ratsj-testen).
 *
 * DETTE TALLET KAN BARE KRYMPE. Fase 3 ratsjer det til null, og null blir
 * deretter nytt låst gulv. Å heve det er å vedta at panelet skal ha flere
 * tema-flippende farger enn i dag — det er et eiervedtak, ikke en
 * portendring.
 *
 * MÅLT 2026-08-04, ikke gjettet:
 *   hjem-monter.css:307  .hjm-stale-badge  border … var(--dw-hairline)
 *   hjem-monter.css:309  .hjm-stale-badge  color: var(--dw-ink-mid)   1,78–2,54:1 lys
 *   WeatherScene.tsx:151 .hjm-feels        inline color var(--dw-ink-mid)
 *
 * TALLET ER 3, IKKE 4. Kartleggingen førte `.hjm-skip { color:
 * var(--dw-ink-low) }` som fjerde brudd, målt til 1,53–2,18:1 «på petrol».
 * Den målingen er gjort mot en flate knappen aldri står på: `.hjm-skip` bor
 * i `ScanStatusBlock`, som `HjemMonter.tsx:722–731` rendrer i `.hjm-body` —
 * et SØSKEN av `.hjm-panel-slot`, på espresso-lerretet. Målt der den faktisk
 * står: 6,54:1 mørk og 6,59:1 lys. Å «rette» den til panel-rampen ville
 * gjort den 1,11–1,47:1. Derfor er den ute av skopet, og gulvet er 3.
 *
 * SKOPUTVIDELSEN 2026-08-04 (filgrenser) ENDRET IKKE TALLET — og det er en
 * MÅLING, ikke en antakelse. De fire nye deklarasjonene skopet fikk se er
 * hver for seg avgjort eksplisitt, ikke stilltiende sluppet inn i gulvet:
 *   vertical-gauge.css:232/234 `.fa-gauge-step`      → HEVEDE_ØYER (målt)
 *   UkeScreen.css:347 `.planlegg-forecast__toggle`   → FORVENTEDE_VERN
 *   UkeScreen.css:371 `.planlegg-forecast__rows li`  → FORVENTEDE_VERN
 * Fjernes ett av de vernene eller den hevede flaten, stiger tallet og porten
 * blir rød. Ingen av de fire kan altså «gjemme seg i baselinen».
 */
const BASELINE = 3;

/**
 * EIERRAPPORTERTE funn kan ALDRI baselines — de teller UTENFOR gulvet og
 * må være tomme. (Ingen av bruddene denne porten dekker er eierrapportert:
 * vedtakets kilde er Impeccable 2026-08-03. Mekanismen står her fordi et
 * eierfunn i panel-skopet skal legges HER, ikke i BASELINE.)
 */
const EIERRAPPORTERT: readonly string[] = [];

/** Klassene som gjør et element til en PANELROT (tema-konstant petrol). */
const PANELROTKLASSER = ['hjm-panel', 'hjm-strip', 'planlegg-weather'] as const;

/**
 * Forbudte tokens på panelet, med grunn til forbudet.
 *  espresso  — rampen for espresso-rommet; flipper med temaet
 *  linje     — hairline; flipper med temaet (rgba(241,233,218,.12) mørk,
 *              rgba(42,29,18,.14) lys) på en flate som IKKE flipper
 *  semantikk — flipper OG måler 1,73–2,88:1 mot værfamilien i lys tema
 */
const FORBUDT = {
  '--dw-ink-hi': 'espresso',
  '--dw-ink-mid': 'espresso',
  '--dw-ink-low': 'espresso',
  '--dw-hairline': 'linje',
  '--dw-success': 'semantikk',
  '--dw-warning': 'semantikk',
  '--dw-danger': 'semantikk',
} as const satisfies Readonly<Record<string, 'espresso' | 'linje' | 'semantikk'>>;

type Forbudsgrunn = (typeof FORBUDT)[keyof typeof FORBUDT];

/**
 * SEMANTIKK-ALLOWLISTEN (Sol-blokker 4). Eksplisitte statuskomponenter SKAL
 * bære semantikk — et varsel som ikke ser ut som et varsel, er ikke et
 * varsel. Listen er NAVNGITT, ikke et mønster: den skal være ubehagelig å
 * utvide.
 *
 * ALLOWLISTEN GIR RETT TIL SEMANTIKK, IKKE TIL ESPRESSO-RAMPEN. `.hjm-stale-
 * badge` står her og er brudd LIKEVEL, fordi den bruker `--dw-ink-mid` og
 * `--dw-hairline`. Fritaket gjelder heller aldri kontrastporten:
 * `.hjm-fresh[data-warn='true']` måler 2,02–2,88:1 i lys og skal opp — det
 * er `kontrastmatrise-ci` sin jobb, ikke denne.
 *
 * FRITAKET ER BUNDET TIL NØKKELSELEKTOREN, IKKE TIL SELEKTORTEKSTEN
 * (retting etter angrep 2026-08-04). Første utkast testet hele
 * selektorstrengen, så `.hjm-fresh, .hjm-cond { color: var(--dw-warning) }`
 * fritok BEGGE — det holdt å nevne en allowlistet klasse hvor som helst i
 * gruppa. Nå avgjøres hvert komma-separert ledd for seg, og bare leddets
 * NØKKELSELEKTOR (siste enkeltselektor) kan bære fritaket: `.hjm-fresh span`
 * fritar ikke `span`, og `.hjm-fresh, .hjm-cond` fritar ikke `.hjm-cond`.
 * Se regresjonsvakten «allowlist-fritaket kan ikke lekke gjennom …».
 */
const SEMANTIKK_ALLOWLIST = new Set(['hjm-fresh', 'hjm-stale-badge']);

/**
 * IKKE-VAKUØSITET 1: disse filene MÅ inneholde en panelrot. Faller en ut
 * (omdøpt komponent, fjernet klasse), er porten blind der og skal si fra —
 * ikke melde grønt på et mindre skop.
 */
const FORVENTEDE_PANELFILER = [
  'src/components/hjem/WeatherScene.tsx',
  'src/components/hjem/ScanOverlay.tsx',
  'src/components/hjem/WeatherStrip.tsx',
  'src/screens/UkeScreen.tsx',
  'src/screens/FinnAntrekkScreen.tsx',
] as const;

/**
 * IKKE-VAKUØSITET 2: disse klassene MÅ finnes i det utledede skopet. Dette
 * er porten som beviser at den fant målene sine — ikke «er skopet stort
 * nok», men «ligger tingene jeg er skrevet for å måle, faktisk i det».
 *
 * Blokken merket FILGRENSE nås KUN ved å følge en barnekomponent inn i en
 * annen fil. Faller filgrensekryssingen ut, forsvinner nøyaktig de klassene
 * og denne testen blir rød med navn på hver enkelt.
 */
const FORVENTEDE_SKOPKLASSER = [
  // WeatherScene
  'hjm-panel', 'hjm-loc', 'hjm-fresh', 'hjm-temp', 'hjm-wicon',
  'hjm-stale-badge', 'hjm-feels', 'hjm-cond', 'hjm-note', 'hjm-toggle',
  // ScanOverlay (panel-delen)
  'hjm-scanline', 'hjm-scan-row', 'hjm-scan-val', 'hjm-s-check', 'hjm-s-marker',
  // WeatherStrip
  'hjm-strip', 'hjm-s-temp', 'hjm-s-meta', 'hjm-s-adjust',
  // Planlegg sin petrol-modul
  'planlegg-weather', 'planlegg-weather__day', 'planlegg-weather__temp',
  'planlegg-weather__condition', 'planlegg-weather__meta',
  // FILGRENSE — FinnAntrekkScreen sin `.hjm-panel` → <VerticalGauge> →
  // src/components/instrument/vertical-gauge.css
  'fa-gauge', 'fa-gauge-label', 'fa-gauge-value', 'fa-gauge-end-label',
  'fa-gauge-track', 'fa-gauge-baseline', 'fa-gauge-step', 'fa-gauge-fill',
  // FILGRENSE — UkeScreen sin `.planlegg-weather` → <ForecastDisclosure> →
  // src/components/planning/ForecastDisclosure.tsx
  'planlegg-forecast', 'planlegg-forecast__toggle', 'planlegg-forecast__rows',
] as const;

/**
 * IKKE-VAKUØSITET 7: hver panelrot MÅ bidra med minst så mange EGNE
 * skopklasser. Tallet er målt, ikke gjettet: den smaleste roten er
 * `WeatherStrip` med 4 (`hjm-strip`, `hjm-s-temp`, `hjm-s-meta`,
 * `hjm-s-adjust`). FinnAntrekk-roten bidro med ÉN (`hjm-panel` selv) fram
 * til filgrensekryssingen kom på plass — det var nettopp den stillheten
 * angrepet utnyttet.
 */
const MIN_KLASSER_PER_ROT = 4;

/**
 * VERN — navngitte kaskade-overstyringer som gjør en canvas-base ufarlig
 * inne i petrol. Porten teller ikke basen så lenge vernet står, men KREVER
 * at hvert vern her faktisk finnes, vinner kaskaden og brukes.
 *
 * `base` og `vern` er selektorer slik de står i filen (normalisert
 * whitespace). `egenskap` er egenskapen basen setter.
 */
const FORVENTEDE_VERN = [
  {
    fil: 'src/screens/UkeScreen.css',
    base: '.planlegg-forecast__toggle',
    egenskap: 'color',
    vern: '.planlegg-weather .planlegg-forecast__toggle',
    hvorfor: 'basen er canvas-varianten (--dw-ink-hi); inne i petrol vinner '
      + '--dw-ink-panel-hi. Slettes vernet, står espresso rett på petrol (1,34:1 lys).',
  },
  {
    fil: 'src/screens/UkeScreen.css',
    base: '.planlegg-forecast__rows li',
    egenskap: 'border-top',
    vern: '.planlegg-weather .planlegg-forecast__rows li',
    hvorfor: 'basens hairline flipper; inne i petrol overstyres border-top-color '
      + 'av en tema-konstant rgba(241,233,218,.12).',
  },
] as const;

/**
 * HEVEDE ØYER — den ENE legitime grunnen til at espresso-rampen kan stå
 * inne i et panel-undertre: elementet setter SIN EGEN flate, og den flaten
 * FLIPPER med temaet akkurat som blekket gjør. Da er premisset for forbudet
 * («flippende blekk på tema-konstant flate») borte.
 *
 * Unntaket er BUNDET til premisset sitt, ikke bare påstått:
 *   · `flate` må være deklarert med MINST TO forskjellige verdier i
 *     design-tokens-v2.css (bevis på at den faktisk flipper). `--dw-panel`
 *     har én — derfor kan ingen skrive `--dw-panel` inn her og slippe unna.
 *   · regelen som bærer det forbudte tokenet må SELV deklarere
 *     `background`/`background-color: var(<flate>)`. Forsvinner bakgrunnen,
 *     forsvinner unntaket og deklarasjonen blir et brudd.
 *   · unntaket må faktisk BRUKES (ikke-vakuøsitet 8) — et dødt register er
 *     ikke et vern, det er pynt.
 *
 * MÅLT 2026-08-04 (WCAG-kontrast, samme formel som kontrastmatrise-ci):
 *   --dw-ink-hi på --dw-raised   13,26:1 mørk · 15,97:1 lys
 *   --dw-hairline på --dw-raised  1,39:1 mørk ·  1,32:1 lys (dekorativ strek)
 * KONTRAFAKTISK, hadde knappen IKKE hatt egen flate og stått rett på petrol:
 *   --dw-ink-hi på --dw-panel    10,13:1 mørk ·  1,34:1 LYS  ← nettopp bruddet
 * Det er hele forskjellen unntaket hviler på, og den er bundet til at
 * `background: var(--dw-raised)` faktisk står der.
 */
const HEVEDE_ØYER = [
  {
    klasse: 'fa-gauge-step',
    flate: '--dw-raised',
    fil: 'src/components/instrument/vertical-gauge.css',
    hvorfor: '+/- finsteg-knapp: egen hevet flate (--dw-raised) som flipper med '
      + 'temaet sammen med blekket. 13,26:1 mørk / 15,97:1 lys. Uten egen flate: 1,34:1 lys.',
  },
] as const;

/**
 * Klasser som rendres i panel-skopet, men bevisst IKKE har noen CSS-regel.
 * Ikke-vakuøsitet 3 krever ellers regel for hver skopklasse — den regelen
 * finnes for at porten ikke skal være blind, ikke for å tvinge fram tom CSS.
 * Hver oppføring må faktisk være i skopet (ellers er den død).
 */
const KLASSER_UTEN_REGEL_VEDTATT = [
  {
    klasse: 'fa-gauge-fill--thermal',
    hvorfor: 'VerticalGauge.tsx: thermal-varianten har ingen CSS — gradienten '
      + 'regnes per verdi i gauge-material.ts og settes inline. Klassen finnes '
      + 'kun som krok/markør (se vertical-gauge.css sin egen kommentar om at '
      + '«No extra class rules needed here»).',
  },
] as const;

/* ══════════════════════ VERKTØY ══════════════════════ */

/** Erstatter kommentarer med mellomrom — linjenumre OG tegnposisjoner står. */
function stripKommentarer(kilde: string): string {
  const blanke = (m: string): string => m.replace(/[^\n]/gu, ' ');
  return kilde
    .replace(/\/\*[\s\S]*?\*\//gu, blanke) // dekker også {/* … */} i JSX
    .replace(/^([ \t]*)\/\/[^\n]*/gmu, blanke);
}

function linjeAv(kilde: string, abs: number): number {
  let n = 1;
  for (let i = 0; i < abs && i < kilde.length; i += 1) if (kilde[i] === '\n') n += 1;
  return n;
}

function kort(sti: string): string {
  return relative(ROT, sti).replace(/\\/gu, '/');
}

function filerUnder(dir: string, endelser: readonly string[], ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === 'node_modules' || navn === '__tests__') continue;
      filerUnder(sti, endelser, ut);
    } else if (endelser.some((e) => navn.endsWith(e))) {
      ut.push(sti);
    }
  }
  return ut;
}

/** Alle forbudte tokens i en tekstbit, med posisjon. */
function forbudteTreff(tekst: string): { token: string; grunn: Forbudsgrunn; rel: number }[] {
  const ut: { token: string; grunn: Forbudsgrunn; rel: number }[] = [];
  for (const [token, grunn] of Object.entries(FORBUDT) as [string, Forbudsgrunn][]) {
    // Ordgrense bakover er unødvendig (alle starter med --dw-ink/--dw-h/…),
    // men FRAMOVER er den kritisk: uten den treffer --dw-ink-mid ingenting,
    // mens --dw-ink-hi ville truffet et hypotetisk --dw-ink-hi-2.
    const re = new RegExp(`${token}(?![\\w-])`, 'gu');
    for (let m = re.exec(tekst); m !== null; m = re.exec(tekst)) {
      ut.push({ token, grunn, rel: m.index });
    }
  }
  return ut;
}

/** Balansert `{ … }` fra og med posisjonen til første `{`. */
function balansert(kilde: string, fra: number): string {
  let dybde = 0;
  for (let i = fra; i < kilde.length; i += 1) {
    if (kilde[i] === '{') dybde += 1;
    else if (kilde[i] === '}') {
      dybde -= 1;
      if (dybde === 0) return kilde.slice(fra, i + 1);
    }
  }
  return kilde.slice(fra);
}

/** Indeks til `)` som lukker parentesen som starter på `fra`. */
function balansertParen(kilde: string, fra: number): number {
  let dybde = 0;
  for (let i = fra; i < kilde.length; i += 1) {
    if (kilde[i] === '(') dybde += 1;
    else if (kilde[i] === ')') {
      dybde -= 1;
      if (dybde === 0) return i;
    }
  }
  return -1;
}

/** Slutten på en åpningstagg — første `>` som ikke er halen av `=>`. */
function slutten(kilde: string, fra: number): number {
  for (let i = fra; i < kilde.length; i += 1) {
    if (kilde[i] === '>' && kilde[i - 1] !== '=') return i;
  }
  return -1;
}

const TSX_FILER = filerUnder(join(ROT, 'src'), ['.tsx']).filter((f) => !f.includes('.test.'));
const CSS_FILER = filerUnder(join(ROT, 'src'), ['.css']);

const TSX_KILDE = new Map<string, string>(
  TSX_FILER.map((f) => [f, stripKommentarer(readFileSync(f, 'utf8'))]),
);

/* ══════════════════ 1. FILGRENSEKRYSSENDE SKOPUTLEDNING ══════════════════ */

/** `import { A, B as C } from './x.js'` → Map<lokaltNavn, spesifikator>. */
function importkart(kilde: string): Map<string, string> {
  const ut = new Map<string, string>();
  const re = /import\s+(type\s+)?([^;]*?)\s+from\s+['"]([^'"]+)['"]/gu;
  for (let m = re.exec(kilde); m !== null; m = re.exec(kilde)) {
    if (m[1]) continue; // `import type …` rendrer ingenting
    const spec = m[3]!;
    const klausul = m[2]!;
    const navngitt = /\{([\s\S]*?)\}/u.exec(klausul);
    if (navngitt) {
      for (const del of navngitt[1]!.split(',')) {
        const t = del.trim();
        if (!t || t.startsWith('type ')) continue;
        const som = /(\w+)\s+as\s+(\w+)/u.exec(t);
        ut.set(som ? som[2]! : t, spec);
      }
    }
    const standard = /^\s*(\w+)\s*(?:,|$)/u.exec(klausul.replace(/\{[\s\S]*?\}/u, ''));
    if (standard) ut.set(standard[1]!, spec);
  }
  return ut;
}

const IMPORTKART = new Map<string, Map<string, string>>(
  [...TSX_KILDE].map(([f, k]) => [f, importkart(k)]),
);

/** Løser en relativ importspesifikator til en faktisk .tsx/.ts-fil. */
function løsSti(fraFil: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fraFil), spec);
  const kandidater = [base];
  if (base.endsWith('.js')) kandidater.push(`${base.slice(0, -3)}.tsx`, `${base.slice(0, -3)}.ts`);
  kandidater.push(`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts'));
  for (const k of kandidater) if (existsSync(k) && statSync(k).isFile()) return k;
  return null;
}

/**
 * Funksjonskroppen til komponenten `navn` i `kilde`, som [fra, til).
 * `function Navn(…) { … }` og `const Navn = (…) => { … }` støttes; alt annet
 * gir null → kaller legger det i UFULGTE og porten blir rød.
 */
function komponentregion(kilde: string, navn: string): { fra: number; til: number } | null {
  const dekl = new RegExp(`function\\s+${navn}\\s*(?:<[^>(]*>)?\\s*\\(`, 'u').exec(kilde);
  const pil = dekl ? null
    : new RegExp(`(?:const|let|var)\\s+${navn}\\s*(?::[^=;]*)?=\\s*(?:function\\s*)?\\(`, 'u')
      .exec(kilde);
  const start = dekl ?? pil;
  if (!start) return null;
  const parenFra = kilde.indexOf('(', start.index + start[0]!.length - 1);
  if (parenFra === -1) return null;
  const parenTil = balansertParen(kilde, parenFra);
  if (parenTil === -1) return null;
  const kroppFra = kilde.indexOf('{', parenTil);
  if (kroppFra === -1) return null;
  // For pil-funksjoner må `{` faktisk være kroppen, ikke et objekt i en
  // `=> ({…})`-retur. Begge tilfeller er en balansert blokk vi kan lese —
  // men et returobjekt inneholder ingen JSX, så skopet blir bare tomt.
  const kropp = balansert(kilde, kroppFra);
  return { fra: kroppFra, til: kroppFra + kropp.length };
}

type Region = {
  fil: string;
  kilde: string;
  fra: number;
  til: number;
  /** Menneskelesbar sti fra panelroten hit — brukes i feilmeldinger. */
  via: string;
  /** Komponenten regionen er kroppen til (null for et rent JSX-undertre). */
  komponent: string | null;
  /**
   * Er regionen en FULGT komponentkropp (i motsetning til selve panelroten)?
   * Skillet er ikke kosmetisk: en fulgt komponent kan også være montert
   * utenfor et panel (→ DELTE), mens rot-komponenten ER panelet — dens
   * kallsteder er per definisjon panelmonteringer og skal aldri gjøre
   * panelets egne klasser delte.
   */
  fulgt: boolean;
};

type Panelrot = {
  fil: string;
  kilde: string;
  rotklasse: string;
  fra: number;
  til: number;
  regioner: Region[];
  /** Skopklasser dette undertreet bidrar med (ikke-vakuøsitet 7). */
  klasser: Set<string>;
};

/**
 * Undertreet til JSX-elementet som bærer `className="<rotklasse>"`.
 *
 * KLASSER SAMMENLIGNES SOM HELE TOKENS, aldri med `\b`. Første utkast brukte
 * `\bhjm-panel\b` og fikk 10 «panelrøtter» i stedet for 5: `\b` regner `-`
 * som ordgrense, så `.hjm-panel-slot` — den espresso-wrapperen som INNEHOLDER
 * panelet og maskoten — ble lest som selve panelet. Skopet svulmet med
 * maskotlagene. Samme feilklasse som porten er skrevet mot, én etasje opp.
 */
function finnPanelrøtter(fil: string, kilde: string): Omit<Panelrot, 'regioner' | 'klasser'>[] {
  const ut: Omit<Panelrot, 'regioner' | 'klasser'>[] = [];
  const re = /className="([^"{}]*)"/gu;
  for (let m = re.exec(kilde); m !== null; m = re.exec(kilde)) {
    const klasser = m[1]!.trim().split(/\s+/u).filter(Boolean);
    const rotklasse = PANELROTKLASSER.find((r) => klasser.includes(r));
    if (rotklasse !== undefined) {
      const tagStart = kilde.lastIndexOf('<', m.index);
      if (tagStart === -1) continue;
      const tag = /^<\s*([A-Za-z][\w.]*)/u.exec(kilde.slice(tagStart, m.index));
      if (!tag) continue;
      const navn = tag[1]!;
      const åpenSlutt = slutten(kilde, m.index);
      if (åpenSlutt === -1) continue;
      if (kilde[åpenSlutt - 1] === '/') { // selvlukkende rot — tomt undertre
        ut.push({ fil, kilde, rotklasse, fra: tagStart, til: åpenSlutt });
        continue;
      }
      // Tell nesting av SAMME tagnavn til vi finner matchende lukketagg.
      let dybde = 1;
      let i = åpenSlutt + 1;
      const åpne = new RegExp(`<${navn}(?![\\w-])`, 'gu');
      const lukk = new RegExp(`</\\s*${navn}\\s*>`, 'gu');
      let slutt = kilde.length;
      while (i < kilde.length) {
        åpne.lastIndex = i;
        lukk.lastIndex = i;
        const a = åpne.exec(kilde);
        const l = lukk.exec(kilde);
        if (l === null) break;
        if (a !== null && a.index < l.index) {
          const s = slutten(kilde, a.index);
          if (s !== -1 && kilde[s - 1] !== '/') dybde += 1;
          i = (s === -1 ? a.index : s) + 1;
          continue;
        }
        dybde -= 1;
        i = l.index + l[0].length;
        if (dybde === 0) { slutt = i; break; }
      }
      ut.push({ fil, kilde, rotklasse, fra: tagStart, til: slutt });
    }
  }
  return ut;
}

/** Navnet på komponenten posisjonen `abs` ligger inne i (nærmeste over). */
function omsluttendeKomponent(kilde: string, abs: number): string | null {
  const re = /function\s+([A-Z]\w*)\s*\(/gu;
  let siste: string | null = null;
  for (let m = re.exec(kilde); m !== null && m.index < abs; m = re.exec(kilde)) siste = m[1]!;
  return siste;
}

/**
 * Statiske klassenavn fra et `className={…}`-uttrykk (literaler).
 *
 * SAMMENLIGNINGSOPERANDER STRIPPES FØRST. `material === 'thermal' ?
 * 'fa-gauge-fill--thermal' : null` har TO literaler, men bare den ene er et
 * klassenavn — `'thermal'` er en verdi som testes. Uten strippingen havnet
 * `thermal`/`air`/`water` i skopet og gjorde ikke-vakuøsitet 3 rød på
 * oppdiktede klasser.
 */
function literalerFra(uttrykk: string): string[] {
  const ut: string[] = [];
  const uttenSammenligning = uttrykk.replace(/[!=]==?\s*(['"`])(?:\\.|(?!\1)[^\\])*\1/gu, ' ');
  const re = /'([^'\\]*)'|"([^"\\]*)"|`([^`\\$]*)`/gu;
  for (let m = re.exec(uttenSammenligning); m !== null; m = re.exec(uttenSammenligning)) {
    const s = m[1] ?? m[2] ?? m[3] ?? '';
    for (const del of s.trim().split(/\s+/u)) {
      if (/^[A-Za-z][\w-]*$/u.test(del)) ut.push(del);
    }
  }
  return ut;
}

/** Alt porten IKKE klarte å følge — hver oppføring gjør porten rød. */
const UFULGTE: string[] = [];
/** Dynamiske `className={…}` som lot seg løse opp, for logg + vakt. */
const LØSTE_DYNAMISKE: { sted: string; uttrykk: string; klasser: string[] }[] = [];

/**
 * Alle kallsteder til komponenten `navn` DEFINERT I `definertI`.
 *
 * Filtreringen på importsetning er ikke pynt: `CheckIcon` er definert lokalt
 * i FIRE forskjellige filer (ScanOverlay, HjemMonter, PaywallDialog,
 * FinnAntrekkScreen). Et rent navnesøk blandet dem sammen og påsto at
 * ScanOverlays CheckIcon også ble montert utenfor panelet.
 */
function kallsteder(navn: string, definertI: string): { fil: string; kilde: string; abs: number }[] {
  const ut: { fil: string; kilde: string; abs: number }[] = [];
  for (const [fil, kilde] of TSX_KILDE) {
    if (fil !== definertI) {
      const spec = IMPORTKART.get(fil)?.get(navn);
      if (spec === undefined || løsSti(fil, spec) !== definertI) continue;
    } else if (komponentregion(kilde, navn) === null) {
      continue; // navnet er ikke definert her likevel
    }
    const re = new RegExp(`(?<![\\w$])<${navn}(?![\\w-])`, 'gu');
    for (let m = re.exec(kilde); m !== null; m = re.exec(kilde)) ut.push({ fil, kilde, abs: m.index });
  }
  return ut;
}

/**
 * Utvider en region til hele det RENDREDE undertreet — på tvers av filer.
 * Store-forbokstav-tagger slås opp lokalt eller via import; `{children}`
 * løses ved å følge kallstedene til den omsluttende komponenten.
 */
function utvid(region: Region, besøkt: Set<string>, ut: Region[]): void {
  const nøkkel = `${region.fil}:${region.fra}-${region.til}`;
  if (besøkt.has(nøkkel)) return;
  besøkt.add(nøkkel);
  ut.push(region);

  const bit = region.kilde.slice(region.fra, region.til);

  /* ── (a) barnekomponenter ─────────────────────────────────────────── */
  // `(?<![\w$])` skiller JSX fra TYPEARGUMENTER: `useRef<HTMLDivElement>` og
  // `ReactPointerEvent<HTMLInputElement>` ser ut som store-forbokstav-tagger,
  // men `<` står da rett etter en identifikator. Uten vakten havnet begge i
  // UFULGTE og gjorde porten permanent rød på oppdiktet blindhet.
  const tagger = new Set<string>();
  const tagRe = /(?<![\w$])<([A-Z]\w*)(?=[\s/>])/gu;
  for (let m = tagRe.exec(bit); m !== null; m = tagRe.exec(bit)) tagger.add(m[1]!);
  for (const navn of tagger) {
    const lokal = komponentregion(region.kilde, navn);
    if (lokal) {
      utvid({
        fil: region.fil, kilde: region.kilde, fra: lokal.fra, til: lokal.til,
        via: `${region.via} → <${navn}>`, komponent: navn, fulgt: true,
      }, besøkt, ut);
      continue;
    }
    const spec = IMPORTKART.get(region.fil)?.get(navn);
    const sti = spec === undefined ? null : løsSti(region.fil, spec);
    const kilde = sti === null ? undefined : TSX_KILDE.get(sti);
    if (sti === null || kilde === undefined) {
      UFULGTE.push(`${kort(region.fil)} ${region.via} → <${navn}> — fant ingen fil `
        + `(import: ${spec ?? 'mangler'})`);
      continue;
    }
    const fjern = komponentregion(kilde, navn);
    if (!fjern) {
      UFULGTE.push(`${kort(region.fil)} ${region.via} → <${navn}> — fant filen `
        + `${kort(sti)}, men ikke komponentkroppen`);
      continue;
    }
    utvid({
      fil: sti, kilde, fra: fjern.fra, til: fjern.til,
      via: `${region.via} → <${navn}>`, komponent: navn, fulgt: true,
    }, besøkt, ut);
  }

  /* ── (b) {children} — følg kallstedene ────────────────────────────── */
  if (/\{\s*(?:props\.)?children\s*\}/u.test(bit)) {
    const vert = region.komponent ?? omsluttendeKomponent(region.kilde, region.fra);
    if (vert === null) {
      UFULGTE.push(`${kort(region.fil)}:${linjeAv(region.kilde, region.fra)} {children} `
        + 'uten identifiserbar vertskomponent — kallstedene kan ikke følges');
    } else {
      const steder = kallsteder(vert, region.fil).filter((s) => !(s.fil === region.fil
        && s.abs >= region.fra && s.abs < region.til));
      if (steder.length === 0) {
        UFULGTE.push(`${kort(region.fil)} <${vert}> rendrer {children}, men porten `
          + 'fant ingen kallsteder — kan ikke bevise at det er tomt');
      }
      for (const s of steder) {
        const åpenSlutt = slutten(s.kilde, s.abs);
        if (åpenSlutt === -1) {
          UFULGTE.push(`${kort(s.fil)}:${linjeAv(s.kilde, s.abs)} <${vert}> — fant ikke `
            + 'slutten på åpningstaggen');
          continue;
        }
        if (s.kilde[åpenSlutt - 1] === '/') continue; // selvlukkende → ingen children
        const lukk = new RegExp(`</\\s*${vert}\\s*>`, 'gu');
        lukk.lastIndex = åpenSlutt;
        const l = lukk.exec(s.kilde);
        if (l === null) {
          UFULGTE.push(`${kort(s.fil)}:${linjeAv(s.kilde, s.abs)} <${vert}> — fant ingen `
            + 'lukketagg, barna kan ikke leses');
          continue;
        }
        utvid({
          fil: s.fil, kilde: s.kilde, fra: åpenSlutt + 1, til: l.index,
          via: `${region.via} → {children}@${kort(s.fil)}:${linjeAv(s.kilde, s.abs)}`,
          komponent: null, fulgt: false,
        }, besøkt, ut);
      }
    }
  }
}

/** Klassenavn i en region: statiske `className="…"` + oppløste `{…}`. */
function klasserIRegion(region: Region): { klasse: string; abs: number }[] {
  const ut: { klasse: string; abs: number }[] = [];
  const bit = region.kilde.slice(region.fra, region.til);

  const statisk = /className="([^"{}]*)"/gu;
  for (let m = statisk.exec(bit); m !== null; m = statisk.exec(bit)) {
    for (const k of m[1]!.trim().split(/\s+/u).filter(Boolean)) {
      ut.push({ klasse: k, abs: region.fra + m.index });
    }
  }

  const dyn = /className=\{/gu;
  for (let m = dyn.exec(bit); m !== null; m = dyn.exec(bit)) {
    const abs = region.fra + m.index;
    const uttrykk = balansert(region.kilde, abs + 'className='.length);
    const sted = `${kort(region.fil)}:${linjeAv(region.kilde, abs)}`;
    let tekst = uttrykk;
    const bar = /^\{\s*([A-Za-z_$][\w$]*)\s*\}$/u.exec(uttrykk);
    if (bar) {
      const navn = bar[1]!;
      const dekl = new RegExp(`(?:const|let|var)\\s+${navn}\\s*(?::[^=;]*)?=`, 'u')
        .exec(region.kilde);
      if (!dekl) {
        UFULGTE.push(`${sted} className={${navn}} lot seg ikke slå opp — porten `
          + 'ville vært blind for klassene');
        continue;
      }
      const slutt = region.kilde.indexOf(';', dekl.index + dekl[0].length);
      tekst = region.kilde.slice(dekl.index, slutt === -1 ? region.kilde.length : slutt);
    }
    if (/\$\{/u.test(tekst)) {
      UFULGTE.push(`${sted} className med interpolert template — klassene kan ikke `
        + `avgjøres statisk: ${tekst.replace(/\s+/gu, ' ').slice(0, 90)}`);
      continue;
    }
    const funnet = literalerFra(tekst);
    if (funnet.length === 0) {
      UFULGTE.push(`${sted} dynamisk className uten ett eneste klasseliteral — `
        + `porten er blind der: ${tekst.replace(/\s+/gu, ' ').slice(0, 90)}`);
      continue;
    }
    LØSTE_DYNAMISKE.push({ sted, uttrykk: uttrykk.replace(/\s+/gu, ' ').slice(0, 60), klasser: funnet });
    for (const k of funnet) ut.push({ klasse: k, abs });
  }
  return ut;
}

const PANELRØTTER: Panelrot[] = [];
for (const [fil, kilde] of TSX_KILDE) {
  for (const rå of finnPanelrøtter(fil, kilde)) {
    const regioner: Region[] = [];
    utvid({
      fil: rå.fil, kilde: rå.kilde, fra: rå.fra, til: rå.til,
      via: `.${rå.rotklasse}`, komponent: omsluttendeKomponent(rå.kilde, rå.fra),
      fulgt: false,
    }, new Set<string>(), regioner);
    const klasser = new Set<string>();
    for (const r of regioner) for (const k of klasserIRegion(r)) klasser.add(k.klasse);
    PANELRØTTER.push({ ...rå, regioner, klasser });
  }
}

const ALLE_PANELREGIONER: Region[] = PANELRØTTER.flatMap((p) => p.regioner);

/**
 * Er en posisjon inne i et panel? En komponentkropp som er FULGT fra en
 * panelrot regnes i sin helhet som panel — den rendres jo bare der.
 */
function iPanelPosisjon(fil: string, abs: number): boolean {
  return ALLE_PANELREGIONER.some((r) => r.fil === fil && abs >= r.fra && abs < r.til);
}

/** Alle `className`-forekomster i src, merket med om de ligger i et panel. */
type Forekomst = { fil: string; klasse: string; abs: number; iPanel: boolean };
const FOREKOMSTER: Forekomst[] = [];
for (const [fil, kilde] of TSX_KILDE) {
  const re = /className="([^"{}]*)"/gu;
  for (let m = re.exec(kilde); m !== null; m = re.exec(kilde)) {
    const iPanel = iPanelPosisjon(fil, m.index);
    for (const klasse of m[1]!.trim().split(/\s+/u).filter(Boolean)) {
      FOREKOMSTER.push({ fil, klasse, abs: m.index, iPanel });
    }
  }
}
for (const region of ALLE_PANELREGIONER) {
  for (const { klasse, abs } of klasserIRegion(region)) {
    FOREKOMSTER.push({ fil: region.fil, klasse, abs, iPanel: true });
  }
}

/**
 * En FULGT komponent kan også være montert utenfor et panel. Da er klassene
 * dens DELTE, ikke eksklusive — ellers ville porten flagget canvas-varianten
 * falskt. Skyggeforekomstene under er nettopp den registreringen.
 */
const FULGTE_KOMPONENTER = new Map<string, Region>();
for (const r of ALLE_PANELREGIONER) {
  // KUN fulgte barnekomponenter. Rot-komponenten (WeatherScene/ScanOverlay/
  // WeatherStrip) ER panelet — dens kallsteder i HjemMonter er nettopp
  // panelmonteringene, og å telle dem som «utenfor» ville gjort HELE
  // panelets klassesett DELT og dermed skopløst.
  if (r.fulgt && r.komponent) FULGTE_KOMPONENTER.set(`${r.fil}::${r.komponent}`, r);
}
const KOMPONENTER_OGSÅ_UTENFOR: string[] = [];
for (const [nøkkel, region] of FULGTE_KOMPONENTER) {
  const navn = nøkkel.split('::')[1]!;
  const utenfor = kallsteder(navn, region.fil).filter((s) => !iPanelPosisjon(s.fil, s.abs));
  if (utenfor.length === 0) continue;
  KOMPONENTER_OGSÅ_UTENFOR.push(`${navn} (${utenfor.map((s) => `${kort(s.fil)}:${linjeAv(s.kilde, s.abs)}`).join(', ')})`);
  for (const { klasse, abs } of klasserIRegion(region)) {
    FOREKOMSTER.push({ fil: region.fil, klasse, abs, iPanel: false });
  }
}

const SKOPKLASSER = new Set(FOREKOMSTER.filter((f) => f.iPanel).map((f) => f.klasse));
/**
 * Delt = rendres BÅDE i og utenfor et panel. Krever panelrot i selektoren.
 * MÅLT: settet er TOMT i dag (se console.log). Grenen er et vern for den
 * dagen en panelkomponent også monteres på canvas — ikke forklaringen på at
 * porten har null falske positive nå.
 */
const DELTE = new Set(
  [...SKOPKLASSER].filter((k) => FOREKOMSTER.some((f) => f.klasse === k && !f.iPanel)),
);
const EKSKLUSIVE = new Set([...SKOPKLASSER].filter((k) => !DELTE.has(k)));

/* ══════════════════════ 2. CSS-REGLER I SKOPET ══════════════════════ */

type Regel = {
  fil: string;
  kilde: string;
  selektor: string;
  kroppFra: number;
  kroppTil: number;
  /** Omsluttende at-regler (`@media …`) — et vern må stå i samme kontekst. */
  atKontekst: string;
  /** Dokumentrekkefølge innen filen. */
  nr: number;
};

function lesRegler(fil: string, råCss: string): { kilde: string; regler: Regel[] } {
  const kilde = stripKommentarer(råCss);
  const regler: Regel[] = [];
  const selektorer: string[] = [];
  const starter: number[] = [];
  const atStakk: string[] = [];
  let bufferFra = 0;
  let nr = 0;
  for (let i = 0; i < kilde.length; i += 1) {
    const c = kilde[i];
    if (c === '{') {
      const sel = kilde.slice(bufferFra, i).trim();
      selektorer.push(sel);
      starter.push(i + 1);
      if (sel.startsWith('@')) atStakk.push(sel.replace(/\s+/gu, ' '));
      bufferFra = i + 1;
    } else if (c === '}') {
      const selektor = selektorer.pop() ?? '';
      const fra = starter.pop() ?? i;
      if (selektor.startsWith('@')) {
        atStakk.pop();
      } else {
        nr += 1;
        regler.push({
          fil, kilde, selektor, kroppFra: fra, kroppTil: i,
          atKontekst: atStakk.join(' | '), nr,
        });
      }
      bufferFra = i + 1;
    }
  }
  return { kilde, regler };
}

function nevner(selektor: string, klasse: string): boolean {
  return new RegExp(`\\.${klasse.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}(?![\\w-])`, 'u')
    .test(selektor);
}

const CSS_KILDE = new Map<string, string>();
const ALLE_REGLER: Regel[] = [];
for (const fil of CSS_FILER) {
  const { kilde, regler } = lesRegler(fil, readFileSync(fil, 'utf8'));
  CSS_KILDE.set(fil, kilde);
  ALLE_REGLER.push(...regler);
}

/** Splitter en selektor på TOPPNIVÅ-komma (utenfor `(…)` og `[…]`). */
function splittLedd(selektor: string): string[] {
  const ut: string[] = [];
  let dybde = 0;
  let start = 0;
  for (let i = 0; i < selektor.length; i += 1) {
    const c = selektor[i];
    if (c === '(' || c === '[') dybde += 1;
    else if (c === ')' || c === ']') dybde -= 1;
    else if (c === ',' && dybde === 0) {
      ut.push(selektor.slice(start, i).trim());
      start = i + 1;
    }
  }
  ut.push(selektor.slice(start).trim());
  return ut.filter(Boolean);
}

/** Siste enkeltselektor i et ledd — den som faktisk treffer elementet. */
function nøkkelkompound(ledd: string): string {
  const deler = ledd.trim().split(/\s*[>+~]\s*|\s+/u).filter(Boolean);
  return deler[deler.length - 1] ?? '';
}

/** `.a[b='c']:hover` → ['.a', "[b='c']", ':hover'] */
function kompounddeler(kompound: string): string[] {
  const ut: string[] = [];
  const re = /(::?[\w-]+(?:\([^)]*\))?)|(\[[^\]]*\])|([.#][\w-]+)|([A-Za-z][\w-]*)|(\*)/gu;
  for (let m = re.exec(kompound); m !== null; m = re.exec(kompound)) ut.push(m[0]);
  return ut;
}

function spesifisitet(ledd: string): number {
  const utenPseudoElement = ledd.replace(/::[\w-]+/gu, ' ');
  const ider = (utenPseudoElement.match(/#[\w-]+/gu) ?? []).length;
  const klasser = (utenPseudoElement.match(/\.[\w-]+/gu) ?? []).length
    + (utenPseudoElement.match(/\[[^\]]*\]/gu) ?? []).length
    + (utenPseudoElement.match(/:(?!:)[\w-]+/gu) ?? []).length;
  const elementer = (utenPseudoElement
    .replace(/\[[^\]]*\]/gu, ' ')
    .replace(/[.#:][\w-]+/gu, ' ')
    .match(/[A-Za-z][\w-]*/gu) ?? []).length;
  return ider * 10000 + klasser * 100 + elementer;
}

/** Klassene et ledd nevner. */
function klasserILedd(ledd: string): string[] {
  return (ledd.match(/\.[\w-]+/gu) ?? []).map((k) => k.slice(1));
}

/** En regel er panel-scoped når leddet nevner en EKSKLUSIV skopklasse, eller
 *  en DELT skopklasse kvalifisert av en panelrot i samme ledd. */
function iPanelSkop(ledd: string): string[] {
  const treff = [...EKSKLUSIVE].filter((k) => nevner(ledd, k));
  if (treff.length > 0) return treff;
  const harRot = PANELROTKLASSER.some((r) => nevner(ledd, r));
  if (!harRot) return [];
  return [...DELTE].filter((k) => nevner(ledd, k));
}

/* ══════════════════════ 3. BRUDDENE ══════════════════════ */

type Brudd = { sted: string; selektor: string; token: string; grunn: Forbudsgrunn; tekst: string };

/**
 * ALLOWLIST-FRITAK, BUNDET TIL NØKKELSELEKTORENS EGEN KLASSEIDENTITET.
 *
 * Regelen: har nøkkelselektoren (siste enkeltselektor) en EGEN klasse, må DEN
 * klassen stå på allowlisten. Har den ingen egen klasse — bar `i`, `span`,
 * `::before` — arver den statusen fra en allowlistet anekst i SAMME ledd.
 *
 * ── AVVIK FRA ANGREPSBRIEFEN, MED BEGRUNNELSE ────────────────────────────
 * Briefen krevde at det allowlistede leddet MÅ være nøkkelselektoren, uten
 * unntak. Bokstavelig anvendt gjør den regelen `.hjm-fresh[data-warn='true']
 * i { background: var(--dw-warning) }` (hjem-monter.css:218) til brudd. Den
 * `<i>`-en er prikken I selve statusmerket — WeatherScene.tsx:124 rendrer den
 * som `<i aria-hidden="true" />` uten egen klasse, og den kan ikke nås uten
 * `.hjm-fresh`. Den er ikke en «ordinær instrumentverdi»; den ER varselet.
 * Bokstavregelen ville altså tvunget fram ett av to gale utfall: enten heve
 * BASELINE fra 3 til 4 (forbudt), eller gi varselprikken en annen farge enn
 * varselteksten ved siden av — som er nøyaktig det Sol-blokker 4 forbyr
 * («et varsel som ikke ser ut som et varsel, er ikke et varsel»).
 *
 * Bakdøren briefen faktisk beskrev, lukkes likevel HELT: den handlet om
 * NAVNGITTE ordinære klasser som fritas fordi allowlisten er nevnt et annet
 * sted i selektoren. `.hjm-fresh, .hjm-cond` (gruppeledd) og
 * `.hjm-fresh .hjm-cond` (etterkommer) er BEGGE brudd her, fordi `.hjm-cond`
 * har egen klasseidentitet og ikke står på lista. Se regresjonsvakten.
 */
function leddErAllowlistet(ledd: string): boolean {
  const egneKlasser = kompounddeler(nøkkelkompound(ledd))
    .filter((d) => d.startsWith('.')).map((d) => d.slice(1));
  if (egneKlasser.length > 0) return egneKlasser.some((k) => SEMANTIKK_ALLOWLIST.has(k));
  return klasserILedd(ledd).some((k) => SEMANTIKK_ALLOWLIST.has(k));
}

/** Fritar allowlisten HELE denne deklarasjonen? Alle skopledd må være dekket. */
function semantikkTillatt(selektor: string): boolean {
  const skopledd = splittLedd(selektor).filter((l) => iPanelSkop(l).length > 0);
  if (skopledd.length === 0) return false;
  return skopledd.every(leddErAllowlistet);
}

function egenskapAv(deklarasjon: string): string {
  const i = deklarasjon.indexOf(':');
  return (i === -1 ? deklarasjon : deklarasjon.slice(0, i)).trim().toLowerCase();
}

/** Overstyrer `vernEgenskap` fargen som `bruddEgenskap` bærer? */
function dekker(vernEgenskap: string, bruddEgenskap: string): boolean {
  return vernEgenskap === bruddEgenskap || vernEgenskap === `${bruddEgenskap}-color`;
}

function deklarasjoner(regel: Regel): { tekst: string; abs: number }[] {
  const kropp = regel.kilde.slice(regel.kroppFra, regel.kroppTil);
  const ut: { tekst: string; abs: number }[] = [];
  let fra = 0;
  for (let i = 0; i <= kropp.length; i += 1) {
    if (i === kropp.length || kropp[i] === ';') {
      if (kropp.slice(fra, i).trim()) ut.push({ tekst: kropp.slice(fra, i), abs: regel.kroppFra + fra });
      fra = i + 1;
    }
  }
  return ut;
}

type Vernfunn = { fil: string; base: string; egenskap: string; vern: string };
const VERNFUNN: Vernfunn[] = [];

/**
 * Finnes det en kaskade-overstyring som gjør `ledd`s bruk av `egenskap`
 * ufarlig inne i petrol? Kravene er strenge med vilje — se FORVENTEDE_VERN.
 */
function finnVern(regel: Regel, ledd: string, egenskap: string): Regel | null {
  const baseKlasser = klasserILedd(ledd);
  const baseNøkkel = kompounddeler(nøkkelkompound(ledd));
  const baseSpes = spesifisitet(ledd);
  for (const kandidat of ALLE_REGLER) {
    if (kandidat.atKontekst !== regel.atKontekst) continue;
    for (const kLedd of splittLedd(kandidat.selektor)) {
      if (!PANELROTKLASSER.some((r) => nevner(kLedd, r))) continue;
      if (!baseKlasser.every((k) => nevner(kLedd, k))) continue;
      const kNøkkel = kompounddeler(nøkkelkompound(kLedd));
      if (!baseNøkkel.every((d) => kNøkkel.includes(d))) continue;
      const spes = spesifisitet(kLedd);
      const vinner = spes > baseSpes
        || (spes === baseSpes && kandidat.fil === regel.fil && kandidat.nr > regel.nr);
      if (!vinner) continue;
      for (const d of deklarasjoner(kandidat)) {
        if (!dekker(egenskapAv(d.tekst), egenskap)) continue;
        if (forbudteTreff(d.tekst).length > 0) continue;
        return kandidat;
      }
    }
  }
  return null;
}

const ØY_BRUKT = new Set<string>();

/**
 * Har KLASSEN sin egen flate — i denne regelen eller i en annen regel for
 * samme klasse i samme fil?
 *
 * ═══ HVORFOR IKKE BARE «SAMME REGEL» ══════════════════════════════════════
 * Kravet var opprinnelig at `background: var(--dw-raised)` sto i NØYAKTIG den
 * regelen som bruker espresso-blekket. Det er strengt på riktig sted —
 * unntaket skal være bundet til premisset sitt — men det målte feil ting.
 *
 * MÅLT 2026-08-05: en tilstandsregel for samme klasse
 * (`.fa-gauge-step[aria-disabled='true']`) ARVER flaten fra grunnregelen.
 * Elementet HAR sin egen hevede bakgrunn; porten så bare ikke etter den.
 * Følgen var konkret og gal: for å bli grønn her gjentok jeg bakgrunnen i
 * tilstandsregelen — og skapte NY doktrinegjeld i D2 (hevet flate uten inset
 * topplys + skygge). To porter dro i hver sin retning, og den ene ble løst
 * ved å bryte den andre.
 *
 * PREMISSET ER FORTSATT BUNDET, bare på riktig nivå: flaten må finnes for
 * KLASSEN, i samme fil. Slettes `background: var(--dw-raised)` fra
 * grunnregelen, forsvinner unntaket for alle tilstandene også — det er
 * mutasjonstestet.
 */
function klassenHarEgenFlate(
  regel: Regel,
  øy: (typeof HEVEDE_ØYER)[number],
): boolean {
  const flateIRegel = (r: Regel): boolean =>
    deklarasjoner(r).some((d) => /^background(-color)?$/u.test(egenskapAv(d.tekst))
      && new RegExp(`var\\(\\s*${øy.flate}(?![\\w-])`, 'u').test(d.tekst));

  if (flateIRegel(regel)) return true;

  /* Ellers: en annen regel i SAMME fil hvis nøkkelkompound bærer samme
     klasse. Filgrensen er med vilje — en flate deklarert i et helt annet
     stilark er ikke et premiss denne porten kan verifisere. */
  return ALLE_REGLER.some((r) => r.fil === regel.fil
    && splittLedd(r.selektor).some((l) => kompounddeler(nøkkelkompound(l))
      .some((d) => d === `.${øy.klasse}`))
    && flateIRegel(r));
}

/** Er hele deklarasjonen dekket av et registrert HEVET ØY? */
function hevetØy(regel: Regel, skopledd: string[]): (typeof HEVEDE_ØYER)[number] | null {
  for (const øy of HEVEDE_ØYER) {
    if (!skopledd.every((l) => kompounddeler(nøkkelkompound(l))
      .some((d) => d === `.${øy.klasse}`))) continue;
    if (!klassenHarEgenFlate(regel, øy)) continue;
    ØY_BRUKT.add(øy.klasse);
    return øy;
  }
  return null;
}

const SKOPREGLER = ALLE_REGLER
  .map((r) => ({ regel: r, ledd: splittLedd(r.selektor).filter((l) => iPanelSkop(l).length > 0) }))
  .filter((x) => x.ledd.length > 0);

const bruddCss: Brudd[] = [];
let cssDeklarasjoner = 0;
for (const { regel, ledd } of SKOPREGLER) {
  const biter = deklarasjoner(regel);
  cssDeklarasjoner += biter.length;
  for (const bit of biter) {
    const egenskap = egenskapAv(bit.tekst);
    for (const t of forbudteTreff(bit.tekst)) {
      // allowlisten dekker ALDRI espresso/hairline — kun semantikk.
      if (t.grunn === 'semantikk' && semantikkTillatt(regel.selektor)) continue;
      const øy = hevetØy(regel, ledd);
      if (øy !== null) continue;
      const vern = ledd.map((l) => finnVern(regel, l, egenskap));
      if (vern.every((v) => v !== null)) {
        for (let i = 0; i < ledd.length; i += 1) {
          VERNFUNN.push({
            fil: kort(regel.fil), base: ledd[i]!.replace(/\s+/gu, ' '),
            egenskap, vern: vern[i]!.selektor.replace(/\s+/gu, ' '),
          });
        }
        continue;
      }
      bruddCss.push({
        sted: `${kort(regel.fil)}:${linjeAv(regel.kilde, bit.abs + t.rel)}`,
        selektor: regel.selektor.replace(/\s+/gu, ' '),
        token: t.token,
        grunn: t.grunn,
        tekst: bit.tekst.trim(),
      });
    }
  }
}

/* ── Inline CSSProperties inne i panel-undertrærne ───────────────────────
   Usynlig for enhver ren CSS-port: `.hjm-feels` er korrekt i CSS-filen og
   overstyres av et inline-objekt i JSX. Både litteralen i uttrykket OG et
   oppslått `style={ident}` telles. Skanningen går over ALLE regioner, altså
   også komponentkropper i andre filer. */
type StyleUttrykk = { fil: string; kilde: string; abs: number; tekst: string; klasse: string | null };

function nærmesteKlasse(kilde: string, abs: number): string | null {
  const tagStart = kilde.lastIndexOf('<', abs);
  if (tagStart === -1) return null;
  const m = /className="([^"{}]*)"/u.exec(kilde.slice(tagStart, abs + 400));
  return m ? m[1]!.trim() : null;
}

const styleUttrykk: StyleUttrykk[] = [];
for (const region of ALLE_PANELREGIONER) {
  const { kilde, fil } = region;
  const re = /style=\{/gu;
  re.lastIndex = region.fra;
  for (let m = re.exec(kilde); m !== null && m.index < region.til; m = re.exec(kilde)) {
    const uttrykk = balansert(kilde, m.index + 'style='.length);
    styleUttrykk.push({ fil, kilde, abs: m.index, tekst: uttrykk, klasse: nærmesteKlasse(kilde, m.index) });
    const bar = /^\{\s*([A-Za-z_$][\w$]*)\s*\}$/u.exec(uttrykk);
    if (bar) {
      const navn = bar[1]!;
      const dekl = new RegExp(`(?:const|let|var|function)\\s+${navn}\\b`, 'u').exec(kilde);
      if (!dekl) {
        UFULGTE.push(`${kort(fil)}:${linjeAv(kilde, m.index)} style={${navn}} lot seg ikke slå opp`);
      } else {
        const kroppFra = kilde.indexOf('{', dekl.index + dekl[0].length);
        if (kroppFra === -1) {
          UFULGTE.push(`${kort(fil)}:${linjeAv(kilde, m.index)} style={${navn}} har ingen objektkropp`);
        } else {
          styleUttrykk.push({
            fil, kilde, abs: kroppFra, tekst: balansert(kilde, kroppFra),
            klasse: nærmesteKlasse(kilde, m.index),
          });
        }
      }
    }
  }
}

const bruddInline: Brudd[] = [];
for (const s of styleUttrykk) {
  const klasser = (s.klasse ?? '').split(/\s+/u).filter(Boolean);
  for (const t of forbudteTreff(s.tekst)) {
    if (t.grunn === 'semantikk' && klasser.some((k) => SEMANTIKK_ALLOWLIST.has(k))) continue;
    bruddInline.push({
      sted: `${kort(s.fil)}:${linjeAv(s.kilde, s.abs)}`,
      selektor: s.klasse === null ? '(inline, uten className)' : `.${s.klasse.split(/\s+/u).join('.')} (inline)`,
      token: t.token,
      grunn: t.grunn,
      tekst: s.tekst.replace(/\s+/gu, ' ').slice(0, 120),
    });
  }
}

const BRUDD = [...bruddCss, ...bruddInline];
const linje = (b: Brudd): string =>
  `${b.sted}  ${b.selektor}  →  var(${b.token}) [${b.grunn}]  ::  ${b.tekst}`;

/* ══════════════════════ TESTENE ══════════════════════ */

describe('panel-tekstrampen — espresso-blekk hører ikke hjemme på petrol', () => {
  it('IKKE-VAKUØSITET: fant panelrøttene sine i JSX', () => {
    const filer = new Set(PANELRØTTER.map((p) => kort(p.fil)));
    const savnet = FORVENTEDE_PANELFILER.filter((f) => !filer.has(f));
    expect(savnet, `disse filene skulle hatt en panelrot (${PANELROTKLASSER.join(' / ')}) — `
      + `porten er blind der nå:\n  ${savnet.join('\n  ')}`).toEqual([]);
    expect(PANELRØTTER.length, 'ingen panelrøtter funnet — porten måler ingenting').toBeGreaterThanOrEqual(5);
    for (const p of PANELRØTTER) {
      expect(p.til, `tomt undertre for .${p.rotklasse} i ${kort(p.fil)}`).toBeGreaterThan(p.fra + 40);
    }

    /* …og røttene MÅ faktisk være petrol. Det var denne assertionen som
       manglet da første utkast leste `.hjm-panel-slot` som en panelrot: den
       er en espresso-wrapper uten bakgrunn i det hele tatt. En rot uten
       petrol-flate er ikke et instrument, og alt porten sier om den er feil. */
    const utenPetrol = PANELROTKLASSER.filter((rot) => !ALLE_REGLER.some((r) =>
      nevner(r.selektor, rot)
      && /background(-color)?\s*:\s*[^;]*var\(--dw-(w-[a-z]+|panel)\)/u
        .test(r.kilde.slice(r.kroppFra, r.kroppTil))));
    expect(utenPetrol, 'disse «panelrøttene» setter aldri en petrol-flate — de er ikke '
      + `instrumenter, og skopet utledet av dem er feil:\n  ${utenPetrol.join('\n  ')}`).toEqual([]);

    /* …og premisset for HELE porten: petrol flipper ikke. Blir --dw-panel
       tema-avhengig en dag, er forbudet under her feil formulert og skal
       skrives om, ikke stå og måle noe som ikke lenger gjelder. */
    const tokens = readFileSync(join(ROT, 'src/styles/design-tokens-v2.css'), 'utf8');
    const panelVerdier = new Set((tokens.match(/^\s*--dw-panel\s*:\s*([^;]+);/gmu) ?? [])
      .map((s) => s.split(':')[1]!.trim()));
    expect(panelVerdier.size, 'premisset for porten er at --dw-panel er TEMA-KONSTANT. '
      + `Den er nå deklarert med ${panelVerdier.size} forskjellige verdier: `
      + `${[...panelVerdier].join(' / ')}`).toBe(1);
  });

  it('IKKE-VAKUØSITET: fant klassene den er skrevet for å måle', () => {
    const savnet = FORVENTEDE_SKOPKLASSER.filter((k) => !SKOPKLASSER.has(k));
    expect(savnet, `disse klassene lå ikke i det utledede panel-skopet — skopet er feil, `
      + `ikke koden. (Blokken merket FILGRENSE nås KUN ved å følge en barnekomponent `
      + `inn i en annen fil — faller de ut, har filgrensekryssingen sluttet å virke.):\n  `
      + `${savnet.join('\n  ')}`).toEqual([]);
    for (const k of SEMANTIKK_ALLOWLIST) {
      expect(SKOPKLASSER.has(k), `allowlisten navner .${k}, men den rendres ikke i noe panel — død allowlist`)
        .toBe(true);
    }
  });

  it('IKKE-VAKUØSITET: hver skopklasse har faktisk en CSS-regel', () => {
    const vedtatt = new Set<string>(KLASSER_UTEN_REGEL_VEDTATT.map((v) => v.klasse));
    const utenRegel = [...SKOPKLASSER]
      .filter((k) => !vedtatt.has(k))
      .filter((k) => !ALLE_REGLER.some((r) => nevner(r.selektor, k)));
    expect(utenRegel, `disse rendres i panelet, men har ingen CSS-regel noe sted — porten kan `
      + `ikke se dem:\n  ${utenRegel.join('\n  ')}`).toEqual([]);

    // …og registeret må ikke være dødt: hver vedtatt regelløs klasse må
    // faktisk rendres i skopet OG faktisk mangle regel.
    for (const v of KLASSER_UTEN_REGEL_VEDTATT) {
      expect(SKOPKLASSER.has(v.klasse), `KLASSER_UTEN_REGEL_VEDTATT navner .${v.klasse}, `
        + 'men den rendres ikke i noe panel — død oppføring, fjern den').toBe(true);
      expect(ALLE_REGLER.some((r) => nevner(r.selektor, v.klasse)),
        `.${v.klasse} har fått en CSS-regel — fjern den fra KLASSER_UTEN_REGEL_VEDTATT `
        + 'så porten måler den som alle andre').toBe(false);
    }

    expect(SKOPREGLER.length, 'null CSS-regler i panel-skopet — porten måler ingenting')
      .toBeGreaterThanOrEqual(20);
    expect(cssDeklarasjoner, 'null deklarasjoner sjekket').toBeGreaterThanOrEqual(80);
  });

  it('IKKE-VAKUØSITET: hvert forbudt token er faktisk deklarert i tokenfilen', () => {
    const tokens = readFileSync(join(ROT, 'src/styles/design-tokens-v2.css'), 'utf8');
    const savnet = Object.keys(FORBUDT).filter((t) => !new RegExp(`^\\s*${t}\\s*:`, 'mu').test(tokens));
    expect(savnet, `forbudslista navner tokens som ikke lenger deklareres — forbudet er tomt `
      + `for disse:\n  ${savnet.join('\n  ')}`).toEqual([]);
  });

  it('IKKE-VAKUØSITET: ingenting i panel-undertrærne er usynlig for porten', () => {
    expect(UFULGTE, 'porten klarte ikke å følge dette inn i panel-skopet. Blindhet skal '
      + 'ALDRI passere som grønt — utvid oppslaget eller gjør koden statisk lesbar:\n  '
      + `${UFULGTE.join('\n  ')}`).toEqual([]);

    // Den ene kjente dynamiske className-en MÅ fortsatt bli funnet OG løst.
    // Slutter oppløseren å virke, faller `.fa-gauge-fill*` ut av skopet og
    // porten ville meldt grønt på et mindre skop.
    const gaugeFill = LØSTE_DYNAMISKE.find((d) => d.klasser.includes('fa-gauge-fill'));
    expect(gaugeFill, 'fant ikke den oppløste className={fillClassName} i VerticalGauge — '
      + `oppløseren har sluttet å virke. Løste uttrykk nå: ${LØSTE_DYNAMISKE.length}`)
      .toBeDefined();

    expect(styleUttrykk.length, 'null inline style-uttrykk funnet i panelene — flate (c) er ikke dekket')
      .toBeGreaterThanOrEqual(4);

    console.log(
      `\n  panel-tekstrampe: ${TSX_FILER.length} tsx + ${CSS_FILER.length} css skannet`
      + ` · ${PANELRØTTER.length} panelrøtter, ${ALLE_PANELREGIONER.length} regioner`
      + ` (${new Set(ALLE_PANELREGIONER.map((r) => kort(r.fil))).size} filer)`
      + ` · ${SKOPKLASSER.size} skopklasser (${EKSKLUSIVE.size} eksklusive / ${DELTE.size} delte)`
      + ` · ${SKOPREGLER.length} regler, ${cssDeklarasjoner} deklarasjoner`
      + ` · ${styleUttrykk.length} inline style-uttrykk`
      + ` · ${LØSTE_DYNAMISKE.length} oppløste className={…}`
      + ` · ${VERNFUNN.length} vern, ${ØY_BRUKT.size} hevede øyer`
      + ` · ${BRUDD.length} brudd (baseline ${BASELINE})\n`
      + PANELRØTTER.map((p) => `    rot .${p.rotklasse} @ ${kort(p.fil)}:${linjeAv(p.kilde, p.fra)}`
        + ` — ${p.klasser.size} klasser, ${p.regioner.length} regioner`
        + ` [${p.regioner.map((r) => r.via).join(' ; ')}]`).join('\n') + '\n'
      + (KOMPONENTER_OGSÅ_UTENFOR.length === 0
        ? '    DELTE er tom: ingen fulgt panelkomponent er montert utenfor et panel.\n'
        : `    delte via: ${KOMPONENTER_OGSÅ_UTENFOR.join(', ')}\n`)
      + VERNFUNN.map((v) => `    VERN ${v.fil}  ${v.base} {${v.egenskap}}  ←  ${v.vern}`).join('\n') + '\n'
      + BRUDD.map((b) => `    ${linje(b)}`).join('\n') + '\n',
    );
  });

  it('IKKE-VAKUØSITET: hver panelrot bidrar faktisk med noe å måle', () => {
    // DET OMVENDTE ASSERTET. Alle de andre spør «fant jeg det jeg listet
    // opp». Dette spør «ligger ALT som rendres i panelet i skopet mitt».
    // Uten det kan et panel forsvinne fra målingen uten at noe blir rødt —
    // og det var nøyaktig slik `.hjm-panel` i FinnAntrekkScreen (som bare
    // inneholder <VerticalGauge>) og `.planlegg-weather` (som delegerer
    // prognosen til <ForecastDisclosure>) lå umålt til 2026-08-04.
    const tynne = PANELRØTTER
      .filter((p) => p.klasser.size < MIN_KLASSER_PER_ROT)
      .map((p) => `${kort(p.fil)}:${linjeAv(p.kilde, p.fra)} .${p.rotklasse} — bare `
        + `${p.klasser.size} skopklasse(r): ${[...p.klasser].join(', ')}`);
    expect(tynne, `disse panelrøttene er tomme skall i porten: undertreet bidrar med færre `
      + `enn ${MIN_KLASSER_PER_ROT} egne skopklasser. Enten er innholdet flyttet til en `
      + `barnekomponent porten ikke følger, eller så er roten ikke lenger et instrument. `
      + `Porten består da på FRAVÆR:\n  ${tynne.join('\n  ')}`).toEqual([]);

    // …og hver rot må ha minst én region UTOVER seg selv ELLER egne klasser
    // nok — dvs. filgrensekryssingen skal beviselig ha vært i bruk for de to
    // røttene som delegerer alt.
    const kryssende = PANELRØTTER.filter((p) => p.regioner.some((r) => r.fil !== p.fil));
    expect(kryssende.length, 'ingen panelrot krysset en filgrense. Enten er koden endret, '
      + 'eller så har oppslaget av barnekomponenter sluttet å virke — og da er porten '
      + 'tilbake til å bestå på fravær for FinnAntrekkScreen og UkeScreen.')
      .toBeGreaterThanOrEqual(2);
  });

  it('ordinære instrumentverdier bruker ikke espresso-rampe, hairline eller semantikk', () => {
    expect(
      BRUDD.length,
      `ØKNING over baseline (${BASELINE}). Panel-skopet har nå ${BRUDD.length} tema-flippende `
      + `farger på tema-konstant petrol:\n  ${BRUDD.map(linje).join('\n  ')}`,
    ).toBeLessThanOrEqual(BASELINE);
  });

  it('RATSJEN ER TVINGENDE: gulvet kan bare krympe, aldri stå igjen for høyt', () => {
    // Var dette bare en console.log før. Da kunne et rettet brudd vokse
    // tilbake i stillhet, siden gulvet aldri fulgte etter nedover.
    expect(
      BRUDD.length,
      `RATSJ: ${BRUDD.length} brudd mot baseline ${BASELINE}. Noe er rettet — SENK BASELINE `
      + `til ${BRUDD.length} i samme commit, ellers kan bruddet vokse tilbake i stillhet.`,
    ).toBeGreaterThanOrEqual(BASELINE);
  });

  it('eierrapporterte funn står UTENFOR gulvet og må være null', () => {
    const truffet = BRUDD.filter((b) => EIERRAPPORTERT.includes(`${b.sted} ${b.token}`));
    expect(truffet.map(linje), 'eierrapporterte funn kan ALDRI baselines').toEqual([]);
  });

  it('allowlisten gir rett til SEMANTIKK, aldri til espresso-rampen', () => {
    // Regresjonsvakt mot at allowlisten sklir ut til et generelt fritak:
    // .hjm-stale-badge STÅR på lista og er brudd likevel (--dw-ink-mid,
    // --dw-hairline). Blir den fritatt, er allowlisten blitt en bakdør.
    const badge = BRUDD.filter((b) => b.selektor.includes('hjm-stale-badge'));
    expect(badge.length, 'allowlistet komponent slipper ikke unna espresso-rampen — '
      + 'fant ingen brudd på .hjm-stale-badge, som skal ha to (--dw-ink-mid + --dw-hairline)')
      .toBeGreaterThanOrEqual(2);
    expect(badge.every((b) => b.grunn !== 'semantikk'), 'semantikk på allowlistet komponent skal ikke telles')
      .toBe(true);

    // …og motsatt: .hjm-fresh sin varselfarge SKAL gå gjennom. Er det brudd
    // her, er det fordi noen la espresso-rampe eller hairline på den — ikke
    // fordi semantikken ble flagget.
    const fresh = BRUDD.filter((b) => b.selektor.includes('hjm-fresh'));
    expect(fresh.map(linje), 'brudd på .hjm-fresh. Semantikk (--dw-success/warning/danger) '
      + 'er TILLATT der (Sol-blokker 4); espresso-rampen og hairline er det ALDRI:\n  '
      + `${fresh.map(linje).join('\n  ')}`).toEqual([]);
  });

  it('allowlist-fritaket kan ikke lekke gjennom gruppeselektorer eller etterkommere', () => {
    // PERMANENT REGRESSIONSVAKT (angrep 2026-08-04, INJ-6). Den gamle
    // `tillatt()` testet HELE selektorteksten, så `.hjm-fresh, .hjm-cond`
    // fritok også `.hjm-cond` — en ordinær instrumentverdi uten allowlist-
    // rett. Skytes rett på avgjørelsesfunksjonen, så vakten ikke kan
    // omgås av at noen skriver om løkken rundt.
    expect(leddErAllowlistet('.hjm-fresh'), 'allowlisten skal frita sin egen klasse').toBe(true);
    expect(leddErAllowlistet('.hjm-stale-badge'), 'allowlisten skal frita sin egen klasse').toBe(true);

    expect(semantikkTillatt('.hjm-fresh'), '.hjm-fresh alene skal være fritatt').toBe(true);
    expect(
      semantikkTillatt('.hjm-fresh, .hjm-cond'),
      'BAKDØR: å nevne .hjm-fresh i en gruppeselektor fritar hele gruppa. .hjm-cond er en '
      + 'ordinær instrumentverdi uten allowlist-rett — fritaket må avgjøres per komma-ledd.',
    ).toBe(false);
    expect(
      semantikkTillatt('.hjm-cond, .hjm-fresh'),
      'BAKDØR: samme lekkasje med omvendt rekkefølge på leddene.',
    ).toBe(false);
    expect(
      leddErAllowlistet('.hjm-fresh .hjm-cond'),
      'BAKDØR: en allowlistet ANEKST fritar ikke en etterkommer som har EGEN '
      + 'klasseidentitet. .hjm-cond er en navngitt ordinær instrumentverdi og må '
      + 'stå på allowlisten selv for å bli fritatt.',
    ).toBe(false);
    expect(
      leddErAllowlistet('.hjm-fresh i.hjm-cond'),
      'BAKDØR: samme lekkasje når den ordinære klassen står i selve nøkkel-kompounden.',
    ).toBe(false);
    expect(
      leddErAllowlistet(".hjm-fresh[data-warn='true']"),
      'allowlisten skal fortsatt frita sin egen klasse med attributt.',
    ).toBe(true);
    expect(
      leddErAllowlistet(".hjm-fresh[data-warn='true'] i"),
      'AVVIK FRA BRIEFEN, med vilje: en KLASSELØS etterkommer (<i>-prikken i '
      + 'statusmerket, WeatherScene.tsx:124) er en del av statuskomponenten og '
      + 'arver fritaket. Se leddErAllowlistet() sin egen begrunnelse — bokstavregelen '
      + 'ville gitt varselprikken en annen farge enn varselteksten.',
    ).toBe(true);
    expect(
      leddErAllowlistet('.hjm-cond i'),
      '…men arven krever en allowlistet anekst. Uten den er en klasseløs '
      + 'etterkommer like ordinær som forelderen.',
    ).toBe(false);
  });

  it('vernene er navngitt, finnes, vinner kaskaden og er faktisk i bruk', () => {
    // Et VERN er den ENESTE grunnen til at en espresso-base i skopet ikke
    // telles. Da må vernet bevises, ikke antas: slettes overstyringen skal
    // porten bli rød HER i tillegg til på bruddtallet.
    for (const forventet of FORVENTEDE_VERN) {
      const treff = VERNFUNN.filter((v) => v.fil === forventet.fil
        && v.base === forventet.base && v.egenskap === forventet.egenskap);
      expect(treff.map((v) => v.vern), `VERNET MANGLER: «${forventet.base} { ${forventet.egenskap} }» `
        + `i ${forventet.fil} skulle vært overstyrt av «${forventet.vern}». ${forventet.hvorfor}\n`
        + `Fant i stedet: ${treff.length === 0 ? '(ingenting — basen telles nå som brudd)' : treff.map((v) => v.vern).join(', ')}`)
        .toContain(forventet.vern);
    }
    expect(VERNFUNN.length, 'ingen vern i bruk — da er FORVENTEDE_VERN et dødt register '
      + 'som bare ser ut som et vern').toBeGreaterThanOrEqual(FORVENTEDE_VERN.length);
  });

  it('hevede øyer er målt, bundet til sin egen flate og faktisk i bruk', () => {
    const tokens = readFileSync(join(ROT, 'src/styles/design-tokens-v2.css'), 'utf8');
    for (const øy of HEVEDE_ØYER) {
      expect(SKOPKLASSER.has(øy.klasse), `HEVEDE_ØYER navner .${øy.klasse}, men den rendres `
        + 'ikke i noe panel — dødt unntak, fjern det').toBe(true);

      // Premisset: flaten må FLIPPE. En tema-konstant flate (som --dw-panel,
      // én verdi) kan aldri bære unntaket — da er vi tilbake til bruddet.
      const verdier = new Set((tokens.match(new RegExp(`^\\s*${øy.flate}\\s*:\\s*([^;]+);`, 'gmu')) ?? [])
        .map((s) => s.split(':')[1]!.trim()));
      expect(verdier.size, `HEVEDE_ØYER hviler på at ${øy.flate} FLIPPER med temaet sammen `
        + `med blekket. Den er deklarert med ${verdier.size} verdi(er): ${[...verdier].join(' / ')}. `
        + 'Med én verdi er flaten tema-konstant og unntaket er ugyldig.').toBeGreaterThanOrEqual(2);

      expect(ØY_BRUKT.has(øy.klasse), `HEVEDE_ØYER navner .${øy.klasse}, men unntaket fritok `
        + 'ingenting. Enten er bruddet rettet (fjern oppføringen), eller så har bindingen til '
        + `background: var(${øy.flate}) røket og deklarasjonen telles nå et annet sted.`).toBe(true);
    }
  });
});
