/**
 * OVERHEATING_SYSTEM_V1 — hard safety blocks
 *
 * Evidensbaserte regler som engine SKAL håndheve. Aldri overstyrbart fra UI.
 * Kjøres ETTER applyModifiers i recommend(). Mutating returnerer ny copy.
 *
 * Kilder:
 *   AAP-2022   = AAP Policy: Safe Sleep Practices and SIDS Risk Reduction (2022)
 *   NHS        = NHS UK — Reduce the risk of sudden infant death syndrome
 *   LT-RT      = Lullaby Trust — Room temperature for baby
 *   LT-TOG     = Lullaby Trust — Sleeping bag TOG-guide
 *   LT-PRAM    = Lullaby Trust — Don't cover the pram
 *   RN-AU      = Red Nose Australia — Safe sleeping
 *   RN-WRAP    = Red Nose Australia — Wrapping babies
 *   CDC-NICHD  = CDC / NICHD — Safe to Sleep
 *   AAP-HC     = AAP HealthyChildren.org
 *   ASTM-2024  = ASTM federal ban on weighted infant sleep products
 *   NHTSA      = National Highway Traffic Safety Administration
 *   POLICY     = Babyora produktpolicy (begrunnet, ikke direkte evidens)
 */

import type { Layer, Note, NoteCategory, RecommendInput } from './types.js';

export type Severity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SafetySource =
  | 'AAP-2022' | 'NHS' | 'LT-RT' | 'LT-TOG' | 'LT-PRAM'
  | 'RN-AU' | 'RN-WRAP' | 'CDC-NICHD' | 'AAP-HC'
  | 'ASTM-2024' | 'NHTSA' | 'Pediatrics-Pram' | 'IHDI' | 'POLICY';

export type SafetyFlag = {
  code: string;
  message: string;
  sources: SafetySource[];
  severity: Severity;
  category: NoteCategory;
  /** F28.23 V0 P1 #5: hvis false, vises ikke i sheet UI (engine-splaining
   *  som forklarer hvorfor motoren IKKE valgte noe — distraherer foreldre).
   *  Beholdes i safetyFlags-array for debug/analytics. Default: true. */
  displayInSheet?: boolean;
};

export type SafetyResult = {
  layers: Layer[];
  notes: Note[];
  flags: SafetyFlag[];
  severity: Severity;
};

const HEAD_COVER_RE = /(^|\s)(lue|balaklava|beanie|caps|hat|solhatt)/i;
const BLANKET_RE = /(teppe|pledd|dunteppe)/i;
const SOVEPOSE_RE = /^sovepose/i;
const WEIGHTED_RE = /(weighted|vektet|tyngdeteppe|tyngde)/i;
const SOFT_OBJECT_RE = /(\bpute\b|kosedyr|bumper|\bleke\b|stuffed)/i;
const SWADDLE_RE = /(svøp|swaddle)/i;
// HB-8: matcher BÅDE eksplisitte kalesje-dekke-strenger OG faktiske plagg
// (dunteppe, tynt teppe) som havner over kalesjen i praksis. Trigger kun ved
// feels ≥ 22 °C — i kuldevær er teppe over vogn ikke samme SIDS-risiko.
const PRAM_COVER_RE = /(dunteppe|tynt teppe|teppe over kalesje|dekke over kalesje|kalesje-dekke)/i;
const STRANGULATION_RE = /(snor|drawstring|løs hals|løs buff|hette med snor)/i;
const THICK_WINTER_OUTER_RE = /(vinterdress|vinterkjøredress|tykk dunjakke)/i;

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ category: l.category, items: [...l.items] }));
}

function hasAny(layers: Layer[], re: RegExp): boolean {
  return layers.some((l) => l.items.some((i) => re.test(i)));
}

function removeMatching(layers: Layer[], re: RegExp): boolean {
  let removed = false;
  for (const layer of layers) {
    const before = layer.items.length;
    layer.items = layer.items.filter((i) => !re.test(i));
    if (layer.items.length !== before) removed = true;
  }
  return removed;
}

function dedupeMatching(layers: Layer[], re: RegExp): boolean {
  let seen = false;
  let removedAny = false;
  for (const layer of layers) {
    layer.items = layer.items.filter((i) => {
      if (!re.test(i)) return true;
      if (!seen) { seen = true; return true; }
      removedAny = true;
      return false;
    });
  }
  return removedAny;
}

function pushNote(notes: Note[], category: NoteCategory, message: string): void {
  if (!notes.some((n) => n.message === message)) {
    notes.push({ category, message });
  }
}

const SEVERITY_RANK: Record<Severity, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/**
 * Hovedfunksjon: anvender hard blocks på en allerede-modifier-kjørt
 * recommendation. Returnerer ny copy + flags + severity.
 *
 * Kjøres som siste steg i recommend() før pakking av Recommendation.
 */
export function applySafety(
  input: RecommendInput,
  inLayers: Layer[],
  inNotes: Note[],
): SafetyResult {
  const layers = cloneLayers(inLayers);
  const notes = [...inNotes];
  const flags: SafetyFlag[] = [];
  let severity: Severity = 'NONE';

  // HB-1: ingen hodeplagg under søvn innendørs
  if (input.activity === 'soevn' && hasAny(layers, HEAD_COVER_RE)) {
    removeMatching(layers, HEAD_COVER_RE);
    const msg = 'Ikke hodeplagg under søvn innendørs — hodet er babys varme-avgivelse.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-1',
      message: msg,
      sources: ['AAP-2022', 'NHS', 'LT-RT'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-2: ingen tepper over sovepose
  if (hasAny(layers, SOVEPOSE_RE) && hasAny(layers, BLANKET_RE)) {
    if (input.activity === 'soevn') {
      removeMatching(layers, BLANKET_RE);
    }
    const msg = 'Sovepose erstatter teppe — aldri begge.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-2',
      message: msg,
      sources: ['AAP-2022', 'LT-TOG', 'RN-AU', 'CDC-NICHD'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-3: aldri flere soveposer
  if (dedupeMatching(layers, SOVEPOSE_RE)) {
    const msg = 'Aldri flere soveposer samtidig — risiko for overoppheting.';
    pushNote(notes, 'overoppheting', msg);
    flags.push({
      code: 'HB-3',
      message: msg,
      sources: ['LT-TOG'],
      severity: 'CRITICAL',
      category: 'overoppheting',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-4: ingen vektede produkter
  if (hasAny(layers, WEIGHTED_RE)) {
    removeMatching(layers, WEIGHTED_RE);
    const msg = 'Aldri vektede produkter til baby — kveling- og restriksjon-risiko.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-4',
      message: msg,
      sources: ['AAP-2022', 'ASTM-2024'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-5: ingen myke gjenstander i seng
  if (input.activity === 'soevn' && hasAny(layers, SOFT_OBJECT_RE)) {
    removeMatching(layers, SOFT_OBJECT_RE);
    const msg = 'Tomt seng-prinsipp — ingen puter, kosedyr eller leker i sengen.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-5',
      message: msg,
      sources: ['AAP-2022', 'NHS', 'RN-AU', 'CDC-NICHD'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-6: stopp svøping når barnet kan rulle
  const isRolling =
    input.child.canRoll === true
    || (input.child.canRoll === undefined && input.child.ageMonths >= 4);
  if (hasAny(layers, SWADDLE_RE) && isRolling) {
    removeMatching(layers, SWADDLE_RE);
    const msg = 'Slutt med svøping når barnet viser tegn til å rulle.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-6',
      message: msg,
      sources: ['AAP-2022', 'RN-WRAP'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-7: svøp må tillate hofte-bevegelse + fri ansikt
  if (hasAny(layers, SWADDLE_RE) && !isRolling) {
    const msg = 'Svøp armer løse nok, hofter løse for naturlig bøying, ansikt fritt.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-7',
      message: msg,
      sources: ['RN-WRAP', 'IHDI'],
      severity: 'HIGH',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'HIGH');
  }

  // HB-8: aldri dekk vogn i varme/sol (feels ≥ 22 °C)
  if (input.activity === 'vogn' && input.weather.feelsLikeC >= 22) {
    // Universell vogn-tildekkings-warning ved varme — SIDS-risiko
    const universalMsg = 'Aldri teppe over kalesjen — det blir en varmefelle. Bruk parasoll/solseil.';
    pushNote(notes, 'overoppheting', universalMsg);

    if (hasAny(layers, PRAM_COVER_RE)) {
      removeMatching(layers, PRAM_COVER_RE);
      const msg = 'Lett teppe over kalesjen kan øke innetemperaturen 4–15 °C over ambient innen 60 min.';
      pushNote(notes, 'overoppheting', msg);
      flags.push({
        code: 'HB-8',
        message: msg,
        sources: ['LT-PRAM', 'Pediatrics-Pram'],
        severity: 'CRITICAL',
        category: 'overoppheting',
      });
      severity = maxSeverity(severity, 'CRITICAL');
    }
  }

  // HB-10: aldri snorer/løse halsplagg under søvn — strangulerings-risiko
  if (input.activity === 'soevn' && hasAny(layers, STRANGULATION_RE)) {
    removeMatching(layers, STRANGULATION_RE);
    const msg = 'Aldri snorer eller løse halsplagg under søvn — strangulerings-risiko.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-10',
      message: msg,
      sources: ['AAP-2022', 'LT-RT'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // HB-9: aldri vinterdress / vinterkjøredress i bilstol
  if (input.context?.bilstol === true && hasAny(layers, THICK_WINTER_OUTER_RE)) {
    removeMatching(layers, THICK_WINTER_OUTER_RE);
    const msg = 'I bilstolen: tynne lag + sele tett. Legg dressen over som teppe etter at selen er stram.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push({
      code: 'HB-9',
      message: msg,
      sources: ['AAP-HC', 'NHTSA'],
      severity: 'CRITICAL',
      category: 'sikkerhet',
    });
    severity = maxSeverity(severity, 'CRITICAL');
  }

  return { layers, notes, flags, severity };
}
