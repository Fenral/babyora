/**
 * PlaggbibliotekScreen — Skjerm 6 i F60-arbeidsflyt
 *
 * F80c PROD-PORT til Morgennatt (docs/F80/a11y-preclearance.md + design-tokens.css).
 * Layout/struktur uendret fra Mock A (warm-grey editorial) — kun fargelag byttet
 * fra lokale hex-TOKENS til Morgennatt var(--...): canvas/ink-ramp fra design-tokens,
 * Granmynte-CTA-mønster (56px) på FAB, lag-alignerte tokener på material-swatches
 * (ull→marigold, bomull→petrolgrå-nøytral, vanntett→dyppetrol) og TOG-pills.
 *
 * Plaggbiblioteket:
 *  - Eyebrow-meta (Oslo · 12°, lett vind · 49 plagg) i Fraunces italic
 *  - Editorial display-title "Plaggbiblioteket" 32px serif
 *  - Søk-felt (surface-glass) med ⌘K-kbd hint
 *  - Filter-chips (scroll-x) med material-swatches (ull/bomull/vanntett)
 *  - 2-col grid med hairline-divider GOAT-pattern, gruppert (Innerlag/Mellomlag/Ytterlag)
 *  - Square thumbnail med radial highlight + emoji fallback
 *  - TOG-pill (warm/cool/neutral) top-right på hvert card
 *  - Floating Granmynte-FAB "Legg til plagg" med fade-mask over scroll
 *
 * Bevart fra forrige iterasjon:
 *  - Props-signatur (onBack + onOpenCategory) → App.tsx call-sites uendret
 *  - useHapticSystem + useNativeSettings (reducedMotion)
 *  - A11y: <main>, <h1>, <header>, <nav>, role="list"/"listitem", aria-label,
 *    aria-pressed på chips, role="search" på søk, focus-visible ring
 *  - 44px touch-targets på back/topbar/chip-min-height
 *  - safe-area-inset top + bottom
 *
 * A11y:
 *  - Semantic HTML; <h1 class="sr-only"> for skjult side-tittel, editorial <h2> synlig
 *  - aria-label på icon-only knapper (Tilbake, Sorter, Legg til plagg)
 *  - aria-pressed på filter-chips
 *  - focus-visible ring (var(--dw-focus), 2px, offset 2px)
 *  - prefers-reduced-motion respektert
 */
import { useState, useMemo, useRef, useCallback, type CSSProperties } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import {
  GENERIC_GARMENT_SVG,
  garmentPng,
  type GarmentId,
} from '../data/garment-illustrations';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  GARMENTS_BY_CATEGORY,
} from '../data/garment-category';
import { titleFor, materialFor, type MaterialKey } from '../data/garment-catalog-helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FilterKey = 'alle' | 'ull' | 'bomull' | 'vanntett' | 'mellomlag' | 'sove' | 'vinter';

interface Garment {
  id: GarmentId;
  title: string;
  /** Heuristisk materiale (null = tilbehør uten tydelig materiale). */
  material: MaterialKey | null;
  materialLabel: string | null;
  image: string;
}

interface GarmentGroup {
  id: string;
  label: string;
  items: ReadonlyArray<Garment>;
}

export interface PlaggbibliotekScreenProps {
  onBack: () => void;
  onOpenCategory?: (cat: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Katalog-drevet data — HELE plagg-katalogen (GARMENTS_BY_CATEGORY), ikke en
// hardkodet mock-delmengde. Navn fra titleFor (kanoniske visningsnavn,
// garment-display-names.ts — T1A), bilder fra garmentPng.
// Ekte per-plagg-TOG finnes ikke → ingen oppdiktet TOG-verdi (baby-app).
// titleFor/materialFor delt med MinGarderobeScreen via garment-catalog-helpers
// (F85) — unngår at de to skjermene drifter fra hverandre.
// ─────────────────────────────────────────────────────────────────────────────

const GROUPS: ReadonlyArray<GarmentGroup> = CATEGORY_ORDER.map((cat) => ({
  id: cat,
  label: CATEGORY_LABEL[cat],
  items: GARMENTS_BY_CATEGORY[cat].map((id): Garment => {
    const mat = materialFor(id);
    return {
      id,
      title: titleFor(id),
      material: mat?.key ?? null,
      materialLabel: mat?.label ?? null,
      image: garmentPng(id),
    };
  }),
}));

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string; mat?: 'ull' | 'bomull' | 'vanntett' }> = [
  { key: 'alle',      label: 'Alle' },
  { key: 'ull',       label: 'Ull',       mat: 'ull' },
  { key: 'bomull',    label: 'Bomull',    mat: 'bomull' },
  { key: 'vanntett',  label: 'Vanntett',  mat: 'vanntett' },
  { key: 'mellomlag', label: 'Mellomlag' },
  { key: 'sove',      label: 'Sove' },
  { key: 'vinter',    label: 'Vinter' },
];

const TOTAL_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const TOKENS = {
  bgCanvas:        'var(--dw-canvas)',
  bgElevated:      'var(--dw-raised)',
  bgRowAlt:        'var(--dw-raised)',
  ink900:          'var(--dw-ink-hi)',
  ink700:          'var(--dw-ink-mid)',
  ink500:          'var(--dw-ink-mid)',
  ink400:          'var(--dw-ink-low)',
  ink300:          'var(--dw-ink-low)',
  hairline:        'var(--dw-hairline)',
  hairlineStrong:  'var(--dw-hairline)',
  // Granmynte CTA-grønn (FAB) — samme mønster som HjemScreen-CTA-en.
  orange700:       'var(--dw-accent-pressed)',
  orange600:       'var(--dw-accent)',
  orange500:       'var(--dw-accent)',
  // --terracotta-200 er TEMA-DELT (lys: --dw-accent, mørk: --dw-accent-300) —
  // ingen enkelt --dw-verdi er lik i begge tema, så aliaset står.
  orange200:       'var(--terracotta-200)',
  orange50:        'var(--dw-accent-surface)',
  /* ═══ MATERIALPRIKKENE — EGEN SKALA, IKKE TRE LÅN ══════════════════════

     Sto på --lag-marigold (lagfargen for mellomlag), --dw-w-cloudy og
     --dw-panel. De to siste er PETROL-FLATER: værfamiliens egen kommentar
     sier «KUN panelflaten», og --dw-panel er selve instrumentflaten.
     Flater ment å ligge BAK innhold, brukt som prikker OPPÅ et mørkt kort.

     Målt 2026-08-06: mot chip-flaten #382817 ga cotton (#1E3638) 1,11:1 og
     waterproof (#113B3E) 1,20:1. Prikkene for Bomull og Vanntett var
     usynlige. Ull var synlig — men den er tema-DELT, og i lyst tema er det
     ULL som forsvinner (1,62:1 mot krem). Alle tre var tema-blinde; hvilke
     som ryker avhenger av temaet, og revisjonen så bare mørkt.

     Begrunnelsen for lag-aligningen var god: prikken skulle si noe om hvor
     plagget hører hjemme i lagrekken. Men lagfargene er laget for å fylle
     store flater i antrekkskartet, ikke for 8 px prikker på et kort — og
     to av dem er ikke lagfarger i det hele tatt, bare petrol som lignet.

     --dw-mat-* veksler med temaet og skilles innbyrdes på HUE. Se
     hovedkommentaren i design-tokens-v2.css. */
  wool:            'var(--dw-mat-ull)',
  cotton:          'var(--dw-mat-bomull)',
  waterproof:      'var(--dw-mat-vanntett)',
  fontSerif:       'var(--font-serif)',
  fontSans:        'var(--dw-font-ui)',
} as const;

const styles = {
  main: {
    position: 'relative',
    minHeight: '100dvh',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'max(env(safe-area-inset-top, 0px), 54px)',
    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 18px)',
    fontFamily: TOKENS.fontSans,
    color: TOKENS.ink900,
    background: TOKENS.bgCanvas,
    overflow: 'hidden',
    WebkitTapHighlightColor: 'transparent',
  } satisfies CSSProperties,

  topbar: {
    flex: 'none',
    padding: 'var(--dw-space-4) var(--dw-space-18) var(--dw-space-10)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
  } satisfies CSSProperties,

  backBtn: {
    width: 44,
    height: 44,
    flex: 'none',
    borderRadius: 12,
    background: 'var(--dw-overlay)',
    border: `1px solid ${TOKENS.hairline}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: TOKENS.ink900,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  } satisfies CSSProperties,

  eyebrow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-2)',
    minWidth: 0,
  } satisfies CSSProperties,

  eyebrowMeta: {
    fontFamily: TOKENS.fontSerif,
    fontStyle: 'italic',
    fontSize: '0.8125rem',
    fontWeight: 400,
    color: TOKENS.ink500,
    letterSpacing: '.1px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  eyebrowDot: {
    display: 'inline-block',
    width: 3,
    height: 3,
    borderRadius: '50%',
    background: TOKENS.ink400,
    verticalAlign: 'middle',
    margin: '0 var(--dw-space-6)',
  } satisfies CSSProperties,

  topbarAction: {
    width: 44,
    height: 44,
    flex: 'none',
    borderRadius: 12,
    background: 'transparent',
    border: '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: TOKENS.ink700,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  } satisfies CSSProperties,

  display: {
    flex: 'none',
    padding: 'var(--dw-space-2) var(--dw-space-20) var(--dw-space-8)',
  } satisfies CSSProperties,

  displayH2: {
    fontFamily: TOKENS.fontSerif,
    fontWeight: 400,
    fontSize: 32,
    lineHeight: 1.05,
    letterSpacing: '-.5px',
    margin: 0,
    color: TOKENS.ink900,
  } satisfies CSSProperties,

  displayCount: {
    display: 'inline-block',
    marginLeft: 'var(--dw-space-8)',
    fontFamily: TOKENS.fontSans,
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: TOKENS.ink400,
    verticalAlign: 8,
    letterSpacing: '.2px',
  } satisfies CSSProperties,

  searchWrap: {
    flex: 'none',
    padding: 'var(--dw-space-8) var(--dw-space-16) var(--dw-space-6)',
  } satisfies CSSProperties,

  search: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-10)',
    padding: 'var(--dw-space-10) var(--dw-space-14)',
    borderRadius: 14,
    background: 'var(--dw-overlay)',
    border: `1px solid ${TOKENS.hairline}`,
    minHeight: 44,
  } satisfies CSSProperties,

  // `outline: none` sto her UTEN erstatning: en inline-stil slår enhver
  // stilarkregel, så den globale :focus-visible-ringen i design-tokens.css
  // (2px var(--dw-focus), offset 3px) ble aldri tegnet på søkefeltet.
  // Deklarasjonen er fjernet slik at den ekte ringen kommer fram.
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '0.90625rem',
    fontWeight: 500,
    color: TOKENS.ink900,
    fontFamily: TOKENS.fontSans,
    padding: 0,
    minWidth: 0,
  } satisfies CSSProperties,

  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--dw-space-4)',
    // 3px står utenfor 2-punktsskalaen og avrundes IKKE.
    padding: '3px var(--dw-space-6)',
    borderRadius: 6,
    background: 'var(--dw-hairline)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: TOKENS.ink500,
  } satisfies CSSProperties,

  filters: {
    flex: 'none',
    padding: 'var(--dw-space-8) 0 var(--dw-space-10)',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  } satisfies CSSProperties,

  filtersUl: {
    display: 'flex',
    gap: 'var(--dw-space-8)',
    padding: '0 var(--dw-space-16)',
    margin: 0,
    listStyle: 'none',
    width: 'max-content',
  } satisfies CSSProperties,

  groupHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-6)',
  } satisfies CSSProperties,

  groupHeadH3: {
    fontFamily: TOKENS.fontSans,
    fontWeight: 600,
    fontSize: '0.6875rem',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: TOKENS.ink500,
    margin: 0,
  } satisfies CSSProperties,

  groupCount: {
    fontFamily: TOKENS.fontSans,
    fontWeight: 500,
    fontSize: '0.6875rem',
    letterSpacing: '.4px',
    color: TOKENS.ink400,
  } satisfies CSSProperties,

  scroll: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    // Native-feel #10: pull-to-refresh / overscroll-contain — taktilt drag-feedback
    // uten å chaine scroll til body/parent.
    overscrollBehaviorY: 'contain',
    // FUNN 2026-08-05 (DoD fase 6A): --dw-tabbar-clearance ble brukt NULL
    // ganger i denne skjermen, så FAB-en og siste rad lå bak tab-baren.
    // Samme mønster som .hjem-monter og .app-shell > main allerede bruker.
    paddingBottom: 'var(--dw-tabbar-clearance)',
    // D4 (DoD): bunn-faden er nå en MASKE på selve scroll-flaten, ikke et
    // søskenelement malt i lerretsfargen. Den gamle .scrollFade la et
    // bgCanvas-gradientlokk over de nederste 96 px — den skjulte innholdet i
    // stedet for å tone det ut, og løgnen ble synlig i det øyeblikket noe
    // annet enn ren lerretsfarge lå bak. Formen er husets egen
    // (sheet.css:78, hjem-monter.css:892, kle-paa-stepper.css:164).
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
  } satisfies CSSProperties,

  // D2 (DoD): PLATEN ER GRIDET, IKKE CELLEN. Det hevede fyllet lå på hver
  // enkelt <li> (GarmentLi.liStyle) uten lyslogikk. Doktrinens svar er ikke å
  // gi tjue celler hver sin skygge — et rutenett av hairline-delte celler ER
  // én plate. Fyllet er derfor flyttet hit, og lyslogikken følger med:
  // inset topplys + dybde i samme box-shadow. Cellene bærer nå bare
  // hairline-delingene sine.
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    borderTop: '1px solid var(--dw-hairline)',
    background: 'var(--dw-raised)',
    boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
  } satisfies CSSProperties,

  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    /* FAB-EN LÅ OPPÅ TAB-BAREN OG DEKKET PLANLEGG-FANEN HELT.
       Målt 2026-08-06 (verify-tabbar-klaring, hviletilstand): 56 px
       overlapp, og pillen dekket Planlegg-fanens ikon og etikett.

       Scroll-flaten under fikk --dw-tabbar-clearance i fase 6A, men denne
       wrapperen er position: absolute — den ligger UTENFOR flyten og
       arver ingenting av den paddingen. Å fikse scrollen fikset derfor
       radene, ikke knappen. «Skjermen bruker tokenet» var sant og
       utilstrekkelig; det er PER ELEMENT det gjelder.

       max(safe-area, 20px) er avstand til skjermkanten. Tab-baren flyter
       over innholdet, så klaringen må være barens, ikke kantens. */
    bottom: 'var(--dw-tabbar-clearance, 90px)',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 var(--dw-space-20)',
    zIndex: 40,
    pointerEvents: 'none',
  } satisfies CSSProperties,

  // Granmynte-CTA-mønster (HjemScreen): 56px min-height, accent-cta/-ink,
  // shadow-cta-primary. FAB beholder pill-form (999px) fra mocken (kun
  // fargelag+høyde porteres, ikke layout/radius-formen).
  fab: {
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--dw-space-10)',
    minHeight: 56,
    padding: 'var(--dw-space-14) var(--dw-space-24) var(--dw-space-14) var(--dw-space-20)',
    borderRadius: 999,
    background: 'var(--dw-accent)',
    color: 'var(--dw-ink-on-accent)',
    fontFamily: TOKENS.fontSans,
    fontSize: '0.9375rem',
    fontWeight: 700,
    letterSpacing: '.1px',
    border: 0,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  } satisfies CSSProperties,

  /* FJERNET 2026-08-05 (DoD): scrollFade. Et absolutt plassert
     lerretsfarget gradientlokk over de nederste 96 px. Bunn-faden bor nå i
     styles.scroll som maskImage — samme signal, men den toner INNHOLDET ut i
     stedet for å male over det. */

  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
  } satisfies CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PlaggbibliotekScreen({
  onBack,
  onOpenCategory,
}: PlaggbibliotekScreenProps) {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();

  const [filter, setFilter] = useState<FilterKey>('alle');
  const [query, setQuery] = useState('');

  // ── PlaggDetailSheet state (samme mønster som PaakledningScreen) ──
  // Når en plagg-card tappes setter vi triggerRef til den klikkede knappen +
  // åpner sheet med plaggets GarmentId. Sheet håndterer focus-return selv.
  const [detailGarmentId, setDetailGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const garmentBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleCloseDetail = useCallback(() => {
    setDetailGarmentId(null);
  }, []);

  // Lightweight søk + filter: matcher mot title + materialLabel
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    return GROUPS.map((group) => {
      const items = group.items.filter((g) => {
        // Material-filter
        if (filter === 'ull' && g.material !== 'ull') return false;
        if (filter === 'bomull' && g.material !== 'bomull') return false;
        if (filter === 'vanntett' && g.material !== 'vanntett') return false;
        // Mellomlag-filter (gruppe-basert)
        if (filter === 'mellomlag' && group.id !== 'mellomlag') return false;
        // Sove/Vinter: nøkkelord-basert (fungerer nå mot hele katalogen)
        if (filter === 'sove' && !/sovepose|pyjamas|teppe|varmepose|sauekinn/.test(g.id)) return false;
        if (filter === 'vinter' && !/vinter|dun|balaklava|isolert|tykk|m-ull/.test(g.id)) return false;

        if (!q) return true;
        return (
          g.title.toLowerCase().includes(q) ||
          (g.materialLabel?.toLowerCase().includes(q) ?? false)
        );
      });
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [query, filter]);

  const handleBack = () => {
    void fire('light');
    onBack();
  };

  const handleSort = () => {
    void fire('selection');
  };

  const handleFilter = (key: FilterKey) => {
    if (key === filter) return;
    void fire('selection');
    setFilter(key);
  };

  const handleGarment = (groupId: string, garmentId: GarmentId) => {
    void fire('medium');
    // Pek triggerRef til den klikkede card-knappen så focus returnerer dit ved
    // close (PlaggDetailSheet kaller triggerRef.current?.focus()).
    const rowKey = `${groupId}:${garmentId}`;
    detailTriggerRef.current = garmentBtnRefs.current[rowKey] ?? null;
    // garment.id ER en GarmentId (fra GARMENTS_BY_CATEGORY).
    setDetailGarmentId(garmentId);
    // Behold legacy callback for App.tsx-konsumenter som lytter på category-ids
    onOpenCategory?.(rowKey);
  };

  const handleAddGarment = () => {
    void fire('medium');
    onOpenCategory?.('__add__');
  };

  return (
    <main style={styles.main} aria-labelledby="plaggbib-h1">
      <h1 id="plaggbib-h1" style={styles.srOnly}>Plaggbiblioteket</h1>

      {/* Top bar */}
      <div style={styles.topbar}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Tilbake"
          style={styles.backBtn}
          className="plaggbib-focus plaggbib-press"
        >
          <svg width="9" height="15" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 1L1 7l6 6" />
          </svg>
        </button>

        <div style={styles.eyebrow}>
          <span style={styles.eyebrowMeta}>
            <em>Hele katalogen</em>
            <span style={styles.eyebrowDot} aria-hidden="true" />
            <em>{TOTAL_COUNT} plagg</em>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSort}
          aria-label="Sorter"
          style={styles.topbarAction}
          className="plaggbib-focus plaggbib-press"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h13M3 12h9M3 18h5" />
            <path d="M18 9V3m0 0-3 3m3-3 3 3" />
          </svg>
        </button>
      </div>

      {/* Editorial display title */}
      <header style={styles.display}>
        <h2 style={styles.displayH2}>
          Plaggbiblioteket
          <span style={styles.displayCount}>{TOTAL_COUNT}</span>
        </h2>
      </header>

      {/* Search */}
      <div style={styles.searchWrap}>
        <div role="search" style={styles.search}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--dw-ink-low)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i plagg"
            aria-label="Søk i plagg"
            style={styles.searchInput}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
          />
          <span style={styles.kbd} aria-hidden="true">⌘K</span>
        </div>
      </div>

      {/* Filter chips (scroll-x) */}
      <nav style={styles.filters} aria-label="Filtrer plagg">
        <ul role="list" style={styles.filtersUl}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const swatchColor =
              f.mat === 'ull' ? TOKENS.wool :
              f.mat === 'bomull' ? TOKENS.cotton :
              f.mat === 'vanntett' ? TOKENS.waterproof : null;
            /* KANTEN ER BORTE.

               Her sto en egen kantfarge per materiale, hentet fra ENDA en
               familie: --dw-edge-light (monterlysets kjerne) for ull,
               --dw-w-rain og --dw-w-night (værscene-bakgrunner) for de to
               andre. Tre lån til, oppå de tre i TOKENS over.

               Kanten fantes fordi FYLLET var usynlig — en ring rundt en
               usynlig prikk gjør prikken synlig igjen. Det er en lapp på et
               symptom. Nå som fyllet er kalibrert (5,4–10,2:1 mot begge
               flater), er kanten overflødig, og uten den er prikken det den
               skal være: én farge som betyr ett materiale. */

            return (
              <li key={f.key} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  onClick={() => handleFilter(f.key)}
                  aria-pressed={isActive}
                  className="plaggbib-focus plaggbib-press"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--dw-space-6)',
                    // 7px/13px står utenfor 2-punktsskalaen og avrundes IKKE.
                    padding: '7px 13px',
                    borderRadius: 999,
                    background: isActive ? TOKENS.ink900 : 'var(--dw-overlay)',
                    border: `1px solid ${isActive ? TOKENS.ink900 : TOKENS.hairline}`,
                    color: isActive ? 'var(--dw-overlay)' : TOKENS.ink700,
                    fontFamily: TOKENS.fontSans,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    // Polish #10: hit-target-bump 32→44 (WCAG 2.5.5).
                    minHeight: 44,
                    whiteSpace: 'nowrap',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: reducedMotion
                      ? 'none'
                      : 'background var(--dw-m-feedback) var(--dw-ease), color var(--dw-m-feedback) var(--dw-ease), border-color var(--dw-m-feedback) var(--dw-ease)',
                  }}
                >
                  {swatchColor && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: swatchColor,
                        boxShadow: isActive ? '0 0 0 2px var(--dw-overlay)' : 'none',
                        flex: 'none',
                      }}
                    />
                  )}
                  {f.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Scroll-area: grupper + cards */}
      <div style={styles.scroll}>
        {visibleGroups.length === 0 ? (
          <p
            style={{
              fontSize: '0.875rem',
              color: TOKENS.ink500,
              textAlign: 'center',
              // 40px står utenfor skalaen (som stopper på 32) og avrundes IKKE.
              padding: '40px var(--dw-space-24)',
              margin: 0,
            }}
          >
            Fant ingen plagg{query ? ` som matcher «${query}»` : ''}.
          </p>
        ) : (
          visibleGroups.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div style={styles.groupHead}>
                <h3 id={`group-${group.id}`} style={styles.groupHeadH3}>{group.label}</h3>
                <span style={styles.groupCount}>{group.items.length} plagg</span>
              </div>
              <ul role="list" style={styles.grid} aria-label={group.label}>
                {group.items.map((g, idx) => {
                  const rowKey = `${group.id}:${g.id}`;
                  return (
                    <GarmentLi
                      key={g.id}
                      garment={g}
                      isRightCol={idx % 2 === 1}
                      reducedMotion={reducedMotion}
                      onSelect={() => handleGarment(group.id, g.id)}
                      buttonRef={(el) => {
                        garmentBtnRefs.current[rowKey] = el;
                      }}
                    />
                  );
                })}
              </ul>
            </section>
          ))
        )}

        {/* Bottom padding så siste rad ikke krasjer i FAB */}
        <div style={{ height: 120 }} aria-hidden="true" />
      </div>

      {/* FAB. Bunn-faden er ikke lenger et element her — den er maskImage på
          styles.scroll (se der). */}
      <div style={styles.fabWrap}>
        <button
          type="button"
          onClick={handleAddGarment}
          aria-label="Legg til nytt plagg"
          className="plaggbib-focus plaggbib-fab"
          style={styles.fab}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Legg til plagg</span>
        </button>
      </div>

      {/* Inline focus-visible + press + reduced-motion + scrollbar styles */}
      <style>{`
        .plaggbib-focus:focus { outline: none; }
        .plaggbib-focus:focus-visible {
          outline: 2px solid var(--dw-focus);
          outline-offset: 2px;
          border-radius: 12px;
        }
        .plaggbib-press { transition: background var(--dw-m-feedback) var(--dw-ease), transform var(--dw-m-feedback) var(--dw-ease); }
        .plaggbib-press:active { transform: scale(.96); }
        .plaggbib-fab { transition: transform var(--dw-m-feedback) var(--dw-ease), box-shadow var(--dw-m-feedback) var(--dw-ease); }
        .plaggbib-fab:active {
          transform: translateY(1px) scale(.985);
          box-shadow: var(--shadow-cta);
        }
        .plaggbib-fab:focus-visible {
          outline: 2px solid var(--dw-overlay);
          outline-offset: 3px;
          box-shadow: 0 0 0 4px var(--dw-accent), var(--shadow-cta-primary);
        }
        .plaggbib-card { transition: background var(--dw-m-feedback) var(--dw-ease); }
        .plaggbib-card:active { background: var(--dw-hairline); }
        .plaggbib-card:focus { outline: none; }
        .plaggbib-card:focus-visible {
          outline: 2px solid var(--dw-focus);
          outline-offset: -3px;
          border-radius: 4px;
        }
        .plaggbib-scroll-x::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .plaggbib-press, .plaggbib-fab, .plaggbib-card { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* ── Plagg-detalj (F62 PlaggDetailSheet) ──
          Søsken-overlay. Lukk → focus returnerer til klikket card-knapp via
          triggerRef. Håndterer ESC, backdrop-click og prefers-reduced-motion. */}
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

export default PlaggbibliotekScreen;

// ─────────────────────────────────────────────────────────────────────────────
// GarmentLi (intern — hairline-grid celle med card)
// ─────────────────────────────────────────────────────────────────────────────

interface GarmentLiProps {
  garment: Garment;
  isRightCol: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

function GarmentLi({ garment, isRightCol, reducedMotion, onSelect, buttonRef }: GarmentLiProps) {
  // Bilde faller tilbake til generisk SVG ved 404 (ingen emoji — konsistent
  // med PlaggDetailSheet). garmentPng gir alltid en sti.
  const [imgSrc, setImgSrc] = useState(garment.image);

  // Grid-kort-kontrakt: var(--dw-hairline)-delinger (a11y-preclearance).
  // Det hevede fyllet er IKKE her lenger — det bor på styles.grid, som er den
  // ene platen cellene deler. En celle uten eget fyll kan ikke være en hevet
  // flate uten lyslogikk (D2), og hairline-delingen leser fortsatt likt fordi
  // platen ligger rett bak.
  const liStyle: CSSProperties = {
    borderRight: isRightCol ? 0 : '1px solid var(--dw-hairline)',
    borderBottom: '1px solid var(--dw-hairline)',
    listStyle: 'none',
  };

  const matDotColor =
    garment.material === 'ull' ? TOKENS.wool :
    garment.material === 'bomull' ? TOKENS.cotton :
    garment.material === 'vanntett' ? TOKENS.waterproof :
    TOKENS.ink300; // mix / ukjent → nøytral

  return (
    <li style={liStyle}>
      <button
        type="button"
        ref={buttonRef}
        onClick={onSelect}
        className="plaggbib-card"
        aria-label={`Vis detalj for ${garment.title}${garment.materialLabel ? ` — ${garment.materialLabel}` : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: 'var(--dw-space-12) var(--dw-space-12) var(--dw-space-14)',
          background: 'transparent',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: TOKENS.fontSans,
          color: 'inherit',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: reducedMotion ? 'none' : undefined,
        }}
      >
        {/* Title (full bredde — ingen oppdiktet TOG-pill) */}
        <p
          style={{
            fontFamily: TOKENS.fontSans,
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: '-.1px',
            color: TOKENS.ink900,
            margin: 0,
            minHeight: 34,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {garment.title}
        </p>

        {/* Thumbnail */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            margin: 'var(--dw-space-10) 0 var(--dw-space-12)',
            borderRadius: 14,
            background:
              'radial-gradient(120% 80% at 50% 18%, var(--dw-overlay), color-mix(in srgb, var(--dw-overlay) 0%, transparent) 70%), linear-gradient(180deg, var(--dw-raised) 0%, var(--dw-raised) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            border: `1px solid ${TOKENS.hairline}`,
          }}
        >
          <img
            src={imgSrc}
            alt=""
            onError={() => {
              if (imgSrc !== GENERIC_GARMENT_SVG) setImgSrc(GENERIC_GARMENT_SVG);
            }}
            style={{
              width: '78%',
              height: '78%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Card meta — materiale kun når det er tydelig utledet */}
        {garment.materialLabel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dw-space-6)',
              fontFamily: TOKENS.fontSans,
              fontSize: '0.75rem',
              fontWeight: 500,
              color: TOKENS.ink500,
              letterSpacing: '.1px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: matDotColor,
                flex: 'none',
              }}
            />
            <span>{garment.materialLabel}</span>
          </div>
        )}
      </button>
    </li>
  );
}
