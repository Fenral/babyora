/**
 * P1 «PROTOKOLLEN» — eksperimentmanifest (spec v2 §3-malen).
 *
 * Beslutningssløyfen som testes: system velger modus → brukeren forstår
 * hvorfor → utfører → kontrollpunkt → reagerer på stoppkriterium.
 * Degradert tilstand oppstår som OVERGANG i samme oppgave (virtuell klokke).
 */

import type { Modus } from './regeltabell';
import type { Topplinjetekst } from './protokollkompilator';

export type P1LoggEvent = {
  type:
    | 'protokoll_vist'
    | 'stabel_bekreftet'
    | 'steg_vist'
    | 'steg_bekreftet'
    | 'stemmer_ikke'
    | 'degradert_overgang'
    | 'beregn_paa_nytt'
    | 'nakkesjekk_bekreftet'
    | 'sloyfe_fullfort';
  scenarioId: string;
  modus?: Modus;
  stegId?: string;
  naaISO?: string;
};

export type ScenarioFasit = {
  forventetModus: Modus;
  /**
   * Topplinjen: modusfrase for aktive råd, tilgjengelighetstopptekst
   * («Rådet er utløpt» / «Kan ikke beregnes») for utilgjengelige.
   */
  forventetFrase: Topplinjetekst;
  /** Entydig scoringsfasit: den korrekte handlingen i sløyfen. */
  korrektHandling: string;
};

export type EksperimentManifest = {
  retning: 'p1';
  navn: string;
  primaerHypotese: string;
  isolertVariabel: string;
  beslutningssloyfe: string;
  oppgaver: string[];
  scoringsfasit: Record<string, ScenarioFasit>;
  farligeFeil: string[];
  stoppregel: string;
  loggedeEvents: { type: P1LoggEvent['type']; naar: string }[];
  ikkeStottet: string[];
};

export const manifest: EksperimentManifest = {
  retning: 'p1',
  navn: 'PROTOKOLLEN — skjermen du utfører, ikke listen du leser',

  primaerHypotese:
    'Når svaret rendres som utførbar sekvens med innebygde kontrollpunkter og ' +
    'stoppkriterier (to moduser: flow-så-bekreft og steg-for-steg), håndterer ' +
    'foreldre innlagte sikkerhetssteg korrekt oftere enn med en statisk liste, ' +
    'og gjennomfører nakkesjekken som faktisk handling — uten at normaldagen ' +
    'koster mer enn ett trykk.',

  isolertVariabel:
    'Utførelsesformatet: samme motorinnhold presentert som protokoll ' +
    '(modusstyrt sekvens med bekreftelse) i stedet for lesbar flate. ' +
    'Innhold, sikkerhetssemantikk og gyldighet er identiske på tvers av ' +
    'retningene (sjekkSemantikk-porten).',

  beslutningssloyfe:
    'Utløser: selen åpner protokollen for scenariet. Forstått situasjon: ' +
    'tilstandslinjen (Vanlig dag / Følg med / Avvik) med én setnings hvorfor. ' +
    'Første handling: normalmodus = stabelen gruppert i faser («På barnet» ' +
    'innerst→ytterst, «I vognen / uteklart» yttertøy + utstyr) + ett ' +
    'bekreft-trykk; avviksmodus = ett steg om gangen med bekreft per kritisk ' +
    'steg. Kontroll: nakkekontroll-flaten med kontrollpunktet og grenen ' +
    'Alt vel / Noe stemmer ikke. Korrigering: «Noe stemmer ikke» gir minste ' +
    'reversible endring, kun for i dag. Avslutning: kvittering. ' +
    'Feilstate: klokka passerer gyldighet → toppteksten «Rådet er utløpt» ' +
    'med én forklaring, konservativ fallback og «Beregn på nytt» som ' +
    'overgang (tilgjengelighetsstatus, aldri en fjerde beslutningsmodus).',

  oppgaver: [
    'Les tilstandslinjen og gjenfortell hvorfor dagen er vanlig / krever ' +
      'oppfølging / er et avvik (teach-back).',
    'Normalmodus: bekreft hele stabelen med ett trykk og utfør nakkesjekken.',
    'Avviksmodus: gå gjennom stegene i rekkefølge og bekreft hvert kritiske ' +
      'steg — inkludert bilstol-steget der det inngår.',
    'Reager på stoppkriteriet: forklar hva du gjør hvis nakken er klam.',
    'Når rådet utløper midt i oppgaven (spolt klokke): les toppteksten ' +
      '«Rådet er utløpt», forklar hva appen nå ber deg gjøre («Beregn på ' +
      'nytt» + fallback), og hvorfor det ikke er en feil.',
  ],

  /** Nøkler = de ti scenario-id-ene i felles/scenarier.ts. */
  scoringsfasit: {
    'normal-dag': {
      forventetModus: 'normal',
      forventetFrase: 'Vanlig dag',
      korrektHandling:
        'Bekrefte hele stabelen med ett trykk, deretter utføre nakkesjekken.',
    },
    grensevaer: {
      forventetModus: 'folg-med',
      forventetFrase: 'Følg med',
      korrektHandling:
        'Bekrefte stabelen OG gjenfortelle at nakken skal kjennes underveis ' +
        '(kontrollsteget fra den myke hendelsen).',
    },
    'sovende-vognbarn': {
      forventetModus: 'avvik',
      forventetFrase: 'Avvik',
      korrektHandling:
        'Gå steg for steg; bekrefte de kritiske stegene; gjenfortelle at et ' +
        'sovende barn i frost ikke sier fra selv.',
    },
    bilstol: {
      forventetModus: 'avvik',
      forventetFrase: 'Avvik',
      korrektHandling:
        'Utføre bilstol-steget (tynne lag + sele tett, dress over som teppe) ' +
        'FØR ytterlaget — aldri tykk dress under selen.',
    },
    'manglende-vaerdata': {
      forventetModus: 'degradert',
      forventetFrase: 'Kan ikke beregnes',
      korrektHandling:
        'Gjenfortelle fallbacken «Kle etter årstid. Kjenn på nakken før dere ' +
        'går.», forstå den som trygg degradering (ikke feil), og bruke ' +
        '«Beregn på nytt» som gjenoppretting.',
    },
    'endret-vaer': {
      forventetModus: 'folg-med',
      forventetFrase: 'Følg med',
      korrektHandling:
        'Bekrefte stabelen OG kjenne på nakken underveis (grensevær: ' +
        'vindmålingens usikkerhet krysser bandgrensen); deltaet leses som ' +
        'neste handling, aldri som dom over gårsdagens valg.',
    },
    'utlopt-raad': {
      forventetModus: 'degradert',
      forventetFrase: 'Rådet er utløpt',
      korrektHandling:
        'Ikke gjenbruke den gamle listen; følge fallbacken, kjenne på nakken ' +
        'og bruke «Beregn på nytt».',
    },
    'ny-omsorgsperson': {
      forventetModus: 'normal',
      forventetFrase: 'Vanlig dag',
      korrektHandling:
        'Følge protokollen uten forhistorie: gyldighet og kontrollpunkt bærer ' +
        'seg selv.',
    },
    'dynamic-type': {
      forventetModus: 'normal',
      forventetFrase: 'Vanlig dag',
      korrektHandling:
        'Samme handling som normal dag, med all tekst 1.4× uten kutt/overlapp.',
    },
    utendorslys: {
      forventetModus: 'avvik',
      forventetFrase: 'Avvik',
      korrektHandling:
        'Gå steg for steg i sollys-kontrast; reagere korrekt på det harde ' +
        'stoppkriteriet (kuldehendelsen).',
    },
  },

  farligeFeil: [
    'Brukeren bekrefter bilstol-protokollen uten å ha sett/utført ' +
      'bilstol-steget (tykk dress under selen).',
    'Degradert tilstand tolkes som «appen er ødelagt» og den utløpte listen ' +
      'følges videre.',
    'Avviksmodus omgås med ett-trykks-bekreftelse (kritiske steg hoppes over).',
    'Nakkesjekk-steget nås aldri (frafall før siste steg i read-do-sekvensen).',
    'Stoppkriteriet leses som informasjon, ikke som avbruddsregel ' +
      '(teach-back gir feil respons på «klam nakke»).',
  ],

  stoppregel:
    'Én observasjon av en farlig feil → stopp testen, redesign, ny test ' +
    '(nulltoleranse, jf. Sols klarsignal). I tillegg: hvis «Avvik» fyrer så ' +
    'ofte over den simulerte værmåneden at deltakere slutter å skille ' +
    'tilstandene, eller read-do-frafall rammer sikkerhetssteg, stoppes ' +
    'retningen (alarmtretthet-grensen fra retningsrapporten §17).',

  loggedeEvents: [
    { type: 'protokoll_vist', naar: 'Sløyfen åpnes for et scenario (med modus).' },
    { type: 'stabel_bekreftet', naar: 'Normalmodus: hele stabelen bekreftes med ett trykk.' },
    { type: 'steg_vist', naar: 'Avviksmodus: et nytt steg vises.' },
    { type: 'steg_bekreftet', naar: 'Avviksmodus: et kritisk steg bekreftes.' },
    { type: 'stemmer_ikke', naar: 'Brukeren korrigerer et steg (minste endring, kun i dag).' },
    { type: 'degradert_overgang', naar: 'Klokka passerer gyldighet → fallback vises.' },
    { type: 'beregn_paa_nytt', naar: 'Utilgjengelig råd: brukeren ber om ny beregning.' },
    { type: 'nakkesjekk_bekreftet', naar: 'Det avsluttende kontrollsteget bekreftes.' },
    { type: 'sloyfe_fullfort', naar: 'Kvitteringen vises (sløyfens sluttstate).' },
  ],

  ikkeStottet: [
    'Kan ikke bevise at nakkesjekken faktisk UTFØRES fysisk — web måler kun ' +
      'kvittering/teach-back, ikke handlingen (spec §2: krever observasjon).',
    'Ingen haptikk (bekreftelsespuls/stoppsignatur) — web-selen har ikke ' +
      'native haptikk.',
    'Ingen låseskjerm/widget/Live Activity, ingen leveringstid eller ' +
      'bakgrunnsoppdatering (native-sperret, jf. Sols klarsignal).',
    'Ingen ekte værdata eller posisjon — fiktive scenarier fra selen.',
    'Ingen full navigasjon («bak arket», garderobe, profil) og ingen ' +
      'premium/paywall — kun beslutningssløyfen.',
    'Hanske-treffmål og VoiceOver-rekkefølge på systemflate valideres ikke ' +
      'i web (krever native verifisering).',
    'Turrytmen etter døren (hendelsesbaserte kontrollpunkter underveis) er ' +
      'ikke del av denne skiven — sløyfen slutter ved kvitteringen.',
  ],
};
