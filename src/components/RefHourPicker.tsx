/**
 * RefHourPicker — global referansetime-velger (6 / 9 / 12 / 15 / 18 / 21).
 *
 * F60.19 — synlig i begge UkeScreen-tabs ("I dag" + "10 dager") så bruker
 * konsekvent kan velge HVILKEN time på dagen vær + klær skal vises for.
 *
 * Mekanikk:
 *  - Wired til zustand-store via useRefHour()
 *  - Persisterer i localStorage (babyora.refHour)
 *  - I dag-tab: refHour anker scroll-narrativ-fasene
 *  - 10-dager-tab: hver dag viser været/klærne på valgt refHour
 *
 * A11y:
 *  - role="radiogroup" + aria-label
 *  - Hver knapp: aria-pressed reflekterer aktiv state
 *  - Touch-target ≥44px (44×44 minimum per Apple HIG)
 *  - prefers-reduced-motion: dropper transform/animasjon
 *  - forced-colors-mode: bruker border isteden for bg-tint så indikator
 *    overlever Windows High Contrast / forced-colors
 */
import type { CSSProperties } from 'react';
import { useRefHour, type RefHour } from '../state/ref-hour-store';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';

const REF_HOURS: readonly RefHour[] = [6, 9, 12, 15, 18, 21] as const;

const TOKENS = {
  ink900: 'var(--ink-900)',
  ink700: 'var(--ink-700)',
  ink500: 'var(--ink-500)',
  ink100: 'var(--ink-100)',
  surfaceSoft: 'var(--surface-soft)',
  surfacePure: 'var(--surface-pure)',
  fontSans: 'var(--font-sans)',
  easeOut: 'var(--ease-out)',
  shadow1: 'var(--shadow-1)',
} as const;

export type RefHourPickerProps = {
  /** Ekstra CSS for ytter-wrapper (margin etc) */
  style?: CSSProperties;
  /** Kompakt mode — bruker mindre vertikal padding (default false). */
  compact?: boolean;
};

/**
 * Lokal tabs-rad-stil (matcher tabsWrapStyle i UkeScreen) for visuell
 * konsistens. Container er en pill med 5px padding rundt segmentene.
 */
function wrapStyle(compact: boolean, extra: CSSProperties = {}): CSSProperties {
  return {
    margin: '12px 22px 0',
    padding: compact ? 4 : 5,
    display: 'flex',
    gap: 3,
    borderRadius: 999,
    background: TOKENS.surfaceSoft,
    border: `1px solid ${TOKENS.ink100}`,
    flex: 'none',
    ...extra,
  };
}

function segStyle(isActive: boolean, reducedMotion: boolean, compact: boolean): CSSProperties {
  return {
    flex: 1,
    // Touch-target ≥44×44 per Apple HIG — compact-mode reduserer kun
    // visuell vertikal padding via mindre font, men hit-area holder 44.
    minHeight: 44,
    minWidth: 44,
    borderRadius: 999,
    border: isActive
      ? '1px solid transparent'
      : '1px solid transparent',
    background: isActive ? TOKENS.surfacePure : 'transparent',
    cursor: 'pointer',
    fontFamily: TOKENS.fontSans,
    fontSize: compact ? '0.8125rem' : '0.875rem',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? TOKENS.ink900 : TOKENS.ink700,
    boxShadow: isActive ? TOKENS.shadow1 : 'none',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.1px',
    transition: reducedMotion
      ? 'none'
      : `background 180ms ${TOKENS.easeOut}, color 180ms ${TOKENS.easeOut}, box-shadow 180ms ${TOKENS.easeOut}, transform 160ms ${TOKENS.easeOut}`,
    // forced-colors: ButtonText/Highlight overrider farger; border gjør at
    // aktiv knapp fortsatt skiller seg ut visuelt.
    outlineOffset: 2,
  };
}

const eyebrowStyle: CSSProperties = {
  margin: '14px 22px 0',
  fontFamily: TOKENS.fontSans,
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: TOKENS.ink500,
  flex: 'none',
};

export function RefHourPicker({ style, compact = false }: RefHourPickerProps) {
  const refHour = useRefHour((s) => s.refHour);
  const setRefHour = useRefHour((s) => s.setRefHour);
  const { reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();

  const handleClick = (hour: RefHour) => {
    if (hour === refHour) return;
    setRefHour(hour);
    void fire('selection');
  };

  return (
    <>
      {!compact && (
        <p style={eyebrowStyle} aria-hidden="true">
          Referansetid
        </p>
      )}
      <div
        role="radiogroup"
        aria-label="Velg referansetid for værvisning"
        style={wrapStyle(compact, style)}
      >
        {REF_HOURS.map((hour) => {
          const isActive = hour === refHour;
          const hourLabel = String(hour).padStart(2, '0');
          return (
            <button
              key={hour}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-pressed={isActive}
              aria-label={`Vis vær fra klokken ${hourLabel}`}
              onClick={() => handleClick(hour)}
              className="ba-press"
              style={segStyle(isActive, reducedMotion, compact)}
            >
              {hourLabel}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default RefHourPicker;
