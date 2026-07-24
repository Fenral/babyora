import { describe, expect, it } from 'vitest';
import {
  bodyRegionForCatalogGarment,
  classifyOutfitItem,
  normalizedBodyAnchorFor,
} from '../body-anchor-catalog.js';

const PROTOTYPE_PROPERTY_NAMES = [
  '__proto__',
  'constructor',
  'prototype',
] as const;

describe('semantic outfit classification', () => {
  it.each([
    ['varmepose', 'ekstra'],
    ['varmepose lett', 'ekstra'],
    ['varmepose dun', 'ekstra'],
    ['saueskinn i vogn', 'ekstra'],
    ['sovepose 1.0 TOG', 'ekstra'],
    ['sovepose 2.5 TOG', 'ekstra'],
    ['regnponcho over bæresele', 'ekstra'],
    ['ansiktskrem', 'ekstra'],
    ['regntrekk på vognen', 'utstyr'],
  ] as const)('classifies %s as anchorless equipment', (label, category) => {
    expect(classifyOutfitItem(label, category)).toMatchObject({
      kind: 'equipment',
      sourceLabel: label,
      bodyRegion: null,
      bodyAnchor: null,
    });
  });

  it.each([
    ['balaklava', 'ekstra', 'head'],
    ['halsedisse', 'ekstra', 'neck'],
    ['langermet ullbody', 'innerst', 'torso'],
    ['ull-jakke', 'mellomlag', 'torso'],
    ['votter dun', 'ekstra', 'hands'],
    ['bleie', 'innerst', 'hips'],
    ['tynn bukse', 'mellomlag', 'legs'],
    ['vintersko isolerte', 'ekstra', 'feet'],
    ['isolert vinterdress', 'yttertoy', 'whole_body'],
  ] as const)('maps %s to the %s body region', (label, category, region) => {
    const classified = classifyOutfitItem(label, category);
    expect(classified).toMatchObject({
      kind: 'garment',
      sourceLabel: label,
      bodyRegion: region,
    });
    if (classified.kind === 'garment') {
      expect(classified.bodyAnchor?.anchorVersion).toBe(1);
      expect(classified.bodyAnchor?.pose).toBe('standing');
    }
  });

  it('returns distinct, normalized, pose-specific anchors without layout geometry', () => {
    const standing = normalizedBodyAnchorFor('votter', 'standing');
    const sitting = normalizedBodyAnchorFor('votter', 'sitting');

    expect(standing).not.toEqual(sitting);
    for (const anchor of [standing, sitting]) {
      expect(anchor).not.toBeNull();
      expect(anchor?.x).toBeGreaterThanOrEqual(0);
      expect(anchor?.x).toBeLessThanOrEqual(1);
      expect(anchor?.y).toBeGreaterThanOrEqual(0);
      expect(anchor?.y).toBeLessThanOrEqual(1);
      expect(Object.isFrozen(anchor)).toBe(true);
    }
  });

  it('fails closed for unknown labels instead of guessing an anchor', () => {
    expect(classifyOutfitItem('ukjent fremtidig plagg', 'ekstra')).toEqual({
      kind: 'unknown',
      sourceLabel: 'ukjent fremtidig plagg',
      catalogGarmentId: null,
      catalogCategory: null,
      bodyRegion: 'unknown',
      bodyAnchor: null,
    });
  });

  it.each(PROTOTYPE_PROPERTY_NAMES)(
    'fails closed for prototype-named catalog and source label %s',
    (label) => {
      expect(bodyRegionForCatalogGarment(label)).toBeNull();
      expect(normalizedBodyAnchorFor(label, 'standing')).toBeNull();
      expect(classifyOutfitItem(label, 'innerst')).toEqual({
        kind: 'unknown',
        sourceLabel: label,
        catalogGarmentId: null,
        catalogCategory: null,
        bodyRegion: 'unknown',
        bodyAnchor: null,
      });
    },
  );

  it('rejects an inherited catalog hit from temporary prototype pollution', () => {
    const label = 'future prototype-polluted garment';
    Object.defineProperty(Object.prototype, label, {
      configurable: true,
      enumerable: false,
      value: 'lue',
      writable: true,
    });

    try {
      expect(bodyRegionForCatalogGarment(label)).toBeNull();
      expect(normalizedBodyAnchorFor(label, 'standing')).toBeNull();
      expect(classifyOutfitItem(label, 'innerst')).toEqual({
        kind: 'unknown',
        sourceLabel: label,
        catalogGarmentId: null,
        catalogCategory: null,
        bodyRegion: 'unknown',
        bodyAnchor: null,
      });
    } finally {
      delete (Object.prototype as Record<string, unknown>)[label];
    }
  });
});
