/**
 * P2 «SPENNET» — instrumentflaten (Confidence Instrument).
 *
 * Egen presentasjon for retningen — importerer IKKE felles/komponenter.tsx.
 * Vertikalt spenn med hardt kaldgulv (skravert terreng) og mykere varmetak;
 * inverteres ved vogn-søvn. Kandidat som chips forhåndsutfylt fra basePlagg.
 * Tekstparitet: hver instrumenttilstand har kanonisk setningsform som bærer
 * SAMME beslutning som figuren (figuren er aria-merket med setningen).
 *
 * Lys grunn, systemfont, AA-kontrast, ≥48px mål, ingen animasjon/maskot.
 * storTekst-flagget skalerer all tekst 1.4× (em-basert).
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Scenario } from '../felles/scenarier';
import { hentFakta, type BasePlagg } from '../felles/fakta';
import { DEGRADERT_NESTE_HANDLING } from '../felles/tekst';
import {
  byggSpenn,
  kandidatposisjon,
  spennSetning,
  EKSTRA_KANDIDATER,
  HYPOTESE_ETIKETT,
  type Spenn,
  type SpennOk,
  type SpennHendelse,
} from './spennmodell';
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
  logg?: (event: string, detaljer?: Record<string, unknown>) => void;
};

type Oppgave = 'holder-dette' | 'forskrivning';

/* ---------- palett (lys grunn, AA) ---------- */

type Palett = {
  ink: string;
  dus: string;
  grunn: string;
  flate: string;
  kant: string;
};

function palett(hoyKontrast: boolean): Palett {
  return hoyKontrast
    ? { ink: '#000000', dus: '#000000', grunn: '#ffffff', flate: '#ffffff', kant: '#000000' }
    : { ink: '#1a1a1a', dus: '#4d4d4d', grunn: '#ffffff', flate: '#f7f7f5', kant: '#8a8a8a' };
}

const SKRAVUR = (ink: string) =>
  `repeating-linear-gradient(45deg, ${ink} 0px, ${ink} 3px, transparent 3px, transparent 9px)`;

function hhmm(iso: string): string {
  return iso.slice(11, 16);
}

function plaggNokkel(p: BasePlagg): string {
  return `${p.kategori}::${p.plagg}`;
}

/* ---------- hovedkomponent ---------- */

export function Prototype({ scenario, klokke, logg }: PrototypeProps) {
  const fakta = useMemo(() => hentFakta(scenario), [scenario]);
  const spenn = useMemo(() => byggSpenn(fakta), [fakta]);

  const [oppgave, setOppgave] = useState<Oppgave>('holder-dette');

  // Virtuell klokke: utløp skjer som OVERGANG i samme oppgave (spec §1.1).
  const [, setTikk] = useState(0);
  useEffect(() => klokke.onTick(() => setTikk((t) => t + 1)), [klokke]);
  const utloptNaa = klokke.naaISO() > spenn.gyldigTilISO;

  const flags = scenario.flags;
  const pal = palett(!!flags.hoyKontrast);
  const rotStil: CSSProperties = {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: flags.storTekst ? 22.4 : 16,
    lineHeight: 1.5,
    color: pal.ink,
    background: pal.grunn,
    maxWidth: 640,
    margin: '0 auto',
  };

  return (
    <div style={rotStil}>
      {/* Hypotese-etikett: ALLTID synlig (spec + metodisk begrensning). */}
      <p
        style={{
          margin: '0 0 0.75em',
          padding: '0.4em 0.8em',
          border: `2px solid ${pal.ink}`,
          borderRadius: '0.4em',
          fontWeight: 700,
          fontSize: '0.85em',
          background: pal.flate,
        }}
      >
        {HYPOTESE_ETIKETT}
      </p>

      {flags.nyOmsorgsperson && (
        <p style={{ margin: '0 0 0.75em', fontSize: '0.9em', color: pal.dus }}>
          Dette spennet er delt med deg. Grunnlag og gyldighet står på flaten —
          du trenger ingen forhistorie for å bruke det.
        </p>
      )}

      <OppgaveVelger
        oppgave={oppgave}
        onVelg={(o) => {
          setOppgave(o);
          logg?.('p2:oppgave-valgt', { oppgave: o });
        }}
        pal={pal}
      />

      {spenn.status === 'degradert' || utloptNaa ? (
        <Maskert
          spenn={spenn}
          utloptNaa={utloptNaa}
          pal={pal}
          logg={logg}
        />
      ) : oppgave === 'holder-dette' ? (
        <HolderDette spenn={spenn} pal={pal} logg={logg} />
      ) : (
        <Forskrivning spenn={spenn} pal={pal} />
      )}
    </div>
  );
}

/* ---------- oppgavevelger (ikke-scorbar ramme) ---------- */

function OppgaveVelger({
  oppgave,
  onVelg,
  pal,
}: {
  oppgave: Oppgave;
  onVelg: (o: Oppgave) => void;
  pal: Palett;
}) {
  const knapp = (aktiv: boolean): CSSProperties => ({
    minHeight: 48,
    padding: '0 1em',
    fontSize: '1em',
    fontFamily: 'inherit',
    fontWeight: aktiv ? 700 : 400,
    color: pal.ink,
    background: aktiv ? pal.flate : pal.grunn,
    border: aktiv ? `3px solid ${pal.ink}` : `1px solid ${pal.kant}`,
    borderRadius: '0.4em',
    cursor: 'pointer',
  });
  return (
    <nav aria-label="Oppgave" style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', marginBottom: '1em' }}>
      <button type="button" aria-pressed={oppgave === 'holder-dette'} style={knapp(oppgave === 'holder-dette')} onClick={() => onVelg('holder-dette')}>
        Holder dette?
      </button>
      <button type="button" aria-pressed={oppgave === 'forskrivning'} style={knapp(oppgave === 'forskrivning')} onClick={() => onVelg('forskrivning')}>
        Hva skal hen ha på?
      </button>
    </nav>
  );
}

/* ---------- maskert tilstand (degradert/utløpt) ---------- */

function Maskert({
  spenn,
  utloptNaa,
  pal,
  logg,
}: {
  spenn: Spenn;
  utloptNaa: boolean;
  pal: Palett;
  logg?: PrototypeProps['logg'];
}) {
  const aarsak =
    spenn.status === 'degradert'
      ? spenn.aarsak
      : `Spennet gjaldt til ${hhmm(spenn.gyldigTilISO)} og gyldigheten er passert.`;

  useEffect(() => {
    logg?.('p2:maskert-vist', { aarsak, utloptNaa });
  }, [aarsak, utloptNaa, logg]);

  return (
    <section aria-label="Spennet er maskert">
      {/* Strukturell maskering: terrengskravur over hele figuren, aldri dimming. */}
      <div
        style={{
          border: `3px solid ${pal.ink}`,
          borderRadius: '0.4em',
          padding: '1em',
          backgroundImage: SKRAVUR(pal.kant),
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            background: pal.grunn,
            display: 'inline-block',
            padding: '0.2em 0.4em',
          }}
        >
          Spennet er maskert
        </p>
        <p style={{ margin: '0.5em 0 0', background: pal.grunn, padding: '0.2em 0.4em' }}>
          {aarsak}
        </p>
      </div>
      <p style={{ margin: '0.75em 0 0', fontWeight: 700, fontSize: '1.1em' }}>
        {DEGRADERT_NESTE_HANDLING}
      </p>
      <p style={{ margin: '0.5em 0 0', fontSize: '0.85em', color: pal.dus }}>
        Usikrest: hele værgrunnlaget. Beregnet {hhmm(spenn.utstedtISO)} · gjaldt til{' '}
        {hhmm(spenn.gyldigTilISO)}.
      </p>
      <HendelsesListe hendelser={spenn.hendelser} pal={pal} logg={logg} />
    </section>
  );
}

/* ---------- «Holder dette?» — instrumentoppgaven ---------- */

function HolderDette({
  spenn,
  pal,
  logg,
}: {
  spenn: SpennOk;
  pal: Palett;
  logg?: PrototypeProps['logg'];
}) {
  const alleChips = useMemo(
    () => [...spenn.basePlagg, ...EKSTRA_KANDIDATER],
    [spenn.basePlagg],
  );

  // Forhåndsutfylt fra basePlagg (mål: rask korrigering av avvik).
  const [valgte, setValgte] = useState<Set<string>>(
    () => new Set(spenn.basePlagg.map(plaggNokkel)),
  );
  useEffect(() => {
    setValgte(new Set(spenn.basePlagg.map(plaggNokkel)));
  }, [spenn.basePlagg]);

  const kandidat = alleChips.filter((p) => valgte.has(plaggNokkel(p)));
  const dom = kandidatposisjon(spenn, kandidat);

  useEffect(() => {
    logg?.('p2:posisjon-vist', {
      posisjon: dom.posisjon,
      naerHardGrense: dom.naerHardGrense,
      invertert: spenn.invertert,
    });
  }, [dom.posisjon, dom.naerHardGrense, spenn.invertert, logg]);

  const toggle = (p: BasePlagg) => {
    const nokkel = plaggNokkel(p);
    setValgte((forrige) => {
      const neste = new Set(forrige);
      const valgt = !neste.has(nokkel);
      if (valgt) neste.add(nokkel);
      else neste.delete(nokkel);
      logg?.('p2:chip-endret', { plagg: p.plagg, valgt });
      return neste;
    });
  };

  return (
    <section aria-label="Holder dette?">
      <h2 style={{ margin: '0 0 0.25em', fontSize: '1.15em' }}>Holder dette?</h2>
      <p style={{ margin: '0 0 0.5em', color: pal.dus, fontSize: '0.9em' }}>
        Det barnet har på nå — fjern eller legg til så det stemmer:
      </p>

      <div role="group" aria-label="Kandidat-antrekk" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', marginBottom: '1em' }}>
        {alleChips.map((p) => {
          const valgt = valgte.has(plaggNokkel(p));
          return (
            <button
              key={plaggNokkel(p)}
              type="button"
              aria-pressed={valgt}
              onClick={() => toggle(p)}
              style={{
                minHeight: 48,
                padding: '0 0.9em',
                fontSize: '0.95em',
                fontFamily: 'inherit',
                fontWeight: valgt ? 700 : 400,
                color: pal.ink,
                background: valgt ? pal.flate : pal.grunn,
                border: valgt ? `3px solid ${pal.ink}` : `1px dashed ${pal.kant}`,
                borderRadius: '1.5em',
                cursor: 'pointer',
              }}
            >
              {valgt ? '✓ ' : '+ '}
              {p.plagg}
            </button>
          );
        })}
      </div>

      <SpennFigur spenn={spenn} domSetning={dom.setning} markorPosisjon={dom} pal={pal} />

      {/* Fastkoblet respons — kanonisk setningsform (tekstparitet). */}
      <div
        style={{
          border: `3px solid ${pal.ink}`,
          borderRadius: '0.4em',
          padding: '0.75em 1em',
          margin: '0.75em 0 0',
          background: pal.grunn,
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1em' }}>{dom.handling}</p>
        <p style={{ margin: '0.4em 0 0' }}>{dom.kontrolltegn}</p>
      </div>

      <p style={{ margin: '0.75em 0 0', fontWeight: 700 }}>
        Usikrest: {spenn.usikrestPremiss}.
      </p>
      <p style={{ margin: '0.25em 0 0', fontSize: '0.85em', color: pal.dus }}>
        Beregnet {hhmm(spenn.utstedtISO)} · gjelder til {hhmm(spenn.gyldigTilISO)}.
      </p>

      <HendelsesListe hendelser={spenn.hendelser} pal={pal} logg={logg} />
    </section>
  );
}

/* ---------- den vertikale spennfiguren ---------- */

function SpennFigur({
  spenn,
  domSetning,
  markorPosisjon,
  pal,
}: {
  spenn: SpennOk;
  domSetning: string;
  markorPosisjon: { posisjon: 'under-gulv' | 'i-spennet' | 'over-tak'; ekvivalentC: number };
  pal: Palett;
}) {
  // Sonehøyder i % — soner, ikke skala (ingen tall på aksen).
  const OVER = 22;
  const SPENN = 56;
  const UNDER = 22;

  let markorTopp: number;
  if (markorPosisjon.posisjon === 'over-tak') markorTopp = OVER / 2;
  else if (markorPosisjon.posisjon === 'under-gulv') markorTopp = OVER + SPENN + UNDER / 2;
  else {
    const brok =
      (spenn.varmetakC - markorPosisjon.ekvivalentC) /
      (spenn.varmetakC - spenn.kaldgulvC);
    markorTopp = OVER + Math.min(Math.max(brok, 0.05), 0.95) * SPENN;
  }

  const hardKald = spenn.hardSide === 'kald';
  // Hard grense: tykk strek. Myk grense: tynn. Hard terrengsone: skravur.
  const takStrek = hardKald ? `2px solid ${pal.kant}` : `6px solid ${pal.ink}`;
  const gulvStrek = hardKald ? `6px solid ${pal.ink}` : `2px solid ${pal.kant}`;

  const soneTekst: CSSProperties = {
    background: pal.grunn,
    padding: '0.1em 0.4em',
    fontSize: '0.85em',
    fontWeight: 700,
  };

  return (
    <figure
      role="img"
      aria-label={`${spennSetning(spenn)} ${domSetning}`}
      style={{ margin: 0 }}
    >
      <div style={{ position: 'relative', height: 300, border: `1px solid ${pal.kant}`, borderRadius: '0.4em', overflow: 'hidden' }}>
        {/* Over varmetaket */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${OVER}%`,
            borderBottom: takStrek,
            backgroundImage: hardKald ? undefined : SKRAVUR(pal.kant),
            backgroundColor: pal.flate,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.75em',
          }}
        >
          <span style={soneTekst}>
            Over varmetaket — for varmt{spenn.invertert ? ' (hard grense: barnet sover)' : ''}
          </span>
        </div>

        {/* Trygt spenn */}
        <div
          style={{
            position: 'absolute',
            top: `${OVER}%`,
            left: 0,
            right: 0,
            height: `${SPENN}%`,
            background: pal.grunn,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.75em',
          }}
        >
          <span style={{ ...soneTekst, fontWeight: 400 }}>Trygt spenn</span>
        </div>

        {/* Under kaldgulvet */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${UNDER}%`,
            borderTop: gulvStrek,
            backgroundImage: hardKald ? SKRAVUR(pal.kant) : undefined,
            backgroundColor: pal.flate,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.75em',
          }}
        >
          <span style={soneTekst}>
            Under kaldgulvet — for kaldt{hardKald ? ' (hard grense)' : ''}
          </span>
        </div>

        {/* Kandidat-markør */}
        <div
          style={{
            position: 'absolute',
            top: `${markorTopp}%`,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4em',
            pointerEvents: 'none',
          }}
        >
          <div style={{ flex: 1, borderTop: `3px dotted ${pal.ink}` }} />
          <span
            style={{
              background: pal.ink,
              color: pal.grunn,
              fontWeight: 700,
              fontSize: '0.85em',
              padding: '0.2em 0.6em',
              borderRadius: '0.3em',
              marginRight: '0.5em',
            }}
          >
            Deres antrekk
          </span>
        </div>
      </div>
      {/* Tekstparitet: samme beslutning som figuren, alltid i tekst. */}
      <figcaption style={{ marginTop: '0.5em', fontSize: '0.9em' }}>{domSetning}</figcaption>
    </figure>
  );
}

/* ---------- forskrivningsoppgaven (kontrast) ---------- */

function Forskrivning({ spenn, pal }: { spenn: SpennOk; pal: Palett }) {
  const grupper = new Map<string, string[]>();
  for (const p of spenn.basePlagg) {
    grupper.set(p.kategori, [...(grupper.get(p.kategori) ?? []), p.plagg]);
  }
  return (
    <section aria-label="Hva skal hen ha på?">
      <h2 style={{ margin: '0 0 0.5em', fontSize: '1.15em' }}>Hva skal hen ha på?</h2>
      {[...grupper.entries()].map(([kategori, plagg]) => (
        <div key={kategori} style={{ marginBottom: '0.5em' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9em' }}>{kategori}</p>
          <ul style={{ margin: '0.15em 0 0', paddingLeft: '1.3em' }}>
            {plagg.map((navn) => (
              <li key={navn}>{navn}</li>
            ))}
          </ul>
        </div>
      ))}
      <p style={{ margin: '0.75em 0 0', fontWeight: 700 }}>
        Usikrest: {spenn.usikrestPremiss}.
      </p>
      <p style={{ margin: '0.25em 0 0', fontSize: '0.85em', color: pal.dus }}>
        Beregnet {hhmm(spenn.utstedtISO)} · gjelder til {hhmm(spenn.gyldigTilISO)}.
      </p>
      <HendelsesListe hendelser={spenn.hendelser} pal={pal} />
    </section>
  );
}

/* ---------- sikkerhetshendelser (semantikken båret i UI) ---------- */

function HendelsesListe({
  hendelser,
  pal,
  logg,
}: {
  hendelser: SpennHendelse[];
  pal: Palett;
  logg?: PrototypeProps['logg'];
}) {
  useEffect(() => {
    for (const h of hendelser) {
      logg?.('p2:hendelse-vist', { id: h.id, prioritet: h.prioritet });
    }
  }, [hendelser, logg]);

  if (hendelser.length === 0) return null;
  return (
    <div style={{ marginTop: '1em' }}>
      {hendelser.map((h) => (
        <div
          key={h.id}
          style={{
            border: h.prioritet === 'hard' ? `3px solid ${pal.ink}` : `1px solid ${pal.kant}`,
            borderRadius: '0.4em',
            padding: '0.6em 0.9em',
            marginBottom: '0.5em',
            background: pal.grunn,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>
            {h.prioritet === 'hard' ? 'Før dere går: ' : 'Underveis: '}
            {h.innhold}
          </p>
          <p style={{ margin: '0.3em 0 0', fontSize: '0.9em' }}>{h.respons}</p>
          {h.stoppkriterium && (
            <p style={{ margin: '0.3em 0 0', fontSize: '0.9em', fontWeight: 700 }}>
              {h.stoppkriterium}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
