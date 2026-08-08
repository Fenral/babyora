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
    ['en-US', "Today's outfit", 'Explore each garment', 'Base layer'],
    ['sv-SE', 'Dagens kläder', 'Se varje plagg', 'Innerlager'],
    ['da-DK', 'Dagens tøj', 'Se hvert stykke tøj', 'Inderste lag'],
    ['no-NO', 'Dagens antrekk', 'Se hvert plagg', 'Innerst'],
  ])('provides complete copy for %s', (language, title, detailsTitle, role) => {
    const copy = resultCopyFor(language);
    expect(copy.title).toBe(title);
    expect(copy.detailsTitle).toBe(detailsTitle);
    expect(copy.role('Innerst')).toBe(role);
    expect(copy.factTitle).toMatch(/\S/u);
    expect(copy.details).toMatch(/\S/u);
    expect(copy.childSummary(5, 'Mira')).toContain('Mira');
    expect(copy.sourceNewWindow('Helsenorge')).toContain('Helsenorge');
  });

  it.each([
    ['en-US', 'Good to know', 'See details'],
    ['sv-SE', 'Bra att veta', 'Visa detaljer'],
    ['da-DK', 'Godt at vide', 'Se detaljer'],
    ['no-NO', 'Kort fortalt', 'Se detaljer'],
  ])('localizes the compact fact summary and detail action for %s', (language, factTitle, details) => {
    const copy = resultCopyFor(language);
    expect(copy.factTitle).toBe(factTitle);
    expect(copy.details).toBe(details);
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
