/**
 * Motor 2.0 — strukturert plaggkatalog (design-spec §10).
 *
 * Eksplisitt data — ingen resolver får bruke norsk labeltekst til å avgjøre
 * materiale eller funksjon (invariant 8). `legacyNameNb` gjenbruker eksakte
 * strenger fra legacy-motoren der plagget finnes der (adapteren i Task 11
 * mapper 1:1); nye ullfrie varianter har ærlige norske navn.
 *
 * `illustrationId: null` = nøytralt fallback-ikon (spec §17). Ingen variant
 * får en illustrasjon som visuelt påstår feil materiale (G34); wool-varianter
 * kobles til eksisterende illustrasjoner først i UI-fasen (R7) etter manuell
 * kontroll.
 *
 * Fottøyreglene under 9 / 9–15 / 16+ måneder er finere enn aldersstadiene og
 * håndheves i garment-resolveren (Task 7) — validAgeStages er grovfilteret.
 */

import type { GarmentVariant } from './types.js';

const ALL = ['newborn', 'mobile_baby', 'young_toddler'] as const;
const FROM_MOBILE = ['mobile_baby', 'young_toddler'] as const;
const TODDLER = ['young_toddler'] as const;

function v(item: GarmentVariant): Readonly<GarmentVariant> {
  return Object.freeze({ ...item, validAgeStages: Object.freeze([...item.validAgeStages]) as GarmentVariant['validAgeStages'] });
}

export const GARMENT_VARIANTS: readonly Readonly<GarmentVariant>[] = Object.freeze([
  // ── Base (innerst) ─────────────────────────────────────────────────────────
  v({ id: 'base-fullbody-wool-1-thin', role: 'base_fullbody', material: 'wool', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tynt ullsett', illustrationId: null }),
  v({ id: 'base-fullbody-wool-2-thick', role: 'base_fullbody', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tykt ullsett', illustrationId: null }),
  v({ id: 'base-fullbody-synthetic-1', role: 'base_fullbody', material: 'synthetic_wicking', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'teknisk undertøysett', illustrationId: null }),
  v({ id: 'base-fullbody-synthetic-2', role: 'base_fullbody', material: 'synthetic_wicking', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tykt teknisk undertøysett', illustrationId: null }),
  v({ id: 'base-fullbody-cotton-0-short', role: 'base_fullbody', material: 'cotton', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'kortermet body', illustrationId: null }),
  v({ id: 'base-fullbody-cotton-1-long', role: 'base_fullbody', material: 'cotton', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'langermet body', illustrationId: null }),
  v({ id: 'base-top-cotton-0-tshirt', role: 'base_top', material: 'cotton', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...FROM_MOBILE], legacyNameNb: 't-skjorte', illustrationId: null }),
  v({ id: 'base-bottom-cotton-0-shorts', role: 'base_bottom', material: 'cotton', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...FROM_MOBILE], legacyNameNb: 'shorts', illustrationId: null }),
  v({ id: 'base-bottom-cotton-1-thin', role: 'base_bottom', material: 'cotton', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'tynn bukse', illustrationId: null }),

  // ── Mellomlag ──────────────────────────────────────────────────────────────
  v({ id: 'mid-fullbody-wool-1-thin', role: 'mid_fullbody', material: 'wool', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tynt ull-mellomlag', illustrationId: null }),
  v({ id: 'mid-fullbody-wool-2', role: 'mid_fullbody', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'ull-mellomlag', illustrationId: null }),
  v({ id: 'mid-fullbody-wool-3-thick', role: 'mid_fullbody', material: 'wool', warmth: 3, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tykt ull-mellomlag', illustrationId: null }),
  v({ id: 'mid-fullbody-fleece-1', role: 'mid_fullbody', material: 'fleece', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'tynt fleecesett', illustrationId: null }),
  v({ id: 'mid-fullbody-fleece-2', role: 'mid_fullbody', material: 'fleece', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'fleecesett', illustrationId: null }),
  v({ id: 'mid-top-wool-2-jacket', role: 'mid_top', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'ull-jakke', illustrationId: null }),
  v({ id: 'mid-top-fleece-2-jacket', role: 'mid_top', material: 'fleece', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'fleecejakke', illustrationId: null }),
  v({ id: 'mid-bottom-wool-2', role: 'mid_bottom', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'ull-bukse', illustrationId: null }),
  v({ id: 'mid-bottom-fleece-2', role: 'mid_bottom', material: 'fleece', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'fleecebukse', illustrationId: null }),

  // ── Skall (vær, ikke varme) ────────────────────────────────────────────────
  v({ id: 'shell-fullbody-rain', role: 'shell_fullbody', material: 'shell', warmth: 0, windproof: true, waterproof: true, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'regndress', illustrationId: null }),
  v({ id: 'shell-fullbody-wind', role: 'shell_fullbody', material: 'shell', warmth: 0, windproof: true, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'vinddress', illustrationId: null }),

  // ── Isolert yttertøy ───────────────────────────────────────────────────────
  v({ id: 'insulated-fullbody-syn-2-light', role: 'insulated_fullbody', material: 'synthetic_insulation', warmth: 2, windproof: true, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'kjøredress', illustrationId: null }),
  v({ id: 'insulated-fullbody-syn-3', role: 'insulated_fullbody', material: 'synthetic_insulation', warmth: 3, windproof: true, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'vinterkjøredress', illustrationId: null }),
  v({ id: 'insulated-fullbody-syn-4', role: 'insulated_fullbody', material: 'synthetic_insulation', warmth: 4, windproof: true, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'isolert vinterkjøredress', illustrationId: null }),
  v({ id: 'insulated-fullbody-down-4', role: 'insulated_fullbody', material: 'down', warmth: 4, windproof: true, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'isolert vinterdress', illustrationId: null }),

  // ── Hode ───────────────────────────────────────────────────────────────────
  v({ id: 'headwear-cotton-0-sun', role: 'headwear', material: 'cotton', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'solhatt', illustrationId: null }),
  v({ id: 'headwear-blend-1-thin', role: 'headwear', material: 'blend', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'tynn lue', illustrationId: null }),
  v({ id: 'headwear-wool-2', role: 'headwear', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'lue m/ ull', illustrationId: null }),
  v({ id: 'headwear-fleece-2', role: 'headwear', material: 'fleece', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'fleecelue', illustrationId: null }),
  v({ id: 'headwear-wool-3-balaclava', role: 'headwear', material: 'wool', warmth: 3, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'balaklava', illustrationId: null }),
  v({ id: 'headwear-blend-3-balaclava', role: 'headwear', material: 'blend', warmth: 3, windproof: true, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'vindtett balaklava', illustrationId: null }),

  // ── Hender ─────────────────────────────────────────────────────────────────
  v({ id: 'handwear-blend-1-thin', role: 'handwear', material: 'blend', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'tynne votter', illustrationId: null }),
  v({ id: 'handwear-fleece-1', role: 'handwear', material: 'fleece', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'fleecevotter', illustrationId: null }),
  v({ id: 'handwear-blend-2-thick', role: 'handwear', material: 'blend', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...ALL], legacyNameNb: 'tykke votter', illustrationId: null }),
  v({ id: 'handwear-down-3', role: 'handwear', material: 'down', warmth: 3, windproof: true, waterproof: false, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'votter dun', illustrationId: null }),
  v({ id: 'handwear-shell-0-rain', role: 'handwear', material: 'shell', warmth: 0, windproof: true, waterproof: true, moistureManagement: 'low', validAgeStages: [...ALL], legacyNameNb: 'regnvotter', illustrationId: null }),

  // ── Føtter (9/15/16-månedersreglene håndheves i resolveren) ────────────────
  v({ id: 'footwear-wool-1-socks', role: 'footwear', material: 'wool', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'ullsokker', illustrationId: null }),
  v({ id: 'footwear-wool-2-stockings', role: 'footwear', material: 'wool', warmth: 2, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'ullstrømper', illustrationId: null }),
  v({ id: 'footwear-syn-1-socks', role: 'footwear', material: 'synthetic_wicking', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'high', validAgeStages: [...ALL], legacyNameNb: 'tekniske sokker', illustrationId: null }),
  v({ id: 'footwear-blend-1-soft', role: 'footwear', material: 'blend', warmth: 1, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...FROM_MOBILE], legacyNameNb: 'tøffel-sko', illustrationId: null }),
  v({ id: 'footwear-blend-0-shoes', role: 'footwear', material: 'blend', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...TODDLER], legacyNameNb: 'sko', illustrationId: null }),
  v({ id: 'footwear-syn-3-winter', role: 'footwear', material: 'synthetic_insulation', warmth: 3, windproof: true, waterproof: true, moistureManagement: 'medium', validAgeStages: [...TODDLER], legacyNameNb: 'vintersko isolerte', illustrationId: null }),
  v({ id: 'footwear-blend-0-sandals', role: 'footwear', material: 'blend', warmth: 0, windproof: false, waterproof: false, moistureManagement: 'medium', validAgeStages: [...TODDLER], legacyNameNb: 'sandaler', illustrationId: null }),
]);
