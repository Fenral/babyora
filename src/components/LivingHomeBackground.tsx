import type { ReactElement } from 'react';
import {
  resolveHomeAtmosphere,
  type HomeAtmosphere,
  type HomeAtmosphereCondition,
  type HomeAtmosphereIntensity,
  type HomeAtmosphereLayer,
  type HomeAtmosphereLighting,
  type HomeAtmospherePalette,
} from '../lib/home-atmosphere.js';
import './LivingHomeBackground.css';

export interface LivingHomeBackgroundProps {
  readonly atmosphere: HomeAtmosphere;
  readonly reducedMotion?: boolean;
}

const PALETTES = new Set<HomeAtmospherePalette>(['cold', 'mild', 'warm']);
const LIGHTING = new Set<HomeAtmosphereLighting>([
  'day',
  'night',
  'polar-twilight',
  'neutral',
]);
const CONDITIONS = new Set<HomeAtmosphereCondition>([
  'rain',
  'snow',
  'cloud',
  'sun',
  'fog',
  'storm',
  'unknown',
]);
const INTENSITIES = new Set<HomeAtmosphereIntensity>(['quiet', 'present', 'deep']);
const FALLBACK_ATMOSPHERE = resolveHomeAtmosphere(undefined);

function isLayer(value: unknown): value is HomeAtmosphereLayer {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Readonly<Record<string, unknown>>;
  if (candidate.kind === 'wash') return PALETTES.has(candidate.variant as HomeAtmospherePalette);
  if (candidate.kind === 'condition') {
    return CONDITIONS.has(candidate.variant as HomeAtmosphereCondition);
  }
  if (candidate.kind === 'lighting') {
    return (
      candidate.variant !== 'neutral' &&
      LIGHTING.has(candidate.variant as HomeAtmosphereLighting)
    );
  }
  return false;
}

function safeAtmosphere(value: HomeAtmosphere): HomeAtmosphere {
  if (value === null || typeof value !== 'object') return FALLBACK_ATMOSPHERE;

  const candidate = value as HomeAtmosphere;
  const layers = Array.isArray(candidate.layers) ? candidate.layers : [];
  if (
    !PALETTES.has(candidate.palette) ||
    !LIGHTING.has(candidate.lighting) ||
    !CONDITIONS.has(candidate.condition) ||
    !INTENSITIES.has(candidate.intensity) ||
    (layers.length !== 2 && layers.length !== 3) ||
    !layers.every(isLayer) ||
    layers[0]?.kind !== 'wash' ||
    layers[0].variant !== candidate.palette ||
    layers[1]?.kind !== 'condition' ||
    layers[1].variant !== candidate.condition ||
    (candidate.lighting === 'neutral'
      ? layers.length !== 2
      : layers[2]?.kind !== 'lighting' || layers[2].variant !== candidate.lighting)
  ) {
    return FALLBACK_ATMOSPHERE;
  }

  return candidate;
}

/**
 * Decorative Living Home surface.
 *
 * All weather meaning remains in the semantic Home content. This renderer
 * performs no I/O and reads no browser globals, so it is safe during SSR.
 */
export function LivingHomeBackground({
  atmosphere,
  reducedMotion = false,
}: LivingHomeBackgroundProps): ReactElement {
  const safe = safeAtmosphere(atmosphere);

  return (
    <div
      className="ba-living-home-background"
      aria-hidden="true"
      data-palette={safe.palette}
      data-lighting={safe.lighting}
      data-condition={safe.condition}
      data-intensity={safe.intensity}
      data-motion={reducedMotion ? 'reduced' : 'normal'}
    >
      {safe.layers.map((layer, index) => (
        <span
          className="ba-living-home-background__layer"
          data-home-atmosphere-layer={layer.kind}
          data-variant={layer.variant}
          key={`${layer.kind}-${index}`}
        />
      ))}
    </div>
  );
}

