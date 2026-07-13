/**
 * Alderssplit-modell for thermoregulation, basert på PMC12386404 + AAP +
 * industri-konsensus. 6 alderbånd fra 0-24 mnd. Babyora sin regelmotor bruker
 * kontinuerlig ageMonths som primær parameter — denne modellen er
 * UI-hjelp + dokumentasjon, ikke logikk-driver.
 *
 * Se RESEARCH.md for fullstendig kilde-grunnlag.
 */

export type AgeBand =
  | 'newborn'        // 0-3 mnd
  | 'infant-early'   // 3-6 mnd
  | 'infant-mid'     // 6-9 mnd
  | 'infant-late'    // 9-12 mnd
  | 'toddler-early'  // 12-18 mnd
  | 'toddler-late';  // 18-24 mnd

export type ThermoregulationMaturity =
  | 'umoden'        // newborn
  | 'modnes'        // 3-6 mnd
  | 'naer-voksen'   // 6-9 mnd
  | 'voksen-lik'    // 9-12 mnd
  | 'voksen';       // 12+ mnd

export type SweatCapacity =
  | 'lav'
  | 'lav-medium'
  | 'medium'
  | 'medium-hoy'
  | 'voksen-lik';

export type AgeBandData = {
  band: AgeBand;
  /** Inklusiv min-måned for båndet */
  monthsMin: number;
  /** Eksklusiv maks-måned for båndet */
  monthsMax: number;
  /** Norsk label til UI */
  label: string;
  /** Engelsk label til UI */
  labelEn: string;
  thermoregulation: ThermoregulationMaturity;
  sweatCapacity: SweatCapacity;
  /** Surface-area-to-mass ratio (cm²/kg) — fra PMC12386404 */
  surfaceAreaToMassRatio: number;
  /** True hvis dette båndet sammenfaller med peak metabolic heat production (8-9 mnd) */
  metabolicHeatProductionPeak: boolean;
  /** Antall ekstra lag vs voksen i kulde */
  antiColdLayerOffset: number;
  /** Korte retningslinjer for varmt vær */
  antiHeatGuidance: string;
  /** Hvilke kilder denne data-raden bygger på */
  sourceIds: string[];
};

export const AGE_BANDS: AgeBandData[] = [
  {
    band: 'newborn',
    monthsMin: 0,
    monthsMax: 3,
    label: 'Nyfødt (0–3 mnd)',
    labelEn: 'Newborn (0–3 months)',
    thermoregulation: 'umoden',
    sweatCapacity: 'lav',
    surfaceAreaToMassRatio: 648,
    metabolicHeatProductionPeak: false,
    antiColdLayerOffset: 2,
    antiHeatGuidance: 'Lette, åndbare lag. Maks 30 min utendørs ved varm sol. Skygge prioritert.',
    sourceIds: ['pmc-12386404', 'aap-healthychildren'],
  },
  {
    band: 'infant-early',
    monthsMin: 3,
    monthsMax: 6,
    label: 'Spedbarn (3–6 mnd)',
    labelEn: 'Early infant (3–6 months)',
    thermoregulation: 'modnes',
    sweatCapacity: 'lav-medium',
    surfaceAreaToMassRatio: 580,
    metabolicHeatProductionPeak: false,
    antiColdLayerOffset: 2,
    antiHeatGuidance: 'Lette lag, skygge prioritert, sjekk nakke ofte.',
    sourceIds: ['pmc-12386404'],
  },
  {
    band: 'infant-mid',
    monthsMin: 6,
    monthsMax: 9,
    label: 'Spedbarn (6–9 mnd)',
    labelEn: 'Mid infant (6–9 months)',
    thermoregulation: 'naer-voksen',
    sweatCapacity: 'medium',
    surfaceAreaToMassRatio: 510,
    metabolicHeatProductionPeak: true,
    antiColdLayerOffset: 1,
    antiHeatGuidance:
      'PEAK metabolic heat production ved 8–9 mnd. Vær særlig oppmerksom på overheating. Færre lag enn standard ved tempC ≥ 22°C.',
    sourceIds: ['pmc-12386404'],
  },
  {
    band: 'infant-late',
    monthsMin: 9,
    monthsMax: 12,
    label: 'Spedbarn (9–12 mnd)',
    labelEn: 'Late infant (9–12 months)',
    thermoregulation: 'voksen-lik',
    sweatCapacity: 'medium',
    surfaceAreaToMassRatio: 468,
    metabolicHeatProductionPeak: false,
    antiColdLayerOffset: 1,
    antiHeatGuidance: 'Voksen-lik tilpasning; sjekk nakke og rygg ved tvil.',
    sourceIds: ['pmc-12386404', 'slumbersac'],
  },
  {
    band: 'toddler-early',
    monthsMin: 12,
    monthsMax: 18,
    label: 'Småbarn (12–18 mnd)',
    labelEn: 'Early toddler (12–18 months)',
    thermoregulation: 'voksen',
    sweatCapacity: 'medium-hoy',
    surfaceAreaToMassRatio: 440,
    metabolicHeatProductionPeak: false,
    antiColdLayerOffset: 1,
    antiHeatGuidance: 'Voksen-tilpasning. Mer aktiv lek = mer kroppsvarme — juster lag etter aktivitet.',
    sourceIds: ['capital-area-peds'],
  },
  {
    band: 'toddler-late',
    monthsMin: 18,
    monthsMax: 24,
    label: 'Småbarn (18–24 mnd)',
    labelEn: 'Late toddler (18–24 months)',
    thermoregulation: 'voksen',
    sweatCapacity: 'voksen-lik',
    surfaceAreaToMassRatio: 420,
    metabolicHeatProductionPeak: false,
    antiColdLayerOffset: 1,
    antiHeatGuidance: 'Voksen-tilpasning. Babyora v1 stopper her — v2 dekker 24+ mnd.',
    sourceIds: ['capital-area-peds'],
  },
];

/**
 * Slå opp alderbånd fra ageMonths. Bruker kontinuerlig ageMonths som
 * primær parameter — denne returnerer KUN UI-hjelp-båndet, ikke regel-input.
 *
 * Returnerer toddler-late som fallback for ≥24 mnd (utenfor Babyora v1-scope).
 */
export function bandForAgeMonths(ageMonths: number): AgeBandData {
  for (const band of AGE_BANDS) {
    if (ageMonths >= band.monthsMin && ageMonths < band.monthsMax) {
      return band;
    }
  }
  return AGE_BANDS[AGE_BANDS.length - 1];
}
