import type { SnartPlan, SnartPlanInput } from './snart';

export type SnartHome = Readonly<{ city: string; lat: number; lon: number }>;
export type SnartExactHome = Readonly<{ homePlaceKey: string; climateProfileId: string }>;
export type SnartSessionRequest = Readonly<{
  allowed: boolean;
  generation: string;
  profileVersion: string;
  window: string;
  home: SnartHome;
  ageEligibleForWholeWindow: boolean;
}>;
export type SnartSessionDependencies<T = SnartPlan> = Readonly<{
  resolveExactHome: (home: SnartHome) => SnartExactHome | null;
  buildModel: (input: SnartPlanInput) => T;
}>;

type Projection = Readonly<{ key: string; input: SnartPlanInput }>;

export function projectSnartSession<T>(request: SnartSessionRequest, dependencies: SnartSessionDependencies<T>): Projection | null {
  if (!request.allowed) return null;
  const exactHome = dependencies.resolveExactHome(request.home);
  if (!exactHome) return null;
  const input: SnartPlanInput = {
    asOfLocalDate: request.window, timezone: 'Europe/Oslo',
    homePlaceKey: exactHome.homePlaceKey, climateProfileId: exactHome.climateProfileId,
    ageEligibleForWholeWindow: request.ageEligibleForWholeWindow,
    alreadyHaveConceptIds: new Set(),
  };
  return Object.freeze({ key: [request.generation, exactHome.homePlaceKey, request.profileVersion, request.window].join('|'), input: Object.freeze(input) });
}

export function createSnartSessionEvaluator<T = SnartPlan>(dependencies: SnartSessionDependencies<T>) {
  let boundaryKey: string | null = null;
  let marked = new Set<string>();
  let cached: T | null = null;
  let lastInput: Omit<SnartPlanInput, 'alreadyHaveConceptIds'> | null = null;
  const evaluate = (request: SnartSessionRequest): T | null => {
    const projection = projectSnartSession(request, dependencies);
    if (!projection) { boundaryKey = null; marked = new Set(); cached = null; lastInput = null; return null; }
    if (projection.key !== boundaryKey) { boundaryKey = projection.key; marked = new Set(); cached = null; }
    const { alreadyHaveConceptIds: _ignored, ...baseInput } = projection.input;
    lastInput = baseInput;
    if (cached) return cached;
    cached = dependencies.buildModel({ ...projection.input, alreadyHaveConceptIds: new Set(marked) });
    return cached;
  };
  return Object.freeze({
    evaluate,
    markAlreadyHave: (conceptId: string) => {
      marked = new Set([...marked, conceptId]);
      cached = lastInput ? dependencies.buildModel({ ...lastInput, alreadyHaveConceptIds: new Set(marked) }) : null;
    },
    alreadyHaveConceptIds: () => new Set(marked),
    teardown: () => { boundaryKey = null; marked = new Set(); cached = null; lastInput = null; },
  });
}
