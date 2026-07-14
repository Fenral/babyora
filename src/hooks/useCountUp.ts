/**
 * useCountUp — interpoler en tall-verdi over 200ms ease-out-quart.
 *
 * Brukes på vær-temp, feels-like, layerCount, trial-dager — tall som
 * endrer seg over data-fetches eller state-bytter.
 *
 * A11y per accessibility-lead (2026-06-14):
 *  - Respekterer prefers-reduced-motion: reduce → snap instant
 *  - Ingen aria-live anvendes — temp-display er stille (200ms-frame-spam ville være støy)
 */
import { useEffect, useRef, useState } from 'react';

export type UseCountUpOptions = {
  /** Animasjons-varighet i ms. Default 200. */
  duration?: number;
  /** Antall desimaler å avrunde til. Default 0. */
  decimals?: number;
};

/** Ease-out-quart kurve — eksportert for testbarhet. */
export function easeOutQuart(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 4);
}

/** Interpoler fra->to via ease-out-quart, avrund til decimals. */
export function interpolate(from: number, to: number, t: number, decimals = 0): number {
  const raw = from + (to - from) * easeOutQuart(t);
  if (decimals === 0) return Math.round(raw);
  const m = Math.pow(10, decimals);
  return Math.round(raw * m) / m;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { duration = 200, decimals = 0 } = options;
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const targetRef = useRef(target);

  useEffect(() => {
    if (target === targetRef.current && target === value) return;

    if (prefersReducedMotion()) {
      fromRef.current = target;
      targetRef.current = target;
      // R3 (2026-07-14): snap i rAF-callback (asynkront) i stedet for sync
      // setState i effect-kroppen. Fortsatt «instant» for RM-brukere
      // (én frame, ingen animasjon).
      const rmRaf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(rmRaf);
    }

    fromRef.current = value;
    targetRef.current = target;
    const start = performance.now();
    const localTarget = target;
    let raf = 0;
    const tick = (now: number) => {
      // Race-protection: hvis target har endret seg under animasjonen (ny
      // useEffect-runde har startet), avbryt denne ticken. cleanup-funksjonen
      // kansellerer raf separat — denne sjekken er belt-and-suspenders.
      if (targetRef.current !== localTarget) return;
      const t = Math.min(1, (now - start) / duration);
      setValue(interpolate(fromRef.current, localTarget, t, decimals));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return value;
}
