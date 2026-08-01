/**
 * VerticalGauge — P10/JOB4 (owner redesign 2026-08-01): shared vertical
 * instrument column for FinnAntrekkScreen's three sliders (temperatur/
 * vind/nedbør), so the calculator reads as ONE instrument-panel row instead
 * of a mixed vertical-thermometer + two horizontal-sliders layout (the
 * mixed layout is explicitly what the owner rejected).
 *
 * Every column shares the exact same top-to-bottom structure: uppercase
 * label → prominent tabular-nums value → vertical track (min/max labels at
 * the ends, 44pt-wide touch target) → a +/- fine-step button pair below the
 * track (44pt each). Reuses the SAME native-range-in-full-track-size a11y
 * technique TemperatureInstrument.tsx (R7 Task 3A) already established
 * (opacity:0 vertical `<input type="range">` layered over decorative
 * graphics) — `aria-orientation="vertical"` is the one addition native
 * range doesn't provide on its own; valuemin/max/now come free from the
 * browser, and arrow-key stepping works with zero extra wiring.
 *
 * Colour is caller-supplied (`fillBottomColor`/`fillTopColor`) so the
 * temperature column can keep its own cold→warm gradient identity while
 * wind/nedbør use a flat warm amber fill (`var(--dw-accent)`) — see
 * FinnAntrekkScreen.tsx's three call sites.
 */
import type { CSSProperties, ReactElement } from 'react';
import './vertical-gauge.css';

export type VerticalGaugeProps = Readonly<{
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValueText: string;
  minLabel: string;
  maxLabel: string;
  fillBottomColor: string;
  fillTopColor: string;
  incrementLabel: string;
  decrementLabel: string;
  /** Track height in px — the owner's spec calls for ~200-220px, shared across all three columns. */
  height?: number;
  disabled?: boolean;
}>;

function clampFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function VerticalGauge({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
  ariaValueText,
  minLabel,
  maxLabel,
  fillBottomColor,
  fillTopColor,
  incrementLabel,
  decrementLabel,
  height = 208,
  disabled = false,
}: VerticalGaugeProps): ReactElement {
  const fraction = clampFraction(value, min, max);
  const atMin = value <= min;
  const atMax = value >= max;

  const fillStyle: CSSProperties = {
    height: `calc(${(fraction * 100).toFixed(2)}% - 6px)`,
    background: `linear-gradient(to top, ${fillBottomColor}, ${fillTopColor})`,
  };

  function stepBy(delta: number): void {
    if (disabled) return;
    const raw = value + delta;
    const clamped = Math.max(min, Math.min(max, raw));
    // Snap onto the step grid so repeated +/- taps never drift off it.
    const snapped = Math.round(clamped / step) * step;
    const next = Math.max(min, Math.min(max, snapped));
    if (next !== value) onChange(next);
  }

  return (
    <div className="fa-gauge">
      <p className="fa-gauge-label">{label}</p>
      <p className="fa-gauge-value" aria-hidden="true">{valueLabel}</p>
      <div className="fa-gauge-track-wrap" style={{ height }}>
        <span className="fa-gauge-end-label" aria-hidden="true">{maxLabel}</span>
        <div className="fa-gauge-track">
          <div aria-hidden="true" className="fa-gauge-fill" style={fillStyle} />
          <input
            type="range"
            className="fa-gauge-input"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={ariaLabel}
            aria-valuetext={ariaValueText}
            aria-orientation="vertical"
          />
        </div>
        <span className="fa-gauge-end-label" aria-hidden="true">{minLabel}</span>
      </div>
      <div className="fa-gauge-steps">
        <button
          type="button"
          className="fa-gauge-step"
          aria-label={decrementLabel}
          aria-disabled={atMin || disabled || undefined}
          onClick={() => !atMin && stepBy(-step)}
        >
          −
        </button>
        <button
          type="button"
          className="fa-gauge-step"
          aria-label={incrementLabel}
          aria-disabled={atMax || disabled || undefined}
          onClick={() => !atMax && stepBy(step)}
        >
          +
        </button>
      </div>
    </div>
  );
}
