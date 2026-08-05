import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// A2 (2026-07-12): UI-font er nå OS-systemfont (--font-sans), så self-hosted
// Inter + Schibsted Grotesk er fjernet (ubrukte). DM Serif beholdes som
// serif-fallback bak Fraunces (offline i Capacitor).
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'
// T9A fontberedskap (§4): Schibsted Grotesk (UI) + Fraunces (hero-tall) er
// self-hostet som variable latin-subset i public/fonts/ med egne @font-face
// i styles/fonts.css (stabile filnavn → preload-links i index.html, eksakte
// vekter 550/560/650, metrisk fallback). Erstatter de statiske
// @fontsource-kuttene som lå her (400/500/600/700 + 400/500).
import './styles/fonts.css'
import './styles/design-tokens.css'
import './styles/design-tokens-v2.css'
import './i18n'
import App from './App.tsx'
import { ChildrenProvider } from './state/children-provider.tsx'
import { initAnalytics, track } from './lib/analytics/track'
import { initNative } from './lib/native-init'
import { armerLaunchFrist } from './lib/launch-handoff'
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
async function initializeRevenueCatAccess(): Promise<void> {
  try {
    await initRevenueCat();
  } catch (error) {
    console.warn(error);
  }
  await syncPremiumEntitlement();
}

void initializeRevenueCatAccess();

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

// AApningsflatens nodutgang. Kaster noe for App rekker a montere, ville
// flaten blitt staende for alltid — appen ville sett ut som den hang, paa
// merkevaren, uten en eneste feilmelding. Se lib/launch-handoff.ts.
armerLaunchFrist();
