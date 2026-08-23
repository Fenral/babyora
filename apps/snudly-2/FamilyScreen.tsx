import { useState } from 'react';
import type { OnboardingDraft } from './app-flow';
import { ageInCompleteMonths } from './home-model';
import { BackButton, ChevronIcon, ProductScreen, type ProductTab } from './ui';

type MaterialPreference = 'wool' | 'fleece' | 'cotton';

function InviteIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth={1.8} /><path d="M4 20c.6-4 2.7-6 6-6 1.6 0 2.9.5 3.9 1.4M18 12v6M15 15h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg>;
}

function SettingsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /><circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth={1.8} /><circle cx="8" cy="17" r="2" stroke="currentColor" strokeWidth={1.8} /></svg>;
}

export function FamilyScreen({ profile, onProfileChange, onSelectTab }: { profile: OnboardingDraft; onProfileChange: (profile: OnboardingDraft) => void; onSelectTab: (tab: ProductTab) => void }) {
  const [draft, setDraft] = useState(profile);
  const [preference, setPreference] = useState<MaterialPreference>('wool');
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  let ageMonths = 0;
  let supportedBirthDate = false;
  try { ageMonths = ageInCompleteMonths(draft.birthDate, new Date()); supportedBirthDate = true; } catch { /* Validation is shown below. */ }

  const save = () => {
    onProfileChange({ ...draft, name: draft.name.trim(), city: draft.city.trim() });
    setSaved(true);
  };

  return (
    <ProductScreen title="Familie" subtitle="Barn, omsorgspersoner og det Snudly lærer om dere." activeTab="family" onSelectTab={onSelectTab}>
      {showSettings ? (
        <section className="tool-detail family-settings" aria-label="Appinnstillinger">
          <BackButton label="Familie" onClick={() => setShowSettings(false)} />
          <header><h2>Appinnstillinger</h2><p>Profilopplysningene brukes bare til å tilpasse anbefalingen.</p></header>
          <section className="sn-card family-form">
            <label><span>Navn eller kallenavn</span><input value={draft.name} maxLength={60} onChange={(event) => { setSaved(false); setDraft({ ...draft, name: event.target.value }); }} /></label>
            <label><span>Hjemsted</span><input value={draft.city} maxLength={80} onChange={(event) => { setSaved(false); setDraft({ ...draft, city: event.target.value }); }} /></label>
            <label><span>Fødselsdato</span><input type="date" value={draft.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => { setSaved(false); setDraft({ ...draft, birthDate: event.target.value }); }} /></label>
            {!supportedBirthDate ? <p className="family-validation">Legg inn en gyldig fødselsdato.</p> : null}
            <button className="sn-button family-save" type="button" disabled={!supportedBirthDate || draft.city.trim().length < 2} onClick={save}>Lagre profil</button>
            {saved ? <p className="family-status" role="status">Profilen er lagret på denne enheten.</p> : null}
          </section>
        </section>
      ) : (
        <>
          <section className="family-hero">
            <div className="family-copy"><span className="family-label">Aktiv profil</span><strong className="family-name">{profile.name.trim() || 'Barnet'}</strong><span className="family-meta">{ageMonths} måneder · {profile.city}</span></div>
            <img className="family-avatar" src="/snudly-owner/avatar-a-profile-gold.webp" alt="" />
            <div className="child-switcher" role="group" aria-label="Velg barn"><button className="child-choice" type="button" aria-pressed="true" onClick={() => setShowSettings(true)}><span className="child-dot"><img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" /></span>{profile.name.trim() || 'Barnet'}</button></div>
          </section>

          <section className="family-section"><header className="section-heading"><h2>De som passer</h2><p>Hvem som kan bruke barnets profil</p></header><div className="care-network"><svg viewBox="0 0 320 176" aria-hidden="true"><circle className="care-ring" cx="160" cy="95" r="62" /></svg><span className="care-node care-node--child"><img src="/snudly-owner/avatar-a-profile-gold.webp" alt="" /></span><span className="care-node care-node--one">M<small>Mamma</small></span><span className="care-node care-node--two">P<small>Pappa</small></span><span className="care-node care-node--three">B<small>Bestemor</small></span></div><button className="invite-secondary" type="button" onClick={() => setShowSettings(true)}><InviteIcon />Inviter en omsorgsperson</button></section>

          <section className="family-section"><header className="section-heading"><h2>Materialpreferanse</h2><p>Prioriteres når forholdene tillater det</p></header><div className="material-options">{(['wool', 'fleece', 'cotton'] as const).map((material) => <button className="material-choice" data-material={material} type="button" aria-pressed={preference === material} onClick={() => setPreference(material)} key={material}><span className="material-swatch" aria-hidden="true" />{material === 'wool' ? 'Ull' : material === 'fleece' ? 'Fleece' : 'Bomull'}</button>)}</div><p className="material-summary"><strong>{preference === 'wool' ? 'Ull først.' : preference === 'fleece' ? 'Fleece først.' : 'Bomull når det er mildt.'}</strong> Alternativer vises når de passer forholdene.</p></section>

          <button className="settings-row" type="button" onClick={() => setShowSettings(true)}><span className="settings-icon"><SettingsIcon /></span><span className="settings-copy"><strong>Appinnstillinger</strong><span>Profil, varsler, språk og utseende</span></span><ChevronIcon /></button>
        </>
      )}
    </ProductScreen>
  );
}
