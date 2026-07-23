import { beforeEach, describe, expect, it } from 'vitest';
import { resolveRuntimeCapabilityAccess } from '../../lib/premium/gating';
import {
  mergeLocationPreference,
  partializeLocationPreference,
  resolveEffectivePlace,
  useLocationPref,
  type AutomaticPlaceInput,
  type FixedHomePlace,
} from '../location-pref-store';

const fixedHome: FixedHomePlace = Object.freeze({
  childId: 'child-1',
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
});

const automaticPlace: AutomaticPlaceInput = Object.freeze({
  childId: 'child-1',
  city: 'Stjørdal',
  lat: 63.468,
  lon: 10.917,
});

const runtime = (
  partial: Readonly<{ isPlus?: boolean; loading?: boolean; available?: boolean }> = {},
) => resolveRuntimeCapabilityAccess(
  'automatic_location',
  {
    isPlus: partial.isPlus ?? true,
    authenticated: false,
    loading: partial.loading ?? false,
  },
  { automatic_location: partial.available ?? true },
);

describe('location preference persistence boundary', () => {
  beforeEach(() => {
    useLocationPref.setState({
      mode: 'manual',
      automaticPlace: null,
      automaticGeneration: 0,
    });
  });

  it('serializes only the existing mode field', () => {
    useLocationPref.setState({
      mode: 'auto',
      automaticGeneration: 7,
      automaticPlace: { ...automaticPlace, generation: 7 },
    });

    expect(partializeLocationPreference(useLocationPref.getState())).toEqual({
      mode: 'auto',
    });
    expect(JSON.stringify(partializeLocationPreference(useLocationPref.getState())))
      .toBe('{"mode":"auto"}');
  });

  it('hydrates mode from legacy state without restoring coordinates or generation', () => {
    const current = useLocationPref.getState();
    const hydrated = mergeLocationPreference({
      mode: 'auto',
      automaticGeneration: 91,
      automaticPlace: { ...automaticPlace, generation: 91 },
      entitlement: 'plus',
      source: 'automatic',
    }, current);

    expect(hydrated.mode).toBe('auto');
    expect(hydrated.automaticPlace).toBeNull();
    expect(hydrated.automaticGeneration).toBe(0);
    expect(partializeLocationPreference(hydrated)).toEqual({ mode: 'auto' });
  });

  it('rejects corrupt persisted modes without changing memory-only fields', () => {
    const current = {
      ...useLocationPref.getState(),
      automaticGeneration: 3,
      automaticPlace: { ...automaticPlace, generation: 3 },
    };
    const hydrated = mergeLocationPreference({ mode: 'future-mode' }, current);

    expect(hydrated.mode).toBe('manual');
    expect(hydrated.automaticPlace).toBe(current.automaticPlace);
    expect(hydrated.automaticGeneration).toBe(3);
  });
});

describe('generation-aware automatic place memory', () => {
  beforeEach(() => {
    useLocationPref.setState({
      mode: 'manual',
      automaticPlace: null,
      automaticGeneration: 0,
    });
  });

  it('accepts only a valid result from the current generation', () => {
    const first = useLocationPref.getState().beginAutomaticPlaceRequest();
    const second = useLocationPref.getState().beginAutomaticPlaceRequest();

    useLocationPref.getState().setAutomaticPlace(first, automaticPlace);
    expect(useLocationPref.getState().automaticPlace).toBeNull();

    useLocationPref.getState().setAutomaticPlace(second, automaticPlace);
    expect(useLocationPref.getState().automaticPlace).toEqual({
      ...automaticPlace,
      generation: second,
    });
  });

  it.each([
    { ...automaticPlace, city: '   ' },
    { ...automaticPlace, lat: Number.NaN },
    { ...automaticPlace, lat: 91 },
    { ...automaticPlace, lon: Number.POSITIVE_INFINITY },
    { ...automaticPlace, lon: -181 },
  ])('rejects invalid automatic snapshots %#', (candidate) => {
    const generation = useLocationPref.getState().beginAutomaticPlaceRequest();
    useLocationPref.getState().setAutomaticPlace(generation, candidate);
    expect(useLocationPref.getState().automaticPlace).toBeNull();
  });

  it('clear invalidates in-flight generations as well as the current snapshot', () => {
    const generation = useLocationPref.getState().beginAutomaticPlaceRequest();
    useLocationPref.getState().setAutomaticPlace(generation, automaticPlace);
    useLocationPref.getState().clearAutomaticPlace();
    useLocationPref.getState().setAutomaticPlace(generation, automaticPlace);

    expect(useLocationPref.getState().automaticGeneration).toBe(generation + 1);
    expect(useLocationPref.getState().automaticPlace).toBeNull();
  });
});

describe('effective place resolver', () => {
  it('uses a matching valid session snapshot only when runtime access is allowed', () => {
    const resolved = resolveEffectivePlace(
      fixedHome,
      'auto',
      runtime(),
      { ...automaticPlace, generation: 4 },
    );

    expect(resolved).toEqual({
      childId: 'child-1',
      city: 'Stjørdal',
      lat: 63.468,
      lon: 10.917,
      source: 'automatic',
      cacheScope: 'memory-only',
    });
  });

  it.each([
    ['manual mode', 'manual', runtime(), { ...automaticPlace, generation: 1 }],
    ['loading', 'auto', runtime({ loading: true }), { ...automaticPlace, generation: 1 }],
    ['Free', 'auto', runtime({ isPlus: false }), { ...automaticPlace, generation: 1 }],
    ['disabled flag', 'auto', runtime({ available: false }), { ...automaticPlace, generation: 1 }],
    ['missing snapshot', 'auto', runtime(), null],
    ['child mismatch', 'auto', runtime(), {
      ...automaticPlace, childId: 'child-2', generation: 1,
    }],
    ['blank label', 'auto', runtime(), {
      ...automaticPlace, city: '', generation: 1,
    }],
    ['invalid latitude', 'auto', runtime(), {
      ...automaticPlace, lat: -91, generation: 1,
    }],
  ] as const)(
    'falls back byte-identically to fixed home for %s',
    (_label, mode, access, snapshot) => {
      const before = JSON.stringify(fixedHome);
      const resolved = resolveEffectivePlace(fixedHome, mode, access, snapshot);

      expect(resolved).toEqual({
        ...fixedHome,
        source: 'fixed-home',
        cacheScope: 'persistent',
      });
      expect(JSON.stringify(fixedHome)).toBe(before);
    },
  );

  it('rejects an invalid fixed home instead of starting any location request', () => {
    expect(resolveEffectivePlace(
      { ...fixedHome, city: ' ' },
      'auto',
      runtime(),
      { ...automaticPlace, generation: 1 },
    )).toBeNull();
  });
});
