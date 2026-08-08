import { describe, expect, it } from 'vitest';
import { localizedWhyForGarment, resultCopyFor } from '../result-localization';

const context = {
  childName: 'Mira',
  activity: 'vogn' as const,
  tempC: 5,
  feelsLikeC: 2,
  windMs: 7,
  precipMmH: 0,
};

describe('result localization', () => {
  it.each([
    ['en-US', "Today's outfit", 'All garments', 'Base layer'],
    ['sv-SE', 'Dagens kläder', 'Alla plagg', 'Innerlager'],
    ['da-DK', 'Dagens tøj', 'Alt tøj', 'Inderste lag'],
    ['no-NO', 'Dagens antrekk', 'Alle plagg', 'Innerst'],
  ])('provides complete overview copy for %s', (language, title, overviewTitle, role) => {
    const copy = resultCopyFor(language);
    expect(copy.title).toBe(title);
    expect(copy.overviewTitle).toBe(overviewTitle);
    expect(copy.role('Innerst')).toBe(role);
    expect(copy.carouselHint).toMatch(/\S/u);
    expect(copy.overviewProgress).toMatch(/\S/u);
    expect(copy.details).toMatch(/\S/u);
    expect(copy.childSummary(5, 'Mira')).toContain('Mira');
    expect(copy.openGarment('Body')).toContain('Body');
  });

  it.each([
    ['en-US', 'See details', 'More info'],
    ['sv-SE', 'Visa detaljer', 'Mer info'],
    ['da-DK', 'Se detaljer', 'Mere info'],
    ['no-NO', 'Se detaljer', 'Mer info'],
  ])('localizes sheet details and the More info action for %s', (
    language,
    details,
    moreInfo,
  ) => {
    const copy = resultCopyFor(language);
    expect(copy.details).toBe(details);
    expect(copy.moreInfo).toBe(moreInfo);
  });

  it('localizes contextual reasons instead of leaking Norwegian', () => {
    expect(localizedWhyForGarment('ull-jakke', context, 'en', 'Mid layer'))
      .toBe('At 2°C, this gives Mira an adjustable mid layer.');
    expect(localizedWhyForGarment('ull-jakke', context, 'sv', 'Mellanlager'))
      .toContain('mellanlager');
    expect(localizedWhyForGarment('vinterdress', context, 'da', 'Yderlag'))
      .toContain('Vinden er 7 m/s');
  });
});
