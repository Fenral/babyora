/**
 * P1 «PROTOKOLLEN» — beslutningssløyfen (spec v2 §3).
 *
 * Presentasjonen er retningens egen (ingen felles/komponenter.tsx i kjernen):
 *  - Tilstandslinjen øverst: Vanlig dag / Følg med / Avvik + én setnings
 *    hvorfor + absolutt gyldighet. Strukturelt signal (ramme/inversjon),
 *    aldri farge alene.
 *  - Normalmodus (normal + følg med): hele stabelen synlig, ETT bekreft-
 *    trykk, deretter nakkesjekk-kontrollen og kvittering.
 *  - Avviksmodus: ett steg om gangen, bekreft per kritisk steg, stopp-
 *    kriteriet i steget selv.
 *  - Degradert: konservativ fallback («Kle etter årstid. Kjenn på nakken
 *    før dere går.») — også som OVERGANG når selens klokke passerer
 *    gyldighet midt i oppgaven.
 *
 * Systemfont, lys grunn, AA-kontrast, ≥48px treffmål, ingen animasjon,
 * ingen maskot. storTekst skalerer all tekst 1.4×.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { Scenario } from '../felles/scenarier';
import { hentFakta } from '../felles/fakta';
import {
  AUTORITETSLINJE,
  NAKKESJEKK_ID,
  erUtloptNaa,
  kompilerProtokoll,
  type Protokoll,
  type ProtokollSteg,
} from './protokollkompilator';
import { manifest, type P1LoggEvent } from './manifest';

export { manifest };

export type LabKlokke = {
  naaISO(): string;
  spol(min: number): void;
  onTick(cb: () => void): () => void;
};

export type PrototypeProps = {
  scenario: Scenario;
  klokke: LabKlokke;
  logg?: (event: P1LoggEvent) => void;
};

const SYSTEMFONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type Palett = {
  tekst: string;
  demper: string;
  kant: string;
  flate: string;
  grunn: string;
};

function palett(hoyKontrast: boolean | undefined): Palett {
  return hoyKontrast
    ? { tekst: '#000000', demper: '#000000', kant: '#000000', flate: '#ffffff', grunn: '#ffffff' }
    : { tekst: '#111111', demper: '#3d3d3d', kant: '#767676', flate: '#fafafa', grunn: '#ffffff' };
}

function klokkeslett(iso: string): string {
  return iso.slice(11, 16);
}

export function Prototype({ scenario, klokke, logg }: PrototypeProps) {
  const p = palett(scenario.flags.hoyKontrast);
  return (
    <div
      style={{
        fontFamily: SYSTEMFONT,
        fontSize: scenario.flags.storTekst ? 22.4 : 16,
        lineHeight: 1.45,
        color: p.tekst,
        background: p.grunn,
        maxWidth: 480,
        margin: '0 auto',
        padding: '0.75em',
      }}
    >
      {/* key=scenario.id nullstiller sløyfens interaksjonstilstand per scenario */}
      <Sloyfe key={scenario.id} scenario={scenario} klokke={klokke} logg={logg} p={p} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sløyfen
 * ------------------------------------------------------------------ */

type Fase = 'protokoll' | 'kontroll' | 'ferdig';

function Sloyfe({
  scenario,
  klokke,
  logg,
  p,
}: PrototypeProps & { p: Palett }) {
  const fakta = useMemo(() => hentFakta(scenario), [scenario]);
  const protokoll = useMemo(() => kompilerProtokoll(fakta), [fakta]);

  // Virtuell klokke: re-render på tick slik at utløp blir en OVERGANG.
  const [, setTikk] = useState(0);
  useEffect(() => klokke.onTick(() => setTikk((t) => t + 1)), [klokke]);
  const naaISO = klokke.naaISO();
  const utlopt = protokoll.degradert === null && erUtloptNaa(protokoll, naaISO);

  const [fase, setFase] = useState<Fase>('protokoll');
  const [stegIndeks, setStegIndeks] = useState(0);
  const [korrigert, setKorrigert] = useState<string | null>(null);

  useEffect(() => {
    logg?.({ type: 'protokoll_vist', scenarioId: scenario.id, modus: protokoll.modus });
    // Kun ved ny sløyfe (komponenten re-monteres per scenario via key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const varUtlopt = useRef(false);
  useEffect(() => {
    if (utlopt && !varUtlopt.current) {
      varUtlopt.current = true;
      logg?.({ type: 'degradert_overgang', scenarioId: scenario.id, naaISO });
    }
  }, [utlopt, logg, scenario.id, naaISO]);

  const stemmerIkke = (steg: ProtokollSteg) => {
    setKorrigert(steg.id);
    logg?.({ type: 'stemmer_ikke', scenarioId: scenario.id, stegId: steg.id });
  };

  return (
    <section aria-label="Protokollen">
      <Tilstandslinje protokoll={protokoll} naaISO={naaISO} utlopt={utlopt} p={p} />

      {protokoll.degradert !== null ? (
        <DegradertFlate aarsak={protokoll.degradert.aarsak} fallback={protokoll.degradert.fallback} p={p} />
      ) : utlopt ? (
        <DegradertFlate
          aarsak={`Protokollen gjaldt til ${klokkeslett(protokoll.gyldigTilISO)} og må beregnes på nytt.`}
          fallback="Kle etter årstid. Kjenn på nakken før dere går."
          p={p}
        />
      ) : protokoll.modus === 'avvik' ? (
        <AvviksModus
          protokoll={protokoll}
          stegIndeks={stegIndeks}
          settStegIndeks={setStegIndeks}
          fase={fase}
          settFase={setFase}
          korrigert={korrigert}
          stemmerIkke={stemmerIkke}
          scenario={scenario}
          logg={logg}
          p={p}
        />
      ) : (
        <NormalModus
          protokoll={protokoll}
          fase={fase}
          settFase={setFase}
          korrigert={korrigert}
          stemmerIkke={stemmerIkke}
          scenario={scenario}
          logg={logg}
          p={p}
        />
      )}

      {fase === 'ferdig' && !utlopt && protokoll.degradert === null && (
        <Kvittering fakta={fakta} protokoll={protokoll} p={p} />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Tilstandslinjen — strukturelt signal, aldri farge alene
 * ------------------------------------------------------------------ */

function Tilstandslinje({
  protokoll,
  naaISO,
  utlopt,
  p,
}: {
  protokoll: Protokoll;
  naaISO: string;
  utlopt: boolean;
  p: Palett;
}) {
  const avvik = protokoll.tilstand.frase === 'Avvik' || utlopt;
  const folgMed = protokoll.tilstand.frase === 'Følg med';
  return (
    <header style={{ marginBottom: '1em' }}>
      <p
        style={{
          margin: 0,
          padding: '0.35em 0.5em',
          fontSize: '1.35em',
          fontWeight: 800,
          letterSpacing: '0.02em',
          color: avvik ? p.grunn : p.tekst,
          background: avvik ? p.tekst : 'transparent',
          border: folgMed ? `3px solid ${p.tekst}` : `1px solid ${avvik ? p.tekst : p.kant}`,
          borderRadius: 6,
        }}
      >
        {utlopt ? 'Avvik' : protokoll.tilstand.frase}
      </p>
      <p style={{ margin: '0.4em 0 0', color: p.demper }}>
        {utlopt
          ? `Klokka er ${klokkeslett(naaISO)} — gyldigheten gikk ut ${klokkeslett(protokoll.gyldigTilISO)}.`
          : protokoll.tilstand.hvorfor}{' '}
        <span style={{ whiteSpace: 'nowrap' }}>
          Gjelder til {klokkeslett(protokoll.gyldigTilISO)}.
        </span>
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Degradert — konservativ fallback, ekstra synlig modusskifte
 * ------------------------------------------------------------------ */

function DegradertFlate({ aarsak, fallback, p }: { aarsak: string; fallback: string; p: Palett }) {
  return (
    <div>
      <p style={{ margin: '0 0 0.75em', color: p.demper }}>{aarsak}</p>
      <p
        style={{
          margin: 0,
          padding: '0.75em',
          fontSize: '1.35em',
          fontWeight: 700,
          border: `3px solid ${p.tekst}`,
          borderRadius: 8,
        }}
      >
        {fallback}
      </p>
      <p style={{ margin: '0.75em 0 0', fontWeight: 600 }}>{AUTORITETSLINJE}</p>
      <p style={{ margin: '0.25em 0 0', color: p.demper }}>
        Akkurat nå ser den ikke været — derfor det generelle svaret over.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Normalmodus — hele stabelen + ETT bekreft-trykk
 * ------------------------------------------------------------------ */

function NormalModus({
  protokoll,
  fase,
  settFase,
  korrigert,
  stemmerIkke,
  scenario,
  logg,
  p,
}: {
  protokoll: Protokoll;
  fase: Fase;
  settFase: (f: Fase) => void;
  korrigert: string | null;
  stemmerIkke: (steg: ProtokollSteg) => void;
  scenario: Scenario;
  logg?: (e: P1LoggEvent) => void;
  p: Palett;
}) {
  const nakkesjekk = protokoll.steg.find((s) => s.id === NAKKESJEKK_ID)!;
  const stabel = protokoll.steg.filter((s) => s.id !== NAKKESJEKK_ID);

  if (fase === 'kontroll' || fase === 'ferdig') {
    return (
      <NakkesjekkKontroll
        steg={nakkesjekk}
        bekreftet={fase === 'ferdig'}
        onBekreft={() => {
          logg?.({ type: 'nakkesjekk_bekreftet', scenarioId: scenario.id });
          logg?.({ type: 'sloyfe_fullfort', scenarioId: scenario.id });
          settFase('ferdig');
        }}
        p={p}
      />
    );
  }

  return (
    <div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stabel.map((steg) => (
          <li
            key={steg.id}
            style={{
              padding: '0.5em 0.6em',
              marginBottom: '0.4em',
              background: steg.sone === 'sikkerhet' ? p.grunn : p.flate,
              border:
                steg.sone === 'sikkerhet'
                  ? `3px solid ${p.tekst}`
                  : `1px solid ${p.kant}`,
              borderRadius: 6,
            }}
          >
            {steg.sone === 'sikkerhet' && (
              <p style={{ margin: 0, fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.08em' }}>
                SIKKERHET
              </p>
            )}
            <p style={{ margin: 0, fontWeight: 600 }}>{steg.handling}</p>
            {steg.stoppkriterium && (
              <p style={{ margin: '0.25em 0 0', color: p.demper }}>
                <strong>Stopp hvis:</strong> {steg.stoppkriterium}
              </p>
            )}
            {steg.kontrollpunkt && (
              <p style={{ margin: '0.25em 0 0', color: p.demper }}>{steg.kontrollpunkt}</p>
            )}
            {korrigert === steg.id && <KorrigeringsLinje p={p} />}
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', marginTop: '0.75em' }}>
        <Knapp
          primar
          p={p}
          onClick={() => {
            logg?.({ type: 'stabel_bekreftet', scenarioId: scenario.id, modus: protokoll.modus });
            settFase('kontroll');
          }}
        >
          Antrekket er på — bekreft alt
        </Knapp>
        <Knapp p={p} onClick={() => stemmerIkke(stabel[stabel.length - 1])}>
          Noe stemmer ikke
        </Knapp>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Avviksmodus — ett steg om gangen, bekreft per kritisk steg
 * ------------------------------------------------------------------ */

function AvviksModus({
  protokoll,
  stegIndeks,
  settStegIndeks,
  fase,
  settFase,
  korrigert,
  stemmerIkke,
  scenario,
  logg,
  p,
}: {
  protokoll: Protokoll;
  stegIndeks: number;
  settStegIndeks: (i: number) => void;
  fase: Fase;
  settFase: (f: Fase) => void;
  korrigert: string | null;
  stemmerIkke: (steg: ProtokollSteg) => void;
  scenario: Scenario;
  logg?: (e: P1LoggEvent) => void;
  p: Palett;
}) {
  const steg = protokoll.steg;
  const aktivt = steg[Math.min(stegIndeks, steg.length - 1)];

  useEffect(() => {
    if (fase === 'protokoll') {
      logg?.({ type: 'steg_vist', scenarioId: scenario.id, stegId: aktivt.id });
    }
  }, [aktivt.id, fase, logg, scenario.id]);

  if (fase === 'ferdig') {
    return (
      <NakkesjekkKontroll
        steg={steg[steg.length - 1]}
        bekreftet
        onBekreft={() => {}}
        p={p}
      />
    );
  }

  const videre = () => {
    if (aktivt.kritisk) {
      logg?.({ type: 'steg_bekreftet', scenarioId: scenario.id, stegId: aktivt.id });
    }
    if (aktivt.id === NAKKESJEKK_ID) {
      logg?.({ type: 'nakkesjekk_bekreftet', scenarioId: scenario.id });
      logg?.({ type: 'sloyfe_fullfort', scenarioId: scenario.id });
      settFase('ferdig');
      return;
    }
    settStegIndeks(stegIndeks + 1);
  };

  return (
    <div>
      {stegIndeks > 0 && (
        <ol style={{ listStyle: 'none', margin: '0 0 0.75em', padding: 0, color: p.demper }}>
          {steg.slice(0, stegIndeks).map((s) => (
            <li key={s.id} style={{ padding: '0.15em 0' }}>
              ✓ {s.handling}
            </li>
          ))}
        </ol>
      )}

      <p style={{ margin: '0 0 0.4em', color: p.demper }}>
        Steg {stegIndeks + 1} av {steg.length}
      </p>

      <div
        style={{
          padding: '0.75em',
          background: aktivt.sone === 'sikkerhet' ? p.grunn : p.flate,
          border: aktivt.kritisk ? `3px solid ${p.tekst}` : `1px solid ${p.kant}`,
          borderRadius: 8,
        }}
      >
        {aktivt.sone === 'sikkerhet' && (
          <p style={{ margin: '0 0 0.25em', fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.08em' }}>
            SIKKERHET
          </p>
        )}
        <p style={{ margin: 0, fontSize: '1.25em', fontWeight: 700 }}>{aktivt.handling}</p>
        {aktivt.kontrollpunkt && (
          <p style={{ margin: '0.5em 0 0' }}>{aktivt.kontrollpunkt}</p>
        )}
        {aktivt.id === NAKKESJEKK_ID && (
          <p style={{ margin: '0.5em 0 0', fontWeight: 600 }}>{AUTORITETSLINJE}</p>
        )}
        {aktivt.stoppkriterium && (
          <p style={{ margin: '0.5em 0 0' }}>
            <strong>Stopp hvis:</strong> {aktivt.stoppkriterium}
          </p>
        )}
        {korrigert === aktivt.id && <KorrigeringsLinje p={p} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', marginTop: '0.75em' }}>
        <Knapp primar p={p} onClick={videre}>
          {aktivt.kritisk ? 'Bekreft — gjort' : 'Neste'}
        </Knapp>
        <Knapp p={p} onClick={() => stemmerIkke(aktivt)}>
          Stemmer ikke
        </Knapp>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Nakkesjekken — kontrollpunktet autoritetslinjen er koblet til
 * ------------------------------------------------------------------ */

function NakkesjekkKontroll({
  steg,
  bekreftet,
  onBekreft,
  p,
}: {
  steg: ProtokollSteg;
  bekreftet: boolean;
  onBekreft: () => void;
  p: Palett;
}) {
  return (
    <div
      style={{
        padding: '0.75em',
        border: `3px solid ${p.tekst}`,
        borderRadius: 8,
      }}
    >
      <p style={{ margin: 0, fontSize: '1.25em', fontWeight: 700 }}>{steg.handling}</p>
      {steg.kontrollpunkt && <p style={{ margin: '0.5em 0 0' }}>{steg.kontrollpunkt}</p>}
      <p style={{ margin: '0.5em 0 0', fontWeight: 600 }}>{AUTORITETSLINJE}</p>
      {steg.stoppkriterium && (
        <p style={{ margin: '0.5em 0 0' }}>
          <strong>Stopp hvis:</strong> {steg.stoppkriterium}
        </p>
      )}
      {bekreftet ? (
        <p style={{ margin: '0.75em 0 0', fontWeight: 600 }}>Nakken er kjent på — god tur.</p>
      ) : (
        <div style={{ marginTop: '0.75em' }}>
          <Knapp primar p={p} onClick={onBekreft}>
            Nakken er sjekket
          </Knapp>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Kvittering (INV-3): grunnlag + svakeste premiss + gyldighet
 * ------------------------------------------------------------------ */

function Kvittering({
  fakta,
  protokoll,
  p,
}: {
  fakta: ReturnType<typeof hentFakta>;
  protokoll: Protokoll;
  p: Palett;
}) {
  return (
    <footer style={{ marginTop: '1em', paddingTop: '0.5em', borderTop: `1px solid ${p.kant}` }}>
      <p style={{ margin: 0, color: p.demper }}>
        Grunnlag: {fakta.datakvalitet.svakestePremiss}{' '}
        {fakta.vaergrunnlag && (
          <>
            Vær nå: {fakta.vaergrunnlag.tempC} °C, føles som{' '}
            {Math.round(fakta.vaergrunnlag.feelsLikeC)} °C.
          </>
        )}{' '}
        Gjelder til {klokkeslett(protokoll.gyldigTilISO)}.
      </p>
    </footer>
  );
}

/* ------------------------------------------------------------------ *
 * Småting
 * ------------------------------------------------------------------ */

function KorrigeringsLinje({ p }: { p: Palett }) {
  return (
    <p style={{ margin: '0.5em 0 0', borderTop: `1px dashed ${p.kant}`, paddingTop: '0.5em' }}>
      Bytt eller fjern ett lag — minste endring først. Endret for i dag; profilen
      er uendret.
    </p>
  );
}

function Knapp({
  children,
  onClick,
  primar,
  p,
}: {
  children: string;
  onClick: () => void;
  primar?: boolean;
  p: Palett;
}) {
  const stil: CSSProperties = {
    minHeight: 48,
    minWidth: 48,
    padding: '0 1em',
    fontSize: '1em',
    fontFamily: 'inherit',
    fontWeight: primar ? 700 : 400,
    color: primar ? p.grunn : p.tekst,
    background: primar ? p.tekst : p.grunn,
    border: `2px solid ${p.tekst}`,
    borderRadius: 8,
    cursor: 'pointer',
  };
  return (
    <button type="button" onClick={onClick} style={stil}>
      {children}
    </button>
  );
}
