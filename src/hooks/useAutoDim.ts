import { useEffect } from 'react';

/**
 * Auto-dim 21:00–07:00 norsk tid via token-override på <html>.
 * Mitigerer "vekker baby"-risiko uten dark mode (utsatt til v1.1).
 *
 * Bruker token-override (--color-* overstyres i html[data-dim='true']) istedenfor
 * filter: brightness() — fordi filter senker aksent-kontrast under WCAG AA.
 * Lytter også på visibilitychange så appen oppdateres umiddelbart når man åpner
 * den kl 06:30 (uten å vente på 60s-interval).
 */
export function useAutoDim(): void {
  useEffect(() => {
    function update() {
      const hour = new Date().getHours();
      const dim = hour >= 21 || hour < 7;
      document.documentElement.dataset.dim = dim ? 'true' : 'false';
    }
    update();
    const interval = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
}
