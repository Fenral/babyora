import { useState, type ReactNode } from 'react';
import type { AppFlowAction, AppFlowState, TourPage } from './app-flow';
import { PhoneStatusBar } from './PhoneStatusBar';
import { FamilyIcon, HomeIcon, PlanIcon, ToolsIcon } from './ui';

type ProductTourState = Extract<AppFlowState, { screen: 'tour' }>;

type ProductTourProps = {
  state: ProductTourState;
  dispatch: (action: AppFlowAction) => void;
  onComplete: () => void;
};

const TOUR_PAGES: readonly { page: TourPage; label: string; icon: ReactNode }[] = [
  { page: 'home', label: 'Hjem', icon: <HomeIcon size={16} /> },
  { page: 'plan', label: 'Planlegg', icon: <PlanIcon size={16} /> },
  { page: 'tools', label: 'Verktøy', icon: <ToolsIcon size={16} /> },
  { page: 'family', label: 'Familie', icon: <FamilyIcon size={16} /> },
];

const TOUR_CTA: Record<TourPage, string> = {
  home: 'Se Planlegg',
  plan: 'Se Verktøy',
  tools: 'Se Familie',
  family: 'Se abonnementet',
};

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;
}

function TourHeader({ title }: { title: string }) {
  return (
    <header className="tour-header">
      <span className="wordmark">Snudly</span>
      <strong>{title}</strong>
      <span className="tour-header-spacer" />
    </header>
  );
}

function TourHome({ name, city }: { name: string; city: string }) {
  return (
    <section className="tour-content tour-home" aria-label="Hjem">
      <div className="tour-weather">
        <div><strong>7°</strong><span><b>Føles som 6° · Delvis skyet</b>{city}</span></div>
        <small>Vind 3 m/s · Regn 0,4 mm</small>
      </div>
      <p className="tour-attribution">Værdata fra met.no.</p>
      <section className="tour-outfit">
        <img className="tour-baby" src="/snudly-owner/avatar-a-home-gold.webp" alt="" />
        <header><h1>Dagens antrekk</h1><p>4 plagg for {name} · Utelek — fordi det føles som 6°</p></header>
        <div className="tour-garments">
          {[
            ['01', 'Tykt ullsett', 'Innerst', '/monter/plagg-tykt-ullsett.webp'],
            ['02', 'Ulljakke', 'Mellomlag', '/monter/plagg-ull-mellomlag.webp'],
            ['03', 'Lue med ull', 'Tilbehør', '/monter/plagg-lue-med-ull.webp'],
            ['04', 'Tøffelsko', 'Tilbehør', '/monter/plagg-toffelsko.webp'],
          ].map(([number, garment, role, image]) => (
            <div className="tour-garment" key={number}>
              <small>{number}</small><span><img src={image} alt="" /></span><p><b>{garment}</b><small>{role}</small></p><i>›</i>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function TourPlan() {
  return (
    <section className="tour-content tour-plan" aria-label="Planlegg">
      <header className="tour-page-copy"><h1>Planlegg</h1><p>Se når været endrer seg, og hvilket plagg som bør av eller på.</p></header>
      <div className="tour-day-tabs" aria-label="Eksempelvisning: I dag"><span aria-current="true">I dag</span><span>Uke</span></div>
      <section className="tour-plan-surface">
        <header><div><small>Tirsdag · Trondheim</small><strong>Hva trenger vi senere?</strong></div><b>7°</b></header>
        <div className="tour-metrics"><span><small>Nå</small><b>7°</b></span><span><small>Føles</small><b>6°</b></span><span><small>Vind</small><b>3 m/s</b></span></div>
        <svg className="tour-chart" viewBox="0 0 320 150" role="img" aria-labelledby="tour-chart-title tour-chart-description">
          <title id="tour-chart-title">Temperatur og kleslag gjennom dagen</title>
          <desc id="tour-chart-description">Tre lag fram til klokken 14. Deretter to lag når jakken tas av.</desc>
          <rect className="tour-zone-before" x="8" y="9" width="199" height="113" rx="6" />
          <rect className="tour-zone-after" x="207" y="9" width="105" height="113" rx="6" />
          <text className="tour-zone-label tour-zone-label-before" x="106" y="26" textAnchor="middle">3 lag</text>
          <text className="tour-zone-label tour-zone-label-after" x="260" y="26" textAnchor="middle">2 lag</text>
          <path className="tour-chart-line tour-chart-line-before" d="M8 43 C55 37 75 55 114 56 S169 80 207 82" />
          <path className="tour-chart-line tour-chart-line-after" d="M207 82 C246 84 273 103 312 106" />
          <line className="tour-change-line" x1="207" y1="9" x2="207" y2="122" />
          <circle className="tour-chart-point before" cx="8" cy="43" r="5"/><circle className="tour-chart-point before" cx="114" cy="56" r="5"/>
          <circle className="tour-chart-point change" cx="207" cy="82" r="5"/><circle className="tour-chart-point after" cx="312" cy="106" r="5"/>
          <text className="tour-chart-time" x="8" y="143">Nå</text><text className="tour-chart-time" x="106" y="143">12</text><text className="tour-chart-time change" x="196" y="143">14</text><text className="tour-chart-time" x="297" y="143">17</text>
        </svg>
        <div className="tour-change"><span>14:00</span><p><small>Neste klesbytte</small><b>Ta av jakke</b></p><i>›</i></div>
      </section>
    </section>
  );
}

function TourTools() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const questions = [
    {
      question: 'Når bør mellomlaget av?',
      answer: 'Når nakken blir varm eller været stiger, kan ett lag tas av før barnet blir klamt.',
    },
    {
      question: 'Hvordan merker du at barnet er for varmt?',
      answer: 'Kjenn i nakken. Varm og klam hud er et bedre signal enn kalde hender alene.',
    },
    {
      question: 'Hva gjør vinden med klesbehovet?',
      answer: 'Vind øker varmetapet. Derfor bruker Snudly følt temperatur, ikke bare gradestokken.',
    },
  ] as const;

  return (
    <section className="tour-content tour-tools" aria-label="Verktøy">
      <header className="tour-page-copy"><h1>Verktøy</h1><p>Prøv to raske hjelpere, og se hva du kan lære om bekledning.</p></header>
      <div className="tour-calculator-grid">
        <article className="tour-calculator weather-calculator">
          <header><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15a4 4 0 0 1 4-4 6 6 0 0 1 11.5 2A3.5 3.5 0 0 1 19 20H8a4 4 0 0 1-4-5Z"/><path d="M15 4v3M20 6l-2 2"/></svg><h2>Værkalkulator</h2></header>
          <dl><div><dt>Føles som</dt><dd>6°</dd></div><div><dt>Aktivitet</dt><dd>Utelek</dd></div></dl>
          <p><small>Forslag nå</small><strong>4 plagg</strong><span>Ull innerst</span></p>
        </article>
        <article className="tour-calculator sleep-calculator">
          <header><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/><path d="M16 4v4M14 6h4"/></svg><h2>Sovekalkulator</h2></header>
          <dl><div><dt>Romtemperatur</dt><dd>19°</dd></div><div><dt>Sovepose</dt><dd>2,5 TOG</dd></div></dl>
          <p><small>Forslag i natt</small><strong>Body + pysj</strong><span>Sjekk nakken</span></p>
        </article>
      </div>
      <section className="tour-curiosity" aria-label="Tre spørsmål om bekledning">
        <h2>Hva ville du svart?</h2>
        {questions.map((item, index) => (
          <div className="tour-question-wrap" key={item.question}>
            <button
              className="tour-question"
              type="button"
              aria-expanded={openQuestion === index}
              onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
            >
              <span>{item.question}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" />
                {openQuestion !== index && <path d="M12 5v14" />}
              </svg>
            </button>
            {openQuestion === index && <p>{item.answer}</p>}
          </div>
        ))}
        <small className="tour-guidance-note">Veiledende råd — følg alltid med på barnet.</small>
      </section>
    </section>
  );
}

function TourFamily({ name, city }: { name: string; city: string }) {
  return (
    <section className="tour-content tour-family" aria-label="Familie">
      <header className="tour-page-copy"><h1>Familie</h1><p>Barnets profil, omsorgskrets og preferanser samlet på ett sted.</p></header>
      <section className="tour-family-profile">
        <img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" />
        <div><h2>{name}</h2><p>10 måneder · {city}</p><span>Aktiv profil</span></div>
      </section>
      <section className="tour-family-section">
        <header><h2>Omsorgskrets</h2><small>Kun på denne enheten</small></header>
        <div className="tour-care"><span className="tour-care-person">SS</span><i /><span className="tour-care-child"><img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" /></span><i /><span className="tour-care-person muted">+</span></div>
        <p>Sivert kler på {name}. Invitasjoner kommer senere.</p>
      </section>
      <section className="tour-family-section material"><header><h2>Materialpreferanse</h2><b>Ull først</b></header><p>Snudly prioriterer ull i lagene når det passer været.</p></section>
    </section>
  );
}

export function ProductTour({ state, dispatch, onComplete }: ProductTourProps) {
  const name = state.profile.name.trim() || 'Lillian';
  const city = state.profile.city.trim() || 'Trondheim';
  const finish = state.page === 'family';

  return (
    <main className="snudly-app product-tour" data-screen={`tour-${state.page}`}>
      <PhoneStatusBar />
      <TourHeader title="Slik fungerer Snudly" />
      {state.page === 'home' && <TourHome name={name} city={city} />}
      {state.page === 'plan' && <TourPlan />}
      {state.page === 'tools' && <TourTools />}
      {state.page === 'family' && <TourFamily name={name} city={city} />}

      <div className="tour-actions">
        <button
          className="tour-next"
          type="button"
          onClick={() => {
            if (finish) onComplete();
            else dispatch({ type: 'next-tour' });
          }}
        >
          {TOUR_CTA[state.page]} <ArrowIcon />
        </button>
      </div>

      <nav className="tour-tabs" aria-label="Produktvisning">
        {TOUR_PAGES.map((item) => (
          <button
            className="tour-tab"
            type="button"
            aria-current={state.page === item.page ? 'page' : undefined}
            onClick={() => dispatch({ type: 'select-tour', page: item.page })}
            key={item.page}
          >
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
