/**
 * Hjem-resultatet starter med den skannbare, nummererte plagglisten og åpner
 * deretter hvert plagg i en horisontal fordypning med hvorfor-tekst og fakta.
 * Skinnen bruker nettleserens egen scrolling og scroll-snap. Ingen pointer
 * capture, kunstig drag-state eller transform-spor konkurrerer med iOS sin
 * tilbakegest.
 */
import i18next from 'i18next';
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
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

export type ResultSurfaceProps = Readonly<{
  rows: readonly ResultRow[];
  childLabel: string;
  isFresh: boolean;
  reducedMotion: boolean;
  whyContext: WhyContext | null;
  onSwapRow: (row: ResultRow, event: MouseEvent<HTMLButtonElement>) => void;
}>;

export function ResultSurface({
  rows,
  childLabel,
  isFresh,
  reducedMotion,
  whyContext,
  onSwapRow,
}: ResultSurfaceProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  const animateRows = isFresh && !reducedMotion;
  const railRef = useRef<HTMLOListElement | null>(null);
  const railId = useId();
  const hintId = useId();
  const titleId = useId();
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const slideCount = rows.length + 1;
  const activeIndex = Math.min(rawActiveIndex, Math.max(slideCount - 1, 0));

  const syncActiveCard = useCallback(() => {
    const rail = railRef.current;
    if (rail === null || rail.children.length === 0) return;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const viewportCenter = rail.scrollLeft + rail.clientWidth / 2;
    Array.from(rail.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
  }, []);

  const scrollToCard = useCallback((nextIndex: number) => {
    const clamped = Math.min(Math.max(nextIndex, 0), Math.max(slideCount - 1, 0));
    const rail = railRef.current;
    const card = rail?.children.item(clamped);
    if (rail === null) return;
    if (!(card instanceof HTMLElement)) return;
    setActiveIndex(clamped);
    rail.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion, slideCount]);

  const handleRailKeyDown = useCallback((event: KeyboardEvent<HTMLOListElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToCard(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToCard(activeIndex + 1);
    }
  }, [activeIndex, scrollToCard]);

  const presentedRows = rows.map((row) => ({
    row,
    displayLabel: displayNameForDbString(row.label, i18next.resolvedLanguage),
    localizedRole: copy.role(row.roleLabel),
    imageSrc: getGarmentImage(row.garmentId),
  }));

  return (
    <section
      className="hjm-result"
      data-scrollable="true"
      aria-labelledby={titleId}
    >
      <div className="hjm-journey-intro">
        <div className="hjm-journey-copy">
          <h1 id={titleId}>{copy.title}</h1>
          <p className="hjm-sub">{childLabel}</p>
        </div>
        <div className="hjm-result-mascot-seam" data-result-avatar-seam aria-hidden="true">
          <img src={RESULT_MASCOT_SRC} alt="" draggable={false} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="hjm-journey-empty" role="status">{copy.empty}</p>
      ) : (
        <>
          <p className="hjm-sr-only" id={hintId}>{copy.carouselHint}</p>

          <ol
            className="hjm-journey-rail"
            id={railId}
            ref={railRef}
            aria-label={copy.carouselLabel || NORWEGIAN_CAROUSEL_FALLBACK}
            aria-describedby={hintId}
            tabIndex={0}
            onKeyDown={handleRailKeyDown}
            onScroll={syncActiveCard}
          >
            <li
              className="hjm-journey-card hjm-journey-overview-card"
              data-hjm-overview-card="true"
            >
              <article className="hjm-journey-card-inner hjm-journey-overview-inner">
                <div className="hjm-journey-overview-heading">
                  <h2>{copy.overviewTitle}</h2>
                  <span>{rows.length}</span>
                </div>
                <ol
                  className="hjm-rows hjm-journey-overview-list"
                  aria-label={copy.progressLabel}
                  data-fresh={animateRows ? 'true' : 'false'}
                >
                  {presentedRows.map(({ row, displayLabel, localizedRole, imageSrc }, index) => (
                    <MonterGarmentRow
                      key={`overview-${row.key}`}
                      position={row.position}
                      label={displayLabel}
                      roleLabel={localizedRole}
                      imageSrc={imageSrc}
                      compactDestinationLabel={copy.openGarment(displayLabel)}
                      onSwap={() => scrollToCard(index + 1)}
                      animationDelayMs={animateRows ? ROW_STAGGER_START_MS + index * ROW_STAGGER_MS : null}
                    />
                  ))}
                </ol>
              </article>
            </li>

            {presentedRows.map(({ row, displayLabel, localizedRole, imageSrc }) => {
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
                  imageSrc={imageSrc}
                  why={why}
                  onSwap={(event) => onSwapRow(row, event)}
                  animationDelayMs={null}
                />
              );
            })}
          </ol>

          {slideCount > 1 ? (
            <div className="hjm-journey-progress" aria-label={copy.progressLabel}>
              <span className="hjm-sr-only" aria-live="polite" aria-atomic="true">
                {activeIndex === 0
                  ? copy.overviewProgress
                  : copy.progress(activeIndex, rows.length)}
              </span>
              <span className="hjm-journey-dots" aria-hidden="true">
                {Array.from({ length: slideCount }, (_, index) => (
                  <i
                    key={index === 0 ? 'overview' : rows[index - 1]?.key}
                    data-active={index === activeIndex ? 'true' : 'false'}
                  />
                ))}
              </span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
