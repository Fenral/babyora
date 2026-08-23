import { useEffect, useMemo, useRef, useState } from 'react';
import type { SnudlySituation } from '../../packages/snudly-engine';
import type { WeatherHourly, WeatherNow } from '../../src/lib/met-no/types';
import type { OnboardingDraft } from './app-flow';
import { buildHomeViewModel, type HomeGarment } from './home-model';
import { PhoneStatusBar } from './PhoneStatusBar';
import { APPROVED_VISUAL_REFERENCE } from './reference-lock';
import { BottomTabBar, type ProductTab } from './ui';
import { loadCityWeather } from './weather-service';

type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; now: WeatherNow; hourly: WeatherHourly[]; evaluatedAt: Date; stale: boolean };

export type HomeWeatherLoader = (city: string, signal: AbortSignal) => Promise<Extract<WeatherState, { status: 'ready' }>>;

function TuneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2.2" />
      <circle cx="15" cy="17" r="2.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

const loadLiveWeather: HomeWeatherLoader = async (city, signal) => {
  const result = await loadCityWeather(city, signal);
  return {
    status: 'ready',
    now: result.now,
    hourly: result.hourly,
    evaluatedAt: result.evaluatedAt,
    stale: result.stale,
  };
};

function GarmentVisual({ image, name }: { image: string | null; name: string }) {
  if (image) return <img src={image} alt="" />;
  return <span className="garment-fallback" aria-hidden="true">{name.slice(0, 1)}</span>;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function garmentDescription(garment: HomeGarment, situationLabel: string): string {
  const placement = {
    Innerst: 'det innerste laget',
    Mellomlag: 'mellomlag',
    Ytterst: 'det ytterste laget',
    Tilbehør: 'tilbehør',
    Utstyr: 'utstyr',
  }[garment.role] ?? garment.role.toLocaleLowerCase('nb-NO');
  return `${garment.name} er valgt som ${placement} i dagens antrekk for ${situationLabel.toLocaleLowerCase('nb-NO')}.`;
}

export function HomeScreen({
  profile,
  loadWeather = loadLiveWeather,
  onSelectTab,
}: {
  profile: OnboardingDraft;
  loadWeather?: HomeWeatherLoader;
  onSelectTab?: (tab: ProductTab) => void;
}) {
  const [situation, setSituation] = useState<SnudlySituation>('outdoor-play');
  const [chooserOpen, setChooserOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<HomeGarment | null>(null);
  const garmentTrigger = useRef<HTMLButtonElement | null>(null);
  const garmentClose = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const result = await loadWeather(profile.city, controller.signal);
        if (controller.signal.aborted) return;
        setWeather(result);
      } catch {
        if (!controller.signal.aborted) {
          setWeather((current) => current.status === 'ready' && current.stale ? current : { status: 'error' });
        }
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    })();
    return () => controller.abort();
  }, [loadWeather, profile.city, refreshKey]);

  const modelResult = useMemo(() => {
    if (weather.status !== 'ready') return { model: null, invalidProfile: false };
    try {
      return {
        model: buildHomeViewModel({
          profile,
          situation,
          weatherNow: weather.now,
          hourly: weather.hourly,
          evaluatedAt: weather.evaluatedAt,
        }),
        invalidProfile: false,
      };
    } catch {
      return { model: null, invalidProfile: true };
    }
  }, [profile, situation, weather]);
  const model = modelResult.model;

  useEffect(() => {
    if (!selectedGarment) return;
    garmentClose.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedGarment(null);
        garmentTrigger.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedGarment]);

  const closeGarmentDetail = () => {
    setSelectedGarment(null);
    garmentTrigger.current?.focus();
  };

  const retryWeather = () => {
    setWeather((current) => current.status === 'ready' && current.stale ? current : { status: 'loading' });
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
  };

  return (
    <main
      className="snudly-app"
      data-engine={model?.engine ?? 'snudly-engine-v1'}
      data-weather-state={weather.status}
      data-reference={`${APPROVED_VISUAL_REFERENCE.figmaFileKey}:${APPROVED_VISUAL_REFERENCE.figmaNodeId}`}
    >
      <PhoneStatusBar />

      <header className="topbar">
        <span className="wordmark">Snudly</span>
        <button
          className="icon-button"
          type="button"
          aria-label="Velg situasjon"
          aria-expanded={chooserOpen}
          onClick={() => setChooserOpen((open) => !open)}
        >
          <TuneIcon />
        </button>
        {chooserOpen ? (
          <div className="situation-chooser" role="group" aria-label="Situasjon">
            <button type="button" aria-pressed={situation === 'outdoor-play'} onClick={() => { setSituation('outdoor-play'); setChooserOpen(false); }}>Utelek</button>
            <button type="button" aria-pressed={situation === 'stroller'} onClick={() => { setSituation('stroller'); setChooserOpen(false); }}>I vogn</button>
          </div>
        ) : null}
      </header>

      <section className="home-view" aria-label="Hjem">
        <div className="home-stack">
        {weather.status === 'loading' ? (
          <section className="home-message" role="status">
            <span className="home-message-mark" aria-hidden="true">···</span>
            <h1>Henter været</h1>
            <p>Snudly gjør klart dagens anbefaling.</p>
          </section>
        ) : null}

        {weather.status === 'error' ? (
          <section className="home-message" role="alert">
            <span className="home-message-mark" aria-hidden="true">!</span>
            <h1>Været er ikke tilgjengelig</h1>
            <p>Snudly gjetter ikke på barnets klær når været mangler.</p>
            <button className="home-retry" type="button" onClick={retryWeather}>Prøv igjen</button>
          </section>
        ) : null}

        {modelResult.invalidProfile ? (
          <section className="home-message" role="alert">
            <span className="home-message-mark" aria-hidden="true">!</span>
            <h1>Barnets alder mangler</h1>
            <p>Legg inn en gyldig fødselsdato før Snudly anbefaler klær.</p>
          </section>
        ) : null}

        {model ? (
          <>
            <section className="home-weather" aria-label={`Været i ${profile.city}`}>
              <div className="weather-top">
                <strong className="hero-temp">{model.weather.temperature}</strong>
                <div className="weather-meta">
                  <strong>Føles som {model.weather.feelsLike} · {model.weather.condition}</strong>
                  <span>{profile.city}</span>
                </div>
              </div>
              <div className="weather-facts">
                <span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h10a3 3 0 1 0-3-3M4 13h14a2.5 2.5 0 1 1-2.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg><b>Vind {model.weather.wind}</b></span>
                <span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3c3 4 5 6.7 5 10a5 5 0 0 1-10 0c0-3.3 2-6 5-10Z" stroke="currentColor" strokeWidth={1.8} /></svg><b>Regn {model.weather.precipitation}</b></span>
              </div>
              {model.weather.icon ? <img className="weather-symbol weather-symbol-image" src={model.weather.icon} alt="" /> : null}
            </section>
            <div className="weather-source-row">
              <p className="attribution">{weather.status === 'ready' && weather.stale ? 'Sist kjente værdata fra met.no.' : 'Værdata fra met.no.'}</p>
              {weather.status === 'ready' && weather.stale ? <button type="button" disabled={refreshing} onClick={retryWeather}>{refreshing ? 'Oppdaterer' : 'Oppdater'}</button> : null}
            </div>

            <section className="outfit-block">
              <img className="home-avatar" src="/snudly-owner/avatar-a-home-gold.webp" alt="" aria-hidden="true" />
              <header className="home-heading">
                <h1 className="home-title">Dagens antrekk</h1>
                <p className="home-subtitle">{model.summary} — <b>{model.reason}</b></p>
              </header>

              <ol className="garment-list" aria-label={`${model.garmentCount} anbefalte plagg`}>
                {model.garments.map((garment, index) => (
                  <li className="garment-item" key={garment.id}>
                    <button
                      className="garment-row"
                      type="button"
                      aria-label={`Åpne detaljer om ${garment.name}`}
                      onClick={(event) => {
                        garmentTrigger.current = event.currentTarget;
                        setSelectedGarment(garment);
                      }}
                    >
                      <span className="garment-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="garment-thumb"><GarmentVisual image={garment.image} name={garment.name} /></span>
                      <span className="garment-copy">
                        <strong>{garment.name}</strong>
                        <span>{garment.role}</span>
                      </span>
                      <span className="row-arrow" aria-hidden="true"><ChevronIcon /></span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            {model.nextChange ? (
              <button className="next-peek" type="button" onClick={() => onSelectTab?.('plan')}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth={1.8} /><path d="M12 8v4.2l2.8 1.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg>
                <span className="peek-copy">Neste klesbytte <b>{model.nextChange.time}</b> · {model.nextChange.action}</span>
                <span className="peek-go">Planlegg <ChevronIcon /></span>
              </button>
            ) : null}
            <p className="guidance-disclaimer">Veiledende råd — følg med på barnet og bruk skjønn.</p>
          </>
        ) : null}
        </div>
      </section>

      {selectedGarment && model ? (
        <div className="garment-detail-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeGarmentDetail();
        }}>
          <section
            className="garment-detail-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="garment-detail-title"
          >
            <span className="garment-detail-handle" aria-hidden="true" />
            <header className="garment-detail-header">
              <div>
                <span>{selectedGarment.role}</span>
                <h2 id="garment-detail-title">{selectedGarment.name}</h2>
              </div>
              <button
                ref={garmentClose}
                className="garment-detail-close"
                type="button"
                aria-label="Lukk plaggdetaljer"
                onClick={closeGarmentDetail}
              >
                <CloseIcon />
              </button>
            </header>
            <div className="garment-detail-art">
              <GarmentVisual image={selectedGarment.image} name={selectedGarment.name} />
            </div>
            <p>{garmentDescription(selectedGarment, model.situationLabel)}</p>
            <button className="sn-button garment-detail-primary" type="button" onClick={closeGarmentDetail}>Ferdig</button>
          </section>
        </div>
      ) : null}

      <BottomTabBar
        active="home"
        onSelectTab={onSelectTab ?? (() => undefined)}
        enabledTabs={onSelectTab ? ['home', 'plan', 'tools', 'family'] : ['home']}
      />
    </main>
  );
}
