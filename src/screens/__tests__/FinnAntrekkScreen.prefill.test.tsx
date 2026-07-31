/**
 * FinnAntrekkScreen — P5 "Juster" drill: prefill-seeding + drill header.
 *
 * Rendered via renderToStaticMarkup (no jsdom in this repo — see e.g.
 * HjemMonter.test.tsx's own header doc). FinnAntrekkScreen's hooks are all
 * SSR-safe: useChildren() needs a <ChildrenProvider>, whose storage helpers
 * (children-store.tsx) explicitly guard on `typeof window === 'undefined'`
 * and return safe empty defaults in Node — no jsdom/localStorage needed.
 * useWeather()'s own fetch never runs here either (SSR never runs effects),
 * so its 'loading' initial state can never race the prefill seed — this is
 * itself part of what proves SEED WINS.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FinnAntrekkScreen } from '../FinnAntrekkScreen';
import { ChildrenProvider } from '../../state/children-provider';
import type { FinnAntrekkPrefill } from '../finn-antrekk-prefill';

function renderScreen(prefill?: FinnAntrekkPrefill): string {
  return renderToStaticMarkup(
    <ChildrenProvider>
      <FinnAntrekkScreen onBack={() => {}} prefill={prefill} />
    </ChildrenProvider>,
  );
}

describe('FinnAntrekkScreen — no prefill (standalone / GuideHubTarget opener)', () => {
  it('renders the internal defaults and the plain "Finn antrekk" header', () => {
    const html = renderScreen(undefined);
    expect(html).toContain('aria-label="Finn antrekk"');
    expect(html).toContain('>Finn antrekk<');
    expect(html).toContain('Finn antrekk for barnet ditt');
    expect(html).toContain('−4°');
    expect(html).toContain('3 m/s');
    expect(html).toContain('0.0 mm/t');
    // "Lek ute" (first ACTIVITY_OPTIONS entry) is the default-active radio.
    expect(html).toMatch(/aria-checked="true"[^>]*>Lek ute/);
  });
});

describe('FinnAntrekkScreen — prefill given (the "Juster" drill, opened from Hjem\'s result)', () => {
  const prefill: FinnAntrekkPrefill = {
    tempC: -12,
    windMs: 9,
    precipMmH: 2.3,
    activity: 'vogn',
    placeLabel: 'Trondheim',
  };

  it('SEED WINS: seeds every slider from the prefill instead of the internal defaults, on the very first render', () => {
    const html = renderScreen(prefill);

    // Prefilled values are present …
    expect(html).toContain('−12°');
    expect(html).toContain('9 m/s');
    expect(html).toContain('2.5 mm/t'); // 2.3 rounded to the nearest 0.5 step
    expect(html).toMatch(/aria-checked="true"[^>]*>I vogn/);

    // … and NONE of the internal defaults leak through anywhere (proves the
    // lazy useState initializers actually seeded from prefill, rather than
    // seeding from -4/3/0/lek and only later correcting).
    expect(html).not.toContain('−4°');
    expect(html).not.toContain('>3 m/s<');
    expect(html).not.toContain('0.0 mm/t');
    expect(html).not.toMatch(/aria-checked="true"[^>]*>Lek ute/);
  });

  it('renders the drill-appropriate "Juster" header instead of "Finn antrekk"', () => {
    const html = renderScreen(prefill);
    expect(html).toContain('aria-label="Juster"');
    expect(html).toContain('>Juster<');
    expect(html).toContain('Juster antrekket for barnet ditt');
    expect(html).not.toContain('>Finn antrekk<');
  });

  it('shows the place label from the prefill in the header sub-line', () => {
    const html = renderScreen(prefill);
    expect(html).toContain('Trondheim');
  });
});
