/**
 * VÆRKORTETS TOPP: ETT «I DAG», OG ET GRADTEGN SOM STÅR HEVET.
 *
 * ═══ FUNNENE (revisjon 2026-08-06, [MINDRE] Plan) ════════════════════════
 * 1. «I dag» sto to ganger med ca. 40 px mellomrom: som aktiv pille i
 *    visningsvelgeren (y 193–285) og igjen som etikett øverst inne i
 *    værkortet (y 365–383). Den andre kostet den øverste linjen på skjermens
 *    viktigste flate uten å svare på noe.
 * 2. Gradtegnet på hovedtemperaturen sto MIDT på sifferet: ringen dekket
 *    y 441–454, sifferet y 411–482 — sentrene lå på y≈447 og y≈446.
 *
 * ═══ MEKANISMENE ═════════════════════════════════════════════════════════
 * 1. `heroDayLabel()` (UkeScreen.tsx) returnerer den faste strengen 'I dag'
 *    når `isTodayView` er sann — nøyaktig ordet segmentet som gjorde
 *    visningen aktiv allerede bærer. Etiketten er derfor kuttet i
 *    «I dag»-visningen og beholdt der den sier noe nytt (dato i Uke).
 * 2. `vertical-align` i PROSENT måles mot elementets EGEN line-height.
 *    Sup-en arver line-height 0.95 og har font-size 1.375rem, så 28 % var
 *    0,266em ≈ 6 CSS px løft på et siffer med ~35 px versalhøyde.
 *
 * ═══ HVA PORTEN MÅLER ════════════════════════════════════════════════════
 * Test 1 renderer skjermen (samme fixtur-mønster som
 * UkeScreen.dagslinjen.test.tsx) og teller de faktiske forekomstene av
 * etiketten i markupen. Test 2 kan ikke rendres — jsdom finnes ikke i dette
 * repoet, og løftet er en beregnet piksel — så den REGNER ut hvor ringens
 * topp havner ut fra CSS-ens egne verdier og revisjonens målte
 * fontmetrikk-forhold, og krever at den lander på versalhøyden.
 *
 * IKKE-VAKUØSITET: test 1 slår først fast at værkortet og hero-tallet faktisk
 * ble rendret og at «I dag»-segmentet er det avkryssede — ellers måler den
 * fravær i en tom skjerm. Test 2 slår først fast at regelen finnes og at
 * flaten den gjelder er hero-temperaturen (var(--dw-font-hero)).
 *
 * MUTASJONSBEVIS (kjørt 2026-08-07):
 *   a) `showHeroDayLabel` byttet tilbake til alltid-sann
 *      → RØD i test 1: «expected 2 to be 1» (to «I dag» i markupen) og
 *        markupen inneholder igjen `planlegg-weather__day`.
 *   b) `vertical-align: 0.94em` byttet tilbake til `28%`
 *      → RØD i test 2: ringens topp lander 1,25rem over grunnlinjen mot
 *        versalhøydens 2,17rem.
 *   c) begge gjenopprettet → GRØNN.
 */
/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { assessForecastCoverage } from '../../lib/planning/coverage';
import type { ForecastFetchMetadata, WeatherHourly } from '../../lib/met-no/types';

/* ── Mocks: alt UkeScreen trenger UTENOM det vi måler ────────────────────── */
const mocked = vi.hoisted(() => ({
  weather: null as unknown,
}));

vi.mock('../../hooks/useWeather', () => ({
  useWeather: () => mocked.weather,
}));

vi.mock('../../state/children-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useChildren: () => ({ active: null, children: [], setActiveId: () => {} }),
}));

vi.mock('../../state/location-pref-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLocationPref: (selector: (state: Record<string, unknown>) => unknown) => selector({
    mode: 'manual',
    automaticPlace: null,
    automaticGeneration: 0,
  }),
}));

vi.mock('../../state/swap-override-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSwapOverride: (selector: (state: Record<string, unknown>) => unknown) => selector({ swaps: {} }),
}));

vi.mock('../../lib/premium/use-access', () => ({
  useAccess: () => ({ isPremium: true, loading: false }),
}));

vi.mock('../../lib/haptics/system', () => ({
  useHapticSystem: () => ({ fire: async () => {}, prepare: async () => {} }),
  fire: async () => {},
  prepare: async () => {},
}));

const { UkeScreen } = await import('../UkeScreen');

/** 2026-02-12 er vintertid i Oslo (UTC+1) — lokal time h ligger på UTC h-1. */
function osloInstant(localHour: number): Date {
  return new Date(Date.UTC(2026, 1, 12, localHour - 1));
}

const EVALUATED_AT = osloInstant(8).getTime();
const FETCHED_AT = EVALUATED_AT - 5 * 60 * 1000;

const METADATA: ForecastFetchMetadata = {
  source: 'network',
  sourceUpdatedAt: new Date(FETCHED_AT).toISOString(),
  fetchedAt: FETCHED_AT,
  evaluatedAt: EVALUATED_AT,
  cacheStatus: 'miss',
  stale: false,
};

function hourlyDay(tempAt: (localHour: number) => number): WeatherHourly[] {
  return Array.from({ length: 24 }, (_, localHour) => {
    const tempC = tempAt(localHour);
    return {
      time: osloInstant(localHour),
      tempC,
      feelsLikeC: tempC - 2,
      windMs: 2,
      precipMmH: 0,
      symbolCode: 'partlycloudy_day',
    };
  });
}

function renderPlanlegg(hourly: readonly WeatherHourly[]): string {
  const coverage = assessForecastCoverage(
    hourly.map((point) => point.time.toISOString()),
    METADATA,
  );
  expect(coverage.status).toBe('complete-hourly');
  mocked.weather = {
    status: 'ready',
    now: null,
    hourly: [...hourly],
    daily: [],
    dailyAtHour: [],
    forecast: null,
    offlineForecast: null,
    error: null,
    evidence: { metadata: METADATA, coverage },
    freshness: { kind: 'fresh', fetchedAt: FETCHED_AT, revalidating: false },
    lastKnownNow: null,
  };
  return renderToStaticMarkup(
    <UkeScreen
      onNavigate={() => {}}
      onOpenSheet={() => {}}
      onOpenPlannedOutfit={() => {}}
    />,
  );
}

function count(markup: string, needle: string): number {
  return markup.split(needle).length - 1;
}

describe('Planlegg → værkortets topp', () => {
  it('«I dag» står ÉN gang: som aktivt segment, ikke også som etikett i værkortet', () => {
    const markup = renderPlanlegg(hourlyDay(() => -3));

    // Ikke-vakuøsitet 1: værkortet med hero-tallet ble faktisk rendret — uten
    // det ville «ingen etikett» vært et fravær av hele flaten, ikke en
    // rettelse. (`showWeatherHero` + `heroWeather` i UkeScreen.tsx.)
    expect(markup).toContain('class="planlegg-weather"');
    expect(markup).toContain('class="planlegg-weather__temp"');
    expect(markup).toContain('class="planlegg-weather__condition"');

    // Ikke-vakuøsitet 2: det ER «I dag»-visningen vi ser på — segmentet med
    // value="today" er det avkryssede i visningsvelgeren.
    const valgtSegment = [...markup.matchAll(
      /<label class="segmented-control__segment is-checked"[^>]*>([\s\S]*?)<\/label>/gu,
    )].map((treff) => treff[1]!);
    expect(valgtSegment).toHaveLength(1);
    expect(valgtSegment[0]).toContain('value="today"');
    expect(valgtSegment[0]).toContain('<span>I dag</span>');

    // Planlegg er bevisst avgrenset til de to dagene det finnes et konkret
    // timegrunnlag for. Uke og Snart skal ikke kunne dukke opp igjen via
    // tilgangsflagg eller gamle deep links.
    expect(count(markup, 'class="segmented-control__segment')).toBe(2);
    expect(markup).toContain('value="tomorrow"');
    expect(markup).toContain('<span>I morgen</span>');
    expect(markup).not.toContain('<span>Uke</span>');
    expect(markup).not.toContain('<span>Snart</span>');

    // Selve rettelsen: etiketten inne i kortet er borte, og ordet «I dag»
    // står nøyaktig én gang i hele skjermens markup.
    expect(markup).not.toContain('planlegg-weather__day');
    expect(count(markup, '>I dag<')).toBe(1);

    // Skjermleseren mister ingenting: seksjonens aria-label sier fortsatt
    // hvilken dag kortet gjelder (der finnes ingen fanepille å gjenta).
    expect(markup).toContain('aria-label="Været I dag"');
  });

  it('gradtegnet på hero-temperaturen lander på versalhøyden, ikke midt på sifferet', async () => {
    const css = await readFile(
      fileURLToPath(new URL('../UkeScreen.css', import.meta.url)),
      'utf8',
    );
    const utenKommentarer = css.replace(/\/\*[\s\S]*?\*\//gu, '');

    function regel(selektor: string): string {
      const escaped = selektor.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      const treff = utenKommentarer.match(
        new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'u'),
      );
      expect(treff, `fant ingen regel for ${selektor}`).not.toBeNull();
      return treff![1]!;
    }

    function deklarasjon(blokk: string, egenskap: string): string {
      const treff = blokk.match(new RegExp(`(?:^|;)\\s*${egenskap}\\s*:\\s*([^;]+)`, 'u'));
      expect(treff, `fant ingen ${egenskap} i regelen`).not.toBeNull();
      return treff![1]!.trim();
    }

    const tallRegel = regel('.planlegg-weather__temp');
    const supRegel = regel('.planlegg-weather__temp sup');

    // Ikke-vakuøsitet: dette ER hero-temperaturen — den ene tillatte
    // Fraunces-rollen (DESIGN.md, tokens v2). Måler vi noe annet, er
    // fontmetrikk-forholdene under feil fasit.
    expect(deklarasjon(tallRegel, 'font-family')).toBe('var(--dw-font-hero)');

    // Alle mål i rem, så den flytende rot-fontstørrelsen (design-tokens.css:
    // clamp(15px, 0.9rem + 0.5vw, 18px)) forkorter bort.
    function rem(verdi: string): number {
      const treff = /^(-?\d*\.?\d+)rem$/u.exec(verdi);
      expect(treff, `forventet en rem-verdi, fikk «${verdi}»`).not.toBeNull();
      return Number(treff![1]);
    }

    const tallStorrelse = rem(deklarasjon(tallRegel, 'font-size'));   // 3rem
    const supStorrelse = rem(deklarasjon(supRegel, 'font-size'));     // 1.375rem
    // line-height er unitless og ARVES ned i sup-en — det er nettopp den
    // arven prosent-varianten av vertical-align måles mot.
    const linjehoyde = Number(deklarasjon(tallRegel, 'line-height'));
    expect(Number.isFinite(linjehoyde)).toBe(true);

    // Løftet, oversatt til rem etter CSS-ens egne regler for enheten.
    const justering = deklarasjon(supRegel, 'vertical-align');
    let loftRem: number;
    if (justering.endsWith('%')) {
      // Prosent måles mot elementets EGEN line-height — mekanismen i funnet.
      loftRem = (Number.parseFloat(justering) / 100) * linjehoyde * supStorrelse;
    } else if (justering.endsWith('em')) {
      loftRem = Number.parseFloat(justering) * supStorrelse;
    } else if (justering.endsWith('rem')) {
      loftRem = Number.parseFloat(justering);
    } else {
      throw new Error(`vertical-align «${justering}» har ingen målbar lengde`);
    }

    /* Fontmetrikk-forholdene er lest ut av revisjonens egne pikselmålinger
       (780x1688-bildet, 2x, rot-rem ≈ 16,35 px):
         sifferet «1» y 411–482 → 35,5 CSS px versalhøyde på et 3rem-tall
           → 0,724 av tallets font-size
         ringen y 441–454, topp 20,5 CSS px over grunnlinjen, hvorav 6,0 px
           var det gamle 28 %-løftet → 0,646 av sup-ens egen font-size */
    const VERSALHOYDE_ANDEL = 0.724;
    const RING_TOPP_ANDEL = 0.646;

    const versalhoyde = VERSALHOYDE_ANDEL * tallStorrelse;
    const ringTopp = loftRem + RING_TOPP_ANDEL * supStorrelse;

    // ±0,1rem ≈ 1,6 CSS px: nok slingring for fontmetrikk-avrunding, men
    // langt fra de 0,92rem (≈15 px) den midtstilte ringen bommet med.
    expect(Math.abs(ringTopp - versalhoyde)).toBeLessThanOrEqual(0.1);

    // Og ringen skal ikke skytes OVER tallet heller: da vokser hero-radens
    // linjeboks og løftet flytter innholdet under seg.
    expect(ringTopp).toBeLessThanOrEqual(versalhoyde + 0.1);
  });
});
