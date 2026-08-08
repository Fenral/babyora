/**
 * ATOM C — fokusringen er MÅLT synlig i begge temaer.
 *
 * BAKGRUNN (funnet 2026-08-03): `--dw-focus` var deklarert ÉN gang, i
 * design-tokens-v2.css sin mørke `:root`. Verken `@media
 * (prefers-color-scheme: light)` eller `:root[data-theme="light"]` ga den en
 * egen verdi — så i lys modus arvet fokusringen espresso-kalibrerte #E8B98C
 * og malte seg med **1,48–1,64:1 mot krem-lerretet**. WCAG 2.1 SC 1.4.11
 * krever 3:1 for en ikke-tekstlig indikator. Ringen var altså tilstede i
 * DOM-en og borte for øyet — den verste varianten, fordi ingenting krasjer.
 *
 * Fem filer maler ringen med tokenet (PaywallDialog.tsx,
 * instrument/vertical-gauge.css, UkeScreen.css, hjem/hjem-monter.css og
 * alias-laget --focus-ring i design-tokens.css), så feilen traff hver
 * tastaturbruker på hver flate.
 *
 * En tidligere runde «løste» dette ved å FORBY tokennavnet på én skjerm.
 * Et navneforbud måler ingenting: det holder like godt om ringen er usynlig
 * av en annen grunn, og det etterlater de fire andre forbrukerne knekt.
 * Denne testen måler i stedet WCAG-kontrast fra de faktiske hex-verdiene i
 * kilden — i BEGGE temaer, mot hver flate ringen kan tegnes på.
 *
 * HVORFOR TO TOKENS: værpanelet og leseflatene har ulike materialverdier i
 * hvert tema. Portdom 25 («Lokale tokens der terskelen er lokal») peker på
 * svaret: panelet får sin EGEN ring, `--dw-focus-panel`, kalibrert mot den
 * lokale værfamilien. Mineral Garden gjør både panelet og ringen lysemodus-
 * spesifikke; eksplisitt mørk beholder Monter-kalibreringen.
 *
 * Hver port har en FORUTSETNING i tillegg til kravet — en port som passerer
 * på fravær (tomt regex-treff, forsvunnet forbruker, tema-tabell som stille
 * faller tilbake til mørk) er ingen port.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const V2 = readFileSync(join(process.cwd(), 'src/styles/design-tokens-v2.css'), 'utf8').replace(
  /\r\n/g,
  '\n',
);
const HJEM = readFileSync(join(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8').replace(
  /\r\n/g,
  '\n',
);

/* ── CSS-parsing ──────────────────────────────────────────────────────── */

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Teksten i blokken som åpner med `opener` (balanserte klammer). */
function block(css: string, opener: string): string {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`fant ikke blokken «${opener}»`);
  let depth = 0;
  for (let i = start + opener.length - 1; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i);
    }
  }
  throw new Error(`blokken «${opener}» ble aldri lukket`);
}

function declarations(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of stripComments(text).matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    out.set(m[1]!, m[2]!.trim());
  }
  return out;
}

const ROOT = declarations(block(V2, ':root {'));
const AUTO_LIGHT = declarations(
  block(block(V2, '@media (prefers-color-scheme: light) {'), ':root:not([data-theme="dark"]) {'),
);
const EXPLICIT_LIGHT = declarations(block(V2, ':root[data-theme="light"] {'));

/** Full tokentabell per tema — mørk `:root` som base, lys-blokken lagt oppå. */
function tokens(theme: 'dark' | 'light'): Map<string, string> {
  const table = new Map(ROOT);
  if (theme === 'light') for (const [k, v] of EXPLICIT_LIGHT) table.set(k, v);
  return table;
}

function resolveHex(expression: string, table: Map<string, string>): string {
  let value = expression.trim();
  for (let depth = 0; depth < 8; depth += 1) {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
    const named = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/.exec(value);
    if (!named) break;
    const referenced = table.get(named[1]!);
    if (referenced !== undefined) {
      value = referenced;
      continue;
    }
    if (named[2] === undefined) break;
    value = named[2].trim();
  }
  throw new Error(`kunne ikke løse «${expression}» til en hex-farge`);
}

/* ── WCAG 2.1: relativ luminans og kontrast, MÅLT ─────────────────────── */

function relativeLuminance(hex: string): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(Number.parseInt(hex.slice(1, 3), 16))
    + 0.7152 * channel(Number.parseInt(hex.slice(3, 5), 16))
    + 0.0722 * channel(Number.parseInt(hex.slice(5, 7), 16))
  );
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** SC 1.4.11 Non-text Contrast — fokusindikatoren er en grafisk komponent. */
const WCAG_NON_TEXT = 3;

/** Flatene den ESPRESSO-/PAPIR-side ringen kan tegnes på (outline ligger
 *  utenfor elementet, så det er containerens flate som er bakteppet). */
const PAPER_SURFACES = [
  '--dw-canvas',
  '--dw-canvas-glow',
  '--dw-raised',
  '--dw-interactive',
  '--dw-overlay',
] as const;

/** Petrol-instrumentet med hele værfamilien — tema-konstante flater. */
const PETROL_SURFACES = [
  '--dw-panel',
  '--dw-w-clear',
  '--dw-w-cloudy',
  '--dw-w-rain',
  '--dw-w-snow',
  '--dw-w-night',
] as const;

/* ── Portene ──────────────────────────────────────────────────────────── */

describe('--dw-focus — forutsetninger for at målingen betyr noe', () => {
  it('parseren finner faktisk deklarasjoner i alle tre blokkene', () => {
    // FORUTSETNING for hver eneste port under: et regex som ikke treffer noe
    // ville latt samtlige krav passere på tomhet.
    expect(ROOT.size, ':root ga ingen deklarasjoner').toBeGreaterThan(30);
    expect(AUTO_LIGHT.size, '@media-lys ga ingen deklarasjoner').toBeGreaterThan(10);
    expect(EXPLICIT_LIGHT.size, 'data-theme="light" ga ingen deklarasjoner').toBeGreaterThan(10);
  });

  it('lys-tabellen er GENUINT lys — flatene flipper mot mørk', () => {
    // FORUTSETNING: uten dette kunne en tema-tabell som stille faller
    // tilbake til mørk «bestå» hele kontrastmålingen ved å måle mørk to ganger.
    const dark = tokens('dark');
    const light = tokens('light');
    for (const surface of PAPER_SURFACES) {
      const d = resolveHex(`var(${surface})`, dark);
      const l = resolveHex(`var(${surface})`, light);
      expect(l, `${surface} er identisk i begge temaer — tabellen er ikke tema-oppløst`).not.toBe(d);
      expect(relativeLuminance(l)).toBeGreaterThan(relativeLuminance(d));
    }
  });

  it('tokenet har ekte forbrukere — minst fire filer maler ringen med det', () => {
    // FORUTSETNING: fikser vi et token ingen bruker, har vi ikke fikset noe.
    const consumers = [
      'src/components/PaywallDialog.tsx',
      'src/components/instrument/vertical-gauge.css',
      'src/screens/UkeScreen.css',
      'src/components/hjem/hjem-monter.css',
      'src/styles/design-tokens.css',
    ];
    for (const path of consumers) {
      const text = readFileSync(join(process.cwd(), path), 'utf8');
      expect(text, `${path} maler ikke lenger med var(--dw-focus)`).toMatch(/var\(--dw-focus[,)]/u);
    }
  });
});

describe('--dw-focus — MÅLT kontrast ≥ 3:1 i begge temaer', () => {
  it('er deklarert i alle tre blokkene (mørk + begge lys-inngangene)', () => {
    // KRAV. @media-blokken dekker systemtema, data-theme-blokken dekker det
    // manuelle valget i Innstillinger; mangler én av dem, arver den brukeren
    // espresso-verdien på krem — nøyaktig feilen dette atomet lukker.
    expect(ROOT.get('--dw-focus'), 'mørk :root mangler --dw-focus').toBeDefined();
    expect(AUTO_LIGHT.get('--dw-focus'), '@media-lys mangler --dw-focus').toBeDefined();
    expect(EXPLICIT_LIGHT.get('--dw-focus'), 'data-theme="light" mangler --dw-focus').toBeDefined();
  });

  it('de to lys-inngangene gir NØYAKTIG samme ring, og den er ikke mørk-verdien', () => {
    const auto = resolveHex(AUTO_LIGHT.get('--dw-focus')!, tokens('light'));
    const explicit = resolveHex(EXPLICIT_LIGHT.get('--dw-focus')!, tokens('light'));
    expect(auto, 'auto-lys og valgt-lys må gi samme ring').toBe(explicit);
    const dark = resolveHex(ROOT.get('--dw-focus')!, tokens('dark'));
    expect(auto, 'lys-verdien er bare mørk-verdien om igjen').not.toBe(dark);
  });

  it.each(['dark', 'light'] as const)(
    '%s: ringen måler ≥ 3:1 mot lerret, hevet flate og overlegg',
    (theme) => {
      const table = tokens(theme);
      const ring = resolveHex(`var(--dw-focus)`, table);
      for (const surface of PAPER_SURFACES) {
        const behind = resolveHex(`var(${surface})`, table);
        expect(
          contrast(ring, behind),
          `${theme}: --dw-focus ${ring} mot ${surface} ${behind}`,
        ).toBeGreaterThanOrEqual(WCAG_NON_TEXT);
      }
    },
  );

  it.each(['dark', 'light'] as const)(
    '%s: ringen måler ≥ 3:1 også mot det tema-konstante petrol-panelet',
    (theme) => {
      // Kravet fra atomet: BÅDE canvas og panel. Panelet flipper ikke med
      // temaet, så en lys-verdi kalibrert kun for krem ville falt gjennom her.
      const table = tokens(theme);
      const ring = resolveHex(`var(--dw-focus)`, table);
      const panel = resolveHex('var(--dw-panel)', table);
      expect(
        contrast(ring, panel),
        `${theme}: --dw-focus ${ring} mot --dw-panel ${panel}`,
      ).toBeGreaterThanOrEqual(WCAG_NON_TEXT);
    },
  );
});

describe('--dw-focus-panel — værpanelets egen, temaoppløste ring', () => {
  it('værfamilien er reell: seks distinkte flater i hvert tema', () => {
    // FORUTSETNING: måler vi mot en værfamilie som ikke finnes (eller som er
    // seks kopier av samme hex), sier «≥ 3:1 mot alle» ingenting.
    const dark = PETROL_SURFACES.map((s) => resolveHex(`var(${s})`, tokens('dark')));
    const light = PETROL_SURFACES.map((s) => resolveHex(`var(${s})`, tokens('light')));
    expect(new Set(dark).size, 'mørke værflater er ikke distinkte').toBe(PETROL_SURFACES.length);
    expect(new Set(light).size, 'lyse værflater er ikke distinkte').toBe(PETROL_SURFACES.length);
    for (let i = 0; i < PETROL_SURFACES.length; i += 1) {
      expect(relativeLuminance(light[i]!)).toBeGreaterThan(relativeLuminance(dark[i]!));
    }
  });

  it('er deklarert i mørk + begge symmetriske lysblokker', () => {
    const occurrences = [...stripComments(V2).matchAll(/--dw-focus-panel\s*:/g)].length;
    expect(occurrences, '--dw-focus-panel skal følge mørk + 2 lysblokker').toBe(3);
    expect(ROOT.get('--dw-focus-panel'), 'mørk ring mangler').toBeDefined();
    expect(AUTO_LIGHT.get('--dw-focus-panel'), 'auto-lys ring mangler').toBeDefined();
    expect(EXPLICIT_LIGHT.get('--dw-focus-panel'), 'eksplisitt lys ring mangler').toBeDefined();
    expect(AUTO_LIGHT.get('--dw-focus-panel')).toBe(EXPLICIT_LIGHT.get('--dw-focus-panel'));
    expect(AUTO_LIGHT.get('--dw-focus-panel')).not.toBe(ROOT.get('--dw-focus-panel'));
  });

  it.each(['dark', 'light'] as const)(
    '%s: måler ≥ 3:1 mot panelet og hver eneste værnyanse',
    (theme) => {
      const table = tokens(theme);
      const ring = resolveHex('var(--dw-focus-panel)', table);
      for (const surface of PETROL_SURFACES) {
        const behind = resolveHex(`var(${surface})`, table);
        expect(
          contrast(ring, behind),
          `${theme}: --dw-focus-panel ${ring} mot ${surface} ${behind}`,
        ).toBeGreaterThanOrEqual(WCAG_NON_TEXT);
      }
    },
  );

  it('slår den generelle ringen på petrol — ellers er det egne tokenet bortkastet', () => {
    // Poenget med å dele tokenet i to er at instrumentet BEHOLDER sin
    // kalibrerte ring. Blir panel-ringen svakere enn den generelle, har vi
    // gjort tilgjengelighet verre mens vi «fikset» den.
    const light = tokens('light');
    const panel = resolveHex('var(--dw-panel)', light);
    const dedicated = contrast(resolveHex('var(--dw-focus-panel)', light), panel);
    const general = contrast(resolveHex('var(--dw-focus)', light), panel);
    expect(dedicated).toBeGreaterThan(general);
  });
});

describe('hjem-monter — instrumentet får instrument-ringen', () => {
  it('.hjem-monter maler faktisk fokusringen med var(--dw-focus)', () => {
    // FORUTSETNING for porten under: forsvinner forbrukeren, er en
    // ombinding inne i panelet meningsløs og skal ikke kunne «bestå».
    const rule = /\.hjem-monter\s+:focus-visible\s*\{([^}]*)\}/u.exec(stripComments(HJEM))?.[1];
    expect(rule, 'fant ingen .hjem-monter :focus-visible-regel').toBeDefined();
    expect(rule).toMatch(/outline:\s*[\d.]+px\s+solid\s+var\(--dw-focus[,)]/u);
  });

  it('.hjm-panel er en værfarget petrol-flate (og .hjm-strip er det ikke)', () => {
    // FORUTSETNING: ombindingen hører hjemme der bakteppet ER petrol.
    // .hjm-strip er selv en <button> på krem-lerretet — ringen rundt den
    // ligger på canvas, ikke på petrol, og skal beholde den generelle ringen.
    const panel = /\.hjm-panel\s*\{([^}]*)\}/u.exec(stripComments(HJEM))?.[1];
    expect(panel, 'fant ikke .hjm-panel').toBeDefined();
    expect(panel).toMatch(/background:\s*var\(--dw-w-/u);
    const stripRebind = /\.hjm-strip\s*\{[^}]*--dw-focus\s*:/u.test(stripComments(HJEM));
    expect(stripRebind, '.hjm-strip er en knapp på canvas — ringen skal ikke bindes om der').toBe(
      false,
    );
  });

  it('.hjm-panel binder --dw-focus om til instrumentringen', () => {
    // KRAV: arv gjør resten — hver var(--dw-focus) inne i panelet får
    // instrumentverdien uten at én eneste forbrukerfil endres.
    const panel = /\.hjm-panel\s*\{([^}]*)\}/u.exec(stripComments(HJEM))?.[1];
    expect(panel).toMatch(/--dw-focus:\s*var\(--dw-focus-panel\)/u);
  });
});
