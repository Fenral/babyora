/**
 * Motor 2.0 — feature-flags og motorvalg (spec §19, engine-2-plan Task 12).
 *
 * Lokale konstanter i første fase. VISNINGSFLAGGENE SKAL VÆRE FALSE til
 * kohortens fagpakke er eksternt signert (Task 17 — menneskelig gate);
 * flagg brukes aldri til å skjule manglende sikkerhetstester.
 *
 * Rollback-garantien: 'legacy' = den CONTAINEDE legacy-motoren fra R2
 * (recommend() i wool-layers med finalize-grensen) — aldri en
 * pre-containment-sti. All-flags-off er alltid trygg.
 */

export type EngineV2Flags = {
  /** Shadow-kjøring i test/demo — resultatet vises aldri. */
  engine_v2_shadow: boolean;
  /** Visning for 0–11 mnd. Krever ekstern scenariosignatur (Task 17). */
  engine_v2_infant: boolean;
  /** Visning for 12–24 mnd. Egen signatur og egen commit (Task 17). */
  engine_v2_young_toddler: boolean;
};

export const ENGINE_V2_FLAGS: Readonly<EngineV2Flags> = Object.freeze({
  engine_v2_shadow: false,
  engine_v2_infant: false,
  engine_v2_young_toddler: false,
});

export function selectEngine(
  child: { ageMonths: number },
  flags: EngineV2Flags = ENGINE_V2_FLAGS,
): 'legacy' | 'v2' {
  if (child.ageMonths <= 11 && flags.engine_v2_infant) return 'v2';
  if (child.ageMonths >= 12 && child.ageMonths <= 24 && flags.engine_v2_young_toddler) return 'v2';
  return 'legacy';
}
