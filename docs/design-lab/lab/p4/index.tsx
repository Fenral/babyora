/**
 * P4 «AMBIENT PROTOKOLL» — overgangs-UI (spec v2 §3, P4-sløyfen).
 *
 * Ren komposisjon: brief-flaten viser protokollens FØRSTE komplette
 * trygge steg (fra P1s kompilator) som handling, med versjon +
 * gyldighet fra P3s brief. «Åpne»-overgangen viser SAMME versjon i full
 * protokollsekvens (minimal egen rendering av steglisten — P1 eksporterer
 * ingen stegliste-komponent) + kontrollpunktet sist. Versjonsbrudd ved
 * åpning viser feiltilstand — det skal være umulig via brief-maskinen
 * (property-testet i __tests__/p4.test.ts).
 *
 * Alt innhold (stegtekst, stoppkriterier, brieffelt, fallback) kommer
 * fra P1/P3/felles — P4 skriver kun overgangstekstene (P4_TEKST).
 *
 * TIDSSTYRING OG LOGG ER OPERATØRUTSTYR (Sols fase 11 runde 2, P1):
 * prototypen rendrer INGEN klokke, spoleknapper eller hendelseslogg.
 * Operatør/automatisering spoler via Operatør-panelet eller
 * window.__lab.spol(min) — begge utenfor deltakerens DOM.
 *
 * ÉN PRIMÆRHANDLING (Sols fase 11 runde 2, P1): briefen har nøyaktig
 * ett visuelt primært neste steg («Neste steg: …», merket
 * data-primaerhandling). Deltaet er sekundær OPPLYSNING («Endring senere
 * i protokollen: …») — aldri et konkurrerende imperativ med lik vekt.
 * Håndheves i __tests__/p4-primaerhandling.test.ts.
 *
 * Systemfont, lys grunn, AA-kontrast, ≥48px treffmål, ingen animasjon,
 * ingen maskot. storTekst skalerer all tekst 1.4×.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { Scenario } from '../felles/scenarier';
import { DEGRADERT_NESTE_HANDLING } from '../felles/tekst';
import { NAKKESJEKK_ID, type ProtokollSteg } from '../p1/protokollkompilator';
import {
  motta,
  START_TILSTAND,
  type Brief,
  type BriefTilstand,
} from '../p3/brief-maskin';
import { deltaVaerDel } from '../p3/briefbygger';
import {
  ambientTidslinje,
  forsteTryggeSteg,
  lesP4Innhold,
  sjekkVersjonsbrudd,
  P4_TEKST,
  type P4Innhold,
} from './syntese';
import { manifest } from './manifest';

export { manifest };

export type LabKlokke = {
  naaISO(): string;
  spol(min: number): void;
  onTick(cb: () => void): () => void;
};

export type PrototypeProps = {
  scenario: Scenario;
  klokke: LabKlokke;
  logg?: (event: string, data?: unknown) => void;
};

/** Remonter sløyfen fra start når scenariet byttes. */
export function Prototype(props: PrototypeProps) {
  return <P4Sloyfe key={props.scenario.id} {...props} />;
}

type Palett = { ink: string; dus: string; kant: string; flate: string };

function palett(hoyKontrast: boolean): Palett {
  return hoyKontrast
    ? { ink: '#000000', dus: '#000000', kant: '#000000', flate: '#ffffff' }
    : { ink: '#1a1a1a', dus: '#4d4d4d', kant: '#8c8c8c', flate: '#fafafa' };
}

function klokkeslett(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.substring(11, 16) : iso;
}

function P4Sloyfe({ scenario, klokke, logg }: PrototypeProps) {
  const { steg: tidslinje } = useMemo(() => ambientTidslinje(scenario), [scenario]);

  const maskinRef = useRef<BriefTilstand>(START_TILSTAND);
  const stegRef = useRef(0);
  const [, tving] = useState(0);
  const [protokollAapen, setProtokollAapen] = useState(false);
  const [kontrollBekreftetKl, setKontrollBekreftetKl] = useState<string | null>(null);

  const oppdater = useCallback(() => {
    const naaISO = klokke.naaISO();
    const naaMs = Date.parse(naaISO);
    let t = maskinRef.current;

    // Spill av alle tidslinjesteg klokken har passert, i rekkefølge.
    // Hendelsene logges KUN til selens logg (operatørflaten) — deltakeren
    // ser bare brief-flatens tilstand.
    while (
      stegRef.current < tidslinje.length &&
      Date.parse(tidslinje[stegRef.current].tidISO) <= naaMs
    ) {
      const steg = tidslinje[stegRef.current];
      stegRef.current += 1;
      const forrige = t;
      t = motta(t, steg.hendelse, { naaISO: steg.tidISO });
      logg?.('tidslinje-steg', { etikett: steg.etikett, tidISO: steg.tidISO });

      if (steg.hendelse.type === 'brief') {
        const brief = steg.hendelse.brief;
        if (t.forkastede.length > forrige.forkastede.length) {
          const f = t.forkastede[t.forkastede.length - 1];
          logg?.('brief-forkastet', f);
        } else if (t.status === 'maskert') {
          logg?.('maskert', { tidISO: steg.tidISO, briefId: brief.briefId });
        } else {
          logg?.('brief-akseptert', { versjon: brief.versjon, briefId: brief.briefId });
        }
      }
    }

    // Klokkeobservasjon: utløp fanges også uten nye tidslinjesteg.
    const forrige = t;
    t = motta(t, { type: 'klokke' }, { naaISO });
    if (t.status === 'maskert' && forrige.status !== 'maskert') {
      logg?.('maskert', { tidISO: naaISO });
    }

    maskinRef.current = t;
    tving((v) => v + 1);
  }, [klokke, logg, tidslinje]);

  // Selen eier klokka: spoling (Operatør-panel eller window.__lab.spol)
  // varsler via onTick — prototypen har ingen egne tidskontroller.
  useEffect(() => {
    oppdater();
    return klokke.onTick(oppdater);
  }, [klokke, oppdater]);

  const t = maskinRef.current;
  const naaISO = klokke.naaISO();
  const brief = t.gjeldende;
  const innhold: P4Innhold | null = brief ? lesP4Innhold(brief) : null;
  const versjonssjekk = brief ? sjekkVersjonsbrudd(brief) : null;

  const stor = scenario.flags.storTekst === true;
  const p = palett(scenario.flags.hoyKontrast === true);

  const knapp: CSSProperties = {
    minHeight: 48,
    minWidth: 48,
    padding: '0 0.8em',
    fontSize: '1em',
    fontFamily: 'inherit',
    fontWeight: 600,
    color: p.ink,
    background: '#ffffff',
    border: `2px solid ${p.ink}`,
    borderRadius: '0.4em',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: stor ? 22.4 : 16,
        lineHeight: 1.5,
        color: p.ink,
        background: '#ffffff',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      {/* Brief-flaten: protokollens steg 1 som handling + versjon/gyldighet. */}
      <section
        aria-label="Simulert brief-flate"
        style={{ border: `2px solid ${p.ink}`, borderRadius: '0.6em', overflow: 'hidden', marginBottom: '1em' }}
      >
        <p
          style={{
            margin: 0,
            padding: '0.4em 0.8em',
            fontSize: '0.75em',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: p.ink,
            color: '#ffffff',
          }}
        >
          SIMULERT BRIEF-FLATE — krever native verifisering
        </p>
        <div style={{ padding: '0.8em' }}>
          <BriefFlate tilstand={t} brief={brief} innhold={innhold} p={p} nyOmsorgsperson={scenario.flags.nyOmsorgsperson === true} />
        </div>
      </section>

      {/* Overgangen: åpne SAMME versjon i full protokollsekvens. */}
      {innhold !== null && brief !== null && t.status !== 'maskert' && (
        <section aria-label="Protokollovergang" style={{ marginBottom: '1em' }}>
          <button
            type="button"
            style={{ ...knapp, fontWeight: 700 }}
            aria-expanded={protokollAapen}
            onClick={() => {
              if (!protokollAapen) {
                logg?.('protokoll-aapnet', {
                  tidISO: naaISO,
                  briefId: brief.briefId,
                  briefVersjon: versjonssjekk?.briefVersjon,
                  protokollVersjon: versjonssjekk?.protokollVersjon,
                  brudd: versjonssjekk?.brudd,
                });
                if (versjonssjekk?.brudd) logg?.('versjonsbrudd', versjonssjekk);
              } else {
                // Returen: samme brief (id + versjon) skal stå på flaten
                // etter lukking — kontinuiteten logges begge veier (P4-P0).
                logg?.('protokoll-lukket', {
                  tidISO: naaISO,
                  briefId: brief.briefId,
                  briefVersjon: brief.versjon,
                });
              }
              setProtokollAapen(!protokollAapen);
            }}
          >
            {protokollAapen
              ? P4_TEKST.lukkProtokoll
              : P4_TEKST.aapneProtokoll(innhold.protokoll.steg.length)}
          </button>

          {protokollAapen &&
            (versjonssjekk?.brudd ? (
              <Feiltilstand sjekk={versjonssjekk} p={p} />
            ) : (
              <ProtokollVisning
                brief={brief}
                innhold={innhold}
                p={p}
                kontrollBekreftetKl={kontrollBekreftetKl}
                onKontroll={() => {
                  const kl = klokkeslett(naaISO);
                  setKontrollBekreftetKl(kl);
                  logg?.('kontrollpunkt-bekreftet', { tidISO: naaISO, versjon: brief.versjon });
                }}
                knapp={knapp}
              />
            ))}
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Brief-flaten — handlingen ER protokollens steg 1
 * ------------------------------------------------------------------ */

/**
 * Stempellinjen navngir BÅDE briefId og versjon og brukes uendret på
 * begge flater (brief-flaten OG den åpnede protokollen) — kontinuiteten
 * i overgangen er dermed synlig, ikke bare påstått (P4-P0).
 */
function Stempellinje({ brief, utlopt, dus }: { brief: Brief; utlopt?: boolean; dus: string }) {
  return (
    <p style={{ margin: '0 0 0.4em', fontSize: '0.85em', color: dus, fontVariantNumeric: 'tabular-nums' }}>
      Brief #{brief.versjon} · {brief.briefId} · utstedt {klokkeslett(brief.issuedAtISO)} ·{' '}
      {utlopt
        ? `gjaldt til ${klokkeslett(brief.expiresAtISO)} — utløpt`
        : `gjelder til ${klokkeslett(brief.expiresAtISO)}`}
    </p>
  );
}

/**
 * Eksportert for __tests__/p4-primaerhandling.test.ts: testen rendrer
 * brief-DOM-en statisk og FEILER hvis den har ≠ 1 element med
 * data-primaerhandling (to konkurrerende imperativer er en P1-feil).
 */
export function BriefFlate({
  tilstand,
  brief,
  innhold,
  p,
  nyOmsorgsperson,
}: {
  tilstand: BriefTilstand;
  brief: Brief | null;
  innhold: P4Innhold | null;
  p: Palett;
  nyOmsorgsperson: boolean;
}) {
  if (tilstand.status === 'ingen' || brief === null || innhold === null) {
    return <p style={{ margin: 0, color: p.dus }}>Ingen brief ennå — venter på første levering.</p>;
  }

  if (tilstand.status === 'maskert') {
    return (
      <div>
        <Stempellinje brief={brief} utlopt dus={p.dus} />
        <p style={{ margin: '0 0 0.5em', fontSize: '1.3em', fontWeight: 700 }}>{P4_TEKST.maskert}</p>
        <p style={{ margin: '0 0 0.5em' }}>
          Rådet fra {klokkeslett(brief.issuedAtISO)} er utløpt og er fjernet fra flaten.
        </p>
        <div style={{ border: `2px solid ${p.ink}`, borderRadius: '0.4em', padding: '0.6em 0.8em' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Inntil ny brief:</p>
          <p style={{ margin: 0 }}>{DEGRADERT_NESTE_HANDLING}</p>
        </div>
      </div>
    );
  }

  if (tilstand.status === 'ventende') {
    return (
      <div>
        <Stempellinje brief={brief} dus={p.dus} />
        <p style={{ margin: 0 }}>{P4_TEKST.ventende(klokkeslett(brief.validFromISO))}</p>
      </div>
    );
  }

  const steg1 = forsteTryggeSteg(innhold);

  return (
    <div>
      <Stempellinje brief={brief} dus={p.dus} />

      {tilstand.status === 'stale' && (
        <p style={{ margin: '0 0 0.4em', fontWeight: 700 }}>
          {P4_TEKST.utenNett} {DEGRADERT_NESTE_HANDLING}
        </p>
      )}

      {/* ÉN PRIMÆRHANDLING: protokollens steg 1, størst i rangen og eneste
          element med primær handlingssemantikk (data-primaerhandling). */}
      <p
        data-primaerhandling="true"
        style={{ margin: '0 0 0.2em', fontSize: '1.3em', fontWeight: 700 }}
      >
        {P4_TEKST.nesteSteg(steg1.handling)}
      </p>
      <p style={{ margin: '0 0 0.4em', fontSize: '0.85em', color: p.dus }}>
        {P4_TEKST.stegEnAv(innhold.protokoll.steg.length)}
      </p>
      {steg1.stoppkriterium && (
        <p style={{ margin: '0 0 0.4em' }}>
          <strong>Stopp hvis:</strong> {steg1.stoppkriterium}
        </p>
      )}

      {/* Endret vær: deltaet er sekundær OPPLYSNING — værledd, endringen
          rammet inn som «Endring senere i protokollen», og baseline.
          Aldri et andre imperativ med primær vekt (Sols runde 2, P1);
          ingen ny anbefaling introduseres (P4-P1). */}
      {innhold.briefInnhold.delta && (
        <div style={{ margin: '0 0 0.4em' }}>
          <p style={{ margin: 0 }}>
            {deltaVaerDel(innhold.briefInnhold.delta.setning)}
          </p>
          {innhold.briefInnhold.komfortHandling !== null &&
            innhold.briefInnhold.komfortHandling !== steg1.handling && (
              <p style={{ margin: 0, fontSize: '0.95em' }}>
                {P4_TEKST.deltaSekundaer(innhold.briefInnhold.komfortHandling)}
              </p>
            )}
          <p style={{ margin: 0, fontSize: '0.85em', color: p.dus }}>
            Referanse — {innhold.briefInnhold.delta.baseline.etikett}
          </p>
        </div>
      )}

      <p
        style={{
          margin: 0,
          fontSize: '0.75em',
          color: p.dus,
          borderTop: `1px solid ${p.kant}`,
          paddingTop: '0.4em',
        }}
      >
        Basert på fiktiv labprognose · usikrest: {innhold.briefInnhold.svakestePremiss}
        {nyOmsorgsperson && ' · Delt brief — versjon og gyldighet står i briefen selv.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Protokollvisningen — SAMME versjon, hele sekvensen, kontrollpunktet
 * (minimal egen rendering: P1 eksporterer ingen stegliste-komponent)
 * ------------------------------------------------------------------ */

function ProtokollVisning({
  brief,
  innhold,
  p,
  kontrollBekreftetKl,
  onKontroll,
  knapp,
}: {
  brief: Brief;
  innhold: P4Innhold;
  p: Palett;
  kontrollBekreftetKl: string | null;
  onKontroll: () => void;
  knapp: CSSProperties;
}) {
  const steg = innhold.protokoll.steg;
  return (
    <div style={{ marginTop: '0.8em', border: `1px solid ${p.kant}`, borderRadius: '0.6em', padding: '0.8em' }}>
      <Stempellinje brief={brief} dus={p.dus} />
      <p style={{ margin: '0 0 0.6em', fontSize: '0.85em', fontWeight: 700 }}>
        {P4_TEKST.sammeVersjon(brief.briefId, brief.versjon)}
      </p>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steg.map((s: ProtokollSteg, i: number) => (
          <li
            key={s.id}
            style={{
              padding: '0.5em 0.6em',
              marginBottom: '0.4em',
              background: s.sone === 'sikkerhet' ? '#ffffff' : p.flate,
              border: s.sone === 'sikkerhet' || s.kritisk ? `3px solid ${p.ink}` : `1px solid ${p.kant}`,
              borderRadius: '0.4em',
            }}
          >
            {s.sone === 'sikkerhet' && (
              <p style={{ margin: 0, fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.08em' }}>
                SIKKERHET
              </p>
            )}
            <p style={{ margin: 0, fontWeight: 600 }}>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: p.dus }}>{i + 1}.</span>{' '}
              {s.handling}
            </p>
            {s.stoppkriterium && (
              <p style={{ margin: '0.25em 0 0', color: p.dus }}>
                <strong>Stopp hvis:</strong> {s.stoppkriterium}
              </p>
            )}
            {s.kontrollpunkt && <p style={{ margin: '0.25em 0 0', color: p.dus }}>{s.kontrollpunkt}</p>}
            {s.id === NAKKESJEKK_ID && (
              <div style={{ marginTop: '0.5em' }}>
                {kontrollBekreftetKl === null ? (
                  <button type="button" style={{ ...knapp, fontWeight: 700 }} onClick={onKontroll}>
                    Nakken er sjekket
                  </button>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85em', color: p.dus }}>
                    Kontrollpunkt bekreftet kl. {kontrollBekreftetKl} (Brief #{brief.versjon})
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Feiltilstanden — versjonsbrudd betyr at syntesen har feilet
 * ------------------------------------------------------------------ */

function Feiltilstand({
  sjekk,
  p,
}: {
  sjekk: { briefVersjon: number; protokollVersjon: number };
  p: Palett;
}) {
  return (
    <div
      role="alert"
      style={{ marginTop: '0.8em', border: `3px solid ${p.ink}`, borderRadius: '0.6em', padding: '0.8em' }}
    >
      <p style={{ margin: '0 0 0.4em', fontWeight: 800 }}>
        {P4_TEKST.versjonsbrudd(sjekk.briefVersjon, sjekk.protokollVersjon)}
      </p>
      <p style={{ margin: 0 }}>{DEGRADERT_NESTE_HANDLING}</p>
    </div>
  );
}
