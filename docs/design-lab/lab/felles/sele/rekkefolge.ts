/**
 * Rekkefølge for eksperimentet — WILLIAMS-DESIGN (spec v2 §2 + Sols
 * klarsignalmerknad: «Kontroller også at rekkefølgeplanen balanserer
 * førsteordens carryover, ikke bare posisjon. Et ordinært latinsk kvadrat
 * gjør ikke nødvendigvis dette alene for fem eksponeringer.»)
 *
 * Fem eksponeringer (P1–P4 + nullmodell) er et ODDETALL. Da finnes ingen
 * enkelt 5×5-kvadrat som er carryover-balansert; Williams' konstruksjon
 * krever 2n = 10 sekvenser (grunnkvadratet + speilingen). Resultat:
 *  - hver arm står i hver posisjon nøyaktig 2 ganger (posisjonsbalanse), og
 *  - hvert ordnede par (a etterfulgt av b, a ≠ b) forekommer nøyaktig
 *    2 ganger totalt (førsteordens carryover-balanse).
 * Deltakere tildeles sekvens = (deltakernr − 1) mod 10.
 *
 * Carryover-analyseplan (manifestkrav): med 10 sekvenser kan førsteordens
 * carryover estimeres ved å sammenligne en arms måleutfall betinget på
 * forrige arm (2 observasjoner per ordnet par per fulle rotasjon av 10
 * deltakere). Analysen kjøres utenfor selen; selen garanterer balansen og
 * logger posisjon + foregående arm per oppgave.
 *
 * SCENARIOFAMILIER: trenings- og målescenarier holdes adskilt (spec §2).
 * Familiene grupperer scenarier med samme motorutfall-klasse (dokumentert
 * ekvivalent vanskelighetsgrad) men ulike overflateverdier; trening skjer
 * alltid på familiens treningsscenario, måling kun på målescenariene.
 */

export type Arm = 'p1' | 'p2' | 'p3' | 'p4' | 'null';

export const ARMER: readonly Arm[] = ['p1', 'p2', 'p3', 'p4', 'null'];

export const ARM_NAVN: Record<Arm, string> = {
  p1: 'P1 — Protokollen',
  p2: 'P2 — Spennet (instrumenttest)',
  p3: 'P3 — Briefen (tidslinje)',
  p4: 'P4 — Komposisjonen (brief → protokoll)',
  null: 'Nullmodell — værapp + ni-ords-regelen + melding',
};

/* ------------------------------------------------------------------ *
 * Williams-konstruksjonen
 * ------------------------------------------------------------------ */

/**
 * Williams-sekvenser for n behandlinger, som indeksrader.
 * Grunnrad: 0, 1, n−1, 2, n−2, … ; radene er sykliske skift av den.
 * For like n holder de n radene; for odde n legges speilede rader til
 * (2n rader totalt) — det er dette et vanlig latinsk kvadrat mangler.
 */
export function williamsSekvenser(n: number): number[][] {
  if (!Number.isInteger(n) || n < 2) {
    throw new Error(`williamsSekvenser: n må være heltall ≥ 2, fikk ${n}`);
  }
  const grunn: number[] = [0];
  let lav = 1;
  let hoy = n - 1;
  let taLav = true;
  while (grunn.length < n) {
    grunn.push(taLav ? lav++ : hoy--);
    taLav = !taLav;
  }
  const kvadrat = Array.from({ length: n }, (_, i) =>
    grunn.map((x) => (x + i) % n),
  );
  if (n % 2 === 0) return kvadrat;
  const speil = kvadrat.map((rad) => [...rad].reverse());
  return [...kvadrat, ...speil];
}

/** De 10 arm-sekvensene for labens fem eksponeringer. */
export const WILLIAMS_ARMSEKVENSER: readonly (readonly Arm[])[] =
  williamsSekvenser(ARMER.length).map((rad) => rad.map((i) => ARMER[i]));

/** Sekvens for en deltaker (1-basert deltakernummer). */
export function rekkefolgeForDeltaker(deltakerNr: number): Arm[] {
  const rader = WILLIAMS_ARMSEKVENSER;
  const idx =
    (((Math.floor(deltakerNr) - 1) % rader.length) + rader.length) %
    rader.length;
  return [...rader[idx]];
}

/* ------------------------------------------------------------------ *
 * Balansesjekker — selens egen fasit (brukes i tester og i shell-visning)
 * ------------------------------------------------------------------ */

/** Teller ordnede nabo-par «a→b» over alle sekvenser. */
export function carryoverTelling(
  sekvenser: readonly (readonly (string | number)[])[],
): Map<string, number> {
  const telling = new Map<string, number>();
  for (const rad of sekvenser) {
    for (let i = 1; i < rad.length; i++) {
      const nokkel = `${rad[i - 1]}→${rad[i]}`;
      telling.set(nokkel, (telling.get(nokkel) ?? 0) + 1);
    }
  }
  return telling;
}

/**
 * true hvis hvert ordnede par (a≠b) forekommer LIKE mange ganger — og alle
 * mulige par faktisk forekommer. Dette er kravet et vanlig latinsk kvadrat
 * ikke oppfyller for oddetall.
 */
export function erCarryoverBalansert(
  sekvenser: readonly (readonly (string | number)[])[],
): boolean {
  if (sekvenser.length === 0) return false;
  const behandlinger = [...new Set(sekvenser.flat().map(String))];
  const n = behandlinger.length;
  const telling = carryoverTelling(sekvenser);
  const forventedePar = n * (n - 1);
  if (telling.size !== forventedePar) return false;
  const verdier = [...telling.values()];
  return verdier.every((v) => v === verdier[0]);
}

/** true hvis hver behandling står i hver posisjon like mange ganger. */
export function erPosisjonsbalansert(
  sekvenser: readonly (readonly (string | number)[])[],
): boolean {
  if (sekvenser.length === 0) return false;
  const lengde = sekvenser[0].length;
  const telling = new Map<string, number>();
  for (const rad of sekvenser) {
    if (rad.length !== lengde) return false;
    rad.forEach((b, pos) => {
      const nokkel = `${b}@${pos}`;
      telling.set(nokkel, (telling.get(nokkel) ?? 0) + 1);
    });
  }
  const verdier = [...telling.values()];
  return verdier.every((v) => v === verdier[0]);
}

/* ------------------------------------------------------------------ *
 * Scenariofamilier — trening vs. måling (spec §2)
 * ------------------------------------------------------------------ */

export type ScenarioFamilie = {
  id: string;
  /** Dokumentert ekvivalens: hvorfor scenariene har samme vanskelighetsgrad. */
  begrunnelse: string;
  /** Brukes KUN til trening/innføring — aldri i skåring. */
  trening: string;
  /** Brukes KUN til måling. */
  maaling: string[];
};

export const SCENARIOFAMILIER: readonly ScenarioFamilie[] = [
  {
    id: 'normalklassen',
    begrunnelse:
      'Samme motorutfall-klasse (normal tilstand) og identisk vær (5 °C, ' +
      '3 m/s, oppholdsvær). Overflatevariasjonen er mottaker (ny omsorgs-' +
      'person) og tekstskala (stor tekst) — ikke beslutningsvanskelighet.',
    trening: 'normal-dag',
    maaling: ['ny-omsorgsperson', 'dynamic-type'],
  },
  {
    id: 'grenseklassen',
    begrunnelse:
      'Myk kontrollklasse rundt frysepunktet: sludd (grensevær) og delta ' +
      '(endret vær) gir samme utfallsklasse — fortsett, men kontroller ' +
      'underveis. Ulike overflater: nedbør vs. synlig baseline-endring.',
    trening: 'grensevaer',
    maaling: ['endret-vaer'],
  },
  {
    id: 'avviksklassen',
    begrunnelse:
      'Hard sikkerhetsklasse i kulde: sovende vognbarn (−5 °C), bilstol ' +
      '(−8 °C) og utendørslys (−2 °C, vind) utløser alle harde hendelser ' +
      'med stoppkriterium. Ulike overflater: søvn, sele, kontrast.',
    trening: 'sovende-vognbarn',
    maaling: ['bilstol', 'utendorslys'],
  },
  {
    id: 'degradertklassen',
    begrunnelse:
      'Degradert klasse: manglende værdata og utløpt råd ender begge i ' +
      'strukturell maskering uten plaggliste — samme forventede handling ' +
      '(fallback), ulik årsak (aldri data vs. passert gyldighet).',
    trening: 'manglende-vaerdata',
    maaling: ['utlopt-raad'],
  },
];

export function treningsScenarier(): string[] {
  return SCENARIOFAMILIER.map((f) => f.trening);
}

export function maaleScenarier(): string[] {
  return SCENARIOFAMILIER.flatMap((f) => f.maaling);
}

export type ScenarioTildeling = {
  /** Treningsscenario per familie — kjøres først, skåres aldri. */
  trening: string[];
  /** Ett målescenario per familie, rotert per deltaker + posisjon. */
  maaling: string[];
};

/**
 * Scenariotildeling for én eksponering (posisjon 0–4 i sekvensen).
 * Målescenariet roteres innen familien med (deltaker + posisjon) slik at
 * armene møter ekvivalente, men ikke identiske, overflateverdier.
 * Kjent begrensning (logget i analyseplanen): med 10 faste scenarier vil
 * samme målescenario gjenses på tvers av armer for én deltaker; familie-
 * ekvivalensen — ikke scenario-unikhet — bærer sammenligningen.
 */
export function tildelScenarier(
  deltakerNr: number,
  posisjon: number,
): ScenarioTildeling {
  const rot = Math.abs(Math.floor(deltakerNr) + Math.floor(posisjon));
  return {
    trening: treningsScenarier(),
    maaling: SCENARIOFAMILIER.map(
      (f) => f.maaling[rot % f.maaling.length],
    ),
  };
}
