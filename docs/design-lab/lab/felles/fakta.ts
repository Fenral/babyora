/**
 * NoytraleFakta — det nøytrale faktalaget (Sols P0-3, spec v2 §1 pkt. 3).
 *
 * Adapteren eksponerer FAKTA, ikke visning: kontekst, værgrunnlag,
 * datakvalitet, basePlagg, safetyEvents og gyldighet. Ingen delt
 * RecommendationViewModel — hver retning (P1/P2/P3) har sin egen
 * transformator som leser dette laget og produserer sin egen kontrakt.
 *
 * safetyEvents er PRESENTASJONSLØSE: innhold, prioritet, stoppkriterium og
 * forventet handling — aldri UI-ord (banner/kort/farge/plassering).
 *
 * Gjenbruker kjorMotor fra motor.ts internt; beregner ALDRI egne plagg.
 */

import type { LayerCategory, NoteCategory, TempBand } from '@lib/wool-layers/types';
import type { SafetyFlag } from '@lib/wool-layers/safety';
import { kjorMotor, delFlags } from './motor';
import type { Scenario, ScenarioFlags } from './scenarier';

/** Fiksert labdato — all tid i laben er deterministisk (ingen Date.now()). */
export const LAB_DATO = '2026-01-15';

export type Datakvalitet = {
  status: 'ok' | 'mangler' | 'utlopt';
  /** Klarspråk: den svakeste premissen fakta hviler på akkurat nå. */
  svakestePremiss: string;
};

export type FaktaKontekst = {
  activity: Scenario['activity'];
  vognMode?: 'awake' | 'sleeping';
  bilstol: boolean;
  flags: ScenarioFlags;
};

export type Vaergrunnlag = {
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number;
  symbolCode: string;
  band: TempBand;
};

export type SafetyEventPrioritet = 'hard' | 'soft';

export type SafetyEvent = {
  /** Motorens flaggkode (eks. HB-9) — stabil id på tvers av retninger. */
  id: string;
  /** Sikkerhetsinnholdet som nøytral setning (motorens message). */
  innhold: string;
  prioritet: SafetyEventPrioritet;
  /** Når skal aktiviteten avbrytes/ikke startes. Alltid satt for 'hard'. */
  stoppkriterium?: string;
  /** Hva en korrekt bruker gjør med dette innholdet. */
  forventetHandling: string;
};

export type BasePlagg = {
  kategori: LayerCategory;
  plagg: string;
};

export type Gyldighet = {
  utstedtISO: string;
  gjelderTilISO: string;
};

export type NoytraleFakta = {
  kontekst: FaktaKontekst;
  /** null når datakvalitet ≠ ok — degradert grunnlag har ikke værfakta. */
  vaergrunnlag: Vaergrunnlag | null;
  datakvalitet: Datakvalitet;
  basePlagg: BasePlagg[];
  safetyEvents: SafetyEvent[];
  gyldighet: Gyldighet;
};

/** «HH:MM» → full ISO på den fikserte labdatoen. */
export function labISO(hhmm: string): string {
  return `${LAB_DATO}T${hhmm}:00+01:00`;
}

/**
 * Stoppkriterium per motorkategori — innholdsfakta, ikke UI-tekst.
 * Retningene kan omformulere FORM, men semantikken (avtrykket) må bestå.
 */
const STOPPKRITERIUM_PER_KATEGORI: Partial<Record<NoteCategory, string>> = {
  overoppheting:
    'Avbryt hvis nakken er svett eller barnet er rødt og varmt i ansiktet.',
  kulde:
    'Avbryt hvis nakke eller bryst kjennes kaldt, eller huden blir blek.',
  sikkerhet:
    'Ikke start eller fortsett aktiviteten før plagget er fjernet eller byttet.',
  sol: 'Avbryt ved direkte sol på bar hud over lengre tid.',
  nedbor: 'Avbryt hvis barnet eller klærne er blitt våte.',
};

const STOPPKRITERIUM_FALLBACK =
  'Ikke fortsett aktiviteten før innholdet i hendelsen er håndtert.';

function tilSafetyEvent(flag: SafetyFlag, prioritet: SafetyEventPrioritet): SafetyEvent {
  if (prioritet === 'hard') {
    return {
      id: flag.code,
      innhold: flag.message,
      prioritet,
      stoppkriterium:
        STOPPKRITERIUM_PER_KATEGORI[flag.category] ?? STOPPKRITERIUM_FALLBACK,
      forventetHandling:
        'Korriger antrekket i tråd med innholdet før aktiviteten starter eller fortsetter.',
    };
  }
  return {
    id: flag.code,
    innhold: flag.message,
    prioritet,
    forventetHandling:
      'Fortsett, men kontroller barnet underveis (kjenn på nakken).',
  };
}

/**
 * Hovedinngang: scenario → nøytrale fakta.
 *
 * Ved degradert motorresultat (manglende værdata / utløpt gyldighet) er
 * vaergrunnlag null, basePlagg tom og safetyEvents tom — degraderingen selv
 * bæres av datakvalitet (status + svakeste premiss), ikke av et «råd».
 */
export function hentFakta(scenario: Scenario): NoytraleFakta {
  const resultat = kjorMotor(scenario);

  const kontekst: FaktaKontekst = {
    activity: scenario.activity,
    vognMode: scenario.vognMode,
    bilstol: scenario.bilstol ?? false,
    flags: scenario.flags,
  };

  // Et råd kan ikke være utstedt ETTER sin egen gyldighet: ved utløpt
  // scenario (naa > gyldigTil) settes utstedt til gyldighetsslutt.
  const utstedt = scenario.naa <= scenario.gyldigTil ? scenario.naa : scenario.gyldigTil;
  const gyldighet: Gyldighet = {
    utstedtISO: labISO(utstedt),
    gjelderTilISO: labISO(scenario.gyldigTil),
  };

  if (resultat.status === 'degradert') {
    return {
      kontekst,
      vaergrunnlag: null,
      datakvalitet: {
        status: scenario.weather === null ? 'mangler' : 'utlopt',
        svakestePremiss: resultat.aarsak,
      },
      basePlagg: [],
      safetyEvents: [],
      gyldighet,
    };
  }

  const vaer = scenario.weather!;
  const { hard, soft } = delFlags(resultat.recommendation.safetyFlags);

  return {
    kontekst,
    vaergrunnlag: {
      tempC: vaer.tempC,
      feelsLikeC: resultat.feelsLikeC,
      windMs: vaer.windMs,
      precipMmH: vaer.precipMmH,
      symbolCode: vaer.symbolCode,
      band: resultat.band,
    },
    datakvalitet: {
      status: 'ok',
      svakestePremiss: `Værprognose for ett tidspunkt; gjelder til ${scenario.gyldigTil}.`,
    },
    basePlagg: resultat.recommendation.layers.flatMap((lag) =>
      lag.items.map((plagg) => ({ kategori: lag.category, plagg })),
    ),
    safetyEvents: [
      ...hard.map((f) => tilSafetyEvent(f, 'hard')),
      ...soft.map((f) => tilSafetyEvent(f, 'soft')),
    ],
    gyldighet,
  };
}

/* ------------------------------------------------------------------ *
 * Semantikk-kontrakten (spec v2 §4 pkt. 2)
 *
 * Samme NoytraleFakta inn → hver retningstransformator står fritt i FORM,
 * men sikkerhetsSEMANTIKKEN må være identisk: samme safetyEvent-ids, samme
 * stoppkriterier, samme gyldighet. Avtrykket er fasiten; sjekkSemantikk er
 * porten enhver transformator SKAL bestå.
 * ------------------------------------------------------------------ */

export type SemantikkAvtrykk = {
  safetyEventIds: string[];
  stoppkriterier: string[];
  gyldigTil: string;
};

export function semantikkAvtrykk(fakta: NoytraleFakta): SemantikkAvtrykk {
  return {
    safetyEventIds: [...new Set(fakta.safetyEvents.map((e) => e.id))].sort(),
    stoppkriterier: [
      ...new Set(
        fakta.safetyEvents.flatMap((e) =>
          e.stoppkriterium ? [e.stoppkriterium] : [],
        ),
      ),
    ].sort(),
    gyldigTil: fakta.gyldighet.gjelderTilISO,
  };
}

/**
 * Et retningsuttrykk: det en transformator (P1-protokoll, P2-spenn,
 * P3-brief) faktisk bærer av sikkerhetssemantikk — uansett hvilken form
 * presentasjonen har. Transformatorene deklarerer dette eksplisitt.
 */
export type RetningsUttrykk = {
  /** Hvilken retning uttrykket kommer fra (p1/p2/p3/p4) — kun for logg. */
  retning: string;
  safetyEventIds: string[];
  stoppkriterier: string[];
  gyldigTil: string | null;
};

export type SemantikkSjekk = {
  ok: boolean;
  mangler: string[];
};

/**
 * Porten: består uttrykket semantikk-kontrakten mot faktaene?
 * Uttrykket kan inneholde MER (form er fri), men aldri mindre:
 * hvert safetyEvent, hvert stoppkriterium og eksakt gyldighet må finnes.
 */
export function sjekkSemantikk(
  uttrykk: RetningsUttrykk,
  fakta: NoytraleFakta,
): SemantikkSjekk {
  const avtrykk = semantikkAvtrykk(fakta);
  const mangler: string[] = [];

  for (const id of avtrykk.safetyEventIds) {
    if (!uttrykk.safetyEventIds.includes(id)) {
      mangler.push(`safety-event mangler: ${id}`);
    }
  }
  for (const stopp of avtrykk.stoppkriterier) {
    if (!uttrykk.stoppkriterier.includes(stopp)) {
      mangler.push(`stoppkriterium mangler: ${stopp}`);
    }
  }
  if (uttrykk.gyldigTil !== avtrykk.gyldigTil) {
    mangler.push(
      `gyldighet avviker: ${String(uttrykk.gyldigTil)} ≠ ${avtrykk.gyldigTil}`,
    );
  }

  return { ok: mangler.length === 0, mangler };
}
