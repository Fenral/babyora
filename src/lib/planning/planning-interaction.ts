export type PlanningInteractionCue = 'selection' | 'light';

export type PlanningInteractionDecision = Readonly<{
  nextSelectedEventId?: string | null;
  cue: PlanningInteractionCue | null;
}>;

export type PlanningInteractionRequest =
  | Readonly<{
    type: 'view-date';
    currentKey: string;
    nextKey: string;
  }>
  | Readonly<{
    type: 'rail-toggle';
    selectedEventId: string | null;
    eventId: string;
  }>;

export type RequestedPlanningView = 'snart';

export type RequestedPlanningViewState = Readonly<{
  nextToken: number;
  requestedView: Readonly<{
    view: RequestedPlanningView;
    token: number;
  }> | null;
}>;

export type RequestedPlanningViewConsumption = RequestedPlanningViewState & Readonly<{
  consumedView: RequestedPlanningView | null;
}>;

type PlanningInteractionHandlers = Readonly<{
  onSelect?: (eventId: string | null) => void;
  onCue?: (cue: PlanningInteractionCue) => void;
}>;

export function decidePlanningInteraction(
  request: PlanningInteractionRequest,
): PlanningInteractionDecision {
  if (request.type === 'view-date') {
    return { cue: request.currentKey === request.nextKey ? null : 'selection' };
  }

  const isCollapsing = request.selectedEventId === request.eventId;
  return {
    nextSelectedEventId: isCollapsing ? null : request.eventId,
    cue: isCollapsing ? null : 'light',
  };
}

export function repairPlanningSelection(
  selectedEventId: string | null,
  eventIds: readonly string[],
  preferredEventId: string | null,
): string | null {
  if (selectedEventId !== null && eventIds.includes(selectedEventId)) {
    return selectedEventId;
  }
  if (preferredEventId !== null && eventIds.includes(preferredEventId)) {
    return preferredEventId;
  }
  return eventIds[0] ?? null;
}

export function dispatchPlanningInteraction(
  decision: PlanningInteractionDecision,
  handlers: PlanningInteractionHandlers,
): void {
  if (Object.prototype.hasOwnProperty.call(decision, 'nextSelectedEventId')) {
    handlers.onSelect?.(decision.nextSelectedEventId ?? null);
  }
  if (decision.cue !== null) {
    handlers.onCue?.(decision.cue);
  }
}

export function shouldClosePlannedDrillOnAccess(
  isPlannedDrill: boolean,
  access: Readonly<{ loading: boolean; isPremium: boolean }>,
): boolean {
  return isPlannedDrill && (access.loading || !access.isPremium);
}

export function issueRequestedPlanningView(
  state: RequestedPlanningViewState,
  view: RequestedPlanningView,
): RequestedPlanningViewState {
  const token = state.nextToken + 1;
  return {
    nextToken: token,
    requestedView: { view, token },
  };
}

export function consumeRequestedPlanningView(
  state: RequestedPlanningViewState,
  token: number,
): RequestedPlanningViewConsumption {
  if (state.requestedView?.token !== token) {
    return { ...state, consumedView: null };
  }
  return {
    nextToken: state.nextToken,
    requestedView: null,
    consumedView: state.requestedView.view,
  };
}
