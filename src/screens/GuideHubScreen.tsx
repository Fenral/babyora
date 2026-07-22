/**
 * GuideHubScreen — F80b PROD-PORT av "Morgennatt" til Guide-huben.
 *
 * Kilder (les FØR endring):
 *  - docs/F80/a11y-preclearance.md — §5: søk-knappen fjernes HELT fra DOM
 *  - docs/F79/guide-analyse.md — Guide-løftet (fasit-autoritet, tiltak 3)
 *  - src/styles/design-tokens.css — Morgennatt-vars (kun var(--...))
 *  - src/screens/HjemScreen.tsx — porterte Morgennatt-mønstre
 *
 * Hub for guide-sub-sider. Layout:
 *  - Appbar: brand-crumb (søk-knappen er FJERNET — se F80/guide-analyse.md,
 *    den var en tillits-bug: fyrte kun haptikk, gjorde ingenting)
 *  - Editorial headline: "Guide"
 *  - Hero-CTA: "Finn antrekk" — autoritets-copy (Guide-løftet tiltak 3):
 *    "Kleskalkulatoren — bygget på norske helsesøster-råd og TOG-standarden"
 *  - Eyebrow "VERKTØY" + bilde-ledede kort (Plaggbiblioteket + Min garderobe)
 *  - Eyebrow "KUNNSKAP" + farge-stripe-kort (TOG-guiden + Varm eller kald?)
 *  - Footer hint
 *  - BottomTabBar (Guide aktiv)
 *
 * Sone 3 (nøytral hub) — INGEN temp-akse her, ren var(--bg-canvas) uansett vær.
 *
 * A11y:
 *  - <main> + <nav> semantikk
 *  - <h1>/<h2> ranger korrekt
 *  - role="list" / role="listitem" på grupperte rader
 *  - aria-current="page" på aktiv tab (i BottomTabBar)
 *  - focus-visible ring (var(--focus-ring))
 *  - 44px touch-target på alle interactives
 *  - prefers-reduced-motion: drop press-scale
 */
import { useCallback, useState, type CSSProperties, type ReactElement } from 'react';
import type { TabKey } from '../types/nav';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
// BottomTabBar er nå global (mounted i App.tsx) — ikke importer/mount her.

export type GuideHubTarget =
  | 'finn-antrekk'
  | 'plaggbib'
  | 'min-garderobe'
  | 'tog'
  | 'varm-kald'
  | 'forste-vinter';

export interface GuideHubScreenProps {
  onNavigate: (tab: TabKey) => void;
  onOpenCard: (target: GuideHubTarget) => void;
}

interface ToolRowDef {
  target: GuideHubTarget;
  title: string;
  subtitle: string;
  tag: string;
  art: 'lib' | 'wardrobe';
}

interface KnowledgeRowDef {
  target: GuideHubTarget;
  title: string;
  subtitle: string;
  tone: 'tog' | 'temp';
}

/* ============================================================
   Styles (inline CSSProperties — design-tokens via var())
   ============================================================ */

const rootStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink-900)',
  /* Sone 3 (nøytral hub) — INGEN temp-akse, ren canvas uansett vær. */
  background: 'var(--bg-canvas)',
  paddingTop: 'max(54px, env(safe-area-inset-top, 0px))',
  paddingLeft: 0,
  paddingRight: 0,
  paddingBottom: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const sheenStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(110% 38% at 50% -6%, color-mix(in srgb, var(--surface-pure) 18%, transparent), transparent 58%),' +
    'radial-gradient(80% 30% at 78% 100%, color-mix(in srgb, var(--accent-cta) 6%, transparent), transparent 60%)',
  zIndex: 1,
};

const appbarStyle: CSSProperties = {
  position: 'relative',
  zIndex: 3,
  flex: 'none',
  padding: '6px 22px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const crumbStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '1.4px',
  textTransform: 'uppercase',
  color: 'var(--ink-500)',
};

const scrollContainerStyle: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '18px 22px 140px',
  WebkitOverflowScrolling: 'touch',
};

const headlineWrap: CSSProperties = {
  margin: '4px 0 22px',
};

const headlineH1: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 400,
  fontSize: 40,
  lineHeight: 1.02,
  letterSpacing: '-0.6px',
  color: 'var(--ink-900)',
  margin: 0,
};

/* HERO ---------------------------------------------------------- */

const heroButtonBase: CSSProperties = {
  position: 'relative',
  width: '100%',
  border: 'none',
  padding: 0,
  margin: '0 0 28px',
  cursor: 'pointer',
  textAlign: 'left',
  borderRadius: 26,
  overflow: 'hidden',
  background:
    'linear-gradient(150deg, var(--layer-innerst) 0%, var(--terracotta-600) 60%, var(--terracotta-700) 100%)',
  color: 'var(--accent-cta-ink)',
  boxShadow: 'var(--shadow-3)',
  font: 'inherit',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 44,
  boxSizing: 'border-box',
};

const heroArtWrap: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
};

const heroInner: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  // F68: reduser padding for mer kompakt CTA (vert 24→18, horisontal beholdt).
  padding: '18px 22px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const heroEyebrow: CSSProperties = {
  fontSize: '0.71875rem',
  fontWeight: 600,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  color: 'color-mix(in srgb, var(--accent-cta-ink) 82%, transparent)',
};

const heroTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 400,
  fontSize: 27,
  lineHeight: 1.14,
  letterSpacing: '-0.3px',
  color: 'var(--accent-cta-ink)',
  maxWidth: 260,
};

const heroSub: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.5,
  color: 'color-mix(in srgb, var(--accent-cta-ink) 82%, transparent)',
  maxWidth: 260,
};

const heroCta: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 18px',
  borderRadius: 999,
  background: 'var(--accent-cta)',
  color: 'var(--accent-cta-ink)',
  fontSize: '0.875rem',
  fontWeight: 600,
  letterSpacing: '-.1px',
  alignSelf: 'flex-start',
  marginTop: 4,
  border: '1px solid color-mix(in srgb, var(--accent-cta-ink) 18%, transparent)',
  boxShadow: 'var(--shadow-cta-primary)',
};

/* SECTIONS ------------------------------------------------------ */

const sectionStyle: CSSProperties = {
  marginTop: 8,
};

const sectionHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
  margin: '0 4px 14px',
};

const sectionEyebrow: CSSProperties = {
  fontSize: '0.71875rem',
  fontWeight: 600,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  color: 'var(--ink-500)',
  margin: 0,
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 400,
  fontSize: '1.375rem',
  lineHeight: 1,
  letterSpacing: '-.3px',
  color: 'var(--ink-900)',
  margin: '6px 0 0',
};

const sectionCount: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  fontVariantNumeric: 'tabular-nums',
};

/* TOOL CARDS ---------------------------------------------------- */

const toolGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 14,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const toolCardBase: CSSProperties = {
  position: 'relative',
  width: '100%',
  border: '1px solid var(--ink-200)',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
  borderRadius: 22,
  overflow: 'hidden',
  background: 'var(--surface)',
  boxShadow:
    '0 1px 2px var(--ink-100), 0 10px 24px var(--ink-100)',
  display: 'grid',
  gridTemplateColumns: '116px 1fr auto',
  alignItems: 'stretch',
  gap: 0,
  minHeight: 116,
  font: 'inherit',
  color: 'var(--ink-900)',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  boxSizing: 'border-box',
};

const toolArtBase: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
};

const toolArtLib: CSSProperties = {
  background:
    'radial-gradient(120% 80% at 30% 30%, color-mix(in srgb, var(--surface-pure) 85%, transparent), transparent 60%),' +
    'linear-gradient(150deg, var(--terracotta-200) 0%, var(--terracotta-400) 100%)',
};

const toolArtWardrobe: CSSProperties = {
  background:
    'radial-gradient(120% 80% at 30% 30%, color-mix(in srgb, var(--surface-pure) 85%, transparent), transparent 60%),' +
    'linear-gradient(150deg, var(--surface-soft) 0%, var(--lag-petrolgra) 100%)',
};

const toolBody: CSSProperties = {
  padding: '18px 14px 16px 18px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 4,
  minWidth: 0,
};

const toolTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 400,
  fontSize: '1.1875rem',
  lineHeight: 1.1,
  letterSpacing: '-.2px',
  color: 'var(--ink-900)',
};

const toolSub: CSSProperties = {
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  color: 'var(--ink-700)',
  fontWeight: 500,
};

const toolTag: CSSProperties = {
  marginTop: 8,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 9px',
  borderRadius: 999,
  background: 'var(--terracotta-100)',
  color: 'var(--terracotta-700)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '.2px',
  alignSelf: 'flex-start',
};

const toolChev: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 18px 0 8px',
  color: 'var(--ink-500)',
};

/* KNOWLEDGE CARDS ---------------------------------------------- */

const knowList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const knowCardBase: CSSProperties = {
  position: 'relative',
  width: '100%',
  border: '1px solid var(--ink-200)',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
  borderRadius: 20,
  overflow: 'hidden',
  background: 'var(--surface)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow:
    '0 1px 2px var(--ink-100), 0 10px 24px var(--ink-100)',
  display: 'grid',
  gridTemplateColumns: '6px 64px 1fr auto',
  alignItems: 'center',
  gap: 0,
  minHeight: 88,
  font: 'inherit',
  color: 'var(--ink-900)',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  boxSizing: 'border-box',
};

const knowStripTog: CSSProperties = {
  height: '100%',
  width: 6,
  background: 'linear-gradient(180deg, var(--lag-petrolgra) 0%, var(--lag-dyppetrol) 100%)',
};

const knowStripTemp: CSSProperties = {
  height: '100%',
  width: 6,
  background: 'linear-gradient(180deg, var(--terracotta-400) 0%, var(--terracotta-600) 100%)',
};

const knowIco: CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: 14,
};

const knowBadge: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 14,
  background: 'var(--bg-canvas-soft)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--ink-200)',
};

const knowBody: CSSProperties = {
  padding: '16px 14px 16px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
};

const knowTitle: CSSProperties = {
  fontWeight: 600,
  fontSize: '0.96875rem',
  lineHeight: 1.2,
  letterSpacing: '-.1px',
  color: 'var(--ink-900)',
};

const knowSub: CSSProperties = {
  fontSize: '0.8125rem',
  lineHeight: 1.4,
  color: 'var(--ink-700)',
  fontWeight: 500,
};

const knowChev: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 18px 0 8px',
  color: 'var(--ink-500)',
};

/* FOOTER -------------------------------------------------------- */

const footerHint: CSSProperties = {
  marginTop: 28,
  padding: '18px 18px',
  borderRadius: 18,
  background: 'var(--ink-100)',
  border: '1px dashed var(--ink-200)',
  color: 'var(--ink-700)',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  textAlign: 'center',
};

const footerHintStrong: CSSProperties = {
  color: 'var(--ink-900)',
  fontWeight: 600,
};

const focusRingStyle: CSSProperties = {
  outline: '2px solid var(--focus-ring)',
  outlineOffset: 2,
};

/* ============================================================
   Icon components
   ============================================================ */

function ChevronRight({
  color = 'currentColor',
  width = 9,
  height = 16,
  opacity = 0.85,
  strokeWidth = 2,
}: {
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
  strokeWidth?: number;
}): ReactElement {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 8 14"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 1l6 6-6 6" />
    </svg>
  );
}

function ArrowRight(): ReactElement {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function TogIcon(): ReactElement {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--lag-dyppetrol)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 2h6v4l3 4v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-8l3-4z" />
      <path d="M9 2v4M15 2v4" />
    </svg>
  );
}

function TempIcon(): ReactElement {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--terracotta-600)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0V4z" />
      <circle cx="12" cy="18" r="1.6" fill="var(--terracotta-600)" stroke="none" />
    </svg>
  );
}

/* Hero decorative art — rings + sun */
function HeroArt(): ReactElement {
  return (
    <div style={heroArtWrap} aria-hidden="true">
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          top: -110,
          right: -90,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, .14)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          top: -50,
          right: -30,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, .22)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          top: -10,
          right: 10,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, .12)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -34,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 40% 38%, rgba(255,220,180,.55), rgba(255,220,180,0) 62%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          mixBlendMode: 'overlay',
          opacity: 0.6,
        }}
      />
    </div>
  );
}

/* Tool art SVGs */
function ToolArtLibSvg(): ReactElement {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ghb-lib-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--terracotta-200)" />
          <stop offset="1" stopColor="var(--terracotta-400)" />
        </linearGradient>
        <linearGradient id="ghb-lib-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--terracotta-400)" />
          <stop offset="1" stopColor="var(--terracotta-600)" />
        </linearGradient>
        <linearGradient id="ghb-lib-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--lag-marigold)" />
          <stop offset="1" stopColor="var(--chip-edge-marigold)" />
        </linearGradient>
      </defs>
      <rect x="22" y="30" width="76" height="18" rx="4" fill="url(#ghb-lib-a)" opacity=".95" />
      <rect x="22" y="30" width="76" height="3" rx="1.5" fill="var(--surface-pure)" opacity=".5" />
      <rect x="18" y="54" width="84" height="20" rx="5" fill="url(#ghb-lib-c)" />
      <rect x="18" y="54" width="84" height="3" rx="1.5" fill="var(--surface-pure)" opacity=".22" />
      <rect x="14" y="80" width="92" height="24" rx="6" fill="url(#ghb-lib-b)" />
      <rect x="14" y="80" width="92" height="3" rx="1.5" fill="var(--surface-pure)" opacity=".28" />
      <line x1="60" y1="80" x2="60" y2="104" stroke="var(--ink-900)" strokeOpacity=".12" strokeWidth="1" />
    </svg>
  );
}

function ToolArtWardrobeSvg(): ReactElement {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
      focusable="false"
    >
      <line
        x1="14"
        y1="34"
        x2="106"
        y2="34"
        stroke="var(--ink-700)"
        strokeOpacity=".55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g transform="translate(30,34)">
        <path
          d="M0 0 v3 a2 2 0 0 0 2 2 h-2 z"
          fill="none"
          stroke="var(--ink-700)"
          strokeOpacity=".55"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M-14 14 Q0 4 14 14 L20 38 Q0 46 -20 38 Z" fill="var(--terracotta-400)" opacity=".92" />
        <path
          d="M-8 10 Q0 6 8 10"
          stroke="var(--surface-pure)"
          strokeOpacity=".35"
          strokeWidth="1.2"
          fill="none"
        />
      </g>
      <g transform="translate(70,34)">
        <path
          d="M0 0 v3 a2 2 0 0 0 2 2 h-2 z"
          fill="none"
          stroke="var(--ink-700)"
          strokeOpacity=".55"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M-12 12 Q0 6 12 12 L8 22 L10 50 L2 50 L0 30 L-2 50 L-10 50 L-8 22 Z"
          fill="var(--lag-petrolgra)"
          opacity=".88"
        />
      </g>
      <circle cx="98" cy="92" r="12" fill="var(--surface-pure)" opacity=".95" />
      <path
        d="M92 92 l4 4 l8 -8"
        stroke="var(--status-ok)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ============================================================
   Pressable wrapper — handles press scale + focus ring
   ============================================================ */

interface PressableProps {
  reducedMotion: boolean;
  onActivate: () => void;
  ariaLabel: string;
  children: ReactElement | ReactElement[];
  base: CSSProperties;
  pressScale: number;
  pressBg?: string;
  pressShadow?: string;
}

function Pressable({
  reducedMotion,
  onActivate,
  ariaLabel,
  children,
  base,
  pressScale,
  pressBg,
  pressShadow,
}: PressableProps): ReactElement {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const transform =
    pressed && !reducedMotion ? `scale(${pressScale})` : 'scale(1)';

  const style: CSSProperties = {
    ...base,
    transform,
    transition: reducedMotion
      ? 'none'
      : 'transform 160ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms cubic-bezier(.2,.8,.2,1), background 100ms ease',
    ...(pressed && pressBg ? { background: pressBg } : null),
    ...(pressed && pressShadow ? { boxShadow: pressShadow } : null),
    ...(focused ? focusRingStyle : null),
  };

  return (
    <button
      type="button"
      style={style}
      aria-label={ariaLabel}
      onClick={onActivate}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </button>
  );
}

/* ============================================================
   Data
   ============================================================ */

const TOOL_ROWS: ToolRowDef[] = [
  {
    target: 'plaggbib',
    title: 'Plaggbiblioteket',
    subtitle: 'Se alle plagg etter kategori og lag',
    tag: 'Bla i alle plagg',
    art: 'lib',
  },
  {
    target: 'min-garderobe',
    title: 'Min garderobe',
    subtitle: 'Velg plagg du eier — få bedre forslag',
    tag: 'Personliggjør',
    art: 'wardrobe',
  },
];

const KNOWLEDGE_ROWS: KnowledgeRowDef[] = [
  {
    // F86: «Første vinter»-programmet. Oversikten er gratis (leksjon 1 =
    // smakebit) — kortet trenger derfor ingen Pluss-merking; gating skjer
    // per leksjon inne i programmet.
    target: 'forste-vinter',
    title: 'Første vinter med baby',
    subtitle: 'Åtte korte leksjoner, én i uka',
    tone: 'temp',
  },
  {
    target: 'tog',
    title: 'Soving innendørs',
    subtitle: 'Riktig sovepose for romtemperatur',
    tone: 'tog',
  },
  {
    target: 'varm-kald',
    title: 'Varm eller kald?',
    subtitle: 'Tre raske spørsmål om barnets temperatur',
    tone: 'temp',
  },
];

/* ============================================================
   Main
   ============================================================ */

export function GuideHubScreen({
  onNavigate,
  onOpenCard,
}: GuideHubScreenProps): ReactElement {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();

  const triggerHaptic = useCallback(
    (style: 'light' | 'medium' = 'light') => {
      void fire(style);
    },
    [fire],
  );

  const handleOpenCard = useCallback(
    (target: GuideHubTarget, style: 'light' | 'medium') => {
      triggerHaptic(style);
      onOpenCard(target);
    },
    [onOpenCard, triggerHaptic],
  );

  // handleNavigate + activeTab fjernet: BottomTabBar er nå global i App.tsx
  // og leveres `onNavigate` direkte. `onNavigate`-prop beholdes i signaturen
  // for fremtidig bruk (in-screen navigasjon), men er ikke trigget herfra.
  void onNavigate;

  // F68: meta-pills (vær + lag) droppet — info kommer uansett i FinnAntrekk.
  // F69: headline forenklet til "Guide" — childName ikke lenger brukt.

  return (
    <main style={rootStyle} aria-labelledby="guide-hub-title">
      <div style={sheenStyle} aria-hidden="true" />

      {/* App bar — crumb. Søk-knappen er FJERNET (tillits-bug, se filhode):
          fyrte kun haptikk og gjorde ingenting — fjernet HELT fra DOM,
          ikke skjult med display:none (som ville etterlatt et tab-stopp). */}
      <header style={appbarStyle}>
        <div style={crumbStyle} aria-hidden="true">
          Babyora
        </div>
      </header>

      {/* Scroll-container */}
      <div style={scrollContainerStyle}>
        {/* Headline */}
        <div style={headlineWrap}>
          <h1 id="guide-hub-title" style={headlineH1}>Guide</h1>
        </div>

        {/* HERO CARD — Finn antrekk. Copy-fix (Guide-løftet tiltak 3,
            docs/F79/guide-analyse.md): "AI-drevet" er anti-fasit i en
            diskusjon med bestemor — "kalkulator basert på helsesøster-
            standarden" er sterkere enn "appen sier". Motoren er dessuten
            en deterministisk regelmotor, ikke AI, så "AI-drevet" var også
            upresist. "juster fritt" (lekegrind-tone) byttet til
            instrument-tone. */}
        <Pressable
          reducedMotion={reducedMotion}
          pressScale={0.985}
          base={heroButtonBase}
          ariaLabel="Kleskalkulatoren — bygget på norske helsesøster-råd og TOG-standarden"
          onActivate={() => handleOpenCard('finn-antrekk', 'medium')}
        >
          <HeroArt />
          <div style={heroInner}>
            <div style={heroEyebrow}>Anbefalt nå</div>
            <div style={heroTitle}>
              Kleskalkulatoren
            </div>
            <div style={heroSub}>
              Bygget på norske helsesøster-råd og TOG-standarden — basert på
              været nå.
            </div>

            {/* F68: meta-pills droppet — info kommer uansett under. */}

            <span style={heroCta}>
              Start
              <ArrowRight />
            </span>
          </div>
        </Pressable>

        {/* VERKTØY */}
        <section style={sectionStyle} aria-labelledby="guide-tools-heading">
          <div style={sectionHeadStyle}>
            <div>
              <p style={sectionEyebrow}>Verktøy</p>
              <h2 id="guide-tools-heading" style={sectionTitle}>
                Bla i&nbsp;garderoben
              </h2>
            </div>
            <span style={sectionCount} aria-hidden="true">
              {TOOL_ROWS.length}
            </span>
          </div>

          <ul role="list" style={toolGrid}>
            {TOOL_ROWS.map((row) => (
              <li key={row.target} role="listitem" style={{ listStyle: 'none' }}>
                <Pressable
                  reducedMotion={reducedMotion}
                  pressScale={0.99}
                  pressShadow="var(--shadow-2)"
                  base={toolCardBase}
                  ariaLabel={`${row.title} — ${row.subtitle}`}
                  onActivate={() => handleOpenCard(row.target, 'light')}
                >
                  <div
                    style={{
                      ...toolArtBase,
                      ...(row.art === 'lib' ? toolArtLib : toolArtWardrobe),
                    }}
                    aria-hidden="true"
                  >
                    {row.art === 'lib' ? <ToolArtLibSvg /> : <ToolArtWardrobeSvg />}
                  </div>

                  <div style={toolBody}>
                    <div style={toolTitle}>{row.title}</div>
                    <div style={toolSub}>{row.subtitle}</div>
                    <span style={toolTag} aria-hidden="true">
                      <svg
                        width={9}
                        height={9}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <circle cx="12" cy="12" r="6" />
                      </svg>
                      {row.tag}
                    </span>
                  </div>

                  <div style={toolChev} aria-hidden="true">
                    <ChevronRight
                      color="currentColor"
                      width={9}
                      height={16}
                      opacity={1}
                    />
                  </div>
                </Pressable>
              </li>
            ))}
          </ul>
        </section>

        {/* KUNNSKAP */}
        <section style={{ ...sectionStyle, marginTop: 32 }} aria-labelledby="guide-knowledge-heading">
          <div style={sectionHeadStyle}>
            <div>
              <p style={sectionEyebrow}>Kunnskap</p>
              <h2 id="guide-knowledge-heading" style={sectionTitle}>
                Lær det vesentlige
              </h2>
            </div>
            <span style={sectionCount} aria-hidden="true">
              {KNOWLEDGE_ROWS.length}
            </span>
          </div>

          <ul role="list" style={knowList}>
            {KNOWLEDGE_ROWS.map((row) => (
              <li key={row.target} role="listitem" style={{ listStyle: 'none' }}>
                <Pressable
                  reducedMotion={reducedMotion}
                  pressScale={0.99}
                  base={knowCardBase}
                  ariaLabel={`${row.title} — ${row.subtitle}`}
                  onActivate={() => handleOpenCard(row.target, 'light')}
                >
                  <div
                    style={row.tone === 'tog' ? knowStripTog : knowStripTemp}
                    aria-hidden="true"
                  />
                  <div style={knowIco} aria-hidden="true">
                    <span style={knowBadge}>
                      {row.tone === 'tog' ? <TogIcon /> : <TempIcon />}
                    </span>
                  </div>
                  <div style={knowBody}>
                    <div style={knowTitle}>{row.title}</div>
                    <div style={knowSub}>{row.subtitle}</div>
                  </div>
                  <div style={knowChev} aria-hidden="true">
                    <ChevronRight
                      color="currentColor"
                      width={9}
                      height={14}
                      opacity={1}
                    />
                  </div>
                </Pressable>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer hint */}
        <div style={footerHint} role="note">
          Hvert antrekk lagres i <strong style={footerHintStrong}>historikken</strong> — sveip på Hjem for å se i&nbsp;går.
        </div>
      </div>

      {/* BottomTabBar mountes globalt i App.tsx — ikke her. */}
    </main>
  );
}

export default GuideHubScreen;
