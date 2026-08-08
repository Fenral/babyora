/**
 * Hjem-resultatet er selve påkledningsreisen: ett vertikalt plaggkort per
 * steg, i motorens rekkefølge innerst → ytterst. Skinnen bruker nettleserens
 * egen horisontale scrolling og scroll-snap. Ingen pointer capture, kunstig
 * drag-state eller transform-spor konkurrerer med iOS sin tilbakegest.
 */
import i18next from 'i18next';
import {
  type MouseEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { garmentFactFor } from '../../data/garment-facts.js';
import type { WhyContext } from '../../data/garment-info.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { getGarmentImage } from '../../lib/monter-assets.js';
import { MonterGarmentRow } from './MonterGarmentRow.js';
import {
  localizedWhyForGarment,
  resultCopyFor,
} from './result-localization.js';
import type { ResultRow } from './result-rows.js';
import './hjem-monter.css';

const ROW_STAGGER_MS = 80;
const ROW_STAGGER_START_MS = 50;
const RESULT_MASCOT_SRC = `${import.meta.env.BASE_URL}monter/maskot-resultat-sveip.webp`;
// Kept as a defensive SSR fallback; normal rendering always uses resultCopyFor.
const NORWEGIAN_CAROUSEL_FALLBACK = 'Kle på, steg for steg';

function ChevronIcon({ direction }: Readonly<{ direction: 'previous' | 'next' }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === 'previous' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

export type ResultSurfaceProps = Readonly<{
  rows: readonly ResultRow[];
  childLabel: string;
  isFresh: boolean;
  reducedMotion: boolean;
  whyContext: WhyContext | null;
  onSwapRow: (row: ResultRow, event: MouseEvent<HTMLButtonElement>) => void;
  onWhy: () => void;
}>;

export function ResultSurface({
  rows,
  childLabel,
  isFresh,
  reducedMotion,
  whyContext,
  onSwapRow,
  onWhy,
}: ResultSurfaceProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  const animateRows = isFresh && !reducedMotion;
  const railRef = useRef<HTMLOListElement | null>(null);
  const railId = useId();
  const hintId = useId();
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const activeIndex = Math.min(rawActiveIndex, Math.max(rows.length - 1, 0));

  const syncActiveCard = useCallback(() => {
    const rail = railRef.current;
    if (rail === null || rail.children.length === 0) return;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    Array.from(rail.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const distance = Math.abs(card.offsetLeft - rail.scrollLeft - rail.clientLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
  }, []);

  const scrollToCard = useCallback((nextIndex: number) => {
    const clamped = Math.min(Math.max(nextIndex, 0), Math.max(rows.length - 1, 0));
    const rail = railRef.current;
    const card = rail?.children.item(clamped);
    if (rail === null) return;
    if (!(card instanceof HTMLElement)) return;
    setActiveIndex(clamped);
    rail.scrollTo({
      left: card.offsetLeft - rail.clientLeft,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion, rows.length]);

  return (
    <section
      className="hjm-result"
      data-scrollable="true"
      aria-label={copy.carouselLabel || NORWEGIAN_CAROUSEL_FALLBACK}
    >
      <div className="hjm-journey-intro">
        <div className="hjm-journey-copy">
          <h1>{copy.title}</h1>
          <p className="hjm-sub">{childLabel}</p>
          <p className="hjm-journey-hint" id={hintId}>
            {copy.hint}
          </p>
        </div>
        <div className="hjm-result-mascot-seam" data-result-avatar-seam aria-hidden="true">
          <img src={RESULT_MASCOT_SRC} alt="" draggable={false} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="hjm-journey-empty" role="status">{copy.empty}</p>
      ) : (
        <>
          <ol
            className="hjm-journey-rail"
            id={railId}
            ref={railRef}
            aria-describedby={hintId}
            data-fresh={animateRows ? 'true' : 'false'}
            onScroll={syncActiveCard}
          >
            {rows.map((row, index) => {
              const displayLabel = displayNameForDbString(
                row.label,
                i18next.resolvedLanguage,
              );
              const fact = garmentFactFor(
                row.garmentId ?? 'unknown-garment',
                i18next.resolvedLanguage,
              );
              const localizedRole = copy.role(row.roleLabel);
              const why = row.garmentId !== null && whyContext !== null
                ? localizedWhyForGarment(
                    row.garmentId,
                    whyContext,
                    i18next.resolvedLanguage,
                    localizedRole,
                  )
                : localizedRole;
              return (
                <MonterGarmentRow
                  key={row.key}
                  position={row.position}
                  total={rows.length}
                  label={displayLabel}
                  roleLabel={localizedRole}
                  imageSrc={getGarmentImage(row.garmentId)}
                  why={why}
                  factText={fact.text}
                  factSourceLabel={fact.sourceLabel}
                  factSourceUrl={fact.sourceUrl}
                  onSwap={(event) => onSwapRow(row, event)}
                  animationDelayMs={animateRows ? ROW_STAGGER_START_MS + index * ROW_STAGGER_MS : null}
                />
              );
            })}
          </ol>

          <nav className="hjm-journey-progress" aria-label={copy.progressLabel}>
            <button
              type="button"
              className="hjm-journey-nav-button"
              aria-label={copy.previous}
              aria-controls={railId}
              disabled={activeIndex === 0}
              onClick={() => scrollToCard(activeIndex - 1)}
            >
              <ChevronIcon direction="previous" />
            </button>
            <div className="hjm-journey-progress-copy" aria-live="polite" aria-atomic="true">
              <span>{copy.progress(activeIndex + 1, rows.length)}</span>
              <span className="hjm-journey-dots" aria-hidden="true">
                {rows.map((row, index) => (
                  <i key={row.key} data-active={index === activeIndex ? 'true' : 'false'} />
                ))}
              </span>
            </div>
            <button
              type="button"
              className="hjm-journey-nav-button"
              aria-label={copy.next}
              aria-controls={railId}
              disabled={activeIndex === rows.length - 1}
              onClick={() => scrollToCard(activeIndex + 1)}
            >
              <ChevronIcon direction="next" />
            </button>
          </nav>
        </>
      )}

      <div className="hjm-result-tools">
        <button type="button" className="hjm-why" onClick={onWhy}>
          {copy.whyButton}
        </button>
      </div>
    </section>
  );
}
