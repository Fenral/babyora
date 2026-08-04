/**
 * KONTRASTMATRISEN — WCAG regnet av tokenverdiene, ikke av skjermbilder.
 *
 * Bakgrunn: appen har hatt PUNKTmålinger av kontrast, aldri en matrise.
 * `design-tokens-v2.focus.test.ts` måler fokusringen mot sju flater;
 * `design-tokens-v2.accent-300-forbud.test.ts` måler ett token. Alt annet —
 * hele semantikkfamilien, panel-tekstrampen, den valgte flaten — har aldri
 * vært målt av noe. Følgen står i tokenfilens egne kommentarer: `--dw-success`
 * påstår «8.9:1» (som gjelder mørkt lerret), mens den i LYS modus lander på
 * 1,73:1 mot `--dw-w-snow`. Tallet i kommentaren var aldri feil; det var bare
 * ikke måling av alle parene tokenet faktisk brukes i.
 *
 * DoD fase 2: «Kontrastmatrisen sjekkes inn som CI-TEST med baseline …
 * Regner WCAG av tokenverdiene etter fokus-testens mønster. Verifiser: feller
 * de kjente 1,78–2,88:1-parene.» Fase 5 peker tilbake hit for gauge-kontrasten
 * og for opacity-demoteringen. Matrisen er altså det DELTE måleinstrumentet.
 *
 * ── HVORFOR EN DEKLARERT PARTABELL, IKKE UTLEDNING FRA CSS ────────────────
 * Å utlede par av «color + background i samme CSS-regel» er prøvd og gir NULL
 * realiserte par: panelets flate settes i `.hjm-panel[data-nuance='x']` mens
 * teksten settes i `.hjm-panel`. En port bygget slik ville meldt grønt på
 * tomhet — feilklasse nr. 2 i lærdomstabellen. Matrisen er derfor DEKLARERT
 * (tekstfamilie × flatefamilie), akkurat som fokus-testens
 * PAPER_SURFACES/PETROL_SURFACES, og hentet ut av tokenfilens eget
 * fargeeierskap: espresso er rommet, petrol er instrumentet, amber er
 * handlingen, ullkrem er typografien, semantikk er unntaket.
 *
 * ── IKKE-VAKUØSITET ──────────────────────────────────────────────────────
 * «Er skopet stort nok» duger ikke — det ble prøvd i dag og godtok en
 * kommentarblokk. Denne porten beviser at den fant MÅLENE SINE:
 *   1. hvert tokennavn i matrisen er faktisk DEKLARERT i kilden (ikke løst
 *      via en var()-fallback, ikke stilltiende hoppet over);
 *   2. antall målte par er NØYAKTIG lik den deklarerte kardinaliteten —
 *      krymper en familie, går porten rød i stedet for å måle færre par;
 *   3. lys-tabellen flipper GENUINT mot mørk, ellers måles mørk to ganger;
 *   4. hvert par i feilregisteret er fortsatt MÅLT. Forsvinner et kjent brudd
 *      ved at noen krymper skopet, er det rødt — ikke grønt.
 *
 * KOMMENTARFELLEN, konkret: `design-tokens-v2.css` inneholder ordet `@media`
 * FEM ganger, men bare ÉN av dem er en at-regel — de fire andre står i filens
 * egen prosa. `:root` står ÅTTE ganger, hvorav fem i kommentarer.
 * `data-theme` står ELLEVE ganger, ni i kommentarer. Derfor strippes
 * kommentarer FØR blokkene finnes, og porten asserterer at strippingen
 * faktisk fjernet noe.
 *
 * ── BASELINE ─────────────────────────────────────────────────────────────
 * Porten fødes med dagens 29 brudd som gulv og feiler kun ved ØKNING. Men et
 * rent tall kan gås rundt: fiks ett par, ødelegg et annet, og summen står.
 * Registeret under er derfor et FROSSET SETT med målte verdier, og ratsjen
 * går tre veier (se BASELINE-konstanten). Sol-blokker: «en måling ratsjeteres
 * ikke — det var slik dybdekontrakten kunne stå «låst» med feil fortegn.»
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const KILDE = join(process.cwd(), 'src/styles/design-tokens-v2.css');
const RAA = readFileSync(KILDE, 'utf8').replace(/\r\n/g, '\n');

/* ── CSS-parsing: kommentarene FØRST, alltid ───────────────────────────── */

function utenKommentarer(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Hele kilden uten prosa. Alt under leses herfra, aldri fra RAA. */
const CSS = utenKommentarer(RAA);

/** Kroppen til blokken som åpner med `apner`, ved balanserte klammer. */
function blokk(css: string, apner: string): string {
  const start = css.indexOf(apner);
  if (start < 0) throw new Error(`fant ikke blokken «${apner}»`);
  let dybde = 0;
  for (let i = start + apner.length - 1; i < css.length; i += 1) {
    if (css[i] === '{') dybde += 1;
    else if (css[i] === '}') {
      dybde -= 1;
      if (dybde === 0) return css.slice(start, i);
    }
  }
  throw new Error(`blokken «${apner}» ble aldri lukket`);
}

function deklarasjoner(tekst: string): Map<string, string> {
  const ut = new Map<string, string>();
  for (const m of tekst.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) ut.set(m[1]!, m[2]!.trim());
  return ut;
}

const MORK = deklarasjoner(blokk(CSS, ':root {'));
const AUTO_LYS = deklarasjoner(
  blokk(blokk(CSS, '@media (prefers-color-scheme: light) {'), ':root:not([data-theme="dark"]) {'),
);
const VALGT_LYS = deklarasjoner(blokk(CSS, ':root[data-theme="light"] {'));

type Tema = 'mork' | 'lys';

/** Full tokentabell per tema — mørk `:root` som base, lys-blokken lagt oppå. */
function tabell(tema: Tema, lysKilde: Map<string, string> = VALGT_LYS): Map<string, string> {
  const t = new Map(MORK);
  if (tema === 'lys') for (const [k, v] of lysKilde) t.set(k, v);
  return t;
}

/**
 * Løser et tokennavn til hex. Kaster hvis navnet ikke er DEKLARERT — en
 * stilltiende fallback er nettopp måten et par kan forsvinne ut av matrisen
 * uten at noen merker det.
 */
function hex(navn: string, t: Map<string, string>): string {
  let verdi = t.get(navn);
  if (verdi === undefined) throw new Error(`${navn} er ikke deklarert i kilden`);
  for (let dybde = 0; dybde < 8; dybde += 1) {
    if (/^#[0-9a-fA-F]{6}$/.test(verdi)) return verdi.toLowerCase();
    const referanse = /^var\(\s*(--[\w-]+)\s*\)$/.exec(verdi);
    if (!referanse) break;
    const neste = t.get(referanse[1]!);
    if (neste === undefined) throw new Error(`${navn} → ${referanse[1]} er ikke deklarert`);
    verdi = neste;
  }
  throw new Error(`${navn} løste til «${verdi}», ikke en 6-sifret hex`);
}

/* ── WCAG 2.1 relativ luminans og kontrast ─────────────────────────────── */

function luminans(h: string): number {
  const kanal = (raa: number): number => {
    const c = raa / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * kanal(Number.parseInt(h.slice(1, 3), 16))
    + 0.7152 * kanal(Number.parseInt(h.slice(3, 5), 16))
    + 0.0722 * kanal(Number.parseInt(h.slice(5, 7), 16))
  );
}

function kontrast(a: string, b: string): number {
  const la = luminans(a);
  const lb = luminans(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** SC 1.4.3 Contrast (Minimum) — brødtekst og småtekst. */
const WCAG_TEKST = 4.5;
/** SC 1.4.11 Non-text Contrast — fokusringen er en grafisk komponent. */
const WCAG_IKKE_TEKST = 3;

/* ── FAMILIENE (tokenfilens eget fargeeierskap) ────────────────────────── */

/** Espresso-siden: rommet. Flipper med temaet. */
const PAPIRFLATER = [
  '--dw-canvas',
  '--dw-canvas-glow',
  '--dw-raised',
  '--dw-plate',
  '--dw-interactive',
  '--dw-overlay',
] as const;

/** Petrol-instrumentet med hele værfamilien. TEMA-KONSTANT. */
const PETROLFLATER = [
  '--dw-panel',
  '--dw-w-clear',
  '--dw-w-cloudy',
  '--dw-w-rain',
  '--dw-w-snow',
  '--dw-w-night',
] as const;

const ESPRESSORAMPE = ['--dw-ink-hi', '--dw-ink-mid', '--dw-ink-low'] as const;
const PANELRAMPE = ['--dw-ink-panel-hi', '--dw-ink-panel-mid', '--dw-ink-panel-muted'] as const;
const SEMANTIKK = ['--dw-success', '--dw-warning', '--dw-danger'] as const;

type Gruppe = {
  id: string;
  hvorfor: string;
  tekst: readonly string[];
  flate: readonly string[];
  krav: number;
};

/**
 * MATRISEN. Åtte grupper × to temaer = 200 målte par.
 *
 * Hver gruppe er et par doktrinen faktisk KREVER — ikke det kartesiske
 * produktet av alle tokens. Kryssene doktrinen forbyr (espresso-rampen på
 * petrol, `--dw-accent-300` som tekst) hører hjemme i egne porter; blandes de
 * inn her, drukner de ekte kravene i par ingen har tenkt å tegne.
 */
const MATRISE: readonly Gruppe[] = [
  {
    id: 'espresso-paa-papir',
    hvorfor: 'ullkrem-rampen på espresso-flatene — appens brødtekst',
    tekst: ESPRESSORAMPE,
    flate: PAPIRFLATER,
    krav: WCAG_TEKST,
  },
  {
    id: 'panelrampe-paa-petrol',
    hvorfor: 'instrument-tekstrampen på det tema-konstante panelet, hele værfamilien',
    tekst: PANELRAMPE,
    flate: PETROLFLATER,
    krav: WCAG_TEKST,
  },
  {
    id: 'semantikk-paa-papir',
    hvorfor: 'feil/varsel/bekreftelse der de oftest står — på espresso-siden',
    tekst: SEMANTIKK,
    flate: PAPIRFLATER,
    krav: WCAG_TEKST,
  },
  {
    id: 'semantikk-paa-petrol',
    hvorfor: 'instrumentet bærer de dårlige nyhetene: stale, offline, feilet henting',
    tekst: SEMANTIKK,
    flate: PETROLFLATER,
    krav: WCAG_TEKST,
  },
  {
    id: 'aksenttekst-paa-papir',
    hvorfor: '--dw-accent som lenke-/handlingstekst (--dw-accent-300 er forbudt som tekst)',
    tekst: ['--dw-accent'],
    flate: PAPIRFLATER,
    krav: WCAG_TEKST,
  },
  {
    id: 'ink-paa-amber',
    hvorfor: 'etiketten inne i den fylte CTA-en, hvile og trykket',
    tekst: ['--dw-ink-on-accent'],
    flate: ['--dw-accent', '--dw-accent-pressed'],
    krav: WCAG_TEKST,
  },
  {
    id: 'valgt-flate',
    hvorfor: 'alt som kan stå på --dw-accent-surface: tekst, aksent og status',
    tekst: [...ESPRESSORAMPE, '--dw-accent', ...SEMANTIKK],
    flate: ['--dw-accent-surface'],
    krav: WCAG_TEKST,
  },
  {
    id: 'fokusring',
    hvorfor: 'SC 1.4.11 — begge ringene mot hver flate de kan tegnes på',
    tekst: ['--dw-focus'],
    flate: [...PAPIRFLATER, '--dw-accent-surface'],
    krav: WCAG_IKKE_TEKST,
  },
  {
    id: 'fokusring',
    hvorfor: 'instrumentets egen ring mot panelet og hver værnyanse',
    tekst: ['--dw-focus-panel'],
    flate: PETROLFLATER,
    krav: WCAG_IKKE_TEKST,
  },
];

/** Deklarert kardinalitet PER TEMA — brukes som ikke-vakuøsitets-fasit. */
const PAR_PER_TEMA = MATRISE.reduce((sum, g) => sum + g.tekst.length * g.flate.length, 0);
const TEMAER: readonly Tema[] = ['mork', 'lys'];

type Maaling = {
  tema: Tema;
  gruppe: string;
  tekst: string;
  flate: string;
  tekstHex: string;
  flateHex: string;
  verdi: number;
  krav: number;
};

/**
 * Måler hele matrisen. Et par som ikke lar seg løse KASTER IKKE — det føres i
 * `uloste` og hoppes over. Det er med vilje: kastet ville drept hele filen ved
 * import, og porten hadde meldt «collection error» i stedet for å si HVILKET
 * mål som forsvant. Tre uavhengige forutsetninger under fanger da samme
 * krymping og navngir den: deklarasjons-testen, kardinalitets-testen og
 * anti-krymp-testen mot registeret.
 */
function maalMatrisen(lysKilde: Map<string, string> = VALGT_LYS): {
  maalinger: Maaling[];
  uloste: string[];
} {
  const maalinger: Maaling[] = [];
  const uloste: string[] = [];
  for (const tema of TEMAER) {
    const t = tabell(tema, lysKilde);
    for (const g of MATRISE) {
      for (const tekst of g.tekst) {
        for (const flate of g.flate) {
          let tekstHex: string;
          let flateHex: string;
          try {
            tekstHex = hex(tekst, t);
            flateHex = hex(flate, t);
          } catch (e) {
            uloste.push(`${tema} [${g.id}] ${tekst} på ${flate}: ${(e as Error).message}`);
            continue;
          }
          maalinger.push({
            tema,
            gruppe: g.id,
            tekst,
            flate,
            tekstHex,
            flateHex,
            verdi: kontrast(tekstHex, flateHex),
            krav: g.krav,
          });
        }
      }
    }
  }
  return { maalinger, uloste };
}

const { maalinger: MAALINGER, uloste: ULOSTE } = maalMatrisen();
const noekkel = (m: { tema: Tema; tekst: string; flate: string }): string =>
  `${m.tema}|${m.tekst}|${m.flate}`;

/* ── BASELINE ──────────────────────────────────────────────────────────── */

/**
 * DAGENS GULV: 29 brudd (5 i mørk, 24 i lys) av 200 målte par, målt
 * 2026-08-04. Tallet kan BARE KRYMPE. Fase 3 ratsjer det til null, og null
 * blir deretter nytt låst gulv (DoD fase 3, siste punkt). Hever noen dette
 * tallet, er det ikke en oppdatering — det er en regresjon som ble skrevet
 * inn i porten i stedet for rettet.
 *
 * Ratsjen går TRE veier, fordi et rent antall kan gås rundt ved å fikse ett
 * par og ødelegge et annet:
 *   1. et par som ikke står i REGISTERET og feiler → RØDT (nytt brudd);
 *   2. et registrert par som har blitt VERRE enn den målte verdien → RØDT;
 *   3. et registrert par som ikke lenger MÅLES → RØDT (skopet krympet).
 * Et registrert par som blir BEDRE eller forsvinner over kravet er grønt —
 * det er ratsjen som går riktig vei, og porten skriver ut hvilke.
 */
const BASELINE = 29;

/**
 * EIERRAPPORTERTE FUNN kan ALDRI baselines — de telles utenfor gulvet og går
 * rødt umiddelbart. Tom i dag, og det er et MÅLT utsagn, ikke en forglemmelse:
 * `vedtak.json` og design-notatene er gjennomgått, og ingen av eierfunnene
 * gjelder et TOKENVERDI-par i denne matrisen (de gjelder layout, bevegelse,
 * plagg-plater, dybde og fold). Kommer et eierfunn på et par, føres det her —
 * ikke i registeret under.
 */
const EIERFUNN: readonly { tema: Tema; tekst: string; flate: string; kilde: string }[] = [];

/**
 * REGISTERET over dagens 29 brudd, med MÅLT verdi. `maalt` er ikke pynt:
 * blir et par verre enn tallet her, går porten rød selv om antallet står
 * stille. Verdiene er portens egen utskrift 2026-08-04, ikke anslag.
 */
const REGISTER: readonly { tema: Tema; tekst: string; flate: string; maalt: number }[] = [
  // ── mørk (5) ──
  { tema: 'mork', tekst: '--dw-ink-panel-muted', flate: '--dw-w-clear', maalt: 4.349 },
  { tema: 'mork', tekst: '--dw-ink-panel-muted', flate: '--dw-w-snow', maalt: 4.228 },
  { tema: 'mork', tekst: '--dw-danger', flate: '--dw-w-clear', maalt: 4.412 },
  { tema: 'mork', tekst: '--dw-danger', flate: '--dw-w-snow', maalt: 4.288 },
  { tema: 'mork', tekst: '--dw-ink-low', flate: '--dw-accent-surface', maalt: 4.412 },
  // ── lys (24) ──
  // Panel-rampen er tema-konstant, så disse to er de samme parene som over.
  { tema: 'lys', tekst: '--dw-ink-panel-muted', flate: '--dw-w-clear', maalt: 4.349 },
  { tema: 'lys', tekst: '--dw-ink-panel-muted', flate: '--dw-w-snow', maalt: 4.228 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-canvas-glow', maalt: 4.497 },
  // Hele semantikkfamilien × hele værfamilien i lys — 18 par, alle under.
  // Tokenfilen påstår «≥4.5:1 mot både canvas og hevet flate (verifisert
  // maskinelt)»; det var sant, og det målte aldri petrol.
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-panel', maalt: 1.925 },
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-w-clear', maalt: 1.779 },
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-w-cloudy', maalt: 2.018 },
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-w-rain', maalt: 2.217 },
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-w-snow', maalt: 1.729 },
  { tema: 'lys', tekst: '--dw-success', flate: '--dw-w-night', maalt: 2.463 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-panel', maalt: 2.252 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-w-clear', maalt: 2.080 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-w-cloudy', maalt: 2.360 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-w-rain', maalt: 2.592 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-w-snow', maalt: 2.022 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-w-night', maalt: 2.881 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-panel', maalt: 2.065 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-w-clear', maalt: 1.907 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-w-cloudy', maalt: 2.164 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-w-rain', maalt: 2.377 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-w-snow', maalt: 1.854 },
  { tema: 'lys', tekst: '--dw-danger', flate: '--dw-w-night', maalt: 2.641 },
  { tema: 'lys', tekst: '--dw-accent', flate: '--dw-accent-surface', maalt: 4.253 },
  { tema: 'lys', tekst: '--dw-warning', flate: '--dw-accent-surface', maalt: 4.159 },
  // SC 1.4.11: den valgte flaten er ikke med i fokus-testens PAPER_SURFACES,
  // så dette paret har aldri vært målt av noen port før nå.
  { tema: 'lys', tekst: '--dw-focus', flate: '--dw-accent-surface', maalt: 2.941 },
];

/** Slingringsmonn for flyttall — ikke for regresjon. */
const EPSILON = 0.005;

const REGISTRERT = new Map(REGISTER.map((r) => [noekkel(r), r]));

/* ── FORUTSETNINGENE (ikke-vakuøsitet) ─────────────────────────────────── */

describe('kontrastmatrisen — forutsetninger for at målingen betyr noe', () => {
  it('kommentarene er strippet FØR blokkene ble funnet', () => {
    // Fellen, konkret: `@media` står 5 ganger i kilden og bare ÉN av dem er
    // en at-regel. `:root` står 8 ganger, 5 i prosa. Et søk på rå tekst ville
    // funnet en kommentar og kuttet skopet — nøyaktig slik en port i dag
    // godtok en kommentarblokk som om den var kode.
    const antall = (s: string, re: RegExp): number => [...s.matchAll(re)].length;
    expect(antall(RAA, /@media/g), 'kilden har ingen @media-lokkemat lenger — sjekk fellen på nytt')
      .toBeGreaterThan(antall(CSS, /@media/g));
    expect(antall(RAA, /:root/g), 'kilden har ingen :root i prosa lenger')
      .toBeGreaterThan(antall(CSS, /:root/g));
    // Etter strippingen skal det stå NØYAKTIG én at-regel og tre :root-blokker.
    expect(antall(CSS, /@media/g), 'flere @media-at-regler enn ventet i kilden').toBe(1);
    expect(antall(CSS, /:root\s*[{[:]/g), 'antall :root-selektorer har endret seg').toBe(3);
  });

  it('alle tre tokenblokkene ga faktiske deklarasjoner', () => {
    expect(MORK.size, 'mørk :root ga ingen deklarasjoner').toBeGreaterThan(60);
    expect(AUTO_LYS.size, '@media-lys ga ingen deklarasjoner').toBeGreaterThan(20);
    expect(VALGT_LYS.size, '[data-theme="light"] ga ingen deklarasjoner').toBeGreaterThan(20);
  });

  it('HVERT token i matrisen er faktisk DEKLARERT i kilden', () => {
    // Kjernen i ikke-vakuøsiteten: porten beviser at den fant målene sine.
    // Et token som stilltiende faller tilbake på en var()-default ville gitt
    // en måling som ser ekte ut og ikke er det.
    const navn = new Set<string>();
    for (const g of MATRISE) for (const n of [...g.tekst, ...g.flate]) navn.add(n);
    const mangler: string[] = [];
    for (const n of navn) {
      for (const tema of TEMAER) {
        try {
          hex(n, tabell(tema));
        } catch (e) {
          mangler.push(`${tema}: ${n} — ${(e as Error).message}`);
        }
      }
    }
    expect(mangler, `matrisen viser til tokens som ikke lar seg løse:\n  ${mangler.join('\n  ')}`)
      .toEqual([]);
    expect(ULOSTE, `par matrisen ikke fikk målt:\n  ${ULOSTE.join('\n  ')}`).toEqual([]);
    expect(navn.size, 'matrisen viser til for få distinkte tokens').toBeGreaterThanOrEqual(24);
  });

  it('antall målte par er NØYAKTIG den deklarerte kardinaliteten', () => {
    // Krymper en familie — én værnyanse slettet, én ink-verdi fjernet —
    // skal porten bli RØD, ikke stille måle færre par og melde grønt.
    expect(PAR_PER_TEMA, 'kardinaliteten per tema har endret seg').toBe(100);
    expect(MAALINGER.length, 'matrisen målte ikke det den lovet').toBe(PAR_PER_TEMA * TEMAER.length);
    for (const tema of TEMAER) {
      expect(MAALINGER.filter((m) => m.tema === tema).length, `${tema} mangler par`).toBe(PAR_PER_TEMA);
    }
  });

  it('lys-tabellen er GENUINT lys — papirflatene flipper mot mørk', () => {
    // Uten denne kunne en tema-tabell som stille faller tilbake til mørk
    // «bestå» hele matrisen ved å måle mørk to ganger.
    const mork = tabell('mork');
    const lys = tabell('lys');
    for (const flate of PAPIRFLATER) {
      const m = hex(flate, mork);
      const l = hex(flate, lys);
      expect(l, `${flate} er identisk i begge temaer — tabellen er ikke tema-oppløst`).not.toBe(m);
      expect(luminans(l), `${flate} ble ikke lysere i lys tema`).toBeGreaterThan(luminans(m));
    }
  });

  it('petrol-familien er reell og TEMA-KONSTANT — seks distinkte flater', () => {
    // Måler vi mot seks kopier av samme hex, sier «under kravet på alle»
    // ingenting. Og flipper panelet, er hele instrumentdoktrinen brutt et
    // annet sted enn her.
    const mork = PETROLFLATER.map((s) => hex(s, tabell('mork')));
    const lys = PETROLFLATER.map((s) => hex(s, tabell('lys')));
    expect(new Set(mork).size, 'petrol-flatene er ikke distinkte').toBe(PETROLFLATER.length);
    expect(lys, 'petrol-familien flipper med temaet — instrumentet skal være tema-konstant')
      .toEqual(mork);
  });

  it('hvert par i REGISTERET blir fortsatt MÅLT av matrisen', () => {
    // Anti-krymp: den enkleste måten å gjøre en port grønn på er å fjerne
    // det den måler. Da skal den bli rød.
    const maalte = new Set(MAALINGER.map(noekkel));
    const forsvunnet = REGISTER.filter((r) => !maalte.has(noekkel(r)))
      .map((r) => `${r.tema}: ${r.tekst} på ${r.flate}`);
    expect(
      forsvunnet,
      'registrerte brudd som ikke lenger måles — er skopet krympet?\n  ' + forsvunnet.join('\n  '),
    ).toEqual([]);
    expect(REGISTER.length, 'registeret stemmer ikke med baseline').toBe(BASELINE);
  });
});

/* ── SELVE MÅLINGEN ────────────────────────────────────────────────────── */

describe('kontrastmatrisen — WCAG regnet av tokenverdiene', () => {
  // STRENGT under kravet. Ingen slingring her: regnestykket er deterministisk,
  // og et monn ville gitt et hull der et token kunne trimmes til 4,4996:1.
  const feilende = MAALINGER.filter((m) => m.verdi < m.krav);

  it('rapporterer hva som faktisk ble målt (informativ)', () => {
    const perTema = TEMAER.map(
      (t) => `${feilende.filter((f) => f.tema === t).length} i ${t}`,
    ).join(', ');
    const verst = [...feilende].sort((a, b) => a.verdi - b.verdi)[0];
    console.log(
      `\n  kontrastmatrise: ${MAALINGER.length} par målt over ${new Set(MATRISE.map((g) => g.id)).size} grupper × ${TEMAER.length} temaer`
      + `\n  under kravet: ${feilende.length} (${perTema}) · baseline ${BASELINE}`
      + (verst
        ? `\n  verste par: ${verst.tekst} ${verst.tekstHex} på ${verst.flate} ${verst.flateHex}`
          + ` = ${verst.verdi.toFixed(2)}:1 (${verst.tema}, krav ${verst.krav})`
        : '')
      + '\n',
    );
    expect(MAALINGER.length).toBeGreaterThan(0);
  });

  it('INGEN NYE brudd utenfor registeret', () => {
    const nye = feilende
      .filter((m) => !REGISTRERT.has(noekkel(m)))
      .map(
        (m) => `[${m.gruppe}] ${m.tema}: ${m.tekst} ${m.tekstHex} på ${m.flate} ${m.flateHex}`
          + ` = ${m.verdi.toFixed(2)}:1 (krav ${m.krav}:1)`,
      );
    expect(nye, `${nye.length} NYTT kontrastbrudd som ikke fantes 2026-08-04:\n  ${nye.join('\n  ')}`)
      .toEqual([]);
  });

  it('INGEN registrert brudd har blitt VERRE — en måling ratsjeteres ikke', () => {
    // Sol-blokker: dybdekontrakten kunne stå «låst» med feil fortegn fordi
    // ingen målte om tallet gikk feil vei. Et antall alene fanger det ikke.
    const verre: string[] = [];
    for (const m of MAALINGER) {
      const r = REGISTRERT.get(noekkel(m));
      if (!r) continue;
      if (m.verdi < r.maalt - EPSILON) {
        verre.push(
          `${m.tema}: ${m.tekst} på ${m.flate} var ${r.maalt.toFixed(3)}:1, er nå ${m.verdi.toFixed(3)}:1`,
        );
      }
    }
    expect(verre, `registrerte brudd som har gått feil vei:\n  ${verre.join('\n  ')}`).toEqual([]);
  });

  it('antallet brudd er ikke ØKT over baseline', () => {
    const bedret = REGISTER.filter((r) => {
      const m = MAALINGER.find((x) => noekkel(x) === noekkel(r));
      return m !== undefined && m.verdi >= m.krav;
    }).map((r) => `${r.tema}: ${r.tekst} på ${r.flate}`);
    if (bedret.length > 0) {
      console.log(
        `\n  RATSJEN GIKK NED: ${bedret.length} registrerte par er nå over kravet.`
        + `\n  Senk BASELINE til ${feilende.length} og fjern dem fra REGISTER:\n    ${bedret.join('\n    ')}\n`,
      );
    }
    expect(
      feilende.length,
      `${feilende.length} brudd mot baseline ${BASELINE}. Baseline kan bare KRYMPE — `
      + 'hev den aldri for å få porten grønn.',
    ).toBeLessThanOrEqual(BASELINE);
  });

  it('EIERRAPPORTERTE par er aldri baselinet', () => {
    // Eierfunn har ikke gulv. Er lista tom, er det fordi ingen eierfunn
    // gjelder et tokenverdi-par — ikke fordi regelen ikke finnes.
    const baselinede = EIERFUNN.filter((e) => REGISTRERT.has(noekkel(e)))
      .map((e) => `${e.tema}: ${e.tekst} på ${e.flate} (${e.kilde})`);
    expect(baselinede, `eierrapporterte funn står i baseline-registeret:\n  ${baselinede.join('\n  ')}`)
      .toEqual([]);
    const brutte = EIERFUNN.filter((e) => {
      const m = MAALINGER.find((x) => noekkel(x) === noekkel(e));
      return m !== undefined && m.verdi < m.krav;
    }).map((e) => `${e.tema}: ${e.tekst} på ${e.flate} (${e.kilde})`);
    expect(brutte, `eierrapporterte kontrastbrudd — disse har ALDRI gulv:\n  ${brutte.join('\n  ')}`)
      .toEqual([]);
  });
});

/* ── DE TO LYS-INNGANGENE MÅ MÅLE LIKT ─────────────────────────────────── */

describe('kontrastmatrisen — auto-lys og valgt lys gir samme tall', () => {
  it('hvert par måler identisk gjennom @media og [data-theme="light"]', () => {
    // R1-retningen 2026-08-03 handlet nettopp om drift mellom de to
    // inngangene: `--dw-plate` stod i den ene og ikke i den andre, og
    // garderoben ble mørke firkanter på krem for den som VALGTE lys.
    // `lys-symmetri.test.ts` sammenligner NØKKELSETT; denne sammenligner de
    // MÅLTE tallene, som er det brukeren faktisk ser.
    const auto = maalMatrisen(AUTO_LYS).maalinger.filter((m) => m.tema === 'lys');
    const valgt = MAALINGER.filter((m) => m.tema === 'lys');
    expect(auto.length, 'auto-lys ga ingen målinger').toBe(valgt.length);
    expect(auto.length, 'auto-lys målte ingenting i det hele tatt').toBeGreaterThan(0);
    const avvik: string[] = [];
    for (const a of auto) {
      const v = valgt.find((x) => noekkel(x) === noekkel(a))!;
      if (Math.abs(a.verdi - v.verdi) > EPSILON) {
        avvik.push(
          `${a.tekst} på ${a.flate}: @media ${a.verdi.toFixed(3)}:1 (${a.tekstHex}/${a.flateHex})`
          + ` mot [data-theme] ${v.verdi.toFixed(3)}:1 (${v.tekstHex}/${v.flateHex})`,
        );
      }
    }
    expect(
      avvik,
      'tilgjengelighet avhenger av HVORDAN brukeren fikk lys modus:\n  ' + avvik.join('\n  '),
    ).toEqual([]);
  });
});
