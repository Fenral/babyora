/**
 * useFocusTrap — gjenbrukbar focus-trap-pattern for modale overlays.
 *
 * Brukes av OutfitSheet, LayerDetailPage, DayDetailPage. Tidligere var
 * denne logikken duplisert ~30 linjer × 3 i hver komponent (per design-
 * taste-frontend-skill finding).
 *
 * A11y-kontrakt (per accessibility-lead-spec):
 * - Fanger Tab/Shift+Tab innenfor containeren
 * - Auto-fokus første button ved aktivering
 * - Returnerer fokus til forrige aktive element ved deaktivering
 * - ESC trigger onClose
 *
 * Forutsetning: containeren har minst én focusable element (ellers no-op).
 */
import { useCallback, useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [containerRef, onClose],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstButton = containerRef.current?.querySelector<HTMLElement>('button');
    firstButton?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [containerRef, handleKeyDown]);
}
