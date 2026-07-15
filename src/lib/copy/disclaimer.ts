/**
 * Veiledende-disclaimer (eierbeslutning 2026-07-15: lanser v1 på dagens
 * containede motor uten ekstern fagsignatur, med en tydelig disclaimer om at
 * anbefalingene er råd — ikke garantier).
 *
 * Én kilde for begge lengder, så ordlyden er konsistent på tvers av onboarding,
 * anbefalingsflater og juridisk seksjon. Begge passerer product-copy-lint
 * (ingen absolutte «garantert/helt trygt/perfekt»-påstander) — se
 * disclaimer.test.ts.
 */

/** Kort, diskré linje ved selve anbefalingen. */
export const DISCLAIMER_SHORT = 'Veiledende råd — følg med på barnet og bruk eget skjønn.';

/** Full formulering — onboarding + juridisk/innstillinger. */
export const DISCLAIMER_FULL =
  'Anbefalingene er veiledende og ikke en erstatning for ditt eget skjønn eller råd fra ' +
  'helsepersonell. Følg alltid med på barnet — det er du som kjenner det best.';
