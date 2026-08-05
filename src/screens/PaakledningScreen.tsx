/**
 * PaakledningScreen — RING-TAKEOVER med analyse→påkledning-animasjon.
 *
 * Fase 2 prod-port (2026-07): fra hjørne/anker-komposisjon til STANDARDISERT
 * RING (ellipse, jevnt fordelt, innerst→ytterst, lue sist). Godkjent av Sivert
 * via public/design-2026/takeover-b/-c/ (ring + animasjon).
 *
 * A11y-modell (accessibility-lead, verify-modus):
 *  - Ring-plaggene er DEKORATIV scene (aria-hidden). Ingen tab-stopp der.
 *  - <ol> «Rekkefølge» er ENESTE interaktive kilde: hver rad er en <button>
 *    som åpner PlaggDetailSheet. Rekkefølge-tall + rolle + navn i tilgjengelig
 *    navn (WCAG 1.3.2/1.3.3). DOM-rekkefølge = 1→N uansett visuell ring-posisjon.
 *  - Native <dialog> showModal() → focus-trap + ESC + aria-modal. Backdrop +
 *    X lukker. Focus → Hjem-CTA via onBack.
 *  - Animasjon: én gang per sesjon (sessionStorage). Redusert bevegelse →
 *    rett til påkledd sluttilstand, ingen loader. Loader knyttet til at
 *    anbefalingen faktisk beregnes.
 *  - Lue kommer KUN på avataren når lue/solhatt-plagget «lander» (sync).
 *
 * Tap på rad → PlaggDetailSheet (pros/cons + alternativer). Focus returneres
 * til rad-trigger ved lukk.
 */
import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import type { Recommendation } from '../lib/wool-layers/types';
import {
  avatarPng,
  headwearFromGarmentLabels,
  tierFromGarmentLabels,
} from '../lib/avatar-tier';
import { tempAxisFor } from '../lib/temp-axis';
import type { PlannedOutfitContext } from '../lib/planning/planned-outfit-context';
import type { OutfitBundleProducerResult } from '../lib/outfit/outfit-bundle-producer';
import { OUTFIT_TRUTH_V1_AVAILABLE } from '../lib/outfit/feature-flags';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../lib/outfit/outfit-transition-contract';
import { OutfitTruthPanel } from '../components/outfit/OutfitTruthPanel';

/* ──────────────────────────────────────────────────────────────────────────
   Public props
   ────────────────────────────────────────────────────────────────────────── */

export type PaakledningScreenProps = {
  onBack: () => void;
  onOpenGarment?: (req: { itemName: string; categoryLabel: string }) => void;
  recommendation?: Recommendation | null;
  location?: string;
  temp?: number | null;
  condition?: string;
  vogn?: 'utelek' | 'vogn';
  vognMode?: 'awake' | 'sleeping';
  currentContext?: PlannedOutfitContext;
  plannedContext?: PlannedOutfitContext;
  outfitBundle?: OutfitBundleProducerResult;
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState?: OutfitTransitionVisualState;
  onOpenWarmColdGuide?: () => void;
};

/* ──────────────────────────────────────────────────────────────────────────
   Gruppe-modell
   ────────────────────────────────────────────────────────────────────────── */






// T1A: titleCase fjernet — brukersynlige plaggnavn kommer nå fra
// displayNameForDbString (garment-display-names.ts), aldri rå db-streng.



/* ──────────────────────────────────────────────────────────────────────────
   Ordered node-modell (DOM = påkledningsrekkefølge)
   ────────────────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────────────────
   Ikoner
   ────────────────────────────────────────────────────────────────────────── */

function CloseIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ink-800)" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}



/* ──────────────────────────────────────────────────────────────────────────
   Værbasert «Hvorfor»-oppsummering
   ────────────────────────────────────────────────────────────────────────── */

function symbolToLabel(symbolCode: string | undefined): string {
  if (!symbolCode) return 'været i dag';
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  switch (base) {
    case 'clearsky': return 'klarvær';
    case 'fair': return 'lettskyet';
    case 'partlycloudy': return 'delvis skyet';
    case 'cloudy': return 'skyet';
    case 'fog': return 'tåke';
    case 'lightrain':
    case 'lightrainshowers': return 'lett regn';
    case 'rain':
    case 'rainshowers': return 'regn';
    case 'heavyrain':
    case 'heavyrainshowers': return 'kraftig regn';
    case 'lightsnow':
    case 'lightsnowshowers': return 'lett snø';
    case 'snow':
    case 'snowshowers': return 'snø';
    case 'heavysnow':
    case 'heavysnowshowers': return 'kraftig snø';
    case 'sleet':
    case 'sleetshowers': return 'sludd';
    default: return 'været i dag';
  }
}



/* ──────────────────────────────────────────────────────────────────────────
   FOKUSRINGEN — en DESIGNET tilstand, ikke en slettet tilstand
   ──────────────────────────────────────────────────────────────────────────

   Historikk: WebKit tegnet sin blå standardring når `titleRef.current?.focus()`
   flyttet fokus til overskriften (eier-funn TestFlight 2026-08-01). «Fiksen»
   var `outline: 'none'` inline på de tre overskriftene. Det fjernet symptomet
   OG tilstanden i samme slag: en inline outline gjelder alle fokusmodus og kan
   ikke overstyres av et stilark, så tastatur- og VoiceOver-brukere mistet den
   eneste indikatoren på hvor de var. Web Interface Guidelines: «Never
   outline-none without focus replacement.»

   Erstatningen står her, og skillet gjøres av :focus-visible — aldri :focus:
     · trykk/museklikk (og programmatisk focus() rett etter et trykk) matcher
       IKKE → overskriften får ingen ring, som var poenget med det opprinnelige
       funnet;
     · tastatur og VoiceOver matcher → ringen tegnes.

   Ringens form følger b1-proofen (`b1-slice.template.html:494-496`): amber,
   2 px strek, luft rundt via outline-offset slik at ringen leser som et EGET
   LAG over flaten — ikke som en ny kant på komponenten.

   Fargen er --dw-accent, altså nøyaktig CTA-ens aksentfarge (design-tokens.css
   aliaserer `--accent-cta: var(--dw-accent)`). Den er tema-vekslende og bærer
   derfor lys modus også: --dw-focus (#E8B98C) er kalibrert for espresso og
   ligger på ~1,7:1 mot krem-lerretet — en ring ingen ser. --dw-accent gir
   5,1-7,0:1 mot både lerret og dialogflate i BEGGE temaer. Håndhevet i
   __tests__/PaakledningScreen.focus-ring.test.tsx.

   Selektorene er bevisst smale (.pkl-title / .pkl-close). En generell
   `.pkl-dialog :focus-visible` ville hatt samme spesifisitet som
   `.outfit-row:focus-visible` (Antrekkskart.css:12) og — fordi denne <style>-en
   ligger i <body>, etter <head> — stille overtatt fokusringen til
   OutfitTruthPanel, som er en annen agents flate.
   ────────────────────────────────────────────────────────────────────────── */
const PKL_FOCUS_RING_CSS = `
/* Programmatisk fokus tegner ingenting. Dette er den ENESTE lovlige
   outline-slettingen i denne filen: erstatningen står rett under, i samme
   regelsett, og slettingen gjelder kun tilstanden «fokusert uten at brukeren
   navigerer med tastatur». */
.pkl-title:focus:not(:focus-visible) { outline: none; }

/* ERSTATNINGEN. */
.pkl-title:focus-visible,
.pkl-close:focus-visible {
  outline: 2px solid var(--dw-accent, var(--accent-cta));
  outline-offset: 3px;
}

/* Overskriften har ingen egen form; uten radius leser ringen som en boks rundt
   teksten. Radiusen bor her og ikke i regelen over — der ville den endret
   formen på hver flate som fikk fokus. */
.pkl-title:focus-visible { border-radius: 5px; }

/* Den runde lukkeknappen: outline arver formen, men en sirkel ligger visuelt
   nærmere ringen enn et rektangel gjør og trenger et hakk mer luft. */
.pkl-close:focus-visible { outline-offset: 4px; }
`;

function PklFocusRing(): ReactElement {
  return <style>{PKL_FOCUS_RING_CSS}</style>;
}

/* ──────────────────────────────────────────────────────────────────────────
   FLATENE — to svar på D2, ikke ett
   ──────────────────────────────────────────────────────────────────────────

   Åtte inline-objekter i denne filen bar hevet fyll uten lyslogikk. De er
   ikke samme sak, og de får derfor ikke samme retting:

   1) SEKSJONSPLATENE (fem stykker) ER gruppeflater. Hver samler et eget
      innholdshierarki — situasjon, rekkefølge, hvorfor — på et lerret. At de
      er hevet er riktig; det som manglet var lyset. De får husets kompatible
      form: inset topplys + dybde i SAMME box-shadow. Fyllet står urørt
      (--surface-pure/--surface-soft), så fargen på skjermen endres ikke.

   2) LUKKEKNAPPEN (tre steder) er en KONTROLL, ikke et materiale. Den bar
      pure-fyll og en hairline-kant, altså et lite hevet fat uten lys. Å pynte
      det med --dw-depth-raised ville lagt en 56 px bred skygge under en 44 px
      sirkel — dybden ville sagt «her ligger et lag» der det bare ligger en
      knapp. Riktig retting er å FJERNE det hevede fyllet. Husets egen
      lukkeknapp gjør nettopp dette (.kps-close i kle-paa-stepper.css:69:
      transparent, ingen kant, 44×44). Trykkmålet og den designede
      fokusringen (PKL_FOCUS_RING_CSS) står uendret; radius 999 blir igjen
      slik at ringen fortsatt leser som en sirkel.
   ────────────────────────────────────────────────────────────────────────── */

/* Tallene som sto her (18 / 20 / 44 / 999) var råverdier som TILFELDIGVIS
   traff skalaen. De går nå gjennom tokenet som eier verdien, med samme px:
   --dw-space-18 = 18, --dw-r-panel = 20, --dw-size-touch = 44, --dw-r-pill
   = 999. Ingen piksel flytter seg; verdien slutter bare å være en kopi. */
const PKL_PLATE: CSSProperties = {
  padding: 'var(--dw-space-18)',
  borderRadius: 'var(--dw-r-panel)',
  background: 'var(--surface-pure)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};

const PKL_PLATE_SOFT: CSSProperties = {
  padding: 'var(--dw-space-18)',
  borderRadius: 'var(--dw-r-panel)',
  background: 'var(--surface-soft)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};

const PKL_CLOSE: CSSProperties = {
  width: 'var(--dw-size-touch)',
  height: 'var(--dw-size-touch)',
  borderRadius: 'var(--dw-r-pill)',
  border: 0,
  background: 'transparent',
  color: 'var(--ink-900)',
};

/* ──────────────────────────────────────────────────────────────────────────
   Komponent
   ────────────────────────────────────────────────────────────────────────── */

function PlannedPaakledningScreen({
  onBack,
  plannedContext,
  contextKind,
  outfitBundle,
  registerOutfitRow,
  transitionVisualState = 'settled',
  onOpenWarmColdGuide,
}: Pick<PaakledningScreenProps,
  | 'onBack'
  | 'outfitBundle'
  | 'registerOutfitRow'
  | 'transitionVisualState'
  | 'onOpenWarmColdGuide'
> & {
  plannedContext: PlannedOutfitContext;
  contextKind: 'current' | 'planned';
}): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      try { dialog.showModal(); } catch { /* older browsers degrade in place */ }
    }
    titleRef.current?.focus();
    return () => {
      if (dialog.open) {
        try { dialog.close(); } catch { /* already closed */ }
      }
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onBack();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onBack]);

  // Keep these frozen-context derivations ahead of every production gate. The
  // enabled shell deliberately presents the same route-owned context as the
  // compatibility shell; it never derives weather, access, or garments from
  // the panel bundle.
  const plannedDateTime = new Intl.DateTimeFormat('nb-NO', {
    timeZone: plannedContext.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(plannedContext.plannedForIso));
  const activityLabel: Record<PlannedOutfitContext['activity'], string> = {
    vogn: 'Vogn',
    baeresele: 'Bæresele',
    utelek: 'Utelek',
    soevn: 'Søvn',
  };
  const vognLabel = plannedContext.vognMode === 'sleeping'
    ? 'sovende'
    : plannedContext.vognMode === 'awake'
      ? 'våken'
      : null;
  const weatherLabel = symbolToLabel(plannedContext.weather.symbolCode);
  const isCurrentContext = contextKind === 'current';
  const accessLabel = plannedContext.access.allowed
    ? isCurrentContext ? 'Dagens antrekk er tilgjengelig' : 'Planen er tilgjengelig'
    : `Planen er ikke tilgjengelig (${plannedContext.access.reason})`;
  const illustrativeAvatarAsset = avatarPng(
    tierFromGarmentLabels(plannedContext.recommendation.orderedGarments, plannedContext.activity),
    headwearFromGarmentLabels(plannedContext.recommendation.orderedGarments),
  );

  // Entitlement is a route boundary, not an Outfit-panel capability. It must
  // therefore win even when a caller also holds an exact process-local bundle.
  if (!plannedContext.access.allowed) {
    return (
      <dialog
        ref={dialogRef}
        className="pkl-dialog"
        aria-labelledby="planned-outfit-title"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          maxWidth: 'none',
          height: '100%',
          maxHeight: 'none',
          margin: 0,
          padding: 0,
          border: 0,
          background: 'var(--bg-canvas)',
          color: 'var(--ink-900)',
        }}
      >
        <PklFocusRing />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              className="pkl-close"
              onClick={onBack}
              aria-label="Lukk planlagt antrekk"
              style={PKL_CLOSE}
            >
              <CloseIcon />
            </button>
            <h2
              id="planned-outfit-title"
              className="pkl-title"
              ref={titleRef}
              tabIndex={-1}
              // Ingen outline her. Fokustilstanden er designet i
              // PKL_FOCUS_RING_CSS: programmatisk fokus etter et trykk tegner
              // ingenting, tastatur/VoiceOver får amber ring med luft.
              style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400 }}
            >
              Planlagt antrekk er ikke tilgjengelig
            </h2>
          </header>
          <p style={{ lineHeight: 1.55, color: 'var(--ink-700)' }}>
            Tilgangen til fremtidige antrekk er ikke aktiv. Lukk og gå tilbake til Planlegg.
          </p>
        </div>
      </dialog>
    );
  }

  if (OUTFIT_TRUTH_V1_AVAILABLE && outfitBundle !== undefined) {
    return (
      <dialog
        ref={dialogRef}
        className="pkl-dialog ba-temp-root"
        data-temp={tempAxisFor(
          plannedContext.weather.feelsLikeC,
          plannedContext.weather.tempC,
        )}
        data-outfit-access-capability={plannedContext.access.capability}
        aria-labelledby="planned-outfit-title"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          maxWidth: 'none',
          height: '100%',
          maxHeight: 'none',
          margin: 0,
          padding: 0,
          border: 0,
          background: 'var(--bg-canvas)',
          color: 'var(--ink-900)',
          overflow: 'auto',
        }}
      >
        <PklFocusRing />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              className="pkl-close"
              onClick={onBack}
              aria-label={isCurrentContext ? 'Lukk dagens antrekk' : 'Lukk planlagt antrekk'}
              style={PKL_CLOSE}
            >
              <CloseIcon />
            </button>
            <div>
              <p style={{ margin: '0 0 3px', color: 'var(--ink-500)', fontSize: 13 }}>
                {isCurrentContext ? 'Dagens antrekk' : 'Planlagt antrekk'}
              </p>
              <h2
                id="planned-outfit-title"
                className="pkl-title"
                ref={titleRef}
                tabIndex={-1}
                // Ingen outline her — se PKL_FOCUS_RING_CSS for den designede
                // fokustilstanden (:focus-visible, aldri :focus).
                style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400 }}
              >
                {plannedContext.child.name}
              </h2>
            </div>
          </header>

          <section
            aria-label={isCurrentContext ? 'Dagens situasjon' : 'Planlagt situasjon'}
            style={{ ...PKL_PLATE, marginBottom: 'var(--dw-space-16)' }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 700, textTransform: 'capitalize' }}>
              {plannedDateTime}
            </p>
            <p style={{ margin: '0 0 5px' }}>
              {plannedContext.place.label} · {activityLabel[plannedContext.activity]}
              {vognLabel ? ` · ${vognLabel}` : ''}
            </p>
            <p style={{ margin: 0, color: 'var(--ink-700)' }}>
              {plannedContext.child.ageMonths} mnd · {weatherLabel} ·{' '}
              {Math.round(plannedContext.weather.tempC)}° (føles som{' '}
              {Math.round(plannedContext.weather.feelsLikeC)}°)
            </p>
          </section>

          <OutfitTruthPanel
            outfitBundle={outfitBundle}
            registerOutfitRow={registerOutfitRow}
            transitionVisualState={transitionVisualState}
            onOpenWarmColdGuide={onOpenWarmColdGuide}
            illustrativeAvatarAsset={illustrativeAvatarAsset}
          />

          <section
            aria-labelledby="planned-why-title"
            style={{ ...PKL_PLATE_SOFT, marginTop: 'var(--dw-space-16)' }}
          >
            <h3 id="planned-why-title" style={{ margin: '0 0 8px' }}>Hvorfor dette antrekket?</h3>
            <p style={{ margin: 0, lineHeight: 1.55 }}>
              {isCurrentContext ? 'Antrekket' : 'Planen'} er laget for {weatherLabel.toLocaleLowerCase('nb-NO')}, vind på{' '}
              {plannedContext.weather.windMs.toLocaleString('nb-NO')} m/s og nedbør på{' '}
              {plannedContext.weather.precipMmH.toLocaleString('nb-NO')} mm/t.
            </p>
          </section>
        </div>
      </dialog>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="pkl-dialog ba-temp-root"
      data-temp={tempAxisFor(
        plannedContext.weather.feelsLikeC,
        plannedContext.weather.tempC,
      )}
      aria-labelledby="planned-outfit-title"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        maxWidth: 'none',
        height: '100%',
        maxHeight: 'none',
        margin: 0,
        padding: 0,
        border: 0,
        background: 'var(--bg-canvas)',
        color: 'var(--ink-900)',
        overflow: 'auto',
      }}
    >
      <PklFocusRing />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            className="pkl-close"
            onClick={onBack}
            aria-label={isCurrentContext ? 'Lukk dagens antrekk' : 'Lukk planlagt antrekk'}
            style={PKL_CLOSE}
          >
            <CloseIcon />
          </button>
          <div>
            <p style={{ margin: '0 0 3px', color: 'var(--ink-500)', fontSize: 13 }}>
              {isCurrentContext ? 'Dagens antrekk' : 'Planlagt antrekk'}
            </p>
            <h2
              id="planned-outfit-title"
              className="pkl-title"
              ref={titleRef}
              tabIndex={-1}
              // Ingen outline her — se PKL_FOCUS_RING_CSS for den designede
              // fokustilstanden (:focus-visible, aldri :focus).
              style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400 }}
            >
              {plannedContext.child.name}
            </h2>
          </div>
        </header>

        <section
          aria-label={isCurrentContext ? 'Dagens situasjon' : 'Planlagt situasjon'}
          style={{ ...PKL_PLATE, marginBottom: 'var(--dw-space-16)' }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 700, textTransform: 'capitalize' }}>
            {plannedDateTime}
          </p>
          <p style={{ margin: '0 0 5px' }}>
            {plannedContext.place.label} · {activityLabel[plannedContext.activity]}
            {vognLabel ? ` · ${vognLabel}` : ''}
          </p>
          <p style={{ margin: 0, color: 'var(--ink-700)' }}>
            {plannedContext.child.ageMonths} mnd · {weatherLabel} ·{' '}
            {Math.round(plannedContext.weather.tempC)}° (føles som{' '}
            {Math.round(plannedContext.weather.feelsLikeC)}°)
          </p>
        </section>

        <section
          aria-labelledby="planned-garments-title"
          style={{ ...PKL_PLATE, marginBottom: 'var(--dw-space-16)' }}
        >
          <h3 id="planned-garments-title" style={{ margin: '0 0 12px' }}>
            Påkledningsrekkefølge
          </h3>
          <ol style={{ margin: 0, paddingLeft: 24 }}>
            {plannedContext.recommendation.orderedGarments.map((garment) => (
              <li key={garment} style={{ padding: '5px 0' }}>{garment}</li>
            ))}
          </ol>
          {plannedContext.recommendation.equipment.length > 0 && (
            <>
              <h3 style={{ margin: '18px 0 8px' }}>Utstyr</h3>
              <ul style={{ margin: 0, paddingLeft: 24 }}>
                {plannedContext.recommendation.equipment.map((item) => (
                  <li key={item} style={{ padding: '5px 0' }}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section
          aria-labelledby="planned-why-title"
          style={PKL_PLATE_SOFT}
        >
          <h3 id="planned-why-title" style={{ margin: '0 0 8px' }}>Hvorfor dette antrekket?</h3>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            {isCurrentContext ? 'Antrekket' : 'Planen'} er laget for {weatherLabel.toLocaleLowerCase('nb-NO')}, vind på{' '}
            {plannedContext.weather.windMs.toLocaleString('nb-NO')} m/s og nedbør på{' '}
            {plannedContext.weather.precipMmH.toLocaleString('nb-NO')} mm/t.
          </p>
          <p className="sr-only">
            {accessLabel}. Tilgang: {plannedContext.access.capability}.
          </p>
        </section>
      </div>
    </dialog>
  );
}

/* SLETTET 2026-08-05 (DoD fase 4): CurrentPaakledningScreen, 495 linjer.
 *
 * Den var UNAADD siden P6 og dokumentert som det i
 * __tests__/PaakledningScreen.dead-code.test.ts: wrapperen under valgte
 * PlannedPaakledningScreen saa lenge EN av de to kontekstene fantes, og
 * begge kallsteder i App.tsx sender alltid en. Fallbacken var en gren
 * ingen bruker kunne naa.
 *
 * Fase 4 gjorde det trygt aa fjerne: CTA-en gaar til KlePaaOverlay, og den
 * gamle flaten staar igjen som EN reserve i stedet for to. Dod kode som
 * ser levende ut er dyrere enn den ser ut - den ble lest, vedlikeholdt og
 * malt av portene i to faser uten aa kunne rendres en eneste gang.
 */

export function PaakledningScreen(props: PaakledningScreenProps): ReactElement | null {
  const exactContext = props.currentContext ?? props.plannedContext;
  if (exactContext) {
    return (
      <PlannedPaakledningScreen
        onBack={props.onBack}
        plannedContext={exactContext}
        contextKind={props.currentContext ? 'current' : 'planned'}
        outfitBundle={props.outfitBundle}
        registerOutfitRow={props.registerOutfitRow}
        transitionVisualState={props.transitionVisualState}
        onOpenWarmColdGuide={props.onOpenWarmColdGuide}
      />
    );
  }
  /* INGEN FALLBACK LENGER. Her sto <CurrentPaakledningScreen /> — en gren
     ingen kunne nå. null er det ærlige svaret på å vise et antrekk uten å si
     hvilket: det finnes ingen skjerm å tegne, og en skjerm som later som den
     har data er verre enn ingen skjerm. */
  return null;
}

export default PaakledningScreen;
