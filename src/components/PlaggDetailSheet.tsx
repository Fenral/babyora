/**
 * PlaggDetailSheet — modal bottom-sheet med plagg-detalj, fordeler/ulemper og
 * informative katalogalternativer.
 *
 * Bruker native <dialog> for innebygd focus-trap og a11y-modal-håndtering.
 * Focus returneres til `triggerRef` etter lukking. ESC, backdrop-click og
 * X-knapp lukker arket.
 *
 * Data-kilder:
 *   - infoFor(id)            → { what, when }
 *   - getAlternatives(id)    → { pros, cons, alternatives[] }  (primær item)
 *   - garmentPng(id)         → PNG-sti (hero + thumb)
 *
 * P6 (Plaggbibliotek-tilgang): valgfri `onOpenLibrary`-affordance nederst i
 * arket — "Se alternativer i biblioteket" — som åpner Plaggbibliotek-drillen
 * (App.tsx {kind:'plaggbib'}, forberedt av P1 uten en opener). Prop er
 * OPTIONAL og bakoverkompatibel: uten den vises ingen knapp (eksisterende
 * kallsteder uendret). Kun HjemMonter sin "Bytt"-rad kobler den til i P6 —
 * se docs/design-notes/sol-duel-2026-07-31.md §12 for hvor det fulle
 * Bytt-arket (med konsekvensetiketter) etter hvert skal leve; dette er
 * kun første-versjons-lenken til biblioteket, IKKE selve valg-handlingen
 * (se warm-cold-recovery.test.ts — denne sheeten skal aldri gjøre selve
 * byttet, kun informere).
 */
import { useCallback, useEffect, useRef, type JSX, type RefObject } from 'react';

import { useNativeSettings } from '../hooks/useNativeSettings';
import { infoFor } from '../data/garment-info';
import {
  displayNameForDbString,
  garmentDisplayName,
} from '../data/garment-display-names';
import {
  GENERIC_GARMENT_SVG,
  dbStringFor,
  garmentIdFor,
  garmentPng,
  type GarmentId,
} from '../data/garment-illustrations';
import { categoryFor, CATEGORY_LABEL, type GarmentCategory } from '../data/garment-category';
import { getAlternatives } from '../lib/wool-layers/alternatives';

/* F84 (Sivert: «mer native og spennende» — dagens ark leste som nettside).
   Kategori → lag-triade farge (samme som PaakledningScreen/Plaggbiblioteket). */
type CatColorSpec = { bg: string; edge: string };
const CAT_COLOR: Record<GarmentCategory, CatColorSpec> = {
  innerst: { bg: 'var(--layer-innerst)', edge: 'var(--chip-edge-korall)' },
  mellomlag: { bg: 'var(--layer-mellom)', edge: 'var(--chip-edge-marigold)' },
  yttertoy: { bg: 'var(--layer-ytterst)', edge: 'var(--chip-edge-dyppetrol)' },
  ekstra: { bg: 'var(--lag-petrolgra)', edge: 'var(--chip-edge-petrolgra)' },
  utstyr: { bg: 'var(--lag-petrolgra)', edge: 'var(--chip-edge-petrolgra)' },
};
const CAT_COLOR_FALLBACK: CatColorSpec = { bg: 'var(--ink-400)', edge: 'var(--ink-700)' };

export type PlaggDetailSheetProps = {
  garmentId: GarmentId;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  /** P6: opens the Plaggbibliotek drill. Omit to render no library link at all. */
  onOpenLibrary?: () => void;
};

export function PlaggDetailSheet({
  garmentId,
  isOpen,
  onClose,
  triggerRef,
  onOpenLibrary,
}: PlaggDetailSheetProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { reducedMotion } = useNativeSettings();

  /* F83 sheet-exit (a11y-preclearance vilkår 3):
     - requestClose() = ENESTE lukke-vei for X/backdrop/ESC.
     - Single-flight: andre kall under exit ignoreres.
     - ESC nr. 2 under exit går RETT til native close (aldri strandet).
     - RM-gren lukker direkte (ingen preventDefault, ingen animasjon).
     - animationend filtreres på e.target === dialog (barne-animasjoner
       skal ikke trigge close), 400ms fallback-timer ryddes ved end. */
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    const dlg = dialogRef.current;
    if (!dlg || !dlg.open) return;
    if (reducedMotion) {
      dlg.close();
      return;
    }
    if (closingRef.current) return; // single-flight
    closingRef.current = true;
    dlg.setAttribute('data-closing', '');
    const cleanup = () => {
      dlg.removeEventListener('animationend', onEnd);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target !== dlg) return; // filtrer barne-animasjoner
      cleanup();
      if (dlg.open) dlg.close();
    };
    dlg.addEventListener('animationend', onEnd);
    closeTimerRef.current = window.setTimeout(() => {
      cleanup();
      if (dlg.open) dlg.close(); // fallback — ESC/exit kan aldri strande
    }, 400);
  }, [reducedMotion]);

  // Open/close native <dialog> when isOpen changes (programmatic sync)
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (isOpen && !dlg.open) {
      dlg.showModal();
    } else if (!isOpen && dlg.open) {
      dlg.close();
    }
  }, [isOpen]);

  // Wire native close → reset exit-state + onClose + focus-return
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      closingRef.current = false;
      dlg.removeAttribute('data-closing');
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      onClose();
      // Restore focus to trigger after close
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // ESC ('cancel'): kjør exit-animasjonen — men ALDRI blokker andre ESC
  // (closing → native close), og RM går alltid native vei.
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (reducedMotion) return;
    if (closingRef.current) return; // ESC nr. 2 → native close umiddelbart
    e.preventDefault();
    requestClose();
  };

  // Backdrop-click → requestClose
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) requestClose();
  };

  const info = infoFor(garmentId);
  // Bug (Sivert: «Alternativene kommer ikke opp?»): ITEM_ALTERNATIVES er
  // keyed på norske db-strenger MED mellomrom ('kortermet body'), mens
  // garmentId er kebab-case ('kortermet-body') — getAlternatives(garmentId)
  // matchet derfor ALDRI. dbStringFor() konverterer tilbake til riktig format.
  // T1A: dbStringFor beholdes HER kun som oppslagsnøkkel — aldri som visning.
  const alt = getAlternatives(dbStringFor(garmentId));
  const pros = alt?.pros ?? [];
  const cons = alt?.cons ?? [];
  const alternatives = alt?.alternatives ?? [];

  // T1A: brukersynlig tittel kommer fra den kanoniske visningsnavn-kilden
  // (garment-display-names.ts), ikke rå db-streng («tykt ullsett»-mønsteret).
  const title = garmentDisplayName(garmentId);

  // F84: kategori → lag-farge (aldri eneste signal — CATEGORY_LABEL-teksten
  // følger alltid med badgen).
  const category = categoryFor(garmentId);
  const catColor = category ? CAT_COLOR[category] : CAT_COLOR_FALLBACK;

  return (
    <dialog
      ref={dialogRef}
      className="plagg-detail-sheet"
      aria-labelledby="plagg-detail-title"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      style={{
        padding: 0,
        border: 'none',
        borderRadius: '24px 24px 0 0',
        maxWidth: '560px',
        width: '100%',
        margin: 'auto auto 0',
        background: 'var(--surface-elevated)',
        color: 'var(--ink-900)',
        maxHeight: '92vh',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Drag-handle — dekorativ native-sheet-signal, ikke interaktiv. */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 5,
            borderRadius: 'var(--r-pill)',
            background: 'var(--ink-200)',
            margin: '8px auto 0',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Topbar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px 12px',
            borderBottom: '1px solid var(--ink-100)',
            position: 'sticky',
            top: 0,
            background: 'var(--surface-elevated)',
            zIndex: 1,
          }}
        >
          <button
            type="button"
            aria-label="Lukk plagg-detalj"
            onClick={requestClose}
            className="ba-press"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: 'var(--ink-100)',
              color: 'inherit',
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
          {/* T1A: textTransform:capitalize fjernet — visningsnavnene er
              allerede korrekt formatert («Lue med ull», ikke «Lue Med Ull»). */}
          <h2
            id="plagg-detail-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 560,
              lineHeight: 1.2,
              letterSpacing: '-0.3px',
            }}
          >
            {title}
          </h2>
        </header>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 24px' }}>
          {/* Hero — glow + kategori-fargede skygge + kategori-badge (F84) */}
          <div
            className={reducedMotion ? undefined : 'plagg-stagger'}
            style={{
              '--stagger-i': 0,
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              padding: '12px 0 4px',
            } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: 'min(320px, 85%)',
                height: 200,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -58%)',
                background: `radial-gradient(closest-side, color-mix(in srgb, ${catColor.bg} 22%, transparent) 0%, transparent 72%)`,
                pointerEvents: 'none',
              }}
            />
            <img
              src={garmentPng(garmentId)}
              alt=""
              width={208}
              height={208}
              style={{
                position: 'relative',
                width: 208,
                height: 208,
                objectFit: 'contain',
                filter: `drop-shadow(0 14px 26px color-mix(in srgb, ${catColor.bg} 30%, transparent))`,
              }}
              onError={(e) => {
                // Hero-PNG 404 → bytt til generisk SVG-fallback (idempotent).
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== GENERIC_GARMENT_SVG) {
                  img.src = GENERIC_GARMENT_SVG;
                }
              }}
            />
            {category ? (
              <span
                style={{
                  position: 'relative',
                  marginTop: 'var(--sp-3)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: 'var(--r-pill)',
                  background: `color-mix(in srgb, ${catColor.bg} 15%, var(--surface-elevated))`,
                  color: catColor.edge,
                }}
              >
                {CATEGORY_LABEL[category]}
              </span>
            ) : null}
          </div>

          {/* HVA → lead-avsnitt (ikke seksjon-boks — bryter monotonien) */}
          {info?.what ? (
            <p
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...leadStyle, '--stagger-i': 1 } as React.CSSProperties}
            >
              {info.what}
            </p>
          ) : null}

          {/* NÅR → fakta-kort med ikon */}
          {info?.when ? (
            <section
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...factCardStyle, '--stagger-i': 2 } as React.CSSProperties}
            >
              <ClockIcon color={catColor.bg} />
              <div>
                <h3 style={eyebrowStyle}>Når passer det</h3>
                <p style={factBodyStyle}>{info.when}</p>
              </div>
            </section>
          ) : null}

          {/* FORDELER/ULEMPER → ett avveining-kort, 2 kolonner */}
          {pros.length > 0 || cons.length > 0 ? (
            <section
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...traitCardStyle, '--stagger-i': 3 } as React.CSSProperties}
            >
              {pros.length > 0 ? (
                <div>
                  <h3 style={eyebrowStyle}>Fordeler</h3>
                  <ul role="list" style={traitListStyle}>
                    {pros.map((p, i) => (
                      <li key={i} style={traitRowStyle}>
                        <span aria-hidden="true" style={{ ...traitGlyphStyle, color: 'var(--status-ok)' }}>✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {cons.length > 0 ? (
                <div>
                  <h3 style={eyebrowStyle}>Ulemper</h3>
                  <ul role="list" style={traitListStyle}>
                    {cons.map((c, i) => (
                      <li key={i} style={traitRowStyle}>
                        <span aria-hidden="true" style={{ ...traitGlyphStyle, color: 'var(--status-warm)' }}>−</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Katalogalternativer er kun informasjon; ferdigstilte valg eies av OutfitExperience. */}
          {alternatives.length > 0 ? (
            <section
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ marginBottom: 0, '--stagger-i': 4 } as React.CSSProperties}
            >
              <h3 style={eyebrowStyle}>Alternative plagg</h3>
              <ul
                role="list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {alternatives.map((a) => {
                  // a.name kan være enten en database-streng (norsk) eller en
                  // GarmentId. Prøv garmentIdFor() først; ellers bruk navnet
                  // direkte (mest sannsynlig allerede en gyldig id).
                  const altId = garmentIdFor(a.name) ?? (a.name as GarmentId);
                  return (
                  <li key={a.name} style={alternativeInfoRowStyle}>
                      <span aria-hidden="true" style={altThumbWrapStyle}>
                        <img
                          src={garmentPng(altId)}
                          alt=""
                          width={56}
                          height={56}
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: 'contain',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            // Alternativ-PNG 404 → bytt til generisk SVG i stedet
                            // for å skjule bildet (unngår tomt hull i raden).
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src !== GENERIC_GARMENT_SVG) {
                              img.src = GENERIC_GARMENT_SVG;
                            }
                          }}
                        />
                      </span>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        {/* T1A: visningsnavn i stedet for rå db-streng +
                            capitalize-each-word. */}
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--ink-900)',
                            lineHeight: 1.25,
                          }}
                        >
                          {displayNameForDbString(a.name)}
                        </div>
                        {a.pros?.[0] ? (
                          <div style={miniProsStyle}>
                            <span aria-hidden="true" style={{ color: 'var(--status-ok)', fontWeight: 700 }}>+</span>{' '}
                            <span className="sr-only">Fordel: </span>
                            {a.pros[0]}
                          </div>
                        ) : null}
                        {a.cons?.[0] ? (
                          <div style={miniConsStyle}>
                            <span aria-hidden="true" style={{ color: 'var(--status-warm)', fontWeight: 700 }}>−</span>{' '}
                            <span className="sr-only">Ulempe: </span>
                            {a.cons[0]}
                          </div>
                        ) : null}
                      </div>
                  </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* P6: Plaggbibliotek-lenke — alltid nederst (§12-mønsteret), synlig
              uansett om alternatives.length > 0 siden biblioteket viser ALLE
              plagg, ikke bare dette itemets registrerte alternativer. */}
          {onOpenLibrary ? (
            <button
              type="button"
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...libraryLinkStyle, '--stagger-i': 5 } as React.CSSProperties}
              onClick={onOpenLibrary}
            >
              <span>Se alternativer i biblioteket</span>
              <ChevronRightIcon />
            </button>
          ) : null}
        </div>
      </div>

      <style>{`
        /* F83: ekte bottom-sheet — glir inn nedenfra (iOS-drawer-kurven) og
           animerer UT før close() (data-closing settes av requestClose).
           Backdrop fader i takt. RM → alt instant. */
        .plagg-detail-sheet::backdrop {
          background: rgba(23, 16, 46, 0.35);
        }
        .plagg-detail-sheet[open] {
          animation: plagg-sheet-in 400ms cubic-bezier(0.32, 0.72, 0, 1);
        }
        .plagg-detail-sheet[open]::backdrop {
          animation: plagg-backdrop-in 250ms ease-out;
        }
        .plagg-detail-sheet[data-closing] {
          animation: plagg-sheet-out 280ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
        .plagg-detail-sheet[data-closing]::backdrop {
          animation: plagg-backdrop-out 280ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .plagg-detail-sheet[open],
          .plagg-detail-sheet[data-closing],
          .plagg-detail-sheet[open]::backdrop,
          .plagg-detail-sheet[data-closing]::backdrop {
            animation: none;
          }
        }
        @keyframes plagg-sheet-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes plagg-sheet-out {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
        @keyframes plagg-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes plagg-backdrop-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @media (forced-colors: active) {
          .plagg-detail-sheet {
            border: 1px solid CanvasText;
          }
        }

        /* F84: stagger-inn av innhold-sonene ved åpning. Kjører KUN på barn
           av scroll-diven (aldri på .plagg-detail-sheet selv) — treffer
           derfor aldri animationend-filteret i requestClose (linje 90).
           Dobbel RM-gate: betinget className (reducedMotion) + media query. */
        .plagg-detail-sheet .ba-press:focus-visible {
          outline: 2px solid var(--focus-ring, var(--accent-cta));
          outline-offset: 2px;
        }

        @keyframes plagg-item-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        .plagg-stagger {
          animation: plagg-item-in 340ms var(--ease-out) both;
          animation-delay: calc(120ms + var(--stagger-i, 0) * 45ms);
        }
        @media (prefers-reduced-motion: reduce) {
          .plagg-stagger { animation: none; }
        }
      `}</style>
    </dialog>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function ChevronRightIcon(): JSX.Element {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }): JSX.Element {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/* ── Inline styles (avoid global CSS dep) ─────────────────────────────── */

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-500)',
  margin: '0 0 4px',
};

const leadStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 16,
  lineHeight: 1.55,
  color: 'var(--ink-900)',
  textAlign: 'left',
  margin: '0 0 var(--sp-6)',
};

const factCardStyle: React.CSSProperties = {
  background: 'var(--surface-soft)',
  border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--sp-4)',
  display: 'flex',
  gap: 'var(--sp-3)',
  marginBottom: 'var(--sp-6)',
};

const factBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--ink-700)',
};

const traitCardStyle: React.CSSProperties = {
  background: 'var(--surface-soft)',
  border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--sp-4)',
  marginBottom: 'var(--sp-6)',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 'var(--sp-4)',
};

const traitListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const traitRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  fontSize: 13.5,
  lineHeight: 1.45,
  color: 'var(--ink-700)',
};

const traitGlyphStyle: React.CSSProperties = {
  flex: '0 0 16px',
  fontWeight: 700,
};

const altThumbWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 56,
  height: 56,
  flexShrink: 0,
  background: 'var(--surface-soft)',
  borderRadius: 'var(--r-md)',
  padding: 6,
};

const alternativeInfoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sp-3)',
  width: '100%',
  minHeight: 64,
  padding: 'var(--sp-3)',
  border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-1)',
  background: 'var(--surface-pure)',
  color: 'inherit',
  textAlign: 'left',
};

const miniProsStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--ink-500)',
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const miniConsStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--ink-500)',
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const libraryLinkStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 'var(--sp-3)',
  padding: '14px 16px',
  border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)',
  background: 'var(--surface-soft)',
  color: 'var(--ink-900)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  cursor: 'pointer',
  textAlign: 'left',
};

export default PlaggDetailSheet;
