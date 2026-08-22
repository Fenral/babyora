/**
 * Motor 2.0 — sikkerhetsport på strukturerte plagg (engine-2-plan Task 8).
 *
 * Kjører ETTER kalibrering og plaggvalg (spec §11) og kan alltid overstyre.
 * Reglene bruker typede roller/materialer/varmenivåer — regex på norske
 * labels er forbudt her (kun legacy-adapteren får bruke tekst, Task 11).
 *
 * Porterte regler beholder legacy-kode, alvorlighet og NORSK COPY BYTE-
 * IDENTISK (ingen copy-endring uten separat faglig beslutning):
 *   HB-9  bilstol × isolert yttertøy (varme ≥ 3)          CRITICAL
 *   HB-1  hodeplagg under innesøvn                        CRITICAL
 *   CK-9  bæresele innenfor jakka × ytterlag              HIGH
 *   SB-7  ekstrem varme × < 6 mnd                         HIGH (flagg)
 *   SB-8  feels ≤ −10 × eksponering > 30 min × ≥ 3 mnd    MEDIUM (flagg)
 *
 * Nye strukturelle V2-regler (ny kode + ny copy → registrert i den
 * versjonerte fagpakken fra Task 16; ekstern landreview står fortsatt pending):
 *   HB-V2-HEAT     hete-bånd × mellomlag/isolasjon        HIGH
 *   HB-V2-POUCH    vognpose-utstyr ved feels ≥ 18          MEDIUM
 *   HB-V2-NB-COLD  < 3 mnd × kuldegrader                  HIGH (flagg)
 *   HB-V2-EXTREME-HEAT generelt hete-flagg (G32)          HIGH (flagg)
 *   HB-V2-EXTREME-COLD ekstrem kulde/eksponering (G33)    HIGH (flagg)
 *
 * Strukturelt umulige legacy-regler (ingen tepper, soveposer, svøp eller
 * vektede produkter finnes i V2-katalogen): HB-2/3/4/5/6/7/10, CK-1/3/4/5/8
 * — garantert av katalogen + denne portens idempotens; dokumentert i
 * fagpakken i stedet for portet som død kode.
 */

import type {
  ResolvedEquipment,
  ResolvedGarment,
  SafetyFlag,
  Severity,
  ThermalIntent,
  ValidatedRecommendInputV2,
} from './types.js';
import { GARMENT_VARIANTS } from './catalog.js';
import { buildSafetyFlag } from './safety-rules.js';

export type SafetyV2Result = {
  garments: ResolvedGarment[];
  equipment: ResolvedEquipment[];
  flags: SafetyFlag[];
  severity: Severity;
};

const SEVERITY_RANK: Record<Severity, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

const HEAT_BANDS = new Set(['tropisk', 'ekstrem_varme']);

/** Varmenivå for en valgt variant — slås opp i katalogen, aldri i label. */
function warmthOf(garment: ResolvedGarment): number {
  return GARMENT_VARIANTS.find((v) => v.id === garment.variantId)?.warmth ?? 0;
}

export function applySafetyV2(
  input: ValidatedRecommendInputV2,
  intent: ThermalIntent,
  parts: { garments: ResolvedGarment[]; equipment: ResolvedEquipment[] },
): SafetyV2Result {
  let garments = parts.garments.map((g) => ({ ...g }));
  let equipment = parts.equipment.map((e) => ({ ...e }));
  const flags: SafetyFlag[] = [];
  let severity: Severity = 'NONE';

  function flag(f: SafetyFlag): void {
    flags.push(f);
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[severity]) severity = f.severity;
  }

  // HB-9: aldri tykt isolert yttertøy i bilstol (portet, copy byte-identisk).
  if (input.carSeat === true && garments.some((g) => g.role === 'insulated_fullbody' && warmthOf(g) >= 3)) {
    garments = garments.filter((g) => !(g.role === 'insulated_fullbody' && warmthOf(g) >= 3));
    flag(buildSafetyFlag(
      'HB-9',
      'I bilstolen: tynne lag + sele tett. Legg dressen over som teppe etter at selen er stram.',
      'sikkerhet',
    ));
  }

  // HB-1: aldri hodeplagg under innesøvn (portet, copy byte-identisk).
  if (input.situation === 'indoor_sleep' && garments.some((g) => g.role === 'headwear')) {
    garments = garments.filter((g) => g.role !== 'headwear');
    flag(buildSafetyFlag(
      'HB-1',
      'Ikke hodeplagg under søvn innendørs — hodet er babys varme-avgivelse.',
      'sikkerhet',
    ));
  }

  // CK-9: innenfor forelderens jakke — ytterlag (isolert/skall) fjernes (portet).
  if (input.situation === 'carrier' && input.carrierUnderParentJacket === true) {
    const hadOuter = garments.some((g) => g.role === 'insulated_fullbody' || g.role.startsWith('shell_'));
    if (hadOuter) {
      garments = garments.filter((g) => !(g.role === 'insulated_fullbody' || g.role.startsWith('shell_')));
      flag(buildSafetyFlag(
        'CK-9',
        'Du varmer barnet med kroppen — barnejakke fjernet for å unngå overoppheting.',
        'overoppheting',
      ));
    }
  }

  // HB-V2-HEAT: hete-bånd tåler aldri mellomlag/isolasjon (ny strukturell regel).
  if (HEAT_BANDS.has(intent.tempBand)) {
    const hadInsulation = garments.some((g) => g.role.startsWith('mid_') || g.role === 'insulated_fullbody');
    if (hadInsulation) {
      garments = garments.filter((g) => !(g.role.startsWith('mid_') || g.role === 'insulated_fullbody'));
      flag(buildSafetyFlag(
        'HB-V2-HEAT',
        'Varmt vær — mellomlag og isolasjon er tatt bort for å unngå overoppheting.',
        'overoppheting',
      ));
    }
  }

  // HB-V2-POUCH: vognpose-utstyr ved mildt/varmt vær (SB-6-semantikk, ny kode).
  if (input.weather.feelsLikeC >= 18 && equipment.some((e) => e.id === 'stroller_warm_pouch')) {
    equipment = equipment.filter((e) => e.id !== 'stroller_warm_pouch');
    flag(buildSafetyFlag(
      'HB-V2-POUCH',
      'Mildt vær — vognpose er tatt bort så vognen ikke blir en varmefelle.',
      'overoppheting',
    ));
  }

  // SB-7: ekstrem varme × spedbarn (portet flagg, copy byte-identisk).
  if (input.weather.feelsLikeC >= 28 && input.ageMonths < 6) {
    flag(buildSafetyFlag(
      'SB-7',
      'Spedbarn (< 6 mnd) tåler ekstrem hete dårlig — maks 15 min ute uten skygge.',
      'overoppheting',
    ));
  }

  // HB-V2-EXTREME-HEAT: generelt hete-flagg (G32 — pause/skygge fremfor plagg).
  if (intent.tempBand === 'ekstrem_varme') {
    flag(buildSafetyFlag(
      'HB-V2-EXTREME-HEAT',
      'Veldig varmt — pauser i skygge og rikelig drikke betyr mer enn plaggvalget nå.',
      'overoppheting',
    ));
  }

  // SB-8: kulde-eksponering (portet flagg, copy byte-identisk med legacy).
  const exposureMin = input.exposureMin ?? 60;
  const outdoor = input.situation !== 'indoor_sleep';
  if (outdoor && input.weather.feelsLikeC <= -10 && exposureMin > 30 && input.ageMonths >= 3) {
    flag(buildSafetyFlag(
      'SB-8',
      'Kort tur — sjekk kinn, nese og ører hvert 20. minutt. Frostskade-risiko ved feels ≤ -10 °C.',
      'sikkerhet',
    ));
  }

  // HB-V2-EXTREME-COLD: ekstrem-bånd (≤ −15) — eksponeringsbegrensning er
  // hovedrådet; antrekk alene fremstilles aldri som tilstrekkelig (G33).
  if (outdoor && intent.tempBand === 'ekstrem') {
    flag(buildSafetyFlag(
      'HB-V2-EXTREME-COLD',
      'Ekstrem kulde — hold turen svært kort. Påkledning alene er ikke nok i denne kulda.',
      'kulde',
    ));
  }

  // HB-V2-NB-COLD: nyfødt i kuldegrader (G03/G33). Legacy-semantikk er
  // ageMonths <= 3 (modifiers.ts «child.ageMonths <= 3») — ikke < 3.
  if (outdoor && input.ageMonths <= 3 && input.weather.feelsLikeC < 0) {
    flag(buildSafetyFlag(
      'HB-V2-NB-COLD',
      'Spedbarn under 3 mnd: maks 30 min ute i kuldegrader. Sjekk nakke og rygg ofte.',
      'alder',
    ));
  }

  return { garments, equipment, flags, severity };
}
