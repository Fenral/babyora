/**
 * AppRate-wrapper for Babyora.
 *
 * Trigger native StoreKit (iOS) eller Google Play in-app review (Android)
 * når brukeren MANUELT velger "Vurder Babyora" fra Innstillinger → Om & støtte.
 *
 * Vi bruker `@capacitor-community/in-app-review` når den finnes — via dynamisk
 * import slik at det IKKE er en hard avhengighet før plugin-en er installert
 * og lagt til i `Info.plist` / `MainActivity`. Når plugin-en ikke er der eller
 * vi kjører på web, faller vi tilbake til å åpne App Store / Play Store-siden
 * direkte (eller `mailto:` på web).
 *
 * Viktig fra memory `feedback_app_store_rating_threshold`:
 * Ikke vis automatisk prompt før appen har ≥50 anmeldelser. Dette modulet
 * brukes derfor BARE som en MANUELL inngang fra Innstillinger, ikke som en
 * auto-trigger fra dagens-skjermen.
 *
 * StoreKit har dessuten et hardt rate-limit på 3 prompts per 365 dager — så
 * selv om vi kaller `requestReview()` manuelt, kan Apple selv stille av prompten
 * uten å fortelle oss det. Da er Store-fallback nyttig.
 */

import { Capacitor } from '@capacitor/core';

const APP_STORE_ID = '6738474632'; // TODO: bytt ut når Babyora-appen er publisert
const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
const PLAY_STORE_PACKAGE = 'no.babyora.app';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

export type AppRateResult =
  | 'native-prompt-shown'
  | 'fallback-store-opened'
  | 'fallback-web-opened'
  | 'error';

/**
 * Be om native in-app review (StoreKit / Play in-app review) hvis tilgjengelig.
 * Faller tilbake til å åpne Store-siden i ekstern nettleser ellers.
 *
 * Returnerer hva som faktisk skjedde — caller kan bruke dette til å vise toast.
 */
export async function requestAppReview(): Promise<AppRateResult> {
  const platform = Capacitor.getPlatform();

  // Native: prøv @capacitor-community/in-app-review hvis installert
  if (Capacitor.isNativePlatform()) {
    try {
      // Dynamisk import — kaster hvis plugin-en ikke er installert. Det er
      // ok: vi faller tilbake til Store-URL under.
      const mod = await import(
        /* @vite-ignore */ '@capacitor-community/in-app-review'
      ).catch(() => null);

      const InAppReview = (mod as { InAppReview?: { requestReview: () => Promise<unknown> } } | null)
        ?.InAppReview;

      if (InAppReview && typeof InAppReview.requestReview === 'function') {
        await InAppReview.requestReview();
        return 'native-prompt-shown';
      }
    } catch (err) {
      console.warn('[Babyora] in-app review feilet, faller tilbake til Store', err);
    }

    // Fallback: åpne Store-siden i ekstern nettleser
    const storeUrl = platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    if (typeof window !== 'undefined') {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
      return 'fallback-store-opened';
    }
    return 'error';
  }

  // Web: åpne App Store-URL i ny fane (mest sannsynlig dev/preview)
  if (typeof window !== 'undefined') {
    window.open(APP_STORE_URL, '_blank', 'noopener,noreferrer');
    return 'fallback-web-opened';
  }
  return 'error';
}
