import { tempAxisFor, type TempAxis } from './temp-axis.js';

export type HomeAtmospherePalette = 'cold' | 'mild' | 'warm';
export type HomeAtmosphereLighting = 'day' | 'night' | 'polar-twilight' | 'neutral';
export type HomeAtmosphereCondition =
  | 'rain'
  | 'snow'
  | 'cloud'
  | 'sun'
  | 'fog'
  | 'storm'
  | 'unknown';
export type HomeAtmosphereIntensity = 'quiet' | 'present' | 'deep';

export type HomeAtmosphereLayer =
  | Readonly<{ kind: 'wash'; variant: HomeAtmospherePalette }>
  | Readonly<{ kind: 'condition'; variant: HomeAtmosphereCondition }>
  | Readonly<{
      kind: 'lighting';
      variant: Exclude<HomeAtmosphereLighting, 'neutral'>;
    }>;

export interface HomeAtmosphereInput {
  readonly tempC?: number | null;
  readonly feelsLikeC?: number | null;
  readonly symbolCode?: string | null;
}

export interface HomeAtmosphere {
  readonly palette: HomeAtmospherePalette;
  readonly lighting: HomeAtmosphereLighting;
  readonly condition: HomeAtmosphereCondition;
  readonly intensity: HomeAtmosphereIntensity;
  readonly layers: readonly HomeAtmosphereLayer[];
}

const PROVIDER_LIGHTING_SUFFIX = /_(day|night|polartwilight)$/iu;
const PROVIDER_LIGHTING_VARIANTS = ['day', 'night', 'polartwilight'] as const;

const SUFFIXED_SUN_CODES = ['clearsky', 'fair'] as const;
const SUFFIXED_CLOUD_CODES = ['partlycloudy'] as const;
const PLAIN_CLOUD_CODES = ['cloudy'] as const;
const PLAIN_FOG_CODES = ['fog'] as const;
const PLAIN_RAIN_CODES = ['heavyrain', 'lightrain', 'rain'] as const;
const SUFFIXED_RAIN_CODES = [
  'heavyrainshowers',
  'lightrainshowers',
  'rainshowers',
] as const;
const PLAIN_SNOW_CODES = [
  'heavysnow',
  'lightsleet',
  'snow',
  'lightsnow',
  'heavysleet',
  'sleet',
] as const;
const SUFFIXED_SNOW_CODES = [
  'lightsnowshowers',
  'heavysleetshowers',
  'lightsleetshowers',
  'snowshowers',
  'sleetshowers',
  'heavysnowshowers',
] as const;
const PLAIN_STORM_CODES = [
  'heavyrainandthunder',
  'heavysnowandthunder',
  'rainandthunder',
  'lightsnowandthunder',
  'heavysleetandthunder',
  'sleetandthunder',
  'lightrainandthunder',
  'lightsleetandthunder',
  'snowandthunder',
] as const;
const SUFFIXED_STORM_CODES = [
  'lightssnowshowersandthunder',
  'heavysleetshowersandthunder',
  'heavyrainshowersandthunder',
  'snowshowersandthunder',
  'rainshowersandthunder',
  'lightrainshowersandthunder',
  'lightssleetshowersandthunder',
  'sleetshowersandthunder',
  'heavysnowshowersandthunder',
] as const;

function buildProviderConditionMap(): ReadonlyMap<string, HomeAtmosphereCondition> {
  const map = new Map<string, HomeAtmosphereCondition>();
  const addPlain = (
    condition: HomeAtmosphereCondition,
    codes: readonly string[],
  ): void => {
    for (const code of codes) map.set(code, condition);
  };
  const addSuffixed = (
    condition: HomeAtmosphereCondition,
    codes: readonly string[],
  ): void => {
    for (const code of codes) {
      for (const lighting of PROVIDER_LIGHTING_VARIANTS) {
        map.set(`${code}_${lighting}`, condition);
      }
    }
  };

  addSuffixed('sun', SUFFIXED_SUN_CODES);
  addSuffixed('cloud', SUFFIXED_CLOUD_CODES);
  addPlain('cloud', PLAIN_CLOUD_CODES);
  addPlain('fog', PLAIN_FOG_CODES);
  addPlain('rain', PLAIN_RAIN_CODES);
  addSuffixed('rain', SUFFIXED_RAIN_CODES);
  addPlain('snow', PLAIN_SNOW_CODES);
  addSuffixed('snow', SUFFIXED_SNOW_CODES);
  addPlain('storm', PLAIN_STORM_CODES);
  addSuffixed('storm', SUFFIXED_STORM_CODES);

  return map;
}

const PROVIDER_CONDITION_BY_CODE = buildProviderConditionMap();

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizedSymbol(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const symbol = value.trim().toLowerCase();
  return symbol.length > 0 ? symbol : undefined;
}

function paletteFor(axis: TempAxis): HomeAtmospherePalette {
  switch (axis) {
    case 'kald':
      return 'cold';
    case 'varm':
      return 'warm';
    case 'mild':
      return 'mild';
  }
}

function lightingFor(symbolCode: string | undefined): HomeAtmosphereLighting {
  const suffix = symbolCode?.match(PROVIDER_LIGHTING_SUFFIX)?.[1];
  switch (suffix) {
    case 'day':
      return 'day';
    case 'night':
      return 'night';
    case 'polartwilight':
      return 'polar-twilight';
    default:
      return 'neutral';
  }
}

function conditionFor(symbolCode: string | undefined): HomeAtmosphereCondition {
  if (symbolCode === undefined) return 'unknown';
  return PROVIDER_CONDITION_BY_CODE.get(symbolCode) ?? 'unknown';
}

function intensityFor(actualTemperatureC: number | undefined): HomeAtmosphereIntensity {
  if (actualTemperatureC === undefined) return 'quiet';
  if (actualTemperatureC <= -12 || actualTemperatureC >= 24) return 'deep';
  if (actualTemperatureC <= 5 || actualTemperatureC >= 18) return 'present';
  return 'quiet';
}

/**
 * Resolves decoration from one caller-owned forecast snapshot.
 *
 * The function deliberately performs no I/O, clock lookup, provider request,
 * global-state read, or browser capability check. Unknown input fails closed
 * to a calm neutral atmosphere.
 */
export function resolveHomeAtmosphere(input?: HomeAtmosphereInput | null): HomeAtmosphere {
  const safeInput =
    input !== null && typeof input === 'object'
      ? (input as Readonly<Record<string, unknown>>)
      : undefined;
  const actualTemperatureC = finiteNumber(safeInput?.tempC);
  const perceivedTemperatureC = finiteNumber(safeInput?.feelsLikeC);
  const symbolCode = normalizedSymbol(safeInput?.symbolCode);

  const palette = paletteFor(tempAxisFor(perceivedTemperatureC, actualTemperatureC));
  const condition = conditionFor(symbolCode);
  const lighting = condition === 'unknown' ? 'neutral' : lightingFor(symbolCode);
  const intensity = intensityFor(actualTemperatureC);

  const layers: HomeAtmosphereLayer[] = [
    { kind: 'wash', variant: palette },
    { kind: 'condition', variant: condition },
  ];
  if (lighting !== 'neutral') {
    layers.push({ kind: 'lighting', variant: lighting });
  }

  return {
    palette,
    lighting,
    condition,
    intensity,
    layers,
  };
}
