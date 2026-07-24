const deepFreeze = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const copy = {
  titleTemplate: 'Planlegg for {fraDato}–{tilDato}',
  subtitle: 'Basert på månedlige normaler for 1991–2020, ikke et værvarsel.',
  unavailable: 'Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.',
  empty: 'Ingenting å forberede akkurat nå.',
  groups: {
    check_first: 'Sjekk først',
    available_if_needed: 'Kan være greit å ha tilgjengelig',
    not_highlighted: 'Ikke fremhevet for perioden',
  },
  note: 'Dette er en Babyora-planleggingsregel basert på historiske månedsnormaler. Sjekk dagens vær og egne behov nærmere datoen.',
  source: 'Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.',
  rules: {
    'SNART-H2-BASE-CHECK': 'Sjekk om dere har et lett innerlag tilgjengelig for perioden.',
    'SNART-H2-BASE-AVAILABLE': 'Et lett innerlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.',
    'SNART-H2-BASE-NOT-HIGHLIGHTED': 'Innerlag er ikke fremhevet av denne historiske perioden.',
    'SNART-H2-MID-CHECK': 'Sjekk om dere har et mellomlag tilgjengelig for perioden.',
    'SNART-H2-MID-AVAILABLE': 'Et mellomlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.',
    'SNART-H2-MID-NOT-HIGHLIGHTED': 'Mellomlag er ikke fremhevet av denne historiske perioden.',
    'SNART-H2-OUTER-CHECK': 'Sjekk om dere har et isolert ytterlag tilgjengelig for perioden.',
    'SNART-H2-OUTER-AVAILABLE': 'Et isolert ytterlag kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
    'SNART-H2-OUTER-NOT-HIGHLIGHTED': 'Isolert ytterlag er ikke fremhevet av denne historiske perioden.',
    'SNART-H2-HEAD-CHECK': 'Sjekk om dere har et hodeplagg tilgjengelig for perioden.',
    'SNART-H2-HEAD-AVAILABLE': 'Et hodeplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
    'SNART-H2-HEAD-NOT-HIGHLIGHTED': 'Hodeplagg er ikke fremhevet av denne historiske perioden.',
    'SNART-H2-HAND-CHECK': 'Sjekk om dere har håndplagg tilgjengelig for perioden.',
    'SNART-H2-HAND-AVAILABLE': 'Håndplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
    'SNART-H2-HAND-NOT-HIGHLIGHTED': 'Håndplagg er ikke fremhevet av denne historiske perioden.',
    'SNART-H2-WET-CHECK': 'Historisk nedbørsmengde er høyere for perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.',
    'SNART-H2-WET-AVAILABLE': 'Et værbeskyttende ytterlag kan være greit å ha tilgjengelig ut fra historisk nedbørsmengde.',
    'SNART-H2-WET-NOT-HIGHLIGHTED': 'Værbeskyttende ytterlag er ikke fremhevet av periodens historiske nedbørsmengde.',
  },
} as const;

export const SNART_COPY = deepFreeze(copy);
export type SnartRuleId = keyof typeof SNART_COPY.rules;

export function buildSnartTitle(fromLocalDate: string, throughLocalDate: string): string {
  return SNART_COPY.titleTemplate
    .replace('{fraDato}', fromLocalDate)
    .replace('{tilDato}', throughLocalDate);
}
