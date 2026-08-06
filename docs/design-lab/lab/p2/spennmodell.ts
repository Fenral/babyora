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
 * Topptekst når datagrunnlaget MANGLER — aldri utløpssemantikk, aldri
 * referanse til en gammel gyldighet (Sols fase 10-review, P2-P1).
 */
export const KAN_IKKE_BEREGNES_TITTEL = 'Kan ikke beregnes';

/** Topptekst når gyldigheten er PASSERT — egen tilstand, ikke datamangel. */
export const UTLOPT_TITTEL = 'Spennet er utløpt';

/** Én gjenopprettingshandling per degradert tilstand (recovery). */
export const GJENOPPRETTING_TEKST: Record<'mangler' | 'utlopt', string> = {
  mangler: 'Hent værdata på nytt',
  utlopt: 'Beregn spennet på nytt',
};

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

/**
 * HYPOTESE: hvor mange °C ett varmepoeng flytter kandidaten i spennet.
 * Avvik c (Sols fase 10-review): poeng→grader er INTERN prototypekalibrering
 * — aldri et faglig eller sikkerhetsmessig utsagn. Kandidatens ekvivalente
 * gradtall (ekvivalentC) skal aldri vises i UI eller setningsform.
 */
export const GRADER_PER_POENG = 1.5;

/** HYPOTESE: avstand til hard grense som regnes som «nær» (økt sjekk). */
export const NAER_GRENSE_C = 1.5;

/** Ekstra kandidat-plagg (chips som ikke er i basePlagg). */
export const EKSTRA_KANDIDATER: BasePlagg[] = [
  { kategori: 'mellomlag', plagg: 'ekstra ullgenser' },
  { kategori: 'mellomlag', plagg: 'ekstra fleecegenser' },
  { kategori: 'ekstra', plagg: 'ekstra teppe' },
  { kategori: 'utstyr', plagg: 'regntrekk' },
];

/* ------------------------------------------------------------------ *
 * Tre forhåndsdefinerte kandidater (Sols fase 10-review, P2-P0):
 * anbefalingen alene tester BEKREFTELSE, ikke diagnose. Testselen
 * velger kandidat via kandidatId — ingen av dem merkes som «riktig»
 * i UI; deltakeren må lese posisjonen selv.
 * ------------------------------------------------------------------ */

export type KandidatId = 'kald' | 'trygg' | 'varm';

export const KANDIDAT_IDER: readonly KandidatId[] = ['kald', 'trygg', 'varm'];

/** De to lagene «varm»-kandidaten legger til (finnes også som chips). */
export const VARM_TILLEGG: BasePlagg[] = [
  { kategori: 'mellomlag', plagg: 'ekstra ullgenser' },
  { kategori: 'mellomlag', plagg: 'ekstra fleecegenser' },
];

/** «Kald» fjerner ett kritisk lag — varmest kategori først. */
const KRITISK_FJERNINGSREKKEFOLGE: BasePlagg['kategori'][] = [
  'yttertoy',
  'mellomlag',
  'innerst',
  'ekstra',
];

/**
 * Bygger den forhåndsdefinerte kandidaten:
 *  - kald:  anbefalingen minus kritiske lag (yttertøy først) til kandidaten
 *           står UNDER gulvet — normalt ett lag. Der anbefalingen ikke har
 *           yttertøy (søvntabellens pose, HB-9 fjernet dressen) fortsetter
 *           fjerningen til gulvet faktisk er brutt, ellers ville «kald»
 *           bare bekrefte spennet i stedet for å teste diagnose.
 *  - trygg: anbefalingen uendret → i spennet
 *  - varm:  anbefalingen pluss to mellomlag → over taket
 * Ren funksjon — muterer aldri spennet.
 */
export function forhaandsdefinertKandidat(
  spenn: SpennOk,
  id: KandidatId,
): BasePlagg[] {
  if (id === 'trygg') return [...spenn.basePlagg];
  if (id === 'varm') return [...spenn.basePlagg, ...VARM_TILLEGG];

  const kopi = [...spenn.basePlagg];
  // Så mye må kandidaten falle for å stå UNDER kaldgulvet (strengt).
  const trengsC = spenn.midtC - spenn.kaldgulvC;
  let fjernetPoeng = 0;
  const fjernEttKritiskLag = (): boolean => {
    for (const kategori of KRITISK_FJERNINGSREKKEFOLGE) {
      const i = kopi.findIndex((p) => p.kategori === kategori);
      if (i >= 0) {
        fjernetPoeng += KATEGORI_VARMEPOENG[kategori];
        kopi.splice(i, 1);
        return true;
      }
    }
    return false;
  };
  do {
    if (!fjernEttKritiskLag()) break;
  } while (fjernetPoeng * GRADER_PER_POENG <= trengsC);
  return kopi;
}

/* ------------------------------------------------------------------ *
 * Årsakskjeden (Sols fase 10-review, P2-P1): markørens posisjon skal
 * kunne leses som konsekvens av klesvalget, ikke som dekorasjon.
 * ------------------------------------------------------------------ */

/** Fast tekst som binder markøren til klesvalget (vises ved figuren). */
export const BEREGNET_FRA_TEKST = 'Beregnet fra klærne du valgte';

/**
 * Klarspråk-forklaring av hva ett chip-valg gjorde med markøren:
 * «Minus ullsokker — markøren falt mot gulvet.» Plagg uten varmebidrag
 * (utstyr) flytter ikke markøren, og det sies eksplisitt.
 */
export function endringsForklaring(plagg: BasePlagg, valgt: boolean): string {
  const fortegn = valgt ? 'Pluss' : 'Minus';
  const poeng = KATEGORI_VARMEPOENG[plagg.kategori];
  if (poeng === 0) {
    return `${fortegn} ${plagg.plagg} — markøren sto i ro: plagget beskytter, men varmer ikke.`;
  }
  const bevegelse = valgt ? 'steg mot taket' : 'falt mot gulvet';
  return `${fortegn} ${plagg.plagg} — markøren ${bevegelse}.`;
}

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
  /**
   * HVORFOR spennet ikke finnes — to ulike tilstander med ulik semantikk:
   * 'mangler' = datagrunnlag finnes ikke → «Kan ikke beregnes» (ALDRI
   * utløpssemantikk eller gammel gyldighet); 'utlopt' = gyldigheten er
   * passert → «Spennet er utløpt».
   */
  aarsakstype: 'mangler' | 'utlopt';
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
      aarsakstype: fakta.datakvalitet.status === 'utlopt' ? 'utlopt' : 'mangler',
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
    // 'mangler' skal ALDRI bære utløpssemantikk eller gammel gyldighet:
    // det finnes ikke noe tidligere spenn å referere til.
    if (spenn.aarsakstype === 'mangler') {
      return `${KAN_IKKE_BEREGNES_TITTEL}: ${spenn.aarsak} ${DEGRADERT_NESTE_HANDLING}`;
    }
    return `${UTLOPT_TITTEL} og maskert: ${spenn.aarsak} ${DEGRADERT_NESTE_HANDLING}`;
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
