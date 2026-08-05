/**
 * Lab-shell: scenariovelger + fire ruter (P1–P4, bygges etter Sols review)
 * + FELLES-fanen som demonstrerer alle delte komponenter mot valgt scenario,
 * slik at fundamentet kan verifiseres visuelt før prototypene bygges.
 */

import { useMemo, useState, type CSSProperties } from 'react';
import { SCENARIER, scenarioForId, type Scenario } from './felles/scenarier';
import { kjorMotor, kjorMotorForVaer, delFlags } from './felles/motor';
import {
  LabRamme,
  Raad,
  Gyldighet,
  Kvittering,
  Sikkerhetsblokk,
  SikkerhetsblokkFraFlag,
  Degradert,
} from './felles/komponenter';
import {
  vaerTilKonsekvens,
  usikrestPremiss,
  deltaSetning,
} from './felles/tekst';

type Rute = 'felles' | 'p1' | 'p2' | 'p3' | 'p4';

const RUTER: { id: Rute; navn: string }[] = [
  { id: 'felles', navn: 'FELLES' },
  { id: 'p1', navn: 'P1' },
  { id: 'p2', navn: 'P2' },
  { id: 'p3', navn: 'P3' },
  { id: 'p4', navn: 'P4' },
];

const SYSTEMFONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const knapp = (aktiv: boolean): CSSProperties => ({
  minHeight: 48,
  minWidth: 48,
  padding: '0 16px',
  fontSize: 16,
  fontFamily: 'inherit',
  fontWeight: aktiv ? 700 : 400,
  color: '#1a1a1a',
  background: aktiv ? '#e6e6e6' : '#ffffff',
  border: aktiv ? '2px solid #1a1a1a' : '1px solid #b3b3b3',
  borderRadius: 6,
  cursor: 'pointer',
});

export function LabShell() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIER[0].id);
  const [rute, setRute] = useState<Rute>('felles');

  const scenario = scenarioForId(scenarioId) ?? SCENARIER[0];

  return (
    <div
      style={{
        fontFamily: SYSTEMFONT,
        fontSize: 16,
        lineHeight: 1.5,
        color: '#1a1a1a',
        background: '#ffffff',
        minHeight: '100vh',
        padding: 16,
      }}
    >
      <header style={{ maxWidth: 640, margin: '0 auto 16px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>Babyora — Design-lab (fase 9)</h1>
        <p style={{ margin: '0 0 12px', color: '#4d4d4d', fontSize: 14 }}>
          Delt fundament: motoradapter, ti scenarier, retningsnøytrale komponenter.
        </p>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            Scenario
          </span>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            style={{
              minHeight: 48,
              width: '100%',
              fontSize: 16,
              fontFamily: 'inherit',
              padding: '0 8px',
              border: '1px solid #b3b3b3',
              borderRadius: 6,
              background: '#ffffff',
              color: '#1a1a1a',
            }}
          >
            {SCENARIER.map((s) => (
              <option key={s.id} value={s.id}>
                {s.navn}
              </option>
            ))}
          </select>
        </label>

        <nav aria-label="Prototyper" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RUTER.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRute(r.id)}
              aria-pressed={rute === r.id}
              style={knapp(rute === r.id)}
            >
              {r.navn}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto' }}>
        {rute === 'felles' ? (
          <FellesDemo scenario={scenario} />
        ) : (
          <Plassholder kode={rute.toUpperCase()} />
        )}
      </main>
    </div>
  );
}

function Plassholder({ kode }: { kode: string }) {
  return (
    <section
      style={{
        border: '1px dashed #b3b3b3',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        color: '#4d4d4d',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: '#1a1a1a' }}>{kode}</p>
      <p style={{ margin: '8px 0 0' }}>Bygges etter Sols review.</p>
    </section>
  );
}

/**
 * FELLES-fanen: kjører motoren for valgt scenario og viser alle delte
 * komponenter i INV-rekkefølge (sikkerhet → råd → gyldighet → kvittering).
 */
function FellesDemo({ scenario }: { scenario: Scenario }) {
  const resultat = useMemo(() => kjorMotor(scenario), [scenario]);

  return (
    <LabRamme
      storTekst={scenario.flags.storTekst}
      hoyKontrast={scenario.flags.hoyKontrast}
    >
      <p style={{ margin: '0 0 12px', fontSize: '0.85em', color: '#4d4d4d' }}>
        {scenario.beskrivelse}
      </p>

      {scenario.flags.nyOmsorgsperson && (
        <p style={{ margin: '0 0 12px', fontSize: '0.9em' }}>
          Dette rådet er delt med deg. Grunnlaget og gyldigheten står i kortet —
          du trenger ikke appen for å følge det.
        </p>
      )}

      {resultat.status === 'degradert' ? (
        <Degradert aarsak={resultat.aarsak} />
      ) : (
        <MotorVisning scenario={scenario} />
      )}
    </LabRamme>
  );
}

function MotorVisning({ scenario }: { scenario: Scenario }) {
  const weather = scenario.weather;
  if (!weather) return null;

  const resultat = kjorMotorForVaer(weather, scenario);
  const rec = resultat.recommendation;
  const { hard, soft } = delFlags(rec.safetyFlags);
  const fk = vaerTilKonsekvens(weather);

  const plaggliste = rec.layers
    .filter((l) => l.items.length > 0)
    .map((l) => `${l.category}: ${l.items.join(', ')}`);

  return (
    <>
      {hard.map((flag) => (
        <SikkerhetsblokkFraFlag
          key={flag.code}
          flag={flag}
          gjelderTil={scenario.gyldigTil}
        />
      ))}

      <Raad
        forhold={fk.forhold}
        konsekvens={fk.konsekvens}
        handling={
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            {plaggliste.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        }
        grunnlag={
          <div>
            <p style={{ margin: 0 }}>
              Lufttemperatur {weather.tempC} °C · føles som{' '}
              {Math.round(resultat.feelsLikeC)} °C · vind {weather.windMs} m/s ·
              nedbør {weather.precipMmH} mm/t · {weather.symbolCode} · temperaturbånd{' '}
              {resultat.band}
            </p>
            {scenario.weatherIGaar && (
              <p style={{ margin: '0.5em 0 0' }}>
                {deltaSetning(scenario.weatherIGaar, weather)}
              </p>
            )}
            {rec.notes.length > 0 && (
              <ul style={{ margin: '0.5em 0 0', paddingLeft: '1.2em' }}>
                {rec.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        }
      />

      {soft.map((flag) => (
        <SikkerhetsblokkFraFlag
          key={flag.code}
          flag={flag}
          gjelderTil={scenario.gyldigTil}
        />
      ))}

      <Gyldighet til={scenario.gyldigTil} />

      <Kvittering
        tempC={weather.tempC}
        windMs={weather.windMs}
        ageMonths={scenario.child.ageMonths}
        usikrest={usikrestPremiss(weather)}
      />

      <DemoKatalog gjelderTil={scenario.gyldigTil} />
    </>
  );
}

/**
 * Statisk komponentkatalog nederst i FELLES-fanen: viser Sikkerhetsblokk
 * (hard + soft) og Degradert også når scenariet ikke utløser dem, slik at
 * hele biblioteket kan inspiseres visuelt uansett valgt scenario.
 */
function DemoKatalog({ gjelderTil }: { gjelderTil: string }) {
  const [vis, setVis] = useState(false);
  return (
    <section style={{ marginTop: '1.5em' }}>
      <button
        type="button"
        onClick={() => setVis((v) => !v)}
        aria-expanded={vis}
        style={{
          minHeight: '3em',
          padding: '0 1em',
          fontSize: '1em',
          fontFamily: 'inherit',
          color: '#1a1a1a',
          background: '#f2f2f2',
          border: '1px solid #b3b3b3',
          borderRadius: '0.4em',
          cursor: 'pointer',
        }}
      >
        {vis ? 'Skjul komponentkatalog' : 'Vis komponentkatalog (alle tilstander)'}
      </button>
      {vis && (
        <div style={{ marginTop: '1em' }}>
          <Sikkerhetsblokk
            type="hard"
            handling="Ta av vinterdressen før bilstolen"
            konsekvens="Tykk dress presses sammen i kollisjon — selen blir for løs"
            gjelderTil={gjelderTil}
            kilder={['NHTSA']}
          />
          <Sikkerhetsblokk
            type="soft"
            handling="Sjekk nakken etter ti minutter"
            konsekvens="Grensevær gjør det lett å bomme ett lag — nakken forteller sannheten"
            gjelderTil={gjelderTil}
          />
          <Degradert aarsak="Eksempel på maskert tilstand (komponentkatalog)." />
        </div>
      )}
    </section>
  );
}
