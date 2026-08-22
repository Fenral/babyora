import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  applyAnalyticsOptOut,
  dispatchAnalyticsEvent,
  prepareCapture,
  type TrackedEvent,
} from '../track.js';

type EventOf<T extends TrackedEvent['type']> = Extract<TrackedEvent, { type: T }>;

function client() {
  return {
    init: vi.fn(), capture: vi.fn(), identify: vi.fn(),
    opt_out_capturing: vi.fn(), opt_in_capturing: vi.fn(), reset: vi.fn(),
  };
}

describe('TASK-027 · lukket funnel-schema', () => {
  it('tillater bare dokumenterte eventnavn med eksakte grove properties', () => {
    expect(prepareCapture({ type: 'app_opened', source: 'direct' })).toEqual({
      event: 'app_opened', properties: { source: 'direct' },
    });
    expect(prepareCapture({ type: 'plan_selected', plan: 'yearly' })).toEqual({
      event: 'plan_selected', properties: { plan: 'yearly' },
    });
    expect(prepareCapture({
      type: 'onboarding_completed', locale: 'nb-NO', country: 'NO',
    })).toEqual({
      event: 'onboarding_completed', properties: { locale: 'nb-NO', country: 'NO' },
    });
    expect(prepareCapture({ type: 'unknown_event' })).toBeNull();
  });

  it.each([
    ['name', 'Ada'], ['dob', '2025-01-01'], ['exact_age_months', 12],
    ['city', 'Trondheim'], ['latitude', 63.4], ['longitude', 10.4],
    ['garments', ['ullbody']], ['free_text', 'barnet mitt fryser'],
    ['raw_safety_flags', ['cold_extreme']],
  ])('avviser hele eventet når forbudt felt %s injiseres', (key, value) => {
    expect(prepareCapture({ type: 'recommendation_rendered', [key]: value })).toBeNull();
  });

  it('avviser ugyldige payload-typer og fritekst i et ellers kjent felt', () => {
    expect(prepareCapture({ type: 'plan_selected', plan: 'weekly' })).toBeNull();
    expect(prepareCapture({ type: 'app_opened', source: { toString: () => 'direct' } })).toBeNull();
    expect(prepareCapture({ type: 'paywall_viewed', trigger: 'Ada fra Trondheim' })).toBeNull();
    expect(prepareCapture({ type: 'recommendation_failed', reason: { raw: 'boom' } })).toBeNull();
  });

  it('typen tillater ikke identitet eller fritekst', () => {
    expectTypeOf<EventOf<'recommendation_rendered'>>().toEqualTypeOf<{
      type: 'recommendation_rendered';
    }>();
    // @ts-expect-error exact age is forbidden
    const exactAge: EventOf<'recommendation_rendered'> = { type: 'recommendation_rendered', exact_age_months: 12 };
    // @ts-expect-error arbitrary paywall trigger is forbidden
    const freeText: EventOf<'paywall_viewed'> = { type: 'paywall_viewed', trigger: 'custom text' };
    void exactAge;
    void freeText;
  });
});

describe('TASK-027 · opt-out', () => {
  it('stopper fremtidig capture selv når klienten er initialisert', () => {
    const posthog = client();
    expect(dispatchAnalyticsEvent(posthog, true, {
      type: 'app_opened', source: 'direct',
    })).toBe(false);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('fjerner lokal analyse-ID og nullstiller SDK-identitet', () => {
    const values = new Map<string, string>([['babyora:analytics:distinct_id', 'anon-123']]);
    const storage = {
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    };
    const posthog = client();

    applyAnalyticsOptOut(storage, posthog, true);

    expect(values.get('babyora:analytics:distinct_id')).toBeUndefined();
    expect(values.get('babyora:analytics:opt_out')).toBe('1');
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.reset).toHaveBeenCalledOnce();
  });
});
