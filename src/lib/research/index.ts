/**
 * Babyora research-modul — strukturerte forsknings-data konsolidert fra 11
 * kilder (jun 2026). Se RESEARCH.md i prosjekt-roten for full prose-rapport.
 *
 * Eksponert via denne public API'en:
 * - SOURCES — citation-database, 11 kilder
 * - AGE_BANDS — 6 alderbånd 0-24 mnd med fysiologi
 * - TOG_TABLE — TOG-anbefalinger per romtemp
 * - SAFETY_FLAGS — strukturert warning-katalog
 *
 * Helper-funksjoner:
 * - getSource(id), sourcesByType(type)
 * - bandForAgeMonths(months)
 * - togForRoomTemp(tempC)
 * - getSafetyFlag(id), flagsByCategory(cat), flagsForAge(months)
 */

export * from './sources';
export * from './age-thermoregulation';
export * from './tog-table';
export * from './safety-flags';
