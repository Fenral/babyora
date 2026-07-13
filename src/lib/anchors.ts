/**
 * Pin-anchor-koordinater per LayerId.
 * Normalized 0–1 på avatar-PNG. (0,0) er top-left, (1,1) er bottom-right.
 *
 * Verdier kalibrert mot A-tier-PNG-ene (200x220 viewbox-stil).
 * Justeres ved første visuelle pass hvis pins overlapper plagg-detaljer.
 */
import type { LayerId } from './outfit-state';

export type Anchor = { x: number; y: number };

export const ANCHORS: Record<LayerId, Anchor> = {
  // Ekstra (lue, votter, hals, sovepose-hette): hodet/skuldre
  // — øverst, lett til venstre så pin og chip ikke kolliderer med tier-label.
  ekstra:    { x: 0.30, y: 0.18 },
  // Innerst (ullbody): bryst, midten
  innerst:   { x: 0.50, y: 0.42 },
  // Mellomlag (pyjamas/fleece): torso-side, magehøyde
  mellomlag: { x: 0.68, y: 0.58 },
  // Yttertøy (kjøredress, dress, sovepose): låret, sentrert
  // — Phase 1.5 fix: tidligere på bein (0.45,0.78) overlappet med mellomlag visuelt.
  yttertoy:  { x: 0.50, y: 0.78 },
  // B-2 (2026-06-12): utstyr (regntrekk/vognpose) — eksternt, plasseres
  // utenfor avatar-silhuetten (høyre side, lavt) som visuell metafor
  // for "ved siden av barnet, ikke på".
  utstyr:    { x: 0.92, y: 0.92 },
};
