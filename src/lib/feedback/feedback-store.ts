/**
 * P9.5 (2026-06-13): «Var det passe?» feedback-loop.
 *
 * Lagrer per-barn-feedback i localStorage (synces til Supabase senere).
 * Beregner kalibrerings-bias konservativt:
 *   - ≥ 3 konsistente svar samme retning innen 14 dager
 *   - Maks ±1 lag
 *   - Aldri under guardrail-minimum (sikkerhet trumfer)
 */

import type { Activity } from '../wool-layers/types.js';

export type FeedbackValue = 'kald' | 'passe' | 'varm';

export interface FeedbackEntry {
  date: string;       // YYYY-MM-DD lokal
  activity: Activity;
  feelsLikeC: number;
  layerCount: number;
  value: FeedbackValue;
  /** Tidspunkt i ms for konsistens-vinduet (14 dager). */
  tsMs: number;
}

const KEY_PREFIX = 'babyora:feedback:';
const BIAS_KEY_PREFIX = 'babyora:bias:';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_CONSISTENT = 3;

export type CalibrationBias = -1 | 0 | 1;

function loadEntries(childId: string): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + childId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(childId: string, entries: FeedbackEntry[]): void {
  try {
    localStorage.setItem(KEY_PREFIX + childId, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function getFeedback(childId: string): FeedbackEntry[] {
  return loadEntries(childId);
}

export function addFeedback(childId: string, entry: FeedbackEntry): void {
  const entries = loadEntries(childId);
  entries.push(entry);
  saveEntries(childId, entries);
  recomputeBias(childId);
}

export function clearFeedback(childId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + childId);
    localStorage.removeItem(BIAS_KEY_PREFIX + childId);
  } catch {
    // ignore
  }
}

/**
 * Last lagret bias for child. Returnerer 0 (ingen justering) hvis ikke aktivert.
 */
export function getBias(childId: string): CalibrationBias {
  try {
    const raw = localStorage.getItem(BIAS_KEY_PREFIX + childId);
    if (raw === '-1') return -1;
    if (raw === '1') return 1;
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Vurder feedback-historikk og oppdater bias. Trygg defaults:
 *   - Krever ≥ 3 svar samme retning innenfor 14 dager
 *   - Returnerer maks ±1
 *
 * - Hvis siste 3+ er «kald» → barnet er ofte kaldt → bias +1 (mer lag)
 * - Hvis siste 3+ er «varm» → barnet er ofte varmt → bias -1 (mindre lag)
 * - Hvis blandet eller «passe» → 0
 */
export function recomputeBias(childId: string, nowMs?: number): CalibrationBias {
  const now = nowMs ?? Date.now();
  const entries = loadEntries(childId).filter((e) => now - e.tsMs <= FOURTEEN_DAYS_MS);
  // Ta siste N (mest relevante)
  const recent = entries.slice(-MIN_CONSISTENT);
  let bias: CalibrationBias = 0;
  if (recent.length >= MIN_CONSISTENT) {
    if (recent.every((e) => e.value === 'kald')) bias = 1;
    else if (recent.every((e) => e.value === 'varm')) bias = -1;
  }
  try {
    if (bias === 0) localStorage.removeItem(BIAS_KEY_PREFIX + childId);
    else localStorage.setItem(BIAS_KEY_PREFIX + childId, String(bias));
  } catch {
    // ignore
  }
  return bias;
}
