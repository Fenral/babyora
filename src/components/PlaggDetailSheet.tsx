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
import { useTranslation } from 'react-i18next';

import { useNativeSettings } from '../hooks/useNativeSettings';
import { garmentFactFor } from '../data/garment-facts';
import { infoFor } from '../data/garment-info';
import {
  displayNameForDbString,
  garmentDisplayName,
} from '../data/garment-display-names';
import { localizedGarmentName } from '../data/garment-display-names-localized';
import {
  GENERIC_GARMENT_SVG,
  dbStringFor,
  garmentIdFor,
  garmentPng,
  type GarmentId,
} from '../data/garment-illustrations';
import { categoryFor, type GarmentCategory } from '../data/garment-category';
import { getAlternatives } from '../lib/wool-layers/alternatives';
import { klePaaCopyFor, resolveKlePaaLanguage } from './klepaa/kle-paa-copy';

/* F84 (Sivert: «mer native og spennende» — dagens ark leste som nettside).
   Kategori → lag-triade farge (samme som PaakledningScreen/Plaggbiblioteket). */
type CatColorSpec = { bg: string; edge: string };
const CAT_COLOR: Record<GarmentCategory, CatColorSpec> = {
  innerst: { bg: 'var(--dw-accent)', edge: 'var(--dw-accent-pressed)' },
  // --layer-mellom er BEVISST ikke migrert: aliaset peker på --dw-accent i
  // lys modus og --dw-accent-300 i mørk. Det finnes ingen enkelt --dw-verdi
  // som gir samme piksler i begge tema. Rapportert.
  mellomlag: { bg: 'var(--layer-mellom)', edge: 'var(--dw-edge-light)' },
  yttertoy: { bg: 'var(--dw-panel)', edge: 'var(--dw-w-night)' },
  ekstra: { bg: 'var(--dw-w-cloudy)', edge: 'var(--dw-w-rain)' },
  utstyr: { bg: 'var(--dw-w-cloudy)', edge: 'var(--dw-w-rain)' },
};
const CAT_COLOR_FALLBACK: CatColorSpec = { bg: 'var(--dw-ink-low)', edge: 'var(--dw-ink-mid)' };

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
  const { i18n } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { reducedMotion } = useNativeSettings();
  const htmlLanguage = typeof document === 'undefined' ? null : document.documentElement.lang;
  const language = resolveKlePaaLanguage(
    i18n.resolvedLanguage ?? i18n.language,
    htmlLanguage,
  );
  const copy = klePaaCopyFor(language);

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
  /* Alternativdatabasen har foreløpig bare norsk prosa. Behold den komplette
     norske flaten, men ikke lekk den inn i andre språk. Der brukes den
     kildebelagte, lokaliserte plaggfaktaen i stedet. */
  const pros = language === 'no' ? alt?.pros ?? [] : [];
  const cons = language === 'no' ? alt?.cons ?? [] : [];
  const alternatives = alt?.alternatives ?? [];
  const fact = garmentFactFor(garmentId, language);
  const description = language === 'no' ? info?.what ?? fact.text : fact.text;
  const when = language === 'no' ? info?.when ?? null : null;

  // T1A: brukersynlig tittel kommer fra den kanoniske visningsnavn-kilden
  // (garment-display-names.ts), ikke rå db-streng («tykt ullsett»-mønsteret).
  const title = localizedGarmentName(garmentId, language) ?? garmentDisplayName(garmentId);

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
        background: 'var(--dw-overlay)',
        color: 'var(--dw-ink-hi)',
        maxHeight: '92vh',
        overflow: 'hidden',
        // D2: arket ER den hevede flaten i denne skjermen — det svever over
        // appen. Da skal det bære lyslogikk, ikke bare et fyll: inset topplys
        // på overkanten (som er den kanten brukeren ser gli inn) + dybden.
        boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
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
            borderRadius: 'var(--dw-r-pill)',
            background: 'var(--dw-hairline)',
            margin: 'var(--dw-space-8) auto 0',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Topbar.
            D2: headeren hadde `background: var(--dw-overlay)` — nøyaktig
            samme farge som dialogen den ligger rett oppå. Det var altså ikke
            en ny hevet flate, bare arkets eget materiale malt en gang til, og
            å gi den lyslogikk ville skapt et andre plan som ikke finnes.
            Fyllet er derfor FJERNET, ikke pyntet (null pikselendring).
            `position: sticky` fulgte med ut: headeren er SØSKEN av
            scroll-diven under, ikke barn av den, så ingenting har noen gang
            scrollet under den — stickyen kunne aldri feste seg, og et
            gjennomsiktig sticky-felt hadde vært en felle for neste leser. */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--dw-space-12)',
            padding: 'var(--dw-space-8) var(--dw-space-20) var(--dw-space-12)',
            borderBottom: '1px solid var(--dw-hairline)',
          }}
        >
          <button
            type="button"
            aria-label={copy.detail.closeAria}
            onClick={requestClose}
            className="ba-press"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: 'var(--dw-hairline)',
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

        {/* Scrollable body.
            D4: en scroll-flate skal si fra at det er mer under. Bunn-faden er
            husets egen (samme rampe som sheet.css, hjem-monter.css og
            kle-paa-stepper.css) — ikke en ny verdi. */}
        <div
          style={{
            overflowY: 'auto',
            padding: 'var(--dw-space-8) var(--dw-space-20) var(--dw-space-24)',
            WebkitMaskImage: 'var(--dw-fade-bunn)',
            maskImage: 'var(--dw-fade-bunn)',
          }}
        >
          {/* Hero — glow + kategori-fargede skygge + kategori-badge (F84) */}
          <div
            className={reducedMotion ? undefined : 'plagg-stagger'}
            style={{
              '--stagger-i': 0,
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              padding: 'var(--dw-space-12) 0 var(--dw-space-4)',
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
                  marginTop: 'var(--dw-space-12)',
                  fontFamily: 'var(--dw-font-ui)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  // 5px står utenfor skalaen — ikke avrundet. Rapportert.
                  padding: '5px var(--dw-space-12)',
                  borderRadius: 'var(--dw-r-pill)',
                  background: `color-mix(in srgb, ${catColor.bg} 15%, var(--dw-overlay))`,
                  color: catColor.edge,
                }}
              >
                {copy.categories[category]}
              </span>
            ) : null}
          </div>

          {/* HVA → lead-avsnitt (ikke seksjon-boks — bryter monotonien) */}
          {description ? (
            <p
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...leadStyle, '--stagger-i': 1 } as React.CSSProperties}
            >
              {description}
            </p>
          ) : null}

          {/* NÅR → fakta-kort med ikon */}
          {when ? (
            <section
              className={reducedMotion ? undefined : 'plagg-stagger'}
              style={{ ...factCardStyle, '--stagger-i': 2 } as React.CSSProperties}
            >
              <ClockIcon color={catColor.bg} />
              <div>
                <h3 style={eyebrowStyle}>{copy.detail.whenTitle}</h3>
                <p style={factBodyStyle}>{when}</p>
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
                  <h3 style={eyebrowStyle}>{copy.detail.advantages}</h3>
                  <ul role="list" style={traitListStyle}>
                    {pros.map((p, i) => (
                      <li key={i} style={traitRowStyle}>
                        <span aria-hidden="true" style={{ ...traitGlyphStyle, color: 'var(--dw-success)' }}>✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {cons.length > 0 ? (
                <div>
                  <h3 style={eyebrowStyle}>{copy.detail.disadvantages}</h3>
                  <ul role="list" style={traitListStyle}>
                    {cons.map((c, i) => (
                      <li key={i} style={traitRowStyle}>
                        <span aria-hidden="true" style={{ ...traitGlyphStyle, color: 'var(--dw-danger)' }}>−</span>
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
              <h3 style={eyebrowStyle}>{copy.detail.alternatives}</h3>
              <ul role="list" style={alternativesGroupStyle}>
                {alternatives.map((a, i) => {
                  // a.name kan være enten en database-streng (norsk) eller en
                  // GarmentId. Prøv garmentIdFor() først; ellers bruk navnet
                  // direkte (mest sannsynlig allerede en gyldig id).
                  const altId = garmentIdFor(a.name) ?? (a.name as GarmentId);
                  return (
                  <li key={a.name} style={alternativeInfoRowStyle(i === 0)}>
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
                            fontFamily: 'var(--dw-font-ui)',
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--dw-ink-hi)',
                            lineHeight: 1.25,
                          }}
                        >
                          {localizedGarmentName(altId, language) ?? displayNameForDbString(a.name)}
                        </div>
                        {language === 'no' && a.pros?.[0] ? (
                          <div style={miniProsStyle}>
                            <span aria-hidden="true" style={{ color: 'var(--dw-success)', fontWeight: 700 }}>+</span>{' '}
                            <span className="sr-only">{copy.detail.advantagePrefix}</span>
                            {a.pros[0]}
                          </div>
                        ) : null}
                        {language === 'no' && a.cons?.[0] ? (
                          <div style={miniConsStyle}>
                            <span aria-hidden="true" style={{ color: 'var(--dw-danger)', fontWeight: 700 }}>−</span>{' '}
                            <span className="sr-only">{copy.detail.disadvantagePrefix}</span>
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
              <span>{copy.detail.libraryLink}</span>
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
        /* Backdropen følger arket sitt i stedet for å ha eget tall: --dw-m-push
           inn, --dw-m-push-back ut. Kontrakten har ikke noe eget scrim-token,
           og --dw-m-atmo er reservert lyspoolen («ALDRI transform»). */
        .plagg-detail-sheet[open]::backdrop {
          animation: plagg-backdrop-in var(--dw-m-push) var(--dw-ease);
        }
        /* 280ms === --dw-m-push-back («ut», eksakt samme tall). Kurvene er nå
           også kontraktens: begge var egne dialekter (0.19,1,0.22,1 og
           ease-out) uten annen begrunnelse enn at de ble skrevet der. */
        .plagg-detail-sheet[data-closing] {
          animation: plagg-sheet-out var(--dw-m-push-back) var(--dw-ease) forwards;
        }
        .plagg-detail-sheet[data-closing]::backdrop {
          animation: plagg-backdrop-out var(--dw-m-push-back) var(--dw-ease) forwards;
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
          outline: 2px solid var(--dw-focus, var(--dw-accent));
          outline-offset: 2px;
        }

        @keyframes plagg-item-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        /* 340ms === --dw-m-push (vertikal inn, eksakt samme tall), og kurven
           er nå kontraktens --dw-ease i stedet for legacy-familiens
           --ease-out. FORSINKELSEN står igjen som gjeld med vilje: 45ms er et
           stagger-STEG, og bevegelseskontrakten starter på 120ms — det finnes
           ikke noe token å bruke, og å oppfinne ett her ville laget en
           kontrakt på siden av kontrakten. Rapportert som manglende token. */
        .plagg-stagger {
          animation: plagg-item-in var(--dw-m-push) var(--dw-ease) both;
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
  fontFamily: 'var(--dw-font-ui)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--dw-ink-mid)',
  margin: '0 0 var(--dw-space-4)',
};

const leadStyle: React.CSSProperties = {
  fontFamily: 'var(--dw-font-ui)',
  fontSize: 16,
  lineHeight: 1.55,
  color: 'var(--dw-ink-hi)',
  textAlign: 'left',
  margin: '0 0 var(--dw-space-24)',
};

/* D2: ekte hevede gruppeflater (et faktakort og et avveiningskort er egne
   soner i arket, ikke bare tekst) — så de skal bære lyslogikk: inset topplys
   på overkanten + dybden under. Samme form på begge, med vilje. */
const factCardStyle: React.CSSProperties = {
  background: 'var(--dw-raised)',
  border: '1px solid var(--dw-hairline)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--dw-space-16)',
  display: 'flex',
  gap: 'var(--dw-space-12)',
  marginBottom: 'var(--dw-space-24)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};

const factBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--dw-ink-mid)',
};

const traitCardStyle: React.CSSProperties = {
  background: 'var(--dw-raised)',
  border: '1px solid var(--dw-hairline)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--dw-space-16)',
  marginBottom: 'var(--dw-space-24)',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 'var(--dw-space-16)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};

const traitListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-6)',
};

const traitRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--dw-space-8)',
  fontSize: 13.5,
  lineHeight: 1.45,
  color: 'var(--dw-ink-mid)',
};

const traitGlyphStyle: React.CSSProperties = {
  flex: '0 0 16px',
  fontWeight: 700,
};

/**
 * Vitrinen rundt alternativ-thumben (D3).
 *
 * Var `var(--dw-raised)` — nivå 2, altså en HEVET plate. Men den er 56 px,
 * ligger inne i en flate som nå selv er nivå 2, og rendret hele tiden MØRKERE
 * enn forelderen: en brønn som het «hevet». Å gi den dybde ville lagt en
 * slagskygge på hver eneste miniatyr, som er nettopp effekt-inflasjonen
 * doktrinen advarer mot. Riktig materiale for et utstillingsskrin er rommet
 * bak — `var(--dw-canvas)` — så plagget står I flaten, ikke oppå den.
 */
const altThumbWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 56,
  height: 56,
  flexShrink: 0,
  background: 'var(--dw-canvas)',
  borderRadius: 'var(--r-md)',
  padding: 'var(--dw-space-6)',
};

/**
 * D1/D2: alternativ-listen var N frittstående kort — hver rad med egen kant,
 * egen `--shadow-1` (et legacy-token utenfor --dw-*) og et fyll som var
 * IDENTISK med arkets eget (`--dw-overlay` på `--dw-overlay`). Fem kort som
 * svever hver for seg er fem hierarkier; doktrinen vil ha ÉN hevet
 * gruppeflate med hårstreker imellom — samme form som PaywallDialogs
 * `sheetStyle` allerede bruker. Gruppen bærer dybden, radene bærer skillet.
 */
const alternativesGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
  padding: 0,
  margin: 0,
  background: 'var(--dw-raised)',
  borderRadius: 'var(--r-lg)',
  overflow: 'hidden',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
};

const alternativeInfoRowStyle = (first: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-12)',
  width: '100%',
  minHeight: 64,
  padding: 'var(--dw-space-12)',
  borderTop: first ? 'none' : '1px solid var(--dw-hairline)',
  color: 'inherit',
  textAlign: 'left',
});

const miniProsStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--dw-ink-mid)',
  marginTop: 'var(--dw-space-2)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const miniConsStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--dw-ink-mid)',
  marginTop: 'var(--dw-space-2)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/* D2: en trykkbar, hevet kontroll — den skal se ut som den kan trykkes ned,
   altså ha en overkant som fanger lys og en skygge den kan miste. */
const libraryLinkStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 'var(--dw-space-12)',
  padding: 'var(--dw-space-14) var(--dw-space-16)',
  border: '1px solid var(--dw-hairline)',
  borderRadius: 'var(--r-lg)',
  background: 'var(--dw-raised)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
  color: 'var(--dw-ink-hi)',
  fontFamily: 'var(--dw-font-ui)',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--dw-space-8)',
  cursor: 'pointer',
  textAlign: 'left',
};

export default PlaggDetailSheet;
