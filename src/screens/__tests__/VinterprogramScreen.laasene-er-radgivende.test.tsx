/**
 * MÅLEPUNKT — «Første vinter»: tidslåsene er rådgivende, og ETT kort lyser.
 *
 * Denne filen er skrevet for å STRYKE på koden som sto her 2026-08-06:
 *
 *  · Fem av seks leksjoner var låst på klokke i opptil 35 dager
 *    («Åpnes om 35 dager»), inkludert den mest sikkerhetsnære (Sjekk nakken,
 *    28 dager). Test 1-4 feiler hvis en tidslås kommer tilbake — enten i
 *    datalaget (en funksjon som svarer «låst»), i tilstandsunionen, i
 *    aktiveringen (en tidlig retur som spiser trykket) eller i pikslene
 *    («Åpnes om …» / aria-disabled i markupen).
 *
 *  · Kort 1 og kort 2 hadde samme fyll (#382817 = --dw-overlay), samme kant
 *    og samme titteltekstfarge (#F1E9DA = --dw-ink-hi). Test 5-7 feiler hvis
 *    hierarkiet flates ut igjen: det uthevede kortet må ha et ANNET fyll enn
 *    de øvrige, de låste må falle et trinn ned i dybderampen, og hengelåsen
 *    må stå i tallsirkelen på dem som faktisk er låst.
 *
 * Målt på ekte markup (renderToStaticMarkup), ikke på kildetekst alene, der
 * det lar seg gjøre — huset har ikke jsdom, så klikk kan ikke simuleres.
 * Aktiveringsveien måles derfor på kilden (test 3) OG på fraværet av
 * aria-disabled i markupen (test 4).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/haptics/system', () => ({
  useHapticSystem: () => ({ fire: () => Promise.resolve() }),
}));
vi.mock('../../hooks/useNativeSettings', () => ({
  useNativeSettings: () => ({ reducedMotion: false }),
}));
vi.mock('../../components/PaywallDialog', () => ({
  PaywallDialog: () => null,
}));

const tilgang = { isPremium: true };
vi.mock('../../lib/premium/use-access', () => ({
  useAccess: () => ({ isPremium: tilgang.isPremium, loading: false }),
}));

const UKE_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimal localStorage så `ensureProgramStart()` kan plasseres i tid. */
function settProgramStart(msSiden: number): void {
  const lager = new Map<string, string>([
    ['babyora:vinterprogram:start', String(Date.now() - msSiden)],
  ]);
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => lager.get(k) ?? null,
    setItem: (k: string, v: string) => { lager.set(k, v); },
    removeItem: (k: string) => { lager.delete(k); },
    clear: () => { lager.clear(); },
    key: () => null,
    length: 0,
  };
}

async function markup(opts: { ukerSidenStart: number; premium: boolean }): Promise<string> {
  settProgramStart(opts.ukerSidenStart * UKE_MS);
  tilgang.isPremium = opts.premium;
  const { VinterprogramScreen } = await import('../VinterprogramScreen');
  return renderToStaticMarkup(
    <VinterprogramScreen onBack={() => {}} onOpenTarget={() => {}} />,
  );
}

function kilde(sti: string): string {
  return readFileSync(resolve(process.cwd(), sti), 'utf8').replace(/\r\n/g, '\n');
}

beforeEach(() => {
  vi.resetModules();
});

describe('Første vinter — ukerytmen er anbefalt tempo, ikke en sperre', () => {
  it('1. datalaget har ingen funksjon som svarer «låst» på klokke', async () => {
    const modul = await import('../../data/vinterprogram');
    const navn = Object.keys(modul);

    // De to gamle drip-portene. Kommer de tilbake, kommer låsen tilbake.
    expect(navn).not.toContain('lessonAvailability');
    expect(navn).not.toContain('openLessonCount');
    expect(navn).toContain('anbefaltUke');

    // Rytmen lever fortsatt — som et tall, ikke som en dør.
    const na = Date.now();
    expect(modul.anbefaltUke(na, na)).toBe(1);
    expect(modul.anbefaltUke(na - 4 * UKE_MS, na)).toBe(5);
    expect(modul.anbefaltUke(na - 40 * UKE_MS, na)).toBe(modul.LESSONS.length);
  });

  it('2. radtilstanden har ingen drip-variant lenger', () => {
    const skjerm = kilde('src/screens/VinterprogramScreen.tsx');

    expect(skjerm).not.toMatch(/kind: 'drip'/u);
    expect(skjerm).not.toMatch(/opensInDays/u);
    expect(skjerm).toMatch(/\|\s*\{ kind: 'anbefalt' \}/u);
    expect(skjerm).toMatch(/\|\s*\{ kind: 'apen'; foran: boolean \}/u);
  });

  it('3. aktiveringen har ingen tidlig retur som spiser trykket', () => {
    const skjerm = kilde('src/screens/VinterprogramScreen.tsx');
    const start = skjerm.indexOf('const handleRowActivate');
    const slutt = skjerm.indexOf('const handleLessonBack');
    const kropp = skjerm.slice(start, slutt);

    expect(start).toBeGreaterThan(-1);
    expect(slutt).toBeGreaterThan(start);
    // Den eneste tillatte tidlige returen er paywallen (en HANDLING), og den
    // returnerer etter å ha åpnet dialogen. En naken `return;` foran den var
    // tidslåsens gren.
    expect(kropp).not.toMatch(/if \(state\.kind === 'drip'\) return/u);
    expect(kropp).toMatch(/setPaywallOpen\(true\);\s*\n\s*return;/u);
  });

  it('4. ingen rad melder seg utilgjengelig — verken i tekst eller i navn', async () => {
    const html = await markup({ ukerSidenStart: 0, premium: true });

    expect(html).not.toMatch(/Åpnes om/u);
    expect(html).not.toMatch(/aria-disabled/u);

    const { LESSONS } = await import('../../data/vinterprogram');
    for (const leksjon of LESSONS) {
      expect(html).toContain(leksjon.title);
    }
    // Uke 6 «Sove ute i vinter» var låst i 35 dager. Den skal nå ha samme
    // aktive tilstand som resten og bære sin anbefaling som tekst.
    expect(html).toMatch(/Anbefalt uke 6/u);
    expect(html).toMatch(/data-tilstand="apen"/u);
  });

  it('5. nøyaktig ETT kort er uthevet, og det har et annet fyll enn de øvrige', async () => {
    const html = await markup({ ukerSidenStart: 2, premium: true });

    const uthevede = html.match(/data-tilstand="anbefalt"/gu) ?? [];
    expect(uthevede).toHaveLength(1);

    // Uke 3 er anbefalt etter to uker — og det er DEN som lyser.
    expect(html).toMatch(/data-tilstand="anbefalt"[^>]*aria-label="Uke 3[^"]*"|aria-label="Uke 3[^"]*"[^>]*data-tilstand="anbefalt"/u);

    // Fyllet er selve mekanismen kritikken gjaldt: kort 1 og 2 hadde samme
    // --dw-overlay. Det uthevede skal ligge på nivå 4 med accent-kant.
    expect(html).toMatch(/background:var\(--dw-accent-surface\)/u);
    expect(html).toMatch(/border:1px solid var\(--dw-accent-300\)/u);
    // …og de øvrige skal fortsatt ligge på nivå 3.
    expect(html).toMatch(/background:var\(--dw-overlay\)/u);
  });

  it('6. tittelen på det uthevede kortet er ink-hi, de øvrige ink-mid — ingen opacity', async () => {
    const html = await markup({ ukerSidenStart: 2, premium: true });

    expect(html).toMatch(/font-weight:700;font-size:15px;line-height:1\.25;color:var\(--dw-ink-hi\)/u);
    expect(html).toMatch(/font-weight:600;font-size:15px;line-height:1\.25;color:var\(--dw-ink-mid\)/u);
    // C5 / opacity-detektoren: dempingen skal ALDRI være alpha.
    expect(html).not.toMatch(/opacity:0?\.\d/u);
  });

  it('7. bare ekte låser (Pluss) får hengelås — og de faller ett trinn i dybderampen', async () => {
    const gratis = await markup({ ukerSidenStart: 6, premium: false });

    // Sju Pluss-rader, én gratis smakebit.
    expect((gratis.match(/data-tilstand="pluss"/gu) ?? [])).toHaveLength(7);
    expect(gratis).toMatch(/Med Babyora Pluss/u);
    expect(gratis).toMatch(/Gratis smakebit/u);
    // Hengelåsen: rect + bøyle. Står i tallsirkelen på de låste radene.
    expect(gratis).toMatch(/<rect x="1" y="6" width="10" height="7" rx="2"/u);
    expect(gratis).toMatch(/background:var\(--dw-raised\)/u);
    expect(gratis).toMatch(/var\(--dw-depth-chip\)/u);

    // Premium-visningen har ingen låser i det hele tatt.
    const premium = await markup({ ukerSidenStart: 6, premium: true });
    expect(premium).not.toMatch(/data-tilstand="pluss"/u);
    expect(premium).not.toMatch(/<rect x="1" y="6"/u);
  });

  /* ─────────────────────────────────────────────────────────────────────
     FUNN 1: listen rant gjennom tab-baren.

     «Sove ute i vinter» lå oppå hus-ikonet for Hjem, og underteksten leste
     «...pnes om 35 dage...» fordi «Å» lå bak hus-ikonet og «r» bak
     kalenderikonet. Mekanismen er bunn-masken, og den er DELT: samme dag
     ble samme feil målt på TOG («Slik kler du på» under baren) og på
     Plaggbiblioteket. Porten måler derfor tokenet, ikke denne ene skjermen
     — og krever at alle tre flatene bruker det.

     Test 10 er ikke-vakuøsitetsprøven: `--dw-fade-bunn`, som sto her da
     funnet ble skrevet, må STRYKE på nøyaktig samme predikat.
     ───────────────────────────────────────────────────────────────────── */

  const TOKENS = () => kilde('src/styles/design-tokens-v2.css');

  /** Ett token-tall, lest ut av kilden så porten aldri måler mot et minne. */
  function tokenPx(navn: string): number {
    const treff = new RegExp(`${navn}:\\s*(\\d+(?:\\.\\d+)?)px`, 'u').exec(TOKENS());
    if (!treff) throw new Error(`Fant ikke ${navn} i design-tokens-v2.css`);
    return Number(treff[1]);
  }

  /** Hele verdien til et gradient-token, med linjeskift normalisert bort. */
  function tokenVerdi(navn: string): string {
    const treff = new RegExp(`${navn}:\\s*(linear-gradient\\([\\s\\S]*?\\)\\s*);`, 'u').exec(TOKENS());
    if (!treff) throw new Error(`Fant ikke ${navn} i design-tokens-v2.css`);
    return treff[1]!.replace(/\s+/gu, ' ').trim();
  }

  /**
   * Hvor mange piksler over containerbunnen et fargestopp ligger, for en gitt
   * containerhøyde. Kaster hvis noe ikke lot seg løse opp — en uløst `var()`
   * skal stoppe porten, ikke gli gjennom som «0».
   */
  function pxOverBunn(stopp: string, H: number): number {
    const s = stopp
      .replaceAll('var(--dw-tabbar-height)', `${tokenPx('--dw-tabbar-height')}px`)
      .replaceAll('var(--dw-tabbar-gap)', `${tokenPx('--dw-tabbar-gap')}px`)
      .replace(/env\(safe-area-inset-bottom,\s*0px\)/gu, '0px')
      .replaceAll('calc', '')
      .replaceAll('100%', String(H))
      .replaceAll('px', '');
    if (!/^[\d\s+\-*/().]+$/u.test(s)) throw new Error(`Uløst uttrykk: «${stopp}» ble «${s}»`);
    return H - (Function(`"use strict"; return (${s});`)() as number);
  }

  /** De to fargestoppene i et to-stopps lineargradient-token. */
  function stopp(navn: string): { ugjennomsiktigTil: string; gjennomsiktigFra: string } {
    const verdi = tokenVerdi(navn);
    const m = /to bottom,\s*black\s+(.+?),\s*transparent\s+(.+?)\s*\)$/u.exec(verdi);
    if (!m) throw new Error(`Klarte ikke lese fargestoppene i ${navn}: ${verdi}`);
    return { ugjennomsiktigTil: m[1]!, gjennomsiktigFra: m[2]! };
  }

  it('8. bunn-masken er helt gjennomsiktig før tab-barens overkant', () => {
    const barensOverkant = tokenPx('--dw-tabbar-height') + tokenPx('--dw-tabbar-gap');
    const { ugjennomsiktigTil, gjennomsiktigFra } = stopp('--dw-fade-over-tabbar');

    // Høydeuavhengig: samme klaring på kort og høy skjerm.
    for (const H of [640, 744, 1024]) {
      expect(pxOverBunn(gjennomsiktigFra, H)).toBe(barensOverkant);
      // Uttoningen skal begynne OVER baren, ikke inne i den.
      expect(pxOverBunn(ugjennomsiktigTil, H)).toBeGreaterThan(barensOverkant);
    }
  });

  it('9. masken er faktisk koblet til rullecontaineren — på alle tre flatene', async () => {
    const html = await markup({ ukerSidenStart: 6, premium: true });
    expect(html).toMatch(/mask-image:var\(--dw-fade-over-tabbar\)/u);
    expect(html).not.toMatch(/mask-image:var\(--dw-fade-bunn\)/u);
    // Klaringen må stå igjen — masken erstatter den ikke.
    expect(html).toMatch(/padding:0 var\(--dw-space-20\) var\(--dw-tabbar-clearance/u);

    // Samme feil ble målt på TOG og Plaggbiblioteket samme dag. Faller en av
    // dem tilbake til --dw-fade-bunn, skal porten si fra her.
    for (const sti of [
      'src/screens/TogGuideScreen.tsx',
      'src/screens/PlaggbibliotekScreen.tsx',
    ]) {
      const src = kilde(sti);
      expect(src, `${sti} må bruke tab-bar-masken`).toContain("maskImage: 'var(--dw-fade-over-tabbar)'");
      expect(src, `${sti} har fortsatt en fade som slutter ved containerbunnen`)
        .not.toContain("maskImage: 'var(--dw-fade-bunn)'");
    }
  });

  it('10. den gamle delte faden STRYKER på samme predikat', () => {
    const barensOverkant = tokenPx('--dw-tabbar-height') + tokenPx('--dw-tabbar-gap');
    const verdi = tokenVerdi('--dw-fade-bunn');
    expect(verdi, '--dw-fade-bunn må fortsatt finnes — ark og dialoger bruker den').toBeTruthy();

    // Den når full gjennomsiktighet først ved containerBUNNEN: 0 px over kanten.
    const m = /transparent\s+(\d+(?:\.\d+)?)%/u.exec(verdi);
    expect(m).toBeTruthy();
    for (const H of [640, 744, 1024]) {
      const gjennomsiktigFra = H - H * (Number(m![1]) / 100);
      expect(gjennomsiktigFra).toBe(0);
      // Dette er selve funnet: 0 px klaring der baren krever 76.
      expect(gjennomsiktigFra).toBeLessThan(barensOverkant);
    }
  });
});
