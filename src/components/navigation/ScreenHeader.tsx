/**
 * R7 Task 3 — delt drill-header.
 *
 * A11y-kontrakt (accessibility-lead 2026-07-14):
 *  - Ved drill-åpning fokuseres H1 (tabindex=-1, ingen synlig ring på det
 *    programmatiske målet) — overskriften forteller HVOR brukeren landet.
 *  - Tilbake-knappen er første tab-stopp etter H1: <button type="button">
 *    med aria-label="Tilbake", 44 pt mål.
 *  - Fokus-retur til opener ved lukking eies av App-skallet (eksisterende
 *    mønster); bunn-nav i drills fjernes fra DOM (aldri ghost-tab-stops).
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type Props = {
  title: string;
  onBack: () => void;
  /** Valgfritt handlingsfelt til høyre (f.eks. Rediger). */
  action?: ReactNode;
  /** Fokuser H1 ved mount (default true — drills skal alltid annonsere seg). */
  autoFocusTitle?: boolean;
};

const bar: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 12px', minHeight: 56,
};
const backBtn: CSSProperties = {
  width: 44, height: 44, flex: 'none', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
  border: 0, borderRadius: 14, background: 'transparent',
  color: 'var(--ink-900)', cursor: 'pointer',
};
const titleStyle: CSSProperties = {
  margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--ink-900)',
  outline: 'none', // programmatisk fokus-mål — ingen synlig ring
  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

export function ScreenHeader({ title, onBack, action, autoFocusTitle = true }: Props) {
  const h1Ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (autoFocusTitle) h1Ref.current?.focus();
  }, [autoFocusTitle]);

  return (
    <header style={bar}>
      <h1 ref={h1Ref} tabIndex={-1} style={{ ...titleStyle, order: 1 }}>{title}</h1>
      <button type="button" aria-label="Tilbake" onClick={onBack} style={{ ...backBtn, order: 0 }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      {action !== undefined && <div style={{ order: 2, flex: 'none' }}>{action}</div>}
    </header>
  );
}
