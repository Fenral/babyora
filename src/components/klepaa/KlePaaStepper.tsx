/**
 * KlePaaStepper — ETT plagg per steg.
 *
 * ═══ HVORFOR DENNE FILEN FINNES ═══════════════════════════════════════════
 * Eierfunn 2026-08-04: «hvert plagg kom opp med Neste eller swipe etter CTA».
 * Knappen på Hjem heter «Kle på, steg for steg» (ResultSurface.tsx:84), men
 * destinasjonen (OutfitTruthPanel → OutfitGarmentList) gir ALT på én gang —
 * en <ol> med hele antrekket. Knappen lover en sekvens; flaten leverer en
 * liste. Denne komponenten er sekvensen.
 *
 * ═══ REN VISNING, MED VILJE ═══════════════════════════════════════════════
 * Komponenten vet ingenting om appens ruting, drill-tilstand eller
 * outfit-transition. Den tar en LISTE plagg + `onClose`. Avledningen fra
 * antrekksbundelen ligger i `deriveKlePaaSteps()` under, som er en ren
 * funksjon over data som allerede finnes i skjermens props
 * (`OutfitBundleProducerResult`). Da kan visningen både testes uten app og
 * kobles inn uten at motoren røres.
 *
 * ═══ HVA SOM BEVISST IKKE FINNES HER ══════════════════════════════════════
 *
 * 1) «HOPP OVER» ER FJERNET. Eierbeslutning, og den er riktig: i en LINEÆR
 *    stepper gjør «Hopp over» nøyaktig det samme som «Neste» — den flytter
 *    deg ett steg fram. To knapper som gjør det samme, der den ene antyder
 *    at du gjør noe galt, er verre enn én knapp.
 *
 * 2) «N ANDRE PASSER I DETTE LAGET» ER UTELATT. Tallet er teknisk avledbart
 *    (`options` filtrert på kildeplaggets lag), men datagrunnlaget bærer
 *    ikke formuleringen. MÅLT i katalogen: `ITEM_ALTERNATIVES`
 *    (lib/wool-layers/alternatives.ts) har 33 oppføringer — 32 har NØYAKTIG
 *    ett alternativ, én har to, tre har null. Kryssjekket mot plagg-
 *    strengene motoren faktisk kan produsere har bare ~29 av ~85 en
 *    oppføring i det hele tatt. Og dette er FØR sikkerhets-finaliseringen
 *    (`finalizeOutfitOccurrenceSwap`) har forkastet kandidater. I praksis
 *    blir «N andre passer» derfor «1 annen passer» eller ingenting — altså
 *    en flertallsformulering uten dekning.
 *    Portdommen er utvetydig: «ingen konsekvensetiketter for motoren kan
 *    bevise dem.» Derfor: ingen tall, og INGEN erstatning à la «flere
 *    passer». Hele Bytt-raden skjules når plagget ikke har alternativer, så
 *    raden bare dukker opp der det faktisk finnes noe å bytte til.
 *
 * 3) MATERIALPOENGET GJETTES ALDRI. Se `materialPointFor()` under.
 *
 * ═══ BEVEGELSE ════════════════════════════════════════════════════════════
 * Sveipet følger fingeren 1:1 (ingen demping under dragingen), og slippet
 * SETTLER på `--dw-m-step` (260 ms) med `--dw-ease`. Ingen varighet står i
 * JS: settlingen er en CSS-transition som skrus av med `data-dragging`, slik
 * at det finnes ÉN kilde til tallet. Skallet (header, bunnrad, lyspool) står
 * helt stille — bare sporet flytter seg.
 * Redusert bevegelse: dragingen forflytter ingenting, og steget byttes
 * direkte. Doble vakter, som resten av appen: JS-siden (`reducedMotion`)
 * OG CSS-medieforespørselen.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { ROLE_LABEL_BY_CATEGORY } from '../hjem/result-rows.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { GARMENT_VARIANTS } from '../../lib/clothing-engine-v2/catalog.js';
import type { MaterialFamily } from '../../lib/clothing-engine-v2/types.js';
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { Button } from '../controls/Button.js';
import { GarmentThumbnail } from '../outfit/GarmentThumbnail.js';

import './kle-paa-stepper.css';

/* ─────────────────────────── DATAFORMEN ──────────────────────────────────── */

export type KlePaaAlternative = Readonly<{
  /** Stabil id fra `OutfitAlternativeOptionV1.optionId` — kun React-nøkkel. */
  optionId: string;
  /** RÅ motorstreng. Oppslagsnøkkel for illustrasjonen, aldri synlig tekst. */
  label: string;
  /** Brukersynlig navn (garment-display-names.ts). */
  displayLabel: string;
}>;

export type KlePaaStep = Readonly<{
  /** `OutfitItemId` — stabil PER FOREKOMST, så to like plagg ikke kolliderer. */
  itemId: string;
  /** RÅ motorstreng. Oppslagsnøkkel for illustrasjonen. */
  label: string;
  /** Brukersynlig navn. */
  displayLabel: string;
  /** «Innerst» / «Mellomlag» / «Ytterst» / «Tilbehør». */
  roleLabel: string;
  /**
   * ÉN linje, eller null. Null betyr «vi vet det ikke» og gir INGEN linje —
   * ikke en gjettet en. Se `materialPointFor()`.
   */
  materialPoint: string | null;
  /** Kun alternativer som har overlevd sikkerhetsfinaliseringen OG har bilde. */
  alternatives: readonly KlePaaAlternative[];
}>;

/* ──────────────────────── MATERIALPOENGET ────────────────────────────────── */

/**
 * ÉN LINJE PER MATERIALFAMILIE — åtte linjer totalt, ikke én per plagg.
 *
 * Det er dette som gjør poenget etterprøvbart: PÅSTANDEN («dette er ull»)
 * kommer fra et faktisk katalogfelt, mens FORMULERINGEN er vår. Skrev vi én
 * setning per plagg, ville hver setning vært en ny udokumentert påstand.
 *
 * Aldri mer enn ett poeng per steg. Dette er en påkledningssekvens, ikke en
 * artikkel — brukeren står med et barn i den ene armen.
 */
const MATERIAL_POINT: Readonly<Record<MaterialFamily, string>> = {
  wool: 'Ull holder på varmen selv når den blir fuktig.',
  synthetic_wicking: 'Teknisk fiber flytter svetten bort fra huden.',
  fleece: 'Fleece er lett og tørker fort, men slipper vind gjennom.',
  cotton: 'Bomull suger til seg fukt og tørker sakte — best når det er tørt.',
  shell: 'Skallet stopper vind og vann, men varmer ikke i seg selv.',
  synthetic_insulation: 'Syntetisk isolasjon varmer også når den er klam.',
  down: 'Dun gir mest varme per gram, men tåler dårlig å bli vått.',
  blend: 'Blandingsstoff — middels varme, tørker middels fort.',
};

/**
 * Materialet HENTES, det utledes ikke av navnet.
 *
 * KILDEN: `GARMENT_VARIANTS` (lib/clothing-engine-v2/catalog.ts) har et ekte
 * `material: MaterialFamily`-felt, og `legacyNameNb` er katalogens EGEN,
 * dokumenterte 1:1-kobling til legacy-motorens plaggstrenger. Oppslaget er
 * derfor ren lesing av et deklarert felt — ingen motorkatalog endres, og
 * ingen feature-flag skrus på (motor 2.0 er avslått; datatabellen er
 * likevel lesbar).
 *
 * FRISTELSEN VI IKKE TAR: `materialFor(id)` i garment-catalog-helpers.ts
 * svarer ALLTID — men den er REGEX-HEURISTIKK på plagg-id-en, ikke et
 * katalogfelt. Å bruke den ville vært nøyaktig den samme feilen som et
 * ubevist antall: en påstand som ser like sikker ut som en måling.
 *
 * NÅR OPPSLAGET BOMMER: null. Legacy kan produsere strenger v2-katalogen
 * ikke kjenner (~85 mot 42 varianter), og da står steget uten materiallinje.
 * Et tomt felt er ærlig; en gjettet setning er ikke det.
 */
function materialPointFor(rawEngineLabel: string): string | null {
  const needle = rawEngineLabel.trim();
  if (needle === '') return null;
  const variant = GARMENT_VARIANTS.find((v) => v.legacyNameNb === needle);
  if (variant === undefined) return null;
  return MATERIAL_POINT[variant.material] ?? null;
}

/* ──────────────────────────── AVLEDNINGEN ────────────────────────────────── */

/**
 * Bundelen inn — steg ut. Strukturell prop-type, ikke `OutfitBundleProducerResult`
 * direkte, slik at et hvilket som helst kallsted kan sende inn de to feltene
 * uten å dra hele produsent-unionen med seg.
 *
 * REKKEFØLGEN ER ALLEREDE RIKTIG: `base.garments` er sortert innerst→ytterst
 * på `order` av `createOutfitTruthSnapshot`. Ingen ny sortering her — en
 * andre sorteringsregel ville kunne drifte fra motorens.
 *
 * `equipment` ER IKKE MED, og det er ikke en forglemmelse: regntrekk og
 * vognpose er utstyr til vogna, ikke klær på barnet. De hører ikke hjemme
 * som steg i en påkledningssekvens, og snapshotet holder dem allerede i et
 * eget felt.
 */
export type KlePaaStepperSource = Readonly<{
  base: OutfitTruthSnapshotV1;
  options: readonly OutfitAlternativeOptionV1[];
}>;

/* Avledningen bor i SAMME fil som visningen med vilje: det er her beviskjeden
   står forklart, og en leser som lurer på hvor «Bytt plagg» får bildene sine
   skal ikke måtte åpne to filer for å finne svaret. Samme unntak som
   OutfitExperience.tsx og BottomTabBar.tsx allerede bærer. */
// eslint-disable-next-line react-refresh/only-export-components
export function deriveKlePaaSteps(source: KlePaaStepperSource): readonly KlePaaStep[] {
  return source.base.garments.map((garment) => ({
    itemId: garment.itemId,
    label: garment.label,
    displayLabel: displayNameForDbString(garment.label),
    roleLabel: ROLE_LABEL_BY_CATEGORY[garment.category],
    materialPoint: materialPointFor(garment.sourceLabel),
    alternatives: source.options
      /* FILTER, IKKE FIND. OutfitExperience.tsx:100 bruker `.find()` og viser
         derfor høyst ÉTT alternativ per plagg selv om arrayen kan bære
         flere. Den stille begrensningen skal ikke arves hit. */
      .filter(
        (option) =>
          option.sourceItemId === garment.itemId &&
          /* Uten katalog-id finnes det ingen miniatyr å vise. Kandidater uten
             id forkastes riktignok allerede av finalized-outfit-swap
             ('unknown-target'), så dette er et belte i tillegg til selene. */
          option.targetCatalogGarmentId !== null,
      )
      .map((option) => ({
        optionId: option.optionId,
        label: option.targetLabel,
        displayLabel: displayNameForDbString(option.targetLabel),
      })),
  }));
}

/* ─────────────────────────────── IKONER ──────────────────────────────────── */

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ─────────────────────────── BEVEGELSESVAKT ──────────────────────────────── */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const oppdater = (): void => setReduced(mq.matches);
    mq.addEventListener('change', oppdater);
    return () => mq.removeEventListener('change', oppdater);
  }, []);
  return reduced;
}

/* ───────────────────────────── GESTEN ────────────────────────────────────── */

/**
 * DE FØRSTE 24 PIKSLENE FRA VENSTRE KANT TILHØRER IKKE OSS.
 * iOS starter sin interaktive tilbake-geste der. Fanger vi et sveip som
 * begynner i den sonen, konkurrerer to systemer om den samme fingeren, og
 * brukeren får verken tilbake eller neste steg. Sonen er en fast bredde fra
 * VIEWPORTENS venstre kant, ikke en andel — gesten er fysisk, ikke relativ.
 */
const KANTSONE_PX = 24;

/** Aksen låses først når fingeren har flyttet seg nok til å mene noe. */
const AKSELAAS_PX = 8;

/** Andel av bredden som må passeres for at slippet skal bytte steg. */
const TERSKEL_ANDEL = 0.2;

/** px/ms. Et raskt kast skal bytte steg selv om avstanden er kort. */
const KAST_TERSKEL = 0.4;

/**
 * ms. Hvor gammel den siste fartsmålingen får være når fingeren løftes.
 * Dette er GESTEGJENKJENNING, ikke animasjon — bevegelseskontrakten sier selv
 * at swipe-settlingen i Kle på ligger utenfor `--dw-m-*` (tokenfilen,
 * «IKKE herfra»). Selve settlingen står i CSS på `--dw-m-step`.
 */
const KAST_VINDU_MS = 120;

/** Motstand utenfor endene: sporet følger fortsatt fingeren, men gir etter. */
const KANT_MOTSTAND = 0.35;

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  sisteX: number;
  sisteTid: number;
  fart: number;
  akse: 'ukjent' | 'x' | 'y';
};

/* ──────────────────────────── KOMPONENTEN ────────────────────────────────── */

export type KlePaaStepperProps = Readonly<{
  steps: readonly KlePaaStep[];
  /** Lukk sekvensen. Eneste ruting-avhengighet komponenten har. */
  onClose: () => void;
  /**
   * Trykk på Bytt-raden. Utelates den, RENDRES IKKE raden — en hevet rad som
   * ikke fører noe sted er et løfte flaten ikke innfrir (samme feilklasse som
   * CTA-en denne komponenten finnes for å rette).
   */
  onSwap?: (step: KlePaaStep, trigger: HTMLButtonElement) => void;
  /** Siste steg fullført. Faller tilbake til `onClose` når den ikke er satt. */
  onFinish?: () => void;
  /** Startsteg, klemt inn i listen. */
  initialIndex?: number;
}>;

export function KlePaaStepper({
  steps,
  onClose,
  onSwap,
  onFinish,
  initialIndex = 0,
}: KlePaaStepperProps) {
  const reducedMotion = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const antall = steps.length;
  const [raaIndex, setIndex] = useState<number>(() => Math.max(initialIndex, 0));
  const [dragPx, setDragPx] = useState<number>(0);
  const [drar, setDrar] = useState<boolean>(false);
  const statusId = useId();

  const sisteIndex = Math.max(antall - 1, 0);
  /* Listen kan krympe under føttene på oss (nytt vær, nytt antrekk). Klemmingen
     skjer UNDER RENDER, ikke i en effekt: en effekt som setter state ville gitt
     én frame der steget peker ut i tomrommet, og deretter en kaskaderender. */
  const index = Math.min(raaIndex, sisteIndex);
  const steg = steps[index];

  const gaaTil = useCallback(
    (neste: number) => {
      setIndex((forrige) => {
        const klemt = Math.min(Math.max(neste, 0), Math.max(antall - 1, 0));
        return klemt === forrige ? forrige : klemt;
      });
    },
    [antall],
  );

  const avsluttDrag = useCallback(() => {
    dragRef.current = null;
    setDragPx(0);
    setDrar(false);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || antall < 2) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      /* Kantsonen: se KANTSONE_PX. Vi tar ikke fingeren i det hele tatt her —
         det er billigere enn å slippe den igjen midtveis. */
      if (event.clientX - rect.left < KANTSONE_PX) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        sisteX: event.clientX,
        sisteTid: event.timeStamp,
        fart: 0,
        akse: 'ukjent',
      };
    },
    [antall],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag === null || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (drag.akse === 'ukjent') {
        if (Math.abs(dx) < AKSELAAS_PX && Math.abs(dy) < AKSELAAS_PX) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          /* Vertikalt: dette er scrolling i steget, ikke et sideskift. Slipp
             fingeren helt, ellers stjeler stepperen en rulling brukeren mente
             skulle treffe innholdet. */
          dragRef.current = null;
          return;
        }
        drag.akse = 'x';
        event.currentTarget.setPointerCapture(event.pointerId);
        if (!reducedMotion) setDrar(true);
      }

      const dt = event.timeStamp - drag.sisteTid;
      if (dt > 0) drag.fart = (event.clientX - drag.sisteX) / dt;
      drag.sisteX = event.clientX;
      drag.sisteTid = event.timeStamp;

      /* REDUSERT BEVEGELSE: gesten leses fortsatt, men INGENTING forflytter
         seg mens fingeren er nede. Slippet bytter steg direkte. */
      if (reducedMotion) return;

      const utenforStart = index === 0 && dx > 0;
      const utenforSlutt = index === sisteIndex && dx < 0;
      setDragPx(utenforStart || utenforSlutt ? dx * KANT_MOTSTAND : dx);
    },
    [index, reducedMotion, sisteIndex],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag === null || drag.pointerId !== event.pointerId) return;
      if (drag.akse === 'x') {
        const bredde = viewportRef.current?.getBoundingClientRect().width ?? 0;
        const dx = event.clientX - drag.startX;
        const passert = bredde > 0 && Math.abs(dx) > bredde * TERSKEL_ANDEL;
        /* Farten er FERSK eller den er ikke fart. Stanser fingeren og blir
           liggende før den løftes, kommer det ingen flere pointermove — og da
           ville den siste målte farten kastet steget videre lenge etter at
           brukeren hadde ombestemt seg. */
        const fersk = event.timeStamp - drag.sisteTid < KAST_VINDU_MS;
        const kastet = fersk && Math.abs(drag.fart) > KAST_TERSKEL;
        /* Ved et kast bestemmer RETNINGEN PÅ FARTEN, ikke hvor fingeren endte:
           drar du til høyre og kaster tilbake til venstre, mente du venstre. */
        const retning = kastet ? (drag.fart < 0 ? 1 : -1) : dx < 0 ? 1 : -1;
        if (passert || kastet) gaaTil(index + retning);
      }
      avsluttDrag();
    },
    [avsluttDrag, gaaTil, index],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        gaaTil(index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        gaaTil(index - 1);
      }
    },
    [gaaTil, index],
  );

  /* Sporets posisjon: ett steg = én viewport-bredde (-100 %), pluss fingerens
     råe forskyvning. Begge går inn som custom properties så SELVE tallet blir
     i CSS — varigheten på settlingen står ett sted, i `--dw-m-step`. */
  const sporStil = useMemo<CSSProperties>(
    () => ({ ['--kps-index']: String(index), ['--kps-drag']: `${dragPx}px` } as CSSProperties),
    [dragPx, index],
  );

  if (antall === 0 || steg === undefined) {
    /* Ingen plagg = ingen sekvens. En stepper med null steg skal si det, ikke
       tegne et tomt spor med «Steg 1 av 0». */
    return (
      <section className="kle-paa-stepper" aria-label="Kle på, steg for steg">
        <div className="kps-top">
          <button type="button" className="kps-close" onClick={onClose} aria-label="Lukk">
            <CloseIcon />
          </button>
        </div>
        <p className="kps-tomt">Ingen plagg å vise.</p>
      </section>
    );
  }

  const paaSisteSteg = index === sisteIndex;

  return (
    /* onKeyDown ligger på seksjonen, ikke på et eget tab-stopp: piltastene skal
       virke når fokus står hvor som helst inne i steget, uten at stepperen
       legger til en ekstra stopp i tabrekkefølgen. */
    <section className="kle-paa-stepper" aria-label="Kle på, steg for steg" onKeyDown={onKeyDown}>
      {/* ── SKALLET. Står stille gjennom hele sekvensen: bare sporet under
             flytter seg. Et skall som glir med, leser som en ny side. ── */}
      <div className="kps-top">
        <button type="button" className="kps-close" onClick={onClose} aria-label="Lukk">
          <CloseIcon />
        </button>
        <span className="kps-count">
          Steg {index + 1} av {antall}
        </span>
        {/* Prikkene er dekor for øyet; tellingen over er teksten som leses. */}
        <span className="kps-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <i key={s.itemId} className="kps-dot" data-active={i === index ? 'true' : 'false'} />
          ))}
        </span>
      </div>

      <div
        className="kps-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={avsluttDrag}
      >
        <div className="kps-track" data-dragging={drar ? 'true' : 'false'} style={sporStil}>
          {steps.map((s, i) => (
            <div
              className="kps-slide"
              key={s.itemId}
              /* Bare det aktive steget er i skjermleserens tre og i
                 tabrekkefølgen. Ellers ville Bytt-knappen til plagg 6 kunne
                 nås med tabulator mens plagg 2 er på skjermen. */
              aria-hidden={i === index ? undefined : true}
              inert={i !== index}
            >
              <div className="kps-stage">
                <span className="kps-plate">
                  <GarmentThumbnail label={s.label} className="kps-plate-img" />
                </span>

                <span className="kps-role">{s.roleLabel}</span>
                <h2 className="kps-name">{s.displayLabel}</h2>

                {/* ETT materialpoeng, ÉN linje, dempet amber-punkt som markør.
                    Ingen linje når katalogen ikke kjenner plagget — se
                    materialPointFor(). */}
                {s.materialPoint !== null && (
                  <p className="kps-material">
                    <i className="kps-material-dot" aria-hidden="true" />
                    {s.materialPoint}
                  </p>
                )}

                {/* BYTT-INNGANGEN som HEVET RAD. Miniatyrene er ekte: de
                    tegnes fra `targetCatalogGarmentId`, en GarmentId som har
                    overlevd sikkerhetsfinaliseringen.
                    INGEN ANTALLSETIKETT — se filhodets punkt 2. Raden vises
                    kun når det finnes noe å bytte til. */}
                {onSwap !== undefined && s.alternatives.length > 0 && (
                  <button
                    type="button"
                    className="kps-swap-row"
                    onClick={(event) => onSwap(s, event.currentTarget)}
                    /* Navnet bærer HANDLINGEN og plagget — ikke et antall.
                       Et tall i aria-label ville vært nøyaktig samme ubeviste
                       påstand som et tall på skjermen, bare usynlig. */
                    aria-label={`Bytt plagg: ${s.displayLabel}`}
                  >
                    <span className="kps-alt-stack" aria-hidden="true">
                      {/* Høyst tre miniatyrer: stabelen skal antyde at det
                          finnes valg, ikke fungere som en liste. */}
                      {s.alternatives.slice(0, 3).map((alt) => (
                        <span className="kps-alt-thumb" key={alt.optionId}>
                          <GarmentThumbnail label={alt.label} />
                        </span>
                      ))}
                    </span>
                    <span className="kps-swap-text">Bytt plagg</span>
                    <span className="kps-swap-chevron" aria-hidden="true">
                      <ChevronIcon />
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skjermleseren skal få vite at steget byttet — sveipet gir ingen
          fokusflytting å annonsere av seg selv. */}
      <p className="kps-sr-only" id={statusId} aria-live="polite">
        Steg {index + 1} av {antall}. {steg.displayLabel}.
      </p>

      {/* `data-kps` er navigasjonens ANKER, ikke en stilkrok. Knappeprimitivet
          tar med vilje IKKE imot `className` (låst vedtak: varianter, ikke
          ad hoc-klasser), så porten og Playwright trenger et grep som ikke
          bryter den kontrakten. Et dataattributt er også ærligere enn en
          klasse her: det finnes for å identifisere, ikke for å style. */}
      <div className="kps-bottom">
        {/* «Forrige» er navigasjon bakover — den er IKKE «Hopp over», som er
            fjernet. Tastaturbrukere trenger en synlig vei tilbake; piltastene
            alene er en skjult funksjon. */}
        <Button
          variant="ghost"
          size="cta"
          data-kps="prev"
          onClick={() => gaaTil(index - 1)}
          disabled={index === 0}
        >
          Forrige
        </Button>
        <Button
          variant="primary"
          size="cta"
          full
          data-kps="next"
          onClick={() => {
            if (paaSisteSteg) (onFinish ?? onClose)();
            else gaaTil(index + 1);
          }}
        >
          {paaSisteSteg ? 'Ferdig' : 'Neste'}
        </Button>
      </div>
    </section>
  );
}
