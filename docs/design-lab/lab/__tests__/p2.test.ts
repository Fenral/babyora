/**
 * P2 «SPENNET» — tester for spennmodellen (transformatoren).
 *
 * (1) Semantikk-porten: spennUttrykk SKAL bestå sjekkSemantikk mot
 *     NoytraleFakta for ALLE ti scenarier (spec v2 §4 pkt. 2).
 * (2) Retningsspesifikke atferdstester: inversjon ved vogn-søvn,
 *     usikkerhetspåslag som spiser fra hard side, posisjon+fastkoblet
 *     respons (aldri score), kanonisk setningsform, maskering.
 *
 * Ikke-vakuøsitet: testene asserterer at det VAR innhold å bære
 * (hendelser, stoppkriterier, plagg) før de asserterer utfall.
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import {
  hentFakta,
  sjekkSemantikk,
  semantikkAvtrykk,
  type NoytraleFakta,
} from '../felles/fakta';
import { harForbudtSprak } from '../felles/tekst';
import {
  byggSpenn,
  spennUttrykk,
  kandidatposisjon,
  spennSetning,
  varmepoeng,
  BAND_GRENSER,
  USIKKERHETSPAASLAG_C,
  GRADER_PER_POENG,
  HYPOTESE_ETIKETT,
  type SpennOk,
} from '../p2/spennmodell';
import { manifest } from '../p2/manifest';

function fakta(id: string): NoytraleFakta {
  const scenario = scenarioForId(id);
  if (!scenario) throw new Error(`ukjent scenario: ${id}`);
  return hentFakta(scenario);
}

function spennOk(id: string): SpennOk {
  const spenn = byggSpenn(fakta(id));
  if (spenn.status !== 'ok') throw new Error(`${id}: ventet ok, fikk degradert`);
  return spenn;
}

/* ------------------------------------------------------------------ *
 * 1. Semantikk-porten — alle ti scenarier
 * ------------------------------------------------------------------ */

describe('spennUttrykk består sjekkSemantikk for alle ti scenarier', () => {
  it.each(SCENARIER.map((s) => [s.id, s] as [string, Scenario]))(
    'scenario %s',
    (_id, scenario) => {
      const f = hentFakta(scenario);
      const resultat = sjekkSemantikk(spennUttrykk(byggSpenn(f)), f);
      expect(resultat.mangler).toEqual([]);
      expect(resultat.ok).toBe(true);
    },
  );

  it('ikke-vakuøst: bilstol-scenariet bærer HB-9 med stoppkriterium gjennom spennet', () => {
    const f = fakta('bilstol');
    // Fasiten har faktisk innhold …
    const avtrykk = semantikkAvtrykk(f);
    expect(avtrykk.safetyEventIds.length).toBeGreaterThanOrEqual(2);
    expect(avtrykk.stoppkriterier.length).toBeGreaterThanOrEqual(1);
    // … og spennet bærer det videre som hendelser med fastkoblet respons.
    const spenn = byggSpenn(f);
    const hb9 = spenn.hendelser.find((h) => h.id === 'HB-9');
    expect(hb9).toBeTruthy();
    expect(hb9!.prioritet).toBe('hard');
    expect(hb9!.stoppkriterium).toBeTruthy();
    expect(hb9!.respons).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ *
 * 2. Atferd: asymmetrien inverteres ved vogn-søvn
 * ------------------------------------------------------------------ */

describe('inversjon: hard side eies av risikomodellen', () => {
  it('våken vogntur → kaldgulvet er hard side', () => {
    const spenn = spennOk('normal-dag');
    expect(spenn.invertert).toBe(false);
    expect(spenn.hardSide).toBe('kald');
  });

  it('sovende vognbarn → varmetaket er hard side (overoppheting)', () => {
    const spenn = spennOk('sovende-vognbarn');
    expect(spenn.invertert).toBe(true);
    expect(spenn.hardSide).toBe('varm');
  });

  it('invertert over-tak-respons er en plagghandling mot overoppheting', () => {
    const spenn = spennOk('sovende-vognbarn');
    // Ikke-vakuøst: det finnes plagg å legge til.
    expect(spenn.basePlagg.length).toBeGreaterThan(0);
    const kandidat = [
      ...spenn.basePlagg,
      { kategori: 'mellomlag', plagg: 'ekstra ullgenser' } as const,
      { kategori: 'mellomlag', plagg: 'ekstra fleecegenser' } as const,
    ];
    const dom = kandidatposisjon(spenn, kandidat);
    expect(dom.posisjon).toBe('over-tak');
    expect(dom.handling).toContain('Fjern ett lag');
    expect(dom.kontrolltegn).toContain('Svett nakke');
    expect(dom.setning).toContain('harde grensen når barnet sover');
  });
});

/* ------------------------------------------------------------------ *
 * 3. Atferd: usikkerhetspåslaget spiser av den harde siden
 * ------------------------------------------------------------------ */

describe('usikkerhetspåslag: terrenget vokser innover fra hard side', () => {
  it('våken: kaldgulvet heves med påslaget, varmetaket står', () => {
    const spenn = spennOk('normal-dag');
    const grenser = BAND_GRENSER[spenn.band];
    expect(spenn.usikkerhetspaaslagC).toBe(
      USIKKERHETSPAASLAG_C[spenn.usikrestPremiss],
    );
    expect(spenn.usikkerhetspaaslagC).toBeGreaterThan(0);
    expect(spenn.kaldgulvC).toBe(grenser.nedreC + spenn.usikkerhetspaaslagC);
    expect(spenn.varmetakC).toBe(grenser.ovreC);
  });

  it('sovende: varmetaket senkes med påslaget, kaldgulvet står', () => {
    const spenn = spennOk('sovende-vognbarn');
    const grenser = BAND_GRENSER[spenn.band];
    expect(spenn.usikkerhetspaaslagC).toBeGreaterThan(0);
    expect(spenn.varmetakC).toBe(grenser.ovreC - spenn.usikkerhetspaaslagC);
    expect(spenn.kaldgulvC).toBe(grenser.nedreC);
  });

  it('vindutsatt scenario (utendørslys, 5 m/s) → vindmålingen er usikrest med størst påslag', () => {
    const spenn = spennOk('utendorslys');
    expect(spenn.usikrestPremiss).toBe('vindmålingen');
    expect(spenn.usikkerhetspaaslagC).toBe(USIKKERHETSPAASLAG_C['vindmålingen']);
  });
});

/* ------------------------------------------------------------------ *
 * 4. Atferd: posisjon + fastkoblet respons, aldri score
 * ------------------------------------------------------------------ */

describe('kandidatposisjon: posisjon + fastkoblet respons', () => {
  it('uendret kandidat (basePlagg) står i spennet', () => {
    const spenn = spennOk('normal-dag');
    expect(spenn.basePlagg.length).toBeGreaterThan(0); // ikke-vakuøst
    const dom = kandidatposisjon(spenn, spenn.basePlagg);
    expect(dom.posisjon).toBe('i-spennet');
  });

  it('uten ytterlag → under gulvet, respons «legg til ett lag»', () => {
    const spenn = spennOk('normal-dag');
    const utenYtter = spenn.basePlagg.filter((p) => p.kategori !== 'yttertoy');
    expect(utenYtter.length).toBeLessThan(spenn.basePlagg.length); // noe ble fjernet
    const dom = kandidatposisjon(spenn, utenYtter);
    expect(dom.posisjon).toBe('under-gulv');
    expect(dom.handling).toContain('Legg til ett lag');
    expect(dom.setning).toContain('under kaldgulvet');
  });

  it('to ekstra mellomlag → over taket, respons «fjern ett lag»', () => {
    const spenn = spennOk('normal-dag');
    const dom = kandidatposisjon(spenn, [
      ...spenn.basePlagg,
      { kategori: 'mellomlag', plagg: 'ekstra ullgenser' },
      { kategori: 'mellomlag', plagg: 'ekstra fleecegenser' },
    ]);
    expect(dom.posisjon).toBe('over-tak');
    expect(dom.handling).toContain('Fjern ett lag');
  });

  it('ett plagg mindre → nær den kalde grensen → økt sjekkfrekvens, ikke alarm', () => {
    const spenn = spennOk('normal-dag');
    const ekstra = spenn.basePlagg.filter((p) => p.kategori === 'ekstra');
    expect(ekstra.length).toBeGreaterThan(0); // ikke-vakuøst
    const enMindre = [...spenn.basePlagg];
    enMindre.splice(spenn.basePlagg.findIndex((p) => p.kategori === 'ekstra'), 1);
    const dom = kandidatposisjon(spenn, enMindre);
    expect(dom.posisjon).toBe('i-spennet');
    expect(dom.naerHardGrense).toBe(true);
    expect(dom.handling).toContain('kort tur');
    expect(dom.kontrolltegn).toContain('nakken');
  });

  it('dommen er aldri en score: ingen prosent, poeng eller minutt-tall i responsen', () => {
    for (const id of ['normal-dag', 'grensevaer', 'sovende-vognbarn', 'bilstol', 'utendorslys']) {
      const spenn = spennOk(id);
      for (const kandidat of [
        spenn.basePlagg,
        spenn.basePlagg.filter((p) => p.kategori !== 'yttertoy'),
        [...spenn.basePlagg, { kategori: 'mellomlag', plagg: 'x' } as const, { kategori: 'mellomlag', plagg: 'y' } as const],
      ]) {
        const dom = kandidatposisjon(spenn, kandidat);
        const tekst = `${dom.setning} ${dom.handling} ${dom.kontrolltegn}`;
        expect(tekst).not.toMatch(/%|poeng|score|\d+\s*min\b/i);
      }
    }
  });

  it('gulvet flytter seg aldri av kandidaten: dommen muterer ikke spennet', () => {
    const spenn = spennOk('normal-dag');
    const foer = JSON.parse(JSON.stringify(spenn));
    kandidatposisjon(spenn, []);
    kandidatposisjon(spenn, [...spenn.basePlagg, ...spenn.basePlagg]);
    expect(spenn).toEqual(foer);
  });
});

/* ------------------------------------------------------------------ *
 * 5. Kanonisk setningsform = samme beslutning som figuren
 * ------------------------------------------------------------------ */

describe('tekstparitet: kanonisk setningsform bærer dommen', () => {
  const FRASE_FOR_POSISJON = {
    'under-gulv': 'under kaldgulvet',
    'i-spennet': 'i trygt spenn',
    'over-tak': 'over varmetaket',
  } as const;

  it('setningen inneholder posisjonsfrase, handling og kontrolltegn — for alle posisjoner', () => {
    const spenn = spennOk('normal-dag');
    const kandidater = [
      spenn.basePlagg,
      spenn.basePlagg.filter((p) => p.kategori !== 'yttertoy'),
      [...spenn.basePlagg, { kategori: 'mellomlag', plagg: 'x' } as const, { kategori: 'mellomlag', plagg: 'y' } as const],
    ];
    const settePosisjoner = new Set<string>();
    for (const kandidat of kandidater) {
      const dom = kandidatposisjon(spenn, kandidat);
      settePosisjoner.add(dom.posisjon);
      expect(dom.setning).toContain(FRASE_FOR_POSISJON[dom.posisjon]);
      expect(dom.setning).toContain(dom.handling);
      expect(dom.setning).toContain(dom.kontrolltegn);
    }
    // Ikke-vakuøst: alle tre posisjoner ble faktisk dekket.
    expect(settePosisjoner).toEqual(new Set(['under-gulv', 'i-spennet', 'over-tak']));
  });

  it('instrumentets setningsform navngir hard grense og usikreste premiss — uten tall på aksen', () => {
    const vaaken = spennSetning(spennOk('normal-dag'));
    expect(vaaken).toContain('kaldgulvet — for kaldt er den farlige siden');
    expect(vaaken).toContain('Usikrest:');
    expect(vaaken).not.toMatch(/-?\d+([.,]\d+)?\s*°C/); // soner, ikke skala

    const sovende = spennSetning(spennOk('sovende-vognbarn'));
    expect(sovende).toContain('varmetaket — for varmt er den farlige siden når barnet sover');
  });
});

/* ------------------------------------------------------------------ *
 * 6. Maskering (degradert/utløpt) og forbudt språk
 * ------------------------------------------------------------------ */

describe('maskering og språkdoktrine', () => {
  it.each([['manglende-vaerdata'], ['utlopt-raad']])(
    '%s → degradert spenn, setningsform med konkret neste handling',
    (id) => {
      const spenn = byggSpenn(fakta(id));
      expect(spenn.status).toBe('degradert');
      const setning = spennSetning(spenn);
      expect(setning).toContain('maskert');
      expect(setning).toContain('Kjenn på nakken');
      // Semantikk-porten gjelder også degradert (eksakt gyldighet).
      expect(sjekkSemantikk(spennUttrykk(spenn), fakta(id)).ok).toBe(true);
    },
  );

  it('ingen tekst fra modellen eller manifestet bryter FORBUDTE_MONSTRE', () => {
    const tekster: string[] = [HYPOTESE_ETIKETT, JSON.stringify(manifest)];
    for (const scenario of SCENARIER) {
      const spenn = byggSpenn(hentFakta(scenario));
      tekster.push(spennSetning(spenn));
      if (spenn.status === 'ok') {
        for (const kandidat of [spenn.basePlagg, []]) {
          const dom = kandidatposisjon(spenn, kandidat);
          tekster.push(dom.setning, dom.handling, dom.kontrolltegn);
        }
        for (const h of spenn.hendelser) {
          tekster.push(h.innhold, h.respons, h.stoppkriterium ?? '');
        }
      }
    }
    expect(tekster.length).toBeGreaterThan(10); // ikke-vakuøst
    for (const tekst of tekster) {
      expect(harForbudtSprak(tekst), tekst).toBe(false);
    }
  });

  it('manifestets scoringsfasit dekker alle ti scenarier', () => {
    const ids = SCENARIER.map((s) => s.id).sort();
    expect(Object.keys(manifest.scoringsfasit).sort()).toEqual(ids);
    expect(manifest.scoringsfasit['utlopt-raad'].forventetPosisjon).toBe('maskert');
    expect(manifest.scoringsfasit['manglende-vaerdata'].forventetPosisjon).toBe('maskert');
  });

  it('varmepoeng er deterministisk og monotont i antall plagg', () => {
    const spenn = spennOk('normal-dag');
    const alle = varmepoeng(spenn.basePlagg);
    const faerre = varmepoeng(spenn.basePlagg.slice(1));
    expect(alle).toBeGreaterThan(0);
    expect(faerre).toBeLessThan(alle);
    // Én kategoriforskjell flytter kandidaten et deklarert antall grader.
    expect(GRADER_PER_POENG).toBeGreaterThan(0);
  });
});
