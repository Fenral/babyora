/**
 * Typene til skjermmanifest-generatoren. Verktøyene i tools/ er .mjs (de kjøres
 * med bar node, uten byggesteg), men porten i
 * src/styles/__tests__/skjermmanifest.test.ts importerer dem — og tsc -b
 * typesjekker src/. Denne fila er derfor kontrakten mellom de to, ikke en
 * parallell sannhet: endres generatorens API, skal den endres her.
 */

export declare const ROT: string;
export declare const MANIFEST_STI: string;
export declare const UNNTAK_STI: string;

export type Funnpunkt = {
  liste: 'BLOKKERER' | 'BØR RETTES' | 'KOSMETISK';
  tittel: string;
  /** Filen lanseringsstatusen faktisk navngir (kan være skjermens .css). */
  fil?: string;
  /** `:123` eller `:989-1000`, tom streng hvis punktet ikke oppgir linje. */
  sted: string;
  tag: 'T-01' | 'adresseliste' | null;
};

export type Vedtak = {
  id: string;
  vedtak: string;
  kilde: string;
  handhevesAv: string | null;
  status: string;
  merknad?: string;
};

export type Skjermrad = {
  sti: string;
  navn: string;
  visningsnavn: string | null;
  /** Hvordan skjermen nås. `null` = ingen rutekilde når den. */
  vei: string | null;
  linjer: number;
  cssFil: string | null;
  styleBlokker: number;
  stilobjekter: number;
  inlineStilAttributter: number;
  dwForbruk: number;
  legacyTokens: string[];
  raaHex: number;
  ingenStilflate: boolean;
  umigrert: boolean;
  migreres: boolean;
  fase: string;
  unntaksgrunn: string | null;
  tilleggsfase: { fase: string; grunn: string } | null;
  eierpunkter: Array<{ id: string; vedtak: Vedtak | null }>;
  funn: Funnpunkt[];
};

export type Rutekilder = {
  lazyRegister: string[];
  ruteNokler: string[];
  drillKinds: string[];
  tabDefs: Array<{ key: string; label: string }>;
  familieToolTargets: string[];
  guideTargets: string[];
  rendretIApp: string[];
  refererteNavn: string[];
  /** Skjermnavn som KUN står i kommentarer — bevis på at strippingen virker. */
  kunIProsa: string[];
};

export type Unntaksfil = {
  visningsnavn: Record<string, string>;
  lanseringsstatusnavn: Record<string, string>;
  unntak: Record<string, { fase: string; grunn: string }>;
  tilleggsfase?: Record<string, { fase: string; grunn: string }>;
  eierpunkter?: Record<string, string[]>;
  ikkeSkjermer: Array<{ fil: string; grunn: string }>;
};

export type Manifest = {
  rader: Skjermrad[];
  naa: {
    skjermer: string[];
    rute: Rutekilder;
    graf: Map<string, string[]>;
    vei: Map<string, string>;
    /** Skjermfiler på disk som INGEN rutekilde når. */
    uNaabare: string[];
    /** Navn ruteren refererer til som ikke finnes på disk. */
    hengende: string[];
  };
  unntak: Unntaksfil;
  utgatteReferanser: string[];
  funnTreff: number;
  tall: {
    skjermer: number;
    migreres: number;
    unntatt: number;
    umigrerteIFase3: number;
    eierpunkter: number;
  };
};

export declare function stripKommentarer(kilde: string): string;
export declare function lesSkjermerFraDisk(rot?: string): string[];
export declare function lesRutekilder(rot?: string): Rutekilder;
export declare function lesSkjermgraf(rot?: string, skjermer?: string[]): Map<string, string[]>;
export declare function beregnNaabarhet(rot?: string): Manifest['naa'];
export declare function lesUnntak(rot?: string): Unntaksfil;
export declare function lesVedtak(rot?: string): Map<string, Vedtak>;
export declare function samleManifest(rot?: string): Manifest;
export declare function byggManifest(rot?: string): string;
