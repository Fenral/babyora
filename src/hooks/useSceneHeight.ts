/**
 * useSceneHeight — hvor langt en side skal skyves ved et sideskift.
 *
 * BAKGRUNN, MÅLT 2026-08-05. Første forsøk brukte `y: '100%'`. Prosenter i
 * `transform` regnes av ELEMENTETS EGEN høyde, ikke av skjermen. Sidene her
 * er innholdshøye: Soveguiden måler 2348 px. Den ble altså skjøvet 2348 px
 * på 340 ms, mens en kort side ble skjøvet kanskje 900.
 *
 * Det er ikke «litt feil avstand» — det er ULIK FART på hver skjerm, styrt
 * av hvor mye tekst siden tilfeldigvis har. En overgang som endrer karakter
 * med innholdet er ingen grammatikk.
 *
 * Scenen er den SYNLIGE flaten (`main`), ikke siden. Den måles med en
 * ResizeObserver fordi høyden endrer seg i praksis: tastaturet åpner seg,
 * telefonen roteres, adresselinjen i Safari trekker seg sammen.
 */
import { useEffect, useState, type RefObject } from 'react';

export function useSceneHeight(ref: RefObject<HTMLElement | null>): number {
  const [høyde, settHøyde] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    /* Synkron førstemåling: uten den er høyden 0 i akkurat den renderen der
       en overgang kan starte, og da skyves siden ingen steder. */
    settHøyde(Math.round(el.clientHeight));

    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => settHøyde(Math.round(el.clientHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return høyde;
}
