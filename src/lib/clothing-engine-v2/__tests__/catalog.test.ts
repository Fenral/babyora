/**
 * Motor 2.0 Task 3 — strukturert plaggkatalog.
 * Katalogen er eksplisitt data, ikke regex-gjetting (design-spec §10).
 * Dekning styres av gullscenarioene G01–G36 (validerings-spec §7) og
 * invarianten «avoid_wool kan aldri gi wool» (§5.1) — som krever at hver
 * kulderelevant rolle har minst én ullfri variant per aldersstadium.
 *
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { GARMENT_VARIANTS } from '../catalog.js';
import { validateCatalog } from '../catalog-validation.js';
import type { AgeStage, GarmentRole } from '../types.js';

describe('Motor 2.0 plaggkatalog — integritet', () => {
  it('har unike, stabile variant-IDer', () => {
    const ids = GARMENT_VARIANTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('merker aldri en fleece-variant med en ullillustrasjon', () => {
    for (const item of GARMENT_VARIANTS.filter((i) => i.material === 'fleece')) {
      expect(item.illustrationId ?? '').not.toMatch(/ull|wool/i);
    }
  });

  it('merker aldri NOEN ikke-ull-variant med en ullillustrasjon (G34)', () => {
    for (const item of GARMENT_VARIANTS.filter((i) => i.material !== 'wool' && i.material !== 'blend')) {
      expect(item.illustrationId ?? '').not.toMatch(/ull|wool/i);
    }
  });

  it('validateCatalog finner null strukturelle feil i produksjonskatalogen', () => {
    expect(validateCatalog(GARMENT_VARIANTS)).toEqual([]);
  });

  it('validateCatalog oppdager duplikat-ID, tom label og materialløgn', () => {
    const base = GARMENT_VARIANTS[0];
    const issues = validateCatalog([
      base,
      { ...base }, // duplikat-ID
      { ...base, id: 'x-1', legacyNameNb: '' },
      { ...base, id: 'x-2', material: 'fleece', illustrationId: 'ullsett-illustrasjon' },
      { ...base, id: 'x-3', warmth: 7 as never },
      { ...base, id: 'x-4', validAgeStages: [] },
    ]);
    expect(issues.some((i) => i.includes('duplikat'))).toBe(true);
    expect(issues.some((i) => i.includes('x-1'))).toBe(true);
    expect(issues.some((i) => i.includes('x-2'))).toBe(true);
    expect(issues.some((i) => i.includes('x-3'))).toBe(true);
    expect(issues.some((i) => i.includes('x-4'))).toBe(true);
  });

  it('hver kulderelevant rolle har minst én ullfri variant per aldersstadium (avoid_wool-viabilitet)', () => {
    const roles: GarmentRole[] = ['base_fullbody', 'headwear', 'handwear', 'footwear'];
    const midRoles: GarmentRole[] = ['mid_fullbody', 'mid_top'];
    const stages: AgeStage[] = ['newborn', 'mobile_baby', 'young_toddler'];
    for (const stage of stages) {
      for (const role of roles) {
        const nonWool = GARMENT_VARIANTS.filter(
          (i) => i.role === role && i.material !== 'wool' && i.validAgeStages.includes(stage),
        );
        expect(nonWool.length, `${role} × ${stage}`).toBeGreaterThan(0);
      }
      // Mellomlag: minst én ullfri på tvers av mid-rollene
      const nonWoolMid = GARMENT_VARIANTS.filter(
        (i) => midRoles.includes(i.role) && i.material !== 'wool' && i.validAgeStages.includes(stage),
      );
      expect(nonWoolMid.length, `mid × ${stage}`).toBeGreaterThan(0);
    }
  });

  it('skall er alltid vindtette, og regnskall er vanntette', () => {
    const shells = GARMENT_VARIANTS.filter((i) => i.role.startsWith('shell_'));
    expect(shells.length).toBeGreaterThan(0);
    for (const s of shells) {
      expect(s.windproof, s.id).toBe(true);
      expect(s.material, s.id).toBe('shell');
    }
    expect(shells.some((s) => s.waterproof)).toBe(true);
  });

  it('dekker rollene gullscenarioene trenger', () => {
    const roles = new Set(GARMENT_VARIANTS.map((i) => i.role));
    for (const needed of [
      'base_fullbody', 'base_top', 'base_bottom',
      'mid_fullbody', 'mid_top',
      'shell_fullbody', 'insulated_fullbody',
      'headwear', 'handwear', 'footwear',
    ] as GarmentRole[]) {
      expect(roles.has(needed), needed).toBe(true);
    }
  });

  it('bomull har aldri høy fukthåndtering (materialsannhet)', () => {
    for (const item of GARMENT_VARIANTS.filter((i) => i.material === 'cotton')) {
      expect(item.moistureManagement, item.id).toBe('low');
    }
  });
});
