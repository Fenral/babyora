/**
 * finn-antrekk-prefill — P5: pure prefill-seeding for FinnAntrekkScreen ("Juster").
 *
 * Split out of FinnAntrekkScreen.tsx (a component file — react-refresh/
 * only-export-components forbids non-component VALUE exports there, see
 * src/components/hjem/scan-overlay-guard.ts's file-header for the same
 * rule applied elsewhere) so the seeding rule itself is unit-testable
 * without rendering the screen.
 *
 * PRODUCT.md (locked, 2026-07-31): "Finn antrekk becomes a 'Juster' drill
 * from the Hjem result (sliders prefilled from live weather)". When the
 * screen is opened as that drill, the opener (HjemMonter, via HjemScreen /
 * App.tsx) already has the exact weather+activity the user was just looking
 * at — this seed must WIN over the screen's own internal defaults (-4° /
 * 3 m/s / 0 mm/t / "Lek ute") AND over its own useWeather() call, which may
 * resolve slightly later or with slightly different numbers (different
 * fetch, same lat/lon). FinnAntrekkScreen achieves the "win" by (a) seeding
 * useState via these values through a LAZY initializer (so the seed is the
 * very first render, no default-then-overwrite flash) and (b) starting
 * `initedFromWeather` already `true` when a prefill is present, which
 * permanently skips the render-time "engangsinit fra useWeather"-adjustment
 * the screen otherwise runs on its own first ready weather response.
 */
import type { Activity } from '../lib/wool-layers/types';

export type FinnAntrekkPrefill = Readonly<{
  /** °C — same value the opener showed (FinnAntrekk's single "Temperatur"
   *  slider stands in for feels-like too, see FinnAntrekkScreen's recommend()
   *  call: `feelsLikeC: tempC`). */
  tempC: number;
  windMs: number;
  precipMmH: number;
  activity: Activity;
  /** Optional — shown in the drill's header sub-line when present. */
  placeLabel?: string;
}>;

export type FinnAntrekkActivityUi = 'lek' | 'vogn';

export type FinnAntrekkSeed = Readonly<{
  tempC: number;
  windMs: number;
  precipMmH: number;
  activityUi: FinnAntrekkActivityUi;
  /** true when seeded from a prefill — the screen must skip its own
   *  weather-triggered engangsinit entirely when this is true. */
  initedFromWeather: boolean;
}>;

const DEFAULT_SEED: FinnAntrekkSeed = Object.freeze({
  tempC: -4,
  windMs: 3,
  precipMmH: 0,
  activityUi: 'lek',
  initedFromWeather: false,
});

/** Engine `Activity` → the screen's local 2-option activity radiogroup. */
export function activityUiFromEngine(activity: Activity): FinnAntrekkActivityUi {
  return activity === 'vogn' ? 'vogn' : 'lek';
}

/**
 * SEED WINS: given a prefill (or none), returns the exact seed the screen's
 * useState lazy initializers + initedFromWeather guard should start from.
 * Rounding matches the screen's own weather-triggered engangsinit exactly
 * (temp/wind to whole units, precip to the nearest 0.5 slider step) so a
 * Hjem-sourced prefill and a same-valued own-weather response render
 * identically.
 */
export function seedFromPrefill(prefill: FinnAntrekkPrefill | undefined): FinnAntrekkSeed {
  if (!prefill) return DEFAULT_SEED;
  return {
    tempC: Math.round(prefill.tempC),
    windMs: Math.round(prefill.windMs),
    precipMmH: Math.round(prefill.precipMmH * 2) / 2,
    activityUi: activityUiFromEngine(prefill.activity),
    initedFromWeather: true,
  };
}
