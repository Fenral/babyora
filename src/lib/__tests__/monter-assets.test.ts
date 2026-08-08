import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GENERIC_GARMENT_SVG,
  KNOWN_GARMENT_IDS,
} from '../../data/garment-illustrations.js';
import {
  getConditionLabel,
  getGarmentImage,
  getWeatherIcon,
  getWeatherNuance,
  MONTER_GARMENT_SLUGS,
} from '../monter-assets.js';

function garmentAssetHash(id: string): string {
  const file = resolve(
    process.cwd(),
    'public',
    'illustrations',
    'garments',
    `${id}.webp`,
  );
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('getGarmentImage', () => {
  it('resolves katalog ids to their exact flat WebP', () => {
    expect(getGarmentImage('kortermet-ullbody')).toBe('/illustrations/garments/kortermet-ullbody.webp');
    expect(getGarmentImage('vinterdress')).toBe('/illustrations/garments/vinterdress.webp');
    expect(getGarmentImage('ullsokker')).toBe('/illustrations/garments/ullsokker.webp');
  });

  it('keeps visually distinct variants on distinct catalog files', () => {
    expect(getGarmentImage('vinterkjoredress')).not.toBe(getGarmentImage('vinterdress'));
    expect(getGarmentImage('vinterkjoredress-isolert')).not.toBe(getGarmentImage('vinterdress'));
    expect(getGarmentImage('sovepose-0-5-tog')).not.toBe(getGarmentImage('sovepose-3-5-tog'));
  });

  it('covers the ids that previously fell back to letter tiles', () => {
    for (const id of ['bleie', 'sko', 'to-ullsett', 'ansiktskrem', 'sauekinn-i-vogn']) {
      expect(getGarmentImage(id), id).toBe(`/illustrations/garments/${id}.webp`);
    }
  });

  it('uses the exact real art for fleece pieces and intermediate TOG bags', () => {
    const exactArtIds = [
      'fleecedress',
      'fleecejakke',
      'fleecebukse',
      'sovepose-1-5-tog',
      'sovepose-2-0-tog',
    ] as const;

    for (const id of exactArtIds) {
      const path = getGarmentImage(id);
      expect(path, id).toBe(`/illustrations/garments/${id}.webp`);
      expect(existsSync(resolve(process.cwd(), 'public', path.slice(1))), id).toBe(true);
    }

    expect(getGarmentImage('fleecejakke')).not.toBe(getGarmentImage('ull-jakke'));
    expect(getGarmentImage('fleecebukse')).not.toBe(getGarmentImage('ull-bukse'));
    expect(getGarmentImage('sovepose-1-5-tog')).not.toBe(getGarmentImage('sovepose-1-0-tog'));
    expect(getGarmentImage('sovepose-2-0-tog')).not.toBe(getGarmentImage('sovepose-2-5-tog'));
  });

  it('keeps material, thickness, and garment variants byte-distinct', () => {
    const distinctGroups = [
      ['tynn-fleece', 'tykk-fleece', 'fleecejakke'],
      ['bomullssokker', 'ullsokker'],
      ['bomullssett', 'ullsett-tynt'],
    ] as const;

    for (const ids of distinctGroups) {
      const hashes = ids.map(garmentAssetHash);
      expect(new Set(hashes).size, `${ids.join(', ')} must not reuse image bytes`).toBe(ids.length);
    }
  });

  it('uses the generic non-letter illustration for unknown/missing ids', () => {
    expect(getGarmentImage('helt-ukjent-id')).toBe(GENERIC_GARMENT_SVG);
    expect(getGarmentImage(null)).toBe(GENERIC_GARMENT_SVG);
    expect(getGarmentImage(undefined)).toBe(GENERIC_GARMENT_SVG);
    expect(getGarmentImage('')).toBe(GENERIC_GARMENT_SVG);
  });

  it('covers every catalog id with an existing, exact-name flat WebP', () => {
    const katalog = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/plagg-katalog.json'), 'utf8'),
    ) as { items: ReadonlyArray<{ id: string }> };
    for (const item of katalog.items) {
      const path = getGarmentImage(item.id);
      expect(path, item.id).toBe(`/illustrations/garments/${item.id}.webp`);
      const file = resolve(process.cwd(), 'public', path.replace(/^\//, ''));
      expect(existsSync(file), `${item.id} -> ${file}`).toBe(true);
    }
  });

  it('covers every id garmentIdFor can return with its own exact-name WebP', () => {
    expect(KNOWN_GARMENT_IDS.length).toBeGreaterThan(61);
    for (const id of KNOWN_GARMENT_IDS) {
      const path = getGarmentImage(id);
      expect(path, id).toBe(`/illustrations/garments/${id}.webp`);
      expect(path, id).not.toBe(GENERIC_GARMENT_SVG);
      expect(existsSync(resolve(process.cwd(), 'public', path.slice(1))), id).toBe(true);
    }
  });

  it('keeps the legacy Monter asset inventory internally complete for QA', () => {
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

  it.each([
    ['en', ['Loading weather', 'Clear', 'Cloudy', 'Rain', 'Snow', 'Fog']],
    ['sv', ['Hämtar väder', 'Klart', 'Molnigt', 'Regn', 'Snö', 'Dimma']],
    ['da', ['Henter vejret', 'Klart', 'Overskyet', 'Regn', 'Sne', 'Tåge']],
    ['no', ['Henter vær', 'Klarvær', 'Skyet', 'Regn', 'Snø', 'Tåke']],
  ] as const)('localizes common codes in %s', (language, expected) => {
    const symbols = [undefined, 'clearsky_day', 'cloudy', 'rain', 'snow', 'fog'] as const;
    expect(symbols.map((symbol) => getConditionLabel(symbol, language))).toEqual(expected);
  });
});
