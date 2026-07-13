/**
 * Hjem-summary — drevet av motor-output, ALDRI hardkodet.
 *
 * P0.1 fra Fable 5 review (2026-06-12): den gamle `tipFor(score)` i
 * HomeScreen returnerte fastsatte strenger som «Ull + fleece + yttertøy.
 * Vinden biter litt.» uavhengig av faktisk anbefaling. Den løy ofte.
 *
 * Denne modulen produserer en sannferdig oppsummering avledet av:
 *  - `Recommendation.layers` (innerst/mellomlag/yttertøy/ekstra)
 *  - `WeatherInput` (vind, nedbør, føles-temp vs faktisk temp)
 *  - `Activity` (vogn, bæresele, utelek, søvn)
 *
 * Reglene følger «Stillhet er bedre enn fyll» — setning 2 kommer KUN
 * hvis det er noe sant å si.
 */

import type { Activity, Recommendation, WeatherInput } from './wool-layers/types.js';

/** Resultat fra buildSummary. */
export interface Summary {
  /** Setning 1: hva barnet har på. Alltid sannferdig mht. layers. */
  layers: string;
  /** Setning 2 (valgfri): én værkommentar når den er sann. */
  weather?: string;
}

/** Returnerer hele oppsummeringen som streng ("X. Y."). */
export function summaryToString(s: Summary): string {
  if (!s.weather) return s.layers;
  return `${s.layers} ${s.weather}`;
}

const CAPITALIZE = (s: string): string =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);

function firstItem(items: string[]): string | undefined {
  const trimmed = items[0]?.split(',')[0]?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Setning 1: beskriv lagene basert på faktiske kategorier.
 *
 * P0.1-blocker fix (Fable 5, 2026-06-12): ALLE kategorier med items skal
 * være representert i teksten. Tidligere utelot vi `ekstra` i sover-i-
 * vogn-caset (screenshot: «Langermet body og pyjamas.» manglet
 * sovepose+ullsokker).
 *
 * Regel:
 * - Bygg en base-setning (innerst/mellomlag/yttertoy/sovepose-special).
 * - Hvis `ekstra` finnes og ikke allerede er nevnt: legg til
 *   «, pluss {ekstra}.» (utenom søvn der ekstra sjelden er meningsfull).
 * - Hvis `mellomlag` ble droppet av base-greinen men finnes: dobbeltsjekk
 *   ved fallback.
 */
function describeLayers(rec: Recommendation, activity: Activity): string {
  const fill = (cat: string): string | undefined => {
    const layer = rec.layers.find((l) => l.category === cat);
    return layer ? firstItem(layer.items) : undefined;
  };

  const innerst = fill('innerst');
  const mellomlag = fill('mellomlag');
  const yttertoy = fill('yttertoy');
  const ekstra = fill('ekstra');

  const soveposeYtter = yttertoy?.toLowerCase().includes('sovepose');
  const soveposeInnerst = innerst?.toLowerCase().includes('sovepose');

  let base: string | null = null;

  if (activity === 'soevn' && (soveposeYtter || soveposeInnerst)) {
    const pose = soveposeYtter ? yttertoy : innerst;
    // P0.1-blocker: nevn BÅDE innerst og mellomlag hvis begge er fylt
    const layeredInner = soveposeInnerst
      ? [mellomlag].filter(Boolean)
      : [innerst, mellomlag].filter(Boolean);
    if (layeredInner.length === 0) {
      base = CAPITALIZE(pose ?? 'sovepose');
    } else if (layeredInner.length === 1) {
      base = `${CAPITALIZE(layeredInner[0]!)} med ${pose?.toLowerCase()} over`;
    } else {
      base = `${CAPITALIZE(layeredInner[0]!)} og ${layeredInner[1]!.toLowerCase()} med ${pose?.toLowerCase()} over`;
    }
  } else if (soveposeYtter) {
    // Vogn-sover: nevn innerst + mellomlag, så sovepose «over»
    const layeredInner = [innerst, mellomlag].filter(Boolean);
    if (layeredInner.length === 0) {
      base = CAPITALIZE(yttertoy ?? 'sovepose');
    } else if (layeredInner.length === 1) {
      base = `${CAPITALIZE(layeredInner[0]!)} med ${yttertoy?.toLowerCase()} over`;
    } else {
      base = `${CAPITALIZE(layeredInner[0]!)} og ${layeredInner[1]!.toLowerCase()} med ${yttertoy?.toLowerCase()} over`;
    }
  } else if (innerst && yttertoy && mellomlag) {
    base = `${CAPITALIZE(innerst)}, ${mellomlag.toLowerCase()} og ${yttertoy.toLowerCase()} ytterst`;
  } else if (innerst && yttertoy) {
    base = `${CAPITALIZE(innerst)} innerst, ${yttertoy.toLowerCase()} ytterst`;
  } else if (innerst && mellomlag) {
    base = `${CAPITALIZE(innerst)} og ${mellomlag.toLowerCase()}`;
  } else if (innerst) {
    base = `Bare ${innerst.toLowerCase()}`;
  } else if (yttertoy) {
    base = CAPITALIZE(yttertoy);
  } else if (mellomlag) {
    base = CAPITALIZE(mellomlag);
  }

  // Bare ekstra (sjelden — typisk hvis motoren bommer)
  if (!base) {
    if (ekstra) return `${CAPITALIZE(ekstra)}.`;
    return rec.summary || 'Ingen anbefaling.';
  }

  // Legg til ekstra hvis det ikke allerede er nevnt i base.
  // Utelat ved søvn (ekstra sjelden meningsfull innendørs).
  if (ekstra && !base.toLowerCase().includes(ekstra.toLowerCase()) && activity !== 'soevn') {
    return `${base}, pluss ${ekstra.toLowerCase()}.`;
  }

  return `${base}.`;
}

/**
 * Setning 2 (valgfri): én værkommentar, kun når sann.
 */
function describeWeather(weather: WeatherInput, activity: Activity): string | undefined {
  // Innendørs (søvn) → ingen ute-vær-kommentar
  if (activity === 'soevn') return undefined;

  // Vind biter ved ≥ 6 m/s
  if (weather.windMs >= 6) {
    return 'Vinden biter — husk å dekke til.';
  }

  // Nedbør > 0,2 mm/t
  if (weather.precipMmH > 0.2) {
    const sym = (weather.symbolCode ?? '').toLowerCase();
    if (sym.includes('snow') || sym.includes('snø')) {
      return 'Det snør — yttertøy beskytter mot fukt.';
    }
    if (sym.includes('sleet') || sym.includes('sludd')) {
      return 'Sludd i lufta — hold yttertøyet vanntett.';
    }
    return 'Det regner — sørg for vanntett yttertøy.';
  }

  // Føles-temp avvik ≥ 3° fra faktisk temp
  const delta = weather.tempC - weather.feelsLikeC;
  if (Math.abs(delta) >= 3) {
    const sign = weather.feelsLikeC < 0 ? '−' : '';
    const abs = Math.round(Math.abs(weather.feelsLikeC));
    return `Det føles som ${sign}${abs}°.`;
  }

  return undefined;
}

/**
 * Hovedfunksjon — bygg en sannferdig oppsummering av antrekk + vær.
 *
 * @param rec        Recommendation fra wool-layers
 * @param weather    Værinput motoren brukte
 * @param activity   Aktiviteten anbefalingen gjelder for
 */
export function buildSummary(
  rec: Recommendation,
  weather: WeatherInput,
  activity: Activity,
): Summary {
  return {
    layers: describeLayers(rec, activity),
    weather: describeWeather(weather, activity),
  };
}
