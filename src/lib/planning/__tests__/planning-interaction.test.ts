import { describe, expect, it, vi } from 'vitest';
import {
  decidePlanningInteraction,
  dispatchPlanningInteraction,
  repairPlanningSelection,
  type PlanningInteractionDecision,
} from '../planning-interaction.js';

describe('Planlegg interaction decision contracts', () => {
  it('uses null for zero events, the only ID for one, and the preferred next ID for many', () => {
    expect(repairPlanningSelection(null, [], null)).toBeNull();
    expect(repairPlanningSelection(null, ['event-1'], null)).toBe('event-1');
    expect(repairPlanningSelection(null, ['event-1', 'event-2'], 'event-2')).toBe('event-2');
  });

  it('maps only an actual view or date change to one selection cue', () => {
    expect(decidePlanningInteraction({
      type: 'view-date',
      currentKey: 'i-dag:2026-02-12',
      nextKey: 'uke:2026-02-12',
    })).toEqual({ cue: 'selection' });
    expect(decidePlanningInteraction({
      type: 'view-date',
      currentKey: 'uke:2026-02-12',
      nextKey: 'uke:2026-02-12',
    })).toEqual({ cue: null });
  });

  it('maps a new expansion to light and a repeat to silent collapse', () => {
    expect(decidePlanningInteraction({
      type: 'rail-toggle',
      selectedEventId: 'event-1',
      eventId: 'event-2',
    })).toEqual({
      nextSelectedEventId: 'event-2',
      cue: 'light',
    });
    expect(decidePlanningInteraction({
      type: 'rail-toggle',
      selectedEventId: 'event-2',
      eventId: 'event-2',
    })).toEqual({
      nextSelectedEventId: null,
      cue: null,
    });
  });

  it('repairs removed selection silently to the preferred valid ID or deterministic first ID', () => {
    expect(repairPlanningSelection(
      'event-removed',
      ['event-2', 'event-3'],
      'event-3',
    )).toBe('event-3');
    expect(repairPlanningSelection(
      'event-removed',
      ['event-2', 'event-3'],
      'event-missing',
    )).toBe('event-2');
    expect(repairPlanningSelection('event-removed', [], null)).toBeNull();
    expect(repairPlanningSelection('event-2', ['event-2', 'event-3'], 'event-3')).toBe(
      'event-2',
    );
  });

  it('dispatches selection and cue exactly once in deterministic order', () => {
    const calls: string[] = [];
    const onSelect = vi.fn((eventId: string | null) => {
      calls.push(`select:${eventId ?? 'null'}`);
    });
    const onCue = vi.fn((cue: 'selection' | 'light') => {
      calls.push(`cue:${cue}`);
    });
    const decision: PlanningInteractionDecision = {
      nextSelectedEventId: 'event-2',
      cue: 'light',
    };

    dispatchPlanningInteraction(decision, { onSelect, onCue });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('event-2');
    expect(onCue).toHaveBeenCalledTimes(1);
    expect(onCue).toHaveBeenCalledWith('light');
    expect(calls).toEqual(['select:event-2', 'cue:light']);
  });

  it('does not dispatch callbacks that the pure decision did not request', () => {
    const onSelect = vi.fn();
    const onCue = vi.fn();

    dispatchPlanningInteraction({ cue: null }, { onSelect, onCue });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onCue).not.toHaveBeenCalled();

    dispatchPlanningInteraction(
      { nextSelectedEventId: null, cue: null },
      { onSelect, onCue },
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onCue).not.toHaveBeenCalled();
  });

  it('contains no browser, haptic adapter, DTO, recommendation, or persistence capability', async () => {
    const sourcePath = '../planning-interaction.ts?raw';
    const source = (await import(/* @vite-ignore */ sourcePath) as { default: string }).default;

    expect(source).not.toMatch(
      /\b(?:window|document|navigator|matchMedia|Capacitor|Haptics|useHapticSystem|PlannedOutfitContext|transitionContextId|plannedContextId|recommend|localStorage|sessionStorage|fetch|console)\b/u,
    );
  });
});
