/**
 * OVERHEATING_SYSTEM_V1 — Combination conflicts (CK-1..CK-9)
 *
 * Konflikt-graf som kjøres FØR safety. Løser plagg-kombinasjoner som er
 * usikre eller produktpolicy-motstridige.
 *
 * Klassifisering per regel:
 *   - evidence  = direkte medisinsk kilde
 *   - policy    = Babyora produktpolicy (begrunnet med prinsipp)
 */

import type { Layer, Note, NoteCategory, RecommendInput } from './types.js';
import type { SafetyFlag, SafetySource } from './safety.js';

const SOVEPOSE_RE = /^sovepose/i;
const BLANKET_RE = /(teppe|pledd|dunteppe)/i;
const HAT_INDOOR_RE = /(^|\s)(lue|balaklava|beanie|caps|hat)/i;
const VARMEPOSE_RE = /varmepose/i;
const DUNTEPPE_RE = /^dunteppe/i;
const PYJAMAS_RE = /pyjamas/i;
const BARNEJAKKE_RE = /(barnejakke|barnets jakke)/i;

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ category: l.category, items: [...l.items] }));
}

function hasAny(layers: Layer[], re: RegExp): boolean {
  return layers.some((l) => l.items.some((i) => re.test(i)));
}

function removeMatching(layers: Layer[], re: RegExp): void {
  for (const layer of layers) {
    layer.items = layer.items.filter((i) => !re.test(i));
  }
}

function pushNote(notes: Note[], category: NoteCategory, message: string): void {
  if (!notes.some((n) => n.message === message)) {
    notes.push({ category, message });
  }
}

function togFromSovepose(s: string): number {
  const m = s.match(/(\d+\.?\d*)\s*TOG/i);
  return m ? parseFloat(m[1]) : 0;
}

function maxTOGForRoom(roomC: number): number {
  if (roomC >= 26) return 0;
  if (roomC >= 24) return 0.5;
  if (roomC >= 21) return 1.0;
  if (roomC >= 18) return 2.5;
  if (roomC >= 16) return 2.5;
  return 3.5;
}

export type ConflictResult = {
  layers: Layer[];
  notes: Note[];
  flags: SafetyFlag[];
};

function flag(
  code: string,
  message: string,
  sources: SafetySource[],
  category: NoteCategory = 'sikkerhet',
): SafetyFlag {
  return { code, message, sources, severity: 'HIGH', category };
}

/**
 * Anvender 9 kombinasjonskonflikter på input-laget. Kjøres FØR safety i
 * recommend-pipelinen.
 */
export function applyConflicts(
  input: RecommendInput,
  inLayers: Layer[],
  inNotes: Note[],
): ConflictResult {
  const layers = cloneLayers(inLayers);
  const notes = [...inNotes];
  const flags: SafetyFlag[] = [];

  // CK-1: sovepose × teppe [evidence]
  if (hasAny(layers, SOVEPOSE_RE) && hasAny(layers, BLANKET_RE)) {
    removeMatching(layers, BLANKET_RE);
    const msg = 'Sovepose erstatter teppe — aldri begge.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push(flag('CK-1', msg, ['LT-TOG', 'AAP-2022']));
  }

  // CK-2: to soveposer [evidence] — håndteres i safety dedupe (HB-3)

  // CK-3: TOG for høy vs romtemp (kun soevn) [evidence]
  if (input.activity === 'soevn') {
    const roomC = input.weather.feelsLikeC;
    const maxAllowed = maxTOGForRoom(roomC);
    for (const layer of layers) {
      const sovepose = layer.items.find((i) => SOVEPOSE_RE.test(i));
      if (sovepose) {
        const tog = togFromSovepose(sovepose);
        if (tog > maxAllowed) {
          if (maxAllowed === 0) {
            layer.items = layer.items.filter((i) => !SOVEPOSE_RE.test(i));
            const msg = `Romtemp ${roomC.toFixed(0)} °C er for varmt for sovepose — kortermet body alene.`;
            pushNote(notes, 'overoppheting', msg);
            flags.push(flag('CK-3', msg, ['LT-TOG'], 'overoppheting'));
          } else {
            const replacement = `sovepose ${maxAllowed.toFixed(1)} TOG`;
            layer.items = layer.items.map((i) => (SOVEPOSE_RE.test(i) ? replacement : i));
            const msg = `Sovepose justert ned til ${maxAllowed.toFixed(1)} TOG for romtemp ${roomC.toFixed(0)} °C.`;
            pushNote(notes, 'overoppheting', msg);
            flags.push(flag('CK-3', msg, ['LT-TOG'], 'overoppheting'));
          }
        }
      }
    }
  }

  // CK-4: sovepose × hodeplagg innendørs [evidence]
  if (input.activity === 'soevn' && hasAny(layers, SOVEPOSE_RE) && hasAny(layers, HAT_INDOOR_RE)) {
    removeMatching(layers, HAT_INDOOR_RE);
    const msg = 'Hodeplagg innendørs blokkerer varme-avgivelse — fjernet.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push(flag('CK-4', msg, ['AAP-2022', 'LT-RT']));
  }

  // CK-5: varmepose × dunteppe i vogn [policy]
  // Alltid behold varmepose, alltid fjern dunteppe. Stable insulasjon over
  // varmepose er en kjent SIDS-trigger (overheating + tildekking av vogn).
  if (input.activity === 'vogn' && hasAny(layers, VARMEPOSE_RE) && hasAny(layers, DUNTEPPE_RE)) {
    removeMatching(layers, DUNTEPPE_RE);
    const msg = 'Velg én — varmepose ER varmen. Dunteppe over varmepose stabler insulasjon og kan overheate.';
    pushNote(notes, 'overoppheting', msg);
    flags.push(flag('CK-5', msg, ['LT-PRAM', 'POLICY'], 'overoppheting'));
  }

  // CK-6: 2-ullsett stack kun ved feels ≤ -15 [policy]
  if (input.weather.feelsLikeC > -15 && hasAny(layers, /^to ullsett/i)) {
    for (const layer of layers) {
      layer.items = layer.items.map((i) =>
        /^to ullsett/i.test(i) ? 'tykt ullsett' : i,
      );
    }
    const msg = 'To ullsett er forbeholdt ekstrem frost (≤-15 °C) — ett ullsett brukt.';
    pushNote(notes, 'overoppheting', msg);
    // F28.23 V0 P1 #5: CK-6 forklarer at motoren reduserte fra to-til-ett
    // ullsett — interesserer ingen forelder ved −6°. Beholdes for debug
    // men SKJULES i sheet UI via displayInSheet=false.
    flags.push({ ...flag('CK-6', msg, ['POLICY'], 'overoppheting'), displayInSheet: false });
  }

  // CK-7: vinterdress × bilstol — håndteres i safety (HB-9)
  // (her gjentas ikke; HB-9 er definitiv)

  // CK-8: TOG ≥ 2.5 × pyjamas i mildt rom [evidence]
  if (input.activity === 'soevn' && input.weather.feelsLikeC > 21) {
    let hasHighTog = false;
    for (const layer of layers) {
      for (const item of layer.items) {
        if (SOVEPOSE_RE.test(item) && togFromSovepose(item) >= 2.5) hasHighTog = true;
      }
    }
    if (hasHighTog && hasAny(layers, PYJAMAS_RE)) {
      for (const layer of layers) {
        layer.items = layer.items.map((i) =>
          PYJAMAS_RE.test(i) && layer.category === 'mellomlag' ? 'kortermet body' : i,
        );
      }
      const msg = 'Pyjamas erstattet med kortermet body — sovepose-TOG gir nok varme i mildt rom.';
      pushNote(notes, 'overoppheting', msg);
      flags.push(flag('CK-8', msg, ['LT-TOG'], 'overoppheting'));
    }
  }

  // CK-9: bæresele × innerJakke × barnejakke [policy]
  if (input.activity === 'baeresele' && input.innerJakke && hasAny(layers, BARNEJAKKE_RE)) {
    removeMatching(layers, BARNEJAKKE_RE);
    const msg = 'Du varmer barnet med kroppen — barnejakke fjernet for å unngå overoppheting.';
    pushNote(notes, 'overoppheting', msg);
    flags.push(flag('CK-9', msg, ['RN-AU', 'POLICY'], 'overoppheting'));
  }

  return { layers, notes, flags };
}
