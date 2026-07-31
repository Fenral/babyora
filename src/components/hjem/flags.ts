/**
 * flags — P4-bryteren for det nye "Monter"-Hjem-UI-et.
 *
 * HjemScreen leser denne bindingen direkte ved render-tid (ikke kopiert til
 * en lokal konstant andre steder), slik at `vi.mock('../components/hjem/
 * flags.js', () => ({ HJEM_SCAN_UI_ENABLED: false }))` i en testfil trygt
 * kan tvinge frem den gamle rendrings-treet uten noen andre endringer.
 *
 * Satt til `true` — Monter-treet er standard. Den gamle rendrings-grenen i
 * HjemScreen forblir uendret/kompilerbar for rask rollback (sett denne til
 * `false` for å slå av).
 */
export const HJEM_SCAN_UI_ENABLED = true;
