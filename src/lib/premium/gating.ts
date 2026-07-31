/**
 * Pure runtime access and compatibility predicates.
 *
 * Policy and implementation availability are intentionally separate. A paid
 * entitlement is necessary for Plus capabilities, but it is never sufficient
 * when the corresponding runtime implementation is absent or disabled.
 */
import {
  decideAccess,
  type AccessContext,
  type AccessDecision,
  type Capability,
} from '../access/capabilities';
import { PLUS_FEATURE_AVAILABILITY } from './plus-features';

export type RuntimeCapabilityState = 'allowed' | 'denied' | 'neutral';

export type RuntimeCapabilityAccess = Readonly<{
  capability: Capability;
  state: RuntimeCapabilityState;
  allowed: boolean;
  implementationAvailable: boolean;
  decision: AccessDecision;
}>;

export type RuntimeCapabilityAvailability =
  Readonly<Partial<Record<Capability, boolean>>>;

/**
 * Authoritative runtime seam. Loading is neutral and never creates a paywall
 * trigger; every other capability requires both policy access and an explicit
 * true implementation flag.
 */
export function resolveRuntimeCapabilityAccess(
  capability: Capability,
  context: AccessContext,
  availability: RuntimeCapabilityAvailability,
): RuntimeCapabilityAccess {
  const decision = decideAccess(capability, context);
  const implementationAvailable = availability[capability] === true;
  if (decision.reason === 'loading') {
    return {
      capability,
      state: 'neutral',
      allowed: false,
      implementationAvailable,
      decision,
    };
  }
  const allowed = decision.allowed && implementationAvailable;
  return {
    capability,
    state: allowed ? 'allowed' : 'denied',
    allowed,
    implementationAvailable,
    decision,
  };
}

export type PlanningView = 'today' | 'week' | 'soon';
/**
 * Hard paywall (PRODUCT.md, 2026-07-31): det finnes ingen delvis/teaser-
 * presentasjon lenger. En planvisning er enten fullt tilgjengelig, skjult
 * (implementasjon mangler ELLER tilgang er avslått), eller nøytral mens
 * entitlement-status fortsatt laster.
 */
export type PlanningViewPresentation = 'neutral' | 'full' | 'hidden';

export type PlanningViewAccess = Readonly<{
  view: PlanningView;
  capability: 'today_home' | 'future_plan' | 'soon_preparation';
  presentation: PlanningViewPresentation;
  access: RuntimeCapabilityAccess;
}>;

const PLANNING_VIEW_CAPABILITY = {
  today: 'today_home',
  week: 'future_plan',
  soon: 'soon_preparation',
} as const satisfies Readonly<Record<PlanningView, Capability>>;

export function resolvePlanningViewAccess(
  view: PlanningView,
  context: AccessContext,
  availability: RuntimeCapabilityAvailability = PLUS_FEATURE_AVAILABILITY,
): PlanningViewAccess {
  const capability = PLANNING_VIEW_CAPABILITY[view];
  const access = resolveRuntimeCapabilityAccess(capability, context, availability);
  let presentation: PlanningViewPresentation;
  if (!access.implementationAvailable) {
    presentation = 'hidden';
  } else if (access.state === 'neutral') {
    presentation = 'neutral';
  } else if (access.allowed) {
    presentation = 'full';
  } else {
    presentation = 'hidden';
  }
  return { view, capability, presentation, access };
}

/**
 * Barn nr. 1 er gratis. Et aktivt barn låses aldri ut ved nedgradering.
 */
export function isChildSwitchGated(
  index: number,
  isActive: boolean,
  isPremium: boolean,
): boolean {
  if (isPremium || isActive) return false;
  return index > 0;
}
