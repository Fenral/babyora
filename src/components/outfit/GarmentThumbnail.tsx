import type { CSSProperties } from 'react';
import {
  GENERIC_GARMENT_SVG,
  garmentClayPng,
  garmentIdFor,
  garmentPngSafe,
} from '../../data/garment-illustrations.js';

type Props = Readonly<{
  label: string;
  className?: string;
  style?: CSSProperties;
}>;

/**
 * One deterministic garment image for both the map and its ordered list.
 * The clay illustration is preferred, while a flat illustration and finally
 * an inline SVG keep the visual explanation complete when an asset is absent.
 */
export function GarmentThumbnail({ label, className, style }: Props) {
  const garmentId = garmentIdFor(label);
  const fallback = garmentPngSafe(garmentId);
  const source = garmentId ? garmentClayPng(garmentId) : fallback;

  return (
    <img
      className={className}
      style={style}
      src={source}
      alt=""
      aria-hidden="true"
      onError={(event) => {
        const stage = event.currentTarget.dataset.fallbackStage;
        if (stage === undefined) {
          event.currentTarget.dataset.fallbackStage = 'flat';
          event.currentTarget.src = fallback;
        } else if (stage === 'flat') {
          event.currentTarget.dataset.fallbackStage = 'generic';
          event.currentTarget.src = GENERIC_GARMENT_SVG;
        }
      }}
    />
  );
}
