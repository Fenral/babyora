/**
 * P1 — eksplisitt, tabelldrevet regeltabell for modusklassifisereren
 * (spec v2 §1 pkt. 3 / §4 pkt. 1, Sols krav om prioritet ved kombinasjoner).
 *
 * Prinsipper:
 *  - Tabellen ER kontrakten: én array av regler, sortert etter prioritet
 *    (lavest tall vinner). Ingen skjult logikk utenfor tabellen.
 *  - UKJENT eller MOTSTRIDENDE input gir ALDRI normal — de to reglene
 *    ligger øverst og faller til 'avvik' (aldri optimistisk normalmodus).
 *  - Kombinasjonsregler ligger FORAN generiske: bilstol + kulde vinner over
 *    både sovende-frost og generisk hard-safety, slik at
 *    bilstol + kulde + sovende barn gir avvik MED bilstol-regelen øverst.
 *  - Siste regel er normal-fallback (treffer alltid).
 */

import type { NoytraleFakta } from '../felles/fakta';

export type Modus = 'normal' | 'folg-med' | 'avvik' | 'degradert';

export type Regel = {
  id: string;
  /** Lavest tall evalueres først; første treff vinner. */
  prioritet: number;
  modus: Modus;
  beskrivelse: string;
  treffer: (fakta: NoytraleFakta) => boolean;
};

const GYLDIGE_AKTIVITETER = new Set(['vogn', 'baeresele', 'utelek', 'soevn']);

/** Motorens bandgrenser (bandForTemp) — brukes av grensevær-regelen. */
export const BAND_GRENSER = [28, 22, 16, 10, 5, 0, -7, -15];

/** Skalaens ytterkant: utenfor det motoren er kalibrert for å nyansere. */
export const YTTERKANT_BAND = new Set(['ekstrem', 'ekstrem_varme']);

/** Hysterese: minste grensevær-margin (±°C) uansett datakvalitet. */
export const GRENSEVAER_HYSTERESE_C = 1;

/**
 * Deklarerte usikkerhetsbånd (±°C) per svakeste premiss — DELTE konstanter
 * (Sols avvik a: en fast ±1°-margin er utilstrekkelig når erklært
 * måleusikkerhet kan krysse terskelen). Premissvalget speiler
 * usikrestPremiss i felles/tekst.ts: vind ≥ 4 m/s → vindmålingen,
 * ellers nedbør > 0 → nedbørsmengden, ellers temperaturen om to timer.
 */
export const USIKKERHETSBAAND_C = {
  vindmaaling: 2,
  nedboersmengde: 1.5,
  temperaturOmToTimer: 1,
} as const;

/** Terskler for hvilket premiss som er svakest (delt med felles/tekst.ts). */
export const VIND_PREMISS_TERSKEL_MS = 4;

/** Usikkerhetsbåndet (±°C) deklarert av det svakeste premisset. */
export function usikkerhetsbaandC(v: {
  windMs: number;
  precipMmH: number;
}): number {
  if (v.windMs >= VIND_PREMISS_TERSKEL_MS) return USIKKERHETSBAAND_C.vindmaaling;
  if (v.precipMmH > 0) return USIKKERHETSBAAND_C.nedboersmengde;
  return USIKKERHETSBAAND_C.temperaturOmToTimer;
}

/**
 * Effektiv grensevær-margin: maks(hysterese, deklarert usikkerhetsbånd fra
 * svakeste premiss). Aldri smalere enn hysteresen, aldri smalere enn det
 * grunnlaget selv innrømmer av usikkerhet.
 */
export function grensevaerMarginC(v: {
  windMs: number;
  precipMmH: number;
}): number {
  return Math.max(GRENSEVAER_HYSTERESE_C, usikkerhetsbaandC(v));
}

function harUkjentInput(fakta: NoytraleFakta): boolean {
  if (!fakta.kontekst || !fakta.datakvalitet) return true;
  if (!GYLDIGE_AKTIVITETER.has(fakta.kontekst.activity as string)) return true;
  if (fakta.datakvalitet.status === 'ok') {
    const v = fakta.vaergrunnlag;
    // «ok» uten værgrunnlag er selvmotsigende — ukjent tilstand.
    if (v == null) return true;
    if (![v.tempC, v.feelsLikeC, v.windMs, v.precipMmH].every(Number.isFinite)) {
      return true;
    }
    if (!v.band) return true;
  }
  return false;
}

function harMotstridendeKontekst(fakta: NoytraleFakta): boolean {
  const k = fakta.kontekst;
  if (!k) return false; // fanges av ukjent-input
  // I bilstol og i fri utelek samtidig går ikke.
  if (k.bilstol && k.activity === 'utelek') return true;
  // vognMode er kun meningsfullt for vogn.
  if (k.vognMode !== undefined && k.activity !== 'vogn') return true;
  return false;
}

function feelsLike(fakta: NoytraleFakta): number | null {
  return fakta.vaergrunnlag?.feelsLikeC ?? null;
}

export const REGELTABELL: Regel[] = [
  {
    id: 'motstridende-kontekst',
    prioritet: 10,
    modus: 'avvik',
    beskrivelse:
      'Konteksten motsier seg selv (f.eks. bilstol under utelek). Motstridende input gir aldri normal.',
    treffer: harMotstridendeKontekst,
  },
  {
    id: 'ukjent-input',
    prioritet: 11,
    modus: 'avvik',
    beskrivelse:
      'Felt mangler eller er ugyldige (ukjent aktivitet, ikke-numerisk vær, «ok» uten værgrunnlag). Ukjent gir aldri normal.',
    treffer: harUkjentInput,
  },
  {
    id: 'degradert-datakvalitet',
    prioritet: 20,
    modus: 'degradert',
    beskrivelse:
      'Datakvaliteten er ikke ok (værdata mangler eller gyldigheten er passert) — grunnlaget er borte, ikke rådet.',
    treffer: (fakta) => fakta.datakvalitet.status !== 'ok',
  },
  {
    id: 'bilstol-kulde',
    prioritet: 30,
    modus: 'avvik',
    beskrivelse:
      'Bilstol i kulde (føles-som < 5 °C): selekombinasjonen endrer hva som er trygt (HB-9-kontekst). Ligger ØVERST av kuldereglene så bilstol + kulde + sovende barn treffes her.',
    treffer: (fakta) => {
      const feels = feelsLike(fakta);
      return fakta.kontekst.bilstol && feels !== null && feels < 5;
    },
  },
  {
    id: 'sovende-frost',
    prioritet: 31,
    modus: 'avvik',
    beskrivelse:
      'Sovende vognbarn i frost (føles-som < 0 °C): sovende barn melder ikke fra selv.',
    treffer: (fakta) => {
      const feels = feelsLike(fakta);
      return fakta.kontekst.vognMode === 'sleeping' && feels !== null && feels < 0;
    },
  },
  {
    id: 'hard-safety',
    prioritet: 32,
    modus: 'avvik',
    beskrivelse:
      'Minst én hard safety-hendelse fra motoren (HIGH/CRITICAL) — stoppkriterium gjelder.',
    treffer: (fakta) => fakta.safetyEvents.some((e) => e.prioritet === 'hard'),
  },
  {
    id: 'ytterkant-band',
    prioritet: 33,
    modus: 'avvik',
    beskrivelse:
      'Temperaturband i skalaens ytterkant (ekstrem/ekstrem varme) — utenfor nyansert kalibrering.',
    treffer: (fakta) =>
      fakta.vaergrunnlag !== null && YTTERKANT_BAND.has(fakta.vaergrunnlag.band),
  },
  {
    id: 'soft-safety',
    prioritet: 40,
    modus: 'folg-med',
    beskrivelse:
      'Myke safety-hendelser (MEDIUM/LOW): planen holder, men barnet skal kontrolleres underveis.',
    treffer: (fakta) => fakta.safetyEvents.some((e) => e.prioritet === 'soft'),
  },
  {
    id: 'grensevaer',
    prioritet: 41,
    modus: 'folg-med',
    beskrivelse:
      'Føles-som ligger innenfor grensevær-marginen (maks av hysterese ' +
      `±${GRENSEVAER_HYSTERESE_C} °C og deklarert usikkerhetsbånd fra svakeste ` +
      'premiss) av en bandgrense — anbefalingen står på vippen.',
    treffer: (fakta) => {
      const v = fakta.vaergrunnlag;
      if (v === null || !Number.isFinite(v.feelsLikeC)) return false;
      const margin = grensevaerMarginC(v);
      return BAND_GRENSER.some(
        (grense) => Math.abs(v.feelsLikeC - grense) <= margin,
      );
    },
  },
  {
    id: 'normal',
    prioritet: 100,
    modus: 'normal',
    beskrivelse:
      'Fallback: komplett datagrunnlag, ingen safety-hendelser, ikke grensevær.',
    treffer: () => true,
  },
];
