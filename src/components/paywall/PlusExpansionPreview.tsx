/**
 * PlusExpansionPreview — paywallens verdi-seksjon (R7 Task 7).
 *
 * Viser Free→Plus som en «verden som utvider seg»: gratis-tilstanden til
 * venstre, Plus-tilstanden til høyre, med ÉN 500–700ms ekspansjon når
 * seksjonen mountes. Ved reduced-motion vises slutt-tilstanden umiddelbart
 * (ingen animasjon).
 *
 * SANNFERDIGHET: rendrer bare elementene den capability-avledede
 * `buildCapabilityPaywallCopy`-grensen har godkjent. Returnerer null hvis
 * ingen aktiv kapabilitet gir et leverbart løfte.
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

const eyebrowStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--ink-500)',
  margin: 0,
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: 8,
};

const fromStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--ink-500)',
  textAlign: 'right',
};

const arrowStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--ink-400)',
  flex: 'none',
};

const toStyle: CSSProperties = {
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
      <p style={eyebrowStyle}>Med Pluss</p>
      <ul style={listStyle}>
        {items.map((e) => (
          <li key={e.key} style={rowStyle}>
            <span style={fromStyle}>{e.from}</span>
            <span aria-hidden="true" style={arrowStyle}>→</span>
            <span style={toStyle}>{e.to}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
