import { describe, expect, it } from 'vitest';
import type { ForecastFetchMetadata } from '../../met-no/types';
import { assessForecastCoverage, formatCoverageCopy } from '../coverage';

const points = [
  '2026-02-12T08:00:00.000Z',
  '2026-02-12T09:00:00.000Z',
  '2026-02-12T10:00:00.000Z',
] as const;

const metadata = (overrides: Partial<ForecastFetchMetadata> = {}): ForecastFetchMetadata => ({
  source: 'network',
  sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
  fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
  cacheStatus: 'miss',
  stale: false,
  ...overrides,
});

describe('Planlegg forecast evidence contracts', () => {
  it('classifies explicit fresh network evidence without consulting Date.now', () => {
    expect(assessForecastCoverage(points, metadata()).status).toBe('complete-hourly');
  });

  it('accepts cache evidence already classified fresh at the exact TTL boundary', () => {
    const coverage = assessForecastCoverage(points, metadata({
      source: 'cache', cacheStatus: 'fresh', fetchedAt: Date.parse('2026-02-12T08:10:00.000Z'),
    }));
    expect(coverage.status).toBe('complete-hourly');
  });

  it('keeps TTL plus one evidence stale and denies full-span copy', () => {
    const coverage = assessForecastCoverage(points, metadata({
      source: 'cache', cacheStatus: 'stale', stale: true,
    }));
    expect(coverage.status).toBe('stale');
    expect(formatCoverageCopy(coverage)).toBe('Planen viser bare tidspunktene Babyora har vÃ¦rdata for.');
  });

  it.each([null, '', 'ikke-en-dato'])('rejects invalid sourceUpdatedAt evidence %j', (sourceUpdatedAt) => {
    expect(assessForecastCoverage(points, metadata({ sourceUpdatedAt })).status).toBe('unavailable');
  });

  it('distinguishes sampled and gapped evidence with conservative copy', () => {
    const sampled = assessForecastCoverage([
      '2026-02-12T08:00:00.000Z', '2026-02-12T11:00:00.000Z', '2026-02-12T14:00:00.000Z',
    ], metadata());
    const gapped = assessForecastCoverage([
      '2026-02-12T08:00:00.000Z', '2026-02-12T09:01:00.000Z',
    ], metadata());
    expect(sampled.status).toBe('sampled');
    expect(formatCoverageCopy(sampled)).toBe('Samme antrekk i de vurderte tidspunktene');
    expect(gapped.status).toBe('gapped');
    expect(formatCoverageCopy(gapped)).not.toContain('hele dagen');
  });

  it.each([
    [['ikke-en-dato']],
    [[points[0], points[0]]],
    [[]],
  ])('rejects invalid, duplicate or missing points: %j', (input) => {
    expect(assessForecastCoverage(input, metadata()).status).toBe('unavailable');
  });

  it('allows full-span wording only for fresh exact hourly adjacency', () => {
    const coverage = assessForecastCoverage(points, metadata());
    expect(formatCoverageCopy(coverage)).toBe('Samme antrekk til kl. 11:00');
  });

  it.todo('keeps fixed/manual persistence separate from future memory-only automatic forecast scope');
});
