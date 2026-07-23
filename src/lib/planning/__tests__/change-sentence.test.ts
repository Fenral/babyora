import { describe, expect, it } from 'vitest';
import * as sentenceModule from '../change-sentence.js';
import { changeActionSentence } from '../change-sentence.js';

type CanonicalEvent = Readonly<{
  id: string;
  atIso: string;
  kind: 'add' | 'remove' | 'swap' | 'rain' | 'location' | 'prep';
  addedGarments: readonly string[];
  removedGarments: readonly string[];
  cause: string;
  transitionContextId: string;
  transition?:
    | Readonly<{ kind: 'rain'; action: 'bring' | 'wear'; garments: readonly string[] }>
    | Readonly<{ kind: 'location'; placeLabel: string; action: string }>
    | Readonly<{ kind: 'prep'; garments: readonly string[] }>;
}>;

const canonical = sentenceModule as unknown as {
  planningChangeActionSentence: (event: CanonicalEvent) => string;
};

function event(overrides: Partial<CanonicalEvent>): CanonicalEvent {
  return {
    id: 'planning-event-test',
    atIso: '2026-07-20T10:00:00+02:00',
    kind: 'add',
    addedGarments: [],
    removedGarments: [],
    cause: 'Det blir kjøligere',
    transitionContextId: 'transition-test',
    ...overrides,
  };
}

describe('planningChangeActionSentence canonical grammar', () => {
  it('publishes a canonical sentence API separately from the legacy adapter', () => {
    expect(typeof canonical.planningChangeActionSentence).toBe('function');
  });

  it('uses exact add and remove verbs without leading with a count', () => {
    expect(canonical.planningChangeActionSentence(event({
      kind: 'add',
      addedGarments: ['ullgenser', 'votter', 'lue', 'skalljakke'],
    }))).toBe('Ta på ullgenser, votter, lue, skalljakke');

    expect(canonical.planningChangeActionSentence(event({
      kind: 'remove',
      removedGarments: ['vinterdress'],
    }))).toBe('Ta av vinterdress');
  });

  it('describes a true swap with both separate sides', () => {
    expect(canonical.planningChangeActionSentence(event({
      kind: 'swap',
      removedGarments: ['vinterdress'],
      addedGarments: ['skalljakke', 'fleecejakke'],
    }))).toBe('Bytt fra vinterdress til skalljakke, fleecejakke');
  });

  it('uses the explicit rain action rather than inferring advice from weather', () => {
    expect(canonical.planningChangeActionSentence(event({
      kind: 'rain',
      transition: { kind: 'rain', action: 'bring', garments: ['regntrekk på vognen'] },
    }))).toBe('Ta med regntrekk på vognen');

    expect(canonical.planningChangeActionSentence(event({
      kind: 'rain',
      transition: { kind: 'rain', action: 'wear', garments: ['regnjakke'] },
    }))).toBe('Ta på regnjakke');
  });

  it('uses exact location and preparation grammar from explicit transitions', () => {
    expect(canonical.planningChangeActionSentence(event({
      kind: 'location',
      transition: { kind: 'location', placeLabel: 'Bestemor', action: 'Ta av skalljakke' },
    }))).toBe('Når dere kommer til Bestemor: Ta av skalljakke');

    expect(canonical.planningChangeActionSentence(event({
      kind: 'prep',
      transition: { kind: 'prep', garments: ['vinterdress', 'votter'] },
    }))).toBe('Forbered vinterdress, votter');
  });
});

describe('changeActionSentence deprecated legacy adapter', () => {
  it('retains the current hour-only Uke/rail copy contract', () => {
    expect(changeActionSentence({ hour: 16, kind: 'add', garments: ['kjøredress'] }))
      .toBe('Ta på kjøredress');
    expect(changeActionSentence({ hour: 12, kind: 'remove', garments: ['kjøredress'] }))
      .toBe('Ta av kjøredress');
    expect(changeActionSentence({ hour: 15, kind: 'rain', garments: ['regntrekk på vognen'] }))
      .toBe('Ta på regntrekk på vognen');
    expect(changeActionSentence({ hour: 14, kind: 'swap', garments: ['fleecesett', 'ullsett'] }))
      .toBe('Bytt til fleecesett, ullsett');
    expect(changeActionSentence({ hour: 10, kind: 'location', garments: [] }))
      .toBe('Nytt sted');
  });

  it('retains the legacy three-item truncation without leaking it into canonical copy', () => {
    expect(changeActionSentence({
      hour: 8,
      kind: 'add',
      garments: ['a', 'b', 'c', 'd', 'e'],
    })).toBe('Ta på a, b, c +2 til');
  });
});
