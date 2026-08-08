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
import './paakledning.css';
import { useEffect, useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recommendation } from '../lib/wool-layers/types';
import { tempAxisFor } from '../lib/temp-axis';
import type { PlannedOutfitContext } from '../lib/planning/planned-outfit-context';
import type { OutfitBundleProducerResult } from '../lib/outfit/outfit-bundle-producer';
import { OUTFIT_TRUTH_V1_AVAILABLE } from '../lib/outfit/feature-flags';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../lib/outfit/outfit-transition-contract';
import { OutfitTruthPanel } from '../components/outfit/OutfitTruthPanel';
import {
  deepFlowCopyFor,
  localeTagFor,
  localizedGarmentDisplayName,
  type DeepFlowCopy,
} from './deep-flow-copy';

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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}



/* ──────────────────────────────────────────────────────────────────────────
   Værbasert «Hvorfor»-oppsummering
   ────────────────────────────────────────────────────────────────────────── */

function symbolToLabel(
  symbolCode: string | undefined,
  copy: DeepFlowCopy['planned'],
): string {
  if (!symbolCode) return copy.weatherFallback;
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  return copy.weather[base] ?? copy.weatherFallback;
}



/* Tittelen er bevisst statisk. Native dialog flytter fokus til første
   kontroll (Lukk), så iOS tegner ikke lenger en felt-lignende ring rundt
   barnets navn. Tastaturfokus på kontrollene er designet i stilarkene. */

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
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  const localeTag = localeTagFor(language);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      try { dialog.showModal(); } catch { /* older browsers degrade in place */ }
    }
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
  const plannedDateTime = new Intl.DateTimeFormat(localeTag, {
    timeZone: plannedContext.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(plannedContext.plannedForIso));
  const activityLabel = copy.planned.activities as Record<PlannedOutfitContext['activity'], string>;
  const vognLabel = plannedContext.vognMode === 'sleeping'
    ? copy.planned.sleeping
    : plannedContext.vognMode === 'awake'
      ? copy.planned.awake
      : null;
  const weatherLabel = symbolToLabel(plannedContext.weather.symbolCode, copy.planned);
  const isCurrentContext = contextKind === 'current';
  const accessLabel = plannedContext.access.allowed
    ? isCurrentContext ? copy.planned.availableToday : copy.planned.availablePlan
    : copy.planned.unavailablePlan;

  // Entitlement is a route boundary, not an Outfit-panel capability. It must
  // therefore win even when a caller also holds an exact process-local bundle.
  if (!plannedContext.access.allowed) {
    return (
      <dialog
        ref={dialogRef}
        className="pkl-dialog"
        aria-labelledby="planned-outfit-title"
      >
        <div className="pkl-spalte">
          <header className="pkl-topp">
            <button
              type="button"
              className="pkl-close"
              onClick={onBack}
              aria-label={copy.planned.closePlanned}
            >
              <CloseIcon />
            </button>
            <h2
              id="planned-outfit-title"
              className="pkl-title"
            >
              {copy.planned.unavailableTitle}
            </h2>
          </header>
          <p className="pkl-brodtekst-dempet">
            {copy.planned.unavailableBody}
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
      >
        <div className="pkl-spalte">
          <header className="pkl-topp">
            <button
              type="button"
              className="pkl-close"
              onClick={onBack}
              aria-label={isCurrentContext ? copy.planned.closeToday : copy.planned.closePlanned}
            >
              <CloseIcon />
            </button>
            <div>
              <p className="pkl-etikett">
                {isCurrentContext ? copy.planned.todayOutfit : copy.planned.plannedOutfit}
              </p>
              <h2
                id="planned-outfit-title"
                className="pkl-title"
              >
                {plannedContext.child.name}
              </h2>
            </div>
          </header>

          <section
            aria-label={isCurrentContext ? copy.planned.todaySituation : copy.planned.plannedSituation}
            className="pkl-plate"
          >
            <p className="pkl-naa">
              {plannedDateTime}
            </p>
            <p className="pkl-linje">
              {plannedContext.place.label} · {activityLabel[plannedContext.activity]}
              {vognLabel ? ` · ${vognLabel}` : ''}
            </p>
            <p className="pkl-detalj">
              {copy.planned.ageWeather(
                plannedContext.child.ageMonths,
                weatherLabel,
                Math.round(plannedContext.weather.tempC),
                Math.round(plannedContext.weather.feelsLikeC),
              )}
            </p>
          </section>

          <OutfitTruthPanel
            outfitBundle={outfitBundle}
            registerOutfitRow={registerOutfitRow}
            transitionVisualState={transitionVisualState}
            onOpenWarmColdGuide={onOpenWarmColdGuide}
          />

          <section
            aria-labelledby="planned-why-title"
            className="pkl-plate-myk pkl-luft"
          >
            <h3 id="planned-why-title">{copy.planned.whyTitle}</h3>
            <p className="pkl-brodtekst">
              {copy.planned.why(
                isCurrentContext ? copy.planned.outfitSubject : copy.planned.planSubject,
                weatherLabel.toLocaleLowerCase(localeTag),
                plannedContext.weather.windMs.toLocaleString(localeTag),
                plannedContext.weather.precipMmH.toLocaleString(localeTag),
              )}
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
    >
      <div className="pkl-spalte">
        <header className="pkl-topp">
          <button
            type="button"
            className="pkl-close"
            onClick={onBack}
            aria-label={isCurrentContext ? copy.planned.closeToday : copy.planned.closePlanned}
          >
            <CloseIcon />
          </button>
          <div>
            <p className="pkl-etikett">
              {isCurrentContext ? copy.planned.todayOutfit : copy.planned.plannedOutfit}
            </p>
            <h2
              id="planned-outfit-title"
              className="pkl-title"
            >
              {plannedContext.child.name}
            </h2>
          </div>
        </header>

        <section
          aria-label={isCurrentContext ? copy.planned.todaySituation : copy.planned.plannedSituation}
          className="pkl-plate"
        >
          <p className="pkl-naa">
            {plannedDateTime}
          </p>
          <p className="pkl-linje">
            {plannedContext.place.label} · {activityLabel[plannedContext.activity]}
            {vognLabel ? ` · ${vognLabel}` : ''}
          </p>
          <p className="pkl-detalj">
            {copy.planned.ageWeather(
              plannedContext.child.ageMonths,
              weatherLabel,
              Math.round(plannedContext.weather.tempC),
              Math.round(plannedContext.weather.feelsLikeC),
            )}
          </p>
        </section>

        <section
          aria-labelledby="planned-garments-title"
          className="pkl-plate"
        >
          <h3 id="planned-garments-title" className="pkl-overskrift-liste">
            {copy.planned.dressingOrder}
          </h3>
          <ol className="pkl-liste">
            {plannedContext.recommendation.orderedGarments.map((garment) => (
              <li key={garment}>{localizedGarmentDisplayName(garment, language)}</li>
            ))}
          </ol>
          {plannedContext.recommendation.equipment.length > 0 && (
            <>
              <h3 className="pkl-utstyr">{copy.planned.equipment}</h3>
              <ul className="pkl-liste">
                {plannedContext.recommendation.equipment.map((item) => (
                  <li key={item}>{localizedGarmentDisplayName(item, language)}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section
          aria-labelledby="planned-why-title"
          className="pkl-plate-myk"
        >
          <h3 id="planned-why-title">{copy.planned.whyTitle}</h3>
          <p className="pkl-brodtekst">
            {copy.planned.why(
              isCurrentContext ? copy.planned.outfitSubject : copy.planned.planSubject,
              weatherLabel.toLocaleLowerCase(localeTag),
              plannedContext.weather.windMs.toLocaleString(localeTag),
              plannedContext.weather.precipMmH.toLocaleString(localeTag),
            )}
          </p>
          <p className="sr-only">
            {accessLabel}.
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
