/**
 * Established recovery wording for the neck check. This module deliberately
 * contains copy only; recovery logic, health state, and visual metadata stay
 * with their owning modules.
 */
const warm = Object.freeze({
  key: 'varm' as const,
  title: 'For varm',
  signal: 'Svett eller fuktig nakke',
  action: 'Ta av',
  ariaLabel: 'For varm — svett eller fuktig nakke, ta av et lag',
});

const perfekt = Object.freeze({
  key: 'perfekt' as const,
  title: 'Perfekt',
  signal: 'Lun og tørr nakke',
  action: 'Behold',
  ariaLabel: 'Perfekt — nakken er lun og tørr, alt stemmer',
});

const cold = Object.freeze({
  key: 'kald' as const,
  title: 'For kald',
  signal: 'Kjølig eller kald nakke',
  action: 'Legg til',
  ariaLabel: 'For kald — kjølig nakke, legg til et lag',
});

export const WARM_COLD_RECOVERY_COPY = Object.freeze({
  title: 'Kjenn nakken',
  instruction: 'Stikk to fingre under genseren bak i nakken — ikke hender eller føtter.',
  statuses: Object.freeze({ warm, perfekt, cold }),
});
