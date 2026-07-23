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
  evaluatedAt: Date.parse('2026-02-12T08:15:00.000Z'),
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
    expect(formatCoverageCopy(coverage)).toBe('V\u00e6rdata finnes bare for enkelte tidspunkter.');
  });

  it.each([null, '', 'ikke-en-dato', '2026-02-30T08:12:00.000Z'])(
    'rejects invalid sourceUpdatedAt evidence %j',
    (sourceUpdatedAt) => {
      expect(assessForecastCoverage(points, metadata({ sourceUpdatedAt })).status).toBe('unavailable');
    },
  );

  it('distinguishes sampled and gapped evidence with conservative weather copy', () => {
    const sampled = assessForecastCoverage([
      '2026-02-12T08:00:00.000Z', '2026-02-12T11:00:00.000Z', '2026-02-12T14:00:00.000Z',
    ], metadata());
    const gapped = assessForecastCoverage([
      '2026-02-12T08:00:00.000Z', '2026-02-12T09:01:00.000Z',
    ], metadata());
    expect(sampled.status).toBe('sampled');
    expect(formatCoverageCopy(sampled)).toBe('V\u00e6rdata for de vurderte tidspunktene.');
    expect(gapped.status).toBe('gapped');
    expect(formatCoverageCopy(gapped)).toBe('V\u00e6rdata finnes bare for enkelte tidspunkter.');
    expect(formatCoverageCopy(sampled)).not.toContain('antrekk');
    expect(formatCoverageCopy(gapped)).not.toContain('antrekk');
  });

  it.each([
    [['ikke-en-dato']],
    [['2026-02-30T08:00:00.000Z']],
    [[points[0], points[0]]],
    [[]],
  ])('rejects invalid, impossible, duplicate or missing points: %j', (input) => {
    expect(assessForecastCoverage(input, metadata()).status).toBe('unavailable');
  });

  it('describes only exact hourly weather coverage without asserting an outfit', () => {
    const coverage = assessForecastCoverage(points, metadata());
    expect(formatCoverageCopy(coverage)).toBe('V\u00e6rdata hver time til kl. 11:00.');
    expect(formatCoverageCopy(coverage)).not.toContain('antrekk');
  });

  it.todo('keeps fixed/manual persistence separate from future memory-only automatic forecast scope');
});
