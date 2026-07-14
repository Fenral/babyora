/**
 * Motor 2.0 — semantisk fingerprint (spec §12, invariant 6–7).
 *
 * Fingerprintet bygges av et EKSPLISITT input-objekt som per konstruksjon
 * ikke kan inneholde identitet (navn, fødselsdato, koordinater, konto- eller
 * husholdnings-ID). Samme semantiske resultat → samme fingerprint, uavhengig
 * av listerekkefølge. Ingen nettverks-, klokke- eller tilfeldighetskilder.
 *
 * Hash: FNV-1a 32-bit ×2 (offset-variert) — rask, dependency-fri og stabil
 * på tvers av runtime (browser/Node/Edge). Dette er en semantisk nøkkel,
 * ikke kryptografi.
 */

import type { AgeStage, EquipmentNeed, Situation, TempBand, WarmthLevel } from './types.js';

export type FingerprintInputV2 = {
  ageStage: AgeStage;
  situation: Situation;
  tempBand: TempBand;
  insulationWarmth: WarmthLevel;
  needs: {
    wind: boolean;
    waterproof: boolean;
    sun: boolean;
    head: boolean;
    hand: boolean;
    foot: boolean;
  };
  garmentVariantIds: string[];
  equipmentIds: EquipmentNeed[] | string[];
  safetyFlagCodes: string[];
  calibrationOffset: -1 | 0 | 1;
};

function fnv1a(text: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function fingerprintV2(input: FingerprintInputV2): string {
  const canonical = JSON.stringify({
    v: 2,
    a: input.ageStage,
    s: input.situation,
    t: input.tempBand,
    w: input.insulationWarmth,
    n: [
      input.needs.wind, input.needs.waterproof, input.needs.sun,
      input.needs.head, input.needs.hand, input.needs.foot,
    ],
    g: [...input.garmentVariantIds].sort(),
    e: [...input.equipmentIds].sort(),
    f: [...input.safetyFlagCodes].sort(),
    c: input.calibrationOffset,
  });
  const h1 = fnv1a(canonical, 0x811c9dc5).toString(16).padStart(8, '0');
  const h2 = fnv1a(canonical, 0x01234567).toString(16).padStart(8, '0');
  return `v2-${h1}${h2}`;
}
