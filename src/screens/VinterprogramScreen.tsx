/**
 * VinterprogramScreen — «Første vinter med baby» (F86-F3).
 *
 * To visninger i én drill-skjerm: OVERSIKT (8 leksjons-rader m/progresjon) og
 * LEKSJON (tittel + lead + seksjoner + «Prøv selv»-CTA). Innhold fra
 * src/data/vinterprogram.ts (Fable-QA-et, kildesporet).
 *
 * Gating (F81/F86): leksjon 1 alltid gratis (smakebit); uke 2-8 krever
 * Babyora Pluss — gated rad åpner PaywallDialog (trigger 'forste_vinter')
 * med returnFocusTo = raden. Drip: leksjon N åpner (N-1) uker etter første
 * besøk (ensureProgramStart).
 *
 * A11y (pre-clearance 2026-07-11, C1-C7):
 *  - C1: én h1 per visning (oversikt: «Første vinter», leksjon: leksjonstittel);
 *    seksjonsoverskrifter i leksjon = h2 (eyebrow-stylet). Progresjon = ren tekst.
 *  - C2: all state i tilgjengelig navn OG synlig tekst («Åpnes om X dager»,
 *    «Med Babyora Pluss»). Drip-rader: aria-disabled (ALDRI disabled-attributt),
 *    forblir i tab-rekkefølge, ingen haptikk/press-scale. Pluss-rader: vanlige
 *    knapper (utfører handling → paywall).
 *  - C3: fokus flyttes til ny visnings h1 (tabIndex -1) ved view-swap; tilbake
 *    fra leksjon returnerer fokus til raden som åpnet den. Bunn-padding så
 *    siste rad ikke skjules av global tab-bar.
 *  - C4: alle interactives ≥44px.
 *  - C5: ingen tekst dimmes via opacity; state bæres av tekst-tokens som
 *    allerede er kontrast-verifisert (ink-500/700/900 på surface).
 *  - C6: ingen animasjoner utover Pressable-press (RM-gatet via inline).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { useAccess } from '../lib/premium/use-access';
import { PaywallDialog } from '../components/PaywallDialog';
import {
  LESSONS,
  ensureProgramStart,
  lessonAvailability,
  openLessonCount,
  type Lesson,
} from '../data/vinterprogram';
import type { GuideTarget } from '../types/nav';

export interface VinterprogramScreenProps {
  onBack: () => void;
  /** «Prøv selv»-CTA navigerer til en annen Guide-flate (kalkulator m.m.). */
  onOpenTarget: (target: GuideTarget) => void;
}

type RowState =
  | { kind: 'open' }
  | { kind: 'drip'; opensInDays: number }
  | { kind: 'pluss' };

export function VinterprogramScreen({ onBack, onOpenTarget }: VinterprogramScreenProps): ReactElement {
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const { isPremium } = useAccess();

  const startedAt = useMemo(() => ensureProgramStart(), []);
  const openCount = openLessonCount(startedAt);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReturnFocusTo, setPaywallReturnFocusTo] = useState<HTMLElement | null>(null);

  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastOpenedRowId = useRef<string | null>(null);
  const skipH1Focus = useRef(false);

  // C3: fokus til visningens h1 ved view-swap (også første mount er OK —
  // drill-inn fra Familie sin Verktøy-seksjon gir samme mønster). Hoppes over
  // når retur-fokus til raden er planlagt (unngår dobbel SR-annonsering h1 → rad).
  useEffect(() => {
    if (skipH1Focus.current) {
      skipH1Focus.current = false;
      return;
    }
    h1Ref.current?.focus();
  }, [activeLesson]);

  const rowStateFor = useCallback(
    (lesson: Lesson): RowState => {
      // Pluss-gating har presedens for uke 2-8 (gratis-bruker skal se
      // oppgraderingsveien, ikke en drip-nedtelling den ikke kan bruke).
      if (lesson.week > 1 && !isPremium) return { kind: 'pluss' };
      const avail = lessonAvailability(lesson.week, startedAt);
      if (avail.state === 'drip') return { kind: 'drip', opensInDays: avail.opensInDays };
      return { kind: 'open' };
    },
    [isPremium, startedAt],
  );

  const handleRowActivate = useCallback(
    (lesson: Lesson) => {
      const state = rowStateFor(lesson);
      if (state.kind === 'drip') return; // aria-disabled — ingen handling/haptikk
      if (state.kind === 'pluss') {
        void fire('light');
        setPaywallReturnFocusTo(rowRefs.current[lesson.id] ?? null);
        setPaywallOpen(true);
        return;
      }
      void fire('light');
      lastOpenedRowId.current = lesson.id;
      setActiveLesson(lesson);
    },
    [fire, rowStateFor],
  );

  const handleLessonBack = useCallback(() => {
    void fire('light');
    const returnTo = lastOpenedRowId.current;
    skipH1Focus.current = true;
    setActiveLesson(null);
    // C3: tilbake fra leksjon → fokus til raden som åpnet den (etter re-render).
    requestAnimationFrame(() => {
      if (returnTo) rowRefs.current[returnTo]?.focus();
    });
  }, [fire]);

  const handleBack = useCallback(() => {
    void fire('light');
    onBack();
  }, [fire, onBack]);

  const handleTryDet = useCallback(
    (target: GuideTarget) => {
      void fire('medium');
      onOpenTarget(target);
    },
    [fire, onOpenTarget],
  );

  // Minor 1 (a11y-sweep): dialogen renderes ubetinget i begge visninger så
  // en fremtidig view-swap mens den er åpen aldri unmounter en åpen <dialog>.
  const paywall = (
    <PaywallDialog
      open={paywallOpen}
      trigger="forste_vinter"
      onClose={() => setPaywallOpen(false)}
      returnFocusTo={paywallReturnFocusTo}
    />
  );

  /* ── LEKSJONS-VISNING ── */
  if (activeLesson) {
    return (
      <main style={rootStyle} aria-labelledby="vp-lesson-title">
        <header style={topbarStyle}>
          <button type="button" onClick={handleLessonBack} aria-label="Tilbake til programoversikten" className="ba-press" style={backBtnStyle}>
            <BackIcon />
          </button>
          {/* Ekte kontekst (uke-nr) — hørbar, i motsetning til oversiktens dekor-crumb */}
          <p style={crumbStyle}>Første vinter · uke {activeLesson.week}</p>
        </header>
        <div style={scrollStyle} className="ba-scroll-native">
          <img
            src={heroSrc(activeLesson.id)}
            alt=""
            width={640}
            height={640}
            style={lessonHeroStyle}
            onError={hideOnError}
          />
          <h1 id="vp-lesson-title" ref={h1Ref} tabIndex={-1} style={lessonTitleStyle}>
            {activeLesson.title}
          </h1>
          <p style={leadStyle}>{activeLesson.lead}</p>
          {activeLesson.sections.map((s, i) => (
            <section key={i} style={sectionCardStyle}>
              <h2 style={eyebrowH2Style}>{s.heading}</h2>
              <p style={sectionBodyStyle}>{s.body}</p>
            </section>
          ))}
          <button
            type="button"
            onClick={() => handleTryDet(activeLesson.tryDet.target)}
            className="ba-press-cta"
            style={ctaStyle}
          >
            {activeLesson.tryDet.label}
          </button>
        </div>
        {paywall}
      </main>
    );
  }

  /* ── OVERSIKT ── */
  return (
    <main style={rootStyle} aria-labelledby="vp-title">
      <header style={topbarStyle}>
        <button type="button" onClick={handleBack} aria-label="Tilbake" className="ba-press" style={backBtnStyle}>
          <BackIcon />
        </button>
        <p style={crumbStyle} aria-hidden="true">Guide · kunnskap</p>
      </header>
      <div style={scrollStyle} className="ba-scroll-native">
        <img
          src={heroSrc('cover')}
          alt=""
          width={640}
          height={640}
          style={coverStyle}
          onError={hideOnError}
        />
        <h1 id="vp-title" ref={h1Ref} tabIndex={-1} style={titleStyle}>
          Første vinter med baby
        </h1>
        <p style={introStyle}>
          Åtte korte leksjoner om vinterpåkledning, én i uka. Bygget på de samme
          helsesøster-rådene som anbefalingene i appen.
        </p>
        <p style={progressStyle}>Uke {Math.min(openCount, LESSONS.length)} av {LESSONS.length}</p>

        <ol style={listStyle}>
          {LESSONS.map((lesson) => {
            const state = rowStateFor(lesson);
            const stateText =
              state.kind === 'drip'
                ? `Åpnes om ${state.opensInDays} ${state.opensInDays === 1 ? 'dag' : 'dager'}`
                : state.kind === 'pluss'
                  ? 'Med Babyora Pluss'
                  : lesson.week === 1 && !isPremium
                    ? 'Gratis smakebit'
                    : null;
            const ariaLabel = `Uke ${lesson.week}: ${lesson.title}.${stateText ? ` ${stateText}.` : ''}`;
            const isDrip = state.kind === 'drip';
            return (
              <li key={lesson.id} style={liStyle}>
                <button
                  type="button"
                  ref={(el) => { rowRefs.current[lesson.id] = el; }}
                  onClick={() => handleRowActivate(lesson)}
                  aria-label={ariaLabel}
                  aria-disabled={isDrip || undefined}
                  className={isDrip ? undefined : 'ba-row-press'}
                  style={{
                    ...rowStyle,
                    cursor: isDrip ? 'default' : 'pointer',
                    transition: reducedMotion ? 'none' : rowStyle.transition,
                  }}
                >
                  <span style={weekBadgeStyle} aria-hidden="true">{lesson.week}</span>
                  <span style={rowTextStyle}>
                    <span style={rowTitleStyle}>{lesson.title}</span>
                    {stateText ? <span style={rowStateStyle}>{stateText}</span> : null}
                  </span>
                  {state.kind === 'open' ? (
                    <span style={chevStyle} aria-hidden="true">›</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {paywall}
    </main>
  );
}

/* ── Heroer (F86-F5, clay-stil, transparent PNG). Dekorative — tittelen
     bærer meningen (alt=""). hideOnError: mangler fila forsvinner bildet
     stille i stedet for broken-image-ikon. ── */

function heroSrc(id: string): string {
  return `${import.meta.env.BASE_URL}illustrations/vinterprogram/${id}.png`;
}

function hideOnError(e: { currentTarget: HTMLImageElement }): void {
  e.currentTarget.style.display = 'none';
}

/* ── Ikoner ── */

function BackIcon(): ReactElement {
  return (
    <svg width="9" height="15" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M7 1L1 7l6 6" />
    </svg>
  );
}

/* ── Styles (Morgennatt-tokens; ingen tekst under 4.5:1-parene som allerede
     er verifisert: ink-900/700/500 på surface/canvas) ── */

const rootStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100dvh',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: 'max(50px, calc(env(safe-area-inset-top, 0px) + 12px))',
  fontFamily: 'var(--dw-font-ui)',
  color: 'var(--dw-ink-hi)',
  background: 'var(--dw-canvas)',
};

const topbarStyle: CSSProperties = {
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-10)',
  padding: 'var(--dw-space-6) var(--dw-space-16) var(--dw-space-12)',
};

const backBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  minWidth: 44,
  flex: 'none',
  borderRadius: 12,
  border: '1px solid var(--dw-hairline)',
  background: 'var(--dw-overlay)',
  // D2: hevet fyll uten lyslogikk. Knappen er et materiale man trykker på og
  // beholder derfor hevingen — den får lyset den manglet.
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
  color: 'var(--dw-ink-hi)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
};

const crumbStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  fontSize: '0.8125rem',
  color: 'var(--dw-ink-mid)',
};

const scrollStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  // C3: siste rad må aldri gjemmes bak global tab-bar. Fase 3: det gjettede
  // bunn-tallet (max(safe-area, 120px)) er byttet mot klaringstokenet, som
  // regner høyde + gap + safe-area ut av tab-barens egne mål.
  padding: '0 var(--dw-space-20) var(--dw-tabbar-clearance, 90px)',
  // D4: bunn-fade i stedet for hardt klipp — husmønsteret fra
  // hjem-monter.css / sheet.css / kle-paa-stepper.css.
  WebkitMaskImage: 'var(--dw-fade-bunn)',
  maskImage: 'var(--dw-fade-bunn)',
};

const titleStyle: CSSProperties = {
  margin: 'var(--dw-space-4) 0 var(--dw-space-8)',
  fontFamily: 'var(--font-serif)',
  fontWeight: 560,
  fontSize: 30,
  lineHeight: 1.1,
  letterSpacing: '-0.4px',
  outline: 'none',
};

const lessonTitleStyle: CSSProperties = { ...titleStyle, fontSize: 27 };

const coverStyle: CSSProperties = {
  display: 'block',
  width: 132,
  height: 132,
  // -6px er en optisk nudge (clay-heroens venstre luft) — står urørt.
  margin: 'var(--dw-space-2) 0 var(--dw-space-4) -6px',
  objectFit: 'contain',
};

const lessonHeroStyle: CSSProperties = {
  display: 'block',
  width: 168,
  height: 168,
  margin: 'var(--dw-space-2) auto var(--dw-space-8)',
  objectFit: 'contain',
};

const introStyle: CSSProperties = {
  margin: '0 0 var(--dw-space-6)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--dw-ink-mid)',
  maxWidth: '38ch',
};

const progressStyle: CSSProperties = {
  margin: '0 0 var(--dw-space-16)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--dw-ink-mid)',
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-10)',
};

const liStyle: CSSProperties = { listStyle: 'none' };

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-12)',
  width: '100%',
  // D5: 60 px lå under radhøyde-gulvet. Porten måler bare CSS-selektorer, så
  // denne inline-raden slapp unna — gulvet gjelder like fullt.
  minHeight: 'var(--dw-size-row)',
  padding: 'var(--dw-space-10) var(--dw-space-14)',
  border: '1px solid var(--dw-hairline)',
  borderRadius: 'var(--r-lg)',
  background: 'var(--dw-overlay)',
  // D2: --shadow-1 var ett flatt legacy-lag uten inset topplys.
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background var(--dw-m-feedback) var(--dw-ease)',
};

const weekBadgeStyle: CSSProperties = {
  flex: 'none',
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 700,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
  // D2: fyllet var --dw-raised (nivå 2) inne i en rad på --dw-overlay
  // (nivå 3) — en lavere flate som lå oppå en høyere. Husets plate-behandling
  // (.hjm-thumb) setter merket ett hakk OVER verten, med topplys og den
  // tettere dybden som hører små flater til.
  background: 'var(--dw-plate)',
  border: '1px solid var(--dw-plate-kant)',
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-selected)',
  boxSizing: 'border-box',
  color: 'var(--dw-ink-mid)',
};

const rowTextStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-2)',
};

const rowTitleStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 1.25,
  color: 'var(--dw-ink-hi)',
};

const rowStateStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'var(--dw-ink-mid)',
};

const chevStyle: CSSProperties = {
  flex: 'none',
  fontSize: 22,
  lineHeight: 1,
  color: 'var(--dw-ink-mid)',
};

const leadStyle: CSSProperties = {
  margin: '0 0 var(--dw-space-18)',
  fontSize: 16,
  lineHeight: 1.55,
  color: 'var(--dw-ink-hi)',
};

const sectionCardStyle: CSSProperties = {
  background: 'var(--dw-raised)',
  border: '1px solid var(--dw-hairline)',
  // D2: hevet fyll helt uten skygge. Kortet er en ekte gruppeflate og
  // beholder hevingen — den får dybdekontraktens form.
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--dw-space-16)',
  marginBottom: 'var(--dw-space-14)',
};

const eyebrowH2Style: CSSProperties = {
  margin: '0 0 var(--dw-space-4)',
  fontFamily: 'var(--dw-font-ui)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--dw-ink-mid)',
};

const sectionBodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 14.5,
  lineHeight: 1.55,
  color: 'var(--dw-ink-mid)',
};

const ctaStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  minHeight: 56,
  marginTop: 'var(--dw-space-8)',
  padding: 'var(--dw-space-16) var(--dw-space-24)',
  borderRadius: 24,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--dw-accent)',
  color: 'var(--dw-ink-on-accent)',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 700,
  boxShadow: 'var(--shadow-cta-primary)',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
};

export default VinterprogramScreen;
