/**
 * DAGSLINJEN MÅ FAKTISK VÆRE EN LINJE.
 *
 * ═══ FUNNET (ekstern kritikk 2026-08-06) ═════════════════════════════════
 * Under overskriften «Dagslinjen» sto NØYAKTIG én tekstrad — «Samme antrekk i
 * de vurderte tidspunktene» — uten et eneste klokkeslett. Linjen rett OVER
 * kortet («Ingen endringer frem til kl. 18:00») var mer presis enn selve
 * tidslinjen.
 *
 * ═══ MEKANISMEN, IKKE SYMPTOMET ══════════════════════════════════════════
 * Pikselen kom ikke fra CSS. Den kom fra radmodellen:
 *
 *   1. `selectTodayPlanningHours` (today-hours.ts:3) velger dagsrasteret
 *      kl. 06/10/14/18 — FIRE punkter, fire timer fra hverandre.
 *   2. Uten endringsevents returnerer `buildPlanningRailRows` én eneste
 *      'unchanged'-rad (rail-rows.ts:335).
 *   3. `unchangedCopy` (rail-rows.ts:145-158) krever `complete-hourly` OG
 *      `hasExactHourlyAdjacency(points)` for å kunne si «til kl. HH:MM».
 *      Rasteret er 4-timers, så den faller til den generiske strengen på
 *      rail-rows.ts:150.
 *
 * Tidspunktene fantes altså i data hele veien (`plan-view-model.ts` sin
 * `canonicalForecast` eksponerer ett forecast-punkt per vurdert tidspunkt med
 * temperatur og symbolkode). De ble bare aldri vist.
 *
 * ═══ HVA DENNE PORTEN MÅLER ══════════════════════════════════════════════
 * Ikke kildetekst. Fixturen nedenfor gjenskaper NØYAKTIG tilstanden kritikeren
 * så — komplett timesdekning, 4-timers vurderingsraster, identisk vær på alle
 * fire punkter, altså null endringsevents og `status: 'empty'` — og renderer
 * skjermen. Porten stryker hvis:
 *
 *   • linjen fjernes igjen (0 punkter under overskriften som lover en linje),
 *   • punktene mister klokkeslett eller temperatur,
 *   • den generiske 'unchanged'-raden legges tilbake ved siden av linjen
 *     (samme faktum for tredje gang, i systemspråk).
 *
 * IKKE-VAKUØSITET: hver test asserterer først at fixturen faktisk traff den
 * tilstanden den påstår å måle — tomtilstandens «Antrekket holder» +
 * «Ingen endringer frem til kl. 18:00.» i test 1, og en ekte endringsrad i
 * skinnen i test 2. Renderer fixturen noe annet enn skjermen funnet gjelder,
 * er porten rød før den i det hele tatt ser på tidslinjen.
 *
 * MUTASJONSBEVIS (kjørt 2026-08-06):
 *   a) `<ol className="planlegg-dagslinje">` slått av i UkeScreen.tsx
 *      → RØD i BEGGE tester: «expected [] to deeply equal ['06:00','10:00',
 *      '14:00','18:00']».
 *   b) `railChangeRows` byttet tilbake til `planningEvaluation.rows`
 *      → RØD i test 1: «expected … not to contain 'Samme antrekk i de
 *      vurderte tidspunktene'».
 *   c) antrekksmerket byttet tilbake til `orderedGarments.at(-1)`
 *      → RØD i test 1: «expected +0 to be 4» (merket ble et par sokker).
 *   d) alle tre gjenopprettet → GRØNN.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { assessForecastCoverage } from '../../lib/planning/coverage';
import { recommend } from '../../lib/wool-layers/recommend';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import type { ForecastFetchMetadata, WeatherHourly } from '../../lib/met-no/types';

/* ── Mocks: alt UkeScreen trenger UTENOM planleggingskjeden vi måler ───────
   Vær-, barn-, sted-, tilgangs- og haptikk-lagene byttes ut; hele
   planleggingskjeden (selectTodayPlanningHours → recommend →
   buildPlanViewModel → buildPlanningRailRows) kjører ekte. */
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

/**
 * Timesdekning gjennom hele det lokale døgnet. `tempAt` bestemmer om de fire
 * vurderte punktene (06/10/14/18) gir samme antrekk eller ikke.
 */
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

function weatherStateFor(hourly: readonly WeatherHourly[]): unknown {
  const coverage = assessForecastCoverage(
    hourly.map((point) => point.time.toISOString()),
    METADATA,
  );
  // Fixturen skal gjenskape kritikkens skjerm, ikke en degradert variant.
  expect(coverage.status).toBe('complete-hourly');
  return {
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
}

function renderPlanlegg(hourly: readonly WeatherHourly[]): string {
  mocked.weather = weatherStateFor(hourly);
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

type TimelineItem = Readonly<{ clock: string; temp: string; changed: boolean; hasMark: boolean }>;

/** Punktene inne i selve dagslinjen, i rendret rekkefølge. */
function timelineItems(markup: string): TimelineItem[] {
  const list = /<ol class="planlegg-dagslinje"[^>]*>([\s\S]*?)<\/ol>/u.exec(markup)?.[1] ?? '';
  return [...list.matchAll(/<li class="planlegg-dagslinje__punkt"([^>]*)>([\s\S]*?)<\/li>/gu)]
    .map((match) => ({
      clock: /class="planlegg-dagslinje__tid"[^>]*>([^<]+)</u.exec(match[2]!)?.[1] ?? '',
      temp: /class="planlegg-dagslinje__temp">([^<]+)</u.exec(match[2]!)?.[1] ?? '',
      changed: match[1]!.includes('data-endring="ja"'),
      hasMark: match[2]!.includes('class="planlegg-dagslinje__merke"'),
    }));
}

const MINUS = '−';

/** Yttertøyet motoren faktisk anbefaler for fixturens vær — merkets fasit. */
function forventetYttertoy(tempC: number): string {
  const layers = recommend({
    weather: {
      tempC,
      feelsLikeC: tempC - 2,
      windMs: 2,
      precipMmH: 0,
      symbolCode: 'partlycloudy_day',
    },
    child: { ageMonths: 12 },
    activity: 'utelek',
  }).layers;
  const item = layers.find((layer) => layer.category === 'yttertoy')?.items[0];
  expect(item, 'fixturen må gi et yttertøy-lag å måle merket mot').toBeDefined();
  return displayNameForDbString(item!);
}

describe('Planlegg → Dagslinjen viser det faktiske vurderingsrasteret', () => {
  it('tomtilstanden: overskriften som lover en linje viser fire tidspunkt med temperatur og antrekksmerke — ikke én generisk setning', () => {
    // Samme vær hele døgnet ⇒ identisk ferdigstilt antrekk på alle fire
    // vurderte punkter ⇒ ingen endringsevents ⇒ plan-view-model 'empty'.
    const markup = renderPlanlegg(hourlyDay(() => -3));

    // Ikke-vakuøsitet: dette ER skjermen funnet gjelder.
    expect(markup).toContain('Antrekket holder');
    expect(markup).toContain('Ingen endringer frem til kl. 18:00.');
    expect(markup).toContain('>Dagslinjen</h2>');

    // Selve rettelsen: rasteret fra today-hours.ts er synlig, med klokkeslett,
    // temperatur og et antrekksmerke per punkt.
    const punkter = timelineItems(markup);
    expect(punkter.map((punkt) => punkt.clock)).toEqual(['06:00', '10:00', '14:00', '18:00']);
    expect(punkter.map((punkt) => punkt.temp)).toEqual(Array(4).fill(`${MINUS}3°`));
    expect(punkter.every((punkt) => punkt.hasMark)).toBe(true);

    // Merket viser YTTERTØYET, ikke siste element i den lagvise plagglista —
    // tilbehøret ('ekstra': lue/votter/hals/sokker) ligger etter yttertøyet
    // der, så en .at(-1) hadde merket dagen med et par sokker.
    expect(count(
      markup,
      `class="planlegg-dagslinje__merke" title="${forventetYttertoy(-3)}"`,
    )).toBe(4);

    // Maskinlesbar tid peker på de faktiske vurderte øyeblikkene, ikke på
    // oppdiktede klokkeslett. (React SSR skriver ut attributtet som
    // `dateTime` — HTML-attributter er case-insensitive.)
    for (const localHour of [6, 10, 14, 18]) {
      expect(markup).toContain(`dateTime="${osloInstant(localHour).toISOString()}"`);
    }

    // Gjentakelsen er borte: den generiske 'unchanged'-raden sa det samme som
    // setningen over, i systemspråk, om tidspunkter forelderen ikke så.
    expect(markup).not.toContain('Samme antrekk i de vurderte tidspunktene');
    expect(markup).not.toContain('plan-change-rail__unchanged');
  });

  it('med en ekte endring: linjen merker punktet endringen skjer på, og temperaturene følger værdataene', () => {
    // Kaldt til og med kl. 12, mildt etterpå ⇒ 06/10 får ett antrekk, 14/18
    // et annet ⇒ minst én PlanningChangeEvent på 14:00-punktet.
    const markup = renderPlanlegg(hourlyDay((localHour) => (localHour <= 12 ? -8 : 14)));

    // Ikke-vakuøsitet: fixturen produserte faktisk en endringsrad i skinnen.
    expect(count(markup, 'class="plan-change-rail__disclosure"')).toBeGreaterThan(0);
    expect(markup).not.toContain('Neste endring er kl. 14:00. Se detaljene i dagslinjen.');
    expect(markup).not.toContain('class="planlegg-screen__action"');
    expect(markup).toContain('class="plan-change-rail__disclosure" aria-expanded="false"');
    expect(markup).toContain('class="plan-change-rail__read-more-label">Les mer');
    expect(markup).toContain('class="plan-change-rail__compact-label" aria-hidden="true">Ta av');
    expect(markup).toContain('class="plan-change-rail__compact-label" aria-hidden="true">Ta på');

    const punkter = timelineItems(markup);
    expect(punkter.map((punkt) => punkt.clock)).toEqual(['06:00', '10:00', '14:00', '18:00']);

    // Temperaturene er punktenes egne, ikke én gjentatt verdi.
    expect(punkter.map((punkt) => punkt.temp))
      .toEqual([`${MINUS}8°`, `${MINUS}8°`, '14°', '14°']);

    // Nøyaktig ett punkt er merket som endringspunkt, og det er 14:00 —
    // samme tidspunkt som skinnens endringsrad står på.
    expect(punkter.filter((punkt) => punkt.changed).map((punkt) => punkt.clock)).toEqual(['14:00']);
    expect(count(markup, 'class="planlegg-dagslinje__endring">Endring')).toBe(1);
    const railClocks = [...markup.matchAll(
      /<time dateTime="([^"]+)">/gu,
    )].map((match) => match[1]!);
    expect(railClocks).toEqual([osloInstant(14).toISOString()]);
  });
});
