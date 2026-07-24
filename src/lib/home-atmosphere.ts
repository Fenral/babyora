import { tempAxisFor, type TempAxis } from './temp-axis.js';
import { symbolToTheme } from './weather-theme/symbolToTheme.js';

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
  switch (symbolToTheme(symbolCode)) {
    case 'rainy':
      return 'rain';
    case 'snowy':
      return 'snow';
    case 'partly':
    case 'cloudy':
      return 'cloud';
    case 'sunny':
      return 'sun';
    case 'foggy':
      return 'fog';
    case 'stormy':
      return 'storm';
    case 'default':
      return 'unknown';
  }
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
  const lighting = lightingFor(symbolCode);
  const condition = conditionFor(symbolCode);
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
