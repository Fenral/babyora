/**
 * KLE PÅ-STEPPEREN — porten som holder løftet knappen gir.
 *
 * EIERFUNN 2026-08-04: «hvert plagg kom opp med Neste eller swipe etter CTA».
 * Knappen på Hjem heter «Kle på, steg for steg» (ResultSurface.tsx:83-86) og
 * lander i dag på OutfitGarmentList — en `<ol>` med ALLE plagg samtidig.
 * Knappen lover en sekvens; destinasjonen gir et oppslagsverk. Denne porten
 * måler at erstatningen faktisk er en sekvens, og at den blir det for ENHVER
 * plaggliste — ikke bare for den ene fixturen noen tilfeldigvis testet med.
 *
 * DE FEM MÅLENE, hver med en konkret måte å jukse seg forbi som porten
 * stenger:
 *
 *   1. STEGANTALLET ER EN FUNKSJON AV LISTEN, ikke en konstant. Tre lister
 *      (1, 4, 7 plagg) måles mot hverandre. Et fast tall — «vi rendrer alltid
 *      tre kort» — ville bestått på én liste og falt her.
 *   2. «HOPP OVER» FINNES IKKE. Eierbeslutning: i en lineær stepper er den
 *      funksjonelt identisk med «Neste», og to knapper som gjør det samme
 *      lærer brukeren at den ene er en felle. Porten leser BÅDE markup, kilde
 *      og CSS — og stripper kommentarer først, fordi komponentens eget
 *      filhode nesten helt sikkert forklarer at knappen er fjernet. Et søk
 *      som treffer forklaringen i stedet for koden er ikke et søk.
 *   3. INGEN HARDKODET BEVEGELSE. Hver varighet fra var(--dw-m-*), hver
 *      kurve fra var(--dw-ease). Detektoren stripper `var(--token` FØR den
 *      leter, slik at et rent token går fritt mens en rå fallback inne i
 *      var() — `var(--x, 200ms)` — fortsatt felles.
 *   4. REDUCED MOTION HAR EN EGEN BLOKK som slår forflytningen av. Den
 *      globale killswitchen i appen finnes, men spesifikasjonen her er
 *      strengere enn «kortere»: sveipet skal kollapse til DIREKTE BYTTE.
 *   5. IKKE-VAKUØSITET. Porten rapporterer hvor mange steg, knapper,
 *      bytt-innganger, CSS-deklarasjoner og bevegelsestokens den FAKTISK
 *      fant. Null mål = rødt. En komponent som rendrer ingenting, eller en
 *      CSS-fil som ikke finnes, skal ikke kunne bestå på fravær.
 *
 * ═══ NAVNEOPPGJØRET 2026-08-05 — LES DETTE FØR DU ENDRER `AVTALT` ═════════
 * Porten og komponenten ble bygget SAMTIDIG av to agenter, og de landet på
 * hvert sitt navnesett: porten skrev `plagg` / `Plagg` / `.klp-*`, komponenten
 * `steps` / `KlePaaStep` / `.kps-*`. Porten kalte sitt sett «det avtalte
 * API-et» — men INGEN hadde avtalt noe. Begge var påfunn, og den ene av dem
 * het bare «avtalen» fordi den var skrevet ned i en testfil.
 *
 * DET ER VERDT Å SI RETT UT: en port som følger etter implementasjonen er et
 * ekko, ikke en kontrakt. Nettopp derfor står begrunnelsen her, og ikke i en
 * commit-melding som ingen leser igjen:
 *
 *   1. `kps-` FØLGER HUSETS EGEN REGEL. `hjem-monter.css` gir `hjm-*`;
 *      `kle-paa-stepper.css` gir `kps-*` etter nøyaktig samme utledning.
 *      `klp-` er en forkortelse av «klepaa» og utledes ikke av noe.
 *   2. `steps` ER SANT, `plagg` ER DET IKKE. Proppen tar AVLEDEDE steg
 *      (rolle, materialpoeng og alternativer allerede løst av
 *      `deriveKlePaaSteps`) — ikke råe plagg. Å kalle dem `plagg` ville
 *      navngitt dataene feil.
 *
 * Så: komponentens navn står, porten flyttet seg. MEN — og dette er hele
 * poenget — hver eneste måling som ble flyttet er MUTASJONSTESTET etterpå:
 * bruddet injisert, RØDT med navngitt melding, brudd fjernet, GRØNT. En
 * retarget uten den runden er en port som er skrevet om til å bestå.
 *
 * OM FIXTUREN: `KlePaaStep` er eksportert og er nå den kjente formen, så
 * fixturen bygger den ekte formen i stedet for et supersett av gjettede
 * feltnavn. Kallet holdes likevel LØST typet (se `LøsStepper`): et
 * propnavn-brudd skal gi en NAVNGITT rød måling, ikke en typefeil som tar
 * hele filen ned før noe er målt.
 *
 * REPOET HAR VERKEN jsdom ELLER testing-library: komponentkontrakter testes
 * som statisk markup (renderToStaticMarkup), interaksjon i Playwright. Følger
 * husets mønster fra controls/__tests__/knappeprimitiv.test.tsx.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import i18n from '../../../i18n/index';
import { KlePaaStepper, type KlePaaStep } from '../KlePaaStepper';

await i18n.changeLanguage('no');

const ROT = process.cwd();

/**
 * KONTRAKTEN — ett sted, så en fremtidig eierbeslutning er én linje og ikke
 * et arkeologisk arbeid gjennom hele porten.
 *
 *   <KlePaaStepper steps={KlePaaStep[]} onClose={() => void} />
 *   .kps-slide (ett per steg) · [data-kps="next"] · .kps-swap-row
 *
 * Porten SKAL IKKE følge etter implementasjonen. Divergerer den herfra, er
 * DET funnet, og «kontrakten»-blokken under navngir avviket i klartekst i
 * stedet for å dø på en kryptisk typefeil. Se navneoppgjøret i filhodet for
 * hvorfor navnene er disse og ikke de porten opprinnelig påsto.
 *
 * NESTE-KNAPPEN GRIPES PÅ ATTRIBUTT, IKKE KLASSE, og det er ikke en
 * bekvemmelighet: knappeprimitivet tar med vilje ikke imot `className`
 * (låst vedtak). En port som krevde en klasse der, ville tvunget fram et
 * brudd på en annen kontrakt for å bli grønn.
 */
const AVTALT = {
  prop: 'steps',
  type: 'KlePaaStep',
  steg: 'kps-slide',
  bytt: 'kps-swap-row',
  nesteAttr: 'data-kps',
  nesteVerdi: 'next',
  forrigeVerdi: 'prev',
} as const;

/** Klasseprefikset stepperens egne flater bærer. Brukes av CSS-målingene. */
const PREFIKS = 'kps-';
const KLEPAA_DIR = join(ROT, 'src/components/klepaa');
const TOKENFIL = join(ROT, 'src/styles/design-tokens-v2.css');

/* ════════════════════════════════════════════════════════════════════════
   VERKTØY
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Blank ut i stedet for å slette: hver posisjon i den rensede teksten peker
 * fortsatt på samme sted i originalen, så linjenumre i feilmeldinger er
 * sanne. Samme grep som resten av husets porter.
 */
const blank = (t: string): string => t.replace(/[^\n]/gu, ' ');

const utenCssKommentar = (css: string): string =>
  css.replace(/\/\*[\s\S]*?\*\//gu, blank);

/** `(?<!:)` sparer `https://` — ellers spiser linjekommentar-strippingen URL-er. */
const utenKodeKommentar = (kode: string): string =>
  kode.replace(/\/\*[\s\S]*?\*\//gu, blank).replace(/(?<!:)\/\/[^\n]*/gu, blank);

function filerI(dir: string, endelse: RegExp): string[] {
  let navn: string[];
  try {
    navn = readdirSync(dir);
  } catch {
    return [];
  }
  return navn
    .filter((n) => endelse.test(n))
    .sort()
    .map((n) => join(dir, n));
}

const relSti = (fil: string): string => relative(ROT, fil).replace(/\\/gu, '/');
const linjeAv = (tekst: string, pos: number): number => tekst.slice(0, pos).split('\n').length;

/* ── kilder ──────────────────────────────────────────────────────────────
   CSS-filnavnet er ikke del av avtalen (huset skriver både `hjem-monter.css`
   og `Antrekkskart.css`), så porten leser ALLE stilark i mappen. Finner den
   ingen, er det et funn — ikke en unnskyldning for å hoppe over målingen. */
type Stilark = { fil: string; css: string };

const STILARK: Stilark[] = filerI(KLEPAA_DIR, /\.css$/u).map((fil) => ({
  fil: relSti(fil),
  css: utenCssKommentar(readFileSync(fil, 'utf8')),
}));

const SAMLET_CSS = STILARK.map((s) => s.css).join('\n');

/** Komponentkilden, uten kommentarer — se mål 2. */
const KILDER: Array<{ fil: string; kode: string }> = filerI(KLEPAA_DIR, /\.tsx?$/u).map((fil) => ({
  fil: relSti(fil),
  kode: utenKodeKommentar(readFileSync(fil, 'utf8')),
}));

const STEPPER_KILDE =
  KILDER.find((k) => k.fil.endsWith('KlePaaStepper.tsx'))?.kode ?? '';

const TOKENS_CSS = utenCssKommentar(readFileSync(TOKENFIL, 'utf8'));

/* ── markup ──────────────────────────────────────────────────────────── */

const ROLLER = ['Innerst', 'Mellomlag', 'Ytterst', 'Tilbehør'] as const;

/**
 * Ett steg i den EKTE formen (`KlePaaStep`). Strengene er ekte motorstrenger
 * og katalog-id-er (`tynt ullsett`, `kortermet ullbody`) slik at oppslag i
 * komponenten treffer noe virkelig i stedet for en fabrikkert nøkkel.
 *
 * HVERT STEG BÆRER ET ALTERNATIV. Uten det ville bytt-raden vært skjult av
 * komponentens egen regel, og porten hadde målt 0 bytt-innganger og kalt det
 * bestått — nøyaktig den vakuøsiteten mål 5 finnes for å stenge.
 */
function fiktivtSteg(i: number): KlePaaStep {
  const navn = i === 0 ? 'tynt ullsett' : `testplagg ${i + 1}`;
  return {
    itemId: `item-${i}`,
    label: navn,
    displayLabel: navn,
    roleLabel: ROLLER[i % ROLLER.length]!,
    materialPoint: 'Ull holder på varmen selv når den blir fuktig.',
    alternatives: [
      {
        optionId: `opt-${i}-a`,
        label: 'kortermet ullbody',
        displayLabel: 'Kortermet ullbody',
      },
    ],
  };
}

const plaggliste = (n: number): KlePaaStep[] => Array.from({ length: n }, (_, i) => fiktivtSteg(i));

/**
 * Løs signatur MED VILJE. Porten kaller komponenten med det AVTALTE
 * propnavnet. Hadde kallet vært strengt typet, ville en implementasjon som
 * døpte om proppen tatt hele filen ned i en typefeil — og da hadde ingen av
 * de fem målingene kjørt. En port som ikke kommer til å måle, måler ingenting.
 * Kontraktbruddet fanges i stedet eksplisitt, av «det avtalte API-et» under.
 */
type LøsStepper = (props: Record<string, unknown>) => ReactElement | null;
const Stepper = KlePaaStepper as unknown as LøsStepper;

/**
 * Rendrer med kontraktens propnavn. Kaster komponenten, er DET målingen —
 * feilteksten bæres videre inn i kvitteringen i stedet for å bli en stakk
 * ingen leser.
 *
 * `onSwap` sendes ALLTID inn. Komponenten skjuler bytt-raden når den mangler
 * (en rad som ikke fører noe sted er et løfte flaten ikke innfrir), så en
 * port uten den ville målt fravær og bestått på det.
 */
function tegnRå(n: number): { html: string; feil: string | null } {
  try {
    return {
      html: renderToStaticMarkup(
        <Stepper {...{ [AVTALT.prop]: plaggliste(n), onClose: () => {}, onSwap: () => {} }} />,
      ),
      feil: null,
    };
  } catch (e) {
    return { html: '', feil: e instanceof Error ? e.message : String(e) };
  }
}

/* Alle målinger går via `RENDER`-kartet under: én rendring per listelengde,
   gjenbrukt. En egen `tegn()`-snarvei ville rendret på nytt for hvert kall og
   gjort kvitteringen til slutt til en ANNEN måling enn den som ble vurdert. */

/** Alle klassenavn i markupen, som enkelttokens. */
function klassetokens(html: string): string[] {
  return [...html.matchAll(/class="([^"]*)"/gu)]
    .flatMap((m) => m[1]!.split(/\s+/u))
    .filter(Boolean);
}

/**
 * Eksakt tokentelling — ikke substring. `.klp-steg` skal ikke telle
 * `.klp-steg-tittel`, ellers måler porten dekorasjon i stedet for steg.
 */
const tell = (html: string, klasse: string): number =>
  klassetokens(html).filter((k) => k === klasse).length;

/**
 * Attributt-telling for kroker som ikke er klasser. Verdien må matche
 * EKSAKT: `data-kps="next"` skal ikke telle `data-kps="next-ish"`.
 */
const tellAttributt = (html: string, attr: string, verdi: string): number =>
  [...html.matchAll(new RegExp(`${attr}="([^"]*)"`, 'gu'))].filter((m) => m[1] === verdi).length;

/** Den synlige teksten i knappen som bærer kroken — uten indre markup. */
function knappetekst(html: string, attr: string, verdi: string): string | null {
  const m = new RegExp(`<button[^>]*${attr}="${verdi}"[^>]*>([\\s\\S]*?)</button>`, 'u').exec(html);
  return m === null ? null : m[1]!.replace(/<[^>]*>/gu, '').trim();
}

/** Listelengdene porten måler mot. Tre ULIKE tall — en konstant faller. */
const LISTER: readonly number[] = [1, 4, 7];

/** Rendres én gang, gjenbrukes av alle målene (og av kvitteringen til slutt). */
const RENDER: ReadonlyMap<number, { html: string; feil: string | null }> = new Map(
  LISTER.map((n): [number, { html: string; feil: string | null }] => [n, tegnRå(n)]),
);
const html = (n: number): string => RENDER.get(n)!.html;
const feilTekst = (n: number): string => {
  const f = RENDER.get(n)!.feil;
  return f === null ? '' : `  (render kastet: ${f})`;
};
const steg = (n: number): number => tell(html(n), AVTALT.steg);

/* ════════════════════════════════════════════════════════════════════════
   1. STEGANTALLET = ANTALL PLAGG
   ════════════════════════════════════════════════════════════════════════ */

/* ── KONTRAKTEN ─────────────────────────────────────────────────────────
   Kjøres FØRST, fordi en divergens her forklarer hver eneste røde måling
   under. Uten den ville porten meldt «0 steg» og latt leseren gjette. */
describe('kle på-stepperen — kontrakten', () => {
  it(`proppen heter \`${AVTALT.prop}\``, () => {
    const props = /KlePaaStepperProps\s*=\s*Readonly<\{([\s\S]*?)\}>/u.exec(STEPPER_KILDE);
    const felt = props === null
      ? []
      : [...props[1]!.matchAll(/^\s*(\w+)\??\s*:/gmu)].map((m) => m[1]!);
    expect(
      felt,
      `komponentens propper er: ${felt.join(', ') || '(fant ingen)'}. Kontrakten er `
      + `\`<KlePaaStepper ${AVTALT.prop}={${AVTALT.type}[]} onClose={() => void} />\`. `
      + 'Divergerer navnet, kan ikke kallstedet skrives før ett av de to gir seg.',
    ).toContain(AVTALT.prop);
    expect(felt, 'onClose mangler — sekvensen har ingen vei ut').toContain('onClose');
  });

  it(`elementtypen heter \`${AVTALT.type}\` og er eksportert`, () => {
    const eksporterte = KILDER.flatMap((k) =>
      [...k.kode.matchAll(/export\s+(?:type|interface)\s+(\w+)/gu)].map((m) => m[1]!),
    );
    expect(
      eksporterte,
      `eksporterte typer i src/components/klepaa/: ${eksporterte.join(', ') || '(ingen)'}. `
      + `Kallstedet kan ikke bygge listen uten \`${AVTALT.type}\`.`,
    ).toContain(AVTALT.type);
  });

  it(`klassene er \`${AVTALT.steg}\` og \`${AVTALT.bytt}\``, () => {
    const alle = `${STEPPER_KILDE}\n${SAMLET_CSS}`;
    const brukte = [...new Set([...alle.matchAll(/className="([^"]*)"/gu)]
      .flatMap((m) => m[1]!.split(/\s+/u))
      .filter(Boolean))].sort();
    for (const klasse of [AVTALT.steg, AVTALT.bytt]) {
      expect(
        alle.includes(klasse),
        `.${klasse} finnes ikke. Klassene komponenten faktisk bruker: `
        + `${brukte.join(', ') || '(ingen)'}. Klassenavnene ER API-et her — `
        + 'porten og Playwright-sjekkene griper i dem, og en port som følger '
        + 'etter implementasjonen er et ekko, ikke en kontrakt.',
      ).toBe(true);
    }
  });

  it(`navigasjonen bærer \`${AVTALT.nesteAttr}\`, ikke en klasse`, () => {
    /* Kroken ligger på ATTRIBUTT fordi knappeprimitivet ikke tar imot
       className. Begge retninger må være merket: en stepper med bare «Neste»
       er en enveiskjøring, og «Forrige» er ikke «Hopp over». */
    for (const verdi of [AVTALT.nesteVerdi, AVTALT.forrigeVerdi]) {
      expect(
        tellAttributt(html(4), AVTALT.nesteAttr, verdi),
        `${AVTALT.nesteAttr}="${verdi}" finnes ikke i markupen — porten og `
        + 'Playwright har da ikke noe stabilt grep om navigasjonen.',
      ).toBe(1);
    }
  });
});

describe('kle på-stepperen — ett plagg per steg', () => {
  it.each([...LISTER])('%i plagg gir like mange steg', (n) => {
    expect(
      steg(n),
      `${n} plagg ga ${steg(n)} .${AVTALT.steg}.${feilTekst(n)} Stepperen skal vise ETT plagg `
      + 'per steg — en liste som gir alt på én gang er nettopp destinasjonen denne skjermen erstatter.',
    ).toBe(n);
  });

  it('stegantallet er en FUNKSJON av listen, ikke en konstant', () => {
    /* Selve kjernen i mål 1. Et fast antall kort ville bestått hver enkelt
       sjekk over hvis det tilfeldigvis traff — her må de tre tallene være
       forskjellige fra hverandre, i samme rekkefølge som listene. */
    const målt = LISTER.map(steg);
    expect(
      new Set(målt).size,
      `stegantallet var ${målt.join(', ')} for listene ${LISTER.join(', ')} — `
      + 'like tall for ulike lister betyr at antallet er hardkodet',
    ).toBe(LISTER.length);
    expect(målt).toEqual([...LISTER]);
  });

  it('en tom liste gir null steg — og krasjer ikke', () => {
    const tom = tegnRå(0);
    expect(tom.feil, `stepperen kastet på en tom liste: ${tom.feil}`).toBeNull();
    expect(tell(tom.html, AVTALT.steg), 'fantomsteg uten et plagg bak seg').toBe(0);
  });

  it('det finnes NØYAKTIG én vei framover, og etiketten følger posisjonen', () => {
    for (const n of LISTER) {
      const antall = tellAttributt(html(n), AVTALT.nesteAttr, AVTALT.nesteVerdi);
      expect(
        antall,
        `${n} plagg ga ${antall} fremdriftsknapper.${feilTekst(n)} Én er kontrakten: `
        + 'ingen er en blindvei, to er to løfter om det samme.',
      ).toBe(1);
    }
    /* ETIKETTEN ER EN FUNKSJON AV POSISJONEN, ikke en konstant. Med flere
       plagg står vi på steg 1 og har noe foran oss («Neste»); med ett plagg
       er første steg også det siste («Ferdig»). En stepper som alltid sier
       «Neste» lyver på slutten, og en som alltid sier «Ferdig» lyver hele
       veien — begge ville bestått en ren tilstedeværelsessjekk. */
    expect(
      knappetekst(html(4), AVTALT.nesteAttr, AVTALT.nesteVerdi),
      'med fire plagg står brukeren på steg 1 og har tre steg foran seg',
    ).toBe('Neste');
    expect(
      knappetekst(html(1), AVTALT.nesteAttr, AVTALT.nesteVerdi),
      'med ett plagg er første steg også det siste — da er «Neste» et løfte om '
      + 'et steg som ikke finnes',
    ).toBe('Ferdig');
  });

  it('bytt-inngangen er bygget: nøyaktig én per steg som har et alternativ', () => {
    /* PORTDOM: «ingen konsekvensetiketter for motoren kan bevise dem». Raden
       skal skjules når plagget IKKE har verifiserte alternativer — men
       fixturen gir hvert steg ett, så her skal den finnes overalt. Nøyaktig
       én: null betyr at inngangen ikke er bygget, to betyr at det samme
       valget tilbys to ganger i samme steg. */
    expect(
      `${STEPPER_KILDE}\n${SAMLET_CSS}`,
      `klassen .${AVTALT.bytt} finnes ingen steder — bytt-inngangen er ikke bygget`,
    ).toContain(AVTALT.bytt);
    for (const n of LISTER) {
      const bytt = tell(html(n), AVTALT.bytt);
      expect(
        bytt,
        `${n} steg med hvert sitt alternativ ga ${bytt} .${AVTALT.bytt}${feilTekst(n)}`,
      ).toBe(n);
    }
  });

  it('bytt-raden forsvinner når det ikke finnes noe å bytte til', () => {
    /* MOTPRØVEN til målingen over, og den som gjør den ikke-vakuøs: uten
       denne kunne komponenten rendret raden ALLTID — også for plagg uten
       alternativer — og fortsatt bestått. En rad som ikke fører noe sted er
       nettopp feilklassen hele skjermen finnes for å rette. */
    const utenAlternativ = plaggliste(3).map((s) => ({ ...s, alternatives: [] }));
    const html3 = renderToStaticMarkup(
      <Stepper {...{ [AVTALT.prop]: utenAlternativ, onClose: () => {}, onSwap: () => {} }} />,
    );
    expect(
      tell(html3, AVTALT.bytt),
      'bytt-raden rendres for plagg uten alternativer — den lover et valg som ikke finnes',
    ).toBe(0);
    expect(tell(html3, AVTALT.steg), 'motprøven mistet stegene sine').toBe(3);
  });

  it('`onClose` brukes, den er ikke bare tatt imot', () => {
    /* En prop som deklareres og aldri kalles er en dør som er tegnet på
       veggen. Minst to forekomster: signaturen og minst ett bruksted. */
    const treff = [...STEPPER_KILDE.matchAll(/\bonClose\b/gu)].length;
    expect(
      treff,
      `onClose forekommer ${treff} gang(er) i KlePaaStepper.tsx — den tas imot uten å brukes`,
    ).toBeGreaterThanOrEqual(2);
  });

});

/* ════════════════════════════════════════════════════════════════════════
   2. «HOPP OVER» FINNES IKKE
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Fangstordene. `hopp[\s_-]*over` dekker tekst, `hoppOver` og `hopp-over`;
 * `skip` dekker den engelske klassen/aria-labelen. Ordgrenser i begge, så
 * `hoppeslott` og `skipper` ikke gir falske utslag.
 *
 * MÅLT 2026-08-05: den første formen `\bskip(?:p?e[dr]?|ping)?\b` felte
 * «skipper» — `skip` + `p?e[dr]?` spiser «per», og et yrke ble til et
 * kontraktbrudd. Endelsene listes derfor eksplisitt. Porten fanget det selv,
 * i sin egen målprøve; det er nettopp derfor målprøvene finnes.
 */
const HOPP_OVER = [/hopp[\s_-]*over/iu, /\bskip(?:s|ped|ping)?\b/iu] as const;

describe('kle på-stepperen — «Hopp over» er fjernet', () => {
  it.each([...LISTER])('markupen for %i plagg nevner den ikke', (n) => {
    for (const mønster of HOPP_OVER) {
      const treff = mønster.exec(html(n));
      expect(
        treff,
        `«${treff?.[0]}» står i markupen. I en lineær stepper er «Hopp over» `
        + 'funksjonelt identisk med «Neste» — to knapper for samme handling '
        + 'lærer brukeren at den ene er en felle (eierbeslutning).',
      ).toBeNull();
    }
  });

  it('kilden nevner den ikke — heller ikke som klassenavn eller aria-label', () => {
    /* KOMMENTARENE ER ALLEREDE STRIPPET. Uten det ville dette søket nesten
       garantert truffet komponentens eget filhode, som forklarer nettopp at
       knappen er fjernet — og porten hadde vært rød på dokumentasjonen sin
       i stedet for grønn på koden. Samme felle som husets øvrige porter har
       målt og dokumentert. */
    const brudd: string[] = [];
    for (const { fil, kode } of [...KILDER, ...STILARK.map((s) => ({ fil: s.fil, kode: s.css }))]) {
      for (const mønster of HOPP_OVER) {
        for (const m of kode.matchAll(new RegExp(mønster.source, `g${mønster.flags}`))) {
          brudd.push(`${fil}:${linjeAv(kode, m.index!)}  «${m[0]}»`);
        }
      }
    }
    expect(brudd, `«Hopp over» lever fortsatt i kilden:\n  ${brudd.join('\n  ')}`).toEqual([]);
  });
});

/* ════════════════════════════════════════════════════════════════════════
   3. + 4. BEVEGELSEN — ingen rå ms, ingen rå kurve, og en egen
   reduced-motion-blokk som slår forflytningen av.
   ════════════════════════════════════════════════════════════════════════ */

/** `steps()` og `linear()` er like hardkodede kurver som `cubic-bezier()`. */
const KURVE = /(?<![\w-])(?:cubic-bezier|steps|linear)\([^)]*\)/giu;

/**
 * `var(--token` strippes FØR skanningen, slik at et rent `var(--dw-m-step)`
 * går fritt — mens en rå fallback inne i var() (`var(--x, 200ms)`) fortsatt
 * felles, fordi den er like hardkodet som `200ms`.
 *
 * Bart `linear` er tillatt (proofen bruker det bevisst i kompenserte
 * opacity-kurver); `ease`/`ease-out`/`ease-in`/`ease-in-out` er derimot
 * nøyaktig driften --dw-ease finnes for å stoppe. `linear(` krever parentes,
 * så `linear-gradient(` ikke forveksles med en kurve.
 *
 * EN NULL ER IKKE EN TEMPOBESLUTNING. `transition-delay: 0s` bærer ingen
 * designvurdering og skal ikke tokeniseres — den filtreres bort her, slik at
 * porten bare snakker om varigheter noen faktisk har VALGT.
 */
function hardkodingerI(verdi: string): string[] {
  const skann = verdi.replace(/var\(\s*--[\w-]+\s*/gu, '');
  return [
    ...[...skann.matchAll(/(?<![\w.-])\d*\.?\d+m?s(?![\w-])/giu)]
      .map((m) => m[0]!)
      .filter((v) => Number.parseFloat(v) !== 0),
    ...[...skann.matchAll(KURVE)].map((m) => m[0]!),
    ...[...skann.matchAll(/(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-])/giu)].map((m) => m[0]!),
  ];
}

const MOTION_DEKL =
  /(transition|animation)(-duration|-delay|-timing-function|-property|-name|-iteration-count)?\s*:\s*([^;{}]+)/gu;

/** En egen custom property som hardkoder bevegelse er et PARALLELT token. */
const VARIABEL_DEKL = /(--[\w-]+)\s*:\s*([^;{}]+)/gu;

/** `@media (prefers-reduced-motion: reduce) { … }` — [start, slutt] i CSS-en. */
function reduksjonsområder(css: string): Array<[number, number]> {
  const ut: Array<[number, number]> = [];
  for (const m of css.matchAll(/@media[^{]*prefers-reduced-motion[^{]*\{/gu)) {
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
 * DOKUMENTERT UNNTAK: drapsbryteren. `transition-duration: .01ms` inne i en
 * reduced-motion-blokk er ikke gjeld — det er den kanoniske måten å slå
 * bevegelse AV på, og et token her ville vært feil (verdien skal ikke kunne
 * endres sentralt). Verdigaten er smal med vilje: `1s` og `0.1s` er EKTE
 * bevegelse gjemt i unntaket, og skal falle.
 */
const ER_DRAPSBRYTER = /^(?:transition|animation)-duration:\s*(?:0s|0ms|0|0?\.0*1ms)(?:\s*!important)?$/u;

type Treff = { sted: string; decl: string; funn: string[] };

type Måling = {
  /** Alle transition/animation-deklarasjoner, uansett verdi. */
  deklarasjoner: number;
  /** De med rå ms eller rå kurve, utenom drapsbryteren. */
  brudd: Treff[];
  /** Deklarasjoner i basen (utenfor reduced-motion) med en varighet. */
  basebevegelse: number;
  /** Hvert `var(--…)` som brukes i en bevegelsesdeklarasjon. */
  tokens: Set<string>;
  /** Bevegelsesdeklarasjoner som bruker en varighet uten å bruke --dw-ease. */
  utenKurve: Treff[];
};

function mål(): Måling {
  const m: Måling = {
    deklarasjoner: 0,
    brudd: [],
    basebevegelse: 0,
    tokens: new Set(),
    utenKurve: [],
  };

  for (const { fil, css } of STILARK) {
    const stille = reduksjonsområder(css);
    const iStille = (pos: number): boolean => stille.some(([a, b]) => pos >= a && pos <= b);
    /* Samme SKRIVESTED skal telles ÉN gang uansett hvor mange uttrekkere som
       ser det: `--klp-transition: 200ms ease` treffer både MOTION_DEKL (som
       ser «transition:» inne i navnet) og VARIABEL_DEKL. Nøkkelen er der
       VERDIEN begynner, så to lesninger av samme deklarasjon kollapser mens
       to ekte deklarasjoner på samme linje ikke gjør det. */
    const sett = new Set<number>();

    for (const d of css.matchAll(MOTION_DEKL)) {
      const egenskap = `${d[1]}${d[2] ?? ''}`;
      const rå = d[3]!.trim().replace(/\s+/gu, ' ');
      const decl = `${egenskap}: ${rå}`;
      const sted = `${fil}:${linjeAv(css, d.index!)}`;
      const vpos = d.index! + d[0]!.length - d[3]!.length;
      sett.add(vpos);
      m.deklarasjoner += 1;

      for (const v of rå.matchAll(/var\(\s*(--[\w-]+)/gu)) m.tokens.add(v[1]!);

      const funn = hardkodingerI(rå);
      if (funn.length > 0 && !(iStille(d.index!) && ER_DRAPSBRYTER.test(decl))) {
        m.brudd.push({ sted, decl, funn });
      }

      if (!iStille(d.index!) && /var\(\s*--dw-m-/u.test(rå)) {
        m.basebevegelse += 1;
        /* KUN shorthand. En longhand `transition-duration: var(--dw-m-step)`
           har kurven sin i en NABODEKLARASJON, og å kreve --dw-ease i samme
           verdi ville vært en feilmåling. Shorthanden derimot SETTER
           timing-function implisitt: står den uten kurve, arver flaten
           nettleserens `ease` — nøyaktig den stille driften kontrakten
           finnes for. At kurven i det hele tatt er i bruk, sjekkes separat. */
        if (d[2] === undefined && !/var\(\s*--dw-ease\s*\)/u.test(rå)) {
          m.utenKurve.push({ sted, decl, funn: [] });
        }
      }
    }

    /* Parallelle tokens: `--klp-inn: 200ms` + `transition: … var(--klp-inn)`
       gjør begge halvdeler usynlige for mønsteret over. */
    for (const v of css.matchAll(VARIABEL_DEKL)) {
      const rå = v[2]!.trim().replace(/\s+/gu, ' ');
      const vpos = v.index! + v[0]!.length - v[2]!.length;
      if (sett.has(vpos)) continue;
      const funn = hardkodingerI(rå);
      if (funn.length > 0) {
        m.brudd.push({
          sted: `${fil}:${linjeAv(css, v.index!)}`,
          decl: `${v[1]}: ${rå}`,
          funn,
        });
      }
    }
  }
  return m;
}

const MÅLT = mål();

/** ms-verdien til et bevegelsestoken, lest fra kontraktens egen tokenfil. */
function tokenMs(token: string): number | null {
  const m = new RegExp(`${token}\\s*:\\s*(\\d+(?:\\.\\d+)?)ms`, 'u').exec(TOKENS_CSS);
  return m === null ? null : Number(m[1]);
}

describe('kle på-stepperen — bevegelsen er token-drevet', () => {
  it('IKKE-VAKUØSITET: stepperen HAR et stilark, og det har regler', () => {
    expect(
      STILARK.length,
      'ingen .css i src/components/klepaa/ — porten ville målt bevegelse i tomme luften',
    ).toBeGreaterThanOrEqual(1);
    expect(
      SAMLET_CSS.replace(/\s+/gu, '').length,
      'stilarket har ikke innhold utenom kommentarer',
    ).toBeGreaterThan(400);
  });

  it('kontraktens klasser har faktisk regler', () => {
    for (const klasse of [AVTALT.steg, AVTALT.bytt]) {
      expect(
        new RegExp(`\\.${klasse}(?![\\w-])`, 'u').test(SAMLET_CSS),
        `.${klasse} har ingen regel i stilarket — klassen er del av kontrakten`,
      ).toBe(true);
    }
  });

  it('ingen hardkodet varighet eller kurve — hver ms fra var(--dw-m-*), hver kurve fra var(--dw-ease)', () => {
    const linjer = MÅLT.brudd.map((b) => `${b.sted}  ${b.decl}   ← ${b.funn.join(', ')}`);
    expect(
      linjer,
      `hardkodet bevegelse i stepperens stilark:\n  ${linjer.join('\n  ')}\n\n`
      + 'To kurver som ligner uten å være like leser som slurv i bevegelse. '
      + 'Én kurve for hele appen: var(--dw-ease).',
    ).toEqual([]);
  });

  it('IKKE-VAKUØSITET: det FINNES bevegelse å måle', () => {
    expect(
      MÅLT.deklarasjoner,
      'null transition/animation-deklarasjoner i stepperen. Sveipet skal ha '
      + '120–260 ms settling — en port som består fordi ingenting beveger seg, måler ingenting.',
    ).toBeGreaterThanOrEqual(1);
    expect(
      MÅLT.basebevegelse,
      'ingen bevegelsesdeklarasjon i basen bruker et --dw-m-*-token',
    ).toBeGreaterThanOrEqual(1);
  });

  it('en varighet uten kurve er halv bevegelse — begge kommer fra kontrakten', () => {
    const linjer = MÅLT.utenKurve.map((b) => `${b.sted}  ${b.decl}`);
    expect(
      linjer,
      `shorthand med token-varighet, men uten var(--dw-ease) — flaten arver da `
      + `nettleserens \`ease\`:\n  ${linjer.join('\n  ')}`,
    ).toEqual([]);
    expect(
      SAMLET_CSS,
      'var(--dw-ease) brukes ikke ett eneste sted. Én kurve for hele appen — '
      + 'og stepperen er ikke unntatt.',
    ).toContain('var(--dw-ease)');
  });

  it('hvert bevegelsestoken som brukes finnes faktisk — en skrivefeil i var() er helt stille', () => {
    const ukjente = [...MÅLT.tokens]
      .filter((t) => /^--dw-(?:m-|ease)/u.test(t))
      .filter((t) => !new RegExp(`${t}\\s*:`, 'u').test(TOKENS_CSS));
    expect(ukjente, `refererte tokens som ikke er deklarert i design-tokens-v2.css: ${ukjente.join(', ')}`)
      .toEqual([]);
  });

  it('settlingen holder seg innenfor 120–260 ms', () => {
    /* Spesifikasjonen: «Horisontal sveip 1:1 med fingeren, 120–260 ms
       settling.» --dw-m-push (340) og --dw-m-atmo (300) er sideskiftets og
       rommets varigheter — låner stepperen dem, slutter sveipet å føles
       festet til fingeren og begynner å føles som en navigasjon. */
    const brukt = [...MÅLT.tokens].filter((t) => t.startsWith('--dw-m-'));
    expect(brukt.length, 'ingen --dw-m-*-tokens brukt i stepperen').toBeGreaterThanOrEqual(1);
    const utenfor = brukt
      .map((t) => ({ t, ms: tokenMs(t) }))
      .filter((x) => x.ms !== null && (x.ms < 120 || x.ms > 260));
    expect(
      utenfor.map((x) => `${x.t} = ${x.ms}ms`),
      `varigheter utenfor sveipets budsjett (120–260 ms): ${utenfor.map((x) => `${x.t} ${x.ms}ms`).join(', ')}`,
    ).toEqual([]);
  });
});

describe('kle på-stepperen — redusert bevegelse kollapser til direkte bytte', () => {
  const blokker = STILARK.flatMap(({ fil, css }) =>
    reduksjonsområder(css).map(([a, b]) => ({ fil, tekst: css.slice(a, b + 1) })),
  );

  it('har en EGEN reduced-motion-blokk', () => {
    expect(
      blokker.length,
      'ingen @media (prefers-reduced-motion: reduce) i stepperens stilark. Den globale '
      + 'killswitchen forkorter; spesifikasjonen her krever direkte BYTTE — det er '
      + 'en sterkere påstand, og den må stå i stepperens egen fil.',
    ).toBeGreaterThanOrEqual(1);
  });

  it('blokken gjelder stepperens egne flater, ikke bare noe generelt', () => {
    const treffer = blokker.some((b) => new RegExp(`\\.${PREFIKS}[\\w-]+`, 'u').test(b.tekst));
    expect(
      treffer,
      `reduced-motion-blokken nevner ingen .${PREFIKS}*-selektor — den styrer da ikke stepperen`,
    ).toBe(true);
  });

  it('blokken slår FORFLYTNINGEN av', () => {
    const AV =
      /(?:transition|animation)\s*:\s*none|(?:transition|animation)-duration\s*:\s*(?:0s|0ms|0|0?\.0*1ms)|transform\s*:\s*none|translate\s*:\s*none/u;
    const døde = blokker.filter((b) => AV.test(b.tekst));
    expect(
      døde.length,
      'reduced-motion-blokken forkorter, men slår ikke av. «Kollapser til direkte bytte» '
      + 'betyr transition/animation: none (eller varighet 0) — ikke en raskere gli.',
    ).toBeGreaterThanOrEqual(1);
  });
});

/* ════════════════════════════════════════════════════════════════════════
   MÅLPRØVER — porten måler seg selv.

   En detektor som stille slutter å se er verre enn ingen detektor: den
   rapporterer «null brudd» og høres ut som en godkjenning. Hver uttrekker
   får derfor en prøve med et kjent utslag og et kjent ikke-utslag, så en
   fremtidig regresjon i selve porten blir RØD i stedet for stille.
   ════════════════════════════════════════════════════════════════════════ */

describe('porten måler seg selv', () => {
  it('bevegelsesdetektoren ser rå ms, rå kurve og rå ease', () => {
    expect(hardkodingerI('transform 200ms ease-out')).toEqual(
      expect.arrayContaining(['200ms', 'ease-out']),
    );
    expect(hardkodingerI('transform .3s cubic-bezier(.2,.7,.2,1)')).toEqual(
      expect.arrayContaining(['.3s', 'cubic-bezier(.2,.7,.2,1)']),
    );
    expect(hardkodingerI('opacity 300MS EASE-OUT'), 'CSS er case-insensitivt — porten må være det også')
      .toEqual(expect.arrayContaining(['300MS', 'EASE-OUT']));
    expect(hardkodingerI('steps(4, end)')).toEqual(['steps(4, end)']);
    /* En rå fallback INNE i var() er like hardkodet som uten. */
    expect(hardkodingerI('transform var(--klp-x, 200ms)')).toContain('200ms');
  });

  it('bevegelsesdetektoren lar rene tokens, bart linear og nuller være i fred', () => {
    expect(hardkodingerI('transform var(--dw-m-step) var(--dw-ease)')).toEqual([]);
    expect(hardkodingerI('opacity var(--dw-m-feedback) linear')).toEqual([]);
    expect(hardkodingerI('linear-gradient(180deg, #fff, #000)')).toEqual([]);
    expect(hardkodingerI('0s'), 'en null er ingen tempobeslutning').toEqual([]);
  });

  it('drapsbryter-unntaket er smalt — ekte bevegelse kan ikke gjemmes i det', () => {
    expect(ER_DRAPSBRYTER.test('transition-duration: .01ms')).toBe(true);
    expect(ER_DRAPSBRYTER.test('animation-duration: 0s !important')).toBe(true);
    for (const lekkasje of ['transition-duration: 1s', 'animation-duration: 0.1s', 'transition-duration: 1ms']) {
      expect(ER_DRAPSBRYTER.test(lekkasje), `«${lekkasje}» slapp gjennom drapsbryter-unntaket`).toBe(false);
    }
  });

  it('klassetellingen er eksakt, ikke substring', () => {
    const prøve = '<li class="kps-slide kps-slide--aktiv"><p class="kps-slide-tittel">x</p></li>';
    expect(tell(prøve, 'kps-slide'), '.kps-slide-tittel telte som et steg').toBe(1);
    expect(tell(prøve, 'kps-swap-row')).toBe(0);
  });

  it('attributt-tellingen og etikettlesingen krever eksakt verdi', () => {
    const prøve =
      '<button data-kps="next"><span>Ne</span>ste</button><button data-kps="next-ish">x</button>';
    expect(tellAttributt(prøve, 'data-kps', 'next'), '«next-ish» telte som «next»').toBe(1);
    expect(tellAttributt(prøve, 'data-kps', 'prev')).toBe(0);
    expect(
      knappetekst(prøve, 'data-kps', 'next'),
      'etiketten leses uten indre markup — ellers skjuler et <span> teksten',
    ).toBe('Neste');
    expect(knappetekst(prøve, 'data-kps', 'mangler')).toBeNull();
  });

  it('«Hopp over»-mønsteret treffer formene, og bare dem', () => {
    for (const form of ['Hopp over', 'hoppOver', 'hopp-over', 'klp-skip', 'aria-label="Skip"']) {
      expect(HOPP_OVER.some((m) => m.test(form)), `«${form}» gikk fri`).toBe(true);
    }
    for (const uskyldig of ['hoppeslott', 'skipper', 'skipLibCheck']) {
      expect(HOPP_OVER.some((m) => m.test(uskyldig)), `«${uskyldig}» ga falskt utslag`).toBe(false);
    }
  });

  it('kommentarstrippingen fjerner prosa, men beholder linjenumre', () => {
    const kilde = '/* «Hopp over» er FJERNET */\nconst a = 1;\n// hopp over\nconst b = 2;';
    const rent = utenKodeKommentar(kilde);
    expect(rent.split('\n').length, 'linjenumrene forskjøv seg').toBe(kilde.split('\n').length);
    expect(HOPP_OVER.some((m) => m.test(rent)), 'porten ville vært rød på sin egen dokumentasjon')
      .toBe(false);
    expect(rent).toContain('const b = 2;');
    expect(utenKodeKommentar('const u = "https://x.no/a";'), 'URL-en ble spist som linjekommentar')
      .toContain('https://x.no/a');
  });

  it('reduksjonsområdene finner blokkgrensene, ikke bare nøkkelordet', () => {
    const css = '.a{color:red}\n@media (prefers-reduced-motion: reduce){\n  .b{transition:none}\n}\n.c{color:blue}';
    const omr = reduksjonsområder(css);
    expect(omr.length).toBe(1);
    const [a, b] = omr[0]!;
    expect(css.slice(a, b + 1)).toContain('.b{transition:none}');
    expect(css.slice(a, b + 1), 'blokken lekket ut i regelen etter').not.toContain('.c');
  });
});

/* ════════════════════════════════════════════════════════════════════════
   5. KVITTERINGEN — hva porten FAKTISK fant.
   Null mål = rødt. En komponent som rendrer ingenting skal ikke kunne
   bestå på fravær.
   ════════════════════════════════════════════════════════════════════════ */

describe('kle på-stepperen — ikke-vakuøsitet', () => {
  it('porten rapporterer hva den målte, og målte noe', () => {
    const rader = LISTER.map((n) => {
      const markup = html(n);
      return {
        plagg: n,
        steg: tell(markup, AVTALT.steg),
        neste: tellAttributt(markup, AVTALT.nesteAttr, AVTALT.nesteVerdi),
        bytt: tell(markup, AVTALT.bytt),
        tegn: markup.length,
        klasser: new Set(klassetokens(markup)).size,
      };
    });

    console.log(
      `\n  KLE PÅ-STEPPEREN — måling ${new Date().toISOString().slice(0, 10)}\n`
      + rader
        .map(
          (r) =>
            `    ${String(r.plagg).padStart(2)} plagg → ${r.steg} steg, `
            + `${r.neste} vei(er) framover, ${r.bytt} bytt-inngang(er), `
            + `${r.klasser} ulike klasser, ${r.tegn} tegn markup`,
        )
        .join('\n')
      + `\n    stilark: ${STILARK.length} fil(er), ${MÅLT.deklarasjoner} bevegelsesdeklarasjon(er), `
      + `${MÅLT.basebevegelse} i basen\n`
      + `    tokens brukt: ${[...MÅLT.tokens].sort().join(', ') || '(ingen)'}\n`,
    );

    /* Gulvene. Hver enkelt er lav med vilje — de skal fange TOMHET, ikke
       diktere design. Men de skal ikke kunne bestås av en komponent som
       returnerer null. */
    for (const r of rader) {
      expect(r.steg, `${r.plagg} plagg ga null steg`).toBeGreaterThanOrEqual(1);
      expect(
        r.tegn,
        `markupen for ${r.plagg} plagg er ${r.tegn} tegn — stepperen rendrer i praksis ingenting`,
      ).toBeGreaterThan(200);
      expect(
        r.klasser,
        `markupen for ${r.plagg} plagg har ${r.klasser} ulike klasser — for tynt til å være et steg `
        + 'med instruksjon, materialpoeng og bytt-inngang',
      ).toBeGreaterThanOrEqual(3);
    }

    const total = rader.reduce((s, r) => s + r.steg, 0);
    expect(total, 'porten fant null steg totalt').toBe(LISTER.reduce((s, n) => s + n, 0));
  });
});
