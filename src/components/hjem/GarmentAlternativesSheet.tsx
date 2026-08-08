import {
  useEffect,
  useRef,
  type JSX,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { GENERIC_GARMENT_SVG } from '../../data/garment-illustrations.js';
import type {
  HomeAlternativeLanguage,
  HomeGarmentAlternativeGroup,
} from '../../lib/outfit/home-garment-alternatives.js';
import './GarmentAlternativesSheet.css';

type SheetCopy = Readonly<{
  title: string;
  intro: string;
  close: string;
  recommended: string;
  alternative: string;
  goodToKnow: string;
  advantages: string;
  tradeoffs: string;
}>;

const COPY: Readonly<Record<HomeAlternativeLanguage, SheetCopy>> = {
  no: {
    title: 'Alternativer',
    intro: 'Sammenlign anbefalingen med trygge alternativer for samme plass i antrekket.',
    close: 'Lukk alternativer',
    recommended: 'Anbefalt',
    alternative: 'Alternativ',
    goodToKnow: 'Godt å vite',
    advantages: 'Fordeler',
    tradeoffs: 'Vær oppmerksom på',
  },
  en: {
    title: 'Alternatives',
    intro: 'Compare the recommendation with safe alternatives for the same place in the outfit.',
    close: 'Close alternatives',
    recommended: 'Recommended',
    alternative: 'Alternative',
    goodToKnow: 'Good to know',
    advantages: 'Advantages',
    tradeoffs: 'Keep in mind',
  },
  sv: {
    title: 'Alternativ',
    intro: 'Jämför rekommendationen med trygga alternativ för samma plats i klädseln.',
    close: 'Stäng alternativ',
    recommended: 'Rekommenderat',
    alternative: 'Alternativ',
    goodToKnow: 'Bra att veta',
    advantages: 'Fördelar',
    tradeoffs: 'Tänk på',
  },
  da: {
    title: 'Alternativer',
    intro: 'Sammenlign anbefalingen med trygge alternativer til samme plads i påklædningen.',
    close: 'Luk alternativer',
    recommended: 'Anbefalet',
    alternative: 'Alternativ',
    goodToKnow: 'Godt at vide',
    advantages: 'Fordele',
    tradeoffs: 'Vær opmærksom på',
  },
};

function resolveLanguage(language: string | null | undefined): HomeAlternativeLanguage {
  const base = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'no' || base === 'nb' || base === 'nn') return 'no';
  if (base === 'sv' || base === 'da') return base;
  return 'en';
}

function fallbackBrokenImage(event: SyntheticEvent<HTMLImageElement>): void {
  const image = event.currentTarget;
  if (image.src !== GENERIC_GARMENT_SVG) image.src = GENERIC_GARMENT_SVG;
}

export type GarmentAlternativesSheetProps = Readonly<{
  group: HomeGarmentAlternativeGroup | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}>;

export function GarmentAlternativesSheet({
  group,
  isOpen,
  onClose,
  triggerRef,
}: GarmentAlternativesSheetProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const copy = COPY[language];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && group !== null && !dialog.open) dialog.showModal();
    if ((!isOpen || group === null) && dialog.open) dialog.close();
  }, [group, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  if (group === null) return null;

  const close = () => dialogRef.current?.close();
  const handleBackdropClick = (
    event: MouseEvent<HTMLDialogElement>,
  ) => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const bounds = dialog.getBoundingClientRect();
    const inside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!inside) close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="hga-sheet"
      aria-labelledby="hga-sheet-title"
      aria-describedby="hga-sheet-intro"
      onClick={handleBackdropClick}
      data-home-garment-alternatives
    >
      <div className="hga-sheet__handle" aria-hidden="true" />
      <header className="hga-sheet__header">
        <div>
          <h2 id="hga-sheet-title">{copy.title}</h2>
          <p id="hga-sheet-intro">{copy.intro}</p>
        </div>
        <button
          type="button"
          className="hga-sheet__close ba-press"
          aria-label={copy.close}
          onClick={close}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="hga-sheet__body">
        <article className="hga-sheet__recommended">
          <div className="hga-sheet__identity">
            <span className="hga-sheet__image-wrap">
              <img
                src={group.source.imageSrc}
                alt=""
                width={80}
                height={80}
                onError={fallbackBrokenImage}
              />
            </span>
            <div>
              <p className="hga-sheet__eyebrow">{copy.recommended}</p>
              <h3>{group.source.name}</h3>
            </div>
          </div>
          <div className="hga-sheet__fact">
            <p className="hga-sheet__eyebrow">{copy.goodToKnow}</p>
            <p>{group.source.fact.text}</p>
            <a
              href={group.source.fact.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {group.source.fact.sourceLabel}
            </a>
          </div>
          <div className="hga-sheet__comparison">
            <ComparisonList
              title={copy.advantages}
              marker="+"
              items={group.source.advantages}
            />
            <ComparisonList
              title={copy.tradeoffs}
              marker="−"
              items={group.source.tradeoffs}
            />
          </div>
        </article>

        <div className="hga-sheet__alternatives" role="list">
          {group.alternatives.map((alternative) => (
            <article
              className="hga-sheet__alternative"
              key={alternative.optionId}
              role="listitem"
            >
              <div className="hga-sheet__identity">
                <span className="hga-sheet__image-wrap">
                  <img
                    src={alternative.imageSrc}
                    alt=""
                    width={80}
                    height={80}
                    onError={fallbackBrokenImage}
                  />
                </span>
                <div>
                  <p className="hga-sheet__eyebrow">{copy.alternative}</p>
                  <h3>{alternative.name}</h3>
                </div>
              </div>

              <div className="hga-sheet__comparison">
                <ComparisonList
                  title={copy.advantages}
                  marker="+"
                  items={alternative.advantages}
                />
                <ComparisonList
                  title={copy.tradeoffs}
                  marker="−"
                  items={alternative.tradeoffs}
                />
              </div>

              <div className="hga-sheet__fact hga-sheet__fact--alternative">
                <p className="hga-sheet__eyebrow">{copy.goodToKnow}</p>
                <p>{alternative.fact.text}</p>
                <a
                  href={alternative.fact.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {alternative.fact.sourceLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </dialog>
  );
}

function ComparisonList({
  title,
  marker,
  items,
}: Readonly<{
  title: string;
  marker: '+' | '−';
  items: readonly string[];
}>): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <section>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span aria-hidden="true">{marker}</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
