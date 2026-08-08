import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { htmlLanguageFor } from '../../i18n/language-policy';

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

function timeLabel(atIso: string, locale: string): string {
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return atIso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Oslo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant).replace('.', ':');
}

function weatherTranslationKey(symbolCode: string): string {
  const normalized = symbolCode.toLocaleLowerCase('en');
  if (normalized.includes('thunder')) return 'plan.weather.thunder';
  if (normalized.includes('snow')) return 'plan.weather.snow';
  if (normalized.includes('sleet')) return 'plan.weather.sleet';
  if (normalized.includes('rain')) return 'plan.weather.rain';
  if (normalized.includes('fog')) return 'plan.weather.fog';
  if (normalized.includes('partly')) return 'plan.weather.partlyCloudy';
  if (normalized.includes('cloud')) return 'plan.weather.cloudy';
  if (normalized.includes('fair')) return 'plan.weather.fair';
  if (normalized.includes('clear')) return 'plan.weather.clear';
  return 'plan.weather.unknown';
}

export function ForecastDisclosure({ open, onToggle, rows }: Props) {
  const contentId = useId();
  const { t, i18n } = useTranslation();
  const locale = htmlLanguageFor(i18n.resolvedLanguage ?? i18n.language);
  return (
    <section className="planlegg-forecast" aria-label={t('plan.forecastDisclosure.label')}>
      <button
        type="button"
        className="planlegg-forecast__toggle"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        {t(open ? 'plan.forecastDisclosure.hide' : 'plan.forecastDisclosure.show')}
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
              <time dateTime={row.atIso}>{timeLabel(row.atIso, locale)}</time>
              <span>{t(weatherTranslationKey(row.symbolCode))}</span>
              <span>{Math.round(row.tempC)}°</span>
              <span>{t('plan.forecastDisclosure.feelsLike', { temp: Math.round(row.feelsLikeC) })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
