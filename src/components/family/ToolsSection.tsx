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
import { useTranslation } from 'react-i18next';
import type { FamilieToolTarget } from '../../types/nav';
import { SettingsRow } from '../controls/SettingsRow';

export interface ToolsSectionProps {
  onOpenTool: (target: FamilieToolTarget) => void;
}

interface ToolRowDef {
  target: FamilieToolTarget;
  labelKey: string;
  subKey: string;
}

const TOOL_ROWS: ReadonlyArray<ToolRowDef> = [
  { target: 'tog', labelKey: 'settings.family.sleepGuide', subKey: 'settings.family.sleepGuideSub' },
  { target: 'varm-kald', labelKey: 'settings.family.temperatureGuide', subKey: 'settings.family.temperatureGuideSub' },
  { target: 'forste-vinter', labelKey: 'settings.family.firstWinter', subKey: 'settings.family.firstWinterSub' },
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
  /* D2: kortet ER en ekte hevet gruppeflate — det er nettopp flaten D1 krever
     at hårstrek-radene under sitter på. Riktig retting er derfor lyslogikk,
     ikke å fjerne fyllet. `var(--shadow-cta)` var kun YTRE skygge; den
     kompatible formen legger til det 1 px varme innerlyset på toppkanten. */
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};








function Chevron(): ReactElement {
  return (
    /* Pila trenger ingen egen wrapper-stil lenger — primitivens
       høyre-slot eier plasseringen. */
    <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
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
  const { t } = useTranslation();

  return (
    <section style={sectionStyle} aria-labelledby="sec-verktoy">
      <h2 id="sec-verktoy" style={sectionEyebrowStyle}>{t('settings.family.tools')}</h2>
      <ul role="list" style={groupCardStyle} aria-label={t('settings.family.toolsAria')}>
        {/* Radene her var en ORDRETT kopi av Innstillingers seks stilobjekter,
            tegn for tegn. Nå samme primitiv, så en endring ett sted ikke lar
            det andre stedet drive fra hverandre i stillhet. */}
        {TOOL_ROWS.map((row, i) => (
          <li key={row.target} style={{ listStyle: 'none' }}>
            <SettingsRow
              icon={<ToolIcon />}
              label={t(row.labelKey)}
              sub={t(row.subKey)}
              trailing={<Chevron />}
              divider={i < TOOL_ROWS.length - 1}
              onClick={() => onOpenTool(row.target)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ToolsSection;
