/**
 * ATOM A1 — fokusringen er en DESIGNET tilstand, ikke en slettet tilstand.
 *
 * Bakgrunn: WebKits blå standardring dukket opp når `titleRef.current?.focus()`
 * flyttet fokus til dialogoverskriften, og ble «fikset» med `outline: 'none'`
 * inline på de tre overskriftene. En inline outline gjelder ALLE fokusmodus og
 * kan ikke overstyres av et stilark — tastatur- og VoiceOver-brukere mistet
 * dermed den eneste indikatoren på hvor de var.
 *   Web Interface Guidelines: «Never outline-none without focus replacement.»
 *   Impeccable-registeret: hver interaktiv komponent skal ha
 *   default/hover/focus/active/disabled/loading/error.
 *
 * Testene under er skrevet slik at de STRYKER på koden som var her før:
 *   · test 1 og 6 feiler på `outline: 'none'` i inline style (kilde og markup),
 *   · test 2 feiler på enhver outline-sletting utenfor `:focus:not(:focus-visible)`,
 *   · test 5 og 7 feiler hvis ringen males i --dw-focus/--focus-ring, som er
 *     kalibrert for espresso og ligger på ~1,7:1 mot krem-lerretet i lys modus.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recommend } from '../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../lib/wool-layers/types.js';
import { createPlannedOutfitContext } from '../../lib/planning/planned-outfit-context.js';
import { produceOutfitBundle } from '../../lib/outfit/outfit-bundle-producer.js';

const screenPath = 'src/screens/PaakledningScreen.tsx';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

/** Henter innholdet i en template-literal-konstant ut av kildeteksten. */
function templateConstant(src: string, name: string): string {
  const marker = `const ${name} = \``;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`fant ikke ${name} i kilden`);
  const from = start + marker.length;
  const end = src.indexOf('`;', from);
  if (end < 0) throw new Error(`fant ikke slutten på ${name}`);
  return src.slice(from, end);
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Alle `selektor { body }`-par i en CSS-streng. */
function rules(css: string): { selector: string; body: string }[] {
  return [...stripComments(css).matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2].trim(),
  }));
}

/* ── Fikstur: én ekte planlagt kontekst + ett ekte bundle ─────────────────── */

function plannedFixture(accessAllowed: boolean) {
  const input: RecommendInput = {
    weather: {
      tempC: 5,
      feelsLikeC: 4,
      windMs: 1,
      precipMmH: 0,
      humidity: 72,
      symbolCode: 'cloudy',
      uvIndex: 0,
    },
    child: { ageMonths: 10, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    innerJakke: false,
    context: { bilstol: false },
    childCalibration: 0,
  };
  const finalizedRecommendation = recommend(input);
  const plannedForIso = '2026-02-12T11:00:00.000Z';
  const garments = finalizedRecommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const equipment = finalizedRecommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);
  const context = createPlannedOutfitContext({
    planningEventId: 'paak-focus-ring',
    transitionContextId: `planning-transition:${plannedForIso}:planned-finalized:${JSON.stringify([
      garments,
      equipment,
    ])}`,
    child: { id: 'paak-child', name: 'Ada', ageMonths: input.child.ageMonths },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: { label: 'Hjemme', lat: 59.9139, lon: 10.7522, source: 'configured-place' },
    activity: input.activity,
    vognMode: null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: accessAllowed
      ? { capability: 'today_home' as const, allowed: true, reason: 'free' as const }
      : { capability: 'future_plan' as const, allowed: false, reason: 'expired' as const },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('forventet ekte produsent-kontekst');
  const bundle = produceOutfitBundle({
    seed: context.producerSeed,
    source: {
      kind: 'planned',
      sourceContextId: context.producerSeed.sourceContextId,
      planningEventId: context.planningEventId,
      plannedForIso: context.plannedForIso,
    },
  });
  if (bundle.kind !== 'supported') throw new Error('forventet ekte supported-bundle');
  return { context, bundle };
}

/* ── Tokens: løser var()-kjeder til hex per tema ──────────────────────────── */

function cssBlock(css: string, opener: string): string {
  const start = css.indexOf(`\n${opener}`);
  if (start < 0) throw new Error(`fant ikke blokken ${opener}`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}

function declarations(blockText: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of stripComments(blockText).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

function tokenTable(theme: 'dark' | 'light'): Map<string, string> {
  const v2 = source('src/styles/design-tokens-v2.css');
  const aliases = source('src/styles/design-tokens.css');
  const table = new Map<string, string>([
    // design-tokens-v2.css sin :root ER mørk modus.
    ...declarations(cssBlock(v2, ':root {')),
  ]);
  if (theme === 'light') {
    for (const [k, v] of declarations(cssBlock(v2, ':root[data-theme="light"] {'))) table.set(k, v);
  }
  // Alias-laget (--bg-canvas/--surface-pure/--accent-cta) peker på --dw-* og er
  // identisk i alle tema-blokkene; første deklarasjon holder.
  for (const [k, v] of declarations(cssBlock(aliases, ':root {'))) {
    if (!table.has(k)) table.set(k, v);
  }
  return table;
}

function resolveHex(expression: string, tokens: Map<string, string>): string {
  let value = expression.trim();
  for (let depth = 0; depth < 8; depth += 1) {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
    const named = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/.exec(value);
    if (!named) break;
    const referenced = tokens.get(named[1]);
    if (referenced !== undefined) {
      value = referenced;
      continue;
    }
    if (named[2] === undefined) break;
    value = named[2].trim();
  }
  throw new Error(`kunne ikke løse ${expression} til en hex-farge`);
}

function relativeLuminance(hex: string): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(Number.parseInt(hex.slice(1, 3), 16));
  const g = channel(Number.parseInt(hex.slice(3, 5), 16));
  const b = channel(Number.parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

afterEach(() => {
  vi.doUnmock('../../lib/outfit/feature-flags.js');
  vi.doUnmock('../../components/outfit/OutfitTruthPanel.js');
  vi.resetModules();
});

describe('PaakledningScreen — fokusringen er designet, ikke slettet', () => {
  it('1 · ingen av de programmatisk fokuserte overskriftene slår av outline inline', () => {
    const screen = source(screenPath);

    // En inline outline vinner over ethvert stilark og kan derfor ALDRI være en
    // lovlig «erstattet» fokustilstand — uansett hva CSS-en under sier.
    expect(screen).not.toMatch(/style=\{\{[^}]*outline/u);

    const headings = [...screen.matchAll(/<h2\b[\s\S]*?\n\s*>/gu)]
      .map((m) => m[0])
      .filter((tag) => tag.includes('ref={titleRef}'));
    expect(headings).toHaveLength(3);
    for (const tag of headings) {
      expect(tag).toContain('tabIndex={-1}');
      expect(tag).toContain('className="pkl-title"');
      // Kommentarene i taggen omtaler outline; det er attributtene som teller.
      const attributes = tag.replace(/^\s*\/\/.*$/gmu, '');
      expect(attributes).not.toMatch(/outline/u);
    }
  });

  it('2 · outline slettes kun i :focus:not(:focus-visible), og erstatningen finnes', () => {
    const css = templateConstant(source(screenPath), 'PKL_FOCUS_RING_CSS');
    const parsed = rules(css);
    expect(parsed.length).toBeGreaterThan(0);

    const suppressions = parsed.filter(({ body }) => /outline\s*:\s*(none|0)\b/u.test(body));
    for (const { selector } of suppressions) {
      expect(selector).toContain(':focus:not(:focus-visible)');
    }

    const replacements = parsed.filter(
      ({ selector, body }) =>
        selector.includes(':focus-visible')
        && /outline\s*:\s*[\d.]+px\s+solid\s+/u.test(body),
    );
    expect(replacements.length).toBeGreaterThanOrEqual(1);
  });

  it('3 · ringen tegnes av :focus-visible, aldri av bar :focus (museklikk skal ikke utløse den)', () => {
    const css = templateConstant(source(screenPath), 'PKL_FOCUS_RING_CSS');
    for (const { selector } of rules(css)) {
      const bareFocus = selector
        // Den sanksjonerte «ingen ring ved programmatisk fokus»-formen først …
        .replace(/:focus:not\(:focus-visible\)/gu, '')
        // … deretter selve erstatningen.
        .replace(/:focus-visible/gu, '');
      expect(bareFocus, `selektoren «${selector}» bruker :focus uten -visible`).not.toMatch(/:focus\b/u);
    }
  });

  it('4 · ringen har 2px strek og luft rundt (outline-offset ≥ 3px)', () => {
    const css = templateConstant(source(screenPath), 'PKL_FOCUS_RING_CSS');
    const ring = rules(css).find(
      ({ selector, body }) =>
        selector.includes(':focus-visible')
        && /outline\s*:\s*[\d.]+px\s+solid\s+/u.test(body),
    );
    expect(ring).toBeDefined();
    expect(ring?.body).toMatch(/outline:\s*2px solid /u);
    const offsets = [...css.matchAll(/outline-offset:\s*(\d+)px/gu)].map((m) => Number(m[1]));
    expect(offsets.length).toBeGreaterThanOrEqual(1);
    for (const offset of offsets) expect(offset).toBeGreaterThanOrEqual(3);
  });

  it('5 · ringen er synlig i BEGGE temaer — ≥ 3:1 mot lerret og dialogflate', () => {
    const css = templateConstant(source(screenPath), 'PKL_FOCUS_RING_CSS');
    const colour = /outline:\s*[\d.]+px\s+solid\s+([^;]+);/u.exec(css)?.[1];
    expect(colour).toBeDefined();

    for (const theme of ['dark', 'light'] as const) {
      const tokens = tokenTable(theme);
      const ring = resolveHex(colour as string, tokens);
      for (const surface of ['var(--bg-canvas)', 'var(--surface-pure)']) {
        const behind = resolveHex(surface, tokens);
        expect(
          contrast(ring, behind),
          `${theme}: ${colour} (${ring}) mot ${surface} (${behind})`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('6 · alle tre dialogene rendrer overskriften uten outline, med ringens CSS på plass', async () => {
    const allowed = plannedFixture(true);
    const denied = plannedFixture(false);

    vi.doMock('../../lib/outfit/feature-flags.js', () => ({ OUTFIT_TRUTH_V1_AVAILABLE: true }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: () => <section className="outfit-truth-panel">panel</section>,
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');

    const markups = [
      // 1) tilgang nektet, 2) outfit-truth-grenen, 3) legacy-grenen (uten bundle)
      renderToStaticMarkup(
        <PaakledningScreen onBack={() => undefined} plannedContext={denied.context} outfitBundle={denied.bundle} />,
      ),
      renderToStaticMarkup(
        <PaakledningScreen onBack={() => undefined} plannedContext={allowed.context} outfitBundle={allowed.bundle} />,
      ),
      renderToStaticMarkup(
        <PaakledningScreen onBack={() => undefined} plannedContext={allowed.context} />,
      ),
    ];

    for (const html of markups) {
      const heading = /<h2[^>]*id="planned-outfit-title"[^>]*>/u.exec(html)?.[0];
      expect(heading).toBeDefined();
      expect(heading).toContain('tabindex="-1"');
      expect(heading).toContain('class="pkl-title"');
      expect(heading, 'overskriften har fått en inline outline tilbake').not.toMatch(/outline/u);

      // Erstatningen skal faktisk være med i markupen — ikke bare i kilden.
      expect(html).toContain('.pkl-title:focus-visible');
      expect(html).toContain('.pkl-title:focus:not(:focus-visible)');
      expect(html).toContain('class="pkl-close"');
    }
  });

  it('7 · ingen fokusring i filen males i --dw-focus/--focus-ring (usynlig mot krem)', () => {
    const screen = source(screenPath);
    const focusRingOutlines = [...screen.matchAll(/:focus-visible[^{}]*\{[^}]*\}/gu)]
      .map((m) => m[0])
      .filter((rule) => /outline\s*:\s*[\d.]+px/u.test(rule));
    expect(focusRingOutlines.length).toBeGreaterThanOrEqual(2);
    for (const rule of focusRingOutlines) {
      expect(rule, 'fokusringen må bruke CTA-aksenten, ikke espresso-kalibrert --dw-focus')
        .not.toMatch(/--dw-focus|--focus-ring/u);
    }
  });
});
