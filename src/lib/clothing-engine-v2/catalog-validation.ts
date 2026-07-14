/**
 * Motor 2.0 — strukturell katalogvalidering.
 * Kjøres i test (Task 3) og kan kjøres i dev-verktøy. Returnerer en liste
 * menneskelesbare avvik; tom liste = gyldig katalog.
 */

import type { AgeStage, GarmentRole, GarmentVariant, MaterialFamily } from './types.js';

const ROLES: readonly GarmentRole[] = [
  'base_top', 'base_bottom', 'base_fullbody',
  'mid_top', 'mid_bottom', 'mid_fullbody',
  'shell_top', 'shell_bottom', 'shell_fullbody',
  'insulated_fullbody', 'headwear', 'handwear', 'footwear', 'equipment',
];

const MATERIALS: readonly MaterialFamily[] = [
  'wool', 'synthetic_wicking', 'fleece', 'cotton',
  'shell', 'synthetic_insulation', 'down', 'blend',
];

const STAGES: readonly AgeStage[] = ['newborn', 'mobile_baby', 'young_toddler'];
const MOISTURE = ['low', 'medium', 'high'] as const;
const WOOL_ILLUSTRATION_RE = /ull|wool/i;

export function validateCatalog(variants: readonly GarmentVariant[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const item of variants) {
    const id = item.id || '(uten id)';
    if (seen.has(item.id)) issues.push(`duplikat variant-ID: ${id}`);
    seen.add(item.id);

    if (!item.id || !/^[a-z0-9-]+$/.test(item.id)) {
      issues.push(`${id}: ID må være stabil kebab-case`);
    }
    if (!ROLES.includes(item.role)) issues.push(`${id}: ugyldig rolle ${String(item.role)}`);
    if (!MATERIALS.includes(item.material)) issues.push(`${id}: ugyldig materialfamilie ${String(item.material)}`);
    if (!Number.isInteger(item.warmth) || item.warmth < 0 || item.warmth > 4) {
      issues.push(`${id}: warmth må være heltall 0–4`);
    }
    if (!MOISTURE.includes(item.moistureManagement)) {
      issues.push(`${id}: ugyldig moistureManagement`);
    }
    if (item.validAgeStages.length === 0 || item.validAgeStages.some((s) => !STAGES.includes(s))) {
      issues.push(`${id}: validAgeStages må være ikke-tom delmengde av stadiene`);
    }
    if (!item.legacyNameNb || item.legacyNameNb.trim().length === 0) {
      issues.push(`${id}: mangler norsk label`);
    }
    if (item.illustrationId !== null && typeof item.illustrationId !== 'string') {
      issues.push(`${id}: illustrationId må være streng eller null`);
    }
    // G34-vernet: en ikke-ull-variant kan aldri peke på en ullillustrasjon.
    if (item.material !== 'wool' && item.illustrationId && WOOL_ILLUSTRATION_RE.test(item.illustrationId)) {
      issues.push(`${id}: ikke-ull-variant med ullillustrasjon (${item.illustrationId})`);
    }
    // Strukturell materialsannhet: skall er shell-familie og vindtett.
    if (item.role.startsWith('shell_') && (item.material !== 'shell' || !item.windproof)) {
      issues.push(`${id}: shell-rolle krever shell-materiale og windproof`);
    }
  }
  return issues;
}
