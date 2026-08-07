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

describe('FinnAntrekkScreen — no prefill (standalone / generic GuideTarget opener)', () => {
  it('renders the internal defaults and the plain "Finn antrekk" header', () => {
    const html = renderScreen(undefined);
    expect(html).toContain('aria-label="Finn antrekk"');
    expect(html).toContain('>Finn antrekk<');
    expect(html).toContain('Finn antrekk for barnet ditt');
    expect(html).toContain('−4°');
    expect(html).toContain('3 m/s');
    /* Nedbørverdien måles på aria-valuetext, ikke på den synlige etiketten.
       Etiketten er siden 2026-08-06 delt rundt desimalskillet
       (`0<span class="fa-gauge-desimal">,</span>0 mm/t`) fordi tabular-nums
       ga kommaet full sifferbredde — se verdiMedStrammetDesimalskille.
       aria-valuetext bærer det samme tallet som én streng, og den er
       dessuten det brukeren med skjermleser faktisk hører. */
    expect(html).toContain('aria-valuetext="0,0 millimeter per time');
    // "Utenfor vogn" (first ACTIVITY_OPTIONS entry — P10.1 finding C1:
    // renamed from "Lek ute" to match Hjem's own vocabulary for the same
    // engine value) is the default-active radio.
    expect(html).toMatch(/aria-checked="true"[^>]*>Utenfor vogn/);
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
    expect(html).toContain('aria-valuetext="2,5 millimeter per time'); // 2.3 rounded to the nearest 0.5 step
    expect(html).toMatch(/aria-checked="true"[^>]*>I vogn/);

    // … and NONE of the internal defaults leak through anywhere (proves the
    // lazy useState initializers actually seeded from prefill, rather than
    // seeding from -4/3/0/lek and only later correcting).
    expect(html).not.toContain('−4°');
    expect(html).not.toContain('>3 m/s<');
    expect(html).not.toContain('0,0 millimeter per time');
    expect(html).not.toMatch(/aria-checked="true"[^>]*>Utenfor vogn/);
  });

  it('renders the drill-appropriate "Juster" header instead of "Finn antrekk"', () => {
    const html = renderScreen(prefill);
    expect(html).toContain('aria-label="Juster"');
    expect(html).toContain('>Juster<');
    expect(html).toContain('Juster antrekket for barnet ditt');
    // P10/JOB4 (owner redesign, CTA-driven scan): the amber CTA now ALWAYS
    // reads "Finn antrekk" — same label as Hjem's own CTA, per owner spec —
    // regardless of whether the screen was opened as the "Juster" drill or
    // standalone. Only the header TITLE paragraph is drill-aware, so assert
    // that specifically instead of a blanket absence of the phrase.
    const titleMatch = html.match(/<p style="margin:0;font-size:1\.25rem[^>]*>([^<]*)<\/p>/);
    expect(titleMatch?.[1]).toBe('Juster');
  });

  it('shows the place label from the prefill in the header sub-line', () => {
    const html = renderScreen(prefill);
    expect(html).toContain('Trondheim');
  });
});
