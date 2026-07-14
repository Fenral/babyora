/**
 * P9.4 (2026-06-13): Analytics-wrapper rundt PostHog.
 *
 * Eneste lovlige event-overflate. Rå posthog.capture() er forbudt
 * utenfor denne filen — håndheves av eslint-rule (legges til når
 * eslint-config er aktiv).
 *
 * No-op hvis VITE_POSTHOG_KEY ikke er satt — trygt for web-preview og
 * dev-bygg uten PostHog-konto.
 *
 * Personvern: alle events strippes for PII før send. Aldri navn, dob,
 * lat/lon, child-id i properties.
 */

import type { Activity, TempBand } from '../wool-layers/types.js';
import type { AgeStage, GarmentRole, MaterialFamily, Situation } from '../clothing-engine-v2/types.js';

/** Motor 2.0 Task 14: grov årsakskode for fallback — aldri feilmeldingstekst. */
export type EngineV2FallbackReason = 'flag_off' | 'engine_error' | 'shadow_disagreement';

export type TrackedEvent =
  | { type: 'app_opened'; source: 'direct' | 'push' | 'widget' | 'deeplink' }
  | { type: 'onboarding_step'; step: 1 | 2 | 3; completed: boolean }
  | { type: 'rec_shown'; activity: Activity; layer_count: number; has_topptiltaa: boolean; has_utstyr: boolean }
  | { type: 'garment_opened'; source: 'rec' | 'library' }
  | { type: 'guide_opened'; section: string }
  | { type: 'feedback_given'; value: 'kald' | 'passe' | 'varm' }
  | { type: 'notification_optin'; enabled: boolean }
  | { type: 'paywall_viewed'; trigger: string }
  | { type: 'paywall_converted'; plan: string }
  | { type: 'widget_bridge_updated' }
  | { type: 'garment_ownership_toggled'; owned: boolean; premium_required: boolean }
  // P10 (2026-06-13): Premium lifecycle-events per Premium-plan §8.
  | { type: 'trial_started'; plan: string }
  | { type: 'trial_converted'; plan: string }
  | { type: 'trial_expired' }
  | { type: 'winback_shown'; offer: string }
  | { type: 'winback_converted'; plan: string }
  // Motor 2.0 Task 14 (design-spec §18): kun grove kategorier — aldri eksakt
  // alder, aldri preferanse-VERDI (gammel eller ny), aldri identitet.
  | { type: 'engine_v2_shadow_compared'; same_fingerprint: boolean; age_stage: AgeStage; situation: Situation; temp_band: TempBand }
  | { type: 'material_preference_changed' }
  | { type: 'material_alternative_opened'; material: MaterialFamily; role: GarmentRole }
  | { type: 'situation_changed'; situation: Situation; age_stage: AgeStage }
  | { type: 'engine_v2_fallback_used'; reason: EngineV2FallbackReason };

const FORBIDDEN_KEYS = /(name|dob|birth|email|phone|lat|lon|location|child_?id)/i;
const OPT_OUT_KEY = 'babyora:analytics:opt_out';
const DISTINCT_ID_KEY = 'babyora:analytics:distinct_id';

interface PostHogClient {
  init(key: string, opts: Record<string, unknown>): void;
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string): void;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
  reset(): void;
}

let client: PostHogClient | null = null;
let initialized = false;

export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOptOut(optedOut: boolean): void {
  try {
    if (optedOut) {
      localStorage.setItem(OPT_OUT_KEY, '1');
      client?.opt_out_capturing();
      client?.reset();
    } else {
      localStorage.removeItem(OPT_OUT_KEY);
      client?.opt_in_capturing();
    }
  } catch {
    // ignore — opt-out er allerede default sikker hvis localStorage feiler
  }
}

function ensureDistinctId(): string {
  try {
    let id = localStorage.getItem(DISTINCT_ID_KEY);
    if (!id) {
      // crypto.randomUUID finnes i moderne nettlesere + Capacitor WebView
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
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
  if (initialized) return;
  initialized = true;
  if (isOptedOut()) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.posthog.com';
  if (!key) return; // No-op uten nøkkel — silent OK
  try {
    const mod = await import('posthog-js');
    client = mod.default as unknown as PostHogClient;
    client.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      session_recording: { recordCrossOriginIframes: false },
      persistence: 'localStorage',
      disable_session_recording: true,
    });
    client.identify(ensureDistinctId());
  } catch {
    // posthog-js ikke installert (web-build uten dep) — silent no-op
    client = null;
  }
}

function sanitize(props: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.test(k)) continue;
    if (typeof v === 'string' && FORBIDDEN_KEYS.test(v)) continue;
    safe[k] = v;
  }
  return safe;
}

export function track(event: TrackedEvent): void {
  if (isOptedOut() || !client) return;
  const { type, ...rest } = event;
  client.capture(type, sanitize(rest as Record<string, unknown>));
}
