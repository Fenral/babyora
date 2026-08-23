import { useState, type ReactElement } from 'react';
import { useChildren } from '../state/children-store';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { InnstillingerScreen } from './InnstillingerScreen';
import type { FamilieToolTarget, TabKey } from '../types/nav';
import './FamilieScreen.css';

type Props = {
  onNavigate: (tab: TabKey) => void;
  onOpenTool: (target: FamilieToolTarget) => void;
};

const MATERIALS = [
  { value: 'prefer_wool', label: 'Ull', summary: 'Ull først.' },
  { value: 'best_for_conditions', label: 'Best for været', summary: 'Beste materiale for forholdene.' },
  { value: 'avoid_wool', label: 'Uten ull', summary: 'Ullfrie alternativer først.' },
] as const;

export function FamilieScreen({ onNavigate, onOpenTool }: Props): ReactElement {
  const { active, children, setActiveId, updateChild } = useChildren();
  const [showSettings, setShowSettings] = useState(false);
  const ageMonths = dobToAgeMonths(active.dob);
  const material = active.materialPreference ?? 'best_for_conditions';
  const materialSummary = MATERIALS.find((item) => item.value === material)?.summary ?? MATERIALS[1].summary;

  if (showSettings) {
    return (
      <section className="sn-family-settings">
        <button type="button" className="sn-family-settings__back" onClick={() => setShowSettings(false)}>
          <span aria-hidden="true">←</span> Familie
        </button>
        <InnstillingerScreen onNavigate={onNavigate} onOpenTool={onOpenTool} />
      </section>
    );
  }

  return (
    <section className="sn-family" aria-labelledby="sn-family-title">
      <header className="sn-page-header">
        <span className="sn-wordmark">SNUDLY</span>
        <h1 id="sn-family-title">Familie</h1>
        <p>Barn, omsorgspersoner og det Snudly lærer om dere.</p>
      </header>

      <section className="sn-family__hero" aria-label={`Aktiv profil: ${active.name}`}>
        <div className="sn-family__copy">
          <span>Aktiv profil</span>
          <strong>{active.name || 'Barnet'}</strong>
          <small>{ageMonths} måneder · {active.city}</small>
        </div>
        <img className="sn-family__avatar" src="/monter/maskot-staaende-cut-360.webp" alt="" />
        <div className="sn-family__switcher" role="group" aria-label="Velg barn">
          {children.slice(0, 3).map((child) => (
            <button key={child.id} type="button" aria-pressed={child.id === active.id} onClick={() => setActiveId(child.id)}>
              <span><img src="/monter/maskot.webp" alt="" /></span>{child.name || 'Barnet'}
            </button>
          ))}
        </div>
      </section>

      <section className="sn-family__section" aria-labelledby="sn-care-title">
        <header><h2 id="sn-care-title">De som passer</h2><p>Hvem som kan bruke barnets profil</p></header>
        <div className="sn-care" aria-label={`Omsorgsnettverk for ${active.name}`}>
          <span className="sn-care__ring" aria-hidden="true" />
          <span className="sn-care__node sn-care__node--child"><img src="/monter/maskot.webp" alt="" /></span>
          <span className="sn-care__node sn-care__node--one">M<small>Mamma</small></span>
          <span className="sn-care__node sn-care__node--two">P<small>Pappa</small></span>
          <span className="sn-care__node sn-care__node--three">B<small>Bestemor</small></span>
        </div>
        <button type="button" className="sn-family__invite" onClick={() => setShowSettings(true)}>＋ Inviter en omsorgsperson</button>
      </section>

      <section className="sn-family__section sn-family__materials" aria-labelledby="sn-material-title">
        <header><h2 id="sn-material-title">Materialpreferanse</h2><p>Prioriteres når forholdene tillater det</p></header>
        <div role="group" aria-label="Materialpreferanse">
          {MATERIALS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={material === item.value}
              onClick={() => updateChild(active.id, { materialPreference: item.value })}
            >
              <span aria-hidden="true" />{item.label}
            </button>
          ))}
        </div>
        <p><strong>{materialSummary}</strong> Alternativer vises når de passer forholdene.</p>
      </section>

      <button type="button" className="sn-family__settings" onClick={() => setShowSettings(true)}>
        Alle familieinnstillinger <span aria-hidden="true">›</span>
      </button>
    </section>
  );
}

export default FamilieScreen;
