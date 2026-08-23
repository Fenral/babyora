import { type ReactElement } from 'react';
import { useHapticSystem } from '../lib/haptics/system';
import type { VerktoyTarget } from '../types/nav';
import './VerktoyScreen.css';

export interface VerktoyScreenProps {
  onOpenTool: (target: VerktoyTarget) => void;
}

const BASE = import.meta.env.BASE_URL;

const TOOLS: ReadonlyArray<{
  target: Exclude<VerktoyTarget, 'finn-antrekk'>;
  title: string;
  description: string;
  image: string;
}> = [
  { target: 'tog', title: 'Sovekalkulator', description: 'TOG og lag for rommet', image: `${BASE}monter/plagg-sovepose.webp` },
  { target: 'forste-vinter', title: 'Første vinter', description: 'Åtte korte leksjoner', image: `${BASE}monter/plagg-vinterdress.webp` },
  { target: 'varm-kald', title: 'For varm eller kald?', description: 'Nakketesten, forklart enkelt', image: `${BASE}monter/plagg-tynn-lue.webp` },
];

function Arrow(): ReactElement {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;
}

export function VerktoyScreen({ onOpenTool }: VerktoyScreenProps): ReactElement {
  const { fire } = useHapticSystem();
  const open = (target: VerktoyTarget) => {
    void fire('selection');
    onOpenTool(target);
  };

  return (
    <section className="sn-tools" aria-labelledby="sn-tools-title">
      <header className="sn-page-header">
        <span className="sn-wordmark">SNUDLY</span>
        <h1 id="sn-tools-title">Verktøy</h1>
        <p>Kalkulatorer og korte guider når forholdene skifter.</p>
      </header>

      <button className="sn-tools__hero" type="button" onClick={() => open('finn-antrekk')}>
        <span className="sn-tools__copy">
          <span className="sn-tools__chip">Dagens vær · klart til bruk</span>
          <strong>Vær-<br />kalkulator</strong>
          <span>Se hvordan forholdene påvirker klærne.</span>
        </span>
        <span className="sn-tools__art" aria-hidden="true">
          <img src={`${BASE}monter/vaer-delvis-skyet.webp`} alt="" />
        </span>
        <span className="sn-tools__action">Prøv med dagens forhold <Arrow /></span>
      </button>

      <ul className="sn-tools__list" role="list">
        {TOOLS.map((tool) => (
          <li key={tool.target}>
            <button type="button" onClick={() => open(tool.target)}>
              <span className="sn-tools__thumb"><img src={tool.image} alt="" /></span>
              <span className="sn-tools__row-copy"><strong>{tool.title}</strong><span>{tool.description}</span></span>
              <Arrow />
            </button>
          </li>
        ))}
      </ul>

      <button className="sn-tools__last" type="button" onClick={() => open('tog')}>
        <span>Sist brukt: <strong>Sovekalkulator</strong></span><span>Åpne <Arrow /></span>
      </button>
      <p className="sn-tools__note">Dagens antrekk på Hjem beregnes med Værkalkulatoren.</p>
    </section>
  );
}

export default VerktoyScreen;
