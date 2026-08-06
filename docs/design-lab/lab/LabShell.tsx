/**
 * Lab-shell — TESTSELEN eier eksperimentet (spec v2 §1 pkt. 4):
 * scenario, virtuell klokke, logging, rekkefølge (Williams-design),
 * forskningsdisclaimer og nullarmene.
 *
 * To moduser (Sols fase 10-review, FELLES-P0):
 *  - OPERATØRMODUS (standard): alt operatørutstyr (scenariovelger,
 *    armknapper, klokkepanel, Williams-rekkefølge, hendelseslogg) ligger i
 *    ett kollapsbart Operatør-panel — deltakerflaten dominerer.
 *  - DELTAKERMODUS (låst, styrt av URL:
 *    ?modus=deltaker&arm=p1&scenario=bilstol — skjermbevis-skriptets
 *    kontrakt): ALT operatørutstyr er skjult. Første viewport viser
 *    oppgaveprompten (én setning fra manifestets aktive oppgave) og
 *    retningens kjerneflate. Kun et diskret klokkemerke beholdes for
 *    skjermbevis.
 *
 * Hierarki (Sols hierarki-P2): selens egne flater bruker typografi og
 * avstand, ikke rammer; sterke grenser er forbeholdt interaktive
 * elementer (knapper, felter) og disclaimer-porten.
 *
 * Rutene P1–P3 kobles fra lab/pN/index.tsx ({ manifest, Prototype });
 * P4 kobles automatisk når lab/p4/index.tsx finnes. FELLES-fanen er
 * demokatalogen for de retningsnøytrale komponentene.
 */

/// <reference types="vite/client" />

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
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
import { klokkeForScenario, type LabKlokke } from './felles/sele/klokke';
import { lagLogg } from './felles/sele/logging';
import {
  ARM_NAVN,
  SCENARIOFAMILIER,
  WILLIAMS_ARMSEKVENSER,
  erCarryoverBalansert,
  erPosisjonsbalansert,
  rekkefolgeForDeltaker,
  tildelScenarier,
  type Arm,
} from './felles/sele/rekkefolge';
import {
  ALLE_NULLARMER,
  NULLARMER,
  standardNullarm,
  type Nullarm,
} from './felles/sele/nullarmer';
import {
  lesLabParametre,
  oppgavePromptFraManifest,
} from './felles/sele/deltakermodus';
import { Nullmodell } from './felles/sele/nullmodell';
import { Disclaimer } from './felles/sele/disclaimer';
import * as P1Modul from './p1/index';
import * as P2Modul from './p2/index';
import * as P3Modul from './p3/index';

type SeleLogg = (...args: unknown[]) => void;

type PrototypeModul = {
  manifest: { navn: string };
  Prototype: ComponentType<{
    scenario: Scenario;
    klokke: LabKlokke;
    logg?: SeleLogg;
  }>;
};

/** P4 finnes først når komposisjonsagenten har levert lab/p4/index.tsx. */
const P4_GLOB = import.meta.glob('./p4/index.tsx', {
  eager: true,
}) as Record<string, PrototypeModul>;

const MODULER: Partial<Record<Arm, PrototypeModul>> = {
  p1: P1Modul as unknown as PrototypeModul,
  p2: P2Modul as unknown as PrototypeModul,
  p3: P3Modul as unknown as PrototypeModul,
  p4: P4_GLOB['./p4/index.tsx'],
};

type Rute = 'felles' | Arm;

const RUTER: { id: Rute; navn: string }[] = [
  { id: 'felles', navn: 'FELLES' },
  { id: 'p1', navn: 'P1' },
  { id: 'p2', navn: 'P2' },
  { id: 'p3', navn: 'P3' },
  { id: 'p4', navn: 'P4' },
  { id: 'null', navn: 'NULL' },
];

const SYSTEMFONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const knapp = (aktiv: boolean, deaktivert = false): CSSProperties => ({
  minHeight: 48,
  minWidth: 48,
  padding: '0 16px',
  fontSize: 16,
  fontFamily: 'inherit',
  fontWeight: aktiv ? 700 : 400,
  color: deaktivert ? '#767676' : '#1a1a1a',
  background: aktiv ? '#e6e6e6' : '#ffffff',
  border: aktiv ? '2px solid #1a1a1a' : '1px solid #b3b3b3',
  borderRadius: 6,
  cursor: deaktivert ? 'default' : 'pointer',
});

/** Selens seksjoner: typografi + avstand, ingen ramme (hierarki-P2). */
const seleSeksjon: CSSProperties = { margin: '0 0 20px' };

const REKKEFOLGE_BALANSERT =
  erCarryoverBalansert(WILLIAMS_ARMSEKVENSER) &&
  erPosisjonsbalansert(WILLIAMS_ARMSEKVENSER);

export function LabShell() {
  // URL-parametrene leses én gang ved oppstart — deltakermodus er LÅST.
  const params = useMemo(
    () =>
      lesLabParametre(
        typeof window === 'undefined' ? '' : window.location.search,
      ),
    [],
  );
  const deltaker = params.modus === 'deltaker' && params.arm !== null;

  const [scenarioId, setScenarioId] = useState<string>(() =>
    params.scenarioId && scenarioForId(params.scenarioId)
      ? params.scenarioId
      : SCENARIER[0].id,
  );
  const [rute, setRute] = useState<Rute>(() =>
    deltaker ? (params.arm as Rute) : 'felles',
  );
  const [deltakerNr, setDeltakerNr] = useState(1);
  const [nullarmValg, setNullarmValg] = useState<Nullarm | null>(
    params.nullarm,
  );
  const [bekreftede, setBekreftede] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const scenario = scenarioForId(scenarioId) ?? SCENARIER[0];
  const nullarm: Nullarm = nullarmValg ?? standardNullarm(scenario.id);

  // Selen eier klokka: ny klokke fiksert til scenariets «nå» per scenario.
  const klokke = useMemo(() => klokkeForScenario(scenario), [scenario]);
  const [naa, setNaa] = useState('');
  useEffect(() => {
    setNaa(klokke.naaISO());
    return klokke.onTick(() => setNaa(klokke.naaISO()));
  }, [klokke]);

  // Selen eier loggen: én logg for hele økten.
  const [logg] = useState(() => lagLogg());
  const seleLogg = useMemo(
    () => logg.loggerFor('sele', scenario.id, klokke),
    [logg, scenario.id, klokke],
  );
  const ruteLogg = useMemo(
    () =>
      rute === 'felles' ? null : logg.loggerFor(rute, scenario.id, klokke),
    [logg, rute, scenario.id, klokke],
  );

  const oppgaveNokkel = `${rute}|${scenario.id}`;
  const trengerDisclaimer = rute !== 'felles';
  const erBekreftet =
    bekreftede.has(oppgaveNokkel) || (deltaker && params.forhandsbekreftet);

  // Deltakermodus logges ved oppstart; forhåndsbekreftet disclaimer
  // (&bekreftet=1, kun for skjermbevis) logges eksplisitt for revisjon.
  useEffect(() => {
    if (!deltaker) return;
    seleLogg('sele:deltakermodus', {
      arm: params.arm,
      scenarioId: scenario.id,
      ...(params.arm === 'null' ? { nullarm } : {}),
    });
    if (params.forhandsbekreftet) {
      seleLogg('sele:disclaimer_forhandsbekreftet', {
        rute,
        scenarioId: scenario.id,
      });
      seleLogg('sele:oppgave_start', { rute, scenarioId: scenario.id });
    }
    // Kun ved oppstart — deltakermodus er låst til én oppgave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deltaker]);

  function bekreftDisclaimer(): void {
    seleLogg('sele:disclaimer_bekreftet', { rute, scenarioId: scenario.id });
    seleLogg('sele:oppgave_start', { rute, scenarioId: scenario.id });
    setBekreftede((prev) => new Set(prev).add(oppgaveNokkel));
  }

  function spol(min: number): void {
    klokke.spol(min);
    seleLogg('sele:spol', { min, rute });
  }

  const modul = rute === 'felles' ? undefined : MODULER[rute as Arm];

  // Oppgaveprompten: én setning fra manifestets aktive oppgave (FELLES-P0).
  const oppgavePrompt =
    rute === 'null'
      ? NULLARMER[nullarm].oppgavePrompt
      : rute === 'felles'
        ? null
        : oppgavePromptFraManifest(modul?.manifest);

  const kjerneflate =
    rute === 'felles' ? (
      <FellesDemo scenario={scenario} />
    ) : !erBekreftet ? (
      <Disclaimer
        oppgaveNavn={
          rute === 'null'
            ? `nullmodell-oppgaven (${NULLARMER[nullarm].oppgavetype})`
            : `oppgaven (${rute.toUpperCase()})`
        }
        storTekst={scenario.flags.storTekst}
        hoyKontrast={scenario.flags.hoyKontrast}
        onBekreft={bekreftDisclaimer}
      />
    ) : (
      <>
        {oppgavePrompt && (
          <p
            style={{
              margin: '0 auto 16px',
              maxWidth: 480,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {oppgavePrompt}
          </p>
        )}
        {rute === 'null' ? (
          <Nullmodell
            scenario={scenario}
            klokke={klokke}
            nullarm={nullarm}
            logg={ruteLogg ?? undefined}
          />
        ) : modul ? (
          <modul.Prototype
            scenario={scenario}
            klokke={klokke}
            logg={ruteLogg ?? undefined}
          />
        ) : (
          <Plassholder kode={rute.toUpperCase()} />
        )}
      </>
    );

  /* -------------------------------------------------------------- *
   * DELTAKERMODUS: låst flate uten operatørutstyr. Første viewport =
   * oppgaveprompt + kjerneflate; kun et diskret klokkemerke i tillegg.
   * -------------------------------------------------------------- */
  if (deltaker) {
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
        <Klokkemerke naaISO={naa} />
        <main style={{ maxWidth: 640, margin: '0 auto' }}>{kjerneflate}</main>
      </div>
    );
  }

  /* -------------------------------------------------------------- *
   * OPERATØRMODUS: alt operatørutstyr i ett kollapsbart panel —
   * deltakerflaten dominerer også her.
   * -------------------------------------------------------------- */
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
        <Klokkemerke naaISO={naa} />
        <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>
          Babyora — Design-lab (fase 9)
        </h1>
        <p style={{ margin: '0 0 12px', color: '#4d4d4d', fontSize: 14 }}>
          Operatørmodus. Deltakere kjøres i låst deltakermodus via
          ?modus=deltaker&amp;arm=…&amp;scenario=…
        </p>
        <OperatorPanel>
          <section style={seleSeksjon} aria-label="Scenario og arm">
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
              >
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

            <nav
              aria-label="Prototyper"
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              {RUTER.map((r) => {
                const mangler =
                  r.id !== 'felles' && r.id !== 'null' && !MODULER[r.id as Arm];
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => !mangler && setRute(r.id)}
                    aria-pressed={rute === r.id}
                    disabled={mangler}
                    title={
                      mangler
                        ? 'P4 kobles automatisk når lab/p4/index.tsx finnes (komposisjon av P1+P3).'
                        : r.id === 'null'
                          ? ARM_NAVN.null
                          : r.id !== 'felles'
                            ? MODULER[r.id as Arm]?.manifest.navn
                            : undefined
                    }
                    style={knapp(rute === r.id, mangler)}
                  >
                    {r.navn}
                  </button>
                );
              })}
            </nav>
          </section>

          <section style={seleSeksjon} aria-label="Nullarm (oppgavetype)">
            <p style={{ margin: '0 0 8px' }}>
              <strong>Nullarm</strong>
              <span style={{ color: '#4d4d4d', fontSize: 14 }}>
                {' '}
                · oppgavespesifikk kontrollarm (aktiv: {nullarm})
              </span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ALLE_NULLARMER.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setNullarmValg(a)}
                  aria-pressed={nullarm === a}
                  title={NULLARMER[a].navn}
                  style={knapp(nullarm === a)}
                >
                  {NULLARMER[a].oppgavetype}
                </button>
              ))}
            </div>
          </section>

          <Klokkekontroll
            naaISO={naa}
            gyldigTil={scenario.gyldigTil}
            spol={spol}
          />
          <Rekkefolgepanel
            deltakerNr={deltakerNr}
            setDeltakerNr={setDeltakerNr}
          />
          <Loggpanel logg={logg} />
        </OperatorPanel>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto' }}>{kjerneflate}</main>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Selens paneler
 * ------------------------------------------------------------------ */

/**
 * Diskret klokkemerke — beholdes i begge moduser for skjermbevis
 * (FELLES-P0: klokkepanelet er operatørutstyr, men bevisene trenger
 * synlig labtid). Ingen ramme, ingen kontroller.
 */
function Klokkemerke({ naaISO }: { naaISO: string }) {
  if (!naaISO) return null;
  return (
    <p
      aria-label="Labklokke"
      style={{
        margin: '0 0 8px',
        maxWidth: 640,
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'right',
        fontSize: 12,
        color: '#767676',
      }}
    >
      kl. {naaISO.slice(11, 16)} · lab
    </p>
  );
}

/** Kollapsbart panel for ALT operatørutstyr (FELLES-P0). */
function OperatorPanel({ children }: { children: ReactNode }) {
  const [aapen, setAapen] = useState(false);
  return (
    <section aria-label="Operatør">
      <button
        type="button"
        onClick={() => setAapen((v) => !v)}
        aria-expanded={aapen}
        style={knapp(aapen)}
      >
        {aapen ? 'Skjul operatørpanel' : 'Operatør — scenario, klokke, logg'}
      </button>
      {aapen && <div style={{ marginTop: 16 }}>{children}</div>}
    </section>
  );
}

function Klokkekontroll({
  naaISO,
  gyldigTil,
  spol,
}: {
  naaISO: string;
  gyldigTil: string;
  spol: (min: number) => void;
}) {
  return (
    <section style={seleSeksjon} aria-label="Virtuell klokke">
      <p style={{ margin: '0 0 8px' }}>
        <strong>Klokka i laben: {naaISO.slice(11, 16)}</strong>
        <span style={{ color: '#4d4d4d' }}>
          {' '}
          · rådet gjelder til {gyldigTil}
        </span>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[30, 60, 120].map((min) => (
          <button
            key={min}
            type="button"
            onClick={() => spol(min)}
            style={knapp(false)}
          >
            Spol +{min} min
          </button>
        ))}
      </div>
    </section>
  );
}

function Rekkefolgepanel({
  deltakerNr,
  setDeltakerNr,
}: {
  deltakerNr: number;
  setDeltakerNr: (n: number) => void;
}) {
  const [vis, setVis] = useState(false);
  const sekvens = rekkefolgeForDeltaker(deltakerNr);

  return (
    <section style={seleSeksjon} aria-label="Rekkefølge (Williams-design)">
      <button
        type="button"
        onClick={() => setVis((v) => !v)}
        aria-expanded={vis}
        style={knapp(false)}
      >
        {vis ? 'Skjul rekkefølge' : 'Vis rekkefølge (Williams-design)'}
      </button>
      {vis && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#4d4d4d' }}>
            {WILLIAMS_ARMSEKVENSER.length} sekvenser à{' '}
            {WILLIAMS_ARMSEKVENSER[0].length} eksponeringer. Balansert for
            posisjon og førsteordens carryover:{' '}
            {REKKEFOLGE_BALANSERT ? 'ja' : 'NEI — sjekk rekkefolge.ts'}.
          </p>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Deltakernummer </span>
            <input
              type="number"
              min={1}
              value={deltakerNr}
              onChange={(e) => setDeltakerNr(Number(e.target.value) || 1)}
              style={{
                minHeight: 48,
                width: 96,
                fontSize: 16,
                fontFamily: 'inherit',
                padding: '0 8px',
                border: '1px solid #b3b3b3',
                borderRadius: 6,
              }}
            />
          </label>
          <ol style={{ margin: '0 0 8px', paddingLeft: '1.5em' }}>
            {sekvens.map((arm, posisjon) => {
              const tildeling = tildelScenarier(deltakerNr, posisjon);
              return (
                <li key={`${arm}-${posisjon}`} style={{ marginBottom: 4 }}>
                  <strong>{ARM_NAVN[arm]}</strong>
                  <span style={{ color: '#4d4d4d', fontSize: 14 }}>
                    {' '}
                    · måling: {tildeling.maaling.join(', ')}
                  </span>
                </li>
              );
            })}
          </ol>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#4d4d4d' }}>
            Treningsscenarier (skåres aldri):{' '}
            {SCENARIOFAMILIER.map((f) => f.trening).join(', ')}.
          </p>
          <details style={{ fontSize: 14, color: '#4d4d4d' }}>
            <summary style={{ cursor: 'pointer', minHeight: 24 }}>
              Scenariofamilier og ekvivalensbegrunnelse
            </summary>
            <ul style={{ margin: '8px 0 0', paddingLeft: '1.2em' }}>
              {SCENARIOFAMILIER.map((f) => (
                <li key={f.id} style={{ marginBottom: 4 }}>
                  <strong>{f.id}</strong>: {f.begrunnelse}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}

function Loggpanel({ logg }: { logg: ReturnType<typeof lagLogg> }) {
  const [, setVersjon] = useState(0);
  useEffect(() => logg.abonner(() => setVersjon((v) => v + 1)), [logg]);

  const alle = logg.innslag();
  const siste = alle.slice(-10);

  function lastNed(): void {
    const blob = new Blob([logg.tilJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'babyora-lab-logg.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section style={seleSeksjon} aria-label="Hendelseslogg">
      <p style={{ margin: '0 0 8px' }}>
        <strong>Hendelseslogg</strong>
        <span style={{ color: '#4d4d4d' }}> · {alle.length} innslag</span>
      </p>
      {siste.length > 0 && (
        <ul
          style={{
            margin: '0 0 8px',
            paddingLeft: '1.2em',
            fontSize: 14,
            color: '#4d4d4d',
          }}
        >
          {siste.map((i, idx) => (
            <li key={`${i.tidISO}-${idx}`}>
              [{i.tidISO.slice(11, 16)}] {i.prototype}/{i.scenario} —{' '}
              {i.event}
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={lastNed} style={knapp(false)}>
          Last ned logg (JSON)
        </button>
        <button type="button" onClick={() => logg.toem()} style={knapp(false)}>
          Tøm logg
        </button>
      </div>
    </section>
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
      <p style={{ margin: '8px 0 0' }}>
        Kobles automatisk når lab/{kode.toLowerCase()}/index.tsx finnes.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * FELLES-fanen: kjører motoren for valgt scenario og viser alle delte
 * komponenter i INV-rekkefølge (sikkerhet → råd → gyldighet → kvittering).
 * ------------------------------------------------------------------ */

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
