/**
 * JUSTER — de fire [MINDRE]-funnene fra produksjonsrevisjonen 2026-08-06
 * (docs/design-notes/revisjon-prod-2026-08-06.md), pluss bunn-faden.
 *
 * Repoet har INGEN jsdom (se FinnAntrekkScreen.prefill.test.tsx sin egen
 * hodekommentar), så det som kan måles er (a) markupen fra
 * renderToStaticMarkup, (b) de utregnede inline-stilene, (c) CSS-kilden og
 * (d) tokenverdiene. Alle fire funnene bor i nettopp de fire flatene — det
 * er derfor de er målbare her og ikke bare beskrivbare.
 *
 * DET SOM IKKE MÅLES HER, sagt eksplisitt: selve LINJEBRUDDET i headeren
 * (funn 3) krever en layoutmotor. Porten måler i stedet MEKANISMEN som
 * gjorde bruddet mulig — én streng med fire punktseparerte fakta, satt
 * sammen av tre biter som ingen målte samlet. Skrives den tilbake til én
 * linje, blir porten rød.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FinnAntrekkScreen } from '../FinnAntrekkScreen';
import { ChildrenProvider } from '../../state/children-provider';
import { formatEnDesimal } from '../../components/instrument/instrument-logic';
import { VerticalGauge } from '../../components/instrument/VerticalGauge';
import type { FinnAntrekkPrefill } from '../finn-antrekk-prefill';

function kilde(sti: string): string {
  return readFileSync(resolve(process.cwd(), sti), 'utf8').replace(/\r\n/gu, '\n');
}

const SKJERM = 'src/screens/FinnAntrekkScreen.tsx';
const GAUGE_CSS = 'src/components/instrument/vertical-gauge.css';
const TOKENS = 'src/styles/design-tokens-v2.css';

function tegn(prefill?: FinnAntrekkPrefill): string {
  return renderToStaticMarkup(
    <ChildrenProvider>
      <FinnAntrekkScreen onBack={() => {}} prefill={prefill} />
    </ChildrenProvider>,
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUNN 1 — «0.0 mm/t» med punktum, og unormalt stor luft rundt tegnet
   ═══════════════════════════════════════════════════════════════════════════ */

describe('nedbørsverdien skrives norsk, og skilletegnet har ikke sifferbredde', () => {
  it('IKKE-VAKUØSITET: de to skrivemåtene er faktisk forskjellige', () => {
    /* Uten denne ville portene under bestått selv om `formatEnDesimal` var
       et alias for `toFixed(1)`. */
    expect(formatEnDesimal(0)).toBe('0,0');
    expect(formatEnDesimal(2.5)).toBe('2,5');
    expect((2.5).toFixed(1)).toBe('2.5');
    expect(formatEnDesimal(2.5)).not.toBe((2.5).toFixed(1));
  });

  it('skjermen formaterer nedbør med nb-NO, ikke med toFixed', () => {
    const src = kilde(SKJERM);
    expect(
      /precipMmH\s*\.toFixed\(/u.test(src) || /precipMmH\)\.toFixed\(/u.test(src),
      'toFixed er tilbake på nedbørverdien. Den tar ingen lokalitet og skriver '
      + 'engelsk punktum uansett hvilket språk resten av flaten er på.',
    ).toBe(false);
    expect(src).toContain('localeTagFor(language)');
    expect(src).toContain('minimumFractionDigits: 1, maximumFractionDigits: 1');
    expect(src).toContain('formatDecimal(precipMmH)');
    expect(src).toContain('formatDecimal(scanRows.precipMmH)');
    expect(src).toContain('formatDecimal(weatherBaseline.precipMmH)');
  });

  it('den synlige avlesningen og skjermleserteksten sier begge «0,0»', () => {
    const html = tegn();
    expect(html).toContain('aria-valuetext="0,0 millimeter per time');
    /* Måles på nedbørkolonnens EGEN verdi-avlesning, ikke på hele markupen:
       `height:0.00px` på fyllet er en CSS-lengde, ikke en avlesning. */
    const verdier = [...html.matchAll(/<p class="fa-gauge-value"[^>]*>(.*?)<\/p>/gu)]
      .map((m) => m[1]!);
    expect(verdier, 'fant ikke de tre avlesningene').toHaveLength(3);
    expect(verdier[2]).toBe('0<span class="fa-gauge-desimal">,</span>0 mm/t');
    for (const v of verdier) {
      expect(v, `avlesningen «${v}» bruker engelsk desimalskille`).not.toMatch(/\d\.\d/u);
    }
  });

  it('skilletegnet står i sitt eget element, så tabular-nums ikke gir det sifferbredde', () => {
    const html = tegn();
    expect(
      html,
      'kommaet er ikke skilt ut. Da arver det `tabular-nums` fra '
      + '.fa-gauge-value, og Schibsted Grotesk bytter det til comma.tf — '
      + '1300 av 2048 upm, samme bredde som et siffer. Det er «0 . 0».',
    ).toContain('<span class="fa-gauge-desimal">,</span>');
  });

  it('CSS-en holder SIFRENE tabulære og bare skilletegnet proporsjonalt', () => {
    const css = kilde(GAUGE_CSS);
    const verdi = /\.fa-gauge-value\s*\{([^}]*)\}/u.exec(css);
    const desimal = /\.fa-gauge-desimal\s*\{([^}]*)\}/u.exec(css);
    expect(verdi, 'fant ikke .fa-gauge-value — porten måler ingenting').not.toBeNull();
    expect(desimal, 'fant ikke .fa-gauge-desimal — unntaket for skilletegnet er borte').not.toBeNull();
    expect(
      verdi![1],
      'tabular-nums er fjernet fra sifrene. Da hopper verdien sidelengs mens '
      + 'brukeren drar (zero 1252 mot one 703 i fonten) — feil kur på riktig funn.',
    ).toMatch(/font-variant-numeric:\s*tabular-nums/u);
    expect(desimal![1]).toMatch(/font-variant-numeric:\s*normal/u);
  });

  it('IKKE-VAKUØSITET: en etikett UTEN desimaler får ikke noe ekstra element', () => {
    /* Vind skrives «3 m/s». Deler oppdelingen på noe annet enn skilletegnet,
       ville den lagt inn et tomt span også her — og porten over ville
       bestått på et span som alltid finnes. */
    const felles = {
      label: 'Vind', min: 0, max: 15, step: 1, value: 3, onChange: () => {},
      ariaLabel: 'Vindstyrke', ariaValueText: '3 meter per sekund',
      minLabel: '0', maxLabel: '15 m/s',
      fillBottomColor: 'var(--dw-panel)', fillTopColor: 'var(--dw-w-clear)',
      incrementLabel: 'Sterkere vind', decrementLabel: 'Svakere vind',
    };
    const utenDesimal = renderToStaticMarkup(
      <VerticalGauge {...felles} valueLabel="3 m/s" />,
    );
    const medDesimal = renderToStaticMarkup(
      <VerticalGauge {...felles} valueLabel="0,0 mm/t" />,
    );
    expect(utenDesimal).toContain('<p class="fa-gauge-value" aria-hidden="true">3 m/s</p>');
    expect(utenDesimal).not.toContain('fa-gauge-desimal');
    expect(medDesimal).toContain('fa-gauge-desimal');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   FUNN 2 — valgt segment i AKTIVITET bæres nesten bare av skriftvekt

   Porten REGNER kontrasten ut av tokenverdiene i design-tokens-v2.css, i
   begge temaer. Den leser ikke etter et bestemt tokennavn: bytter noen til
   en annen flate som faktisk er lys nok, består porten. Bytter noen tilbake
   til en flate som ikke er det, blir den rød med tallet i meldingen.
   ═══════════════════════════════════════════════════════════════════════════ */

function relativLuminans(hex: string): number {
  const kanal = (i: number): number => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(0) + 0.7152 * kanal(1) + 0.0722 * kanal(2);
}

function kontrast(a: string, b: string): number {
  const [hi, lo] = [relativLuminans(a), relativLuminans(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Tokennavnet i `background: 'var(--dw-…)'` innenfor en navngitt stilblokk. */
function flateTokenI(src: string, fra: string, til: string, egenskap: string): string {
  const blokk = src.slice(src.indexOf(fra), src.indexOf(til));
  expect(blokk.length, `fant ikke blokken ${fra}`).toBeGreaterThan(0);
  const m = new RegExp(`${egenskap}[^\\n]*var\\((--dw-[\\w-]+)\\)`, 'u').exec(blokk);
  expect(m, `${fra} setter ikke ${egenskap} til et --dw-token`).not.toBeNull();
  return m![1]!;
}

describe('det valgte aktivitetssegmentet kan avleses uten å lese ordene', () => {
  const css = kilde(TOKENS);
  const src = kilde(SKJERM);

  /* PORTEN LESER HVILKE TOKENS SKJERMEN FAKTISK BRUKER, og regner kontrasten
     på NØYAKTIG dem. Den er derfor ikke bundet til ett bestemt tokennavn:
     bytter noen til en annen flate som er lys nok, består den; bytter noen
     tilbake til en som ikke er det, blir den rød med tallet i meldingen. */
  const sporToken = flateTokenI(src, 'const activityRowStyle', 'function activityPillStyle', 'background');
  const plateToken = flateTokenI(src, 'function activityPillStyle', 'function activityButtonStyle', 'background');
  const tekstToken = flateTokenI(src, 'function activityButtonStyle', '/* ---- OUTPUT-header', 'color: active \\?');

  const tokenVerdier = (navn: string): string[] =>
    [...css.matchAll(new RegExp(`${navn}:\\s*(#[0-9A-Fa-f]{6})`, 'gu'))].map((m) => m[1]!.toUpperCase());

  const verdi = (navn: string, lys: boolean): string => {
    const v = tokenVerdier(navn);
    expect(v.length, `${navn} har ingen hex-verdi i tokenfilen`).toBeGreaterThan(0);
    return lys ? v.at(-1)! : v[0]!;
  };

  const temaer = [false, true].map((lys) => ({
    navn: lys ? 'lys' : 'mørk',
    spor: verdi(sporToken, lys),
    gammel: verdi('--dw-overlay', lys),
    plate: verdi(plateToken, lys),
    tekst: verdi(tekstToken, lys),
  }));

  it('IKKE-VAKUØSITET: porten leste faktisk to forskjellige temaer ut av tokenfilen', () => {
    expect(tokenVerdier('--dw-raised').length).toBeGreaterThan(1);
    expect(temaer[0]!.spor).not.toBe(temaer[1]!.spor);
    expect(temaer[0]!.plate).not.toBe(temaer[1]!.plate);
  });

  it('IKKE-VAKUØSITET: den gamle flaten ville falt — 1,13:1 mørk og 1,00:1 lys', () => {
    /* Uten dette kunne terskelen under vært satt så lavt at også det
       opprinnelige funnet bestod. Merk lys modus: --dw-overlay og
       --dw-raised er NØYAKTIG samme verdi der, altså ingen flate i det hele
       tatt bak det valgte segmentet. */
    for (const t of temaer) {
      expect(kontrast(t.gammel, t.spor), `${t.navn}: gammel pille mot spor`).toBeLessThan(1.2);
    }
    expect(kontrast(temaer[1]!.gammel, temaer[1]!.spor)).toBeCloseTo(1, 5);
  });

  for (const t of temaer) {
    it(`${t.navn} modus: den valgte platen skiller seg minst 3:1 fra sporet`, () => {
      const m = kontrast(t.plate, t.spor);
      expect(
        m,
        `Valgt segment måler ${m.toFixed(2)}:1 mot sporet i ${t.navn} modus. `
        + 'Under 3:1 må forelderen sammenligne skriftvekt på to ord for å se '
        + 'hvilken aktivitet som er på — og «Utenfor vogn» mot «I vogn» '
        + 'endrer anbefalingen vesentlig.',
      ).toBeGreaterThanOrEqual(3);
    });

    it(`${t.navn} modus: etiketten på den valgte platen leses (≥ 4,5:1)`, () => {
      const m = kontrast(t.tekst, t.plate);
      expect(m, `tekst på valgt plate måler ${m.toFixed(2)}:1 i ${t.navn} modus`)
        .toBeGreaterThanOrEqual(4.5);
    });
  }

  it('IKKE-VAKUØSITET: porten fant tre EGNE tokens i skjermen og løste hver av dem', () => {
    /* Ikke hvilke navn — at det er tre forskjellige, at de kommer fra
       skjermens egne stilblokker, og at hver av dem finnes i tokenfilen.
       Peker to av dem på samme flate, er valget usynlig per definisjon. */
    expect(new Set([sporToken, plateToken, tekstToken]).size).toBe(3);
    for (const t of [sporToken, plateToken, tekstToken]) {
      expect(t, 'tokennavnet ble ikke lest fra skjermen').toMatch(/^--dw-[\w-]+$/u);
      expect(verdi(t, false), `${t} har ingen mørk verdi`).toMatch(/^#[0-9A-F]{6}$/u);
    }
  });

  it('valget er ikke lenger BÆRET av skriftvekten alene — men vekten står igjen som forsterkning', () => {
    const html = tegn();
    /* Begge signalene skal finnes samtidig: platen (flaten) og vekten. */
    expect(html).toContain('var(--dw-ink-hi)');
    expect(html).toMatch(/font-weight:700/u);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   FUNN 3 — undertittelen brakk over tre linjer
   ═══════════════════════════════════════════════════════════════════════════ */

describe('headeren er to linjer med hvert sitt ansvar', () => {
  /** Avsnittene i headerens tekstkolonne, i rekkefølge: [tittel, hvem, hvor/når]. */
  function headerAvsnitt(html: string): string[] {
    const start = html.indexOf('<div style="flex:1;min-width:0">');
    expect(start, 'fant ikke headerens tekstkolonne').toBeGreaterThan(-1);
    const slutt = html.indexOf('</header>', start);
    return [...html.slice(start, slutt).matchAll(/<p [^>]*>(.*?)<\/p>/gu)].map((m) => m[1]!);
  }

  const medSted = (placeLabel: string): FinnAntrekkPrefill => ({
    tempC: -4, windMs: 3, precipMmH: 0, activity: 'utelek', placeLabel,
  });
  // Nøyaktig formen Hjem sender (HjemScreen.tsx:414 setter stedsmodus foran byen).
  const FAST = medSted('Fast sted · Trondheim');

  it('tre avsnitt: tittel, HVEM og HVOR/NÅR — ikke én firedelt streng', () => {
    const avsnitt = headerAvsnitt(tegn(FAST));
    expect(
      avsnitt,
      'headeren har ikke tre avsnitt. Undertittelen var før ÉN streng med '
      + 'fire punktseparerte fakta, og brakk over tre linjer med «været nå» '
      + 'alene på den siste.',
    ).toHaveLength(3);
    expect(avsnitt[0]).toBe('Juster');
    /* ChildrenProvider er tom i Node (children-store guarder på `window`), så
       barnet heter «barnet» og har ingen alder å vise. */
    expect(avsnitt[1]).toBe('barnet');
    expect(avsnitt[2]).toBe('Trondheim · været nå');
  });

  it('høyst ETT skilletegn per linje', () => {
    for (const linje of headerAvsnitt(tegn(FAST))) {
      expect(
        (linje.match(/·/gu) ?? []).length,
        `«${linje}» har mer enn ett skilletegn. Flere uavhengige fakta i én `
        + 'linje er nettopp det som gjorde lengden til et sammentreff.',
      ).toBeLessThanOrEqual(1);
    }
  });

  it('IKKE-VAKUØSITET: den gamle strengen hadde tre skilletegn og finnes ikke lenger', () => {
    const gammel = `barnet · ${FAST.placeLabel} · basert på været nå`;
    expect((gammel.match(/·/gu) ?? []).length).toBe(3);
    const html = tegn(FAST);
    expect(html).not.toContain(gammel);
    expect(html).not.toContain('basert på været nå');
    expect(html, 'stedsmodusen står fortsatt i headeren').not.toContain('Fast sted');
  });

  it('stedsmodusen strippes uansett hvilken av de to Hjem sender', () => {
    expect(headerAvsnitt(tegn(medSted('Nåværende sted · Trondheim')))[2])
      .toBe('Trondheim · været nå');
    // Et sted uten modus-prefiks skal stå urørt.
    expect(headerAvsnitt(tegn(medSted('Trondheim')))[2]).toBe('Trondheim · været nå');
  });

  it('uten sted faller linje to tilbake på tidspunktet alene', () => {
    expect(headerAvsnitt(tegn())).toEqual(['Finn antrekk', 'barnet', 'Været nå']);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   BUNN-FADEN — skjermen ruller under den flytende tab-baren
   ═══════════════════════════════════════════════════════════════════════════ */

describe('rulleflaten toner ut der tab-baren begynner, ikke ved containerbunnen', () => {
  it('skjermen bruker --dw-fade-over-tabbar på begge maske-egenskapene', () => {
    const src = kilde(SKJERM);
    expect(src).toContain("WebkitMaskImage: 'var(--dw-fade-over-tabbar)'");
    expect(src).toContain("maskImage: 'var(--dw-fade-over-tabbar)'");
    expect(
      /Mask-?[Ii]mage:\s*'var\(--dw-fade-bunn\)'/u.test(src),
      '--dw-fade-bunn er tilbake. Den når full gjennomsiktighet først ved '
      + 'containerBUNNEN — 0 px over kanten — mens tab-baren flyter ~76 px '
      + 'lenger opp med en gjennomskinnelig flate.',
    ).toBe(false);
  });

  it('den prefiksede varianten står FØRST, ellers er faden død i WKWebView', () => {
    const src = kilde(SKJERM);
    expect(src.indexOf('WebkitMaskImage')).toBeLessThan(src.indexOf('maskImage:'));
  });

  it('IKKE-VAKUØSITET: de to tokenene er reelt forskjellige — det ene kjenner baren', () => {
    const css = kilde(TOKENS);
    const bunn = /--dw-fade-bunn:\s*([^;]*);/u.exec(css);
    const overBar = /--dw-fade-over-tabbar:\s*([^;]*);/su.exec(css);
    expect(bunn, 'fant ikke --dw-fade-bunn').not.toBeNull();
    expect(overBar, 'fant ikke --dw-fade-over-tabbar').not.toBeNull();
    expect(bunn![1]).not.toContain('--dw-tabbar-height');
    expect(
      overBar![1],
      'over-tabbar-faden regner ikke lenger ut stoppet fra barens egne mål — '
      + 'da er den bare enda et hardkodet tall som kan drifte fra baren.',
    ).toContain('--dw-tabbar-height');
  });

  it('klaringen i hvile står fortsatt — de to er ulike skruer', () => {
    const src = kilde(SKJERM);
    expect(src).toContain("paddingBottom: 'calc(32px + var(--dw-tabbar-clearance, 90px))'");
  });
});
