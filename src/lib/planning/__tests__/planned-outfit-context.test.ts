import { describe, it } from 'vitest';

describe('Planned Outfit exact-context contracts', () => {
  it.todo('freezes a transient DTO with child, age, ISO time, Europe/Oslo, place, weather, recommendation, and access');
  it.todo('keeps planning event ID, transition context ID, and planned context ID distinct');
  it.todo('requires finite lookup coordinates and a validated configured-place, fixed-home, or automatic source');
  it.todo('resolves only a currently rendered event with matching event and transition identities');
  it.todo('fails closed on a missing, malformed, stale, or mismatched DTO without current-context fallback');
  it.todo('renders the selected future date, place, activity, weather, and finalized garments without recomputation');
  it.todo('keeps the trusted transport Uke to App in React memory with no persistence or URL history');
});
