/**
 * ToolsSection — P1 (nav 4→3 skeleton, 2026-07-30).
 *
 * Familie sin nye "Verktøy"-seksjon. Guide-tab-roten er fjernet (se
 * src/types/nav.ts); de tre tidligere Guide-"kunnskap"-kortene
 * (TOG-guiden/"Soveguiden", Varm eller kald?, Første vinter) trenger et nytt
 * entry-point slik at skjermene deres (uendret) forblir nåbare. Dette er
 * ren funksjonell wiring — den visuelle Monter-redesignen av Familie-roten
 * kommer i en senere arbeidspakke.
 *
 * Følger CareCircle.tsx sitt ekstraksjons-mønster: selvstendig komponent i
 * src/components/family/ med egne lokale stiler bygget direkte på
 * design-tokens (var(--...)) — ingen avhengighet av InnstillingerScreen sine
 * private lokale hjelpekomponenter (Section/NavRow er ikke eksportert der).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { FamilieToolTarget } from '../../types/nav';

export interface ToolsSectionProps {
  onOpenTool: (target: FamilieToolTarget) => void;
}

interface ToolRowDef {
  target: FamilieToolTarget;
  label: string;
  sub: string;
}

const TOOL_ROWS: ReadonlyArray<ToolRowDef> = [
  { target: 'tog', label: 'Soveguiden', sub: 'Riktig sovepose for romtemperatur' },
  { target: 'varm-kald', label: 'Varm eller kald?', sub: 'Tre raske spørsmål om barnets temperatur' },
  { target: 'forste-vinter', label: 'Første vinter', sub: 'Åtte korte leksjoner, én i uka' },
];

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const sectionEyebrowStyle: CSSProperties = {
  fontSize: '0.65625rem',
  fontWeight: 600,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  color: 'var(--ink-500)',
  margin: '0 4px',
  lineHeight: 1,
};

const groupCardStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  background: 'var(--surface)',
  borderRadius: 16,
  overflow: 'hidden',
  border: '1px solid var(--ink-100)',
  boxShadow: 'var(--shadow-cta)',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '13px 14px',
  minHeight: 52,
  width: '100%',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
  color: 'var(--ink-800)',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
};

const rowIconStyle: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  borderRadius: 9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-canvas-soft)',
  color: 'var(--ink-700)',
  border: '1px solid var(--ink-100)',
};

const rowBodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const rowLabelStyle: CSSProperties = {
  fontSize: '0.90625rem',
  fontWeight: 500,
  color: 'var(--ink-900)',
  letterSpacing: '-0.1px',
  lineHeight: 1.15,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const rowSubStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  letterSpacing: '.05px',
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const rowChevronStyle: CSSProperties = {
  flex: 'none',
  color: 'var(--ink-300)',
  display: 'flex',
  alignItems: 'center',
};

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--ink-100)',
  margin: '0 14px',
};

function Chevron(): ReactElement {
  return (
    <span style={rowChevronStyle} aria-hidden="true">
      <svg
        width={7}
        height={12}
        viewBox="0 0 7 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable={false}
      >
        <path d="M1 1l5 5-5 5" />
      </svg>
    </span>
  );
}

function ToolIcon(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2h4v4l2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8l2-2V2h4z" />
    </svg>
  );
}

export function ToolsSection({ onOpenTool }: ToolsSectionProps): ReactElement {
  return (
    <section style={sectionStyle} aria-labelledby="sec-verktoy">
      <h2 id="sec-verktoy" style={sectionEyebrowStyle}>Verktøy</h2>
      <ul role="list" style={groupCardStyle} aria-label="Verktøy fra Guide">
        {TOOL_ROWS.map((row, i) => (
          <li key={row.target} style={{ listStyle: 'none' }}>
            <button
              type="button"
              style={rowStyle}
              onClick={() => onOpenTool(row.target)}
              aria-label={`${row.label} — ${row.sub}`}
            >
              <span style={rowIconStyle} aria-hidden="true">
                <ToolIcon />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{row.label}</span>
                <span style={rowSubStyle}>{row.sub}</span>
              </span>
              <Chevron />
            </button>
            {i < TOOL_ROWS.length - 1 ? (
              <div aria-hidden="true" style={dividerStyle} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ToolsSection;
