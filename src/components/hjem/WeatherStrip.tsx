/**
 * Kompakt værkontekst etter at resultatet er klart.
 *
 * Været er lesbart innhold. Bare situasjonsraden er en handling. Det gir
 * brukeren ett tydelig 44 px mål og holder caret + tekst samlet, uten å legge
 * en navigasjonspil i maskotens nedre høyre overlappssone.
 */
import './hjem-monter.css';
import type { WeatherNuance } from './WeatherScene.js';
import { hjemCopyFor } from './hjem-copy.js';

export type WeatherStripProps = Readonly<{
  nuance: WeatherNuance;
  tempC: number;
  feelsLikeC: number;
  conditionLabel: string;
  cityLabel: string;
  activityToggleLabel: string;
  weatherIconSrc: string | null;
  weatherIconAlt: string;
  language?: string | null;
  onAdjust: () => void;
}>;

function formatTempDisplay(tempC: number): string {
  const rounded = Math.round(tempC);
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SelectorCaretIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

export function WeatherStrip({
  nuance,
  tempC,
  feelsLikeC,
  conditionLabel,
  cityLabel,
  activityToggleLabel,
  weatherIconSrc,
  weatherIconAlt,
  language,
  onAdjust,
}: WeatherStripProps) {
  const copy = hjemCopyFor(language);
  return (
    <section
      className="hjm-strip"
      data-nuance={nuance}
      aria-label={copy.weather.panelAria(cityLabel)}
    >
      <div className="hjm-strip__forecast">
        <span className="hjm-s-temp">{formatTempDisplay(tempC)}°</span>
        <span className="hjm-s-meta">
          <strong>{`${copy.weather.feelsLike(formatTempDisplay(feelsLikeC))} · ${conditionLabel}`}</strong>
          <span>{cityLabel}</span>
        </span>
        <span className="hjm-s-weather" aria-hidden="true">
          {weatherIconSrc ? (
            <img src={weatherIconSrc} alt={weatherIconAlt} draggable={false} />
          ) : null}
        </span>
      </div>
      <button
        type="button"
        className="hjm-strip__situation ba-press"
        aria-label={`${copy.weather.adjustAria}: ${activityToggleLabel}`}
        onClick={onAdjust}
      >
        <LocationPinIcon />
        <span className="hjm-strip__situation-label">{copy.weather.situation}</span>
        <strong>{activityToggleLabel}</strong>
        <SelectorCaretIcon />
      </button>
    </section>
  );
}
