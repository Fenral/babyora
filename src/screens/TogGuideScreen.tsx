/**
 * TogGuideScreen — skjerm "8 · TOG-guiden" (Mock B port).
 *
 * Veileder forelderen til riktig sovepose-TOG basert på romtemperatur.
 * Visuell, romslig design (Mock B): serif-tall, hero-illustrasjon, gradient-track
 * med tick-markører, store layer-kort med farge-stripe og chip.
 *
 * Wire-up:
 *  - useHapticSystem().fire('selection') ved slider-drag (tick)
 *  - useHapticSystem().fire('light') ved back-knapp og step-knapp
 *  - useNativeSettings().reducedMotion respekteres for slider-thumb-transition
 *
 * A11y:
 *  - <input type="range"> som ekte slider (tastatur + screen reader gratis)
 *  - aria-valuetext med "{temp}°C, anbefalt TOG {value}"
 *  - role=radiogroup for steg-knapper med aria-checked
 *  - role=list/listitem for layer-kort
 *  - Back-knapp har aria-label
 *  - Touch-targets ≥44px
 *  - focus-visible-ring på interaktive elementer
 *  - safe-area-inset top + bottom
 */
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { useChildren } from '../state/children-store';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import {
  garmentIdFor,
  garmentClayPng,
  garmentPng,
  type GarmentId,
} from '../data/garment-illustrations';

export interface TogGuideScreenProps {
  onBack: () => void;
}

interface LayerItem {
  step: string;
  name: string;
  /**
   * Lowercase database-streng for plagget — brukes som oppslags-nøkkel mot
   * `garmentIdFor()` (samme MAP som PaakledningScreen). Frikoblet fra
   * display-navnet (`name`) slik at vi kan vise norsk-typografisk navn
   * («Bomullsbody med lang arm») men slå opp PNG-illustrasjonen og
   * detalj-sheet via en eksisterende MAP-nøkkel («langermet body»).
   */
  dbString: string;
  chip: string;
  variant: 'inner' | 'mid' | 'outer';
}

interface TogRecommendation {
  tog: string;
  zoneLabel: string;
  layers: LayerItem[];
}

/**
 * Map romtemperatur → anbefalt TOG + komfortsone + på-kledning.
 * Følger Lullaby Trust + norske barnesykepleier-anbefalinger.
 */
function tempToTog(tempC: number): TogRecommendation {
  if (tempC <= 17) {
    return {
      tog: '3.5',
      zoneLabel: 'Komfortsone for ≤17° · trygg fra 14°',
      layers: [
        {
          step: 'Lag 1 · Innerst',
          name: 'Bomullsbody med lang arm',
          dbString: 'langermet body',
          chip: 'Hud',
          variant: 'inner',
        },
        {
          step: 'Lag 2 · Mellom',
          name: 'Tynn pysjamas',
          dbString: 'tynn pyjamas',
          chip: 'Mellom',
          variant: 'mid',
        },
        {
          step: 'Lag 3 · Ytterst',
          name: 'Sovepose 3.5 TOG',
          dbString: 'sovepose 3.5 TOG',
          chip: '3.5 TOG',
          variant: 'outer',
        },
      ],
    };
  }
  if (tempC <= 19) {
    return {
      tog: '2.5',
      zoneLabel: 'Komfortsone for 18–19° · trygg fra 16°',
      layers: [
        {
          step: 'Lag 1 · Innerst',
          name: 'Bomullsbody med lang arm',
          dbString: 'langermet body',
          chip: 'Hud',
          variant: 'inner',
        },
        {
          step: 'Lag 2 · Ytterst',
          name: 'Sovepose 2.5 TOG',
          dbString: 'sovepose 2.5 TOG',
          chip: '2.5 TOG',
          variant: 'outer',
        },
      ],
    };
  }
  if (tempC <= 21) {
    return {
      tog: '2.5',
      zoneLabel: 'Komfortsone for 18–21° · trygg fra 16°',
      layers: [
        {
          step: 'Lag 1 · Innerst',
          name: 'Bomullsbody med kort arm',
          dbString: 'kortermet body',
          chip: 'Hud',
          variant: 'inner',
        },
        {
          step: 'Lag 2 · Ytterst',
          name: 'Sovepose 2.5 TOG',
          dbString: 'sovepose 2.5 TOG',
          chip: '2.5 TOG',
          variant: 'outer',
        },
      ],
    };
  }
  if (tempC <= 23) {
    return {
      tog: '1.0',
      zoneLabel: 'Komfortsone for 22–23° · trygg til 24°',
      layers: [
        {
          step: 'Lag 1 · Innerst',
          name: 'Bomullsbody med kort arm',
          dbString: 'kortermet body',
          chip: 'Hud',
          variant: 'inner',
        },
        {
          step: 'Lag 2 · Ytterst',
          name: 'Sovepose 1.0 TOG',
          dbString: 'sovepose 1.0 TOG',
          chip: '1.0 TOG',
          variant: 'outer',
        },
      ],
    };
  }
  return {
    tog: '0.5',
    zoneLabel: 'Komfortsone for ≥24°',
    layers: [
      {
        step: 'Lag 1 · Innerst',
        name: 'Bomullsbody med kort arm',
        dbString: 'kortermet body',
        chip: 'Hud',
        variant: 'inner',
      },
      {
        step: 'Lag 2 · Ytterst',
        name: 'Sovepose 0.5 TOG',
        dbString: 'sovepose 0.5 TOG',
        chip: '0.5 TOG',
        variant: 'outer',
      },
    ],
  };
}

/** Forhåndsvalgte steg vist under slideren. */
const STEPS: ReadonlyArray<{ temp: number; togLabel: string }> = [
  { temp: 16, togLabel: '3.5 tog' },
  { temp: 18, togLabel: '2.5 tog' },
  { temp: 20, togLabel: '2.5 tog' },
  { temp: 22, togLabel: '1.0 tog' },
  { temp: 24, togLabel: '0.5 tog' },
];

/** Farge per lag-stripe — Morgennatt lag-alignerte tokens (innerst/mellom/ytterst). */
const LAYER_STRIPE: Record<LayerItem['variant'], string> = {
  inner: 'var(--layer-innerst)',
  mid: 'var(--layer-mellom)',
  outer: 'var(--layer-ytterst)',
};

export function TogGuideScreen({ onBack }: TogGuideScreenProps) {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const { active, needsOnboarding } = useChildren();

  // 20°C default per design.
  const [tempC, setTempC] = useState<number>(20);

  const rec = useMemo(() => tempToTog(tempC), [tempC]);

  // Anbefalt sovepose som clay-render (erstatter den tegnede hero-SVG-en +
  // gir «bildet av soveposen» Sivert ba om). Oppdateres med slideren.
  const soveposeClay = useMemo(() => {
    const layer = rec.layers.find((l) => /sovepose/i.test(l.dbString));
    const gid = layer ? garmentIdFor(layer.dbString) : null;
    return gid ? { src: garmentClayPng(gid), fallback: garmentPng(gid) } : null;
  }, [rec]);

  // Aktivt barn — interpolert (tillits-bug: het før hardkodet «For Lo · 4 mnd»).
  // Samme fallback-mønster som FinnAntrekkScreen: navn faller tilbake til
  // «barnet» når onboarding ikke er fullført / navn mangler.
  const childName =
    !needsOnboarding && active.name && active.name.trim().length > 0
      ? active.name
      : 'barnet';
  const childAgeMonths = useMemo(
    () => (!needsOnboarding ? dobToAgeMonths(active.dob) : 0),
    [active.dob, needsOnboarding],
  );
  const heroEyebrowText =
    !needsOnboarding && active.name && active.name.trim().length > 0
      ? `For ${childName} · ${childAgeMonths} mnd`
      : 'Anbefaling for natten';

  /* ── Detalj-sheet state (F62 PlaggDetailSheet) ──
     Tap på en plagg-rad → åpner eksisterende PlaggDetailSheet (pros/cons +
     alternativer). Focus returneres til rad-knappen ved lukking via
     detailTriggerRef. Samme mønster som PaakledningScreen.handleOpenRow. */
  const [detailGarmentId, setDetailGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleOpenLayer = (rowKey: string, layer: LayerItem) => {
    void fire('light');
    const gid = garmentIdFor(layer.dbString);
    if (!gid) {
      // Ingen illustrasjon mappet for denne db-strengen → ingen detail-sheet.
      return;
    }
    // Pek triggerRef til den klikkede raden så focus returnerer dit ved close.
    detailTriggerRef.current = rowRefs.current[rowKey] ?? null;
    setDetailGarmentId(gid);
  };

  const handleCloseDetail = () => {
    setDetailGarmentId(null);
  };

  // Slider-prosent 0–100 mappet til 16–24°C
  const sliderPct = ((tempC - 16) / (24 - 16)) * 100;

  const handleBack = () => {
    void fire('light');
    onBack();
  };

  const handleSliderChange = (next: number) => {
    if (next !== tempC) {
      void fire('selection');
    }
    setTempC(next);
  };

  const handleStepClick = (next: number) => {
    if (next !== tempC) {
      void fire('light');
    }
    setTempC(next);
  };

  // Styles --------------------------------------------------------------

  const rootStyle: CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'max(54px, env(safe-area-inset-top, 54px))',
    fontFamily: 'var(--dw-font-ui)',
    color: 'var(--dw-ink-hi)',
    background: 'var(--dw-canvas)',
  };

  const sheenStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(140% 40% at 50% -10%, var(--dw-hairline), transparent 60%),' +
      'radial-gradient(80% 50% at 20% 110%, var(--dw-accent-surface), transparent 60%)',
    opacity: 0.6,
  };

  const topbarStyle: CSSProperties = {
    position: 'relative',
    zIndex: 5,
    flex: 'none',
    height: 56,
    marginTop: 'var(--dw-space-12)',
    padding: '0 var(--dw-space-16)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
  };

  const backBtnStyle: CSSProperties = {
    width: 44,
    height: 44,
    flex: 'none',
    borderRadius: 14,
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--dw-ink-hi)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: reducedMotion
      ? 'none'
      : 'transform var(--dw-m-feedback) var(--ease-standard)',
  };

  const topbarTitleStyle: CSSProperties = {
    flex: 1,
    fontSize: '0.71875rem',
    fontWeight: 600,
    letterSpacing: '1.4px',
    color: 'var(--dw-ink-mid)',
    textAlign: 'center',
    textTransform: 'uppercase',
    margin: 0,
  };

  const topbarSpacerStyle: CSSProperties = {
    width: 44,
    height: 44,
    flex: 'none',
  };

  const scrollStyle: CSSProperties = {
    position: 'relative',
    zIndex: 3,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '8px 20px calc(40px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    scrollbarWidth: 'none',
  };

  // Hero -----------------------------------------------------------------
  const heroStyle: CSSProperties = {
    position: 'relative',
    padding: 'var(--dw-space-12) var(--dw-space-4) 0',
    textAlign: 'center',
  };

  const heroEyebrowStyle: CSSProperties = {
    display: 'inline-block',
    fontSize: '0.65625rem',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--dw-accent)',
    padding: 'var(--dw-space-6) var(--dw-space-12)',
    borderRadius: 999,
    background: 'var(--dw-accent-surface)',
    marginBottom: 'var(--dw-space-18)',
  };

  const heroTitleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), "DM Serif Display", Georgia, serif',
    fontSize: 34,
    lineHeight: 1.05,
    letterSpacing: '-0.8px',
    fontWeight: 400,
    color: 'var(--dw-ink-hi)',
    margin: '0 0 var(--dw-space-8)',
  };

  const heroEmStyle: CSSProperties = {
    fontStyle: 'italic',
    color: 'var(--dw-accent)',
  };

  const heroSubStyle: CSSProperties = {
    fontSize: '0.90625rem',
    lineHeight: 1.5,
    color: 'var(--dw-ink-mid)',
    maxWidth: 280,
    margin: '0 auto',
  };

  const sceneStyle: CSSProperties = {
    position: 'relative',
    height: 176,
    margin: '8px -4px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // TOG hero-kort --------------------------------------------------------
  const togHeroStyle: CSSProperties = {
    position: 'relative',
    borderRadius: 28,
    padding: 'var(--dw-space-24) var(--dw-space-22) var(--dw-space-22)',
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    boxShadow: 'var(--shadow-3)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    overflow: 'hidden',
  };

  const togHeroRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 'var(--dw-space-18)',
  };

  const togHeroLeftStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-6)',
    minWidth: 0,
  };

  const togHeroEyebrowStyle: CSSProperties = {
    fontSize: '0.65625rem',
    fontWeight: 700,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
  };

  const togHeroNumberStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), "DM Serif Display", Georgia, serif',
    fontSize: 84,
    lineHeight: 0.88,
    fontWeight: 400,
    letterSpacing: '-3px',
    color: 'var(--dw-accent)',
    fontVariantNumeric: 'tabular-nums',
  };

  const togHeroUnitStyle: CSSProperties = {
    fontFamily: 'var(--dw-font-ui)',
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '-0.4px',
    color: 'var(--dw-accent)',
    marginLeft: 'var(--dw-space-6)',
    verticalAlign: 8,
  };

  const togHeroRightStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'right',
    gap: 'var(--dw-space-4)',
    paddingBottom: 'var(--dw-space-6)',
  };

  const togHeroTempLabelStyle: CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
  };

  const togHeroTempStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), "DM Serif Display", Georgia, serif',
    fontSize: 32,
    lineHeight: 1,
    letterSpacing: '-0.5px',
    color: 'var(--dw-ink-hi)',
    fontVariantNumeric: 'tabular-nums',
  };

  const togHeroTempUnitStyle: CSSProperties = {
    fontStyle: 'normal',
    fontSize: '1.125rem',
    color: 'var(--dw-ink-mid)',
    verticalAlign: 6,
    marginLeft: 1,
  };

  const togHeroZoneStyle: CSSProperties = {
    marginTop: 'var(--dw-space-18)',
    paddingTop: 'var(--dw-space-16)',
    borderTop: '1px solid var(--dw-hairline)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-10)',
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: 'var(--dw-ink-mid)',
  };

  const togHeroZoneDotStyle: CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flex: 'none',
    background: 'var(--dw-accent)',
    boxShadow: '0 0 0 4px var(--dw-accent-surface)',
  };

  // Slider section -------------------------------------------------------
  const sliderSectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-18)',
  };

  const sliderHeadStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '0 var(--dw-space-2)',
  };

  const sliderLabelStyle: CSSProperties = {
    fontSize: '0.71875rem',
    fontWeight: 700,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
  };

  const sliderHintStyle: CSSProperties = {
    fontSize: '0.78125rem',
    fontWeight: 500,
    color: 'var(--dw-ink-mid)',
  };

  const sliderTrackWrapStyle: CSSProperties = {
    position: 'relative',
    padding: 'var(--dw-space-18) var(--dw-space-6) 26px',
  };

  const sliderTrackStyle: CSSProperties = {
    position: 'relative',
    height: 16,
    borderRadius: 999,
    background:
      'linear-gradient(90deg,' +
      'var(--dw-zone-cold) 0%,' +
      'var(--dw-zone-cool) 28%,' +
      'var(--dw-zone-mid) 50%,' +
      'var(--dw-zone-warm) 72%,' +
      'var(--dw-zone-hot) 100%)',
    boxShadow:
      'inset 0 1px 2px rgba(0,0,0,.18), inset 0 -1px 1px rgba(255,255,255,.35)',
  };

  const sliderTicksStyle: CSSProperties = {
    position: 'absolute',
    left: 'var(--dw-space-6)',
    right: 'var(--dw-space-6)',
    top: 'var(--dw-space-6)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  };

  const tickStyle: CSSProperties = {
    width: 2,
    height: 8,
    borderRadius: 1,
    background: 'rgba(255,255,255,.55)',
  };

  const thumbStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: `${sliderPct}%`,
    transform: 'translate(-50%, -50%)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--dw-overlay)',
    border: '3px solid var(--dw-accent)',
    boxShadow: 'var(--shadow-2), 0 0 0 1px var(--dw-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--dw-font-ui)',
    fontSize: '0.71875rem',
    fontWeight: 700,
    color: 'var(--dw-accent)',
    fontVariantNumeric: 'tabular-nums',
    pointerEvents: 'none',
    transition: reducedMotion ? 'none' : 'left 160ms var(--ease-standard)',
  };

  // Native range-input ligger usynlig over track for ekte input-events.
  const rangeInputStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    opacity: 0,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const stepLabelsStyle: CSSProperties = {
    marginTop: 'var(--dw-space-14)',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 'var(--dw-space-4)',
    padding: '0 var(--dw-space-4)',
  };

  const stepButtonBaseStyle: CSSProperties = {
    appearance: 'none',
    border: 0,
    background: 'transparent',
    padding: 'var(--dw-space-6) var(--dw-space-2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--dw-space-4)',
    cursor: 'pointer',
    borderRadius: 10,
    fontFamily: 'inherit',
    color: 'inherit',
    minHeight: 44,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : 'background var(--dw-m-feedback) var(--ease-standard)',
  };

  // Section eyebrow ------------------------------------------------------
  const sectionEyebrowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '0 var(--dw-space-4)',
    marginBottom: 'var(--dw-space-14)',
  };

  const sectionTitleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), "DM Serif Display", Georgia, serif',
    fontWeight: 400,
    fontSize: '1.375rem',
    lineHeight: 1.15,
    letterSpacing: '-0.4px',
    color: 'var(--dw-ink-hi)',
    margin: 0,
  };

  const sectionEmStyle: CSSProperties = {
    fontStyle: 'italic',
    color: 'var(--dw-accent)',
  };

  const sectionCountStyle: CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
  };

  // Layer cards ----------------------------------------------------------
  const layerListStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
  };

  const layerCardStyle = (variant: LayerItem['variant']): CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-16)',
    padding: 'var(--dw-space-18)',
    paddingLeft: 'var(--dw-space-22)',
    borderRadius: 22,
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    boxShadow: 'var(--shadow-2)',
    overflow: 'hidden',
    borderLeft: `4px solid ${LAYER_STRIPE[variant]}`,
    // Button-reset for klikkbar lag-rad
    appearance: 'none',
    width: '100%',
    minHeight: 44,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : 'transform var(--dw-m-feedback) var(--ease-standard), border-color var(--dw-m-feedback) var(--ease-standard)',
  });

  const layerThumbStyle: CSSProperties = {
    width: 64,
    height: 64,
    flex: 'none',
    borderRadius: 18,
    background: 'var(--dw-raised)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--dw-hairline)',
  };

  const layerMetaStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-4)',
  };

  const layerStepStyle: CSSProperties = {
    fontSize: '0.65625rem',
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
  };

  const layerNameStyle: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.2px',
    color: 'var(--dw-ink-hi)',
    lineHeight: 1.25,
  };

  const layerChipStyle: CSSProperties = {
    flex: 'none',
    padding: 'var(--dw-space-6) 11px',
    borderRadius: 999,
    background: 'var(--dw-accent-surface)',
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: 'var(--dw-accent)',
  };

  // Safety ---------------------------------------------------------------
  const safetyStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--dw-space-14)',
    padding: 'var(--dw-space-18)',
    borderRadius: 22,
    background: 'var(--dw-accent-surface)',
    border: '1px solid var(--terracotta-200)',
  };

  const safetyIconWrapStyle: CSSProperties = {
    width: 40,
    height: 40,
    flex: 'none',
    borderRadius: 14,
    background: 'var(--dw-raised)',
    border: '1px solid var(--terracotta-200)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const safetyTextWrapStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const safetyTitleStyle: CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 700,
    letterSpacing: '0.1px',
    color: 'var(--dw-ink-hi)',
    margin: '0 0 var(--dw-space-4)',
  };

  const safetyBodyStyle: CSSProperties = {
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    color: 'var(--dw-ink-mid)',
    margin: 0,
  };

  // Step button per index — varierende aria-checked / farger
  const stepTempStyle = (active: boolean): CSSProperties => ({
    fontFamily: 'var(--font-serif), "DM Serif Display", Georgia, serif',
    fontSize: '0.9375rem',
    letterSpacing: '-0.3px',
    color: active ? 'var(--dw-accent)' : 'var(--dw-ink-hi)',
    fontVariantNumeric: 'tabular-nums',
  });

  const stepTogStyle = (active: boolean): CSSProperties => ({
    fontSize: '0.65625rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: active ? 'var(--dw-accent)' : 'var(--dw-ink-mid)',
  });

  // Layer-ikon per variant — Morgennatt lag-alignerte tokens (samme
  // innerst/mellom/ytterst-familie som LAYER_STRIPE).
  const renderLayerIcon = (variant: LayerItem['variant']) => {
    if (variant === 'inner') {
      return (
        <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M11 8h14l-1 4 3 2v8l-3 1v9H12v-9l-3-1v-8l3-2-1-4z" fill="var(--lag-korall)" />
          <circle cx={18} cy={12} r={1.5} fill="var(--chip-edge-korall)" />
          <circle cx={18} cy={16} r={1.5} fill="var(--chip-edge-korall)" />
        </svg>
      );
    }
    if (variant === 'mid') {
      return (
        <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M10 9h16l-2 5v14H12V14l-2-5z" fill="var(--lag-marigold)" />
          <path d="M14 18h8M14 22h8" stroke="var(--chip-edge-marigold)" strokeWidth={1} strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M18 5l-9 4v5l9-2 9 2V9l-9-4z" fill="var(--chip-edge-dyppetrol)" />
        <path d="M9 14v14h18V14l-9 2-9-2z" fill="var(--lag-dyppetrol)" />
        <path
          d="M12 18h12M12 22h12M12 26h12"
          stroke="var(--chip-edge-dyppetrol)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <main style={rootStyle} aria-labelledby="togguide-title">
      <div style={sheenStyle} aria-hidden="true" />

      {/* Topbar */}
      <header style={topbarStyle}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Tilbake"
          style={backBtnStyle}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--dw-accent)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          <svg
            width={9}
            height={15}
            viewBox="0 0 8 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 1L1 7l6 6" />
          </svg>
        </button>
        <h1 id="togguide-title" style={topbarTitleStyle}>
          Soving innendørs
        </h1>
        <div style={topbarSpacerStyle} aria-hidden="true" />
      </header>

      {/* Scroll-container */}
      <div style={scrollStyle}>
        {/* HERO */}
        <section style={heroStyle} aria-labelledby="hero-title">
          <span style={heroEyebrowStyle}>{heroEyebrowText}</span>
          <h2 style={heroTitleStyle} id="hero-title">
            Riktig <em style={heroEmStyle}>varme</em> for natten
          </h2>
          <p style={heroSubStyle}>
            Skyv på guiden og finn anbefalt sovepose etter temperaturen på rommet.
          </p>
          <div style={sceneStyle}>
            {soveposeClay && (
              <img
                src={soveposeClay.src}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== soveposeClay.fallback) img.src = soveposeClay.fallback;
                }}
                alt={`Anbefalt sovepose, ${rec.tog} TOG`}
                style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }}
              />
            )}
          </div>
        </section>

        {/* TOG hero-kort */}
        <section style={togHeroStyle} aria-labelledby="tog-hero-label">
          <div style={togHeroRowStyle}>
            <div style={togHeroLeftStyle}>
              <span style={togHeroEyebrowStyle} id="tog-hero-label">
                Anbefalt TOG
              </span>
              <div>
                <span
                  style={togHeroNumberStyle}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {rec.tog}
                </span>
                <span style={togHeroUnitStyle}>tog</span>
              </div>
            </div>
            <div style={togHeroRightStyle}>
              <span style={togHeroTempLabelStyle}>Romtemperatur</span>
              <div style={togHeroTempStyle}>
                {tempC}
                <em style={togHeroTempUnitStyle}>°C</em>
              </div>
            </div>
          </div>
          <div style={togHeroZoneStyle}>
            <span style={togHeroZoneDotStyle} aria-hidden="true" />
            <span>{rec.zoneLabel}</span>
          </div>
        </section>

        {/* SLIDER */}
        <section style={sliderSectionStyle} aria-labelledby="slider-label">
          <div style={sliderHeadStyle}>
            <span style={sliderLabelStyle} id="slider-label">
              Sett romtemperatur
            </span>
            <span style={sliderHintStyle}>Skyv eller velg under</span>
          </div>
          <div style={sliderTrackWrapStyle} role="group" aria-labelledby="slider-label">
            <div style={sliderTrackStyle} aria-hidden="true">
              <div style={sliderTicksStyle}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} style={tickStyle} />
                ))}
              </div>
              <div style={thumbStyle} aria-hidden="true">
                {tempC}°
              </div>
              <input
                type="range"
                min={16}
                max={24}
                step={1}
                value={tempC}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                aria-labelledby="slider-label"
                aria-valuetext={`${tempC} grader celsius, anbefalt TOG ${rec.tog}`}
                style={rangeInputStyle}
              />
            </div>
            <div
              style={stepLabelsStyle}
              role="radiogroup"
              aria-label="Forhåndsvalgte temperatur-steg"
            >
              {STEPS.map((step) => {
                const active = step.temp === tempC;
                return (
                  <button
                    key={step.temp}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleStepClick(step.temp)}
                    style={stepButtonBaseStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        '2px solid var(--dw-accent)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    <span style={stepTempStyle(active)}>{step.temp}°</span>
                    <span style={stepTogStyle(active)}>{step.togLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* LAYER LIST */}
        <section aria-labelledby="layers-title">
          <div style={sectionEyebrowStyle}>
            <h2 id="layers-title" style={sectionTitleStyle}>
              Slik <em style={sectionEmStyle}>kler</em> du på
            </h2>
            <span style={sectionCountStyle}>
              {rec.layers.length} {rec.layers.length === 1 ? 'lag' : 'lag'}
            </span>
          </div>
          <ol style={layerListStyle} role="list">
            {rec.layers.map((layer, idx) => {
              const rowKey = `${layer.dbString}-${idx}`;
              return (
                <li
                  key={rowKey}
                  role="listitem"
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <button
                    type="button"
                    ref={(el) => {
                      rowRefs.current[rowKey] = el;
                    }}
                    onClick={() => handleOpenLayer(rowKey, layer)}
                    aria-label={`Vis detalj for ${layer.name}`}
                    style={layerCardStyle(layer.variant)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        '2px solid var(--dw-accent)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    <div style={layerThumbStyle} aria-hidden="true">
                      {(() => {
                        const gid = garmentIdFor(layer.dbString);
                        if (!gid) return renderLayerIcon(layer.variant);
                        return (
                          <img
                            src={garmentClayPng(gid)}
                            onError={(e) => {
                              const img = e.currentTarget;
                              const flat = garmentPng(gid);
                              if (img.src !== flat) img.src = flat;
                            }}
                            alt=""
                            width={64}
                            height={64}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        );
                      })()}
                    </div>
                    <div style={layerMetaStyle}>
                      <span style={layerStepStyle}>{layer.step}</span>
                      <span style={layerNameStyle}>{layer.name}</span>
                    </div>
                    <span style={layerChipStyle}>{layer.chip}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {/* SAFETY */}
        <aside style={safetyStyle} role="note" aria-label="Sikkerhet">
          <div style={safetyIconWrapStyle} aria-hidden="true">
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--dw-accent)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={12} cy={12} r={9} />
              <path d="M12 8h.01M11 12h1v4h1" />
            </svg>
          </div>
          <div style={safetyTextWrapStyle}>
            <p style={safetyTitleStyle}>Trygg-natt-regel</p>
            <p style={safetyBodyStyle}>
              Bruk aldri dyne, pute eller løse tepper sammen med sovepose før
              barnet er over 1 år.
            </p>
          </div>
        </aside>
      </div>

      {/* ── Plagg-detalj (F62 PlaggDetailSheet) ──
          Mountes som søsken-overlay inni <main>. Native <dialog> håndterer
          backdrop + focus-trap. focus returneres til klikket rad-knapp via
          detailTriggerRef ved close. */}
      {detailGarmentId && (
        <PlaggDetailSheet
          garmentId={detailGarmentId}
          isOpen={detailGarmentId !== null}
          onClose={handleCloseDetail}
          triggerRef={detailTriggerRef}
        />
      )}
    </main>
  );
}

export default TogGuideScreen;
