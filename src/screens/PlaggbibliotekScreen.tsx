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
 *  - focus-visible ring (var(--focus-ring, var(--accent-cta)), 2px, offset 2px)
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
// hardkodet mock-delmengde. Navn fra dbStringFor, bilder fra garmentPng.
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
  bgCanvas:        'var(--bg-canvas)',
  bgElevated:      'var(--surface)',
  bgRowAlt:        'var(--surface-soft)',
  ink900:          'var(--ink-900)',
  ink700:          'var(--ink-700)',
  ink500:          'var(--ink-500)',
  ink400:          'var(--ink-400)',
  ink300:          'var(--ink-300)',
  hairline:        'var(--ink-100)',
  hairlineStrong:  'var(--ink-200)',
  // Granmynte CTA-grønn (FAB) — samme mønster som HjemScreen-CTA-en.
  orange700:       'var(--chip-edge-korall)',
  orange600:       'var(--accent-cta)',
  orange500:       'var(--accent-cta)',
  orange200:       'var(--terracotta-200)',
  orange50:        'var(--terracotta-100)',
  // Material-swatches → lag-alignerte tokens (ull=marigold/mellomlag, bomull=petrolgrå-nøytral, vanntett=dyppetrol/ytterst)
  wool:            'var(--lag-marigold)',
  cotton:          'var(--lag-petrolgra)',
  waterproof:      'var(--lag-dyppetrol)',
  fontSerif:       'var(--font-serif)',
  fontSans:        'var(--font-sans)',
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
    padding: '4px 18px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } satisfies CSSProperties,

  backBtn: {
    width: 44,
    height: 44,
    flex: 'none',
    borderRadius: 12,
    background: 'var(--surface-pure)',
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
    gap: 2,
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
    margin: '0 6px',
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
    padding: '2px 20px 8px',
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
    marginLeft: 8,
    fontFamily: TOKENS.fontSans,
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: TOKENS.ink400,
    verticalAlign: 8,
    letterSpacing: '.2px',
  } satisfies CSSProperties,

  searchWrap: {
    flex: 'none',
    padding: '8px 16px 6px',
  } satisfies CSSProperties,

  search: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 14,
    background: 'var(--surface-pure)',
    border: `1px solid ${TOKENS.hairline}`,
    minHeight: 44,
  } satisfies CSSProperties,

  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
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
    gap: 4,
    padding: '3px 6px',
    borderRadius: 6,
    background: 'var(--ink-100)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: TOKENS.ink500,
  } satisfies CSSProperties,

  filters: {
    flex: 'none',
    padding: '8px 0 10px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  } satisfies CSSProperties,

  filtersUl: {
    display: 'flex',
    gap: 8,
    padding: '0 16px',
    margin: 0,
    listStyle: 'none',
    width: 'max-content',
  } satisfies CSSProperties,

  groupHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '14px 18px 6px',
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
  } satisfies CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    borderTop: '1px solid var(--ink-200)',
  } satisfies CSSProperties,

  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 20px',
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
    gap: 10,
    minHeight: 56,
    padding: '14px 24px 14px 20px',
    borderRadius: 999,
    background: 'var(--accent-cta)',
    color: 'var(--accent-cta-ink)',
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

  scrollFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
    height: 96,
    pointerEvents: 'none',
    background: `linear-gradient(180deg, color-mix(in srgb, ${TOKENS.bgCanvas} 0%, transparent) 0%, ${TOKENS.bgCanvas} 70%)`,
    zIndex: 30,
  } satisfies CSSProperties,

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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            // Chip-edge-token følger samme lag-aligning som swatch-fargen
            // (ull=marigold, bomull=petrolgrå, vanntett=dyppetrol).
            const swatchEdge =
              f.mat === 'ull' ? 'var(--chip-edge-marigold)' :
              f.mat === 'bomull' ? 'var(--chip-edge-petrolgra)' :
              f.mat === 'vanntett' ? 'var(--chip-edge-dyppetrol)' : null;

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
                    gap: 6,
                    padding: '7px 13px',
                    borderRadius: 999,
                    background: isActive ? TOKENS.ink900 : 'var(--surface-pure)',
                    border: `1px solid ${isActive ? TOKENS.ink900 : TOKENS.hairline}`,
                    color: isActive ? 'var(--surface-pure)' : TOKENS.ink700,
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
                      : 'background 120ms cubic-bezier(0.32,0.72,0,1), color 120ms cubic-bezier(0.32,0.72,0,1), border-color 120ms cubic-bezier(0.32,0.72,0,1)',
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
                        border: swatchEdge ? `1px solid ${swatchEdge}` : undefined,
                        boxShadow: isActive ? '0 0 0 2px var(--surface-pure)' : 'none',
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
              padding: '40px 24px',
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

      {/* Fade-mask + FAB */}
      <div style={styles.scrollFade} aria-hidden="true" />
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
          outline: 2px solid var(--focus-ring, var(--accent-cta));
          outline-offset: 2px;
          border-radius: 12px;
        }
        .plaggbib-press { transition: background 120ms cubic-bezier(0.32,0.72,0,1), transform 120ms cubic-bezier(0.32,0.72,0,1); }
        .plaggbib-press:active { transform: scale(.96); }
        .plaggbib-fab { transition: transform 140ms cubic-bezier(0.32,0.72,0,1), box-shadow 140ms cubic-bezier(0.32,0.72,0,1); }
        .plaggbib-fab:active {
          transform: translateY(1px) scale(.985);
          box-shadow: var(--shadow-cta);
        }
        .plaggbib-fab:focus-visible {
          outline: 2px solid var(--surface-pure);
          outline-offset: 3px;
          box-shadow: 0 0 0 4px var(--accent-cta), var(--shadow-cta-primary);
        }
        .plaggbib-card { transition: background 120ms cubic-bezier(0.32,0.72,0,1); }
        .plaggbib-card:active { background: var(--ink-100); }
        .plaggbib-card:focus { outline: none; }
        .plaggbib-card:focus-visible {
          outline: 2px solid var(--focus-ring, var(--accent-cta));
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

  // Grid-kort-kontrakt: var(--surface) + var(--ink-200)-border (a11y-preclearance).
  const liStyle: CSSProperties = {
    borderRight: isRightCol ? 0 : '1px solid var(--ink-200)',
    borderBottom: '1px solid var(--ink-200)',
    background: 'var(--surface)',
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
          padding: '12px 12px 14px',
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
            margin: '10px 0 12px',
            borderRadius: 14,
            background:
              'radial-gradient(120% 80% at 50% 18%, var(--surface-pure), color-mix(in srgb, var(--surface-pure) 0%, transparent) 70%), linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%)',
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
              gap: 6,
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
