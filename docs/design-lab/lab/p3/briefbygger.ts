/**
 * P3 AMBIENT BRIEFING — briefbyggeren (retningens transformator,
 * spec v2 §1 pkt. 3 og §3-sløyfen for P3).
 *
 * NoytraleFakta (+ ev. gårsdagens vær fra scenariet) → Brief-innhold:
 *   { delta (deltaSetning fra felles/tekst) MED synlig versjonert baseline
 *     («i går V1 (føltes 5 °C): tykt ullsett, ull-mellomlag, kjøredress»),
 *     handling, gyldighet, svakestePremiss }
 * pakket i brief-maskinens kontrakt (Brief.innhold er JSON av BriefInnhold).
 *
 * HANDLINGSKOMPLETT (Sols P3-P0): briefens handling er alltid en KONKRET
 * endring/bekreftelse med basePlagg-navn — hvilket lag, hvor i antrekket,
 * relativt til gårsdagens antrekksbaseline. «Legg til et lag» finnes ikke:
 * det heter «Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.»
 * Baseline er gårsdagens ANTREKK (2–3 nøkkelplagg), ikke bare temperatur.
 *
 * Semantikk-porten: tilRetningsUttrykk(innhold) SKAL bestå sjekkSemantikk
 * mot faktaene for alle ti scenarier (testes i __tests__/p3.test.ts) —
 * briefen bærer ALLTID hele sikkerhetsinnholdet, uansett form.
 *
 * Formregler (retningsrapporten + felles doktrine):
 *  - Delta beskriver VÆRET, aldri gårsdagens valg (INV-6).
 *  - Gyldighet er absolutt («gjelder til 12:00»), aldri nedtelling (INV-2).
 *  - Kvittering heter «Åpnet», aldri «forstått» (anti-referansen:
 *    passiv/fortolkende kvittering er forbudt).
 *  - Degradert grunnlag → konservativ fallback-handling, aldri gjetting.
 */

import { feelsLikeC } from '@lib/met-no/feels-like';
import {
  hentFakta,
  type BasePlagg,
  type Gyldighet,
  type NoytraleFakta,
  type RetningsUttrykk,
  type SafetyEvent,
} from '../felles/fakta';
import {
  DEGRADERT_NESTE_HANDLING,
  deltaSetning,
  usikrestPremiss,
  vaerTilKonsekvens,
} from '../felles/tekst';
import type { Scenario, ScenarioWeather } from '../felles/scenarier';
import type { Brief, BriefHendelse } from './brief-maskin';

/**
 * Kvitteringens eneste tillatte etikett. Mottak er en handling («åpnet»),
 * aldri en fortolkningspåstand — ordet «forstått» finnes ikke i P3.
 */
export const KVITTERING_ETIKETT = 'Åpnet';

export type BriefBaseline = {
  /** Gårsdagens briefversjon deltaet er beregnet mot. */
  versjon: number;
  /**
   * Synlig, versjonert referansepunkt med gårsdagens ANTREKK, ikke bare
   * temperatur: «i går V1 (føltes 5 °C): tykt ullsett, ull-mellomlag,
   * kjøredress» (INV-6 + Sols P3-P0).
   */
  etikett: string;
  /** Gårsdagens fulle antrekk (motorberegnet for gårsdagens vær). */
  antrekk: BasePlagg[];
};

export type BriefDelta = {
  /** deltaSetning fra felles/tekst — beskriver været, aldri valgene. */
  setning: string;
  baseline: BriefBaseline;
};

export type BriefInnhold = {
  form: 'full-liste' | 'delta' | 'degradert';
  /** Dominant neste handling — størst i den typografiske rangen. */
  handling: string;
  /**
   * Konkret, handlingskomplett antrekkshandling med basePlagg-navn.
   * Lik handling når ingen hard sikkerhet dominerer; null kun i
   * degradert form (da er fallbacken selve handlingen).
   */
  komfortHandling: string | null;
  delta: BriefDelta | null;
  /** Full plaggliste — alltid ett tapp unna, alltid gratis (INV-9). */
  basePlagg: BasePlagg[];
  /** Presentasjonsløse safety-events — hele semantikken bæres videre. */
  sikkerhet: SafetyEvent[];
  gyldighet: Gyldighet;
  svakestePremiss: string;
};

export type ByggValg = {
  /**
   * Delta-baseline: gårsdagens briefversjon + gårsdagens vær + gårsdagens
   * ANTREKK (motorberegnet) — endringen uttrykkes alltid relativt til et
   * kjent antrekk, aldri bare til en temperatur.
   */
  baseline?: { versjon: number; vaer: ScenarioWeather; antrekk: BasePlagg[] };
  /** Utstedt-tid for akkurat denne briefen (default: faktaets utstedt). */
  utstedtISO?: string;
};

/** Værleddet av en deltaSetning («Kaldere enn i går (…)») uten handlingshalen. */
export function deltaVaerDel(setning: string): string {
  return setning.split(' — ')[0];
}

/** Kjerneprioritet for «laget» i en endring: mellomlag er det kanoniske. */
const LAG_PRIORITET: BasePlagg['kategori'][] = ['mellomlag', 'innerst', 'yttertoy'];

/** 2–3 nøkkelplagg: første innerst/mellomlag/yttertøy, ellers første øvrige. */
export function nokkelPlagg(plagg: BasePlagg[], maks = 3): BasePlagg[] {
  const valgt: BasePlagg[] = [];
  for (const kategori of ['innerst', 'mellomlag', 'yttertoy'] as const) {
    const p = plagg.find((x) => x.kategori === kategori);
    if (p) valgt.push(p);
  }
  for (const p of plagg) {
    if (valgt.length >= maks) break;
    if (!valgt.includes(p)) valgt.push(p);
  }
  return valgt.slice(0, maks);
}

function navnListe(plagg: BasePlagg[]): string {
  return plagg.map((p) => p.plagg).join(', ');
}

/** Velg det mest beslutningsrelevante laget blant endrede plagg. */
function velgLag(endrede: BasePlagg[]): BasePlagg | undefined {
  for (const kategori of LAG_PRIORITET) {
    const p = endrede.find((x) => x.kategori === kategori);
    if (p) return p;
  }
  return endrede[0];
}

/** Hvor i dagens antrekk laget hører hjemme — navngitt med naboplaggene. */
function posisjonstekst(lag: BasePlagg, dagens: BasePlagg[]): string {
  const i = dagens.findIndex((p) => p.plagg === lag.plagg);
  const foer = i > 0 ? dagens[i - 1].plagg : null;
  const etter = i >= 0 && i < dagens.length - 1 ? dagens[i + 1].plagg : null;
  if (foer && etter) return `mellom ${foer} og ${etter}`;
  if (etter) return `innerst, under ${etter}`;
  if (foer) return `ytterst, utenpå ${foer}`;
  return 'på barnet';
}

/** Full-liste-form: konsekvens + konkrete nøkkelplagg (aldri bare «lag»). */
function fullListeHandling(
  vaer: { tempC: number; windMs: number; precipMmH: number; symbolCode: string },
  dagens: BasePlagg[],
): string {
  const { konsekvens } = vaerTilKonsekvens(vaer);
  const nokler = nokkelPlagg(dagens);
  return nokler.length > 0
    ? `${konsekvens}. Kle innenfra og ut: ${navnListe(nokler)}.`
    : konsekvens;
}

/**
 * Delta-form: den KONKRETE endringen mot gårsdagens antrekk (Sols P3-P0).
 * Kaldere → navngi laget som skal PÅ og hvor. Varmere → navngi laget som
 * skal AV. Uendret → bekreft antrekket med nøkkelplaggene.
 */
function konkretDeltaHandling(
  baselineAntrekk: BasePlagg[],
  dagens: BasePlagg[],
  foltDiff: number,
  vaer: { tempC: number; windMs: number; precipMmH: number; symbolCode: string },
): string {
  const iGaarNavn = new Set(baselineAntrekk.map((p) => p.plagg));
  const dagensNavn = new Set(dagens.map((p) => p.plagg));
  const lagtTil = dagens.filter((p) => !iGaarNavn.has(p.plagg));
  const tattAv = baselineAntrekk.filter((p) => !dagensNavn.has(p.plagg));

  if (foltDiff <= -3) {
    const lag = velgLag(lagtTil);
    if (lag) return `Legg ${lag.plagg} ${posisjonstekst(lag, dagens)}.`;
  } else if (foltDiff >= 3) {
    const lag = velgLag(tattAv);
    if (lag) return `Ta av ${lag.plagg} — behold ${navnListe(nokkelPlagg(dagens))}.`;
  } else {
    return `Samme antrekk som i går holder — ${navnListe(nokkelPlagg(dagens))}.`;
  }
  // Ingen konkrete lag endret i den relevante retningen: fall tilbake til
  // den konkrete full-listen — aldri et vagt «legg til et lag».
  return fullListeHandling(vaer, dagens);
}

export function byggBriefInnhold(
  fakta: NoytraleFakta,
  valg: ByggValg = {},
): BriefInnhold {
  const gyldighet: Gyldighet = {
    utstedtISO: valg.utstedtISO ?? fakta.gyldighet.utstedtISO,
    gjelderTilISO: fakta.gyldighet.gjelderTilISO,
  };

  // Degradert grunnlag: strukturelt maskert innhold + konservativ
  // fallback-handling — aldri plagg uten fakta (INV-2).
  if (fakta.vaergrunnlag === null) {
    return {
      form: 'degradert',
      handling: DEGRADERT_NESTE_HANDLING,
      komfortHandling: null,
      delta: null,
      basePlagg: [],
      sikkerhet: [],
      gyldighet,
      svakestePremiss: fakta.datakvalitet.svakestePremiss,
    };
  }

  const vaer = fakta.vaergrunnlag;
  const harde = fakta.safetyEvents.filter((e) => e.prioritet === 'hard');

  let delta: BriefDelta | null = null;
  let foltDiff = 0;
  if (valg.baseline) {
    const foltesIGaar = Math.round(
      feelsLikeC(valg.baseline.vaer.tempC, valg.baseline.vaer.windMs),
    );
    foltDiff = Math.round(feelsLikeC(vaer.tempC, vaer.windMs)) - foltesIGaar;
    delta = {
      setning: deltaSetning(valg.baseline.vaer, vaer),
      baseline: {
        versjon: valg.baseline.versjon,
        etikett:
          `i går V${valg.baseline.versjon} (føltes ${foltesIGaar} °C): ` +
          navnListe(nokkelPlagg(valg.baseline.antrekk)),
        antrekk: valg.baseline.antrekk,
      },
    };
  }

  // Handlingskomplett komfort-handling (Sols P3-P0): alltid konkret,
  // alltid med basePlagg-navn — mot antrekksbaseline i delta-form.
  const komfortHandling = valg.baseline
    ? konkretDeltaHandling(valg.baseline.antrekk, fakta.basePlagg, foltDiff, vaer)
    : fullListeHandling(vaer, fakta.basePlagg);

  // Dominant handling: hard sikkerhet vinner alltid over komfort (INV-1);
  // ellers den konkrete komfort-handlingen.
  const handling = harde.length > 0 ? harde[0].innhold : komfortHandling;

  return {
    form: delta ? 'delta' : 'full-liste',
    handling,
    komfortHandling,
    delta,
    basePlagg: fakta.basePlagg,
    sikkerhet: fakta.safetyEvents,
    gyldighet,
    svakestePremiss: usikrestPremiss(vaer),
  };
}

export type BriefValg = ByggValg & {
  briefId: string;
  versjon: number;
  scenarioFingerprint: string;
  supersedes?: string;
};

/** Pakk innholdet i brief-maskinens kontrakt (cachefeltene fra §4.3). */
export function byggBrief(fakta: NoytraleFakta, valg: BriefValg): Brief {
  const innhold = byggBriefInnhold(fakta, valg);
  return {
    briefId: valg.briefId,
    versjon: valg.versjon,
    issuedAtISO: innhold.gyldighet.utstedtISO,
    validFromISO: innhold.gyldighet.utstedtISO,
    expiresAtISO: innhold.gyldighet.gjelderTilISO,
    supersedes: valg.supersedes,
    baselineVersjon: valg.baseline?.versjon,
    scenarioFingerprint: valg.scenarioFingerprint,
    innhold: JSON.stringify(innhold),
  };
}

export function lesBriefInnhold(brief: Brief): BriefInnhold {
  return JSON.parse(brief.innhold) as BriefInnhold;
}

/**
 * Retningsuttrykket for semantikk-porten: hva briefen faktisk bærer.
 * Bygges av INNHOLDET (ikke av faktaene) slik at porten beviser at
 * transformasjonen ikke mistet noe på veien.
 */
export function tilRetningsUttrykk(innhold: BriefInnhold): RetningsUttrykk {
  return {
    retning: 'p3',
    safetyEventIds: innhold.sikkerhet.map((e) => e.id),
    stoppkriterier: [
      ...new Set(
        innhold.sikkerhet.flatMap((e) =>
          e.stoppkriterium ? [e.stoppkriterium] : [],
        ),
      ),
    ],
    gyldigTil: innhold.gyldighet.gjelderTilISO,
  };
}

/* ------------------------------------------------------------------ *
 * Tidslinjen (spec v2 §2: «P3 er en TIDSLINJE, ikke én mock»)
 *
 * V1 ankommer → V2 ankommer (supersedes V1) → forsinket V1 ankommer på
 * nytt (skal forkastes synlig) → utløp ved gjelderTil (drives av
 * klokke-hendelser i selen/UI-et). Degraderte scenarier (manglende
 * værdata / allerede utløpt råd) leverer kun V1 — den maskeres av
 * maskinen selv ved ankomst.
 *
 * REELL V2-ENDRING (Sols P3-P1): i delta-scenariet (weatherIGaar satt)
 * bygges V1 på morgenprognosen — som ennå er UENDRET fra i går — og V2
 * på den oppdaterte prognosen (scenariets faktiske vær). Dermed ENDRER
 * V2 handlingen (V1: «Samme antrekk som i går holder …» → V2: «Legg
 * ull-jakke mellom …»), ikke bare versjonsnummeret.
 * ------------------------------------------------------------------ */

export type TidslinjeSteg = {
  tidISO: string;
  /** Klarspråk-etikett for hendelsesloggen. */
  etikett: string;
  hendelse: BriefHendelse;
  /**
   * Faktagrunnlaget briefen i steget ble bygget fra. Semantikk-porten og
   * P4s protokollpakking bruker DETTE — V1 i delta-scenariet har et
   * annet (eldre) prognosegrunnlag enn V2.
   */
  fakta: NoytraleFakta;
};

/** «HH:MM»-aritmetikk på lab-ISO-strenger (samme dag, fast sone). */
export function leggTilMinutter(iso: string, minutter: number): string {
  const hh = Number(iso.substring(11, 13));
  const mm = Number(iso.substring(14, 16));
  const total = hh * 60 + mm + minutter;
  const nyH = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const nyM = String(total % 60).padStart(2, '0');
  return `${iso.substring(0, 11)}${nyH}:${nyM}${iso.substring(16)}`;
}

export function byggTidslinje(scenario: Scenario): TidslinjeSteg[] {
  const fakta = hentFakta(scenario);
  const fingerprint = `lab#${scenario.id}#8mnd#${scenario.activity}`;
  const utstedtV1 = fakta.gyldighet.utstedtISO;

  // V1s prognosegrunnlag: i delta-scenariet er morgenprognosen ennå
  // uendret fra i går — V2 bærer den oppdaterte prognosen. Slik er
  // versjonsskiftet en reell handlingsendring (Sols P3-P1).
  const faktaV1 =
    scenario.weatherIGaar && fakta.vaergrunnlag !== null
      ? hentFakta({ ...scenario, weather: scenario.weatherIGaar })
      : fakta;

  // Baseline for delta-form: kun når scenariet har gårsdagens vær.
  // Versjonstelleren i laben er per dag; «i går V1» navngir gårsdagens
  // briefversjon eksplisitt (antagelse dokumentert i manifestet).
  // Baseline-antrekket er gårsdagens motorberegnede antrekk (P3-P0) —
  // identisk med faktaV1s basePlagg siden morgenprognosen == gårsdagen.
  const baseline = scenario.weatherIGaar
    ? { versjon: 1, vaer: scenario.weatherIGaar, antrekk: faktaV1.basePlagg }
    : undefined;

  const v1 = byggBrief(faktaV1, {
    briefId: `${scenario.id}-b1`,
    versjon: 1,
    scenarioFingerprint: fingerprint,
    utstedtISO: utstedtV1,
    baseline,
  });

  const stegV1: TidslinjeSteg = {
    tidISO: utstedtV1,
    etikett:
      fakta.vaergrunnlag === null || scenario.flags.utlopt
        ? 'V1 ankommer (grunnlaget er degradert eller utløpt)'
        : 'V1 ankommer',
    hendelse: { type: 'brief', brief: v1 },
    fakta: faktaV1,
  };

  // Degradert grunnlag: kun V1 — maskinen maskerer den selv.
  if (fakta.vaergrunnlag === null) return [stegV1];

  const utstedtV2 = leggTilMinutter(utstedtV1, 20);
  const v2 = byggBrief(fakta, {
    briefId: `${scenario.id}-b2`,
    versjon: 2,
    scenarioFingerprint: fingerprint,
    supersedes: v1.briefId,
    utstedtISO: utstedtV2,
    baseline,
  });

  return [
    stegV1,
    {
      tidISO: utstedtV2,
      etikett: 'V2 ankommer (oppdatert prognose, erstatter V1)',
      hendelse: { type: 'brief', brief: v2 },
      fakta,
    },
    {
      tidISO: leggTilMinutter(utstedtV1, 30),
      etikett: 'Forsinket V1 ankommer på nytt (nettverkskø)',
      hendelse: { type: 'brief', brief: v1 },
      fakta: faktaV1,
    },
  ];
}
