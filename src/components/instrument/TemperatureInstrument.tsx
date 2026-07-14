/**
 * R7 Task 3A — signatur-temperaturinstrumentet (visual-signature-spec §3).
 *
 * Vertikal glass-tube med kontinuerlig kald→nøytral→varm-kolonne, gravert
 * skala og bånd-markører. IKKE fotorealistisk: to glass-highlights, én
 * inset-skygge, kontrollert kolonne-glød (spec §3 restraint).
 *
 * A11y-strategi B (accessibility-lead 2026-07-14, decisive pick):
 *  - Native <input type="range"> (min −20, max 30, step 1) med
 *    writing-mode: vertical-lr + direction: rtl (varm øverst), opacity 0,
 *    i full tube-størrelse — native pointer/tastatur/AT-adferd gratis.
 *  - All grafikk (tube/kolonne/skala/markører/verdi) er aria-hidden og
 *    drives av samme verdi.
 *  - aria-valuetext staver ut minus («minus 4 grader, kjølig»); plagg-
 *    konsekvensen annonseres av kallerens eksisterende debouncede
 *    role=status-region — ALDRI i valuetext.
 *  - ± er ekte knapper ≥44pt («Én grad kaldere/varmere»); aria-disabled på
 *    grensene (aldri disabled — fokus skal ikke dumpes).
 *  - Bånd-markører announceres ikke (valuetext bærer båndet).
 */

import { useMemo, type CSSProperties } from 'react';
import {
  INSTRUMENT_MAX_C, INSTRUMENT_MIN_C, bandAt, bandBoundaries,
  columnFraction, instrumentValueText, snapDegree,
} from './instrument-logic.js';

export type TemperatureInstrumentProps = {
  valueC: number;
  /** Båndtekst for aria-valuetext (samme som appens tempBandText). */
  bandText: (valueC: number) => string;
  onChange: (valueC: number) => void;
  disabled?: boolean;
  /** Høyde i px — laveste som består result-first-fixturen (spec: ≤360). */
  height?: number;
};

const TUBE_WIDTH = 56; // ≥44pt treffbredde + glass

const wrap: CSSProperties = { display: 'flex', gap: 14, alignItems: 'stretch' };
const tubeOuter: CSSProperties = {
  position: 'relative', width: TUBE_WIDTH, borderRadius: 28, flex: 'none',
  background: 'color-mix(in oklab, var(--surface-elevated) 78%, transparent)',
  boxShadow: 'inset 0 2px 6px color-mix(in oklab, black 24%, var(--bg-canvas)), inset 0 1px 0 color-mix(in oklab, white 18%, transparent)',
  overflow: 'hidden',
};
const columnStyle = (fraction: number, color: string): CSSProperties => ({
  position: 'absolute', left: 6, right: 6, bottom: 6,
  height: `calc(${(fraction * 100).toFixed(2)}% - 6px)`,
  borderRadius: 22,
  background: `linear-gradient(to top, var(--layer-bg-kald), ${color})`,
  boxShadow: `0 0 14px color-mix(in oklab, ${color} 35%, transparent)`,
  transition: 'height 160ms ease-out',
});
const rangeStyle: CSSProperties = {
  position: 'absolute', inset: 0, width: '100%', height: '100%',
  writingMode: 'vertical-lr', direction: 'rtl',
  opacity: 0, cursor: 'ns-resize', margin: 0,
};
const scaleCol: CSSProperties = {
  position: 'relative', width: 34, flex: 'none',
  fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--ink-500)',
};
const stepBtn: CSSProperties = {
  width: 44, height: 44, borderRadius: 14, border: '1.5px solid var(--ink-200)',
  background: 'var(--surface)', color: 'var(--ink-900)', fontSize: 20, fontWeight: 700,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

const BAND_COLOR: Record<string, string> = {
  ekstrem: 'var(--layer-bg-kald)', streng_frost: 'var(--layer-bg-kald)',
  frost: 'var(--layer-bg-kald)', kald: 'var(--layer-bg-kald)',
  kjolig: 'var(--accent-temp)', mild: 'var(--accent-temp)',
  varm: 'var(--layer-bg-varm)', tropisk: 'var(--layer-bg-varm)',
  ekstrem_varme: 'var(--layer-bg-varm)',
};

export function TemperatureInstrument({
  valueC, bandText, onChange, disabled = false, height = 300,
}: TemperatureInstrumentProps) {
  const snapped = snapDegree(valueC);
  const fraction = columnFraction(snapped);
  const boundaries = useMemo(() => bandBoundaries(), []);
  const color = BAND_COLOR[bandAt(snapped)] ?? 'var(--accent-temp)';
  const atMin = snapped <= INSTRUMENT_MIN_C;
  const atMax = snapped >= INSTRUMENT_MAX_C;

  const step = (delta: 1 | -1) => {
    if (disabled) return;
    const next = snapDegree(snapped + delta);
    if (next !== snapped) onChange(next);
  };

  return (
    <div style={{ ...wrap, height }}>
      {/* ± eksakt-justering — garantert 1°-vei for AT (lead-krav 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <button
          type="button" style={{ ...stepBtn, opacity: atMax ? 0.45 : 1 }}
          aria-label="Én grad varmere" aria-disabled={atMax || disabled || undefined}
          onClick={() => !atMax && step(1)}
        >+</button>
        <button
          type="button" style={{ ...stepBtn, opacity: atMin ? 0.45 : 1 }}
          aria-label="Én grad kaldere" aria-disabled={atMin || disabled || undefined}
          onClick={() => !atMin && step(-1)}
        >−</button>
      </div>

      {/* Tuben — native range i full størrelse over grafikken */}
      <div style={tubeOuter}>
        <div aria-hidden="true" style={columnStyle(fraction, color)} />
        {boundaries.map((b) => (
          <span
            key={b} aria-hidden="true"
            style={{
              position: 'absolute', left: 4, right: 4,
              bottom: `${(columnFraction(b) * 100).toFixed(2)}%`,
              height: 1, background: 'color-mix(in oklab, var(--ink-900) 22%, transparent)',
            }}
          />
        ))}
        <input
          type="range"
          min={INSTRUMENT_MIN_C} max={INSTRUMENT_MAX_C} step={1}
          value={snapped}
          disabled={disabled}
          onChange={(e) => onChange(snapDegree(Number(e.target.value)))}
          aria-label="Temperatur i celsius"
          aria-valuetext={instrumentValueText(snapped, bandText(snapped))}
          style={rangeStyle}
        />
      </div>

      {/* Gravert skala (dekorativ — valuetext bærer verdien) */}
      <div aria-hidden="true" style={scaleCol}>
        {[30, 20, 10, 0, -10, -20].map((t) => (
          <span
            key={t}
            style={{
              position: 'absolute', left: 0,
              bottom: `calc(${(columnFraction(t) * 100).toFixed(2)}% - 6px)`,
            }}
          >{t}°</span>
        ))}
      </div>
    </div>
  );
}
