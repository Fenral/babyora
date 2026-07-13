/**
 * P9.6 (2026-06-13): «Mine plagg» ownership-store.
 *
 * Bruker localStorage som første steg (Supabase-sync kommer senere).
 * Default: alle plagg eies. Toggle «har ikke» registreres som not-owned.
 *
 * F81.1 (2026-07-03): registrering av plagg (denne toggelen) er UBEGRENSET
 * gratis — ingen premium-gate på selve registreringen lenger. Premium-gating
 * av TILPASNINGEN av anbefalingen (bytte til eide alternativer) håndteres i
 * ownership-override.ts og kommer i F81.5.
 */

const KEY_PREFIX = 'babyora:owned:';

interface OwnedMap {
  /** Plagg-navn (lowercased) → false hvis IKKE eid. true er default. */
  [garmentName: string]: boolean;
}

function load(childId: string): OwnedMap {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + childId);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OwnedMap;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function save(childId: string, map: OwnedMap): void {
  try {
    localStorage.setItem(KEY_PREFIX + childId, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const norm = (name: string): string => name.trim().toLowerCase();

export function isOwned(childId: string, garmentName: string): boolean {
  const map = load(childId);
  const v = map[norm(garmentName)];
  return v !== false;
}

export function getNotOwnedCount(childId: string): number {
  const map = load(childId);
  return Object.values(map).filter((v) => v === false).length;
}

export function getNotOwnedList(childId: string): string[] {
  const map = load(childId);
  return Object.entries(map)
    .filter(([, v]) => v === false)
    .map(([k]) => k);
}

export type ToggleResult =
  | { ok: true; nowOwned: boolean }
  | { ok: false; reason: 'premium_required' };

/**
 * Toggle ownership. F81.1: registrering er UBEGRENSET gratis — denne
 * funksjonen utsteder aldri lenger `{ ok: false, reason: 'premium_required' }`.
 * `premium_required`-varianten står igjen i ToggleResult-typen for
 * bakoverkompatibilitet med kallsteder, men brukes ikke her.
 *
 * isPremium beholdt i signaturen for bakoverkompatibilitet — brukes ikke
 * lenger til gating i denne funksjonen.
 */
export function toggleOwnership(
  childId: string,
  garmentName: string,
  _isPremium: boolean,
): ToggleResult {
  const map = load(childId);
  const k = norm(garmentName);
  const currentlyOwned = map[k] !== false;
  if (currentlyOwned) {
    // F81.1: markering som «ikke eid» er alltid lov — ingen grense.
    map[k] = false;
  } else {
    // Marker som eid igjen — alltid lov (slipper paywall)
    delete map[k];
  }
  save(childId, map);
  return { ok: true, nowOwned: !currentlyOwned };
}

/**
 * F81.1: ingen gratis-grense lenger — registrering er ubegrenset.
 * Beholdt for bakoverkompatibilitet med kallsteder; returnerer Infinity.
 */
export function getFreeLimit(): number {
  return Infinity;
}
