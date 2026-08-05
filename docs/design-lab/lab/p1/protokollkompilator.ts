/**
 * P1 «PROTOKOLLEN» — protokollkompilatoren (retningens transformator).
 *
 * NoytraleFakta → Protokoll: modus (fra klassifisereren), steg[] i
 * PÅKLEDNINGSREKKEFØLGE (innerst → mellomlag → ytterlag → hode → hender →
 * føtter → utstyr), der safetyEvents settes inn som STEG på riktig plass i
 * sekvensen — bilstol-steget FØR ytterlag, andre harde hendelser FØRST
 * (leses før man begynner), myke hendelser som kontrollsteg til slutt.
 * Avsluttende nakkesjekk-steg er ALLTID sist (retningens memory item).
 *
 * Semantikk-kontrakten (spec v2 §4.2): uttrykkFraProtokoll leser semantikken
 * UT AV STEGENE — fjernes et sikkerhetssteg, feiler sjekkSemantikk. Porten
 * er dermed koblet til det protokollen faktisk bærer, ikke til input.
 *
 * Ingen UI-ord her: kompilatoren produserer innhold og rekkefølge, aldri
 * farger, kort eller plassering. Presentasjonen bor i index.tsx.
 */

import type { LayerCategory } from '@lib/wool-layers/types';
import type {
  NoytraleFakta,
  RetningsUttrykk,
  SafetyEvent,
} from '../felles/fakta';
import { DEGRADERT_NESTE_HANDLING } from '../felles/tekst';
import { klassifiserDetaljert } from './klassifiserer';
import type { Modus, Regel } from './regeltabell';

/* ------------------------------------------------------------------ *
 * Typer
 * ------------------------------------------------------------------ */

export type Sone =
  | 'kjerne' // body/ull + mellomlag + ytterlag (kroppens lag, innerst→ytterst)
  | 'hode'
  | 'hender'
  | 'fotter'
  | 'utstyr'
  | 'sikkerhet'
  | 'kontroll';

export type ProtokollSteg = {
  id: string;
  sone: Sone;
  /** Verb-først-handling («Ta på ullbody») eller sikkerhetsinnholdet. */
  handling: string;
  /** Det fysiske kontrollpunktet (alltid nakke/bryst-varianten). */
  kontrollpunkt?: string;
  /** Når aktiviteten skal avbrytes/ikke startes. */
  stoppkriterium?: string;
  /** Kritisk steg krever egen bekreftelse i avviksmodus. */
  kritisk: boolean;
  /** Satt når steget bærer en safety-hendelse fra faktalaget. */
  safetyEventId?: string;
};

export type Tilstandsfrase = 'Vanlig dag' | 'Følg med' | 'Avvik';

export type Tilstandslinje = {
  frase: Tilstandsfrase;
  /** Én setnings hvorfor — koblet til regelen som avgjorde modusen. */
  hvorfor: string;
};

export type Protokoll = {
  modus: Modus;
  /** Regelen som avgjorde modusen (sporbarhet i logg/tester). */
  regelId: string;
  tilstand: Tilstandslinje;
  steg: ProtokollSteg[];
  gyldigTilISO: string;
  /** Satt kun i degradert modus: konservativ generisk fallback. */
  degradert: { fallback: string; aarsak: string } | null;
};

/* ------------------------------------------------------------------ *
 * Faste enheter i retningens grammatikk
 * ------------------------------------------------------------------ */

/** Autoritetsgrensen — kobles i UI til det konkrete kontrollpunktet. */
export const AUTORITETSLINJE = 'Protokollen ser været. Du ser barnet.';

export const NAKKESJEKK_ID = 'nakkesjekk';

/** Avsluttende kontrollsteg — alltid sist, i alle moduser. */
export function lagNakkesjekkSteg(): ProtokollSteg {
  return {
    id: NAKKESJEKK_ID,
    sone: 'kontroll',
    handling: 'Kjenn på nakken før dere går',
    kontrollpunkt:
      'Kjenn med to fingre bak i nakken — ikke på hendene, de er alltid kalde',
    stoppkriterium:
      'Klam nakke: fjern ett lag. Kald nakke eller kaldt bryst: inn igjen.',
    kritisk: true,
  };
}

/* ------------------------------------------------------------------ *
 * Påkledningsrekkefølgen
 * ------------------------------------------------------------------ */

/** Kanonisk rekkefølge for soner (lavere tall kles/gjøres først). */
export const SONE_REKKEFOLGE: Record<Exclude<Sone, 'sikkerhet' | 'kontroll'>, number> = {
  kjerne: 0, // underinndeles av kategoriene innerst/mellomlag/yttertoy
  hode: 3,
  hender: 4,
  fotter: 5,
  utstyr: 6,
};

const KATEGORI_POSISJON: Record<LayerCategory, number> = {
  innerst: 0,
  mellomlag: 1,
  yttertoy: 2,
  ekstra: 3, // finfordeles per plaggnavn (hode/hender/føtter/utstyr)
  utstyr: 6,
};

const HODE_RE = /lue|balaklava|solhatt|caps|hette|halsedisse|ansiktskrem/i;
const HENDER_RE = /vott|vante/i;
const FOTTER_RE = /sokk|str[øo]mpe|sko|tøf/i;

/** Posisjon i påkledningsrekkefølgen + sone for ett plagg. */
export function plasserPlagg(
  kategori: LayerCategory,
  plagg: string,
): { posisjon: number; sone: Sone } {
  if (kategori === 'innerst' || kategori === 'mellomlag' || kategori === 'yttertoy') {
    return { posisjon: KATEGORI_POSISJON[kategori], sone: 'kjerne' };
  }
  if (kategori === 'utstyr') return { posisjon: SONE_REKKEFOLGE.utstyr, sone: 'utstyr' };
  // 'ekstra' fordeles på kroppssone etter navn; ukjent → utstyr (gjøres klart).
  if (HODE_RE.test(plagg)) return { posisjon: SONE_REKKEFOLGE.hode, sone: 'hode' };
  if (HENDER_RE.test(plagg)) return { posisjon: SONE_REKKEFOLGE.hender, sone: 'hender' };
  if (FOTTER_RE.test(plagg)) return { posisjon: SONE_REKKEFOLGE.fotter, sone: 'fotter' };
  return { posisjon: SONE_REKKEFOLGE.utstyr, sone: 'utstyr' };
}

function plaggHandling(sone: Sone, plagg: string): string {
  return sone === 'utstyr' ? `Gjør klar ${plagg}` : `Ta på ${plagg}`;
}

/* ------------------------------------------------------------------ *
 * Safety-hendelser → steg med plassering i sekvensen
 * ------------------------------------------------------------------ */

type SafetyPlassering = 'forst' | 'foer-ytterlag' | 'kontroll-til-slutt';

/**
 * Bilstol-hendelser (HB-9-familien) hører hjemme FØR ytterlaget: valget om
 * dress/tynne lag tas idet ytterlaget skal på — ikke som banner etterpå.
 */
export function plasserSafetyEvent(
  event: SafetyEvent,
  fakta: NoytraleFakta,
): SafetyPlassering {
  if (event.prioritet === 'soft') return 'kontroll-til-slutt';
  const gjelderBilstol =
    fakta.kontekst.bilstol && /bilstol|sele/i.test(event.innhold);
  return gjelderBilstol ? 'foer-ytterlag' : 'forst';
}

function tilSafetySteg(event: SafetyEvent): ProtokollSteg {
  return {
    id: `sikkerhet-${event.id}`,
    sone: 'sikkerhet',
    handling: event.innhold,
    kontrollpunkt:
      event.prioritet === 'soft'
        ? 'Kjenn på nakken underveis — ikke bare før dere går'
        : undefined,
    stoppkriterium: event.stoppkriterium,
    kritisk: event.prioritet === 'hard',
    safetyEventId: event.id,
  };
}

/* ------------------------------------------------------------------ *
 * Tilstandslinjen — frase + én setnings hvorfor
 * ------------------------------------------------------------------ */

const FRASE_FOR_MODUS: Record<Modus, Tilstandsfrase> = {
  normal: 'Vanlig dag',
  'folg-med': 'Følg med',
  avvik: 'Avvik',
  degradert: 'Avvik',
};

const HVORFOR_FOR_REGEL: Record<string, string> = {
  normal: 'Været er stabilt og grunnlaget er ferskt.',
  grensevaer: 'Temperaturen står på vippen mellom to lag.',
  'soft-safety': 'Planen holder, men kjenn på nakken underveis.',
  'bilstol-kulde': 'Bilstol i kulde endrer hva som er trygt.',
  'sovende-frost': 'Et sovende barn i frost sier ikke fra selv.',
  'hard-safety': 'En sikkerhetsregel gjelder før dere går.',
  'ytterkant-band': 'Været er utenfor det protokollen kan nyansere.',
  'motstridende-kontekst':
    'Opplysningene motsier hverandre — protokollen velger det sikre.',
  'ukjent-input': 'Noe i grunnlaget er ukjent — protokollen velger det sikre.',
  'nodfall-avvik': 'Grunnlaget kunne ikke leses — protokollen velger det sikre.',
};

function tilstandslinje(
  modus: Modus,
  regel: Regel,
  fakta: NoytraleFakta,
): Tilstandslinje {
  if (modus === 'degradert') {
    return { frase: 'Avvik', hvorfor: fakta.datakvalitet.svakestePremiss };
  }
  return {
    frase: FRASE_FOR_MODUS[modus],
    hvorfor: HVORFOR_FOR_REGEL[regel.id] ?? regel.beskrivelse,
  };
}

/* ------------------------------------------------------------------ *
 * Kompilatoren
 * ------------------------------------------------------------------ */

export function kompilerProtokoll(fakta: NoytraleFakta): Protokoll {
  const { modus, regel } = klassifiserDetaljert(fakta);
  const gyldigTilISO = fakta.gyldighet.gjelderTilISO;
  const tilstand = tilstandslinje(modus, regel, fakta);

  if (modus === 'degradert') {
    return {
      modus,
      regelId: regel.id,
      tilstand,
      gyldigTilISO,
      degradert: {
        fallback: DEGRADERT_NESTE_HANDLING,
        aarsak: fakta.datakvalitet.svakestePremiss,
      },
      steg: [
        {
          id: 'degradert-kle-etter-aarstid',
          sone: 'kjerne',
          handling: 'Kle etter årstid',
          kritisk: false,
        },
        lagNakkesjekkSteg(),
      ],
    };
  }

  // 1) Plaggsteg i påkledningsrekkefølge (stabil sortering: posisjon,
  //    deretter opprinnelig motor-rekkefølge innen samme posisjon).
  const plaggSteg = fakta.basePlagg
    .map((bp, indeks) => {
      const { posisjon, sone } = plasserPlagg(bp.kategori, bp.plagg);
      return { posisjon, indeks, steg: lagPlaggSteg(sone, bp.plagg, indeks) };
    })
    .sort((a, b) => a.posisjon - b.posisjon || a.indeks - b.indeks);

  // 2) Safety-hendelser fordeles på plassering i sekvensen.
  const forst: ProtokollSteg[] = [];
  const foerYtterlag: ProtokollSteg[] = [];
  const kontrollTilSlutt: ProtokollSteg[] = [];
  for (const event of fakta.safetyEvents) {
    const steg = tilSafetySteg(event);
    const plassering = plasserSafetyEvent(event, fakta);
    if (plassering === 'forst') forst.push(steg);
    else if (plassering === 'foer-ytterlag') foerYtterlag.push(steg);
    else kontrollTilSlutt.push(steg);
  }

  // 3) Sett inn foer-ytterlag-gruppen rett før første steg fra og med
  //    ytterlaget (posisjon >= yttertoy). Finnes ikke noe slikt steg,
  //    legges gruppen etter plaggstegene (før kontrollstegene).
  const steg: ProtokollSteg[] = [...forst];
  let ytterlagSatt = foerYtterlag.length === 0;
  for (const rad of plaggSteg) {
    if (!ytterlagSatt && rad.posisjon >= KATEGORI_POSISJON.yttertoy) {
      steg.push(...foerYtterlag);
      ytterlagSatt = true;
    }
    steg.push(rad.steg);
  }
  if (!ytterlagSatt) steg.push(...foerYtterlag);

  steg.push(...kontrollTilSlutt);
  steg.push(lagNakkesjekkSteg());

  return { modus, regelId: regel.id, tilstand, gyldigTilISO, degradert: null, steg };
}

function lagPlaggSteg(sone: Sone, plagg: string, indeks: number): ProtokollSteg {
  return {
    id: `plagg-${indeks}-${plagg.replace(/[^a-zæøå0-9]+/gi, '-').toLowerCase()}`,
    sone,
    handling: plaggHandling(sone, plagg),
    kritisk: false,
  };
}

/* ------------------------------------------------------------------ *
 * Semantikk-uttrykket — lest UT AV STEGENE (mutasjonskoblet)
 * ------------------------------------------------------------------ */

export function uttrykkFraProtokoll(protokoll: Protokoll): RetningsUttrykk {
  const safetyEventIds = [
    ...new Set(
      protokoll.steg.flatMap((s) => (s.safetyEventId ? [s.safetyEventId] : [])),
    ),
  ];
  const stoppkriterier = [
    ...new Set(
      protokoll.steg.flatMap((s) => (s.stoppkriterium ? [s.stoppkriterium] : [])),
    ),
  ];
  return {
    retning: 'p1',
    safetyEventIds,
    stoppkriterier,
    gyldigTil: protokoll.gyldigTilISO,
  };
}

/* ------------------------------------------------------------------ *
 * Klokke-overgangen: er protokollen utløpt AKKURAT NÅ?
 * (Degradert oppstår som OVERGANG når selens klokke passerer gyldighet.)
 * ------------------------------------------------------------------ */

export function erUtloptNaa(protokoll: Protokoll, naaISO: string): boolean {
  const naa = Date.parse(naaISO);
  const til = Date.parse(protokoll.gyldigTilISO);
  if (!Number.isFinite(naa) || !Number.isFinite(til)) return true; // fail-safe
  return naa > til;
}
