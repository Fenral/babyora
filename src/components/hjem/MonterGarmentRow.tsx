/**
 * MonterGarmentRow — én nummerert plaggrad på ResultSurface (P4).
 *
 * Navngitt «Monter»-prefiks bevisst (jf. arkitektur-notatet): unngår
 * navnekollisjon med den LOKALE `GarmentRow`-komponenten inne i
 * src/screens/MinGarderobeScreen.tsx (uendret, urelatert skjerm).
 *
 * Vitrine-fallback (DESIGN.md doktrine D3 + P4-oppgavens krav): mangler
 * `imageSrc` (ukjent/udekket plagg-id, se lib/monter-assets.ts) → tegner en
 * nøytral forbokstav på #3A2A1A i stedet for et <img>. Listen MÅ fungere
 * uten bilder — det er derfor `imageSrc` er `string | null`, ikke en
 * påkrevd streng.
 *
 * P6: `onSwap` mottar nå det native klikk-eventet (ikke bare et no-arg-kall)
 * slik at opperen (HjemMonter) kan fange `event.currentTarget` som
 * focus-retur-mål for PlaggDetailSheet — samme mønster som resten av appens
 * PlaggDetailSheet-åpnere (se PaakledningScreen/MinGarderobeScreen).
 * `aria-label` legges på hele rad-knappen siden den synlige "Bytt"-chippen
 * er aria-hidden (dekorativ) — uten den hadde raden hatt et utydelig
 * tilgjengelig navn nå som trykk faktisk åpner noe.
 */
import type { MouseEvent } from 'react';
import './hjem-monter.css';

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M7 8h10M14 5l3 3-3 3M17 16H7M10 13l-3 3 3 3" />
    </svg>
  );
}

export type MonterGarmentRowProps = Readonly<{
  position: number;
  label: string;
  roleLabel: string;
  imageSrc: string | null;
  onSwap: (event: MouseEvent<HTMLButtonElement>) => void;
  /** ms — null når raden ikke skal animere inn (cachet åpning, ikke fersk). */
  animationDelayMs: number | null;
}>;

export function MonterGarmentRow({
  position,
  label,
  roleLabel,
  imageSrc,
  onSwap,
  animationDelayMs,
}: MonterGarmentRowProps) {
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  return (
    <li className="hjm-row-item">
      <button
        type="button"
        className="hjm-row"
        onClick={onSwap}
        aria-label={`${label}, ${roleLabel}. Bytt.`}
        style={animationDelayMs !== null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
      >
        <span className="hjm-num" aria-hidden="true">{position}</span>
        <span className="hjm-thumb" aria-hidden="true">
          {imageSrc ? <img src={imageSrc} alt="" draggable={false} /> : initial}
        </span>
        <span className="hjm-row-text">
          <span className="hjm-g-name">{label}</span>
          <span className="hjm-g-role">{roleLabel}</span>
        </span>
        <span className="hjm-swap" aria-hidden="true">
          Bytt
          <SwapIcon />
        </span>
      </button>
    </li>
  );
}
