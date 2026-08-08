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
import {
  SCANLINE_DURATION_MS, scanCheckDelaysMs } from './scan-orchestration.js';
import { isScanOverlaySuppressed, type OutfitTransitionStatusLike } from './scan-overlay-guard.js';
import { hjemCopyFor } from './hjem-copy.js';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

type ScanRow = Readonly<{ label: string; value: string }>;

export type ScanOverlayProps = Readonly<{
  language?: string | null;
  cityLabel: string;
  nuance: WeatherNuance;
  rows: readonly [ScanRow, ScanRow, ScanRow];
  spinningLabel: string;
  spinningValue: string;
  totalDurationMs: number;
  reducedMotion: boolean;
  outfitTransitionStatus: OutfitTransitionStatusLike;
  /** Har fullforingsmarkoren landet? Settes av HjemMonter ved MARKER_AT_MS. */
  markerDone?: boolean;
}>;

/** Panel-interne delen: sted-rad (dempet) + skannelinje + 3 sjekk-rader + 1 spinnende rad. */
export function ScanOverlay({
  language,
  cityLabel,
  nuance,
  rows,
  spinningLabel,
  spinningValue,
  totalDurationMs,
  reducedMotion,
  outfitTransitionStatus,
  markerDone = false,
}: ScanOverlayProps) {
  if (isScanOverlaySuppressed(outfitTransitionStatus)) return null;

  const copy = hjemCopyFor(language);
  const animate = !reducedMotion;
  const delays = scanCheckDelaysMs(totalDurationMs);
  /* Streken bruker sin EGEN lengde, ikke seremoniens. Sveipet den helt til
     slutt, fantes det ingen stillstand foran resultatet — bare en pause på
     papiret. Ved omberegning (kortere enn full scan) tas den korteste, så
     streken aldri overlever sin egen kontekst. */
  const scanlineMs = Math.min(SCANLINE_DURATION_MS, totalDurationMs);
  const scanDurationStyle = { '--hjm-scan-duration': `${scanlineMs}ms` } as CSSProperties;

  return (
    <section
      className="hjm-panel"
      data-nuance={nuance}
      aria-label={copy.scan.panelAria}
      aria-busy="true"
      style={scanDurationStyle}
    >
      <div className="hjm-scanline" data-animate={animate ? 'true' : 'false'} aria-hidden="true" />
      <div className="hjm-loc-row">
        <span className="hjm-loc" data-interactive="false" aria-hidden="true">{cityLabel}</span>
      </div>
      {/* P9 (ekstern P8-review, funn A): se WeatherScene.tsx — samme flytting
         ut av mascot-sonen, aria/live-semantikk uendret. */}
      <span className="hjm-fresh" data-warn="false"><i aria-hidden="true" />{copy.weather.freshNow}</span>
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
        {/* FULLFORINGSMARKOREN. Spinneren snurret `infinite` gjennom hele
            det pastatte holdet — den var det som gjorde at eieren ikke
            kjente noen stopp. Na LANDER den paa markortidspunktet: hake,
            verdi og stopp, alt paa --dw-m-marker (180 ms, «lander, glir
            ikke»). Reduced motion: ferdig fra forste frame. */}
        <div className="hjm-scan-row">
          <span
            className="hjm-s-check hjm-s-marker"
            data-done={markerDone ? 'true' : 'false'}
            data-animate={animate ? 'true' : 'false'}
            aria-hidden="true"
          >
            {markerDone ? <CheckIcon /> : null}
          </span>
          {spinningLabel}
          <span className="hjm-scan-val">{markerDone ? spinningValue : ''}</span>
        </div>
      </div>
    </section>
  );
}

export type ScanStatusBlockProps = Readonly<{
  language?: string | null;
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
export function ScanStatusBlock({
  language,
  headline,
  subline,
  onSkip,
  outfitTransitionStatus,
}: ScanStatusBlockProps) {
  if (isScanOverlaySuppressed(outfitTransitionStatus)) return null;

  const copy = hjemCopyFor(language);
  return (
    <div className="hjm-ask-block">
      <span className="hjm-sr-only" role="status" aria-live="polite">{copy.scan.panelAria}</span>
      <h1 className="hjm-scan-status" aria-hidden="true">{headline}</h1>
      <p className="hjm-scan-sub" aria-hidden="true">{subline}</p>
      <button type="button" className="hjm-skip" onClick={onSkip}>
        {copy.scan.skip}
      </button>
    </div>
  );
}
