/**
 * P3 AMBIENT BRIEFING — tidslinje-UI (spec v2 §2: «P3 er en TIDSLINJE,
 * ikke én mock»).
 *
 * En simulert widget-ramme (merket «SIMULERT WIDGET — krever native
 * verifisering») viser gjeldende brief fra brief-maskinen. Klokkespoling
 * driver sekvensen: V1 → V2 ankommer → forsinket V1 ankommer (forkastes —
 * logget i selens hendelseslogg) → utløp → maskert tilstand («Må beregnes
 * på nytt» + konservativ fallback). Maskering er alltid STRUKTURELL
 * (innholdet fjernes, tekststempel + fallback vises) — aldri dimming.
 *
 * TIDSSTYRING OG LOGG ER OPERATØRUTSTYR (Sols fase 11 runde 2, P1):
 * prototypen rendrer INGEN klokke, spoleknapper eller hendelseslogg.
 * Klokka eies av selen (LabShell); operatør/automatisering spoler via
 * Operatør-panelet eller window.__lab.spol(min) — begge utenfor
 * deltakerens DOM. Alle hendelser sendes kun til selens logg via
 * props.logg (synlig i Operatør-panelet, aldri i deltakerflaten).
 *
 * «Åpne appen»-fallbacken viser full plaggliste (basePlagg) med SAMME
 * versjonsstempel som widgeten. Kvittering heter «Åpnet», aldri noe
 * fortolkende.
 *
 * Presentasjonen er retningens egen — ingen import fra felles/komponenter.
 * Systemfont, lys grunn, AA-kontrast, ≥48px treffmål, ingen animasjon.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Scenario } from '../felles/scenarier';
import { DEGRADERT_NESTE_HANDLING } from '../felles/tekst';
import {
  motta,
  START_TILSTAND,
  type BriefTilstand,
} from './brief-maskin';
import {
  byggTidslinje,
  deltaVaerDel,
  lesBriefInnhold,
  KVITTERING_ETIKETT,
  type BriefInnhold,
} from './briefbygger';
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

/** Remonter tidslinjen fra start når scenariet byttes. */
export function Prototype(props: PrototypeProps) {
  return <P3Tidslinje key={props.scenario.id} {...props} />;
}

function klokkeslett(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.substring(11, 16) : iso;
}

function P3Tidslinje({ scenario, klokke, logg }: PrototypeProps) {
  const tidslinje = useMemo(() => byggTidslinje(scenario), [scenario]);

  const maskinRef = useRef<BriefTilstand>(START_TILSTAND);
  const stegRef = useRef(0);
  const [, tving] = useState(0);
  const [visApp, setVisApp] = useState(false);
  const [kvittertKl, setKvittertKl] = useState<string | null>(null);

  const oppdater = useCallback(() => {
    const naaISO = klokke.naaISO();
    const naaMs = Date.parse(naaISO);
    let t = maskinRef.current;

    // Spill av alle tidslinjesteg klokken har passert, i rekkefølge.
    // Hendelsene logges KUN til selens logg (operatørflaten) — deltakeren
    // ser bare widgetens tilstand.
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
          logg?.('brief-akseptert', {
            versjon: brief.versjon,
            briefId: brief.briefId,
          });
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
  const innhold: BriefInnhold | null = t.gjeldende
    ? lesBriefInnhold(t.gjeldende)
    : null;

  const stor = scenario.flags.storTekst === true;
  const hk = scenario.flags.hoyKontrast === true;
  const ink = hk ? '#000000' : '#1a1a1a';
  const dus = hk ? '#000000' : '#4d4d4d';
  const kant = hk ? '#000000' : '#8c8c8c';

  const knapp: CSSProperties = {
    minHeight: 48,
    minWidth: 48,
    padding: '0 0.8em',
    fontSize: '1em',
    fontFamily: 'inherit',
    fontWeight: 600,
    color: ink,
    background: '#ffffff',
    border: `2px solid ${ink}`,
    borderRadius: '0.4em',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: stor ? 22.4 : 16,
        lineHeight: 1.5,
        color: ink,
        background: '#ffffff',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      {/* Den simulerte widgeten. */}
      <section
        aria-label="Simulert widget"
        style={{
          border: `2px solid ${ink}`,
          borderRadius: '0.6em',
          overflow: 'hidden',
          marginBottom: '1em',
        }}
      >
        <p
          style={{
            margin: 0,
            padding: '0.4em 0.8em',
            fontSize: '0.75em',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: hk ? '#000000' : '#1a1a1a',
            color: '#ffffff',
          }}
        >
          SIMULERT WIDGET — krever native verifisering
        </p>
        <div style={{ padding: '0.8em' }}>
          <WidgetInnhold
            tilstand={t}
            innhold={innhold}
            ink={ink}
            dus={dus}
            kant={kant}
            nyOmsorgsperson={scenario.flags.nyOmsorgsperson === true}
          />
        </div>
      </section>

      {/* App-fallback: full liste, samme versjonsstempel. Nedre tommelsone. */}
      <section aria-label="App-fallback" style={{ marginBottom: '1em' }}>
        <button
          type="button"
          style={knapp}
          aria-expanded={visApp}
          onClick={() => {
            if (!visApp) logg?.('aapne-app', { tidISO: naaISO });
            setVisApp(!visApp);
          }}
        >
          {visApp ? 'Lukk appen' : 'Åpne appen (full liste)'}
        </button>

        {visApp && (
          <div
            style={{
              marginTop: '0.8em',
              border: `1px solid ${kant}`,
              borderRadius: '0.6em',
              padding: '0.8em',
            }}
          >
            <p style={{ margin: '0 0 0.5em', fontSize: '0.75em', fontWeight: 700 }}>
              APP — FALLBACK (full liste)
            </p>
            <AppInnhold tilstand={t} innhold={innhold} ink={ink} dus={dus} kant={kant} />
            <div style={{ marginTop: '0.8em' }}>
              {kvittertKl === null ? (
                <button
                  type="button"
                  style={knapp}
                  onClick={() => {
                    const kl = klokkeslett(naaISO);
                    setKvittertKl(kl);
                    logg?.('kvittering-aapnet', {
                      tidISO: naaISO,
                      versjon: t.gjeldende?.versjon ?? null,
                    });
                  }}
                >
                  {KVITTERING_ETIKETT}
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85em', color: dus }}>
                  Kvittering: åpnet kl. {kvittertKl}
                  {t.gjeldende ? ` (Brief #${t.gjeldende.versjon})` : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Widget-flaten: fast typografisk rang — handling størst, delta
 * sekundær, stempellinje med tabular-tall, kvittering minst.
 * ------------------------------------------------------------------ */

function Stempellinje({
  versjon,
  utstedtISO,
  gjelderTilISO,
  utlopt,
  dus,
}: {
  versjon: number;
  utstedtISO: string;
  gjelderTilISO: string;
  utlopt?: boolean;
  dus: string;
}) {
  return (
    <p
      style={{
        margin: '0 0 0.4em',
        fontSize: '0.85em',
        color: dus,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      Brief #{versjon} · utstedt {klokkeslett(utstedtISO)} ·{' '}
      {utlopt
        ? `gjaldt til ${klokkeslett(gjelderTilISO)} — utløpt`
        : `gjelder til ${klokkeslett(gjelderTilISO)}`}
    </p>
  );
}

function Maskert({
  tilstand,
  ink,
  kant,
  dus,
}: {
  tilstand: BriefTilstand;
  ink: string;
  kant: string;
  dus: string;
}) {
  const brief = tilstand.gjeldende;
  return (
    <div>
      {brief && (
        <Stempellinje
          versjon={brief.versjon}
          utstedtISO={brief.issuedAtISO}
          gjelderTilISO={brief.expiresAtISO}
          utlopt
          dus={dus}
        />
      )}
      <p style={{ margin: '0 0 0.5em', fontSize: '1.3em', fontWeight: 700 }}>
        Må beregnes på nytt
      </p>
      <p style={{ margin: '0 0 0.5em' }}>
        {brief
          ? `Rådet fra ${klokkeslett(brief.issuedAtISO)} er utløpt og er fjernet fra flaten.`
          : 'Rådet er trukket tilbake og er fjernet fra flaten.'}
      </p>
      <div
        style={{
          border: `2px solid ${ink}`,
          borderRadius: '0.4em',
          padding: '0.6em 0.8em',
        }}
      >
        <p style={{ margin: 0, fontWeight: 700 }}>Inntil ny brief:</p>
        <p style={{ margin: 0 }}>{DEGRADERT_NESTE_HANDLING}</p>
      </div>
      <p style={{ margin: '0.5em 0 0', fontSize: '0.75em', color: dus, borderTop: `1px solid ${kant}`, paddingTop: '0.4em' }}>
        Maskeringen er strukturell: innholdet er fjernet, ikke nedtonet.
      </p>
    </div>
  );
}

function WidgetInnhold({
  tilstand,
  innhold,
  ink,
  dus,
  kant,
  nyOmsorgsperson,
}: {
  tilstand: BriefTilstand;
  innhold: BriefInnhold | null;
  ink: string;
  dus: string;
  kant: string;
  nyOmsorgsperson: boolean;
}) {
  if (tilstand.status === 'ingen' || tilstand.gjeldende === null || innhold === null) {
    return (
      <p style={{ margin: 0, color: dus }}>
        Ingen brief ennå — venter på første levering.
      </p>
    );
  }

  if (tilstand.status === 'maskert') {
    return <Maskert tilstand={tilstand} ink={ink} kant={kant} dus={dus} />;
  }

  const brief = tilstand.gjeldende;

  if (tilstand.status === 'ventende') {
    return (
      <div>
        <Stempellinje
          versjon={brief.versjon}
          utstedtISO={brief.issuedAtISO}
          gjelderTilISO={brief.expiresAtISO}
          dus={dus}
        />
        <p style={{ margin: 0 }}>
          Briefen gjelder fra {klokkeslett(brief.validFromISO)}.
        </p>
      </div>
    );
  }

  const harde = innhold.sikkerhet.filter((e) => e.prioritet === 'hard');
  const myke = innhold.sikkerhet.filter((e) => e.prioritet === 'soft');

  return (
    <div>
      <Stempellinje
        versjon={brief.versjon}
        utstedtISO={brief.issuedAtISO}
        gjelderTilISO={brief.expiresAtISO}
        dus={dus}
      />

      {tilstand.status === 'stale' && (
        <p style={{ margin: '0 0 0.4em', fontWeight: 700 }}>
          Uten nett — briefen kan være foreldet. {DEGRADERT_NESTE_HANDLING}
        </p>
      )}

      {/* Handling — størst i rangen. */}
      <p style={{ margin: '0 0 0.4em', fontSize: '1.3em', fontWeight: 700 }}>
        {innhold.handling}
      </p>

      {/* Delta (kun værleddet — handlingen er alltid den konkrete over)
          med synlig versjonert ANTREKKS-baseline (INV-6 + P3-P0). */}
      {innhold.delta && (
        <p style={{ margin: '0 0 0.4em' }}>
          {deltaVaerDel(innhold.delta.setning)}
          <br />
          <span style={{ fontSize: '0.85em', color: dus }}>
            Referanse — {innhold.delta.baseline.etikett}
          </span>
        </p>
      )}

      {/* Sikkerhetsinnholdet — bæres alltid, med stoppkriterium. */}
      {harde.map((e) => (
        <div
          key={e.id}
          style={{
            border: `2px solid ${ink}`,
            borderRadius: '0.4em',
            padding: '0.6em 0.8em',
            margin: '0 0 0.4em',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>{e.innhold}</p>
          {e.stoppkriterium && <p style={{ margin: 0 }}>{e.stoppkriterium}</p>}
        </div>
      ))}

      {/* Dominerer hard sikkerhet, vises den konkrete antrekkshandlingen
          rett etter — briefen forblir handlingskomplett (P3-P0). */}
      {innhold.komfortHandling !== null &&
        innhold.komfortHandling !== innhold.handling && (
          <p style={{ margin: '0 0 0.4em', fontWeight: 600 }}>
            {innhold.komfortHandling}
          </p>
        )}
      {myke.map((e) => (
        <p key={e.id} style={{ margin: '0 0 0.4em', fontSize: '0.9em' }}>
          {e.innhold} {e.forventetHandling}
        </p>
      ))}

      {/* Kvitteringslinjen — minst i rangen, svakeste premiss synlig. */}
      <p
        style={{
          margin: 0,
          fontSize: '0.75em',
          color: dus,
          borderTop: `1px solid ${kant}`,
          paddingTop: '0.4em',
        }}
      >
        Basert på fiktiv labprognose · usikrest: {innhold.svakestePremiss}
        {nyOmsorgsperson &&
          ' · Delt brief — versjon og gyldighet står i briefen selv.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * App-fallbacken: full plaggliste med SAMME versjonsstempel.
 * ------------------------------------------------------------------ */

function AppInnhold({
  tilstand,
  innhold,
  ink,
  dus,
  kant,
}: {
  tilstand: BriefTilstand;
  innhold: BriefInnhold | null;
  ink: string;
  dus: string;
  kant: string;
}): ReactNode {
  if (tilstand.gjeldende === null || innhold === null) {
    return <p style={{ margin: 0, color: dus }}>Ingen brief å vise ennå.</p>;
  }

  if (tilstand.status === 'maskert') {
    return (
      <div>
        <Maskert tilstand={tilstand} ink={ink} kant={kant} dus={dus} />
        <p style={{ margin: '0.5em 0 0', fontSize: '0.85em', color: dus }}>
          Ny beregning er ikke tilgjengelig i simuleringen.
        </p>
      </div>
    );
  }

  const brief = tilstand.gjeldende;

  return (
    <div>
      {/* Samme versjonsstempel som widgeten — appen er zoom, ikke ny sannhet. */}
      <Stempellinje
        versjon={brief.versjon}
        utstedtISO={brief.issuedAtISO}
        gjelderTilISO={brief.expiresAtISO}
        dus={dus}
      />
      {innhold.form === 'degradert' ? (
        <p style={{ margin: 0 }}>{innhold.handling}</p>
      ) : (
        <>
          <p style={{ margin: '0 0 0.3em', fontWeight: 700 }}>Full liste</p>
          <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.4em' }}>
            {innhold.basePlagg.map((p) => (
              <li key={`${p.kategori}-${p.plagg}`}>
                {p.kategori}: {p.plagg}
              </li>
            ))}
          </ul>
          {innhold.sikkerhet
            .filter((e) => e.prioritet === 'hard')
            .map((e) => (
              <div
                key={e.id}
                style={{
                  border: `2px solid ${ink}`,
                  borderRadius: '0.4em',
                  padding: '0.6em 0.8em',
                  margin: '0 0 0.4em',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>{e.innhold}</p>
                {e.stoppkriterium && <p style={{ margin: 0 }}>{e.stoppkriterium}</p>}
              </div>
            ))}
          <p style={{ margin: 0, fontSize: '0.75em', color: dus }}>
            Usikrest i grunnlaget: {innhold.svakestePremiss}
          </p>
        </>
      )}
    </div>
  );
}
