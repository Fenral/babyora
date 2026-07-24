import { SNART_COPY, type SnartRuleId } from './snart-copy.nb';

export const SNART_RULESET_VERSION = 'babyora-snart-heuristics@2' as const;
export type SnartGroup = 'check_first' | 'available_if_needed' | 'not_highlighted';
export type SnartHeuristicRow = Readonly<{
  ruleId: SnartRuleId;
  conceptId: string;
  group: SnartGroup;
  copy: string;
  signalName: 'targetMeanTemperatureC' | 'targetPrecipitationMm';
  signalValue: number;
  policyOwner: 'Babyora';
  evidenceType: 'product_heuristic';
}>;

const EMPTY_ROWS: readonly SnartHeuristicRow[] = Object.freeze([]);

const suffixForGroup = (group: SnartGroup): 'CHECK' | 'AVAILABLE' | 'NOT-HIGHLIGHTED' => (
  group === 'check_first'
    ? 'CHECK'
    : group === 'available_if_needed'
      ? 'AVAILABLE'
      : 'NOT-HIGHLIGHTED'
);

const temperatureWinner = (
  value: number,
  checkThrough: number,
  availableThrough: number,
  prefix: 'BASE' | 'MID' | 'OUTER' | 'HEAD' | 'HAND',
  conceptId: string,
): SnartHeuristicRow => {
  const group: SnartGroup = value <= checkThrough
    ? 'check_first'
    : value <= availableThrough
      ? 'available_if_needed'
      : 'not_highlighted';
  const ruleId = `SNART-H2-${prefix}-${suffixForGroup(group)}` as SnartRuleId;
  return Object.freeze({
    ruleId,
    conceptId,
    group,
    copy: SNART_COPY.rules[ruleId],
    signalName: 'targetMeanTemperatureC',
    signalValue: value,
    policyOwner: 'Babyora',
    evidenceType: 'product_heuristic',
  });
};

const precipitationWinner = (value: number): SnartHeuristicRow => {
  const group: SnartGroup = value >= 50
    ? 'check_first'
    : value >= 20
      ? 'available_if_needed'
      : 'not_highlighted';
  const ruleId = `SNART-H2-WET-${suffixForGroup(group)}` as SnartRuleId;
  return Object.freeze({
    ruleId,
    conceptId: 'snart.weather_shell',
    group,
    copy: SNART_COPY.rules[ruleId],
    signalName: 'targetPrecipitationMm',
    signalValue: value,
    policyOwner: 'Babyora',
    evidenceType: 'product_heuristic',
  });
};

export function evaluateSnartHeuristics({
  targetMeanTemperatureC,
  targetPrecipitationMm,
}: {
  targetMeanTemperatureC: number;
  targetPrecipitationMm: number;
}): readonly SnartHeuristicRow[] {
  if (
    !Number.isFinite(targetMeanTemperatureC)
    || !Number.isFinite(targetPrecipitationMm)
  ) return EMPTY_ROWS;

  return Object.freeze([
    temperatureWinner(targetMeanTemperatureC, 12, 16, 'BASE', 'snart.base_layer'),
    temperatureWinner(targetMeanTemperatureC, 7, 12, 'MID', 'snart.mid_layer'),
    temperatureWinner(targetMeanTemperatureC, 2, 7, 'OUTER', 'snart.insulated_outer'),
    temperatureWinner(targetMeanTemperatureC, 7, 12, 'HEAD', 'snart.cold_headwear'),
    temperatureWinner(targetMeanTemperatureC, 2, 7, 'HAND', 'snart.handwear'),
    precipitationWinner(targetPrecipitationMm),
  ]);
}
