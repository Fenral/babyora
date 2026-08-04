/**
 * PORTDOM 23 — HANDLINGSDELEN KAN IKKE KOMME TILBAKE
 *
 * Vedtaket (`portdom-23-en-linje` i docs/design-notes/vedtak.json):
 *
 *   «Vaertilstanden staar paa foles-som-linjen. Handlingsdelen "sjekk
 *    antrekket for dere gar ut" er fjernet — knappen rett under sier det.»
 *
 * Registeret forer vedtaket som `uportert-sjekk` med merknaden «Selve
 * endringen ER gjort. Det som mangler er sjekken». Dette er den sjekken.
 *
 * ── HVORFOR DE TO EKSISTERENDE TESTENE IKKE ER EN PORT ────────────────────
 * WeatherScene.test.tsx:27/:43 og misc-components.test.tsx:67 asserterer at
 * strengen «Føles som 1°» ER der. Det er NÆRVÆRSTESTER. De sier ingenting om
 * at handlingsdelen ikke kan komme tilbake — de er grønne både før og etter
 * en regresjon. Portdom 23 trenger en FRAVÆRSTEST, og den må dekke alle
 * innganger til den samme <p>-en, ikke bare literalen forfatteren tenkte på.
 *
 * ── DE NI INNGANGENE (kartlagt 2026-08-04) ───────────────────────────────
 * Teksten i hviletilstandens panel kan gjeninnføres ni steder. Porten holder
 * dem alle, med et navngitt anker per sted (se KILDESKOP under):
 *   1  WeatherScene.tsx  `Føles som ${…}°`        — selve én-linjen
 *   2  WeatherScene.tsx  <span class="hjm-cond">  — conditionText føyes på
 *   3  WeatherScene.tsx  <p class="hjm-note">     — den frie ekstralinja
 *   4  HjemMonter.tsx    conditionText={…}        — prop-inngang, hvile
 *   5  HjemMonter.tsx    noteText={…}             — prop-inngang, andre faser
 *   6  monter-assets.ts  getConditionLabel()      — STRENGKILDEN
 *   7  WeatherStrip.tsx  `Føles som … · …`        — den komprimerte tvillingen
 *   8  cta-fingerprint.ts CTA_*_LABEL/_LINE       — «knappen rett under»
 *   9  ResultSurface.tsx «Kle på, steg for steg»  — knappens destinasjon
 *
 * Rettes bare literalen i WeatherScene, kommer teksten tilbake gjennom 4, 5,
 * 6 eller 7 uten at noe sier fra. Derfor er forbudsmønsteret SEMANTISK
 * (handlingsverb + påkledningsobjekt), ikke én eksakt streng.
 *
 * ── KOMMENTAR-FELLEN (rapportert 2026-08-04, verifisert her) ─────────────
 * Et naivt grep etter forbudsfrasen går RØDT på doktrinens EGEN prosa:
 *
 *   src/components/hjem/WeatherScene.tsx:52
 *     ` * Fjern bare "sjekk antrekket …".» Værtilstanden er REELL DATA …`
 *   src/components/hjem/HjemMonter.tsx:414
 *     ` // … (soft ved start + selection per sjekk-rad) …`
 *   src/lib/monter-assets.ts:249
 *     ` * … lue og tynn-ull-mellomlag (se over).`
 *   src/components/hjem/hjem-monter.css:251 (utenfor skopet, samme felle)
 *     ` Handlingsdelen («sjekk antrekket for dere gar ut») er borte …`
 *
 * Samme feilklasse som doktrine-linten møtte i dag, der et søk etter ordet
 * `@media` traff ordet inne i filens egen kommentar. Kommentarer strippes
 * derfor FØR skanning — med en stripper som kjenner strenger og
 * template-literaler, slik at `'https://…'` og `` `…${x}…` `` overlever.
 * Strippingen bevarer lengde og linjeskift, så linjenumre i feilmeldingene
 * peker på den EKTE fila.
 *
 * ── IKKE-VAKUØSITET ──────────────────────────────────────────────────────
 * «Er skopet stort nok» duger ikke — det ble prøvd i dag og godtok en
 * kommentarblokk. Denne porten beviser at den fant MÅLENE SINE:
 *
 *   A. Hvert av de ni stedene har et navngitt ANKER som må finnes i den
 *      strippede kilden. Forsvinner ankeret, vet ikke porten lenger hvor den
 *      leter → RØDT, ikke stille grønt.
 *   B. RENDER-LAGET beviser at INJEKSJONSFLATEN ER LEVENDE: for hver av de
 *      20 met.no-kodene rendres den EKTE hviletilstanden, og porten krever at
 *      værteksten fra `getConditionLabel` FAKTISK står i panelet. Sluttet
 *      panelet å rendre conditionText, ville en mutasjon i strengkilden ikke
 *      gitt utslag noe sted — og porten ville bestått på fravær for åttende
 *      gang. Nå feller den det i stedet.
 *   C. GRENIDENTITET: porten krever at rendringen faktisk landet i hvile
 *      (ask-blokken + panelet til stede, scan/resultat/offline fraværende).
 *      En port som måler feil skjerm har ikke bestått.
 *   D. DETEKTOREN ER IKKE BLIND: forbudsfrasen hentes ut av vedtak.json og
 *      må felles av mønsteret, sammen med varianter i omvendt ordstilling og
 *      bøyd form. Og: minst én RÅ kilde i skopet må gi treff som forsvinner
 *      etter stripping — beviset på at strippingen er lastbærende og ikke
 *      bare en formalitet.
 *
 * ── MUTASJONSKONTRAKT (to ledd, FAKTISK kjørt 2026-08-04) ────────────────
 * Utgangspunkt: GRØNN 6/6 — 6 kildefiler skannet, 16 ankre funnet,
 * 20 hviletilstander rendret, 243 assertions, 0 brudd (gulv 0).
 *
 * Ledd 1a — den åpenbare inngangen (nr. 5, prop-inngangen):
 *   `noteText="Sjekk antrekket før dere går ut."` lagt inn i HjemMonter.tsx
 *   sin hvilegren. RESULTAT: RØD, 3 av 6 tester falt, 41 brudd mot gulvet 0.
 *   Navngitt konkret: «src/components/hjem/HjemMonter.tsx:916 — "sjekk" +
 *   "antrekk" → …null} noteText="Sjekk antrekket før dere går ut."…», og
 *   40 render-brudd, ett per værkode × (panel, hele skjermen). Strukturtesten
 *   felte den uavhengig: «<p class="hjm-note"> rendres i hviletilstanden».
 *   De to ikke-vakuøsitetstestene (D detektor, A ankre) forble grønne —
 *   riktig, for målene var fortsatt der.
 *
 * Ledd 1b — den skjulte inngangen (nr. 6, strengkilden):
 *   `getConditionLabel` sin `case 'fog'` returnerte «Tåke · se over
 *   antrekket før dere går ut». HjemMonter.tsx og WeatherScene.tsx var
 *   URØRT, og `hjm-note` ble aldri rendret. RESULTAT: RØD likevel, 2 av 6
 *   tester, 3 brudd: «src/lib/monter-assets.ts:190 — "se over" + "antrekk"»
 *   pluss render-bruddet for KUN værkoden `fog` (1 av 20).
 *   Det er hele poenget med 20-kode-sveipet: en port som rendret én
 *   representativ værtilstand ville bestått denne mutasjonen.
 *
 * Ledd 2 — begge filer lagt tilbake fra kopi (md5 identisk med original):
 *   GRØNN 6/6, 0 brudd, samme 243 assertions. Ingen restfeil.
 *
 * ── BASELINE ─────────────────────────────────────────────────────────────
 * Se BASELINE_BRUDD under.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { recommend } from '../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../lib/wool-layers/types.js';
import { getConditionLabel } from '../../lib/monter-assets.js';
import type { ScanCoordinatorState } from '../../lib/scan/coordinator.js';
import type { ScanCacheSlot } from '../../lib/scan/types.js';

/**
 * BASELINE — dagens antall brudd, og GULVET porten feiler over.
 *
 * Portdom 23 ER gjennomført i koden; det som manglet var sjekken. Målt
 * 2026-08-04 over alle tre lag: 0 brudd. Null er derfor allerede det
 * ratsjede gulvet, og porten feller den FØRSTE gjeninnføringen.
 *
 * TALLET KAN BARE KRYMPE. Det står allerede på 0 og kan aldri heves — en
 * hevet baseline her ville vært å baseline selve vedtaket bort. Merk også
 * unntaket fra baseline-regelen: eierrapporterte funn kan ALDRI baselines,
 * og portdom 23 ble nettopp funnet fordi eieren spurte om teksten.
 */
const BASELINE_BRUDD = 0;

const ROT = process.cwd();

/* ══════════════════════════════════════════════════════════════════════════
   1. DETEKTOREN — semantisk, ikke én eksakt streng
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Handlingsverbene. Bøyning dekkes av fritt suffiks (`sjekk` → `sjekke`,
 * `sjekker`, `sjekket`), så lista holder stammene. `se` alene står bevisst
 * IKKE her: «Se antrekk for vogn» (stale-CTA-en) og «Se hele antrekket» er
 * navigasjon, ikke en instruks om å inspisere påkledningen.
 */
const HANDLINGSVERB = [
  'dobbeltsjekk', 'ettersjekk', 'sjekk',
  'kontroller',
  'se over', 'se etter',
  'gå over', 'gå gjennom',
] as const;

/** Påkledningsobjektene handlingen kan rette seg mot. */
const PAAKLEDNINGSORD = [
  'antrekk', 'påkledning', 'plagg',
  'klær', 'kledd', 'kler', 'kle',
] as const;

/** Verb og objekt må stå i samme setning og nær hverandre. */
const MAKS_AVSTAND = 48;
const SETNINGSSLUTT = /[.!?]/u;

type Forekomst = { ord: string; start: number; slutt: number };

/**
 * Ordforekomster med fritt suffiks, men uten bokstav FORAN — slik at
 * `sjekk` ikke dobbelttelles inne i `dobbeltsjekk`, og `kle` ikke plukkes ut
 * av `påkledning` (som står på lista i sin egen rett).
 */
function forekomster(tekst: string, ord: readonly string[]): Forekomst[] {
  const lav = tekst.toLowerCase();
  const ut: Forekomst[] = [];
  for (const o of ord) {
    let i = lav.indexOf(o);
    while (i !== -1) {
      const foran = i > 0 ? tekst[i - 1]! : ' ';
      if (!/\p{L}/u.test(foran)) ut.push({ ord: o, start: i, slutt: i + o.length });
      i = lav.indexOf(o, i + 1);
    }
  }
  return ut;
}

export type Brudd = {
  kilde: string;
  linje: number;
  verb: string;
  objekt: string;
  utdrag: string;
};

function linjenummer(tekst: string, indeks: number): number {
  let n = 1;
  for (let i = 0; i < indeks && i < tekst.length; i += 1) if (tekst[i] === '\n') n += 1;
  return n;
}

/** Handlingsverb + påkledningsord i samme setning, i begge ordstillinger. */
function finnBrudd(kilde: string, tekst: string): Brudd[] {
  const verb = forekomster(tekst, HANDLINGSVERB);
  const objekt = forekomster(tekst, PAAKLEDNINGSORD);
  const funn = new Map<number, Brudd>();
  for (const v of verb) {
    for (const o of objekt) {
      const [forst, sist] = v.start <= o.start ? [v, o] : [o, v];
      if (sist.start < forst.slutt) continue; // overlappende treff, samme ord
      const mellom = tekst.slice(forst.slutt, sist.start);
      if (mellom.length > MAKS_AVSTAND) continue;
      if (SETNINGSSLUTT.test(mellom)) continue;
      if (funn.has(forst.start)) continue;
      funn.set(forst.start, {
        kilde,
        linje: linjenummer(tekst, forst.start),
        verb: v.ord,
        objekt: o.ord,
        utdrag: tekst
          .slice(Math.max(0, forst.start - 28), Math.min(tekst.length, sist.slutt + 28))
          .replace(/\s+/gu, ' ')
          .trim(),
      });
    }
  }
  return [...funn.values()];
}

function formater(brudd: readonly Brudd[]): string {
  return brudd
    .map((b) => `  ${b.kilde}:${b.linje} — «${b.verb}» + «${b.objekt}» → …${b.utdrag}…`)
    .join('\n');
}

/* ══════════════════════════════════════════════════════════════════════════
   2. KOMMENTAR-STRIPPEREN — strenger og template-literaler overlever
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Blanker ut linje- og blokk-kommentarer (og dermed også JSX-kommentarer,
 * som er en blokk-kommentar i et uttrykk) uten å røre strenginnhold. Lengde
 * og linjeskift bevares, så indekser og linjenumre er identiske med
 * originalfila.
 */
function strippKommentarer(kilde: string): string {
  const ut = kilde.split('');
  const n = kilde.length;
  const blank = (fra: number, til: number): void => {
    for (let k = fra; k < til && k < n; k += 1) if (ut[k] !== '\n') ut[k] = ' ';
  };
  let i = 0;
  while (i < n) {
    const c = kilde[i]!;
    const neste = kilde[i + 1];
    if (c === '/' && neste === '/') {
      let j = i;
      while (j < n && kilde[j] !== '\n') j += 1;
      blank(i, j);
      i = j;
      continue;
    }
    if (c === '/' && neste === '*') {
      let j = i + 2;
      while (j < n && !(kilde[j] === '*' && kilde[j + 1] === '/')) j += 1;
      j = Math.min(n, j + 2);
      blank(i, j);
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (kilde[j] === '\\') { j += 2; continue; }
        if (kilde[j] === c || kilde[j] === '\n') break;
        j += 1;
      }
      i = Math.min(n, j + 1);
      continue;
    }
    if (c === '`') {
      // Template-literal: hoppes over i sin helhet. `${…}`-innmaten kan i
      // prinsippet holde kommentarer, men gjør det ikke i skopet — og et
      // ødelagt hopp fanges av anker-assertene under.
      let j = i + 1;
      while (j < n) {
        if (kilde[j] === '\\') { j += 2; continue; }
        if (kilde[j] === '`') break;
        j += 1;
      }
      i = Math.min(n, j + 1);
      continue;
    }
    i += 1;
  }
  return ut.join('');
}

/* ══════════════════════════════════════════════════════════════════════════
   3. KILDESKOPET — de ni inngangene, hver med sitt anker
   ══════════════════════════════════════════════════════════════════════════ */

type Skopfil = { sti: string; sted: string; ankre: readonly string[] };

const KILDESKOP: readonly Skopfil[] = [
  {
    sti: 'src/components/hjem/WeatherScene.tsx',
    sted: '1–3: literalen, hjm-cond og den frie hjm-note',
    ankre: ['Føles som ', 'hjm-cond', 'hjm-note', 'conditionText', 'noteText'],
  },
  {
    sti: 'src/components/hjem/HjemMonter.tsx',
    sted: '4–5: prop-inngangene som mater samme <p>',
    ankre: ['conditionText=', 'noteText=', 'getConditionLabel'],
  },
  {
    sti: 'src/lib/monter-assets.ts',
    sted: '6: strengkilden',
    ankre: ['export function getConditionLabel'],
  },
  {
    sti: 'src/components/hjem/WeatherStrip.tsx',
    sted: '7: den komprimerte tvillingen i result-current',
    ankre: ['Føles som ', 'conditionLabel'],
  },
  {
    sti: 'src/components/hjem/cta-fingerprint.ts',
    sted: '8: «knappen rett under», som portdommen begrunnet fjerningen med',
    ankre: ['CTA_CEREMONY_LABEL', 'CTA_REVEAL_LABEL', 'CTA_CEREMONY_LINE', 'CTA_REVEAL_LINE'],
  },
  {
    sti: 'src/components/hjem/ResultSurface.tsx',
    sted: '9: knappens destinasjon',
    ankre: ['Kle på, steg for steg'],
  },
];

const LEST = KILDESKOP.map((f) => {
  const raa = readFileSync(join(ROT, f.sti), 'utf8');
  return { ...f, raa, strippet: strippKommentarer(raa) };
});

/* ══════════════════════════════════════════════════════════════════════════
   4. RENDER-LAGET — den EKTE hviletilstanden (HjemMonter.tsx:901–948)
   ══════════════════════════════════════════════════════════════════════════ */

const scanMetoder = {
  weatherReady: vi.fn(), scanStarted: vi.fn(), scanCompleted: vi.fn(),
  identityChanged: vi.fn(), weatherBasisChanged: vi.fn(), recalcStarted: vi.fn(),
  recalcCompleted: vi.fn(), recalcFailed: vi.fn(), reset: vi.fn(),
};

vi.mock('../../hooks/useScanCoordinator.js', () => ({
  useScanCoordinator: () => ({
    getState: () => ({ phase: 'weather-ready' }) as ScanCoordinatorState,
    subscribe: () => () => {},
    state: { phase: 'weather-ready' } as ScanCoordinatorState,
    ...scanMetoder,
  }),
}));

vi.mock('../../state/scan-cache-store.js', async (importOriginal) => {
  const ekte = await importOriginal<typeof import('../../state/scan-cache-store.js')>();
  return {
    ...ekte, // behold ekte getSlotForIdentity — offline-grenen skal avgjøres av ekte logikk
    useScanCache: (
      velger: (s: {
        slots: Record<string, ScanCacheSlot>;
        commitSlot: () => void;
        markFullScanPlayedEver: () => void;
      }) => unknown,
    ) => velger({ slots: {}, commitSlot: () => {}, markFullScanPlayedEver: () => {} }),
  };
});

const { HjemMonter } = await import('../../components/hjem/HjemMonter.js');

/**
 * Hele utfallsrommet til `getConditionLabel` — inngang 6 er strengkilden, og
 * porten skal se HVER streng den kan produsere stå i det ekte panelet.
 * `ukjent-kode` treffer default-grenen («Vær»).
 */
const VAERKODER = [
  'clearsky_day', 'fair_day', 'partlycloudy_day', 'cloudy', 'fog',
  'lightrain', 'lightrainshowers_day', 'rain', 'rainshowers_day',
  'heavyrain', 'heavyrainshowers_day', 'lightsnow', 'lightsnowshowers_day',
  'snow', 'snowshowers_day', 'heavysnow', 'heavysnowshowers_day',
  'sleet', 'sleetshowers_day', 'ukjent-kode',
] as const;

function motorinngang(): RecommendInput {
  return {
    weather: { tempC: 4, feelsLikeC: 1, windMs: 3, precipMmH: 0.3, humidity: 80, symbolCode: 'lightrain', uvIndex: 0 },
    child: { ageMonths: 9, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
  };
}

function hvileProps(symbolCode: string) {
  return {
    cityLabel: 'Trondheim',
    lat: 63.43,
    lon: 10.39,
    now: {
      tempC: 4, feelsLikeC: 1, windMs: 3, windDir: 180, precipMmH: 0.3,
      symbolCode, observedAt: new Date(),
    },
    weatherStatus: 'ready' as const,
    activity: 'utelek' as const,
    onActivityChange: () => {},
    childId: 'child-1',
    childName: 'Lillian',
    ageMonths: 9,
    recommendation: recommend(motorinngang()),
    onStartDressing: () => {},
    startDressingDisabled: false,
    reducedMotion: false,
    outfitTransitionStatus: 'idle' as const,
    onOpenAdjust: () => {},
    onOpenWarmColdGuide: () => {},
    onRetryWeather: () => {},
    onOpenPlaggbib: () => {},
  };
}

function rendreHvile(symbolCode: string): string {
  return renderToStaticMarkup(createElement(HjemMonter, hvileProps(symbolCode)));
}

/**
 * HTML → lesbar tekst. Blokkslutt blir «. » slik at setningsregelen i
 * detektoren gjelder på tvers av avsnitt, mens inline-elementer (span, i, sup)
 * blir ett mellomrom — «Føles som 1°» + `<span>· Lett regn</span>` skal leses
 * som ÉN setning, siden det er nettopp der handlingsdelen sto.
 */
function tilTekst(html: string): string {
  return html
    .replace(/<\/(p|h1|h2|h3|div|section|button|li|ol|ul)>/gu, '. ')
    .replace(/<br\s*\/?>/gu, '. ')
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&quot;/gu, '"').replace(/&#x27;/gu, "'")
    .replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&')
    .replace(/[ \t]+/gu, ' ');
}

/** Panelets eget undertre — der noteText/conditionText faktisk lander. */
function panelHtml(html: string): string | null {
  const start = html.indexOf('<section class="hjm-panel"');
  if (start === -1) return null;
  let dybde = 0;
  const re = /<\/?section\b/gu;
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    dybde += m[0].startsWith('</') ? -1 : 1;
    if (dybde === 0) return html.slice(start, re.lastIndex + html.slice(re.lastIndex).indexOf('>') + 1);
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   5. PORTEN
   ══════════════════════════════════════════════════════════════════════════ */

const rapport = { filer: 0, mal: 0, assertions: 0, rendringer: 0 };

describe('portdom 23 — handlingsdelen kan ikke komme tilbake', () => {
  it('IKKE-VAKUØSITET D: detektoren feller vedtakets egen frase og bøyde varianter', () => {
    const register = JSON.parse(readFileSync(join(ROT, 'docs/design-notes/vedtak.json'), 'utf8')) as {
      vedtak: { id: string; vedtak: string }[];
    };
    const portdom23 = register.vedtak.find((v) => v.id === 'portdom-23-en-linje');
    expect(portdom23, 'vedtak.json mangler «portdom-23-en-linje» — porten håndhever et vedtak som ikke finnes')
      .toBeDefined();

    // Selve vedtakstekstens sitat av forbudsfrasen MÅ felles av mønsteret.
    expect(
      finnBrudd('vedtak.json', portdom23!.vedtak).length,
      `detektoren ser ikke frasen i vedtakets egen tekst:\n  ${portdom23!.vedtak}`,
    ).toBeGreaterThan(0);
    rapport.assertions += 1;

    const skalFelles = [
      'sjekk antrekket for dere gar ut',
      'Sjekk antrekket før dere går ut',
      'Husk å se over antrekket før turen',
      'Kontroller klærne før dere går ut',
      'Antrekket bør sjekkes før dere går ut',
      'Gå over påkledningen en gang til',
      'Husk å sjekke at hun er riktig kledd',
    ];
    for (const t of skalFelles) {
      expect(finnBrudd('selvtest', t).length, `skulle vært felt: «${t}»`).toBeGreaterThan(0);
      rapport.assertions += 1;
    }

    // Og like viktig: dagens EKTE kopi skal IKKE felles, ellers er porten
    // bare en frase-allergi og ville tvunget fram en utvanning ved første kjør.
    const skalStaa = [
      'Føles som 1° · Lett regn',
      'Finn dagens antrekk',
      'Vis dagens antrekk',
      'Været fra met.no, rådet tilpasset barnet ditt',
      'Samme antrekk som sist – det er klart',
      'Kle på, steg for steg',
      'Se antrekk for vogn',
      'Vis forrige antrekk',
      'Klar for en liten tur?',
      'Sjekk været',
    ];
    for (const t of skalStaa) {
      expect(finnBrudd('selvtest', t), `falsk positiv på ekte kopi: «${t}»`).toEqual([]);
      rapport.assertions += 1;
    }
  });

  it('IKKE-VAKUØSITET A: hvert av de ni stedene finnes igjen i den strippede kilden', () => {
    for (const f of LEST) {
      for (const anker of f.ankre) {
        expect(
          f.strippet.includes(anker),
          `${f.sti} (sted ${f.sted}): fant ikke ankeret «${anker}» i strippet kilde. `
          + 'Porten vet da ikke lenger hvor den skal lete — dette er RØDT, ikke stille grønt.',
        ).toBe(true);
        rapport.mal += 1;
        rapport.assertions += 1;
      }
      rapport.filer += 1;
    }
    expect(rapport.mal, 'null mål funnet — porten måler ingenting').toBeGreaterThanOrEqual(16);
  });

  it('KOMMENTAR-FELLEN: minst én RÅ kilde treffer, og ingen gjør det etter stripping', () => {
    const raaTreff = LEST.flatMap((f) => finnBrudd(f.sti, f.raa));
    expect(
      raaTreff.length,
      'ingen rå kilde i skopet nevner handlingsdelen lenger. Strippingen er da ikke '
      + 'lengre bevist lastbærende — og doktrinens egen begrunnelse for portdom 23 '
      + '(WeatherScene.tsx sin filhode-kommentar) er antakelig fjernet. Flytt kontrollen bevisst.',
    ).toBeGreaterThan(0);
    rapport.assertions += 1;

    const etterStripping = LEST.flatMap((f) => finnBrudd(f.sti, f.strippet));
    expect(
      etterStripping.map((b) => `${b.kilde}:${b.linje}`),
      'disse treffene overlevde strippingen — enten er de EKTE brudd, eller så er '
      + 'stripperen ødelagt:\n' + formater(etterStripping),
    ).toEqual([]);
    rapport.assertions += 1;

    // Bevis at strippingen faktisk fjernet noe, ikke at den var virkningsløs.
    expect(raaTreff.length, 'strippingen fjernet ingen treff').toBeGreaterThan(etterStripping.length);
    rapport.assertions += 1;
  });

  it('IKKE-VAKUØSITET B+C: hviletilstanden rendres, og injeksjonsflaten er LEVENDE', () => {
    for (const kode of VAERKODER) {
      const html = rendreHvile(kode);
      rapport.rendringer += 1;

      // C — grenidentitet: dette MÅ være hvilegrenen (HjemMonter.tsx:901–948).
      expect(html, `${kode}: ikke hvilegrenen — ask-blokken mangler`).toContain('Klar for en liten tur?');
      expect(html, `${kode}: panelet mangler`).toContain('<section class="hjm-panel"');
      expect(html, `${kode}: landet i scan-grenen`).not.toContain('aria-label="Beregner antrekk"');
      expect(html, `${kode}: landet i resultat-grenen`).not.toContain('Dagens antrekk');
      expect(html, `${kode}: landet i offline-grenen`).not.toContain('Vi klarer oss med sist kjente vær');
      rapport.assertions += 5;

      const panel = panelHtml(html);
      expect(panel, `${kode}: fikk ikke ut panel-undertreet`).not.toBeNull();
      const panelTekst = tilTekst(panel!);

      // B — injeksjonsflaten lever: føles-som-linjen OG værteksten fra
      // strengkilden står faktisk i panelet. Slutter den å stå der, kan en
      // mutasjon i getConditionLabel ikke lenger måles, og porten ville
      // bestått på fravær.
      expect(panelTekst, `${kode}: «Føles som» mangler i panelet`).toContain('Føles som');
      const forventet = getConditionLabel(kode);
      expect(
        panelTekst,
        `${kode}: værteksten «${forventet}» fra getConditionLabel står IKKE i panelet — `
        + 'injeksjonsflaten er død, og porten måler ingenting for inngang 6',
      ).toContain(forventet);
      rapport.assertions += 2;

      // Den åpne døra: hviletilstanden skal ikke ha noen fri notatlinje.
      // (WeatherScene sin egen kontrakt: «hviletilstanden bruker conditionText».)
      expect(
        html,
        `${kode}: <p class="hjm-note"> rendres i hviletilstanden. Den frie ekstralinja `
        + 'inne i panelet er nøyaktig døra portdom 23 lukket.',
      ).not.toContain('hjm-note');
      rapport.assertions += 1;
    }
    expect(rapport.rendringer, 'null rendringer — porten måler ingen skjerm').toBe(VAERKODER.length);
  });

  it(`ingen handlingsdel i hviletilstanden — baseline ${BASELINE_BRUDD}, feiler ved ØKNING`, () => {
    const brudd: Brudd[] = [];

    // Lag 1: rendret hviletilstand, hele skjermen og panelet for seg.
    for (const kode of VAERKODER) {
      const html = rendreHvile(kode);
      const panel = panelHtml(html);
      brudd.push(...finnBrudd(`rendret hvile [${kode}] · panel`, tilTekst(panel ?? '')));
      brudd.push(...finnBrudd(`rendret hvile [${kode}] · hele skjermen`, tilTekst(html)));
      rapport.assertions += 2;
    }

    // Lag 2: kildene bak de ni inngangene, kommentarer strippet.
    for (const f of LEST) {
      brudd.push(...finnBrudd(f.sti, f.strippet));
      rapport.assertions += 1;
    }

    expect(
      brudd.length,
      `handlingsdelen er tilbake — ${brudd.length} brudd mot gulvet ${BASELINE_BRUDD}:\n`
      + formater(brudd)
      + '\n\nPortdom 23: værtilstanden står PÅ føles-som-linjen. Handlingsdelen om å '
      + 'sjekke antrekket er fjernet fordi CTA-en rett under sier nettopp det.',
    ).toBeLessThanOrEqual(BASELINE_BRUDD);

    console.log(
      `\n  portdom-23: ${rapport.filer} kildefiler skannet, ${rapport.mal} ankre funnet, `
      + `${rapport.rendringer} hviletilstander rendret, ${rapport.assertions} assertions kjørt, `
      + `${brudd.length} brudd (gulv ${BASELINE_BRUDD})\n`,
    );
  });

  it('strengkildens utfallsrom slår faktisk gjennom i panelet — ikke bare én tilstand målt', () => {
    // Antall DISTINKTE panelteksts skal være nøyaktig antall distinkte
    // strenger `getConditionLabel` kan produsere for de 20 kodene (13 —
    // showers-variantene kollapser til samme tekst). Færre = symbolCode når
    // ikke fram, og porten måler i praksis bare én tilstand om og om igjen.
    const forventetAntall = new Set(VAERKODER.map((k) => getConditionLabel(k))).size;
    const tekster = new Set(VAERKODER.map((k) => tilTekst(panelHtml(rendreHvile(k)) ?? '')));
    expect(
      tekster.size,
      `strengkilden kan gi ${forventetAntall} distinkte værtekster, men panelet viste `
      + `${tekster.size}. Da er ikke hele utfallsrommet målt.`,
    ).toBe(forventetAntall);
    rapport.assertions += 1;
  });
});
