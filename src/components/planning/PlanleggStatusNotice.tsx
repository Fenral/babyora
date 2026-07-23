export type PlanleggStatusState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; onRetry: () => void }>
  | Readonly<{ status: 'offline'; cachedAtIso: string; onRetry: () => void }>
  | Readonly<{ status: 'partial' }>
  | Readonly<{ status: 'ready' }>;

type Props = Readonly<{
  state: PlanleggStatusState;
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

export function PlanleggStatusNotice({ state }: Props) {
  if (state.status === 'ready') return null;

  if (state.status === 'loading') {
    return (
      <div
        className="planlegg-status planlegg-status--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p>Henter dagens plan …</p>
        <div className="planlegg-status__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="planlegg-status" role="status" aria-live="polite">
        <h2>Vi fikk ikke oppdatert planen</h2>
        <p>Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.</p>
        <button type="button" onClick={state.onRetry}>
          Prøv å hente planen
        </button>
      </div>
    );
  }

  if (state.status === 'offline') {
    return (
      <div className="planlegg-status" role="status" aria-live="polite">
        <p>Du er frakoblet · viser planen fra {cachedTime(state.cachedAtIso)}</p>
        <button type="button" onClick={state.onRetry}>
          Prøv å hente planen
        </button>
      </div>
    );
  }

  return (
    <div className="planlegg-status" role="status" aria-live="polite">
      <p>Planen viser bare tidspunktene Babyora har værdata for.</p>
    </div>
  );
}
