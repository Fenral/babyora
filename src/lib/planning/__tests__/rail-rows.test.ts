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
    const rows = canonical.buildPlanningRailRows(coverage('complete-hourly', fullDay), []);

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
      const rows = canonical.buildPlanningRailRows(coverage(status, [
        hourlyIsos[0],
        hourlyIsos[2],
        hourlyIsos[3],
      ]), []);

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

    expect(canonical.buildPlanningRailRows(assessed, []).map((row) => row.type))
      .toEqual(['unchanged']);
    expect(canonical.buildPlanningRailRows(assessed, [atNine]).map((row) => row.type))
      .toEqual(['unchanged', 'change', 'unchanged']);
    expect(canonical.buildPlanningRailRows(assessed, [atNine, atTen]).map((row) => row.type))
      .toEqual(['unchanged', 'change', 'change', 'unchanged']);

    const many = canonical.buildPlanningRailRows(assessed, [atNine, atTen]);
    expect(new Set(many.map((row) => row.id)).size).toBe(many.length);
  });

  it('preserves canonical event identity and only parent-supplied Outfit availability', () => {
    const plannedEvent = event(hourlyIsos[1], 'event-nine');
    const [leading, change] = canonical.buildPlanningRailRows(
      coverage('complete-hourly', hourlyIsos),
      [plannedEvent],
      { 'event-nine': true },
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

    expect(JSON.stringify(canonical.buildPlanningRailRows(assessed, events)))
      .toBe(JSON.stringify(canonical.buildPlanningRailRows(assessed, [...events].reverse())));
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
