import { describe, it, expect } from 'vitest';
import {
  GARMENTS_BY_CATEGORY,
  CATEGORY_ORDER,
  categoryFor,
} from './garment-category';
import { infoFor } from './garment-info';
import { garmentIdFor, garmentPng } from './garment-illustrations';
import { ITEM_ALTERNATIVES } from '../lib/wool-layers/alternatives';

describe('garment-category', () => {
  it('har info-tekst (what/when) for hvert plagg i biblioteket', () => {
    for (const cat of CATEGORY_ORDER) {
      for (const id of GARMENTS_BY_CATEGORY[cat]) {
        const info = infoFor(id);
        expect(info, `mangler info for ${id}`).not.toBeNull();
        expect(info?.what.length ?? 0).toBeGreaterThan(0);
        expect(info?.when.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('categoryFor returnerer riktig kategori for hvert listet plagg', () => {
    for (const cat of CATEGORY_ORDER) {
      for (const id of GARMENTS_BY_CATEGORY[cat]) {
        expect(categoryFor(id), `feil kategori for ${id}`).toBe(cat);
      }
    }
  });

  it('hvert plagg har en (plassholder-)PNG-sti', () => {
    for (const cat of CATEGORY_ORDER) {
      for (const id of GARMENTS_BY_CATEGORY[cat]) {
        expect(garmentPng(id)).toMatch(/illustrations\/garments\/.+\.webp$/);
      }
    }
  });
});

describe('alternatives-dekning', () => {
  it('hvert alternativ-navn kan slås opp til et plagg-id (bilde finnes/plassholder)', () => {
    for (const entry of ITEM_ALTERNATIVES) {
      for (const alt of entry.alternatives) {
        expect(garmentIdFor(alt.name), `alternativ uten id: ${alt.name}`).not.toBeNull();
      }
    }
  });

  it('primær og alternativ har minst én pro og én con', () => {
    for (const entry of ITEM_ALTERNATIVES) {
      expect((entry.pros?.length ?? 0) + (entry.cons?.length ?? 0)).toBeGreaterThan(0);
      for (const alt of entry.alternatives) {
        expect((alt.pros?.length ?? 0), `mangler pros: ${alt.name}`).toBeGreaterThan(0);
        expect((alt.cons?.length ?? 0), `mangler cons: ${alt.name}`).toBeGreaterThan(0);
      }
    }
  });
});
