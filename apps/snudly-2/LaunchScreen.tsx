import { PhoneStatusBar } from './PhoneStatusBar';

export function LaunchScreen() {
  return (
    <main className="snudly-app launch-screen" data-screen="launch" aria-label="Snudly starter">
      <PhoneStatusBar />
      <section className="launch-content">
        <span className="launch-wordmark">Snudly</span>
        <div className="launch-portrait" aria-hidden="true">
          <span className="launch-halo" />
          <img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" />
        </div>
        <div className="launch-copy">
          <h1>Riktig lag.<br />Akkurat i dag.</h1>
          <p>Vær, alder og aktivitet samlet i ett tydelig råd.</p>
        </div>
      </section>
      <div className="launch-progress" aria-label="Snudly lastes">
        <i /><i /><i />
      </div>
    </main>
  );
}
