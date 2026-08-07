import { chromium, type Page } from 'playwright';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { PAGE_CATALOG, RUBRIC_VERSION, VIEWPORT } from './config';
import type { CaptureAction, CaptureManifest, CaptureResult, PageId } from './types';

const BLOCKED_ACTIONS = new Set([
  'confirm-purchase', 'restore-purchase', 'delete-child', 'send-invitation',
  'enable-notifications', 'write-production', 'apply',
]);

/**
 * VÆRFIXTUREN — lånt fra e2e, ikke skrevet på nytt.
 *
 * FUNN 2026-08-05: revisjonen bygde sin EGEN fixtur, og den sendte
 * `properties.meta.units: {}`. Klienten (src/lib/met-no/client.ts) krever at
 * units matcher CONSUMED_UNIT_CONTRACT EKSAKT — svaret ble derfor forkastet,
 * appen falt til «sist kjente vær», og CTA-en sto DEAKTIVERT.
 *
 * Følgen var stille og alvorlig: tre av elleve skjermer kunne ikke nås, og
 * revisjonen rapporterte «8/11 fanget» uten å si at de tre manglet FORDI
 * fixturen var feil. Den målte åtte skjermer og sa god for seg selv.
 *
 * e2e/fixtures/forecast-1c-partlycloudy.js løste dette for lenge siden, og
 * dens eget filhode beskriver NØYAKTIG samme feil: «CTA-en sto disabled.
 * Alle portene strøk fordi knappen aldri ble trykket, ikke fordi funksjonen
 * manglet.» To fixturer for samme kontrakt er én fixtur for mye.
 */
import { forecastPartlyCloudy1C } from '../../e2e/fixtures/forecast-1c-partlycloudy.js';

/* Re-eksporteres saa testene kan proeve NOYAKTIG den fixturen appen far. */
export const buildForecastFixture = forecastPartlyCloudy1C;

export function assertReadOnlyAction(action: string): void {
  if (BLOCKED_ACTIONS.has(action)) {
    throw new Error(`Blocked by read-only audit boundary: ${action}`);
  }
}

/**
 * DEN LESE-ONLY GRENSEN, OGSÅ FOR URL-EN.
 *
 * Revisjonen trenger å se appen som en IKKE-betalende forelder ser den.
 * Den skal likevel ikke skrive i produktets tilstand — ingen localStorage-
 * planting, ingen simulerte kjøp. Veien inn er produktets EGET, dokumenterte
 * test-håndtak: `?seed=demo&entitlement=none`
 * (src/state/subscription-store.ts, resolveDemoEntitlementOverride).
 *
 * Listen er bevisst kort, og verdiene er låst. `entitlement` kan kun be om
 * MINDRE tilgang («none») — revisjonen skal aldri kunne gi seg selv Pluss via
 * URL-en, for da måler den igjen en app ingen forelder har.
 */
const ALLOWED_QUERY: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['entitlement', new Set(['none'])],
]);

export function assertReadOnlyQuery(query?: Readonly<Record<string, string>>): void {
  for (const [key, value] of Object.entries(query ?? {})) {
    const tillatteVerdier = ALLOWED_QUERY.get(key);
    if (!tillatteVerdier) {
      throw new Error(`Blocked by read-only audit boundary: query parameter ${key}`);
    }
    if (!tillatteVerdier.has(value)) {
      throw new Error(`Blocked by read-only audit boundary: query ${key}=${value}`);
    }
  }
}

export interface CapturePlanItem {
  pageId: PageId;
  pageLabel: string;
  stateId: string;
  stateLabel: string;
  required: boolean;
  actions: CaptureAction[];
  expectedText?: string;
  query?: Readonly<Record<string, string>>;
}

export function buildCapturePlan(): CapturePlanItem[] {
  return PAGE_CATALOG.flatMap((page) => page.states.map((state) => ({
    pageId: page.id,
    pageLabel: page.label,
    stateId: state.id,
    stateLabel: state.label,
    required: state.required,
    actions: [...state.actions],
    expectedText: state.expectedText,
    query: state.query,
  })));
}

export function seededUrl(
  baseUrl: string,
  onboarding: boolean,
  query?: Readonly<Record<string, string>>,
): string {
  assertReadOnlyQuery(query);
  const url = new URL(baseUrl);
  if (!onboarding) url.searchParams.set('seed', 'demo');
  /* Tilstandens egne parametere legges på ETTER seed, fordi produktets
     håndtak (entitlement=none) kun leses når `seed` finnes i det hele tatt
     (resolveDemoEntitlementOverride returnerer null uten den). */
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

async function clickFirst(page: Page, candidates: ReturnType<Page['locator']>[], merkelapp?: string): Promise<void> {
  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.first().click({ timeout: 8_000 });
      return;
    }
  }
  /* Feilmeldingen NAVNGIR hva som ikke ble funnet. «Navigation target not
     found» sa ingenting om hvilken handling som feilet, og en revisjon som
     ikke kan si hva den lette etter, kan ikke rettes uten gjetting. */
  throw new Error('Navigation target not found: ' + (merkelapp ?? '(uten merkelapp)'));
}

async function performAction(page: Page, action: CaptureAction): Promise<void> {
  assertReadOnlyAction(action.type);
  if (action.type === 'clear-storage') {
    await page.evaluate(() => window.localStorage.clear());
    return;
  }
  if (action.type === 'reload') {
    await page.reload({ waitUntil: 'networkidle' });
    return;
  }
  if (action.type === 'wait') {
    await page.waitForTimeout(action.milliseconds);
    return;
  }
  const pattern = new RegExp(action.type === 'tab' ? action.name : action.pattern, 'i');
  if (action.type === 'tab') {
    await clickFirst(page, [
      page.getByRole('button', { name: pattern }),
      page.locator('nav[aria-label="Hovednavigasjon"] button').filter({ hasText: pattern }),
    ], `fane «${action.name}»`);
    await page.waitForTimeout(350);
    return;
  }
  if (action.type === 'button') {
    /* Tre kandidater, ikke to. FUNN 2026-08-06: «Juster» og bibliotekets
       inngang er IKONKNAPPER uten synlig tekst — de bar bare en aria-label.
       getByRole traff ikke, hasText traff ikke (ingen tekst), og revisjonen
       meldte «Navigation target not found» for to av elleve skjermer. */
    await clickFirst(page, [
      page.getByRole('button', { name: pattern }),
      page.locator('button').filter({ hasText: pattern }),
      page.locator(`button[aria-label*="${action.pattern}" i], [role="button"][aria-label*="${action.pattern}" i]`),
    ], `knapp «${action.pattern}»`);
    await page.waitForTimeout(350);
    return;
  }
  await clickFirst(page, [page.getByText(pattern), page.locator('button, a').filter({ hasText: pattern })], `tekst «${action.pattern}»`);
  await page.waitForTimeout(350);
}

/**
 * Venter til layouten står stille — måler settling i stedet for å anta den.
 *
 * Avlesningen er en signatur av det som flytter seg når en skjerm setter seg:
 * dokumenthøyden, og boksen til hovedinnholdet. Tre like avlesninger på rad
 * betyr at ingenting lenger vokser, laster eller animerer inn.
 *
 * Taket på 4 s er en NØDBREMS, ikke en tidsplan. Slår den inn, er skjermen
 * enten fortsatt i bevegelse (uendelig animasjon) eller treg — og da skal
 * fangsten tas uansett, slik at bildet finnes å se på. Vi bytter altså aldri
 * et manglende bilde mot et for tidlig bilde; vi gjør det for tidlige bildet
 * sjeldent.
 */
async function ventTilRo(page: Page): Promise<void> {
  const les = async (): Promise<string> => page.evaluate(() => {
    const hoved = document.querySelector('main, [role="main"], #root') ?? document.body;
    const r = hoved.getBoundingClientRect();
    return [
      document.documentElement.scrollHeight,
      Math.round(r.width), Math.round(r.height), Math.round(r.top),
      document.querySelectorAll('img:not([complete])').length,
    ].join('|');
  });

  const frist = Date.now() + 4_000;
  let forrige = await les();
  let like = 0;
  while (Date.now() < frist) {
    await page.waitForTimeout(120);
    const na = await les();
    like = na === forrige ? like + 1 : 0;
    forrige = na;
    if (like >= 3) return;
  }
}

/**
 * Nekter å revidere en UTVIKLINGSSERVER.
 *
 * FUNN 2026-08-06: revisjonen kjørte mot `vite dev`, og et dommerpanel meldte
 * BLOKKERENDE på «De som passer»-listen i Innstillinger — teksten var klippet
 * og siste rad lå bak tab-baren.
 *
 * Hele seksjonen ligger bak `import.meta.env.DEV` (InnstillingerScreen.tsx:
 * 1956). Den sendes ALDRI til en forelder. Det samme gjelder widget-spike-
 * panelet. Målt mot produksjonsbygget viser skjermen noe helt annet: «Vær &
 * sted» der forhåndsvisningen sto.
 *
 * Revisjonen målte altså en app som ikke finnes, og funnene var umulige å
 * skille fra ekte — begge har «bevis i pikslene». Et bevis fra feil bygg er
 * ikke et svakere bevis; det er et bevis for noe annet.
 *
 * Vite injiserer `/@vite/client` i dev og aldri i et bygg. Vi ser derfor
 * etter den, og stopper med en navngitt feil i stedet for å revidere videre.
 */
async function avvisUtviklingsserver(page: Page, baseUrl: string): Promise<void> {
  const erDev = await page.evaluate(() =>
    Boolean(document.querySelector('script[src*="/@vite/client"]'))
    || Boolean((window as unknown as { __vite_plugin_react_preamble_installed__?: boolean })
      .__vite_plugin_react_preamble_installed__));
  if (!erDev) return;
  throw new Error(
    'Revisjonen peker på en UTVIKLINGSSERVER (' + baseUrl + '). '
    + 'Dev-bygget viser flater som aldri sendes til en forelder — '
    + '«De som passer»-forhåndsvisningen og widget-spike-panelet er begge '
    + 'bak import.meta.env.DEV. Funn derfra kan ikke skilles fra ekte funn. '
    + 'Kjør «npm run build && npm run preview -- --port 4173» og pek hit med '
    + '--base-url http://localhost:4173.',
  );
}

async function validateScreenshot(file: string): Promise<void> {
  const info = await stat(file);
  if (info.size < 10_000) throw new Error(`Screenshot is unexpectedly small (${info.size} bytes)`);
}

export async function captureAudit(options: {
  baseUrl: string;
  runId: string;
  runDir: string;
}): Promise<CaptureManifest> {
  const screenshotsDir = join(options.runDir, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'nb-NO',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  await context.route('**/api/forecast**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildForecastFixture()) });
  });
  const captures: CaptureResult[] = [];

  try {
    for (const item of buildCapturePlan()) {
      const page = await context.newPage();
      const file = join(screenshotsDir, `${item.pageId}--${item.stateId}.png`);
      try {
        /* ═══ HVER FANGST STARTER RENT ═══════════════════════════════════
           FUNN 2026-08-06: revisjonen var REKKEFØLGEAVHENGIG, og feilen så
           ut som noe annet.

           Sidene deler nettleserkontekst, og appen HUSKER forrige svar. Når
           «Påkledning» hadde kjørt seremonien, lå resultatet i lageret — og
           neste side hoppet rett til svaret, slik appen skal
           (`decideScanEntry`: eksakt cachet resultat → ingen koreografi).
           Da fantes ikke «Finn dagens antrekk», og to skjermer kunne ikke
           nås. Feilmeldingen pekte på «Juster», som var uskyldig.

           En revisjon der resultatet avhenger av hvilken side som kjørte
           først, kan ikke sammenlignes med seg selv. Lageret tømmes derfor
           før hver fangst. Skal en cachet tilstand revideres, må den være
           en DEKLARERT tilstand i katalogen — ikke et sideutslag av
           rekkefølgen. ══════════════════════════════════════════════════ */
        const url = seededUrl(options.baseUrl, item.pageId === 'onboarding', item.query);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.evaluate(() => {
          try { localStorage.clear(); sessionStorage.clear(); } catch { /* ikke tilgjengelig */ }
        });
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        await avvisUtviklingsserver(page, options.baseUrl);
        await page.waitForTimeout(1200);
        for (const action of item.actions) await performAction(page, action);
        /* ═══ LAYOUTEN MÅ HA SATT SEG FØR VI SKYTER ═══════════════════════
           FUNN 2026-08-06, og det er et alvorlig et: revisjonen fanget TOG-
           skjermen mens den ennå ikke var ferdig. «ANBEFALT TOG»-kortet ble
           48 px høyt og inneholdt kun etiketten. Et dommerpanel leste bildet
           og meldte BLOKKERENDE: «selve svaret skjermen finnes for mangler».

           Kortet manglet ingenting. Målt i det levende DOM-et er seksjonen
           350×193 med «2.5», «tog», «Romtemperatur» og «20 °C» på plass, i
           BEGGE temaer. Med nøyaktig samme animations: 'disabled' — men
           1500 ms senere — er kortet fullt i skjermbildet også.

           Linjen som sto her så ut som en beskyttelse mot nettopp dette:
               await page.evaluate(() => document.fonts.ready)
           Den er verdiløs. document.fonts.ready løses med et FontFaceSet,
           som ikke kan serialiseres over CDP. Playwright får ikke ventet på
           noe meningsfullt, og kallet returnerer uansett. En vakt som ser
           riktig ut og måler ingenting.

           Dette er dyrere enn en vanlig feil, for skjermbildene ER
           bevisgrunnlaget. Et bilde tatt for tidlig produserer funn som
           ikke finnes, og de er umulige å skille fra ekte funn — begge har
           «bevis i pikslene».

           Vi venter derfor på at layouten faktisk STÅR STILLE: samme
           dokumenthøyde og samme boks på hovedinnholdet i tre påfølgende
           avlesninger. Det måler settling i stedet for å anta den.
           ══════════════════════════════════════════════════════════════ */
        await page.evaluate(async () => { await document.fonts.ready; });
        await ventTilRo(page);
        if (item.expectedText) await page.getByText(new RegExp(item.expectedText, 'i')).first().waitFor({ timeout: 5_000 });
        await ventTilRo(page);
        await page.screenshot({ path: file, fullPage: false, animations: 'disabled' });
        await validateScreenshot(file);
        captures.push({
          pageId: item.pageId, pageLabel: item.pageLabel, stateId: item.stateId,
          stateLabel: item.stateLabel, required: item.required,
          file: relative(options.runDir, file).replaceAll('\\', '/'), status: 'captured', error: null,
          capturedAt: new Date().toISOString(),
        });
      } catch (error) {
        captures.push({
          pageId: item.pageId, pageLabel: item.pageLabel, stateId: item.stateId,
          stateLabel: item.stateLabel, required: item.required, file: null, status: 'failed',
          error: error instanceof Error ? error.message : String(error), capturedAt: new Date().toISOString(),
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const manifest: CaptureManifest = {
    runId: options.runId, rubricVersion: RUBRIC_VERSION, baseUrl: options.baseUrl,
    viewport: VIEWPORT, locale: 'nb-NO', createdAt: new Date().toISOString(), captures,
  };
  await writeFile(join(options.runDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}
