/**
 * MinGarderobeScreen — Skjerm 7 · Min garderobe (Mock A port)
 *
 * Design: public/garderobe-mock-a/index.html (Whering-inspirert kompakt liste)
 * Beholdt motor: useHapticSystem, useNativeSettings, props-signatur, A11y.
 *
 * A11y:
 *  - Semantic HTML: <main>, <header>, <h1>, <h2>, <h3>, <ul role="list">, <button>
 *  - 44px min touch-target på header-knapper og FAB
 *  - aria-label på icon-only back/FAB
 *  - aria-pressed på rader (har/mangler)
 *  - role=tablist på filter-chips + aria-selected
 *  - prefers-reduced-motion respektert
 *  - safe-area-inset for FAB-plassering
 */

import { useState, useCallback, useMemo, useRef, type CSSProperties } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import { GENERIC_GARMENT_SVG, dbStringFor, garmentPng, type GarmentId } from '../data/garment-illustrations';
import { CATEGORY_LABEL, CATEGORY_ORDER, GARMENTS_BY_CATEGORY } from '../data/garment-category';
import { titleFor, materialFor } from '../data/garment-catalog-helpers';
import { useChildren } from '../state/children-store';
import { dobToAgeMonths, formatAgeMonths } from '../lib/utils/dob-to-age-months';
import { isOwned, toggleOwnership } from '../lib/garments/ownership';
import { useAccess } from '../lib/premium/use-access';
import { PaywallDialog } from '../components/PaywallDialog';

export interface MinGarderobeScreenProps {
  onBack: () => void;
}

type FilterKey = 'alle' | 'har' | 'mangler';

interface GarmentItem {
  /** Kebab-case GarmentId — brukes til bilde + PlaggDetailSheet. */
  id: GarmentId;
  /** Norsk db-streng (dbStringFor) — brukes som eierskaps-nøkkel (samme
   *  format som ownership-override.ts leser fra recommend()-output). */
  dbName: string;
  name: string;
  meta: string | null;
  image: string;
}

interface GarmentGroup {
  key: string;
  label: string;
  items: GarmentItem[];
}

// F85 (Sivert: «Alle plagg i plaggbibliotek må komme opp i mine plagg»):
// samme katalog-kilde (GARMENTS_BY_CATEGORY, 62 plagg) og samme gruppering
// som PlaggbibliotekScreen — tidligere var dette 12 hardkodede mock-plagg
// med oppdiktet «owned»-status som ALDRI påvirket motoren (ownership-
// override.ts leser fra ownership.ts sin localStorage-map, ikke fra denne
// skjermens lokale state).
const GROUPS: ReadonlyArray<GarmentGroup> = CATEGORY_ORDER.map((cat) => ({
  key: cat,
  label: CATEGORY_LABEL[cat],
  items: GARMENTS_BY_CATEGORY[cat].map((id): GarmentItem => {
    const dbName = dbStringFor(id);
    const mat = materialFor(id);
    return {
      id,
      dbName,
      name: titleFor(id),
      meta: mat?.label ?? null,
      image: garmentPng(id),
    };
  }),
}));

// ===================== TOKENS =====================
// Dark-mode safe: bruker CSS-variabler fra design-tokens.css så dark-tema
// kan overstyre via @media (prefers-color-scheme: dark) / [data-theme="dark"].
const TOKENS = {
  warmGrey: 'var(--bg-canvas)',
  warmGreySoft: 'var(--bg-canvas-warm)',
  ink900: 'var(--ink-900)',
  ink700: 'var(--ink-700)',
  ink500: 'var(--ink-500)',
  ink400: 'var(--ink-400)',
  ink300: 'var(--ink-300)',
  // Granmynte-CTA (FAB) — samme mønster som HjemScreen, ikke legacy warm-orange-alias.
  orange: 'var(--accent-cta)',
  orangeInk: 'var(--accent-cta-ink)',
  orangeDeep: 'var(--chip-edge-korall)',
  orangeSoft: 'var(--terracotta-100)',
  orangeRing: 'var(--terracotta-200)',
  hairline: 'var(--ink-100)',
  card: 'var(--surface-pure)',
  fontSerif: 'var(--font-serif)',
  fontSans: 'var(--font-sans)',
  shadowFab: 'var(--shadow-cta-primary)',
  shadowCard: 'var(--shadow-2)',
};

// ===================== STYLES =====================
const screenStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: TOKENS.fontSans,
  color: TOKENS.ink900,
  background: `radial-gradient(140% 50% at 50% -10%, var(--avatar-glow), transparent 55%), linear-gradient(180deg, ${TOKENS.warmGreySoft} 0%, ${TOKENS.warmGrey} 100%)`,
  // F83: max()-gulv — WKWebView rapporterer env()≈0 (HjemScreen F80.3-mønster).
  paddingTop: 'max(50px, calc(env(safe-area-inset-top, 0px) + 8px))',
};

const headerStyle: CSSProperties = {
  flex: 'none',
  padding: '8px 20px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  marginLeft: -10,
  padding: 0,
};

const backBtnVisualStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: 'var(--surface-pure)',
  border: '1px solid var(--ink-100)',
  display: 'grid',
  placeItems: 'center',
  color: TOKENS.ink900,
};

const titleBlockStyle: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  transform: 'translateX(-12px)',
};

const titleLabelStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: '0.6875rem',
  fontStyle: 'italic',
  color: TOKENS.ink500,
  letterSpacing: '.4px',
  margin: '0 0 -2px',
};

const titleHeadingStyle: CSSProperties = {
  fontFamily: TOKENS.fontSans,
  fontSize: '1.1875rem',
  fontWeight: 700,
  letterSpacing: '-.3px',
  color: TOKENS.ink900,
  margin: 0,
};

const headerSpacerStyle: CSSProperties = {
  width: 44,
};

const childCardStyle: CSSProperties = {
  flex: 'none',
  margin: '0 20px 16px',
  background: TOKENS.card,
  borderRadius: 22,
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  border: '1px solid var(--ink-100)',
  boxShadow: TOKENS.shadowCard,
};

const avatarStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 999,
  background: 'linear-gradient(160deg, var(--terracotta-100), var(--terracotta-200))',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  flex: 'none',
  fontSize: 28,
};

const childMetaStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const childNameStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: '1.1875rem',
  lineHeight: 1,
  margin: '0 0 4px',
  color: TOKENS.ink900,
};

const childSubStyle: CSSProperties = {
  fontSize: '0.78125rem',
  color: TOKENS.ink700,
  margin: 0,
  fontWeight: 500,
};

const statStyle: CSSProperties = {
  flex: 'none',
  textAlign: 'right',
  paddingLeft: 8,
  borderLeft: `1px solid ${TOKENS.hairline}`,
};

const statNumStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: '1.375rem',
  lineHeight: 1,
  color: TOKENS.ink900,
  display: 'block',
};

const statLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.65625rem',
  color: TOKENS.ink400,
  letterSpacing: '.9px',
  textTransform: 'uppercase',
  marginTop: 4,
  fontWeight: 600,
};

// F81.5-W2 (Flate 3) — diskret rad/hint for garderobe-tilpasning. Vises kun
// for ikke-Premium. "Pluss"-chip er aria-hidden — meningen ligger i CTA-ens
// aria-label + i selve teksten ved siden av (aldri kun i chippen).
const tilpasningHintStyle: CSSProperties = {
  flex: 'none',
  margin: '0 20px 14px',
  padding: '12px 14px',
  borderRadius: 16,
  background: 'var(--surface)',
  border: '1px solid var(--ink-100)',
  boxShadow: TOKENS.shadowCard,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const tilpasningHintChipStyle: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  borderRadius: 999,
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  color: TOKENS.orangeInk,
  background: TOKENS.orange,
};

const tilpasningHintTextStyle: CSSProperties = {
  flex: 1,
  minWidth: '55%',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: TOKENS.ink700,
  lineHeight: 1.35,
};

const tilpasningHintBtnStyle: CSSProperties = {
  flex: 'none',
  minHeight: 40,
  padding: '9px 14px',
  borderRadius: 999,
  border: 'none',
  background: TOKENS.orange,
  color: TOKENS.orangeInk,
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  fontWeight: 700,
  letterSpacing: '-0.05px',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const chipsRowStyle: CSSProperties = {
  flex: 'none',
  padding: '0 20px 10px',
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
};

function chipStyle(active: boolean): CSSProperties {
  return {
    flex: 'none',
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: active ? 'var(--surface-pure)' : TOKENS.ink700,
    background: active ? TOKENS.ink900 : 'var(--surface)',
    border: active ? `1px solid ${TOKENS.ink900}` : '1px solid var(--ink-100)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  };
}

function chipCountStyle(active: boolean): CSSProperties {
  return {
    color: active ? 'var(--ink-300)' : TOKENS.ink400,
    marginLeft: 5,
    fontWeight: 500,
  };
}

const scrollStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '4px 20px max(env(safe-area-inset-bottom, 0px), 110px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  scrollBehavior: 'smooth',
};

const groupEyebrowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: '0 4px 8px',
};

const groupEyebrowLabelStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: TOKENS.ink500,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  margin: 0,
};

const groupEyebrowMetaStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontStyle: 'italic',
  fontSize: '0.75rem',
  color: TOKENS.ink400,
};

const groupListStyle: CSSProperties = {
  background: 'var(--surface)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: 18,
  border: '1px solid var(--ink-100)',
  boxShadow: TOKENS.shadowCard,
  overflow: 'hidden',
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function rowBtnStyle(active: boolean, reducedMotion: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    minHeight: 60,
    background: active ? 'var(--ink-100)' : 'transparent',
    border: 0,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    transition: reducedMotion ? 'none' : 'background 100ms ease',
  };
}

function thumbStyle(missing: boolean): CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: missing ? TOKENS.warmGrey : TOKENS.warmGreySoft,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    flex: 'none',
    border: '1px solid var(--ink-100)',
    opacity: missing ? 0.55 : 1,
    fontSize: '1.375rem',
  };
}

const rowTextWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const rowTitleStyle: CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: TOKENS.ink900,
  lineHeight: 1.2,
};

const rowMetaStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontStyle: 'italic',
  fontSize: '0.75rem',
  color: TOKENS.ink700,
  marginTop: 2,
  lineHeight: 1,
};

const pillBaseStyle: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  height: 26,
  padding: '0 10px',
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '.1px',
};

const pillHarStyle: CSSProperties = {
  ...pillBaseStyle,
  background: 'var(--ink-100)',
  color: TOKENS.ink700,
};

const pillManglerStyle: CSSProperties = {
  ...pillBaseStyle,
  background: TOKENS.orangeSoft,
  color: TOKENS.orangeDeep,
};

const dividerStyle: CSSProperties = {
  height: 1,
  margin: '0 14px 0 70px',
  background: TOKENS.hairline,
  listStyle: 'none',
};

const infoBtnStyle: CSSProperties = {
  flex: 'none',
  width: 44,
  height: 44,
  marginLeft: 4,
  marginRight: -6,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  color: TOKENS.ink500,
  padding: 0,
  borderRadius: 12,
};

function fabStyle(pressed: boolean, reducedMotion: boolean): CSSProperties {
  return {
    position: 'absolute',
    bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 999,
    background: TOKENS.orange,
    border: 0,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    boxShadow: TOKENS.shadowFab,
    color: TOKENS.orangeInk,
    zIndex: 10,
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion ? 'none' : 'transform 120ms ease',
    transform: pressed && !reducedMotion ? 'scale(.96)' : 'scale(1)',
    padding: 0,
  };
}

// ===================== ICONS =====================
function BackIcon() {
  return (
    <svg
      width="9"
      height="15"
      viewBox="0 0 8 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 1L1 7l6 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

// ===================== ROW =====================
interface GarmentRowProps {
  item: GarmentItem;
  owned: boolean;
  onToggle: (item: GarmentItem) => void;
  onShowDetail: (item: GarmentItem, btn: HTMLButtonElement) => void;
  reducedMotion: boolean;
}

function GarmentRow({ item, owned, onToggle, onShowDetail, reducedMotion }: GarmentRowProps) {
  const [active, setActive] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.image);
  const infoBtnRef = useRef<HTMLButtonElement | null>(null);
  const statusLabel = owned ? 'Har' : 'Mangler';
  return (
    <li role="listitem" style={{ listStyle: 'none', display: 'flex', alignItems: 'stretch' }}>
      <button
        type="button"
        onClick={() => onToggle(item)}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onBlur={() => setActive(false)}
        aria-pressed={owned}
        aria-label={`${item.name}${item.meta ? `, ${item.meta}` : ''}. Status: ${statusLabel}. Trykk for å endre.`}
        style={{ ...rowBtnStyle(active, reducedMotion), flex: 1 }}
      >
        <span style={thumbStyle(!owned)} aria-hidden="true">
          <img
            src={imgSrc}
            alt=""
            style={{ width: '78%', height: '78%', objectFit: 'contain', opacity: owned ? 1 : 0.5 }}
            onError={() => {
              if (imgSrc !== GENERIC_GARMENT_SVG) setImgSrc(GENERIC_GARMENT_SVG);
            }}
          />
        </span>
        <span style={rowTextWrapStyle}>
          <span style={rowTitleStyle}>{item.name}</span>
          {item.meta ? <span style={rowMetaStyle}>{item.meta}</span> : null}
        </span>
        <span style={owned ? pillHarStyle : pillManglerStyle} aria-hidden="true">
          {owned && <CheckIcon />}
          {statusLabel}
        </span>
      </button>
      <button
        ref={infoBtnRef}
        type="button"
        onClick={() => {
          if (infoBtnRef.current) onShowDetail(item, infoBtnRef.current);
        }}
        aria-label={`Vis detalj for ${item.name}`}
        style={{ ...infoBtnStyle, alignSelf: 'center' }}
      >
        <InfoIcon />
      </button>
    </li>
  );
}

// ===================== MAIN SCREEN =====================
export function MinGarderobeScreen({ onBack }: MinGarderobeScreenProps) {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const { active } = useChildren();
  const [filter, setFilter] = useState<FilterKey>('alle');
  const [fabPressed, setFabPressed] = useState(false);

  // F85: eierskap leses fra DEN EKTE storen (ownership.ts → localStorage,
  // samme kilde ownership-override.ts bruker til å tilpasse motor-
  // anbefalingen). `refreshTick` tvinger re-derivering av ownedMap etter
  // hver toggle (isOwned() leser localStorage direkte, ikke React-state).
  const [refreshTick, setRefreshTick] = useState(0);
  const ownedMap = useMemo(() => {
    const map = new Map<GarmentId, boolean>();
    for (const group of GROUPS) {
      for (const item of group.items) {
        map.set(item.id, isOwned(active.id, item.dbName));
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.id, refreshTick]);

  /* ── Detalj-sheet state (F62 PlaggDetailSheet) ── */
  const [openGarmentId, setOpenGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

  /* ── F81.5-W2 (Flate 3): garderobe-tilpasning-hint + paywall ──
     Registrering av plagg (toggle over/under) forblir helt fri (F81.1).
     Selve TILPASNINGEN av anbefalingen (buildOwnershipOverrides) er gatet
     bak isPremium i selve substitusjons-kallet (ownership-override.ts) —
     denne raden er kun opplysning + CTA for ikke-Premium. */
  const { isPremium } = useAccess();
  const tilpasningCtaRef = useRef<HTMLButtonElement | null>(null);
  const [tilpasningPaywallOpen, setTilpasningPaywallOpen] = useState(false);
  // Fanget i klikk-handleren (aldri under render — react-hooks/refs) og gitt
  // videre som PaywallDialog sin returnFocusTo (samme mønster som UkeScreen).
  const [tilpasningPaywallReturnFocusTo, setTilpasningPaywallReturnFocusTo] =
    useState<HTMLElement | null>(null);

  const handleOpenTilpasningPaywall = useCallback(() => {
    void fire('light');
    setTilpasningPaywallReturnFocusTo(tilpasningCtaRef.current);
    setTilpasningPaywallOpen(true);
  }, [fire]);

  const handleShowDetail = useCallback(
    (item: GarmentItem, btn: HTMLButtonElement) => {
      void fire('light');
      detailTriggerRef.current = btn;
      setOpenGarmentId(item.id);
    },
    [fire],
  );

  const handleCloseDetail = useCallback(() => {
    setOpenGarmentId(null);
  }, []);

  const totalCount = useMemo(() => GROUPS.reduce((n, g) => n + g.items.length, 0), []);
  const haveCount = useMemo(() => {
    let have = 0;
    for (const [, owned] of ownedMap) if (owned) have += 1;
    return have;
  }, [ownedMap]);
  const missingCount = totalCount - haveCount;

  const filteredGroups = useMemo<ReadonlyArray<GarmentGroup>>(() => {
    if (filter === 'alle') return GROUPS;
    return GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          const owned = ownedMap.get(it.id) ?? true;
          return filter === 'har' ? owned : !owned;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [filter, ownedMap]);

  const handleBack = useCallback(() => {
    void fire('light');
    onBack();
  }, [fire, onBack]);

  const handleAdd = useCallback(() => {
    void fire('medium');
    // Hook for fremtidig add-flow (åpne sheet for nytt plagg). Stub for nå.
  }, [fire]);

  const handleToggle = useCallback(
    (item: GarmentItem) => {
      void fire('selection');
      toggleOwnership(active.id, item.dbName, isPremium);
      setRefreshTick((t) => t + 1);
    },
    [fire, active.id, isPremium],
  );

  const handleFilter = useCallback(
    (key: FilterKey) => {
      void fire('selection');
      setFilter(key);
    },
    [fire],
  );

  return (
    <main style={screenStyle} aria-labelledby="garderobe-title">
      <h1 id="garderobe-title" className="sr-only">
        Min garderobe for {active.name || 'barnet'}
      </h1>

      {/* HEADER */}
      <header style={headerStyle}>
        <button type="button" onClick={handleBack} aria-label="Tilbake" style={backBtnStyle}>
          <span style={backBtnVisualStyle} aria-hidden="true">
            <BackIcon />
          </span>
        </button>
        <div style={titleBlockStyle}>
          <p style={titleLabelStyle}>Garderobe</p>
          <h2 style={titleHeadingStyle}>Min garderobe</h2>
        </div>
        <div style={headerSpacerStyle} aria-hidden="true" />
      </header>

      {/* CHILD-CARD */}
      <section style={childCardStyle} aria-label="Aktivt barn og total-antall">
        <div style={avatarStyle} aria-hidden="true">
          <span>👶</span>
        </div>
        <div style={childMetaStyle}>
          <p style={childNameStyle}>{active.name || 'Barnet'}</p>
          <p style={childSubStyle}>{formatAgeMonths(dobToAgeMonths(active.dob))}</p>
        </div>
        <div style={statStyle} aria-label={`${haveCount} av ${totalCount} plagg registrert`}>
          <span style={statNumStyle}>
            {haveCount}
            <span style={{ color: TOKENS.ink300, fontSize: '0.875rem' }}>/{totalCount}</span>
          </span>
          <span style={statLabelStyle}>Plagg</span>
        </div>
      </section>

      {/* F81.5-W2 (Flate 3): diskret garderobe-tilpasning-hint — kun ikke-Premium. */}
      {!isPremium && (
        <div style={tilpasningHintStyle}>
          <span aria-hidden="true" style={tilpasningHintChipStyle}>Pluss</span>
          <span style={tilpasningHintTextStyle}>
            Med Babyora Pluss brukes plaggene dine i anbefalingen
          </span>
          <button
            ref={tilpasningCtaRef}
            type="button"
            onClick={handleOpenTilpasningPaywall}
            aria-haspopup="dialog"
            aria-label="Med Babyora Pluss brukes plaggene dine i anbefalingen — prøv 7 dager gratis"
            style={tilpasningHintBtnStyle}
          >
            Prøv 7 dager gratis
          </button>
        </div>
      )}

      {/* FILTER CHIPS */}
      <div style={chipsRowStyle} role="tablist" aria-label="Filter">
        <button
          type="button"
          style={chipStyle(filter === 'alle')}
          role="tab"
          aria-selected={filter === 'alle'}
          onClick={() => handleFilter('alle')}
        >
          Alle <span style={chipCountStyle(filter === 'alle')}>{totalCount}</span>
        </button>
        <button
          type="button"
          style={chipStyle(filter === 'har')}
          role="tab"
          aria-selected={filter === 'har'}
          onClick={() => handleFilter('har')}
        >
          Har <span style={chipCountStyle(filter === 'har')}>{haveCount}</span>
        </button>
        <button
          type="button"
          style={chipStyle(filter === 'mangler')}
          role="tab"
          aria-selected={filter === 'mangler'}
          onClick={() => handleFilter('mangler')}
        >
          Mangler <span style={chipCountStyle(filter === 'mangler')}>{missingCount}</span>
        </button>
      </div>

      {/* SCROLL — gruppert liste */}
      <div style={scrollStyle} role="region" aria-label="Garderobe gruppert per lag">
        {filteredGroups.map((group) => {
          const groupHaveCount = group.items.filter((it) => ownedMap.get(it.id) ?? true).length;
          return (
            <section key={group.key} aria-labelledby={`grp-${group.key}`}>
              <div style={groupEyebrowStyle}>
                <h3 id={`grp-${group.key}`} style={groupEyebrowLabelStyle}>
                  {group.label}
                </h3>
                <span style={groupEyebrowMetaStyle}>
                  {groupHaveCount} av {group.items.length}
                </span>
              </div>
              <ul role="list" style={groupListStyle}>
                {group.items.flatMap((item, idx) => {
                  const nodes = [
                    <GarmentRow
                      key={item.id}
                      item={item}
                      owned={ownedMap.get(item.id) ?? true}
                      onToggle={handleToggle}
                      onShowDetail={handleShowDetail}
                      reducedMotion={reducedMotion}
                    />,
                  ];
                  if (idx < group.items.length - 1) {
                    nodes.push(
                      <li
                        key={`${item.id}-divider`}
                        aria-hidden="true"
                        style={dividerStyle}
                      />,
                    );
                  }
                  return nodes;
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={handleAdd}
        onPointerDown={() => setFabPressed(true)}
        onPointerUp={() => setFabPressed(false)}
        onPointerLeave={() => setFabPressed(false)}
        onPointerCancel={() => setFabPressed(false)}
        onBlur={() => setFabPressed(false)}
        aria-label="Legg til nytt plagg"
        style={fabStyle(fabPressed, reducedMotion)}
      >
        <PlusIcon />
      </button>

      {/* ── Plagg-detalj (F62 PlaggDetailSheet) ──
          Åpnes over skjermen. Lukk → focus returnerer til info-knapp via triggerRef. */}
      {openGarmentId && (
        <PlaggDetailSheet
          garmentId={openGarmentId}
          isOpen={openGarmentId !== null}
          onClose={handleCloseDetail}
          triggerRef={detailTriggerRef}
        />
      )}

      {/* Paywall-modal for garderobe-tilpasning (F81.5-W2, Flate 3) */}
      <PaywallDialog
        open={tilpasningPaywallOpen}
        trigger="garderobe_tilpasning"
        onClose={() => setTilpasningPaywallOpen(false)}
        returnFocusTo={tilpasningPaywallReturnFocusTo}
      />
    </main>
  );
}

export default MinGarderobeScreen;
