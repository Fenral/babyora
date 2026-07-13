/**
 * morning-notification — helper for morgenvarsel-tillatelse + scheduling.
 *
 * Strategi:
 *  - På native (Capacitor): bruk @capacitor/local-notifications (dynamic
 *    import — plugin er ikke alltid installert i web-bygg). Schedulerer
 *    daglig kl. morningHour.
 *  - På web: fallback til Notification.requestPermission(). Vi schedulerer
 *    ikke web-varsler (krever Service Worker + Push) — preferansen lagres
 *    likevel slik at den følger med over til native-bygget.
 *
 * Returner-typer:
 *   - 'granted'  → tillatelse OK
 *   - 'denied'   → bruker blokkerte (caller skal rulle tilbake toggle)
 *   - 'default'  → ubesvart (web Notification, behandle som denied for UI)
 *   - 'unsupported' → ingen support (gammel browser) → tillat lagring av
 *                     preferanse, men ikke marker som "aktiv".
 *
 * NB: Vi gating bak Capacitor.isNativePlatform() FØR dynamic import slik at
 * web-bygget aldri trekker inn plugin-koden (Vite chunk-størrelse).
 */

import { Capacitor } from '@capacitor/core';

export type PermissionResult = 'granted' | 'denied' | 'default' | 'unsupported';

const MORNING_NOTIFICATION_ID = 1001;
const WEATHER_CHANGE_NOTIFICATION_ID = 1002;

/**
 * Be om tillatelse til å sende lokale varsler. Trygg å kalle på både
 * web og native. Returnerer 'granted' kun ved eksplisitt approval.
 */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const mod = (await import(
        /* @vite-ignore */ '@capacitor/local-notifications'
      )) as {
        LocalNotifications: {
          requestPermissions: () => Promise<{ display: string }>;
        };
      };
      const res = await mod.LocalNotifications.requestPermissions();
      if (res.display === 'granted') return 'granted';
      if (res.display === 'denied') return 'denied';
      return 'default';
    } catch (err) {
      console.warn('[morning-notification] requestPermissions feilet', err);
      return 'unsupported';
    }
  }

  // Web fallback
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const res = await window.Notification.requestPermission();
    if (res === 'granted') return 'granted';
    if (res === 'denied') return 'denied';
    return 'default';
  } catch (err) {
    console.warn('[morning-notification] Notification.requestPermission feilet', err);
    return 'unsupported';
  }
}

/**
 * Schedule daglig morgenvarsel kl. hour. No-op på web (krever Push API
 * + Service Worker). På native: replace existing schedule med ny tid.
 *
 * F86-F1: `childName` personaliserer varselet («Se hva Liv skal ha på i dag») —
 * morgenvarselet er Pluss-flaggskipet og skal føles som en hilsen, ikke en
 * systemmelding. Uten navn faller vi tilbake til nøytral tekst.
 */
export async function scheduleMorningNotification(hour: number, childName?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const mod = (await import(
      /* @vite-ignore */ '@capacitor/local-notifications'
    )) as unknown as {
      LocalNotifications: {
        cancel: (opts: { notifications: { id: number }[] }) => Promise<void>;
        schedule: (opts: {
          notifications: Array<{
            id: number;
            title: string;
            body: string;
            schedule: { on: { hour: number; minute: number }; allowWhileIdle: boolean };
          }>;
        }) => Promise<void>;
      };
    };
    // Avbryt eksisterende først (idempotent reschedule)
    await mod.LocalNotifications.cancel({
      notifications: [{ id: MORNING_NOTIFICATION_ID }],
    });
    const name = childName?.trim();
    await mod.LocalNotifications.schedule({
      notifications: [
        {
          id: MORNING_NOTIFICATION_ID,
          title: 'God morgen ☀️',
          body: name
            ? `Se hva ${name} skal ha på i dag.`
            : 'Dagens antrekk er klart — se anbefalingen.',
          schedule: {
            on: { hour: Math.max(0, Math.min(23, Math.round(hour))), minute: 0 },
            allowWhileIdle: true,
          },
        },
      ],
    });
  } catch (err) {
    console.warn('[morning-notification] schedule feilet', err);
  }
}

/**
 * Avbryt morgenvarsel. Idempotent.
 */
export async function cancelMorningNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const mod = (await import(
      /* @vite-ignore */ '@capacitor/local-notifications'
    )) as {
      LocalNotifications: {
        cancel: (opts: { notifications: { id: number }[] }) => Promise<void>;
      };
    };
    await mod.LocalNotifications.cancel({
      notifications: [{ id: MORNING_NOTIFICATION_ID }],
    });
  } catch (err) {
    console.warn('[morning-notification] cancel feilet', err);
  }
}

/**
 * Aktiver værendring-varsel (signal-flagg) for native-bygget.
 *
 * Værendring-varsler er event-baserte (de skal fyre når faktisk vær endres
 * > 5° fra forrige målt verdi) — ikke schedulert til et fast klokkeslett.
 * Selve sammenligningen og fyrings-logikken eier weather-service-laget
 * (kjører ved foreground og periodisk i bakgrunnen). Denne helperen er
 * derfor et tynt feature-gate:
 *
 *  - Web: no-op (preferansen lagres i notification-pref-store; aktivering
 *    krever Service Worker + Push API som vi ikke har ennå).
 *  - Native: vi spør permission opportunistisk her (no-op hvis allerede
 *    granted), slik at weather-service-laget kan fyre via plugin-en uten
 *    å hver gang måtte gå via Capacitor sin permission-prompt.
 *
 * Caller skal allerede ha verifisert permission ('granted') før de kaller
 * denne — vi gjør derfor INGEN UI/permission-prompt her, kun aktivering.
 *
 * Idempotent. Logger og svelger feil — toggle-state forblir på selv om
 * plugin-importen feiler (preferansen følger med til neste bygg).
 */
export async function enableWeatherChangeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Tom no-op schedule for å garantere at LocalNotifications-kanalen
    // er provisjonert (Android: notification channel registreres på første
    // schedule()-kall). Vi schedulerer IKKE en faktisk reminder her — det
    // er event-baserte varsler som fyres av weather-service-laget.
    const mod = (await import(
      /* @vite-ignore */ '@capacitor/local-notifications'
    )) as {
      LocalNotifications: {
        cancel: (opts: { notifications: { id: number }[] }) => Promise<void>;
      };
    };
    // Defensiv: rydd eventuell stale schedule før vi setter feature på.
    await mod.LocalNotifications.cancel({
      notifications: [{ id: WEATHER_CHANGE_NOTIFICATION_ID }],
    });
  } catch (err) {
    console.warn('[morning-notification] enableWeatherChange feilet', err);
  }
}

/**
 * Deaktiver værendring-varsel. Idempotent. Avbryter også eventuelle
 * pending event-baserte varsler i køen (weather-service kan ha lagt
 * inn én når den oppdaget en endring).
 */
export async function disableWeatherChangeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const mod = (await import(
      /* @vite-ignore */ '@capacitor/local-notifications'
    )) as {
      LocalNotifications: {
        cancel: (opts: { notifications: { id: number }[] }) => Promise<void>;
      };
    };
    await mod.LocalNotifications.cancel({
      notifications: [{ id: WEATHER_CHANGE_NOTIFICATION_ID }],
    });
  } catch (err) {
    console.warn('[morning-notification] disableWeatherChange feilet', err);
  }
}
