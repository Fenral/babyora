import type { ReactElement } from 'react';
import {
  resolveHomeAtmosphere,
  type HomeAtmosphereInput,
} from '../lib/home-atmosphere.js';
import { LivingHomeBackground } from './LivingHomeBackground.js';
import './LivingHomeAtmosphere.css';

export interface LivingHomeAtmosphereProps extends HomeAtmosphereInput {
  readonly reducedMotion?: boolean;
}

/**
 * Same-snapshot Living Home decoration.
 *
 * The caller remains responsible for weather semantics, recommendation
 * content and navigation. This composition performs one synchronous
 * atmosphere resolution and renders only the existing decorative primitive.
 */
export function LivingHomeAtmosphere({
  tempC,
  feelsLikeC,
  symbolCode,
  reducedMotion = false,
}: LivingHomeAtmosphereProps): ReactElement {
  const atmosphere = resolveHomeAtmosphere({
    tempC,
    feelsLikeC,
    symbolCode,
  });
  const motionState = reducedMotion ? 'reduced' : 'normal';

  return (
    <div
      className="ba-living-home-atmosphere"
      aria-hidden="true"
      data-home-atmosphere="decorative"
      data-palette={atmosphere.palette}
      data-lighting={atmosphere.lighting}
      data-condition={atmosphere.condition}
      data-intensity={atmosphere.intensity}
      data-motion={motionState}
    >
      <LivingHomeBackground
        atmosphere={atmosphere}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
