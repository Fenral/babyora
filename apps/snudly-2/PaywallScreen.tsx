import { useState } from 'react';
import {
  purchaseVerifiedPlan,
  restoreVerifiedPurchase,
  type ProductKey,
  type StorePlans,
} from './billing-adapter';
import { PhoneStatusBar } from './PhoneStatusBar';

type PaywallScreenProps = {
  plans: StorePlans;
  onEntitlementGranted: () => void;
  onReplayTour: () => void;
};

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function planTrialCopy(plans: StorePlans, plan: ProductKey): string {
  const trial = plans[plan]?.trial;
  if (!trial) return 'Prøveperiode bekreftes av butikken';
  if (trial.unit === 'DAY' && trial.value === 7) return '7 dager gratis for kvalifiserte brukere';
  return `${trial.value} ${trial.unit === 'DAY' ? 'dager' : 'perioder'} gratis for kvalifiserte brukere`;
}

function failureMessage(reason: string): string {
  if (reason === 'user_cancelled') return '';
  if (reason === 'billing_unavailable') return 'Kjøp er ikke tilgjengelig i denne appversjonen akkurat nå.';
  if (reason === 'package_unavailable' || reason === 'offering_unavailable') return 'Denne planen er ikke tilgjengelig akkurat nå.';
  if (reason === 'entitlement_missing') return 'Butikken bekreftet ikke aktiv tilgang. Prøv gjenoppretting.';
  return 'Kjøpet ble ikke fullført. Sjekk nettilkoblingen og prøv igjen.';
}

export function PaywallScreen({ plans, onEntitlementGranted, onReplayTour }: PaywallScreenProps) {
  const [plan, setPlan] = useState<ProductKey>('yearly');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = plans[plan];

  const purchase = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setStatus('Behandler kjøpet …');
    try {
      const result = await purchaseVerifiedPlan(plan, selected);
      if (result.success) {
        setStatus('Snudly er aktivert.');
        onEntitlementGranted();
      } else {
        setStatus(failureMessage(result.reason));
      }
    } catch {
      setStatus('Noe gikk galt under kjøpet. Prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    setStatus('Sjekker tidligere kjøp …');
    try {
      if (await restoreVerifiedPurchase()) {
        setStatus('Tidligere kjøp er gjenopprettet.');
        onEntitlementGranted();
      } else {
        setStatus('Fant ikke et aktivt kjøp. Sjekk nettilkoblingen og prøv igjen.');
      }
    } catch {
      setStatus('Kunne ikke gjenopprette akkurat nå. Prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="snudly-app paywall-screen" data-screen="paywall" data-billing-state={selected ? 'store-ready' : 'store-unavailable'}>
      <PhoneStatusBar />
      <div className="paywall-scroll">
        <header className="paywall-brand"><span className="wordmark">Snudly</span></header>
        <section className="paywall-hero">
          <div className="paywall-portrait" aria-hidden="true"><span /><img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" /></div>
          <h1><span>Tryggere klesvalg</span><span>hver dag</span></h1>
          <p>Få hele Snudly med antrekk etter været, planlegging og hjelp gjennom sesongene.</p>
        </section>

        <ul className="paywall-benefits">
          <li><span><CheckIcon /></span><p><b>Dagens antrekk</b><small>Lag for lag, tilpasset barnet og været.</small></p></li>
          <li><span><CheckIcon /></span><p><b>Planlegg i forkant</b><small>Se når plagg bør av eller på.</small></p></li>
          <li><span><CheckIcon /></span><p><b>Alle kalkulatorer</b><small>Vær, aktivitet og trygg innesøvn samlet.</small></p></li>
        </ul>

        <div className="paywall-plans" role="radiogroup" aria-label="Velg abonnement">
          {(['yearly', 'monthly'] as const).map((key) => (
            <button type="button" role="radio" aria-checked={plan === key} onClick={() => setPlan(key)} key={key}>
              <span>
                <b>{key === 'yearly' ? 'Årlig' : 'Månedlig'}</b>
                <small>{plans[key]?.priceString || 'Pris vises i butikken'} · {planTrialCopy(plans, key)}</small>
              </span>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="paywall-price">Pris, prøveperiode og vilkår kommer direkte fra App Store eller Google Play.</p>
        {status ? <p className="paywall-message" role="status">{status}</p> : null}

        <button className="paywall-primary" type="button" disabled={!selected || busy} onClick={purchase}>{busy ? 'Vent litt …' : 'Fortsett i butikken'}</button>
        <button className="paywall-restore" type="button" disabled={busy} onClick={restore}>Gjenopprett kjøp</button>
        <button className="paywall-tour-replay" type="button" disabled={busy} onClick={onReplayTour}>Se produktvisningen igjen</button>
        <p className="paywall-terms">Abonnementet fornyes automatisk dersom det ikke sies opp i butikkinnstillingene. Endelige vilkår vises før kjøpet godkjennes.</p>
      </div>
    </main>
  );
}
