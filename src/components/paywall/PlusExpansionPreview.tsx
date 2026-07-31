/**
 * PlusExpansionPreview — paywallens verdi-seksjon.
 *
 * Hard paywall (2026-07-31, PRODUCT.md): reframet fra Free→Plus-delta
 * («utvider seg»-visualisering) til en enkel, hele-produktet bullet-liste —
 * det finnes ikke lenger en gratis-tilstand å utvide fra. Beholder én
 * kort 500–600ms inn-animasjon når seksjonen mountes (ved reduced-motion
 * vises slutt-tilstanden umiddelbart).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { CapabilityPaywallPreviewItem } from '../../lib/premium/paywall-copy';

const STYLE_CSS = `
@keyframes plus-exp-in {
  from { opacity: 0; transform: scale(0.96) translateY(6px); }
  to   { opacity: 1; transform: none; }
}
.plus-exp[data-animate="on"] {
  animation: plus-exp-in 600ms var(--ease-standard) both;
}
@media (prefers-reduced-motion: reduce) {
  .plus-exp[data-animate="on"] { animation: none; }
}
`;

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 14px',
  borderRadius: 14,
  background: 'var(--surface-soft)',
  border: '1px solid var(--ink-100)',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
};

const checkStyle: CSSProperties = {
  flex: 'none',
  color: 'var(--accent-cta)',
  lineHeight: 1.4,
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 640,
  lineHeight: 1.4,
  color: 'var(--ink-900)',
};

export function PlusExpansionPreview({
  items,
  reducedMotion = false,
}: {
  items: readonly CapabilityPaywallPreviewItem[];
  reducedMotion?: boolean;
}): ReactElement | null {
  if (items.length === 0) return null;

  return (
    <section
      className="plus-exp"
      data-animate={reducedMotion ? 'off' : 'on'}
      style={wrapStyle}
      aria-label="Dette får du med Babyora Pluss"
    >
      <style>{STYLE_CSS}</style>
      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item.key} style={rowStyle}>
            <span aria-hidden="true" style={checkStyle}>✓</span>
            <span style={labelStyle}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
