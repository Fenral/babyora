/**
 * P2 «SPENNET» — spennmodellen: transformator NoytraleFakta → Spenn.
 *
 * Retning: Confidence Instrument (appendix/fase7/retning-confidence.md).
 * Instrument, ikke orakel: modellen produserer et TRYGT SPENN med hardt
 * kaldgulv og mykere varmetak, og dømmer et kandidat-antrekk som POSISJON
 * med fastkoblet respons (PEWS-strukturen) — aldri en score.
 *
 * ============================ HYPOTESE ============================
 * Alle tall i denne filen er HYPOTESER, ikke fagvaliderte grenser:
 *  - BAND_GRENSER speiler bandForTemp() i src/lib/wool-layers/tables.ts
 *    (åpne ender er kappet ved ±-verdier valgt av laben).
 *  - USIKKERHETSPAASLAG_C, KATEGORI_VARMEPOENG og GRADER_PER_POENG er
 *    veiledende modellvalg for prototypetesten.
 * UI-et skal alltid bære etiketten HYPOTESE_ETIKETT synlig.
 * ==================================================================
 *
 * Semantikk-kontrakten (spec v2 §4 pkt. 2): spennUttrykk() SKAL bestå
 * sjekkSemantikk() mot faktaene for alle ti scenarier — spennet bærer
 * hvert safetyEvent, hvert stoppkriterium og eksakt gyldighet videre.
 */

import type { TempBand } from '@lib/wool-layers/types';
import type {
  BasePlagg,
  NoytraleFakta,
  RetningsUttrykk,
  SafetyEventPrioritet,
} from '../felles/fakta';
import { usikrestPremiss, DEGRADERT_NESTE_HANDLING } from '../felles/tekst';

/** Etiketten som ALLTID står på instrumentflaten (spec v2 §2). */
export const HYPOTESE_ETIKETT = 'Veiledende område — ikke fagvalidert';

/**
 * HYPOTESE: temperaturbåndenes grenser i føles-som °C.
 * Speiler bandForTemp() i tables.ts; de åpne endene (ekstrem,
 * ekstrem_varme) er kappet ved lab-valgte verdier.
 */
export const BAND_GRENSER: Record<TempBand, { nedreC: number; ovreC: number }> = {
  ekstrem: { nedreC: -25, ovreC: -15 },
  streng_frost: { nedreC: -15, ovreC: -7 },
  frost: { nedreC: -7, ovreC: 0 },
  kald: { nedreC: 0, ovreC: 5 },
  kjolig: { nedreC: 5, ovreC: 10 },
  mild: { nedreC: 10, ovreC: 16 },
  varm: { nedreC: 16, ovreC: 22 },
  tropisk: { nedreC: 22, ovreC: 28 },
  ekstrem_varme: { nedreC: 28, ovreC: 35 },
};

/**
 * HYPOTESE: usikkerhetspåslag i °C per svakeste premiss (datakvaliteten
 * bak spennet). Usikkerhet spiser av spennet fra den HARDE siden —
 * terrenget vokser innover, aldri utover (retningsrapport §2).
 */
export const USIKKERHETSPAASLAG_C: Record<string, number> = {
  vindmålingen: 2,
  nedbørsmengden: 1.5,
  'temperaturen om to timer': 1,
};

/** HYPOTESE: ukjent premiss → konservativt størst påslag. */
export const PAASLAG_FALLBACK_C = 2;

/**
 * HYPOTESE: varmebidrag per plaggkategori (relativ vekt, ikke TOG).
 * 'utstyr' (regntrekk o.l.) beskytter men varmer ikke.
 */
export const KATEGORI_VARMEPOENG: Record<BasePlagg['kategori'], number> = {
  innerst: 2,
  mellomlag: 2,
  yttertoy: 3,
  ekstra: 1,
  utstyr: 0,
};

/** HYPOTESE: hvor mange °C ett varmepoeng flytter kandidaten i spennet. */
export const GRADER_PER_POENG = 1.5;

/** HYPOTESE: avstand til hard grense som regnes som «nær» (økt sjekk). */
export const NAER_GRENSE_C = 1.5;

/** Ekstra kandidat-plagg (chips som ikke er i basePlagg). */
export const EKSTRA_KANDIDATER: BasePlagg[] = [
  { kategori: 'mellomlag', plagg: 'ekstra ullgenser' },
  { kategori: 'ekstra', plagg: 'ekstra teppe' },
  { kategori: 'utstyr', plagg: 'regntrekk' },
];

/** En sikkerhetshendelse slik spennet bærer den (innhold uendret). */
export type SpennHendelse = {
  id: string;
  innhold: string;
  prioritet: SafetyEventPrioritet;
  stoppkriterium?: string;
  /** Fastkoblet respons — hva brukeren gjør med hendelsen. */
  respons: string;
};

export type SpennOk = {
  status: 'ok';
  /** Nedre grense etter påslag — den harde siden i våken modus. */
  kaldgulvC: number;
  /** Øvre grense etter påslag — den harde siden ved vogn-søvn. */
  varmetakC: number;
  /** Midt i spennet — der motorens anbefalte antrekk står. */
  midtC: number;
  /** Hvilken side er hard (beskyttet). Inverteres ved vogn-søvn. */
  hardSide: 'kald' | 'varm';
  /** true når vognMode === 'sleeping' (overoppheting = hard side). */
  invertert: boolean;
  band: TempBand;
  usikkerhetspaaslagC: number;
  usikrestPremiss: string;
  basePlagg: BasePlagg[];
  hendelser: SpennHendelse[];
  utstedtISO: string;
  gyldigTilISO: string;
};

export type SpennDegradert = {
  status: 'degradert';
  /** Klarspråk-årsak (datakvalitetens svakeste premiss). */
  aarsak: string;
  hendelser: SpennHendelse[];
  utstedtISO: string;
  gyldigTilISO: string;
};

export type Spenn = SpennOk | SpennDegradert;

function tilHendelse(event: NoytraleFakta['safetyEvents'][number]): SpennHendelse {
  return {
    id: event.id,
    innhold: event.innhold,
    prioritet: event.prioritet,
    stoppkriterium: event.stoppkriterium,
    respons: event.forventetHandling,
  };
}

/**
 * Hovedinngang: nøytrale fakta → spenn.
 *
 * Grensene kommer fra båndtabellen ± deklarert usikkerhetspåslag.
 * Påslaget spiser ALLTID av den harde siden: kaldgulvet heves i våken
 * modus; varmetaket senkes ved vogn-søvn (invertert asymmetri).
 * Gulvet flyttes aldri av brukerens kandidat — kun av fakta.
 */
export function byggSpenn(fakta: NoytraleFakta): Spenn {
  const hendelser = fakta.safetyEvents.map(tilHendelse);
  const utstedtISO = fakta.gyldighet.utstedtISO;
  const gyldigTilISO = fakta.gyldighet.gjelderTilISO;

  if (fakta.vaergrunnlag === null || fakta.datakvalitet.status !== 'ok') {
    return {
      status: 'degradert',
      aarsak: fakta.datakvalitet.svakestePremiss,
      hendelser,
      utstedtISO,
      gyldigTilISO,
    };
  }

  const vaer = fakta.vaergrunnlag;
  const grenser = BAND_GRENSER[vaer.band];
  const premiss = usikrestPremiss({
    tempC: vaer.tempC,
    windMs: vaer.windMs,
    precipMmH: vaer.precipMmH,
    symbolCode: vaer.symbolCode,
  });
  const paaslag = USIKKERHETSPAASLAG_C[premiss] ?? PAASLAG_FALLBACK_C;

  const invertert = fakta.kontekst.vognMode === 'sleeping';
  const hardSide: 'kald' | 'varm' = invertert ? 'varm' : 'kald';

  const kaldgulvC = hardSide === 'kald' ? grenser.nedreC + paaslag : grenser.nedreC;
  const varmetakC = hardSide === 'varm' ? grenser.ovreC - paaslag : grenser.ovreC;

  return {
    status: 'ok',
    kaldgulvC,
    varmetakC,
    midtC: (kaldgulvC + varmetakC) / 2,
    hardSide,
    invertert,
    band: vaer.band,
    usikkerhetspaaslagC: paaslag,
    usikrestPremiss: premiss,
    basePlagg: fakta.basePlagg,
    hendelser,
    utstedtISO,
    gyldigTilISO,
  };
}

/**
 * Semantikk-uttrykket spennet faktisk bærer — bygget av spennets egne
 * hendelser (ikke rett fra fakta), slik at porten beviser at modellen
 * ikke mister sikkerhetsinnhold på veien.
 */
export function spennUttrykk(spenn: Spenn): RetningsUttrykk {
  return {
    retning: 'p2',
    safetyEventIds: [...new Set(spenn.hendelser.map((h) => h.id))].sort(),
    stoppkriterier: [
      ...new Set(
        spenn.hendelser.flatMap((h) =>
          h.stoppkriterium ? [h.stoppkriterium] : [],
        ),
      ),
    ].sort(),
    gyldigTil: spenn.gyldigTilISO,
  };
}

export type SpennPosisjon = 'under-gulv' | 'i-spennet' | 'over-tak';

/** Dommen over et kandidat-antrekk: posisjon + fastkoblet respons. */
export type PosisjonsDom = {
  posisjon: SpennPosisjon;
  /** true når kandidaten står i spennet men nær den HARDE grensen. */
  naerHardGrense: boolean;
  /** Kandidatens plass på temperaturaksen (intern — vises aldri som tall). */
  ekvivalentC: number;
  /** Neste handling — alltid en plagghandling eller «gå». */
  handling: string;
  /** Kroppslig kontrolltegn (Lullaby-doktrinen: nakken, aldri hendene). */
  kontrolltegn: string;
  /** Kanonisk setningsform — SAMME beslutning som figuren (testbart). */
  setning: string;
};

export function varmepoeng(plagg: BasePlagg[]): number {
  return plagg.reduce((sum, p) => sum + KATEGORI_VARMEPOENG[p.kategori], 0);
}

function posisjonsfrase(
  posisjon: SpennPosisjon,
  hardSide: 'kald' | 'varm',
  naer: boolean,
): string {
  if (posisjon === 'under-gulv') {
    return hardSide === 'kald'
      ? 'Antrekket ligger under kaldgulvet — den harde grensen.'
      : 'Antrekket ligger under kaldgulvet.';
  }
  if (posisjon === 'over-tak') {
    return hardSide === 'varm'
      ? 'Antrekket ligger over varmetaket — den harde grensen når barnet sover.'
      : 'Antrekket ligger over varmetaket.';
  }
  if (naer) {
    return hardSide === 'kald'
      ? 'Antrekket ligger i trygt spenn, nær den kalde grensen.'
      : 'Antrekket ligger i trygt spenn, nær den varme grensen.';
  }
  return 'Antrekket ligger i trygt spenn.';
}

function respons(
  posisjon: SpennPosisjon,
  hardSide: 'kald' | 'varm',
  naer: boolean,
  invertert: boolean,
): { handling: string; kontrolltegn: string } {
  if (posisjon === 'under-gulv') {
    return {
      handling: invertert
        ? 'Legg til ett lag før barnet sover videre.'
        : 'Legg til ett lag før dere går.',
      kontrolltegn:
        'Kjenn på nakke og bryst etter en liten stund — kaldt der betyr ett lag til. Barnets hender er alltid kalde og teller ikke.',
    };
  }
  if (posisjon === 'over-tak') {
    return {
      handling: invertert
        ? 'Fjern ett lag nå — for varmt er den farlige siden når barnet sover.'
        : 'Fjern ett lag — barnet blir for varmt.',
      kontrolltegn:
        'Svett nakke eller rødt, varmt ansikt betyr fortsatt for varmt — avbryt og kle av.',
    };
  }
  if (naer) {
    return hardSide === 'kald'
      ? {
          handling: 'Greit for en kort tur.',
          kontrolltegn:
            'Kjenn på nakken oftere enn vanlig — barnets hender er alltid kalde og teller ikke.',
        }
      : {
          handling: 'Greit — men sjekk oftere mens barnet sover.',
          kontrolltegn: 'Kjenn på nakken: svett nakke betyr for varmt.',
        };
  }
  return {
    handling: invertert ? 'La barnet sove — dette holder.' : 'Gå ut som planlagt.',
    kontrolltegn: 'Kjenn på nakken underveis.',
  };
}

/**
 * Dommen: hvor havner kandidat-antrekket i spennet?
 *
 * Motorens anbefalte antrekk står per definisjon MIDT i spennet;
 * kandidaten flyttes derfra av differansen i varmepoeng. Dommen er
 * posisjon + fastkoblet respons — det finnes ingen score, prosent
 * eller karakter i modellen.
 */
export function kandidatposisjon(spenn: SpennOk, kandidat: BasePlagg[]): PosisjonsDom {
  const delta = varmepoeng(kandidat) - varmepoeng(spenn.basePlagg);
  const ekvivalentC = spenn.midtC + delta * GRADER_PER_POENG;

  let posisjon: SpennPosisjon;
  if (ekvivalentC < spenn.kaldgulvC) posisjon = 'under-gulv';
  else if (ekvivalentC > spenn.varmetakC) posisjon = 'over-tak';
  else posisjon = 'i-spennet';

  const hardGrenseC = spenn.hardSide === 'kald' ? spenn.kaldgulvC : spenn.varmetakC;
  const naerHardGrense =
    posisjon === 'i-spennet' && Math.abs(ekvivalentC - hardGrenseC) <= NAER_GRENSE_C;

  const { handling, kontrolltegn } = respons(
    posisjon,
    spenn.hardSide,
    naerHardGrense,
    spenn.invertert,
  );
  const frase = posisjonsfrase(posisjon, spenn.hardSide, naerHardGrense);

  return {
    posisjon,
    naerHardGrense,
    ekvivalentC,
    handling,
    kontrolltegn,
    setning: `${frase} ${handling} ${kontrolltegn}`,
  };
}

/**
 * Kanonisk setningsform for selve instrumentet (tekstparitet, INV-12):
 * ingen tall på aksen — soner, ikke skala.
 */
export function spennSetning(spenn: Spenn): string {
  if (spenn.status === 'degradert') {
    return `Spennet er maskert: ${spenn.aarsak} ${DEGRADERT_NESTE_HANDLING}`;
  }
  const hard =
    spenn.hardSide === 'kald'
      ? 'kaldgulvet — for kaldt er den farlige siden'
      : 'varmetaket — for varmt er den farlige siden når barnet sover';
  return (
    `Instrumentet viser tre soner: under kaldgulvet, trygt spenn og over varmetaket. ` +
    `Hard grense nå: ${hard}. Usikrest: ${spenn.usikrestPremiss}.`
  );
}
