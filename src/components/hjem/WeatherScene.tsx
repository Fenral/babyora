/**
 * WeatherScene — det væravhengige instrumentpanelet (P4 "Monter").
 *
 * Transkribert fra docs/mocks/monter/hjem-weather-ready.html sin `.panel`:
 * sted-rad, «oppdatert nå»-status, Fraunces-temperatur + værikon, føles-som,
 * notat, og aktivitets-radiogroup. Værnyansen (panelfargen) er den ENESTE
 * væravhengige fargen i systemet (DESIGN.md «Weather nuances (panel only)»)
 * — canvas/ink/aksent står fast, kun `data-nuance` endrer panelfargen.
 *
 * `children` gir HjemMonter et sted å montere ScanOverlay/andre panel-
 * interne lag OVENPÅ dette innholdet (panelet selv eier `overflow:hidden`
 * + `position:relative`, D1-doktrinens klippekontekst for scan-linjen).
 */
import type { ReactNode } from 'react';
import './hjem-monter.css';

export type WeatherNuance = 'clear' | 'cloudy' | 'rain' | 'snow' | 'night';
export type MonterActivity = 'utelek' | 'vogn';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx={12} cy={12} r={9} />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const ACTIVITY_TOGGLE_LABEL: Readonly<Record<MonterActivity, string>> = {
  utelek: 'Utenfor vogn',
  vogn: 'I vogn',
};

export type WeatherSceneProps = Readonly<{
  cityLabel: string;
  nuance: WeatherNuance;
  /** null → «henter vær»-tilstand (stiplet temperatur, ingen ikon). */
  tempC: number | null;
  feelsLikeC: number | null;
  /**
   * Værtilstanden («Delvis skyet»), slått sammen på føles-som-linjen.
   *
   * Portdom 23 (B1): «Slå sammen til én linje: Føles som −3° · Delvis skyet.
   * Fjern bare "sjekk antrekket …".» Værtilstanden er REELL DATA og kan ikke
   * bæres av ikonet alene — men handlingsdelen var overflødig, siden knappen
   * rett under sier nettopp det. Vedtatt i proofen, portet til appen 2026-08-03.
   */
  conditionText?: string | null;
  /** Egen notatlinje. Kun for tilstander som faktisk har noe å SI utover
   *  været selv (feil, henting) — hviletilstanden bruker conditionText. */
  noteText?: string | null;
  weatherIconSrc: string | null;
  weatherIconAlt: string;
  freshnessLabel: string;
  freshnessWarn?: boolean;
  dimmed?: boolean;
  /** Offline-tilstanden (mock: `.stale-badge`) — «Sist kjente vær · 06:40». */
  staleBadgeLabel?: string | null;
  /** Under scanning er sted-pillen visuelt dempet og ikke-interaktiv (mock: `.loc.dim`). */
  locInteractive?: boolean;
  onAdjustLocation?: () => void;
  activity: MonterActivity;
  onActivityChange: (next: MonterActivity) => void;
  children?: ReactNode;
}>;

function formatTempDisplay(tempC: number | null): string {
  if (tempC === null) return '–';
  const rounded = Math.round(tempC);
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}

export function WeatherScene({
  cityLabel,
  nuance,
  tempC,
  feelsLikeC,
  conditionText = null,
  noteText = null,
  weatherIconSrc,
  weatherIconAlt,
  freshnessLabel,
  freshnessWarn = false,
  dimmed = false,
  staleBadgeLabel = null,
  locInteractive = true,
  onAdjustLocation,
  activity,
  onActivityChange,
  children,
}: WeatherSceneProps) {
  return (
    <section className="hjm-panel" data-nuance={nuance} aria-label={`Været nå i ${cityLabel}`}>
      <div className="hjm-loc-row">
        {locInteractive ? (
          <button
            type="button"
            className="hjm-loc"
            onClick={onAdjustLocation}
          >
            {cityLabel}
            <ChevronIcon />
          </button>
        ) : (
          <span className="hjm-loc" data-interactive="false" aria-hidden="true">
            {cityLabel}
            <ChevronIcon />
          </span>
        )}
      </div>
      {/* P9 (ekstern P8-review, funn A): sto tidligere høyrestilt i
         hjm-loc-row, rett der maskoten henger over panelkanten — delvis
         skjult i begge tema. Egen venstrestilt andrelinje under stedet i
         stedet, aria/live-semantikk uendret (ingen fantes fra før). */}
      <span className="hjm-fresh" data-warn={freshnessWarn ? 'true' : 'false'}>
        <i aria-hidden="true" />
        {freshnessLabel}
      </span>

      <div className="hjm-hero-row">
        <span className="hjm-temp" data-dim={dimmed ? 'true' : 'false'}>
          {formatTempDisplay(tempC)}
          <sup>°</sup>
        </span>
        {weatherIconSrc && (
          <img
            className="hjm-wicon"
            data-dim={dimmed ? 'true' : 'false'}
            src={weatherIconSrc}
            alt={weatherIconAlt}
            draggable={false}
          />
        )}
      </div>

      {staleBadgeLabel !== null && (
        <span className="hjm-stale-badge">
          <ClockIcon />
          {staleBadgeLabel}
        </span>
      )}

      <p className="hjm-feels" style={dimmed ? { color: 'var(--dw-ink-mid)' } : undefined}>
        {feelsLikeC === null ? (
          'Henter vær …'
        ) : (
          <>
            {`Føles som ${formatTempDisplay(feelsLikeC)}°`}
            {conditionText ? <span className="hjm-cond">{` · ${conditionText}`}</span> : null}
          </>
        )}
      </p>
      {noteText ? <p className="hjm-note">{noteText}</p> : null}

      <div className="hjm-toggle" role="radiogroup" aria-label="Aktivitet">
        {(Object.keys(ACTIVITY_TOGGLE_LABEL) as MonterActivity[]).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={activity === value}
            onClick={() => onActivityChange(value)}
          >
            {ACTIVITY_TOGGLE_LABEL[value]}
          </button>
        ))}
      </div>

      {children}
    </section>
  );
}
