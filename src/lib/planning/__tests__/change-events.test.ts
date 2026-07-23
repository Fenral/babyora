import { describe, expect, it } from 'vitest';
import * as changeEvents from '../change-events.js';
import { deriveChangeEvents, type PlanPoint } from '../change-events.js';

type ExplicitTransition =
  | Readonly<{ kind: 'rain'; action: 'bring' | 'wear'; garments: readonly string[] }>
  | Readonly<{ kind: 'location'; placeLabel: string; action: string }>
  | Readonly<{ kind: 'prep'; garments: readonly string[] }>;

type CanonicalPoint = Readonly<{
  atIso: string;
  finalizedFingerprint: string;
  orderedGarments: readonly string[];
  equipment: readonly string[];
  cause: string;
  transitionContextId: string;
  transition?: ExplicitTransition;
}>;

type CanonicalEvent = Readonly<{
  id: string;
  atIso: string;
  kind: 'add' | 'remove' | 'swap' | 'rain' | 'location' | 'prep';
  addedGarments: readonly string[];
  removedGarments: readonly string[];
  cause: string;
  transitionContextId: string;
  transition?: ExplicitTransition;
}>;

const canonical = changeEvents as unknown as {
  derivePlanningChangeEvents: (points: readonly CanonicalPoint[]) => CanonicalEvent[];
  stablePlanningEventId: (event: Omit<CanonicalEvent, 'id'>) => string;
};

function planningPoint(
  atIso: string,
  finalizedFingerprint: string,
  orderedGarments: readonly string[],
  overrides: Partial<CanonicalPoint> = {},
): CanonicalPoint {
  return {
    atIso,
    finalizedFingerprint,
    orderedGarments,
    equipment: [],
    cause: 'Temperaturen endrer seg',
    transitionContextId: `transition-${atIso}`,
    ...overrides,
  };
}

describe('derivePlanningChangeEvents canonical contract', () => {
  it('publishes the canonical API separately from the legacy adapter', () => {
    expect(typeof canonical.derivePlanningChangeEvents).toBe('function');
    expect(typeof canonical.stablePlanningEventId).toBe('function');
  });

  it('emits no event for passive weather or fingerprint changes without visible advice changes', () => {
    const points = [
      planningPoint('2026-10-25T00:30:00+02:00', 'fp-a', ['ullbody']),
      planningPoint('2026-10-25T01:30:00+02:00', 'fp-b', ['ullbody'], {
        cause: 'Vinden øker',
      }),
      planningPoint('2026-10-25T01:30:00+01:00', 'fp-b', ['ullbody'], {
        cause: 'Det blir kaldere',
      }),
    ];

    expect(canonical.derivePlanningChangeEvents(points)).toEqual([]);
  });

  it('preserves recommendation order in separate add and remove lists and requires both for a true swap', () => {
    const events = canonical.derivePlanningChangeEvents([
      planningPoint('2026-01-10T08:00:00+01:00', 'base', ['ullbody', 'fleecejakke', 'vinterdress']),
      planningPoint('2026-01-10T09:00:00+01:00', 'remove', ['ullbody', 'fleecejakke']),
      planningPoint('2026-01-10T10:00:00+01:00', 'add', ['ullbody', 'fleecejakke', 'balaklava', 'votter']),
      planningPoint('2026-01-10T11:00:00+01:00', 'swap', ['ullbody', 'ullgenser', 'skalljakke', 'votter']),
    ]);

    expect(events.map(({ kind, addedGarments, removedGarments }) => ({
      kind,
      addedGarments,
      removedGarments,
    }))).toEqual([
      { kind: 'remove', addedGarments: [], removedGarments: ['vinterdress'] },
      { kind: 'add', addedGarments: ['balaklava', 'votter'], removedGarments: [] },
      {
        kind: 'swap',
        addedGarments: ['ullgenser', 'skalljakke'],
        removedGarments: ['fleecejakke', 'balaklava'],
      },
    ]);
  });

  it('emits rain, location, and prep only from explicit action-bearing transitions', () => {
    const events = canonical.derivePlanningChangeEvents([
      planningPoint('2026-07-20T08:00:00+02:00', 'same', ['ullbody']),
      planningPoint('2026-07-20T09:00:00+02:00', 'same', ['ullbody'], {
        cause: 'Regnet begynner',
        transitionContextId: 'rain-context',
        transition: { kind: 'rain', action: 'bring', garments: ['regntrekk på vognen'] },
      }),
      planningPoint('2026-07-20T10:00:00+02:00', 'same', ['ullbody'], {
        cause: 'Dere skal til barnehagen',
        transitionContextId: 'location-context',
        transition: { kind: 'location', placeLabel: 'Barnehagen', action: 'Ta på skalljakke' },
      }),
      planningPoint('2026-07-20T11:00:00+02:00', 'same', ['ullbody'], {
        cause: 'Det blir kaldere senere',
        transitionContextId: 'prep-context',
        transition: { kind: 'prep', garments: ['vinterdress'] },
      }),
    ]);

    expect(events.map((event) => event.kind)).toEqual(['rain', 'location', 'prep']);
    expect(events.map((event) => event.transitionContextId)).toEqual([
      'rain-context',
      'location-context',
      'prep-context',
    ]);
  });

  it('deduplicates identical canonical events while keeping distinct transition causes at the same instant', () => {
    const base = planningPoint('2026-07-20T08:00:00+02:00', 'same', ['ullbody']);
    const location = planningPoint('2026-07-20T09:00:00+02:00', 'same', ['ullbody'], {
      cause: 'Ankomst',
      transitionContextId: 'location-a',
      transition: { kind: 'location', placeLabel: 'Bestemor', action: 'Ta av skalljakke' },
    });
    const prep = planningPoint('2026-07-20T09:00:00+02:00', 'same', ['ullbody'], {
      cause: 'Avreise senere',
      transitionContextId: 'prep-a',
      transition: { kind: 'prep', garments: ['regntrekk'] },
    });

    const events = canonical.derivePlanningChangeEvents([prep, location, base, location]);

    expect(events.map((event) => event.kind)).toEqual(['location', 'prep']);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  it('is byte-stable for reordered points, Unicode garments, and the repeated DST hour', () => {
    const points = [
      planningPoint('2026-10-25T01:30:00+01:00', 'fp-c', ['ullbody', 'votter'], {
        cause: 'Kulden fortsetter',
        transitionContextId: 'after-fallback',
      }),
      planningPoint('2026-10-25T00:30:00+02:00', 'fp-a', ['ullbody']),
      planningPoint('2026-10-25T01:30:00+02:00', 'fp-b', ['ullbody', 'håndstrikket lue'], {
        cause: 'Det blir kjøligere',
        transitionContextId: 'before-fallback',
      }),
    ];

    const forward = canonical.derivePlanningChangeEvents(points);
    const reversed = canonical.derivePlanningChangeEvents([...points].reverse());

    expect(JSON.stringify(reversed)).toBe(JSON.stringify(forward));
    expect(forward.map((event) => event.atIso)).toEqual([
      '2026-10-25T01:30:00+02:00',
      '2026-10-25T01:30:00+01:00',
    ]);
    expect(forward[0]?.addedGarments).toEqual(['håndstrikket lue']);
  });

  it('binds stable identity to absolute time and canonical content', () => {
    const event: Omit<CanonicalEvent, 'id'> = {
      atIso: '2026-10-25T01:30:00+02:00',
      kind: 'add',
      addedGarments: ['lue'],
      removedGarments: [],
      cause: 'Det blir kjøligere',
      transitionContextId: 'cold-transition',
    };

    const first = canonical.stablePlanningEventId(event);
    const same = canonical.stablePlanningEventId({ ...event });
    const repeatedLocalHour = canonical.stablePlanningEventId({
      ...event,
      atIso: '2026-10-25T01:30:00+01:00',
    });
    const equivalentInstant = canonical.stablePlanningEventId({
      ...event,
      atIso: '2026-10-24T23:30:00Z',
    });

    expect(first).toBe(same);
    expect(first).toBe(equivalentInstant);
    expect(first).not.toBe(repeatedLocalHour);
    expect(first).toMatch(/^planning-event-/);
  });
});

function legacyPoint(hour: number, fingerprint: string, garments: string[], equipment: string[] = []): PlanPoint {
  return { hour, fingerprint, orderedGarments: garments, equipment, feelsLikeC: 5, symbolCode: 'cloudy' };
}

describe('deriveChangeEvents deprecated legacy adapter', () => {
  it('keeps the existing hour-only behavior without synthesizing canonical identity', () => {
    const events = deriveChangeEvents([
      legacyPoint(8, 'fp-a', ['ullsett', 'kjøredress']),
      legacyPoint(12, 'fp-b', ['ullsett']),
    ]);

    expect(events).toEqual([{ hour: 12, kind: 'remove', garments: ['kjøredress'] }]);
    expect(events[0]).not.toHaveProperty('atIso');
    expect(events[0]).not.toHaveProperty('id');
    expect(events[0]).not.toHaveProperty('transitionContextId');
  });

  it('retains rain priority for the unchanged current Uke/rail consumers', () => {
    const events = deriveChangeEvents([
      legacyPoint(8, 'fp-a', ['ullsett']),
      legacyPoint(12, 'fp-b', ['ullsett', 'kjøredress'], ['regntrekk på vognen']),
    ]);

    expect(events[0]).toEqual({
      hour: 12,
      kind: 'rain',
      garments: ['kjøredress', 'regntrekk på vognen'],
    });
  });
});
