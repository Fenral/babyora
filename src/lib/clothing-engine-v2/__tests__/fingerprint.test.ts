/**
 * Motor 2.0 Task 9 — forklaringer, fingerprint og personvern.
 * Fingerprint = kun semantiske motorfelt; aldri navn/fødselsdato/koordinater/
 * konto (spec §12, invariant 6–7). Forklaringer = stabile koder, oversettelse
 * skjer i presentasjonslaget. FORVENTET RED: modulene finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { fingerprintV2, type FingerprintInputV2 } from '../fingerprint.js';
import { buildExplanations, explanationI18nKey } from '../explanations.js';
import noLocale from '../../../i18n/locales/no.json';
import enLocale from '../../../i18n/locales/en.json';
import svLocale from '../../../i18n/locales/sv.json';
import daLocale from '../../../i18n/locales/da.json';
import deLocale from '../../../i18n/locales/de.json';
import type { ExplanationCode } from '../types.js';

const ALL_CODES: ExplanationCode[] = [
  'ACTIVE_CHILD_LESS_INSULATION', 'RESTING_CHILD_MORE_INSULATION',
  'RAIN_REQUIRES_SHELL', 'WIND_REQUIRES_SHELL',
  'WOOL_PREFERENCE_APPLIED', 'WOOL_AVOIDED',
  'FLEECE_FAST_DRYING', 'WICKING_SYNTHETIC_FOR_ACTIVITY',
  'COTTON_ONLY_WARM_DRY', 'AGE_APPROPRIATE_GARMENT_FORM',
  'CALIBRATION_WARMER', 'CALIBRATION_COOLER',
];

function fpInput(partial?: Partial<FingerprintInputV2>): FingerprintInputV2 {
  return {
    ageStage: 'young_toddler',
    situation: 'stroller_awake',
    tempBand: 'frost',
    insulationWarmth: 4,
    needs: { wind: true, waterproof: false, sun: false, head: true, hand: true, foot: true },
    garmentVariantIds: ['base-fullbody-wool-2-thick', 'insulated-fullbody-syn-4'],
    equipmentIds: ['stroller_warm_pouch'],
    safetyFlagCodes: ['SB-8'],
    calibrationOffset: 0,
    ...partial,
  };
}

describe('Motor 2.0 fingerprint', () => {
  it('er deterministisk og stabil (G36)', () => {
    expect(fingerprintV2(fpInput())).toBe(fingerprintV2(fpInput()));
    expect(fingerprintV2(fpInput())).toMatch(/^v2-[0-9a-f]+$/);
  });

  it('endres når semantikken endres', () => {
    const base = fingerprintV2(fpInput());
    expect(fingerprintV2(fpInput({ tempBand: 'kald' }))).not.toBe(base);
    expect(fingerprintV2(fpInput({ garmentVariantIds: ['base-fullbody-wool-1-thin'] }))).not.toBe(base);
    expect(fingerprintV2(fpInput({ calibrationOffset: 1 }))).not.toBe(base);
  });

  it('er uavhengig av rekkefølge på plagg/utstyr/flagg', () => {
    const a = fingerprintV2(fpInput({ garmentVariantIds: ['a-1', 'b-2'], equipmentIds: ['stroller_warm_pouch', 'stroller_rain_cover'] }));
    const b = fingerprintV2(fpInput({ garmentVariantIds: ['b-2', 'a-1'], equipmentIds: ['stroller_rain_cover', 'stroller_warm_pouch'] }));
    expect(a).toBe(b);
  });

  it('input-typen har ingen felt for identitet (invariant 6/7 ved konstruksjon)', () => {
    const serialized = JSON.stringify(fpInput());
    // Nøkkel-nivå-sjekk (ikke substring — «insulationWarmth» inneholder «lat»).
    expect(serialized).not.toMatch(/"(name|childName|dob|birthDate|lat|lon|latitude|longitude|childId|accountId|householdId|email)"\s*:/i);
  });
});

describe('Motor 2.0 forklaringer', () => {
  it('bygger forklaringer fra koder uten fritekst', () => {
    const explanations = buildExplanations(['RAIN_REQUIRES_SHELL', 'WOOL_AVOIDED']);
    expect(explanations).toEqual([
      { code: 'RAIN_REQUIRES_SHELL' },
      { code: 'WOOL_AVOIDED' },
    ]);
  });

  it('dedupliserer koder og bevarer rekkefølge', () => {
    const explanations = buildExplanations(['WIND_REQUIRES_SHELL', 'WIND_REQUIRES_SHELL', 'CALIBRATION_WARMER']);
    expect(explanations.map((e) => e.code)).toEqual(['WIND_REQUIRES_SHELL', 'CALIBRATION_WARMER']);
  });

  it('alle koder har i18n-nøkkel i alle fem språkfiler', () => {
    const locales: Array<[string, Record<string, unknown>]> = [
      ['no', noLocale], ['en', enLocale], ['sv', svLocale], ['da', daLocale], ['de', deLocale],
    ];
    for (const code of ALL_CODES) {
      const key = explanationI18nKey(code);
      expect(key).toBe(`engineV2.explanations.${code}`);
      for (const [lang, locale] of locales) {
        const engineV2 = (locale as { engineV2?: { explanations?: Record<string, string> } }).engineV2;
        const text = engineV2?.explanations?.[code];
        expect(typeof text, `${lang}:${code}`).toBe('string');
        expect((text as string).length, `${lang}:${code}`).toBeGreaterThan(0);
      }
    }
  });

  it('norsk copy bruker aldri absolutte ord (spec §16)', () => {
    const no = (noLocale as { engineV2: { explanations: Record<string, string> } }).engineV2.explanations;
    for (const code of ALL_CODES) {
      expect(no[code]).not.toMatch(/perfekt|garantert|alltid trygg/i);
    }
  });
});
