import type { AppFlowAction, AppFlowState } from './app-flow';
import { canAdvanceOnboarding } from './app-flow';
import { PhoneStatusBar } from './PhoneStatusBar';

type OnboardingState = Extract<AppFlowState, { screen: 'onboarding' }>;

type OnboardingFlowProps = {
  state: OnboardingState;
  dispatch: (action: AppFlowAction) => void;
  onStartTour: () => void;
};

function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return (
    <svg className={direction === 'left' ? 'flow-arrow reverse' : 'flow-arrow'} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v4M18 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></svg>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 16-1 4 4-1L19 8l-3-3L5 16Z" /><path d="m14 7 3 3" /></svg>;
}

function LayersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m4 12 8 4.5 8-4.5M4 16l8 4.5 8-4.5" /></svg>;
}

function formatBirthDate(value: string): string {
  if (!value) return 'Ikke valgt';
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flow-progress-wrap">
      <span>Steg {step} av 4</span>
      <div className="flow-progress" role="progressbar" aria-label={`Steg ${step} av 4`} aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
        {[1, 2, 3, 4].map((item) => <i className={item === step ? 'active' : ''} key={item} />)}
      </div>
    </div>
  );
}

export function OnboardingFlow({ state, dispatch, onStartTour }: OnboardingFlowProps) {
  const canContinue = canAdvanceOnboarding(state);
  const displayName = state.draft.name.trim() || 'babyen';

  const startTour = () => {
    onStartTour();
    dispatch({ type: 'start-tour' });
  };

  return (
    <main className={`snudly-app onboarding-screen onboarding-step-${state.step}`} data-screen={`onboarding-${state.step}`}>
      <PhoneStatusBar />
      <header className="flow-header">
        {state.step > 1 && state.step < 5 ? (
          <button className="flow-back" type="button" onClick={() => dispatch({ type: 'back' })} aria-label="Tilbake">
            <ArrowIcon direction="left" />
          </button>
        ) : <span className="flow-back-spacer" />}
        <span className="flow-wordmark">Snudly</span>
        <span className="flow-back-spacer" />
      </header>

      {state.step < 5 && <Progress step={state.step} />}

      <section className="onboarding-body" aria-live="polite">
        {state.step === 1 && (
          <div className="onboarding-panel intro-panel">
            <div className="onboarding-baby-wrap" aria-hidden="true">
              <span className="onboarding-baby-halo" />
              <img className="onboarding-baby" src="/snudly-owner/avatar-a-profile-gold.webp" alt="" />
            </div>
            <div className="onboarding-copy">
              <p className="flow-eyebrow">Først barnet</p>
              <h1>Hvem kler vi på?</h1>
              <p>Navn eller kallenavn gjør rådene personlige. Du kan også hoppe over.</p>
            </div>
            <label className="flow-field">
              <span>Navn eller kallenavn <small>Valgfritt</small></span>
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="words"
                placeholder="F.eks. Lillian"
                value={state.draft.name}
                onChange={(event) => dispatch({ type: 'set-name', value: event.target.value })}
              />
            </label>
            <p className="flow-privacy">Lagres bare på denne telefonen.</p>
          </div>
        )}

        {state.step === 2 && (
          <div className="onboarding-panel">
            <div className="onboarding-icon"><CalendarIcon /></div>
            <div className="onboarding-copy">
              <p className="flow-eyebrow">Alder</p>
              <h1>Når er {displayName} født?</h1>
              <p>Alder påvirker hvor varmt barnet bør kles.</p>
            </div>
            <label className="flow-choice-field">
              <span className="flow-choice-icon"><CalendarIcon /></span>
              <span className="flow-choice-copy"><small>Fødselsdato</small><strong>{formatBirthDate(state.draft.birthDate)}</strong></span>
              <ArrowIcon />
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={state.draft.birthDate}
                onChange={(event) => dispatch({ type: 'set-birth-date', value: event.target.value })}
                aria-label="Fødselsdato"
              />
            </label>
          </div>
        )}

        {state.step === 3 && (
          <div className="onboarding-panel">
            <div className="onboarding-icon"><PinIcon /></div>
            <div className="onboarding-copy">
              <p className="flow-eyebrow">Hjemsted</p>
              <h1>Hvor er dere hjemme?</h1>
              <p>Snudly bruker hjemstedet til å finne lokalt vær.</p>
            </div>
            <label className="flow-field location-field">
              <span>By eller sted</span>
              <input
                type="text"
                autoComplete="address-level2"
                placeholder="Søk, f.eks. Trondheim"
                value={state.draft.city}
                onChange={(event) => dispatch({ type: 'set-city', value: event.target.value })}
              />
            </label>
            <button className="location-shortcut" type="button" onClick={() => dispatch({ type: 'set-city', value: 'Trondheim' })}>
              <PinIcon /> Bruk Trondheim
            </button>
            <p className="flow-privacy">Stedet kan endres senere under Familie.</p>
          </div>
        )}

        {state.step === 4 && (
          <div className="onboarding-panel summary-panel">
            <div className="onboarding-copy">
              <p className="flow-eyebrow">Nesten ferdig</p>
              <h1>Alt er klart for {displayName}</h1>
              <p>Kontroller opplysningene før Snudly lager det første rådet.</p>
            </div>
            <dl className="flow-summary">
              <div><dt>Navn</dt><dd>{state.draft.name.trim() || 'Ikke oppgitt'}</dd><button type="button" onClick={() => dispatch({ type: 'edit', step: 1 })} aria-label="Endre navn"><EditIcon /></button></div>
              <div><dt>Fødselsdato</dt><dd>{formatBirthDate(state.draft.birthDate)}</dd><button type="button" onClick={() => dispatch({ type: 'edit', step: 2 })} aria-label="Endre fødselsdato"><EditIcon /></button></div>
              <div><dt>Hjemsted</dt><dd>{state.draft.city}</dd><button type="button" onClick={() => dispatch({ type: 'edit', step: 3 })} aria-label="Endre hjemsted"><EditIcon /></button></div>
            </dl>
            <p className="flow-note">Opplysningene lagres på enheten. Rådene er veiledende—følg med på barnet.</p>
          </div>
        )}

        {state.step === 5 && (
          <div className="onboarding-panel welcome-panel">
            <div className="welcome-portrait" aria-hidden="true"><span /><img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" /></div>
            <div className="onboarding-copy">
              <p className="flow-eyebrow">Snudly er klar</p>
              <h1>Dagens råd er klart for {displayName}</h1>
              <p>Basert på alder, hjemsted og været akkurat nå.</p>
            </div>
            <ul className="welcome-features">
              <li><span><PinIcon /></span><div><strong>I dag · {state.draft.city}</strong><small>Lokalt vær fra MET.</small></div></li>
              <li><span><LayersIcon /></span><div><strong>Plagg i riktig rekkefølge</strong><small>Fra innerst til ytterst.</small></div></li>
            </ul>
          </div>
        )}
      </section>

      <footer className="onboarding-actions">
        {state.step < 4 && (
          <button className="flow-primary" type="button" disabled={!canContinue} onClick={() => dispatch({ type: 'next' })}>
            {state.step === 3 && !canContinue ? 'Velg hjemsted' : 'Fortsett'} <ArrowIcon />
          </button>
        )}
        {state.step === 4 && (
          <button className="flow-primary" type="button" disabled={!canContinue} onClick={() => dispatch({ type: 'next' })}>
            Lag første antrekk <ArrowIcon />
          </button>
        )}
        {state.step === 5 && (
          <button className="flow-primary" type="button" onClick={startTour}>
            Se hvordan Snudly fungerer <ArrowIcon />
          </button>
        )}
      </footer>
    </main>
  );
}
