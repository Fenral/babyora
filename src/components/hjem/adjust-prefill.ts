/**
 * adjust-prefill — P5: pure builder for the "Juster" drill's prefill payload.
 *
 * HjemMonter already carries every ingredient (current/last-known weather,
 * activity, cityLabel) as plain props — this is the one small, testable seam
 * that turns those props into the FinnAntrekkPrefill shape FinnAntrekkScreen
 * consumes, kept out of HjemMonter.tsx itself (a component file — see
 * scan-overlay-guard.ts's file-header for why non-component exports don't
 * belong in component files here) so it's unit-testable without rendering.
 */
import type { WeatherNow } from '../../lib/met-no/types.js';
import type { FinnAntrekkPrefill } from '../../screens/finn-antrekk-prefill.js';
import type { MonterActivity } from './WeatherScene.js';

/**
 * null when there is no usable weather yet (e.g. truly offline with no
 * last-known reading either) — callers must not open the drill in that case,
 * there is nothing to prefill it with.
 */
export function buildAdjustPrefill(
  now: WeatherNow | null,
  activity: MonterActivity,
  cityLabel: string,
): FinnAntrekkPrefill | null {
  if (now === null) return null;
  return {
    tempC: now.tempC,
    windMs: now.windMs,
    precipMmH: now.precipMmH,
    activity,
    placeLabel: cityLabel,
  };
}
