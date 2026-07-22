import { describe, it } from 'vitest';

describe('Planlegg interaction decision contracts', () => {
  it.todo('uses null selection for zero events, the only ID for one event, and the next relevant ID for many');
  it.todo('emits one light cue only when a different event becomes expanded');
  it.todo('collapses an expanded event to null without a haptic cue or focus movement');
  it.todo('emits one selection cue only for an actual view or date change');
  it.todo('repairs a removed selected event silently to the next valid ID after refresh');
  it.todo('passes only event ID and trigger from the rail before Uke resolves exact context');
  it.todo('preserves selected view, event, scroll, and trigger focus across the Outfit drill');
  it.todo('keeps reduced motion independent from haptic preference and web adapters silent');
});
