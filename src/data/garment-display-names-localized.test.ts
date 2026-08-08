import { afterEach, describe, expect, it, vi } from 'vitest';
import CANONICAL_NAMES from './garment-display-names.json';
import { displayNameForDbString, garmentDisplayName } from './garment-display-names';
import { LOCALIZED_GARMENT_NAMES, localizedGarmentName } from './garment-display-names-localized';

describe('localized garment names', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('covers every canonical garment in English, Swedish and Danish', () => {
    for (const id of Object.keys(CANONICAL_NAMES)) {
      expect(LOCALIZED_GARMENT_NAMES[id], id).toBeDefined();
      expect(LOCALIZED_GARMENT_NAMES[id]?.en.length, `${id}:en`).toBeGreaterThan(1);
      expect(LOCALIZED_GARMENT_NAMES[id]?.sv.length, `${id}:sv`).toBeGreaterThan(1);
      expect(LOCALIZED_GARMENT_NAMES[id]?.da.length, `${id}:da`).toBeGreaterThan(1);
    }
  });

  it('uses localized names without changing the Norwegian default', () => {
    expect(garmentDisplayName('ull-jakke')).toBe('Ull-jakke');
    expect(garmentDisplayName('ull-jakke', 'en-US')).toBe('Wool jacket');
    expect(garmentDisplayName('ull-jakke', 'sv-SE')).toBe('Ulljacka');
    expect(garmentDisplayName('ull-jakke', 'da-DK')).toBe('Uldjakke');
  });

  it('localizes canonical and alternative engine strings', () => {
    expect(displayNameForDbString('ull-jakke', 'en')).toBe('Wool jacket');
    expect(displayNameForDbString('fleecejakke', 'sv')).toBe('Fleecejacka');
    expect(displayNameForDbString('tykke ullsokker', 'da')).toBe('Uldsokker');
  });

  it('uses the synchronized HTML language for existing UI call sites', () => {
    vi.stubGlobal('document', { documentElement: { lang: 'sv-SE' } });
    expect(garmentDisplayName('ull-jakke')).toBe('Ulljacka');
    expect(displayNameForDbString('fleecejakke')).toBe('Fleecejacka');
  });

  it('returns null for unsupported languages or unknown ids', () => {
    expect(localizedGarmentName('ull-jakke', 'fr-FR')).toBeNull();
    expect(localizedGarmentName('ukjent', 'en')).toBeNull();
  });
});
