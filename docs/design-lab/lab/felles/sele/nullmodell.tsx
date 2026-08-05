/**
 * NULLMODELLEN — kontrollarmen i eksperimentet (spec v2 §2 / fase 3-kravet:
 * «værapp + ni-ords-regel + vanlig tekstmelding»).
 *
 * Dette er det foreldre HAR i dag uten Babyora: en værapp-lignende visning
 * med kun rådata, huskeregelen på ni ord, og meldingen de ville sendt
 * partneren. Armen bærer med hensikt INGEN motor-semantikk: ingen
 * safety-events, ingen stoppkriterier, ingen plagglister — det er nettopp
 * fraværet prototypene måles mot.
 *
 * Selens nøytrale flate: systemfont, lys grunn, AA-kontrast, ≥48px mål,
 * ingen animasjon. storTekst skalerer 1.4×.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import type { Scenario } from '../scenarier';
import { feelsLikeC } from '@lib/met-no/feels-like';
import type { LabKlokke } from './klokke';

/** AAP-regelen «one layer more than adult» — nøyaktig ni ord på norsk. */
export const NI_ORDS_REGELEN = 'Kle barnet i ett lag mer enn deg selv';

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

export type NullmodellProps = {
  scenario: Scenario;
  klokke: LabKlokke;
  logg?: (...args: unknown[]) => void;
};

const SYSTEMFONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function kort(hoyKontrast: boolean | undefined): CSSProperties {
  return {
    border: `1px solid ${hoyKontrast ? '#000000' : '#b3b3b3'}`,
    borderRadius: 8,
    padding: '0.75em 1em',
    marginBottom: '0.75em',
    background: '#ffffff',
  };
}

export function Nullmodell({ scenario, klokke, logg }: NullmodellProps) {
  const hoyKontrast = scenario.flags.hoyKontrast;
  const tekstFarge = hoyKontrast ? '#000000' : '#1a1a1a';
  const demperFarge = hoyKontrast ? '#000000' : '#4d4d4d';

  // Re-render på spoling slik at klokkeslettet i «værappen» følger selen.
  const [, setTikk] = useState(0);
  useEffect(() => klokke.onTick(() => setTikk((t) => t + 1)), [klokke]);

  const [melding, setMelding] = useState('');
  const [sendt, setSendt] = useState<string | null>(null);

  useEffect(() => {
    logg?.('null:vist', { scenarioId: scenario.id });
    // Kun ved scenario-bytte — logg-funksjonen er stabil nok for formålet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  const linjer = nullmodellTekster(scenario);

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
      <section style={kort(hoyKontrast)} aria-label="Værapp (rådata)">
        <p style={{ margin: 0, fontSize: '0.85em', color: demperFarge }}>
          Været nå · Labbyen (fiktivt sted) · kl.{' '}
          {klokke.naaISO().slice(11, 16)}
        </p>
        {linjer.map((linje) => (
          <p key={linje} style={{ margin: '0.35em 0 0' }}>
            {linje}
          </p>
        ))}
      </section>

      <section style={kort(hoyKontrast)} aria-label="Huskeregel">
        <p style={{ margin: 0, fontSize: '0.85em', color: demperFarge }}>
          Huskeregelen du kan fra før
        </p>
        <p style={{ margin: '0.35em 0 0', fontWeight: 700 }}>
          «{NI_ORDS_REGELEN}.»
        </p>
      </section>

      <section style={kort(hoyKontrast)} aria-label="Melding til partneren">
        <label style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.85em',
              color: demperFarge,
              marginBottom: '0.35em',
            }}
          >
            Hva ville du sendt partneren din nå? Skriv meldingen slik du
            faktisk ville skrevet den.
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
              border: `1px solid ${hoyKontrast ? '#000000' : '#767676'}`,
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
          disabled={melding.trim().length === 0}
          style={{
            marginTop: '0.5em',
            minHeight: 48,
            minWidth: 48,
            padding: '0 1em',
            fontFamily: 'inherit',
            fontSize: '1em',
            fontWeight: 700,
            color: tekstFarge,
            background: '#f2f2f2',
            border: `2px solid ${hoyKontrast ? '#000000' : '#1a1a1a'}`,
            borderRadius: 6,
            cursor: melding.trim().length === 0 ? 'default' : 'pointer',
            opacity: melding.trim().length === 0 ? 0.5 : 1,
          }}
        >
          Send meldingen (til loggen)
        </button>
        {sendt !== null && (
          <p style={{ margin: '0.5em 0 0', fontSize: '0.85em' }}>
            Meldingen er notert i loggen: «{sendt}»
          </p>
        )}
      </section>
    </div>
  );
}
