import i18next from 'i18next';
import type { RefObject, SyntheticEvent } from 'react';
import type { GarmentFact } from '../../data/garment-facts.js';
import { GENERIC_GARMENT_SVG } from '../../data/garment-illustrations.js';
import { Sheet } from '../controls/Sheet.js';
import { resultCopyFor } from './result-localization.js';
import './hjem-monter.css';

export type GarmentFactSheetItem = Readonly<{
  label: string;
  imageSrc: string;
  fact: GarmentFact;
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

export function GarmentFactSheet({
  item,
  isOpen,
  onClose,
  triggerRef,
}: GarmentFactSheetProps) {
  if (item === null) return null;
  const copy = resultCopyFor(i18next.resolvedLanguage);

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      title={copy.moreInfoTitle(item.label)}
      closeLabel={copy.closeMoreInfo}
    >
      <article className="hjm-fact-sheet" data-garment-fact-sheet>
        <div className="hjm-fact-sheet__identity">
          <span className="hjm-fact-sheet__image" aria-hidden="true">
            <img
              src={item.imageSrc}
              alt=""
              width={88}
              height={88}
              onError={fallbackBrokenImage}
            />
          </span>
          <div>
            <p className="hjm-fact-sheet__eyebrow">{copy.goodToKnow}</p>
            <h3>{item.label}</h3>
          </div>
        </div>
        <p className="hjm-fact-sheet__text">{item.fact.text}</p>
        <div className="hjm-fact-sheet__source">
          <p className="hjm-fact-sheet__eyebrow">{copy.source}</p>
          <a
            href={item.fact.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {item.fact.sourceLabel}
          </a>
        </div>
      </article>
    </Sheet>
  );
}
