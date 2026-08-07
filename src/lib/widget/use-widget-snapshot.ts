/**
 * use-widget-snapshot — DATAKILDEN til hjem-skjerm-widgeten.
 *
 * Bakgrunn (funn 2026-08-06): all plumbing for widgeten fantes og var testet
 * (`buildSnapshot` i snapshot.ts, `pushWidgetSnapshot` + `shouldPushSnapshot`
 * i bridge.ts), men KALLSTEDET manglet. `pushWidgetSnapshot` ble kun kalt fra
 * widget-spike-panelet, som er slettet, og `shouldPushSnapshot` hadde null
 * kallere. Uten denne fila ville iOS-widgeten (ios/App/BabyoraWidget/) vist
 * tomtilstanden «Åpne Babyora for dagens antrekk» for alltid.
 *
 * Denne fila legger til NØYAKTIG det som manglet — koblingen — og ingenting
 * annet: ingen ny kontrakt, ingen ny transport, ingen endring i snapshot.ts
 * eller bridge.ts.
 *
 * Kontrakt for kallstedet (HjemScreen):
 *  - Widgeten mates FØRST når appen har BÅDE vær og en ferdig anbefaling.
 *    Mangler én av dem er hooken en ren no-op (widgeten beholder forrige
 *    snapshot heller enn å få et halvt et).
 *  - Sendingen strupes i to ledd: innholdsnøkkelen under styrer hvor ofte
 *    effekten i det hele tatt kjører (aldri per render), og
 *    `shouldPushSnapshot` har siste ord om det faktisk skal ut på broen
 *    (60-minutters ferskhet + innholdsdiff, jf. docs/widget-contract.md).
 *  - Utenfor native er `pushWidgetSnapshot` allerede en no-op
 *    (Capacitor-vakten i bridge.ts:65 — verifisert, ikke antatt): den
 *    skriver kun den lokale ferskhetsmarkøren og returnerer false uten å
 *    røre pluginet.
 *  - Ingenting her får kaste. Feiler noe, faller vi stille tilbake til at
 *    widgeten viser forrige snapshot. En død widget er en skjønnhetsfeil;
 *    en render-loop som kaster er en krasj.
 */

import { useEffect, useRef } from 'react';
import type { Activity, Recommendation, WeatherInput } from '../wool-layers/types.js';
import { buildSnapshot } from './snapshot.js';
import { pushWidgetSnapshot, shouldPushSnapshot } from './bridge.js';

/** Alt widget-snapshotet trenger fra Hjem. `null` = ikke klar ennå. */
export type WidgetSnapshotKilde = Readonly<{
  childName: string;
  /** Motorens værinput (samme objekt Hjem allerede gir `recommend`). */
  weather: WeatherInput | null;
  /** Den swap-finaliserte anbefalingen — aldri en rå/uferdig en. */
  rec: Recommendation | null;
  activity: Activity;
}>;

/** Hva ett forsøk på å mate widgeten endte med. */
export type WidgetSendResultat = 'sendt' | 'uendret' | 'mangler-data' | 'feilet';

/**
 * Innholdsnøkkel: en streng som endrer seg HVIS OG BARE HVIS noe
 * `buildSnapshot` faktisk leser har endret seg. Den er effektens eneste
 * avhengighet, og er grunnen til at hooken ikke fyrer ved hver render —
 * gjenrender med samme vær og samme anbefaling gir identisk nøkkel.
 *
 * `null` betyr «ikke klar»: vær eller anbefaling mangler.
 */
export function widgetInnholdsnokkel(kilde: WidgetSnapshotKilde): string | null {
  const { childName, weather, rec, activity } = kilde;
  if (weather === null || rec === null) return null;
  return JSON.stringify([
    childName,
    activity,
    // Snapshotet runder temperaturene, så nøkkelen må runde likt: 4,1 → 4,3
    // er ikke en widget-endring.
    Math.round(weather.tempC),
    Math.round(weather.feelsLikeC),
    weather.symbolCode ?? '',
    rec.layers.map((lag) => [lag.category, lag.items]),
  ]);
}

/**
 * Bygg og send ett snapshot, strupet gjennom `shouldPushSnapshot`.
 * Kaster aldri — alle feil blir `'feilet'`.
 *
 * Eksportert (ikke privat) fordi dette er selve mekanismen, og en hook som
 * kjører effekter kan ikke observeres i dette oppsettet (repoet har ingen
 * jsdom; tester bruker renderToStaticMarkup, som aldri kjører effekter).
 */
export async function sendWidgetSnapshotHvisEndret(
  kilde: WidgetSnapshotKilde,
  nowMs: number,
): Promise<WidgetSendResultat> {
  try {
    const { childName, weather, rec, activity } = kilde;
    if (weather === null || rec === null) return 'mangler-data';
    const snapshot = buildSnapshot({
      childName,
      weather,
      rec,
      activity,
      nowISO: new Date(nowMs).toISOString(),
    });
    if (!shouldPushSnapshot(snapshot, nowMs)) return 'uendret';
    await pushWidgetSnapshot(snapshot, nowMs);
    return 'sendt';
  } catch {
    // Broen svelger sine egne feil; dette fanger resten (f.eks. en
    // uventet anbefalingsform). Widgeten beholder forrige snapshot.
    return 'feilet';
  }
}

/**
 * Monteres av HjemScreen. Rendrer ingenting og returnerer ingenting — den
 * eneste jobben er å holde widgeten i takt med det Hjem viser.
 */
export function useWidgetSnapshot(kilde: WidgetSnapshotKilde): void {
  const nokkel = widgetInnholdsnokkel(kilde);
  // Kilden leses via ref slik at effekten kan avhenge av nøkkelen ALENE.
  // Uten dette ville et nytt (men innholdslikt) vær-objekt fra useWeather
  // dratt med seg en ny effektkjøring.
  const kildeRef = useRef(kilde);
  // Tilordningen skjer i en effekt, ikke under render: React (og
  // react-hooks-regelen «Cannot access refs during render») forbyr å skrive
  // til en ref mens komponenten rendrer. Effekter kjører i deklarasjons-
  // rekkefølge, så denne er ferdig før sende-effekten under leser ref-en.
  useEffect(() => {
    kildeRef.current = kilde;
  });

  useEffect(() => {
    if (nokkel === null) return;
    void sendWidgetSnapshotHvisEndret(kildeRef.current, Date.now());
  }, [nokkel]);
}
