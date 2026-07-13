import type { Activity, WeatherInput } from './wool-layers/types.js';

/**
 * Kort, kontekstuelt værtips til forsiden.
 *
 * Returnerer ett (maks to-konditionalt) safety-/påkledningstips basert på
 * dagens vær + aktivitet. Returnerer null hvis ingen condition matcher —
 * da skjules elementet helt (mindre støy).
 *
 * Prioriteringen er safety > komfort:
 * 1. Vind + frost (alvorlig kombinert risiko)
 * 2. Regn (våt-leak risiko)
 * 3. Frost uten vind (kalde fingre/tær)
 * 4. Sterk vind isolert
 * 5. Sol + varmt (UV / hettemøte)
 * 6. Lett yr (komfort)
 *
 * Søvn-modus (activity='soevn') bruker romtemperatur — derfor egen
 * subset av tips (kun romtemp-relevante).
 */
export function weatherTip(weather: WeatherInput, activity: Activity): string | null {
  const { feelsLikeC, tempC, windMs, precipMmH, symbolCode } = weather;

  // Søvn: helt egen tip-kontekst (romtemperatur)
  if (activity === 'soevn') {
    if (tempC < 16) return 'Lavere romtemperatur — sjekk at nakken og hendene er svale, ikke kalde.';
    if (tempC > 22) return 'Høyere romtemperatur — sjekk at nakken er sval, ikke svett.';
    return 'Kjenn på nakken etter 10 minutter — den skal være sval, ikke kald og ikke svett.';
  }

  // Ute-aktiviteter: rangert etter alvor
  const isCold = feelsLikeC <= 0;
  const isFrost = feelsLikeC <= -5;
  const isWindy = windMs >= 5;
  const isStrongWind = windMs >= 8;
  const isRaining = precipMmH >= 0.3;
  const isLightDrizzle = precipMmH >= 0.1 && precipMmH < 0.3;
  const isSunny = !!symbolCode && /clear|sun/i.test(symbolCode);
  const isWarm = tempC >= 20;

  // 1. Vind + frost — mest farlig kombo
  if (isFrost && isWindy) {
    return 'Vinden gjør kulda farligere — sjekk fingrene og kinnene ofte, hold hetten tett.';
  }

  // 2. Regn — våtleak-risiko
  if (isRaining) {
    return 'Regn — sjekk at regnskall eller varmepose sitter tett rundt halsen og håndleddene.';
  }

  // 3. Frost uten vind
  if (isCold) {
    return 'Kalde fingre er første tegn — kjenn på dem hvert 15. minutt mens dere er ute.';
  }

  // 4. Sterk vind isolert (uten frost)
  if (isStrongWind) {
    return 'Frisk vind — hetten må sitte trekkfri, ellers blir det fort kjølig.';
  }

  // 5. Sol + varmt
  if (isSunny && isWarm) {
    return 'Sol og varmt — husk solhatt og dekke i nakken; sjekk om babyen blir for varm.';
  }

  // 6. Lett yr — komfort
  if (isLightDrizzle) {
    return 'Lett yr — vannavvisende ytterlag holder lengst, så slipper dere å snu midt i tur.';
  }

  // F8 2026-06-15: alltid returner noe (Sivert: Skål skal alltid vises).
  // Mild dag: generisk komfort-statement.
  if (feelsLikeC >= 18) return 'Komfortabel temperatur — sjekk at barnet ikke blir for varmt ved direkte sol.';
  if (feelsLikeC >= 10) return 'Behagelig overgangsvær — ett lag mer enn deg selv.';
  return 'Sjekk nakken etter 10 minutter ute — den skal være sval, ikke kald.';
}

/**
 * Kort eyebrow-tag for vær-tip-skålen (F7, 2026-06-15).
 *
 * Returnerer et 1-2 ords situasjons-uttrykk som overskrift på vær-tipet.
 * Aldri null — selv mildt vær får en tag. Brukes som småtekst-eyebrow
 * (uppercase, letterspacing) over selve tip-teksten.
 */
export function weatherEyebrow(weather: WeatherInput, activity: Activity): string {
  const { feelsLikeC, tempC, windMs, precipMmH, symbolCode } = weather;

  if (activity === 'soevn') {
    if (tempC < 16) return 'Kjølig soverom';
    if (tempC > 22) return 'Varmt soverom';
    return 'Soverom';
  }

  const isFrost = feelsLikeC <= -5;
  const isCold = feelsLikeC <= 0;
  const isWindy = windMs >= 5;
  const isStrongWind = windMs >= 8;
  const isRaining = precipMmH >= 0.3;
  const isLightDrizzle = precipMmH >= 0.1 && precipMmH < 0.3;
  const isSunny = !!symbolCode && /clear|sun/i.test(symbolCode);
  const isWarm = tempC >= 20;

  if (isFrost && isWindy) return 'Vind og frost';
  if (isRaining) return 'Regn';
  if (isFrost) return 'Frost';
  if (isCold) return 'Kjølig';
  if (isStrongWind) return 'Sterk vind';
  if (isSunny && isWarm) return 'Sol og varmt';
  if (isLightDrizzle) return 'Lett yr';
  if (isWarm) return 'Mild sommer';
  if (feelsLikeC <= 10) return 'Kjølig overgang';
  return 'Mild dag';
}
