/**
 * Hjem-resultatet starter med den skannbare, nummererte plagglisten og åpner
 * deretter hvert plagg i en horisontal fordypning med kompakt faktatekst.
 * Skinnen bruker nettleserens egen scrolling og scroll-snap. Ingen pointer
 * capture, kunstig drag-state eller transform-spor konkurrerer med iOS sin
 * tilbakegest.
 */
import i18next from 'i18next';
import {
  Fragment,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { garmentFactFor } from '../../data/garment-facts.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { getGarmentImage } from '../../lib/monter-assets.js';
import { MonterGarmentRow } from './MonterGarmentRow.js';
import { resultCopyFor } from './result-localization.js';
import type { ResultRow } from './result-rows.js';
import './hjem-monter.css';

const ROW_STAGGER_MS = 80;
const ROW_STAGGER_START_MS = 50;
const RESULT_MASCOT_SRC = `${import.meta.env.BASE_URL}monter/maskot-resultat-sveip.webp`;
// Kept as a defensive SSR fallback; normal rendering always uses resultCopyFor.
const NORWEGIAN_CAROUSEL_FALLBACK = 'Kle på, steg for steg';
const LOOP_SETTLE_FALLBACK_MS = 130;

type LoopBand = 'leading' | 'canonical' | 'trailing';

function logicalIndexFor(physicalIndex: number, logicalCount: number): number {
  if (logicalCount <= 0) return 0;
  return ((physicalIndex % logicalCount) + logicalCount) % logicalCount;
}

function centeredScrollLeft(rail: HTMLElement, card: HTMLElement): number {
  return card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
}

function nearestPhysicalIndex(rail: HTMLElement): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const viewportCenter = rail.scrollLeft + rail.clientWidth / 2;
  Array.from(rail.children).forEach((child, index) => {
    const card = child as HTMLElement;
    const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - viewportCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

export type ResultSurfaceProps = Readonly<{
  rows: readonly ResultRow[];
  childLabel: string;
  isFresh: boolean;
  reducedMotion: boolean;
  onSwapRow: (row: ResultRow, event: MouseEvent<HTMLButtonElement>) => void;
  alternativeItemIds?: ReadonlySet<string>;
}>;

export function ResultSurface({
  rows,
  childLabel,
  isFresh,
  reducedMotion,
  onSwapRow,
  alternativeItemIds = new Set<string>(),
}: ResultSurfaceProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  const animateRows = isFresh && !reducedMotion;
  const railRef = useRef<HTMLOListElement | null>(null);
  const railId = useId();
  const hintId = useId();
  const titleId = useId();
  const loopSettleTimerRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const touchingRef = useRef(false);
  const [loopReady, setLoopReady] = useState(false);
  const [activeLogicalIndex, setActiveLogicalIndex] = useState(0);
  const [activePhysicalIndex, setActivePhysicalIndex] = useState(0);
  const [activeCardHeight, setActiveCardHeight] = useState<number | null>(null);
  const logicalCount = rows.length + 1;
  const physicalCount = logicalCount * 3;

  const measureCardHeight = useCallback((rail: HTMLOListElement, index: number) => {
    const card = rail.children.item(index);
    if (!(card instanceof HTMLElement)) return;
    const inner = card.querySelector<HTMLElement>('.hjm-journey-card-inner');
    if (inner === null) return;
    const nextHeight = Math.ceil(inner.getBoundingClientRect().height);
    if (nextHeight <= 0) return;
    setActiveCardHeight((current) => current === nextHeight ? current : nextHeight);
  }, []);

  const jumpToPhysicalCard = useCallback((physicalIndex: number) => {
    const rail = railRef.current;
    const card = rail?.children.item(physicalIndex);
    if (rail === null || !(card instanceof HTMLElement)) return;
    rail.scrollLeft = centeredScrollLeft(rail, card);
    const logicalIndex = logicalIndexFor(physicalIndex, logicalCount);
    setActivePhysicalIndex(physicalIndex);
    setActiveLogicalIndex(logicalIndex);
    measureCardHeight(rail, physicalIndex);
  }, [logicalCount, measureCardHeight]);

  const normalizeLoopPosition = useCallback(() => {
    const rail = railRef.current;
    if (rail === null || rail.children.length === 0 || touchingRef.current) return;
    const nearestIndex = nearestPhysicalIndex(rail);
    const logicalIndex = logicalIndexFor(nearestIndex, logicalCount);
    if (nearestIndex < logicalCount || nearestIndex >= logicalCount * 2) {
      jumpToPhysicalCard(logicalCount + logicalIndex);
    }
  }, [jumpToPhysicalCard, logicalCount]);

  const scheduleLoopNormalization = useCallback(() => {
    if (loopSettleTimerRef.current !== null) {
      window.clearTimeout(loopSettleTimerRef.current);
    }
    loopSettleTimerRef.current = window.setTimeout(() => {
      loopSettleTimerRef.current = null;
      normalizeLoopPosition();
    }, LOOP_SETTLE_FALLBACK_MS);
  }, [normalizeLoopPosition]);

  const syncActiveCard = useCallback(() => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const rail = railRef.current;
      if (rail === null || rail.children.length === 0) return;
      const nearestIndex = nearestPhysicalIndex(rail);
      const logicalIndex = logicalIndexFor(nearestIndex, logicalCount);
      setActivePhysicalIndex((current) => current === nearestIndex ? current : nearestIndex);
      setActiveLogicalIndex((current) => current === logicalIndex ? current : logicalIndex);
      measureCardHeight(rail, nearestIndex);
      if (!touchingRef.current) scheduleLoopNormalization();
    });
  }, [logicalCount, measureCardHeight, scheduleLoopNormalization]);

  useLayoutEffect(() => {
    if (rows.length === 0) return;
    const rail = railRef.current;
    if (rail === null) return;
    jumpToPhysicalCard(logicalCount);
    setLoopReady(true);
  }, [jumpToPhysicalCard, logicalCount, rows.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (rail === null) return undefined;
    const handleScrollEnd = () => normalizeLoopPosition();
    rail.addEventListener('scrollend', handleScrollEnd);
    return () => rail.removeEventListener('scrollend', handleScrollEnd);
  }, [normalizeLoopPosition]);

  useEffect(() => () => {
    if (loopSettleTimerRef.current !== null) window.clearTimeout(loopSettleTimerRef.current);
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (rail === null) return undefined;
    const frame = window.requestAnimationFrame(() => {
      measureCardHeight(rail, activePhysicalIndex);
    });
    const card = rail.children.item(activePhysicalIndex);
    const inner = card instanceof HTMLElement
      ? card.querySelector<HTMLElement>('.hjm-journey-card-inner')
      : null;
    const observer = inner !== null && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => measureCardHeight(rail, activePhysicalIndex))
      : null;
    if (inner !== null) observer?.observe(inner);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [activePhysicalIndex, measureCardHeight, rows.length]);

  const scrollToPhysicalCard = useCallback((nextIndex: number, moveFocus = false) => {
    const clamped = Math.min(Math.max(nextIndex, 0), Math.max(physicalCount - 1, 0));
    const rail = railRef.current;
    const card = rail?.children.item(clamped);
    if (rail === null) return;
    if (!(card instanceof HTMLElement)) return;
    const logicalIndex = logicalIndexFor(clamped, logicalCount);
    setActivePhysicalIndex(clamped);
    setActiveLogicalIndex(logicalIndex);
    rail.scrollTo({
      left: centeredScrollLeft(rail, card),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    if (moveFocus) {
      const focusTarget = card.querySelector<HTMLElement>('.hjm-journey-detail')
        ?? card.querySelector<HTMLElement>('[data-hjm-card-focus]');
      focusTarget?.focus({ preventScroll: true });
    }
  }, [logicalCount, physicalCount, reducedMotion]);

  const handleRailKeyDown = useCallback((event: KeyboardEvent<HTMLOListElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToPhysicalCard(activePhysicalIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToPhysicalCard(activePhysicalIndex + 1);
    }
  }, [activePhysicalIndex, scrollToPhysicalCard]);

  const presentedRows = rows.map((row) => ({
    row,
    displayLabel: displayNameForDbString(row.label, i18next.resolvedLanguage),
    localizedRole: copy.role(row.roleLabel),
    imageSrc: getGarmentImage(row.garmentId),
  }));

  const renderOverviewCard = (loopBand: LoopBand) => {
    const isCanonical = loopBand === 'canonical';
    return (
      <li
        key={`${loopBand}-overview`}
        className="hjm-journey-card hjm-journey-overview-card"
        data-hjm-overview-card={isCanonical ? 'true' : undefined}
        data-garment-count={isCanonical ? rows.length : undefined}
        data-loop-band={loopBand}
        data-loop-clone={isCanonical ? undefined : 'true'}
        aria-hidden={isCanonical ? undefined : true}
        inert={isCanonical ? undefined : true}
      >
        <article className="hjm-journey-card-inner hjm-journey-overview-inner">
          <div className="hjm-journey-overview-heading">
            <h2>{copy.overviewTitle}</h2>
            <span>{rows.length}</span>
          </div>
          <ol
            className="hjm-rows hjm-journey-overview-list"
            aria-label={copy.progressLabel}
            data-fresh={isCanonical && animateRows ? 'true' : 'false'}
          >
            {presentedRows.map(({ row, displayLabel, localizedRole, imageSrc }, index) => (
              <MonterGarmentRow
                key={`${loopBand}-overview-${row.key}`}
                position={row.position}
                label={displayLabel}
                roleLabel={localizedRole}
                imageSrc={imageSrc}
                compactDestinationLabel={copy.openGarment(displayLabel)}
                onSwap={(event) => scrollToPhysicalCard(
                  logicalCount + index + 1,
                  event.detail === 0,
                )}
                animationDelayMs={isCanonical && animateRows
                  ? ROW_STAGGER_START_MS + index * ROW_STAGGER_MS
                  : null}
              />
            ))}
          </ol>
        </article>
      </li>
    );
  };

  const renderDetailCards = (loopBand: LoopBand) => presentedRows.map(({
    row,
    displayLabel,
    localizedRole,
    imageSrc,
  }) => {
    const fact = row.garmentId === null
      ? null
      : garmentFactFor(row.garmentId, i18next.resolvedLanguage).text;
    const hasAlternatives = row.outfitItemId !== null
      && alternativeItemIds.has(row.outfitItemId);
    return (
      <MonterGarmentRow
        key={`${loopBand}-${row.key}`}
        position={row.position}
        total={rows.length}
        label={displayLabel}
        roleLabel={localizedRole}
        imageSrc={imageSrc}
        fact={fact}
        hasAlternatives={hasAlternatives}
        loopBand={loopBand}
        onSwap={(event) => onSwapRow(row, event)}
        animationDelayMs={null}
      />
    );
  });

  const loopBands: readonly LoopBand[] = ['leading', 'canonical', 'trailing'];

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
            data-loop-ready={loopReady ? 'true' : 'false'}
            data-adaptive-height={activeCardHeight === null ? 'false' : 'true'}
            data-reduced-motion={reducedMotion ? 'true' : 'false'}
            tabIndex={0}
            style={activeCardHeight === null ? undefined : {
              '--hjm-active-card-height': `${activeCardHeight}px`,
            } as CSSProperties}
            onKeyDown={handleRailKeyDown}
            onScroll={syncActiveCard}
            onTouchStart={() => { touchingRef.current = true; }}
            onTouchEnd={() => {
              touchingRef.current = false;
              scheduleLoopNormalization();
            }}
            onTouchCancel={() => {
              touchingRef.current = false;
              scheduleLoopNormalization();
            }}
          >
            {loopBands.map((loopBand) => (
              <Fragment key={loopBand}>
                {renderOverviewCard(loopBand)}
                {renderDetailCards(loopBand)}
              </Fragment>
            ))}
          </ol>

          {logicalCount > 1 ? (
            <div className="hjm-journey-progress" aria-label={copy.progressLabel}>
              <span className="hjm-sr-only" aria-live="polite" aria-atomic="true">
                {activeLogicalIndex === 0
                  ? copy.overviewProgress
                  : copy.progress(activeLogicalIndex, rows.length)}
              </span>
              <span className="hjm-journey-dots" aria-hidden="true">
                {Array.from({ length: logicalCount }, (_, index) => (
                  <i
                    key={index === 0 ? 'overview' : rows[index - 1]?.key}
                    data-active={index === activeLogicalIndex ? 'true' : 'false'}
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
