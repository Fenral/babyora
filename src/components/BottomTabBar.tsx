import { type ReactElement } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TAB_DEFS, type TabKey } from '../types/nav';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import './BottomTabBar.css';

export interface BottomTabBarProps {
  active: TabKey;
  onNavigate: (tab: TabKey) => void;
}

export type RootChangeDecision = Readonly<{
  nextRoot: TabKey;
  cue: 'selection';
}> | null;

// The pure decision contract is intentionally co-located with its sole UI owner.
// eslint-disable-next-line react-refresh/only-export-components
export function decideRootChange(current: TabKey, next: TabKey): RootChangeDecision {
  return current === next ? null : { nextRoot: next, cue: 'selection' };
}

// eslint-disable-next-line react-refresh/only-export-components
export function dispatchRootChange(
  decision: RootChangeDecision,
  handlers: Readonly<{
    onNavigate: (tab: TabKey) => void;
    onCue: (cue: 'selection') => void;
  }>,
): void {
  if (!decision) return;
  handlers.onNavigate(decision.nextRoot);
  handlers.onCue(decision.cue);
}

type TabIcon = () => ReactElement;

function iconProps() {
  return {
    className: 'bottom-tab-bar__icon',
    width: 22,
    height: 22,
    viewBox: '0 0 24 24' as const,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  };
}

function IconHome(): ReactElement {
  return <svg {...iconProps()}><path d="M3 12l9-8 9 8v9h-5v-7h-6v7H3z" /></svg>;
}

function IconWeek(): ReactElement {
  return <svg {...iconProps()}><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M3 11h18M8 3v4M16 3v4" /></svg>;
}

function IconTools(): ReactElement {
  return (
    <svg {...iconProps()}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
      <circle cx={14} cy={7} r={2} />
      <circle cx={8} cy={17} r={2} />
    </svg>
  );
}

function IconFamily(): ReactElement {
  return <svg {...iconProps()}><circle cx={9} cy={8} r={3} /><circle cx={17} cy={9.5} r={2.3} /><path d="M3.5 20c.5-3.6 2.7-5.5 5.5-5.5s5 1.9 5.5 5.5" /><path d="M14.5 20c.3-2.4 1.6-3.9 3.6-4.2" /></svg>;
}

const TAB_ICONS: Record<TabKey, TabIcon> = {
  hjem: IconHome,
  plan: IconWeek,
  verktoy: IconTools,
  familie: IconFamily,
};

const TAB_TRANSLATION_KEYS: Record<TabKey, string> = {
  hjem: 'nav.home',
  plan: 'nav.plan',
  verktoy: 'nav.tools',
  familie: 'nav.familie',
};

interface TabButtonProps {
  active: boolean;
  label: string;
  Icon: TabIcon;
  reducedMotion: boolean;
  onSelect: () => void;
}

function TabButton({ active, label, Icon, reducedMotion, onSelect }: TabButtonProps): ReactElement {
  const className = `bottom-tab-bar__button${active ? ' bottom-tab-bar__button--active' : ''}`;
  const children = (
    <>
      {active && <span aria-hidden="true" className="bottom-tab-bar__indicator" />}
      <span className="bottom-tab-bar__content">
        <Icon />
        <span className="bottom-tab-bar__label">{label}</span>
      </span>
    </>
  );

  if (reducedMotion) {
    return (
      <button type="button" className={className} aria-current={active ? 'page' : undefined} onClick={onSelect}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      className={className}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.5 }}
    >
      {children}
    </motion.button>
  );
}

export function BottomTabBar({ active, onNavigate }: BottomTabBarProps): ReactElement {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const { t } = useTranslation();

  const handleSelect = (next: TabKey) => {
    dispatchRootChange(decideRootChange(active, next), {
      onNavigate,
      onCue: (cue) => { void fire(cue); },
    });
  };

  return (
    <nav
      className="bottom-tab-bar"
      aria-label={t('nav.mainNavigation', { defaultValue: 'Main navigation' })}
    >
      {TAB_DEFS.map(({ key, label }) => (
        <TabButton
          key={key}
          active={key === active}
          label={t(TAB_TRANSLATION_KEYS[key], { defaultValue: label })}
          Icon={TAB_ICONS[key]}
          reducedMotion={reducedMotion}
          onSelect={() => handleSelect(key)}
        />
      ))}
    </nav>
  );
}

export default BottomTabBar;
