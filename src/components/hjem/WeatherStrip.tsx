/**
 * WeatherStrip — den komprimerte værstripen som erstatter det fulle panelet
 * etter at et resultat er beregnet (docs/mocks/monter/hjem-result.html
 * `.strip`). Hele stripen ER «Juster»-knappen (mock: én <button> med
 * aria-label «Juster vær, sted eller aktivitet»).
 *
 * onAdjust: kablet av kalleren (HjemMonter → handleOpenAdjust, P5) til
 * vær/sted/aktivitet-justeringsdrillen (FinnAntrekkScreen med live-værgrunn-
 * fylling) — ferdig siden P5, ikke lenger en stub.
 */
import './hjem-monter.css';
import type { WeatherNuance } from './WeatherScene.js';

function AdjustChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export type WeatherStripProps = Readonly<{
  nuance: WeatherNuance;
  tempC: number;
  feelsLikeC: number;
  conditionLabel: string;
  cityLabel: string;
  activityToggleLabel: string;
  onAdjust: () => void;
}>;

function formatTempDisplay(tempC: number): string {
  const rounded = Math.round(tempC);
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}

export function WeatherStrip({
  nuance,
  tempC,
  feelsLikeC,
  conditionLabel,
  cityLabel,
  activityToggleLabel,
  onAdjust,
}: WeatherStripProps) {
  return (
    <button
      type="button"
      className="hjm-strip"
      data-nuance={nuance}
      aria-label="Juster vær, sted eller aktivitet"
      onClick={onAdjust}
    >
      <span className="hjm-s-temp">{formatTempDisplay(tempC)}°</span>
      <span className="hjm-s-meta">
        {`Føles som ${formatTempDisplay(feelsLikeC)}° · ${conditionLabel}`}
        <br />
        {`${cityLabel} · ${activityToggleLabel}`}
      </span>
      <span className="hjm-s-adjust" aria-hidden="true">
        Juster
        <AdjustChevron />
      </span>
    </button>
  );
}
