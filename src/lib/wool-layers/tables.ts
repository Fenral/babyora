import type { Activity, Layer, TempBand } from './types.js';

/**
 * Temperatur-bånd i grader Celsius (føles-som).
 * Disse er kalibrert mot Babyverden og Reima sine åpne anbefalinger.
 * MÅ valideres av helsesøster før produksjons-lansering.
 */
export function bandForTemp(feelsLikeC: number): TempBand {
  if (feelsLikeC >= 28) return 'ekstrem_varme'; // iter 26: nytt bånd
  if (feelsLikeC >= 22) return 'tropisk';
  if (feelsLikeC >= 16) return 'varm';
  if (feelsLikeC >= 10) return 'mild';
  if (feelsLikeC >= 5) return 'kjolig';
  if (feelsLikeC >= 0) return 'kald';
  if (feelsLikeC >= -7) return 'frost';
  if (feelsLikeC >= -15) return 'streng_frost';
  return 'ekstrem';
}

/**
 * Base-anbefaling per aktivitet og temperatur-bånd.
 * Hver verdi er en liste med lag (innerst → ekstra).
 * Justeringer for vind/nedbør/alder skjer i modifiers.ts.
 */
export const baseTable: Record<Activity, Record<TempBand, Layer[]>> = {
  vogn: {
    tropisk: [
      { category: 'innerst', items: ['kortermet ullbody'] },
      { category: 'ekstra', items: ['solhatt', 'tynt teppe'] },
    ],
    varm: [
      { category: 'innerst', items: ['langermet ullbody tynn'] },
      { category: 'mellomlag', items: ['tynn bukse'] },
      { category: 'ekstra', items: ['tynn lue', 'caps eller solhatt'] },
    ],
    mild: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['tynt ull-mellomlag'] },
      { category: 'yttertoy', items: ['lett kjøredress'] },
      { category: 'ekstra', items: ['tynn lue', 'varmepose lett'] },
    ],
    kjolig: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['kjøredress'] },
      { category: 'ekstra', items: ['lue', 'tynne votter', 'varmepose'] },
    ],
    // B-17 (A-1 fix 2026-06-12): kald-bånd (0-4°) hadde vinterkjøredress,
    // men foreldre-erfaring er at vinterkjøredress er for varmt over 0°.
    // Nye regel: vinterkjøredress kun ved føles ≤ 0° (frost+). Kald-bånd
    // bruker kjøredress (med varmere underlag enn kjolig-bånd).
    kald: [
      { category: 'innerst', items: ['tykt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['kjøredress'] },
      { category: 'ekstra', items: ['lue', 'votter', 'varmepose dun', 'saueskinn i vogn'] },
    ],
    frost: [
      { category: 'innerst', items: ['tykt ullsett', 'ullstrømper'] },
      { category: 'mellomlag', items: ['ull-mellomlag', 'ull-jakke'] },
      { category: 'yttertoy', items: ['vinterkjøredress'] },
      { category: 'ekstra', items: ['lue m/ ull', 'tykke votter', 'halsedisse', 'varmepose dun', 'saueskinn i vogn'] },
    ],
    streng_frost: [
      { category: 'innerst', items: ['to ullsett oppå hverandre', 'tykke ullstrømper'] },
      { category: 'mellomlag', items: ['ull-jakke', 'ull-bukse'] },
      { category: 'yttertoy', items: ['isolert vinterkjøredress'] },
      { category: 'ekstra', items: ['balaklava', 'votter dun', 'varmepose dun', 'saueskinn i vogn', 'ansiktskrem'] },
    ],
    ekstrem: [
      { category: 'innerst', items: ['to ullsett oppå hverandre', 'tykke ullstrømper'] },
      { category: 'mellomlag', items: ['ull-jakke', 'ull-bukse'] },
      { category: 'yttertoy', items: ['isolert vinterkjøredress'] },
      { category: 'ekstra', items: ['balaklava', 'votter dun', 'varmepose dun', 'saueskinn i vogn', 'ansiktskrem'] },
    ],
    // Iter 26: nytt bånd for ekstrem varme — minimalt tøy, skygge er kritisk
    ekstrem_varme: [
      { category: 'innerst', items: ['kortermet body'] },
      { category: 'ekstra', items: ['solhatt'] },
    ],
  },

  baeresele: {
    tropisk: [
      { category: 'innerst', items: ['kortermet ullbody'] },
      { category: 'ekstra', items: ['solhatt'] },
    ],
    varm: [
      { category: 'innerst', items: ['kortermet ullbody'] },
      { category: 'mellomlag', items: ['tynn bukse'] },
      { category: 'ekstra', items: ['solhatt'] },
    ],
    mild: [
      { category: 'innerst', items: ['langermet ullbody'] },
      { category: 'mellomlag', items: ['tynn bukse'] },
      { category: 'ekstra', items: ['tynn lue'] },
    ],
    kjolig: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['tynt ull-mellomlag'] },
      { category: 'ekstra', items: ['lue', 'tøffel-sko'] },
    ],
    // B-17 (A-1 fix): bæresele beholder lett kjøredress for kald (kropps-
    // varme fra forelder kompenserer). Frost får kjøredress (mellomtykk).
    kald: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['lett kjøredress'] },
      { category: 'ekstra', items: ['lue', 'tynne votter'] },
    ],
    frost: [
      { category: 'innerst', items: ['tykt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['kjøredress'] },
      { category: 'ekstra', items: ['lue m/ ull', 'votter', 'halsedisse'] },
    ],
    streng_frost: [
      { category: 'innerst', items: ['tykt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag', 'ull-jakke'] },
      { category: 'yttertoy', items: ['vinterkjøredress'] },
      { category: 'ekstra', items: ['balaklava', 'tykke votter', 'halsedisse'] },
    ],
    ekstrem: [
      { category: 'innerst', items: ['to ullsett oppå hverandre'] },
      { category: 'mellomlag', items: ['ull-jakke'] },
      { category: 'yttertoy', items: ['isolert vinterkjøredress'] },
      { category: 'ekstra', items: ['balaklava', 'votter dun', 'halsedisse', 'ansiktskrem'] },
    ],
    ekstrem_varme: [
      { category: 'innerst', items: ['kortermet body'] },
      { category: 'ekstra', items: ['solhatt'] },
    ],
  },

  /**
   * Søvn — INNENDØRS. `tempC` tolkes som romtemperatur, ikke utetemperatur.
   *
   * Iter 36: TOG-mapping kalibrert mot Lullaby Trust TOG-chart + AAP-2022:
   * - ≥28 °C (ekstrem_varme): bleie + valgfri body, INGEN sovepose
   * - 22-27 °C (tropisk):    kortermet body + sovepose 1.0 TOG (CK-3 justerer ned ved ≥24 °C)
   * - 16-21 °C (varm):       langermet body + tynn pyjamas + sovepose 2.5 TOG
   * - 10-15 °C (mild):       langermet body + pyjamas + sovepose 2.5 TOG
   * -  5-9  °C (kjolig):     langermet body + ullsokker + pyjamas + sovepose 2.5 TOG
   * -  0-4  °C (kald+):      langermet ullbody + ullsokker + ull-pyjamas + sovepose 3.5 TOG
   *
   * Norsk helsesøster-praksis: 18 °C er gjeldende norm. 14 mnd ved 18 °C → 2.5 TOG.
   * Ute-band (frost/streng_frost/ekstrem) er ikke realistiske romtemp,
   * men vi gir konservative anbefalinger hvis brukeren bevisst velger dem.
   */
  soevn: {
    ekstrem_varme: [
      { category: 'innerst', items: ['bleie', 'lett kortermet body (valgfritt)'] },
    ],
    tropisk: [
      { category: 'innerst', items: ['kortermet body'] },
      { category: 'ekstra', items: ['sovepose 1.0 TOG'] },
    ],
    varm: [
      { category: 'innerst', items: ['langermet body'] },
      { category: 'mellomlag', items: ['tynn pyjamas'] },
      { category: 'ekstra', items: ['sovepose 2.5 TOG'] },
    ],
    mild: [
      { category: 'innerst', items: ['langermet body'] },
      { category: 'mellomlag', items: ['pyjamas'] },
      { category: 'ekstra', items: ['sovepose 2.5 TOG'] },
    ],
    kjolig: [
      { category: 'innerst', items: ['langermet body', 'ullsokker'] },
      { category: 'mellomlag', items: ['pyjamas'] },
      { category: 'ekstra', items: ['sovepose 2.5 TOG'] },
    ],
    kald: [
      { category: 'innerst', items: ['langermet ullbody', 'ullsokker'] },
      { category: 'mellomlag', items: ['ull-pyjamas'] },
      { category: 'ekstra', items: ['sovepose 3.5 TOG'] },
    ],
    frost: [
      { category: 'innerst', items: ['langermet ullbody', 'ullsokker'] },
      { category: 'mellomlag', items: ['ull-pyjamas'] },
      { category: 'ekstra', items: ['sovepose 3.5 TOG'] },
    ],
    streng_frost: [
      { category: 'innerst', items: ['langermet ullbody', 'ullsokker'] },
      { category: 'mellomlag', items: ['ull-pyjamas'] },
      { category: 'ekstra', items: ['sovepose 3.5 TOG'] },
    ],
    ekstrem: [
      { category: 'innerst', items: ['langermet ullbody', 'ullsokker'] },
      { category: 'mellomlag', items: ['ull-pyjamas'] },
      { category: 'ekstra', items: ['sovepose 3.5 TOG'] },
    ],
  },

  utelek: {
    tropisk: [
      { category: 'innerst', items: ['t-skjorte', 'shorts'] },
      { category: 'ekstra', items: ['solhatt', 'sandaler'] },
    ],
    varm: [
      { category: 'innerst', items: ['langermet ullbody tynn', 'lett bukse'] },
      { category: 'ekstra', items: ['caps eller solhatt', 'sko'] },
    ],
    mild: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['tynt ull-mellomlag'] },
      { category: 'ekstra', items: ['tynn lue', 'sko'] },
    ],
    kjolig: [
      { category: 'innerst', items: ['tynt ullsett'] },
      { category: 'mellomlag', items: ['ull-jakke', 'ull-bukse'] },
      { category: 'ekstra', items: ['lue', 'sko', 'tynne votter'] },
    ],
    // B-17 (A-1 fix): utelek beveger seg mye → vinterdress var for varmt
    // ved kald (0-4°). Bruker dress (mellomtykk). Frost beholder vinterdress.
    kald: [
      { category: 'innerst', items: ['tykt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['dress'] },
      { category: 'ekstra', items: ['lue', 'votter', 'vintersko'] },
    ],
    frost: [
      { category: 'innerst', items: ['tykt ullsett'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
      { category: 'yttertoy', items: ['vinterdress'] },
      { category: 'ekstra', items: ['lue m/ ull', 'tykke votter', 'halsedisse', 'vintersko isolerte'] },
    ],
    streng_frost: [
      { category: 'innerst', items: ['to ullsett oppå hverandre'] },
      { category: 'mellomlag', items: ['tykt ull-mellomlag'] },
      { category: 'yttertoy', items: ['isolert vinterdress'] },
      { category: 'ekstra', items: ['balaklava', 'tykke votter', 'halsedisse', 'vintersko isolerte'] },
    ],
    ekstrem: [
      { category: 'innerst', items: ['to ullsett oppå hverandre'] },
      { category: 'mellomlag', items: ['tykt ull-mellomlag'] },
      { category: 'yttertoy', items: ['isolert vinterdress'] },
      { category: 'ekstra', items: ['balaklava', 'votter dun', 'halsedisse', 'vintersko isolerte', 'ansiktskrem'] },
    ],
    ekstrem_varme: [
      { category: 'innerst', items: ['t-skjorte', 'shorts'] },
      { category: 'ekstra', items: ['solhatt', 'sandaler'] },
    ],
  },
};
