import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// A2 (2026-07-12): UI-font er nå OS-systemfont (--font-sans), så self-hosted
// Inter + Schibsted Grotesk er fjernet (ubrukte). DM Serif beholdes som
// serif-fallback bak Fraunces (offline i Capacitor).
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'
import './styles/design-tokens.css'
import './i18n'
import App from './App.tsx'
import { ChildrenProvider } from './state/children-provider.tsx'
import { initAnalytics, track } from './lib/analytics/track'
import { initNative } from './lib/native-init'
import { initRevenueCat } from './lib/billing/revenuecat'
import { syncPremiumEntitlement } from './lib/premium/use-access'

// P9.4 (2026-06-13): Boot PostHog hvis nøkkel finnes; ellers no-op.
void initAnalytics().then(() => {
  track({ type: 'app_opened', source: 'direct' });
});

// F81.5-W1: init RevenueCat fire-and-forget — wrapperen gater selv på
// native + konfigurert nøkkel og feiler aldri hardt (manglende nettverk/
// nøkkel er en forventet, håndtert tilstand). syncPremiumEntitlement()
// kjøres rett etter (suksess ELLER feil) for å hente reell entitlement-
// status inn i subscription-store ved oppstart — web/dev uten native+
// konfigurert RevenueCat er no-op og beholder mock-verdien.
void initRevenueCat()
  .catch(console.warn)
  .then(() => syncPremiumEntitlement());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChildrenProvider>
      <App />
    </ChildrenProvider>
  </StrictMode>,
)

// Native-feel #3 (2026-06-26): wire up status-bar, splash, keyboard,
// Android back-knapp. No-op på web (gated på Capacitor.isNativePlatform()).
// Kjøres etter render slik at ChildrenProvider er montert.
void initNative();
