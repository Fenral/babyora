import { useEffect, useMemo, useState } from 'react';
import type { OnboardingDraft } from './app-flow';
import { calculateWeatherOutfit } from './calculator-model';
import { ageInCompleteMonths } from './home-model';
import { ProductScreen, type ProductTab } from './ui';
import { loadCityWeather, type CityWeather } from './weather-service';

type PlanDay = 'today' | 'tomorrow';
type Metric = 'temp' | 'wind' | 'rain';
type PlanPoint = Readonly<{ time: Date; tempC: number; feelsLikeC: number; windMs: number; precipMmH: number; garmentCount: number }>;
const X = [30, 89, 148, 208, 267, 326] as const;

function buildPoints(weather: CityWeather, day: PlanDay, ageMonths: number): PlanPoint[] {
  const offset = day === 'today' ? 0 : 24;
  return weather.hourly.slice(offset, offset + 6).map((point) => ({
    ...point,
    garmentCount: calculateWeatherOutfit({
      childAgeMonths: ageMonths,
      temperatureC: point.tempC,
      feelsLikeC: point.feelsLikeC,
      windMetersPerSecond: point.windMs,
      precipitationMillimetersPerHour: point.precipMmH,
      situation: 'outdoor-play',
    }).garments.length,
  }));
}

function metricValue(point: PlanPoint, metric: Metric): number {
  if (metric === 'wind') return point.windMs;
  if (metric === 'rain') return point.precipMmH;
  return point.feelsLikeC;
}

function chartGeometry(points: readonly PlanPoint[], metric: Metric) {
  const values = points.map((point) => metricValue(point, metric));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(1, maximum - minimum);
  const ys = values.map((value) => 148 - ((value - minimum) / span) * 91);
  const line = ys.length === 0 ? '' : `M${X[0]} ${ys[0]} ${ys.slice(1).map((y, index) => `C${X[index] + 24} ${ys[index]}, ${X[index + 1] - 24} ${y}, ${X[index + 1]} ${y}`).join(' ')}`;
  return { minimum, maximum, ys, line, area: line ? `${line} L326 196 L30 196 Z` : '' };
}

function rangeLabel(points: readonly PlanPoint[], metric: Metric): string {
  const values = points.map((point) => metricValue(point, metric));
  if (values.length === 0) return '–';
  const rounded = (value: number) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value);
  const suffix = metric === 'wind' ? ' m/s' : metric === 'rain' ? ' mm' : '°';
  return `${rounded(Math.min(...values))}–${rounded(Math.max(...values))}${suffix}`;
}

function ContextIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" stroke="currentColor" strokeWidth={1.8} /><circle cx="12" cy="9" r="2.2" fill="currentColor" /></svg>;
}

export function PlanScreen({ profile, onSelectTab }: { profile: OnboardingDraft; onSelectTab: (tab: ProductTab) => void }) {
  const [day, setDay] = useState<PlanDay>('today');
  const [metric, setMetric] = useState<Metric>('temp');
  const [weather, setWeather] = useState<CityWeather | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void loadCityWeather(profile.city, controller.signal).then((nextWeather) => {
      setWeather(nextWeather);
      setError(false);
    }, () => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [profile.city, reload]);

  const points = useMemo(() => {
    if (!weather) return [];
    try { return buildPoints(weather, day, ageInCompleteMonths(profile.birthDate, weather.evaluatedAt)); }
    catch { return []; }
  }, [day, profile.birthDate, weather]);
  const geometry = chartGeometry(points, metric);
  const baseline = points[0]?.garmentCount ?? 0;
  const foundChangeIndex = points.findIndex((point, index) => index > 0 && point.garmentCount !== baseline);
  const boundedChangeIndex = Math.min(foundChangeIndex >= 1 ? foundChangeIndex : 3, Math.max(0, points.length - 1));
  const changePoint = points[boundedChangeIndex] ?? null;
  const markerX = X[boundedChangeIndex] ?? X[3];
  const changeTime = changePoint ? new Intl.DateTimeFormat('nb-NO', { hour: '2-digit', minute: '2-digit' }).format(changePoint.time) : '14:00';
  const afterCount = changePoint?.garmentCount ?? baseline;
  const changeVerb = afterCount < baseline ? 'Ta av ett lag når det blir mildere' : afterCount > baseline ? 'Legg til ett lag når det blir kjøligere' : 'Behold antrekket gjennom perioden';
  const unit = metric === 'wind' ? ' m/s' : metric === 'rain' ? ' mm' : '°';
  const fmt = (value: number) => `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)}${unit}`;

  const heading = <><header className="plan-header"><h1>Planlegg</h1><div className="day-switch" role="group" aria-label="Velg dag"><button className="day-button" type="button" aria-pressed={day === 'today'} onClick={() => setDay('today')}>I dag</button><button className="day-button" type="button" aria-pressed={day === 'tomorrow'} onClick={() => setDay('tomorrow')}>I morgen</button></div></header><p className="plan-tagline">Været er bare tidslinjen. Plaggbyttet er beslutningen.</p></>;

  return (
    <ProductScreen title="Planlegg" subtitle="" heading={heading} activeTab="plan" onSelectTab={onSelectTab}>
      {!weather && !error ? <section className="plan-surface plan-message" role="status">Henter planen …</section> : null}
      {error ? <section className="plan-surface plan-message" role="alert">Planen kan ikke oppdateres.<button type="button" onClick={() => { setError(false); setWeather(null); setReload((value) => value + 1); }}>Prøv igjen</button></section> : null}
      {points.length ? (
        <section className="plan-surface">
          <header className="plan-intro"><div><small>{profile.city} · {day === 'today' ? 'i dag' : 'i morgen'}</small><h2>{day === 'today' ? 'Hva trenger vi senere?' : 'Dette bør ligge klart'}</h2>{day === 'today' ? <p className="day-hint">I morgen kan klesbehovet endre seg</p> : null}</div><span className="context-chip"><ContextIcon /><span className="sr-only">Situasjon: </span>Utelek</span></header>
          <div className="metric-tabs" role="group" aria-label="Velg værgraf">
            {(['temp', 'wind', 'rain'] as const).map((key) => <button className="metric-tab" type="button" aria-pressed={metric === key} onClick={() => setMetric(key)} key={key}><span>{key === 'temp' ? 'Temperatur' : key === 'wind' ? 'Vind' : 'Regn'}</span><strong>{rangeLabel(points, key)}</strong></button>)}
          </div>
          <div className="chart-wrap">
            <svg className="chart" viewBox="0 0 340 226" role="img" aria-label={`${metric === 'temp' ? 'Temperatur' : metric === 'wind' ? 'Vind' : 'Regn'} gjennom dagen`}>
              <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--sage-deep)" stopOpacity=".38" /><stop offset="1" stopColor="var(--sage-deep)" stopOpacity=".02" /></linearGradient></defs>
              <line className="chart-grid" x1="26" y1="34" x2="330" y2="34" /><line className="chart-grid" x1="26" y1="91" x2="330" y2="91" /><line className="chart-grid" x1="26" y1="148" x2="330" y2="148" />
              <text className="chart-axis" x="2" y="37">{fmt(geometry.maximum)}</text><text className="chart-axis" x="2" y="94">{fmt((geometry.maximum + geometry.minimum) / 2)}</text><text className="chart-axis" x="2" y="151">{fmt(geometry.minimum)}</text>
              <rect className="zone-before" x="26" y="32" width={Math.max(0, markerX - 26)} height="164" rx="6" /><rect className="zone-after" x={markerX} y="32" width={Math.max(0, 330 - markerX)} height="164" rx="6" />
              <text className="zone-label zone-label--before" x={(26 + markerX) / 2} y="50" textAnchor="middle">{baseline} plagg</text><text className="zone-label zone-label--after" x={(markerX + 330) / 2} y="50" textAnchor="middle">{afterCount} plagg</text>
              <path className="chart-area" d={geometry.area} /><path className="chart-line" d={geometry.line} />
              {geometry.ys.map((y, index) => <circle className="chart-point" cx={X[index]} cy={y} r="3.5" key={X[index]} />)}
              <line className="change-line" x1={markerX} x2={markerX} y1="4" y2="196" /><rect className="change-pill" x={markerX - 22} y="4" width="44" height="23" rx="11.5" /><text className="change-copy" x={markerX} y="19" textAnchor="middle">{changeTime}</text>
              {points.map((point, index) => <text className="chart-axis" x={X[index]} y="216" textAnchor="middle" key={point.time.toISOString()}>{new Intl.DateTimeFormat('nb-NO', { hour: '2-digit' }).format(point.time)}</text>)}
            </svg>
          </div>
          <article className="next-change"><div className="next-change-head"><small>Neste klesbytte · {changeTime}</small></div><strong>{changeVerb}</strong><div className="change-items"><span className="change-item"><img src="/monter/plagg-ull-mellomlag.webp" alt="" />Juster ett lag</span></div></article>
        </section>
      ) : null}
    </ProductScreen>
  );
}
