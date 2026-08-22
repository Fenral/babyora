import { describe, expect, it } from 'vitest';
import { EngineV2Error } from './errors.js';
import { fingerprintV2 } from './fingerprint.js';
import { normalizeActivityInputV2, recommendActivityV2 } from './activity-input.js';
import type { ActivityRecommendInputV2 } from './types.js';

function input(
  activity: ActivityRecommendInputV2['activity'],
  overrides: Record<string, unknown> = {},
): ActivityRecommendInputV2 {
  return {
    weather: { tempC: 5, feelsLikeC: 3, windMs: 6, precipMmH: 1 },
    ageMonths: 10,
    activity,
    ...overrides,
  } as ActivityRecommendInputV2;
}

describe('Motor 2.0 offentlig aktivitetsinput', () => {
  it.each([
    ['vogn', {}, 'stroller_awake'],
    ['vogn', { vognMode: 'sleeping' }, 'stroller_sleeping'],
    ['baeresele', { innerJakke: true }, 'carrier'],
    ['utelek', {}, 'active_play'],
    ['soevn', {}, 'indoor_sleep'],
  ] as const)('normaliserer %s til eksplisitt intern situasjon', (activity, context, situation) => {
    expect(normalizeActivityInputV2(input(activity, context))).toMatchObject({
      activity,
      situation,
    });
  });

  it.each(['vogn', 'baeresele', 'utelek', 'soevn'] as const)(
    'produserer en komplett anbefaling for %s',
    (activity) => {
      const result = recommendActivityV2(input(activity));
      expect(result.activity).toBe(activity);
      expect(result.garments.length).toBeGreaterThan(0);
      expect(result.fingerprint).toMatch(/^v2-/u);
    },
  );

  it('bevarer vogn-underkontekst og bilstol som eksplisitte motorfelt', () => {
    expect(normalizeActivityInputV2(input('vogn', {
      vognMode: 'awake',
      context: { bilstol: true },
    }))).toMatchObject({
      activity: 'vogn',
      situation: 'stroller_awake',
      carSeat: true,
    });
    const result = recommendActivityV2(input('vogn', {
      context: { bilstol: true },
      weather: { tempC: -3, feelsLikeC: -5, windMs: 2, precipMmH: 0 },
    }));
    expect(result.equipment.map((item) => item.id)).toContain('car_seat_pouch');
    expect(result.safetyFlags.map((flag) => flag.code)).toContain('HB-9');
  });

  it('vognsøvn forblir utendørs og beholder vognens værbeskyttelse', () => {
    const result = recommendActivityV2(input('vogn', { vognMode: 'sleeping' }));
    expect(result).toMatchObject({ activity: 'vogn', situation: 'stroller_sleeping' });
    expect(result.intent.needsWindShell).toBe(true);
    expect(result.intent.needsWaterproofShell).toBe(true);
    expect(result.equipment.map((item) => item.id)).toContain('stroller_rain_cover');
  });

  it('bevarer bæresele-underkontekst bare for bæresele', () => {
    expect(normalizeActivityInputV2(input('baeresele', { innerJakke: true }))).toMatchObject({
      activity: 'baeresele',
      situation: 'carrier',
      carrierUnderParentJacket: true,
    });
  });

  it('innesøvn ignorerer vind og regn som utendørsmodifikatorer', () => {
    const storm = recommendActivityV2(input('soevn'));
    const calm = recommendActivityV2(input('soevn', {
      weather: { tempC: 5, feelsLikeC: 3, windMs: 0, precipMmH: 0 },
    }));

    expect(storm.garments).toEqual(calm.garments);
    expect(storm.equipment).toEqual([]);
    expect(storm.intent.needsWindShell).toBe(false);
    expect(storm.intent.needsWaterproofShell).toBe(false);
  });

  it.each([
    ['innerJakke uten bæresele', input('vogn', { innerJakke: true })],
    ['vognMode uten vogn', input('baeresele', { vognMode: 'sleeping' })],
    ['bilstol med bæresele', input('baeresele', { context: { bilstol: true } })],
    ['bilstol under innesøvn', input('soevn', { context: { bilstol: true } })],
    ['sovende vogn kombinert med bilstol', input('vogn', {
      vognMode: 'sleeping', context: { bilstol: true },
    })],
    ['ukjent vognkontekst', input('vogn', { context: { bilstol: false, setevarme: true } })],
    ['ukjent aktivitet', input('svomming' as never)],
  ])('avviser umulig kontekst: %s', (_label, candidate) => {
    expect(() => normalizeActivityInputV2(candidate)).toThrowError(
      expect.objectContaining<Partial<EngineV2Error>>({ code: 'invalid_activity_context' }),
    );
  });

  it('umulige feltkombinasjoner avvises også av TypeScript-kontrakten', () => {
    // @ts-expect-error — innerJakke finnes bare på bæreselevarianten.
    const strollerWithJacket: ActivityRecommendInputV2 = { ...input('vogn'), innerJakke: true };
    // @ts-expect-error — bilstol finnes bare på vognvarianten.
    const sleepInCarSeat: ActivityRecommendInputV2 = { ...input('soevn'), context: { bilstol: true } };
    void strollerWithJacket;
    void sleepInCarSeat;
  });

  it('avviser aktiv utelek før aktivitet er gyldig for alderen', () => {
    expect(() => recommendActivityV2(input('utelek', { ageMonths: 3 }))).toThrowError(
      expect.objectContaining<Partial<EngineV2Error>>({ code: 'invalid_situation_for_age' }),
    );
  });

  it('aktivitet inngår eksplisitt i fingerprint-kontrakten', () => {
    const base = {
      ageStage: 'mobile_baby' as const,
      situation: 'stroller_awake' as const,
      tempBand: 'kald' as const,
      insulationWarmth: 2 as const,
      needs: { wind: false, waterproof: false, sun: false, head: true, hand: true, foot: true },
      garmentVariantIds: ['base'],
      equipmentIds: [],
      safetyFlagCodes: [],
      calibrationOffset: 0 as const,
    };

    expect(fingerprintV2({ ...base, activity: 'vogn' }))
      .not.toBe(fingerprintV2({ ...base, activity: 'baeresele' }));
  });

  it('aktivitetsendring gir ny anbefalingsfingerprint', () => {
    const stroller = recommendActivityV2(input('vogn'));
    const carrier = recommendActivityV2(input('baeresele'));
    expect(stroller.fingerprint).not.toBe(carrier.fingerprint);
  });
});
