import { describe, expect, it } from 'vitest';
import { planCta } from '../cta-fingerprint.js';
import { hjemCopyFor, resolveHjemLanguage } from '../hjem-copy.js';
import {
  activityChangeChip,
  staleCtaLabel,
  staleHeadline,
} from '../scan-orchestration.js';

describe('hjem-copy locale policy', () => {
  it.each([
    ['sv-SE', 'sv'],
    ['da-DK', 'da'],
    ['no-NO', 'no'],
    ['nb-NO', 'no'],
    ['nn-NO', 'no'],
    ['en-GB', 'en'],
    ['de-DE', 'en'],
    ['fr-FR', 'en'],
    [undefined, 'en'],
  ] as const)('resolves %s to %s', (language, expected) => {
    expect(resolveHjemLanguage(language)).toBe(expected);
  });

  it.each([
    ['en', '1 month', '2 months', 'Updated now', 'Last updated 08:15'],
    ['sv', '1 månad', '2 månader', 'Uppdaterat nu', 'Senast uppdaterat 08:15'],
    ['da', '1 måned', '2 måneder', 'Opdateret nu', 'Sidst opdateret 08:15'],
    ['no', '1 måned', '2 måneder', 'Oppdatert nå', 'Sist oppdatert 08:15'],
  ] as const)('localizes age and freshness text in %s', (language, one, many, fresh, stale) => {
    const copy = hjemCopyFor(language);
    expect(copy.ageMonths(1)).toBe(one);
    expect(copy.ageMonths(2)).toBe(many);
    expect(copy.weather.freshNow).toBe(fresh);
    expect(copy.weather.lastUpdated('08:15')).toBe(stale);
  });

  it('feeds localized CTA and stale-state builders without changing their decisions', () => {
    const copy = hjemCopyFor('sv-SE');
    const plan = planCta(null, null, new Map(), 'child|day', copy.cta);

    expect(plan).toEqual({
      path: 'ceremony',
      label: 'Hitta dagens kläder',
      line: 'Vädret från met.no, rådet anpassat till ditt barn',
    });
    expect(staleHeadline('identity-changed', 'vogn', copy.stale))
      .toBe('Nya kläder för barnvagnen?');
    expect(staleCtaLabel('weather-basis', 'utelek', copy.stale))
      .toBe('Beräkna på nytt');
    expect(activityChangeChip('utelek', 'vogn', copy.stale))
      .toBe('Du bytte från utomhuslek till barnvagnen');
  });
});
