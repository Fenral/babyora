/**
 * AppPaywallGate — P2 hard paywall (PRODUCT.md, 2026-07-31, §Owner decisions).
 *
 * Mountes fra App.tsx OVENPÅ hele tab-routingen. Blokkerer hele appen med en
 * ikke-avviselig PaywallDialog (dismissable=false) når ALLE fire holder:
 *   1. onboarding er fullført,
 *   2. den første reelle anbefalingen er vist én gang på Hjem
 *      (subscription-store.firstRecommendationSeenAt !== null — satt av
 *      HjemScreen selv, se markFirstRecommendationSeen),
 *   3. brukeren har IKKE et aktivt Premium-entitlement, og
 *   4. entitlement-status har sluttet å laste (unngår et flash av gaten
 *      mens RevenueCat-oppslaget fortsatt pågår ved appstart).
 *
 * Det finnes ikke lenger et gratis-nivå å falle tilbake til (PRODUCT.md):
 * gaten er den ENESTE håndhevingen av det — capabilities.ts/gating.ts
 * gater fortsatt hver enkelt kapabilitet på isPlus, men UI-skjermene bak
 * gaten stoler på at brukeren aldri når dem uten enten (a) ikke ha sett sin
 * første anbefaling ennå, eller (b) være Premium.
 *
 * HARD_PAYWALL_ENABLED er en enkelt eksportert bryter for hele gaten — sett
 * til false for å deaktivere den uten å røre capabilities.ts/gating.ts sin
 * entitlement-kontrakt eller App.tsx sin mount-kondisjon.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useAccess } from '../lib/premium/use-access';
import { useSubscription } from '../state/subscription-store';
import { PaywallDialog } from './PaywallDialog';

/**
 * Hvor lenge `open` holdes `true` etter at gaten sluttet å være «due» (typisk
 * fordi et kjøp/gjenoppretting nettopp lyktes), FØR vi selv lar prop-en gå
 * til false. PaywallDialog sin egen suksess-flyt (statusmelding i ~1400ms →
 * animert requestClose()) eier den faktiske lukkingen i det vanlige
 * tilfellet; denne forsinkelsen finnes KUN for å unngå at vår egen
 * `open`-prop skifter til false midt i den flyten og trigger PaywallDialog
 * sin `[open]`-effekt (`!open && dlg.open → dlg.close()`), som ville kuttet
 * suksess-meldingen brått og uanimert. Innen forsinkelsen har gått har det
 * native <dialog>-elementet normalt allerede lukket seg selv, så vår
 * etterslepende `setOpen(false)` blir et no-op.
 */
const CLOSE_LATCH_MS = 1_800;

export const HARD_PAYWALL_ENABLED = true;

export type AppPaywallGateProps = Readonly<{
  /** Fullført onboarding — App.tsx sin egen `onboardingDone`-state. */
  onboardingDone: boolean;
}>;

export type HardPaywallDueParams = Readonly<{
  enabled: boolean;
  onboardingDone: boolean;
  firstRecommendationSeenAt: number | null;
  isPremium: boolean;
  loading: boolean;
}>;

/**
 * Ren beslutningsfunksjon — ingen React/store-avhengighet, lett å
 * kontrakttest uten mocking. `enabled` sendes inn eksplisitt (ikke lest fra
 * HARD_PAYWALL_ENABLED-modulkonstanten) slik at testene kan dekke begge
 * grenene av bryteren.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function isHardPaywallDue(params: HardPaywallDueParams): boolean {
  return (
    params.enabled
    && params.onboardingDone
    && params.firstRecommendationSeenAt !== null
    && !params.isPremium
    && !params.loading
  );
}

export function AppPaywallGate({ onboardingDone }: AppPaywallGateProps): ReactElement {
  const { isPremium, loading } = useAccess();
  const firstRecommendationSeenAt = useSubscription((s) => s.firstRecommendationSeenAt);

  const due = isHardPaywallDue({
    enabled: HARD_PAYWALL_ENABLED,
    onboardingDone,
    firstRecommendationSeenAt,
    isPremium,
    loading,
  });

  // Latch-on umiddelbart (render-time state-justering — samme mønster som
  // PaywallDialog sin egen prevOpen-idiom). Latch-off er forsinket (se
  // CLOSE_LATCH_MS) slik at PaywallDialog sin interne suksess-animasjon
  // alltid får spille ferdig først.
  const [open, setOpen] = useState(due);
  if (due && !open) setOpen(true);
  useEffect(() => {
    if (due || !open) return;
    const timer = window.setTimeout(() => setOpen(false), CLOSE_LATCH_MS);
    return () => window.clearTimeout(timer);
  }, [due, open]);

  return (
    <PaywallDialog
      open={open}
      trigger={null}
      dismissable={false}
      onClose={() => undefined}
      returnFocusTo={null}
    />
  );
}
