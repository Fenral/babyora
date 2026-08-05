/**
 * Delte, retningsnøytrale byggeklosser for P1–P4 (spec §2.6: lik kvalitet —
 * ingen retning får animasjon/gradient/maskot/systemflate som differensiator).
 *
 * Designregler (bindende for alt i laben):
 *  - Systemfont, lys bakgrunn (utendørs lesbarhet), WCAG AA-kontrast
 *  - Touchmål ≥ 48px, INGEN animasjon, ingen maskot
 *  - All størrelse i em slik at StorTekst-flagget (1.4× på rammen)
 *    skalerer ALT — tekst, luft og touchmål
 *  - Degradering er strukturell maskering — ALDRI opacity/dimming
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { SafetyFlag } from '@lib/wool-layers/safety';
import { DEGRADERT_NESTE_HANDLING } from './tekst';

/* ---------- nøytrale tokens (AA mot hvit/nesten-hvit bakgrunn) ---------- */

const FARGE = {
  bakgrunn: '#ffffff',
  tekst: '#1a1a1a', // 17.4:1 mot hvit
  demotert: '#4d4d4d', // 8.4:1 mot hvit
  ramme: '#b3b3b3',
  fareTekst: '#7f1d1d', // mørk rød, 9.5:1 mot hvit
  fareRamme: '#7f1d1d',
  advarselTekst: '#5c4400', // mørk oker, 8.2:1 mot hvit
  advarselRamme: '#8a6d00',
};

const SYSTEMFONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const blokk: CSSProperties = {
  border: `1px solid ${FARGE.ramme}`,
  borderRadius: '0.5em',
  padding: '1em',
  marginBottom: '1em',
  background: FARGE.bakgrunn,
};

/* ------------------------------ LabRamme ------------------------------ */

/**
 * Ytre ramme som realiserer UI-flaggene:
 *  - storTekst: fontSize 140 % → alle em-baserte mål skalerer 1.4×
 *  - hoyKontrast: rent sort på rent hvitt, tykkere rammer
 */
export function LabRamme({
  storTekst = false,
  hoyKontrast = false,
  children,
}: {
  storTekst?: boolean;
  hoyKontrast?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: SYSTEMFONT,
        fontSize: storTekst ? '140%' : '100%',
        lineHeight: 1.5,
        color: hoyKontrast ? '#000000' : FARGE.tekst,
        background: '#ffffff',
        padding: '1em',
        maxWidth: '32em',
        fontWeight: hoyKontrast ? 500 : 400,
      }}
    >
      {children}
    </div>
  );
}

/* -------------------------------- Raad -------------------------------- */

/**
 * INV-1-grammatikken: forhold → konsekvens → plagghandling.
 * Handlingen er typografisk dominant; rådata er demotert bak en
 * eksplisitt «Vis grunnlag»-utvidelse (alltid tilgjengelig, ett nivå bak).
 */
export function Raad({
  forhold,
  konsekvens,
  handling,
  grunnlag,
}: {
  forhold: string;
  konsekvens: string;
  handling: ReactNode;
  /** Rådata/detaljer — demotert, vises kun ved eksplisitt utvidelse. */
  grunnlag: ReactNode;
}) {
  const [visGrunnlag, setVisGrunnlag] = useState(false);
  return (
    <section style={blokk} aria-label="Råd">
      <p style={{ margin: 0, color: FARGE.demotert, fontSize: '0.9em' }}>
        {forhold} — {konsekvens}
      </p>
      <div
        style={{
          margin: '0.5em 0 0.75em',
          fontSize: '1.35em',
          fontWeight: 700,
        }}
      >
        {handling}
      </div>
      <button
        type="button"
        onClick={() => setVisGrunnlag((v) => !v)}
        aria-expanded={visGrunnlag}
        style={{
          minHeight: '3em',
          minWidth: '3em',
          padding: '0 1em',
          fontSize: '1em',
          fontFamily: 'inherit',
          color: FARGE.tekst,
          background: '#f2f2f2',
          border: `1px solid ${FARGE.ramme}`,
          borderRadius: '0.4em',
          cursor: 'pointer',
        }}
      >
        {visGrunnlag ? 'Skjul grunnlag' : 'Vis grunnlag'}
      </button>
      {visGrunnlag && (
        <div
          style={{
            marginTop: '0.75em',
            paddingTop: '0.75em',
            borderTop: `1px solid ${FARGE.ramme}`,
            color: FARGE.demotert,
            fontSize: '0.9em',
          }}
        >
          {grunnlag}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Gyldighet ------------------------------ */

/**
 * INV-2: absolutt gyldighet i selve svaret. Alltid absolutt klokkeslett —
 * relativ tid fryser til løgn på flater som ikke oppdaterer seg selv.
 */
export function Gyldighet({ til }: { til: string }) {
  return (
    <p style={{ margin: '0 0 1em', fontSize: '0.95em' }}>
      Gjelder til <strong>{til}</strong>
    </p>
  );
}

/* ------------------------------ Kvittering ----------------------------- */

/**
 * INV-3: proveniens som kvittering — synlig inputgrunnlag + navngitt
 * svakeste premiss. Aldri seremoni, aldri demonstrert anstrengelse.
 */
export function Kvittering({
  tempC,
  windMs,
  ageMonths,
  usikrest,
}: {
  tempC: number;
  windMs: number;
  ageMonths: number;
  usikrest: string;
}) {
  return (
    <p style={{ margin: '0 0 1em', color: FARGE.demotert, fontSize: '0.9em' }}>
      Basert på {tempC} °C, vind {windMs} m/s, {ageMonths} mnd
      <br />
      Usikrest: {usikrest}
    </p>
  );
}

/* ---------------------------- Sikkerhetsblokk --------------------------- */

/**
 * Farevarsel-anatomi (spec §2.2): handling → konsekvens → gyldighet.
 * Identisk i alle fire prototyper og alltid synlig når motoren flagger.
 */
export function Sikkerhetsblokk({
  type,
  handling,
  konsekvens,
  gjelderTil,
  kilder,
}: {
  type: 'hard' | 'soft';
  handling: string;
  konsekvens: string;
  gjelderTil: string;
  kilder?: string[];
}) {
  const hard = type === 'hard';
  const tekstFarge = hard ? FARGE.fareTekst : FARGE.advarselTekst;
  const rammeFarge = hard ? FARGE.fareRamme : FARGE.advarselRamme;
  return (
    <section
      role={hard ? 'alert' : 'status'}
      style={{
        ...blokk,
        border: `2px solid ${rammeFarge}`,
        borderLeft: `0.5em solid ${rammeFarge}`,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '1.15em',
          fontWeight: 700,
          color: tekstFarge,
        }}
      >
        {handling}
      </p>
      <p style={{ margin: '0.4em 0 0', color: FARGE.tekst }}>{konsekvens}</p>
      <p style={{ margin: '0.4em 0 0', fontSize: '0.9em', color: FARGE.demotert }}>
        Gjelder til {gjelderTil}
        {kilder && kilder.length > 0 ? ` · Kilde: ${kilder.join(', ')}` : ''}
      </p>
    </section>
  );
}

/**
 * Oversetter en SafetyFlag fra motoren til farevarsel-anatomien.
 * Motorens message er handlingsbærende; konsekvensledd holdes i meldingen.
 */
export function SikkerhetsblokkFraFlag({
  flag,
  gjelderTil,
}: {
  flag: SafetyFlag;
  gjelderTil: string;
}) {
  const hard = flag.severity === 'HIGH' || flag.severity === 'CRITICAL';
  return (
    <Sikkerhetsblokk
      type={hard ? 'hard' : 'soft'}
      handling={flag.message}
      konsekvens={
        hard
          ? 'Dette er en sikkerhetsregel — den kan ikke overstyres.'
          : 'Dette er en justering for trygghet — se grunnlaget om du er i tvil.'
      }
      gjelderTil={gjelderTil}
      kilder={flag.sources}
    />
  );
}

/* ------------------------------ Degradert ------------------------------ */

/**
 * Maskert tilstand: rådet har mistet påstandsstatus. Strukturell maskering
 * — egen blokk med egen form, ALDRI opacity/dimming av gammelt innhold.
 */
export function Degradert({
  aarsak,
  nesteHandling = DEGRADERT_NESTE_HANDLING,
}: {
  /** Klarspråk-årsak («Værdata er ikke tilgjengelig akkurat nå.»). */
  aarsak?: string;
  nesteHandling?: string;
}) {
  return (
    <section
      role="status"
      style={{
        ...blokk,
        border: `2px dashed ${FARGE.tekst}`,
        background: '#ffffff',
      }}
    >
      <p style={{ margin: 0, fontSize: '1.15em', fontWeight: 700 }}>
        Babyora kan ikke gi råd nå
      </p>
      {aarsak && (
        <p style={{ margin: '0.4em 0 0', color: FARGE.demotert }}>{aarsak}</p>
      )}
      <p style={{ margin: '0.6em 0 0', fontWeight: 600 }}>{nesteHandling}</p>
    </section>
  );
}
