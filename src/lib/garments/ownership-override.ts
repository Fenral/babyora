/**
 * P9.6 (2026-06-13): Bygg motor-overrides fra «Mine plagg»-state.
 *
 * Hvis et motoranbefalt plagg er markert «har ikke» → forsøk å bytte
 * til nærmeste eide ekvivalent via alternatives.ts. Hvis ingen eid
 * ekvivalent finnes: behold original med UI-merknad (håndteres i UI).
 *
 * Guardrail: sikkerhetskritiske plagg (sovepose-TOG, vinterkjøredress
 * ved frost+) byttes ALDRI til lavere sikkerhetsnivå.
 *
 * F81.5-W2 (Flate 3): garderobe-tilpasning («anbefaling tilpasset mine
 * plagg») er en Babyora Pluss-funksjon. `isPremium` er derfor et PÅKREVD
 * parameter — gratis-bruker (isPremium=false) får alltid standard-
 * anbefalingen uendret (ingen overrides/replacements/missing), UANSETT
 * hva som er registrert i «Mine plagg». Selve registreringen (ownership.ts)
 * forblir ubegrenset gratis (F81.1) — kun SUBSTITUSJONEN her er gatet.
 * UI-inngangen (paywall trigger='garderobe_tilpasning') ligger i
 * MinGarderobeScreen.tsx.
 */

import type { LayerOverrides, Recommendation } from '../wool-layers/types.js';
import { getAlternatives } from '../wool-layers/alternatives.js';
import { isOwned } from './ownership.js';

const SAFETY_CRITICAL_RE = /sovepose|vinterkjøredress|vinterdress isolert|balaklava/i;

export interface OwnershipOverrideResult {
  overrides: LayerOverrides;
  /** Plagg som ble byttet, for UI-merknad. {original, replacement, layerId} */
  replacements: Array<{ original: string; replacement: string; layerId: string }>;
  /** Plagg som ikke kunne byttes (ikke eid + ingen alternativ + ikke safety). */
  missing: Array<{ name: string; layerId: string }>;
}

const NO_OVERRIDES: OwnershipOverrideResult = { overrides: {}, replacements: [], missing: [] };

export function buildOwnershipOverrides(
  childId: string,
  rec: Recommendation,
  isPremium: boolean,
): OwnershipOverrideResult {
  if (!isPremium) {
    // Gratis = standard-anbefaling, uendret. Se fil-docstring §F81.5-W2.
    return NO_OVERRIDES;
  }
  const overrides: LayerOverrides = {};
  const replacements: OwnershipOverrideResult['replacements'] = [];
  const missing: OwnershipOverrideResult['missing'] = [];

  for (const layer of rec.layers) {
    if (layer.items.length === 0) continue;
    const newItems: string[] = [];
    let touched = false;
    for (const item of layer.items) {
      if (isOwned(childId, item)) {
        newItems.push(item);
        continue;
      }
      // Ikke eid — sjekk safety
      if (SAFETY_CRITICAL_RE.test(item)) {
        // Behold uansett — UI viser «dere mangler denne»
        newItems.push(item);
        missing.push({ name: item, layerId: layer.category });
        continue;
      }
      // Forsøk alternativ
      const alts = getAlternatives(item);
      const ownedAlt = alts?.alternatives.find((a) => isOwned(childId, a.name));
      if (ownedAlt) {
        newItems.push(ownedAlt.name);
        replacements.push({ original: item, replacement: ownedAlt.name, layerId: layer.category });
        touched = true;
      } else {
        // Ingen eid alternativ — behold original + flag missing
        newItems.push(item);
        missing.push({ name: item, layerId: layer.category });
      }
    }
    if (touched) {
      overrides[layer.category as keyof LayerOverrides] = newItems;
    }
  }

  return { overrides, replacements, missing };
}
