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

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Scenario } from '../felles/scenarier';
import { hentFakta, type BasePlagg } from '../felles/fakta';
import { DEGRADERT_NESTE_HANDLING } from '../felles/tekst';
import {
  byggSpenn,
  kandidatposisjon,
  spennSetning,
  forhaandsdefinertKandidat,
  endringsForklaring,
  BEREGNET_FRA_TEKST,
  EKSTRA_KANDIDATER,
  GJENOPPRETTING_TEKST,
  HYPOTESE_ETIKETT,
  KAN_IKKE_BEREGNES_TITTEL,
  UTLOPT_TITTEL,
  type KandidatId,
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
  /**
   * Hvilken forhåndsdefinert kandidat testselen laster (Sols P2-P0):
   * 'kald' (under gulvet), 'trygg' (anbefalingen) eller 'varm' (over
   * taket). Standard er 'trygg'. UI-et merker ALDRI noen som riktig —
   * deltakeren må lese posisjonen selv.
   */
  kandidatId?: KandidatId;
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

export function Prototype({ scenario, klokke, logg, kandidatId = 'trygg' }: PrototypeProps) {
  const fakta = useMemo(() => hentFakta(scenario), [scenario]);
  const spenn = useMemo(() => byggSpenn(fakta), [fakta]);

  const [oppgave, setOppgave] = useState<Oppgave>('holder-dette');

  useEffect(() => {
    logg?.('p2:kandidat-lastet', { kandidatId });
  }, [kandidatId, logg]);

  // Virtuell klokke: utløp skjer som OVERGANG i samme oppgave (spec §1.1).
  // Halvåpent intervall (Sols avvik e): gyldig FØR tidspunktet, ikke gjennom
  // det — derfor >=. Manglende datagrunnlag er IKKE utløp: der finnes ingen
  // gyldighet å passere, så 'mangler' vinner alltid over klokka.
  const manglerData = spenn.status === 'degradert' && spenn.aarsakstype === 'mangler';
  const utloptNaa = !manglerData && klokke.naaISO() >= spenn.gyldigTilISO;
  const maskert = spenn.status === 'degradert' || utloptNaa;

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
        deaktivert={maskert}
      />

      {maskert ? (
        <Maskert
          spenn={spenn}
          utloptNaa={utloptNaa}
          pal={pal}
          logg={logg}
        />
      ) : oppgave === 'holder-dette' ? (
        <HolderDette spenn={spenn as SpennOk} kandidatId={kandidatId} pal={pal} logg={logg} />
      ) : (
        <Forskrivning spenn={spenn as SpennOk} pal={pal} />
      )}
    </div>
  );
}

/* ---------- oppgavevelger (ikke-scorbar ramme) ---------- */

function OppgaveVelger({
  oppgave,
  onVelg,
  pal,
  deaktivert = false,
}: {
  oppgave: Oppgave;
  onVelg: (o: Oppgave) => void;
  pal: Palett;
  /** true i maskert tilstand: instrumentet kan ikke brukes → valgene stenges. */
  deaktivert?: boolean;
}) {
  const knapp = (aktiv: boolean): CSSProperties => ({
    minHeight: 48,
    padding: '0 1em',
    fontSize: '1em',
    fontFamily: 'inherit',
    fontWeight: aktiv ? 700 : 400,
    color: deaktivert ? pal.kant : pal.ink,
    background: aktiv ? pal.flate : pal.grunn,
    border: aktiv ? `3px solid ${deaktivert ? pal.kant : pal.ink}` : `1px solid ${pal.kant}`,
    borderRadius: '0.4em',
    cursor: deaktivert ? 'not-allowed' : 'pointer',
  });
  return (
    <nav aria-label="Oppgave" style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', marginBottom: '1em' }}>
      <button type="button" disabled={deaktivert} aria-pressed={oppgave === 'holder-dette'} style={knapp(oppgave === 'holder-dette')} onClick={() => onVelg('holder-dette')}>
        Holder dette?
      </button>
      <button type="button" disabled={deaktivert} aria-pressed={oppgave === 'forskrivning'} style={knapp(oppgave === 'forskrivning')} onClick={() => onVelg('forskrivning')}>
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
  // To ulike tilstander med ulik semantikk (Sols P2-P1):
  // 'mangler' → «Kan ikke beregnes», ALDRI utløpssemantikk eller gammel
  // gyldighet. 'utlopt' (eller klokka passerte gyldigheten) → «Spennet er
  // utløpt» med når det gjaldt til.
  const modus: 'mangler' | 'utlopt' =
    spenn.status === 'degradert' && spenn.aarsakstype === 'mangler'
      ? 'mangler'
      : 'utlopt';

  const tittel = modus === 'mangler' ? KAN_IKKE_BEREGNES_TITTEL : UTLOPT_TITTEL;
  const aarsak =
    modus === 'mangler'
      ? spenn.status === 'degradert'
        ? spenn.aarsak
        : ''
      : `Spennet gjaldt til ${hhmm(spenn.gyldigTilISO)}.`;

  useEffect(() => {
    logg?.('p2:maskert-vist', { modus, aarsak, utloptNaa });
  }, [modus, aarsak, utloptNaa, logg]);

  // Chips vises DEAKTIVERT: interaksjonen er stengt, ikke gjemt.
  const chips: BasePlagg[] = [
    ...(spenn.status === 'ok' ? spenn.basePlagg : []),
    ...EKSTRA_KANDIDATER,
  ];

  return (
    <section aria-label={tittel}>
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
            fontSize: '1.15em',
            background: pal.grunn,
            display: 'inline-block',
            padding: '0.2em 0.4em',
          }}
        >
          {tittel}
        </p>
        {aarsak && (
          <p style={{ margin: '0.5em 0 0', background: pal.grunn, display: 'inline-block', padding: '0.2em 0.4em' }}>
            {aarsak}
          </p>
        )}
      </div>

      {/* Deaktiverte chips: kandidaten kan ikke dømmes uten spenn. */}
      <div
        role="group"
        aria-label="Kandidat-antrekk (kan ikke brukes nå)"
        aria-disabled="true"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', margin: '0.75em 0 0' }}
      >
        {chips.map((p) => (
          <button
            key={plaggNokkel(p)}
            type="button"
            disabled
            style={{
              minHeight: 48,
              padding: '0 0.9em',
              fontSize: '0.95em',
              fontFamily: 'inherit',
              color: pal.kant,
              background: pal.grunn,
              border: `1px dashed ${pal.kant}`,
              borderRadius: '1.5em',
              cursor: 'not-allowed',
            }}
          >
            {p.plagg}
          </button>
        ))}
      </div>

      {/* Én gjenopprettingshandling + fallback-regelen. */}
      <button
        type="button"
        onClick={() => logg?.('p2:gjenoppretting-forsokt', { modus, handling: GJENOPPRETTING_TEKST[modus] })}
        style={{
          minHeight: 48,
          padding: '0 1.2em',
          margin: '0.75em 0 0',
          fontSize: '1em',
          fontFamily: 'inherit',
          fontWeight: 700,
          color: pal.grunn,
          background: pal.ink,
          border: `3px solid ${pal.ink}`,
          borderRadius: '0.4em',
          cursor: 'pointer',
        }}
      >
        {GJENOPPRETTING_TEKST[modus]}
      </button>
      <p style={{ margin: '0.75em 0 0', fontWeight: 700, fontSize: '1.1em' }}>
        Inntil da: {DEGRADERT_NESTE_HANDLING}
      </p>
      {modus === 'utlopt' && (
        <p style={{ margin: '0.5em 0 0', fontSize: '0.85em', color: pal.dus }}>
          Beregnet {hhmm(spenn.utstedtISO)} · gjaldt til {hhmm(spenn.gyldigTilISO)}.
        </p>
      )}
      <HendelsesListe hendelser={spenn.hendelser} pal={pal} logg={logg} />
    </section>
  );
}

/* ---------- «Holder dette?» — instrumentoppgaven ---------- */

function HolderDette({
  spenn,
  kandidatId,
  pal,
  logg,
}: {
  spenn: SpennOk;
  kandidatId: KandidatId;
  pal: Palett;
  logg?: PrototypeProps['logg'];
}) {
  const alleChips = useMemo(
    () => [...spenn.basePlagg, ...EKSTRA_KANDIDATER],
    [spenn.basePlagg],
  );

  // Forhåndsutfylt fra den forhåndsdefinerte kandidaten testselen valgte
  // (kald/trygg/varm — Sols P2-P0). Ingen av dem merkes som riktig i UI.
  const [valgte, setValgte] = useState<Set<string>>(
    () => new Set(forhaandsdefinertKandidat(spenn, kandidatId).map(plaggNokkel)),
  );

  // Årsakskjeden (Sols P2-P1): hva flyttet markøren sist?
  const [sisteEndring, setSisteEndring] = useState<string | null>(null);

  useEffect(() => {
    setValgte(new Set(forhaandsdefinertKandidat(spenn, kandidatId).map(plaggNokkel)));
    setSisteEndring(null);
  }, [spenn, kandidatId]);

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
      const forklaring = endringsForklaring(p, valgt);
      setSisteEndring(forklaring);
      logg?.('p2:chip-endret', { plagg: p.plagg, valgt });
      logg?.('p2:endring-vist', { forklaring });
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

      {/* Årsakskjeden: markøren er en KONSEKVENS av klesvalget. */}
      <p style={{ margin: '0 0 0.25em', fontSize: '0.85em', fontWeight: 700 }}>
        {BEREGNET_FRA_TEKST}
      </p>
      <p aria-live="polite" style={{ margin: '0 0 0.5em', fontSize: '0.9em', minHeight: '1.5em' }}>
        {sisteEndring ?? 'Markøren flytter seg når du endrer klærne over.'}
      </p>

      <SpennFigur spenn={spenn} domSetning={dom.setning} posisjon={dom.posisjon} pal={pal} />

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

      {/* Svakeste premiss løftes OVER sekundær metadata (Sols P2-P1). */}
      <p
        style={{
          margin: '0.75em 0 0',
          padding: '0.4em 0.75em',
          borderLeft: `6px solid ${pal.ink}`,
          fontWeight: 700,
          fontSize: '1em',
          background: pal.flate,
        }}
      >
        Usikrest premiss: {spenn.usikrestPremiss}
      </p>
      <p style={{ margin: '0.25em 0 0', fontSize: '0.8em', color: pal.dus }}>
        Beregnet {hhmm(spenn.utstedtISO)} · gjelder til {hhmm(spenn.gyldigTilISO)}.
      </p>

      <HendelsesListe hendelser={spenn.hendelser} pal={pal} logg={logg} />
    </section>
  );
}

/* ---------- den vertikale spennfiguren ---------- */

/**
 * RAD-BASERT figur (Sols fase 11 runde 2, P1-kollisjon): grenseetikett,
 * terskellinje og kandidatmarkør har hver sin DEDIKERTE rad i normal
 * blokkflyt — ingen absolutt posisjonering, ingen faste høyder som kan
 * tvinge innhold oppå hverandre. Markøren rendres som egen rad INNE i
 * sonen posisjonen tilhører (soner, ikke skala — ingen tall på aksen),
 * så overlapp med etikett eller terskellinje er strukturelt umulig i
 * kald- OG varmtilstand, ved standard OG storTekst. Strukturen håndheves
 * i __tests__/p2-kollisjon.test.ts (data-spor-attributtene) og måles med
 * bounding boxes i bevisskriptet.
 */
function SpennFigur({
  spenn,
  domSetning,
  posisjon,
  pal,
}: {
  spenn: SpennOk;
  domSetning: string;
  posisjon: 'under-gulv' | 'i-spennet' | 'over-tak';
  pal: Palett;
}) {
  const hardKald = spenn.hardSide === 'kald';

  const soneTekst: CSSProperties = {
    background: pal.grunn,
    padding: '0.1em 0.4em',
    fontSize: '0.85em',
    fontWeight: 700,
    display: 'inline-block',
  };

  /** Markørraden — alltid en egen rad, aldri lagt oppå tekst/linjer. */
  const markorRad = (
    <div
      data-spor="kandidatmarkor"
      style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}
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
        }}
      >
        Deres antrekk
      </span>
    </div>
  );

  /** Terskellinjen — egen rad mellom sonene. Hard grense: tykk strek. */
  const terskellinje = (hard: boolean) => (
    <div
      data-spor="terskellinje"
      aria-hidden="true"
      style={{ height: hard ? 6 : 2, background: hard ? pal.ink : pal.kant }}
    />
  );

  /** Sonene er grid-rader: etikettrad + ev. markørrad, aldri samme rad. */
  const sone = (
    stil: CSSProperties,
    etikett: ReactNode,
    medMarkor: boolean,
  ) => (
    <div
      style={{
        display: 'grid',
        gap: '0.3em',
        alignContent: 'center',
        padding: '0.5em 0.75em',
        ...stil,
      }}
    >
      <div>{etikett}</div>
      {medMarkor && markorRad}
    </div>
  );

  return (
    <figure
      role="img"
      aria-label={`${spennSetning(spenn)} ${domSetning}`}
      style={{ margin: 0 }}
    >
      <div style={{ border: `1px solid ${pal.kant}`, borderRadius: '0.4em', overflow: 'hidden' }}>
        {sone(
          {
            minHeight: 64,
            backgroundImage: hardKald ? undefined : SKRAVUR(pal.kant),
            backgroundColor: pal.flate,
          },
          <span data-spor="grenseetikett" style={soneTekst}>
            Over varmetaket — for varmt{spenn.invertert ? ' (hard grense: barnet sover)' : ''}
          </span>,
          posisjon === 'over-tak',
        )}

        {terskellinje(!hardKald)}

        {sone(
          { minHeight: 150, background: pal.grunn },
          <span style={{ ...soneTekst, fontWeight: 400 }}>Trygt spenn</span>,
          posisjon === 'i-spennet',
        )}

        {terskellinje(hardKald)}

        {sone(
          {
            minHeight: 64,
            backgroundImage: hardKald ? SKRAVUR(pal.kant) : undefined,
            backgroundColor: pal.flate,
          },
          <span data-spor="grenseetikett" style={soneTekst}>
            Under kaldgulvet — for kaldt{hardKald ? ' (hard grense)' : ''}
          </span>,
          posisjon === 'under-gulv',
        )}
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
