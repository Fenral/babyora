import { describe, expect, it } from 'vitest';
import type { ForecastFetchMetadata } from '../../met-no/types';
import { assessForecastCoverage } from '../coverage';

const fresh: ForecastFetchMetadata = {
  source: 'network',
  sourceUpdatedAt: '2026-02-12T08:12:00.000Z',
  fetchedAt: Date.parse('2026-02-12T08:15:00.000Z'),
  cacheStatus: 'miss',
  stale: false,
};

describe('Planlegg Europe/Oslo timezone contracts', () => {
  it('groups frozen normal-day instants by Europe/Oslo calendar date', () => {
    const coverage = assessForecastCoverage([
      '2026-02-11T23:00:00.000Z',
      '2026-02-12T00:00:00.000Z',
    ], fresh);
    expect(coverage.points.map((point) => point.localDate)).toEqual(['2026-02-12', '2026-02-12']);
  });

  it('skips the nonexistent spring-forward hour without inventing a point', () => {
    const coverage = assessForecastCoverage([
      '2026-03-29T00:30:00.000Z',
      '2026-03-29T01:30:00.000Z',
    ], fresh);
    expect(coverage.points.map((point) => point.localTime)).toEqual(['01:30', '03:30']);
    expect(coverage.points.some((point) => point.localTime === '02:30')).toBe(false);
  });

  it('keeps both repeated fall-back hours distinct through stable ISO identities', () => {
    const input = ['2026-10-25T00:30:00.000Z', '2026-10-25T01:30:00.000Z'];
    const coverage = assessForecastCoverage(input, fresh);
    expect(coverage.points.map((point) => point.localTime)).toEqual(['02:30', '02:30']);
    expect(coverage.points.map((point) => point.iso)).toEqual(input);
    expect(coverage.points[0]?.epochMs).not.toBe(coverage.points[1]?.epochMs);
  });

  it('orders mixed-offset instants chronologically before deriving local labels', () => {
    const coverage = assessForecastCoverage([
      '2026-02-12T11:00:00+01:00',
      '2026-02-12T08:00:00Z',
      '2026-02-12T10:00:00+01:00',
    ], fresh);
    expect(coverage.points.map((point) => point.epochMs)).toEqual([
      Date.parse('2026-02-12T08:00:00Z'),
      Date.parse('2026-02-12T09:00:00Z'),
      Date.parse('2026-02-12T10:00:00Z'),
    ]);
    expect(coverage.points.map((point) => point.iso)).toEqual([
      '2026-02-12T08:00:00Z',
      '2026-02-12T10:00:00+01:00',
      '2026-02-12T11:00:00+01:00',
    ]);
  });

  it('computes complete coverage from explicit local-day boundaries without Date.now', () => {
    const firstEpoch = Date.parse('2026-02-11T23:00:00.000Z');
    const localDay = Array.from({ length: 24 }, (_, index) => new Date(firstEpoch + index * 3_600_000).toISOString());
    const coverage = assessForecastCoverage(localDay, fresh);
    expect(coverage.status).toBe('complete-hourly');
    expect(coverage.points[0]?.localTime).toBe('00:00');
    expect(coverage.points.at(-1)?.localTime).toBe('23:00');
  });
});
