/**
 * Skeleton — generisk plassholder med shimmer-animasjon.
 *
 * Native-feel #7: reservert plass før data lander, så layout ikke hopper.
 * Bruk i HjemScreen når weather === null, og i UkeScreen mens timeseries
 * lastes (6 rader).
 *
 * A11y:
 *  - role="status" + aria-busy="true" — skjermlesere annoncerer "laster"
 *  - aria-label kan overstyre default "Laster innhold"
 *  - prefers-reduced-motion: shimmer-animasjon dropper, ren grå plass-holder
 *    beholdes (semantikken er fortsatt korrekt).
 *
 * Brand-tokens (F60.14 dark-mode bump):
 *  - Base-farge: var(--surface-soft) — semantisk token som auto-flipper i dark.
 *    Faller tilbake til warm-grey-2 hvis token mangler.
 *  - Shimmer-highlight: var(--ink-200) — gjennomsiktig ink-overlay som virker
 *    både på lys og mørk base (ren rgba(255,255,255,…) blir for sterkt i light
 *    og fremdeles synlig på dark — vi vil ha en subtil "luft som glir over").
 *  - Border-radius default 10px (gjenbrukbar for både tall, pills og rader)
 */
import type { CSSProperties } from 'react';

export type SkeletonProps = {
  /** CSS width (string eller number). Default 100%. */
  width?: number | string;
  /** CSS height (string eller number). Default 16px. */
  height?: number | string;
  /** Border-radius. Default 10. Sett til '50%' for sirkel, 999 for pill. */
  radius?: number | string;
  /** Override aria-label. Default "Laster innhold". */
  ariaLabel?: string;
  /** Ekstra inline-style overrides. */
  style?: CSSProperties;
  /** Ekstra className for testbarhet/styling. */
  className?: string;
};

/**
 * Statisk style-injection — én gang per modul. Bruker keyframes med
 * background-position-shift for å minimere paint-cost (kun composited prop).
 *
 * `ba-skeleton-shimmer` class settes på selve elementet; via @media-query
 * blir animasjonen droppet ved prefers-reduced-motion.
 */
const SKELETON_STYLE_ID = 'ba-skeleton-style';

function ensureStyleInjected() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SKELETON_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SKELETON_STYLE_ID;
  style.textContent = `
    @keyframes baSkeletonShimmer {
      0% { background-position: -150% 0; }
      100% { background-position: 250% 0; }
    }
    .ba-skeleton-shimmer {
      background-image: linear-gradient(
        90deg,
        var(--surface-soft, #E6E3DD) 0%,
        var(--ink-200) 50%,
        var(--surface-soft, #E6E3DD) 100%
      );
      background-size: 200% 100%;
      background-repeat: no-repeat;
      background-color: var(--surface-soft, #E6E3DD);
      animation: baSkeletonShimmer 1.5s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .ba-skeleton-shimmer {
        animation: none !important;
        background-image: none !important;
        background-color: var(--surface-soft, #E6E3DD) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 10,
  ariaLabel = 'Laster innhold',
  style,
  className,
}: SkeletonProps) {
  ensureStyleInjected();

  const baseStyle: CSSProperties = {
    display: 'inline-block',
    width,
    height,
    borderRadius: radius,
    verticalAlign: 'middle',
    ...style,
  };

  const composedClass = className
    ? `ba-skeleton-shimmer ${className}`
    : 'ba-skeleton-shimmer';

  return (
    <span
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={composedClass}
      style={baseStyle}
    />
  );
}

export default Skeleton;
