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
 * `aria-label` legges på hele rad-knappen siden den synlige chippen er
 * aria-hidden (dekorativ) — uten den hadde raden hatt et utydelig
 * tilgjengelig navn nå som trykk faktisk åpner noe.
 *
 * P10.1 (judge finding C10, "Bytt = ENDRE, always" — duel §12): denne raden
 * åpner PlaggDetailSheet, som er UTTALT informasjons-only (swap-row.ts sin
 * egen filhode-kommentar; håndhevet av warm-cold-recovery.test.ts — arket
 * skal ALDRI utføre selve byttet). Chippen het tidligere "Bytt" her — et
 * løfte arket ikke innfrir. Denne komponenten er DELT av BÅDE Hjem
 * (ResultSurface) og Juster (FinnAntrekkScreen) sin resultatliste, så
 * denne ene rettelsen holder begge skjermene ærlige OG innbyrdes
 * konsistente i samme slag (ingen risiko for at de to driver fra hverandre
 * igjen). "Detaljer" er ærlig om hva trykket faktisk gjør i dag; §12 sin
 * fulle Bytt=ENDRE-spesifikasjon (3–5 alternativer, konsekvensetikett,
 * ekte bytte) er en egen, betydelig fremtidig oppgave — ikke del av dette
 * rettelses-paknaget (rører ikke motor-koden byttet faktisk ville krevd).
 */
import type { MouseEvent } from 'react';
import './hjem-monter.css';

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8.2v.1" strokeLinecap="round" />
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
        aria-label={`${label}, ${roleLabel}. Detaljer.`}
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
          Detaljer
          <InfoIcon />
        </span>
      </button>
    </li>
  );
}
