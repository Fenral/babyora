import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { LESSONS } from '../../data/vinterprogram';
import {
  deepFlowCopyFor,
  localizedGarmentDisplayName,
  normalizeDeepFlowLanguage,
} from '../deep-flow-copy';
import { localizedWinterLesson } from '../vinterprogram-copy';
import { VarmEllerKaldScreen } from '../VarmEllerKaldScreen';

describe('deep-flow localization', () => {
  afterEach(async () => {
    await i18n.changeLanguage('no');
  });

  it('supports the launch languages and falls German or unknown locales back to English', () => {
    expect(normalizeDeepFlowLanguage('nb-NO')).toBe('no');
    expect(normalizeDeepFlowLanguage('sv-SE')).toBe('sv');
    expect(normalizeDeepFlowLanguage('da-DK')).toBe('da');
    expect(normalizeDeepFlowLanguage('de-DE')).toBe('en');
    expect(normalizeDeepFlowLanguage('fr-FR')).toBe('en');
    expect(deepFlowCopyFor('de').warmCold.done).toBe('Done');
  });

  it('localizes engine garment strings without changing their identifiers', () => {
    const engineValue = 'ull-jakke';
    expect(localizedGarmentDisplayName(engineValue, 'en')).toBe('Wool jacket');
    expect(localizedGarmentDisplayName(engineValue, 'sv')).toBe('Ulljacka');
    expect(localizedGarmentDisplayName(engineValue, 'da')).toBe('Uldjakke');
    expect(localizedGarmentDisplayName(engineValue, 'no')).toBe('Ull-jakke');
    expect(engineValue).toBe('ull-jakke');
  });

  it('provides localized winter lesson content while keeping the route target canonical', () => {
    const lesson = LESSONS.find((candidate) => candidate.id === 'sjekk-nakken')!;
    expect(localizedWinterLesson(lesson, 'en').title).toBe('Check the neck');
    expect(localizedWinterLesson(lesson, 'sv').tryLabel).toBe('Prova nacktestet');
    expect(localizedWinterLesson(lesson, 'da').sections[0]?.heading).toBe('Sådan gør du');
    expect(localizedWinterLesson(lesson, 'de').title).toBe('Check the neck');
    expect(lesson.tryDet.target).toBe('varm-kald');
  });

  it.each([
    ['en', 'Too warm or too cold?', 'Done'],
    ['sv', 'För varmt eller för kallt?', 'Klar'],
    ['da', 'For varm eller for kold?', 'Færdig'],
    ['no', 'Varm eller kald?', 'Ferdig'],
    ['de', 'Too warm or too cold?', 'Done'],
  ])('renders the warm/cold drill in %s', async (language, title, done) => {
    await i18n.changeLanguage(language);
    const html = renderToStaticMarkup(<VarmEllerKaldScreen onBack={() => {}} />);
    expect(html).toContain(title);
    expect(html).toContain(done);
  });
});
