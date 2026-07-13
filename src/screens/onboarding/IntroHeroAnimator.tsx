/**
 * IntroHeroAnimator — GSAP stagger-hero for OnboardingScreen step 1.
 *
 * Lazy-importert fra OnboardingScreen.tsx, slik at gsap + @gsap/react ikke
 * lastes for steg 2-5. Rendrer ingen markup — bruker `useGSAP` til å plukke
 * data-hero-elementer fra scope-ref og koreografere en cinematic stagger-
 * entrance under 1.5s.
 *
 * Timeline-koreografi (Apple HIG: glove-friendly tålmodighet ≤1.5s):
 *   0.00s — logo (.ob-illu) fade-in fra opacity 0 + scale(0.95)        — 0.55s
 *   0.20s — hero-title ord-for-ord fade + translateY (stagger 0.06s)    — 0.50s
 *   0.40s — avatar/input-field spring inn (scale + translateY)          — 0.55s
 *   0.60s — 5-stegs progress-dots stagger (0.06s/dot)                   — 0.40s
 *   0.80s — primary CTA fade + subtle pulse                             — 0.55s
 *
 * Reduced-motion:
 *   - Hvis `reducedMotion` er true (eller prefers-reduced-motion CSS-query
 *     er aktiv), kjører vi `gsap.set()` til ende-state UMIDDELBART istedenfor
 *     å animere. Innholdet er da synlig fra første frame.
 *   - CSS-fallback (i STYLE_CSS) sørger for at innholdet er synlig hvis
 *     denne komponenten aldri rekker å mounte.
 *
 * A11y:
 *   - SR-tekst er lesbar fra start (vi bruker opacity, ikke display:none)
 *   - Tittel-ord er semantisk én h1-streng (skjermlesere får sammenhengende
 *     tekst, ikke separate ord)
 *   - CTA-knappen har aria-live="polite" hint i parent, slik at SR-bruker
 *     får beskjed når den dukker opp visuelt — selv om DOM-en alltid finnes
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, type ReactElement, type RefObject } from 'react';

export type IntroHeroAnimatorProps = {
  /** Scope-ref til `<main>` — alle selectors kjøres innenfor denne. */
  scopeRef: RefObject<HTMLElement | null>;
  /** Native + media-query kombinert reduced-motion-flagg fra useNativeSettings. */
  reducedMotion: boolean;
};

export function IntroHeroAnimator(props: IntroHeroAnimatorProps): ReactElement | null {
  const { scopeRef, reducedMotion } = props;

  // CTA-knappen får aria-live ETTER at den er ferdig animert inn — slik at
  // SR-brukere får varsel om at en handlings-knapp er klar. Vi setter aria-live
  // via DOM her i stedet for via React-prop slik at vi unngår re-render av
  // hele knappen (og fordi attributtet kun gir mening når den ER synlig).
  useEffect(() => {
    const root = scopeRef.current;
    if (!root) return;
    const cta = root.querySelector<HTMLElement>('[data-hero="cta"]');
    if (!cta) return;
    // Marker som aria-live=polite umiddelbart hvis reduced-motion (knappen er
    // synlig fra start); ellers gjør vi det etter timeline.
    if (reducedMotion) {
      cta.setAttribute('aria-live', 'polite');
    }
    return () => {
      cta.removeAttribute('aria-live');
    };
  }, [scopeRef, reducedMotion]);

  useGSAP(
    () => {
      const root = scopeRef.current;
      if (!root) return;

      // Samle elementer (alle er garantert i DOM siden komponenten kun
      // mountes for step === 1).
      const logo = root.querySelector<HTMLElement>('[data-hero="logo"]');
      const eyebrow = root.querySelector<HTMLElement>('[data-hero="eyebrow"]');
      const titleWords = root.querySelectorAll<HTMLElement>('.ob-h2 [data-hero-word]');
      const lede = root.querySelector<HTMLElement>('[data-hero="lede"]');
      const avatar = root.querySelector<HTMLElement>('[data-hero="avatar"]');
      const dots = root.querySelectorAll<HTMLElement>('[data-hero-dot]');
      const cta = root.querySelector<HTMLElement>('[data-hero="cta"]');

      // Samlet liste over alle elementer som skal ende synlige. Brukes både
      // for reduced-motion shortcut og for safe end-state.
      const allTargets = [logo, eyebrow, ...Array.from(titleWords), lede, avatar, ...Array.from(dots), cta]
        .filter((el): el is HTMLElement => el !== null);

      // ─── REDUCED MOTION: sett ende-state direkte, ingen animasjon ───
      if (reducedMotion) {
        gsap.set(allTargets, { opacity: 1, scale: 1, x: 0, y: 0, clearProps: 'will-change' });
        return;
      }

      // ─── FRA-TILSTAND (bugfiks 2026-07-11) ───
      // Innholdet er SYNLIG som CSS-default (så steg 1 aldri er blankt hvis
      // GSAP feiler). Vi setter den skjulte fra-tilstanden her, i useGSAP sin
      // useLayoutEffect (før paint) → ingen synlig flash når GSAP er lastet.
      if (logo) gsap.set(logo, { opacity: 0, scale: 0.95, transformOrigin: 'center' });
      if (eyebrow) gsap.set(eyebrow, { opacity: 0 });
      if (titleWords.length) gsap.set(titleWords, { opacity: 0, y: 12 });
      if (lede) gsap.set(lede, { opacity: 0 });
      if (avatar) gsap.set(avatar, { opacity: 0, y: 14, scale: 0.97 });
      if (dots.length) gsap.set(dots, { opacity: 0, scale: 0.6, transformOrigin: 'center' });
      if (cta) gsap.set(cta, { opacity: 0, y: 6 });

      // ─── Timeline ───
      // defaults: standard ease for de fleste tweens; spring overskrider for
      // avatar/cta. Total varighet: ~1.35s (0.80 + 0.55 = 1.35s).
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out', duration: 0.55 },
        onComplete: () => {
          // Rydd opp will-change for å spare GPU-mem (ikke nødvendig under
          // animasjon lenger). Marker CTA som aria-live så SR varsles.
          gsap.set(allTargets, { clearProps: 'will-change' });
          if (cta) cta.setAttribute('aria-live', 'polite');
        },
      });

      // 0.00s — logo fade-in + scale fra 0.95 → 1
      if (logo) {
        tl.to(logo, { opacity: 1, scale: 1, duration: 0.55 }, 0);
      }
      // 0.05s — eyebrow rett etter logo (subtilt, leser-seg-sammen-med-tittel)
      if (eyebrow) {
        tl.to(eyebrow, { opacity: 1, duration: 0.4 }, 0.05);
      }
      // 0.20s — hero-tittel ord-for-ord (stagger 0.06s mellom ord)
      if (titleWords.length) {
        tl.to(
          titleWords,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power3.out',
          },
          0.2,
        );
      }
      // 0.35s — lede-paragraph følger tittelen
      if (lede) {
        tl.to(lede, { opacity: 1, duration: 0.45 }, 0.35);
      }
      // 0.40s — avatar/input spring-feel (back.out for lett overskudd)
      if (avatar) {
        tl.to(
          avatar,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.55,
            ease: 'back.out(1.4)',
          },
          0.4,
        );
      }
      // 0.60s — progress-dots stagger inn (0.06s/dot)
      if (dots.length) {
        tl.to(
          dots,
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            stagger: 0.06,
            ease: 'back.out(1.6)',
          },
          0.6,
        );
      }
      // 0.80s — CTA fade-in + subtle pulse (scale 1 → 1.03 → 1, kun én gang)
      if (cta) {
        tl.to(cta, { opacity: 1, y: 0, duration: 0.45 }, 0.8);
        tl.to(
          cta,
          {
            scale: 1.03,
            duration: 0.22,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 1,
          },
          1.0,
        );
      }
    },
    // Scope binder selectors til denne subtree-en; dependencies tom array
    // siden hele komponenten kun mountes for step === 1 og unmountes ved
    // step-bytte (useGSAP håndterer revert/cleanup automatisk).
    { scope: scopeRef, dependencies: [reducedMotion] },
  );

  return null;
}

export default IntroHeroAnimator;
