/**
 * R7 Task 3 — delt segmentkontroll (verdivalg, ikke visnings-bytte).
 *
 * A11y-kontrakt (accessibility-lead 2026-07-14, samme som Task 15-mønsteret):
 *  - Native <input type="radio"> i <fieldset> MED <legend> (gruppen må ha navn).
 *  - Radioene skjules med clip-mønster — aldri display:none (dreper tastatur).
 *  - Valgt tilstand markeres med vekt + fyll, aldri farge alene.
 */

import { useId, type CSSProperties } from 'react';

export type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  legend: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (next: T) => void;
};

const srOnly: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
const group: CSSProperties = {
  display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999,
  background: 'var(--surface)', border: '1px solid var(--ink-200)',
};
const seg: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 36, minWidth: 44, padding: '6px 14px', borderRadius: 999,
  fontSize: 14, fontWeight: 500, color: 'var(--ink-700)', cursor: 'pointer',
};
const segChecked: CSSProperties = {
  ...seg, background: 'var(--accent-cta)', color: 'var(--accent-cta-ink)', fontWeight: 700,
};

export function SegmentedControl<T extends string>({ legend, options, value, onChange }: Props<T>) {
  const name = useId();
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={srOnly}>{legend}</legend>
      <div style={group}>
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label key={opt.value} style={checked ? segChecked : seg}>
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                style={srOnly}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
