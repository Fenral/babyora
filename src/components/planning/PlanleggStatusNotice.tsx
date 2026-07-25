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

const osloTimeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function cachedTime(cachedAtIso: string): string {
  const instant = new Date(cachedAtIso);
  if (Number.isNaN(instant.getTime())) return 'ukjent tidspunkt';
  return osloTimeFormatter.format(instant).replace('.', ':');
}

export function PlanleggStatusNotice({ state, subject = 'plan' }: Props) {
  if (state.status === 'ready') return null;

  if (state.status === 'loading') {
    return (
      <div
        className="planlegg-status planlegg-status--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p>{subject === 'weather' ? 'Henter værprognosen …' : 'Henter dagens plan …'}</p>
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
            ? 'Vi fikk ikke oppdatert værprognosen'
            : 'Vi fikk ikke oppdatert planen'}
        </h2>
        <p>
          {subject === 'weather'
            ? 'Vi har ingen oppdatert værprognose å vise. Prøv å hente været på nytt.'
            : 'Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.'}
        </p>
        <button type="button" onClick={state.onRetry}>
          {subject === 'weather' ? 'Prøv å hente været' : 'Prøv å hente planen'}
        </button>
      </div>
    );
  }

  if (state.status === 'offline') {
    return (
      <div className="planlegg-status" role="status" aria-live="polite">
        <p>
          Du er frakoblet · viser {subject === 'weather' ? 'værprognosen' : 'planen'} fra{' '}
          {cachedTime(state.cachedAtIso)}
        </p>
        <button type="button" onClick={state.onRetry}>
          {subject === 'weather' ? 'Prøv å hente været' : 'Prøv å hente planen'}
        </button>
      </div>
    );
  }

  return (
    <div className="planlegg-status" role="status" aria-live="polite">
      <p>
        {subject === 'weather'
          ? 'Værprognosen viser bare tidspunktene Babyora har værdata for.'
          : 'Planen viser bare tidspunktene Babyora har værdata for.'}
      </p>
    </div>
  );
}
