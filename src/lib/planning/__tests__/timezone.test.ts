import { describe, it } from 'vitest';

describe('Planlegg Europe/Oslo timezone contracts', () => {
  it.todo('groups the frozen normal-day instants by Europe/Oslo calendar date');
  it.todo('skips the nonexistent local spring-forward hour without inventing a planning point');
  it.todo('keeps both repeated fall-back hours distinct through stable ISO identities');
  it.todo('orders mixed-offset instants chronologically before deriving local labels');
  it.todo('computes coverage from explicit local-day boundaries without Date.now');
});
