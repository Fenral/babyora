import type { CSSProperties, ReactNode } from 'react';
import { PhoneStatusBar } from './PhoneStatusBar';

export type ProductTab = 'home' | 'plan' | 'tools' | 'family';

type IconProps = { size?: number };

export function HomeIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 10 8-6 8 6v10h-5v-6H9v6H4V10Z" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" /></svg>;
}
export function PlanIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth={1.7} /><path d="M8 3v5M16 3v5M4 10h16" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" /></svg>;
}
export function ToolsIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 17h16" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" /><circle cx="9" cy="7" r="2" fill="currentColor" /><circle cx="15" cy="17" r="2" fill="currentColor" /></svg>;
}
export function FamilyIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth={1.7} /><circle cx="17" cy="10" r="2.3" stroke="currentColor" strokeWidth={1.7} /><path d="M3.5 20c.5-4 2.4-6 5.5-6s5 2 5.5 6M14.5 15c3.2-.7 5.2 1 6 4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" /></svg>;
}
export function BackIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>;
}
export function ChevronIcon({ size = 20 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>;
}

const TABS: ReadonlyArray<{ key: ProductTab; label: string; icon: ReactNode }> = [
  { key: 'home', label: 'Hjem', icon: <HomeIcon /> },
  { key: 'plan', label: 'Planlegg', icon: <PlanIcon /> },
  { key: 'tools', label: 'Verktøy', icon: <ToolsIcon /> },
  { key: 'family', label: 'Familie', icon: <FamilyIcon /> },
];

export function BottomTabBar({
  active,
  onSelectTab,
  enabledTabs = TABS.map((tab) => tab.key),
}: {
  active: ProductTab;
  onSelectTab: (tab: ProductTab) => void;
  enabledTabs?: readonly ProductTab[];
}) {
  return (
    <nav className="tabbar" aria-label="Hovednavigasjon">
      {TABS.map((item) => {
        const enabled = enabledTabs.includes(item.key);
        return (
          <button
            className="tab"
            type="button"
            aria-current={active === item.key ? 'page' : undefined}
            disabled={!enabled}
            onClick={() => onSelectTab(item.key)}
            key={item.key}
          >
            <span className="tab-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function ProductScreen({
  title,
  subtitle,
  activeTab,
  onSelectTab,
  children,
  heading,
}: {
  title: string;
  subtitle: string;
  activeTab: ProductTab;
  onSelectTab: (tab: ProductTab) => void;
  children: ReactNode;
  heading?: ReactNode;
}) {
  return (
    <main className="snudly-app" data-screen={activeTab}>
      <PhoneStatusBar />
      <header className="topbar">
        <span className="wordmark">Snudly</span>
      </header>
      <section className={`app-view ${activeTab}-view`}>
        {heading ?? <header className="page-heading"><h1>{title}</h1><p>{subtitle}</p></header>}
        {children}
      </section>
      <BottomTabBar active={activeTab} onSelectTab={onSelectTab} />
    </main>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="sn-segmented"
      role="group"
      aria-label={label}
      style={{ '--sn-segment-count': options.length } as CSSProperties}
    >
      {options.map((option) => (
        <button
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="tool-back" type="button" onClick={onClick}><BackIcon /> {label}</button>;
}
