/**
 * BottomTabBar — global F60 bottom navigation.
 *
 * 4 top-level tabs: Hjem · Uke · Guide · Innst.
 * Erstatter LOKALE bottomNav-varianter i Uke/GuideHub/Plaggbib og legges til
 * på Hjem + Innstillinger. Sub-sider (drilled-down) bruker IKKE denne baren —
 * de har bare back-knapp.
 *
 * Native-feel #6 (2026-06-26):
 *  - whileTap spring-scale på hver tab-knapp (i stedet for CSS transition).
 *  - Aktiv-indikator (pill bak ikon) deler layoutId så Motion spring-translater
 *    pillen mellom tabs ved tab-bytte (samme teknikk som iOS native pickers).
 *  - Reduced-motion: vanlig <button> + statisk pill — ingen spring, ingen press-scale.
 *
 * A11y:
 *  - <nav aria-label="Hovednavigasjon">
 *  - aria-current="page" på aktiv tab
 *  - 44×44 touch-target på alle tabs (WCAG 2.5.5)
 *  - prefers-reduced-motion respektert
 *  - useHapticSystem.fire('selection') på tap (respekterer hapticsPref)
 *
 * Design tokens (canonical, F60.14 dark-mode bump):
 *  - Aktiv: var(--warm-orange-500), label weight 600 (poppet fra terracotta
 *    for tydeligere "current"-signal i både light og dark — same hue-familie,
 *    høyere luminans-kontrast på dark-canvas)
 *  - Inaktiv: var(--ink-500), label weight 500 (6.4:1 AA på dark)
 *  - Bg: var(--surface-elevated) — løftes ett trinn over canvas/surface så
 *    baren ikke smelter inn i dark-mode bakgrunnen
 *  - Top-border: 1px solid var(--ink-300) (tydeligere skille fra content)
 *  - Aktiv-pill: tonet warm-orange-tint (rgba), brand-konsistent
 *  - safe-area-inset-bottom via env()
 */
import { useState, type CSSProperties, type ReactElement } from 'react';
import { motion } from 'motion/react';
import { TAB_DEFS, type TabKey } from '../types/nav';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BottomTabBarProps {
  active: TabKey;
  onNavigate: (tab: TabKey) => void;
}

interface TabDef {
  key: TabKey;
  label: string;
  Icon: (props: { active: boolean }) => ReactElement;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG, viewBox 0 0 24 24)
// ─────────────────────────────────────────────────────────────────────────────

function iconStrokeProps(active: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24' as const,
    fill: 'none' as const,
    stroke: active ? 'var(--warm-orange-500)' : 'var(--ink-500)',
    strokeWidth: active ? 2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  };
}

function IconHome({ active }: { active: boolean }): ReactElement {
  return (
    <svg {...iconStrokeProps(active)}>
      <path d="M3 12l9-8 9 8v9h-5v-7h-6v7H3z" />
    </svg>
  );
}

function IconWeek({ active }: { active: boolean }): ReactElement {
  return (
    <svg {...iconStrokeProps(active)}>
      <rect x={3} y={5} width={18} height={16} rx={2} />
      <path d="M3 11h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IconGuide({ active }: { active: boolean }): ReactElement {
  return (
    <svg {...iconStrokeProps(active)}>
      <path d="M4 5h7v15H4zM13 5h7v15h-7z" />
      <path d="M11 5v15M13 5v15" />
    </svg>
  );
}

function IconFamily({ active }: { active: boolean }): ReactElement {
  // R7 Task 3 (a11y-lead): familie-glyf, ikke tannhjul — ikonet skal matche
  // «Familie»-labelen kognitivt. Innstillinger bor bak Familie til Task 7.
  return (
    <svg {...iconStrokeProps(active)}>
      <circle cx={9} cy={8} r={3} />
      <circle cx={17} cy={9.5} r={2.3} />
      <path d="M3.5 20c.5-3.6 2.7-5.5 5.5-5.5s5 1.9 5.5 5.5" />
      <path d="M14.5 20c.3-2.4 1.6-3.9 3.6-4.2" />
    </svg>
  );
}

// Nøkler/labels kommer fra TAB_DEFS (src/types/nav.ts) — testbar ren data.
const TAB_ICONS: Record<TabKey, (p: { active: boolean }) => ReactElement> = {
  hjem: IconHome,
  plan: IconWeek,
  guide: IconGuide,
  familie: IconFamily,
};

const TABS: ReadonlyArray<TabDef> = TAB_DEFS.map((def) => ({
  key: def.key,
  label: def.label,
  Icon: TAB_ICONS[def.key],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const navStyle: CSSProperties = {
  /* F80.3 (Sivert: «Menyen i bunn må låses»): sticky bottom holder baren
     ved viewport-bunnen også når innholdet scroller (Uke m.fl.) */
  position: 'sticky',
  bottom: 0,
  zIndex: 50,
  flex: 'none',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-around',
  width: '100%',
  padding: '10px 8px calc(env(safe-area-inset-bottom, 0px) + 12px)',
  background: 'var(--surface-elevated, var(--surface))',
  borderTop: '1px solid var(--ink-300)',
  boxSizing: 'border-box',
};

const tabBtnBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  minWidth: 44,
  minHeight: 44,
  padding: '4px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 12,
  font: 'inherit',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  color: 'inherit',
};

const focusRing: CSSProperties = {
  outline: '2px solid var(--warm-orange-500)',
  outlineOffset: 2,
};

function labelStyle(active: boolean): CSSProperties {
  return {
    fontSize: '0.6875rem',
    fontWeight: active ? 600 : 500,
    lineHeight: 1,
    color: active ? 'var(--warm-orange-500)' : 'var(--ink-500)',
  };
}

// Aktiv-pill bak ikon. Lett warm-orange tint — innen brand-tokens. Bruker
// layoutId så Motion spring-translater pillen mellom tabs ved aktiv-bytte.
const activeIndicatorStyle: CSSProperties = {
  position: 'absolute',
  inset: 4,
  borderRadius: 10,
  /* F80.3: Granmynte-tint (var gammel oransje) */
  background: 'color-mix(in srgb, var(--accent-cta) 16%, transparent)',
  zIndex: 0,
  pointerEvents: 'none',
};

const innerWrap: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// TabButton
// ─────────────────────────────────────────────────────────────────────────────

interface TabButtonProps {
  tab: TabDef;
  active: boolean;
  reducedMotion: boolean;
  onSelect: (key: TabKey) => void;
}

function TabButton({ tab, active, reducedMotion, onSelect }: TabButtonProps): ReactElement {
  const [focused, setFocused] = useState(false);

  const style: CSSProperties = {
    ...tabBtnBase,
    position: 'relative',
    ...(focused ? focusRing : null),
  };

  // Reduced-motion: vanlig <button> + statisk indikator. Ingen spring.
  if (reducedMotion) {
    return (
      <button
        type="button"
        style={style}
        aria-label={tab.label}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelect(tab.key)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {active && <span aria-hidden="true" style={activeIndicatorStyle} />}
        <span style={innerWrap}>
          <tab.Icon active={active} />
          <span style={labelStyle(active)}>{tab.label}</span>
        </span>
      </button>
    );
  }

  // Spring-press + delt layoutId-indikator som spring-translater mellom tabs.
  return (
    <motion.button
      type="button"
      style={style}
      aria-label={tab.label}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(tab.key)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.5 }}
    >
      {active && (
        <motion.span
          aria-hidden="true"
          layoutId="ba-tab-indicator"
          style={activeIndicatorStyle}
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.7 }}
        />
      )}
      <span style={innerWrap}>
        <tab.Icon active={active} />
        <span style={labelStyle(active)}>{tab.label}</span>
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BottomTabBar (default export)
// ─────────────────────────────────────────────────────────────────────────────

export function BottomTabBar({ active, onNavigate }: BottomTabBarProps): ReactElement {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();

  const handleSelect = (key: TabKey) => {
    if (key === active) return;
    void fire('selection');
    onNavigate(key);
  };

  return (
    <nav style={navStyle} aria-label="Hovednavigasjon">
      {TABS.map((tab) => (
        <TabButton
          key={tab.key}
          tab={tab}
          active={tab.key === active}
          reducedMotion={reducedMotion}
          onSelect={handleSelect}
        />
      ))}
    </nav>
  );
}

export default BottomTabBar;
