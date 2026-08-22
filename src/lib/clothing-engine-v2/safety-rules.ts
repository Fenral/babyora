/**
 * Motor 2.0 — kanonisk sikkerhetsregel- og kilderegister.
 *
 * Registeret beskriver implementert produktlogikk, ikke medisinsk fasit.
 * Eksakte temperatur-/tidsgrenser merket med POLICY er Snudly-policy og må
 * godkjennes per land før Motor 2.0 kan brukes i produksjon.
 */

import type { ReleaseCountry } from '../../config/release-gates.js';
import type {
  SafetyFlag,
  SafetySource,
  Severity,
} from '../wool-layers/safety.js';

export const SAFETY_RULESET_VERSION = 'v2.1.0' as const;

export const SAFETY_RULE_IDS = [
  'HB-9',
  'HB-1',
  'CK-9',
  'HB-V2-HEAT',
  'HB-V2-POUCH',
  'SB-7',
  'HB-V2-EXTREME-HEAT',
  'SB-8',
  'HB-V2-EXTREME-COLD',
  'HB-V2-NB-COLD',
] as const;

export type SafetyRuleId = (typeof SAFETY_RULE_IDS)[number];
export type CountryRuleReviewStatus = 'approved' | 'pending';
export type SafetySourceKind =
  | 'clinical-policy'
  | 'government-guidance'
  | 'professional-guidance'
  | 'product-policy';

export interface SafetySourceRecord {
  readonly id: SafetySource;
  readonly title: string;
  readonly publisher: string;
  readonly url: string | null;
  readonly kind: SafetySourceKind;
}

export interface SafetyRuleDefinition {
  readonly id: SafetyRuleId;
  readonly rulesetVersion: typeof SAFETY_RULESET_VERSION;
  readonly severity: Exclude<Severity, 'NONE' | 'LOW'>;
  readonly sourceIds: readonly SafetySource[];
  readonly nonOverrideable: true;
  readonly countryReview: Readonly<Record<ReleaseCountry, CountryRuleReviewStatus>>;
}

const source = (
  value: SafetySourceRecord,
): Readonly<SafetySourceRecord> => Object.freeze(value);

export const SAFETY_SOURCES: Readonly<Record<string, Readonly<SafetySourceRecord>>> = Object.freeze({
  'AAP-2022': source({
    id: 'AAP-2022',
    title: 'Sleep-Related Infant Deaths: Updated 2022 Recommendations',
    publisher: 'American Academy of Pediatrics',
    url: 'https://doi.org/10.1542/peds.2022-057990',
    kind: 'clinical-policy',
  }),
  NHS: source({
    id: 'NHS',
    title: 'Safe sleep advice for babies',
    publisher: 'National Health Service',
    url: 'https://www.nhs.uk/best-start-in-life/baby/baby-basics/newborn-and-baby-sleeping-advice-for-parents/safe-sleep-advice-for-babies/',
    kind: 'government-guidance',
  }),
  'LT-RT': source({
    id: 'LT-RT',
    title: 'Room temperature',
    publisher: 'The Lullaby Trust',
    url: 'https://www.lullabytrust.org.uk/baby-safety/safer-sleep-information/room-temperature/',
    kind: 'professional-guidance',
  }),
  'RN-AU-CARRIER': source({
    id: 'RN-AU-CARRIER',
    title: 'Slings and Baby Carriers',
    publisher: 'Red Nose Australia',
    url: 'https://rednose.org.au/safe-sleep-and-safer-pregnancy/pregnancy-to-birth/slings-and-baby-carriers/',
    kind: 'professional-guidance',
  }),
  'RN-AU-PRAM': source({
    id: 'RN-AU-PRAM',
    title: 'The Dangers of Covering Your Pram',
    publisher: 'Red Nose Australia',
    url: 'https://rednose.org.au/safe-sleep-and-safer-pregnancy/newborn-to-1-year/the-dangers-of-covering-your-pram/',
    kind: 'professional-guidance',
  }),
  'AAP-HC-HEAT': source({
    id: 'AAP-HC-HEAT',
    title: 'Extreme Heat: Tips to Keep Kids Safe When Temperatures Soar',
    publisher: 'American Academy of Pediatrics / HealthyChildren.org',
    url: 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Protecting-Children-from-Extreme-Heat-Information-for-Parents.aspx',
    kind: 'professional-guidance',
  }),
  'AAP-HC-COLD': source({
    id: 'AAP-HC-COLD',
    title: 'Cold Weather Safety for Children: Preventing Frostbite & Hypothermia',
    publisher: 'American Academy of Pediatrics / HealthyChildren.org',
    url: 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Cold-Weather-Safety.aspx',
    kind: 'professional-guidance',
  }),
  'AAP-HC-CARSEAT': source({
    id: 'AAP-HC-CARSEAT',
    title: 'Winter Car Seat Safety Tips: Keeping Kids Safe & Warm',
    publisher: 'American Academy of Pediatrics / HealthyChildren.org',
    url: 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Winter-Car-Seat-Safety-Tips.aspx',
    kind: 'professional-guidance',
  }),
  NHTSA: source({
    id: 'NHTSA',
    title: 'Winter Driving Tips — Car Seats',
    publisher: 'National Highway Traffic Safety Administration',
    url: 'https://www.nhtsa.gov/sites/nhtsa.gov/files/2021-11/Winter%20Driving%20Tips_2021-2022_111721_v2_tag.pdf',
    kind: 'government-guidance',
  }),
  POLICY: source({
    id: 'POLICY',
    title: 'Snudly Motor 2.0 temperature and exposure thresholds',
    publisher: 'Snudly',
    url: null,
    kind: 'product-policy',
  }),
}) satisfies Readonly<Partial<Record<SafetySource, Readonly<SafetySourceRecord>>>>;

const PENDING_COUNTRY_REVIEW = Object.freeze({
  NO: 'pending',
  SE: 'pending',
  DK: 'pending',
}) satisfies Readonly<Record<ReleaseCountry, CountryRuleReviewStatus>>;

function rule(
  id: SafetyRuleId,
  severity: SafetyRuleDefinition['severity'],
  sourceIds: readonly SafetySource[],
): Readonly<SafetyRuleDefinition> {
  return Object.freeze({
    id,
    rulesetVersion: SAFETY_RULESET_VERSION,
    severity,
    sourceIds: Object.freeze([...sourceIds]),
    nonOverrideable: true,
    countryReview: PENDING_COUNTRY_REVIEW,
  });
}

type SafetyRuleMap = Readonly<{
  [RuleId in SafetyRuleId]: Readonly<SafetyRuleDefinition> & { readonly id: RuleId };
}>;

export const SAFETY_RULES = Object.freeze({
  'HB-9': rule('HB-9', 'CRITICAL', ['AAP-HC-CARSEAT', 'NHTSA']),
  'HB-1': rule('HB-1', 'CRITICAL', ['AAP-2022', 'NHS', 'LT-RT']),
  'CK-9': rule('CK-9', 'HIGH', ['RN-AU-CARRIER', 'AAP-HC-HEAT', 'POLICY']),
  'HB-V2-HEAT': rule('HB-V2-HEAT', 'HIGH', ['AAP-HC-HEAT', 'POLICY']),
  'HB-V2-POUCH': rule('HB-V2-POUCH', 'MEDIUM', ['RN-AU-PRAM', 'AAP-HC-HEAT', 'POLICY']),
  'SB-7': rule('SB-7', 'HIGH', ['AAP-HC-HEAT', 'POLICY']),
  'HB-V2-EXTREME-HEAT': rule('HB-V2-EXTREME-HEAT', 'HIGH', ['AAP-HC-HEAT', 'POLICY']),
  'SB-8': rule('SB-8', 'MEDIUM', ['AAP-HC-COLD', 'POLICY']),
  'HB-V2-EXTREME-COLD': rule('HB-V2-EXTREME-COLD', 'HIGH', ['AAP-HC-COLD', 'POLICY']),
  'HB-V2-NB-COLD': rule('HB-V2-NB-COLD', 'HIGH', ['AAP-HC-COLD', 'POLICY']),
}) as SafetyRuleMap;

type SafetySourceRegistry = Readonly<Record<string, Readonly<SafetySourceRecord>>>;

export function validateSafetyRuleRegistry(
  rules: readonly SafetyRuleDefinition[],
  sources: SafetySourceRegistry,
): void {
  const seen = new Set<string>();

  for (const ruleDefinition of rules) {
    if (seen.has(ruleDefinition.id)) {
      throw new Error(`Duplicate safety rule ID: ${ruleDefinition.id}`);
    }
    seen.add(ruleDefinition.id);

    if (ruleDefinition.sourceIds.length === 0) {
      throw new Error(`${ruleDefinition.id} must have at least one source`);
    }

    for (const sourceId of ruleDefinition.sourceIds) {
      if (!sources[sourceId]) {
        throw new Error(`${ruleDefinition.id} references unknown source ${sourceId}`);
      }
    }

    if (!ruleDefinition.sourceIds.some((sourceId) => sources[sourceId]?.kind !== 'product-policy')) {
      throw new Error(`${ruleDefinition.id} cannot rely on product policy as its only source`);
    }
  }
}

export class UnreviewedSafetyRulesError extends Error {
  readonly code = 'unreviewed_country_rules' as const;
  readonly country: ReleaseCountry;
  readonly ruleIds: readonly SafetyRuleId[];

  constructor(
    country: ReleaseCountry,
    ruleIds: readonly SafetyRuleId[],
  ) {
    super(`Motor 2.0 cannot be used in ${country}; pending safety rules: ${ruleIds.join(', ')}`);
    this.name = 'UnreviewedSafetyRulesError';
    this.country = country;
    this.ruleIds = ruleIds;
  }
}

export function assertSafetyRulesApprovedForProduction(
  country: ReleaseCountry,
  ruleIds: readonly SafetyRuleId[] = SAFETY_RULE_IDS,
): void {
  validateSafetyRuleRegistry(Object.values(SAFETY_RULES), SAFETY_SOURCES);
  const pending = ruleIds.filter((ruleId) => SAFETY_RULES[ruleId].countryReview[country] !== 'approved');
  if (pending.length > 0) throw new UnreviewedSafetyRulesError(country, Object.freeze([...pending]));
}

export function buildSafetyFlag(
  ruleId: SafetyRuleId,
  message: string,
  category: SafetyFlag['category'],
): SafetyFlag {
  const definition = SAFETY_RULES[ruleId];
  return {
    code: definition.id,
    message,
    sources: [...definition.sourceIds],
    severity: definition.severity,
    category,
  };
}

validateSafetyRuleRegistry(Object.values(SAFETY_RULES), SAFETY_SOURCES);
