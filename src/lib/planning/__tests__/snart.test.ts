import { describe, it } from 'vitest';

describe('Snart future approved-rule gate contracts', () => {
  it.todo('keeps the future approved-rule gate pending until all six human approvals and climate artifacts exist');
  it.todo('returns exactly ready from the future approved-rule model when one or more authoritative groups remain');
  it.todo('returns exactly empty from the future approved-rule model only when no visible group item remains');
  it.todo('returns exactly unavailable from the future approved-rule model when approved evidence cannot be evaluated');
  it.todo('traces every ready item to a future approved rule ID without inventing rules in Wave 0');
  it.todo('never exposes Har allerede for not_yet items from the future approved-rule model');
  it.todo('keeps ready with only not_yet when all actionable winners are marked and a not_yet winner remains');
  it.todo('prevents a marked actionable winner from reappearing through a lower-priority future approved rule');
});

