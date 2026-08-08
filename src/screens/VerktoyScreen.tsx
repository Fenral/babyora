import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useHapticSystem } from '../lib/haptics/system';
import type { VerktoyTarget } from '../types/nav';
import './VerktoyScreen.css';

export interface VerktoyScreenProps {
  onOpenTool: (target: VerktoyTarget) => void;
}

type SecondaryTool = Readonly<{
  target: Exclude<VerktoyTarget, 'finn-antrekk'>;
  titleKey: string;
  descriptionKey: string;
  icon: 'sleep' | 'winter' | 'temperature';
}>;

const SECONDARY_TOOLS: ReadonlyArray<SecondaryTool> = [
  {
    target: 'tog',
    titleKey: 'tools.sleepCalculator.title',
    descriptionKey: 'tools.sleepCalculator.description',
    icon: 'sleep',
  },
  {
    target: 'forste-vinter',
    titleKey: 'tools.firstWinter.title',
    descriptionKey: 'tools.firstWinter.description',
    icon: 'winter',
  },
  {
    target: 'varm-kald',
    titleKey: 'tools.temperatureGuide.title',
    descriptionKey: 'tools.temperatureGuide.description',
    icon: 'temperature',
  },
];

function WeatherIcon(): ReactElement {
  return (
    <svg viewBox="0 0 88 88" aria-hidden="true" focusable="false">
      <circle cx="57" cy="29" r="13" className="verktoy-screen__weather-sun" />
      <path d="M28 62h35c10 0 15-6 15-14 0-8-6-14-15-14h-2C58 24 50 18 39 18c-13 0-23 10-23 23v1C9 44 5 49 5 56c0 8 7 14 23 6Z" className="verktoy-screen__weather-cloud" />
    </svg>
  );
}

function ToolIcon({ name }: { name: SecondaryTool['icon'] }): ReactElement {
  if (name === 'sleep') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18.5 15.2A8.2 8.2 0 0 1 8.8 5.5 8.2 8.2 0 1 0 18.5 15.2Z" />
        <path d="m17.5 4 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" />
      </svg>
    );
  }
  if (name === 'winter') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 5.5 12 8l2.5-2.5M9.5 18.5 12 16l2.5 2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" />
      <path d="M11 8v9" />
    </svg>
  );
}

function Arrow(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function VerktoyScreen({ onOpenTool }: VerktoyScreenProps): ReactElement {
  const { t } = useTranslation();
  const { fire } = useHapticSystem();

  const openTool = (target: VerktoyTarget) => {
    void fire('selection');
    onOpenTool(target);
  };

  return (
    <section className="verktoy-screen" aria-labelledby="verktoy-title">
      <header className="verktoy-screen__header">
        <p className="verktoy-screen__eyebrow">Babyora</p>
        <h1 id="verktoy-title">{t('tools.title')}</h1>
        <p>{t('tools.intro')}</p>
      </header>

      <button
        type="button"
        className="verktoy-screen__weather"
        onClick={() => openTool('finn-antrekk')}
      >
        <span className="verktoy-screen__weather-copy">
          <span className="verktoy-screen__kicker">{t('tools.weatherCalculator.kicker')}</span>
          <strong>{t('tools.weatherCalculator.title')}</strong>
          <span>{t('tools.weatherCalculator.description')}</span>
        </span>
        <span className="verktoy-screen__weather-art"><WeatherIcon /></span>
        <span className="verktoy-screen__weather-action">
          {t('tools.open')}
          <Arrow />
        </span>
      </button>

      <section className="verktoy-screen__guides" aria-labelledby="verktoy-guides-title">
        <div className="verktoy-screen__section-heading">
          <p className="verktoy-screen__kicker">{t('tools.guidesKicker')}</p>
          <h2 id="verktoy-guides-title">{t('tools.guidesTitle')}</h2>
        </div>
        <ul className="verktoy-screen__guide-list" role="list">
          {SECONDARY_TOOLS.map((tool) => (
            <li key={tool.target}>
              <button type="button" onClick={() => openTool(tool.target)}>
                <span className={`verktoy-screen__guide-icon verktoy-screen__guide-icon--${tool.icon}`}>
                  <ToolIcon name={tool.icon} />
                </span>
                <span className="verktoy-screen__guide-copy">
                  <strong>{t(tool.titleKey)}</strong>
                  <span>{t(tool.descriptionKey)}</span>
                </span>
                <span className="verktoy-screen__guide-arrow"><Arrow /></span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

export default VerktoyScreen;
