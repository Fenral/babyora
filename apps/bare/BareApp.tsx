/**
 * BareApp — Babyora-naken-versjon (2026-06-21).
 *
 * Sivert: «Lag en ny versjon som tar med seg alt av data, motor osv men
 * fjerner alt av design. Jeg ønsker bare at ikke gamle koder skal blandes.»
 *
 * Re-bruker eksisterende motor 100%:
 *  - useWeather (met.no API + parsing)
 *  - recommend (wool-layers/recommend.ts — single source of truth for plagg)
 *  - garmentIdFor (mapping plaggnavn → garment-ID for plagg-detalj-link)
 *
 * IKKE importert: instrument-tokens, screen-CSS, design-komponenter, audit-
 * tiltak-system. Ingen className. Ingen style-prop unntatt minimum reset.
 * Plain semantic HTML. Klar for nytt design fra null.
 *
 * Live: https://wool-app.vercel.app/bare/
 */

import { useEffect, useMemo, useState } from 'react';
import { useWeather } from '../../src/hooks/useWeather';
import { recommend } from '../../src/lib/wool-layers/recommend';
import { garmentIdFor } from '../../src/data/garment-illustrations';

type Activity = 'utelek' | 'vogn';

const DEFAULT_LAT = 60.8867; // Elverum
const DEFAULT_LON = 11.5614;

export function BareApp() {
  const weather = useWeather(DEFAULT_LAT, DEFAULT_LON);
  const [activity, setActivity] = useState<Activity>('utelek');
  const [ageMonths, setAgeMonths] = useState<number>(12);

  // Mount minimal reset så typografi er lesbar — ingen kosmetikk.
  useEffect(() => {
    document.documentElement.style.colorScheme = 'light';
    document.body.style.margin = '0';
    document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    document.body.style.fontSize = '16px';
    document.body.style.lineHeight = '1.5';
    document.body.style.color = '#000';
    document.body.style.background = '#fff';
    document.body.style.padding = '16px';
  }, []);

  const fullRec = useMemo(() => {
    if (!weather.now) return null;
    const { tempC, windMs } = weather.now;
    return recommend({
      weather: {
        tempC,
        feelsLikeC: tempC - Math.max(1, windMs * 0.7),
        windMs,
        precipMmH: weather.now.precipMmH ?? 0,
        symbolCode: weather.now.symbolCode ?? 'lightsnow',
      },
      child: { ageMonths },
      activity,
    });
  }, [weather.now, ageMonths, activity]);

  if (weather.status === 'loading' || !weather.now) {
    return <p>Laster vær …</p>;
  }
  if (weather.status === 'error') {
    return <p>Feil: {weather.error}</p>;
  }
  if (!fullRec) {
    return <p>Ingen anbefaling tilgjengelig.</p>;
  }

  const { tempC, windMs, symbolCode } = weather.now;
  const feels = Math.round(tempC - Math.max(1, windMs * 0.7));

  return (
    <main>
      <header>
        <h1>Babyora — naken</h1>
        <p>Elverum · {tempC}° · Føles {feels}° · vind {windMs} m/s · {symbolCode}</p>
      </header>

      <section>
        <h2>Aktivitet</h2>
        <label>
          <input
            type="radio"
            name="activity"
            checked={activity === 'utelek'}
            onChange={() => setActivity('utelek')}
          />
          Utelek
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            name="activity"
            checked={activity === 'vogn'}
            onChange={() => setActivity('vogn')}
          />
          I vogn
        </label>
      </section>

      <section>
        <h2>Alder (måneder)</h2>
        <input
          type="number"
          min={0}
          max={36}
          value={ageMonths}
          onChange={(e) => setAgeMonths(Number(e.target.value) || 0)}
        />
      </section>

      <section>
        <h2>Anbefalte lag</h2>
        <ol>
          {fullRec.layers.map((layer) => (
            <li key={layer.category}>
              <strong>{layer.category}</strong>
              <ul>
                {layer.items.map((item) => {
                  const id = garmentIdFor(item);
                  return (
                    <li key={item}>
                      {id ? <a href={`#${id}`}>{item}</a> : item}
                      {id && <small> (id: {id})</small>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {fullRec.safetyFlags && fullRec.safetyFlags.length > 0 && (
        <section>
          <h2>Sikkerhets-flagg</h2>
          <ul>
            {fullRec.safetyFlags.map((flag, i) => (
              <li key={i}>{flag.severity}: {flag.message}</li>
            ))}
          </ul>
        </section>
      )}

      {fullRec.notes && fullRec.notes.length > 0 && (
        <section>
          <h2>Notater</h2>
          <ul>
            {fullRec.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Rå motor-output (debug)</h2>
        <pre style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, overflow: 'auto' }}>
          {JSON.stringify(fullRec, null, 2)}
        </pre>
      </section>

      <footer>
        <p><small>{weather.attribution}</small></p>
      </footer>
    </main>
  );
}
