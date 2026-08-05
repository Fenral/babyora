/**
 * VarmEllerKaldScreen — F60 Skjerm 9 «Varm eller kald?»
 *
 * Mock A port (warm-grey canvas + warm-orange CTA + DM Serif hero + grouped
 * status-list med hairline-dividers). Behold Props-signatur, haptics og
 * native-settings — kun visuell rewrite.
 *
 * F80 PORT (tillits-bug-fix): status-radene (varm/perfekt/kald) var tidligere
 * <button>-elementer med press-feedback og cursor:pointer, men klikk gjorde
 * ingenting synlig/funksjonelt (kun haptikk) — ingen nærliggende mål finnes
 * (ingen detalj-sheet/navigasjon for disse tre tilstandene). Radene er nå
 * statisk info (role="group", ingen klikk-affordanse) — ærligere enn å late
 * som de er interaktive.
 *
 * A11y-kontrakt:
 *  - Semantic <main>, <h1>, <ul role="list">
 *  - Baby-silhouette markert aria-hidden="true" (dekorativ)
 *  - 44px min touch-target på tilbake-knapp + CTA
 *  - focus-visible-outline med warm-orange
 *  - prefers-reduced-motion: dropper press-transform + neck-pulse
 *  - Status-rows bruker semantic colors + tekst (ikke kun farge)
 */
import { useCallback, useState, type CSSProperties, type ReactElement } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { WARM_COLD_RECOVERY_COPY } from '../lib/copy/warm-cold-recovery';

export interface VarmEllerKaldScreenProps {
  onBack: () => void;
}

type StatusKey = 'varm' | 'perfekt' | 'kald';

interface StatusRowSpec {
  key: StatusKey;
  num: string;
  title: string;
  signal: string;
  action: string;
  iconBg: string;
  iconColor: string;
  dotColor: string;
  actionColor: string;
  actionBg: string;
  actionBorder: string;
  iconPaths: ReactElement;
  iconStrokeWidth: number;
  ariaLabel: string;
}

const STATUS_ROWS: readonly StatusRowSpec[] = [
  {
    ...WARM_COLD_RECOVERY_COPY.statuses.warm,
    num: '1',
    iconBg: 'var(--dw-raised)',
    iconColor: 'var(--dw-danger)',
    dotColor: 'var(--dw-danger)',
    actionColor: 'var(--dw-ink-mid)',
    actionBg: 'var(--dw-raised)',
    actionBorder: '1px solid var(--dw-hairline)',
    iconStrokeWidth: 2,
    iconPaths: (
      <>
        <path d="M14 4a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0V4z" />
        <path d="M12 4v9.5" />
      </>
    ),
  },
  {
    ...WARM_COLD_RECOVERY_COPY.statuses.perfekt,
    num: '2',
    iconBg: 'var(--dw-raised)',
    iconColor: 'var(--dw-success)',
    dotColor: 'var(--dw-success)',
    actionColor: 'var(--dw-accent)',
    actionBg: 'var(--dw-accent-surface)',
    // --terracotta-200 IKKE migrert: aliaset er tema-avhengig (lys → --dw-accent,
    // mørk → --dw-accent-300). Ett --dw-navn ville endret kanten i ett av temaene.
    actionBorder: '1px solid var(--terracotta-200)',
    iconStrokeWidth: 2.4,
    iconPaths: <path d="M5 12.5l4.5 4.5L19 7" />,
  },
  {
    ...WARM_COLD_RECOVERY_COPY.statuses.cold,
    num: '3',
    iconBg: 'var(--dw-raised)',
    iconColor: 'var(--dw-warning)',
    dotColor: 'var(--dw-warning)',
    actionColor: 'var(--dw-ink-mid)',
    actionBg: 'var(--dw-raised)',
    actionBorder: '1px solid var(--dw-hairline)',
    iconStrokeWidth: 1.9,
    iconPaths: (
      <>
        <path d="M12 3v18" />
        <path d="M5 7l14 10M19 7L5 17" />
        <path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2" />
      </>
    ),
  },
];

export function VarmEllerKaldScreen({
  onBack,
}: VarmEllerKaldScreenProps): ReactElement {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  // Status-radene (varm/perfekt/kald) er nå statisk info (tillits-bug-fix,
  // se STATUS_ROWS-render) — pressedKey trenger derfor kun 'back' | 'cta'.
  const [pressedKey, setPressedKey] = useState<'back' | 'cta' | null>(null);

  const handleBack = useCallback(() => {
    void fire('light');
    onBack();
  }, [fire, onBack]);

  const handleCtaPress = useCallback(() => {
    void fire('medium');
    onBack();
  }, [fire, onBack]);

  const pressTransform = (key: 'back' | 'cta'): string => {
    if (reducedMotion) return 'none';
    if (pressedKey !== key) return 'none';
    if (key === 'cta') return 'scale(0.985)';
    return 'scale(0.97)';
  };

  // ──────────────────── Styles ────────────────────
  const rootStyle: CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--dw-font-ui)',
    color: 'var(--dw-ink-hi)',
    background: 'var(--dw-canvas)',
    paddingTop: 'max(54px, env(safe-area-inset-top, 54px))',
    paddingBottom: 'env(safe-area-inset-bottom, 24px)',
    overflow: 'hidden',
  };

  const topbarStyle: CSSProperties = {
    position: 'relative',
    zIndex: 5,
    flex: 'none',
    padding: 'var(--dw-space-6) var(--dw-space-16) var(--dw-space-10)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-10)',
    marginTop: 'var(--dw-space-8)',
  };

  const backBtnStyle: CSSProperties = {
    width: 44,
    height: 44,
    flex: 'none',
    borderRadius: 11,
    background:
      pressedKey === 'back' ? 'var(--dw-overlay)' : 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--dw-ink-hi)',
    transform: pressTransform('back'),
    transition: reducedMotion
      ? 'none'
      : 'transform var(--dw-m-feedback) var(--dw-ease), background var(--dw-m-feedback)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const titleStyle: CSSProperties = {
    fontFamily: 'var(--dw-font-ui)',
    fontSize: '1.125rem',
    fontWeight: 700,
    letterSpacing: '-0.3px',
    margin: 0,
    color: 'var(--dw-ink-hi)',
    flex: 1,
  };

  const scrollStyle: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 var(--dw-space-16) var(--dw-space-16)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-14)',
    WebkitOverflowScrolling: 'touch',
  };

  // ── Hero card ──
  const heroStyle: CSSProperties = {
    position: 'relative',
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    borderRadius: 22,
    padding: 'var(--dw-space-16) var(--dw-space-16) var(--dw-space-14)',
    // --shadow-2 IKKE migrert: 0 4px 14px (ett lag) mot --dw-depth-raised sine tre
    // retningsbestemte lag — ulik verdi, ville endret kortets dybde synlig.
    boxShadow: 'var(--shadow-2)',
    display: 'flex',
    gap: 'var(--dw-space-14)',
    alignItems: 'center',
  };

  const heroFigureStyle: CSSProperties = {
    position: 'relative',
    width: 96,
    height: 128,
    flex: 'none',
  };

  // F67-B: Pulserende orb på nakke-posisjon (~50% horiz, ~60% vert av bildet).
  // 14px sirkel, terracotta-600 fyll, ring rundt (terracotta-100, opacity 0.5).
  // SVG i stedet for div så ringen kan rendere uten box-shadow-tricks.
  const neckOrbWrapStyle: CSSProperties = {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 32,
    height: 32,
    display: 'grid',
    placeItems: 'center',
    pointerEvents: 'none',
  };

  const heroTextStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const heroEyebrowStyle: CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: 'var(--dw-accent)',
    // F67-B collision-fix: eyebrow→h2 ≥12px
    margin: '0 0 var(--dw-space-12)',
  };

  const heroTitleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif, "DM Serif Display", Georgia, serif)',
    fontWeight: 400,
    fontSize: '1.375rem',
    lineHeight: 1.1,
    letterSpacing: '-0.4px',
    color: 'var(--dw-ink-hi)',
    // F67-B collision-fix: h2→body ≥8px
    margin: '0 0 var(--dw-space-8)',
  };

  const heroSubStyle: CSSProperties = {
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    fontWeight: 500,
    color: 'var(--dw-ink-mid)',
    margin: 0,
  };

  // ── Section heading ──
  const sectionHeadingStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-10)',
    padding: 'var(--dw-space-2) var(--dw-space-4)',
    marginTop: 'var(--dw-space-2)',
  };

  const sectionHeadingTextStyle: CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    color: 'var(--dw-ink-mid)',
    margin: 0,
  };

  const sectionRuleStyle: CSSProperties = {
    flex: 1,
    height: 1,
    background: 'var(--dw-hairline)',
  };

  // ── Status card (grouped list w/ hairline dividers) ──
  const statusCardStyle: CSSProperties = {
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
    borderRadius: 18,
    // --shadow-2 IKKE migrert, se heroStyle.
    boxShadow: 'var(--shadow-2)',
    overflow: 'hidden',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  // ── Footnote ──
  const footnoteStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--dw-space-10)',
    // 11px/13px står utenfor 2-punktsskalaen — ikke avrundet.
    padding: '11px 13px',
    borderRadius: 14,
    background: 'var(--dw-raised)',
    border: '1px solid var(--dw-hairline)',
  };

  const footnoteIconStyle: CSSProperties = {
    flex: 'none',
    width: 18,
    height: 18,
    color: 'var(--dw-ink-mid)',
    marginTop: 1,
  };

  const footnoteTextStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 500,
    color: 'var(--dw-ink-mid)',
  };

  // ── CTA ──
  const ctaBarStyle: CSSProperties = {
    flex: 'none',
    padding: 'var(--dw-space-8) var(--dw-space-16) var(--dw-space-14)',
    background: 'var(--dw-canvas)',
  };

  const ctaStyle: CSSProperties = {
    width: '100%',
    height: 52,
    borderRadius: 14,
    border: 0,
    // P0.1 contrast-fix: default CTA bg = --warm-orange-700 (mørkere) gir WCAG AA
    // mot hvit tekst; press-state = enda mørkere oklch(0.55 0.18 38).
    // F80-port: tekstfarge byttet fra hardkodet '#FFFFFF' → --accent-cta-ink —
    // --warm-orange-700 er Morgennatt-aliaset for Granmynte-CTA-en og blir lys
    // mint i dark mode, der hvit tekst ville feilet kontrast.
    // Press-fargen oklch(0.55 0.18 38) ≈ #C33C00 og treffer INGEN token eksakt
    // (--dw-accent-pressed er #C57C46 mørk / #8A4A24 lys) — står urørt, rapportert.
    background: pressedKey === 'cta' ? 'oklch(0.55 0.18 38)' : 'var(--dw-accent)',
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '-0.1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--dw-space-8)',
    cursor: 'pointer',
    // --shadow-cta-primary IKKE migrert: ett lag 0 12px 26px -14px mot
    // --dw-depth-action sine to lag — ulik verdi.
    boxShadow: 'var(--shadow-cta-primary)',
    transform: pressTransform('cta'),
    transition: reducedMotion
      ? 'none'
      : 'transform var(--dw-m-feedback) var(--dw-ease), background var(--dw-m-feedback)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  // ──────────────────── Render ────────────────────
  return (
    <main style={rootStyle} aria-labelledby="varm-kald-title">
      <style>{`
        @keyframes varmkald-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.35); }
          50% { box-shadow: 0 0 0 8px rgba(255, 107, 53, 0); }
        }
        /* F67-B: nakke-orb pulse (scale + opacity) */
        @keyframes neck-orb-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .neck-orb {
          transform-origin: center;
          animation: neck-orb-pulse 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .neck-orb {
            animation: none;
            transform: scale(1);
            opacity: 0.85;
          }
        }
        /*
          Sjekk-nakke illustrasjon — dark-mode-veksling.
          <picture> + media-query gir auto-mode (system-dark).
          Manuell mode-toggle bruker data-theme på <html>:
            data-theme="dark"  → skjul light, vis dark override
            data-theme="light" → skjul dark, vis light (selv om system er dark)
        */
        :root[data-theme="dark"] .sjekk-nakke-picture { display: none !important; }
        :root[data-theme="dark"] .sjekk-nakke-dark-override { display: block !important; }
        :root[data-theme="light"] .sjekk-nakke-picture { display: block !important; }
        :root[data-theme="light"] .sjekk-nakke-dark-override { display: none !important; }
      `}</style>

      <h1
        id="varm-kald-title"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Varm eller kald — sjekkliste for foreldre
      </h1>

      <header style={topbarStyle}>
        <button
          type="button"
          aria-label="Tilbake"
          onClick={handleBack}
          onPointerDown={() => setPressedKey('back')}
          onPointerUp={() => setPressedKey(null)}
          onPointerLeave={() => setPressedKey(null)}
          onPointerCancel={() => setPressedKey(null)}
          style={backBtnStyle}
        >
          <svg
            width="9"
            height="15"
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
        <h2 style={titleStyle} aria-hidden="true">
          Varm eller kald?
        </h2>
      </header>

      <div style={scrollStyle}>
        {/* HERO — body diagram med neck-pin callout */}
        <section style={heroStyle} aria-label="Kjenn på babyens nakke">
          <div style={heroFigureStyle} aria-hidden="true">
            {/*
              Theme-aware illustrasjon: <picture> bruker prefers-color-scheme
              (auto-mode) — i tillegg overstyrer CSS-reglene under
              [data-theme="dark"] / [data-theme="light"] når brukeren
              har valgt mode eksplisitt. Begge bilder lastes ikke samtidig:
              <source> matcher kun system-dark, ellers brukes <img src>.
              CSS-overstyring veksler display mellom dem ved manuell mode.
            */}
            <picture className="sjekk-nakke-picture">
              <source
                srcSet="/illustrations/sjekk-nakke-dark.png"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="/illustrations/sjekk-nakke.png"
                alt=""
                width={96}
                height={128}
                className="sjekk-nakke-light"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </picture>
            <img
              src="/illustrations/sjekk-nakke-dark.png"
              alt=""
              width={96}
              height={128}
              className="sjekk-nakke-dark-override"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'none',
              }}
            />
            {/* F67-B: pulserende orb på nakke. SVG-sirkel m/ring. */}
            <div style={neckOrbWrapStyle} aria-hidden="true">
              <svg
                className="neck-orb"
                width={32}
                height={32}
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                {/* Ring (terracotta-100, opacity 0.5) */}
                <circle
                  cx={16}
                  cy={16}
                  r={13}
                  fill="none"
                  stroke="var(--dw-accent-surface, #F4E4D8)"
                  strokeOpacity={0.5}
                  strokeWidth={2}
                />
                {/* Orb (14px diameter → r=7, terracotta-600) */}
                <circle
                  cx={16}
                  cy={16}
                  r={7}
                  fill="var(--dw-accent, #B4502E)"
                />
              </svg>
            </div>
          </div>
          <div style={heroTextStyle}>
            <p style={heroEyebrowStyle}>2-finger-test</p>
            <h3 style={heroTitleStyle}>{WARM_COLD_RECOVERY_COPY.title}</h3>
            <p style={heroSubStyle}>{WARM_COLD_RECOVERY_COPY.instruction}</p>
          </div>
        </section>

        {/* Section heading */}
        <div style={sectionHeadingStyle} role="presentation">
          <h4 id="varm-kald-status-heading" style={sectionHeadingTextStyle}>
            Tre mulige signaler
          </h4>
          <span style={sectionRuleStyle} aria-hidden="true" />
        </div>

        {/* Status list */}
        <ul
          role="list"
          style={statusCardStyle}
          aria-labelledby="varm-kald-status-heading"
        >
          {STATUS_ROWS.map((row, idx) => {
            // Tillits-bug-fix (F80 port): disse radene var tidligere <button>
            // med press-feedback og cursor:pointer, men onClick gjorde ingenting
            // synlig/funksjonelt (kun haptikk) — ingen nærliggende mål (ingen
            // detalj-sheet, ingen navigasjon finnes for «For varm/Perfekt/For
            // kald»). Ærligst: fjern klikk-affordансen helt og les radene som
            // statisk info (samme visuelle kort, ingen pointer/press/tap-state).
            const rowStyle: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              // 13px står utenfor 2-punktsskalaen — ikke avrundet.
              gap: 13,
              padding: '13px var(--dw-space-14)',
              width: '100%',
              border: 0,
              borderTop:
                idx === 0 ? 'none' : '1px solid var(--dw-hairline)',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'default',
              fontFamily: 'inherit',
              color: 'inherit',
              minHeight: 64,
            };

            const numStyle: CSSProperties = {
              width: 24,
              height: 24,
              flex: 'none',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2px',
              color: 'var(--dw-ink-mid)',
              background: 'var(--dw-raised)',
              border: '1px solid var(--dw-hairline)',
            };

            const iconWrapStyle: CSSProperties = {
              width: 38,
              height: 38,
              flex: 'none',
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: row.iconBg,
              color: row.iconColor,
            };

            const textWrapStyle: CSSProperties = {
              flex: 1,
              minWidth: 0,
            };

            const titleRowStyle: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dw-space-8)',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--dw-ink-hi)',
              margin: '0 0 var(--dw-space-2)',
              letterSpacing: '-0.2px',
            };

            const dotStyle: CSSProperties = {
              width: 7,
              height: 7,
              borderRadius: '50%',
              flex: 'none',
              background: row.dotColor,
            };

            const bodyStyle: CSSProperties = {
              fontSize: '0.78125rem',
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'var(--dw-ink-mid)',
              margin: 0,
            };

            const actionStyle: CSSProperties = {
              flex: 'none',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.4px',
              color: row.actionColor,
              textTransform: 'uppercase',
              padding: 'var(--dw-space-4) var(--dw-space-8)',
              borderRadius: 6,
              background: row.actionBg,
              border: row.actionBorder,
              whiteSpace: 'nowrap',
            };

            return (
              <li key={row.key} role="listitem" style={{ margin: 0 }}>
                <div
                  role="group"
                  aria-label={row.ariaLabel}
                  style={rowStyle}
                >
                  <span style={numStyle} aria-hidden="true">
                    {row.num}
                  </span>
                  <span style={iconWrapStyle} aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={row.iconStrokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {row.iconPaths}
                    </svg>
                  </span>
                  <span style={textWrapStyle}>
                    <span style={titleRowStyle}>
                      <span style={dotStyle} aria-hidden="true" />
                      {row.title}
                    </span>
                    <span style={bodyStyle}>{row.signal}</span>
                  </span>
                  <span style={actionStyle} aria-hidden="true">
                    {row.action}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footnote */}
        <div style={footnoteStyle} role="note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={footnoteIconStyle}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={footnoteTextStyle}>
            Kalde hender og føtter er normalt og betyr <strong>ikke</strong> at
            barnet fryser.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={ctaBarStyle}>
        <button
          type="button"
          aria-label="Ferdig — tilbake til oversikt"
          onClick={handleCtaPress}
          onPointerDown={() => setPressedKey('cta')}
          onPointerUp={() => setPressedKey(null)}
          onPointerLeave={() => setPressedKey(null)}
          onPointerCancel={() => setPressedKey(null)}
          style={ctaStyle}
        >
          Ferdig
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </main>
  );
}

export default VarmEllerKaldScreen;
