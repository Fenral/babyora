import { describe, it, expect } from 'vitest';
import { DISCLAIMER_SHORT, DISCLAIMER_FULL } from '../disclaimer';
import { lintString } from '../product-copy-lint';

describe('veiledende-disclaimer', () => {
  it('begge lengder passerer produkt-copy-lint (ingen absolutte trygghetspåstander)', () => {
    for (const [name, text] of [['SHORT', DISCLAIMER_SHORT], ['FULL', DISCLAIMER_FULL]] as const) {
      expect(lintString(text), `${name}: ${JSON.stringify(lintString(text))}`).toEqual([]);
    }
  });

  it('rammer inn som veiledende, ikke garanti', () => {
    expect(DISCLAIMER_SHORT.toLowerCase()).toContain('veiledende');
    expect(DISCLAIMER_FULL.toLowerCase()).toContain('veiledende');
    // Peker eksplisitt på eget skjønn / helsepersonell (ansvar delvis hos forelder).
    expect(DISCLAIMER_FULL.toLowerCase()).toMatch(/skjønn|helsepersonell/);
  });
});
