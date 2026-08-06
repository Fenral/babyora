/**
 * P9.1 (2026-06-13): WidgetSnapshot — kontrakt v1.
 * Native spike (2026-08-06): kontrakt v2 — brief-felter.
 *
 * Eneste delte sannhet mellom hovedappen og iOS/Android-widgetene.
 * Se docs/widget-contract.md for full spec, og
 * docs/design-lab/spike/NATIVE-SPIKE.md for v2-utvidelsen.
 *
 * v2 er en REN UTVIDELSE: alle v1-felter beholdes uendret, og
 * v2-felterne er valgfrie. En v1-leser (eksisterende widget-stubber)
 * kan trygt ignorere dem; en v2-leser bruker expiresAtISO til å
 * degradere briefen VED utløpstidspunktet uten app-åpning.
 *
 * Utløpssemantikk speiler brief-maskinen
 * (docs/design-lab/lab/p3/brief-maskin.ts, Sols avvik e):
 * halvåpent intervall — briefen er utløpt når nå >= expiresAt.
 */

import type { Activity, Recommendation, WeatherInput } from '../wool-layers/types.js';
import { hideIntuitiveItems } from '../wool-layers/visibility.js';

export type ConditionKey =
  | 'clearsky'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'sleet'
  | 'fog'
  | 'thunder';

export type LayerBadgeBand = 'lett' | 'medium' | 'mye';

export interface WidgetSnapshot {
  v: 1 | 2;
  childName: string;
  updatedAtISO: string;
  tempC: number;
  feelsLikeC: number;
  conditionKey: ConditionKey;
  layerCount: number;
  layerBadgeBand: LayerBadgeBand;
  topGarments: string[];
  toppTilTaa: string[];
  activity: Activity;
  deepLink: string;
  /**
   * v2 (native spike): når briefen slutter å være autoritativ.
   * Halvåpent intervall — utløpt når nå >= expiresAtISO.
   * Mangler feltet er snapshotet en v1 uten utløp (degraderes aldri
   * av widgeten selv, kun av stale-heuristikken på updatedAtISO).
   */
  expiresAtISO?: string;
  /** v2: brief-versjon (nyere versjon vinner alltid — I1 i brief-maskinen). */
  versjon?: number;
  /** v2: stabil id — deep link blir babyora://brief/<briefId>. */
  briefId?: string;
  /** v2: én linje som uttrykker deltaet mot baseline («+1 ull-lag: −6° siden i går»). */
  deltaTekst?: string;
}

/** v2-felterne samlet — det widget-spiken trenger utover v1. */
export interface WidgetBriefFields {
  expiresAtISO: string;
  versjon: number;
  briefId: string;
  deltaTekst: string;
}

const HEAD_HANDS_NECK_RE = /(lue|votter|hals|balaklava|balaclava|hette|sokker)/i;

export function layerBadgeBandFor(layerCount: number): LayerBadgeBand {
  if (layerCount <= 1) return 'lett';
  if (layerCount <= 3) return 'medium';
  return 'mye';
}

export function conditionKeyFromSymbol(symbolCode: string | undefined): ConditionKey {
  if (!symbolCode) return 'cloudy';
  const c = symbolCode.toLowerCase();
  if (c.includes('thunder')) return 'thunder';
  if (c.includes('snow')) return 'snow';
  if (c.includes('sleet')) return 'sleet';
  if (c.includes('rain') || c.includes('drizzle')) return 'rain';
  if (c.includes('fog')) return 'fog';
  if (c.includes('clearsky')) return 'clearsky';
  if (c.includes('partlycloudy') || c.includes('fair')) return 'partly-cloudy';
  return 'cloudy';
}

/**
 * Bygg WidgetSnapshot fra app-state. Bruker maks 3 plagg + skiller
 * topp-til-tå (lue/votter/hals/sokker) fra topGarments slik at
 * widget-radene er like (kropp / hode-hender-hals).
 */
export function buildSnapshot(input: {
  childName: string;
  weather: WeatherInput;
  rec: Recommendation;
  activity: Activity;
  nowISO: string;
}): WidgetSnapshot {
  const { childName, weather, rec, activity, nowISO } = input;
  const allItems = hideIntuitiveItems(rec.layers.flatMap((l) => l.items));
  const headHands = allItems.filter((i) => HEAD_HANDS_NECK_RE.test(i)).slice(0, 2);
  const topGarments = allItems
    .filter((i) => !HEAD_HANDS_NECK_RE.test(i))
    .slice(0, 3);
  const layerCount = rec.layers.reduce(
    (sum, l) => sum + (hideIntuitiveItems(l.items).length > 0 ? 1 : 0),
    0,
  );

  return {
    v: 1,
    childName,
    updatedAtISO: nowISO,
    tempC: Math.round(weather.tempC),
    feelsLikeC: Math.round(weather.feelsLikeC),
    conditionKey: conditionKeyFromSymbol(weather.symbolCode),
    layerCount,
    layerBadgeBand: layerBadgeBandFor(layerCount),
    topGarments,
    toppTilTaa: headHands,
    activity,
    deepLink: 'babyora://hjem',
  };
}

/**
 * Løft et v1-snapshot til v2 med brief-felter (native spike).
 * Endrer ikke v1-felterne bortsett fra deepLink, som pekes på briefen
 * slik at widget-trykk lander i riktig kontekst.
 */
export function withBriefFields(
  snapshot: WidgetSnapshot,
  brief: WidgetBriefFields,
): WidgetSnapshot {
  return {
    ...snapshot,
    v: 2,
    expiresAtISO: brief.expiresAtISO,
    versjon: brief.versjon,
    briefId: brief.briefId,
    deltaTekst: brief.deltaTekst,
    deepLink: `babyora://brief/${brief.briefId}`,
  };
}

/**
 * Er snapshotets brief utløpt? Halvåpent intervall (Sols avvik e,
 * speiler brief-maskinens erUtlopt): utløpt når nå >= expiresAt.
 * v1-snapshot (uten expiresAtISO) har ingen utløpstilstand → false.
 */
export function erSnapshotUtlopt(snapshot: WidgetSnapshot, nowISO: string): boolean {
  if (snapshot.expiresAtISO === undefined) return false;
  return Date.parse(nowISO) >= Date.parse(snapshot.expiresAtISO);
}
