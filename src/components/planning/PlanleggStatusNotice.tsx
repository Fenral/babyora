export type PlanleggStatusState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; onRetry: () => void }>
  | Readonly<{ status: 'offline'; cachedAtIso: string; onRetry: () => void }>
  | Readonly<{ status: 'partial' }>
  | Readonly<{ status: 'ready' }>;

type Props = Readonly<{
  state: PlanleggStatusState;
  subject?: 'plan' | 'weather';
}>;

function cachedTime(cachedAtIso: string, locale: string, unknownTime: string): string {
  const instant = new Date(cachedAtIso);
  if (Number.isNaN(instant.getTime())) return unknownTime;
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant).replace('.', ':');
}

export function PlanleggStatusNotice({ state, subject = 'plan' }: Props) {
  const { t, i18n } = useTranslation();
  const locale = htmlLanguageFor(i18n.resolvedLanguage ?? i18n.language);
  if (state.status === 'ready') return null;

  if (state.status === 'loading') {
    return (
      <div
        className="planlegg-status planlegg-status--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p>{t(subject === 'weather' ? 'plan.status.loadingWeather' : 'plan.status.loadingPlan')}</p>
        <div className="planlegg-status__skeleton" aria-hidden="true">
          <span className="planlegg-status__skeleton-verdict" />
          <span className="planlegg-status__skeleton-action" />
          <div className="planlegg-status__skeleton-rail">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="planlegg-status" role="status" aria-live="polite">
        <h2>
          {subject === 'weather'
            ? t('plan.status.weatherErrorTitle')
            : t('plan.status.planErrorTitle')}
        </h2>
        <p>
          {subject === 'weather'
            ? t('plan.status.weatherErrorBody')
            : t('plan.status.planErrorBody')}
        </p>
        <button type="button" onClick={state.onRetry}>
          {t(subject === 'weather' ? 'plan.status.retryWeather' : 'plan.status.retryPlan')}
        </button>
      </div>
    );
  }

  if (state.status === 'offline') {
    return (
      <div className="planlegg-status" role="status" aria-live="polite">
        <p>
          {t('plan.status.offline', {
            subject: t(subject === 'weather'
              ? 'plan.status.weatherSubject'
              : 'plan.status.planSubject'),
            time: cachedTime(state.cachedAtIso, locale, t('plan.status.unknownTime')),
          })}
        </p>
        <button type="button" onClick={state.onRetry}>
          {t(subject === 'weather' ? 'plan.status.retryWeather' : 'plan.status.retryPlan')}
        </button>
      </div>
    );
  }

  return (
    <div className="planlegg-status" role="status" aria-live="polite">
      <p>
        {t(subject === 'weather' ? 'plan.status.partialWeather' : 'plan.status.partialPlan')}
      </p>
    </div>
  );
}
import { useTranslation } from 'react-i18next';
import { htmlLanguageFor } from '../../i18n/language-policy';
