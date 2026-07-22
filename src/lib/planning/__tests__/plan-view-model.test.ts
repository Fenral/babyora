import { describe, it } from 'vitest';

describe('Planlegg view-model contracts', () => {
  it.todo('renders the exact loading state while the atomic forecast context resolves');
  it.todo('renders the exact error state when no valid current or cached plan exists');
  it.todo('renders offline cached evidence with its explicit HH:mm timestamp');
  it.todo('renders partial coverage without claiming the samples cover the whole day');
  it.todo('uses a static unchanged span for zero recommendation-changing events');
  it.todo('selects the only event for one recommendation-changing event');
  it.todo('selects the next relevant event for many recommendation-changing events');
  it.todo('creates no clothing marker for a passive weather-only change');
  it.todo('uses whole-day copy only for contiguous verified coverage');
  it.todo('keeps Free today complete while future capability remains separately gated');
});

