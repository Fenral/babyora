import { describe, expect, it } from 'vitest';

import da from '../../../i18n/locales/da.json';
import de from '../../../i18n/locales/de.json';
import en from '../../../i18n/locales/en.json';
import no from '../../../i18n/locales/no.json';
import sv from '../../../i18n/locales/sv.json';

const expectations = [
  ['no', no.plan.rail, ['Ta av', 'Ta på', 'Legg til', 'Les mer', 'Vis mindre']],
  ['en', en.plan.rail, ['Take off', 'Put on', 'Add', 'Read more', 'Show less']],
  ['sv', sv.plan.rail, ['Ta av', 'Ta på', 'Lägg till', 'Läs mer', 'Visa mindre']],
  ['da', da.plan.rail, ['Tag af', 'Tag på', 'Tilføj', 'Læs mere', 'Vis mindre']],
  ['de', de.plan.rail, ['Ausziehen', 'Anziehen', 'Hinzufügen', 'Mehr lesen', 'Weniger anzeigen']],
] as const;

describe.each(expectations)('%s planning change rail copy', (_language, rail, copy) => {
  it('keeps the compact change labels explicit and localized', () => {
    expect([rail.takeOff, rail.putOn, rail.addLabel, rail.readMore, rail.showLess]).toEqual(copy);
  });
});
