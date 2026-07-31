/**
 * scan/result-key — resultKey-fingerprint for scan-cache (P3).
 *
 * REUSES HjemScreen sin eksisterende "current-finalized"-fingerprint
 * (src/screens/HjemScreen.tsx, `currentOutfitContext`-memoen, rundt linje
 * 468) EKSAKT — samme prefiks, samme felt, samme rekkefølge, samme
 * JSON.stringify-serialisering. HjemScreen er IKKE endret av denne pakken;
 * result-key.test.ts beviser likeverdighet ved å lese HjemScreen sin
 * kildekode og sammenligne mot denne funksjonens output for samme input
 * (samme teknikk som `bundle()`-hjelperen i
 * hooks/__tests__/useOutfitTransitionCoordinator.test.tsx allerede bruker).
 *
 * Formålet med å eksportere dette som en gjenbrukbar hjelper: scan-cache
 * (P3/P4) trenger å beregne den SAMME nøkkelen HjemScreen bruker for å
 * avgjøre "er dette cachede resultatet fortsatt gyldig for dagens vær",
 * uten å duplisere fingerprint-strengen flere steder i kodebasen.
 */
import type { Layer, Recommendation } from '../wool-layers/types.js';

export type ScanResultKeyWeather = Readonly<{
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number;
  symbolCode: string;
}>;

function isEquipmentLayer(layer: Layer): boolean {
  return layer.category === 'utstyr';
}

/**
 * Samme garment/equipment-projeksjon som HjemScreen (`orderedGarments` /
 * `equipment` rundt linje 461-466) og useOutfitTransitionCoordinator sin
 * test-fixture (`projection()`).
 */
export function projectResultKeyGarments(
  recommendation: Recommendation,
): Readonly<{
  orderedGarments: readonly string[];
  equipment: readonly string[];
}> {
  return {
    orderedGarments: recommendation.layers
      .filter((layer) => !isEquipmentLayer(layer))
      .flatMap((layer) => layer.items),
    equipment: recommendation.layers
      .filter(isEquipmentLayer)
      .flatMap((layer) => layer.items),
  };
}

/**
 * EKSAKT samme fingerprint-konstruksjon som HjemScreen sin `fingerprint`
 * (current-finalized:${JSON.stringify([...])}`). Se filens header-doc.
 */
export function computeScanResultKey(
  recommendation: Recommendation,
  weather: ScanResultKeyWeather,
): string {
  const { orderedGarments, equipment } =
    projectResultKeyGarments(recommendation);
  return `current-finalized:${JSON.stringify([
    orderedGarments,
    equipment,
    weather.tempC,
    weather.feelsLikeC,
    weather.windMs,
    weather.precipMmH,
    weather.symbolCode,
  ])}`;
}
