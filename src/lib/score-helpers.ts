/**
 * Score-helpers — pure data + content utilities, design-agnostic.
 *
 * Split fra lib/babyora-design/helpers.ts under redesign/mobbin-2026-06.
 * Beholder kun funksjoner som er rene data-transforms eller språk-innhold.
 * Design-spesifikke helpers (scoreColor, metIconSrc) bygges på nytt i den
 * Mobbin-inspirerte visuelle basen.
 */

import type { Recommendation } from './wool-layers/types.js';

/**
 * Konverterer en wool-layers recommendation til en visuell lag-score 1-4.
 *
 * Mappingen baserer seg på antall fylte layer-kategorier:
 * - 1: kun innerst (varmt vær)
 * - 2: innerst + ev. mellomlag/ekstra (mildt)
 * - 3: innerst + mellomlag + yttertøy
 * - 4: alle 4 kategorier (kaldt vær)
 */
export function layerScoreFromRecommendation(rec: Recommendation): 1 | 2 | 3 | 4 {
  const filledCategories = rec.layers.filter((l) => l.items.length > 0).length;
  if (filledCategories <= 1) return 1;
  if (filledCategories === 2) return 2;
  if (filledCategories === 3) return 3;
  return 4;
}

/**
 * Tekstuell label for lag-score (NO).
 *
 * TODO: i18n-migrere når UI bruker det (lag i18n-keys
 * `babyora.layer.score{1-4}` i src/i18n/locales/*.json).
 */
export function scoreLabel(score: 1 | 2 | 3 | 4): string {
  switch (score) {
    case 1: return 'Sommer';
    case 2: return 'Lett';
    case 3: return 'Middels';
    case 4: return 'Mye på';
  }
}

/**
 * Tid-basert greeting per Babyora-tone-guideline (warm-Norwegian).
 */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 10) return 'God morgen';
  if (hour >= 10 && hour < 17) return 'God dag';
  if (hour >= 17 && hour < 22) return 'God kveld';
  return 'God natt';
}
