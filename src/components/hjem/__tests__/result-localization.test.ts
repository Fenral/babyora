import { describe, expect, it } from 'vitest';
import { resultCopyFor } from '../result-localization';

describe('result localization', () => {
  it.each([
    ['en-US', "Today's outfit", 'All garments', 'Base layer', '5 garments for Mira'],
    ['sv-SE', 'Dagens kläder', 'Alla plagg', 'Innerlager', '5 plagg för Mira'],
    ['da-DK', 'Dagens tøj', 'Alt tøj', 'Inderste lag', '5 dele til Mira'],
    ['no-NO', 'Dagens antrekk', 'Alle plagg', 'Innerst', '5 plagg for Mira'],
  ])('provides complete overview copy for %s', (language, title, overviewTitle, role, summary) => {
    const copy = resultCopyFor(language);
    expect(copy.title).toBe(title);
    expect(copy.overviewTitle).toBe(overviewTitle);
    expect(copy.role('Innerst')).toBe(role);
    expect(copy.carouselHint).toMatch(/\S/u);
    expect(copy.overviewProgress).toMatch(/\S/u);
    expect(copy.details).toMatch(/\S/u);
    expect(copy.childSummary(5, 'Mira')).toBe(summary);
    expect(copy.childSummary(5, 'Mira')).not.toMatch(/(?:base|inner|outer|lag|layer),?\s+(?:to|til|fra)/iu);
    expect(copy.openGarment('Body')).toContain('Body');
  });

  it.each([
    ['en-US', 'Previous', 'Next', 'View garments', 'Overview'],
    ['sv-SE', 'Föregående', 'Nästa', 'Se plaggen', 'Översikt'],
    ['da-DK', 'Forrige', 'Næste', 'Se tøjet', 'Oversigt'],
    ['no-NO', 'Forrige', 'Neste', 'Se plaggene', 'Oversikt'],
  ])('localizes every explicit deck control for %s', (
    language,
    previous,
    next,
    viewGarments,
    overview,
  ) => {
    const copy = resultCopyFor(language);
    expect(copy.previous).toBe(previous);
    expect(copy.next).toBe(next);
    expect(copy.viewGarments).toBe(viewGarments);
    expect(copy.overview).toBe(overview);
  });

  it.each([
    ['en-US', 'Good to know', 'Alternatives', 'Compare alternatives to Body'],
    ['sv-SE', 'Bra att veta', 'Alternativ', 'Jämför alternativ till Body'],
    ['da-DK', 'Godt at vide', 'Alternativer', 'Sammenlign alternativer til Body'],
    ['no-NO', 'Godt å vite', 'Alternativer', 'Sammenlign alternativer til Body'],
  ])('localizes the visible fact and authorized Alternatives action for %s', (
    language,
    goodToKnow,
    alternatives,
    alternativesAria,
  ) => {
    const copy = resultCopyFor(language);
    expect(copy.goodToKnow).toBe(goodToKnow);
    expect(copy.alternatives).toBe(alternatives);
    expect(copy.alternativesAria('Body')).toBe(alternativesAria);
  });

});
