/**
 * Phase 2 — Layer peel-stages.
 *
 * En «peel-stage» beskriver hvilke lag som er VISBARE på avataren
 * akkurat nå. Bruker den eksisterende A-tier-PNG-sekvensen (A1-A7) som
 * progressiv peel i stedet for å generere separate transparent-lag-PNG.
 *
 * Standard sekvens (peel-down):
 *   all          → nåværende tier (alt på)
 *   no-outer     → ytterste lag av (tier - light-outer)
 *   no-mid       → ytter + mellomlag av (kun innerst + evt hodeplagg)
 *   innerst-only → kun innerste lag synlig (A1 / A2 avhengig av hodeplagg)
 */

import type { AvatarTier } from './avatar-tier';
import type { LayerId } from './outfit-state';

export type PeelStage = 'all' | 'no-outer' | 'no-mid' | 'innerst-only';

/**
 * Map fra (current tier, stage) til hvilken tier-PNG som skal vises.
 *
 * Strategi: hver «peel-down»-stage trapper ned én tier-bånd:
 *   A5 vinter         → A4 light → A3 mid     → A2 mild       → A1 sommer
 *   A6 ekstrem vinter → A5 vinter → A4 light  → A3 mid        → A2/A1
 *   A4 lett yttertøy  → A3 mid    → A2 mild   → A1 sommer
 *   A3 mid            → A2 mild   → A1 sommer → A1 (same)
 *   A2 mild           → A1 sommer → A1        → A1 (same)
 *   A1 sommer         → A1 (peel-control vises ikke for A1)
 *   A7 søvn           → A5 vinter → A3 mid    → A1 sommer
 */
const TIER_PEEL_MAP: Record<AvatarTier, Record<PeelStage, AvatarTier>> = {
  A1: { 'all': 'A1', 'no-outer': 'A1', 'no-mid': 'A1', 'innerst-only': 'A1' },
  A2: { 'all': 'A2', 'no-outer': 'A1', 'no-mid': 'A1', 'innerst-only': 'A1' },
  A3: { 'all': 'A3', 'no-outer': 'A2', 'no-mid': 'A1', 'innerst-only': 'A1' },
  A4: { 'all': 'A4', 'no-outer': 'A3', 'no-mid': 'A2', 'innerst-only': 'A1' },
  A5: { 'all': 'A5', 'no-outer': 'A3', 'no-mid': 'A2', 'innerst-only': 'A1' },
  A6: { 'all': 'A6', 'no-outer': 'A4', 'no-mid': 'A2', 'innerst-only': 'A1' },
  A7: { 'all': 'A7', 'no-outer': 'A5', 'no-mid': 'A3', 'innerst-only': 'A1' },
};

export function tierForStage(currentTier: AvatarTier, stage: PeelStage): AvatarTier {
  return TIER_PEEL_MAP[currentTier][stage];
}

/**
 * Lag-IDer som er «synlige» (ikke dempet) for en gitt stage.
 * Brukes for å fade pins som peker på lag som er peelet av.
 */
export function visibleLayersForStage(stage: PeelStage): Set<LayerId> {
  // B-2 (2026-06-12): 'utstyr' er aldri "på avataren" — det er ekstern
  // (regntrekk på vognen). Alltid synlig uavhengig av peel-stage.
  switch (stage) {
    case 'all':
      return new Set<LayerId>(['innerst', 'mellomlag', 'yttertoy', 'ekstra', 'utstyr']);
    case 'no-outer':
      // Ytterste lag av — typisk «yttertøy» pin dempes.
      // Ekstra (hode/tilbehør) regnes som hode-lag, beholdes synlig.
      return new Set<LayerId>(['innerst', 'mellomlag', 'ekstra', 'utstyr']);
    case 'no-mid':
      // Ytter + mellomlag av. Innerst + tilbehør igjen.
      return new Set<LayerId>(['innerst', 'ekstra', 'utstyr']);
    case 'innerst-only':
      return new Set<LayerId>(['innerst', 'utstyr']);
  }
}

/**
 * Skal peel-control i det hele tatt vises? Kun hvis A2+ (det er noe å peele).
 * A1 har kun ett lag — peel gir ikke mening.
 */
export function shouldShowPeel(currentTier: AvatarTier): boolean {
  return currentTier !== 'A1';
}

export const STAGE_LABELS: Record<PeelStage, string> = {
  'all': 'Alle',
  'no-outer': 'Uten ytterste',
  'no-mid': 'Mellomlag av',
  'innerst-only': 'Kun innerst',
};

export const STAGE_ORDER: readonly PeelStage[] = ['all', 'no-outer', 'no-mid', 'innerst-only'];
