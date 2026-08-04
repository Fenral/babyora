/**
 * Typene til `spacing-detektor.mjs`, slik porten kan importere den.
 *
 * Detektoren er med vilje ren JS: den skal kunne kjøres med `node` uten
 * byggesteg, både i CI og fra kommandolinjen når noen vil se hvor et tall
 * kommer fra. Da må typene bo i en egen fil.
 */

/** Én målt verdi, stedfestet. */
export interface SpacingFunn {
  /** Verdien i piksler. Negativ = optisk nudge, ikke en avstand. */
  px: number;
  /** Sant hvis tallet sto inne i et calc()-uttrykk. */
  iCalc: boolean;
  /** CSS-egenskapen, alltid kebab-case — også når kilden var camelCase JSX. */
  egenskap: string;
  /** avstand | storrelse | kant. Holdes fra hverandre: en høyde er ikke en avstand. */
  klasse: 'avstand' | 'storrelse' | 'kant';
  /** css | tsx-style | jsx-streng | jsx-unitless */
  kilde: 'css' | 'tsx-style' | 'jsx-streng' | 'jsx-unitless';
  /** Repo-relativ sti med skråstrek. */
  fil: string;
  linje: number;
}

export interface SpacingKlasse {
  total: number;
  verdier: Map<number, number>;
  egenskaper: Map<string, number>;
}

export declare const funn: SpacingFunn[];
export declare const perKlasse: Record<string, SpacingKlasse>;
