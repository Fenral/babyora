import { useId } from 'react';

export type ForecastDisclosureRow = Readonly<{
  atIso: string;
  tempC: number;
  feelsLikeC: number;
  symbolCode: string;
}>;

type Props = Readonly<{
  open: boolean;
  onToggle: () => void;
  rows: readonly ForecastDisclosureRow[];
}>;

const timeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function timeLabel(atIso: string): string {
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return atIso;
  return timeFormatter.format(instant).replace('.', ':');
}

function weatherLabel(symbolCode: string): string {
  const normalized = symbolCode.toLocaleLowerCase('nb-NO');
  if (normalized.includes('thunder')) return 'Torden';
  if (normalized.includes('snow')) return 'Snø';
  if (normalized.includes('sleet')) return 'Sludd';
  if (normalized.includes('rain')) return 'Regn';
  if (normalized.includes('fog')) return 'Tåke';
  if (normalized.includes('cloud')) return 'Skyet';
  if (normalized.includes('partly')) return 'Delvis skyet';
  if (normalized.includes('fair')) return 'Lettskyet';
  if (normalized.includes('clear')) return 'Klarvær';
  return 'Vær';
}

export function ForecastDisclosure({ open, onToggle, rows }: Props) {
  const contentId = useId();
  return (
    <section className="planlegg-forecast" aria-label="Værprognose">
      <button
        type="button"
        className="planlegg-forecast__toggle"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        {open ? 'Skjul full værprognose' : 'Vis full værprognose'}
        {/* Sto som «⌄» (U+2304) tegnet i tekstfonten — en bokstavform med
            flate avslutninger, ca. 12 px høy ved siden av en 160 px bred
            etikett. Den leses som et tegn som har falt ut av teksten, ikke
            som «trykk for å åpne», og den er den ENESTE affordansen som
            sier at værkortet kan utvides. Husets strøkne chevron i stedet
            (samme oppskrift som WeatherStrip og KlePaaStepper). */}
        <span className="planlegg-forecast__chevron" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <ul id={contentId} className="planlegg-forecast__rows">
          {rows.map((row) => (
            <li key={row.atIso}>
              <time dateTime={row.atIso}>{timeLabel(row.atIso)}</time>
              <span>{weatherLabel(row.symbolCode)}</span>
              <span>{Math.round(row.tempC)}°</span>
              <span>Føles som {Math.round(row.feelsLikeC)}°</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
