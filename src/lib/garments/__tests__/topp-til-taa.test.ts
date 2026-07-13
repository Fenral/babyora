import { describe, it, expect } from 'vitest';
import { ekstraIkkeToppTilTaa, slotFor, toppTilTaaItems } from '../topp-til-taa';

describe('topp-til-tå (FASE 3)', () => {
  it.each([
    ['lue', 'hode'],
    ['lue m/ ull', 'hode'],
    ['solhatt', 'hode'],
    ['balaklava', 'hode'],
    ['votter', 'hender'],
    ['votter tynne', 'hender'],
    ['hals', 'hals'],
    ['ullsokker', 'fotter'],
    ['sokker', 'fotter'],
    ['vintersko', 'fotter'],
    ['sandaler', 'fotter'],
  ] as const)('%s → %s', (item, slot) => {
    expect(slotFor(item)).toBe(slot);
  });

  it.each([
    ['varmepose'],
    ['varmepose dun'],
    ['saueskinn i vogn'],
    ['ansiktskrem'],
    ['regntrekk på vognen'],
    ['ullsett tykt'],
  ])('%s → ikke topp-til-tå', (item) => {
    expect(slotFor(item)).toBeNull();
  });

  it('toppTilTaaItems filtrerer ut ikke-topp-til-tå', () => {
    expect(toppTilTaaItems(['lue', 'varmepose', 'votter', 'saueskinn i vogn']))
      .toEqual(['lue', 'votter']);
  });

  it('ekstraIkkeToppTilTaa returnerer kun ekstra-items', () => {
    expect(ekstraIkkeToppTilTaa(['lue', 'varmepose', 'votter', 'saueskinn i vogn']))
      .toEqual(['varmepose', 'saueskinn i vogn']);
  });
});
