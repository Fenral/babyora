/**
 * Forskningsdisclaimer — vises FØR hver oppgave (spec v2 §1 pkt. 4 og §6:
 * «kun fiktive barn/vær, … prototypeinformasjon før oppgave»).
 *
 * Selens nøytrale flate: systemfont, lys grunn, AA-kontrast, ≥48px mål,
 * ingen animasjon. storTekst skalerer 1.4×.
 */

import type { CSSProperties } from 'react';

export const DISCLAIMER_TITTEL = 'Dette er en forskningsprototype';

export const DISCLAIMER_TEKST =
  'Barnet, været og rådene i denne oppgaven er fiktive og laget for testing. ' +
  'Ingenting her er ekte påkledningsråd, og ingenting skal brukes på et ' +
  'virkelig barn. Oppgaven bruker ingen posisjon og ingen ekte værdata. ' +
  'Det du gjør i oppgaven, lagres i en anonym hendelseslogg for analyse.';

export type DisclaimerProps = {
  /** Hva som starter når deltakeren bekrefter (vises på knappen). */
  oppgaveNavn: string;
  storTekst?: boolean;
  hoyKontrast?: boolean;
  onBekreft: () => void;
};

const SYSTEMFONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function Disclaimer({
  oppgaveNavn,
  storTekst,
  hoyKontrast,
  onBekreft,
}: DisclaimerProps) {
  const tekstFarge = hoyKontrast ? '#000000' : '#1a1a1a';
  const ramme: CSSProperties = {
    fontFamily: SYSTEMFONT,
    fontSize: storTekst ? 22.4 : 16,
    lineHeight: 1.5,
    color: tekstFarge,
    background: '#ffffff',
    border: `2px solid ${hoyKontrast ? '#000000' : '#1a1a1a'}`,
    borderRadius: 8,
    maxWidth: 480,
    margin: '0 auto',
    padding: '1em',
  };

  return (
    <section style={ramme} aria-label="Forskningsdisclaimer">
      <h2 style={{ margin: '0 0 0.5em', fontSize: '1.1em' }}>
        {DISCLAIMER_TITTEL}
      </h2>
      <p style={{ margin: '0 0 1em' }}>{DISCLAIMER_TEKST}</p>
      <button
        type="button"
        onClick={onBekreft}
        style={{
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
          cursor: 'pointer',
        }}
      >
        Jeg forstår — start {oppgaveNavn}
      </button>
    </section>
  );
}
