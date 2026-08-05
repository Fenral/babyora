/**
 * P4 «AMBIENT PROTOKOLL» — ren komposisjon (spec v2 §1 pkt. 3 og Sols
 * klarsignal: «P4 KOMPONERER P1s og P3s allerede validerte kontrakter —
 * kun overgangen brief→protokoll er ny kode»).
 *
 * Ingen egen protokoll-, brief- eller sikkerhetstekst i denne retningen:
 *  - Protokollen kompileres av P1s protokollkompilator (p1/protokollkompilator).
 *  - Briefen bygges av P3s briefbygger og styres av P3s brief-maskin.
 *  - Det NYE er bindingen: hver brief pakker protokollen for SAMME fakta
 *    og stempler protokollversjonen atomisk fra brief.versjon
 *    (pakkMedProtokoll er eneste konstruktør). Derfor kan
 *    brief-versjon ≠ protokoll-versjon aldri oppstå via brief-maskinen —
 *    property-testes i __tests__/p4.test.ts. Oppstår det likevel, har
 *    syntesen feilet og UI-et viser feiltilstand (sjekkVersjonsbrudd).
 *
 * Semantikk-porten (spec v2 §4.2) håndheves som SNITT, ikke union:
 * komposisjonen består bare hvis BÅDE protokollen og briefen bærer hele
 * sikkerhetssemantikken. Mister én av dem en hendelse, et stoppkriterium
 * eller gyldigheten, feiler porten (mutasjonskoblet).
 */

import {
  hentFakta,
  type NoytraleFakta,
  type RetningsUttrykk,
} from '../felles/fakta';
import type { Scenario } from '../felles/scenarier';
import {
  kompilerProtokoll,
  uttrykkFraProtokoll,
  type Protokoll,
  type ProtokollSteg,
} from '../p1/protokollkompilator';
import {
  byggTidslinje,
  lesBriefInnhold,
  tilRetningsUttrykk,
  type BriefInnhold,
  type TidslinjeSteg,
} from '../p3/briefbygger';
import type { Brief } from '../p3/brief-maskin';

/* ------------------------------------------------------------------ *
 * Pakket innhold: P3-brief + P1-protokoll, atomisk versjonsstemplet
 * ------------------------------------------------------------------ */

export type P4Innhold = {
  /** P3s brief-innhold, uendret (bygget av byggBrief/byggBriefInnhold). */
  briefInnhold: BriefInnhold;
  /** P1s protokoll, uendret (kompilert av kompilerProtokoll). */
  protokoll: Protokoll;
  /**
   * Protokollens versjonsstempel. Settes ALLTID fra brief.versjon i
   * pakkMedProtokoll (eneste konstruktør) — aldri som eget argument.
   */
  protokollVersjon: number;
};

/**
 * Eneste vei fra P3-brief + P1-protokoll til en P4-brief. Versjonen
 * stemples atomisk fra briefens eget felt — det finnes ingen kodevei der
 * pakket protokollversjon kan avvike fra briefversjonen.
 */
export function pakkMedProtokoll(brief: Brief, protokoll: Protokoll): Brief {
  const innhold: P4Innhold = {
    briefInnhold: lesBriefInnhold(brief),
    protokoll,
    protokollVersjon: brief.versjon,
  };
  return { ...brief, innhold: JSON.stringify(innhold) };
}

export function lesP4Innhold(brief: Brief): P4Innhold {
  return JSON.parse(brief.innhold) as P4Innhold;
}

/* ------------------------------------------------------------------ *
 * Overgangen brief→protokoll — det eneste nye
 * ------------------------------------------------------------------ */

/**
 * Brief-flatens handling: protokollens FØRSTE komplette trygge steg.
 * Kompilatoren garanterer rekkefølgen (harde hendelser først, bilstol
 * før ytterlag, degradert fallback i degradert modus) — P4 velger aldri
 * selv, den viser steg 1 slik P1 kompilerte det.
 */
export function forsteTryggeSteg(innhold: P4Innhold): ProtokollSteg {
  return innhold.protokoll.steg[0];
}

export type Versjonssjekk = {
  brudd: boolean;
  briefVersjon: number;
  protokollVersjon: number;
};

/**
 * Feiltilstandsporten ved åpning: brief-versjon må være identisk med den
 * pakkede protokollversjonen. Brudd betyr at syntesen har feilet — UI-et
 * skal da vise feiltilstand og aldri protokollen.
 */
export function sjekkVersjonsbrudd(brief: Brief): Versjonssjekk {
  const innhold = lesP4Innhold(brief);
  return {
    brudd: brief.versjon !== innhold.protokollVersjon,
    briefVersjon: brief.versjon,
    protokollVersjon: innhold.protokollVersjon,
  };
}

/* ------------------------------------------------------------------ *
 * Semantikk-porten — snittet av begge uttrykk (mutasjonskoblet)
 * ------------------------------------------------------------------ */

export function uttrykkFraAmbient(innhold: P4Innhold): RetningsUttrykk {
  const fraProtokoll = uttrykkFraProtokoll(innhold.protokoll);
  const fraBrief = tilRetningsUttrykk(innhold.briefInnhold);
  return {
    retning: 'p4',
    // Snitt: en safety-hendelse teller bare hvis BEGGE flater bærer den.
    safetyEventIds: fraProtokoll.safetyEventIds.filter((id) =>
      fraBrief.safetyEventIds.includes(id),
    ),
    stoppkriterier: fraProtokoll.stoppkriterier.filter((s) =>
      fraBrief.stoppkriterier.includes(s),
    ),
    // Fail-safe: er de to flatene uenige om gyldigheten, feiler porten.
    gyldigTil:
      fraProtokoll.gyldigTil === fraBrief.gyldigTil ? fraProtokoll.gyldigTil : null,
  };
}

/* ------------------------------------------------------------------ *
 * Tidslinjen — P3s tidslinje, hvert brief-steg pakket med protokollen
 * ------------------------------------------------------------------ */

export type AmbientTidslinje = {
  fakta: NoytraleFakta;
  protokoll: Protokoll;
  steg: TidslinjeSteg[];
};

/**
 * Komposisjonens leveranse: P3s tidslinje (V1 → V2 → forsinket V1),
 * der hver brief bærer P1s protokoll for samme fakta. Protokollen
 * kompileres ÉN gang — alle versjoner av briefen peker på samme
 * kompilat, og versjonsstempelet følger briefen atomisk.
 */
export function ambientTidslinje(scenario: Scenario): AmbientTidslinje {
  const fakta = hentFakta(scenario);
  const protokoll = kompilerProtokoll(fakta);
  const steg = byggTidslinje(scenario).map((s): TidslinjeSteg => {
    if (s.hendelse.type !== 'brief') return s;
    return {
      ...s,
      hendelse: { type: 'brief', brief: pakkMedProtokoll(s.hendelse.brief, protokoll) },
    };
  });
  return { fakta, protokoll, steg };
}

/* ------------------------------------------------------------------ *
 * Overgangstekster (retningens eneste egne tekst — kun overgangen,
 * aldri protokoll-, brief- eller sikkerhetsinnhold). Underlagt
 * FORBUDTE_MONSTRE fra felles/tekst (testes i p4.test.ts).
 * ------------------------------------------------------------------ */

export const P4_TEKST = {
  aapneProtokoll: (antallSteg: number) => `Åpne hele protokollen (${antallSteg} steg)`,
  lukkProtokoll: 'Lukk protokollen',
  stegEnAv: (antallSteg: number) => `Steg 1 av ${antallSteg}`,
  sammeVersjon: (versjon: number) =>
    `Samme versjon som briefen — Brief #${versjon}.`,
  versjonsbrudd: (briefVersjon: number, protokollVersjon: number) =>
    `Feiltilstand: briefen er #${briefVersjon}, protokollen er #${protokollVersjon}. ` +
    'Syntesen har feilet — protokollen vises ikke.',
  maskert: 'Må beregnes på nytt',
  ventende: (fraKl: string) => `Briefen gjelder fra ${fraKl}.`,
  utenNett: 'Uten nett — briefen kan være foreldet.',
} as const;
