import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { MOTION } from '../../styles/motion-grammar.js';

type Options = Readonly<{
  open: boolean;
  reducedMotion: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onAfterClose: () => void;
}>;

export type OriginDialogTransition = Readonly<{
  dialogRef: RefObject<HTMLDialogElement | null>;
  requestClose: () => void;
  handleCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;
}>;

const SHEET_REST_TRANSFORM = 'translate3d(0, 0, 0) scale(1, 1)';
const SHEET_OFFSCREEN_TRANSFORM = 'translate3d(0, 110%, 0) scale(1, 1)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canAnimate(node: Element): node is Element & { animate: Element['animate'] } {
  return typeof node.animate === 'function';
}

/**
 * Delt native-dialog-controller for Home. Triggerflaten står alltid stille
 * under scrimen; dialogen kommer inn nedenfra som i Opal-referansen, og
 * beholder showModal(), Escape, fokusfelle og fokusretur.
 */
export function useOriginDialogTransition({
  open,
  reducedMotion,
  triggerRef,
  onAfterClose,
}: Options): OriginDialogTransition {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const sheetAnimationRef = useRef<Animation | null>(null);
  const contentAnimationRef = useRef<Animation | null>(null);
  const closingRef = useRef(false);

  const motionDisabled = reducedMotion || prefersReducedMotion();

  const cancelAnimations = useCallback(() => {
    sheetAnimationRef.current?.cancel();
    contentAnimationRef.current?.cancel();
    sheetAnimationRef.current = null;
    contentAnimationRef.current = null;
  }, []);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog === null || !dialog.open || closingRef.current) return;
    closingRef.current = true;
    cancelAnimations();

    const content = dialog.querySelector<HTMLElement>('.home-origin-sheet__content');
    if (motionDisabled || !canAnimate(dialog)) {
      dialog.close();
      return;
    }

    dialog.dataset.motionPhase = 'exiting';
    const exit = dialog.animate(
      [
        {
          opacity: 1,
          transform: SHEET_REST_TRANSFORM,
        },
        {
          opacity: 1,
          transform: SHEET_OFFSCREEN_TRANSFORM,
        },
      ],
      {
        duration: MOTION.sheetExit,
        easing: MOTION.easeOutExpo,
        fill: 'both',
      },
    );
    sheetAnimationRef.current = exit;
    if (content !== null && canAnimate(content)) {
      contentAnimationRef.current = content.animate(
        [
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
        ],
        {
          duration: MOTION.toastExit,
          easing: MOTION.easeOutExpo,
          fill: 'both',
        },
      );
    }

    void exit.finished
      .catch(() => undefined)
      .then(() => {
        if (dialog.open) dialog.close();
      });
  }, [cancelAnimations, motionDisabled]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (motionDisabled) dialog.dataset.motionDisabled = 'true';
    else delete dialog.dataset.motionDisabled;

    if (open && !dialog.open) {
      closingRef.current = false;
      dialog.dataset.motionPhase = 'preparing';
      dialog.showModal();

      const content = dialog.querySelector<HTMLElement>('.home-origin-sheet__content');
      if (motionDisabled || !canAnimate(dialog)) {
        dialog.dataset.motionPhase = 'settled';
        return;
      }

      dialog.dataset.motionPhase = 'entering';
      const enter = dialog.animate(
        [
          {
            opacity: 1,
            transform: SHEET_OFFSCREEN_TRANSFORM,
          },
          {
            opacity: 1,
            transform: SHEET_REST_TRANSFORM,
          },
        ],
        {
          duration: MOTION.sheetEnter,
          easing: MOTION.iosDrawer,
          fill: 'both',
        },
      );
      sheetAnimationRef.current = enter;
      if (content !== null && canAnimate(content)) {
        contentAnimationRef.current = content.animate(
          [
            { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: MOTION.toastEnter,
            delay: MOTION.staggerStep * 2,
            easing: MOTION.easeOutSoft,
            fill: 'both',
          },
        );
      }

      void enter.finished
        .catch(() => undefined)
        .then(() => {
          if (!dialog.open || closingRef.current) return;
          cancelAnimations();
          dialog.dataset.motionPhase = 'settled';
        });
      return;
    }

    if (!open && dialog.open) requestClose();
  }, [cancelAnimations, motionDisabled, open, requestClose, triggerRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return undefined;
    const handleClose = () => {
      cancelAnimations();
      closingRef.current = false;
      delete dialog.dataset.motionPhase;
      onAfterClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
      cancelAnimations();
    };
  }, [cancelAnimations, onAfterClose, triggerRef]);

  const handleCancel = useCallback((event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    requestClose();
  }, [requestClose]);

  return { dialogRef, requestClose, handleCancel };
}
