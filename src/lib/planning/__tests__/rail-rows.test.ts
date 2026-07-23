import { describe, expect, it } from 'vitest';
import type { ForecastCoverage, ForecastCoverageStatus } from '../coverage.js';
import type { ChangeEvent, PlanningChangeEvent } from '../change-events.js';
import * as railRows from '../rail-rows.js';
import { buildRailRows } from '../rail-rows.js';

type CanonicalRow =
  | Readonly<{
    id: string;
    type: 'unchanged';
    startIso: string;
    endIso: string;
    evidencePointIsos: readonly string[];
    copy: string;
  }>
  | Readonly<{
    id: string;
    type: 'change';
    eventId: string;
    atIso: string;
    transitionContextId: string;
    hasOutfit: boolean;
  }>;

const canonical = railRows as unknown as {
  buildPlanningRailRows: (
    coverage: ForecastCoverage,
    events: readonly PlanningChangeEvent[],
    outfitAvailabilityByEventId?: Readonly<Record<string, boolean>>,
    evaluatedPointIsos?: readonly string[],
  ) => CanonicalRow[];
};

function coverage(status: ForecastCoverageStatus, isos: readonly string[]): ForecastCoverage {
  const points = isos.map((iso) => ({
    iso,
    epochMs: Date.parse(iso),
    localDate: iso.slice(0, 10),
    localTime: iso.slice(11, 16),
  }));
  return {
    status,
    timeZone: 'Europe/Oslo',
    points,
    startIso: points[0]?.iso ?? null,
    endIso: points.at(-1)?.iso ?? null,
  };
}

function event(atIso: string, id: string, overrides: Partial<PlanningChangeEvent> = {}): PlanningChangeEvent {
  return {
    id,
    atIso,
    kind: 'add',
    addedGarments: ['lue'],
    removedGarments: [],
    cause: 'Det blir kjøligere',
    transitionContextId: `transition-${id}`,
    ...overrides,
  };
}

const hourlyIsos = [
  '2026-07-20T08:00:00+02:00',
  '2026-07-20T09:00:00+02:00',
  '2026-07-20T10:00:00+02:00',
  '2026-07-20T11:00:00+02:00',
] as const;

describe('buildPlanningRailRows canonical contract', () => {
  it('publishes a canonical builder independently of the legacy adapter', () => {
    expect(typeof canonical.buildPlanningRailRows).toBe('function');
  });

  it('fails closed for unavailable evidence', () => {
    expect(canonical.buildPlanningRailRows(coverage('unavailable', []), [])).toEqual([]);
  });

  it('uses full-span wording only for complete contiguous evidence', () => {
    const fullDay = Array.from({ length: 24 }, (_, hour) => (
      `2026-07-20T${String(hour).padStart(2, '0')}:00:00+02:00`
    ));
    const rows = canonical.buildPlanningRailRows(coverage('complete-hourly', fullDay), [], {}, fullDay);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: 'unchanged',
      startIso: fullDay[0],
      endIso: fullDay[23],
      copy: 'Samme antrekk ut dagen',
    });
  });

  it.each(['sampled', 'gapped', 'stale'] as const)(
    'uses evaluated-point wording for %s evidence',
    (status) => {
      const evaluatedIsos = [
        hourlyIsos[0],
        hourlyIsos[2],
        hourlyIsos[3],
      ];
      const rows = canonical.buildPlanningRailRows(
        coverage(status, evaluatedIsos),
        [],
        {},
        evaluatedIsos,
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        type: 'unchanged',
        copy: 'Samme antrekk i de vurderte tidspunktene',
      });
      expect(JSON.stringify(rows)).not.toMatch(/hele dagen|ut dagen|til kl\.|time for time/i);
    },
  );

  it('emits stable zero, one, many, and adjacent event sequences', () => {
    const assessed = coverage('complete-hourly', hourlyIsos);
    const atNine = event(hourlyIsos[1], 'event-nine');
    const atTen = event(hourlyIsos[2], 'event-ten', {
      kind: 'remove',
      addedGarments: [],
      removedGarments: ['lue'],
    });

    expect(canonical.buildPlanningRailRows(assessed, [], {}, hourlyIsos).map((row) => row.type))
      .toEqual(['unchanged']);
    expect(canonical.buildPlanningRailRows(assessed, [atNine], {}, hourlyIsos).map((row) => row.type))
      .toEqual(['unchanged', 'change', 'unchanged']);
    expect(canonical.buildPlanningRailRows(assessed, [atNine, atTen], {}, hourlyIsos).map((row) => row.type))
      .toEqual(['unchanged', 'change', 'change', 'unchanged']);

    const many = canonical.buildPlanningRailRows(assessed, [atNine, atTen], {}, hourlyIsos);
    expect(new Set(many.map((row) => row.id)).size).toBe(many.length);
  });

  it('never promotes weather coverage into unevaluated unchanged-outfit evidence', () => {
    const assessed = coverage('complete-hourly', hourlyIsos);

    expect(canonical.buildPlanningRailRows(assessed, [], {}, [hourlyIsos[0]])).toEqual([]);

    const sampledRecommendationRows = canonical.buildPlanningRailRows(
      assessed,
      [],
      {},
      [hourlyIsos[0], hourlyIsos[2]],
    );
    expect(sampledRecommendationRows).toHaveLength(1);
    expect(sampledRecommendationRows[0]).toMatchObject({
      type: 'unchanged',
      evidencePointIsos: [hourlyIsos[0], hourlyIsos[2]],
      copy: 'Samme antrekk i de vurderte tidspunktene',
    });
  });

  it('preserves canonical event identity and only parent-supplied Outfit availability', () => {
    const plannedEvent = event(hourlyIsos[1], 'event-nine');
    const [leading, change] = canonical.buildPlanningRailRows(
      coverage('complete-hourly', hourlyIsos),
      [plannedEvent],
      { 'event-nine': true },
      hourlyIsos,
    );

    expect(leading?.type).toBe('unchanged');
    expect(change).toEqual({
      id: 'planning-row-change-event-nine',
      type: 'change',
      eventId: 'event-nine',
      atIso: hourlyIsos[1],
      transitionContextId: 'transition-event-nine',
      hasOutfit: true,
    });
    expect(change).not.toHaveProperty('event');
    expect(change).not.toHaveProperty('contextId');
    expect(change).not.toHaveProperty('plannedContextId');
  });

  it('is byte-identical for reordered canonical events', () => {
    const assessed = coverage('complete-hourly', hourlyIsos);
    const events = [
      event(hourlyIsos[2], 'event-ten'),
      event(hourlyIsos[1], 'event-nine'),
    ];

    expect(JSON.stringify(canonical.buildPlanningRailRows(assessed, events, {}, hourlyIsos)))
      .toBe(JSON.stringify(canonical.buildPlanningRailRows(assessed, [...events].reverse(), {}, hourlyIsos)));
  });

  it('keeps canonical kind priority for multiple actions at one instant', () => {
    const assessed = coverage('complete-hourly', hourlyIsos);
    const location = event(hourlyIsos[1], 'z-location', {
      kind: 'location',
      addedGarments: [],
      transitionContextId: 'location-transition',
      transition: {
        kind: 'location',
        placeLabel: 'Barnehagen',
        action: 'Ta av skalljakke',
      },
    });
    const prep = event(hourlyIsos[1], 'a-prep', {
      kind: 'prep',
      addedGarments: [],
      transitionContextId: 'prep-transition',
      transition: { kind: 'prep', garments: ['regntrekk'] },
    });

    const rows = canonical.buildPlanningRailRows(
      assessed,
      [prep, location],
      {},
      hourlyIsos,
    );

    expect(rows.filter((row) => row.type === 'change').map((row) => (
      row.type === 'change' ? row.eventId : ''
    ))).toEqual(['z-location', 'a-prep']);
  });

  it('fails malformed runtime event containers closed without throwing', () => {
    const assessed = coverage('complete-hourly', hourlyIsos);
    const malformed = event(hourlyIsos[1], 'malformed', {
      addedGarments: null as unknown as readonly string[],
    });

    expect(() => canonical.buildPlanningRailRows(
      assessed,
      null as unknown as readonly PlanningChangeEvent[],
      {},
      hourlyIsos,
    )).not.toThrow();
    expect(canonical.buildPlanningRailRows(
      assessed,
      null as unknown as readonly PlanningChangeEvent[],
      {},
      hourlyIsos,
    )).toEqual([]);
    expect(canonical.buildPlanningRailRows(assessed, [malformed], {}, hourlyIsos)).toEqual([]);
  });

  it('fails closed when one event identity maps to conflicting row content', () => {
    const first = event(hourlyIsos[1], 'event-nine');
    const conflicting = event(hourlyIsos[1], 'event-nine', {
      transitionContextId: 'different-transition',
    });

    expect(canonical.buildPlanningRailRows(
      coverage('complete-hourly', hourlyIsos),
      [first, conflicting],
      {},
      hourlyIsos,
    )).toEqual([]);
  });
});

const legacyEvent = (hour: number, kind: ChangeEvent['kind'] = 'add'): ChangeEvent => ({
  hour,
  kind,
  garments: ['x'],
});

describe('buildRailRows deprecated legacy adapter', () => {
  it('retains the current zero-event Uke/rail shape', () => {
    expect(buildRailRows(8, 18, [])).toEqual([{ type: 'collapsed', untilLabel: 'hele dagen' }]);
  });

  it('retains the current interleaved hour-only behavior without canonical projection', () => {
    const rows = buildRailRows(8, 18, [legacyEvent(12), legacyEvent(16)]);

    expect(rows.map((row) => row.type))
      .toEqual(['collapsed', 'change', 'collapsed', 'change', 'collapsed']);
    expect(rows).toEqual([
      { type: 'collapsed', untilLabel: '12:00' },
      { type: 'change', event: legacyEvent(12) },
      { type: 'collapsed', untilLabel: '16:00' },
      { type: 'change', event: legacyEvent(16) },
      { type: 'collapsed', untilLabel: 'resten av dagen' },
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/atIso|transitionContextId|plannedContextId/);
  });
});
