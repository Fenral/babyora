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
    ['en-US', "Today's outfit", 'Base layer'],
    ['sv-SE', 'Dagens kläder', 'Innerlager'],
    ['da-DK', 'Dagens tøj', 'Inderste lag'],
  ])('provides complete copy for %s', (language, title, role) => {
    const copy = resultCopyFor(language);
    expect(copy.title).toBe(title);
    expect(copy.role('Innerst')).toBe(role);
    expect(copy.childSummary(5, 'Mira')).toContain('Mira');
    expect(copy.sourceNewWindow('Helsenorge')).toContain('Helsenorge');
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
