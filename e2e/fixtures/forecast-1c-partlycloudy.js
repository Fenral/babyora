/**
 * Deterministisk met.no-fikstur for tools/verify-hjem.mjs.
 *
 * Bygges i FORMATET klienten faktisk krever (locationforecast/2.0/compact),
 * ikke et oppdiktet flatt objekt. Første utkast av verifikatoren svarte med
 * `{tempC, feelsLikeC, symbol}` — ruten ble truffet, svaret forkastet av
 * `isMetForecast()`, appen falt til «Vi klarer oss med sist kjente vær», og
 * CTA-en sto `disabled`. Alle «funksjonen finnes ikke»-portene stryk fordi
 * knappen aldri ble trykket, ikke fordi funksjonen manglet.
 *
 * Kontrakten er streng og verifisert mot src/lib/met-no/client.ts:
 *   - properties.meta.units må matche CONSUMED_UNIT_CONTRACT EKSAKT
 *   - hvert punkt trenger instant.details med alle fem feltene i gyldig range
 *   - next_1_hours/next_6_hours trenger summary.symbol_code + details.precipitation_amount
 *   - timeseries må være strengt stigende i tid
 *
 * met-no/ er låst motormappe. Vi rører den ikke — vi svarer bare riktig.
 */
const UNITS = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
};

/** 1 °C, delvis skyet, lett vind, ingen nedbør — samme scenario som B1-proofen.
 *
 *  Tidsaksen forankres til NÅ, ikke til en hardkodet dato. Første utkast lå på
 *  2026-08-03T08:00Z; kjørte man verifikatoren om natten lå hele serien i
 *  framtiden, appen fant ingen gyldig «nå»-verdi og falt til «sist kjente vær»
 *  med CTA-en deaktivert. VERDIENE er deterministiske — det er poenget med en
 *  fikstur. Klokka er det ikke, og skal ikke være det. */
export function forecastPartlyCloudy1C(naa = Date.now()) {
  const start = Math.floor(naa / 3600_000) * 3600_000 - 3600_000;   // forrige hele time
  const punkt = (timeMs, tempC) => ({
    time: new Date(timeMs).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    data: {
      instant: {
        details: {
          air_temperature: tempC,
          wind_speed: 2.4,
          wind_from_direction: 210,
          relative_humidity: 78,
          cloud_area_fraction: 55,
        },
      },
      next_1_hours: {
        summary: { symbol_code: 'partlycloudy_day' },
        details: { precipitation_amount: 0 },
      },
      next_6_hours: {
        summary: { symbol_code: 'partlycloudy_day' },
        details: { precipitation_amount: 0 },
      },
    },
  });
  const timeseries = [];
  for (let t = 0; t < 24; t += 1) {
    timeseries.push(punkt(start + t * 3600_000, 1 + Math.round(t / 4)));
  }
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [10.3951, 63.4305, 10] },
    properties: { meta: { updated_at: new Date(start).toISOString(), units: UNITS }, timeseries },
  };
}
