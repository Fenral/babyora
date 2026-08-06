/**
 * P4 — ÉN PRIMÆRHANDLING på brief-flaten (Sols fase 11 runde 2, P1:
 * «Briefen sier både 'Ta på tykt ullsett' og 'Legg ull-jakke mellom …'.
 * […] Gjør hierarkiet entydig […] legg til test som feiler dersom to
 * elementer får primær handlingssemantikk.»)
 *
 * Kontrakten: brief-DOM-en har NØYAKTIG ett element med
 * data-primaerhandling («Neste steg: <protokollens steg 1>»). Deltaet er
 * sekundær opplysning («Endring senere i protokollen: …») uten primær
 * vekt. Testen rendrer brief-flaten statisk for hver aksepterte
 * brieftilstand i alle ti scenarier og teller — to primære (eller null
 * der en handling finnes) er rød.
 */

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import { harForbudtSprak } from '../felles/tekst';
import {
  motta,
  START_TILSTAND,
  type BriefTilstand,
} from '../p3/brief-maskin';
import {
  ambientTidslinje,
  forsteTryggeSteg,
  lesP4Innhold,
  P4_TEKST,
} from '../p4/syntese';
import { BriefFlate } from '../p4/index';

const PALETT = {
  ink: '#1a1a1a',
  dus: '#4d4d4d',
  kant: '#8c8c8c',
  flate: '#fafafa',
};

function scenario(id: string): Scenario {
  const s = scenarioForId(id);
  if (!s) throw new Error(`ukjent scenario: ${id}`);
  return s;
}

function briefMarkup(t: BriefTilstand): string {
  const brief = t.gjeldende;
  return renderToStaticMarkup(
    createElement(BriefFlate, {
      tilstand: t,
      brief,
      innhold: brief ? lesP4Innhold(brief) : null,
      p: PALETT,
      nyOmsorgsperson: false,
    }),
  );
}

function antallPrimaer(html: string): number {
  return (html.match(/data-primaerhandling/g) ?? []).length;
}

/** Alle maskintilstander tidslinjen produserer for et scenario. */
function tilstander(s: Scenario): BriefTilstand[] {
  const ut: BriefTilstand[] = [];
  let t: BriefTilstand = START_TILSTAND;
  for (const steg of ambientTidslinje(s).steg) {
    t = motta(t, steg.hendelse, { naaISO: steg.tidISO });
    ut.push(t);
  }
  return ut;
}

/* ------------------------------------------------------------------ *
 * 1. Telleregelen — alle ti scenarier, hele tidslinjen
 * ------------------------------------------------------------------ */

describe('brief-DOM har nøyaktig én primærhandling (alle ti scenarier)', () => {
  it('aktiv/stale brief → nøyaktig 1; ventende/maskert/ingen → 0', () => {
    let aktiveObservert = 0;
    for (const s of SCENARIER) {
      for (const t of tilstander(s)) {
        const html = briefMarkup(t);
        const n = antallPrimaer(html);
        const harHandling =
          t.gjeldende !== null && (t.status === 'aktiv' || t.status === 'stale');
        if (harHandling) {
          aktiveObservert += 1;
          expect(n, `${s.id} @ status=${t.status}: ≠1 primærhandling`).toBe(1);
        } else {
          expect(n, `${s.id} @ status=${t.status}: primærhandling uten aktiv brief`).toBe(0);
        }
      }
    }
    expect(aktiveObservert).toBeGreaterThan(0); // ikke-vakuøst
  });

  it('detektoren teller faktisk: to markører i samme DOM gir 2 (rød)', () => {
    const toPrimaere =
      '<p data-primaerhandling="true">A</p><p data-primaerhandling="true">B</p>';
    expect(antallPrimaer(toPrimaere)).toBe(2);
    expect(antallPrimaer('<p>ingen</p>')).toBe(0);
  });

  it('primærhandlingen ER protokollens steg 1 med «Neste steg:»-prefiks', () => {
    for (const s of SCENARIER) {
      for (const t of tilstander(s)) {
        if (t.gjeldende === null || t.status !== 'aktiv') continue;
        const steg1 = forsteTryggeSteg(lesP4Innhold(t.gjeldende));
        const html = briefMarkup(t);
        expect(html, `${s.id}`).toContain(P4_TEKST.nesteSteg(steg1.handling));
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. Delta-scenariet: hierarkiet primær/sekundær er entydig
 * ------------------------------------------------------------------ */

describe('endret-vaer: primært neste steg + delta som sekundær opplysning', () => {
  function tilstandVedVersjon(versjon: number): BriefTilstand {
    for (const t of tilstander(scenario('endret-vaer'))) {
      if (t.gjeldende?.versjon === versjon && t.status === 'aktiv') return t;
    }
    throw new Error(`fant ingen aktiv tilstand med versjon ${versjon}`);
  }

  it('V2: én primær («Neste steg: Ta på …») og deltaet som «Endring senere i protokollen: legg …»', () => {
    const t = tilstandVedVersjon(2);
    const html = briefMarkup(t);
    expect(antallPrimaer(html)).toBe(1);
    expect(html).toContain('Neste steg: ');
    expect(html).toContain('Endring senere i protokollen: legg ull-jakke mellom');
    // Den sekundære linjen har verken primær-markør eller egen fetvekt.
    const sekundaer = /<p[^>]*>Endring senere i protokollen:[^<]*<\/p>/.exec(html);
    expect(sekundaer).not.toBeNull();
    expect(sekundaer![0]).not.toContain('data-primaerhandling');
    expect(sekundaer![0]).not.toMatch(/font-weight/);
  });

  it('V1: én primær; «Samme antrekk …» står som opplysning uten endrings-innramming', () => {
    const t = tilstandVedVersjon(1);
    const html = briefMarkup(t);
    expect(antallPrimaer(html)).toBe(1);
    expect(html).toContain('Samme antrekk som i går holder');
    expect(html).not.toContain('Endring senere i protokollen');
  });

  it('aldri to imperativer med lik vekt: kun primærelementet bærer 1.3em + 700', () => {
    const html = briefMarkup(tilstandVedVersjon(2));
    const store = html.match(/<p[^>]*font-size:1\.3em[^>]*>/g) ?? [];
    expect(store.length).toBe(1);
    expect(store[0]).toContain('data-primaerhandling');
  });
});

/* ------------------------------------------------------------------ *
 * 3. Tekstdoktrinen for de nye overgangstekstene
 * ------------------------------------------------------------------ */

describe('P4_TEKST.nesteSteg / deltaSekundaer følger doktrinen', () => {
  it('nesteSteg prefikser handlingen', () => {
    expect(P4_TEKST.nesteSteg('Ta på tykt ullsett')).toBe(
      'Neste steg: Ta på tykt ullsett',
    );
  });

  it('deltaSekundaer rammer endringer inn som opplysning med liten forbokstav', () => {
    expect(
      P4_TEKST.deltaSekundaer('Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.'),
    ).toBe(
      'Endring senere i protokollen: legg ull-jakke mellom ull-mellomlag og vinterkjøredress.',
    );
  });

  it('deltaSekundaer lar «Samme antrekk …» stå uendret (ingen falsk endring)', () => {
    const uendret = 'Samme antrekk som i går holder — body, ullsokker.';
    expect(P4_TEKST.deltaSekundaer(uendret)).toBe(uendret);
  });

  it('ingen forbudt retorikk i de nye tekstene', () => {
    for (const tekst of [
      P4_TEKST.nesteSteg('Ta på tykt ullsett'),
      P4_TEKST.deltaSekundaer('Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.'),
    ]) {
      expect(harForbudtSprak(tekst), tekst).toBe(false);
    }
  });
});
