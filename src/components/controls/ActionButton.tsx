/**
 * R7 Task 3 — delt handlingsknapp (mynte = handling, per fargeloven).
 *
 * A11y-kontrakt (accessibility-lead 2026-07-14):
 *  - Pending: aria-busy + KLIKKVAKT — aldri `disabled` (dumper fokus), og
 *    det tilgjengelige navnet forblir stabilt (teksten byttes ikke til spinner).
 *    Utfallet annonseres av kallerens live-region, ikke av knappen.
 *  - ≥ 44 pt mål; fokusring via --focus-ring (≥ 3:1 mot alle varianter).
 */

import type { CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

type Props = {
  children: ReactNode;
  onClick: () => void;
  variant?: Variant;
  pending?: boolean;
  ariaLabel?: string;
};

const base: CSSProperties = {
  minHeight: 44, padding: '10px 18px', borderRadius: 14,
  fontSize: 15, fontWeight: 650, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: { ...base, border: 0, background: 'var(--accent-cta)', color: 'var(--accent-cta-ink)' },
  secondary: { ...base, border: '1.5px solid var(--accent-cta)', background: 'transparent', color: 'var(--accent-cta)' },
  quiet: { ...base, border: 0, background: 'transparent', color: 'var(--ink-700)' },
};

export function ActionButton({ children, onClick, variant = 'primary', pending = false, ariaLabel }: Props) {
  return (
    <button
      type="button"
      style={{ ...VARIANTS[variant], opacity: pending ? 0.7 : 1 }}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      aria-label={ariaLabel}
      onClick={() => {
        if (pending) return; // klikkvakt — fokus beholdes, ingen disabled
        onClick();
      }}
    >
      {children}
    </button>
  );
}
