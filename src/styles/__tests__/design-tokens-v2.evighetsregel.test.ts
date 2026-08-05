/**
 * EVIGHETSREGELEN — ingen evighetsbevegelse i hvile.
 *
 * BAKGRUNN (Impeccable-blokker 4a, DoD fase 2). Bevegelsesdetektoren i
 * `design-tokens-v2.motion.test.ts` leter etter hardkodede VARIGHETER og
 * KURVER. I `animation: hjm-spin 1s linear infinite` plukker den bare `1s`.
 * Tokeniser varigheten til `var(--dw-m-*)` og treffet forsvinner helt — mens
 * evigheten star igjen usett. Ordet `infinite` har aldri vart et mal noe sted
 * i dette prosjektet.
 *
 * Det er ikke en teoretisk luke. Nettopp `hjm-spin` snurret gjennom hele det
 * pastatte holdet i scan-seremonien: port 6 malte 8 ms stillstand der kravet
 * er 500, og EIEREN rapporterte den manglende stoppen to ganger for noe
 * instrument sa den. Samtidig star `neck-orb-pulse` i VarmEllerKaldScreen
 * fortsatt og pulserer i evighet, oppfort som BLOKKERER i lanseringsstatusen.
 *
 * REGELEN. En evighetsbevegelse i `src/` er et brudd med mindre den star pa
 * unntakslista under. Unntaksaksen er TILSTANDSGATET ARBEID mot HVILE-
 * BEVEGELSE: en snurring som viser at appen jobber, og som STOPPER nar
 * arbeidet er ferdig, er lovlig. En puls som gar for alltid fordi skjermen er
 * apen, er ikke det.
 *
 * REVISJON 2026-08-04 — HVA ANGREPET FELTE, OG HVA SOM ER LUKKET.
 * Forrige utgave av denne porten stod GRONN pa to injiserte romminger. Begge
 * er lukket her, og lukkingene er selv mutasjonstestet:
 *
 *  (M2) «EN OPPFORING DEKKET TO REGLER.» `erUnntatt` brukte
 *       `t.selektor.includes(u.gateSelektor)`. Gaten for skjelettet var
 *       `.ba-skeleton-shimmer` — en DELSTRENG av `.ba-skeleton-shimmer-
 *       brandglow`. Enhver BEM-utvidelse av en unntatt klasse arvet fritaket
 *       gratis sa lenge keyframe-navnet ble gjenbrukt, og rapporten skrev
 *       «unntatt: 5» mot FIRE oppforinger uten at noe reagerte.
 *       LUKKET pa tre lag: `eierSelektor` kreves EKSAKT lik treffets selektor
 *       (ikke delstreng), hver oppforing har en `antall`-KARDINALITETSLAS som
 *       males eksakt, og `UNNTATTE.length` males mot summen av dem.
 *
 *  (M3) «PORTEN MALTE ET ORD, IKKE ET FENOMEN.» Detektoren sa kun etter
 *       `infinite`. En `node.animate([...], { iterations: Infinity })` i
 *       repoets EGET idiom (VerticalGauge.tsx bruker alt `node.animate`) var
 *       helt usynlig. Og det var ikke hypotetisk: `WeatherLottie.tsx` rendrer
 *       `<DotLottieReact autoplay loop>` der `pause()` KUN kalles ved
 *       reducedMotion — evighetsbevegelse i hvile som lever i appen i dag,
 *       i en fil porten alt forte som bruddfil, og som gulvet ikke talte.
 *       LUKKET: detektoren maler na fire idiomer — CSS-ordet `infinite`,
 *       WAAPI `iterations: Infinity`, motion/GSAP `repeat: Infinity | -1`,
 *       og `loop`-attributtet pa loopende spillere (`<DotLottieReact>`,
 *       `<video>` m.fl.).
 *
 * UNNTAKSLISTA ER IKKE PROSA. Hver oppforing ma bevise seg selv i KILDEN:
 *   - `eierSelektor` ma vare EKSAKT selektoren til regelen som eier bevegelsen
 *   - `gateSelektor` ma sta i den, og ma vare SMALERE enn den (ellers er
 *     «gaten» bare animasjonens egen eierklasse — den kan ikke feile uten at
 *     regelen forsvinner, og beviser da ingenting)
 *   - `gateKilde` ma finnes i filen (tilstanden som slar gaten av)
 *   - `stopp` ma finnes i filen (den eksplisitte av-bryteren)
 *   - `tilstandsstopp` ma finnes UTENFOR enhver `prefers-reduced-motion`-
 *     blokk. Alle fire opprinnelige unntak oppfylte `stopp` med en a11y-
 *     fallback; det er OS-hensyn, ikke en tilstandsgate. Bevegelsen ma stoppe
 *     fordi ARBEIDET er ferdig, ikke fordi brukeren har skrudd av animasjoner.
 * Alt males mot KOMMENTAR-MASKERT kilde, sa man kan ikke skrive beviset sitt i
 * en kommentar. En oppforing som ikke lar seg bevise er ROD, og en oppforing
 * som er ryddet bort er ogsa ROD — registeret skal aldri lyve.
 *
 * IKKE-VAKUOSITET (DoD: «Null mal = RODT»). «Er skopet stort nok» duger ikke —
 * det ble provd 2026-08-04 og godtok en kommentarblokk. Denne porten beviser
 * i stedet at den fant MALENE SINE:
 *   1. hver fil i FORVENTEDE_FILER er faktisk lest, og hver fil et register
 *      peker pa er i skopet
 *   2. hvert HARDE_FUNN er faktisk gjenfunnet (det DoD navngir kan aldri
 *      forsvinne stille ut av portens synsfelt)
 *   3. hver UNNTAK-oppforing er faktisk gjenfunnet, bevist OG telt eksakt
 *   4. hver BASELINE-oppforing er faktisk gjenfunnet — gulvet pinner
 *      IDENTITET, ikke bare antall
 *   5. hver fil i KJENTE_BRUDDFILER har faktisk fortsatt et brudd
 *   6. KOMMENTARFELLA er lukket, malt pa ekte filer: `hjem-monter.css`
 *      inneholder ordet `infinite` BADE i en kommentar (linje ~477) og i kode
 *      (linje ~483). Porten skal se den ene og ikke den andre. `ScanOverlay.tsx`
 *      og `scan-orchestration.ts` inneholder ordet KUN i kommentar og skal gi
 *      null treff. Det er samme felle som kuttet doktrine-lintens skop i dag,
 *      der et sok etter `@media` traff ordet inne i filens egen prosa.
 *
 * BASELINE. Se BASELINE_REGISTER: gulvet er ikke lenger et tall, men en liste
 * over (fil · navn · antall). Porten feiler bade nar totalen OKER, nar en NY
 * identitet dukker opp, og nar en registrert identitet er BORTE uten at linjen
 * er slettet. Fase 3 ratsjer registeret mot tomt.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/* ────────────────────────────────────────────────────────────────────────
   1. MASKERING
   Maskering erstatter med MELLOMROM, ikke sletting: da star hver index og
   hvert linjenummer uroert, sa feilmeldingen kan peke pa ekte fil:linje.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Maskerer `/* … *\/` og `// …` med mellomrom (radskift beholdes).
 *
 * Tre modi fordi kildene er tre: ren CSS, TSX med CSS i template-literaler,
 * og TSX med CSSProperties-objekter.
 *  - inne i `'…'` / `"…"`: ingenting er kommentar (ellers spiser en `https://`
 *    resten av linjen, og en apostrof i prosa spiser resten av filen)
 *  - inne i `` `…` ``: `/* … *\/` ER kommentar (det er CSS der inne), `//` er
 *    det ikke
 *  - i kode: begge former er kommentar
 */
export function maskerKommentarer(kilde: string): string {
  const ut = kilde.split('');
  const blank = (fra: number, til: number): void => {
    for (let k = fra; k < til && k < ut.length; k += 1) {
      if (ut[k] !== '\n' && ut[k] !== '\r') ut[k] = ' ';
    }
  };
  let i = 0;
  let streng: '' | "'" | '"' | '`' = '';
  while (i < kilde.length) {
    const c = kilde[i]!;
    const n = kilde[i + 1];
    if (streng === "'" || streng === '"') {
      if (c === '\\') { i += 2; continue; }
      if (c === streng) streng = '';
      i += 1;
      continue;
    }
    if (streng === '`') {
      if (c === '\\') { i += 2; continue; }
      if (c === '/' && n === '*') {
        const slutt = kilde.indexOf('*/', i + 2);
        const til = slutt === -1 ? kilde.length : slutt + 2;
        blank(i, til);
        i = til;
        continue;
      }
      if (c === '`') streng = '';
      i += 1;
      continue;
    }
    if (c === '/' && n === '*') {
      const slutt = kilde.indexOf('*/', i + 2);
      const til = slutt === -1 ? kilde.length : slutt + 2;
      blank(i, til);
      i = til;
      continue;
    }
    if (c === '/' && n === '/') {
      let slutt = kilde.indexOf('\n', i);
      if (slutt === -1) slutt = kilde.length;
      blank(i, slutt);
      i = slutt;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { streng = c; i += 1; continue; }
    i += 1;
  }
  return ut.join('');
}

/**
 * Blanker ut hver `@media (prefers-reduced-motion …) { … }`-blokk, klamme-
 * balansert.
 *
 * HVORFOR: `stopp`-feltet i unntakslista ble 2026-08-04 oppfylt av en a11y-
 * fallback i ALLE fire unntak (hjem-monter.css:490, vertical-gauge.css:257,
 * PaakledningScreen.tsx:1031, Skeleton.tsx:72). At bevegelsen stopper nar
 * brukeren har skrudd AV animasjoner i operativsystemet beviser ingenting om
 * at den stopper nar ARBEIDET er ferdig. `tilstandsstopp` males derfor mot
 * kilde der disse blokkene er borte.
 */
export function maskerReduksjonsblokker(kilde: string): string {
  const ut = kilde.split('');
  for (const m of kilde.matchAll(/@media[^{}]*prefers-reduced-motion[^{}]*\{/giu)) {
    const start = m.index!;
    let i = start + m[0].length;
    let dybde = 1;
    while (i < kilde.length && dybde > 0) {
      if (kilde[i] === '{') dybde += 1;
      else if (kilde[i] === '}') dybde -= 1;
      i += 1;
    }
    for (let k = start; k < i; k += 1) {
      if (ut[k] !== '\n' && ut[k] !== '\r') ut[k] = ' ';
    }
  }
  return ut.join('');
}

/* ────────────────────────────────────────────────────────────────────────
   2. DETEKTOREN — fire idiomer, ikke ett ord
   ──────────────────────────────────────────────────────────────────────── */

type Kilde = 'css-regel' | 'inline' | 'waapi' | 'motion' | 'spiller' | 'ukjent';

type Treff = {
  fil: string;
  linje: number;
  /**
   * `css-regel` = uquotert verdi i en CSS-regel · `inline` = JS-strengverdi ·
   * `waapi` = Web Animations API · `motion` = motion/GSAP-transition ·
   * `spiller` = `loop`-attributt pa en loopende spiller.
   */
  kilde: Kilde;
  /** Selektoren til regelen som eier bevegelsen. Tom for alt annet enn css-regel. */
  selektor: string;
  /** @keyframes-navnet, eller idiomets navn. */
  navn: string;
  decl: string;
};

/** `infinite` som eget ord — ikke `POSITIVE_INFINITY`, ikke `isInfinite`. */
const EVIGHET = /(?<![\w-])infinite(?![\w-])/gu;

const IKKE_NAVN =
  /^(?:[\d.]+m?s|[\d.]+|infinite|alternate|alternate-reverse|reverse|normal|forwards|backwards|both|none|running|paused|linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)$/u;

/** Nermeste omsluttende `{` — bakover, med klammebalanse. */
function omsluttendeBlokkStart(txt: string, idx: number): number {
  let dybde = 0;
  for (let i = idx; i >= 0; i -= 1) {
    const c = txt[i];
    if (c === '}') dybde += 1;
    else if (c === '{') {
      if (dybde === 0) return i;
      dybde -= 1;
    }
  }
  return -1;
}

function linjenummer(txt: string, idx: number): number {
  let n = 1;
  for (let i = 0; i < idx; i += 1) if (txt[i] === '\n') n += 1;
  return n;
}

function linjetekst(txt: string, idx: number): string {
  const fra = txt.lastIndexOf('\n', idx) + 1;
  const til = txt.indexOf('\n', idx) === -1 ? txt.length : txt.indexOf('\n', idx);
  return txt.slice(fra, til).trim();
}

/**
 * Finner hvert `infinite` i en KOMMENTAR-MASKERT kilde, med selektor og navn.
 *
 * Skillet inline/css-regel avgjores av om verdien er QUOTERT: CSS quoterer
 * aldri en animation-shorthand, JS gjor det alltid. Det er derfor
 * AtmosphereBackgrounds template-interpolerte
 * `` `atm-snow-fall ${p.durationSec}s linear ${p.delaySec}s infinite` ``
 * havner riktig — den er usynlig for ethvert literal-grep pa varighet, men
 * ordet `infinite` star der like fullt.
 */
export function finnEvighet(maskert: string, fil: string): Treff[] {
  const ut: Treff[] = [];
  for (const m of maskert.matchAll(EVIGHET)) {
    const i = m.index!;
    const vindusStart = Math.max(0, i - 400);
    const vindu = maskert.slice(vindusStart, i);
    const egenskaper = [...vindu.matchAll(/animation(?:-name|-iteration-count)?\s*:/gu)];
    const siste = egenskaper[egenskaper.length - 1];

    let kilde: Kilde = 'ukjent';
    let decl = linjetekst(maskert, i);
    let navn = '?';

    if (siste) {
      let v = vindusStart + siste.index! + siste[0].length;
      while (v < maskert.length && /\s/u.test(maskert[v]!)) v += 1;
      const forste = maskert[v];
      const erQuote = forste === "'" || forste === '"' || forste === '`';
      let slutt: number;
      if (erQuote) {
        slutt = v + 1;
        while (slutt < maskert.length && maskert[slutt] !== forste) {
          if (maskert[slutt] === '\\') slutt += 1;
          slutt += 1;
        }
        v += 1;
      } else {
        slutt = v;
        while (slutt < maskert.length && maskert[slutt] !== ';' && maskert[slutt] !== '}') slutt += 1;
      }
      if (i >= v && i <= slutt) {
        kilde = erQuote ? 'inline' : 'css-regel';
        const verdi = maskert.slice(v, slutt).trim().replace(/\s+/gu, ' ');
        decl = `animation: ${verdi}`;
        navn = verdi.split(' ').find((t) => t.length > 0 && !IKKE_NAVN.test(t) && !t.startsWith('${') && !t.startsWith('var(') && !t.startsWith('cubic-bezier') && !t.startsWith('steps(')) ?? '?';
      }
    }

    let selektor = '';
    if (kilde === 'css-regel') {
      const blokkStart = omsluttendeBlokkStart(maskert, i);
      if (blokkStart >= 0) {
        let s = blokkStart - 1;
        while (s >= 0 && !'{};`'.includes(maskert[s]!)) s -= 1;
        selektor = maskert.slice(s + 1, blokkStart).trim().replace(/\s+/gu, ' ');
      }
    }

    ut.push({ fil, linje: linjenummer(maskert, i), kilde, selektor, navn, decl });
  }
  return ut;
}

/**
 * Idiomene som IKKE inneholder ordet `infinite`.
 *
 * Uten disse maler porten et ORD og ikke et FENOMEN, og navnet
 * («ingen evighetsbevegelse i hvile») er bredere enn det den faktisk ser.
 * `iterations`-varianten er repoets eget idiom: `VerticalGauge.tsx:191`
 * bruker alt `node.animate(...)`.
 *
 * Lookbehind `(?<![\w-])` er baerende: den holder `background-repeat:` ute.
 */
const IDIOM_MONSTRE: readonly { re: RegExp; navn: string; kilde: Kilde }[] = [
  {
    // Web Animations API: element.animate(frames, { iterations: Infinity })
    re: /(?<![\w-])iterations\s*:\s*(?:Infinity|Number\s*\.\s*POSITIVE_INFINITY)(?![\w])/gu,
    navn: 'iterations: Infinity',
    kilde: 'waapi',
  },
  {
    // motion/framer-motion: transition: { repeat: Infinity } · GSAP: repeat: -1
    re: /(?<![\w-])repeat\s*:\s*(?:Infinity|Number\s*\.\s*POSITIVE_INFINITY|-\s*1(?![\d.]))/gu,
    navn: 'repeat: evig',
    kilde: 'motion',
  },
];

export function finnEvighetsIdiom(maskert: string, fil: string): Treff[] {
  const ut: Treff[] = [];
  for (const monster of IDIOM_MONSTRE) {
    for (const m of maskert.matchAll(monster.re)) {
      ut.push({
        fil,
        linje: linjenummer(maskert, m.index!),
        kilde: monster.kilde,
        selektor: '',
        navn: monster.navn,
        decl: linjetekst(maskert, m.index!),
      });
    }
  }
  return ut;
}

/**
 * Spillere som gar i evig loop nar `loop` star pa taggen. `<DotLottieReact>`
 * er den som faktisk brukes i dag (WeatherLottie.tsx:134-140); resten star her
 * fordi et bytte av spiller ikke skal apne hullet pa nytt.
 */
const LOOPBARE_TAGGER = ['DotLottieReact', 'DotLottiePlayer', 'Lottie', 'Player', 'video'] as const;

export function finnLoopendeSpillere(maskert: string, fil: string): Treff[] {
  const ut: Treff[] = [];
  const tagRe = new RegExp(`<(${LOOPBARE_TAGGER.join('|')})(?![\\w-])`, 'gu');
  for (const m of maskert.matchAll(tagRe)) {
    const tag = m[1]!;
    let i = m.index! + m[0].length;
    let dybde = 0;
    let streng: '' | "'" | '"' | '`' = '';
    let slutt = -1;
    while (i < maskert.length) {
      const c = maskert[i]!;
      if (streng) {
        if (c === '\\') { i += 2; continue; }
        if (c === streng) streng = '';
        i += 1;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { streng = c; i += 1; continue; }
      if (c === '{') { dybde += 1; i += 1; continue; }
      if (c === '}') { dybde -= 1; i += 1; continue; }
      if (c === '>' && dybde === 0) { slutt = i; break; }
      i += 1;
    }
    if (slutt === -1) continue;
    const apning = maskert.slice(m.index!, slutt + 1);
    for (const l of apning.matchAll(
      /(?<![\w-])loop(?![\w-])\s*(?:=\s*(\{[^}]*\}|"[^"]*"|'[^']*'))?/gu,
    )) {
      const verdi = (l[1] ?? '').replace(/[\s{}"']/gu, '');
      if (verdi === 'false' || verdi === '0') continue;
      const idx = m.index! + l.index!;
      ut.push({
        fil,
        linje: linjenummer(maskert, idx),
        kilde: 'spiller',
        selektor: '',
        navn: `<${tag} loop>`,
        decl: `<${tag} … loop${verdi ? `={${verdi}}` : ''} …>`,
      });
    }
  }
  return ut;
}

export function finnAlt(maskert: string, fil: string): Treff[] {
  return [
    ...finnEvighet(maskert, fil),
    ...finnEvighetsIdiom(maskert, fil),
    ...finnLoopendeSpillere(maskert, fil),
  ];
}

/* ────────────────────────────────────────────────────────────────────────
   3. SKOPET — den EKTE koden i src/, ikke docs/mocks/
   ──────────────────────────────────────────────────────────────────────── */

const ENDELSER = ['.css', '.ts', '.tsx'];

function erTest(rel: string): boolean {
  return rel.includes('__tests__/') || /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(rel);
}

function samleFiler(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    if (navn === 'node_modules') continue;
    const full = join(dir, navn);
    if (statSync(full).isDirectory()) samleFiler(full, ut);
    else if (ENDELSER.some((e) => navn.endsWith(e))) ut.push(full);
  }
  return ut;
}

function relPosix(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

const FILER = samleFiler(join(ROOT, 'src'))
  .map(relPosix)
  .filter((rel) => !erTest(rel))
  .sort();

const RAA = new Map<string, string>();
const MASKERT = new Map<string, string>();
/** Kommentarer OG prefers-reduced-motion-blokker borte. Kun for `tilstandsstopp`. */
const UTEN_A11Y = new Map<string, string>();
for (const rel of FILER) {
  const raa = readFileSync(join(ROOT, rel), 'utf8');
  const maskert = maskerKommentarer(raa);
  RAA.set(rel, raa);
  MASKERT.set(rel, maskert);
  UTEN_A11Y.set(rel, maskerReduksjonsblokker(maskert));
}

const ALLE_TREFF: Treff[] = FILER.flatMap((rel) => finnAlt(MASKERT.get(rel)!, rel)).sort(
  (a, b) => a.fil.localeCompare(b.fil) || a.linje - b.linje,
);

/* ────────────────────────────────────────────────────────────────────────
   4. REGISTRENE
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Filene porten MA ha lest. Er en av dem borte fra skopet, har globberen
 * drevet — nettopp det doktrine-linten gjor i dag, der den globber
 * `docs/mocks/monter/*.html` og aldri ser en eneste src-fil.
 */
const FORVENTEDE_FILER: readonly string[] = [
  'src/components/AtmosphereBackground.tsx',
  'src/components/Skeleton.tsx',
  'src/components/WeatherLottie.tsx',
  'src/components/hjem/hjem-monter.css',
  'src/components/instrument/VerticalGauge.tsx',
  'src/components/instrument/vertical-gauge.css',
  'src/screens/PaakledningScreen.tsx',
  'src/screens/VarmEllerKaldScreen.tsx',
];

type Unntak = {
  fil: string;
  navn: string;
  /** EKSAKT selektor for regelen som eier bevegelsen. Delstreng holder ikke. */
  eierSelektor: string;
  /** Ma sta i eierSelektor, og ma vare SMALERE enn den. */
  gateSelektor: string;
  /** Hvor mange regler denne ene oppforingen har lov til a dekke. */
  antall: number;
  /** Ma finnes i filen: tilstanden som slar gaten av. */
  gateKilde: string;
  /** Ma finnes i filen: den eksplisitte av-bryteren (a11y-fallback teller). */
  stopp: string;
  /**
   * Ma finnes UTENFOR enhver prefers-reduced-motion-blokk: beviset for at
   * bevegelsen slutter fordi ARBEIDET er ferdig. Kan ligge i en annen fil enn
   * den som eier bevegelsen — for `.is-dragging` er tilstanden i TSX-en.
   */
  tilstandsstopp: { fil: string; tekst: string };
  hjemmel: string;
};

/**
 * UNNTAKSLISTA — tilstandsgatet arbeid.
 *
 * Aksen er ikke «hvor pen er bevegelsen», men: STOPPER den av seg selv nar
 * arbeidet er gjort? Alle tre under er gatet pa en tilstand som beviselig tar
 * slutt (markoren lander, fingeren slippes, analysen fullfores), og alle tre
 * har en tilstandsstopp i kilden UTENFOR a11y-blokken. Ingen av dem gar i
 * hvile.
 *
 * `baSkeletonShimmer` STOD her til 2026-08-04. Den er flyttet ned i gulvet:
 * se BASELINE_REGISTER for hvorfor.
 */
const UNNTAK: readonly Unntak[] = [
  {
    // Fullforingsmarkoren. Snurrer KUN mens markoren ikke har landet; ved
    // MARKER_AT_MS (2500) settes data-done='true' og animasjonen settes til
    // none. Uavhengig malt av verify-hjem port 6: 663 ms stillstand (krav 500).
    fil: 'src/components/hjem/hjem-monter.css',
    navn: 'hjm-spin',
    eierSelektor: ".hjm-s-marker[data-animate='true'][data-done='false']",
    gateSelektor: "[data-done='false']",
    antall: 1,
    gateKilde: ".hjm-s-marker[data-done='true'] { animation: none",
    stopp: '.hjm-s-marker { animation: none !important; transition: none !important; }',
    tilstandsstopp: {
      fil: 'src/components/hjem/hjem-monter.css',
      tekst: ".hjm-s-marker[data-done='true'] { animation: none;",
    },
    hjemmel: 'vedtak.json/fullforingsmarkor-2500 (laast) + tools/verify-hjem.mjs port 6',
  },
  {
    // Vindkastene i gauge-instrumentet. Kjorer KUN mens pekeren er nede:
    // VerticalGauge.tsx legger pa `.is-dragging` ved pointerdown og fjerner
    // den ved pointerup, og har egen test pa at klassen ikke finnes ved
    // forste maling. CSS-en sier det selv: «never at rest».
    fil: 'src/components/instrument/vertical-gauge.css',
    navn: 'fa-gauge-gust-shift',
    eierSelektor: '.fa-gauge-fill--air.is-dragging .fa-gauge-streak',
    gateSelektor: '.is-dragging',
    antall: 1,
    gateKilde: '.fa-gauge-fill--air.is-dragging .fa-gauge-streak {',
    stopp: '.fa-gauge-fill--air.is-dragging .fa-gauge-streak { animation: none; }',
    // Tilstanden bor i TSX-en, ikke i CSS-en: slippes pekeren, blir
    // `gustActive` false og klassen forsvinner fra elementet.
    tilstandsstopp: {
      fil: 'src/components/instrument/VerticalGauge.tsx',
      tekst: "gustActive ? 'is-dragging' : null",
    },
    hjemmel: 'kalm-doktrinen: streker star stille i hvile; VerticalGauge.test.tsx asserterer fravar av .is-dragging ved forste paint',
  },
  /* SLETTET 2026-08-05: «pkl-blink» — analyse-prikkene i Paakledning.
     Oppforingen bar sin egen utlopsdato: «skjermen skal gjenoppbygges i fase
     4 … nar filen forsvinner, blir denne oppforingen foreldet og porten ROD
     til linjen slettes. Det er meningen.» Det skjedde: lasteren la i
     CurrentPaakledningScreen, den unadde grenen som ble slettet i fase 4.
     Bevegelsen er borte sammen med flaten, ikke frikjent — og «lovet»-tallet
     regnes ut av registrene, sa det folger med av seg selv. */
];

/**
 * HARDE FUNN — kan ALDRI baselines bort, og kan aldri forsvinne stille ut av
 * portens synsfelt.
 *
 * DoD fase 2 skriver regelen for denne porten ordrett: «Verifiser: feller
 * `VarmEllerKaldScreen.tsx:384`». Lanseringsstatusen forer samme linje under
 * BLOKKERER LANSERING. En port som lot nettopp DET funnet gli ut av skopet og
 * fortsatt meldte gront, ville vart den attende utgaven av feilen som er
 * dokumentert sju ganger i laerdom-hjem-2026-08-03.md.
 *
 * Rettes funnet: slett linjen her OG slett oppforingen i BASELINE_REGISTER i
 * samme endring.
 */
const HARDE_FUNN: readonly { fil: string; navn: string; hjemmel: string }[] = [
  /* NEDBETALT 2026-08-05 (DoD fase 6B): neck-orb-pulse kjorte `infinite`.
     Orben LAERER hvor man kjenner paa nakken; en lardom som gjentas i det
     uendelige er ikke lenger en lardom. Na tre sykluser (5,4 s) og saa ro.
     Var et HARDT FUNN (DoD fase 2 + lanseringsstatus) og kunne derfor ALDRI
     baselines bort — bare rettes. Det er nettopp det som skjedde. */
];

type Baseline = { fil: string; navn: string; antall: number; hardtFunn?: true; merknad?: string };

/**
 * BASELINE — dagens brudd som GULV, pinnet pa IDENTITET og ikke bare antall.
 *
 * FORRIGE UTGAVE PINNET ET TALL (`BASELINE_BRUDD = 7`). Da kunne man bytte ut
 * et brudd inne i en kjent bruddfil mot et annet og sta gront. Na er hver
 * (fil · navn) fort opp for seg: en NY identitet er rod selv om totalen star
 * stille, og en identitet som er BORTE er rod til linjen slettes.
 *
 * TALLET GIKK 7 → 9 2026-08-04. Begge trinnene er KORREKSJONER av feilmaling,
 * ikke slakk — ingen tidligere talt brudd er fjernet, og mengden porten TIER
 * om gikk ned, ikke opp:
 *
 *  +1  `WeatherLottie.tsx` · `<DotLottieReact loop>`. Detektoren malte ORDET
 *      `infinite`. `<DotLottieReact autoplay loop>` (linje 134-140) looper i
 *      evighet uten a inneholde ordet, og `pause()` kalles KUN ved
 *      reducedMotion (linje 91-107). Bevegelsen har ligget i appen hele tiden,
 *      i en fil porten alt forte som bruddfil; det gamle gulvet pa 7 var en
 *      UNDERRAPPORTERING av tilstanden i appen, ikke en malestokk den kom
 *      under.
 *
 *  +1  `Skeleton.tsx` · `baSkeletonShimmer`. Stod som UNNTAK. Beviset holdt
 *      ikke i noen av de tre leddene: `gateSelektor` `.ba-skeleton-shimmer`
 *      var animasjonens EGEN eierklasse (kan ikke feile uten at regelen
 *      forsvinner), `gateKilde` `ariaLabel = 'Laster innhold'` var en default
 *      PROPVERDI uten gate-virkning, og `stopp` var en reduced-motion-
 *      fallback. Kontrollert 2026-08-04: modulen har NULL importorer i src/ —
 *      `<Skeleton>` monteres ikke noe sted, sa det finnes ikke engang et
 *      kallsted som avmonterer den. Et unntak som ikke kan bevises er ikke et
 *      unntak. Ryddes komponenten bort (eller far den et ekte kallsted med
 *      avmontering), slettes linjen her.
 *
 * De ni, malt 2026-08-04 mot 12 mal i src/ minus 3 unntak.
 * Fase 3 ratsjer registeret mot tomt.
 */
const BASELINE_REGISTER: readonly Baseline[] = [
  { fil: 'src/components/AtmosphereBackground.tsx', navn: 'atm-snow-fall', antall: 1 },
  { fil: 'src/components/AtmosphereBackground.tsx', navn: 'atm-rain-fall', antall: 1 },
  {
    fil: 'src/components/Skeleton.tsx',
    navn: 'baSkeletonShimmer',
    antall: 1,
    merknad: 'nedgradert fra UNNTAK 2026-08-04: tautologisk gate, propverdi som gatekilde, a11y-fallback som stopp — og null importorer',
  },
  { fil: 'src/components/WeatherLottie.tsx', navn: 'baFallbackBreathe', antall: 1 },
  { fil: 'src/components/WeatherLottie.tsx', navn: 'baRainFall', antall: 3 },
  {
    fil: 'src/components/WeatherLottie.tsx',
    navn: '<DotLottieReact loop>',
    antall: 1,
    merknad: 'nytt mal 2026-08-04: fenomenet fantes i appen for, detektoren malte bare ordet «infinite»',
  },
  /* NEDBETALT 2026-08-05 — se merknaden i HARDE_FUNN over. */
];

const BASELINE_BRUDD = BASELINE_REGISTER.reduce((s, b) => s + b.antall, 0);

/**
 * OM «UTENFOR GULVET». Forrige utgave skrev at `neck-orb-pulse` la «utenfor
 * gulvet» samtidig som 2+4+1 = 7 = gulvet. Pastanden var direkte usann: en
 * dokumentert BLOKKERER LANSERING la inne i toleransen med en kommentar som
 * benektet det.
 *
 * Rettet her ved a fore den EKSPLISITT i registeret med `hardtFunn: true`.
 * Doktrinen i `docs/design-notes/skjermmanifest.md §4` holder EIERRAPPORTERTE
 * punkter utenfor gulvet — og de to punktene der er begge PaakledningScreen.
 * `neck-orb-pulse` er et REVISJONSfunn (lanseringsstatus-2026-08-03.md:56),
 * ikke et eierfunn. A trekke det ut av gulvet ville latt gulvet melde farre
 * brudd enn appen har, som er nettopp den underrapporteringen porten ble felt
 * for. Det telles derfor, og kan i tillegg aldri baselines bort.
 */
const HARDE_FUNN_ER_TELT_I_GULVET = true;

/**
 * Filene som HAR evighetsbevegelse i hvile i dag. Ratsjett pa BREDDE:
 * registeret over teller identitet, dette teller SPREDNING.
 * Kan bare KRYMPE, som registeret — og hver linje ma bevise seg (se testen
 * under): rettes en fil, blir porten ROD til linjen slettes. Uten det er
 * lista en ren TILLATELSESLISTE som bare kan bli foreldet i permissiv
 * retning, og en rettet fil beholder staende tillatelse til a fa ny
 * evighetsbevegelse.
 */
const KJENTE_BRUDDFILER: readonly string[] = [
  'src/components/AtmosphereBackground.tsx',
  'src/components/Skeleton.tsx',
  'src/components/WeatherLottie.tsx',
  /* VarmEllerKaldScreen.tsx ute 2026-08-05: neck-orb-pulse er begrenset
     til tre sykluser, sa filen har ingen evighetsbevegelse igjen. En fil
     som blir staende her ville hatt staende tillatelse til a fa ny. */
];

/* ────────────────────────────────────────────────────────────────────────
   5. KLASSIFISERING
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Et treff er unntatt bare hvis det er EKSAKT den regelen unntaket beskriver.
 *
 * `includes` holdt ikke. Gaten `.ba-skeleton-shimmer` er en delstreng av
 * `.ba-skeleton-shimmer-brandglow`, sa en helt ny og helt ugatet bevegelse
 * arvet fritaket gratis ved a gjenbruke keyframe-navnet — og rapporten skrev
 * «unntatt: 5» mot fire oppforinger uten at noe reagerte. Na kreves EKSAKT
 * likhet med `eierSelektor`, OG at `gateSelektor` star i den (gaten er
 * fortsatt baerende: fjerner noen `[data-done='false']` fra `.hjm-s-marker`,
 * er `hjm-spin` igjen evighetsbevegelse i hvile — akkurat slik den var da
 * port 6 malte 8 ms stillstand — og da skal den telle som brudd).
 */
const erUnntatt = (t: Treff): boolean =>
  UNNTAK.some(
    (u) =>
      u.fil === t.fil &&
      u.navn === t.navn &&
      t.selektor === u.eierSelektor &&
      t.selektor.includes(u.gateSelektor),
  );

const BRUDD = ALLE_TREFF.filter((t) => !erUnntatt(t));
const UNNTATTE = ALLE_TREFF.filter(erUnntatt);

const pek = (t: Treff): string =>
  `${t.fil}:${t.linje} — ${t.selektor || `(${t.kilde})`} { ${t.decl} }`;

const identitet = (t: Treff): string => `${t.fil} · ${t.navn}`;

/* ────────────────────────────────────────────────────────────────────────
   6. PORTEN
   ──────────────────────────────────────────────────────────────────────── */

describe('evighetsregelen — ikke-vakuositet: porten fant sine egne mal', () => {
  it('skopet er den EKTE koden i src/ — hver forventet fil er lest', () => {
    const lest = new Set(FILER);
    const savnet = FORVENTEDE_FILER.filter((f) => !lest.has(f));
    expect(
      savnet,
      'Disse filene er ikke i skopet. Enten er de flyttet/slettet, eller sa har globberen drevet — det er nettopp den feilen doktrine-linten star i i dag (globber docs/mocks/, ser null src-filer).',
    ).toEqual([]);
    const css = FILER.filter((f) => f.endsWith('.css')).length;
    const tsx = FILER.length - css;
    expect(css, `bare ${css} .css-filer i skopet — malt 14 i src/ 2026-08-04`).toBeGreaterThanOrEqual(14);
    expect(tsx, `bare ${tsx} .ts/.tsx-filer i skopet — malt 237 i src/ 2026-08-04`).toBeGreaterThanOrEqual(200);
  });

  it('hver fil et register peker pa er i skopet — ingen oppforing kan gjemme seg utenfor', () => {
    const lest = new Set(FILER);
    const pekt = [
      ...UNNTAK.flatMap((u) => [u.fil, u.tilstandsstopp.fil]),
      ...HARDE_FUNN.map((h) => h.fil),
      ...BASELINE_REGISTER.map((b) => b.fil),
      ...KJENTE_BRUDDFILER,
    ];
    const utenfor = [...new Set(pekt)].filter((f) => !lest.has(f)).sort();
    expect(
      utenfor,
      'Et register peker pa en fil porten aldri leser. Da er beviset uetterprovbart, og oppforingen kan sta igjen som ren prosa.',
    ).toEqual([]);
  });

  it('detektoren fant faktisk mal — null mal er RODT, ikke gront', () => {
    const lovet = UNNTAK.reduce((s, u) => s + u.antall, 0) + BASELINE_BRUDD;
    expect(
      ALLE_TREFF.length,
      `for fa evighetsbevegelser funnet i hele src/ (fant ${ALLE_TREFF.length}, registrene lover ${lovet}). Enten er regelen oppfylt (da skal BASELINE_REGISTER, UNNTAK og HARDE_FUNN vare tomme), eller sa maler porten ingenting.`,
    ).toBeGreaterThanOrEqual(lovet);
  });

  it('KOMMENTARFELLA: ordet i filens EGEN prosa teller ikke, ordet i koden gjor', () => {
    // Fella, malt pa ekte filer og ikke pa syntetisk kilde: hjem-monter.css
    // inneholder `infinite` BADE i kommentaren som forklarer hvorfor spinneren
    // ble gatet (~477) og i selve regelen under (~483). Ser porten begge,
    // leser den sin egen dokumentasjon som gjeld. Ser den ingen, er skopet
    // kuttet. Testen hardkoder ingen tall — den sammenligner RA mot MASKERT,
    // sa den overlever at filen far ny kode.
    const fil = 'src/components/hjem/hjem-monter.css';
    const raa = [...RAA.get(fil)!.matchAll(EVIGHET)].length;
    const maskert = [...MASKERT.get(fil)!.matchAll(EVIGHET)].length;
    const hjem = ALLE_TREFF.filter((t) => t.fil === fil);
    expect(raa, `${fil}: fant ikke ordet i det hele tatt — er filen flyttet?`).toBeGreaterThan(0);
    expect(
      raa,
      `${fil} har ${raa} forekomster ra og ${maskert} maskert — kommentaren over .hjm-s-marker ble IKKE strippet. Det er nøyaktig fella som kuttet doktrine-lintens skop i dag.`,
    ).toBeGreaterThan(maskert);
    expect(hjem.map(pek), 'detektoren skal se alle maskerte forekomster, verken flere eller ferre').toHaveLength(maskert);
    expect(
      hjem.map((t) => t.navn),
      'kodeforekomsten (.hjm-s-marker sin hjm-spin) skal overleve maskeringen',
    ).toContain('hjm-spin');

    // To filer der ordet KUN finnes i kommentar. Rateksten har det; treffet
    // skal ikke ha det.
    for (const kommentarfil of [
      'src/components/hjem/ScanOverlay.tsx',
      'src/components/hjem/scan-orchestration.ts',
    ]) {
      expect(RAA.get(kommentarfil), `${kommentarfil} mangler fra skopet`).toContain('infinite');
      expect(
        ALLE_TREFF.filter((t) => t.fil === kommentarfil).map(pek),
        `${kommentarfil} har ordet KUN i kommentar — et treff her betyr at kommentarmaskeringen er av`,
      ).toEqual([]);
    }
  });

  it('A11Y-MASKEN traff faktisk noe — ellers er tilstandsstopp-kravet vakuost', () => {
    // Uten denne kan `maskerReduksjonsblokker` slutte a virke (endret
    // formatering, ny nesting) uten at noe merker det, og da blir
    // `tilstandsstopp` oppfylt av den samme a11y-fallbacken som `stopp`.
    const fil = 'src/components/hjem/hjem-monter.css';
    const med = MASKERT.get(fil)!;
    const uten = UTEN_A11Y.get(fil)!;
    expect(uten, 'a11y-masken skal ikke flytte linjenumre').toHaveLength(med.length);
    expect(
      med.includes('.hjm-s-marker { animation: none !important;'),
      `${fil}: a11y-fallbacken er borte fra kilden — fella som skal maskeres finnes ikke lenger`,
    ).toBe(true);
    expect(
      uten.includes('.hjm-s-marker { animation: none !important;'),
      `${fil}: prefers-reduced-motion-blokken ble IKKE maskert bort. Da kan et unntak oppfylle tilstandsstopp med en a11y-fallback, som er nettopp det alle fire unntak gjorde 2026-08-04.`,
    ).toBe(false);
  });

  it('hvert HARDE_FUNN er gjenfunnet — det DoD navngir kan ikke gli ut av synsfeltet', () => {
    const savnet = HARDE_FUNN.filter(
      (h) => !BRUDD.some((t) => t.fil === h.fil && t.navn === h.navn),
    );
    expect(
      savnet.map((h) => `${h.fil} · ${h.navn} · ${h.hjemmel}`),
      'Porten finner ikke lenger et funn den er palagt a felle. Er det RETTET: slett linjen fra HARDE_FUNN og fra BASELINE_REGISTER i SAMME endring. Er det ikke rettet, har skopet eller detektoren rotet.',
    ).toEqual([]);
    // Harde funn telles i gulvet (se HARDE_FUNN_ER_TELT_I_GULVET): da ma de
    // ogsa sta i registeret, ellers er totalen for lav.
    if (HARDE_FUNN_ER_TELT_I_GULVET) {
      const uten = HARDE_FUNN.filter(
        (h) => !BASELINE_REGISTER.some((b) => b.fil === h.fil && b.navn === h.navn && b.hardtFunn),
      );
      expect(
        uten.map((h) => `${h.fil} · ${h.navn}`),
        'Et hardt funn telles i gulvet, men star ikke i BASELINE_REGISTER med hardtFunn: true. Da lyver gulvet om hva det inneholder — det var akkurat den pastanden som stod i forrige utgave («utenfor gulvet» om et brudd som var nr. 7 av 7).',
      ).toEqual([]);
    }
  });

  it('rapport: filer skannet, mal funnet, assertions', () => {
    const css = FILER.filter((f) => f.endsWith('.css')).length;
    const linjer = [
      '',
      `  evighetsregelen — filer skannet: ${FILER.length} (${css} css, ${FILER.length - css} ts/tsx)`,
      `  mal funnet (4 idiomer):       ${ALLE_TREFF.length}`,
      `  unntatt (tilstandsgatet):     ${UNNTATTE.length} / lovet ${UNNTAK.reduce((s, u) => s + u.antall, 0)}  ${UNNTATTE.map((t) => t.navn).join(', ')}`,
      `  brudd (hvilebevegelse):       ${BRUDD.length} / gulv ${BASELINE_BRUDD}`,
      ...BRUDD.map((t) => `      ${pek(t)}`),
      `  harde funn (aldri baselines): ${HARDE_FUNN.length}  ${HARDE_FUNN.map((h) => h.navn).join(', ')} (telt i gulvet: ${HARDE_FUNN_ER_TELT_I_GULVET})`,
      '',
    ];
    console.log(linjer.join('\n'));
    expect(ALLE_TREFF.length).toBe(UNNTATTE.length + BRUDD.length);
  });
});

describe('unntakslista beviser seg selv i kilden', () => {
  it('KARDINALITETSLAS: unntakslista dekker EKSAKT sa mange regler som den lover', () => {
    // Angrepet 2026-08-04: rapporten skrev «unntatt: 5» mot FIRE oppforinger,
    // og ingenting reagerte. En oppforing som dekker to regler er en blank
    // sjekk pa den andre.
    const lovet = UNNTAK.reduce((s, u) => s + u.antall, 0);
    expect(
      UNNTATTE.length,
      [
        `${UNNTATTE.length} treff er fritatt, men unntakslista lover ${lovet}.`,
        'En oppforing kan ikke dekke flere regler enn `antall` sier. Er det en ny lovlig,',
        'tilstandsgatet bevegelse: gi den sin EGEN oppforing med eget eierSelektor og eget bevis.',
        '',
        'Fritatt na:',
        ...UNNTATTE.map((t) => `  ${pek(t)}`),
      ].join('\n'),
    ).toBe(lovet);
  });

  it.each(UNNTAK.map((u) => [`${u.navn} (${u.fil})`, u] as const))(
    '%s finnes fortsatt, i EKSAKT det antallet registeret lover',
    (_navn, u) => {
      const treff = ALLE_TREFF.filter((t) => t.fil === u.fil && t.navn === u.navn);
      expect(
        treff.length,
        `Unntaket ${u.navn} finnes ikke lenger i ${u.fil}. Er bevegelsen ryddet bort: slett oppforingen fra UNNTAK i samme endring, sa lista viser den ekte restmengden.`,
      ).toBeGreaterThan(0);
      const fritatt = treff.filter(erUnntatt);
      expect(
        fritatt.map(pek),
        `Unntaket ${u.navn} (${u.fil}) fritar ${fritatt.length} regler, men er registrert for ${u.antall}. Hver regel skal ha sitt eget bevis.`,
      ).toHaveLength(u.antall);
    },
  );

  it.each(UNNTAK.map((u) => [`${u.navn} (${u.fil})`, u] as const))(
    '%s har en gate som KAN feile — ikke animasjonens egen eierklasse',
    (_navn, u) => {
      // baSkeletonShimmer hadde gateSelektor `.ba-skeleton-shimmer`, som ER
      // regelens egen selektor. En slik «gate» kan ikke feile uten at regelen
      // forsvinner, sa den asserterer ingenting.
      expect(
        u.eierSelektor,
        `${u.navn}: gaten «${u.gateSelektor}» star ikke i eierselektoren «${u.eierSelektor}».`,
      ).toContain(u.gateSelektor);
      expect(
        u.eierSelektor,
        `${u.navn}: gaten er HELE eierselektoren. Da er «gaten» bare animasjonens egen klasse, og sjekken kan ikke feile uten at regelen forsvinner — det er en tautologi, ikke et bevis.`,
      ).not.toBe(u.gateSelektor);
    },
  );

  it.each(UNNTAK.map((u) => [`${u.navn} (${u.fil})`, u] as const))(
    '%s er GATET pa en tilstand — beviset star i koden, ikke i en kommentar',
    (_navn, u) => {
      const maskert = MASKERT.get(u.fil);
      expect(maskert, `${u.fil} er ikke i skopet`).toBeDefined();
      const treff = ALLE_TREFF.filter((t) => t.fil === u.fil && t.navn === u.navn);
      for (const t of treff.filter(erUnntatt)) {
        expect(
          t.selektor,
          `${pek(t)}\n  Unntaket krever EKSAKT eierselektoren «${u.eierSelektor}».`,
        ).toBe(u.eierSelektor);
      }
      expect(
        maskert!.includes(u.gateKilde),
        `${u.fil}: fant ikke gate-beviset «${u.gateKilde}». Unntaket er da udokumentert.`,
      ).toBe(true);
      expect(
        maskert!.includes(u.stopp),
        `${u.fil}: fant ikke av-bryteren «${u.stopp}». Et unntak uten stopp er ikke tilstandsgatet arbeid — det er evighetsbevegelse med en god historie.`,
      ).toBe(true);
    },
  );

  it.each(UNNTAK.map((u) => [`${u.navn} (${u.fil})`, u] as const))(
    '%s stopper fordi ARBEIDET er ferdig — ikke fordi OS-et ba om ro',
    (_navn, u) => {
      const utenA11y = UTEN_A11Y.get(u.tilstandsstopp.fil);
      expect(utenA11y, `${u.tilstandsstopp.fil} er ikke i skopet`).toBeDefined();
      expect(
        u.tilstandsstopp.tekst,
        `${u.navn}: tilstandsstopp er ordrett den samme strengen som stopp. Da er det ett bevis som teller to ganger.`,
      ).not.toBe(u.stopp);
      expect(
        utenA11y!.includes(u.tilstandsstopp.tekst),
        [
          `${u.tilstandsstopp.fil}: fant ikke tilstandsstoppen «${u.tilstandsstopp.tekst}»`,
          'UTENFOR enhver prefers-reduced-motion-blokk.',
          '',
          'Alle fire unntak oppfylte 2026-08-04 `stopp` med en a11y-fallback (hjem-monter.css:490,',
          'vertical-gauge.css:257, PaakledningScreen.tsx:1031, Skeleton.tsx:72). At bevegelsen slutter',
          'nar brukeren har skrudd av animasjoner i OS-et beviser ingenting om at den slutter nar',
          'arbeidet er ferdig. Aksen er tilstandsgatet arbeid mot hvilebevegelse — beviset ma ligge',
          'pa den aksen.',
        ].join('\n'),
      ).toBe(true);
    },
  );
});

describe('EVIGHETSREGELEN — evighetsbevegelse utenfor unntakslista', () => {
  it(`antall evighetsbevegelser i hvile vokser ikke (gulv ${BASELINE_BRUDD})`, () => {
    const mistenkte = BRUDD.filter((t) => !KJENTE_BRUDDFILER.includes(t.fil));
    expect(
      BRUDD.length,
      [
        `${BRUDD.length} evighetsbevegelser i hvile; gulvet er ${BASELINE_BRUDD}.`,
        'Ny evighetsbevegelse uten dokumentert tilstandsgate. En animasjon som aldri slutter er ikke',
        'bevegelse, den er stoy — og den er usynlig for bevegelsesdetektoren, som bare ser varigheter',
        'og kurver: i «animation: hjm-spin 1s linear infinite» plukker den kun «1s», og tokeniserer du',
        'varigheten, forsvinner treffet helt.',
        '',
        'Enten: gate den pa en tilstand som TAR SLUTT, og for den inn i UNNTAK med',
        'eierSelektor/gateSelektor/antall/gateKilde/stopp/tilstandsstopp.',
        'Eller: gi den et endelig antall iterasjoner.',
        '',
        'Alle brudd na:',
        ...BRUDD.map((t, k) => `  ${k + 1}. ${pek(t)}`),
        ...(mistenkte.length > 0
          ? ['', 'Utenfor de kjente bruddfilene (altsa nye):', ...mistenkte.map((t) => `  → ${pek(t)}`)]
          : []),
      ].join('\n'),
    ).toBeLessThanOrEqual(BASELINE_BRUDD);
  });

  it('ingen NY identitet — gulvet pinner hva bruddene ER, ikke bare hvor mange', () => {
    // Forrige utgave pinnet kun et tall. Da kunne man bytte ut et brudd inne i
    // en kjent bruddfil mot et helt annet og sta gront.
    const kjent = new Set(BASELINE_REGISTER.map((b) => `${b.fil} · ${b.navn}`));
    const nye = [...new Set(BRUDD.map(identitet))].filter((k) => !kjent.has(k)).sort();
    expect(
      nye,
      [
        'Evighetsbevegelse med en identitet (fil · navn) som ikke stod i BASELINE_REGISTER 2026-08-04.',
        'Totalen kan sta stille mens innholdet byttes ut — derfor pinnes identiteten.',
        '',
        ...BRUDD.filter((t) => !kjent.has(identitet(t))).map((t) => `  → ${pek(t)}`),
      ].join('\n'),
    ).toEqual([]);
  });

  it.each(BASELINE_REGISTER.map((b) => [`${b.navn} (${b.fil})`, b] as const))(
    '%s star fortsatt der registeret sier — og har ikke vokst',
    (_navn, b) => {
      const treff = BRUDD.filter((t) => t.fil === b.fil && t.navn === b.navn);
      expect(
        treff.length,
        `BASELINE_REGISTER forer ${b.navn} i ${b.fil}, men porten finner den ikke. Er den RETTET: slett linjen herfra (og fra HARDE_FUNN / KJENTE_BRUDDFILER hvis den var siste) i SAMME endring. Et gulv som forer et brudd som ikke finnes, lyver.`,
      ).toBeGreaterThan(0);
      expect(
        treff.map(pek),
        `${b.navn} i ${b.fil} har vokst fra ${b.antall} til ${treff.length}. Gulvet kan bare krympe.`,
      ).toHaveLength(Math.min(treff.length, b.antall));
    },
  );

  it('ingen NY fil far evighetsbevegelse — bruddene bor der de alltid har bodd', () => {
    // Ratsjett pa BREDDE, ikke bare antall: bytter noen ut to brudd i én fil
    // med to i en ny, star tallet stille mens sykdommen sprer seg.
    const nye = [...new Set(BRUDD.map((t) => t.fil))].filter((f) => !KJENTE_BRUDDFILER.includes(f));
    expect(
      nye,
      'Evighetsbevegelse i en fil som ikke hadde den 2026-08-04. Gulvet fanger antall, ikke spredning.',
    ).toEqual([]);
  });

  it('KJENTE_BRUDDFILER er en RATSJ, ikke en tillatelsesliste', () => {
    // Uten denne kan lista bare bli foreldet i permissiv retning: rettes
    // WeatherLottie, beholder filen staende tillatelse til a fa ny
    // evighetsbevegelse mens gulvet star stille. Samme behandling som UNNTAK,
    // HARDE_FUNN og BASELINE_REGISTER alt far.
    const bruddfiler = new Set(BRUDD.map((t) => t.fil));
    const rene = KJENTE_BRUDDFILER.filter((f) => !bruddfiler.has(f));
    expect(
      rene,
      'Disse filene star i KJENTE_BRUDDFILER, men har ingen brudd lenger. Bra — slett linjene i SAMME endring. Star de igjen, har filene staende tillatelse til a fa ny evighetsbevegelse uten at gulvet reagerer.',
    ).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────
   7. DETEKTORENS EGEN SELVTEST
   En detektor uten egen test er prosa. Disse sier presist hva den ser og hva
   den ikke ser, uten a rore en eneste ekte fil.
   ──────────────────────────────────────────────────────────────────────── */

describe('detektoren selv — den ser det den lover a se', () => {
  const finn = (kilde: string) => finnAlt(maskerKommentarer(kilde), 'syntetisk');

  it('fanger en ugatet CSS-regel, med selektor og navn', () => {
    const t = finn('.orb { animation: puls 1.8s ease-in-out infinite; }');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kilde: 'css-regel', selektor: '.orb', navn: 'puls', linje: 1 });
  });

  it('fanger inline CSSProperties — bade quotert og template-interpolert', () => {
    expect(finn("const s = { animation: 'baRainFall 1.3s linear infinite' };")[0]).toMatchObject({
      kilde: 'inline',
      navn: 'baRainFall',
    });
    // Den template-interpolerte er usynlig for ethvert literal-grep pa
    // varighet — men ordet `infinite` star der.
    const tpl = finn('const s = { animation: `atm-snow-fall ${p.d}s linear ${p.x}s infinite` };');
    expect(tpl).toHaveLength(1);
    expect(tpl[0]).toMatchObject({ kilde: 'inline', navn: 'atm-snow-fall' });
  });

  it('fanger WAAPI — `node.animate(..., { iterations: Infinity })`', () => {
    // Repoets EGET idiom (VerticalGauge.tsx:191 bruker node.animate alt).
    // Uten dette maler porten et ord og ikke et fenomen.
    const t = finn('node.animate([{ opacity: 0 }], { duration: 2400, iterations: Infinity });');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kilde: 'waapi', navn: 'iterations: Infinity' });
    expect(finn('node.animate(f, { iterations: Number.POSITIVE_INFINITY });')).toHaveLength(1);
    expect(finn('node.animate(f, { iterations: 3 });')).toEqual([]);
  });

  it('fanger motion/GSAP — `repeat: Infinity` og `repeat: -1`', () => {
    // `motion` ligger i dependencies; idiomet er repeat: Infinity.
    expect(finn('<motion.div transition={{ repeat: Infinity }} />')[0]).toMatchObject({
      kilde: 'motion',
      navn: 'repeat: evig',
    });
    expect(finn('gsap.to(el, { repeat: -1 });')).toHaveLength(1);
    expect(finn('gsap.to(el, { repeat: 2 });')).toEqual([]);
    expect(finn('gsap.to(el, { repeat: -10 });')).toEqual([]);
    // Falsk venn: CSS-egenskapen som slutter pa «repeat».
    expect(finn('.a { background-repeat: no-repeat; }')).toEqual([]);
  });

  it('fanger `loop` pa en spiller — den looper uten a inneholde ordet `infinite`', () => {
    // Ekte tilfelle: WeatherLottie.tsx:134-140.
    const t = finn('<DotLottieReact src={URLS[c]} autoplay loop style={s} refCb={set} />');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kilde: 'spiller', navn: '<DotLottieReact loop>' });
    expect(finn('<video src={v} autoPlay muted loop />')[0]).toMatchObject({
      navn: '<video loop>',
    });
    // Et endelig klipp er ikke evighetsbevegelse.
    expect(finn('<video src={v} autoPlay muted onEnded={ferdig} />')).toEqual([]);
    expect(finn('<DotLottieReact src={u} loop={false} />')).toEqual([]);
    // Ordet utenfor en tagg er ikke et attributt.
    expect(finn('for (const loop of loops) { void loop; }')).toEqual([]);
  });

  it('leser gaten ut av selektoren, ikke ut av filen', () => {
    const t = finn(
      ".a { color: red; }\n.s-marker[data-animate='true'][data-done='false'] { animation: spin 1s linear infinite; }",
    );
    expect(t).toHaveLength(1);
    expect(t[0]!.selektor).toBe(".s-marker[data-animate='true'][data-done='false']");
    expect(t[0]!.linje).toBe(2);
  });

  it('EKSAKT eierselektor: en BEM-utvidelse arver ikke fritaket', () => {
    // Dette er rommingen som felte forrige utgave. `.ba-skeleton-shimmer` er
    // en DELSTRENG av `.ba-skeleton-shimmer-brandglow`, og med `includes`
    // arvet den nye, helt ugatede regelen fritaket gratis.
    const utvidet = finn('.ba-skeleton-shimmer-brandglow { animation: baSkeletonShimmer 6s linear infinite; }');
    expect(utvidet).toHaveLength(1);
    expect(utvidet[0]!.selektor).toBe('.ba-skeleton-shimmer-brandglow');
    expect(
      utvidet[0]!.selektor.includes('.ba-skeleton-shimmer'),
      'delstreng-testen ville sagt JA her — derfor kreves eksakt likhet',
    ).toBe(true);
    expect(utvidet[0]!.selektor).not.toBe('.ba-skeleton-shimmer');
  });

  it('leser CSS i en <style>-template-literal som CSS, ikke som streng', () => {
    const t = finn('<style>{`\n  .neck-orb { animation: neck-orb-pulse 1.8s ease-in-out infinite; }\n`}</style>');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kilde: 'css-regel', selektor: '.neck-orb', navn: 'neck-orb-pulse' });
  });

  it('KOMMENTARFELLA: ser bort fra ordet i blokk-, linje- og CSS-i-template-kommentar', () => {
    expect(finn('/* spinneren snurret infinite gjennom hele holdet */')).toEqual([]);
    expect(finn('// TODO: infinite er forbudt her')).toEqual([]);
    expect(finn('{/* Spinneren snurret `infinite` gjennom hele holdet */}')).toEqual([]);
    expect(finn('<style>{`/* infinite var her */ .a { color: red; }`}</style>')).toEqual([]);
    // Ogsa de nye idiomene ma respektere masken.
    expect(finn('// node.animate(f, { iterations: Infinity })')).toEqual([]);
    expect(finn('/* <DotLottieReact loop /> var her */')).toEqual([]);
  });

  it('maskeringen flytter ingen linjenumre — feilmeldingen ma kunne peke pa fil:linje', () => {
    const kilde = '/* linje 1\n   linje 2\n   linje 3 */\n.orb { animation: puls 1s linear infinite; }';
    expect(finn(kilde)[0]!.linje).toBe(4);
    expect(maskerKommentarer(kilde)).toHaveLength(kilde.length);
  });

  it('en apostrof i prosa spiser ikke resten av filen', () => {
    // Uten strengsporing ville `//` i en URL kuttet linjen, og uten
    // kommentarsporing ville en apostrof i en kommentar kuttet filen.
    const kilde = "// se https://example.com/x\n/* it's a trap */\n.orb { animation: puls 1s linear infinite; }";
    expect(finn(kilde)).toHaveLength(1);
  });

  it('forveksler ikke `infinite` inne i et ord med iterasjonstellingen', () => {
    expect(finn('const x = Number.POSITIVE_INFINITY;')).toEqual([]);
    expect(finn('function isInfinitely() {}')).toEqual([]);
    expect(finn('.a { animation: infinite-scroll-hint 1s linear 3; }')).toEqual([]);
  });

  it('slipper gjennom et endelig antall iterasjoner — det er hele poenget', () => {
    expect(finn('.a { animation: puls var(--dw-m-state) var(--dw-ease) 3; }')).toEqual([]);
    expect(finn('.a { animation: puls 1s linear 1 forwards; }')).toEqual([]);
  });
});

describe('a11y-masken selv — den fjerner OS-hensynet, ikke tilstandsbeviset', () => {
  it('blanker hele prefers-reduced-motion-blokken, klammebalansert', () => {
    const kilde = [
      ".m[data-done='true'] { animation: none; }",
      '@media (prefers-reduced-motion: reduce) {',
      '  .m { animation: none !important; }',
      '}',
      '.etter { color: red; }',
    ].join('\n');
    const ut = maskerReduksjonsblokker(kilde);
    expect(ut, 'masken skal ikke flytte linjenumre').toHaveLength(kilde.length);
    expect(ut).toContain(".m[data-done='true'] { animation: none; }");
    expect(ut).toContain('.etter { color: red; }');
    expect(ut).not.toContain('!important');
  });

  it('tar ogsa no-preference — begge er OS-aksen, ikke arbeidsaksen', () => {
    const ut = maskerReduksjonsblokker('@media (prefers-reduced-motion: no-preference) { .a { animation: x 1s; } }');
    expect(ut.trim()).toBe('');
  });

  it('rorer ikke andre media-blokker', () => {
    const kilde = '@media (min-width: 600px) { .a { animation: none; } }';
    expect(maskerReduksjonsblokker(kilde)).toBe(kilde);
  });
});
