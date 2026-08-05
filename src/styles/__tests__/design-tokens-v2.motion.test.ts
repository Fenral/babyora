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
 *  4. HELE `src/` far ingen NY ra bevegelse — ikke bare `hjem-monter.css`.
 *     Registeret under er frosset, sa gjelden kan bare krympe. En ny
 *     hardkodet ms-verdi eller kurve gjor testen rod umiddelbart.
 *  5. Ingen kilde refererer et bevegelses- eller lystoken som ikke finnes —
 *     en skrivefeil i `var()` er helt stille i nettleseren.
 *
 * Testen leser KILDEN (ikke computed style): jsdom loser ikke var()-kjeder,
 * og en `transition`-shorthand som nullstiller transition-property er nettopp
 * den fella art-bibelen navngir. Kilden er der kontrakten bor.
 *
 * Rorer IKKE --dw-depth-* / --dw-sh-* — de har sin egen test
 * (design-tokens-v2.depth.test.ts) som skal forbli gronn. Herfra LESES de
 * kun, som fasit for lysvektorens retning.
 *
 * ── FASE 2, 2026-08-04: DETEKTOREN LESER HELE src ────────────────────────
 * Fram til na kjorte seksjon 3 pa ÉN fil. Skjermene kunne bade beholde og
 * legge til hardkodet bevegelse uten at noe sa det: DoD-en navngir «hardkodet
 * 300ms i en inline style» som klassen som slapp gjennom. Detektorlogikken
 * var aldri problemet — skopet var. Filvandringen laa allerede i seksjon 4;
 * den er na felles for begge.
 *
 * ── FASE 2-RETTELSEN, samme dag: SKOPET VAR STORT, SYNET VAR SMALT ───────
 * Porten ble angrepet og falt. Ikke pa filskopet — 251 filer BLE apnet — men
 * pa at «apnet» ikke er «sett». Tre uttrekkere ga tre skrivemater; alt som
 * ble skrevet pa en fjerde mate passerte i stillhet, og kvitteringen
 * presenterte det de tre REKTE som om det var populasjonen. Fire konkrete
 * hull, alle med live forekomster i src:
 *
 *  1. TILORDNINGSFORM. `el.style.transition = 'transform 200ms ease-out'` i
 *     App.tsx:492 — DoD-ens egen navngitte klasse, skilt fra den fangede
 *     formen med ett tegn (`=` mot `:`).
 *  2. EGNE CUSTOM PROPERTIES. `--min-dur: 700ms` + `var(--min-dur)`: begge
 *     ender usynlige. Hele det parallelle tokensettet (--ease-*, --dur-*,
 *     --ob-ease-*) la her, utalt.
 *  3. LEKK VERDIGATE I DRAPSBRYTEREN. Monsteret godtok `1s` og `0.1s` der
 *     prosaen sa «0 eller .01ms» — ny bevegelse kunne gjemmes i unntaket.
 *  4. BEVEGELSE SKREVET I JS. Fem filer kjorer motion/react; fjaerer og
 *     bezier-arrayer gar aldri gjennom en CSS-verdi.
 *
 * Rettelsen er derfor SEKS flater, seks uttrekkere, og en malprove per
 * uttrekker (MALPROVER) sa en fremtidig regresjon i én av dem blir ROD i
 * stedet for stille. Gulvet ble malt pa nytt: 98 → 122. Det er en
 * KORREKSJON av en feilmaling, ikke slakk — se BASELINE for hele
 * regnskapet, linje for linje.
 *
 * Standpunktet pa `src/styles/motion-grammar.ts` — det parallelle
 * tokensystemet angrepet fant — er skrevet ned og assertert lenger nede.
 * Taushet var det eneste svaret som ikke gikk an.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/**
 * Kommentarer er dokumentasjon, ikke deklarasjoner — de skal aldri telle.
 *
 * Blanker ut i stedet for a slette, slik at hver posisjon i den rensede
 * teksten fortsatt peker pa samme sted i originalfilen. Uten det driver bade
 * linjenumrene og blokkgrensene.
 *
 * FELLE (malt 2026-08-04): et strukturelt sok som `@media[^{]*prefers-
 * reduced-motion` treffer filens EGEN prosa. `src/App.tsx:96`,
 * `PaywallDialog.tsx:42` og fire kommentarer i `InnstillingerScreen.tsx`
 * nevner uttrykket uten a vare CSS. Kjores soket for renskingen, kutter det
 * skopet for de ekte malene. Derfor: strip forst, sok etterpa. Alltid.
 */
function blankUt(tekst: string): string {
  return tekst.replace(/[^\n]/g, ' ');
}

function utenCssKommentarer(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, blankUt);
}

const TOKENS_CSS = utenCssKommentarer(readFileSync(join(ROOT, 'src/styles/design-tokens-v2.css'), 'utf8'));

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

/* ════════════════════════════════════════════════════════════════════════
   3. DETEKTOREN — hele src far ingen NY ra bevegelse.

   SEKS FLATER, seks uttrekkere. Appen har ingen ENKELT stilflate: 10 av 11
   skjermer har ingen CSS-fil i det hele tatt.
     (a) .css                          — 20 deklarasjoner
     (b) CSS i <style>{`…`} i .tsx     — 31 deklarasjoner
     (c) inline CSSProperties          — 47 deklarasjoner
     (d) egne custom properties        —  8 definisjoner
     (e) tilordning fra JS             —  1 deklarasjon
     (f) bevegelse skrevet i JS        — 15 verdier (motion/react + WAAPI)
   En detektor som bare kjenner (a) er blind for de to som faktisk barer
   skjermene. Det var nettopp derfor `transition: 'height 160ms ease-out'` i
   TemperatureInstrument.tsx kunne sta i kilden mens porten meldte gront —
   og en detektor som bare kjenner (a)–(c) er blind for hele det parallelle
   tokensettet og for hver eneste fjaer i appen.

   KVITTERINGENS PASTAND er derfor SKOPET, ikke universell: «N deklarasjoner
   med hardkodet bevegelse pa disse seks flatene». Det finnes flater ingen
   uttrekker kjenner enda — det var nettopp det angrepet beviste — og en
   port som later som den har talt alt, lyver om nettopp det den ble bygget
   for a hindre.
   ════════════════════════════════════════════════════════════════════════ */

/** Ett funn: én deklarasjon som hardkoder varighet eller kurve. */
type Flate = 'css' | 'mal' | 'inline' | 'tilordning' | 'variabel' | 'js';

type Treff = {
  fil: string;
  linje: number;
  flate: Flate;
  decl: string;
  funn: string[];
  /** Satt kun pa fritatte treff: hvilket dokumentert unntak som slo inn. */
  grunn?: 'drapsbryter' | 'kanonisk-token';
};

/* ── tokenizer for .ts/.tsx ──────────────────────────────────────────────
   Vi ma vite hva som er kode, hva som er streng og hva som er mal-literal.
   Uten det blir `//` inne i en url() til kommentar, og en utkommentert
   deklarasjon teller som gjeld. Alle utklipp er LENGDEBEVARENDE, sa
   posisjoner (og dermed linjenumre) holder seg sanne. */

/** Returnerer indeksen rett ETTER strengen som starter pa `i`. */
function lesStreng(kode: string, i: number): number {
  const q = kode[i];
  let j = i + 1;
  while (j < kode.length) {
    if (kode[j] === '\\') {
      j += 2;
      continue;
    }
    if (kode[j] === q) return j + 1;
    // Uavsluttet ved linjeskift: da var det ikke en streng (typisk et
    // regex-litteral med apostrof). Gi opp pa linjen, ikke pa filen.
    if (kode[j] === '\n') return j;
    j += 1;
  }
  return j;
}

type MalBit = { tekst: string; start: number };

function skannTsx(kode: string): { kode: string; maler: MalBit[] } {
  const n = kode.length;
  const maler: MalBit[] = [];
  let ut = '';
  let i = 0;

  /** Leser en mal-literal. `${…}`-innhold blankes (JS skal ikke lekke inn i CSS). */
  const lesMal = (start: number): { innhold: string; slutt: number } => {
    let j = start + 1;
    let innhold = '';
    while (j < n) {
      if (kode[j] === '\\') {
        innhold += kode[j]! + (kode[j + 1] ?? '');
        j += 2;
        continue;
      }
      if (kode[j] === '`') {
        j += 1;
        break;
      }
      if (kode[j] === '$' && kode[j + 1] === '{') {
        let dybde = 1;
        let k = j + 2;
        while (k < n && dybde > 0) {
          const ch = kode[k];
          if (ch === '{') dybde += 1;
          else if (ch === '}') {
            dybde -= 1;
            if (dybde === 0) {
              k += 1;
              break;
            }
          } else if (ch === '"' || ch === "'") {
            k = lesStreng(kode, k);
            continue;
          } else if (ch === '`') {
            k = lesMal(k).slutt;
            continue;
          }
          k += 1;
        }
        innhold += `\${${blankUt(kode.slice(j + 2, k - 1))}}`;
        j = k;
        continue;
      }
      innhold += kode[j]!;
      j += 1;
    }
    return { innhold, slutt: j };
  };

  while (i < n) {
    const c = kode[i];
    const c2 = kode[i + 1];
    if (c === '/' && c2 === '*') {
      const funnet = kode.indexOf('*/', i + 2);
      const j = funnet === -1 ? n : funnet + 2;
      ut += blankUt(kode.slice(i, j));
      i = j;
      continue;
    }
    if (c === '/' && c2 === '/') {
      const funnet = kode.indexOf('\n', i);
      const j = funnet === -1 ? n : funnet;
      ut += blankUt(kode.slice(i, j));
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      const j = lesStreng(kode, i);
      ut += kode.slice(i, j);
      i = j;
      continue;
    }
    if (c === '`') {
      const m = lesMal(i);
      // CSS-kommentarer inne i mal-CSS blankes pa samme vilkar som i .css.
      maler.push({ tekst: utenCssKommentarer(m.innhold), start: i + 1 });
      ut += `\`${blankUt(kode.slice(i + 1, m.slutt - 1))}${kode[m.slutt - 1] === '`' ? '`' : ''}`;
      i = m.slutt;
      continue;
    }
    ut += c;
    i += 1;
  }
  return { kode: ut, maler };
}

/* ── selve detektoren ────────────────────────────────────────────────────
   `var(--token` strippes for skanning, slik at et rent `var(--dw-m-push)`
   ikke slar ut — men en RA FALLBACK inne i var() gjor det, fordi
   `var(--x, 2100ms)` er like hardkodet som `2100ms`.

   BART `linear` er tillatt: proofen bruker det bevisst i de kompenserte
   opacity-kurvene («40ms linear 120ms»), der en ease ville brutt summen.
   `ease`/`ease-out`/`ease-in`/`ease-in-out` er derimot nettopp driften
   --dw-ease finnes for a stoppe.

   RETTELSE 2026-08-04 (angrepsfunn 4): begge verdimonstrene manglet `i`, sa
   `300MS` og `EASE-OUT` gikk fri — CSS er case-insensitivt, uttrekkeren var
   det ikke. Og kurvevokabularet kjente bare `cubic-bezier()`. `steps(4, end)`
   og moderne `linear(0, .5, 1)` er like hardkodede kurver; de star na i
   KURVE. Merk at `linear(` KREVER parentes rett etter navnet, sa bart
   `linear` og `linear-gradient(` ikke forveksles med en kurve. */
const KURVE = /(?<![\w-])(?:cubic-bezier|steps|linear)\([^)]*\)/gi;

function hardkodingerI(verdiTekst: string): string[] {
  const skann = verdiTekst.replace(/var\(\s*--[\w-]+\s*/g, '');
  return [
    ...[...skann.matchAll(/(?<![\w.-])\d*\.?\d+m?s(?![\w-])/gi)].map((x) => x[0]!),
    ...[...skann.matchAll(KURVE)].map((x) => x[0]!),
    ...[...skann.matchAll(/(?<![\w-])ease(-in-out|-in|-out)?(?![\w-])/gi)].map((x) => x[0]!),
  ];
}

const MOTION_DEKLARASJON =
  /(transition|animation)(-duration|-delay|-timing-function|-name|-iteration-count)?\s*:\s*([^;{}]+)/g;

/** Rad fra en uttrekker, for den er stedfestet i filen. */
type Rad = { decl: string; funn: string[]; pos: number; vpos: number };

/** Flate (a) og (b): ekte CSS-deklarasjoner. */
function hardkodetBevegelse(css: string): Rad[] {
  const treff: Rad[] = [];
  for (const m of css.matchAll(MOTION_DEKLARASJON)) {
    const egenskap = `${m[1]}${m[2] ?? ''}`;
    const raw = m[3]!.trim().replace(/\s+/g, ' ');
    const funn = hardkodingerI(raw);
    // vpos = der VERDIEN begynner. Brukes til a de-duplisere mot
    // variabeluttrekkeren: «--min-transition: …» treffer begge mønstrene.
    if (funn.length > 0) {
      treff.push({ decl: `${egenskap}: ${raw}`, funn, pos: m.index!, vpos: m.index! + m[0]!.length - m[3]!.length });
    }
  }
  return treff;
}

/* ── FLATE (d): EGNE CUSTOM PROPERTIES ───────────────────────────────────
   Angrepsfunn 2, 2026-08-04: MOTION_DEKLARASJON krever at verdien folger en
   literal `transition`/`animation`-nokkel. Vasker du varigheten gjennom din
   EGEN variabel — `--siv-dur: 700ms; transition: opacity var(--siv-dur)` —
   er begge halvdeler usynlige: definisjonen har feil nokkel, bruken er et
   rent var(). En helt ny egen kurve glir dermed inn uten motstand, som er
   noyaktig «to kurver som ligner uten a vare like»-driften kontrakten
   finnes for.

   En custom property som hardkoder varighet eller kurve ER derfor et
   bevegelsestoken — enten kontraktens eget, eller et parallelt. Kontrakten
   tillater ETT sted a eie ra bevegelsesverdier (se KANONISK_TOKENFIL);
   alt annet er parallelle tokens, og parallelle tokens er gjeld. */
const VARIABEL_DEFINISJON = /(--[\w-]+)\s*:\s*([^;{}]+)/g;

function variabelBevegelse(css: string): Rad[] {
  const treff: Rad[] = [];
  for (const m of css.matchAll(VARIABEL_DEFINISJON)) {
    const raw = m[2]!.trim().replace(/\s+/g, ' ');
    const funn = hardkodingerI(raw);
    if (funn.length > 0) {
      treff.push({ decl: `${m[1]}: ${raw}`, funn, pos: m.index!, vpos: m.index! + m[0]!.length - m[2]!.length });
    }
  }
  return treff;
}

/**
 * Flate (c): inline `CSSProperties`.
 *
 * Kan IKKE gjenbruke CSS-regexen: en JS-objektliteral skiller med komma, ikke
 * semikolon, sa `[^;{}]+` sluker naboegenskapen («… , zIndex: 50»). Vi leser
 * derfor verdi-UTTRYKKET med klammetelling og skanner bare streng- og
 * mal-litteralene i det. Da fanges ogsa den dominerende formen i denne
 * kodebasen — `reducedMotion ? 'none' : 'opacity 160ms ease'` — der
 * reduced-motion-grenen er handtert men varigheten fortsatt er hardkodet.
 */
const INLINE_NOKKEL =
  /(?<![\w$.])['"]?(transition|animation)(Duration|Delay|TimingFunction|Property|Name|IterationCount)?['"]?\s*:/g;

/* ── FLATE (e): TILORDNINGSFORM ──────────────────────────────────────────
   Angrepsfunn 1, 2026-08-04: INLINE_NOKKEL krever KOLON etter nokkelen.
   `el.style.transition = 'transform 200ms ease-out'` bruker LIKHETSTEGN og
   var derfor helt usynlig — i appens rotfil, live, med bade hardkodet
   varighet og hardkodet kurve. Det er DoD-ens egen navngitte klasse
   («hardkodet varighet i en inline style») som skilte seg fra den fangede
   formen med ett tegn.

   `style.setProperty('transition', …)` er samme handling via et annet API og
   ma derfor dekkes i samme slengen — inkludert custom-property-varianten
   `setProperty('--min-dur', '700ms')`, som ellers ville vart flate (d)s hull
   pa JS-siden. */
const INLINE_TILORDNING =
  /\.style\.(transition|animation)(Duration|Delay|TimingFunction|Property|Name|IterationCount)?\s*=(?!=)/g;

const INLINE_SETPROPERTY = /\.style\.setProperty\(\s*['"](transition|animation|--)([\w-]*)['"]\s*,/g;

/** Inline custom property: `{ '--min-dur': '700ms' }` i et CSSProperties-objekt. */
const INLINE_VARIABEL = /(?<![\w$.])['"](--[\w-]+)['"]\s*:/g;

function lesUttrykk(kode: string, fra: number): string {
  let i = fra;
  let dybde = 0;
  while (i < kode.length) {
    const c = kode[i];
    if (c === '(' || c === '[' || c === '{') dybde += 1;
    else if (c === ')' || c === ']' || c === '}') {
      if (dybde === 0) break;
      dybde -= 1;
    } else if ((c === ',' || c === ';') && dybde === 0) break;
    else if (c === '"' || c === "'") {
      i = lesStreng(kode, i);
      continue;
    }
    i += 1;
  }
  return kode.slice(fra, i);
}

/** Alle streng- og mal-literaler i et verdi-uttrykk, som ren tekst. */
function strengbiter(uttrykk: string, start: number, malVed: Map<number, string>): string[] {
  const biter: string[] = [];
  let i = 0;
  while (i < uttrykk.length) {
    const c = uttrykk[i];
    if (c === '"' || c === "'") {
      const j = lesStreng(uttrykk, i);
      biter.push(uttrykk.slice(i + 1, j - 1));
      i = j;
      continue;
    }
    if (c === '`') {
      const mal = malVed.get(start + i + 1);
      if (mal !== undefined) biter.push(mal);
      let j = i + 1;
      while (j < uttrykk.length && uttrykk[j] !== '`') j += 1;
      i = j + 1;
      continue;
    }
    i += 1;
  }
  return biter;
}

/**
 * Kjorer ÉN nokkelform over kodeflaten.
 *
 * `dekl` bygger den normaliserte registerlinjen av nokkelen og den EKTE
 * kildeteksten (kodeflaten har blanket mal-innholdet, sa den kan ikke vises).
 * `js` far uttrykket videre til JS-bevegelsesleseren i stedet for
 * strenglesingen — se `jsBevegelse`.
 */
function inlineForm(
  kodeflate: string,
  malVed: Map<number, string>,
  raw: string,
  nokkel: RegExp,
  dekl: (m: RegExpMatchArray, vist: string) => string,
): Rad[] {
  const treff: Rad[] = [];
  for (const m of kodeflate.matchAll(nokkel)) {
    const start = m.index! + m[0].length;
    const uttrykk = lesUttrykk(kodeflate, start);
    const funn = strengbiter(uttrykk, start, malVed).flatMap(hardkodingerI);
    if (funn.length > 0) {
      const vist = raw.slice(start, start + uttrykk.length).trim().replace(/\s+/g, ' ');
      treff.push({ decl: dekl(m, vist), funn, pos: m.index!, vpos: start });
    }
  }
  return treff;
}

/**
 * Flate (c) + (d/JS) + (e): alt som skrives fra JavaScript-siden.
 *
 * `transition: { … }` (objekt, ikke streng) er IKKE en CSS-verdi — det er en
 * motion/react-overgang, og den hores hjemme i `jsBevegelse`. Skillet tas pa
 * forste tegn i uttrykket, sa de to leserne aldri teller samme sted to ganger.
 */
type FlateRad = Rad & { flate: Flate };

function inlineBevegelse(kodeflate: string, malVed: Map<number, string>, raw: string): FlateRad[] {
  const erJsObjekt = (t: Rad): boolean => raw.slice(t.vpos).trimStart().startsWith('{');
  const merk = (rader: Rad[], flate: Flate): FlateRad[] => rader.map((r) => ({ ...r, flate }));
  return [
    ...merk(
      inlineForm(kodeflate, malVed, raw, INLINE_NOKKEL, (m, vist) => `${m[1]}${m[2] ?? ''}: ${vist}`).filter(
        (t) => !erJsObjekt(t),
      ),
      'inline',
    ),
    ...merk(
      inlineForm(kodeflate, malVed, raw, INLINE_TILORDNING, (m, vist) => `${m[1]}${m[2] ?? ''} = ${vist}`),
      'tilordning',
    ),
    ...merk(
      inlineForm(
        kodeflate,
        malVed,
        raw,
        INLINE_SETPROPERTY,
        (m, vist) => `setProperty('${m[1]}${m[2] ?? ''}', ${vist})`,
      ),
      // setProperty er den samme SKRIVEHANDLINGEN som `.style.x = …`, bare
      // via et annet API — derfor samme flate, ogsa nar malet er en
      // custom property.
      'tilordning',
    ),
    ...merk(
      inlineForm(kodeflate, malVed, raw, INLINE_VARIABEL, (m, vist) => `${m[1]}: ${vist}`),
      'variabel',
    ),
  ];
}

/* ── FLATE (f): BEVEGELSE SKREVET I JS, IKKE I CSS ───────────────────────
   Angrepsfunn 5, 2026-08-04: appen kjorer `motion/react` i fem filer
   (App, BottomTabBar, OutfitTransitionOverlay, HjemScreen,
   PaakledningScreen) og ett WAAPI-kall (VerticalGauge). Ingen av dem gar
   gjennom en CSS-verdi, sa alle tre eksisterende uttrekkere var blinde for
   dem. STANDPUNKT: de er INNENFOR skopet. En hardkodet fjar
   («stiffness: 500, damping: 25») er like mye en kurve som en
   cubic-bezier — og tre skjermer med tre ULIKE fjarer er noyaktig samme
   drift som «to kurver som ligner uten a vare like».

   BEGRENSNING, bevisst og malt: bare LITERALE verdier teller. Er verdien et
   uttrykk (`item.durationMs / 1000`, `MOTION.gaugeSlosh`), er den ikke
   hardkodet PA STEDET, og hvor den kommer fra er en annen kontrakts ansvar
   (motion-grammar-standpunktet lenger nede). Det gjor at
   `VerticalGauge`s WAAPI-kall gir null funn: det er token-drevet.

   `duration: 0` / `delay: 0` er JS-siden av reduced-motion-drapsbryteren
   («instant»-grenen) og fritas pa samme grunnlag som `0ms` i CSS. */
/* Bade JSX-propen `transition={{…}}`, den nostede `transition: {…}` inne i
   en `exit`/`animate`-prop, og WAAPI-kallets `.animate(…)`. Den nostede
   formen treffer ogsa INLINE_NOKKEL; `inlineBevegelse` slipper den derfor
   videre hit i stedet for a lese den som en CSS-streng, sa ingenting telles
   to ganger og ingenting faller mellom de to leserne. */
const JS_BEVEGELSESOBJEKT = /(?<![\w$.])transition\s*[:=]\s*\{|\.animate\s*\(/g;

const JS_NOKKEL = /(?<![\w$.])(duration|delay|ease|easing|stiffness|damping|mass)\s*:/g;

/** En LITERAL bevegelsesverdi: tall, streng eller tall-array. Ellers null. */
function jsLiteral(uttrykk: string): string | null {
  const t = uttrykk.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return t;
  if (/^'[^']*'$/.test(t) || /^"[^"]*"$/.test(t)) return t;
  if (/^\[\s*-?\d+(\.\d+)?(\s*,\s*-?\d+(\.\d+)?)*\s*\]$/.test(t)) return t.replace(/\s+/g, ' ');
  return null;
}

function jsBevegelse(kodeflate: string): Rad[] {
  const treff: Rad[] = [];
  for (const m of kodeflate.matchAll(JS_BEVEGELSESOBJEKT)) {
    // Les hele argument-/prop-uttrykket med klammetelling.
    const start = m.index! + m[0].length;
    let dybde = 1;
    let i = start;
    while (i < kodeflate.length && dybde > 0) {
      const c = kodeflate[i];
      if (c === '{' || c === '(' || c === '[') dybde += 1;
      else if (c === '}' || c === ')' || c === ']') dybde -= 1;
      else if (c === '"' || c === "'") {
        i = lesStreng(kodeflate, i);
        continue;
      }
      i += 1;
    }
    const blokk = kodeflate.slice(start, i);
    for (const n of blokk.matchAll(JS_NOKKEL)) {
      const vStart = n.index! + n[0].length;
      const verdi = jsLiteral(lesUttrykk(blokk, vStart));
      if (verdi === null) continue;
      // JS-drapsbryteren: en varighet/forsinkelse pa 0 slar bevegelsen AV.
      if ((n[1] === 'duration' || n[1] === 'delay') && Number(verdi) === 0) continue;
      // Bart 'linear' er tillatt i CSS og skal vare det her ogsa.
      if ((n[1] === 'ease' || n[1] === 'easing') && /^['"]linear['"]$/.test(verdi)) continue;
      treff.push({
        decl: `${n[1]}: ${verdi}`,
        funn: [verdi],
        pos: start + n.index!,
        vpos: start + vStart,
      });
    }
  }
  return treff;
}

/* ── DOKUMENTERT UNNTAK: reduced-motion-drapsbryteren ────────────────────
   `animation-duration: .01ms !important` inne i
   `@media (prefers-reduced-motion: reduce)` er IKKE bevegelsesgjeld — det er
   den kanoniske mate a sla bevegelse AV pa. Et token her ville vart feil:
   verdien skal ikke kunne endres sentralt.

   Unntaket er STRUKTURELT, ikke en navneliste: det gjelder kun deklarasjoner
   som (1) ligger inne i en prefers-reduced-motion-blokk og (2) setter en
   varighet pa 0 eller .01ms. En ny drapsbryter i en ny fil gar dermed
   automatisk fri — vi vil ha flere av dem, ikke faerre. */
function reduksjonsomrader(css: string): Array<[number, number]> {
  const ut: Array<[number, number]> = [];
  for (const m of css.matchAll(/@media[^{]*prefers-reduced-motion[^{]*\{/g)) {
    let dybde = 0;
    for (let i = m.index! + m[0].length - 1; i < css.length; i += 1) {
      if (css[i] === '{') dybde += 1;
      else if (css[i] === '}') {
        dybde -= 1;
        if (dybde === 0) {
          ut.push([m.index!, i]);
          break;
        }
      }
    }
  }
  return ut;
}

/**
 * Angrepsfunn 3, 2026-08-04: det forrige monsteret
 * `0?\.?0*1?m?s` lot ogsa `1s`, `1ms`, `0.1s` og `.1s` passere. Prosaen over
 * sier «0 eller .01ms»; monsteret sa noe helt annet. Med lekkasjen kunne
 * `animation-duration: 1s !important` legges rett inn i en EKTE
 * prefers-reduced-motion-blokk og bli fritatt — altsa ekte, ny bevegelse
 * gjemt i selve unntaket. Monsteret sier na det prosaen sier, og
 * selvtesten under asserterer de tre lekkasjeverdiene eksplisitt.
 */
const ER_DRAPSBRYTER = /^(transition|animation)-duration:\s*(0s|0ms|0|0?\.0*1ms)(\s*!important)?$/;

/* ── DOKUMENTERT UNNTAK 2: kontraktens EGEN tokenfil ─────────────────────
   Variabeluttrekkeren (flate d) ville ellers flagget selve kontrakten:
   `--dw-m-push: 340ms` og `--dw-ease: cubic-bezier(...)` ER ra verdier — det
   er hele poenget. Ett sted skal eie dem. Unntaket er derfor sa smalt som
   det kan bli: KUN kontraktens egne token-navn, KUN i tokenfilen. Enhver
   annen custom property som hardkoder bevegelse — i denne filen eller en
   annen — er et parallelt token og dermed gjeld. */
const KANONISK_TOKENFIL = 'src/styles/design-tokens-v2.css';
const ER_KANONISK_TOKEN = /^--dw-(m-[\w-]+|ease):/;

/* ── filvandringen (delt med seksjon 4) ─────────────────────────────────── */
function stilfiler(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const full = join(dir, navn);
    if (statSync(full).isDirectory()) {
      if (navn !== '__tests__') stilfiler(full, ut);
    } else if (/\.(css|tsx|ts)$/.test(navn) && !/\.test\.tsx?$/.test(navn)) {
      ut.push(full);
    }
  }
  return ut;
}

const relSti = (fil: string): string => relative(ROOT, fil).replace(/\\/g, '/');
const linjeAv = (tekst: string, pos: number): number => tekst.slice(0, pos).split('\n').length;

type Skann = { treff: Treff[]; unntak: Treff[] };

/**
 * Samme SKRIVESTED skal telles én gang, uansett hvor mange uttrekkere som
 * ser det: «--min-transition: opacity 300ms ease» treffer bade
 * MOTION_DEKLARASJON (som ser «transition:» inne i navnet) og
 * VARIABEL_DEFINISJON. Nokkelen er der VERDIEN begynner, sa to uttrekkere
 * som beskriver samme deklarasjon kollapser, mens to ekte deklarasjoner pa
 * samme linje ikke gjor det. Forste uttrekker vinner.
 */
function deDupliser(rader: FlateRad[]): FlateRad[] {
  const sett = new Set<number>();
  return rader.filter((t) => {
    if (sett.has(t.vpos)) return false;
    sett.add(t.vpos);
    return true;
  });
}

function skannFil(fil: string): Skann {
  const rel = relSti(fil);
  const raw = readFileSync(fil, 'utf8');
  const rå: FlateRad[] = [];
  // Omradene der drapsbryteren er lovlig, i FILENS koordinater.
  const fritatt: Array<[number, number]> = [];

  if (fil.endsWith('.css')) {
    const css = utenCssKommentarer(raw);
    for (const t of hardkodetBevegelse(css)) rå.push({ ...t, flate: 'css' });
    for (const t of variabelBevegelse(css)) rå.push({ ...t, flate: 'variabel' });
    fritatt.push(...reduksjonsomrader(css));
  } else {
    const s = skannTsx(raw);
    const malVed = new Map(s.maler.map((m) => [m.start, m.tekst]));
    for (const mal of s.maler) {
      for (const t of hardkodetBevegelse(mal.tekst)) {
        rå.push({ ...t, pos: mal.start + t.pos, vpos: mal.start + t.vpos, flate: 'mal' });
      }
      for (const t of variabelBevegelse(mal.tekst)) {
        rå.push({ ...t, pos: mal.start + t.pos, vpos: mal.start + t.vpos, flate: 'variabel' });
      }
      for (const [a, b] of reduksjonsomrader(mal.tekst)) fritatt.push([mal.start + a, mal.start + b]);
    }
    rå.push(...inlineBevegelse(s.kode, malVed, raw));
    for (const t of jsBevegelse(s.kode)) rå.push({ ...t, flate: 'js' });
  }

  const treff: Treff[] = [];
  const unntak: Treff[] = [];
  for (const t of deDupliser(rå)) {
    const rad: Treff = { fil: rel, linje: linjeAv(raw, t.pos), flate: t.flate, decl: t.decl, funn: t.funn };
    const iRedusert = fritatt.some(([a, b]) => t.pos >= a && t.pos <= b);
    if (iRedusert && ER_DRAPSBRYTER.test(t.decl)) unntak.push({ ...rad, grunn: 'drapsbryter' });
    else if (rel === KANONISK_TOKENFIL && t.flate === 'variabel' && ER_KANONISK_TOKEN.test(t.decl)) {
      unntak.push({ ...rad, grunn: 'kanonisk-token' });
    } else treff.push(rad);
  }
  return { treff, unntak };
}

/* ── kjor pa hele src EN gang ────────────────────────────────────────────── */
const ALLE_FILER = stilfiler(join(ROOT, 'src'));
const SKANNET = ALLE_FILER.map(skannFil);
const GJELD: Treff[] = SKANNET.flatMap((s) => s.treff);
const FRITATT: Treff[] = SKANNET.flatMap((s) => s.unntak);

/* ════════════════════════════════════════════════════════════════════════
   FROSSET GJELDSREGISTER — malt 2026-08-04 over hele src.

   Hver linje er en deklarasjon som fortsatt hardkoder varighet eller kurve,
   med FILEN den star i. Registeret er en RATSJETT: gjelden kan bare krympe.
    - En deklarasjon som IKKE star her → testen ryker. Det er en ny hardkoding.
    - Betaler du ned gjeld: slett linjen din herfra i SAMME endring, og senk
      BASELINE tilsvarende, sa registeret aldri lyver om restgjelden.
    - `antall` er hvor mange ganger nøyaktig samme deklarasjon star i samme
      fil. Blir den ene til to, ryker testen ogsa da.

   Normalisert form: «<egenskap>: <verdi>» med kollapset mellomrom. For inline
   er «verdi» hele verdi-UTTRYKKET, inkludert ternaren og mal-literalen.

   FASE 3 rydder dette til 0 og setter 0 som nytt last gulv (DoD fase 3, siste
   punkt). Registeret er derfor bevisst langt: det ER arbeidslista.
   ════════════════════════════════════════════════════════════════════════ */
type Gjeldslinje = { fil: string; antall?: number; decl: string };

const KJENT_GJELD: readonly Gjeldslinje[] = [
  /* FLYTTET, IKKE BORTE (fase 3, 2026-08-05): sveipen byttet VARIGHETEN til
     et token, men lot KURVEN staa — riktig, for --dw-ease er
     cubic-bezier(0.2,0.7,0.2,1) mens disse er cubic-bezier(0.19,1,0.22,1) og
     ease-out. Ingen av dem er lik, saa et bytte ville endret bevegelsen.
     Gjelden er den samme kurven i ny linjeform; uten denne oppdateringen
     ville en FLYTTET gjeld sett ut som en NY. */
  { fil: 'src/components/PlaggDetailSheet.tsx', decl: 'animation: plagg-sheet-out var(--dw-m-push-back) cubic-bezier(0.19, 1, 0.22, 1) forwards' },
  { fil: 'src/components/PlaggDetailSheet.tsx', decl: 'animation: plagg-backdrop-out var(--dw-m-push-back) ease-out forwards' },
  /* ── src/App.tsx — FORST MALT 2026-08-04 (fase 2-rettelsen).
     Linje 492 er angrepets hovedfunn: appens rotfil skrev bade varighet og
     kurve via tilordning (`=`), som ingen uttrekker sa. Linje 733–739 er
     motion/react-overgangene mellom ruter. */
  { fil: 'src/App.tsx', decl: "transition = 'transform 200ms ease-out'" }, // linje 492 [tilordning]
  { fil: 'src/App.tsx', decl: 'duration: 0.1' }, // linje 733 [js] — tab-exit
  { fil: 'src/App.tsx', antall: 2, decl: "ease: 'easeOut'" }, // linje 733, 738 [js]
  { fil: 'src/App.tsx', decl: 'duration: 0.14' }, // linje 738 [js] — tab-enter
  { fil: 'src/App.tsx', decl: 'stiffness: 300' }, // linje 739 [js] — drill-push-fjaeren
  { fil: 'src/App.tsx', decl: 'damping: 30' }, // linje 739 [js]
  // ── src/components/BottomTabBar.tsx (fjaer nr. 2 — ulik App-fjaeren)
  { fil: 'src/components/BottomTabBar.tsx', decl: 'stiffness: 500' }, // linje 106 [js]
  { fil: 'src/components/BottomTabBar.tsx', decl: 'damping: 25' }, // linje 106 [js]
  { fil: 'src/components/BottomTabBar.tsx', decl: 'mass: 0.5' }, // linje 106 [js]
  // ── src/components/controls/SegmentedControl.css
  { fil: 'src/components/controls/SegmentedControl.css', decl: "transition: background-color 160ms ease, color 160ms ease" }, // linje 54
  // ── src/components/hjem/hjem-monter.css (referanseskjermen — Steg 6/8/9)
  { fil: 'src/components/hjem/hjem-monter.css', decl: "transition: opacity 300ms ease-out" }, // linje 420
  { fil: 'src/components/hjem/hjem-monter.css', decl: "animation: hjm-scan-sweep var(--hjm-scan-duration, 2100ms) cubic-bezier(0.45, 0, 0.55, 1) 1 forwards" }, // linje 440
  { fil: 'src/components/hjem/hjem-monter.css', decl: "animation: hjm-check-pop 0.32s cubic-bezier(0.34, 1.4, 0.64, 1) backwards" }, // linje 474
  { fil: 'src/components/hjem/hjem-monter.css', decl: "animation: hjm-spin 1s linear infinite" }, // linje 483
  { fil: 'src/components/hjem/hjem-monter.css', decl: "animation: hjm-row-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards" }, // linje 741
  // ── src/components/instrument/TemperatureInstrument.tsx
  { fil: 'src/components/instrument/TemperatureInstrument.tsx', decl: "transition: 'height 160ms ease-out'" }, // linje 53 — DoD-ens navngitte «hardkodet i en inline style»
  // ── src/components/instrument/vertical-gauge.css
  { fil: 'src/components/instrument/vertical-gauge.css', decl: "transition: height 160ms ease-out" }, // linje 105
  { fil: 'src/components/instrument/vertical-gauge.css', decl: "animation: fa-gauge-gust-shift 1.6s ease-in-out infinite" }, // linje 148
  // ── src/components/LivingHomeAtmosphere.css
  { fil: 'src/components/LivingHomeAtmosphere.css', decl: "transition: background-color 180ms var(--ease-out)" }, // linje 42
  // ── src/components/LivingHomeBackground.css
  { fil: 'src/components/LivingHomeBackground.css', decl: "animation-duration: 180ms" }, // linje 59
  { fil: 'src/components/LivingHomeBackground.css', decl: "animation-delay: 30ms" }, // linje 85
  { fil: 'src/components/LivingHomeBackground.css', decl: "animation-delay: 60ms" }, // linje 152
  // ── src/components/outfit/VerifiedAvatarComposite.tsx
  { fil: 'src/components/outfit/VerifiedAvatarComposite.tsx', decl: "transition: reducedMotion ? 'none' : 'opacity 220ms ease'" }, // linje 132
  /* ── src/components/outfit-transition/OutfitTransitionOverlay.tsx
     Varighet og forsinkelse kommer fra modellen (uttrykk, ikke literaler) —
     bare kurven er skrevet inn pa stedet. Det er samme kurve som
     MOTION.easeOut i motion-grammar.ts, skrevet en gang til for hand. */
  { fil: 'src/components/outfit-transition/OutfitTransitionOverlay.tsx', decl: 'ease: [0.22, 1, 0.36, 1]' }, // linje 226 [js]
  // ── src/components/PaywallDialog.tsx
  { fil: 'src/components/PaywallDialog.tsx', decl: "transition: background 160ms var(--ease-standard)" }, // linje 155
  { fil: 'src/components/PaywallDialog.tsx', decl: "animation: pw-modal-in 300ms var(--ease-standard)" }, // linje 292
  { fil: 'src/components/PaywallDialog.tsx', decl: "animation: pw-backdrop-in 250ms ease-out" }, // linje 295
  { fil: 'src/components/PaywallDialog.tsx', decl: "animation: pw-modal-out 220ms ease-out forwards" }, // linje 298
  { fil: 'src/components/PaywallDialog.tsx', decl: "animation: pw-backdrop-out 220ms ease-out forwards" }, // linje 301
  // ── src/components/PlaggDetailSheet.tsx (tredje kurve-dialekt)
  { fil: 'src/components/PlaggDetailSheet.tsx', decl: "animation: plagg-sheet-in 400ms cubic-bezier(0.32, 0.72, 0, 1)" }, // linje 517
  { fil: 'src/components/PlaggDetailSheet.tsx', decl: "animation: plagg-backdrop-in 250ms ease-out" }, // linje 520
  { fil: 'src/components/PlaggDetailSheet.tsx', decl: "animation-delay: calc(120ms + var(--stagger-i, 0) * 45ms)" }, // linje 573
  // ── src/components/planning/PlanChangeRail.css
  { fil: 'src/components/planning/PlanChangeRail.css', decl: "transition: transform 240ms ease" }, // linje 164
  { fil: 'src/components/planning/PlanChangeRail.css', decl: "transition: grid-template-rows 200ms ease, opacity 200ms ease" }, // linje 175
  { fil: 'src/components/planning/PlanChangeRail.css', decl: "transition-duration: 240ms" }, // linje 183
  // ── src/components/RefHourPicker.tsx
  { fil: 'src/components/RefHourPicker.tsx', decl: "transition: reducedMotion ? 'none' : `background 180ms ${TOKENS.easeOut}, color 180ms ${TOKENS.easeOut}, box-shadow 180ms ${TOKENS.easeOut}, transform 160ms ${TOKENS.easeOut}`" }, // linje 87
  // ── src/components/Skeleton.tsx
  { fil: 'src/components/Skeleton.tsx', decl: "animation: baSkeletonShimmer 1.5s linear infinite" }, // linje 68
  // ── src/components/WeatherLottie.tsx (filen har null prefers-reduced-motion)
  { fil: 'src/components/WeatherLottie.tsx', decl: "animation: 'baFallbackBreathe 4.2s ease-in-out infinite'" }, // linje 172
  { fil: 'src/components/WeatherLottie.tsx', decl: "animation: 'baRainFall 1.3s linear infinite'" }, // linje 257
  { fil: 'src/components/WeatherLottie.tsx', decl: "animation: 'baRainFall 1.3s linear .35s infinite'" }, // linje 265
  { fil: 'src/components/WeatherLottie.tsx', decl: "animation: 'baRainFall 1.3s linear .7s infinite'" }, // linje 273
  // ── src/screens/FinnAntrekkScreen.tsx
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: 'transform 160ms ease'" }, // linje 320
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: reduceMotion ? 'none' : `transform 160ms ${TOKENS.easeStandard}`" }, // linje 1065
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: reduceMotion ? 'none' : `background 160ms ${TOKENS.easeStandard}, transform 160ms ${TOKENS.easeStandard}`" }, // linje 1156
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: reduceMotion ? 'none' : 'opacity 160ms ease'" }, // linje 1193
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: reduceMotion ? 'none' : `transform 280ms ${TOKENS.easeStandard}`" }, // linje 1220
  { fil: 'src/screens/FinnAntrekkScreen.tsx', decl: "transition: reduceMotion ? 'none' : `color 160ms ${TOKENS.easeStandard}`" }, // linje 1244
  // ── src/screens/HjemScreen.tsx
  { fil: 'src/screens/HjemScreen.tsx', decl: "transition: reducedMotion ? 'none' : `transform ${MOTION.press}ms ${MOTION.easeOut}, box-shadow 200ms ${MOTION.easeOut}, background-color ${MOTION.tempTransition}ms ${MOTION.easeOut}, color ${MOTION.tempTransition}ms ${MOTION.easeOut}`" }, // linje 947
  // fjaer nr. 3 — igjen ulik de to andre (420/26/0.6 mot 500/25/0.5 og 300/30)
  { fil: 'src/screens/HjemScreen.tsx', decl: 'stiffness: 420' }, // linje 1202 [js]
  { fil: 'src/screens/HjemScreen.tsx', decl: 'damping: 26' }, // linje 1202 [js]
  { fil: 'src/screens/HjemScreen.tsx', decl: 'mass: 0.6' }, // linje 1202 [js]
  // ── src/screens/InnstillingerScreen.tsx (6230 linjer, ingen CSS-fil)
  { fil: 'src/screens/InnstillingerScreen.tsx', decl: "transition: reducedMotion ? 'none' : `background 200ms ${C.ease}`" }, // linje 902
  { fil: 'src/screens/InnstillingerScreen.tsx', decl: "transition: reducedMotion ? 'none' : 'transform var(--dur-toggle, 320ms) var(--ease-standard)'" }, // linje 922
  { fil: 'src/screens/InnstillingerScreen.tsx', decl: "transition: reducedMotion ? 'none' : `background 180ms ${C.ease}, color 180ms ${C.ease}`" }, // linje 1107
  { fil: 'src/screens/InnstillingerScreen.tsx', decl: "transition: reducedMotion ? 'none' : 'opacity 200ms var(--ease-standard)'" }, // linje 2602
  { fil: 'src/screens/InnstillingerScreen.tsx', antall: 2, decl: "transition: reducedMotion ? 'none' : `background 160ms ${C.ease}, color 160ms ${C.ease}, border-color 160ms ${C.ease}`" }, // linje 2767, 4344
  { fil: 'src/screens/InnstillingerScreen.tsx', antall: 17, decl: "transition: reducedMotion ? 'none' : `background 160ms ${C.ease}`" }, // linje 3074, 3352, 3370, 3769, 4071, 4670, 4688, 5016, 5035, 5296, 5315, 5576, 5594, 5849, 5867, 6131, 6149
  { fil: 'src/screens/InnstillingerScreen.tsx', decl: "transition: reducedMotion ? 'none' : `border-color 160ms ${C.ease}`" }, // linje 4632
  /* ── src/screens/OnboardingScreen.tsx (egen ease-familie parallelt med --dw-ease)
     De to forste er SELVE definisjonene av den parallelle familien, forst
     malt 2026-08-04: verdiene ble vasket gjennom egne custom properties og
     var derfor usynlige for bade deklarasjons- og bruksmonsteret.
     `--ob-ease-standard` er --dw-ease skrevet en gang til for hand. */
  { fil: 'src/screens/OnboardingScreen.tsx', decl: '--ob-ease-spring: cubic-bezier(.34,1.32,.64,1)' }, // linje 932 [variabel]
  { fil: 'src/screens/OnboardingScreen.tsx', decl: "transition: all .35s var(--ob-ease-spring)" }, // linje 1028
  { fil: 'src/screens/OnboardingScreen.tsx', decl: "transition: transform .18s var(--ob-ease-spring), box-shadow .18s var(--ob-ease-standard)" }, // linje 1530
  // ── src/screens/PaakledningScreen.tsx (slettes i fase 4 — gjenoppbygges)
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: 'transform 260ms var(--ease-out, cubic-bezier(0.22,1,0.36,1))'" }, // linje 176
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "animation: pkl-canvas-in 260ms var(--ease-out, cubic-bezier(.22,1,.36,1)) both" }, // linje 971
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: opacity .5s ease" }, // linje 975
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: opacity .5s cubic-bezier(.22,1,.36,1)" }, // linje 980
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: opacity .5s cubic-bezier(.16,1,.3,1), transform .56s cubic-bezier(.34,1.35,.5,1)" }, // linje 983 — to egne kurver i én deklarasjon
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: opacity .35s ease" }, // linje 989
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "animation: pkl-blink 1s infinite ease-in-out" }, // linje 993
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "animation-delay: .16s" }, // linje 994
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "animation-delay: .32s" }, // linje 994
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: opacity .3s ease" }, // linje 998
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: transform 160ms var(--ease-out, cubic-bezier(.22,1,.36,1)), box-shadow 160ms var(--ease-out, cubic-bezier(.22,1,.36,1))" }, // linje 1009
  { fil: 'src/screens/PaakledningScreen.tsx', decl: "transition: grid-template-rows 300ms var(--ease-out, cubic-bezier(.22,1,.36,1))" }, // linje 1024
  // fjaer nr. 4. `{ duration: 0 }`-grenen ved siden av er JS-drapsbryteren og telles ikke.
  { fil: 'src/screens/PaakledningScreen.tsx', decl: 'stiffness: 460' }, // linje 1114 [js]
  { fil: 'src/screens/PaakledningScreen.tsx', decl: 'damping: 24' }, // linje 1114 [js]
  // ── src/screens/PlaggbibliotekScreen.tsx
  // ── src/screens/TogGuideScreen.tsx
  { fil: 'src/screens/TogGuideScreen.tsx', decl: "transition: reducedMotion ? 'none' : 'left 160ms var(--ease-standard)'" }, // linje 617
  // ── src/screens/UkeScreen.css
  { fil: 'src/screens/UkeScreen.css', decl: "transition: transform 200ms var(--ease-standard)" }, // linje 351
  // ── src/screens/VarmEllerKaldScreen.tsx
  { fil: 'src/screens/VarmEllerKaldScreen.tsx', decl: "animation: neck-orb-pulse 1.8s ease-in-out infinite" }, // linje 384 — evigheten selv felles av evighetsregelen, ikke her
  // ── src/screens/VinterprogramScreen.tsx
  /* ── src/styles/design-tokens.css (legacy-tokenfilen)
     De seks forste er selve det parallelle tokensettet, forst malt
     2026-08-04. `--ease-out` er MOTION.easeOut er OutfitTransitionOverlays
     `[0.22, 1, 0.36, 1]`: SAMME kurve, tre steder, tre skrivemater. Det er
     ikke tre kontrakter — det er én kontrakt som ikke er samlet enda. */
  { fil: 'src/styles/design-tokens.css', decl: '--ease-standard: cubic-bezier(0.32, 0.72, 0, 1)' }, // linje 172 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: '--ease-out: cubic-bezier(0.22, 1, 0.36, 1)' }, // linje 173 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: '--dur-press: 160ms' }, // linje 174 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: '--dur-toggle: 320ms' }, // linje 175 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: '--dur-sheet: 420ms' }, // linje 176 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: '--dur-temp: 600ms' }, // linje 177 [variabel]
  { fil: 'src/styles/design-tokens.css', decl: "transition: background-color var(--dur-temp, 600ms) var(--ease-out)" }, // linje 491
  { fil: 'src/styles/design-tokens.css', decl: "transition: transform 160ms var(--ease-standard)" }, // linje 539
];

/**
 * BASELINE — gulvet porten fodes med.
 *
 * 122 deklarasjoner med hardkodet bevegelse i src/ per 2026-08-04, fordelt pa
 * 20 i .css, 31 i mal-CSS, 47 i inline CSSProperties, 1 i tilordningsform,
 * 8 i egne custom properties og 15 i JS-bevegelse (motion/react + WAAPI).
 * I tillegg 17 dokumenterte unntak som ikke telles: 6 reduced-motion-
 * drapsbrytere og 11 kanoniske tokendefinisjoner i design-tokens-v2.css.
 *
 * DETTE TALLET KAN BARE KRYMPE. Porten feiler ved OKNING, aldri ved
 * reduksjon. Betaler du ned en linje, slett den fra KJENT_GJELD og senk
 * BASELINE i samme endring. Fase 3 ratsjer det til 0, og 0 blir nytt last
 * gulv.
 *
 * ── 98 → 122 ER EN KORREKSJON AV EN FEILMALING, IKKE SLAKK ───────────────
 * A heve gulvet fordi ny gjeld ble skrevet er a gjore gjeld til norm, og det
 * er forbudt. Dette er det motsatte: ingen av de 24 linjene er ny — alle
 * fantes i src for 98 ble satt, og alle var usynlige fordi UTTREKKERNE ikke
 * kjente skrivemaaten. Angrepet 2026-08-04 viste det ved a injisere nettopp
 * disse formene og se porten melde gront:
 *   +1  tilordningsform. `el.style.transition = '…'` bruker likhetstegn;
 *       INLINE_NOKKEL krevde kolon. `src/App.tsx:492` sto live i rotfilen.
 *   +8  egne custom properties. Verdien vasket gjennom `--min-dur: 700ms`
 *       var usynlig i begge ender. Her la hele det parallelle tokensettet
 *       (`--ease-*`, `--dur-*`, `--ob-ease-*`).
 *   +15 JS-bevegelse. Fem filer kjorer motion/react; fjaerer og
 *       bezier-arrayer gar aldri gjennom en CSS-verdi.
 * Det gamle tallet var ikke populasjonen — det var det tre uttrekkere
 * REKTE, presentert som populasjonen. Ratsjettgulvet var dermed satt under
 * det ekte gulvet, og porten kunne slippe gjennom ekte bevegelse.
 *
 * Kontrollen pa at dette faktisk er en korreksjon og ikke slakk er
 * mekanisk, ikke prosa: `sum(REGISTER) === BASELINE`, hver registerlinje ma
 * GJENFINNES i filen den navngir, og hver av de seks flatene ma gi treff.
 * En linje som ikke finnes lenger kan ikke bli staende og polstre gulvet.
 *
 * MERK om avviket mot kartleggingens 65: kartleggingen talte inline
 * CSSProperties bare der verdien var et rent strengliteral (8 stk). Denne
 * porten leser ogsa formen `reducedMotion ? 'none' : '… 160ms ease'`, som er
 * den DOMINERENDE inline-formen i denne kodebasen (39 til). Grenen for
 * reduced motion er handtert, men varigheten og kurven er like hardkodet.
 */
const BASELINE = 106;

/** Nokkel: fil + normalisert deklarasjon. */
const nokkel = (t: { fil: string; decl: string }): string => `${t.fil} :: ${t.decl}`;

function tellOpp<T>(rader: readonly T[], nok: (r: T) => string, antall: (r: T) => number): Map<string, number> {
  const ut = new Map<string, number>();
  for (const r of rader) ut.set(nok(r), (ut.get(nok(r)) ?? 0) + antall(r));
  return ut;
}

const REGISTER = tellOpp(KJENT_GJELD, nokkel, (g) => g.antall ?? 1);
const FUNNET = tellOpp(GJELD, nokkel, () => 1);

/* ── mal-prover for ikke-vakuositet ──────────────────────────────────────
   Ikke «er skopet stort nok» — det spørsmalet ble stilt 2026-08-04 og godtok
   en kommentarblokk. Sporsmalet er om porten fant MALENE SINE: én navngitt
   deklarasjon per stilflate, pa den flaten den skal ligge. Faller én
   uttrekker ut, blir dens flate stille — og DA skal porten bli rod, ikke
   melde «ingen nye funn». */
const MALPROVER: ReadonlyArray<{ flate: Flate; fil: string; decl: string }> = [
  {
    flate: 'css',
    fil: 'src/components/hjem/hjem-monter.css',
    decl: 'animation: hjm-spin 1s linear infinite',
  },
  {
    // To egne kurver i ÉN deklarasjon — kartleggingens hodeeksempel.
    // NB: fase 4 sletter denne filen. Da slettes ogsa denne provelinjen, i
    // samme endring — nøyaktig samme disiplin som registeret.
    flate: 'mal',
    fil: 'src/screens/PaakledningScreen.tsx',
    decl: 'transition: opacity .5s cubic-bezier(.16,1,.3,1), transform .56s cubic-bezier(.34,1.35,.5,1)',
  },
  {
    // …og en mal-prøve som IKKE star pa slettelista, sa flaten beholder en
    // vakt ogsa etter fase 4.
    flate: 'mal',
    fil: 'src/components/PlaggDetailSheet.tsx',
    decl: 'animation: plagg-sheet-in 400ms cubic-bezier(0.32, 0.72, 0, 1)',
  },
  {
    flate: 'inline',
    fil: 'src/components/instrument/TemperatureInstrument.tsx',
    decl: "transition: 'height 160ms ease-out'",
  },
  /* ── de tre formene angrepet 2026-08-04 slapp gjennom ─────────────────
     Dette er den ENESTE rettelsen som stopper at samme feilklasse gjentar
     seg: hver NY uttrekker far en navngitt, live forekomst her. Faller
     uttrekkeren ut igjen ved en fremtidig refaktorering, blir porten ROD i
     stedet for a melde «ingen nye funn». MALPROVER kan per konstruksjon
     ikke oppdage en skriveform som ingen uttrekker kjenner — den kan bare
     hindre at en form vi ALLEREDE har betalt for a oppdage, blir stille
     igjen. */
  {
    // Angrepets hovedfunn: hardkodet varighet OG kurve i appens rotfil,
    // skilt fra den fangede formen med ett tegn (`=` mot `:`).
    flate: 'tilordning',
    fil: 'src/App.tsx',
    decl: "transition = 'transform 200ms ease-out'",
  },
  {
    // Vaskingen gjennom egne custom properties.
    // Var --ob-ease-standard, men den ble migrert bort av fase 3-sveipen
    // 2026-08-05. Et anker som ikke finnes lenger gjor porten TAUS — den
    // ville bestatt paa fravaer. Byttet til --ob-ease-spring, som fortsatt
    // star og maler noyaktig samme flate.
    flate: 'variabel',
    fil: 'src/screens/OnboardingScreen.tsx',
    // NB: utrekkeren normaliserer til mellomrom etter kolon, selv om kilden
    // skriver `--ob-ease-spring:cubic-bezier(...)` uten. Ankeret må matche
    // utrekkerens form, ikke kildens.
    decl: '--ob-ease-spring: cubic-bezier(.34,1.32,.64,1)',
  },
  {
    // JS-bevegelsen: en kurve skrevet som tall-array, aldri innom CSS.
    flate: 'js',
    fil: 'src/components/outfit-transition/OutfitTransitionOverlay.tsx',
    decl: 'ease: [0.22, 1, 0.36, 1]',
  },
];

/** Filer som MA vare apnet. Fire av dem har ingen egen CSS-fil i det hele tatt. */
const MA_VAERE_LEST: readonly string[] = [
  'src/styles/design-tokens-v2.css',
  'src/components/hjem/hjem-monter.css',
  'src/screens/UkeScreen.css',
  'src/screens/InnstillingerScreen.tsx',
  'src/screens/PaakledningScreen.tsx',
  'src/screens/OnboardingScreen.tsx',
  'src/components/instrument/TemperatureInstrument.tsx',
  'src/components/WeatherLottie.tsx',
];

/**
 * De seks kjente drapsbryterne, MED ANTALL PER FIL.
 *
 * Rettelse 2026-08-04 (angrepsfunn 7): forrige versjon de-dupet lista med
 * `new Set` og sjekket bare `toContain`. Da pinnet den reelt fire FILER, ikke
 * seks DEKLARASJONER — og et tap i én fil kunne maskeres av et tillegg i en
 * annen, sa lenge totalen holdt seg over 6. Na asserteres antallet per fil.
 */
const KJENTE_DRAPSBRYTERE: ReadonlyArray<{ fil: string; antall: number }> = [
  { fil: 'src/components/controls/SegmentedControl.css', antall: 1 },
  { fil: 'src/components/outfit/Antrekkskart.css', antall: 2 },
  { fil: 'src/components/planning/PlanChangeRail.css', antall: 1 },
  { fil: 'src/styles/design-tokens.css', antall: 2 },
];

/**
 * De 11 kanoniske tokendefinisjonene — kontraktens eget hjem for ra verdier.
 *
 * Ogsa dette unntaket ma bevise at det traff noe ekte. Blir det 0, har
 * variabeluttrekkeren eller tokenfilen endret seg uten at noen sa det; blir
 * det flere enn 11, har noen lagt et nytt bevegelsestoken inn i kontrakten
 * uten a foye det til VARIGHETER (som er der verdien faktisk handheves).
 */
const KANONISKE_TOKENS = 11;

describe('detektoren selv — den ser det den lover å se', () => {
  // En detektor uten egen test er prosa. Disse sier presist hva som er gjeld
  // og hva som ikke er det, uten å røre en eneste kildefil.
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

  /* ── de tre nye flatene ─────────────────────────────────────────────── */

  const tsxTreff = (kilde: string): Array<Omit<Treff, 'fil' | 'linje'>> => {
    const s = skannTsx(kilde);
    const malVed = new Map(s.maler.map((m) => [m.start, m.tekst]));
    const ut: Array<Omit<Treff, 'fil' | 'linje'>> = [];
    for (const mal of s.maler) {
      for (const t of hardkodetBevegelse(mal.tekst)) ut.push({ flate: 'mal', decl: t.decl, funn: t.funn });
      for (const t of variabelBevegelse(mal.tekst)) ut.push({ flate: 'variabel', decl: t.decl, funn: t.funn });
    }
    for (const t of inlineBevegelse(s.kode, malVed, kilde)) {
      ut.push({ flate: t.flate, decl: t.decl, funn: t.funn });
    }
    for (const t of jsBevegelse(s.kode)) ut.push({ flate: 'js', decl: t.decl, funn: t.funn });
    return ut;
  };

  it('flate (b): CSS i en <style>-mal-literal leses som CSS', () => {
    const kilde = 'const x = <style>{`\n  .a { transition: opacity 300ms ease-out; }\n`}</style>;';
    expect(tsxTreff(kilde)).toEqual([
      { flate: 'mal', decl: 'transition: opacity 300ms ease-out', funn: ['300ms', 'ease-out'] },
    ]);
  });

  it('flate (c): inline CSSProperties — DoD-ens «hardkodet 300ms i en inline style»', () => {
    const kilde = "const s = { opacity: 1, transition: '300ms ease-out', zIndex: 50 };";
    const t = tsxTreff(kilde);
    expect(t.map((x) => x.flate)).toEqual(['inline']);
    // Verdien stopper ved kommaet: naboegenskapen skal ALDRI havne i decl-en,
    // ellers blir registerlinjen ustabil ved enhver redigering av naboen.
    expect(t[0]!.decl).toBe("transition: '300ms ease-out'");
    expect(t[0]!.funn).toEqual(['300ms', 'ease-out']);
  });

  it('flate (c): ternaren teller — reduced-motion-grenen fritar ikke varigheten', () => {
    const kilde = "const s = { transition: reducedMotion ? 'none' : 'opacity 160ms ease' };";
    expect(tsxTreff(kilde)[0]!.funn).toEqual(['160ms', 'ease']);
  });

  it('flate (c): mal-literal som inline-verdi leses, interpolasjonen blankes', () => {
    const kilde = 'const s = { transition: `background 180ms ${T.easeOut}` };';
    const t = tsxTreff(kilde);
    expect(t[0]!.funn).toEqual(['180ms']);
    expect(t[0]!.decl).toBe('transition: `background 180ms ${T.easeOut}`');
  });

  it('rene var()-verdier slipper gjennom ogsa inline', () => {
    expect(tsxTreff("const s = { transition: 'opacity var(--dw-m-state) var(--dw-ease)' };")).toEqual([]);
  });

  /* ── de tre formene angrepet 2026-08-04 slapp gjennom ─────────────────
     Hver av disse er en injeksjon som ga GRONN port for rettelsen. */

  it('flate (e): TILORDNING — `el.style.transition = …` er like hardkodet som `transition:`', () => {
    const t = tsxTreff("el.style.transition = 'transform 200ms ease-out';");
    expect(t.map((x) => x.flate)).toEqual(['tilordning']);
    expect(t[0]!.decl).toBe("transition = 'transform 200ms ease-out'");
    expect(t[0]!.funn).toEqual(['200ms', 'ease-out']);
    // Nullstilling er ikke bevegelse — den fjerner den.
    expect(tsxTreff("el.style.transition = '';")).toEqual([]);
    // Sammenligning er ikke tilordning.
    expect(tsxTreff("if (el.style.transition === '300ms ease') return;").map((x) => x.flate)).toEqual([]);
    // Samme handling via setProperty.
    const sp = tsxTreff("el.style.setProperty('transition', 'opacity 300ms ease-out');");
    expect(sp.map((x) => x.flate)).toEqual(['tilordning']);
    expect(sp[0]!.funn).toEqual(['300ms', 'ease-out']);
  });

  it('flate (d): EGEN CUSTOM PROPERTY — vasking gjennom var() teller i BEGGE ender', () => {
    // Angrepets injeksjon: en helt ny egen kurve, usynlig for begge de
    // gamle monstrene. Definisjonen er hardkodingen; bruken er bare et var().
    const css = '.a { --siv-dur: 700ms; --siv-ease: cubic-bezier(.9,.1,.8,.2); transition: opacity var(--siv-dur) var(--siv-ease); }';
    expect(variabelBevegelse(css).map((t) => t.decl)).toEqual([
      '--siv-dur: 700ms',
      '--siv-ease: cubic-bezier(.9,.1,.8,.2)',
    ]);
    // Bruken er ren og skal IKKE telle en gang til — ellers straffes
    // tokenbruk dobbelt og kontrakten blir umulig a betale ned.
    expect(funnI(css)).toEqual([]);
    // Custom property uten bevegelse i verdien er ikke bevegelsesgjeld.
    expect(variabelBevegelse('.a { --siv-flate: rgba(0,0,0,.05); --siv-bredde: 12px; }')).toEqual([]);
    // Inline-varianten av samme form.
    const t = tsxTreff("const s = { '--siv-dur': '700ms' };");
    expect(t.map((x) => x.flate)).toEqual(['variabel']);
    expect(t[0]!.decl).toBe("--siv-dur: '700ms'");
  });

  it('flate (d): samme SKRIVESTED telles én gang, selv nar to monstre ser det', () => {
    // `--x-transition:` treffer bade MOTION_DEKLARASJON (som ser «transition:»
    // inni navnet) og VARIABEL_DEFINISJON. Uten de-duplisering ville
    // registeret krevd to linjer for én deklarasjon — og gulvet blitt blast
    // opp av bokforing i stedet for av kode.
    const css = '.a { --min-transition: opacity 300ms ease; }';
    const rader: FlateRad[] = [
      ...hardkodetBevegelse(css).map((t) => ({ ...t, flate: 'css' as const })),
      ...variabelBevegelse(css).map((t) => ({ ...t, flate: 'variabel' as const })),
    ];
    expect(rader.length, 'begge monstrene SKAL se den — det er nettopp derfor de-dupliseringen trengs').toBe(2);
    expect(deDupliser(rader).map((t) => t.decl)).toEqual(['transition: opacity 300ms ease']);
  });

  it('flate (f): JS-BEVEGELSE — fjaerer og bezier-arrayer gar aldri innom CSS', () => {
    const overgang = tsxTreff('<motion.div transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }} />');
    expect(overgang.map((x) => x.flate)).toEqual(['js', 'js']);
    expect(overgang.map((x) => x.decl)).toEqual(['duration: 0.14', 'ease: [0.22, 1, 0.36, 1]']);
    // Fjaeren har ingen varighet og ingen kurve — den ER kurven.
    expect(
      tsxTreff("<motion.div transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.5 }} />").map(
        (x) => x.decl,
      ),
    ).toEqual(['stiffness: 500', 'damping: 25', 'mass: 0.5']);
    // WAAPI.
    expect(tsxTreff("node.animate(frames, { duration: 300, easing: 'ease-out' });").map((x) => x.decl)).toEqual([
      'duration: 300',
      "easing: 'ease-out'",
    ]);
    // UTTRYKK er ikke hardkodet PA STEDET: token-drevet bevegelse gar fri.
    // (Det er noyaktig VerticalGauge.tsx sitt WAAPI-kall.)
    expect(tsxTreff('node.animate(frames, { duration: MOTION.gaugeSlosh, easing: MOTION.backOvershoot });')).toEqual(
      [],
    );
    expect(tsxTreff('<motion.div transition={{ duration: item.durationMs / 1000 }} />')).toEqual([]);
    // `duration: 0` er JS-siden av drapsbryteren.
    expect(tsxTreff('<motion.div transition={instant ? { duration: 0 } : { duration: 0.3 }} />').map((x) => x.decl)).toEqual(
      ['duration: 0.3'],
    );
  });

  it('den nostede `transition: {…}` leses som JS, ikke som en CSS-streng — og telles én gang', () => {
    // Uten skillet ville CSSProperties-uttrekkeren tatt objektet og funnet
    // ingenting i det (ingen strengliteraler med ms), sa varigheten hadde
    // blitt usynlig igjen — samme feilklasse, ny innpakning.
    const t = tsxTreff("<motion.div exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeOut' } }} />");
    expect(t.map((x) => x.flate)).toEqual(['js', 'js']);
    expect(t.map((x) => x.decl)).toEqual(['duration: 0.1', "ease: 'easeOut'"]);
  });

  it('verdimonstrene er case-insensitive, og steps()/linear() er kurver', () => {
    // CSS er case-insensitivt; uttrekkeren var det ikke (angrepsfunn 4).
    expect(funnI('.a { transition: opacity 300MS EASE-OUT; }')).toEqual(['300MS', 'EASE-OUT']);
    expect(funnI('.a { animation: x 1s steps(4, end); }')).toEqual(['1s', 'steps(4, end)']);
    expect(funnI('.a { transition: opacity var(--dw-m-state) linear(0, 0.5, 1); }')).toEqual(['linear(0, 0.5, 1)']);
    // …men BART «linear» er fortsatt tillatt, og «linear-gradient(» er ingen kurve.
    expect(funnI('.a { transition: opacity var(--dw-m-feedback) linear; }')).toEqual([]);
    expect(variabelBevegelse('.a { --siv-bg: linear-gradient(180deg, #fff, #000); }')).toEqual([]);
  });

  /* ── kommentarene ───────────────────────────────────────────────────── */

  it('en UTKOMMENTERT deklarasjon er ikke gjeld — hverken blokk- eller linjekommentar', () => {
    // Slik skannFil faktisk gjør det: rens FØRST, uttrekk etterpå.
    expect(funnI(utenCssKommentarer('/* .a { transition: opacity 300ms ease-out; } */'))).toEqual([]);
    expect(tsxTreff("// const s = { transition: '300ms ease-out' };")).toEqual([]);
    expect(tsxTreff("/* const s = { transition: '300ms ease-out' }; */")).toEqual([]);
    // …og en uren uttrekker ville tatt den. Det er nettopp forskjellen.
    expect(funnI('/* .a { transition: opacity 300ms ease-out; } */')).toEqual(['300ms', 'ease-out']);
  });

  it('FELLA fra 2026-08-04: «@media … prefers-reduced-motion» i filens EGEN prosa fritar ingenting', () => {
    // Malt i src: App.tsx:96, PaywallDialog.tsx:42 og fire kommentarer i
    // InnstillingerScreen.tsx nevner uttrykket i ren prosa. Leses det for
    // kommentarene er strippet, kan brace-vandringen carve ut et falskt
    // «unntaksomrade» og gjore ekte gjeld usynlig.
    const kilde = [
      '/**',
      ' * Vi setter @media her og respekterer prefers-reduced-motion andre steder.',
      ' */',
      "const s = { transition: '300ms ease-out' };",
    ].join('\n');
    const s = skannTsx(kilde);
    expect(reduksjonsomrader(s.kode), 'kommentaren skal ikke gi noe unntaksomrade').toEqual([]);
    const malVed = new Map(s.maler.map((m) => [m.start, m.tekst]));
    expect(inlineBevegelse(s.kode, malVed, kilde).map((t) => t.funn)).toEqual([['300ms', 'ease-out']]);
  });

  it('drapsbryteren fritas KUN inne i en ekte prefers-reduced-motion-blokk', () => {
    const inni = '@media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; } }';
    const omr = reduksjonsomrader(inni);
    const t = hardkodetBevegelse(inni)[0]!;
    expect(omr.some(([a, b]) => t.pos >= a && t.pos <= b)).toBe(true);
    expect(ER_DRAPSBRYTER.test(t.decl)).toBe(true);
    // Samme deklarasjon UTENFOR blokken er vanlig gjeld.
    const ute = '.a { animation-duration: .01ms !important; }';
    expect(reduksjonsomrader(ute)).toEqual([]);
    // Og en vanlig varighet inne i blokken er heller ikke drapsbryter.
    expect(ER_DRAPSBRYTER.test('transition-duration: 240ms')).toBe(false);
  });

  it('VERDIGATEN i drapsbryteren lekker ikke — kun 0 og .01ms fritas', () => {
    // Angrepsfunn 3, 2026-08-04: det gamle monsteret `0?\.?0*1?m?s` sa noe
    // helt annet enn prosaen over det. `animation-duration: 1s !important`
    // lagt inne i en EKTE prefers-reduced-motion-blokk ble fritatt — altsa
    // ny, ekte bevegelse gjemt i selve unntaket. Byggerens egen C-prove
    // (240ms) landet tilfeldigvis utenfor lekkasjen og fanget den ikke.
    for (const av of [
      'transition-duration: 0s',
      'transition-duration: 0ms',
      'animation-duration: 0',
      'animation-duration: .01ms',
      'animation-duration: 0.01ms !important',
      'transition-duration: .01ms !important',
    ]) {
      expect(ER_DRAPSBRYTER.test(av), `«${av}» er en ekte drapsbryter og skal fritas`).toBe(true);
    }
    for (const pa of [
      'animation-duration: 1s !important',
      'animation-duration: 1ms',
      'transition-duration: 0.1s',
      'transition-duration: .1s',
      'transition-duration: 10ms',
      'transition-duration: 240ms',
      // Bare VARIGHETEN kan slas av pa denne maten; en kurve kan ikke.
      'transition-timing-function: linear',
    ]) {
      expect(ER_DRAPSBRYTER.test(pa), `«${pa}» slar ikke AV bevegelse — den skal aldri fritas`).toBe(false);
    }
  });

  it('linjebevarende blanking: kommentarrensingen flytter aldri et linjenummer', () => {
    const kilde = '/* a\nb\nc */\n.x { transition: opacity 300ms ease; }';
    const renset = utenCssKommentarer(kilde);
    expect(renset.length).toBe(kilde.length);
    expect(linjeAv(renset, hardkodetBevegelse(renset)[0]!.pos)).toBe(4);
  });
});

describe('IKKE-VAKUØSITET — porten fant sine egne mål', () => {
  it('hele src ble åpnet: alle .css + alle ikke-test .ts/.tsx', () => {
    const cssFiler = ALLE_FILER.filter((f) => f.endsWith('.css'));
    const kodeFiler = ALLE_FILER.filter((f) => !f.endsWith('.css'));
    expect(cssFiler.length, 'fant ikke de 14 CSS-filene — har filvandringen mistet et filter?').toBeGreaterThanOrEqual(14);
    expect(kodeFiler.length, 'fant nesten ingen .ts/.tsx — skopet er kuttet').toBeGreaterThanOrEqual(230);
    const lest = new Set(ALLE_FILER.map(relSti));
    expect(MA_VAERE_LEST.filter((f) => !lest.has(f)), 'disse filene ble aldri åpnet').toEqual([]);
  });

  it('alle SEKS flatene ga treff — en stille uttrekker er en blind port', () => {
    const perFlate: Record<Flate, number> = { css: 0, mal: 0, inline: 0, tilordning: 0, variabel: 0, js: 0 };
    for (const t of GJELD) perFlate[t.flate] += 1;
    const dode = (Object.keys(perFlate) as Flate[]).filter((f) => perFlate[f] === 0);
    expect(
      dode,
      'Disse uttrekkerne fant ingenting. En uttrekker som ikke finner noe er ikke et bevis pa at flaten er ren — den er stille, og da har porten ikke bestått.',
    ).toEqual([]);
    console.log(
      `\n  bevegelsesdetektor: ${ALLE_FILER.length} filer skannet, ${GJELD.length} funn ` +
        `(${perFlate.css} css / ${perFlate.mal} mal-css / ${perFlate.inline} inline / ` +
        `${perFlate.tilordning} tilordning / ${perFlate.variabel} variabel / ${perFlate.js} js), ` +
        `${FRITATT.length} dokumenterte unntak, baseline ${BASELINE}\n`,
    );
  });

  it('hver navngitt målprøve ble funnet, på riktig flate', () => {
    const savnet = MALPROVER.filter(
      (p) => !GJELD.some((t) => t.fil === p.fil && t.decl === p.decl && t.flate === p.flate),
    ).map((p) => `${p.flate}: ${p.fil} :: ${p.decl}`);
    expect(
      savnet,
      'Porten fant ikke deklarasjoner den VET finnes. Den har ikke bestått — den har vært taus.',
    ).toEqual([]);
  });

  it('drapsbryter-unntaket traff sine seks kjente deklarasjoner — riktig ANTALL i riktig FIL', () => {
    // Unntaket skal ikke vare dekorasjon. Det skal ha fritatt noe EKTE — og
    // hvis den strukturelle @media-gjenkjenningen ryker, blir dette 0.
    const drapsbrytere = FRITATT.filter((t) => t.grunn === 'drapsbryter');
    expect(
      drapsbrytere.length,
      'ingen drapsbrytere gjenkjent — @media-gjenkjenningen er ute av drift',
    ).toBe(KJENTE_DRAPSBRYTERE.reduce((a, k) => a + k.antall, 0));
    const perFil = new Map<string, number>();
    for (const t of drapsbrytere) perFil.set(t.fil, (perFil.get(t.fil) ?? 0) + 1);
    expect(
      KJENTE_DRAPSBRYTERE.map((k) => `${k.fil}: ${perFil.get(k.fil) ?? 0}`),
      'Antall drapsbrytere per fil har endret seg. Et tap i én fil skal ALDRI kunne maskeres av et tillegg i en annen.',
    ).toEqual(KJENTE_DRAPSBRYTERE.map((k) => `${k.fil}: ${k.antall}`));
  });

  it('det kanoniske tokenunntaket fritok kontraktens egne 11 tokens — og bare dem', () => {
    const kanoniske = FRITATT.filter((t) => t.grunn === 'kanonisk-token');
    expect(
      kanoniske.length,
      `${KANONISK_TOKENFIL} skal eie noyaktig ${KANONISKE_TOKENS} ra bevegelsesverdier (10 varigheter + --dw-ease). Blir det 0, er variabeluttrekkeren eller tokenfilen ute av drift; blir det flere, er et nytt token sluppet inn uten a bli handhevet av VARIGHETER.`,
    ).toBe(KANONISKE_TOKENS);
    expect(
      [...new Set(kanoniske.map((t) => t.fil))],
      'Unntaket er smalt med vilje: kun kontraktens egne token-navn, kun i tokenfilen.',
    ).toEqual([KANONISK_TOKENFIL]);
    // …og unntaket dekker noyaktig de tokenene kontrakten faktisk handhever.
    expect([...kanoniske.map((t) => t.decl.split(':')[0]!)].sort()).toEqual([...BEVEGELSESTOKENS].sort());
  });

  it('registeret lyver ikke: hver oppført gjeld finnes fortsatt, i filen den navngir', () => {
    const feil: string[] = [];
    for (const [k, forventet] of REGISTER) {
      const faktisk = FUNNET.get(k) ?? 0;
      if (faktisk < forventet) feil.push(`${k}   (registrert ${forventet}, funnet ${faktisk})`);
    }
    expect(
      feil,
      'Disse er ryddet opp (eller flyttet) — slett/juster linjen i KJENT_GJELD og senk BASELINE i samme endring, så registeret viser den ekte restgjelden.',
    ).toEqual([]);
  });

  it('BASELINE er summen av registeret — gulvet og lista sier det samme', () => {
    const sum = [...REGISTER.values()].reduce((a, b) => a + b, 0);
    expect(sum, `KJENT_GJELD summerer til ${sum}, men BASELINE står på ${BASELINE}`).toBe(BASELINE);
  });
});

/* ════════════════════════════════════════════════════════════════════════
   STANDPUNKT: src/styles/motion-grammar.ts

   Angrepsfunn 2b, 2026-08-04: filen er et KOMPLETT PARALLELT
   bevegelsestokensystem — seks hardkodede kurver og et titalls hardkodede
   ms-varigheter — og den var hverken talt, fritatt eller nevnt. Taushet er
   det ene svaret som ikke gar an: den lar leseren tro at kontrakten dekker
   appens bevegelse nar halve tokensettet star utenfor.

   STANDPUNKTET ER: motion-grammar.ts ER GJELD, og den fritas fra
   GJELD-tellingen av én grunn — den er ikke en DEKLARASJON, den er en
   DEFINISJON. GJELD teller steder der bevegelse SKRIVES; en tokenfil er
   stedet verdien skal bo. Ratsjetten mot BASELINE ville derfor straffet
   flyttingen av en verdi INN i et token, som er noyaktig retningen
   kontrakten vil ha. (`--dw-*` i design-tokens-v2.css fritas pa samme
   grunnlag, se KANONISK_TOKENFIL — forskjellen er at den er kontraktens
   tokenfil, mens denne er en konkurrent.)

   MIGRERINGEN ER NAVNGITT: motion-grammar.ts skal kollapse inn i
   --dw-m-* og --dw-ease i fase 3, samme rydding som tommer KJENT_GJELD. Til da
   er filen FROSSET av registeret under: den kan ikke fa én kurve eller én
   varighet til. Det stopper det som faktisk er farlig — at det parallelle
   systemet vokser mens vi later som det ikke finnes.

   MERK at konsumentene IKKE er fritatt. `transform ${MOTION.press}ms
   ${MOTION.easeOut}` telles der den skrives, og fem av MOTION-verdiene
   dupliserer kurver som allerede finnes med andre navn (MOTION.easeOut ===
   --ease-out === OutfitTransitionOverlays [0.22, 1, 0.36, 1]).
   ════════════════════════════════════════════════════════════════════════ */
const MOTION_GRAMMAR = 'src/styles/motion-grammar.ts';

/** Frosset. Navn → verdi, malt 2026-08-04. Lista kan bare KRYMPE. */
const MOTION_GRAMMAR_KURVER: readonly string[] = [
  'easeOut: cubic-bezier(0.22, 1, 0.36, 1)',
  'easeOutSoft: cubic-bezier(0.16, 1, 0.3, 1)',
  'easeOutExpo: cubic-bezier(0.19, 1, 0.22, 1)',
  'iosDrawer: cubic-bezier(0.32, 0.72, 0, 1)',
  'natural: cubic-bezier(0.4, 0, 0.2, 1)',
  'backOvershoot: cubic-bezier(0.34, 1.56, 0.64, 1)',
];

/** Malt 2026-08-04: 20 ms-varigheter + 4 trykk-skalaer = 24 talltokens. */
const MOTION_GRAMMAR_VARIGHETER = 24;

describe('det parallelle bevegelsessystemet er navngitt, malt og frosset', () => {
  const kilde = readFileSync(join(ROOT, MOTION_GRAMMAR), 'utf8');
  const kode = skannTsx(kilde).kode;

  it('filen finnes fortsatt der standpunktet sier den ligger', () => {
    // Blir den flyttet eller slettet uten at dette blir oppdatert, star
    // standpunktet igjen og peker pa ingenting — nettopp
    // foreldet-liste-monsteret.
    expect(kode.length, `${MOTION_GRAMMAR} er borte eller tom`).toBeGreaterThan(0);
  });

  it('de seks kurvene er de seks kjente — ingen nye', () => {
    const funnet = [...kode.matchAll(/(\w+):\s*'(cubic-bezier\([^)]*\))'/g)].map((m) => `${m[1]}: ${m[2]}`);
    expect(
      funnet,
      `Kurvene i ${MOTION_GRAMMAR} har endret seg. Fasit: fase 3 kollapser dem inn i --dw-ease. En NY kurve her er en syvende dialekt i et sprak som allerede har seks for mange.`,
    ).toEqual(MOTION_GRAMMAR_KURVER);
  });

  it('varighetene kan ikke bli flere', () => {
    // Rene talltilordninger i MOTION-objektet: `press: 160,` — bade
    // ms-varigheter og skalaer. Vi teller dem samlet, fordi det som skal
    // stoppes er at OBJEKTET vokser, ikke hvilken kategori tallet har.
    const tall = [...kode.matchAll(/^\s{2}(\w+):\s*-?\d+(\.\d+)?,/gm)].length;
    expect(
      tall,
      `${MOTION_GRAMMAR} har ${tall} hardkodede talltokens; frosset pa ${MOTION_GRAMMAR_VARIGHETER}. Nye verdier skal inn i design-tokens-v2.css som --dw-m-*, ikke her.`,
    ).toBeLessThanOrEqual(MOTION_GRAMMAR_VARIGHETER);
  });

  it('filen er lest av filvandringen, ikke bare av denne blokken', () => {
    expect(ALLE_FILER.map(relSti)).toContain(MOTION_GRAMMAR);
  });

  it('KONSUMENTENE er ikke fritatt — bruken telles der den skrives', () => {
    // Fritaket gjelder DEFINISJONEN, aldri anvendelsen. Finner vi ingen
    // registrert gjeld som konsumerer MOTION, har enten konsumentene
    // forsvunnet eller uttrekkerne blitt stille.
    const konsumenter = KJENT_GJELD.filter((g) => g.decl.includes('MOTION.'));
    expect(
      konsumenter.length,
      'ingen registrert gjeld konsumerer MOTION — da er enten bruken borte eller uttrekkeren dod',
    ).toBeGreaterThan(0);
  });
});

describe('hele src — ingen NY hardkodet bevegelse', () => {
  it('hver hardkodet varighet/kurve står i det frosne gjeldsregisteret', () => {
    const brukt = new Map<string, number>();
    const nye: string[] = [];
    for (const t of GJELD) {
      const k = nokkel(t);
      const n = (brukt.get(k) ?? 0) + 1;
      brukt.set(k, n);
      if (n > (REGISTER.get(k) ?? 0)) nye.push(`${t.fil}:${t.linje}  [${t.flate}]  ${t.decl}   ← ${t.funn.join(', ')}`);
    }
    expect(
      nye,
      'Ny hardkodet bevegelse i src. Bruk var(--dw-m-*) og var(--dw-ease) — det var nettopp «mocken er kontrakten»-presedensen som skapte dagens gjeld. Er den bevisst og dokumentert, må linjen inn i KJENT_GJELD og BASELINE heves, og DET er å gjøre gjeld til norm.',
    ).toEqual([]);
  });

  it('gjelden vokser aldri (ratsjett mot BASELINE)', () => {
    expect(
      GJELD.length,
      `src har ${GJELD.length} deklarasjoner med hardkodet bevegelse PA DE SEKS MALTE FLATENE (css, mal-css, inline, tilordning, variabel, js); baseline er ${BASELINE}. Tallet kan bare krympe. Merk at pastanden er skopet: en skriveform ingen uttrekker kjenner er ikke talt, og «ikke talt» er ikke «finnes ikke».`,
    ).toBeLessThanOrEqual(BASELINE);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   4. Ingen var() peker i tomme luften.
   Samme filvandring som seksjon 3 — bade .css, mal-CSS og inline.
   ──────────────────────────────────────────────────────────────────────── */
describe('referanser til bevegelses- og lystokens peker på noe som finnes', () => {
  it('hver var(--dw-m-* / --dw-ease / --dw-lys-* / --dw-kant-*) er deklarert', () => {
    const deklarerte = new Set<string>([...BEVEGELSESTOKENS, ...LYSTOKENS]);
    const ukjente: string[] = [];
    let referanser = 0;
    for (const fil of ALLE_FILER) {
      const raw = readFileSync(fil, 'utf8');
      let tekst: string;
      if (fil.endsWith('.css')) tekst = utenCssKommentarer(raw);
      else {
        const s = skannTsx(raw);
        tekst = `${s.kode}\n${s.maler.map((m) => m.tekst).join('\n')}`;
      }
      for (const m of tekst.matchAll(/var\(\s*(--dw-(?:m-|ease|lys-|kant-)[\w-]*)/g)) {
        referanser += 1;
        const navn = m[1]!;
        if (!deklarerte.has(navn)) ukjente.push(`${relSti(fil)}: var(${navn})`);
      }
    }
    expect(referanser, 'IKKE-VAKUØSITET: fant ingen var(--dw-m-*)-referanser i det hele tatt').toBeGreaterThan(0);
    expect(
      ukjente,
      'En skrivefeil i var() er helt stille i nettleseren — egenskapen faller bare tilbake til sin initialverdi.',
    ).toEqual([]);
  });
});
