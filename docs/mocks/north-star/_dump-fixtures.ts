/** R4: dump ekte motor-output som fixtures for North-Star-prototypene. Én gangs-script. */
import { writeFileSync } from 'node:fs';
import { recommend } from '../../../src/lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../src/lib/wool-layers/types.js';

const cases: Record<string, RecommendInput> = {
  mild_utelek_18mnd:   { weather: { tempC: 12, feelsLikeC: 11, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' }, child: { ageMonths: 18 }, activity: 'utelek' },
  kald_vogn_7mnd:      { weather: { tempC: -4, feelsLikeC: -7, windMs: 4, precipMmH: 0, symbolCode: 'cloudy' }, child: { ageMonths: 7 }, activity: 'vogn' },
  ekstrem_kulde_7mnd:  { weather: { tempC: -17, feelsLikeC: -21, windMs: 6, precipMmH: 0, symbolCode: 'clearsky_day' }, child: { ageMonths: 7 }, activity: 'vogn' },
  ekstrem_varme_18mnd: { weather: { tempC: 27, feelsLikeC: 28, windMs: 1, precipMmH: 0, symbolCode: 'clearsky_day' }, child: { ageMonths: 18 }, activity: 'utelek' },
  regn_vogn_18mnd:     { weather: { tempC: 8, feelsLikeC: 6, windMs: 5, precipMmH: 2.2, symbolCode: 'rain' }, child: { ageMonths: 18 }, activity: 'vogn' },
  plan_morgen_08:      { weather: { tempC: 6, feelsLikeC: 4, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' }, child: { ageMonths: 18 }, activity: 'vogn' },
  plan_midt_12:        { weather: { tempC: 11, feelsLikeC: 10, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' }, child: { ageMonths: 18 }, activity: 'utelek' },
  plan_henting_16:     { weather: { tempC: 9, feelsLikeC: 7, windMs: 6, precipMmH: 1.4, symbolCode: 'lightrain' }, child: { ageMonths: 18 }, activity: 'vogn' },
};

const out: Record<string, unknown> = {};
for (const [k, input] of Object.entries(cases)) {
  const r = recommend(input);
  out[k] = { input, layers: r.layers, summary: r.summary, tempBand: r.tempBand,
    notes: r.notes.slice(0, 4), severity: r.severity,
    flags: (r.safetyFlags ?? []).filter(f => f.displayInSheet !== false).map(f => ({ code: f.code, message: f.message, severity: f.severity })) };
}
writeFileSync('docs/mocks/north-star/fixtures.json', JSON.stringify(out, null, 2));
console.log('OK — ' + Object.keys(out).length + ' fixtures');
