import { describe, expect, it } from 'vitest';
import { garmentFactFor } from './garment-facts';

describe('garmentFactFor', () => {
  it.each([
    ['ull-jakke', 'sv'],
    ['fleecejakke', 'da'],
    ['votter', 'en'],
    ['vintersko-isolerte', 'sv'],
    ['sovepose-2-5-tog', 'da'],
    ['vinterdress', 'en'],
  ])('returns localized, sourced content for %s in %s', (id, language) => {
    const fact = garmentFactFor(id, language);
    expect(fact.text.length).toBeGreaterThan(35);
    expect(fact.sourceLabel.length).toBeGreaterThan(2);
    expect(fact.sourceUrl).toMatch(/^https:\/\//);
  });

  it('supports region tags and falls back to English for unknown languages', () => {
    const fallback = garmentFactFor('ull-jakke', 'fr');
    const english = garmentFactFor('ull-jakke', 'en');
    expect(fallback).toEqual(english);
    expect(garmentFactFor('ull-jakke', 'sv-SE')).toEqual(
      garmentFactFor('ull-jakke', 'sv'),
    );
  });

  it('keeps wool and fleece facts meaningfully different', () => {
    expect(garmentFactFor('ull-jakke', 'en').text).not.toBe(
      garmentFactFor('fleecejakke', 'en').text,
    );
  });
});
