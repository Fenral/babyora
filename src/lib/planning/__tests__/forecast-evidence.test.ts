import { describe, it } from 'vitest';

describe('Planlegg forecast evidence contracts', () => {
  it.todo('classifies an explicit network forecast as fresh without consulting Date.now');
  it.todo('accepts cached evidence exactly at the frozen TTL boundary');
  it.todo('classifies cached evidence at TTL plus one millisecond as stale');
  it.todo('rejects absent, null, invalid, or non-finite updated_at evidence');
  it.todo('carries source, received time, updated_at, and coverage through one atomic hook resolution');
  it.todo('keeps stale cached evidence visibly offline instead of presenting it as current');
  it.todo('keeps fixed/manual persistence separate from future memory-only automatic forecast scope');
});
