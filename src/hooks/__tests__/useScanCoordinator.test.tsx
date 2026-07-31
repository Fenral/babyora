import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { UseScanCoordinatorResult } from '../useScanCoordinator.js';
import { useScanCoordinator } from '../useScanCoordinator.js';
import type { ScanIdentity } from '../../lib/scan/types.js';

const IDENTITY: ScanIdentity = Object.freeze({
  childId: 'barn-01',
  dateKey: '2026-07-30',
  placeKey: 'place:59.91,10.75',
  activity: 'utelek',
  engineVersion: '2026-07',
});

/**
 * useSyncExternalStore's third argument (getServerSnapshot) makes this hook
 * SSR-safe — renderToStaticMarkup exercises exactly that path (no
 * subscription/effect lifecycle, matching how
 * PaakledningScreen.outfit-truth.test.tsx already renders hook-driven
 * screens without a DOM/testing-library harness in this codebase).
 */
function mount(): UseScanCoordinatorResult {
  let captured: UseScanCoordinatorResult | null = null;
  function Probe() {
    captured = useScanCoordinator();
    return null;
  }
  renderToStaticMarkup(<Probe />);
  if (captured === null) throw new Error('useScanCoordinator did not run');
  return captured;
}

describe('useScanCoordinator', () => {
  it('renders with the coordinator starting at weather-ready', () => {
    const result = mount();
    expect(result.state).toEqual({ phase: 'weather-ready' });
    expect(result.getState()).toEqual({ phase: 'weather-ready' });
  });

  it('exposes the full coordinator event surface, all functions', () => {
    const result = mount();
    for (const key of [
      'getState',
      'subscribe',
      'weatherReady',
      'scanStarted',
      'scanCompleted',
      'identityChanged',
      'weatherBasisChanged',
      'recalcStarted',
      'recalcCompleted',
      'recalcFailed',
      'reset',
    ] as const) {
      expect(typeof result[key]).toBe('function');
    }
  });

  it('the returned coordinator is a live, working instance — events mutate its underlying state', () => {
    const result = mount();
    expect(result.scanStarted(IDENTITY)).toEqual({
      phase: 'scanning',
      identity: IDENTITY,
    });
    expect(result.scanCompleted('current-finalized:["a"]')).toEqual({
      phase: 'result-current',
      identity: IDENTITY,
      resultKey: 'current-finalized:["a"]',
    });
    // getState reflects the live coordinator regardless of React's render
    // cycle (no re-render happens outside of a mounted client tree here).
    expect(result.getState()).toEqual({
      phase: 'result-current',
      identity: IDENTITY,
      resultKey: 'current-finalized:["a"]',
    });
  });

  it('two separate mounts get two independent coordinators', () => {
    const first = mount();
    const second = mount();
    first.scanStarted(IDENTITY);
    expect(first.getState().phase).toBe('scanning');
    expect(second.getState()).toEqual({ phase: 'weather-ready' });
  });

  it('subscribing to the returned coordinator observes further transitions', () => {
    const result = mount();
    const observed: string[] = [];
    const unsubscribe = result.subscribe(() => {
      observed.push(result.getState().phase);
    });
    result.scanStarted(IDENTITY);
    result.scanCompleted('current-finalized:["a"]');
    unsubscribe();
    result.reset();
    expect(observed).toEqual(['scanning', 'result-current']);
  });
});
