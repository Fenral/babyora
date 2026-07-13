/**
 * vinterprogram — «Første vinter med baby»: 8 ukentlige leksjoner (F86).
 *
 * Innholdet er forankret i appens egne kilder (docs/F62-research-baby-
 * thermoregulation.md, garment-info.ts, alternatives.ts, safety.ts,
 * tables.ts/modifiers.ts) — se `kilde` per leksjon. Helsefaglige tall er
 * ALDRI oppfunnet; alle er sporet til kilde (Fable-QA 2026-07-11).
 *
 * Drip-modell: programmet starter automatisk første gang brukeren åpner
 * program-skjermen (start-dato i localStorage). Leksjon N låses opp
 * (N-1) uker etter start. Leksjon 1 er alltid gratis (teaser); leksjon 2-8
 * krever Babyora Pluss (gating i UI via useAccess — IKKE her; datalaget er
 * tilgangs-agnostisk).
 */
import type { GuideHubTarget } from '../screens/GuideHubScreen';

export type LessonSection = {
  heading: string;
  body: string;
};

export type Lesson = {
  id: string;
  week: number;
  title: string;
  lead: string;
  sections: LessonSection[];
  tryDet: { label: string; target: GuideHubTarget };
  /** Intern kildesporing (vises aldri i UI). */
  kilde: string;
};

export const LESSONS: readonly Lesson[] = [
  {
    id: 'ull-mot-huden',
    week: 1,
    title: 'Ull mot huden',
    lead: 'Ull regulerer varme og fukt mot huden, men det er ikke alltid riktig valg for akkurat ditt barn.',
    sections: [
      {
        heading: 'Hvorfor ull er førstevalget',
        body: 'Ull holder på varmen selv når den blir fuktig, og transporterer svette bort fra huden bedre enn de fleste andre materialer. Den er også luktsvak, så du vasker sjeldnere. Derfor foreslår Babyora ull som førstevalg innerst.',
      },
      {
        heading: 'Prisen for godene',
        body: 'Ull koster mer, tåler kun skånsom vask, og slites fortere enn syntetiske stoffer. Det er en reell avveining, ikke bare et kvalitetsstempel du skal strekke deg etter for enhver pris.',
      },
      {
        heading: 'Når bomull er riktig',
        body: 'Om lag 4 av 10 norske barn har hud som reagerer på ull mot kroppen. Barnelegers råd er da bambus eller bomull innerst, med ull som lag nummer to i stedet.',
      },
      {
        heading: 'Ingen fasit, bare et godt utgangspunkt',
        body: 'Merk hvordan barnet ditt reagerer de første ukene. Rødme, kløe eller uro etter påkledning er tegn på at bomull innerst kan passe bedre for akkurat dere. Ull kan fortsatt brukes i lagene utenpå.',
      },
    ],
    tryDet: { label: 'Se ull og bomull i garderoben din', target: 'min-garderobe' },
    kilde: 'F62 pkt. 5-6 (barnelegeforening/Kvenshagen 40 %-regelen), alternatives.ts (WOOL/COTTON pros/cons)',
  },
  {
    id: 'lag-pa-lag',
    week: 2,
    title: 'Lag på lag',
    lead: 'Tre lag du kan justere slår ett tykt plagg du ikke kan gjøre noe med.',
    sections: [
      {
        heading: 'Modellen: innerst, mellomlag, yttertøy',
        body: 'Innerst ligger tynt mot huden og leder fukt vekk. Mellomlaget bygger varmen. Yttertøyet stopper vind og vann. Babyoras anbefalinger er alltid bygget opp i denne rekkefølgen, uansett vær.',
      },
      {
        heading: 'Hvorfor lag slår volum',
        body: 'Luften mellom lagene isolerer. Med tre tynne lag kan du ta av ett når barnet blir varmt i vogna, eller legge til ett når dere går ut i kulden, uten å bytte hele antrekket.',
      },
      {
        heading: 'Yttertøyet gjør lite alene',
        body: 'Et vindtett skall uten isolerende lag under holder verken varmen eller fukten unna. Det er kombinasjonen som fungerer, ikke ett enkelt plagg.',
      },
      {
        heading: 'Én ekstra ull-regel for de minste',
        body: 'For barn under 3 måneder legger Babyora automatisk til et ekstra ull-lag i kaldere vær, fordi de yngste regulerer varme dårligere enn eldre barn.',
      },
    ],
    tryDet: { label: 'Bygg lagene i kalkulatoren', target: 'finn-antrekk' },
    kilde: 'F62 pkt. 6 (tre-lags-prinsippet), tables.ts (lag-struktur), modifiers.ts (ekstra ull-lag under 3 mnd)',
  },
  {
    id: 'vind-skjult-faktor',
    week: 3,
    title: 'Vind er den skjulte faktoren',
    lead: 'Anbefalingen følger «føles som»-temperaturen, ikke gradestokken alene.',
    sections: [
      {
        heading: 'Vind stjeler varme du ikke ser',
        body: 'To dager med samme gradestokk kan føles helt ulikt. Fuktig kulde og vind trekker varme fra huden raskere enn stillestående tørr luft. Babyora regner derfor alltid på føles-som-temperatur, ikke rå temperatur.',
      },
      {
        heading: 'Når vinden krever et ekstra lag',
        body: 'Fra rundt 5 meter i sekundet i kjølig vær legger appen til et vindtett ytterlag. Under 0 grader og over 8 meter i sekundet kommer vindtette votter i tillegg til de vanlige.',
      },
      {
        heading: 'Fuktig kulde lurer deg',
        body: 'Fuktig kulde føles kaldere enn det termometeret sier. Da er det smart med ett ekstra lag, selv om tallet på telefonen ikke ser så ille ut.',
      },
      {
        heading: 'De minste og vind sammen',
        body: 'For barn under 3 måneder i minusgrader med mye vind anbefaler appen heller å vente til vinden løyer enn å presse gjennom turen.',
      },
    ],
    tryDet: { label: 'Test vind i kalkulatoren', target: 'finn-antrekk' },
    kilde: 'tables.ts (feelsLikeC styrer temp-bånd), garment-info.ts (vindtett skall/vindvotter), modifiers.ts (fuktig kulde, nyfødt+vind)',
  },
  {
    id: 'vogn-baeresele-lek',
    week: 4,
    title: 'Vogn, bæresele eller lek',
    lead: 'Aktiviteten avgjør hvor mye varme barnet lager selv, og dermed hvor mye klær det trenger.',
    sections: [
      {
        heading: 'Vogn: barnet ligger stille',
        body: 'Uten egen bevegelse er barnet i vogna avhengig av klærne og varmeposen for å holde varmen. Derfor får vogn-anbefalingen ofte mer isolasjon enn samme temperatur i bæresele eller lek.',
      },
      {
        heading: 'Bæresele: du varmer barnet',
        body: 'Kroppsvarmen din gjør jobben. Har barnet innerjakke inne i selen din, dropper Babyora yttertøyet helt fra rundt 10 grader og nedover, for å unngå at det blir for varmt.',
      },
      {
        heading: 'Utelek: bevegelse lager varme',
        body: 'Et barn som krabber eller går ute produserer egen kroppsvarme. Da trenger det ofte lettere og mer bevegelige plagg enn et barn som ligger stille i vogna ved samme temperatur.',
      },
      {
        heading: 'Samme gradestokk, tre ulike svar',
        body: 'Det er derfor Babyora alltid spør om aktivitet før den anbefaler noe. Samme kalde dag kan bety varmepose i vogna, tynnere jakke i selen, og en robust dress i lek.',
      },
    ],
    tryDet: { label: 'Bytt aktivitet i kalkulatoren', target: 'finn-antrekk' },
    kilde: 'tables.ts (aktivitet per temp-bånd), modifiers.ts (bæresele+innerjakke, SB-4)',
  },
  {
    id: 'sjekk-nakken',
    week: 5,
    title: 'Sjekk nakken',
    lead: 'Én rutine overstyrer alle andre regler, og den tar ti sekunder.',
    sections: [
      {
        heading: 'Slik gjør du det',
        body: 'Stikk to fingre inn under genseren bak i nakken, ikke i hendene eller føttene som naturlig er kjøligere. Varm og tørr nakke betyr at antrekket er passe.',
      },
      {
        heading: 'Tre svar, tre reaksjoner',
        body: 'Klam eller svett nakke betyr for varmt, ta av et lag. Kjølig eller kald nakke betyr for lite på, legg til et lag. Lun og tørr nakke betyr at du kan la det være.',
      },
      {
        heading: 'Hvorfor dette overstyrer appen',
        body: 'Vær, alder og aktivitet gir appen et godt utgangspunkt, men bare kroppen til barnet ditt vet hvordan akkurat den dagen faktisk føles. Nakketesten er siste og viktigste sjekk.',
      },
      {
        heading: 'For mye tøy er den vanligste feilen',
        body: 'De fleste av oss pakker inn litt for godt av ren omsorg. Overoppheting er vanligere enn nedkjøling, og det er akkurat da nakketesten gjør størst nytte.',
      },
    ],
    tryDet: { label: 'Prøv nakketesten', target: 'varm-kald' },
    kilde: 'VarmEllerKaldScreen (nakketesten), modifiers.ts (nakke-sjekk-note), softBlocks.ts (overopphetings-regler SB-2/3/5/6/7)',
  },
  {
    id: 'sove-ute-vinter',
    week: 6,
    title: 'Sove ute i vinter',
    lead: 'Sovepose og romtemperatur følger et TOG-system, men vogn ute i kulde har egne regler.',
    sections: [
      {
        heading: 'TOG-trinnene innendørs',
        body: 'Under 16 grader: 3.5 TOG med langermet body og pyjamas under. 16 til 20 grader: 2.5 TOG. 20 til 24 grader: 1.0 TOG. Over 24 grader: 0.5 TOG eller lavere. Norsk praksis legger seg gjerne på 18 grader og 2.5 TOG.',
      },
      {
        heading: 'To regler som aldri viker',
        body: 'Bruk aldri to soveposer samtidig, det gir overopphetings-risiko selv om hver av dem er tynn. Sovepose erstatter teppe, ikke begge deler.',
      },
      {
        heading: 'Vognsøvn ute er en egen kategori',
        body: 'Når barnet sover ute i vogna, gjelder ikke TOG-tallene. Det er kjøredress, varmepose og lue som gjelder, akkurat som våken vogn-anbefaling. Legg aldri teppe over kalesjen, det blir en varmefelle.',
      },
      {
        heading: 'I streng kulde: sjekk oftere',
        body: 'Sover barnet ute i frost under minus 7 grader over en halvtime, sjekk innom hvert 30. minutt. Varmepose med dun alene er ikke alltid nok i den kulden.',
      },
    ],
    tryDet: { label: 'Finn riktig TOG-trinn', target: 'tog' },
    kilde: 'F62 pkt. 3 (TOG-trinn), safety.ts (HB-2/HB-3), modifiers.ts pkt. 14 (utesov frost-sjekk)',
  },
  {
    id: 'frost-dager',
    week: 7,
    title: 'Frost-dager',
    lead: 'Under minus 10 grader bør de aller minste helst holde seg inne.',
    sections: [
      {
        heading: 'Grensen ved minus 10',
        body: 'Norske råd anbefaler at spedbarn ikke er ute når det er kaldere enn minus 10 grader. Under den grensen handler det om å beskytte, ikke å trosse kulden.',
      },
      {
        heading: 'Balaklava og isolert dress',
        body: 'I streng frost dekker balaklava hode, ører og hals, og et maks-isolert yttertøy holder varmen lenger ved stillesitting. Dette er trinnet over vanlig vinterdress, ikke et alternativ til det.',
      },
      {
        heading: 'Korte turer, hyppige sjekker',
        body: 'Ved føles-som minus 10 grader eller kaldere anbefaler appen korte turer med sjekk av kinn, nese og ører hvert 20. minutt. Hvite flekker på huden er tegn på at den begynner å fryse.',
      },
      {
        heading: 'For de aller yngste',
        body: 'Barn under 3 måneder bør maks være ute en halvtime i minusgrader, uansett hvor godt kledd de er. Smør fet krem på kinnene en halvtime før dere går ut i frost.',
      },
    ],
    tryDet: { label: 'Se antrekket for minus 10', target: 'finn-antrekk' },
    kilde: 'F62 pkt. 6 (minus 10-grensen), softBlocks.ts (SB-8 frostsjekk), modifiers.ts pkt. 9 og 16 (frostkrem, nyfødt-grense)',
  },
  {
    id: 'din-garderobe-din-anbefaling',
    week: 8,
    title: 'Din garderobe, din anbefaling',
    lead: 'Med Pluss bruker appen dine egne plagg i anbefalingen, ikke et generisk sett.',
    sections: [
      {
        heading: 'Fra generisk til ditt',
        body: 'Uten garderobe-tilpasning foreslår Babyora det teknisk beste plagget for hver situasjon. Med Pluss ser motoren hva du faktisk eier, og bygger anbefalingen rundt det.',
      },
      {
        heading: 'Har du det ikke, får du nest best',
        body: 'Merker du et plagg som «har ikke», bytter motoren automatisk til det nærmeste eide alternativet, med samme ærlige fordeler og ulemper som i plagg-detaljene: pris, varme, fukt og vask.',
      },
      {
        heading: 'Sikkerhet byttes aldri stille',
        body: 'Sovepose og isolert vinter-yttertøy er unntaket. Der varsler appen deg tydelig i stedet for å bytte ned uten videre, fordi disse plaggene er dimensjonert for en bestemt varme.',
      },
      {
        heading: 'Bygg garderoben etter hvert',
        body: 'Du trenger ikke legge inn alt på én gang. Legg til plagg etter hvert som du kjøper eller arver dem, så blir anbefalingen mer og mer treffsikker for akkurat deres skap.',
      },
    ],
    tryDet: { label: 'Fyll ut Mine plagg', target: 'min-garderobe' },
    kilde: 'alternatives.ts (ITEM_ALTERNATIVES), ownership-override.ts (SAFETY_CRITICAL-guardrail)',
  },
] as const;

/* ── Drip-modell ─────────────────────────────────────────────────────────── */

const START_KEY = 'babyora:vinterprogram:start';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Hent (eller sett ved første besøk) programmets start-dato. */
export function ensureProgramStart(): number {
  try {
    const raw = localStorage.getItem(START_KEY);
    if (raw) {
      const t = Number(raw);
      if (Number.isFinite(t) && t > 0) return t;
    }
    const now = Date.now();
    localStorage.setItem(START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export type LessonAvailability =
  | { state: 'open' }
  | { state: 'drip'; opensInDays: number };

/**
 * Drip-tilgjengelighet for en leksjon (uavhengig av Pluss-gating — den
 * håndteres i UI-laget): leksjon N åpner (N-1) uker etter program-start.
 */
export function lessonAvailability(week: number, startedAt: number, now: number = Date.now()): LessonAvailability {
  const opensAt = startedAt + (week - 1) * WEEK_MS;
  if (now >= opensAt) return { state: 'open' };
  const days = Math.max(1, Math.ceil((opensAt - now) / (24 * 60 * 60 * 1000)));
  return { state: 'drip', opensInDays: days };
}

/** Antall leksjoner som er drip-åpne (til «Uke X av 8»-progresjonen). */
export function openLessonCount(startedAt: number, now: number = Date.now()): number {
  return LESSONS.filter((l) => lessonAvailability(l.week, startedAt, now).state === 'open').length;
}
