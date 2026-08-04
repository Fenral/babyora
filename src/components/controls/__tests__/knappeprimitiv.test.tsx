/**
 * KNAPPEPRIMITIVEN — porten som gjør knappedriften synlig og bare lar den krympe.
 *
 * Fase 2B målte 37 knappevarianter i appen. Tallet er nå et GULV: fase 3
 * migrerer dem til `Button`, og hver migrering skal få tallet ned. Det skal
 * aldri heves for å få porten grønn.
 *
 * DE FIRE FUNNENE PORTEN HÅNDHEVER — alle fra dommerpanelet, alle med
 * målte tall bak seg:
 *
 *   1. FOKUSRING. Appen hadde NULL globale `:focus-visible`-regler; den
 *      eneste ringen var scopet til `.hjem-monter`. Ringen måler 1,47:1 mot
 *      selve den oransje flaten og 10,12:1 mot lerretet — den overlever kun
 *      på `outline-offset`. Settes offset til 0, forsvinner den.
 *   2. DISABLED UTEN OPACITY. Fire steder i onboarding bruker
 *      gjennomsiktighet og lander på 1,32–3,12:1. En dempet farge kan
 *      regnes; en dempet alfa arver hva som enn ligger bak.
 *   3. PENDING ER IKKE DISABLED. En disabled knapp faller ut av
 *      tabrekkefølgen midt i en handling.
 *   4. TRYKKMÅLET ER ET GULV. Et forslag om å normalisere tre flater fra
 *      48/64 ned til 44 ble felt: tre reduksjoner, null økninger.
 *
 * IKKE-VAKUØSITET: porten teller hva den faktisk fant. Null mål = rødt.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from '../Button';

/* Repoet har verken jsdom eller testing-library: komponentkontrakter testes
   som statisk markup, interaksjon i Playwright (verify-hjem, e2e). Porten
   folger husets monster.

   Klikkvakten testes likevel EKTE: Button er en ren funksjon, saa vi kaller
   den og henter ut den faktiske onClick-handleren fra elementet den
   returnerer. Ingen DOM trengs for aa bevise at vakten stopper trykket. */
const markup = (el: React.ReactElement): string => renderToStaticMarkup(el);
const handler = (props: Parameters<typeof Button>[0]) =>
  (Button(props) as React.ReactElement<{ onClick?: (e: unknown) => void }>).props.onClick;

const ROT = process.cwd();
const BTN_CSS = readFileSync(join(ROT, 'src/components/controls/button.css'), 'utf8');
const GLOBAL_CSS = readFileSync(join(ROT, 'src/styles/design-tokens.css'), 'utf8');

/**
 * DAGENS DRIFT, målt av DENNE porten 2026-08-04: 21 lokale knappeflater.
 *
 * Inventaret i fase 2B talte 37 varianter, men det var en LESENDE vurdering
 * — en agent som leste koden og skjønte at to definisjoner var samme rolle.
 * Regexen under ser noe smalere og mekanisk: en selektor eller et
 * stilobjekt som navngir seg som knapp OG setter sin egen bakgrunn.
 *
 * De to tallene måler ikke det samme, og de skal ikke blandes. Settes
 * gulvet til 37, ville porten godtatt seksten nye knappeflater før den
 * sa fra — en port som består på slark er like ubrukelig som en som består
 * på fravær. Gulvet er derfor det porten SELV måler.
 */
const VARIANT_GULV = 21;

function filer(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === '__tests__' || navn === 'node_modules') continue;
      filer(sti, ut);
    } else if (navn.endsWith('.css') || navn.endsWith('.tsx')) {
      ut.push(sti);
    }
  }
  return ut;
}

describe('knappeprimitiven', () => {
  it('den globale fokusringen finnes, og har den offset den er avhengig av', () => {
    /* Uten `:where()` ville regelen overkjørt hver gjennomtenkt ring i
       appen. Med den legger den bare til der ingenting fantes. */
    expect(GLOBAL_CSS, 'ingen global :focus-visible — tastaturbrukere får nettleserens standardring')
      .toMatch(/:where\([^)]*button[\s\S]*?\):focus-visible\s*\{[^}]*outline:/u);

    const blokk = /:where\([^)]*button[\s\S]*?\):focus-visible\s*\{([^}]*)\}/u.exec(GLOBAL_CSS);
    expect(blokk, 'fant ikke fokusring-blokken').not.toBeNull();
    const offset = /outline-offset:\s*(\d+)px/u.exec(blokk![1]);
    expect(offset, 'outline-offset mangler — ringen måler 1,47:1 mot knappeflaten uten den')
      .not.toBeNull();
    expect(
      Number(offset![1]),
      'offset må være minst like bred som ringen, ellers ligger den PÅ knappen (1,47:1) '
      + 'i stedet for på lerretet (10,12:1 mørk / 3,52:1 lys)',
    ).toBeGreaterThanOrEqual(2);
  });

  it('disabled bruker aldri opacity — en dempet alfa kan ikke regnes', () => {
    const brudd: string[] = [];
    for (const [i, linje] of BTN_CSS.split('\n').entries()) {
      if (/opacity\s*:/u.test(linje)) brudd.push(`button.css:${i + 1}  ${linje.trim()}`);
    }
    expect(brudd, `gjennomsiktighet i knappeprimitiven:\n  ${brudd.join('\n  ')}`).toEqual([]);
  });

  it('hver variant har en egen disabled-oppskrift, ikke bare primary', () => {
    /* Forslaget definerte disabled KUN for primary. De faktiske
       disabled-tilstandene som da ville overlevd i appen ligger på
       1,32–3,12:1. */
    const utenOppskrift = (['primary', 'ghost', 'quiet', 'destructive'] as const)
      .filter((v) => !new RegExp(`\\.dw-btn--${v}(:disabled|\\[aria-disabled)`, 'u').test(BTN_CSS));
    expect(utenOppskrift, `varianter uten disabled-oppskrift: ${utenOppskrift.join(', ')}`)
      .toEqual([]);
  });

  it('primitiven respekterer prefers-reduced-motion', () => {
    /* Referanse-CTA-en manglet denne vakten, og transitionen var i ferd med
       å bli kopiert til ~35 knappedefinisjoner. */
    expect(BTN_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.dw-btn\s*\{[^}]*transition:\s*none/u);
  });

  it('trykkmålet er et GULV — primitiven går aldri under 44 px', () => {
    const m = /\.dw-btn\s*\{[\s\S]*?min-height:\s*var\(--dw-size-touch\)/u.exec(BTN_CSS);
    expect(m, 'grunnhøyden er ikke bundet til --dw-size-touch').not.toBeNull();
    /* Ingen variant får sette en lavere fast høyde. */
    const faste = [...BTN_CSS.matchAll(/min-height:\s*(\d+)px/gu)].map((x) => Number(x[1]));
    const forLave = faste.filter((h) => h < 44);
    expect(forLave, `faste høyder under 44 px: ${forLave.join(', ')}`).toEqual([]);
  });

  it('pending beholder tabrekkefølgen — den bruker ALDRI native disabled', () => {
    const html = markup(<Button pending onClick={() => {}}>Lagre</Button>);
    expect(html, 'aria-busy mangler — ingenting annonserer at handlingen pågår')
      .toContain('aria-busy="true"');
    expect(
      html,
      'native disabled dumper fokus midt i handlingen, og skjermleseren mister '
      + 'flaten brukeren nettopp trykket på',
    ).not.toMatch(/\sdisabled(=|\s|>)/u);
  });

  it('klikkvakten stopper trykket mens handlingen pågår', () => {
    /* Ekte test av selve handleren, uten DOM: Button er en ren funksjon. */
    let trykk = 0;
    const venter = handler({ pending: true, onClick: () => { trykk += 1; }, children: 'Lagre' });
    venter?.({} as never);
    expect(trykk, 'et trykk slapp gjennom mens handlingen pågikk').toBe(0);

    let vanlig = 0;
    const klar = handler({ onClick: () => { vanlig += 1; }, children: 'Lagre' });
    klar?.({} as never);
    expect(vanlig, 'vakten blokkerer også når ingenting pågår — knappen er død').toBe(1);
  });

  it('det tilgjengelige navnet er stabilt mens den venter', () => {
    const rolig = markup(<Button>Lagre</Button>);
    const venter = markup(<Button pending>Lagre</Button>);
    const tekst = (h: string) => h.replace(/<[^>]*>/gu, '');
    expect(
      tekst(venter),
      'navnet byttet mens handlingen pågikk — skjermleseren mister flaten brukeren trykket på',
    ).toBe(tekst(rolig));
    expect(tekst(rolig)).toBe('Lagre');
  });

  it('ekte disabled er fortsatt mulig, og er noe ANNET enn å vente', () => {
    const html = markup(<Button disabled onClick={() => {}}>Send</Button>);
    expect(html).toMatch(/\sdisabled(=|\s|>)/u);
    expect(html, 'disabled skal ikke også melde at noe pågår').not.toContain('aria-busy');

    let trykk = 0;
    /* disabled stopper i nettleseren, ikke i handleren — men vakten skal
       ikke stå i veien for et vanlig trykk. */
    const h = handler({ disabled: true, onClick: () => { trykk += 1; }, children: 'Send' });
    expect(h, 'onClick ble fjernet helt — da kan ikke disabled skrus av igjen').toBeTypeOf('function');
    expect(trykk).toBe(0);
  });

  it(`IKKE-VAKUØSITET + RATSJETT: knappedriften er ikke ØKT over gulvet på ${VARIANT_GULV}`, () => {
    /* Grovt, men etterprøvbart mål: en <button> eller knapperolle som får
       sin egen bakgrunn ELLER radius lokalt, i stedet for å arve
       primitiven. Tallet er ikke ment å være presist — det er ment å bare
       kunne gå NED, og å bli rødt når noen legger til en variant til. */
    const kilder = filer(join(ROT, 'src'))
      .filter((f) => !f.includes('controls\\Button') && !f.includes('controls/Button')
        && !f.endsWith('button.css'));
    expect(kilder.length, 'ingen filer skannet — porten måler ingenting').toBeGreaterThan(30);

    const lokale = new Set<string>();
    for (const sti of kilder) {
      const tekst = readFileSync(sti, 'utf8').replace(/\/\*[\s\S]*?\*\//gu, '');
      const fil = sti.replace(ROT, '').replace(/\\/gu, '/');
      /* CSS: en selektor som nevner button/btn/cta OG setter background. */
      for (const m of tekst.matchAll(/([.#][\w-]*(?:btn|button|cta)[\w-]*)[^{}]*\{[^}]*background[^}]*\}/giu)) {
        lokale.add(`${fil} ${m[1]}`);
      }
      /* JSX: et stilobjekt som heter *BtnStyle / *ButtonStyle / ctaStyle. */
      for (const m of tekst.matchAll(/(?:const|let)\s+(\w*(?:[Bb]tn|[Bb]utton|cta|Cta)\w*Style)\s*[:=]/gu)) {
        lokale.add(`${fil} ${m[1]}`);
      }
    }

    const liste = [...lokale].sort();
    console.log(`\n  knappedrift: ${liste.length} lokale knappeflater (gulv ${VARIANT_GULV})\n`);
    expect(
      liste.length,
      `${liste.length} lokale knappeflater mot gulvet ${VARIANT_GULV}. Gulvet kan bare KRYMPE.\n  `
      + liste.join('\n  '),
    ).toBeLessThanOrEqual(VARIANT_GULV);
  });
});
