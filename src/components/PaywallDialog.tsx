/**
 * PaywallDialog — F81.5-W1: delt Premium-paywall (native <dialog>).
 *
 * P10/JOB2 (2026-08-01): re-skinnet til betalingsvegg v2
 * (docs/mocks/monter/paywall-v2.html + paywall-v2-valgt.html,
 * docs/design-notes/sol-duel-2026-07-31.md §8) — DEN gamle serif-hero-en
 * («Hele Babyora, samlet i én plan», grønn tillitslinje, forhåndsvalgt
 * Årlig, glødende kant, hvit ytterramme) er fjernet. Ny kontrakt:
 *  - ÉN hevet flate («ark»/`.pw-sheet`) — verdiseksjon + planvelger delt av
 *    en INTERN hairline, ingen egen farget hero-boks.
 *  - Overskrift «Du har sett dagens gratis antrekk» + underlinje, tre
 *    hake-verdipunkter (PAYWALL_VALUE_BULLETS, uendret innhold/rekkefølge —
 *    kun ny visuell ramme).
 *  - TRE likeverdige prisrader (Årlig/Kvartal/Månedlig) — Årlig har en
 *    tekst-badge «Best verdi» + «X kr per måned · spar Y % mot månedsplan»,
 *    ALDRI et forhåndsvalgt kort. Fraunces WONK 0 KUN på prissummene.
 *  - Valgt tilstand: --dw-accent-surface-bakgrunn + fylt radio — INGEN
 *    kant-ring/glød (§8: doktrinen forbyr glød utover selve flaten).
 *  - Fornyelses-breakdown («I dag 0 kr / <ekte dato +7 dager> <pris> /
 *    Fornyes deretter …») vises KUN under den valgte raden.
 *  - Dynamisk, ARMERT CTA («Start gratis – deretter 299 kr/år») — hviler
 *    («Velg en plan for å starte gratis») til et AKTIVT valg er gjort.
 *  - Lenkerad: Gjenopprett kjøp · Personvern · Vilkår, ≥13px/44pt.
 *
 * ALT av eksisterende ATFERD er UENDRET av denne re-skinningen: dismissable-
 * kontrakten, kjøps-/gjenopprettingsflyten, subscription-store-oppdatering,
 * P9-haptikk-vokabularet, analytics (paywall_viewed/paywall_converted/
 * trial_started), F83 modal-pop-animasjonen (kun kosmetisk restylet — samme
 * enter/exit-mekanikk), fokus-retur, ESC/backdrop-håndtering.
 *
 * Ekstrahert fra InnstillingerScreen slik at ethvert trigger-punkt i appen
 * (Innstillinger, onboarding, feature-gates) kan åpne SAMME dialog med
 * samme copy/analytics/kjøpslogikk — kun `trigger` varierer.
 *
 * Eier hele kjøpsflyten selv (plan-valg, purchasePackage/restorePurchases,
 * subscription-store, analytics) — kall-steder trenger kun
 * open/trigger/onClose/returnFocusTo. Se PaywallDialogProps.
 *
 * Mønster (identisk med øvrige dialoger i InnstillingerScreen.tsx):
 *  - native <dialog> + showModal()/close() styrt via ref + useEffect
 *  - ESC/backdrop-klikk lukker via native 'close'-event → onClose() + focus-return
 *  - prefers-reduced-motion respekteres av det globale killswitchet i
 *    design-tokens.css (transition-duration: 0.01ms !important) — vi
 *    trenger ingen egen media-query for det.
 *
 * A11y (P2/SHIP-blockers fra F81.5-W1-spec, uendret av v2-re-skinningen):
 *  - <fieldset>/<legend> + native <input type="radio"> (roving tabindex +
 *    piltaster gratis) — radio visuelt skjult med sr-only-klipp-teknikk
 *    (IKKE display:none, forblir fokuserbar), stylet synlig rad.
 *  - Hvert kort sitt aria-label inneholder ALT som vises visuelt i kortet.
 *  - Valgt tilstand vises med accent-surface-bakgrunn OG et fylt
 *    radio-punkt — aldri farge alene.
 *  - CTA bruker aria-disabled + klikk-guard under pending/uvalgt — ALDRI
 *    disabled-attributt (ville fjernet fokus fra knappen midt i et trykk).
 *  - role="status" (tom fra åpning) for behandling/suksess,
 *    role="alert" (mountes kun ved feil) for feilmeldinger + konkret råd.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type SyntheticEvent as ReactSyntheticEvent,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../state/subscription-store';
import {
  notifyError,
  notifySuccess,
  prepare as prepareHaptics,
  selection as fireSelection,
} from '../lib/haptics.js';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { track } from '../lib/analytics/track';
import {
  isRevenueCatConfigured,
  purchasePackage,
  restorePurchases,
} from '../lib/billing/revenuecat';
import {
  PRODUCT_IDS,
  type PaywallTrigger,
  type ProductKey,
} from '../lib/premium/products';
import {
  LOCALIZED_PLAN_ORDER,
  paywallCopyFor,
} from './paywall-localization.js';

// ─────────────────────────────────────────────────────────────────────────────
// Props — W2 bygger mot denne kontrakten. IKKE avvik.
// ─────────────────────────────────────────────────────────────────────────────

export interface PaywallDialogProps {
  open: boolean;
  /** null = generisk inngang (Innstillinger/onboarding) — viser "Babyora Pluss". */
  trigger: PaywallTrigger | null;
  onClose: () => void;
  /** Fokus-retur ved lukk. */
  returnFocusTo?: HTMLElement | null;
  /**
   * P2 hard paywall: default true (uendret atferd for alle eksisterende
   * kall-steder). Sett til false for AppPaywallGate sin blokkerende
   * inngang — da finnes ingen lukk-knapp, ESC/backdrop ('cancel'-eventet)
   * avbrytes med preventDefault, og det native 'close'-eventet kaller
   * ALDRI onClose. Eneste vei videre er et vellykket kjøp eller en
   * vellykket gjenoppretting.
   */
  dismissable?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoped CSS — pseudo-klasser (:checked/:focus-visible) kan ikke uttrykkes
// via inline style-objekter. Speiler mønsteret i OnboardingScreen.tsx
// (className + <style>{STYLE_CSS}</style>).
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_CSS = `
.pw-plan-label {
  display: block;
  position: relative;
}
.pw-plan-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
/* v2 (§8): valgt tilstand = accent-surface-bakgrunn + fylt radio. INGEN
   kant-ring/glød — doktrinen forbyr effekt-inflasjon utover selve flaten. */
.pw-plan-unit {
  /* MUST be block: this is a <span> (kept inline-default so the sr-only
     radio-input + label wrapping stays valid HTML), but it contains
     display:flex/block children (.pw-plan-row, .pw-breakdown). An inline
     box that contains block-level children gets its background/
     border-radius painted PER ANONYMOUS-BLOCK FRAGMENT (before/after each
     block child) instead of as one continuous shape — which is exactly
     what produced small stray accent-surface padding-box artifacts above
     "I dag" and below "Avsluttes i App Store" during v2 QA. */
  display: block;
  border-radius: 12px;
  /* --dw-m-state, ikke -feedback: kontrakten definerer state som
     «tilstandsbytte inne i en flate (rad blir aktiv)», som er nøyaktig det
     som skjer når en plan velges. -feedback er trykkrespons (scale/translate)
     og ville vært valgt på tallet (120 mot 160), ikke på handlingen.
     --ease-standard er legacy-familiens egen kurve; kontraktens er --dw-ease. */
  transition: background var(--dw-m-state) var(--dw-ease);
}
.pw-plan-input:checked + .pw-plan-unit {
  background: var(--dw-accent-surface);
}
.pw-plan-input:focus-visible + .pw-plan-unit {
  outline: 3px solid var(--dw-focus);
  outline-offset: 2px;
}
.pw-plan-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--dw-space-12);
  padding: 13px var(--dw-space-6);
  min-height: 62px;
  cursor: pointer;
}
.pw-p-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--dw-ink-low);
  flex: none;
  box-sizing: border-box;
}
.pw-plan-input:checked + .pw-plan-unit .pw-p-radio {
  border-color: var(--dw-accent-300);
  background: var(--dw-accent);
  box-shadow: inset 0 0 0 4px var(--dw-accent-surface);
}
.pw-p-text { flex: 1; min-width: 0; }
.pw-p-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--dw-ink-hi);
  display: block;
  letter-spacing: -0.1px;
}
.pw-p-badge {
  display: inline-block;
  /* rgba(231, 176, 135, .45) === --dw-accent-300 (#E7B087) ved 45 % alfa.
     color-mix mot transparent gir bit-identisk resultat (premultiplisert
     sRGB), og --dw-accent-300 deklareres kun én gang, så verdien er lik i
     begge tema — samme piksler som før. */
  border: 1px solid color-mix(in srgb, var(--dw-accent-300) 45%, transparent);
  color: var(--dw-ink-mid);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  border-radius: var(--dw-r-pill);
  padding: var(--dw-space-2) var(--dw-space-8);
  margin-left: 7px;
  vertical-align: 2px;
}
.pw-p-note {
  font-size: 0.8125rem;
  color: var(--dw-ink-mid);
  display: block;
  margin-top: 1px;
  line-height: 1.35;
}
.pw-p-price { text-align: right; flex: none; }
.pw-p-sum {
  font-family: var(--dw-font-hero);
  font-variation-settings: 'WONK' 0;
  font-size: 1.4375rem;
  font-weight: 550;
  display: block;
  font-variant-numeric: lining-nums tabular-nums;
  color: var(--dw-ink-hi);
  letter-spacing: -0.01em;
}
.pw-p-per { font-size: 0.8125rem; color: var(--dw-ink-low); display: block; }
.pw-breakdown { display: block; padding: var(--dw-space-2) var(--dw-space-6) var(--dw-space-14) 38px; }
/* P10.1 (judge finding B5): CSS grid (not flex space-between) so the
   label/amount columns share one strict alignment axis across BOTH rows —
   reads as a tight two-column table instead of loose prose. tabular-nums
   on the ROW (not just .pw-bd-amt) so the date label ("7. august") and
   the amount both use fixed-width digits. */
.pw-bd-row {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: var(--dw-space-12);
  align-items: baseline;
  font-size: 0.8125rem;
  color: var(--dw-ink-mid);
  padding: 2.5px 0;
  font-variant-numeric: tabular-nums;
}
.pw-bd-amt { font-weight: 600; color: var(--dw-ink-hi); font-variant-numeric: tabular-nums; text-align: right; }
.pw-bd-note {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--dw-ink-low);
  margin-top: 5px;
  padding-top: 7px;
  border-top: 1px solid rgba(241, 233, 218, 0.08);
  display: block;
}
/* Lukk-knappen ligger på canvas-bakgrunnen. */
.pw-close-btn:focus-visible {
  outline: 3px solid var(--dw-focus);
  outline-offset: 2px;
}
.pw-cta-btn:focus-visible {
  outline: 3px solid var(--dw-focus);
  outline-offset: 2px;
}
/* P10.1 (judge finding B1): the RESTING (unarmed) CTA is showModal()'s
   auto-focus target (see the comment above this component's own
   showModal()-effect) but is deliberately aria-disabled/click-guarded
   until a plan is chosen — a non-interactive control still wearing a
   2px amber focus ring reads as a broken button ("contract says
   border:0"). Suppressed ONLY while resting; a genuinely armed CTA the
   user tabs to keeps its normal focus ring. */
.pw-cta-btn[aria-disabled='true'] {
  border: 0;
}
/* Fase 3-fokusregel: "outline: none" uten erstatning er forbudt. INGEN
   backticks i denne kommentaren — hele blokken bor inne i en
   template-streng, så et backtick-par lukker og gjenåpner den og river
   filen i to. Den
   hvilende CTA-en er fortsatt tastaturmål (aria-disabled, ikke disabled),
   så den skal ha en ekte ring. Ringen ligger UTENFOR knappen (offset 3px)
   og måles derfor mot arket, ikke mot knappeflaten — samme geometri som den
   globale regelen i design-tokens.css. Den klippes ikke av dialogens
   overflow:hidden fordi bunnfeltet allerede har 20px sideinnrykk. */
.pw-cta-btn[aria-disabled='true']:focus-visible {
  outline: 2px solid var(--dw-focus);
  outline-offset: 3px;
}
.pw-restore-btn:focus-visible,
.pw-link:focus-visible {
  outline: 2px solid var(--dw-focus);
  outline-offset: 2px;
}
/* F83: modal-pop enter/exit (sentrert kort → pop, ikke sheet-slide).
   data-closing settes av requestClose; animationend → close(). RM → instant. */
.pw-dialog::backdrop {
  background: rgba(10, 7, 5, 0.55);
}
/* P10.1 (judge finding B2): the non-dismissable gate (dismissable=false)
   is a FULL-BLEED stage per paywall-v2.html's contract — canvas
   background fills the whole viewport, so there is nothing "behind" it
   left to dim. A visible grey scrim there reads as a centered card
   floating over the app, not as the screen itself. */
.pw-dialog[data-fullbleed='true']::backdrop {
  background: transparent;
}
/* Bevegelseskontrakten sier «semantikk, ikke størrelse — bruk navnet som
   beskriver HANDLINGEN» (design-tokens-v2.css). Modalen kommer inn som en
   vertikal push (translateY + scale) og går ut igjen: --dw-m-push / -push-back,
   samme par som PlaggDetailSheet allerede lukker med. Kontraktens regel 1 —
   ut er raskere enn inn — holder (280 < 340).

   BACKDROPEN følger sin egen dialog i stedet for å få eget tall: et scrim er
   ikke et selvstendig objekt, det er rommet dialogen kaster. --dw-m-atmo ble
   prøvd og forkastet — det tokenet er reservert lyspoolens krysstoning og
   sier uttrykkelig «ALDRI transform».

   Kurvene går alle til --dw-ease; --ease-standard og ease-out var to
   parallelle dialekter ved siden av kontrakten. */
.pw-dialog[open] {
  animation: pw-modal-in var(--dw-m-push) var(--dw-ease);
}
.pw-dialog[open]::backdrop {
  animation: pw-backdrop-in var(--dw-m-push) var(--dw-ease);
}
.pw-dialog[data-closing] {
  animation: pw-modal-out var(--dw-m-push-back) var(--dw-ease) forwards;
}
.pw-dialog[data-closing]::backdrop {
  animation: pw-backdrop-out var(--dw-m-push-back) var(--dw-ease) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .pw-dialog[open],
  .pw-dialog[data-closing],
  .pw-dialog[open]::backdrop,
  .pw-dialog[data-closing]::backdrop {
    animation: none;
  }
  .pw-plan-unit { transition: none; }
}
@keyframes pw-modal-in {
  from { transform: translateY(16px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0)    scale(1);    opacity: 1; }
}
@keyframes pw-modal-out {
  from { transform: translateY(0)   scale(1);    opacity: 1; }
  to   { transform: translateY(12px) scale(0.97); opacity: 0; }
}
@keyframes pw-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pw-backdrop-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Styles (inline — samme konvensjon som resten av InnstillingerScreen.tsx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * P10.1 (judge finding B2): the non-dismissable gate (AppPaywallGate,
 * `dismissable=false`) rendered as a small CENTERED CARD over a grey
 * scrim — the actual contract (paywall-v2.html) is a FULL-BLEED STAGE:
 * width/height 100% of the viewport, no backdrop needed (see the
 * `[data-fullbleed]::backdrop` rule above), canvas background per theme.
 * `dismissable=true` call-sites (Innstillinger, onboarding, feature
 * gates) are UNCHANGED — they keep the original centered-card dialog
 * styling; only the hard, non-dismissable gate becomes the stage.
 */
function dialogStyle(dismissable: boolean): CSSProperties {
  if (!dismissable) {
    return {
      padding: 0,
      border: 'none',
      borderRadius: 0,
      inset: 0,
      width: '100%',
      height: '100%',
      maxWidth: 'none',
      maxHeight: 'none',
      margin: 0,
      background: 'linear-gradient(168deg, var(--dw-canvas-glow) 0%, var(--dw-canvas) 46%)',
      color: 'var(--dw-ink-hi)',
      boxShadow: 'none',
      fontFamily: 'var(--dw-font-ui)',
      overflow: 'hidden',
    };
  }
  return {
    padding: 0,
    border: 'none',
    borderRadius: 22,
    maxWidth: 440,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: 'linear-gradient(168deg, var(--dw-canvas-glow) 0%, var(--dw-canvas) 46%)',
    color: 'var(--dw-ink-hi)',
    boxShadow: '0 24px 60px -20px rgba(0, 0, 0, 0.6)',
    fontFamily: 'var(--dw-font-ui)',
    overflow: 'hidden',
  };
}

function innerSurfaceStyle(dismissable: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: dismissable ? 'calc(100dvh - 32px)' : '100%',
    height: dismissable ? undefined : '100%',
  };
}

/** Fullbleed (B2): the outer dialog no longer carries its own top margin, so
 *  the brand row needs its own safe-area-aware top clearance to stay clear
 *  of the status bar/notch — the centered-card variant already gets that
 *  for free from the dialog's own `margin: auto` breathing room. */
function scrollAreaStyle(dismissable: boolean): CSSProperties {
  return {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: dismissable
      ? 'var(--dw-space-20) var(--dw-space-20) var(--dw-space-6)'
      : 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px)) var(--dw-space-20) var(--dw-space-6)',
    WebkitOverflowScrolling: 'touch',
    // D4: innholdet forsvinner opp under <footer>, og kanten må si fra at
    // det er mer. Husets egen rampe (sheet.css, hjem-monter.css,
    // kle-paa-stepper.css bruker nøyaktig samme) — ingen ny verdi.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
  };
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--dw-space-12)',
  marginBottom: 'var(--dw-space-12)',
};

const brandStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 700,
  letterSpacing: '0.24em',
  color: 'var(--dw-ink-hi)',
};

const closeBtnStyle: CSSProperties = {
  flex: 'none',
  width: 36,
  height: 36,
  borderRadius: 11,
  border: '1px solid rgba(241, 233, 218, 0.16)',
  background: 'rgba(241, 233, 218, 0.08)',
  color: 'var(--dw-ink-hi)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 18,
  lineHeight: 1,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

// ÉN hevet flate (Dybdedoktrinen regel 1): verdiseksjon + planvelger er
// seksjoner i SAMME ark, delt av en intern hairline — ikke to separate
// bokser. Kantlys kun øverst (§6: hero-punktet), 16% opasitet.
const sheetStyle: CSSProperties = {
  position: 'relative',
  background: 'var(--dw-raised)',
  borderRadius: 20,
  // rgba(242, 192, 138, .14) === --dw-edge-light (#F2C08A) ved 14 % alfa;
  // tokenet deklareres kun én gang, så verdien er lik i begge tema.
  boxShadow:
    '0 1px 0 color-mix(in srgb, var(--dw-edge-light) 14%, transparent) inset, 0 16px 34px -18px rgba(52, 30, 12, 0.65)',
};

const sheetEdgeLightStyle: CSSProperties = {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '7%',
  right: '7%',
  height: 1,
  borderRadius: 2,
  // Identisk uttrykk som --dw-edge-light-gradient i design-tokens-v2.css.
  background: 'var(--dw-edge-light-gradient)',
  opacity: 0.16,
  pointerEvents: 'none',
};

const valueStyle: CSSProperties = {
  padding: 'var(--dw-space-20) var(--dw-space-18) var(--dw-space-16)',
};

const vHeadStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.375rem',
  fontWeight: 700,
  letterSpacing: '-0.012em',
  lineHeight: 1.18,
  color: 'var(--dw-ink-hi)',
};

const vSubStyle: CSSProperties = {
  margin: 'var(--dw-space-8) 0 0',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  color: 'var(--dw-ink-mid)',
  maxWidth: '30ch',
};

const vListStyle: CSSProperties = {
  margin: 'var(--dw-space-14) 0 0',
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
};

const vListItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 9,
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  color: 'var(--dw-ink-mid)',
};

const vListIconStyle: CSSProperties = {
  width: 15,
  height: 15,
  flex: 'none',
  marginTop: 1,
  color: 'var(--dw-ink-hi)',
};

/** P10.1 (judge finding B3): the bold keyword lead, ink-hi/600 vs. the
 *  ink-mid/regular body it sits in (paywall-v2.html's own `.v-list b`). */
const vListLeadStyle: CSSProperties = {
  color: 'var(--dw-ink-hi)',
  fontWeight: 600,
};

const fieldsetStyle: CSSProperties = {
  border: 'none',
  margin: 0,
  padding: 'var(--dw-space-4) var(--dw-space-12)',
  borderTop: '1px solid var(--dw-hairline)',
};

const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const chooseHintStyle: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontSize: '0.8125rem',
  color: 'var(--dw-ink-low)',
  padding: 'var(--dw-space-14) var(--dw-space-4) 0',
};

const statusRegionStyle: CSSProperties = {
  margin: 'var(--dw-space-10) var(--dw-space-2) 0',
  minHeight: 0,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--dw-success)',
  lineHeight: 1.3,
  textAlign: 'center',
};

const errorRegionStyle: CSSProperties = {
  margin: 'var(--dw-space-10) var(--dw-space-2) 0',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--dw-danger)',
  lineHeight: 1.35,
  textAlign: 'center',
};

// P10.1 (judge finding B4): the selected/breakdown state pushed the legal
// links to ~17pt from the bottom edge — too close to the safe-area/Dynamic
// Type collision zone. Bumped to a firm ~24pt (env() + 24px) floor; content
// above scrolls (scrollAreaStyle already owns its own overflow-y) so the
// footer + this clearance are ALWAYS fully visible, never compressed.
const footerStyle: CSSProperties = {
  flex: 'none',
  padding: 'var(--dw-space-12) var(--dw-space-20) calc(env(safe-area-inset-bottom, 0px) + 24px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-4)',
};

function ctaBtnStyle(armed: boolean, pending: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: 54,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: armed ? 'var(--dw-accent)' : 'rgba(241, 233, 218, 0.10)',
    color: armed ? 'var(--dw-ink-on-accent)' : 'var(--dw-ink-mid)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '-0.1px',
    cursor: pending ? 'wait' : armed ? 'pointer' : 'default',
    boxShadow: armed ? '0 10px 22px -12px rgba(0, 0, 0, 0.55)' : 'none',
    opacity: pending ? 0.92 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
}

function restoreBtnStyle(pending: boolean): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: 'var(--dw-ink-mid)',
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: pending ? 'wait' : 'pointer',
    padding: 'var(--dw-space-12) var(--dw-space-6)',
    minHeight: 44,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
}

const linksRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'var(--dw-space-4)',
  marginTop: 'var(--dw-space-4)',
  flexWrap: 'wrap',
};

const dotStyle: CSSProperties = {
  color: 'var(--dw-ink-low)',
  fontSize: '0.8125rem',
};

const legalLinkStyle: CSSProperties = {
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  padding: 'var(--dw-space-4) var(--dw-space-10)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--dw-ink-mid)',
  letterSpacing: '.05px',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

function CheckIcon(): ReactElement {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={vListIconStyle}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PaywallDialog({
  open,
  trigger,
  onClose,
  returnFocusTo,
  dismissable = true,
}: PaywallDialogProps): ReactElement {
  const { i18n } = useTranslation();
  const paywall = paywallCopyFor(i18n.resolvedLanguage ?? i18n.language);
  const copy = paywall.text;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPremium = useSubscription((s) => s.setPremium);

  // P9 (duel §3): varmer opp den native haptikk-motoren idet dialogen
  // mountes — samme mønster som useHapticSystem() sin egen mount-effekt
  // hadde (fjernet herfra siden denne filen nå bruker lib/haptics.ts
  // direkte, ikke hooken).
  useEffect(() => {
    void prepareHaptics();
  }, []);

  // v2 (§8): INGEN forhåndsvalgt plan — CTA hviler til et AKTIVT valg er
  // gjort. `null` = ingen rad valgt ennå.
  const [selectedPlan, setSelectedPlan] = useState<ProductKey | null>(null);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // v2: "i dag" for fornyelses-breakdownen — fanget ved åpne-overgangen
  // (render-tids state-justering under, IKKE Date.now() lest inni JSX),
  // slik at «I dag / <dato+7 dager>» er stabil gjennom hele den åpne økten.
  const [renewalBaseMs, setRenewalBaseMs] = useState(() => Date.now());

  const capabilityCopy = copy.capability;

  const clearAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  /* F83 modal-exit (a11y-preclearance vilkår 3 — samme mønster som
     PlaggDetailSheet, men modal-pop-varianter siden dette er et sentrert
     kort, ikke et bottom-sheet): requestClose = eneste lukke-vei
     (X/backdrop/ESC/auto-close). Single-flight + ESC-nr.2-hatch + RM-gren
     + filtrert animationend + 400ms fallback. */
  const { reducedMotion } = useNativeSettings();
  const closingRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

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
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target !== dlg) return;
      cleanup();
      if (dlg.open) dlg.close();
    };
    dlg.addEventListener('animationend', onEnd);
    exitTimerRef.current = window.setTimeout(() => {
      cleanup();
      if (dlg.open) dlg.close();
    }, 400);
  }, [reducedMotion]);

  const handleCancel = (e: ReactSyntheticEvent<HTMLDialogElement>) => {
    if (!dismissable) {
      // P2 hard paywall: ESC må ALDRI lukke en ikke-avviselig paywall —
      // ingen ESC-nr.2-luke, ingen RM-unntak.
      e.preventDefault();
      return;
    }
    if (reducedMotion) return;
    if (closingRef.current) return; // ESC nr. 2 → native close
    e.preventDefault();
    requestClose();
  };

  const scheduleAutoClose = useCallback(() => {
    clearAutoClose();
    autoCloseTimerRef.current = setTimeout(() => {
      requestClose();
    }, 1400);
  }, [clearAutoClose, requestClose]);

  // Nullstill lokal state ved hver åpne-overgang (fresh visit).
  //
  // Bevisst IKKE en useEffect: "adjusting state when a prop changes" er
  // Reacts egen anbefalte idiom for dette (se react.dev/reference/react/useState
  // — "Storing information from previous renders") — vi sammenligner `open`
  // mot en `prevOpen`-state og kaller setState under selve render-kallet i
  // stedet for i en commit-fase-effekt. Unngår react-hooks/set-state-in-effect
  // OG unngår et unødvendig ekstra flash-render vs. en effekt-basert reset.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedPlan(null);
      setPending(false);
      setStatusMessage('');
      setErrorMessage(null);
      // `renewalBaseMs` ("i dag" i breakdownen) er BEVISST IKKE nullstilt
      // her — `Date.now()` er en impur funksjon (react-hooks/purity forbyr
      // å kalle den i render-kroppen, selv i en betinget render-tids
      // state-justering som denne). Fanges i stedet i den EKSISTERENDE
      // native <dialog>-åpne-effekten rett under (som allerede gjør et
      // impurt DOM-kall, showModal() — samme arbeidsdeling som resten av
      // denne render-tids-justeringen/effekt-splitten i filen).
    }
  }

  // Analytics ER en ekte side-effekt (skriver til et eksternt system) og hører
  // hjemme i en effekt — kjøres kun ved open-overgang (deps=[open] med
  // `trigger` lest fra closure, siden vi bevisst IKKE vil re-fyre bare fordi
  // trigger-proppen endrer seg mens dialogen allerede står åpen).
  useEffect(() => {
    if (!open) return;
    track({ type: 'paywall_viewed', trigger: trigger ?? 'generic' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Åpne/lukk det native <dialog>-elementet i takt med `open`. Fanger også
  // `renewalBaseMs` ("i dag" for fornyelses-breakdownen) her — SAMME effekt
  // som allerede gjør det ene impure DOM-kallet (showModal()) denne
  // komponenten trenger, i stedet for en egen effekt hvis eneste jobb ville
  // vært "speile open inn i en tidsstempel-state" (nettopp mønsteret
  // react-hooks/set-state-in-effect advarer mot).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      setRenewalBaseMs(Date.now());
      // showModal()'s OWN default-focus algorithm runs synchronously here
      // and — since React's `autoFocus` prop never sets a real `autofocus`
      // HTML attribute (it does an imperative .focus() on commit instead,
      // which can lose this race) — it was landing on the fieldset's FIRST
      // radio input (Årlig) instead of the CTA, drawing a stray
      // :focus-visible ring around the Årlig row on the RESTING screen
      // (found during P10/JOB2 screenshot QA: the row looked "highlighted"
      // even though §8 requires NO preselected/highlighted plan). Focusing
      // the CTA explicitly, AFTER showModal(), wins the race reliably.
      ctaRef.current?.focus();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose.
  // P2 hard paywall: når dismissable=false kaller det native 'close'-
  // eventet ALDRI onClose — en ikke-avviselig paywall skal bare forsvinne
  // fordi den overliggende `open`-tilstanden (isPremium) faktisk endret seg
  // etter et vellykket kjøp/gjenoppretting, aldri fordi selve dialogen
  // rapporterte at den lukket seg.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      clearAutoClose();
      // F83: nullstill exit-state så neste åpning starter rent.
      closingRef.current = false;
      dlg.removeAttribute('data-closing');
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (!dismissable) return;
      onClose();
      requestAnimationFrame(() => {
        returnFocusTo?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, returnFocusTo, clearAutoClose, dismissable]);

  useEffect(() => clearAutoClose, [clearAutoClose]);

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    if (!dismissable) return; // P2 hard paywall: backdrop-klikk lukker aldri
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      requestClose();
    }
  };

  // P9 (duel §3): «Prisplan velges» — selection, samme språk som andre valg.
  const handleSelectPlan = useCallback(
    (key: ProductKey) => {
      void fireSelection();
      setSelectedPlan(key);
    },
    [],
  );

  const handlePurchase = async () => {
    if (pending || selectedPlan === null) return;
    const plan = selectedPlan;
    // P9 (duel §3): INGEN haptikk på selve kjøpsknapp-trykket (forbudt —
    // "kjøpsknapp-trykk" står eksplisitt i forbuds-listen). Suksess/feil
    // varsles KUN etter at StoreKit/RevenueCat faktisk har svart, under.
    setPending(true);
    setErrorMessage(null);
    setStatusMessage(copy.statusProcessing);
    try {
      if (!isRevenueCatConfigured() || !Capacitor.isNativePlatform()) {
        // Web/dev-mock: simuler vellykket kjøp slik at Premium-UI kan testes
        // uten et ekte RevenueCat-oppsett.
        setPremium(true);
        setStatusMessage(copy.statusActivatedTestmode);
        track({ type: 'paywall_converted', plan });
        if (plan === 'yearly') track({ type: 'trial_started', plan });
        void notifySuccess();
        scheduleAutoClose();
        return;
      }
      const result = await purchasePackage(PRODUCT_IDS[plan]);
      if (result.success) {
        setPremium(true);
        setStatusMessage(copy.statusActivated);
        track({ type: 'paywall_converted', plan });
        if (plan === 'yearly') track({ type: 'trial_started', plan });
        void notifySuccess();
        scheduleAutoClose();
      } else {
        setStatusMessage('');
        setErrorMessage(copy.errorPurchaseFailed);
        void notifyError();
      }
    } catch (err) {
      console.error('[Babyora] PaywallDialog purchase feilet', err);
      setStatusMessage('');
      setErrorMessage(copy.errorPurchaseException);
      void notifyError();
    } finally {
      setPending(false);
    }
  };

  const handleRestore = async () => {
    if (pending) return;
    // P9 (duel §3): samme regel som kjøpsknappen — ingen haptikk på selve
    // trykket, kun på et faktisk resultat (nedenfor).
    setPending(true);
    setErrorMessage(null);
    setStatusMessage(copy.statusRestoreChecking);
    try {
      if (!isRevenueCatConfigured() || !Capacitor.isNativePlatform()) {
        setStatusMessage('');
        setErrorMessage(copy.errorRestoreDevOnly);
        void notifyError();
        return;
      }
      const restored = await restorePurchases();
      if (restored) {
        setPremium(true);
        setStatusMessage(copy.statusActivated);
        void notifySuccess();
        scheduleAutoClose();
      } else {
        setStatusMessage(copy.statusNoRestore);
      }
    } catch (err) {
      console.error('[Babyora] PaywallDialog restore feilet', err);
      setStatusMessage('');
      setErrorMessage(copy.errorRestoreException);
      void notifyError();
    } finally {
      setPending(false);
    }
  };

  const onCtaClick = () => {
    if (pending || selectedPlan === null) return;
    void handlePurchase();
  };

  const onRestoreClick = () => {
    if (pending) return;
    void handleRestore();
  };

  const armed = selectedPlan !== null;
  const ctaLabel = pending
    ? copy.ctaPending
    : armed
      ? paywall.armedCtaLabel(selectedPlan)
      : copy.ctaResting;
  const breakdown = selectedPlan !== null
    ? paywall.planBreakdown(selectedPlan, renewalBaseMs)
    : null;

  return (
    <dialog
      ref={dialogRef}
      className="pw-dialog"
      data-fullbleed={dismissable ? undefined : 'true'}
      aria-labelledby="paywall-title"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      style={dialogStyle(dismissable)}
    >
      <style>{STYLE_CSS}</style>
      <div style={innerSurfaceStyle(dismissable)}>
        <div style={scrollAreaStyle(dismissable)}>
          <div style={topRowStyle}>
            <span style={brandStyle}>BABYORA</span>
            {dismissable && (
              <button
                type="button"
                className="pw-close-btn"
                aria-label={copy.closeLabel}
                onClick={requestClose}
                style={closeBtnStyle}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          <section style={sheetStyle} aria-label={copy.sheetAriaLabel}>
            <span aria-hidden="true" style={sheetEdgeLightStyle} />
            <div style={valueStyle}>
              <h2 id="paywall-title" style={vHeadStyle}>{capabilityCopy.heading}</h2>
              <p style={vSubStyle}>{capabilityCopy.body}</p>
              <ul style={vListStyle}>
                {capabilityCopy.previewItems.map((item) => (
                  <li key={item.key} style={vListItemStyle}>
                    <CheckIcon />
                    <span>
                      <b style={vListLeadStyle}>{item.lead}</b>
                      {item.label.slice(item.lead.length)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <fieldset style={fieldsetStyle} role="radiogroup" aria-label={copy.legend}>
              <legend style={srOnlyStyle}>{copy.legend}</legend>
              {LOCALIZED_PLAN_ORDER.map((key) => {
                const row = paywall.planRow(key);
                const selected = selectedPlan === key;
                return (
                  <label key={key} className="pw-plan-label">
                    <input
                      type="radio"
                      name="babyora-plan"
                      className="pw-plan-input"
                      value={key}
                      checked={selected}
                      onChange={() => handleSelectPlan(key)}
                      aria-label={paywall.planAriaLabel(key)}
                    />
                    <span className="pw-plan-unit">
                      <span className="pw-plan-row">
                        <span className="pw-p-radio" aria-hidden="true" />
                        <span className="pw-p-text">
                          <span className="pw-p-name">
                            {row.name}
                            {row.badge && <span className="pw-p-badge">{row.badge}</span>}
                          </span>
                          <span className="pw-p-note">{row.note}</span>
                        </span>
                        <span className="pw-p-price">
                          <span className="pw-p-sum">{row.sum}</span>
                          <span className="pw-p-per">{row.per}</span>
                        </span>
                      </span>
                      {selected && breakdown && (
                        <span
                          className="pw-breakdown"
                          role="group"
                          aria-label={`${copy.breakdownAriaPrefix} ${row.name}`}
                        >
                          <span className="pw-bd-row">
                            <span>{breakdown.todayLabel}</span>
                            <span className="pw-bd-amt">{breakdown.todayAmount}</span>
                          </span>
                          <span className="pw-bd-row">
                            <span>{breakdown.renewalDateLabel}</span>
                            <span className="pw-bd-amt">{breakdown.renewalAmount}</span>
                          </span>
                          <span className="pw-bd-note">{breakdown.note}</span>
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </section>

          <p style={chooseHintStyle}>
            {armed ? copy.chooseHintSelected : copy.chooseHintDefault}
          </p>

          <p role="status" style={statusRegionStyle}>
            {statusMessage}
          </p>
          {errorMessage && (
            <p role="alert" style={errorRegionStyle}>
              {errorMessage}
            </p>
          )}
        </div>

        <footer style={footerStyle}>
          <button
            ref={ctaRef}
            type="button"
            className="pw-cta-btn"
            style={ctaBtnStyle(armed, pending)}
            onClick={onCtaClick}
            aria-disabled={pending || !armed}
            autoFocus
          >
            {ctaLabel}
          </button>
          <div style={linksRowStyle}>
            <button
              type="button"
              className="pw-restore-btn"
              style={restoreBtnStyle(pending)}
              onClick={onRestoreClick}
              aria-disabled={pending}
            >
              {copy.restoreLabel}
            </button>
            <span aria-hidden="true" style={dotStyle}>·</span>
            <a
              className="pw-link"
              href="https://babyora.no/personvern"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.privacyLinkAriaLabel}
              style={legalLinkStyle}
            >
              {copy.privacyLinkLabel}
            </a>
            <span aria-hidden="true" style={dotStyle}>·</span>
            <a
              className="pw-link"
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.termsLinkAriaLabel}
              style={legalLinkStyle}
            >
              {copy.termsLinkLabel}
            </a>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
