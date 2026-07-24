import { deriveSnartTargetWindowSignals, resolveSnartClimateProfile } from './snart-climate';
import { buildSnartDateWindow } from './snart-date-window';
import { evaluateSnartHeuristics, SNART_RULESET_VERSION, type SnartGroup } from './snart-heuristics-v1';
import { SNART_COPY } from './snart-copy.nb';

export type SnartPlanInput = Readonly<{ asOfLocalDate: string; timezone: 'Europe/Oslo'; homePlaceKey: string; ageEligibleForWholeWindow: boolean; climateProfileId: string; alreadyHaveConceptIds: ReadonlySet<string> }>;
type Item = Readonly<{ ruleId: string; rulesetVersion: typeof SNART_RULESET_VERSION; conceptId: string; group: SnartGroup; profileId: string; packSha256: string; signalName: string; signalValue: number; evidenceType: 'product_heuristic'; policyOwner: 'Babyora'; canMarkAlreadyHave: boolean }>;
type Source = Readonly<{ profileId: string; packSha256: string; rulesetVersion: typeof SNART_RULESET_VERSION }>;
export type SnartPlan =
  | Readonly<{ status: 'ready'; startLocalDate: string; endLocalDate: string; subtitle: string; source: Source; items: readonly Item[] }>
  | Readonly<{ status: 'empty'; startLocalDate: string; endLocalDate: string; copy: string; source: Source }>
  | Readonly<{ status: 'unavailable'; reason: string; copy: string }>;

export function buildSnartPlan(input: SnartPlanInput): SnartPlan {
  if (!input || !input.ageEligibleForWholeWindow || !(input.alreadyHaveConceptIds instanceof Set)) return { status: 'unavailable', reason: 'invalid_model_input', copy: SNART_COPY.unavailable };
  const window = buildSnartDateWindow(input.asOfLocalDate, input.timezone);
  if (window.status === 'unavailable') return { status: 'unavailable', reason: window.reason, copy: SNART_COPY.unavailable };
  const climate = resolveSnartClimateProfile(input);
  if (climate.status === 'unavailable') return { status: 'unavailable', reason: climate.reason, copy: SNART_COPY.unavailable };
  const signals = deriveSnartTargetWindowSignals(climate.profile, window.dates);
  if (signals.status === 'unavailable') return { status: 'unavailable', reason: signals.reason, copy: SNART_COPY.unavailable };
  const source = { profileId: climate.profile.profileId, packSha256: climate.packSha256, rulesetVersion: SNART_RULESET_VERSION } as const;
  const items: Item[] = evaluateSnartHeuristics(signals).filter((row) => row.group === 'not_highlighted' || !input.alreadyHaveConceptIds.has(row.conceptId)).map((row) => ({ ...row, ...source, canMarkAlreadyHave: row.group !== 'not_highlighted' }));
  return items.length ? { status: 'ready', startLocalDate: window.startLocalDate, endLocalDate: window.endLocalDate, subtitle: SNART_COPY.subtitle, source, items } : { status: 'empty', startLocalDate: window.startLocalDate, endLocalDate: window.endLocalDate, copy: SNART_COPY.empty, source };
}
