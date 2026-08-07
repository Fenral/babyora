import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getConditionLabel,
  getGarmentImage,
  getWeatherIcon,
  getWeatherNuance,
  MONTER_GARMENT_SLUGS,
} from '../monter-assets.js';

describe('getGarmentImage', () => {
  it('resolves an exact-name katalog id to its Monter PNG', () => {
    expect(getGarmentImage('kortermet-ullbody')).toBe('/monter/plagg-kortermet-ullbody.webp');
    expect(getGarmentImage('vinterdress')).toBe('/monter/plagg-vinterdress.webp');
    expect(getGarmentImage('ullsokker')).toBe('/monter/plagg-ullsokker.webp');
  });

  it('reuses one image across thickness/tog variants of the same garment', () => {
    expect(getGarmentImage('vinterkjoredress')).toBe(getGarmentImage('vinterdress'));
    expect(getGarmentImage('vinterkjoredress-isolert')).toBe(getGarmentImage('vinterdress'));
    expect(getGarmentImage('sovepose-0-5-tog')).toBe(getGarmentImage('sovepose-3-5-tog'));
  });

  it('returns null for ids with no confident visual match (neutral placeholder territory)', () => {
    expect(getGarmentImage('bleie')).toBeNull();
    expect(getGarmentImage('sko')).toBeNull();
    expect(getGarmentImage('to-ullsett')).toBeNull();
    expect(getGarmentImage('ansiktskrem')).toBeNull();
  });

  it('returns null for unknown/missing ids without throwing', () => {
    expect(getGarmentImage('helt-ukjent-id')).toBeNull();
    expect(getGarmentImage(null)).toBeNull();
    expect(getGarmentImage(undefined)).toBeNull();
    expect(getGarmentImage('')).toBeNull();
  });

  it('every mapped path points at one of the 42 shipped garment slugs', () => {
    const katalog = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/plagg-katalog.json'), 'utf8'),
    ) as { items: ReadonlyArray<{ id: string }> };
    for (const item of katalog.items) {
      const path = getGarmentImage(item.id);
      if (path === null) continue;
      const slug = MONTER_GARMENT_SLUGS.find((s) => path === `/monter/plagg-${s}.webp`);
      expect(slug, `${item.id} -> ${path} should match a shipped slug`).toBeDefined();
    }
  });

  it('every shipped garment PNG referenced by the map actually exists in public/monter', () => {
    const files = new Set(readdirSync(resolve(process.cwd(), 'public/monter')));
    for (const slug of MONTER_GARMENT_SLUGS) {
      expect(files.has(`plagg-${slug}.webp`)).toBe(true);
    }
  });
});

describe('getWeatherIcon', () => {
  it('maps clear/fair day codes to klarvaer', () => {
    expect(getWeatherIcon('clearsky_day')).toBe('/monter/vaer-klarvaer.webp');
    expect(getWeatherIcon('fair_day')).toBe('/monter/vaer-delvis-skyet.webp');
  });

  it('maps clear/fair NIGHT codes to the dedicated natt icon', () => {
    expect(getWeatherIcon('clearsky_night')).toBe('/monter/vaer-natt.webp');
    expect(getWeatherIcon('fair_polartwilight')).toBe('/monter/vaer-natt.webp');
  });

  it('keeps precipitation/fog icons even at night (condition beats clock)', () => {
    expect(getWeatherIcon('lightrain_night')).toBe('/monter/vaer-regn.webp');
    expect(getWeatherIcon('snow_night')).toBe('/monter/vaer-sno.webp');
    expect(getWeatherIcon('fog')).toBe('/monter/vaer-taake.webp');
  });

  it('maps cloudy/partlycloudy/rain/snow families', () => {
    expect(getWeatherIcon('cloudy')).toBe('/monter/vaer-skyet.webp');
    expect(getWeatherIcon('partlycloudy_day')).toBe('/monter/vaer-delvis-skyet.webp');
    expect(getWeatherIcon('heavyrainshowers_day')).toBe('/monter/vaer-regn.webp');
    expect(getWeatherIcon('sleetshowers_day')).toBe('/monter/vaer-sno.webp');
  });

  it('returns null while weather has not loaded yet', () => {
    expect(getWeatherIcon(undefined)).toBeNull();
    expect(getWeatherIcon(null)).toBeNull();
  });

  it('every icon path exists in public/monter', () => {
    const files = new Set(readdirSync(resolve(process.cwd(), 'public/monter')));
    const codes = ['clearsky_day', 'clearsky_night', 'partlycloudy_day', 'cloudy', 'lightrain', 'snow', 'fog'];
    for (const code of codes) {
      const path = getWeatherIcon(code);
      expect(path).not.toBeNull();
      const file = path!.replace('/monter/', '');
      expect(files.has(file)).toBe(true);
    }
  });
});

describe('getWeatherNuance', () => {
  it('collapses to the 5 panel nuances (clear/cloudy/rain/snow/night)', () => {
    expect(getWeatherNuance('clearsky_day')).toBe('clear');
    expect(getWeatherNuance('cloudy')).toBe('cloudy');
    expect(getWeatherNuance('partlycloudy_day')).toBe('cloudy');
    expect(getWeatherNuance('lightrain')).toBe('rain');
    expect(getWeatherNuance('heavysnowshowers_day')).toBe('snow');
  });

  it('uses the dedicated night nuance only for clear/fair after dark', () => {
    expect(getWeatherNuance('clearsky_night')).toBe('night');
    expect(getWeatherNuance('fair_polartwilight')).toBe('night');
  });

  it('precipitation/fog beat night — condition is more actionable than the clock', () => {
    expect(getWeatherNuance('lightrain_night')).toBe('rain');
    expect(getWeatherNuance('snow_night')).toBe('snow');
    expect(getWeatherNuance('fog_night')).toBe('cloudy');
  });

  it('defaults to "cloudy" (== --dw-panel base value) while weather has not loaded yet', () => {
    expect(getWeatherNuance(undefined)).toBe('cloudy');
    expect(getWeatherNuance(null)).toBe('cloudy');
  });
});

describe('getConditionLabel', () => {
  it('matches legacy HjemScreen symbolToLabel copy exactly for the common cases', () => {
    expect(getConditionLabel('clearsky_day')).toBe('Klarvær');
    expect(getConditionLabel('lightrain')).toBe('Lett regn');
    expect(getConditionLabel('cloudy')).toBe('Skyet');
    expect(getConditionLabel('fog')).toBe('Tåke');
  });

  it('falls back to "Henter vær" while loading and "Vær" for unrecognised codes', () => {
    expect(getConditionLabel(undefined)).toBe('Henter vær');
    expect(getConditionLabel(null)).toBe('Henter vær');
    expect(getConditionLabel('totally-unknown-code')).toBe('Vær');
  });
});
