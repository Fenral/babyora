/**
 * P9.1 (2026-06-13): WidgetSnapshot — kontrakt v1.
 *
 * Eneste delte sannhet mellom hovedappen og iOS/Android-widgetene.
 * Se docs/widget-contract.md for full spec.
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
  v: 1;
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
