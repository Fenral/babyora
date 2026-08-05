/**
 * DOKTRINE-PORTEN LESER src/ — ikke docs/mocks/.
 *
 * Bakgrunn (fase 2, DoD-lansering): `tools/design-doctrine-lint.mjs` har siden
 * 2026-07-31 globbet `docs/mocks/monter/*.html`. Den leste 17 mock-filer, meldte
 * 6 funn og hadde NULL src-filer i skopet. Verre: registrene var mock-spesifikke
 * — `.rows`/`.week-surface`/`.plans`/`.group` og `class="thumb"` finnes ikke i
 * `src/` i det hele tatt. Linten kunne altså aldri stryke på appen, uansett hva
 * appen gjorde. Den stod heller ikke i `package.json` eller i CI.
 *
 * Det er nøyaktig feilklassen fra `laerdom-hjem-2026-08-03.md`: en port som
 * ikke kan STRYKE, er ikke en port. Sju ganger har en port bestått på fravær.
 *
 * Denne filen bytter KORPUS, ikke doktrine. Reglene er DESIGN.md sin egen
 * «Depth doctrine» (2026-07-31) pluss de to registrene den gamle linten bar:
 *
 *   D1  Innhold rett på canvas       — hairline-rader uten hevet gruppeflate
 *   D2  Hevet flate uten lyslogikk   — raised-fyll uten inset topplys + skygge
 *   D3  Vitrine-behandlingen         — thumb-ramme uten bakgrunn
 *   D4  Scroll uten bunn-fade        — overflow:auto uten mask-image
 *   D5  Radhøyde-gulvet              — rad under 62 px
 *   D6  Trykkmålet                   — interaktivt mål under 44 px
 *   D7  Rå hex utenfor tokenfilen    — farge som ikke går via --dw-*
 *
 * Den gamle lintens «D5 ubetinget innslags-animasjon» er BEVISST ikke portet
 * hit: bevegelse eies av `design-tokens-v2.motion.test.ts` og evighetsregelen.
 * To porter på samme gjeld gir to baseliner over de samme funnene, og da kan
 * fase 3 ratsje den ene til null uten at gjelden er borte.
 *
 * ─── TRE STILFLATER, IKKE ÉN ────────────────────────────────────────────────
 * 10 av 11 skjermer har INGEN .css-fil. Leser porten bare `.css`, ser den
 * omtrent ingenting av appen. Korpuset er derfor:
 *   (a) `.css` under src/ (tokenfilene unntatt — de DEFINERER, de forbruker ikke)
 *   (b) CSS i template-literaler i `.tsx` (<style>{`…`}</style>, STYLE_CSS-konstanter)
 *   (c) inline `CSSProperties`-objektliteraler i `.tsx`
 * Flate (c) er ikke en detalj: ALLE 46 inline-D2-funnene ligger på legacy
 * `var(--surface*)`. Et regex som bare kjenner `--dw-*` finner 0 av dem.
 *
 * ─── KOMMENTARER STRIPPES FØRST ─────────────────────────────────────────────
 * Fallgruve målt 2026-08-04: et søk etter ordet `@media` traff ordet inne i
 * filens EGEN kommentarblokk og kuttet skopet for målene. Både blokk- og
 * linjekommentarer blankes ut her — med mellomrom, slik at linjenummer holder
 * seg ekte. Uten det ville porten målt prosa og rapportert løgnaktige linjer.
 *
 * ─── ORD I FEIL SYNTAKTISK KONTEKST ─────────────────────────────────────────
 * Samme feilfamilie slo til TO ganger, og begge er rettet her:
 *   • `@media` traff ordet inne i en kommentar → kommentarstripping (over).
 *   • `inset` traff CSS-EGENSKAPEN `inset:` / `inset-block-start:`
 *     (posisjonering) like godt som nøkkelordet inne i en `box-shadow`.
 *     Doktrinen mener det siste (DESIGN.md l. 93). Konsekvensen var målt og
 *     ekte: `background: var(--dw-raised); position: absolute; inset: 0;
 *     box-shadow: 0 8px 24px rgba(0,0,0,.28)` — et ordinært overlay-mønster
 *     med hevet fyll og kun YTRE skygge — passerte D2 grønt. Porten så flaten
 *     (kandidat 65→66) og meldte den ikke. Gjelden kunne altså VOKSE bak et
 *     grønt lys. Se INSET_TOPPLYS_CSS under.
 * Lærdommen står som mutasjonskontrakt, ikke som prosa: testen
 * «MUTASJONSKONTRAKT: inset-topplys forveksles ikke med inset-POSISJONERING»
 * asserter direkte på predikatet.
 *
 * ─── IKKE-VAKUØSITET (riktig utgave) ────────────────────────────────────────
 * «Er skopet stort nok» duger ikke — det ble prøvd i dag og godtok en
 * kommentarblokk. Porten beviser i stedet at den fant MÅLENE SINE:
 *   1. de navngitte filene er i korpuset,
 *   2. de navngitte selektorene er i den PARSEDE regelmengden,
 *   3. hver regel har en ikke-tom KANDIDATmengde (noe å måle),
 *   4. de navngitte ankermålene ligger i kandidatmengden til sin egen regel.
 * Ankrene er KANDIDATER, ikke funn — ellers ville fase 3 sin ratsjing til null
 * felle porten for å ha gjort jobben sin.
 * En kandidatmengde må selv være ekte: D7 kalte tidligere `kandidat()`
 * ubetinget for hver parsede regel og «beviste» dermed bare at korpuset var
 * stort. Nå er D7-kandidatene de reglene som faktisk bærer farge (712 → 398).
 *
 * ─── BASELINE ───────────────────────────────────────────────────────────────
 * Gulvet står to steder, og de må stemme overens:
 *   • BASELINE      — antall brudd PER REGEL. Kan ikke ØKE.
 *   • BASELINE_SETT — HVOR bruddene ligger (`regel|fil|selektor`, med antall).
 * Tallet alene var ikke nok: `toBeLessThanOrEqual` lot gjeld BYTTE PLASS —
 * fjern ett brudd her, legg til ett der, netto 0, grønt. Settet krever at
 * hvert fil/selektor-par står i gulvet fra før, OG at et fikset brudd skrives
 * ut av gulvet i samme commit. Fase 3 ratsjer begge til null.
 *
 * Ingen av funnene i denne porten er eierrapporterte; skulle et bli det, skal
 * det ut av gulvet og telles permanent (eierrapporterte funn kan ALDRI
 * baselines).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/* ─────────────────────────────── BASELINE ────────────────────────────────── */
/**
 * Dagens antall brudd, målt 2026-08-04 mot src/. GULV, ikke mål.
 *
 * REGELEN: hvert tall kan bare KRYMPE. Går et tall opp, er porten rød og
 * endringen kan ikke lukkes. Går det ned, skrives det nye (lavere) tallet inn
 * her i samme commit — da er det nye gulvet låst og gjelden kan ikke komme
 * tilbake. Fase 3 ratsjer alle sju til 0. Tallet alene er ikke gulvet:
 * BASELINE_SETT under sier HVOR bruddene ligger, og begge må oppdateres.
 *
 * Å HEVE et tall er en doktrineendring og krever et vedtak i vedtak.json.
 *
 * INGEN av disse funnene er eierrapporterte. Blir et av dem det, skal det UT
 * av gulvet og telles permanent utenfor — eierrapporterte funn kan aldri
 * baselines. (I dag gjelder det ingen av D1–D7; `cta-over-fold` og
 * `sideskift-er-fysiske` ligger i andre porter.)
 *
 * MÅLT MOT HEAD, ikke bare mot arbeidstreet — og denne gangen er påstanden
 * etterprøvbar i stedet for anekdotisk. Målekorpuset er nøyaktig
 * `src/**` med endelse `.css` og `.tsx`; da tallene ble tatt 2026-08-04 var
 * `git status --porcelain -- 'src/*.css' 'src/*.tsx'` TOM, altså var hver
 * eneste målte fil bit for bit identisk med HEAD. (Forrige måling ble tatt
 * mens en parallell agent hadde en mutasjon i flukt i hjem-monter.css;
 * korpuset var da 713 regler, nå 712. De sju tallene var like i begge
 * tilstander, men gulvet skal ikke hvile på det sammentreffet.)
 */
const BASELINE: Record<string, number> = {
  /* Ny mot kartleggingen, som ikke målte D1. Begge i OnboardingScreen. */
  D1: 2,
  /* 59, ikke kartleggingens 67. NB: kartleggingen oppga også `Antrekkskart
     .css:9` for .outfit-map__ordinal — riktig linje er 10. Skanningen
     rapporterte tegnet ETTER forrige `}`; her rapporteres selektorens egen
     linje. Alle linjenummer under er derfor 1 høyere enn kartleggingens der
     forrige regel sluttet på linjen over. Kartleggingen talte 21 (css/tsx-css) + 46
     (inline) — men 8 av de 46 var DUBLETTER: `{ … }`-regexet for inline
     CSSProperties traff også kroppen i CSS-regler inne i template-literaler
     (OnboardingScreen ×5, PaakledningScreen ×3), altså samme gjeld talt to
     ganger. Her er template-CSS-områdene ekskludert fra inline-flaten:
     21 + 38 = 59. css/tsx-css-siden stemmer eksakt med kartleggingen. */
  D2: 58,
  D3: 0,
  /* 21, ikke kartleggingens 20: `.hjem-monter { overflow: hidden auto }` er
     en scroll-container like fullt som `overflow-y: auto`. Toverdiformen var
     usynlig for kartleggingens regex. */
  D4: 21,
  D5: 5,
  D6: 2,
  /* 18, ikke kartleggingens 16: kartleggingens skanning brukte
     `(background|color|border|box-shadow)` og så derfor verken
     `outline: 3px solid var(--focus-ring, #2b2522)` (Antrekkskart) eller
     `background-image: linear-gradient(…, var(--surface-soft, #E6E3DD) …)`
     (Skeleton). Begge er ekte rå hex; gulvet står på det MÅLTE tallet. */
  D7: 17,
};

/**
 * BASELINE-SETTET — HVOR gjelden ligger, ikke bare hvor mye.
 *
 * Fingeravtrykk = `regel|fil|selektor`, med antall. Linjenummer er BEVISST
 * utelatt: linjer flytter seg av ren formatering, og et gulv som ryker på
 * whitespace blir skrudd av i stedet for respektert.
 *
 * HVORFOR SETT OG IKKE BARE TALL (rettet 2026-08-04): et rent
 * `toBeLessThanOrEqual`-tall lot gjeld BYTTE PLASS. Fjern ett D2-brudd i
 * UkeScreen.css og legg til ett nytt i HjemScreen.tsx → netto 0 → grønt, og
 * den nye gjelden var usynlig. Nå må hvert fil/selektor-par stå i gulvet fra
 * før, og et brudd som FORSVINNER må skrives ut av gulvet i samme commit —
 * ellers står det slakk igjen som ny gjeld kan snike seg inn i.
 *
 * KJENT GRENSE, sagt rett ut: inline CSSProperties-objekter har ingen
 * selektor, så de fingeravtrykkes som `(inline)` per fil. Et bytte INNENFOR
 * samme fil, samme regel og samme flate er derfor fortsatt usynlig for
 * settet (tallet fanger det ikke heller, siden det er netto 0). Ekte fiks er
 * en JSX-avledet identitet per inline-objekt — fase 3, ikke et korpusbytte.
 */
const BASELINE_SETT: Record<string, number> = {
  'D1|src/screens/OnboardingScreen.tsx|.ob-sum-row + .ob-sum-row': 1,
  'D1|src/screens/OnboardingScreen.tsx|.ob-loc-row': 1,

  'D2|src/components/instrument/vertical-gauge.css|.fa-gauge-step': 1,
  'D2|src/components/outfit/Antrekkskart.css|.outfit-map__node': 1,
  'D2|src/components/outfit/Antrekkskart.css|.outfit-map__ordinal': 1,
  'D2|src/components/outfit/Antrekkskart.css|.outfit-row': 1,
  'D2|src/components/outfit/Antrekkskart.css|.outfit-comparison': 1,
  'D2|src/components/planning/PlanChangeRail.css|.plan-change-rail__unchanged-dot': 1,
  'D2|src/components/planning/PlanChangeRail.css|.plan-change-rail__preview img': 1,
  'D2|src/screens/UkeScreen.css|.planlegg-status': 1,
  'D2|src/screens/UkeScreen.css|.planlegg-status__skeleton > span, .planlegg-status__skeleton-rail span': 1,
  'D2|src/screens/UkeScreen.css|.planlegg-screen__week-weather': 1,
  'D2|src/screens/UkeScreen.css|.planlegg-screen .plan-change-rail__preview img': 1,
  'D2|src/components/Skeleton.tsx|.ba-skeleton-shimmer': 2,
  'D2|src/screens/OnboardingScreen.tsx|.ob-date-input.filled': 1,
  'D2|src/screens/OnboardingScreen.tsx|.ob-manual input': 1,
  'D2|src/screens/OnboardingScreen.tsx|.ob-cal': 1,
  'D2|src/screens/OnboardingScreen.tsx|.ob-combo input': 1,
  'D2|src/screens/OnboardingScreen.tsx|.ob-combo-list': 1,
  'D2|src/screens/PaakledningScreen.tsx|.pkl-chip .thumb': 1,
  'D2|src/screens/PaakledningScreen.tsx|.pkl-row': 1,
  'D2|src/screens/PaakledningScreen.tsx|.pkl-row .rthumb': 1,
  /* inline CSSProperties — `(inline)` per fil, se grensen over. */
  'D2|src/components/PlaggDetailSheet.tsx|(inline)': 7,
  'D2|src/components/controls/AgeAdaptiveSituationPicker.tsx|(inline)': 1,
  'D2|src/components/family/CareCircle.tsx|(inline)': 2,
  'D2|src/components/family/ToolsSection.tsx|(inline)': 1,
  'D2|src/components/instrument/TemperatureInstrument.tsx|(inline)': 1,  'D2|src/screens/HjemScreen.tsx|(inline)': 4,
  'D2|src/screens/PaakledningScreen.tsx|(inline)': 8,
  'D2|src/screens/PlaggbibliotekScreen.tsx|(inline)': 1,
  'D2|src/screens/TogGuideScreen.tsx|(inline)': 4,
  'D2|src/screens/VarmEllerKaldScreen.tsx|(inline)': 4,
  'D2|src/screens/VinterprogramScreen.tsx|(inline)': 4,

  /* D3 står på 0 — ingen fingeravtrykk. Regelen måler likevel 5 kandidater. */

  'D4|src/components/hjem/hjem-monter.css|.hjem-monter': 1,
  'D4|src/screens/OnboardingScreen.tsx|.ob-screen > .ob-body': 1,
  'D4|src/screens/OnboardingScreen.tsx|.ob-combo-list': 1,
  'D4|src/components/PaywallDialog.tsx|(inline)': 1,
  'D4|src/components/PlaggDetailSheet.tsx|(inline)': 1,
  'D4|src/screens/FinnAntrekkScreen.tsx|(inline)': 1,
  'D4|src/screens/InnstillingerScreen.tsx|(inline)': 10,
  'D4|src/screens/PaakledningScreen.tsx|(inline)': 1,
  'D4|src/screens/PlaggbibliotekScreen.tsx|(inline)': 1,
  'D4|src/screens/TogGuideScreen.tsx|(inline)': 1,
  'D4|src/screens/VarmEllerKaldScreen.tsx|(inline)': 1,
  'D4|src/screens/VinterprogramScreen.tsx|(inline)': 1,

  'D5|src/screens/OnboardingScreen.tsx|.ob-sum-row': 1,
  'D5|src/screens/OnboardingScreen.tsx|.ob-screen.step-4 .ob-sum-row': 1,
  'D5|src/screens/PaakledningScreen.tsx|.pkl-row': 1,
  'D5|src/screens/PaakledningScreen.tsx|.pkl-row .num': 1,
  'D5|src/screens/PaakledningScreen.tsx|.pkl-row .rthumb': 1,

  'D6|src/screens/OnboardingScreen.tsx|.ob-cal-nav button': 1,
  'D6|src/screens/PaakledningScreen.tsx|.pkl-chip .badge': 1,

  'D7|src/components/outfit-transition/OutfitTransitionOverlay.css|.outfit-transition-overlay__clone': 3,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-experience': 1,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-map__node': 1,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-map__ordinal': 1,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-map__node:focus-visible, .outfit-row:focus-visible, .outfit-alternative:focus-visible': 1,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-row': 2,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-row__detail': 1,
  'D7|src/components/outfit/Antrekkskart.css|.outfit-comparison': 2,
  'D7|src/screens/UkeScreen.css|.planlegg-garments__thumb': 1,
  'D7|src/components/Skeleton.tsx|.ba-skeleton-shimmer': 3,
  'D7|src/screens/OnboardingScreen.tsx|.ob-baby-wordmark': 1,};

/* ────────────────────────────── KORPUSET ─────────────────────────────────── */

function filer(dir: string, endelser: string[], ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    if (navn === 'node_modules' || navn === 'dist') continue;
    const full = join(dir, navn);
    if (statSync(full).isDirectory()) filer(full, endelser, ut);
    else if (endelser.some((e) => navn.endsWith(e))) ut.push(full);
  }
  return ut;
}

const rel = (f: string): string => relative(ROOT, f).replace(/\\/gu, '/');

/**
 * Blanker CSS-kommentarer og JS/TS-linjekommentarer, men BEHOLDER linjeskift
 * og lengde, slik at hver rapportert linje peker på ekte kode.
 * `[^:\\]` foran `//` sparer `https://` og escapede skråstreker.
 */
function utenKommentarer(tekst: string): string {
  return tekst
    .replace(/\/\*[\s\S]*?\*\//gu, (m) => m.replace(/[^\n]/gu, ' '))
    .replace(/(^|[^:\\])\/\/[^\n]*/gu, (m, p1: string) => p1 + ' '.repeat(m.length - p1.length));
}

const linjeAv = (tekst: string, i: number): number => tekst.slice(0, i).split('\n').length;

const cssFiler = filer(SRC, ['.css'])
  .filter((f) => !/design-tokens(-v2)?\.css$/u.test(f))
  .sort();
const tsxFiler = filer(SRC, ['.tsx'])
  .filter((f) => !f.includes('__tests__'))
  .sort();

type Kilde = { fil: string; flate: string; tekst: string; hel: string | null; base: number };

const kilder: Kilde[] = [];
for (const f of cssFiler) {
  kilder.push({ fil: rel(f), flate: 'css', tekst: utenKommentarer(readFileSync(f, 'utf8')), hel: null, base: 0 });
}
/* (b) template-literaler i .tsx som INNEHOLDER en CSS-regel. Klassifiseringen
   er innholdsbasert (`{ … : … }`), ikke navnebasert — `<style>{STYLE_CSS}`
   ville rømt et rent `<style>`-grep, og gjør det i OnboardingScreen i dag.
   Områdene lagres, fordi flate (c) må holde seg UNNA dem: se under. */
const tsxKode = new Map<string, string>();
const cssOmraader = new Map<string, { fra: number; til: number }[]>();
for (const f of tsxFiler) {
  const navn = rel(f);
  const kode = utenKommentarer(readFileSync(f, 'utf8'));
  tsxKode.set(navn, kode);
  const omr: { fra: number; til: number }[] = [];
  let i = 0;
  while (i < kode.length) {
    const a = kode.indexOf('`', i);
    if (a === -1) break;
    const b = kode.indexOf('`', a + 1);
    if (b === -1) break;
    const t = kode.slice(a + 1, b);
    if (/\{[^}]*:/u.test(t)) {
      kilder.push({ fil: navn, flate: 'tsx-css', tekst: t, hel: kode, base: a + 1 });
      omr.push({ fra: a + 1, til: b });
    }
    i = b + 1;
  }
  cssOmraader.set(navn, omr);
}

type Regel = { fil: string; flate: string; sel: string; body: string; linje: number };

const regler: Regel[] = [];
for (const k of kilder) {
  for (const m of k.tekst.matchAll(/([^{}@]+?)\{([^{}]*)\}/gu)) {
    const foran = m[1] ?? '';
    const sel = foran.trim().replace(/\s+/gu, ' ');
    if (!sel.includes('.') && !/^(li|button|a|p|h\d)\b/u.test(sel)) continue;
    /* Linjen skal peke på SELEKTOREN, ikke på tegnet etter forrige `}`.
       Uten dette havnet .hjem-monter på linje 1 fordi filens 19 linjer
       header-kommentar var blanket ut foran den. */
    const off = foran.length - foran.trimStart().length;
    const idx = m.index + off;
    regler.push({
      fil: k.fil,
      flate: k.flate,
      sel,
      body: m[2] ?? '',
      linje: k.hel ? linjeAv(k.hel, k.base + idx) : linjeAv(k.tekst, idx),
    });
  }
}

type InlineObjekt = { fil: string; flate: string; sel: string; body: string; linje: number };

/**
 * (c) inline CSSProperties: innerste objektliteraler som ser ut som stil.
 *
 * DOBBELTTELLINGEN, målt her: `{ … }`-regexet treffer også KROPPEN i en
 * CSS-regel inne i et template-literal, så `.pkl-row { background:
 * var(--surface-soft); }` ble talt både som flate (b) og flate (c).
 * Kartleggingens 46 inline-D2 inneholdt 8 slike dubletter (OnboardingScreen
 * ×5, PaakledningScreen ×3) — de er samme gjeld talt to ganger, og et gulv
 * bygget på dem ville vært 8 for høyt. To sperrer: (1) template-CSS-områdene
 * hoppes over, (2) verdien må stå i hermetegn, som er JS-objektets signatur.
 */
const inlineObjekter: InlineObjekt[] = [];
for (const f of tsxFiler) {
  const navn = rel(f);
  const kode = tsxKode.get(navn)!;
  const omr = cssOmraader.get(navn)!;
  for (const m of kode.matchAll(/\{[^{}]{20,2000}\}/gu)) {
    const body = m[0];
    if (!/[a-zA-Z]+\s*:\s*(['"`]|\d|var\()/u.test(body)) continue;
    if (omr.some((o) => m.index >= o.fra && m.index < o.til)) continue;
    inlineObjekter.push({ fil: navn, flate: 'tsx-inline', sel: '(inline)', body, linje: linjeAv(kode, m.index) });
  }
}

/* ──────────────────────────────── REGLENE ────────────────────────────────── */

type Funn = { regel: string; fil: string; flate: string; sel: string; linje: number; hva: string };

const funn: Funn[] = [];
/** Kandidat = noe regelen FANT og faktisk målte. Tom kandidatmengde = taus port. */
const kandidater: Record<string, { fil: string; sel: string; linje: number }[]> = {
  D1: [], D2: [], D3: [], D4: [], D5: [], D6: [], D7: [],
};

const meld = (regel: string, x: { fil: string; flate: string; sel: string; linje: number }, hva: string): void => {
  funn.push({ regel, fil: x.fil, flate: x.flate, sel: x.sel, linje: x.linje, hva });
};
const kandidat = (regel: string, x: { fil: string; sel: string; linje: number }): void => {
  kandidater[regel]!.push({ fil: x.fil, sel: x.sel, linje: x.linje });
};

/**
 * Rad-selektor: `…row…`, `__row`, `-rad`.
 *
 * KJENT HEURISTIKK-GRENSE, målt under mutasjonskjøringen: deteksjonen er
 * NAVNEBASERT. En rad døpt `.pkl-varselrad` (uten bindestrek foran «rad»)
 * slapp gjennom med `min-height: 48px`; `.pkl-alert-row` ble felt umiddelbart.
 * Kodebasen bruker konsekvent `row`, så grensen er i dag teoretisk — men den
 * er ekte, og en rad som skal unnslippe D5 kan gjøre det ved å hete noe annet.
 * Ekte fiks er en DOM-avledet radmengde (som panel-porten gjør for panel-
 * skopet); det hører hjemme i fase 3, ikke i et korpusbytte.
 */
/* `-rad(?![\w-])`, ikke `-rad\b`: `\b` matchet også DELENE av en rad.
   Radprimitivens `.dw-rad-ikon` (en 32 px ikonboks) og `.dw-rad-skille`
   (en 1 px strek) ble meldt som «rader under 62 px» — de er ikke rader.
   Lookaheaden krever at navnet SLUTTER på «rad», så `.dw-rad` måles mens
   delene av den ikke gjør det.

   KJENT GJENSTÅENDE HULL, notert i stedet for skjult: høyder satt via
   `var(--dw-size-touch)` telles ikke, fordi målingen krever et literalt
   px-tall. `.dw-rad` slipper derfor unna D5 selv om den skulle vært målt.
   Ekte fiks er den DOM-avledede radmengden som allerede er notert til
   fase 3 — ikke enda en navneregel oppå den forrige. */
const ER_RAD = /(^|[\s.>+~])[\w-]*row[\w-]*(\[|:|\s|$)|__row|-rad(?![\w-])/iu;
/** Interaktiv selektor. */
const ER_INTERAKTIV = /(btn|button|cta|skip|toggle|tab|chip|pill|knapp|fab|opt|choice|nav)/iu;
/**
 * DEKORASJON — hårstreker, ikoner, prikker, ::before-linjer. Måles ikke mot
 * rad- og trykkmål-gulvene: et 1,5 px ::before er ikke en rad som er for lav,
 * og en 14 px `svg` inne i en knapp er ikke et trykkmål som er for lite.
 * Uten dette filteret ga D5 7 og D6 8 funn — fem av dem rene falske positive.
 */
const ER_DEKOR = /(::before|::after|::-|\bsvg\b|-dot\b|-line\b|scanline|__ordinal|hairline|\bhr\b|\bi\b$)/u;
/**
 * HEVET FLATE = flatt fyll fra en hevet token. Verdien må være ÉN var(), ikke
 * en gradient: `background: radial-gradient(…, var(--surface-pure) 30%, …)` er
 * atmosfære, ikke et materiale, og skal ikke kreve inset topplys.
 * Legacy `var(--surface*)` MÅ stå her — hele inline-gjelden ligger der.
 */
const HEVET_CSS = /(?<![\w-])(background|background-color)\s*:\s*var\(\s*--(dw-(raised|plate|overlay|interactive)|surface[\w-]*)[^;]*\)\s*(!important)?\s*;/u;
const HEVET_INLINE = /(?<![\w-])(background|backgroundColor)\s*:\s*['"`]\s*var\(\s*--(dw-(raised|plate|overlay|interactive)|surface[\w-]*)/u;
/**
 * INSET TOPPLYS = nøkkelordet `inset` INNE i en box-shadow — ikke CSS-
 * EGENSKAPEN `inset` / `inset-block-start` / `inset-inline-start`, som er
 * posisjonering og ikke sier ett ord om lys.
 *
 * FEILEN SOM BLE RETTET (målt 2026-08-04): porten brukte bare `/inset/`
 * på hele regelkroppen. Den matchet altså ordet i FEIL SYNTAKTISK KONTEKST
 * — nøyaktig samme feilfamilie som `@media`-treffet inne i en kommentar,
 * bare et annet ord. To målte konsekvenser:
 *   1) `{ background: var(--dw-raised); position: absolute; inset: 0;
 *       box-shadow: 0 8px 24px rgba(0,0,0,.28) }` — et helt ordinært
 *      overlay-/ark-mønster med hevet fyll og KUN ytre skygge — slapp
 *      gjennom D2. Porten SÅ flaten (kandidat 65→66) og meldte den ikke.
 *      Gjelden kunne altså VOKSE mens porten stod grønn, stikk i strid med
 *      topptekstens eget løfte om at tallene bare kan krympe.
 *   2) `.outfit-map__ordinal` (Antrekkskart.css:10) har hevet fyll og
 *      `inset-block-start`/`inset-inline-start`, men INGEN box-shadow.
 *      Porten meldte den som D2-brudd og regnet den SAMTIDIG som filens
 *      bevis på lyslogikk, slik at hele Antrekkskart.css ble fritatt fra
 *      D1. En hairline-rad ble derfor absorbert der og felt i BottomTabBar.
 * DESIGN.md l. 93 er utvetydig om hva doktrinen mener: «a 1px warm inner
 * top-light (rgba(242,192,138,~.15) inset)».
 *
 * Negativt lookbehind/lookahead er nødvendig: uten det ville `box-shadow`
 * med en etterfølgende `inset-block-start` i samme deklarasjon fortsatt
 * matchet. `[^;]*` holder søket inne i ÉN deklarasjon, så en `inset:`-linje
 * etter box-shadow ikke lekker inn.
 */
const INSET_TOPPLYS_CSS = /box-shadow\s*:[^;]*(?<![\w-])inset(?![\w-])/u;
const INSET_TOPPLYS_INLINE = /boxShadow\s*:\s*['"`][^'"`]*(?<![\w-])inset(?![\w-])/u;

/* ── D1 — innhold sitter aldri rett på canvas (DESIGN.md depth doctrine 1) ──
   Hairline-rader krever en hevet gruppeflate MED lyslogikk i samme fil.
   Heuristikk, som i den gamle linten — men registeret er nå AVLEDET fra src
   (enhver regel med hevet fyll + inset TOPPLYS i box-shadow), ikke fire
   mock-navn som ikke finnes. Bindingen til box-shadow er det som hindrer at
   en ren posisjonerings-`inset` fritar en hel fil fra D1. */
const filerMedHevetGruppeflate = new Set<string>();
for (const g of regler) {
  if (HEVET_CSS.test(g.body) && INSET_TOPPLYS_CSS.test(g.body)) filerMedHevetGruppeflate.add(g.fil);
}
for (const g of regler) {
  if (!ER_RAD.test(g.sel)) continue;
  if (!/border-(top|bottom)\s*:\s*1px solid/u.test(g.body)) continue;
  kandidat('D1', g);
  if (!filerMedHevetGruppeflate.has(g.fil)) {
    meld('D1', g, 'hairline-rad uten hevet gruppeflate (raised fyll + inset topplys) i samme fil');
  }
}

/* ── D2 — hvert hevet materiale bærer lyslogikk (depth doctrine 2) ────────── */
for (const g of regler) {
  if (!HEVET_CSS.test(g.body)) continue;
  kandidat('D2', g);
  const inset = INSET_TOPPLYS_CSS.test(g.body);
  const skygge = /box-shadow|var\(--dw-depth-/u.test(g.body);
  if (!inset || !skygge) {
    meld('D2', g, `hevet flate mangler ${[!inset && 'inset topplys', !skygge && 'skygge'].filter(Boolean).join(' + ')}`);
  }
}
for (const o of inlineObjekter) {
  if (!HEVET_INLINE.test(o.body)) continue;
  kandidat('D2', o);
  const inset = INSET_TOPPLYS_INLINE.test(o.body);
  const skygge = /boxShadow/u.test(o.body);
  if (!inset || !skygge) {
    meld('D2', o, `inline hevet flate mangler ${[!inset && 'inset topplys', !skygge && 'boxShadow'].filter(Boolean).join(' + ')}`);
  }
}

/* ── D3 — vitrine-behandlingen (depth doctrine 3) ──────────────────────────
   Thumb-RAMMEN skal ha bakgrunn. Selve <img> er ikke rammen, og en BEM-
   modifikator (`--letter`) arver basens bakgrunn — begge filtreres, ellers
   melder porten falskt på .planlegg-garments__thumb--letter. */
const thumbBaseMedBakgrunn = new Set<string>();
for (const g of regler) {
  if (!/thumb/iu.test(g.sel) || !/(?<![\w-])background/u.test(g.body)) continue;
  for (const m of g.sel.matchAll(/\.([\w-]*thumb[\w-]*)/giu)) thumbBaseMedBakgrunn.add(`${g.fil}::${(m[1] ?? '').split('--')[0]}`);
}
for (const g of regler) {
  if (!/thumb/iu.test(g.sel)) continue;
  if (/(?<![\w-])(img|picture|svg)(\b|$)/u.test(g.sel)) continue;
  if (/object-fit/u.test(g.body) && !/(?<![\w-])background/u.test(g.body)) continue;
  kandidat('D3', g);
  const baser = [...g.sel.matchAll(/\.([\w-]*thumb[\w-]*)/giu)].map((m) => `${g.fil}::${(m[1] ?? '').split('--')[0]}`);
  if (!baser.some((b) => thumbBaseMedBakgrunn.has(b))) {
    meld('D3', g, 'thumb-ramme uten vitrine-bakgrunn — naken img mot flaten');
  }
}

/* ── D4 — scroll kommuniseres med bunn-fade (depth doctrine 4) ─────────────
   Bunn-faden gjelder VERTIKAL scroll. `overflow: hidden auto` er en vertikal
   scroll-container like fullt som `overflow-y: auto` — toverdiformen må med,
   ellers slipper skjermrøttene unna (det er nettopp formen `.hjem-monter`
   bruker). Men `overflow: auto hidden` er HORISONTAL scroll og skal ikke
   kreve bunn-fade, så toverdiformen må leses posisjonelt: to verdier = x y,
   én verdi gjelder begge. */
const scrollerVertikalt = (body: string): boolean => {
  if (/(?<![\w-])overflow-y\s*:\s*(auto|scroll)/u.test(body)) return true;
  const m = /(?<![\w-])overflow\s*:\s*([a-z]+)(?:\s+([a-z]+))?/u.exec(body);
  if (!m) return false;
  const y = m[2] ?? m[1];
  return y === 'auto' || y === 'scroll';
};
for (const g of regler) {
  if (!scrollerVertikalt(g.body)) continue;
  kandidat('D4', g);
  if (!/mask-image|-webkit-mask/u.test(g.body)) meld('D4', g, 'scroll-container uten bunn-fade (mask-image)');
}
for (const o of inlineObjekter) {
  if (!/(?<![\w-])overflowY\s*:\s*['"`](auto|scroll)['"`]/u.test(o.body)) continue;
  kandidat('D4', o);
  if (!/maskImage|WebkitMaskImage/u.test(o.body)) meld('D4', o, 'inline scroll-container uten bunn-fade (maskImage)');
}

/* ── D5 — radhøyde-gulvet 62 px (depth doctrine 5) ─────────────────────────*/
for (const g of regler) {
  if (ER_DEKOR.test(g.sel) || !ER_RAD.test(g.sel)) continue;
  const m = /(?<![\w-])(min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/u.exec(g.body);
  if (!m) continue;
  kandidat('D5', g);
  if (Number(m[2]) < 62) meld('D5', g, `${m[1]}: ${m[2]}px — under 62px-radgulvet`);
}

/* ── D6 — trykkmål ≥ 44×44 (DESIGN.md «Material and hierarchy») ────────────*/
for (const g of regler) {
  if (ER_DEKOR.test(g.sel) || !ER_INTERAKTIV.test(g.sel)) continue;
  const m = /(?<![\w-])(min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/u.exec(g.body);
  if (!m) continue;
  kandidat('D6', g);
  if (Number(m[2]) < 44) meld('D6', g, `${m[1]}: ${m[2]}px — under 44px-trykkmålet`);
}

/* ── D7 — rå hex utenfor tokenfilen ───────────────────────────────────────
   Farger går via --dw-*. En var()-fallback med rå hex teller også: det er
   nettopp fallbacken som lever videre når tokenet aldri blir definert.

   KANDIDATMENGDEN ER EKTE, IKKE HELE KORPUSET (rettet 2026-08-04):
   `kandidat('D7', g)` ble tidligere kalt UBETINGET for hver parsede regel,
   så D7 hadde 712 kandidater uansett hva regelen gjorde. «Taus port = rød»-
   asserten beviste dermed ingenting for D7 — den sa bare «korpuset er
   stort», som er nøyaktig den vakuøsiteten porten skal avvise. En kandidat
   er nå en regel som faktisk BÆRER FARGE, altså har en deklarasjon D7 kan
   dømme. Funntallet er uendret (hver melding krever uansett en slik
   deklarasjon); det er kandidatmengden som slutter å lyve. */
const FARGEBAERENDE = /(?<![\w-])(background[a-z-]*|color|border[a-z-]*|box-shadow|outline[a-z-]*|fill|stroke)\s*:/u;
for (const g of regler) {
  if (!FARGEBAERENDE.test(g.body)) continue;
  kandidat('D7', g);
  for (const m of g.body.matchAll(/(?<![\w-])(background[a-z-]*|color|border[a-z-]*|box-shadow|outline[a-z-]*|fill|stroke)\s*:[^;]*#([0-9a-fA-F]{3,8})\b/gu)) {
    meld('D7', g, `rå hex: ${m[0].trim().replace(/\s+/gu, ' ').slice(0, 64)}`);
  }
}

/* ─────────────────────────── RAPPORT + ANKRE ─────────────────────────────── */

const antall: Record<string, number> = {};
for (const r of Object.keys(BASELINE)) antall[r] = funn.filter((f) => f.regel === r).length;
const total = funn.length;

const REGELNAVN: Record<string, string> = {
  D1: 'innhold rett på canvas (hairline-rad uten hevet gruppeflate)',
  D2: 'hevet flate uten lyslogikk (inset topplys + skygge)',
  D3: 'thumb-ramme uten vitrine-bakgrunn',
  D4: 'scroll-container uten bunn-fade',
  D5: 'radhøyde under 62 px',
  D6: 'trykkmål under 44 px',
  D7: 'rå hex utenfor tokenfilen',
};

/**
 * ANKERMÅL — «porten fant det den lette etter».
 * Dette er KANDIDATER, ikke funn: retter fase 3 `.pkl-row` til 62 px, skal
 * raden fortsatt være i D5s måleområde. Forsvinner ankeret fra kandidat-
 * mengden, har korpuset eller parseren kollapset, og porten er RØD.
 */
const ANKRE: { regel: string; fil: string; sel?: string; hvorfor: string }[] = [
  { regel: 'D2', fil: 'src/screens/UkeScreen.css', sel: '.planlegg-screen__week-weather', hvorfor: 'kjent D2-funn i .css' },
  { regel: 'D2', fil: 'src/components/family/ToolsSection.tsx', hvorfor: 'kjent D2-funn i inline CSSProperties' },
  { regel: 'D2', fil: 'src/components/hjem/hjem-monter.css', sel: '.hjm-rows', hvorfor: 'referanseskjermens hevede flate — skal måles, ikke felles' },
  { regel: 'D4', fil: 'src/screens/InnstillingerScreen.tsx', hvorfor: 'skjermen som falt ut av revisjonen 2026-08-03; 10 av 18 inline-D4' },
  { regel: 'D5', fil: 'src/screens/PaakledningScreen.tsx', sel: '.pkl-row', hvorfor: 'kjent D5-funn i tsx-template-CSS' },
  {
    regel: 'D7',
    fil: 'src/components/outfit/Antrekkskart.css',
    sel: '.outfit-map__ordinal',
    hvorfor: 'kjent rå-hex-funn — og etter kandidatfiksen beviser ankeret at regelen ble sett som FARGEBÆRENDE, ikke bare parset',
  },
];

/** Filer som MÅ være i korpuset — én per stilflate + de tunge skjermene. */
const PAAKREVDE_FILER = [
  'src/components/hjem/hjem-monter.css',
  'src/screens/UkeScreen.css',
  'src/components/outfit/Antrekkskart.css',
  'src/screens/PaakledningScreen.tsx',
  'src/screens/InnstillingerScreen.tsx',
  'src/screens/OnboardingScreen.tsx',
  'src/components/family/ToolsSection.tsx',
];

/** Selektorer som MÅ finnes i den parsede regelmengden (bevis på at parseren
    faktisk knakk alle tre stilflater, ikke bare .css). */
const PAAKREVDE_SELEKTORER: { sel: string; flate: string }[] = [
  { sel: '.hjm-panel', flate: 'css' },
  { sel: '.planlegg-screen__week-weather', flate: 'css' },
  { sel: '.pkl-row', flate: 'tsx-css' },
  { sel: '.ob-sum-row', flate: 'tsx-css' },
];

const korpusFiler = new Set<string>([...kilder.map((k) => k.fil), ...inlineObjekter.map((o) => o.fil)]);

/* ───────────────────── FINGERAVTRYKK: HVOR gjelden ligger ────────────────── */

const fingeravtrykk = (f: Funn): string => `${f.regel}|${f.fil}|${f.sel}`;

const tell = (fs: Funn[]): Map<string, number> => {
  const m = new Map<string, number>();
  for (const f of fs) m.set(fingeravtrykk(f), (m.get(fingeravtrykk(f)) ?? 0) + 1);
  return m;
};

const naaSett = tell(funn);

describe('doktrine-porten leser src/ (D1–D7)', () => {
  it('IKKE-VAKUØSITET: korpuset inneholder de navngitte filene, i alle tre stilflater', () => {
    const mangler = PAAKREVDE_FILER.filter((f) => !korpusFiler.has(f));
    expect(mangler, `disse filene er IKKE i korpuset — porten leser feil sted:\n  ${mangler.join('\n  ')}`).toEqual([]);

    const flater = new Set(kilder.map((k) => k.flate));
    expect(flater.has('css'), 'ingen .css-kilder i korpuset').toBe(true);
    expect(flater.has('tsx-css'), 'ingen CSS i tsx-template-literaler — <style>{`…`}-flaten er usett').toBe(true);

    /* KORPUSETS FORM, ikke gjeldsgulvet. Disse tallene sier bare at parseren
       ikke har kollapset og at ingen har flyttet appen ut av portens skop.
       Gjelden håndheves av BASELINE + BASELINE_SETT; blir korpuset mindre,
       skal det være et BEVISST valg som skrives ned her i samme commit — på
       samme måte som fikset gjeld skrives ut av gulvet.

       Tallene ble STRAMMET 2026-08-04, ikke løsnet. De stod på 500/12/50/600
       mot et korpus på 692/12/55/712 — 200 inline-objekter og 112 regler
       kunne altså forsvinne uten at noe rykket, og påstanden «porten leser
       appen» hvilte på et tall ingen lenger målte. Nye gulv: 650/12/53/690.
       Marginen er liten, men ikke null: en parallell agent flyttet korpuset
       713→712 mens denne porten ble etterprøvd, og et gulv som ryker på slikt
       blir skrudd av i stedet for respektert. Den EGENTLIGE ikke-vakuøsiteten
       ligger uansett i ankrene og kandidatmengdene — et antall er lett å
       tilfredsstille, et navngitt mål er det ikke. */
    expect(
      inlineObjekter.length,
      'inline CSSProperties-flaten har krympet (var 692). Er det tilsiktet, senk gulvet her i samme commit.',
    ).toBeGreaterThan(650);
    expect(
      cssFiler.length,
      'en .css-fil har forlatt korpuset (var 12). Er det tilsiktet, senk gulvet her i samme commit.',
    ).toBeGreaterThanOrEqual(12);
    expect(
      tsxFiler.length,
      'en .tsx-fil har forlatt korpuset (var 55). Er det tilsiktet, senk gulvet her i samme commit.',
    ).toBeGreaterThanOrEqual(53);
    expect(
      regler.length,
      'den parsede regelmengden har krympet (var 712). Er det tilsiktet, senk gulvet her i samme commit.',
    ).toBeGreaterThan(690);
  });

  it('IKKE-VAKUØSITET: de navngitte selektorene finnes i den PARSEDE regelmengden', () => {
    for (const { sel, flate } of PAAKREVDE_SELEKTORER) {
      const treff = regler.filter((g) => g.sel.split(',').some((s) => s.trim() === sel || s.trim().endsWith(` ${sel}`)));
      expect(treff.length, `selektoren ${sel} ble aldri parset — parseren ser ikke ${flate}-flaten`).toBeGreaterThan(0);
      expect(
        treff.some((g) => g.flate === flate),
        `${sel} ble parset, men ikke fra flaten ${flate} (fant: ${[...new Set(treff.map((g) => g.flate))].join(', ')})`,
      ).toBe(true);
    }
  });

  it('IKKE-VAKUØSITET: kommentarene er strippet FØR målingen', () => {
    /* Fallgruven, konkret: hjem-monter.css åpner med 19 linjer kommentar som
       nevner både `.hjm-thumb`, `background` og doktrine-ordene. Treffer
       porten dem, måler den prosa. Sjekken er derfor at den blankede teksten
       ikke lenger inneholder headerens egen ordlyd, mens koden under står. */
    const hjm = kilder.find((k) => k.fil === 'src/components/hjem/hjem-monter.css');
    expect(hjm, 'hjem-monter.css mangler i korpuset').toBeDefined();
    expect(hjm!.tekst.includes('Transkribert 1:1 fra docs/mocks'), 'kommentarteksten står igjen — kommentarstrippingen virker ikke').toBe(false);
    expect(hjm!.tekst.includes('.hjm-panel'), 'koden er borte — strippingen tok for mye').toBe(true);
    /* Linjetellingen skal overleve strippingen. */
    const raa = readFileSync(join(SRC, 'components/hjem/hjem-monter.css'), 'utf8');
    expect(hjm!.tekst.split('\n').length, 'linjeantallet endret seg under stripping — alle linjenummer ville løyet').toBe(raa.split('\n').length);
  });

  it('IKKE-VAKUØSITET: hver regel har en ikke-tom kandidatmengde (null mål = rødt)', () => {
    const tause = Object.keys(BASELINE).filter((r) => kandidater[r]!.length === 0);
    expect(
      tause,
      `disse reglene målte INGENTING — de har ikke bestått, de har vært tause:\n  ${tause.map((r) => `${r} ${REGELNAVN[r]}`).join('\n  ')}`,
    ).toEqual([]);
  });

  it('IKKE-VAKUØSITET: ankermålene ligger i sin egen regels kandidatmengde', () => {
    const tapt: string[] = [];
    for (const a of ANKRE) {
      const treff = kandidater[a.regel]!.filter(
        (k) => k.fil === a.fil && (a.sel === undefined || k.sel.split(',').some((s) => s.trim() === a.sel || s.trim().endsWith(` ${a.sel}`))),
      );
      if (treff.length === 0) tapt.push(`${a.regel}: ${a.fil}${a.sel ? ` ${a.sel}` : ''} — ${a.hvorfor}`);
    }
    expect(tapt, `porten fant IKKE målene sine. Den leter et annet sted enn den tror:\n  ${tapt.join('\n  ')}`).toEqual([]);
  });

  it('MUTASJONSKONTRAKT: inset-topplys forveksles ikke med inset-POSISJONERING', () => {
    /* Evasjonen som felte forrige utgave: hevet fyll + KUN ytre skygge, med
       `inset: 0` som posisjonering. Dette ER et D2-brudd og skal telles. */
    const evasjon =
      'background: var(--dw-raised); position: absolute; inset: 0; box-shadow: 0 8px 24px rgba(0,0,0,.28);';
    expect(INSET_TOPPLYS_CSS.test(evasjon), '`inset: 0` (posisjonering) ble lest som topplys').toBe(false);
    /* Ekte topplys etter DESIGN.md l. 93 — skal godtas. */
    expect(
      INSET_TOPPLYS_CSS.test('box-shadow: inset 0 1px 0 rgba(242,192,138,.15), 0 8px 24px rgba(0,0,0,.28);'),
      'ekte inset-topplys i box-shadow ble ikke godtatt',
    ).toBe(true);
    /* De logiske posisjonsegenskapene, hver for seg. */
    expect(INSET_TOPPLYS_CSS.test('inset-block-start: -.45rem;'), 'inset-block-start ble lest som topplys').toBe(false);
    expect(INSET_TOPPLYS_CSS.test('inset-inline-start: -.45rem;'), 'inset-inline-start ble lest som topplys').toBe(false);
    /* Rekkefølge skal ikke redde en flate: box-shadow FØRST, så `inset:`.
       `[^;]*` må stoppe på semikolonet mellom deklarasjonene. */
    expect(
      INSET_TOPPLYS_CSS.test('box-shadow: 0 8px 24px rgba(0,0,0,.28); inset: 0;'),
      'søket lekket forbi semikolonet til neste deklarasjon',
    ).toBe(false);
    /* Inline-varianten, samme skille. */
    expect(
      INSET_TOPPLYS_INLINE.test("{ background: 'var(--dw-raised)', inset: 0, boxShadow: '0 8px 24px rgba(0,0,0,.28)' }"),
      'inline `inset: 0` ble lest som topplys',
    ).toBe(false);
    expect(
      INSET_TOPPLYS_INLINE.test("{ boxShadow: 'inset 0 1px 0 rgba(242,192,138,.15), 0 8px 24px rgba(0,0,0,.28)' }"),
      'ekte inline inset-topplys ble ikke godtatt',
    ).toBe(true);
    /* Og fritaksmengden i D1 skal bygge på det samme skillet:
       Antrekkskart.css har `inset-block-start` men INGEN box-shadow, og skal
       derfor ikke fungere som filens bevis på lyslogikk. */
    expect(
      filerMedHevetGruppeflate.has('src/components/outfit/Antrekkskart.css'),
      'Antrekkskart.css fritas fra D1 på en posisjonerings-inset — det var nettopp hullet',
    ).toBe(false);
  });

  it('BASELINE-tallene og BASELINE-SETTET beskriver samme gjeld', () => {
    /* To uavhengige utsagn om det samme gulvet. Spriker de, er minst ett av
       dem skrevet feil, og da vet ingen hva porten egentlig håndhever. */
    const settSum: Record<string, number> = {};
    for (const [fp, n] of Object.entries(BASELINE_SETT)) {
      const regel = fp.split('|')[0]!;
      settSum[regel] = (settSum[regel] ?? 0) + n;
    }
    for (const regel of Object.keys(BASELINE)) {
      expect(
        settSum[regel] ?? 0,
        `${regel}: BASELINE sier ${BASELINE[regel]}, men BASELINE_SETT summerer til ${settSum[regel] ?? 0}`,
      ).toBe(BASELINE[regel]);
    }
    const ukjenteRegler = Object.keys(settSum).filter((r) => !(r in BASELINE));
    expect(ukjenteRegler, `BASELINE_SETT har fingeravtrykk for ukjente regler: ${ukjenteRegler.join(', ')}`).toEqual([]);
  });

  it('BASELINE-SETT: ingen NY gjeld — heller ikke i bytte mot en fjernet', () => {
    /* Dette er asserten som lukker bytte-hullet. Et fingeravtrykk som ikke
       står i gulvet fra før, eller som har vokst der, er ny gjeld — uansett
       hva totalen sier. */
    const nye: string[] = [];
    for (const [fp, n] of [...naaSett].sort((a, b) => a[0].localeCompare(b[0]))) {
      const gulv = BASELINE_SETT[fp] ?? 0;
      if (n > gulv) nye.push(`${fp}  → ${n} nå, ${gulv} i gulvet`);
    }
    expect(
      nye,
      'NY DOKTRINEGJELD. Disse fingeravtrykkene finnes ikke i gulvet, eller har vokst der.\n' +
        'Totalen kan godt stå stille — gjeld som bytter plass er fortsatt ny gjeld:\n  ' +
        nye.join('\n  '),
    ).toEqual([]);
  });

  it('BASELINE-SETT: gjeld som er BORTE skal skrives ut av gulvet i samme commit', () => {
    /* Motsatt retning, og like nødvendig: står et fikset brudd igjen i
       gulvet, er det slakk — et hull ny gjeld kan snike seg inn i uten at
       noen assert rykker. Dette er IKKE et doktrinebrudd; det er en
       bokføring som mangler. */
    const borte: string[] = [];
    for (const [fp, gulv] of Object.entries(BASELINE_SETT).sort((a, b) => a[0].localeCompare(b[0]))) {
      const n = naaSett.get(fp) ?? 0;
      if (n < gulv) borte.push(`${fp}  → ${gulv} i gulvet, ${n} nå`);
    }
    expect(
      borte,
      'GJELD ER FIKSET, men gulvet er ikke oppdatert. Dette er ikke et brudd — det er\n' +
        'bokføring: sett tallene under ned (eller slett linjene) i BASELINE_SETT, og\n' +
        'juster BASELINE tilsvarende, i SAMME commit. Ellers står slakken igjen:\n  ' +
        borte.join('\n  '),
    ).toEqual([]);
  });

  for (const regel of Object.keys(BASELINE)) {
    it(`${regel} ${REGELNAVN[regel]}: ingen ØKNING mot baseline ${BASELINE[regel]}`, () => {
      const mine = funn.filter((f) => f.regel === regel);
      expect(
        mine.length,
        `${regel} (${REGELNAVN[regel]}) gikk fra ${BASELINE[regel]} til ${mine.length} brudd — ` +
          `${mine.length - BASELINE[regel]!} over gulvet. Baselinen kan bare KRYMPE.\n` +
          `  Alle ${regel}-brudd nå:\n` +
          mine.map((f) => `    ${f.fil}:${f.linje}  [${f.flate}]  ${f.sel.slice(0, 52)}  → ${f.hva}`).join('\n'),
      ).toBeLessThanOrEqual(BASELINE[regel]!);
    });
  }

  it('totalen står stille eller synker', () => {
    const gulv = Object.values(BASELINE).reduce((a, b) => a + b, 0);
    const rapport =
      `\n  doktrine-porten mot src/\n` +
      `    filer skannet : ${cssFiler.length} .css + ${tsxFiler.length} .tsx\n` +
      `    kilder        : ${kilder.filter((k) => k.flate === 'css').length} css, ${kilder.filter((k) => k.flate === 'tsx-css').length} tsx-template-css, ${inlineObjekter.length} inline-objekter\n` +
      `    mål funnet    : ${regler.length} CSS-regler parset\n` +
      `    fritatt D1    : ${filerMedHevetGruppeflate.size} filer med hevet flate + ekte inset-topplys\n` +
      `    fingeravtrykk : ${naaSett.size} distinkte (regel|fil|selektor) / ${Object.keys(BASELINE_SETT).length} i gulvet\n` +
      Object.keys(BASELINE)
        .map((r) => `    ${r}  kandidater ${String(kandidater[r]!.length).padStart(4)}   funn ${String(antall[r]).padStart(3)} / gulv ${String(BASELINE[r]).padStart(3)}   ${REGELNAVN[r]}`)
        .join('\n') +
      `\n    SUM ${total} / gulv ${gulv}\n`;
    console.log(rapport);
    expect(total, `totalen økte fra ${gulv} til ${total}`).toBeLessThanOrEqual(gulv);
  });
});
