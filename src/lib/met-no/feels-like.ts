/**
 * Føles-som-temperatur for barn 0-3 år.
 *
 * Bruker en hybrid:
 * - Wind chill (kald + vindfullt) per NWS-formel når T <= 10 °C og vind > 1.3 m/s
 * - Apparent temperature (varm + fuktig) per Steadman simplification når T >= 25 °C
 * - Ellers: ren air_temperature
 *
 * For våre formål (vogn-stillesittende baby) er vind-chill mer relevant enn
 * voksen-formler antar — vogn-stillesittende mister varme raskere. Vi bruker
 * standard formelen som første tilnærming og justerer empirisk etter
 * helsesøster-validering i Fase 2 av motoren.
 */

const KMH_PER_MS = 3.6;

export function feelsLikeC(airTempC: number, windMs: number, humidityPct = 50): number {
  // Wind chill (kald + vindfullt)
  if (airTempC <= 10 && windMs > 1.3) {
    const v = windMs * KMH_PER_MS; // m/s → km/h
    const v016 = Math.pow(v, 0.16);
    const wc =
      13.12 + 0.6215 * airTempC - 11.37 * v016 + 0.3965 * airTempC * v016;
    return Math.round(wc * 10) / 10;
  }

  // Heat index (varm + fuktig) — Steadman simplification
  if (airTempC >= 25) {
    const hi =
      -8.78469475556 +
      1.61139411 * airTempC +
      2.33854883889 * humidityPct -
      0.14611605 * airTempC * humidityPct -
      0.012308094 * airTempC * airTempC -
      0.0164248277778 * humidityPct * humidityPct +
      0.002211732 * airTempC * airTempC * humidityPct +
      0.00072546 * airTempC * humidityPct * humidityPct -
      0.000003582 * airTempC * airTempC * humidityPct * humidityPct;
    return Math.round(hi * 10) / 10;
  }

  return Math.round(airTempC * 10) / 10;
}
