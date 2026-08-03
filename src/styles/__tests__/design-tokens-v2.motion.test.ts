/**
 * Bevegelses- og lyskontrakten (ATOM A2, 2026-08-03).
 *
 * BAKGRUNN. `design-tokens-v2.css` hadde NULL bevegelsestokens, mens
 * B1-proofen (`docs/design-notes/b1-proof/b1-slice.template.html`) er helt
 * var-drevet. Uten tokens var driften allerede i gang og synlig i kilden:
 * `cubic-bezier(.2,.7,.2,1)` hardkodet i `OnboardingScreen.tsx`,
 * `(.2,.7,.3,1)` i `VarmEllerKaldScreen.tsx`. To kurver som ligner uten a
 * vare like er ikke et designsprak — de leser som slurv i bevegelse.
 *
 * Samme dag felte portdom 27 den andre halvdelen: «Poolankeret kan variere
 * per skjerm; lysretningen skal ikke gjore det.» Lysretningen er derfor ETT
 * token, og bade veggens lyspool, panelets kantlys og dybdekontraktens
 * skygger skal avledes av den.
 *
 * DENNE TESTEN HANDHEVER:
 *  1. Hvert bevegelses- og lystoken er deklarert NOYAKTIG én gang, i :root —
 *     aldri i en temablokk. Bevegelse og lysretning er ikke temaegenskaper.
 *  2. Verdiene er proofens, ikke gjenoppfunne.
 *  3. Kontraktens tre regler: ut er raskere enn inn, markoren lander (den
 *     glir ikke), og lysvektoren peker samme vei som dybdekontraktens
 *     skyggeforskyvninger.
 *  4. `hjem-monter.css` far ingen NY ra bevegelse. Filen har 7 deklarasjoner
 *     med arvet gjeld (Steg 6/8/9 rydder dem); registeret under er frosset,
 *     sa gjelden kan bare krympe. En ny hardkodet ms-verdi eller kurve gjor
 *     testen rod umiddelbart.
 *  5. Ingen CSS refererer et bevegelses- eller lystoken som ikke finnes —
 *     en skrivefeil i `var()` er helt stille i nettleseren.
 *
 * Testen leser CSS-KILDEN (ikke computed style): jsdom loser ikke var()-
 * kjeder, og en `transition`-shorthand som nullstiller transition-property
 * er nettopp den fella art-bibelen navngir. Kilden er der kontrakten bor.
 *
 * Rorer IKKE --dw-depth-* / --dw-sh-* — de har sin egen test
 * (design-tokens-v2.depth.test.ts) som skal forbli gronn. Herfra LESES de
 * kun, som fasit for lysvektorens retning.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/** Kommentarer er dokumentasjon, ikke deklarasjoner — de skal aldri telle. */
function utenKommentarer(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const TOKENS_CSS = utenKommentarer(readFileSync(join(ROOT, 'src/styles/design-tokens-v2.css'), 'utf8'));
const HJEM_CSS = utenKommentarer(
  readFileSync(join(ROOT, 'src/components/hjem/hjem-monter.css'), 'utf8'),
);

/** Forste temablokk. Alt for denne indeksen ligger i :root. */
const FORSTE_TEMABLOKK = TOKENS_CSS.indexOf('@media (prefers-color-scheme: light)');

function forekomster(token: string): number {
  return [...TOKENS_CSS.matchAll(new RegExp(`${token}\\s*:`, 'g'))].length;
}

function verdi(token: string): string {
  const m = TOKENS_CSS.match(new RegExp(`${token}\\s*:\\s*([^;]+);`));
  expect(m, `${token} er ikke deklarert i design-tokens-v2.css`).not.toBeNull();
  return m![1]!.trim();
}

function posisjon(token: string): number {
  return TOKENS_CSS.search(new RegExp(`${token}\\s*:`));
}

function ms(token: string): number {
  const raw = verdi(token);
  const m = raw.match(/^(\d+(?:\.\d+)?)ms$/);
  expect(m, `${token} skal oppgis i hele ms («${raw}») — blandede enheter skjuler forskjeller`).not.toBeNull();
  return Number(m![1]);
}

function alfa(rgba: string): number {
  const m = rgba.match(/rgba\([^)]*?,\s*([\d.]+)\s*\)/);
  expect(m, `fant ingen alfa i «${rgba}»`).not.toBeNull();
  return Number(m![1]);
}

function rgb(rgba: string): [number, number, number] {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  expect(m, `«${rgba}» er ikke en rgb(a)-verdi`).not.toBeNull();
  return [Number(m![1]), Number(m![2]), Number(m![3])];
}

/* ────────────────────────────────────────────────────────────────────────
   1. VARIGHETENE — hentet fra den beviste proofen, ikke gjenoppfunnet.
   proofens :root: --m-feedback 120 / --m-state 220 / --m-handoff 280
   proofens JS:    PUSH_PAGE 340 / PUSH_BACK 280
   proofens CSS:   --m-step 260, --m-bow 420 (og 240 ved oppretting),
                   .synth transition-duration 180, .atmo 300
   ──────────────────────────────────────────────────────────────────────── */
const VARIGHETER = {
  '--dw-m-feedback': 120,
  '--dw-m-state': 220,
  '--dw-m-handoff': 280,
  '--dw-m-push': 340,
  '--dw-m-push-back': 280,
  '--dw-m-step': 260,
  '--dw-m-bow-in': 420,
  '--dw-m-bow-out': 240,
  '--dw-m-marker': 180,
  '--dw-m-atmo': 300,
} as const;

const BEVEGELSESTOKENS = [...Object.keys(VARIGHETER), '--dw-ease'] as const;
const LYSTOKENS = ['--dw-lys-vinkel', '--dw-kant-key', '--dw-kant-fill'] as const;

describe('bevegelseskontrakten — tokens finnes, én gang, i :root', () => {
  it.each(BEVEGELSESTOKENS)('%s er deklarert nøyaktig én gang', (token) => {
    expect(forekomster(token)).toBe(1);
  });

  it.each(BEVEGELSESTOKENS)('%s ligger i :root, aldri i en temablokk', (token) => {
    expect(FORSTE_TEMABLOKK, 'fant ikke lys-temablokken — har filen endret struktur?').toBeGreaterThan(0);
    expect(
      posisjon(token),
      `${token} er deklarert i eller etter en temablokk. Bevegelse er ikke en temaegenskap — samme handling skal ta like lang tid i lys og mørk modus.`,
    ).toBeLessThan(FORSTE_TEMABLOKK);
  });

  it.each(Object.entries(VARIGHETER))('%s = %i ms (proofens verdi)', (token, forventet) => {
    expect(ms(token)).toBe(forventet);
  });

  it('--dw-ease er proofens kurve cubic-bezier(.2,.7,.2,1)', () => {
    const raw = verdi('--dw-ease');
    const tall = raw.match(/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    expect(tall, `--dw-ease er «${raw}» — skal være en cubic-bezier`).not.toBeNull();
    expect([tall![1], tall![2], tall![3], tall![4]].map(Number)).toEqual([0.2, 0.7, 0.2, 1]);
  });
});

describe('bevegelseskontraktens tre regler', () => {
  it('regel 1: UT er raskere enn INN — push-back < push', () => {
    expect(
      ms('--dw-m-push-back'),
      'tilbake skal aldri koste like mye tid som inn (art bible, sideskift-kontrakten)',
    ).toBeLessThan(ms('--dw-m-push'));
  });

  it('regel 1: UT er raskere enn INN — bow-out < bow-in', () => {
    expect(
      ms('--dw-m-bow-out'),
      'opprettingen skal lande på fullføringsmarkøren, ikke koste tid',
    ).toBeLessThan(ms('--dw-m-bow-in'));
  });

  it('regel 2: markøren LANDER, den glir ikke — marker < state', () => {
    expect(
      ms('--dw-m-marker'),
      'fullføringen er seremoniens punktum og må lese som et anslag, ikke som en vanlig tilstandsendring',
    ).toBeLessThan(ms('--dw-m-state'));
  });

  it('feedback er kontraktens korteste varighet — trykkrespons skal føles umiddelbar', () => {
    const alle = Object.keys(VARIGHETER).map(ms);
    expect(ms('--dw-m-feedback')).toBe(Math.min(...alle));
  });

  it('atmosfæren krysstoner saktere enn et sideskift tar å begynne — poolen tilhører rommet', () => {
    // 300 ms mot pushens 340: poolen skal ha skiftet motiv når flaten lander,
    // uten å gli med den. Portdom: «poolen er statisk per skjerm og flytter
    // seg aldri synlig under navigasjon.»
    expect(ms('--dw-m-atmo')).toBeLessThan(ms('--dw-m-push'));
    expect(ms('--dw-m-atmo')).toBeGreaterThan(ms('--dw-m-state'));
  });
});

/* ────────────────────────────────────────────────────────────────────────
   2. LYSVEKTOREN (portdom 27, 2026-08-03)
   «Poolankeret kan variere per skjerm; lysretningen skal ikke gjore det.»
   ──────────────────────────────────────────────────────────────────────── */

/**
 * CSS-gradientvinkel → enhetsvektor i SKJERMKOORDINATER (x hoyre, y NEDOVER).
 * 0deg = «to top». Vinkelen males med klokka.
 */
function retningsvektor(vinkelDeg: number): { dx: number; dy: number } {
  const rad = (vinkelDeg * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
}

/** Ett skyggelag = «<x>px <y>px <blur>px [<spread>px] var(--token)». */
function skyggelag(token: string): Array<{ x: number; y: number }> {
  return verdi(token)
    .split(/,(?![^(]*\))/)
    .map((lag) => lag.trim())
    .filter((lag) => lag.includes('px'))
    .map((lag) => {
      const lengder = [...lag.matchAll(/(-?\d+)px/g)].map((m) => Number(m[1]));
      return { x: lengder[0]!, y: lengder[1]! };
    });
}

describe('lysvektoren — én retning for hele appen', () => {
  it.each(LYSTOKENS)('%s er deklarert nøyaktig én gang', (token) => {
    expect(forekomster(token)).toBe(1);
  });

  it.each(LYSTOKENS)('%s ligger i :root — retningen varierer aldri per tema', (token) => {
    expect(
      posisjon(token),
      `${token} er tema-overstyrt. Poolens ANKER kan variere per skjerm; retningen skal ikke variere i det hele tatt.`,
    ).toBeLessThan(FORSTE_TEMABLOKK);
  });

  it('--dw-lys-vinkel er 135deg — key øvre venstre, fall mot nedre høyre', () => {
    expect(verdi('--dw-lys-vinkel')).toBe('135deg');
    const { dx, dy } = retningsvektor(135);
    expect(dx, 'lyset skal falle mot høyre').toBeGreaterThan(0);
    expect(dy, 'lyset skal falle nedover').toBeGreaterThan(0);
  });

  it('dybdekontraktens skygger motsier ALDRI lysvektoren', () => {
    // Dette er selve portdommen gjort maskinlesbar: kantlyset og skyggene
    // deler kilde. Feiler den, står panelet i ett lys og skyggene i et annet.
    const grader = Number(verdi('--dw-lys-vinkel').replace('deg', ''));
    const { dx, dy } = retningsvektor(grader);
    for (const niva of ['--dw-depth-hero', '--dw-depth-raised', '--dw-depth-selected'] as const) {
      const lag = skyggelag(niva);
      expect(lag.length, `${niva} har ingen lesbare skyggelag`).toBeGreaterThan(0);
      for (const { x, y } of lag) {
        expect(
          x * dx,
          `${niva}: x-forskyvning ${x}px peker mot lyset (vektor dx=${dx.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          y * dy,
          `${niva}: y-forskyvning ${y}px peker mot lyset (vektor dy=${dy.toFixed(2)})`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('kantlyset FALLER: key er sterkere enn fill', () => {
    expect(
      alfa(verdi('--dw-kant-key')),
      'et jevnt kantlys leser som en syntetisk 1px-ramme, ikke som lys — da blir poolen bakgrunnsdekor (portdom 27)',
    ).toBeGreaterThan(alfa(verdi('--dw-kant-fill')));
  });

  it('kantlyset er ÉN lyskilde: key og fill deler farge, kun styrken skiller', () => {
    expect(rgb(verdi('--dw-kant-key'))).toEqual(rgb(verdi('--dw-kant-fill')));
  });

  it('kantlyset er et kantlys, ikke en flate — alfa godt under 1', () => {
    // Portdom 25: «Ingen ren hvit som flatefarge noe sted. Ren hvit kan finnes
    // som et svakt spekulært kantlys, aldri som flate.»
    for (const token of ['--dw-kant-key', '--dw-kant-fill'] as const) {
      expect(alfa(verdi(token)), `${token} er så sterk at den leser som en flate`).toBeLessThanOrEqual(0.35);
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────
   3. DETEKTOREN — hjem-monter.css far ingen NY ra bevegelse.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Frosset gjeldsregister (malt 2026-08-03, for Steg 6/8/9).
 *
 * Hver linje er en deklarasjon som fortsatt hardkoder varighet eller kurve.
 * Registeret er en RATSJETT: gjelden kan bare krympe.
 *  - En deklarasjon som IKKE star her → testen ryker. Det er en ny hardkoding.
 *  - Betaler du ned gjeld: slett linjen din herfra i SAMME endring, sa
 *    registeret aldri lyver om hvor mye som gjenstar.
 *
 * Normalisert form: «<egenskap>: <verdi>» med kollapset mellomrom.
 */
const KJENT_GJELD: readonly string[] = [
  // Steg 6 (bøyningen skrives om): maskotens pose-krysstoning.
  /* NEDBETALT 2026-08-03: bevegelsen flyttet til .hjm-mascot-pose og bruker
     na var(--dw-m-bow-in)/var(--dw-ease); bildene har kun opacity via
     var(--dw-m-state). Ratsjetten fanget at jeg forst skrev nye literaler. */
  'transition: opacity 300ms ease-out',
  // Steg 9 (analysestreken): varighet skal bli var(--dw-m-*), reisevei måles.
  'animation: hjm-scan-sweep var(--hjm-scan-duration, 2100ms) cubic-bezier(0.45, 0, 0.55, 1) 1 forwards',
  // Steg 8 (fullføringsmarkøren erstatter spinneren).
  'animation: hjm-check-pop 0.32s cubic-bezier(0.34, 1.4, 0.64, 1) backwards',
  'animation: hjm-spin 1s linear infinite',
  // Resultatlistens innslag + radens trykkrespons.
  'animation: hjm-row-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  'transition: transform 0.1s ease-out, background 0.1s ease-out',
];

const MOTION_DEKLARASJON =
  /(transition|animation)(-duration|-delay|-timing-function|-name|-iteration-count)?\s*:\s*([^;{}]+)/g;

/**
 * Finner deklarasjoner som hardkoder bevegelse.
 *
 * `var(--token` strippes for skanning, slik at et rent `var(--dw-m-push)`
 * ikke slar ut — men en RA FALLBACK inne i var() gjor det, fordi
 * `var(--x, 2100ms)` er like hardkodet som `2100ms`.
 *
 * `linear` er tillatt: proofen bruker den bevisst i de kompenserte
 * opacity-kurvene («40ms linear 120ms»), der en ease ville brutt summen.
 * `ease`/`ease-out`/`ease-in`/`ease-in-out` er derimot nettopp driften
 * --dw-ease finnes for a stoppe.
 */
function hardkodetBevegelse(css: string): Array<{ decl: string; funn: string[] }> {
  const treff: Array<{ decl: string; funn: string[] }> = [];
  for (const m of css.matchAll(MOTION_DEKLARASJON)) {
    const egenskap = `${m[1]}${m[2] ?? ''}`;
    const raw = m[3]!.trim().replace(/\s+/g, ' ');
    const skann = raw.replace(/var\(\s*--[\w-]+\s*/g, '');
    const funn = [
      ...[...skann.matchAll(/(?<![\w.-])\d*\.?\d+m?s(?![\w-])/g)].map((x) => x[0]!),
      ...[...skann.matchAll(/cubic-bezier\([^)]*\)/g)].map((x) => x[0]!),
      ...[...skann.matchAll(/(?<![\w-])ease(-in-out|-in|-out)?(?![\w-])/g)].map((x) => x[0]!),
    ];
    if (funn.length > 0) treff.push({ decl: `${egenskap}: ${raw}`, funn });
  }
  return treff;
}

describe('detektoren selv — den ser det den lover å se', () => {
  // En detektor uten egen test er prosa. Disse fem sier presist hva som er
  // gjeld og hva som ikke er det, uten å røre hjem-monter.css.
  const funnI = (css: string) => hardkodetBevegelse(css).flatMap((t) => t.funn);

  it('fanger rå ms, rå s, cubic-bezier og navngitt ease', () => {
    expect(funnI('.a { transition: opacity 300ms ease-out; }')).toEqual(['300ms', 'ease-out']);
    expect(funnI('.a { animation: x 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; }')).toEqual([
      '0.42s',
      'cubic-bezier(0.16, 1, 0.3, 1)',
    ]);
    expect(funnI('.a { transition-delay: 120ms; }')).toEqual(['120ms']);
  });

  it('fanger en rå fallback inne i var() — den er like hardkodet som tallet', () => {
    expect(funnI('.a { animation: sweep var(--hjm-scan-travel, 2100ms) linear; }')).toEqual(['2100ms']);
  });

  it('slipper gjennom rene var()-verdier — det er hele poenget med kontrakten', () => {
    expect(funnI('.a { transition: opacity var(--dw-m-handoff) var(--dw-ease); }')).toEqual([]);
    expect(funnI('.a { animation: bow var(--dw-m-bow-in) var(--dw-ease) forwards; }')).toEqual([]);
  });

  it('slipper gjennom «linear» og «none» — begge er bevisste i proofen', () => {
    // Proofen: «transition:opacity 40ms linear 120ms» i de kompenserte
    // kurvene, der en ease ville brutt dekningssummen. Og reduced-motion
    // slår av bevegelse med «none», ikke med en kortere varighet.
    expect(funnI('.a { transition: opacity var(--dw-m-feedback) linear; }')).toEqual([]);
    expect(funnI('.a { transition: none !important; }')).toEqual([]);
    expect(funnI('.a { animation: none !important; }')).toEqual([]);
  });

  it('forveksler ikke «ease» inne i et ord med en navngitt kurve', () => {
    expect(funnI('.a { animation: hjm-release var(--dw-m-bow-out) var(--dw-ease) both; }')).toEqual([]);
  });
});

describe('hjem-monter.css — ingen NY hardkodet bevegelse', () => {
  const gjeld = hardkodetBevegelse(HJEM_CSS);

  it('hver hardkodet varighet/kurve står i det frosne gjeldsregisteret', () => {
    const nye = gjeld.filter((g) => !KJENT_GJELD.includes(g.decl));
    expect(
      nye.map((n) => `${n.decl}   ← ${n.funn.join(', ')}`),
      'Ny hardkodet bevegelse i hjem-monter.css. Bruk var(--dw-m-*) og var(--dw-ease) — det var nettopp «mocken er kontrakten»-presedensen som skapte dagens gjeld.',
    ).toEqual([]);
  });

  it('gjelden vokser aldri (ratsjett)', () => {
    expect(
      gjeld.length,
      `hjem-monter.css har ${gjeld.length} deklarasjoner med hardkodet bevegelse; registeret tillater ${KJENT_GJELD.length}`,
    ).toBeLessThanOrEqual(KJENT_GJELD.length);
  });

  it('registeret lyver ikke: hver oppførte gjeld finnes fortsatt i filen', () => {
    const faktisk = new Set(gjeld.map((g) => g.decl));
    const foreldet = KJENT_GJELD.filter((d) => !faktisk.has(d));
    expect(
      foreldet,
      'Disse er ryddet opp — slett dem fra KJENT_GJELD så registeret viser den ekte restgjelden.',
    ).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   4. Ingen var() peker i tomme luften.
   ──────────────────────────────────────────────────────────────────────── */
function cssFiler(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const full = join(dir, navn);
    if (statSync(full).isDirectory()) cssFiler(full, ut);
    else if (navn.endsWith('.css')) ut.push(full);
  }
  return ut;
}

describe('referanser til bevegelses- og lystokens peker på noe som finnes', () => {
  it('hver var(--dw-m-* / --dw-ease / --dw-lys-* / --dw-kant-*) er deklarert', () => {
    const deklarerte = new Set<string>([...BEVEGELSESTOKENS, ...LYSTOKENS]);
    const ukjente: string[] = [];
    for (const fil of cssFiler(join(ROOT, 'src'))) {
      const css = utenKommentarer(readFileSync(fil, 'utf8'));
      for (const m of css.matchAll(/var\(\s*(--dw-(?:m-|ease|lys-|kant-)[\w-]*)/g)) {
        const navn = m[1]!;
        if (!deklarerte.has(navn)) ukjente.push(`${relative(ROOT, fil)}: var(${navn})`);
      }
    }
    expect(
      ukjente,
      'En skrivefeil i var() er helt stille i nettleseren — egenskapen faller bare tilbake til sin initialverdi.',
    ).toEqual([]);
  });
});
