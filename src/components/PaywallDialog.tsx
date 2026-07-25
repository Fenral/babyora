/**
 * PaywallDialog — F81.5-W1: delt Premium-paywall (native <dialog>).
 *
 * Ekstrahert fra InnstillingerScreen slik at ethvert trigger-punkt i appen
 * (Innstillinger, onboarding, feature-gates i F81.5-W2) kan åpne SAMME
 * dialog med samme copy/analytics/kjøpslogikk — kun `trigger` varierer.
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
 * A11y (P2/SHIP-blockers fra F81.5-W1-spec):
 *  - <fieldset>/<legend> + native <input type="radio"> (roving tabindex +
 *    piltaster gratis) — radio visuelt skjult med sr-only-klipp-teknikk
 *    (IKKE display:none, forblir fokuserbar), stylet synlig <label>-kort.
 *  - Hvert kort sitt aria-label inneholder ALT som vises visuelt i kortet.
 *  - Valgt tilstand vises med tykkere ramme (2px→3px, ≥3:1 fargekontrast)
 *    OG et aria-hidden hake-ikon — aldri farge alene.
 *  - CTA bruker aria-disabled + klikk-guard under pending — ALDRI
 *    disabled-attributt (ville fjernet fokus fra knappen midt i et trykk).
 *  - Hero + CTA bruker udelte, heldekkende tekstfarger fra
 *    accent-cta/accent-cta-ink-paret (ingen semi-transparent hvit tekst).
 *  - Fokus-ring på kontroller oppå den grønne bakgrunnen bruker
 *    accent-cta-ink (lys i light-mode, mørk i dark-mode — token flipper
 *    automatisk) i stedet for det vanlige --focus-ring, som ellers ikke
 *    er garantert 3:1 mot grønn i begge temaer.
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
import { useSubscription } from '../state/subscription-store';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { track } from '../lib/analytics/track';
import {
  isRevenueCatConfigured,
  purchasePackage,
  restorePurchases,
} from '../lib/billing/revenuecat';
import {
  DEFAULT_PLAN,
  PRODUCTS,
  PRODUCT_IDS,
  type PaywallTrigger,
  type ProductKey,
} from '../lib/premium/products';
import {
  PAYWALL_COPY,
  PLAN_DISPLAY_NAME,
  PLAN_ORDER,
  buildPlanAriaLabel,
  buildCapabilityPaywallCopy,
  buildTransparencyLine,
  computeYearlySavingsPercent,
  formatPlanPrice,
} from '../lib/premium/paywall-copy';
import { PLUS_FEATURE_AVAILABILITY } from '../lib/premium/plus-features';
import { PlusExpansionPreview } from './paywall/PlusExpansionPreview';

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
.pw-plan-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 14px;
  border: 2px solid var(--ink-200);
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  transition: border-color 160ms var(--ease-standard), background 160ms var(--ease-standard);
}
.pw-plan-input:checked + .pw-plan-card {
  border-width: 3px;
  border-color: var(--accent-cta);
  background: var(--surface-soft);
  padding: 12px 13px;
}
.pw-plan-input:focus-visible + .pw-plan-card {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
/* Lukk-knappen ligger på grønn hero → lys ring (--accent-cta-ink) synlig der. */
.pw-close-btn:focus-visible {
  outline: 3px solid var(--accent-cta-ink);
  outline-offset: 2px;
}
/* CTA ligger i footeren på --surface, IKKE på grønt → --focus-ring er
   kalibrert mot den flaten (--accent-cta-ink ville vært usynlig, ~1,05:1). */
.pw-cta-btn:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
.pw-restore-btn:focus-visible,
.pw-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
/* F83: modal-pop enter/exit (sentrert kort → pop, ikke sheet-slide).
   data-closing settes av requestClose; animationend → close(). RM → instant. */
.pw-dialog::backdrop {
  background: rgba(23, 16, 46, 0.35);
}
.pw-dialog[open] {
  animation: pw-modal-in 300ms var(--ease-standard);
}
.pw-dialog[open]::backdrop {
  animation: pw-backdrop-in 250ms ease-out;
}
.pw-dialog[data-closing] {
  animation: pw-modal-out 220ms ease-out forwards;
}
.pw-dialog[data-closing]::backdrop {
  animation: pw-backdrop-out 220ms ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .pw-dialog[open],
  .pw-dialog[data-closing],
  .pw-dialog[open]::backdrop,
  .pw-dialog[data-closing]::backdrop {
    animation: none;
  }
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

const dialogStyle: CSSProperties = {
  padding: 0,
  border: '1px solid var(--ink-100)',
  borderRadius: 22,
  maxWidth: 440,
  width: 'calc(100% - 24px)',
  maxHeight: 'calc(100dvh - 32px)',
  margin: 'auto',
  background: 'var(--surface)',
  color: 'var(--ink-900)',
  boxShadow: 'var(--shadow-cta-primary)',
  fontFamily: 'var(--font-sans)',
  overflow: 'hidden',
};

const innerSurfaceStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100dvh - 32px)',
};

const heroStyle: CSSProperties = {
  position: 'relative',
  padding: '20px 20px 22px',
  background: 'var(--accent-cta)',
};

const heroTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
};

const eyebrowStyle: CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  color: 'var(--accent-cta-ink)',
  lineHeight: 1,
};

const titleStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '1.5rem',
  letterSpacing: '-0.4px',
  lineHeight: 1.15,
  color: 'var(--accent-cta-ink)',
};

const closeBtnStyle: CSSProperties = {
  flex: 'none',
  width: 36,
  height: 36,
  borderRadius: 11,
  border: '1px solid color-mix(in srgb, var(--accent-cta-ink) 35%, transparent)',
  background: 'color-mix(in srgb, var(--accent-cta-ink) 16%, transparent)',
  color: 'var(--accent-cta-ink)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 20,
  lineHeight: 1,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const bodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '18px 20px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  WebkitOverflowScrolling: 'touch',
};

const benefitBodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--ink-700)',
};

const fieldsetStyle: CSSProperties = {
  border: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const legendStyle: CSSProperties = {
  padding: 0,
  marginBottom: 2,
  fontSize: '0.65625rem',
  fontWeight: 600,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  color: 'var(--ink-500)',
};

const planTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const planNameStyle: CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 700,
  color: 'var(--ink-900)',
  letterSpacing: '-0.1px',
};

const planBadgeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const savingsBadgeStyle: CSSProperties = {
  flex: 'none',
  padding: '3px 8px',
  borderRadius: 999,
  background: 'var(--accent-cta)',
  color: 'var(--accent-cta-ink)',
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
};

const checkBadgeStyle: CSSProperties = {
  flex: 'none',
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: 'var(--accent-cta)',
  color: 'var(--accent-cta-ink)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const planPriceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
};

const planPriceBigStyle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: 'var(--ink-900)',
  letterSpacing: '-0.2px',
};

const planSubStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  letterSpacing: '.05px',
  lineHeight: 1.3,
};

const trialLineStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--status-ok)',
  letterSpacing: '.05px',
};

const transparencyStyle: CSSProperties = {
  margin: '2px 2px 0',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  letterSpacing: '.05px',
  lineHeight: 1.35,
};

const statusRegionStyle: CSSProperties = {
  margin: '0 2px',
  minHeight: 0,
  flexShrink: 0,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--status-ok)',
  letterSpacing: '.05px',
  lineHeight: 1.3,
};

const errorRegionStyle: CSSProperties = {
  margin: '0 2px',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--status-warm)',
  letterSpacing: '.05px',
  lineHeight: 1.35,
};

const footerStyle: CSSProperties = {
  flex: 'none',
  padding: '12px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)',
  borderTop: '1px solid var(--ink-100)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--surface)',
};

function ctaBtnStyle(pending: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: 52,
    padding: '14px 16px',
    borderRadius: 14,
    border: 'none',
    background: 'var(--accent-cta)',
    color: 'var(--accent-cta-ink)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: pending ? 'wait' : 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    // 0.92 (ikke 0.85): «Behandler …»-teksten holder ≥4,5:1 under pending.
    opacity: pending ? 0.92 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
}

const trustLineStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.71875rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  letterSpacing: '.05px',
  textAlign: 'center',
};

function restoreBtnStyle(pending: boolean): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: 'var(--ink-700)',
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: pending ? 'wait' : 'pointer',
    padding: '6px 8px',
    minHeight: 32,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
}

const linksRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};

const legalRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  marginTop: 2,
};

const legalLinkStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: 'var(--ink-500)',
  letterSpacing: '.05px',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

function CheckIcon(): ReactElement {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3 3 7-7" />
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
}: PaywallDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fire } = useHapticSystem();
  const setPremium = useSubscription((s) => s.setPremium);

  const [selectedPlan, setSelectedPlan] = useState<ProductKey>(DEFAULT_PLAN);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const capabilityCopy = buildCapabilityPaywallCopy(
    PLUS_FEATURE_AVAILABILITY,
    trigger,
  );

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
      setSelectedPlan(DEFAULT_PLAN);
      setPending(false);
      setStatusMessage('');
      setErrorMessage(null);
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

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
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
      onClose();
      requestAnimationFrame(() => {
        returnFocusTo?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, returnFocusTo, clearAutoClose]);

  useEffect(() => clearAutoClose, [clearAutoClose]);

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      requestClose();
    }
  };

  const handleSelectPlan = useCallback(
    (key: ProductKey) => {
      void fire('selection');
      setSelectedPlan(key);
    },
    [fire],
  );

  const handlePurchase = useCallback(async () => {
    if (pending) return;
    void fire('medium');
    setPending(true);
    setErrorMessage(null);
    setStatusMessage(PAYWALL_COPY.statusProcessing);
    try {
      if (!isRevenueCatConfigured() || !Capacitor.isNativePlatform()) {
        // Web/dev-mock: simuler vellykket kjøp slik at Premium-UI kan testes
        // uten et ekte RevenueCat-oppsett.
        setPremium(true);
        setStatusMessage(PAYWALL_COPY.statusActivatedTestmode);
        track({ type: 'paywall_converted', plan: selectedPlan });
        if (selectedPlan === 'yearly') track({ type: 'trial_started', plan: selectedPlan });
        void fire('success');
        scheduleAutoClose();
        return;
      }
      const result = await purchasePackage(PRODUCT_IDS[selectedPlan]);
      if (result.success) {
        setPremium(true);
        setStatusMessage(PAYWALL_COPY.statusActivated);
        track({ type: 'paywall_converted', plan: selectedPlan });
        if (selectedPlan === 'yearly') track({ type: 'trial_started', plan: selectedPlan });
        void fire('success');
        scheduleAutoClose();
      } else {
        setStatusMessage('');
        setErrorMessage(PAYWALL_COPY.errorPurchaseFailed);
      }
    } catch (err) {
      console.error('[Babyora] PaywallDialog purchase feilet', err);
      setStatusMessage('');
      setErrorMessage(PAYWALL_COPY.errorPurchaseException);
    } finally {
      setPending(false);
    }
  }, [pending, fire, selectedPlan, setPremium, scheduleAutoClose]);

  const handleRestore = useCallback(async () => {
    if (pending) return;
    void fire('selection');
    setPending(true);
    setErrorMessage(null);
    setStatusMessage(PAYWALL_COPY.statusRestoreChecking);
    try {
      if (!isRevenueCatConfigured() || !Capacitor.isNativePlatform()) {
        setStatusMessage('');
        setErrorMessage(PAYWALL_COPY.errorRestoreDevOnly);
        return;
      }
      const restored = await restorePurchases();
      if (restored) {
        setPremium(true);
        setStatusMessage(PAYWALL_COPY.statusActivated);
        void fire('success');
        scheduleAutoClose();
      } else {
        setStatusMessage(PAYWALL_COPY.statusNoRestore);
      }
    } catch (err) {
      console.error('[Babyora] PaywallDialog restore feilet', err);
      setStatusMessage('');
      setErrorMessage(PAYWALL_COPY.errorRestoreException);
    } finally {
      setPending(false);
    }
  }, [pending, fire, setPremium, scheduleAutoClose]);

  const onCtaClick = () => {
    if (pending) return;
    void handlePurchase();
  };

  const onRestoreClick = () => {
    if (pending) return;
    void handleRestore();
  };

  const ctaLabel = pending
    ? PAYWALL_COPY.ctaPending
    : selectedPlan === 'yearly'
      ? PAYWALL_COPY.ctaYearly
      : PAYWALL_COPY.ctaOther;

  return (
    <dialog
      ref={dialogRef}
      className="pw-dialog"
      aria-labelledby="paywall-eyebrow paywall-title"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      style={dialogStyle}
    >
      <style>{STYLE_CSS}</style>
      <div style={innerSurfaceStyle}>
        <header style={heroStyle}>
          <div style={heroTopRowStyle}>
            {/* F86-F1 (a11y-preclearance): eyebrow bærer nå ENESTE forekomst av
               produktnavnet ved generiske åpninger (h2 = flaggskip-verdi) →
               inn i tilgjengelig navn, ikke aria-hidden. */}
            <span id="paywall-eyebrow" style={eyebrowStyle}>
              {PAYWALL_COPY.genericHeadline}
            </span>
            <button
              type="button"
              className="pw-close-btn"
              aria-label={PAYWALL_COPY.closeLabel}
              onClick={requestClose}
              style={closeBtnStyle}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <h2 id="paywall-title" style={titleStyle}>
            {capabilityCopy.heading}
          </h2>
        </header>

        <div style={bodyStyle}>
          <p style={benefitBodyStyle}>{capabilityCopy.body}</p>
          <PlusExpansionPreview
            items={capabilityCopy.previewItems}
            reducedMotion={reducedMotion}
          />

          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>{PAYWALL_COPY.legend}</legend>
            {PLAN_ORDER.map((key) => {
              const product = PRODUCTS[key];
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
                    aria-label={buildPlanAriaLabel(key)}
                  />
                  <span className="pw-plan-card">
                    <span style={planTopRowStyle}>
                      <span style={planNameStyle}>{PLAN_DISPLAY_NAME[key]}</span>
                      <span style={planBadgeRowStyle}>
                        {key === 'yearly' && (
                          <span aria-hidden="true" style={savingsBadgeStyle}>
                            SPAR {computeYearlySavingsPercent()} %
                          </span>
                        )}
                        {selected && (
                          <span aria-hidden="true" style={checkBadgeStyle}>
                            <CheckIcon />
                          </span>
                        )}
                      </span>
                    </span>
                    <span style={planPriceRowStyle}>
                      <span style={planPriceBigStyle}>{formatPlanPrice(key)}</span>
                    </span>
                    {product.description && <span style={planSubStyle}>{product.description}</span>}
                    {key === 'yearly' && product.trialDays > 0 && (
                      <span style={trialLineStyle}>{product.trialDays} dager gratis</span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <p style={transparencyStyle}>{buildTransparencyLine(selectedPlan)}</p>

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
            type="button"
            className="pw-cta-btn"
            style={ctaBtnStyle(pending)}
            onClick={onCtaClick}
            aria-disabled={pending}
            autoFocus
          >
            {ctaLabel}
          </button>
          {capabilityCopy.trustLine && (
            <p style={trustLineStyle}>{capabilityCopy.trustLine}</p>
          )}
          <div style={linksRowStyle}>
            <button
              type="button"
              className="pw-restore-btn"
              style={restoreBtnStyle(pending)}
              onClick={onRestoreClick}
              aria-disabled={pending}
            >
              {PAYWALL_COPY.restoreLabel}
            </button>
          </div>
          <div style={legalRowStyle}>
            <a
              className="pw-link"
              href="https://babyora.no/personvern"
              target="_blank"
              rel="noopener noreferrer"
              style={legalLinkStyle}
            >
              {PAYWALL_COPY.privacyLinkLabel}
            </a>
            <a
              className="pw-link"
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noopener noreferrer"
              style={legalLinkStyle}
            >
              {PAYWALL_COPY.termsLinkLabel}
            </a>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
