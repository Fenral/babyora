/**
 * SKJERMMANIFESTET GENERERES — fra ruteren og disken, ikke fra hukommelsen.
 *
 * Bakgrunn (DoD fase 2, Sol-blokker 6): manifestet skal liste alle shipping-
 * skjermer med filsti, om de migreres og ansvarlig fase. Et HÅNDSKREVET
 * manifest råtner — det var Sols poeng. Derfor genereres alt som kan utledes,
 * og KUN unntakene skrives for hånd (docs/design-notes/skjermmanifest.unntak.json).
 *
 * ─── KRITISK HULL SOM MOTIVERER GENERATOREN ────────────────────────────────
 * `lazy()`-registeret i App.tsx gir 10 moduler, ikke 11. InnstillingerScreen
 * (6230 linjer, 190 CSSProperties-objekter, 0 `var(--dw-*)`) står IKKE der —
 * den nås via FamilieScreen.tsx:19, en 21-linjers passthrough. Genereres lista
 * fra `lazy()` alene, forsvinner nøyaktig den skjermen hvis revisjon falt ut på
 * API-feil 2026-08-03. PaakledningScreen står i registeret men UTENFOR
 * routeKey-kjeden: den mountes som søsken-overlay på App.tsx:761/770.
 *
 * Derfor går generatoren fra DISK (`src/screens/*.tsx`) og krever at hver fil
 * finnes igjen i minst én rutekilde. Ikke omvendt.
 *
 * ─── KOMMENTARER STRIPPES FØRST ────────────────────────────────────────────
 * Fallgruven er ikke teoretisk her. App.tsx nevner `GuideHubScreen`,
 * `PlannedPaakledningScreen` og `CurrentPaakledningScreen` KUN i kommentarer;
 * GuideHubScreen.tsx er slettet i P6. Uten stripping ville generatoren meldt en
 * rutereferanse til en fil som ikke finnes, og «alle referanser løser opp»-
 * assertet ville strøket på prosa i stedet for på kode. Både blokk- og
 * linjekommentarer blankes ut med mellomrom, slik at linjenumre holder seg ekte.
 *
 * ─── FEM RUTEKILDER, KRYSSET MOT DISK ──────────────────────────────────────
 *   (a) lazy()-registeret            App.tsx:57–89   → 10 moduler
 *   (b) routeKey-tildelingene        App.tsx:648–705 → 8 rutenøkler
 *   (c) Drill-unionen                App.tsx:127–162 → 4 kinds
 *   (d) TAB_DEFS / FamilieToolTarget / GuideTarget   src/types/nav.ts
 *   (e) readdir('src/screens/*.tsx')                 → 11 filer  ← FASIT
 * Pluss ett hopp videre: en skjerm som rendres av en annen NÅBAR skjerm er selv
 * nåbar (FamilieScreen → InnstillingerScreen). Transitiv lukning fra App.tsx.
 *
 * `GuideTarget` inneholder 'snart', som IKKE er en skjerm men et planlegg-view
 * (`requestedPlanView`). Genereres skjermlista fra GuideTarget, får man en falsk
 * 12. skjerm. Generatoren teller derfor rutemål, aldri skjermer, fra den kilden.
 *
 * Bruk:
 *   node tools/skjermmanifest.mjs            # sjekk: avviker disk fra manifestet?
 *   node tools/skjermmanifest.mjs --skriv    # regenerer docs/design-notes/skjermmanifest.md
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HER = dirname(fileURLToPath(import.meta.url));
export const ROT = join(HER, '..');

export const MANIFEST_STI = 'docs/design-notes/skjermmanifest.md';
export const UNNTAK_STI = 'docs/design-notes/skjermmanifest.unntak.json';
const LANSERINGSSTATUS_STI = 'docs/design-notes/lanseringsstatus-2026-08-03.md';
const VEDTAK_STI = 'docs/design-notes/vedtak.json';
const SKJERMKATALOG = 'src/screens';

const les = (rot, sti) => readFileSync(join(rot, sti), 'utf8').replace(/\r\n/gu, '\n');

/**
 * Blanker ut både /* *​/ og // uten å flytte en eneste linje eller kolonne.
 * `://` i URL-er spares (samme vakt som doktrine-linten bruker).
 */
export function stripKommentarer(kilde) {
  const blank = (m) => m.replace(/[^\n]/gu, ' ');
  return kilde
    .replace(/\/\*[\s\S]*?\*\//gu, blank)
    .replace(/(^|[^:])\/\/[^\n]*/gu, (m, p1) => p1 + blank(m.slice(p1.length)));
}

/* ────────────────────────── (e) DISK — fasiten ─────────────────────────── */

export function lesSkjermerFraDisk(rot = ROT) {
  return readdirSync(join(rot, SKJERMKATALOG))
    .filter((f) => f.endsWith('.tsx'))
    .sort()
    .map((f) => `${SKJERMKATALOG}/${f}`);
}

const komponentnavn = (sti) => basename(sti, '.tsx');

/* ─────────────────── (a)–(d) RUTEKILDENE i App.tsx / nav.ts ────────────── */

/**
 * Kroppen til `type Navn = …;` — fram til det første semikolonet på
 * klammedybde 0. Uten klammetellingen stopper et naivt `[\s\S]*?;` på det
 * FØRSTE feltseparator-semikolonet inne i unionen, og Drill-unionens fire
 * kinds blir til én.
 */
function typeKropp(kilde, navn) {
  const start = new RegExp(`type ${navn}\\s*=`, 'u').exec(kilde);
  if (start === null) return '';
  let dybde = 0;
  for (let i = start.index + start[0].length; i < kilde.length; i += 1) {
    const c = kilde[i];
    if (c === '{') dybde += 1;
    else if (c === '}') dybde -= 1;
    else if (c === ';' && dybde === 0) return kilde.slice(start.index, i);
  }
  return kilde.slice(start.index);
}

export function lesRutekilder(rot = ROT) {
  const appRaa = les(rot, 'src/App.tsx');
  const app = stripKommentarer(appRaa);
  const nav = stripKommentarer(les(rot, 'src/types/nav.ts'));

  // (a) lazy()-registeret: import('./screens/X')
  const lazyRegister = [...app.matchAll(/lazy\(\(\)\s*=>\s*\n?\s*import\('\.\/(screens\/[A-Za-z0-9/_-]+)'\)/gu)]
    .map((m) => `src/${m[1]}.tsx`);

  // (b) routeKey-tildelingene
  const ruteNokler = [...app.matchAll(/routeKey\s*=\s*'([^']+)'/gu)].map((m) => m[1]);

  // (c) Drill-unionens kinds. MÅ skopes til selve typedeklarasjonen: leser man
  // `kind:` over hele filen, får man også `kind: 'planned' | 'current'` fra
  // outfit-bundle-nyttelasten (App.tsx:360/383) og ender med 6 «drills».
  const drillKinds = [...new Set(
    [...typeKropp(app, 'Drill').matchAll(/kind:\s*'([a-z-]+)'/gu)].map((m) => m[1]),
  )].sort();

  // (d) nav.ts
  const tabDefs = [...nav.matchAll(/\{\s*key:\s*'([a-z-]+)',\s*label:\s*'([^']+)'\s*\}/gu)]
    .map((m) => ({ key: m[1], label: m[2] }));
  const unionMedlemmer = (navnPaaType) => [...typeKropp(nav, navnPaaType)
    .matchAll(/'([a-z-]+)'/gu)].map((x) => x[1]);
  const familieToolTargets = unionMedlemmer('FamilieToolTarget');
  const guideTargets = [
    ...familieToolTargets,
    ...unionMedlemmer('GuideTarget'),
  ];

  // JSX som faktisk rendres i App.tsx — dekker både routeKey-grenen,
  // søsken-overlayet (PaakledningScreen) og onboarding-grenen.
  const rendretIApp = [...new Set([...app.matchAll(/<([A-Z][A-Za-z0-9]*Screen)\b/gu)].map((m) => m[1]))];

  return {
    lazyRegister,
    ruteNokler,
    drillKinds,
    tabDefs,
    familieToolTargets,
    guideTargets,
    rendretIApp,
    /** Alle skjermnavn App.tsx refererer til i KODE (ikke i prosa). */
    refererteNavn: [...new Set([
      ...lazyRegister.map(komponentnavn),
      ...rendretIApp,
    ])].sort(),
    /** Navn som KUN finnes i kommentarer — bevis på at strippingen virker. */
    kunIProsa: [...new Set([...appRaa.matchAll(/\b([A-Z][A-Za-z0-9]*Screen)\b/gu)].map((m) => m[1]))]
      .filter((n) => !new RegExp(`\\b${n}\\b`, 'u').test(app))
      .sort(),
  };
}

/* ───────── ETT HOPP VIDERE: hvilken skjerm rendrer hvilken skjerm ───────── */

export function lesSkjermgraf(rot = ROT, skjermer = lesSkjermerFraDisk(rot)) {
  const graf = new Map();
  for (const sti of skjermer) {
    const kilde = stripKommentarer(les(rot, sti));
    const rendret = new Set(
      [...kilde.matchAll(/<([A-Z][A-Za-z0-9]*Screen)\b/gu)].map((m) => m[1]),
    );
    rendret.delete(komponentnavn(sti));
    graf.set(sti, [...rendret].sort());
  }
  return graf;
}

/**
 * Transitiv lukning fra App.tsx. Returnerer for hver skjerm HVORDAN den nås.
 * En skjerm uten vei hit er funnet i denne portens kjerneassert.
 */
export function beregnNaabarhet(rot = ROT) {
  const skjermer = lesSkjermerFraDisk(rot);
  const rute = lesRutekilder(rot);
  const graf = lesSkjermgraf(rot, skjermer);
  const stiForNavn = new Map(skjermer.map((s) => [komponentnavn(s), s]));

  const vei = new Map();
  const ko = [];
  for (const navn of rute.refererteNavn) {
    const sti = stiForNavn.get(navn);
    if (!sti || vei.has(sti)) continue;
    const iLazy = rute.lazyRegister.includes(sti);
    vei.set(sti, iLazy ? 'App.tsx lazy()-register' : 'App.tsx direkte JSX');
    ko.push(sti);
  }
  while (ko.length > 0) {
    const sti = ko.shift();
    for (const barnNavn of graf.get(sti) ?? []) {
      const barn = stiForNavn.get(barnNavn);
      if (!barn || vei.has(barn)) continue;
      vei.set(barn, `rendres av ${basename(sti)}`);
      ko.push(barn);
    }
  }

  return {
    skjermer,
    rute,
    graf,
    vei,
    /** Skjermfiler på disk som INGEN rutekilde når. */
    uNaabare: skjermer.filter((s) => !vei.has(s)),
    /** Navn ruteren refererer til som ikke finnes på disk. */
    hengende: rute.refererteNavn.filter((n) => !stiForNavn.has(n)),
  };
}

/* ─────────────────────── STILFLATEN PER SKJERM ─────────────────────────── */

const LEGACY_TOKEN = /var\(\s*--(?!dw-)[a-z][a-z0-9-]*/gu;

export function malStilflate(rot, sti) {
  const tsxRaa = les(rot, sti);
  let kilde = stripKommentarer(tsxRaa);
  const cssSti = sti.replace(/\.tsx$/u, '.css');
  const harCss = existsSync(join(rot, cssSti));
  if (harCss) kilde += `\n${stripKommentarer(les(rot, cssSti))}`;

  const tell = (re) => (kilde.match(re) ?? []).length;
  const dw = tell(/var\(\s*--dw-[a-z0-9-]+/gu);
  const legacy = [...new Set((kilde.match(LEGACY_TOKEN) ?? []).map((x) => x.replace(/var\(\s*/u, '')))];
  const hex = tell(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/gu);
  const styleBlokker = tell(/<style[^>]*>\{`/gu);
  const stilobjekter = tell(/:\s*CSSProperties\s*=/gu);
  const inlineStilAttributter = tell(/style=\{\{/gu);

  /**
   * En skjerm uten en eneste stilbærende linje har ingenting å migrere.
   * FamilieScreen er 21 linjer passthrough — å telle den som «umigrert» fordi
   * den har 0 `--dw-*`, ville vært å måle fravær som gjeld.
   */
  const ingenStilflate = !harCss && styleBlokker === 0 && stilobjekter === 0
    && inlineStilAttributter === 0 && tell(/var\(\s*--/gu) === 0;

  return {
    linjer: tsxRaa.split('\n').length,
    cssFil: harCss ? cssSti : null,
    styleBlokker,
    stilobjekter,
    inlineStilAttributter,
    dwForbruk: dw,
    legacyTokens: legacy.sort(),
    raaHex: hex,
    ingenStilflate,
    /** Migreringsgjeld: legacy-token, rå hex, eller null forbruk av systemet. */
    umigrert: !ingenStilflate && (legacy.length > 0 || hex > 0 || dw === 0),
  };
}

/* ───────────── LANSERINGSSTATUSEN → konkrete fil/linje-punkter ─────────── */

const LISTENAVN = {
  'BLOKKERER LANSERING': 'BLOKKERER',
  'BØR RETTES': 'BØR RETTES',
  KOSMETISK: 'KOSMETISK',
};

/** basenavn → alle stier under src/ og public/. Brukes til å skille en referanse
 *  som er UTGÅTT (filen er slettet) fra en som bare er skrevet uten katalog. */
function byggFilindeks(rot) {
  const indeks = new Map();
  const gaa = (kat) => {
    for (const post of readdirSync(join(rot, kat), { withFileTypes: true })) {
      const sti = `${kat}/${post.name}`;
      if (post.isDirectory()) { gaa(sti); continue; }
      if (!indeks.has(post.name)) indeks.set(post.name, []);
      indeks.get(post.name).push(sti);
    }
  };
  for (const kat of ['src', 'public']) if (existsSync(join(rot, kat))) gaa(kat);
  return indeks;
}

export function lesFunn(rot = ROT, lanseringsstatusnavn = {}) {
  const filindeks = byggFilindeks(rot);
  /** Løser en referanse til en SKJERMFIL, eller null. Andre eksisterende filer
   *  (komponenter, css under components/) er ikke skjermer og hører ikke hit. */
  const tilSkjerm = (ref) => {
    const navn = basename(ref);
    const treff = ref.includes('/') && existsSync(join(rot, ref))
      ? [ref]
      : (filindeks.get(navn) ?? []);
    if (treff.length === 0) return { skjerm: null, fil: null, finnes: false };
    const iSkjermkatalog = treff.find((t) => t.startsWith(`${SKJERMKATALOG}/`));
    if (iSkjermkatalog === undefined) return { skjerm: null, fil: treff[0], finnes: true };
    // UkeScreen.css hører til UkeScreen.tsx — samme skjerm, to filer.
    const tsx = iSkjermkatalog.replace(/\.css$/u, '.tsx');
    const skjerm = existsSync(join(rot, tsx)) ? tsx : iSkjermkatalog;
    return { skjerm, fil: iSkjermkatalog, finnes: true };
  };

  const doc = les(rot, LANSERINGSSTATUS_STI);
  const linjer = doc.split('\n');
  const funn = new Map();
  const utgatteReferanser = new Set();
  let liste = null;
  let treffTotalt = 0;

  const registrer = (sti, post) => {
    if (!funn.has(sti)) funn.set(sti, []);
    funn.get(sti).push(post);
    treffTotalt += 1;
  };

  for (const linje of linjer) {
    const overskrift = /^###\s+(.+)$/u.exec(linje);
    if (overskrift) {
      liste = LISTENAVN[overskrift[1].trim()] ?? null;
      continue;
    }
    if (liste === null) continue;
    const kule = /^-\s+\[[ x]\]\s+(.*)$/u.exec(linje);
    if (kule === null) continue;
    const tekst = kule[1];
    const tittel = tekst.split('—')[0].trim().replace(/\s+/gu, ' ');
    const erT01 = tekst.includes('(T-01)');
    const erAdresseliste = tekst.startsWith('Dybdekontrakt:');

    // Filreferanser: `Fil.tsx:123, 456` eller bar `Fil.tsx`
    const sett = new Set();
    // Lookbehind hindrer at «+ `-dark.png`» (en halv filreferanse) leses som
    // filen `dark.png` og meldes utgått.
    for (const m of tekst.matchAll(/(?<![A-Za-z0-9_.\-/])([A-Za-z0-9_][A-Za-z0-9_./-]*\.(?:tsx|ts|css|mjs|png))(?::\s*([\d,\s-]+?))?(?=[`,)\s]|$)/gu)) {
      const { skjerm, fil, finnes } = tilSkjerm(m[1]);
      if (!finnes) { utgatteReferanser.add(m[1]); continue; }
      if (skjerm === null) continue;
      const linjeRef = (m[2] ?? '').trim().replace(/,\s*$/u, '');
      const nokkel = `${skjerm}|${fil}|${linjeRef}`;
      if (sett.has(nokkel)) continue;
      sett.add(nokkel);
      registrer(skjerm, {
        liste,
        tittel,
        // Punktet beholder sin EGNE fil: UkeScreen.css:436 hører til
        // UkeScreen-skjermen, men linje 436 finnes ikke i .tsx-en.
        fil,
        sted: linjeRef ? `:${linjeRef}` : '',
        tag: erAdresseliste ? 'adresseliste' : null,
      });
    }

    // T-01-lista navngir skjermene med VISNINGSNAVN, ikke filsti
    // («Juster `:989-1000`, Familie `:133`, Plaggbibliotek `:138`»).
    if (!erT01) continue;
    for (const [sti, navn] of Object.entries(lanseringsstatusnavn)) {
      const re = new RegExp(`${navn.replace(/[.*+?^${}()|[\]\\/]/gu, '\\$&')}\\s*(?:\`:([\\d,\\s-]+)\`)?`, 'u');
      const m = re.exec(tekst);
      if (m === null) continue;
      registrer(sti, { liste, tittel, sted: m[1] ? `:${m[1].trim()}` : '', tag: 'T-01' });
    }
  }

  // Samme slettede fil kan stå både med og uten katalog («MinGarderobeScreen.tsx»
  // og «src/screens/MinGarderobeScreen.tsx»). Behold den med sti.
  const perBasenavn = new Map();
  for (const ref of [...utgatteReferanser].sort()) {
    const b = basename(ref);
    if (!perBasenavn.has(b) || ref.includes('/')) perBasenavn.set(b, ref);
  }

  return { funn, utgatteReferanser: [...perBasenavn.values()].sort(), treffTotalt };
}

/* ──────────────────────── HÅNDSKREVNE UNNTAK ───────────────────────────── */

export function lesUnntak(rot = ROT) {
  return JSON.parse(les(rot, UNNTAK_STI));
}

export function lesVedtak(rot = ROT) {
  const v = JSON.parse(les(rot, VEDTAK_STI));
  return new Map(v.vedtak.map((x) => [x.id, x]));
}

/* ──────────────────────────── MANIFESTET ───────────────────────────────── */

export function samleManifest(rot = ROT) {
  const unntak = lesUnntak(rot);
  const naa = beregnNaabarhet(rot);
  const vedtak = lesVedtak(rot);
  const { funn, utgatteReferanser, treffTotalt } = lesFunn(rot, unntak.lanseringsstatusnavn);

  const rader = naa.skjermer.map((sti) => {
    const u = unntak.unntak[sti] ?? null;
    return {
      sti,
      navn: komponentnavn(sti),
      visningsnavn: unntak.visningsnavn[sti] ?? null,
      vei: naa.vei.get(sti) ?? null,
      ...malStilflate(rot, sti),
      migreres: u === null,
      fase: u === null ? '3' : u.fase,
      unntaksgrunn: u?.grunn ?? null,
      tilleggsfase: unntak.tilleggsfase?.[sti] ?? null,
      eierpunkter: (unntak.eierpunkter?.[sti] ?? []).map((id) => ({ id, vedtak: vedtak.get(id) ?? null })),
      funn: funn.get(sti) ?? [],
    };
  });

  const eierpunkterTotalt = rader.reduce((n, r) => n + r.eierpunkter.length, 0);

  return {
    rader,
    naa,
    unntak,
    utgatteReferanser,
    funnTreff: treffTotalt,
    tall: {
      skjermer: rader.length,
      migreres: rader.filter((r) => r.migreres).length,
      unntatt: rader.filter((r) => !r.migreres).length,
      umigrerteIFase3: rader.filter((r) => r.migreres && r.umigrert).length,
      eierpunkter: eierpunkterTotalt,
    },
  };
}

const ja = (b) => (b ? 'ja' : 'nei');

function stilflateTekst(r) {
  const deler = [];
  if (r.cssFil) deler.push(`\`${basename(r.cssFil)}\``);
  if (r.styleBlokker > 0) deler.push(`${r.styleBlokker} \`<style>\``);
  if (r.stilobjekter > 0) deler.push(`${r.stilobjekter} CSSProperties`);
  if (r.inlineStilAttributter > 0) deler.push(`${r.inlineStilAttributter} \`style={{\``);
  return deler.length > 0 ? deler.join(' + ') : '—';
}

export function byggManifest(rot = ROT) {
  const m = samleManifest(rot);
  const ut = [];
  const p = (s = '') => ut.push(s);

  p('# Skjermmanifest');
  p();
  p('> **GENERERT FIL — IKKE REDIGER FOR HÅND.**');
  p('> Regenerer med `node tools/skjermmanifest.mjs --skriv`.');
  p(`> Kun unntakene skrives for hånd, i \`${UNNTAK_STI}\`.`);
  p('> Håndhevet av `src/styles/__tests__/skjermmanifest.test.ts`, som feiler');
  p('> hvis denne filen avviker fra det generatoren utleder av koden.');
  p();
  p('Kilder: `src/screens/*.tsx` (fasit) krysset mot ruterens fem kilder —');
  p('`lazy()`-registeret, `routeKey`-tildelingene, `Drill`-unionen, `src/types/nav.ts`');
  p('og ett hopp videre gjennom skjermer som rendrer andre skjermer.');
  p('Funnpunktene er løftet fra `docs/design-notes/lanseringsstatus-2026-08-03.md`.');
  p();

  p('## 1. Tallene');
  p();
  p('| | |');
  p('|---|---|');
  p(`| Shipping-skjermer på disk | **${m.tall.skjermer}** |`);
  p(`| Migreres i fase 3 | **${m.tall.migreres}** |`);
  p(`| Unntatt fra fase 3 | **${m.tall.unntatt}** |`);
  p(`| Av fase 3-kohorten: fortsatt umigrert | **${m.tall.umigrerteIFase3}** |`);
  p(`| Eierrapporterte punkter (ALDRI baselinet) | **${m.tall.eierpunkter}** |`);
  p();

  p('## 2. Skjermene');
  p();
  p('| Skjerm | Filsti | Linjer | Stilflate | `--dw-*` | legacy | Nås via | Migreres | Fase |');
  p('|---|---|---:|---|---:|---:|---|---|---|');
  for (const r of m.rader) {
    p(`| ${r.visningsnavn ?? r.navn} | \`${r.sti}\` | ${r.linjer} | ${stilflateTekst(r)} | ${r.dwForbruk} | ${r.legacyTokens.length} | ${r.vei ?? '**INGEN RUTEKILDE**'} | ${ja(r.migreres)} | ${r.fase} |`);
  }
  p();
  p('«legacy» = antall UNIKE `var(--…)` som ikke er `--dw-*`. «Stilflate» teller');
  p('kommentarstrippet kilde: egen `.css`-fil, `<style>{`-blokker, `CSSProperties`-');
  p('objekter og `style={{`-attributter. 10 av 11 skjermer har ingen CSS-fil.');
  p();
  p('| Skjerm | Migreringsgjeld i dag |');
  p('|---|---|');
  for (const r of m.rader) {
    const status = r.ingenStilflate
      ? 'ingen stilflate — ingenting å migrere'
      : (r.umigrert
        ? `umigrert (${r.legacyTokens.length} legacy-token, ${r.raaHex} rå hex, ${r.dwForbruk} \`--dw-*\`)`
        : 'migrert');
    p(`| ${r.visningsnavn ?? r.navn} | ${status} |`);
  }
  p();

  p('## 3. Unntakene (håndskrevet)');
  p();
  for (const r of m.rader.filter((x) => !x.migreres)) {
    p(`### ${r.visningsnavn ?? r.navn} — \`${r.sti}\``);
    p();
    p(`Ansvarlig fase: **${r.fase}**. ${r.unntaksgrunn}`);
    p();
  }

  const medTillegg = m.rader.filter((r) => r.tilleggsfase !== null);
  if (medTillegg.length > 0) {
    p('### Tilleggsansvar utover fase 3');
    p();
    for (const r of medTillegg) {
      p(`- \`${r.sti}\` → fase ${r.tilleggsfase.fase}: ${r.tilleggsfase.grunn}`);
    }
    p();
  }

  p('### Heldekkende flater som IKKE er skjermer');
  p();
  p('De står i ingen av de fem rutekildene og er derfor eksplisitte unntak, ikke');
  p('utelatelser — de skal ikke dukke opp som en falsk 12. skjerm.');
  p();
  for (const x of m.unntak.ikkeSkjermer) {
    p(`- \`${x.fil}\` — ${x.grunn}`);
  }
  p();

  p('## 4. Eierrapporterte punkter — utenfor gulvet');
  p();
  p('Eierrapporterte funn kan ALDRI baselines. De telles her, aldri i baseline-');
  p('gulvet, og lukkes først når vedtaket står `laast` i `vedtak.json`.');
  p();
  for (const r of m.rader.filter((x) => x.eierpunkter.length > 0)) {
    for (const e of r.eierpunkter) {
      p(`- \`${r.sti}\` — **${e.id}** (status \`${e.vedtak?.status ?? 'UKJENT VEDTAK'}\`)`);
      p(`  - ${e.vedtak?.vedtak ?? ''}`);
      p(`  - kilde: ${e.vedtak?.kilde ?? ''}`);
    }
  }
  p();

  p('## 5. Funnpunkter per skjerm');
  p();
  p('Løftet fra lanseringsstatusen som konkrete fil/linje-punkter — T-01-lista,');
  p('adresselista (skyggestabler → `--dw-depth-*`) og kosmetisk-lista inkludert.');
  p('Et punkt havner på den skjermen lanseringsstatusen faktisk NAVNGIR. Hjem har');
  p('null punkter her fordi hele gjelden dens er adressert til');
  p('`src/components/hjem/` og `hjem-monter.css` — ikke fordi skjermen er ren.');
  p();
  for (const r of m.rader) {
    p(`### ${r.visningsnavn ?? r.navn} — \`${r.sti}\``);
    p();
    if (r.funn.length === 0) {
      p('Ingen punkter i lanseringsstatusen.');
      p();
      continue;
    }
    for (const f of r.funn) {
      const tag = f.tag ? ` _(${f.tag})_` : '';
      p(`- [ ] **${f.liste}**${tag} \`${f.fil ?? r.sti}${f.sted}\` — ${f.tittel}`);
    }
    p();
  }

  if (m.utgatteReferanser.length > 0) {
    p('## 6. Utgåtte referanser i lanseringsstatusen');
    p();
    p('Filer lanseringsstatusen peker på som ikke lenger finnes. De er droppet fra');
    p('punktlistene over — dette er beviset på at et håndskrevet register råtner.');
    p();
    for (const f of m.utgatteReferanser) p(`- \`${f}\``);
    p();
  }

  p('## 7. Rutekildene som ble lest');
  p();
  p(`- \`lazy()\`-registeret: ${m.naa.rute.lazyRegister.length} moduler`);
  p(`- \`routeKey\`-tildelinger: ${m.naa.rute.ruteNokler.length} — ${m.naa.rute.ruteNokler.map((k) => `\`${k}\``).join(', ')}`);
  p(`- \`Drill\`-unionens kinds: ${m.naa.rute.drillKinds.map((k) => `\`${k}\``).join(', ')}`);
  p(`- \`TAB_DEFS\`: ${m.naa.rute.tabDefs.map((t) => `\`${t.key}\``).join(', ')}`);
  p(`- \`FamilieToolTarget\`: ${m.naa.rute.familieToolTargets.map((t) => `\`${t}\``).join(', ')}`);
  p(`- \`GuideTarget\`: ${[...new Set(m.naa.rute.guideTargets)].map((t) => `\`${t}\``).join(', ')} — \`snart\` er et planlegg-view, ikke en skjerm`);
  p(`- Navn som KUN står i App.tsx sine kommentarer (strippet bort): ${m.naa.rute.kunIProsa.map((n) => `\`${n}\``).join(', ') || '—'}`);
  p();

  return `${ut.join('\n').replace(/\n{3,}/gu, '\n\n').trimEnd()}\n`;
}

/* ────────────────────────────── CLI ────────────────────────────────────── */

const kjortDirekte = process.argv[1] !== undefined
  && relative(process.argv[1], fileURLToPath(import.meta.url)) === '';

if (kjortDirekte) {
  const skriv = process.argv.includes('--skriv');
  const tekst = byggManifest(ROT);
  const mal = join(ROT, MANIFEST_STI);
  if (skriv) {
    writeFileSync(mal, tekst, 'utf8');
    console.log(`skrev ${MANIFEST_STI} (${tekst.split('\n').length} linjer)`);
  } else {
    const paaDisk = existsSync(mal) ? les(ROT, MANIFEST_STI) : null;
    if (paaDisk === tekst) {
      console.log(`${MANIFEST_STI} er i takt med koden`);
    } else {
      console.error(paaDisk === null
        ? `${MANIFEST_STI} finnes ikke — kjør med --skriv`
        : `${MANIFEST_STI} AVVIKER fra koden — kjør med --skriv`);
      process.exitCode = 1;
    }
  }
}
