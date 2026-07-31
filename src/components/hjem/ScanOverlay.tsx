/**
 * ScanOverlay — skann-koreografien fra docs/mocks/monter/hjem-states.html
 * (`#stage-scan`). Erstatter WeatherScene HELT under scanning/recalc-fasene
 * (mocken sin scan-stage er en fullstendig egen panel-variant, ikke et lag
 * oppå værpanelet) — se `.hjm-panel[data-nuance]`-gjenbruk her.
 *
 * ── KRITISK VAKT (risiko #1 i den tekniske planen) ──────────────────────
 * ScanOverlay (og søsteren ScanStatusBlock) skal ALDRI rendres mens
 * outfit-transition-koordinatoren (src/lib/outfit-transition/coordinator.ts,
 * uendret av denne pakken) er i 'captured' | 'ready' | 'playing' — det ville
 * bety at skann-koreografien kjører SAMTIDIG som en garment-flyv-animasjon
 * fra en tidligere navigasjon er i ferd med å lande, med reell fare for
 * layout-thrashing / visuell kollisjon. Vakten er implementert HER, i selve
 * komponenten (ikke bare i HjemMonter sin orkestrering), som forsvar i dybden:
 * selv om en fremtidig endring i HjemMonter feilaktig ville rendret denne
 * under en aktiv transition, nekter komponenten seg selv å tegne noe som
 * helst (returnerer null, INGEN DOM — ikke engang en tom wrapper).
 * `isScanOverlaySuppressed` selve predikatet bor i scan-overlay-guard.ts,
 * IKKE her (react-refresh/only-export-components krever at en komponentfil
 * KUN eksporterer komponenter) — importer det derfra direkte når det trengs
 * isolert (f.eks. ScanOverlay.test.tsx sin rene predikat-testblokk).
 */
import type { CSSProperties } from 'react';
import './hjem-monter.css';
import type { WeatherNuance } from './WeatherScene.js';
import { scanCheckDelaysMs } from './scan-orchestration.js';
import { isScanOverlaySuppressed, type OutfitTransitionStatusLike } from './scan-overlay-guard.js';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

type ScanRow = Readonly<{ label: string; value: string }>;

export type ScanOverlayProps = Readonly<{
  cityLabel: string;
  nuance: WeatherNuance;
  rows: readonly [ScanRow, ScanRow, ScanRow];
  spinningLabel: string;
  spinningValue: string;
  totalDurationMs: number;
  reducedMotion: boolean;
  outfitTransitionStatus: OutfitTransitionStatusLike;
}>;

/** Panel-interne delen: sted-rad (dempet) + skannelinje + 3 sjekk-rader + 1 spinnende rad. */
export function ScanOverlay({
  cityLabel,
  nuance,
  rows,
  spinningLabel,
  spinningValue,
  totalDurationMs,
  reducedMotion,
  outfitTransitionStatus,
}: ScanOverlayProps) {
  if (isScanOverlaySuppressed(outfitTransitionStatus)) return null;

  const animate = !reducedMotion;
  const delays = scanCheckDelaysMs(totalDurationMs);
  const scanDurationStyle = { '--hjm-scan-duration': `${totalDurationMs}ms` } as CSSProperties;

  return (
    <section
      className="hjm-panel"
      data-nuance={nuance}
      aria-label="Beregner antrekk"
      aria-busy="true"
      style={scanDurationStyle}
    >
      <div className="hjm-scanline" data-animate={animate ? 'true' : 'false'} aria-hidden="true" />
      <div className="hjm-loc-row">
        <span className="hjm-loc" data-interactive="false" aria-hidden="true">{cityLabel}</span>
      </div>
      {/* P9 (ekstern P8-review, funn A): se WeatherScene.tsx — samme flytting
         ut av mascot-sonen, aria/live-semantikk uendret. */}
      <span className="hjm-fresh" data-warn="false"><i aria-hidden="true" />Oppdatert nå</span>
      <div className="hjm-scan-rows">
        {rows.map((row, index) => (
          <div className="hjm-scan-row" key={row.label}>
            <span
              className="hjm-s-check"
              data-done="true"
              data-animate={animate ? 'true' : 'false'}
              style={animate ? { animationDelay: `${delays[index]}ms` } : undefined}
            >
              <CheckIcon />
            </span>
            {row.label}
            <span className="hjm-scan-val">{row.value}</span>
          </div>
        ))}
        <div className="hjm-scan-row">
          <span className="hjm-s-check hjm-s-spin" data-animate={animate ? 'true' : 'false'} aria-hidden="true" />
          {spinningLabel}
          <span className="hjm-scan-val">{spinningValue}</span>
        </div>
      </div>
    </section>
  );
}

export type ScanStatusBlockProps = Readonly<{
  headline: string;
  subline: string;
  onSkip: () => void;
  outfitTransitionStatus: OutfitTransitionStatusLike;
}>;

/**
 * Under panelet: synlig statustekst (mock-kopi) + «Vis svaret med en
 * gang»-snarvei. Selve skjermleser-annonseringen bæres av en dedikert
 * sr-only aria-live-region med den EKSAKTE påkrevde teksten «Beregner
 * antrekk» — separat fra den synlige (vennligere) mock-overskriften, samme
 * mønster som #temp-display i HjemScreen sin egen legacy-render.
 */
export function ScanStatusBlock({ headline, subline, onSkip, outfitTransitionStatus }: ScanStatusBlockProps) {
  if (isScanOverlaySuppressed(outfitTransitionStatus)) return null;

  return (
    <div className="hjm-ask-block">
      <span className="hjm-sr-only" role="status" aria-live="polite">Beregner antrekk</span>
      <h1 className="hjm-scan-status" aria-hidden="true">{headline}</h1>
      <p className="hjm-scan-sub" aria-hidden="true">{subline}</p>
      <button type="button" className="hjm-skip" onClick={onSkip}>
        Vis svaret med en gang
      </button>
    </div>
  );
}
