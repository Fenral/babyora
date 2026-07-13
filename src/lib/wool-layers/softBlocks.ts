/**
 * OVERHEATING_SYSTEM_V1 — Soft blocks (SB-1..SB-6)
 *
 * Justeringer som reduserer/justerer lag, ikke total avvisning.
 * Kjøres MELLOM conflicts og hard safety.
 */

import type { Layer, Note, NoteCategory, RecommendInput } from './types.js';
import type { SafetyFlag, SafetySource, Severity } from './safety.js';

const SOVEPOSE_RE = /^sovepose/i;
const VARMEPOSE_LETT_RE = /^varmepose lett/i;
const DUNTEPPE_RE = /^dunteppe/i;
const TYNT_TEPPE_RE = /^tynt teppe/i;
const TYKK_RE = /(tykt|tykke|isolert)/i;

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ category: l.category, items: [...l.items] }));
}

function removeFirstMatching(layers: Layer[], regexes: RegExp[]): boolean {
  for (const re of regexes) {
    for (const layer of layers) {
      const idx = layer.items.findIndex((i) => re.test(i));
      if (idx !== -1) {
        layer.items.splice(idx, 1);
        return true;
      }
    }
  }
  return false;
}

function pushNote(notes: Note[], category: NoteCategory, message: string): void {
  if (!notes.some((n) => n.message === message)) {
    notes.push({ category, message });
  }
}

function flag(
  code: string,
  message: string,
  sources: SafetySource[],
  severity: Severity = 'MEDIUM',
  category: NoteCategory = 'overoppheting',
): SafetyFlag {
  return { code, message, sources, severity, category };
}

function countAllItems(layers: Layer[]): number {
  return layers.reduce((sum, l) => sum + l.items.length, 0);
}

function maxLayersForFeels(feelsLikeC: number): number {
  if (feelsLikeC >= 16) return 6;
  if (feelsLikeC >= 5) return 9;
  if (feelsLikeC >= -5) return 12;
  return 14;
}

export type SoftResult = {
  layers: Layer[];
  notes: Note[];
  flags: SafetyFlag[];
};

export function applySoftBlocks(
  input: RecommendInput,
  inLayers: Layer[],
  inNotes: Note[],
): SoftResult {
  const layers = cloneLayers(inLayers);
  const notes = [...inNotes];
  const flags: SafetyFlag[] = [];

  // SB-1: TOG vs romtemp er allerede dekket av CK-3 (sterkere håndhevelse)

  // SB-2: For mange lag relativt til feels-like
  const maxItems = maxLayersForFeels(input.weather.feelsLikeC);
  if (countAllItems(layers) > maxItems) {
    while (countAllItems(layers) > maxItems) {
      const removed = removeFirstMatching(layers, [
        DUNTEPPE_RE,
        VARMEPOSE_LETT_RE,
        TYNT_TEPPE_RE,
      ]);
      if (!removed) break;
    }
    const msg = 'Færre lag enn forventet — barn produserer mer kroppsvarme enn voksne ved aktivitet.';
    pushNote(notes, 'overoppheting', msg);
    // F28.24 V0-runde 4: SB-2 er engine-splaining (forklarer hvorfor motoren
    // valgte færre lag). Beholdes i flag-array for debug; skjules i sheet UI.
    flags.push({ ...flag('SB-2', msg, ['POLICY']), displayInSheet: false });
  }

  // SB-3: Romtemp ≥24 → cap clothing
  if (input.activity === 'soevn') {
    const roomC = input.weather.feelsLikeC;
    if (roomC >= 26) {
      // Force minimal: kortermet body alene
      for (const layer of layers) {
        if (layer.category === 'innerst') {
          layer.items = ['kortermet body'];
        } else {
          layer.items = [];
        }
      }
      const msg = 'Veldig varmt rom — vurder vifte/lufting før neste valg. Kun lett body.';
      pushNote(notes, 'overoppheting', msg);
      flags.push(flag('SB-3', msg, ['LT-TOG', 'NHS'], 'HIGH'));
    } else if (roomC >= 24) {
      for (const layer of layers) {
        if (layer.category === 'innerst') {
          layer.items = ['kortermet body'];
        } else if (layer.category === 'ekstra') {
          layer.items = layer.items.filter((i) => SOVEPOSE_RE.test(i));
          if (layer.items.length === 0) layer.items.push('sovepose 0.5 TOG');
        } else {
          layer.items = [];
        }
      }
      const msg = 'Varmt rom — kun kortermet body + sovepose 0.5 TOG.';
      pushNote(notes, 'overoppheting', msg);
      flags.push(flag('SB-3', msg, ['LT-TOG', 'NHS']));
    }
  }

  // SB-4: Bæresele + innerJakke + tykt mellomlag
  if (input.activity === 'baeresele' && input.innerJakke === true) {
    for (const layer of layers) {
      if (layer.category === 'mellomlag') {
        layer.items = layer.items.map((i) =>
          TYKK_RE.test(i) ? i.replace(/(tykt|tykke|isolert)/i, 'tynn').trim() : i,
        );
      }
    }
    // Note pushed by SB-4 only if tykt-svap faktisk skjedde — skip extra note here, SB-2-msg dekker
  }

  // SB-5: Peak overheating-vindu 7-9 mnd
  if (
    input.child.ageMonths >= 7
    && input.child.ageMonths <= 9
    && input.weather.feelsLikeC >= 22
  ) {
    // Fjern toppmest insulasjon: mellomlag eller dunteppe/varmepose lett
    if (!removeFirstMatching(layers, [DUNTEPPE_RE, VARMEPOSE_LETT_RE])) {
      // Else: drop første mellomlag-item
      for (const layer of layers) {
        if (layer.category === 'mellomlag' && layer.items.length > 0) {
          layer.items.shift();
          break;
        }
      }
    }
    const msg = '7–9 mnd produserer mest kroppsvarme — færre lag enn vanlig.';
    pushNote(notes, 'overoppheting', msg);
    // F28.24 V0-runde 4: SB-5 forklarer hvorfor motoren reduserte lag for
    // 7-9 mnd. Informasjon er ekte men ER engine-splaining på samme måte
    // som CK-6. Konsistens: alle engine-explainers skjules fra sheet,
    // viktig info routes til 'Hvorfor?'-expander når den er wired.
    flags.push({ ...flag('SB-5', msg, ['AAP-HC', 'POLICY']), displayInSheet: false });
  }

  // SB-6: Lang varm vognetur
  const exposureMin = input.exposureMin ?? 60;
  if (input.activity === 'vogn' && input.weather.feelsLikeC >= 18 && exposureMin >= 60) {
    for (const layer of layers) {
      layer.items = layer.items.filter((i) =>
        !VARMEPOSE_LETT_RE.test(i) && !DUNTEPPE_RE.test(i),
      );
    }
    const msg = 'Lang mild vognetur — søk skygge, sjekk nakken hvert 20.–30. minutt.';
    pushNote(notes, 'overoppheting', msg);
    flags.push(flag('SB-6', msg, ['LT-PRAM', 'LT-RT'], 'LOW'));
  }

  // SB-7 (bonus): peak ekstrem hete + <6 mnd
  if (input.weather.feelsLikeC >= 28 && input.child.ageMonths < 6) {
    const msg = 'Spedbarn (< 6 mnd) tåler ekstrem hete dårlig — maks 15 min ute uten skygge.';
    pushNote(notes, 'overoppheting', msg);
    flags.push(flag('SB-7', msg, ['AAP-HC'], 'HIGH'));
  }

  // SB-8: generell kulde-eksponering — frostskade-sjekk på utelek/vogn
  const exposureMinForCold = input.exposureMin ?? 60;
  if (
    input.weather.feelsLikeC <= -10
    && exposureMinForCold > 30
    && input.child.ageMonths >= 3
    && (input.activity === 'utelek' || input.activity === 'vogn' || input.activity === 'baeresele')
  ) {
    const msg = 'Kort tur — sjekk kinn, nese og ører hvert 20. minutt. Frostskade-risiko ved feels ≤ -10 °C.';
    pushNote(notes, 'sikkerhet', msg);
    flags.push(flag('SB-8', msg, ['AAP-HC', 'POLICY'], 'MEDIUM', 'sikkerhet'));
  }

  return { layers, notes, flags };
}
