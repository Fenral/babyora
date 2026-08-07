/**
 * VARM ELLER KALD — «ETT AKSENTANSVAR PER SKJERM».
 *
 * Kilde: docs/design-notes/revisjon-prod-2026-08-06.md, [MINDRE] «Oransje
 * CTA-farge brukes på BEHOLD i Perfekt-raden» og [MINDRE] «Snøfnugg-ikonet
 * for For kald er asymmetrisk».
 *
 * Repoet har INGEN jsdom, så porten renderer med `renderToStaticMarkup` og
 * måler på markup + SVG-geometri — samme mønster som
 * UkeScreen.dagslinjen.test.tsx.
 *
 * ═══ HVA PORTENE FAKTISK MÅLER ═══════════════════════════════════════════
 *
 * 1. AKSENTEN. Ikke «actionColor er borte» — den formuleringen ville stått
 *    seg mot en ny variabel med et annet navn. Porten TELLER hvor mange
 *    elementer i markupen som maler noe i --dw-accent, og krever at det er
 *    nøyaktig ett: «Ferdig»-knappens bakgrunn. Nakke-orben i helten er
 *    unntaket som er begrunnet i skjermen (den peker på HANDLINGEN «kjenn
 *    her») og telles for seg, slik at porten sier fra hvis den blir til to.
 *
 * 2. SNØFNUGGET. Porten regner ut geometrien: den plukker hvert
 *    koordinatpar ut av de seks gren-pathene, speiler punktmengden om
 *    x = 12 og om y = 12, og krever at speilbildet er den samme mengden.
 *    Den gamle ikonet hadde grener BARE på den loddrette aksen; da er
 *    mengden ikke symmetrisk om y = 12 kombinert med armdekning, og
 *    dekningstesten under (én gren-path per arm) feiler direkte.
 *    Porten ville ikke godtatt at man bare la til to streker til på
 *    samme akse.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/haptics/system', () => ({
  useHapticSystem: () => ({ fire: () => Promise.resolve() }),
}));

vi.mock('../../hooks/useNativeSettings', () => ({
  useNativeSettings: () => ({ reducedMotion: false }),
}));

async function render(): Promise<string> {
  const { VarmEllerKaldScreen } = await import('../VarmEllerKaldScreen');
  return renderToStaticMarkup(<VarmEllerKaldScreen onBack={() => {}} />);
}

describe('Varm eller kald — oransje er brukerhandling, ikke statusdata', () => {
  it('maler --dw-accent på nøyaktig én flate: «Ferdig»-knappen', async () => {
    const html = await render();

    // Alle style="..."-blokker som nevner --dw-accent (og ikke bare
    // --dw-accent-surface, som er en dempet bakgrunnstone).
    const accentBrukere = [...html.matchAll(/style="([^"]*)"/g)]
      .map((m) => m[1])
      .filter((s) => /var\(--dw-accent\)/.test(s));

    expect(
      accentBrukere.length,
      'Fant ' +
        accentBrukere.length +
        ' elementer med --dw-accent:\n' +
        accentBrukere.join('\n---\n') +
        '\nDESIGN.md: ett aksentansvar per skjerm. Her er handlingen «Ferdig».',
    ).toBe(1);

    // …og den ene er CTA-ens bakgrunn, ikke en tekstfarge et sted i lista.
    expect(accentBrukere[0]).toMatch(/background:\s*var\(--dw-accent\)/);
  });

  it('gir aksenten til nøyaktig ett SVG-fyll til: nakke-orben, som peker på handlingen', async () => {
    const html = await render();
    // Orben er `fill="var(--dw-accent)"` (attributt, ikke inline stil) og
    // telles derfor for seg. Den markerer HVOR forelderen skal kjenne — en
    // handling, ikke en status. Blir den til to, skal porten si fra.
    const fyll = html.match(/fill="var\(--dw-accent\)"/g) ?? [];
    expect(fyll.length).toBe(1);
  });

  it('gir de tre handlingsetikettene identisk vekt', async () => {
    const html = await render();

    // Etikettene står i markupen med kildens små bokstaver
    // (WARM_COLD_RECOVERY_COPY); versalene er text-transform.
    const etiketter = ['Ta av', 'Behold', 'Legg til'].map((tekst) => {
      const idx = html.indexOf(`>${tekst}<`);
      expect(idx, `fant ikke etiketten «${tekst}»`).toBeGreaterThan(-1);
      const foran = html.slice(0, idx);
      const start = foran.lastIndexOf('style="') + 7;
      return foran.slice(start, foran.indexOf('"', start));
    });

    // Nøyaktig samme stil på alle tre — ingen kan skille seg ut igjen, i
    // farge eller i form.
    expect(new Set(etiketter).size, 'De tre etikettene har ulik stil:\n' + etiketter.join('\n---\n')).toBe(1);
    expect(etiketter[0]).toContain('color:var(--dw-ink-mid)');
  });

  it('beholder fargekodingen varm/perfekt/kald andre steder i raden', async () => {
    const html = await render();
    // Prikk + ikon bærer semantikken. Forsvinner de, er porten over ikke
    // lenger en forbedring men et tap.
    for (const token of ['--dw-danger', '--dw-success', '--dw-warning']) {
      expect(html, `${token} skal fortsatt fargelegge prikk + ikon`).toContain(token);
    }
  });
});

describe('Varm eller kald — snøfnugget må ha seks like armer', () => {
  /** De seks armspissene, 60° fra hverandre, radius 9 fra sentrum (12,12). */
  const SPISSER = [
    [12, 3],
    [19.8, 7.5],
    [19.8, 16.5],
    [12, 21],
    [4.2, 16.5],
    [4.2, 7.5],
  ] as const;

  /** Alle absolutte punkter i en <path d="...">, med relative segmenter løst opp. */
  function punkter(d: string): Array<[number, number]> {
    const ut: Array<[number, number]> = [];
    let x = 0;
    let y = 0;
    const tokens = d.match(/[MmLlVvHh][^MmLlVvHhZz]*/g) ?? [];
    for (const t of tokens) {
      const cmd = t[0];
      const tall = (t.slice(1).match(/-?\d*\.?\d+/g) ?? []).map(Number);
      if (cmd === 'V' || cmd === 'v') {
        for (const n of tall) {
          y = cmd === 'V' ? n : y + n;
          ut.push([x, y]);
        }
        continue;
      }
      if (cmd === 'H' || cmd === 'h') {
        for (const n of tall) {
          x = cmd === 'H' ? n : x + n;
          ut.push([x, y]);
        }
        continue;
      }
      for (let i = 0; i + 1 < tall.length; i += 2) {
        const rel = cmd === cmd.toLowerCase();
        x = rel ? x + tall[i] : tall[i];
        y = rel ? y + tall[i + 1] : tall[i + 1];
        ut.push([x, y]);
      }
    }
    return ut;
  }

  /** Path-ene i «For kald»-ikonet, hentet ut av den rendrede markupen. */
  async function kuldeIkonPaths(): Promise<string[]> {
    const html = await render();
    // Raden er merket med sin egen aria-label. Rekkefølgen inne i raden er
    // tallsirkel → ikon → tekst, så ikonet er den FØRSTE <svg> etter
    // aria-label-en. (Å lete bakover fra teksten «For kald» traff ikonet i
    // raden OVER — det var slik denne porten først lyktes med feil ikon.)
    const start = html.indexOf('aria-label="For kald');
    expect(start, 'fant ikke «For kald»-raden').toBeGreaterThan(-1);
    const radStart = html.indexOf('<svg', start);
    const svg = html.slice(radStart, html.indexOf('</svg>', radStart));
    return [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  }

  it('har én gren-path per arm — ikke fire på den loddrette aksen', async () => {
    const paths = await kuldeIkonPaths();
    const nær = (a: readonly number[], b: readonly number[]): boolean =>
      Math.abs(a[0] - b[0]) < 0.35 && Math.abs(a[1] - b[1]) < 0.35;

    // En gren-path er en som TREFFER en armspiss og har tre punkter
    // (gren → spiss → gren). Aksene har bare to punkter.
    const grener = paths.filter((d) => {
      const p = punkter(d);
      return p.length === 3 && SPISSER.some((s) => p.some((q) => nær(q, s)));
    });

    const dekkedeArmer = SPISSER.filter((s) =>
      grener.some((d) => punkter(d).some((q) => nær(q, s))),
    );

    expect(
      dekkedeArmer.length,
      `Bare ${dekkedeArmer.length} av 6 armer har gren. Det gamle ikonet hadde ` +
        '4 grener, alle på den loddrette aksen — derfor leste det som et ' +
        'flytt-/størrelsesikon.',
    ).toBe(6);
    expect(grener.length).toBe(6);
  });

  it('er speilsymmetrisk om både x = 12 og y = 12', async () => {
    const paths = await kuldeIkonPaths();
    const alle = paths.flatMap(punkter);
    expect(alle.length).toBeGreaterThan(12);

    const nøkkel = (p: readonly number[]): string =>
      `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const mengde = new Set(alle.map(nøkkel));

    const speiletX = new Set(alle.map(([x, y]) => nøkkel([24 - x, y])));
    const speiletY = new Set(alle.map(([x, y]) => nøkkel([x, 24 - y])));

    const mangler = (m: Set<string>): string[] =>
      [...m].filter((k) => !mengde.has(k));

    expect(
      mangler(speiletX),
      'Ikke symmetrisk om x = 12; disse speilpunktene mangler',
    ).toEqual([]);
    expect(
      mangler(speiletY),
      'Ikke symmetrisk om y = 12; disse speilpunktene mangler',
    ).toEqual([]);
  });
});

describe('Varm eller kald — bunn-faden', () => {
  it('bruker --dw-fade-bunn, ikke tab-bar-varianten: CTA-en ligger utenfor rullecontaineren', async () => {
    const html = await render();
    expect(html).toContain('var(--dw-fade-bunn)');
    expect(
      html,
      '--dw-fade-over-tabbar hører til flater som RULLER under baren. Her ' +
        'ligger «Ferdig» i en egen flex-linje under rullecontaineren, og det ' +
        'er den linja som bærer --dw-tabbar-clearance.',
    ).not.toContain('--dw-fade-over-tabbar');
    // Klaringen skal fortsatt ligge på CTA-linja.
    expect(html).toContain('--dw-tabbar-clearance');
  });
});
