/**
 * useAutoLocationRefresh — stille posisjons-oppdatering ved appåpning.
 *
 * Sivert (2026-07-08): «Jeg er på Steinkjer nå, men det står fortsatt
 * Elverum?» — appen hentet posisjon KUN én gang (onboarding, eller manuell
 * «Automatisk posisjon»-toggle i Innstillinger) og oppdaterte den aldri
 * igjen, selv om brukeren reiste. By/vær ble stående på forrige sted.
 *
 * Denne hooken kjører ETT GPS-oppslag (`getCurrentPosition`, ikke
 * `watchPosition` — ingen kontinuerlig sporing) hver gang appen åpnes eller
 * kommer i forgrunn igjen, MEN kun når `locationMode==='auto'` (brukeren har
 * eksplisitt slått på automatisk posisjon i Innstillinger). Helt stille:
 * ingen toast/dialog — kun konsoll-warn ved feil. Den eksplisitte
 * «slå på»-flyten i InnstillingerScreen (samtykke-dialog + toast) er
 * uendret og separat fra denne.
 *
 * Resume-mønsteret speiler `src/lib/premium/use-access.ts`:
 *  - native: @capacitor/app sin `appStateChange` (isActive)
 *  - web:    document.visibilitychange
 *
 * Rate-limitert til maks 1×/minutt for å unngå dobbel-fyring ved raske
 * resume-events (app-bytting frem og tilbake).
 */
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useChildren, type Child } from '../state/children-store';
import { useLocationPref } from '../state/location-pref-store';
import { reverseGeocode } from '../lib/geocode/nominatim';

const MIN_REFRESH_INTERVAL_MS = 60_000;

export function useAutoLocationRefresh(): void {
  const mode = useLocationPref((s) => s.mode);
  const { active, needsOnboarding, updateChild } = useChildren();
  const activeIdRef = useRef(active.id);
  const lastRunRef = useRef(0);

  // R3 (2026-07-14): ref-synk i effect (kjøres hver render) i stedet for
  // skriving under render. Konsumentene leser ref-en i async callbacks
  // (geolocation/geocode), som alltid fyrer etter effekten — ekvivalent.
  useEffect(() => {
    activeIdRef.current = active.id;
  });

  useEffect(() => {
    if (mode !== 'auto' || needsOnboarding) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const refresh = (): void => {
      const now = Date.now();
      if (now - lastRunRef.current < MIN_REFRESH_INTERVAL_MS) return;
      lastRunRef.current = now;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          const patch: Partial<Pick<Child, 'lat' | 'lon' | 'city'>> = { lat, lon };
          reverseGeocode(lat, lon)
            .then((rev) => {
              // Kun sett city hvis vi faktisk fikk et navn — aldri skriv
              // `city: undefined` inn i patch (updateChild spreader patch
              // rått, så en eksplisitt undefined-nøkkel ville slettet
              // eksisterende by-navn).
              if (rev?.city) patch.city = rev.city;
              updateChild(activeIdRef.current, patch);
            })
            .catch((err: unknown) => {
              console.warn('[Babyora] auto-location: reverseGeocode feilet — beholder by-navn', err);
              updateChild(activeIdRef.current, patch);
            });
        },
        (err: GeolocationPositionError) => {
          console.warn('[Babyora] auto-location: getCurrentPosition feilet', err);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
      );
    };

    refresh(); // appen åpnes/mountes

    let cleanup: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      const handlePromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) refresh();
      });
      cleanup = () => {
        handlePromise.then((h) => h.remove()).catch(() => { /* noop */ });
      };
    } else if (typeof document !== 'undefined') {
      const onVisible = (): void => {
        if (document.visibilityState === 'visible') refresh();
      };
      document.addEventListener('visibilitychange', onVisible);
      cleanup = () => document.removeEventListener('visibilitychange', onVisible);
    }

    return () => cleanup?.();
  }, [mode, needsOnboarding, updateChild]);
}
