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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { recommend } from '../lib/wool-layers/recommend';
import type { Layer, LayerCategory, Recommendation } from '../lib/wool-layers/types';
import {
  GENERIC_GARMENT_SVG,
  garmentIdFor,
  garmentPng,
  garmentClayPng,
  type GarmentId,
} from '../data/garment-illustrations';
import { displayNameForDbString } from '../data/garment-display-names';
import { getAlternatives } from '../lib/wool-layers/alternatives';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { feelsLikeC } from '../lib/met-no/feels-like';
import {
  avatarPng,
  headwearFromGarmentLabels,
  headwearFromRecommendation,
  tierFromGarmentLabels,
  tierFromRecommendation,
} from '../lib/avatar-tier';
import { stageSrc } from '../lib/avatar-stage';
import { tempAxisFor } from '../lib/temp-axis';
import type { PlannedOutfitContext } from '../lib/planning/planned-outfit-context';
import type { OutfitBundleProducerResult } from '../lib/outfit/outfit-bundle-producer';
import { OUTFIT_TRUTH_V1_AVAILABLE } from '../lib/outfit/feature-flags';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../lib/outfit/outfit-transition-contract';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import { OutfitTruthPanel } from '../components/outfit/OutfitTruthPanel';
import { motion } from 'motion/react';

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

const FALLBACK_LAT = 60.8867;
const FALLBACK_LON = 11.5614;

type GroupKey = 'innerst' | 'mellom' | 'ytterst' | 'tilbehor' | 'sovn';

type GroupSpec = {
  key: GroupKey;
  label: string;
  colorVar: string;
  edgeVar: string;
};

const GROUPS: Record<GroupKey, GroupSpec> = {
  innerst: { key: 'innerst', label: 'Innerst', colorVar: '--layer-innerst', edgeVar: '--chip-edge-korall' },
  mellom: { key: 'mellom', label: 'Mellomlag', colorVar: '--layer-mellom', edgeVar: '--chip-edge-marigold' },
  ytterst: { key: 'ytterst', label: 'Ytterst', colorVar: '--layer-ytterst', edgeVar: '--chip-edge-dyppetrol' },
  tilbehor: { key: 'tilbehor', label: 'Tilbehør', colorVar: '--lag-petrolgra', edgeVar: '--chip-edge-petrolgra' },
  sovn: { key: 'sovn', label: 'Sovn', colorVar: '--lag-petrolgra', edgeVar: '--chip-edge-petrolgra' },
};

function categoryToGroup(c: LayerCategory): GroupKey {
  if (c === 'innerst') return 'innerst';
  if (c === 'mellomlag') return 'mellom';
  if (c === 'yttertoy') return 'ytterst';
  return 'tilbehor';
}

// T1A: titleCase fjernet — brukersynlige plaggnavn kommer nå fra
// displayNameForDbString (garment-display-names.ts), aldri rå db-streng.

const HEAD_RE = /(\blue\b|hatt|balaklava|solhatt|caps)/i;
const SLEEP_RE = /sovepose/i;

/** Ordinal-navn for rekkefølge (a11y accessible name). */
function ordinalWord(order: number, total: number): string {
  if (order === 1) return `Lag 1 av ${total}, innerst`;
  if (order === total) return `Lag ${order} av ${total}, ytterst`;
  return `Lag ${order} av ${total}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Ordered node-modell (DOM = påkledningsrekkefølge)
   ────────────────────────────────────────────────────────────────────────── */

type Node = {
  key: string;
  order: number; // 1-basert
  item: string;
  name: string;
  group: GroupSpec;
  gid: GarmentId | null;
  img: string;
  hasAlt: boolean;
  altCount: number;
  isHat: boolean;
  isBody: boolean; // kropps-lag (ikke tilbehør/sovn) → driver avatar-stage
};

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

function ChevronRight(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ChevronToggle({ open }: { open: boolean }): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 260ms var(--ease-out, cubic-bezier(0.22,1,0.36,1))' }}>
      <path d="M5 7.5 10 13 15 7.5" />
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

function whyText(
  rec: Recommendation | null,
  tempC: number | null | undefined,
  feelsC: number | null | undefined,
  symbolCode: string | undefined,
  itemNames: string[],
): string {
  if (!rec || tempC === null || tempC === undefined) {
    return 'Antrekket er satt sammen etter dagens værmelding og barnets alder.';
  }
  const condLabel = symbolToLabel(symbolCode);
  const t = Math.round(tempC);
  const f = feelsC !== null && feelsC !== undefined ? Math.round(feelsC) : t;
  // T1A: navnene er nå kanoniske visningsnavn («Ullsett, tynt») — de kan
  // inneholde komma, så listen skilles med « · » og navnene beholder sin
  // formatering (lowercase av «Ullsett, tynt» ville gitt tvetydig prosa).
  const list = itemNames.join(' · ');
  const cold = f < 5;
  const warm = f > 18;
  let tail: string;
  if (cold) {
    tail = 'Kulden krever ull innerst for å regulere fukt, samt vindtette ytterlag og dekket hode/hender/føtter — de taper varme raskest.';
  } else if (warm) {
    tail = 'Varmen krever lette, luftige lag som ikke overopphetes — unngå vindtett ytterlag i dag.';
  } else {
    tail = 'Et mellomlag oppå ull innerst holder varmen jevn uten at barnet blir svett i aktivitet.';
  }
  return `${t}° og ${condLabel} (føles som ${f}°) ligger til grunn for dette antrekket: ${list}. ${tail}`;
}

const DRESSING_SESSION_KEY = 'babyora.takeover.played';

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
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={onBack}
              aria-label="Lukk planlagt antrekk"
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: '1px solid var(--ink-100)',
                background: 'var(--surface-pure)',
                color: 'var(--ink-900)',
              }}
            >
              <CloseIcon />
            </button>
            <h2
              id="planned-outfit-title"
              ref={titleRef}
              tabIndex={-1}
              // Programmatisk fokus (titleRef.focus() for skjermleser-kontekst)
              // skal aldri tegne WebKits blå standard-ring for berørings-
              // brukere (eier-funn TestFlight 2026-08-01). tabIndex=-1 kan
              // ikke nås med Tab, så ingen synlig fokus går tapt.
              style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, outline: 'none' }}
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
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={onBack}
              aria-label={isCurrentContext ? 'Lukk dagens antrekk' : 'Lukk planlagt antrekk'}
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: '1px solid var(--ink-100)',
                background: 'var(--surface-pure)',
                color: 'var(--ink-900)',
              }}
            >
              <CloseIcon />
            </button>
            <div>
              <p style={{ margin: '0 0 3px', color: 'var(--ink-500)', fontSize: 13 }}>
                {isCurrentContext ? 'Dagens antrekk' : 'Planlagt antrekk'}
              </p>
              <h2
                id="planned-outfit-title"
                ref={titleRef}
                tabIndex={-1}
                // Programmatisk fokus skal aldri tegne WebKits blå standard-
                // ring (eier-funn TestFlight 2026-08-01); tabIndex=-1 nås
                // ikke med Tab, så ingen synlig fokus går tapt.
                style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, outline: 'none' }}
              >
                {plannedContext.child.name}
              </h2>
            </div>
          </header>

          <section
            aria-label={isCurrentContext ? 'Dagens situasjon' : 'Planlagt situasjon'}
            style={{ padding: 18, borderRadius: 20, background: 'var(--surface-pure)', marginBottom: 16 }}
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
            style={{ padding: 18, borderRadius: 20, background: 'var(--surface-soft)', marginTop: 16 }}
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'max(18px, env(safe-area-inset-top)) 18px 32px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label={isCurrentContext ? 'Lukk dagens antrekk' : 'Lukk planlagt antrekk'}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: '1px solid var(--ink-100)',
              background: 'var(--surface-pure)',
              color: 'var(--ink-900)',
            }}
          >
            <CloseIcon />
          </button>
          <div>
            <p style={{ margin: '0 0 3px', color: 'var(--ink-500)', fontSize: 13 }}>
              {isCurrentContext ? 'Dagens antrekk' : 'Planlagt antrekk'}
            </p>
            <h2
              id="planned-outfit-title"
              ref={titleRef}
              tabIndex={-1}
              // Programmatisk fokus (titleRef.focus() for skjermleser-kontekst)
              // skal aldri tegne WebKits blå standard-ring for berørings-
              // brukere (eier-funn TestFlight 2026-08-01). tabIndex=-1 kan
              // ikke nås med Tab, så ingen synlig fokus går tapt.
              style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, outline: 'none' }}
            >
              {plannedContext.child.name}
            </h2>
          </div>
        </header>

        <section
          aria-label={isCurrentContext ? 'Dagens situasjon' : 'Planlagt situasjon'}
          style={{ padding: 18, borderRadius: 20, background: 'var(--surface-pure)', marginBottom: 16 }}
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
          style={{ padding: 18, borderRadius: 20, background: 'var(--surface-pure)', marginBottom: 16 }}
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
          style={{ padding: 18, borderRadius: 20, background: 'var(--surface-soft)' }}
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

function CurrentPaakledningScreen({
  onBack,
  onOpenGarment,
  recommendation: recommendationProp,
  vogn: vognProp,
  vognMode = 'awake',
}: PaakledningScreenProps): ReactElement {
  const { active, needsOnboarding } = useChildren();
  const { reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) {
      try { el.showModal(); } catch { /* eldre browsere: degrade */ }
    }
    return () => {
      if (el.open) { try { el.close(); } catch { /* noop */ } }
    };
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => { e.preventDefault(); void fire('light'); onBack(); };
    el.addEventListener('cancel', onCancel);
    return () => { el.removeEventListener('cancel', onCancel); };
  }, [fire, onBack]);

  const [activity] = useState<'utelek' | 'vogn'>(vognProp ?? 'utelek');

  const lat = !needsOnboarding && Number.isFinite(active.lat) && active.lat !== 0 ? active.lat : FALLBACK_LAT;
  const lon = !needsOnboarding && Number.isFinite(active.lon) && active.lon !== 0 ? active.lon : FALLBACK_LON;
  const weather = useWeather(lat, lon);
  const ageMonths = !needsOnboarding ? dobToAgeMonths(active.dob) : 6;

  const recommendationLocal: Recommendation | null = useMemo(() => {
    if (!weather.now) return null;
    const { tempC, windMs, precipMmH, symbolCode } = weather.now;
    const feels = feelsLikeC(tempC, windMs);
    try {
      return recommend({ weather: { tempC, feelsLikeC: feels, windMs, precipMmH, symbolCode }, child: { ageMonths }, activity });
    } catch { return null; }
  }, [weather.now, ageMonths, activity]);

  const recommendation = recommendationProp ?? recommendationLocal;
  const tempC = weather.now?.tempC ?? null;
  const feelsC = weather.now ? feelsLikeC(weather.now.tempC, weather.now.windMs) : null;
  const symbolCode = weather.now?.symbolCode;

  /* ── Ordnet påkledningsrekkefølge (innerst→ytterst→tilbehør→sovn) ── */
  const orderedItems = useMemo(() => {
    const out: { item: string; group: GroupSpec }[] = [];
    const layers: Layer[] = recommendation?.layers ?? [];
    const sovnActive = vognMode === 'sleeping';
    for (const layer of layers) {
      const gKey = categoryToGroup(layer.category);
      for (const item of layer.items) {
        const isSleepItem = SLEEP_RE.test(item);
        if (isSleepItem && !sovnActive) continue;
        const group = isSleepItem ? GROUPS.sovn : GROUPS[gKey];
        out.push({ item, group });
      }
    }
    return out;
  }, [recommendation, vognMode]);

  const nodes = useMemo<Node[]>(() => {
    return orderedItems.map((entry, idx) => {
      const gid = garmentIdFor(entry.item);
      const img = gid ? garmentClayPng(gid) : GENERIC_GARMENT_SVG;
      const altInfo = getAlternatives(entry.item);
      const altCount = altInfo?.alternatives.length ?? 0;
      const isHat = HEAD_RE.test(entry.item);
      const isBody = entry.group.key !== 'tilbehor' && entry.group.key !== 'sovn';
      return {
        key: `n-${idx}-${entry.item}`,
        order: idx + 1,
        item: entry.item,
        // T1A: brukersynlig navn fra visningsnavn-kilden (ikke rå db-streng
        // med stor forbokstav — «Tykt ullsett» → «Ullsett, tykt»).
        name: displayNameForDbString(entry.item),
        group: entry.group,
        gid,
        img,
        hasAlt: altCount > 0,
        altCount,
        isHat,
        isBody,
      };
    });
  }, [orderedItems]);

  const N = nodes.length;
  const isEmpty = N === 0;

  /* ── Avatar: NAKEN (stage-0) → kler seg lag-for-lag i takt med at klærne
     kommer i ringen. Kontinuerlig fra Hjem (som også er naken). ── */
  const wearableCount = nodes.filter((n) => n.isBody).length;
  const finalStageIdx = recommendation ? Math.max(1, Math.min(4, wearableCount)) : 4;
  const headwear = recommendation ? headwearFromRecommendation(recommendation) : 'none';
  const avatarTier = recommendation ? tierFromRecommendation(recommendation, activity) : undefined;
  const dressedSrc = stageSrc(finalStageIdx, finalStageIdx, headwear, avatarTier);
  const baseFrame = (n: number) => `/avatars/f79-poc/stage-${Math.max(0, Math.min(4, n))}.png`;

  /** Avatar-frame som vises NÅR node i «landes» og barnet tar plagget på seg.
   *  Kropps-lag teller opp stage; lue/solhatt → hodeplagg-frame; annet
   *  tilbehør → hold forrige frame. */
  const nodeFrames = useMemo<string[]>(() => {
    const frames: string[] = [];
    let bodyStage = 0;
    let last = baseFrame(0);
    for (const node of nodes) {
      if (node.isHat) last = dressedSrc;
      else if (node.isBody) { bodyStage = Math.min(finalStageIdx, bodyStage + 1); last = baseFrame(bodyStage); }
      frames.push(last);
    }
    return frames;
  }, [nodes, finalStageIdx, dressedSrc]);

  // Alle distinkte avatar-frames (stage-0 → kledd) stacket for crossfade UTEN
  // re-mount (unngår dekode-glipp/flimmer når barnet bytter stage).
  const avatarFrames = useMemo<string[]>(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const f of [baseFrame(0), ...nodeFrames]) {
      if (!seen.has(f)) { seen.add(f); out.push(f); }
    }
    return out;
  }, [nodeFrames]);

  /* ── Overgang: Hjem cross-fader til takeover (avatar naken, blir stående),
     kort analyse-pust, så kommer klærne ETT LAG OM GANGEN i ROLIG takt og barnet
     tar hvert plagg på seg (Sivert: «gikk for fort»). Én gang/sesjon. ── */
  const alreadyPlayed = (() => {
    try { return window.sessionStorage.getItem(DRESSING_SESSION_KEY) === '1'; } catch { return false; }
  })();
  const instant = reducedMotion || alreadyPlayed;

  const [loaderHidden, setLoaderHidden] = useState(instant);
  const [avatarFrame, setAvatarFrame] = useState<string>(instant ? (N ? nodeFrames[N - 1] : baseFrame(0)) : baseFrame(0));
  const [chipsIn, setChipsIn] = useState<boolean>(instant); // true = alle klær inne
  const [revealed, setRevealed] = useState<boolean>(instant);
  const playedRef = useRef(false);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isEmpty) return;
    if (playedRef.current) return;
    playedRef.current = true;

    if (instant) {
      // R3 (2026-07-14): de visuelle statene er allerede initialisert til
      // instant-verdiene (useState(instant) over) — settene her var no-ops.
      // setStatusMsg flyttes til setTimeout(0): async setState tilfredsstiller
      // set-state-in-effect, og en senere tekst-mutasjon inn i en etablert
      // live-region annonseres MER pålitelig (a11y-lead 2026-07-14).
      const instantTimer = window.setTimeout(() => {
        setLoaderHidden(true);
        setChipsIn(true);
        setRevealed(true);
        setAvatarFrame(nodeFrames[N - 1]);
        setStatusMsg(`Kledd i ${N} plagg`);
      }, 0);
      try { window.sessionStorage.setItem(DRESSING_SESSION_KEY, '1'); } catch { /* noop */ }
      return () => window.clearTimeout(instantTimer);
    }

    // Choreografi (Sivert): analyse → ALLE klær i ringen samtidig + baby kledd →
    // så FALLER rekkefølge-radene inn ett og ett (Framer spring, mer tid mellom).
    const timers: number[] = [];
    const CHIPS_AT = 2600;              // «analyse» ~2,5 s før klærne kommer
    const REVEAL_AT = CHIPS_AT + 950;   // ringen lander → så faller lista inn
    // M1 (a11y-lead): loaderen ligger i aria-hidden-ringen — annonsér lasting
    // til skjermleser så den ikke får ~3,5 s stillhet før «Kledd i N plagg».
    // R3: avatarFrame er allerede baseFrame(0) initielt (!instant-grenen av
    // useState) — settet var no-op; statusMsg går i timer (async setState).
    timers.push(window.setTimeout(() => setStatusMsg('Setter sammen dagens antrekk …'), 0));
    timers.push(window.setTimeout(() => setLoaderHidden(true), CHIPS_AT - 200));
    timers.push(window.setTimeout(() => {
      setChipsIn(true);                 // alle klær i ringen samtidig
      setAvatarFrame(nodeFrames[N - 1]); // baby kledd (naken → dressed, ett crossfade)
    }, CHIPS_AT));
    timers.push(window.setTimeout(() => {
      setRevealed(true);
      setStatusMsg(`Kledd i ${N} plagg`);
      try { window.sessionStorage.setItem(DRESSING_SESSION_KEY, '1'); } catch { /* noop */ }
    }, REVEAL_AT));

    return () => { timers.forEach((t) => window.clearTimeout(t)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, N]);

  /* ── Detalj-sheet (F62 PlaggDetailSheet) — interaktiv fra <ol> ── */
  const [detailGarmentId, setDetailGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleOpenNode = useCallback((node: Node) => {
    void fire('light');
    if (!node.gid) return;
    detailTriggerRef.current = rowRefs.current[node.key] ?? null;
    setDetailGarmentId(node.gid);
    onOpenGarment?.({ itemName: node.item, categoryLabel: node.group.label });
  }, [fire, onOpenGarment]);

  const handleCloseDetail = useCallback(() => { setDetailGarmentId(null); }, []);

  /* ── «Hvorfor?»-ekspander ── */
  const [whyOpen, setWhyOpen] = useState(false);
  const whyBodyText = useMemo(
    () => whyText(recommendation, tempC, feelsC, symbolCode, nodes.map((n) => n.name)),
    [recommendation, tempC, feelsC, symbolCode, nodes],
  );

  /* ── Press / lukk ── */
  const handleClose = () => { void fire('light'); onBack(); };
  const handleDialogClick = (e: ReactMouseEvent<HTMLDialogElement>): void => {
    if (e.target === dialogRef.current) { void fire('light'); onBack(); }
  };

  /* ── Ring-geometri: chip-størrelse + posisjon (ellipse, %-basert) ── */
  const chipSize = N <= 3 ? 92 : N <= 5 ? 78 : 66;
  const ringPos = (i: number): { left: string; top: string } => {
    const ang = -Math.PI / 2 + i * ((2 * Math.PI) / Math.max(1, N));
    const RX = 40; // % av ring-boks
    const RY = 40;
    return { left: `${50 + RX * Math.cos(ang)}%`, top: `${50 + RY * Math.sin(ang)}%` };
  };

  /* ── Styles ── */
  /* FULLSKJERM in-place-takeover (Sivert): samme lerret som Hjem dekker
     resten → «alt unntatt avataren forsvinner». Ingen kort/hjørne-look. */
  const dialogStyle: CSSProperties = {
    inset: 0,
    width: '100vw', height: '100dvh',
    maxWidth: '100vw', maxHeight: '100dvh',
    padding: 0, margin: 0, border: 'none', borderRadius: 0,
    background: 'var(--bg-canvas, var(--surface, #fff))', color: 'var(--ink-900)',
    fontFamily: 'var(--font-sans)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  };
  const topbarStyle: CSSProperties = {
    flex: 'none', minHeight: 56, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10,
    background: 'transparent',
    paddingTop: 'max(6px, env(safe-area-inset-top, 0px))',
  };
  const closeBtnStyle: CSSProperties = {
    width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--ink-100, rgba(0,0,0,0.05))',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  };
  const topbarTitleStyle: CSSProperties = {
    flex: 1, fontFamily: 'var(--font-serif, "DM Serif Display", Georgia, serif)', fontWeight: 400,
    fontSize: '1.25rem', letterSpacing: '-0.3px', color: 'var(--ink-900)', margin: 0, lineHeight: 1.15,
  };
  const eyebrowStyle: CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-500)' };
  const scrollAreaStyle: CSSProperties = {
    flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
    padding: '10px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)',
    scrollbarWidth: 'none', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch',
  };

  const srOnly: CSSProperties = {
    position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden',
    clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
  };

  const eyebrowLabel = tempC !== null && tempC !== undefined
    ? `${symbolToLabel(symbolCode)} · ${Math.round(tempC)}° · ${N} lag`
    : `${N} lag`;

  return (
    <>
      <style>{`
        .pkl-btn:focus-visible { outline: 3px solid var(--focus-ring, var(--terracotta-400)); outline-offset: 2px; }
        .pkl-press:active { transform: scale(var(--press-scale, .97)); }
        .pkl-scroll::-webkit-scrollbar { display: none; }
        /* Fullskjerm + MYK cross-fade (Sivert): backdrop transparent så Hjem
           synes gjennom mens takeoveren toner inn (opacity) → mykt Hjem→takeover.
           Avataren ligger på samme plass i begge → «går igjen» gjennom fade-en.
           Klærne toner inn etterpå (chips), ikke i sekvens. */
        dialog.pkl-dialog::backdrop { background: transparent; }
        @keyframes pkl-canvas-in { from { opacity: 0; } to { opacity: 1; } }
        dialog.pkl-dialog[open] { animation: pkl-canvas-in 260ms var(--ease-out, cubic-bezier(.22,1,.36,1)) both; }

        /* ── Ring-scene (dekorativ) ── */
        .pkl-ring { position: relative; width: 100%; height: clamp(340px, 50vh, 480px); margin-top: 4px; }
        .pkl-ring-guide { position: absolute; left: 8%; right: 8%; top: 5%; bottom: 5%; border: 1.5px dashed var(--ink-100); border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .5s ease; }
        .pkl-ring.revealed .pkl-ring-guide { opacity: 1; }
        .pkl-avatar { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 210px; height: 244px; z-index: 2; }
        /* Stacket crossfade: alle frames ligger oppå hverandre, kun aktiv har
           opacity 1. Ingen re-mount → ingen dekode-glipp/flimmer. */
        .pkl-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(-8px 14px 20px rgba(175,83,49,.22)); opacity: 0; transition: opacity .5s cubic-bezier(.22,1,.36,1); }
        .pkl-avatar img[data-on="true"] { opacity: 1; }

        .pkl-chip { position: absolute; z-index: 3; transform: translate(-50%,-50%) scale(.5); opacity: 0; transition: opacity .5s cubic-bezier(.16,1,.3,1), transform .56s cubic-bezier(.34,1.35,.5,1); }
        .pkl-chip.in { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        .pkl-chip .thumb { position: relative; border-radius: 20px; background: var(--surface-pure); border: 1px solid var(--ink-100); box-shadow: 0 12px 26px -10px rgba(36,30,56,.28); display: grid; place-items: center; }
        .pkl-chip .thumb img { width: 100%; height: 100%; object-fit: contain; }
        .pkl-chip .badge { position: absolute; top: -8px; left: -8px; width: 25px; height: 25px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; font-size: .76rem; color: var(--accent-cta-ink); border: 2px solid var(--surface-pure); font-variant-numeric: tabular-nums; }

        .pkl-loader { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 12%; transition: opacity .35s ease; }
        .pkl-loader.hide { opacity: 0; pointer-events: none; }
        .pkl-loader .glass { display: flex; align-items: center; gap: 11px; padding: 11px 18px; border-radius: 999px; background: color-mix(in srgb, var(--surface) 72%, transparent); border: 1px solid var(--ink-100); box-shadow: 0 10px 26px -12px rgba(36,30,56,.3); backdrop-filter: blur(3px); font-weight: 600; font-size: .94rem; color: var(--ink-900); }
        .pkl-loader .dots { display: inline-flex; gap: 4px; }
        .pkl-loader .dots i { width: 6px; height: 6px; border-radius: 999px; background: var(--layer-innerst); animation: pkl-blink 1s infinite ease-in-out; }
        .pkl-loader .dots i:nth-child(2) { animation-delay: .16s; } .pkl-loader .dots i:nth-child(3) { animation-delay: .32s; }
        @keyframes pkl-blink { 0%,80%,100%{opacity:.28;transform:scale(.8);} 40%{opacity:1;transform:scale(1);} }

        /* ── Rekkefølge-liste = interaktiv kilde ── */
        .pkl-list { margin-top: 6px; opacity: 0; transition: opacity .3s ease; }
        .pkl-list.show { opacity: 1; }
        /* Radene faller inn ett og ett via Framer spring (se motion.li i JSX). */
        .pkl-list h3 { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-500); margin: 0 2px 8px; }
        /* R7 Task 4 (retning B/C): tekstil-STACK — sammenhengende rader med
           ~8px overlapp, vevd fargetab per gruppe (venstre kant), aktiv rad
           løftes 2px med myk mynte-kantlys. 56px rad − 8px overlapp = 48px
           ren treffhøyde (≥44pt, a11y-lead). Kategori bæres også av tekst. */
        .pkl-list ol { list-style: none; display: flex; flex-direction: column; gap: 0; margin: 0; padding: 0; }
        .pkl-list ol li { position: relative; }
        .pkl-list ol li + li { margin-top: -8px; }
        .pkl-row { position: relative; z-index: 1; display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: var(--surface-pure); border: 1px solid var(--ink-100); border-left: 4px solid var(--row-tab, var(--ink-200)); border-radius: 14px; padding: 8px 12px 14px; min-height: 56px; font: inherit; color: var(--ink-900); cursor: pointer; box-shadow: 0 3px 10px -7px rgba(36,30,56,.22); transition: transform 160ms var(--ease-out, cubic-bezier(.22,1,.36,1)), box-shadow 160ms var(--ease-out, cubic-bezier(.22,1,.36,1)); }
        .pkl-row:hover, .pkl-row:focus-visible, .pkl-row:active { z-index: 3; transform: translateY(-2px); box-shadow: 0 8px 18px -10px rgba(36,30,56,.30), 0 0 0 1.5px color-mix(in oklab, var(--accent-cta) 55%, transparent); }
        .pkl-row:active { transform: translateY(-1px) scale(.99); }
        .pkl-row .num { width: 24px; height: 24px; flex: none; border-radius: 999px; display: grid; place-items: center; font-weight: 700; font-size: .76rem; color: var(--accent-cta-ink); font-variant-numeric: tabular-nums; outline: 1.5px solid var(--ink-900); outline-offset: -1.5px; }
        .pkl-row .rthumb { width: 42px; height: 42px; flex: none; border-radius: 11px; background: var(--surface-soft); display: grid; place-items: center; padding: 5px; }
        .pkl-row .rthumb img { width: 100%; height: 100%; object-fit: contain; }
        .pkl-row .rtext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .pkl-row .rname { font-weight: 700; font-size: .9rem; line-height: 1.2; }
        .pkl-row .rrole { font-size: .8rem; color: var(--ink-700); line-height: 1.2; }
        .pkl-row .ralt { font-size: .75rem; color: var(--ink-500); }
        .pkl-row .chev { color: var(--ink-500); flex: none; }

        /* ── Hvorfor-ekspander ── */
        .pkl-why { margin-top: 12px; border-top: 1px solid var(--ink-100); padding-top: 10px; }
        .pkl-why-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: transparent; border: 0; font: inherit; font-weight: 600; font-size: 14px; color: var(--ink-900); min-height: 44px; cursor: pointer; text-align: left; }
        .pkl-why-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms var(--ease-out, cubic-bezier(.22,1,.36,1)); }
        .pkl-why-panel > div { overflow: hidden; }
        .pkl-why-panel[data-open="true"] { grid-template-rows: 1fr; }
        .pkl-why-body { font-size: 13px; line-height: 1.6; color: var(--ink-700); padding: 4px 0 2px; }

        @media (prefers-reduced-motion: reduce) {
          dialog.pkl-dialog[open] { animation: none; }
          .pkl-chip, .pkl-list, .pkl-avatar, .pkl-avatar img, .pkl-row, .pkl-loader, .pkl-loader .dots i, .pkl-ring-guide { transition: none !important; animation: none !important; }
          .pkl-why-panel { transition: none; }
        }
      `}</style>

      {/* F83 M1: ba-temp-root + data-temp SYNKET med Hjem (samme feels-akse) —
          dialogen lever i top-layer utenfor Hjems <main>, så uten egen scope
          ville lerretet hoppe i farge på kalde/varme dager. */}
      <dialog
        ref={dialogRef}
        className="pkl-dialog ba-temp-root"
        data-temp={tempAxisFor(feelsC, tempC)}
        style={dialogStyle}
        onClick={handleDialogClick}
        aria-labelledby="pkl-dialog-title"
      >
        <header style={topbarStyle}>
          <button type="button" onClick={handleClose} className="pkl-btn pkl-press" style={closeBtnStyle} aria-label="Lukk dagens antrekk">
            <CloseIcon />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="pkl-dialog-title" style={topbarTitleStyle}>Dagens antrekk</h2>
            {!isEmpty && <div style={eyebrowStyle}>{eyebrowLabel}</div>}
          </div>
          <span aria-hidden style={{ flex: 'none', width: 44, height: 44 }} />
        </header>

        <div className="pkl-scroll" style={scrollAreaStyle}>
          {isEmpty ? (
            <div style={{ padding: '32px 8px', textAlign: 'center', color: 'var(--ink-500)', fontSize: '0.875rem' }}>
              {weather.status === 'loading' ? 'Henter vær og anbefaling …' : 'Ingen anbefaling tilgjengelig akkurat nå.'}
            </div>
          ) : (
            <>
              {/* ── Ring-scene (DEKORATIV, aria-hidden) ── */}
              <div className={`pkl-ring${revealed ? ' revealed' : ''}`} aria-hidden="true">
                <div className="pkl-ring-guide" />
                <div className="pkl-avatar">
                  {avatarFrames.map((f) => (
                    <img key={f} src={f} alt="" data-on={f === avatarFrame ? 'true' : 'false'} draggable={false} />
                  ))}
                </div>
                {nodes.map((node, i) => {
                  const pos = ringPos(i);
                  const on = chipsIn;
                  return (
                    <div key={node.key} className={`pkl-chip${on ? ' in' : ''}`} style={{ left: pos.left, top: pos.top }}>
                      <div className="thumb" style={{ width: chipSize, height: chipSize, padding: chipSize > 80 ? 11 : 8 }}>
                        <span className="badge" style={{ background: `var(${node.group.colorVar})` }}>{node.order}</span>
                        <img
                          src={node.img}
                          alt=""
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            const flat = node.gid ? garmentPng(node.gid) : GENERIC_GARMENT_SVG;
                            if (el.src.includes('garments-clay') && node.gid) el.src = flat;
                            else if (el.src !== GENERIC_GARMENT_SVG) el.src = GENERIC_GARMENT_SVG;
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {!loaderHidden && (
                  <div className={`pkl-loader${loaderHidden ? ' hide' : ''}`}>
                    <div className="glass"><span>Analyserer været</span><span className="dots"><i /><i /><i /></span></div>
                  </div>
                )}
              </div>

              {/* SR-annonsering av sluttilstand (én gang, ved ferdig). */}
              <p style={srOnly} role="status" aria-live="polite" ref={statusRef}>{statusMsg}</p>

              {/* ── Rekkefølge-liste = ENESTE interaktive kilde. a11y-lead: gate
                 tastatur/fokus under reveal-animasjonen (opacity:0) via inert. ── */}
              <nav className={`pkl-list${revealed ? ' show' : ''}`} aria-label="Rekkefølge" inert={!revealed}>
                <h3>Rekkefølge · innerst først</h3>
                <ol>
                  {nodes.map((node, idx) => (
                    <motion.li
                      key={`row-${node.key}`}
                      initial={instant ? false : { opacity: 0, y: -16 }}
                      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
                      transition={instant ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 24, delay: idx * 0.23 }}
                    >
                      <button
                        type="button"
                        ref={(el) => { rowRefs.current[node.key] = el; }}
                        onClick={() => handleOpenNode(node)}
                        className="pkl-row pkl-btn"
                        style={{ '--row-tab': `var(${node.group.colorVar})` } as CSSProperties}
                        aria-label={`${ordinalWord(node.order, N)}: ${node.name}${node.hasAlt ? `, ${node.altCount} ${node.altCount === 1 ? 'alternativ' : 'alternativer'}` : ''}. Vis detaljer.`}
                      >
                        <span className="num" aria-hidden="true" style={{ background: `var(${node.group.colorVar})` }}>{node.order}</span>
                        <span className="rthumb" aria-hidden="true">
                          <img src={node.img} alt="" onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            const flat = node.gid ? garmentPng(node.gid) : GENERIC_GARMENT_SVG;
                            if (el.src.includes('garments-clay') && node.gid) el.src = flat;
                            else if (el.src !== GENERIC_GARMENT_SVG) el.src = GENERIC_GARMENT_SVG;
                          }} />
                        </span>
                        <span className="rtext">
                          <span className="rname">{node.name}</span>
                          <span className="rrole">
                            {node.group.label}
                            {node.hasAlt ? <span className="ralt"> · {node.altCount} {node.altCount === 1 ? 'alternativ' : 'alternativer'}</span> : null}
                          </span>
                        </span>
                        <span className="chev" aria-hidden="true"><ChevronRight /></span>
                      </button>
                    </motion.li>
                  ))}
                </ol>
              </nav>

              {/* ── Hvorfor dette antrekket? ── */}
              <div className="pkl-why">
                <button type="button" className="pkl-why-trigger pkl-btn" aria-expanded={whyOpen} aria-controls="pkl-why-panel"
                  onClick={() => { void fire('light'); setWhyOpen((v) => !v); }}>
                  <span>Hvorfor dette antrekket?</span>
                  <ChevronToggle open={whyOpen} />
                </button>
                <div className="pkl-why-panel" id="pkl-why-panel" data-open={whyOpen}>
                  <div><p className="pkl-why-body">{whyBodyText}</p></div>
                </div>
              </div>
            </>
          )}
        </div>
      </dialog>

      {detailGarmentId && (
        <PlaggDetailSheet
          garmentId={detailGarmentId}
          isOpen={detailGarmentId !== null}
          onClose={handleCloseDetail}
          triggerRef={detailTriggerRef}
        />
      )}
    </>
  );
}

export function PaakledningScreen(props: PaakledningScreenProps): ReactElement {
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
  return <CurrentPaakledningScreen {...props} />;
}

export default PaakledningScreen;
