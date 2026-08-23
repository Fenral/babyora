import { useMemo, useState } from 'react';
import type { SnudlySituation } from '../../packages/snudly-engine';
import type { OnboardingDraft } from './app-flow';
import { calculateSleepLayers, calculateWeatherOutfit } from './calculator-model';
import { ageInCompleteMonths } from './home-model';
import { BackButton, ChevronIcon, ProductScreen, SegmentedControl, type ProductTab } from './ui';

type Tool = 'menu' | 'weather' | 'sleep' | 'winter' | 'temperature';

function ageFor(profile: OnboardingDraft): number {
  try { return ageInCompleteMonths(profile.birthDate, new Date()); } catch { return 10; }
}

function WeatherCalculator({ profile, onBack }: { profile: OnboardingDraft; onBack: () => void }) {
  const [temperatureC, setTemperatureC] = useState(7);
  const [feelsLikeC, setFeelsLikeC] = useState(6);
  const [wind, setWind] = useState(2);
  const [precipitation, setPrecipitation] = useState(0.4);
  const [situation, setSituation] = useState<SnudlySituation>('outdoor-play');
  const result = useMemo(() => calculateWeatherOutfit({
    childAgeMonths: ageFor(profile),
    temperatureC,
    feelsLikeC,
    windMetersPerSecond: wind,
    precipitationMillimetersPerHour: precipitation,
    situation,
  }), [feelsLikeC, precipitation, profile, situation, temperatureC, wind]);

  return (
    <section className="tool-detail" aria-labelledby="weather-calculator-title">
      <BackButton label="Alle verktøy" onClick={onBack} />
      <header><h2 id="weather-calculator-title">Værkalkulator</h2><p>Juster forholdene og se anbefalingen endre seg med den ekte Snudly-motoren.</p></header>
      <SegmentedControl
        label="Situasjon"
        value={situation}
        options={[{ value: 'outdoor-play', label: 'Utelek' }, { value: 'stroller', label: 'I vogn' }]}
        onChange={setSituation}
      />
      <div className="sn-card calculator-controls">
        <label><span>Temperatur <b>{temperatureC}°</b></span><input className="sn-slider" type="range" min="-20" max="25" value={temperatureC} onChange={(event) => setTemperatureC(Number(event.target.value))} /></label>
        <label><span>Føles som <b>{feelsLikeC}°</b></span><input className="sn-slider" type="range" min="-25" max="25" value={feelsLikeC} onChange={(event) => setFeelsLikeC(Number(event.target.value))} /></label>
        <label><span>Vind <b>{wind} m/s</b></span><input className="sn-slider" type="range" min="0" max="20" step="0.5" value={wind} onChange={(event) => setWind(Number(event.target.value))} /></label>
        <label><span>Nedbør <b>{precipitation.toFixed(1)} mm/t</b></span><input className="sn-slider" type="range" min="0" max="10" step="0.1" value={precipitation} onChange={(event) => setPrecipitation(Number(event.target.value))} /></label>
      </div>
      <section className="sn-card calculator-result" aria-live="polite">
        <p><small>Forslag nå</small><strong>{result.garments.length} plagg</strong></p>
        <ol>{result.garments.map((garment) => <li key={garment.id}><b>{garment.name}</b><span>{garment.role}</span></li>)}</ol>
      </section>
      <p className="guidance-disclaimer">Veiledende råd — følg med på barnet og bruk skjønn.</p>
    </section>
  );
}

function SleepCalculator({ onBack }: { onBack: () => void }) {
  const [roomTemperature, setRoomTemperature] = useState(19);
  const result = calculateSleepLayers(roomTemperature);
  return (
    <section className="tool-detail" aria-labelledby="sleep-calculator-title">
      <BackButton label="Alle verktøy" onClick={onBack} />
      <header><h2 id="sleep-calculator-title">Sovekalkulator</h2><p>Velg romtemperatur for et veiledende forslag til sovepose og lag under.</p></header>
      <div className="sn-card calculator-controls">
        <label><span>Romtemperatur <b>{roomTemperature}°</b></span><input className="sn-slider" type="range" min="10" max="30" value={roomTemperature} onChange={(event) => setRoomTemperature(Number(event.target.value))} /></label>
      </div>
      <section className="sn-card sleep-result" aria-live="polite">
        <small>Anbefalt sovepose</small>
        <strong>{result.tog} TOG</strong>
        <p>{result.layersUnder}</p>
      </section>
      <p className="guidance-disclaimer">Sjekk alltid nakken. Unngå løse tepper og puter i barnets seng.</p>
    </section>
  );
}

function GuideDetail({ tool, onBack }: { tool: 'winter' | 'temperature'; onBack: () => void }) {
  const winter = tool === 'winter';
  return (
    <section className="tool-detail" aria-labelledby="guide-detail-title">
      <BackButton label="Alle verktøy" onClick={onBack} />
      <header><h2 id="guide-detail-title">{winter ? 'Første vinter' : 'For varm eller kald?'}</h2><p>{winter ? 'Åtte korte leksjoner for barnets første kalde sesong.' : 'Bruk nakketesten og se etter barnets egne signaler.'}</p></header>
      <section className="sn-card curiosity-list"><h2>{winter ? 'Dette går vi gjennom' : 'Tre enkle tegn'}</h2><ul>{winter ? <><li>Lag på lag uten å overkle</li><li>Vind, regn og kulde</li><li>Vogn, bilstol og innepauser</li></> : <><li>Varm og svett nakke</li><li>Kald hud etter tid ute</li><li>Uro eller slapphet</li></>}</ul></section>
      <p className="guidance-disclaimer">Veiledende råd — følg med på barnet og bruk skjønn.</p>
    </section>
  );
}

export function ToolsScreen({ profile, onSelectTab }: { profile: OnboardingDraft; onSelectTab: (tab: ProductTab) => void }) {
  const [tool, setTool] = useState<Tool>('menu');
  return (
    <ProductScreen title="Verktøy" subtitle="Kalkulatorer og korte guider når forholdene skifter." activeTab="tools" onSelectTab={onSelectTab}>
      {tool === 'menu' ? (
        <section aria-label="Kalkulatorer">
          <button className="weather-hero" type="button" aria-label="Værkalkulator" onClick={() => setTool('weather')}>
            <span className="weather-copy"><span className="weather-chip">7° · Føles som 6° → anbefaling</span><strong>Vær-<br />kalkulator</strong><p>Se hvordan forholdene påvirker klærne.</p></span>
            <span className="weather-art" aria-hidden="true"><span className="weather-object sprite sprite-weather" /></span>
            <span className="hero-action">Prøv med dagens forhold <ChevronIcon /></span>
          </button>
          <section className="tools-shelf">
            <button className="tool-row" type="button" onClick={() => setTool('sleep')}><span className="tool-art sprite sprite-sleep" /><span className="tool-copy"><strong>Sovekalkulator</strong><span>TOG og lag for rommet</span></span><span className="tool-arrow"><ChevronIcon /></span></button>
            <button className="tool-row" type="button" onClick={() => setTool('winter')}><span className="tool-art sprite sprite-winter" /><span className="tool-copy"><strong>Første vinter</strong><span>Åtte korte leksjoner</span></span><span className="tool-arrow"><ChevronIcon /></span></button>
            <button className="tool-row" type="button" onClick={() => setTool('temperature')}><span className="tool-art sprite sprite-temperature" /><span className="tool-copy"><strong>For varm eller kald?</strong><span>Nakketesten, forklart enkelt</span></span><span className="tool-arrow"><ChevronIcon /></span></button>
          </section>
          <button className="tools-last" type="button" onClick={() => setTool('sleep')}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 8.2A8 8 0 1 1 4 14M4.5 8.2V3.5m0 4.7H9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Sist brukt: <b>Sovekalkulator</b> · i går kveld</span><span className="peek-go">Åpne <ChevronIcon /></span>
          </button>
          <p className="tools-note">Dagens antrekk på Hjem beregnes med Værkalkulatoren.</p>
        </section>
      ) : null}
      {tool === 'weather' ? <WeatherCalculator profile={profile} onBack={() => setTool('menu')} /> : null}
      {tool === 'sleep' ? <SleepCalculator onBack={() => setTool('menu')} /> : null}
      {tool === 'winter' || tool === 'temperature' ? <GuideDetail tool={tool} onBack={() => setTool('menu')} /> : null}
    </ProductScreen>
  );
}
