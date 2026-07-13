/**
 * Aktivitet barnet skal være i.
 *
 * Iter 32a — `soevn` lagt til. Søvn er innendørs:
 * - `tempC` tolkes som ROMTEMPERATUR (ikke utetemperatur)
 * - Vind/regn/sol/UV-modifikatorer hopppes
 * - Output legger til TOG-anbefaling i `summary`
 */
export type Activity = 'vogn' | 'baeresele' | 'utelek' | 'soevn';

export type WeatherInput = {
  /** Føles-som-temperatur (ute) ELLER romtemperatur (ved activity='soevn'). */
  feelsLikeC: number;
  /** Faktisk lufttemperatur (ute) ELLER samme som feelsLikeC (ved soevn). */
  tempC: number;
  windMs: number;
  precipMmH: number;
  /** Relativ luftfuktighet (0-100). Optional — kun brukt ved feels <10 °C, ute-aktiviteter. */
  humidity?: number;
  /** met.no symbolCode (eks "clearsky_day"). Trigger sol/klarvær-modifier. Ignoreres ved soevn. */
  symbolCode?: string;
  /** UV-indeks (0-11+). Optional — brukt for sterk-sol-noten. Ignoreres ved soevn. */
  uvIndex?: number;
};

/**
 * Barn-input til regelmotoren.
 *
 * Iter 32a (jun 2026) — Babyora-målgruppen er nå 0-24 mnd (v1).
 * Verdier >24 håndteres fortsatt (motoren krasjer ikke), men anbefalingene
 * er ikke optimert for større barn. UI skal vise soft-warning, ikke hard block.
 * Vekstvei: Babyora Junior 2-6 år som v2-produkt.
 */
export type ChildInput = {
  /** Alder i måneder. Optimalt 0-24 for v1. Soft-warning ved >24 i UI. */
  ageMonths: number;
  /**
   * Iter 35 — kan barnet rulle? Trigger HB-6 (stopp svøping når rulle-evne
   * er der). AAP-2022 + RN-WRAP: typisk fra 3-4 mnd, men variabelt. Hvis
   * undefined faller engine tilbake til ageMonths >= 4 som proxy.
   */
  canRoll?: boolean;
};

export type RecommendInput = {
  weather: WeatherInput;
  child: ChildInput;
  activity: Activity;
  /** Planlagt eksponeringstid i minutter. Default 60. Brukes for kulde-warning. */
  exposureMin?: number;
  /** Kun for bæresele: barn under foreldrens jakke (foreldrekropp varmer). */
  innerJakke?: boolean;
  /**
   * Kun for vogn: er barnet våkent eller sover?
   * Iter 33 (jun 2026) — Norske barn sover ofte i vogn i sovepose. 'sleeping'
   * gjør at base-outfit hentes fra soevn-tabellen (temp-aware sovepose), men
   * outdoor-modifiers (vind/regn/sol) anvendes som vanlig vogn.
   * Default 'awake' for bakoverkompatibilitet.
   */
  vognMode?: 'awake' | 'sleeping';
  /**
   * Iter 35 — kontekstuelle modi som overstyrer hva som er trygt uavhengig
   * av aktivitet. Eks: barnet skal i bilstol etter vogn-turen → HB-9 fjerner
   * vinterkjøredress / vinterdress.
   */
  context?: {
    bilstol?: boolean;
  };
  /**
   * P9.5 (2026-06-13): per-barn-kalibrering basert på «Var det passe?»-svar.
   * Konservativ regel: maks ±1, kun aktivert ved ≥3 konsistente svar.
   * Beregnes utenfor motoren (feedback-store), motoren bare applicerer.
   *
   * +1 = bruker har meldt barnet ofte er kaldt → legg til mellomlag hvis mulig
   * -1 = bruker har meldt barnet ofte er varmt → trekk fra mellomlag/ekstra
   *  0 = ingen justering
   *
   * Aldri under guardrail-minimum: safety.ts kjører ETTER kalibrering så
   * sikkerhetsregler trumfer.
   */
  childCalibration?: -1 | 0 | 1;
};

/**
 * Lag-kategorier.
 *
 * B-2 (2026-06-12): `utstyr` lagt til. Utstyr er IKKE klær på barnet,
 * men eksterne hjelpemidler som beskytter eller varmer:
 * - `regntrekk på vognen` (precipMmH > 1, vogn-aktivitet)
 * - `vognpose` (kald + vogn, varmt løse stoff i vognen)
 * - `kjørepose` (bilstol-kontekst, alternativ til vatterte dresser)
 *
 * Motiv: A-1 anomalien viste at motoren oppgraderte yttertøy
 * (kjøredress → vinterkjøredress) for å kompensere for vått-vær,
 * mens en bedre løsning er regntrekk på vognen + behold kjøredress.
 */
export type LayerCategory = 'innerst' | 'mellomlag' | 'yttertoy' | 'ekstra' | 'utstyr';

/**
 * B-1 (2026-06-12): bruker-overrides per kategori. Lar UI overstyre items
 * etter motoren har laget anbefaling. Brukes for «bytt plagg»-flow.
 *
 * Verdiene er hele item-lista som skal erstatte den motor-genererte —
 * IKKE en delta. Toast med angre lar bruker reverter på UI-nivå.
 */
export type LayerOverrides = Partial<Record<LayerCategory, string[]>>;

export type Layer = {
  category: LayerCategory;
  items: string[];
};

export type NoteCategory = 'overoppheting' | 'kulde' | 'sol' | 'nedbor' | 'sikkerhet' | 'alder';

export type Note = {
  category: NoteCategory;
  message: string;
};

export type Recommendation = {
  activity: Activity;
  tempBand: TempBand;
  layers: Layer[];
  /** Backwards-compat: strings. v0.3.0 vil legge til structuredNotes også. */
  notes: string[];
  /** Iter 26: strukturerte notes med kategori (for UI-gruppering). */
  structuredNotes: Note[];
  summary: string;
  /**
   * Iter 35 — Safety flags utløst av OVERHEATING_SYSTEM_V1 hard/soft blocks.
   * Tom array når ingen er utløst. UI bruker disse til kritisk visning.
   */
  safetyFlags?: import('./safety.js').SafetyFlag[];
  /** Iter 35 — høyeste severity utløst i denne anbefalingen. */
  severity?: import('./safety.js').Severity;
};

export type TempBand =
  | 'tropisk'
  | 'varm'
  | 'mild'
  | 'kjolig'
  | 'kald'
  | 'frost'
  | 'streng_frost'
  | 'ekstrem'
  | 'ekstrem_varme';
