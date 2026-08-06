/**
 * NULLMODELLEN — kontrollarmen i eksperimentet (spec v2 §2 / fase 3-kravet:
 * «værapp + ni-ords-regel + vanlig tekstmelding»), delt i OPPGAVESPESIFIKKE
 * ARMER etter Sols fase 10-review (nullmodell-P2):
 *
 *  - null-paakledning: værapp-rådata + ni-ords-regelen → «Antrekket er
 *    bestemt» (påkledningsbeslutningens sammenlignbare slutt).
 *  - null-validering: ni-ords-regelen + egen vurdering → «Holder» /
 *    «Holder ikke» (valideringens sammenlignbare slutt).
 *  - null-handoff: meldingsfelt → «Send meldingen» (overleveringens
 *    sammenlignbare slutt).
 *
 * Armene bærer med hensikt INGEN motor-semantikk: ingen safety-events,
 * ingen stoppkriterier, ingen plagglister — det er nettopp fraværet
 * prototypene måles mot. Ved visning noterer loggen (null:vist) hvilken
 * arm som kjøres og hva som inngår i beslutningstiden, slik at arm-tider
 * aldri kan blandes i analysen.
 *
 * Hierarki (Sols hierarki-P2): ingen ikke-semantiske rammer — seksjonene
 * skilles med typografi og avstand; kun interaktive elementer (knapper,
 * tekstfelt) har grense.
 *
 * Selens nøytrale flate: systemfont, lys grunn, AA-kontrast, ≥48px mål,
 * ingen animasjon. storTekst skalerer 1.4×.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import type { Scenario } from '../scenarier';
import { feelsLikeC } from '@lib/met-no/feels-like';
import type { LabKlokke } from './klokke';
import { NULLARMER, standardNullarm, type Nullarm } from './nullarmer';

/** AAP-regelen «one layer more than adult» — nøyaktig ni ord på norsk. */
export const NI_ORDS_REGELEN = 'Kle barnet i ett lag mer enn deg selv';

/** Valideringsarmens oppgavetekst — regel + egen vurdering, ingen rådata. */
export const VURDERINGS_PROMPT =
  'Se på antrekket dere har lagt frem, og vurder selv om det holder for ' +
  'turen nå.';

/** Handoff-armens oppgavetekst — kun meldingsfeltet. */
export const HANDOFF_PROMPT =
  'Hva ville du sendt den som overtar barnet nå? Skriv meldingen slik du ' +
  'faktisk ville skrevet den.';

const PAAKLEDNING_SLUTTKNAPP = 'Antrekket er bestemt';
const HANDOFF_SLUTTKNAPP = 'Send meldingen (til loggen)';

const SYMBOL_BESKRIVELSE: Record<string, string> = {
  clearsky_day: 'klarvær',
  fair_day: 'lettskyet',
  partlycloudy_day: 'delvis skyet',
  cloudy: 'skyet',
  lightrain: 'lett regn',
  lightsnow: 'lett snø',
  sleet: 'sludd',
};

/**
 * Rådata-linjene værappen viser for scenariet. Kun observasjoner — ingen
 * vurdering, ingen plagg, ingen sikkerhetsinnhold (kontrollarm-kontrakten,
 * håndhevet av lekkasjetesten i __tests__/sele.test.ts).
 */
export function nullmodellTekster(scenario: Scenario): string[] {
  const vaer = scenario.weather;
  if (!vaer) {
    return ['Værdata er ikke tilgjengelig akkurat nå.'];
  }
  const foles = Math.round(feelsLikeC(vaer.tempC, vaer.windMs));
  return [
    `Temperatur ${vaer.tempC} °C (føles som ${foles} °C)`,
    `Vind ${vaer.windMs} m/s`,
    `Nedbør ${vaer.precipMmH} mm/t`,
    `Forhold: ${SYMBOL_BESKRIVELSE[vaer.symbolCode] ?? vaer.symbolCode}`,
  ];
}

/**
 * ALT tekstinnhold i en nullarms beslutningsflate — grunnlaget for
 * lekkasjetesten per arm: ingen arm skal bære safety-innhold,
 * stoppkriterier eller plaggnavn fra faktalaget.
 */
export function nullarmTekster(
  scenario: Scenario,
  nullarm: Nullarm,
): string[] {
  switch (nullarm) {
    case 'null-paakledning':
      return [
        ...nullmodellTekster(scenario),
        NI_ORDS_REGELEN,
        PAAKLEDNING_SLUTTKNAPP,
      ];
    case 'null-validering':
      return [NI_ORDS_REGELEN, VURDERINGS_PROMPT, 'Holder', 'Holder ikke'];
    case 'null-handoff':
      return [HANDOFF_PROMPT, HANDOFF_SLUTTKNAPP];
  }
}

export type NullmodellProps = {
  scenario: Scenario;
  klokke: LabKlokke;
  /** Tildelt oppgavearm; utledes av scenariet hvis ikke satt. */
  nullarm?: Nullarm;
  logg?: (...args: unknown[]) => void;
};

const SYSTEMFONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Seksjonsskille uten ramme: kun avstand (hierarki-P2). */
const seksjon: CSSProperties = { margin: '0 0 1.5em' };

function etikett(demperFarge: string): CSSProperties {
  return {
    margin: 0,
    fontSize: '0.85em',
    color: demperFarge,
  };
}

function knappStil(
  tekstFarge: string,
  kantFarge: string,
  deaktivert: boolean,
): CSSProperties {
  return {
    minHeight: 48,
    minWidth: 48,
    padding: '0 1em',
    fontFamily: 'inherit',
    fontSize: '1em',
    fontWeight: 700,
    color: tekstFarge,
    background: '#f2f2f2',
    border: `2px solid ${kantFarge}`,
    borderRadius: 6,
    cursor: deaktivert ? 'default' : 'pointer',
    opacity: deaktivert ? 0.5 : 1,
  };
}

export function Nullmodell({
  scenario,
  klokke,
  nullarm,
  logg,
}: NullmodellProps) {
  const arm: Nullarm = nullarm ?? standardNullarm(scenario.id);
  const spec = NULLARMER[arm];

  const hoyKontrast = scenario.flags.hoyKontrast;
  const tekstFarge = hoyKontrast ? '#000000' : '#1a1a1a';
  const demperFarge = hoyKontrast ? '#000000' : '#4d4d4d';
  const kantFarge = hoyKontrast ? '#000000' : '#1a1a1a';

  // Re-render på spoling slik at klokkeslettet i «værappen» følger selen.
  const [, setTikk] = useState(0);
  useEffect(() => klokke.onTick(() => setTikk((t) => t + 1)), [klokke]);

  useEffect(() => {
    // Loggen noterer hvilken arm som kjøres og hva som inngår i
    // beslutningstiden (nullmodell-P2: armene må ha hver sin
    // sammenlignbare slutt — og analysen må se hva tiden dekker).
    logg?.('null:vist', {
      scenarioId: scenario.id,
      nullarm: arm,
      beslutningstidInkluderer: spec.beslutningstidInkluderer,
      sluttEvent: spec.sluttEvent,
    });
    // Kun ved scenario-/armbytte — logg-funksjonen er stabil nok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, arm]);

  return (
    <div
      style={{
        fontFamily: SYSTEMFONT,
        fontSize: scenario.flags.storTekst ? 22.4 : 16,
        lineHeight: 1.5,
        color: tekstFarge,
        background: '#ffffff',
        maxWidth: 480,
        margin: '0 auto',
        padding: '0.75em',
      }}
    >
      {arm === 'null-paakledning' && (
        <PaakledningArm
          scenario={scenario}
          klokke={klokke}
          logg={logg}
          tekstFarge={tekstFarge}
          demperFarge={demperFarge}
          kantFarge={kantFarge}
        />
      )}
      {arm === 'null-validering' && (
        <ValideringArm
          scenario={scenario}
          logg={logg}
          tekstFarge={tekstFarge}
          demperFarge={demperFarge}
          kantFarge={kantFarge}
        />
      )}
      {arm === 'null-handoff' && (
        <HandoffArm
          scenario={scenario}
          logg={logg}
          tekstFarge={tekstFarge}
          demperFarge={demperFarge}
          kantFarge={kantFarge}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Delflater
 * ------------------------------------------------------------------ */

function Regel({ demperFarge }: { demperFarge: string }) {
  return (
    <section style={seksjon} aria-label="Huskeregel">
      <p style={etikett(demperFarge)}>Huskeregelen du kan fra før</p>
      <p style={{ margin: '0.35em 0 0', fontWeight: 700 }}>
        «{NI_ORDS_REGELEN}.»
      </p>
    </section>
  );
}

function Raadata({
  scenario,
  klokke,
  demperFarge,
}: {
  scenario: Scenario;
  klokke: LabKlokke;
  demperFarge: string;
}) {
  const linjer = nullmodellTekster(scenario);
  return (
    <section style={seksjon} aria-label="Værapp (rådata)">
      <p style={etikett(demperFarge)}>
        Været nå · Labbyen (fiktivt sted) · kl.{' '}
        {klokke.naaISO().slice(11, 16)}
      </p>
      {linjer.map((linje) => (
        <p key={linje} style={{ margin: '0.35em 0 0' }}>
          {linje}
        </p>
      ))}
    </section>
  );
}

type ArmProps = {
  scenario: Scenario;
  logg?: (...args: unknown[]) => void;
  tekstFarge: string;
  demperFarge: string;
  kantFarge: string;
};

/** null-paakledning: rådata + regel → «Antrekket er bestemt». */
function PaakledningArm({
  scenario,
  klokke,
  logg,
  tekstFarge,
  demperFarge,
  kantFarge,
}: ArmProps & { klokke: LabKlokke }) {
  const [besluttet, setBesluttet] = useState(false);
  return (
    <>
      <Raadata scenario={scenario} klokke={klokke} demperFarge={demperFarge} />
      <Regel demperFarge={demperFarge} />
      <section style={seksjon} aria-label="Påkledningsbeslutning">
        <button
          type="button"
          onClick={() => {
            logg?.('null:antrekk_besluttet', { scenarioId: scenario.id });
            setBesluttet(true);
          }}
          disabled={besluttet}
          style={knappStil(tekstFarge, kantFarge, besluttet)}
        >
          {PAAKLEDNING_SLUTTKNAPP}
        </button>
        {besluttet && (
          <p style={{ margin: '0.5em 0 0', fontSize: '0.85em' }}>
            Beslutningen er notert i loggen. Fortell testleder hva dere
            valgte.
          </p>
        )}
      </section>
    </>
  );
}

/** null-validering: regel + egen vurdering → «Holder» / «Holder ikke». */
function ValideringArm({
  scenario,
  logg,
  tekstFarge,
  demperFarge,
  kantFarge,
}: ArmProps) {
  const [svar, setSvar] = useState<string | null>(null);
  return (
    <>
      <Regel demperFarge={demperFarge} />
      <section style={seksjon} aria-label="Egen vurdering">
        <p style={etikett(demperFarge)}>Egen vurdering</p>
        <p style={{ margin: '0.35em 0 0.75em' }}>{VURDERINGS_PROMPT}</p>
        <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
          {(['Holder', 'Holder ikke'] as const).map((valg) => (
            <button
              key={valg}
              type="button"
              onClick={() => {
                logg?.('null:vurdering_avgitt', {
                  scenarioId: scenario.id,
                  svar: valg,
                });
                setSvar(valg);
              }}
              disabled={svar !== null}
              style={knappStil(tekstFarge, kantFarge, svar !== null)}
            >
              {valg}
            </button>
          ))}
        </div>
        {svar !== null && (
          <p style={{ margin: '0.5em 0 0', fontSize: '0.85em' }}>
            Vurderingen «{svar}» er notert i loggen.
          </p>
        )}
      </section>
    </>
  );
}

/** null-handoff: kun meldingsfeltet → «Send meldingen». */
function HandoffArm({
  scenario,
  logg,
  tekstFarge,
  demperFarge,
  kantFarge,
}: ArmProps) {
  const [melding, setMelding] = useState('');
  const [sendt, setSendt] = useState<string | null>(null);
  const tom = melding.trim().length === 0;

  return (
    <section style={seksjon} aria-label="Melding til den som overtar">
      <label style={{ display: 'block' }}>
        <span
          style={{
            display: 'block',
            fontSize: '0.85em',
            color: demperFarge,
            marginBottom: '0.35em',
          }}
        >
          {HANDOFF_PROMPT}
        </span>
        <textarea
          value={melding}
          onChange={(e) => setMelding(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            minHeight: 48,
            fontFamily: 'inherit',
            fontSize: '1em',
            color: tekstFarge,
            border: `1px solid ${kantFarge === '#000000' ? '#000000' : '#767676'}`,
            borderRadius: 6,
            padding: '0.5em',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          logg?.('null:melding_sendt', {
            scenarioId: scenario.id,
            tekst: melding,
            antallTegn: melding.length,
          });
          setSendt(melding);
          setMelding('');
        }}
        disabled={tom}
        style={{ ...knappStil(tekstFarge, kantFarge, tom), marginTop: '0.5em' }}
      >
        {HANDOFF_SLUTTKNAPP}
      </button>
      {sendt !== null && (
        <p style={{ margin: '0.5em 0 0', fontSize: '0.85em' }}>
          Meldingen er notert i loggen: «{sendt}»
        </p>
      )}
    </section>
  );
}
