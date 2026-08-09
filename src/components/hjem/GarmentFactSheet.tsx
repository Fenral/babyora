import i18next from 'i18next';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import type { GarmentFact } from '../../data/garment-facts.js';
import { GENERIC_GARMENT_SVG } from '../../data/garment-illustrations.js';
import { selection as hapticSelection } from '../../lib/haptics.js';
import type { HomeGarmentAlternativeGroup } from '../../lib/outfit/home-garment-alternatives.js';
import { resultCopyFor, resultLanguage, type ResultLanguage } from './result-localization.js';
import './GarmentFactSheet.css';

type DetailCopy = Readonly<{
  close: string;
  recommended: string;
  alternative: string;
  advantages: string;
  tradeoffs: string;
  compareIntro: string;
  hideAlternatives: string;
}>;

const DETAIL_COPY: Readonly<Record<ResultLanguage, DetailCopy>> = {
  no: {
    close: 'Lukk plaggdetaljer',
    recommended: 'Anbefalt',
    alternative: 'Alternativ',
    advantages: 'Fordeler',
    tradeoffs: 'Vær oppmerksom på',
    compareIntro: 'Sammenlign andre plagg motoren tillater på samme plass i antrekket.',
    hideAlternatives: 'Skjul alternativer',
  },
  en: {
    close: 'Close garment details',
    recommended: 'Recommended',
    alternative: 'Alternative',
    advantages: 'Advantages',
    tradeoffs: 'Keep in mind',
    compareIntro: 'Compare other garments the engine allows in the same place in the outfit.',
    hideAlternatives: 'Hide alternatives',
  },
  sv: {
    close: 'Stäng plaggdetaljer',
    recommended: 'Rekommenderat',
    alternative: 'Alternativ',
    advantages: 'Fördelar',
    tradeoffs: 'Tänk på',
    compareIntro: 'Jämför andra plagg som motorn tillåter på samma plats i klädseln.',
    hideAlternatives: 'Dölj alternativ',
  },
  da: {
    close: 'Luk tøjdetaljer',
    recommended: 'Anbefalet',
    alternative: 'Alternativ',
    advantages: 'Fordele',
    tradeoffs: 'Vær opmærksom på',
    compareIntro: 'Sammenlign andet tøj, som motoren tillader på samme plads i påklædningen.',
    hideAlternatives: 'Skjul alternativer',
  },
};

export type GarmentFactSheetItem = Readonly<{
  label: string;
  roleLabel: string;
  position: number;
  total: number;
  imageSrc: string;
  fact: GarmentFact | null;
  alternativeGroup: HomeGarmentAlternativeGroup | null;
}>;

export type GarmentFactSheetProps = Readonly<{
  item: GarmentFactSheetItem | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}>;

function fallbackBrokenImage(event: SyntheticEvent<HTMLImageElement>): void {
  const image = event.currentTarget;
  if (image.src !== GENERIC_GARMENT_SVG) image.src = GENERIC_GARMENT_SVG;
}

function ComparisonList({
  title,
  marker,
  items,
}: Readonly<{
  title: string;
  marker: '+' | '−';
  items: readonly string[];
}>) {
  if (items.length === 0) return null;
  return (
    <section className="hgd-comparison-list">
      <h4>{title}</h4>
      <ul>
        {items.map((entry) => (
          <li key={entry}>
            <span aria-hidden="true">{marker}</span>
            {entry}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GarmentFactSheet({
  item,
  isOpen,
  onClose,
  triggerRef,
}: GarmentFactSheetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const language = resultLanguage(i18next.resolvedLanguage);
  const copy = resultCopyFor(language);
  const detailCopy = DETAIL_COPY[language];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && item !== null && !dialog.open) dialog.showModal();
    if ((!isOpen || item === null) && dialog.open) dialog.close();
  }, [isOpen, item]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return undefined;
    const handleClose = () => {
      setShowAlternatives(false);
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  if (item === null) return null;

  const close = () => dialogRef.current?.close();
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (dialog === null || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const inside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!inside) close();
  };
  const group = item.alternativeGroup;

  return (
    <dialog
      ref={dialogRef}
      className="hgd-sheet"
      aria-labelledby="hgd-sheet-title"
      onClick={handleBackdropClick}
      data-garment-detail-sheet
    >
      <div className="hgd-sheet__handle" aria-hidden="true" />
      <header className="hgd-sheet__header">
        <div>
          <p>{copy.order(item.position, item.total)} · {item.roleLabel}</p>
          <h2 id="hgd-sheet-title">{item.label}</h2>
        </div>
        <button type="button" className="hgd-sheet__close ba-press" aria-label={detailCopy.close} onClick={close}>
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="hgd-sheet__body">
        <div className="hgd-sheet__identity">
          <span className="hgd-sheet__image" aria-hidden="true">
            <img src={item.imageSrc} alt="" width={132} height={132} onError={fallbackBrokenImage} />
          </span>
          {item.fact ? (
            <section className="hgd-sheet__fact">
              <h3>{copy.goodToKnow}</h3>
              <p>{item.fact.text}</p>
              <a href={item.fact.sourceUrl} target="_blank" rel="noreferrer">
                {item.fact.sourceLabel}
              </a>
            </section>
          ) : null}
        </div>

        {group ? (
          <>
            <button
              type="button"
              className="hgd-sheet__alternatives ba-press"
              aria-expanded={showAlternatives}
              aria-controls="hgd-alternative-comparison"
              onClick={() => {
                void hapticSelection();
                setShowAlternatives((current) => !current);
              }}
            >
              <span>{showAlternatives ? detailCopy.hideAlternatives : copy.alternatives}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="m8 10 4 4 4-4" />
              </svg>
            </button>

            {showAlternatives ? (
              <section className="hgd-comparison" id="hgd-alternative-comparison">
                <p className="hgd-comparison__intro">{detailCopy.compareIntro}</p>
                <article className="hgd-comparison__card" data-recommended="true">
                  <p className="hgd-comparison__eyebrow">{detailCopy.recommended}</p>
                  <h3>{group.source.name}</h3>
                  <div className="hgd-comparison__columns">
                    <ComparisonList title={detailCopy.advantages} marker="+" items={group.source.advantages} />
                    <ComparisonList title={detailCopy.tradeoffs} marker="−" items={group.source.tradeoffs} />
                  </div>
                </article>
                {group.alternatives.map((alternative) => (
                  <article className="hgd-comparison__card" key={alternative.optionId}>
                    <div className="hgd-comparison__identity">
                      <span aria-hidden="true">
                        <img src={alternative.imageSrc} alt="" width={64} height={64} onError={fallbackBrokenImage} />
                      </span>
                      <div>
                        <p className="hgd-comparison__eyebrow">{detailCopy.alternative}</p>
                        <h3>{alternative.name}</h3>
                      </div>
                    </div>
                    <div className="hgd-comparison__columns">
                      <ComparisonList title={detailCopy.advantages} marker="+" items={alternative.advantages} />
                      <ComparisonList title={detailCopy.tradeoffs} marker="−" items={alternative.tradeoffs} />
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </dialog>
  );
}
