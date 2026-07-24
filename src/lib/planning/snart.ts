import { deriveSnartTargetWindowSignals, resolveSnartClimateProfile } from './snart-climate';
import { buildSnartDateWindow } from './snart-date-window';
import {
  evaluateSnartHeuristics,
  SNART_RULESET_VERSION,
  type SnartGroup,
} from './snart-heuristics-v1';
import { buildSnartTitle, SNART_COPY } from './snart-copy.nb';

const INPUT_KEYS = [
  'ageEligibleForWholeWindow',
  'alreadyHaveConceptIds',
  'asOfLocalDate',
  'climateProfileId',
  'homePlaceKey',
  'timezone',
] as const;
const CONCEPT_IDS = new Set([
  'snart.base_layer',
  'snart.mid_layer',
  'snart.insulated_outer',
  'snart.cold_headwear',
  'snart.handwear',
  'snart.weather_shell',
]);

export type SnartPlanInput = Readonly<{
  asOfLocalDate: string;
  timezone: 'Europe/Oslo';
  homePlaceKey: string;
  ageEligibleForWholeWindow: boolean;
  climateProfileId: string;
  alreadyHaveConceptIds: ReadonlySet<string>;
}>;

type Item = Readonly<{
  ruleId: keyof typeof SNART_COPY.rules;
  rulesetVersion: typeof SNART_RULESET_VERSION;
  conceptId: string;
  group: SnartGroup;
  copy: string;
  startLocalDate: string;
  endLocalDate: string;
  profileId: string;
  packSha256: string;
  signalName: string;
  signalValue: number;
  evidenceType: 'product_heuristic';
  policyOwner: 'Babyora';
  canMarkAlreadyHave: boolean;
}>;
type Source = Readonly<{
  profileId: string;
  packSha256: string;
  rulesetVersion: typeof SNART_RULESET_VERSION;
}>;
type ReadyCopy = Readonly<{
  title: string;
  subtitle: typeof SNART_COPY.subtitle;
  groups: typeof SNART_COPY.groups;
  note: typeof SNART_COPY.note;
  source: typeof SNART_COPY.source;
}>;
type EmptyCopy = Readonly<{
  title: string;
  empty: typeof SNART_COPY.empty;
  source: typeof SNART_COPY.source;
}>;

export type SnartPlan =
  | Readonly<{
      status: 'ready';
      startLocalDate: string;
      endLocalDate: string;
      copy: ReadyCopy;
      source: Source;
      items: readonly Item[];
    }>
  | Readonly<{
      status: 'empty';
      startLocalDate: string;
      endLocalDate: string;
      copy: EmptyCopy;
      source: Source;
    }>
  | Readonly<{
      status: 'unavailable';
      reason: string;
      copy: typeof SNART_COPY.unavailable;
    }>;

const deepFreeze = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const hasExactInputShape = (value: unknown): value is SnartPlanInput => {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) return false;
  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== INPUT_KEYS.length
    || keys.some((key) => typeof key !== 'string')
  ) return false;
  const sortedKeys = [...keys].sort();
  if (sortedKeys.some((key, index) => key !== INPUT_KEYS[index])) return false;
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(descriptor && 'value' in descriptor && descriptor.enumerable);
  });
};

const isExactConceptSet = (value: unknown): value is ReadonlySet<string> => {
  if (
    !(value instanceof Set)
    || Object.getPrototypeOf(value) !== Set.prototype
    || Reflect.ownKeys(value).length !== 0
  ) return false;
  return [...value].every((conceptId) => (
    typeof conceptId === 'string' && CONCEPT_IDS.has(conceptId)
  ));
};

const unavailable = (reason: string): SnartPlan => deepFreeze({
  status: 'unavailable',
  reason,
  copy: SNART_COPY.unavailable,
});

export function buildSnartPlan(input: SnartPlanInput): SnartPlan {
  if (
    !hasExactInputShape(input)
    || typeof input.asOfLocalDate !== 'string'
    || input.timezone !== 'Europe/Oslo'
    || typeof input.homePlaceKey !== 'string'
    || typeof input.climateProfileId !== 'string'
    || typeof input.ageEligibleForWholeWindow !== 'boolean'
    || !isExactConceptSet(input.alreadyHaveConceptIds)
  ) return unavailable('invalid_model_input');
  if (!input.ageEligibleForWholeWindow) return unavailable('age_ineligible');

  const alreadyHaveConceptIds = new Set(input.alreadyHaveConceptIds);
  const window = buildSnartDateWindow(input.asOfLocalDate, input.timezone);
  if (window.status === 'unavailable') return unavailable(window.reason);
  const climate = resolveSnartClimateProfile(input);
  if (climate.status === 'unavailable') return unavailable(climate.reason);
  const signals = deriveSnartTargetWindowSignals(climate.profile, window.dates);
  if (signals.status === 'unavailable') return unavailable(signals.reason);

  const source = {
    profileId: climate.profile.profileId,
    packSha256: climate.packSha256,
    rulesetVersion: SNART_RULESET_VERSION,
  } as const;
  const winners = new Map(
    evaluateSnartHeuristics(signals).map((row) => [row.conceptId, row]),
  );
  const items: Item[] = [...winners.values()]
    .filter((row) => (
      row.group === 'not_highlighted'
      || !alreadyHaveConceptIds.has(row.conceptId)
    ))
    .map((row) => ({
      ...row,
      ...source,
      startLocalDate: window.startLocalDate,
      endLocalDate: window.endLocalDate,
      canMarkAlreadyHave: row.group !== 'not_highlighted',
    }));
  const title = buildSnartTitle(window.startLocalDate, window.endLocalDate);

  if (items.length === 0) {
    return deepFreeze({
      status: 'empty',
      startLocalDate: window.startLocalDate,
      endLocalDate: window.endLocalDate,
      copy: {
        title,
        empty: SNART_COPY.empty,
        source: SNART_COPY.source,
      },
      source,
    });
  }

  return deepFreeze({
    status: 'ready',
    startLocalDate: window.startLocalDate,
    endLocalDate: window.endLocalDate,
    copy: {
      title,
      subtitle: SNART_COPY.subtitle,
      groups: SNART_COPY.groups,
      note: SNART_COPY.note,
      source: SNART_COPY.source,
    },
    source,
    items,
  });
}
