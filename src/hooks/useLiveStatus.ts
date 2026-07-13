import { useEffect, useRef, useState } from 'react';

/**
 * Hook for debounced sr-only live-status-melding.
 *
 * Bruk: pakk dette inn i en `<div role="status" aria-live="polite" className="sr-only">`
 * og oppdater message via `setMessage()`. Den faktiske live-region-strengen oppdateres
 * etter `delay` ms (default 250) for å unngå spam når slidere dras.
 *
 * Ref: a11y-spec del C — "Live output uten skjermleser-spam".
 */
export function useLiveStatus(delay = 250) {
  const [announcement, setAnnouncement] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMessage = (msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(msg);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { announcement, setMessage };
}
