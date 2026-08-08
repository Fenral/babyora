import { applyModifiers } from './modifiers.js';
import { applyConflicts } from './conflicts.js';
import { applySoftBlocks } from './softBlocks.js';
import { applySafety } from './safety.js';
import { finalizeSafety } from './finalize-safety.js';
import { applyMaterialPreference } from './material-preference.js';
import type { SafetyFlag, Severity } from './safety.js';
import { bandForTemp, baseTable } from './tables.js';
import type { LayerOverrides, Recommendation, RecommendInput } from './types.js';

const SEVERITY_RANK: Record<Severity, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

function highestSeverity(flags: SafetyFlag[]): Severity {
  let max: Severity = 'NONE';
  for (const f of flags) {
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[max]) max = f.severity;
  }
  return max;
}

const ACTIVITY_LABEL: Record<RecommendInput['activity'], string> = {
  vogn: 'Vogn',
  baeresele: 'Bæresele',
  utelek: 'Utelek',
  soevn: 'Søvn',
};

function summarize(layers: Recommendation['layers']): string {
  const parts: string[] = [];
  for (const layer of layers) {
    if (layer.items.length === 0) continue;
    parts.push(layer.items.join(', '));
  }
  return parts.join(' • ');
}

/**
 * Hovedanbefalingsfunksjon.
 * Ren funksjon — samme input gir alltid samme output. Ingen IO, ingen Date.now().
 *
 * B-1 (2026-06-12): `options.overrides` lar UI overstyre items per kategori
 * etter motoren har valgt. Overskrivinger anvendes ETTER conflicts/soft-blocks/
 * safety, slik at bruker-valg overstyrer motor men IKKE sikkerhets-fjerning.
 */
export function recommend(
  input: RecommendInput,
  options?: { overrides?: LayerOverrides },
): Recommendation {
  validateInput(input);

  const band = bandForTemp(input.weather.feelsLikeC);

  // Iter 33 — vogn-sover: hent base-outfit fra soevn-tabellen (temp-aware
  // sovepose), men behold input.activity = 'vogn' så outdoor-modifiers
  // (vind/regn/sol) anvendes som vanlig vogn-tur. Ved tropisk temp gir
  // soevn-tabellen kortermet body alene — sovepose vises kun under varm-bånd.
  const isVognSleeping = input.activity === 'vogn' && input.vognMode === 'sleeping';
  const lookupActivity = isVognSleeping ? 'soevn' : input.activity;
  const base = baseTable[lookupActivity][band];
  const { layers: modLayers, structuredNotes: modNotes } = applyModifiers(base, input);
  const preferredLayers = applyMaterialPreference(modLayers, input.materialPreference, input);

  // Iter 35 — OVERHEATING_SYSTEM_V1 pipeline:
  //   modifiers → CONFLICTS → SOFT_BLOCKS → HARD_BLOCKS (safety)
  // CONFLICTS løser kombinasjons-risiko (CK-1..CK-9).
  // SOFT_BLOCKS justerer for temp/aktivitet/alder (SB-1..SB-7).
  // SAFETY håndhever ufravikelige hard blocks (HB-1..HB-9).
  const conflicted = applyConflicts(input, preferredLayers, modNotes);
  const softened = applySoftBlocks(input, conflicted.layers, conflicted.notes);
  const safe = applySafety(input, softened.layers, softened.notes);
  const allFlags = [...conflicted.flags, ...softened.flags, ...safe.flags];

  // B-1 (2026-06-12): bruker-overrides etter safety. Bevarer kategori-rekkefølge
  // og fjerner kategori om override er tom array.
  let finalLayers = safe.layers;
  let finalNotes = safe.notes;
  let finalFlags = allFlags;
  const hasOverrides = options?.overrides !== undefined;
  if (options?.overrides) {
    finalLayers = applyOverrides(safe.layers, options.overrides);
  }

  // P9.5 (2026-06-13): per-barn-kalibrering (-1/0/+1). Aldri overstyrer
  // safety/innerst-minimum. +1 fjerner et lett yttertøy ved varme tilstander
  // (paradoks: barnet er rapportert kaldt → motoren la til for lite → vi
  // beholder ekstra lag). -1 trekker fra et lett mellomlag når mulig.
  if (input.childCalibration) {
    finalLayers = applyCalibration(finalLayers, input.childCalibration, input);
  }

  // R2 (2026-07-14): ENDELIG SIKKERHETSGRENSE. Overrides og kalibrering er
  // post-safety-mutasjoner — alt som muterte laget etter applySafety skal
  // gjennom finalizeSafety som SISTE steg, slik at conflicts/soft-blocks/
  // hard-safety aldri kan omgås (G1–G7 i guardrail-matrisen). Uten mutasjon
  // hoppes grensen over → byte-identisk med før-containment (G10).
  if (hasOverrides || input.childCalibration) {
    const finalized = finalizeSafety(input, finalLayers, finalNotes, finalFlags);
    finalLayers = finalized.layers;
    finalNotes = finalized.notes;
    finalFlags = finalized.flags;
  }

  const tempPrefix = input.activity === 'soevn' ? 'romtemp' : 'føles';
  const activityLabel = isVognSleeping
    ? 'Vogn (sover)'
    : ACTIVITY_LABEL[input.activity];
  const summary = `${activityLabel} (${input.weather.feelsLikeC.toFixed(0)} °C ${tempPrefix}): ${summarize(finalLayers)}`;

  // Iter 36 — severity må aggregere conflicts + soft + safety, ikke bare safety.
  // Gammelt safe.severity reflekterte kun HB-flags, så CK-7/SB-3 HIGH ble usynlig.
  const aggregateSeverity = highestSeverity(finalFlags);

  return {
    activity: input.activity,
    tempBand: band,
    layers: finalLayers,
    notes: finalNotes.map((n) => n.message),
    structuredNotes: finalNotes,
    summary,
    safetyFlags: finalFlags,
    severity: aggregateSeverity,
  };
}

/**
 * P9.5: Anvend per-barn-kalibrering.
 *
 * Konservativt design:
 * - +1 (barn ofte for kaldt): legg til 'ekstra varmepose' eller 'hals' hvis
 *   ikke allerede der. Aldri fjern noe.
 * - -1 (barn ofte for varmt): fjern ÉTT lett mellomlag-element hvis
 *   mellomlag har > 1 items. Aldri fjern innerst eller eneste yttertøy.
 *   Aldri ved bilstol-kontekst (HB-9 har allerede gjort safety-arbeid).
 *
 * Sikkerhets-test: motoren har allerede kjørt applySafety FØR dette.
 * Vi rører ikke yttertoy (vinterkjøredress osv) eller innerst.
 */
function applyCalibration(
  layers: Recommendation['layers'],
  bias: -1 | 0 | 1,
  input: RecommendInput,
): Recommendation['layers'] {
  if (bias === 0) return layers;
  const result = layers.map((l) => ({ category: l.category, items: [...l.items] }));
  if (bias === 1) {
    // Mer beskyttelse: legg 'ekstra hals' hvis ikke allerede
    const ekstra = result.find((l) => l.category === 'ekstra');
    const hasNeckwear = ekstra?.items.some((i) => /hals|balaclava|balaklava/i.test(i));
    if (ekstra && !hasNeckwear && input.weather.feelsLikeC < 8) {
      ekstra.items.push('halsedisse (kalibrert)');
    }
  } else if (bias === -1) {
    // Mindre beskyttelse: fjern ett mellomlag-item om mulig
    const mellom = result.find((l) => l.category === 'mellomlag');
    if (mellom && mellom.items.length > 1) {
      mellom.items.pop();
    }
  }
  return result.filter((l) => l.items.length > 0);
}

/**
 * B-1: Anvend bruker-overrides på lag-lista.
 *
 * Semantikk:
 * - Override-items erstatter motorens items helt for den kategorien
 * - Tom array fjerner kategorien (bruker har «slått av» yttertøy)
 * - Kategorier ikke nevnt i overrides forblir uendret
 */
function applyOverrides(
  layers: Recommendation['layers'],
  overrides: LayerOverrides,
): Recommendation['layers'] {
  const result = layers.map((l) => ({ category: l.category, items: [...l.items] }));
  for (const [category, items] of Object.entries(overrides)) {
    if (!items) continue;
    const existing = result.find((l) => l.category === category);
    if (existing) {
      existing.items = [...items];
    } else if (items.length > 0) {
      result.push({ category: category as Recommendation['layers'][number]['category'], items: [...items] });
    }
  }
  // Fjerne tomme kategorier
  return result.filter((l) => l.items.length > 0);
}

function validateInput(input: RecommendInput): void {
  const { weather, child, activity } = input;

  if (!Number.isFinite(weather.feelsLikeC)) {
    throw new Error('weather.feelsLikeC må være et tall');
  }
  if (!Number.isFinite(weather.tempC)) {
    throw new Error('weather.tempC må være et tall');
  }
  if (!Number.isFinite(weather.windMs) || weather.windMs < 0) {
    throw new Error('weather.windMs må være et tall ≥ 0');
  }
  if (!Number.isFinite(weather.precipMmH) || weather.precipMmH < 0) {
    throw new Error('weather.precipMmH må være et tall ≥ 0');
  }
  // Iter 32a: motoren krasjer ikke for alder >24, men UI skal soft-warne.
  // Validering tillater fortsatt opp til 60 (5 år) for fremtidig Babyora Junior-kompat.
  if (!Number.isInteger(child.ageMonths) || child.ageMonths < 0 || child.ageMonths > 60) {
    throw new Error('child.ageMonths må være et heltall mellom 0 og 60');
  }
  if (!['vogn', 'baeresele', 'utelek', 'soevn'].includes(activity)) {
    throw new Error(`activity må være vogn, baeresele, utelek eller soevn (fikk: ${activity})`);
  }
}
