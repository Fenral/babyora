/** Privacy boundary for the minimal PostHog validation funnel. */
import {
  PAYWALL_TRIGGERS,
  type PaywallTrigger,
  type PlanKey,
} from '../premium/products';

export type AnalyticsLocale = 'nb-NO' | 'sv-SE' | 'da-DK' | 'other';
export type AnalyticsCountry = 'NO' | 'SE' | 'DK' | 'other';
export type RecommendationFailureReason = 'weather' | 'location' | 'engine' | 'unknown';
export type PurchaseAnalyticsStatus =
  | 'success' | 'cancelled' | 'pending' | 'unavailable' | 'entitlement_missing' | 'error';

export type TrackedEvent =
  | { type: 'app_opened'; source: 'direct' | 'push' | 'widget' | 'deeplink' }
  | { type: 'onboarding_started'; locale: AnalyticsLocale; country: AnalyticsCountry }
  | { type: 'onboarding_completed'; locale: AnalyticsLocale; country: AnalyticsCountry }
  | { type: 'recommendation_requested' }
  | { type: 'recommendation_rendered' }
  | { type: 'recommendation_failed'; reason: RecommendationFailureReason }
  | { type: 'paywall_viewed'; trigger: PaywallTrigger | 'generic' }
  | { type: 'plan_selected'; plan: PlanKey }
  | { type: 'purchase_result'; plan: PlanKey; status: PurchaseAnalyticsStatus }
  | { type: 'restore_result'; status: 'restored' | 'nothing_to_restore' | 'unavailable' }
  | { type: 'trial_result'; plan: PlanKey; status: 'started' | 'converted' | 'expired' };

export interface PostHogClient {
  init(key: string, opts: Record<string, unknown>): void;
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string): void;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
  reset(): void;
}

type AnalyticsStorage = Pick<Storage, 'setItem' | 'removeItem'>;
type PreparedCapture = Readonly<{ event: TrackedEvent['type']; properties: Record<string, unknown> }>;

const OPT_OUT_KEY = 'babyora:analytics:opt_out';
const DISTINCT_ID_KEY = 'babyora:analytics:distinct_id';
const APP_SOURCES = new Set(['direct', 'push', 'widget', 'deeplink']);
const PLAN_KEYS = new Set<PlanKey>(['yearly', 'monthly']);
const PAYWALL_TRIGGER_KEYS = new Set<string>([
  'generic', ...Object.keys(PAYWALL_TRIGGERS),
]);
const LOCALES = new Set<AnalyticsLocale>(['nb-NO', 'sv-SE', 'da-DK', 'other']);
const COUNTRIES = new Set<AnalyticsCountry>(['NO', 'SE', 'DK', 'other']);
const FAILURE_REASONS = new Set<RecommendationFailureReason>([
  'weather', 'location', 'engine', 'unknown',
]);
const PURCHASE_STATUSES = new Set<PurchaseAnalyticsStatus>([
  'success', 'cancelled', 'pending', 'unavailable', 'entitlement_missing', 'error',
]);
const RESTORE_STATUSES = new Set(['restored', 'nothing_to_restore', 'unavailable']);
const TRIAL_STATUSES = new Set(['started', 'converted', 'expired']);

let client: PostHogClient | null = null;
let initialized = false;
let optedOutInMemory = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function isAllowedString(value: unknown, allowed: ReadonlySet<string>): value is string {
  return typeof value === 'string' && allowed.has(value);
}

/** Runtime allowlist. Unknown events, keys, values, arrays, and objects fail closed. */
export function prepareCapture(value: unknown): PreparedCapture | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  switch (value.type) {
    case 'app_opened':
      if (!hasExactKeys(value, ['type', 'source'])
        || !isAllowedString(value.source, APP_SOURCES)) return null;
      return { event: value.type, properties: { source: value.source } };
    case 'onboarding_started':
    case 'onboarding_completed':
      if (!hasExactKeys(value, ['type', 'locale', 'country'])
        || !isAllowedString(value.locale, LOCALES)
        || !isAllowedString(value.country, COUNTRIES)) return null;
      return { event: value.type, properties: { locale: value.locale, country: value.country } };
    case 'recommendation_requested':
    case 'recommendation_rendered':
      return hasExactKeys(value, ['type']) ? { event: value.type, properties: {} } : null;
    case 'recommendation_failed':
      if (!hasExactKeys(value, ['type', 'reason'])
        || !isAllowedString(value.reason, FAILURE_REASONS)) return null;
      return { event: value.type, properties: { reason: value.reason } };
    case 'paywall_viewed':
      if (!hasExactKeys(value, ['type', 'trigger'])
        || !isAllowedString(value.trigger, PAYWALL_TRIGGER_KEYS)) return null;
      return { event: value.type, properties: { trigger: value.trigger } };
    case 'plan_selected':
      if (!hasExactKeys(value, ['type', 'plan']) || !isAllowedString(value.plan, PLAN_KEYS)) return null;
      return { event: value.type, properties: { plan: value.plan } };
    case 'purchase_result':
      if (!hasExactKeys(value, ['type', 'plan', 'status'])
        || !isAllowedString(value.plan, PLAN_KEYS)
        || !isAllowedString(value.status, PURCHASE_STATUSES)) return null;
      return { event: value.type, properties: { plan: value.plan, status: value.status } };
    case 'restore_result':
      if (!hasExactKeys(value, ['type', 'status']) || !isAllowedString(value.status, RESTORE_STATUSES)) return null;
      return { event: value.type, properties: { status: value.status } };
    case 'trial_result':
      if (!hasExactKeys(value, ['type', 'plan', 'status'])
        || !isAllowedString(value.plan, PLAN_KEYS)
        || !isAllowedString(value.status, TRIAL_STATUSES)) return null;
      return { event: value.type, properties: { plan: value.plan, status: value.status } };
    default:
      return null;
  }
}

export function dispatchAnalyticsEvent(
  target: Pick<PostHogClient, 'capture'>,
  optedOut: boolean,
  event: unknown,
): boolean {
  if (optedOut) return false;
  const prepared = prepareCapture(event);
  if (!prepared) return false;
  target.capture(prepared.event, prepared.properties);
  return true;
}

/** Applies consent to both local state and the SDK without ever throwing. */
export function applyAnalyticsOptOut(
  storage: AnalyticsStorage,
  target: Pick<PostHogClient, 'opt_out_capturing' | 'opt_in_capturing' | 'reset'> | null,
  optedOut: boolean,
): void {
  try {
    if (optedOut) {
      storage.setItem(OPT_OUT_KEY, '1');
      storage.removeItem(DISTINCT_ID_KEY);
    } else {
      storage.removeItem(OPT_OUT_KEY);
    }
  } catch {
    // The in-memory boundary below still prevents capture in this session.
  }
  if (optedOut) {
    target?.opt_out_capturing();
    target?.reset();
  } else {
    target?.opt_in_capturing();
  }
}

export function isOptedOut(): boolean {
  if (optedOutInMemory) return true;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return optedOutInMemory;
  }
}

export function setOptOut(optedOut: boolean): void {
  optedOutInMemory = optedOut;
  applyAnalyticsOptOut(localStorage, client, optedOut);
  if (!optedOut && !client) void initAnalytics();
}

function ensureDistinctId(): string {
  try {
    let id = localStorage.getItem(DISTINCT_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DISTINCT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon-fallback';
  }
}

export async function initAnalytics(): Promise<void> {
  if (initialized || isOptedOut()) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.posthog.com';
  if (!key) return;
  initialized = true;
  try {
    const mod = await import('posthog-js');
    if (isOptedOut()) {
      initialized = false;
      return;
    }
    client = mod.default as unknown as PostHogClient;
    client.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: 'never',
      persistence: 'localStorage',
    });
    client.identify(ensureDistinctId());
  } catch {
    client = null;
    initialized = false;
  }
}

export function track(event: TrackedEvent): void {
  if (!client) return;
  dispatchAnalyticsEvent(client, isOptedOut(), event);
}
