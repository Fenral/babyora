/**
 * MÅLEPUNKT for de seks [MINDRE]-funnene mot Innstillinger i
 * `docs/design-notes/revisjon-prod-2026-08-06.md`.
 *
 * Repoet har ingen jsdom. InnstillingerScreen rendrer likevel HELT gjennom
 * `renderToStaticMarkup` i Node, så testene under måler den faktiske
 * markupen — ikke kildestrenger. Det som IKKE kan måles i markup (mekanismen
 * bak et funn, f.eks. en global CSS-regel eller en tokenverdi) leses fra de
 * delte stilfilene og asserteres eksplisitt, slik at en test aldri hviler på
 * fravær alene.
 *
 * FIKSTUR: skjermen seedes med demo-barnet Lillian (Trondheim, 03.10.2025) —
 * nøyaktig barnet revisjonens skjermbilde viser. Uten et aktivt barn er
 * `childCity === '—'`, og «Trondheim står tre ganger»-testen ville vært
 * vakuøs: den ville bestått fordi stedet ikke fantes, ikke fordi det er
 * ryddet. `isDemoMode()` leser `window.location.search`, så et minimalt
 * window settes for renderingen og fjernes etterpå.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InnstillingerScreen } from '../InnstillingerScreen';
import { ChildrenProvider } from '../../state/children-provider';
import i18n from '../../i18n';

const FIKSTURBY = 'Trondheim';

function kilde(sti: string): string {
  return readFileSync(resolve(process.cwd(), sti), 'utf8');
}

function settOppVindu(): void {
  const lager = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    location: { search: '?seed' },
    localStorage: {
      getItem: (k: string) => lager.get(k) ?? null,
      setItem: (k: string, v: string) => void lager.set(k, v),
      removeItem: (k: string) => void lager.delete(k),
    },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

let html = '';

beforeAll(async () => {
  settOppVindu();
  await i18n.changeLanguage('no');
  html = renderToStaticMarkup(
    <ChildrenProvider>
      <InnstillingerScreen onNavigate={() => {}} onOpenTool={() => {}} />
    </ChildrenProvider>,
  );
});

afterAll(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

/** Flaten forelderen faktisk ser når skjermen åpnes — alt før første
 *  <dialog>. Skjermen mounter fjorten dialoger som ligger lukket i markupen;
 *  teller man dem med, måler man tekst ingen ser. */
function hvileflaten(): string {
  const d = html.indexOf('<dialog');
  expect(d, 'fant ingen <dialog> — hvileflaten kan ikke avgrenses').toBeGreaterThan(0);
  return html.slice(0, d);
}

/** Inline-style-strengen på elementet som bærer et gitt attributt-treff. */
function stilFor(treff: string): string {
  const i = html.indexOf(treff);
  expect(i, `fant ikke elementet «${treff}» i markupen`).toBeGreaterThan(-1);
  const start = html.lastIndexOf('<', i);
  const slutt = html.indexOf('>', i);
  const tag = html.slice(start, slutt);
  const m = /style="([^"]*)"/u.exec(tag);
  expect(m, `elementet «${treff}» har ingen inline style`).not.toBeNull();
  return m![1];
}

function px(stil: string, egenskap: string): number {
  const m = new RegExp(`(?:^|;)${egenskap}:(\\d+(?:\\.\\d+)?)px`, 'u').exec(stil);
  expect(m, `fant ikke ${egenskap} i «${stil}»`).not.toBeNull();
  return Number(m![1]);
}

describe('Innstillinger — revisjon 2026-08-06 ([MINDRE])', () => {
  it('fiksturet er ekte: demo-barnet er aktivt, ellers måler resten av filen tomrom', () => {
    expect(html.length).toBeGreaterThan(10_000);
    expect(html, 'demo-barnet ble ikke seedet — hele suiten under ville vært vakuøs')
      .toContain('Avatar: Lillian');
  });

  it('bryteren er en pille, ikke en sirkel — og trykkflaten er ikke sporet', () => {
    /* MEKANISMEN: design-tokens.css gir ALLE <button> `min-height: 44px`.
       En `height: 28` i inline-style kan ikke slå den — min-height klemmer
       høyden opp — så da sporet lå PÅ knappen ble det 46 × 44 = sirkel.
       Beviset på at mekanismen fortsatt er levende hører hjemme her: uten
       den er skillet mellom trykkflate og spor bare pynt. */
    const globalKnapp = kilde('src/styles/design-tokens.css');
    const knappRegel = /(?:^|\n)button\s*\{([\s\S]*?)\}/u.exec(globalKnapp);
    expect(knappRegel, 'fant ikke den globale button-regelen').not.toBeNull();
    expect(knappRegel![1], 'det globale 44 px-gulvet er borte — les kommentaren i TogglePill')
      .toMatch(/min-height:\s*44px/u);

    const knapp = stilFor('role="switch"');
    expect(px(knapp, 'min-height'), 'trykkmålet er under WCAG-gulvet').toBeGreaterThanOrEqual(44);
    expect(knapp, 'knappen er blitt den synlige flaten igjen — da klemmer 44 px-gulvet den rund')
      .toContain('background:transparent');
    expect(knapp, 'knappen har fått pilleform — sporet skal være et eget element')
      .not.toMatch(/border-radius/u);

    // Sporet: et <span> rett etter knappen, uten globalt høydegulv over seg.
    const etterKnapp = html.slice(html.indexOf('role="switch"'));
    const spor = /<span aria-hidden="true" style="([^"]*)"/u.exec(etterKnapp);
    expect(spor, 'fant ikke spor-elementet inne i bryteren').not.toBeNull();
    const sporStil = spor![1];
    const bredde = px(sporStil, 'width');
    const hoyde = px(sporStil, 'height');
    expect(sporStil).toMatch(/border-radius:999px/u);
    expect(
      bredde / hoyde,
      `sporet måler ${bredde}×${hoyde} = ${(bredde / hoyde).toFixed(2)}× — under 1,7 leses det ikke som en skinne med to endestillinger`,
    ).toBeGreaterThanOrEqual(1.7);

    // Knotten skal fylle sporet i høyden (~85 %), ikke svømme i det.
    const knott = /<span aria-hidden="true" style="[^"]*"><span aria-hidden="true" style="([^"]*)"/u.exec(etterKnapp);
    expect(knott, 'fant ikke knotten inne i sporet').not.toBeNull();
    const knottHoyde = px(knott![1], 'height');
    expect(knottHoyde / hoyde, 'knotten er for liten i forhold til sporet').toBeGreaterThanOrEqual(0.8);
  });

  it('stedet står ÉN gang på hvileflaten — «Sted»-raden er eneste kilde', () => {
    const flate = hvileflaten();
    const tekstnoder = flate.split(`>${FIKSTURBY}<`).length - 1;
    // Ikke-vakuøsitet: stedet SKAL stå der, én gang — og raden som eier det
    // skal være «Sted»-raden, ikke en pille i headeren eller barnekortet.
    expect(tekstnoder, `«${FIKSTURBY}» står ${tekstnoder} ganger på hvileflaten`).toBe(1);
    expect(flate, '«Sted»-raden er borte — da måler tellingen over ingenting')
      .toContain(`aria-label="Sted — ${FIKSTURBY}"`);
    // Stedspillen i headeren hadde sin egen aria-label uten tankestrek.
    expect(flate, 'stedspillen er tilbake i headeren').not.toContain(`aria-label="Sted ${FIKSTURBY}"`);
  });

  it('barnekortets metalinje kan ikke ende på et hengende skilletegn', () => {
    const i = html.indexOf('Aktiv barn-profil');
    const meta = html.slice(i, i + 1600);
    const prikk = /<span style="width:3px;height:3px;[^"]*" aria-hidden="true"><\/span>/u;
    // Ikke-vakuøsitet: det FINNES et skilletegn i linja — ellers dømmer
    // testen en linje uten separatorer og består på tomhet.
    expect(prikk.test(meta), 'ingen skilletegn i metalinja — testen måler ingenting').toBe(true);
    // Skilletegnet ligger FORAN sitt eget ledd. Lå det bak, ville mønsteret
    // «prikk, så slutt på ledd-wrapperen» finnes — og det er nøyaktig den
    // formen som ble stående alene ytterst på linje 1 når linja brakk.
    const prikkSistIWrapper = new RegExp(`${prikk.source}</span>`, 'u');
    expect(prikkSistIWrapper.test(meta), 'skilletegnet ligger bak sitt ledd igjen og kan bli hengende')
      .toBe(false);
  });

  it('undertittelen på «Referansetime» har ingen bindestrek å brekke i', () => {
    const flate = hvileflaten();
    expect(flate, 'Referansetime-raden finnes ikke').toContain('>Referansetime<');
    expect(flate).toContain('Klokkeslettet hjemskjermen viser');
    expect(flate, 'den orddelte varianten er tilbake').not.toContain('hjem-skjerm');
  });

  it('«Bytt barn» bruker to motsatt rettede piler, ikke en tilbake-/angrepil', () => {
    const i = html.indexOf('aria-label="Bytt barn');
    expect(i, 'fant ikke «Bytt barn»-raden').toBeGreaterThan(-1);
    const rad = html.slice(i, i + 700);
    expect(rad, 'raden har ikke lenger noe ikon').toContain('<svg');
    // Pilhode mot høyre på øvre linje OG pilhode mot venstre på nedre.
    expect(rad, 'pilen mot høyre mangler').toContain('M12 3l3 3-3 3');
    expect(rad, 'pilen mot venstre mangler').toContain('M6 9l-3 3 3 3');
    // Den gamle formen: ETT pilhode + en bue som svinger tilbake.
    expect(rad, 'angre-/tilbakepilen er tilbake').not.toContain('a3 3 0 010 6');
  });

  it('bunn-faden dimmer bare de siste 28 px, og henter IKKE tab-bar-masken', () => {
    /* FASIT FØR DOM: denne containeren slutter ALLEREDE over tab-baren, fordi
       rootStyle bærer --dw-tabbar-clearance som paddingBottom. Derfor er
       --dw-fade-over-tabbar (som legger uttoningen 76 px over containerbunnen)
       feil verktøy her — den ville flyttet dimmingen enda lenger opp. Begge
       premissene asserteres, ellers er valget under bare en påstand. */
    const innst = kilde('src/screens/InnstillingerScreen.tsx');
    expect(innst, 'skjermen har mistet tab-bar-klaringen — da endres regnestykket')
      .toMatch(/paddingBottom:\s*'var\(--dw-tabbar-clearance/u);
    const tokens = kilde('src/styles/design-tokens-v2.css');
    expect(tokens, '--dw-fade-bunn er ikke lenger prosentbasert — funnets årsak er endret')
      .toMatch(/--dw-fade-bunn:\s*linear-gradient\(to bottom, black 92%/u);

    /* Dommen gjelder KUN hovedrulle-containeren. Skjermens ark og dialoger
       bruker fortsatt --dw-fade-bunn med rette — de har ingenting under seg —
       og en test som forbød tokenet i hele markupen ville dømt dem også. */
    const container = /style="([^"]*overflow-y:auto[^"]*)"/u.exec(hvileflaten());
    expect(container, 'fant ingen rulle-container på hvileflaten').not.toBeNull();
    const stil = container![1];
    expect(stil, 'containeren er ikke lenger skjermens hovedrulleflate').toContain('flex:1');
    expect(stil, '-webkit-prefikset mangler — masken er død i WKWebView (Capacitor)')
      .toContain('-webkit-mask-image:var(--dw-fade-bunn-kort)');
    expect(stil, 'prosent-faden er tilbake — den dimmer ~50 px ekte innhold i hvile')
      .not.toContain('var(--dw-fade-bunn)');
    expect(stil, 'tab-bar-masken er tatt i bruk på en container som allerede klarerer baren')
      .not.toContain('var(--dw-fade-over-tabbar)');
  });
});
