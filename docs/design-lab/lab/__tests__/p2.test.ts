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
  forhaandsdefinertKandidat,
  endringsForklaring,
  varmepoeng,
  BAND_GRENSER,
  BEREGNET_FRA_TEKST,
  EKSTRA_KANDIDATER,
  GJENOPPRETTING_TEKST,
  KANDIDAT_IDER,
  KAN_IKKE_BEREGNES_TITTEL,
  USIKKERHETSPAASLAG_C,
  UTLOPT_TITTEL,
  VARM_TILLEGG,
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

  it('dommen er aldri en score: ingen prosent, poeng, gradtall eller minutt-tall i responsen (avvik c)', () => {
    for (const id of ['normal-dag', 'grensevaer', 'sovende-vognbarn', 'bilstol', 'utendorslys']) {
      const spenn = spennOk(id);
      for (const kandidat of [
        spenn.basePlagg,
        spenn.basePlagg.filter((p) => p.kategori !== 'yttertoy'),
        [...spenn.basePlagg, { kategori: 'mellomlag', plagg: 'x' } as const, { kategori: 'mellomlag', plagg: 'y' } as const],
      ]) {
        const dom = kandidatposisjon(spenn, kandidat);
        const tekst = `${dom.setning} ${dom.handling} ${dom.kontrolltegn}`;
        // Poeng→grader er intern kalibrering — ekvivalentC lekker aldri ut.
        expect(tekst).not.toMatch(/%|poeng|score|°C|\d+\s*min\b/i);
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
 * 4b. Tre forhåndsdefinerte kandidater (Sols fase 10-review, P2-P0):
 *     kald (under gulvet), trygg (i spennet), varm (over taket) —
 *     diagnose og korrigering testes, ikke bare bekreftelse.
 * ------------------------------------------------------------------ */

describe('tre forhåndsdefinerte kandidater — alle ti scenarier', () => {
  it('ikke-vakuøst: nøyaktig åtte scenarier har gyldig spenn, to er maskert', () => {
    const statuser = SCENARIER.map((s) => byggSpenn(hentFakta(s)).status);
    expect(statuser.filter((s) => s === 'ok')).toHaveLength(8);
    expect(statuser.filter((s) => s === 'degradert')).toHaveLength(2);
  });

  it.each(SCENARIER.map((s) => [s.id, s] as [string, Scenario]))(
    'scenario %s: alle tre kandidater treffer manifestets fasit',
    (id, scenario) => {
      const fasit = manifest.scoringsfasit[id].forventetPosisjonPerKandidat;
      const spenn = byggSpenn(hentFakta(scenario));
      if (spenn.status === 'degradert') {
        for (const k of KANDIDAT_IDER) {
          expect(fasit[k], `${id}/${k}`).toBe('maskert');
        }
        return;
      }
      for (const k of KANDIDAT_IDER) {
        const dom = kandidatposisjon(spenn, forhaandsdefinertKandidat(spenn, k));
        expect(dom.posisjon, `${id}/${k}`).toBe(fasit[k]);
      }
    },
  );

  it('«kald» står ALDRI i spennet i noe kaldt scenario — den skal diagnostiseres, ikke bekreftes', () => {
    let testet = 0;
    for (const scenario of SCENARIER) {
      const spenn = byggSpenn(hentFakta(scenario));
      if (spenn.status !== 'ok') continue;
      testet += 1;
      const dom = kandidatposisjon(spenn, forhaandsdefinertKandidat(spenn, 'kald'));
      expect(dom.posisjon, scenario.id).not.toBe('i-spennet');
      expect(dom.posisjon, scenario.id).toBe('under-gulv');
      expect(dom.handling, scenario.id).toContain('Legg til ett lag');
    }
    expect(testet).toBe(8); // ikke-vakuøst: alle åtte ok-scenarier ble dømt
  });

  it('kandidatkonstruksjon: kald fjerner ett kritisk lag (yttertøy) der det finnes, varm legger til to', () => {
    const spenn = spennOk('normal-dag');
    const kald = forhaandsdefinertKandidat(spenn, 'kald');
    const trygg = forhaandsdefinertKandidat(spenn, 'trygg');
    const varm = forhaandsdefinertKandidat(spenn, 'varm');
    expect(spenn.basePlagg.length).toBeGreaterThan(0); // ikke-vakuøst
    expect(spenn.basePlagg.some((p) => p.kategori === 'yttertoy')).toBe(true);
    expect(kald).toHaveLength(spenn.basePlagg.length - 1); // ett lag var nok
    expect(kald.some((p) => p.kategori === 'yttertoy')).toBe(false);
    expect(trygg).toEqual(spenn.basePlagg);
    expect(varm).toHaveLength(spenn.basePlagg.length + 2);
    expect(varmepoeng(kald)).toBeLessThan(varmepoeng(trygg));
    expect(varmepoeng(varm)).toBeGreaterThan(varmepoeng(trygg));
  });

  it('varm-tillegget finnes som chips — UI-et kan representere og korrigere kandidaten', () => {
    const nokler = new Set(EKSTRA_KANDIDATER.map((p) => `${p.kategori}::${p.plagg}`));
    expect(VARM_TILLEGG).toHaveLength(2);
    for (const p of VARM_TILLEGG) {
      expect(nokler.has(`${p.kategori}::${p.plagg}`), p.plagg).toBe(true);
    }
  });

  it('ingen kandidat bærer fasit-markør: bare kategori og plagg, aldri «riktig»-flagg', () => {
    const spenn = spennOk('normal-dag');
    for (const k of KANDIDAT_IDER) {
      for (const p of forhaandsdefinertKandidat(spenn, k)) {
        expect(Object.keys(p).sort()).toEqual(['kategori', 'plagg']);
      }
    }
  });

  it('MUTASJONSBEVIS beholdes: kandidatbygging og dom muterer aldri spennet', () => {
    const spenn = spennOk('sovende-vognbarn');
    const foer = JSON.parse(JSON.stringify(spenn));
    for (const k of KANDIDAT_IDER) {
      kandidatposisjon(spenn, forhaandsdefinertKandidat(spenn, k));
    }
    expect(spenn).toEqual(foer);
    // Deterministisk: samme kandidat to ganger er identisk.
    expect(forhaandsdefinertKandidat(spenn, 'kald')).toEqual(
      forhaandsdefinertKandidat(spenn, 'kald'),
    );
  });
});

/* ------------------------------------------------------------------ *
 * 4c. Årsakskjeden (Sols fase 10-review, P2-P1): markørens posisjon
 *     skal kunne leses som konsekvens av klesvalget.
 * ------------------------------------------------------------------ */

describe('årsakskjeden: hva flyttet markøren', () => {
  it('den faste teksten binder markøren til klesvalget', () => {
    expect(BEREGNET_FRA_TEKST).toBe('Beregnet fra klærne du valgte');
    expect(harForbudtSprak(BEREGNET_FRA_TEKST)).toBe(false);
  });

  it('fjernet plagg → «falt mot gulvet», lagt til → «steg mot taket»', () => {
    expect(endringsForklaring({ kategori: 'ekstra', plagg: 'ullsokker' }, false)).toBe(
      'Minus ullsokker — markøren falt mot gulvet.',
    );
    expect(
      endringsForklaring({ kategori: 'mellomlag', plagg: 'ekstra ullgenser' }, true),
    ).toBe('Pluss ekstra ullgenser — markøren steg mot taket.');
  });

  it('plagg uten varmebidrag (utstyr) flytter ikke markøren — og sier det', () => {
    const forklaring = endringsForklaring({ kategori: 'utstyr', plagg: 'regntrekk' }, true);
    expect(forklaring).toContain('sto i ro');
    expect(forklaring).toContain('varmer ikke');
  });

  it('forklaringen stemmer med modellen: minus-plagg senker faktisk posisjonen', () => {
    const spenn = spennOk('normal-dag');
    const fulle = kandidatposisjon(spenn, spenn.basePlagg);
    const utenEtt = kandidatposisjon(spenn, spenn.basePlagg.slice(1));
    expect(spenn.basePlagg.length).toBeGreaterThan(1); // ikke-vakuøst
    expect(utenEtt.ekvivalentC).toBeLessThan(fulle.ekvivalentC);
  });

  it('forklaringene er uten forbudt språk, score og gradtall', () => {
    const spenn = spennOk('normal-dag');
    for (const p of [...spenn.basePlagg, ...EKSTRA_KANDIDATER]) {
      for (const valgt of [true, false]) {
        const forklaring = endringsForklaring(p, valgt);
        expect(harForbudtSprak(forklaring), forklaring).toBe(false);
        expect(forklaring).not.toMatch(/%|poeng|score|°C|\d+\s*min\b/i);
      }
    }
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
      expect(setning).toContain('Kjenn på nakken');
      // Semantikk-porten gjelder også degradert (eksakt gyldighet).
      expect(sjekkSemantikk(spennUttrykk(spenn), fakta(id)).ok).toBe(true);
    },
  );

  it('manglende værdata → «Kan ikke beregnes» — ALDRI utløpssemantikk eller gammel gyldighet', () => {
    const spenn = byggSpenn(fakta('manglende-vaerdata'));
    expect(spenn.status).toBe('degradert');
    if (spenn.status !== 'degradert') return;
    expect(spenn.aarsakstype).toBe('mangler');
    const setning = spennSetning(spenn);
    expect(setning).toContain(KAN_IKKE_BEREGNES_TITTEL);
    // Ikke-vakuøst: setningen bærer årsak og fallback-regelen.
    expect(setning).toContain(spenn.aarsak);
    expect(setning).toContain('Kle etter årstid');
    // Aldri utløpssemantikk: ingen «utløpt», «gjaldt til» eller gyldighetsord.
    expect(setning.toLowerCase()).not.toMatch(/utløp|gjaldt|gyldig/);
  });

  it('utløpt råd → «Spennet er utløpt» — egen tilstand, aldri forkledd som datamangel', () => {
    const spenn = byggSpenn(fakta('utlopt-raad'));
    expect(spenn.status).toBe('degradert');
    if (spenn.status !== 'degradert') return;
    expect(spenn.aarsakstype).toBe('utlopt');
    const setning = spennSetning(spenn);
    expect(setning).toContain(UTLOPT_TITTEL);
    expect(setning).not.toContain(KAN_IKKE_BEREGNES_TITTEL);
  });

  it('MUTASJONSBEVIS: de to degraderte tilstandene er faktisk forskjellige flater', () => {
    const mangler = byggSpenn(fakta('manglende-vaerdata'));
    const utlopt = byggSpenn(fakta('utlopt-raad'));
    if (mangler.status !== 'degradert' || utlopt.status !== 'degradert') {
      throw new Error('ventet degradert i begge');
    }
    expect(mangler.aarsakstype).not.toBe(utlopt.aarsakstype);
    expect(spennSetning(mangler)).not.toBe(spennSetning(utlopt));
    expect(GJENOPPRETTING_TEKST[mangler.aarsakstype]).not.toBe(
      GJENOPPRETTING_TEKST[utlopt.aarsakstype],
    );
  });

  it('gjenopprettingshandlingene er konkrete og uten forbudt språk', () => {
    for (const tekst of Object.values(GJENOPPRETTING_TEKST)) {
      expect(tekst.length).toBeGreaterThan(0);
      expect(harForbudtSprak(tekst)).toBe(false);
    }
    expect(GJENOPPRETTING_TEKST.mangler).toContain('værdata');
    expect(GJENOPPRETTING_TEKST.utlopt).toContain('på nytt');
  });

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
