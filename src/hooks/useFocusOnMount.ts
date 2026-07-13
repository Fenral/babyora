import { useEffect, type RefObject } from 'react';

/**
 * Programmatic focus-on-mount for screen heading.
 *
 * F28-final v2: Bottom-nav-bytte og guide-target-bytte trigger ikke SR-
 * annonsering av ny side per default. Vi flytter focus til h1 (tabIndex={-1})
 * etter mount så SR sier sidens tittel ved navigasjon.
 *
 * Bruker setTimeout(0) for å gi React tid til å committe DOM før focus.
 */
export function useFocusOnMount(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [ref]);
}
