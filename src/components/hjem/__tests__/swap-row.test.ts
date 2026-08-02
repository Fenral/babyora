/**
 * swap-row.test — P6: resolveSwapTarget must never dead-end. Covers a
 * garment WITH alternative data (ullsokker — has entries in
 * lib/wool-layers/alternatives.ts, per warm-cold-recovery.test.ts) and one
 * WITHOUT (bleie — resolves to a real GarmentId but has no entry in
 * ITEM_ALTERNATIVES), plus the true dead-end guard: an unrecognised label
 * whose garmentId never resolved at all (result-rows.ts's garmentIdFor
 * returned null) falls back to the library instead of opening a detail
 * sheet for an id that doesn't exist.
 */
import { describe, expect, it } from 'vitest';
import { resolveSwapTarget } from '../swap-row.js';
import type { ResultRow } from '../result-rows.js';

function row(overrides: Partial<ResultRow>): ResultRow {
  // T1A: displayLabel speiler label når testen ikke sier noe annet.
  const base = {
    key: 'k1',
    position: 1,
    label: 'Ullsokker',
    roleLabel: 'Innerst',
    garmentId: 'ullsokker' as string | null,
    ...overrides,
  };
  return { displayLabel: base.label, ...base };
}

describe('resolveSwapTarget', () => {
  it('opens the detail sheet for a garment WITH alternative data (ullsokker)', () => {
    expect(resolveSwapTarget(row({ garmentId: 'ullsokker' }))).toEqual({
      kind: 'detail',
      garmentId: 'ullsokker',
    });
  });

  it('still opens the detail sheet for a garment WITHOUT alternative data (bleie) — no dead-end', () => {
    expect(resolveSwapTarget(row({ label: 'Bleie', roleLabel: 'Innerst', garmentId: 'bleie' })))
      .toEqual({ kind: 'detail', garmentId: 'bleie' });
  });

  it('falls back to the Plaggbibliotek drill when the label never resolved to a garmentId — no dead-end', () => {
    expect(resolveSwapTarget(row({ label: 'Ukjent plagg', roleLabel: 'Tilbehør', garmentId: null })))
      .toEqual({ kind: 'library' });
  });
});
