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

/**
 * Kort, diskré linje ved selve anbefalingen.
 *
 * DENNE LEKKET NORSK TIL ALLE SPRÅK. Konstanten ble importert rett inn i
 * HjemScreen uten språkgren, så en engelsk, svensk, dansk eller tysk bruker
 * fikk den eneste norske setningen på hjemskjermen — og det var
 * ansvarsfraskrivelsen. Alvorlig fordi eierbeslutningen (2026-07-15,
 * bekreftet 2026-08-09) legger hele det faglige ansvaret på nettopp den.
 *
 * Ordlyden bor nå i `home.disclaimerShort` i alle fem locale-filer.
 * Konstanten beholdes som fallback dersom nøkkelen mangler, og som én
 * lesbar kilde for revisjon av formuleringen.
 */
export const DISCLAIMER_SHORT = 'Veiledende råd — følg med på barnet og bruk eget skjønn.';

/** i18n-nøkkelen kortformen skal hentes fra. Fallback er konstanten over. */
export const DISCLAIMER_SHORT_KEY = 'home.disclaimerShort';

/** Full formulering — onboarding + juridisk/innstillinger. */
export const DISCLAIMER_FULL =
  'Anbefalingene er veiledende og ikke en erstatning for ditt eget skjønn eller råd fra ' +
  'helsepersonell. Følg alltid med på barnet — det er du som kjenner det best.';
