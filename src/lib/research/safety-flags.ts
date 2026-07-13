/**
 * Strukturert sikkerhets-warning-katalog. Hver flag har konkret trigger-
 * conditional + warning-tegn + kilde-referanser.
 *
 * Wool-layers regelmotor bruker FLAG_IDs i sine modifiers for å koble
 * generert note til riktig forsknings-grunnlag.
 */

export type SafetyCategory =
  | 'overheating'
  | 'hypothermia'
  | 'babywearing-heat'
  | 'newborn-cold';

export type SafetyFlag = {
  /** Stabilt id, brukes i wool-layers modifiers for å koble note → kilde */
  id: string;
  category: SafetyCategory;
  /** Alders-grense for hvor regelen gjelder */
  ageRange: { minMonths: number; maxMonths: number };
  /** Trigger som NL — for UI/debugging, ikke executable */
  triggerCondition: string;
  /** Warning-tegn parents skal følge med på (NO) */
  warningSigns: string[];
  /** Warning-tegn (EN) */
  warningSignsEn: string[];
  /** Hva foreldre skal gjøre — kort handlings-anbefaling (NO) */
  recommendedAction: string;
  /** Kort handlings-anbefaling (EN) */
  recommendedActionEn: string;
  /** Hvilke kilder denne flaggen bygger på */
  sourceIds: string[];
};

export const SAFETY_FLAGS: SafetyFlag[] = [
  {
    id: 'peak-overheating-7-9mo',
    category: 'overheating',
    ageRange: { minMonths: 7, maxMonths: 10 },
    triggerCondition: 'tempC >= 22 && ageMonths 7-9',
    warningSigns: ['sveiter', 'rødt eller fuktet hud', 'rask pust', 'høy puls', 'fuktig hår'],
    warningSignsEn: ['sweating', 'flushed or damp skin', 'rapid breathing', 'high pulse', 'damp hair'],
    recommendedAction: 'Bruk færre lag enn vanlig. Barn i denne alderen produserer mest kroppsvarme.',
    recommendedActionEn: 'Use fewer layers than usual. Babies this age produce the most body heat.',
    sourceIds: ['pmc-12386404'],
  },
  {
    id: 'newborn-cold-limit',
    category: 'newborn-cold',
    ageRange: { minMonths: 0, maxMonths: 3 },
    triggerCondition: 'tempC < 0 && ageMonths < 3',
    warningSigns: ['kalde hender og føtter', 'fussiness', 'sløv', 'blek hud'],
    warningSignsEn: ['cold hands and feet', 'fussiness', 'lethargic', 'pale skin'],
    recommendedAction: 'Spedbarn under 3 mnd: maks 30 min ute i kuldegrader. Sjekk nakke og rygg ofte.',
    recommendedActionEn: 'Babies under 3 months: max 30 min outside in freezing temps. Check neck and back often.',
    sourceIds: ['aap-healthychildren', 'capital-area-peds'],
  },
  {
    id: 'babywearing-hot-weather',
    category: 'babywearing-heat',
    ageRange: { minMonths: 0, maxMonths: 24 },
    triggerCondition: 'tempC >= 25 && activity == "baeresele"',
    warningSigns: ['sveiter', 'rødt ansikt', 'klissete hud mot bæreren'],
    warningSignsEn: ['sweating', 'flushed face', 'sticky skin against carrier'],
    recommendedAction:
      'Bæresele begrenser varmetap. Bruk lette lag, hold økten kort, finn skygge ofte.',
    recommendedActionEn:
      'Carrier limits heat loss. Use light layers, keep sessions short, find shade often.',
    sourceIds: ['pmc-7202982', 'pmc-12386404'],
  },
  {
    id: 'overheating-general',
    category: 'overheating',
    ageRange: { minMonths: 0, maxMonths: 24 },
    triggerCondition: 'tempC >= 26 || (sleep && tempC >= 24)',
    warningSigns: ['sveiter', 'rødt eller fuktet hud', 'rask pust', 'fuktig hår'],
    warningSignsEn: ['sweating', 'flushed or damp skin', 'rapid breathing', 'damp hair'],
    recommendedAction:
      'Overoppheting er en SIDS-risikofaktor. Reduser lag, finn kjøligere rom (20–22°C anbefalt for soverom).',
    recommendedActionEn:
      'Overheating is a SIDS risk factor. Reduce layers, find cooler room (20–22°C recommended for sleep).',
    sourceIds: ['aap-healthychildren', 'halo-tog'],
  },
  {
    id: 'hypothermia-cold-stress',
    category: 'hypothermia',
    ageRange: { minMonths: 0, maxMonths: 6 },
    triggerCondition: 'tempC < 5 && ageMonths < 6',
    warningSigns: [
      'kald hud (særlig bryst/rygg)',
      'fussiness eller sløv',
      'blek eller blålig hud',
      'svak gråt',
    ],
    warningSignsEn: [
      'cold skin (especially chest/back)',
      'fussiness or lethargy',
      'pale or bluish skin',
      'weak cry',
    ],
    recommendedAction:
      'Spedbarn shiverer ikke effektivt. Sjekk hud-temperatur, gå inn og varm opp gradvis.',
    recommendedActionEn:
      'Babies do not shiver effectively. Check skin temperature, go inside and warm up gradually.',
    sourceIds: ['aap-healthychildren', 'pmc-12386404'],
  },
];

/** Slå opp safety-flag via id. */
export function getSafetyFlag(id: string): SafetyFlag | undefined {
  return SAFETY_FLAGS.find((f) => f.id === id);
}

/** Filter safety-flags etter kategori. */
export function flagsByCategory(category: SafetyCategory): SafetyFlag[] {
  return SAFETY_FLAGS.filter((f) => f.category === category);
}

/** Filter safety-flags som gjelder for gitt alder. */
export function flagsForAge(ageMonths: number): SafetyFlag[] {
  return SAFETY_FLAGS.filter(
    (f) => ageMonths >= f.ageRange.minMonths && ageMonths < f.ageRange.maxMonths,
  );
}
