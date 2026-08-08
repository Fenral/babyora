import { describe, expect, it } from 'vitest';

import {
  getSettingsCopy,
  materialPreferenceLabel,
} from '../settings-copy';

describe('Settings secondary copy', () => {
  it.each([
    ['en', 'Help and guidance', 'Cotton first'],
    ['sv', 'Hjälp och vägledning', 'Bomull först'],
    ['da', 'Hjælp og vejledning', 'Bomuld først'],
    ['no', 'Hjelp og veiledning', 'Bomull først'],
  ] as const)('provides complete %s copy', (language, helpTitle, cottonLabel) => {
    const copy = getSettingsCopy(language);

    expect(copy.help.title).toBe(helpTitle);
    expect(copy.materialPreference.sheet.options.prefer_cotton.label).toBe(cottonLabel);
    expect(copy.actions.childAdded('Mina')).toContain('Mina');
    expect(copy.privacy.summary).toHaveLength(3);
    expect(copy.deleteData.items).toHaveLength(4);
  });

  it('normalizes regional Scandinavian locale tags', () => {
    expect(getSettingsCopy('nb-NO').help.title).toBe('Hjelp og veiledning');
    expect(getSettingsCopy('sv-SE').help.title).toBe('Hjälp och vägledning');
    expect(getSettingsCopy('da_DK').help.title).toBe('Hjælp og vejledning');
  });

  it.each(['de', 'de-DE', 'fr', '', undefined, null])(
    'falls back to English for %s',
    (language) => {
      const copy = getSettingsCopy(language);
      expect(copy.help.title).toBe('Help and guidance');
      expect(copy.rateApp.confirm).toBe('Leave a review');
    },
  );

  it('keeps legacy avoid_wool readable as fleece-first', () => {
    const copy = getSettingsCopy('en');
    expect(materialPreferenceLabel('avoid_wool', copy.materialPreference.sheet)).toBe('Fleece first');
  });
});
