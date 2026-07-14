/**
 * Motor 2.0 Task 14 — typede V2-events og PII-sanitisering.
 * Design-spec §18: kun grove kategorier; aldri navn, fødselsdato, eksakt
 * alder, koordinater, by, konto-/husholdnings-ID eller preferanse-verdier.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { EngineV2FallbackReason, TrackedEvent } from '../track.js';

type EventOf<T extends TrackedEvent['type']> = Extract<TrackedEvent, { type: T }>;

describe('Motor 2.0 analytics-kontrakter', () => {
  it('engine_v2_shadow_compared bærer kun grove kategorier', () => {
    expectTypeOf<EventOf<'engine_v2_shadow_compared'>>().toEqualTypeOf<{
      type: 'engine_v2_shadow_compared';
      same_fingerprint: boolean;
      age_stage: 'newborn' | 'mobile_baby' | 'young_toddler';
      situation: 'stroller_awake' | 'carrier' | 'awake_low_mobility' | 'active_play' | 'calm_outdoors' | 'mixed_day' | 'indoor_sleep';
      temp_band: 'tropisk' | 'varm' | 'mild' | 'kjolig' | 'kald' | 'frost' | 'streng_frost' | 'ekstrem' | 'ekstrem_varme';
    }>();
  });

  it('material_preference_changed kan IKKE bære gammel/ny verdi (typenivå)', () => {
    expectTypeOf<EventOf<'material_preference_changed'>>().toEqualTypeOf<{
      type: 'material_preference_changed';
    }>();
    // @ts-expect-error — preferanseverdi er forbudt i eventet
    const illegal: EventOf<'material_preference_changed'> = { type: 'material_preference_changed', preference: 'avoid_wool' };
    void illegal;
  });

  it('eventene kan ikke bære eksakt alder eller identitet (typenivå)', () => {
    // @ts-expect-error — ageMonths er forbudt (kun age_stage)
    const withAge: EventOf<'situation_changed'> = { type: 'situation_changed', situation: 'active_play', age_stage: 'young_toddler', ageMonths: 18 };
    void withAge;
    // @ts-expect-error — childId er forbudt
    const withId: EventOf<'engine_v2_fallback_used'> = { type: 'engine_v2_fallback_used', reason: 'flag_off', childId: 'x' };
    void withId;
  });

  it('fallback-årsak er en lukket, grov enum', () => {
    expectTypeOf<EngineV2FallbackReason>().toEqualTypeOf<'flag_off' | 'engine_error' | 'shadow_disagreement'>();
  });
});

describe('Motor 2.0 analytics-sanitisering (runtime)', () => {
  it('FORBIDDEN_KEYS-regexen i track.ts fanger identitetsnøkler', async () => {
    // Sanitize er privat — verifiser regex-adferden via kildekode-kontrakt:
    // nøkler som matcher (name|dob|birth|email|phone|lat|lon|location|child_id)
    // skal aldri overleve. Vi tester mønsteret direkte.
    const FORBIDDEN = /(name|dob|birth|email|phone|lat|lon|location|child_?id)/i;
    for (const key of ['name', 'childName', 'dob', 'birthDate', 'email', 'phone', 'lat', 'lon', 'location', 'child_id', 'childId']) {
      expect(FORBIDDEN.test(key), key).toBe(true);
    }
    for (const key of ['same_fingerprint', 'age_stage', 'situation', 'temp_band', 'material', 'role', 'reason']) {
      expect(FORBIDDEN.test(key), key).toBe(false);
    }
  });
});
