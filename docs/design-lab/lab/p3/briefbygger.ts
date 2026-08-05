/**
 * P3 AMBIENT BRIEFING — briefbyggeren (retningens transformator,
 * spec v2 §1 pkt. 3 og §3-sløyfen for P3).
 *
 * NoytraleFakta (+ ev. gårsdagens vær fra scenariet) → Brief-innhold:
 *   { delta (deltaSetning fra felles/tekst) MED synlig versjonert baseline
 *     («i går V1: føltes 5 °C»), handling, gyldighet, svakestePremiss }
 * pakket i brief-maskinens kontrakt (Brief.innhold er JSON av BriefInnhold).
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
  /** Synlig, versjonert referansepunkt: «i går V1: føltes 5 °C» (INV-6). */
  etikett: string;
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
  delta: BriefDelta | null;
  /** Full plaggliste — alltid ett tapp unna, alltid gratis (INV-9). */
  basePlagg: BasePlagg[];
  /** Presentasjonsløse safety-events — hele semantikken bæres videre. */
  sikkerhet: SafetyEvent[];
  gyldighet: Gyldighet;
  svakestePremiss: string;
};

export type ByggValg = {
  /** Delta-baseline: gårsdagens vær + gårsdagens briefversjon. */
  baseline?: { versjon: number; vaer: ScenarioWeather };
  /** Utstedt-tid for akkurat denne briefen (default: faktaets utstedt). */
  utstedtISO?: string;
};

/** «… — legg til et lag» → «Legg til et lag.» (handlingsleddet alene). */
function handlingFraDelta(setning: string): string {
  const ledd = setning.split(' — ').at(-1) ?? setning;
  const stor = ledd.charAt(0).toUpperCase() + ledd.slice(1);
  return stor.endsWith('.') ? stor : `${stor}.`;
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
  if (valg.baseline) {
    const foltesIGaar = Math.round(
      feelsLikeC(valg.baseline.vaer.tempC, valg.baseline.vaer.windMs),
    );
    delta = {
      setning: deltaSetning(valg.baseline.vaer, vaer),
      baseline: {
        versjon: valg.baseline.versjon,
        etikett: `i går V${valg.baseline.versjon}: føltes ${foltesIGaar} °C`,
      },
    };
  }

  // Dominant handling: hard sikkerhet vinner alltid over komfort;
  // deretter delta-handlingen; ellers konsekvenssetningen (INV-1).
  const handling =
    harde.length > 0
      ? harde[0].innhold
      : delta
        ? handlingFraDelta(delta.setning)
        : vaerTilKonsekvens(vaer).konsekvens;

  return {
    form: delta ? 'delta' : 'full-liste',
    handling,
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
 * ------------------------------------------------------------------ */

export type TidslinjeSteg = {
  tidISO: string;
  /** Klarspråk-etikett for hendelsesloggen. */
  etikett: string;
  hendelse: BriefHendelse;
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

  // Baseline for delta-form: kun når scenariet har gårsdagens vær.
  // Versjonstelleren i laben er per dag; «i går V1» navngir gårsdagens
  // briefversjon eksplisitt (antagelse dokumentert i manifestet).
  const baseline = scenario.weatherIGaar
    ? { versjon: 1, vaer: scenario.weatherIGaar }
    : undefined;

  const v1 = byggBrief(fakta, {
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
    },
    {
      tidISO: leggTilMinutter(utstedtV1, 30),
      etikett: 'Forsinket V1 ankommer på nytt (nettverkskø)',
      hendelse: { type: 'brief', brief: v1 },
    },
  ];
}
