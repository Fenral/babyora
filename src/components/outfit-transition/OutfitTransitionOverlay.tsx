import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type { EligibleTransitionSnapshot } from '../../lib/outfit-transition/eligibility.js';
import { createOutfitTransitionTimeline } from '../../lib/outfit-transition/timeline.js';
import { MOTION } from '../../styles/motion-grammar.js';
import './OutfitTransitionOverlay.css';

export type OutfitTransitionPresentation = Readonly<{
  itemId: string;
  label: string;
}>;

type OverlayItem = Readonly<{
  itemId: string;
  label: string;
  sourceStyle: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  destination: Readonly<{
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  }>;
  delayMs: number;
  durationMs: number;
  endMs: number;
}>;

export type OutfitTransitionOverlayModel =
  | Readonly<{ kind: 'static-only' }>
  | Readonly<{
      kind: 'ready';
      totalDurationMs: number;
      items: readonly OverlayItem[];
    }>;

const STATIC_ONLY = Object.freeze({ kind: 'static-only' as const });

function positiveRect(rect: EligibleTransitionSnapshot['items'][number]['sourceRect']): boolean {
  return (
    Number.isFinite(rect.x)
    && Number.isFinite(rect.y)
    && Number.isFinite(rect.width)
    && Number.isFinite(rect.height)
    && rect.width > 0
    && rect.height > 0
  );
}

// Contract builder is exported for deterministic geometry tests.
// eslint-disable-next-line react-refresh/only-export-components
export function createOutfitTransitionOverlayModel(
  snapshot: EligibleTransitionSnapshot | null | undefined,
  presentations: readonly OutfitTransitionPresentation[],
): OutfitTransitionOverlayModel {
  if (
    snapshot == null
    || snapshot.items.length === 0
    || snapshot.items.length !== presentations.length
  ) {
    return STATIC_ONLY;
  }
  const seen = new Set<string>();
  const valid = snapshot.items.every((item, index) => {
    const presentation = presentations[index];
    return (
      presentation !== undefined
      && presentation.itemId === item.itemId
      && typeof presentation.label === 'string'
      && presentation.label.length > 0
      && !seen.has(item.itemId)
      && positiveRect(item.sourceRect)
      && positiveRect(item.targetRect)
      && (seen.add(item.itemId), true)
    );
  });
  if (!valid) return STATIC_ONLY;

  const timeline = createOutfitTransitionTimeline({
    normalUiDurationMs: MOTION.outfitTransitionNormal,
    explanatoryDurationMs: MOTION.outfitTransitionExplanation,
  }, snapshot.items.length);
  const items = snapshot.items.map((item, index) => {
    const timing = timeline.items[index];
    const presentation = presentations[index];
    if (timing === undefined || presentation === undefined) {
      throw new Error('Validated transition item lost its timeline mapping');
    }
    return Object.freeze({
      itemId: item.itemId,
      label: presentation.label,
      sourceStyle: Object.freeze({
        left: item.sourceRect.x,
        top: item.sourceRect.y,
        width: item.sourceRect.width,
        height: item.sourceRect.height,
      }),
      destination: Object.freeze({
        x: item.targetRect.x - item.sourceRect.x,
        y: item.targetRect.y - item.sourceRect.y,
        scaleX: item.targetRect.width / item.sourceRect.width,
        scaleY: item.targetRect.height / item.sourceRect.height,
      }),
      delayMs: timing.delayMs,
      durationMs: timing.durationMs,
      endMs: timing.endMs,
    });
  });
  return Object.freeze({
    kind: 'ready',
    totalDurationMs: timeline.totalDurationMs,
    items: Object.freeze(items),
  });
}

export type OutfitTransitionOverlayProps = Readonly<{
  snapshot: EligibleTransitionSnapshot;
  presentations: readonly OutfitTransitionPresentation[];
  reducedMotion?: boolean;
  onFinish: () => void;
  onAbort: () => void;
}>;

export function OutfitTransitionOverlay({
  snapshot,
  presentations,
  reducedMotion = false,
  onFinish,
  onAbort,
}: OutfitTransitionOverlayProps): ReactElement | null {
  const model = useMemo(
    () => createOutfitTransitionOverlayModel(snapshot, presentations),
    [presentations, snapshot],
  );
  const terminal = useRef(false);
  const onFinishRef = useRef(onFinish);
  const onAbortRef = useRef(onAbort);
  useEffect(() => {
    onFinishRef.current = onFinish;
    onAbortRef.current = onAbort;
  }, [onAbort, onFinish]);
  const finish = useCallback((): void => {
    if (terminal.current) return;
    terminal.current = true;
    onFinishRef.current();
  }, []);
  const abort = useCallback((): void => {
    if (terminal.current) return;
    terminal.current = true;
    onAbortRef.current();
  }, []);

  useEffect(() => {
    if (
      reducedMotion
      || model.kind !== 'ready'
      || typeof document === 'undefined'
      || document.body == null
    ) {
      abort();
      return;
    }
    return abort;
  }, [abort, model, reducedMotion]);

  if (
    reducedMotion
    || model.kind !== 'ready'
    || typeof document === 'undefined'
    || document.body == null
  ) {
    return null;
  }

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        <div
          className="outfit-transition-overlay"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
          data-outfit-transition-overlay=""
          data-outfit-transition-duration-ms={model.totalDurationMs}
        >
          {model.items.map((item, index) => (
            <motion.div
              key={item.itemId}
              className="outfit-transition-overlay__clone"
              data-outfit-transition-clone={item.itemId}
              data-outfit-transition-end-ms={item.endMs}
              data-outfit-transition-target-x={
                item.sourceStyle.left + item.destination.x
              }
              data-outfit-transition-target-y={
                item.sourceStyle.top + item.destination.y
              }
              data-outfit-transition-target-width={
                item.sourceStyle.width * item.destination.scaleX
              }
              data-outfit-transition-target-height={
                item.sourceStyle.height * item.destination.scaleY
              }
              style={{ ...item.sourceStyle, pointerEvents: 'none' }}
              initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
              animate={{
                x: item.destination.x,
                y: item.destination.y,
                scaleX: item.destination.scaleX,
                scaleY: item.destination.scaleY,
                opacity: [1, 0.96, 0],
              }}
              transition={{
                delay: item.delayMs / 1_000,
                duration: item.durationMs / 1_000,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={
                index === model.items.length - 1 ? finish : undefined
              }
            >
              {item.label}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
