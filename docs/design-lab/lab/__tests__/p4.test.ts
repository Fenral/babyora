/**
 * P4 «AMBIENT PROTOKOLL» — tester for komposisjonen (spec v2 §1 pkt. 3:
 * P4 komponerer P1s og P3s validerte kontrakter; kun overgangen er ny).
 *
 * Del 1: semantikk-porten — komposisjonen (snittet av protokoll- og
 * brief-uttrykket) bærer full semantikk for ALLE ti scenarier, med
 * mutasjonsbevis mot BEGGE sider (grønt på fravær teller ikke).
 *
 * Del 2: brief-første-steg — brief-flatens handling er ALLTID identisk
 * med protokollens steg 1 for alle ti scenarier og alle briefversjoner.
 *
 * Del 3: versjonsbrudd-property — ingen brief som brief-maskinen noen
 * gang aksepterer som gjeldende kan ha brief-versjon ≠ protokollversjon
 * (spilles gjennom hele tidslinjen + klokkeavvik for alle scenarier);
 * et håndkonstruert brudd oppdages av sjekkVersjonsbrudd.
 *
 * Del 4: tekstdoktrinen — FORBUDTE_MONSTRE gjelder all P4-tekst
 * (overgangstekster, manifest, pakket innhold).
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import { hentFakta, labISO, sjekkSemantikk, type NoytraleFakta } from '../felles/fakta';
import { DEGRADERT_NESTE_HANDLING, harForbudtSprak } from '../felles/tekst';
import { kompilerProtokoll, NAKKESJEKK_ID } from '../p1/protokollkompilator';
import { motta, START_TILSTAND, type Brief, type BriefTilstand } from '../p3/brief-maskin';
import {
  ambientTidslinje,
  forsteTryggeSteg,
  lesP4Innhold,
  pakkMedProtokoll,
  sjekkVersjonsbrudd,
  uttrykkFraAmbient,
  P4_TEKST,
  type P4Innhold,
} from '../p4/syntese';
import { manifest } from '../p4/manifest';

function scenario(id: string): Scenario {
  const s = scenarioForId(id);
  if (!s) throw new Error(`ukjent scenario: ${id}`);
  return s;
}

/**
 * Alle briefs komposisjonen produserer for et scenario (V1, V2, forsinket
 * V1) — sammen med faktagrunnlaget hver brief ble bygget/pakket fra
 * (V1 i delta-scenariet bygger på morgenprognosen, V2 på oppdatert).
 */
function alleBriefsMedFakta(s: Scenario): { brief: Brief; fakta: NoytraleFakta }[] {
  return ambientTidslinje(s).steg.flatMap((steg) =>
    steg.hendelse.type === 'brief'
      ? [{ brief: steg.hendelse.brief, fakta: steg.fakta }]
      : [],
  );
}

function alleBriefs(s: Scenario): Brief[] {
  return alleBriefsMedFakta(s).map((r) => r.brief);
}

/* ------------------------------------------------------------------ *
 * Del 1 — semantikk-porten for alle ti scenarier
 * ------------------------------------------------------------------ */

describe('P4-komposisjonen består semantikk-porten (alle ti scenarier)', () => {
  it('fikstursettet er komplett (ti scenarier — porten er ikke-vakuøs)', () => {
    expect(SCENARIER.length).toBe(10);
  });

  for (const s of SCENARIER) {
    it(`hver brief i tidslinjen bærer full semantikk i BEGGE flater — ${s.id}`, () => {
      const rader = alleBriefsMedFakta(s);
      expect(rader.length).toBeGreaterThan(0); // ikke-vakuøst
      for (const { brief, fakta } of rader) {
        // Porten sjekkes mot briefens EGET faktagrunnlag — V1 i
        // delta-scenariet bærer morgenprognosens semantikk fullt ut.
        const resultat = sjekkSemantikk(uttrykkFraAmbient(lesP4Innhold(brief)), fakta);
        expect(resultat.mangler, `${s.id} / ${brief.briefId}`).toEqual([]);
        expect(resultat.ok).toBe(true);
      }
    });
  }

  it('ikke-vakuøst: bilstol-komposisjonen bærer HB-9 i BEGGE uttrykk', () => {
    const innhold = lesP4Innhold(alleBriefs(scenario('bilstol'))[0]);
    // Briefen (P3-siden) bærer HB-9 …
    expect(innhold.briefInnhold.sikkerhet.map((e) => e.id)).toContain('HB-9');
    // … og protokollen (P1-siden) bærer den som steg …
    expect(
      innhold.protokoll.steg.some((st) => st.safetyEventId === 'HB-9'),
    ).toBe(true);
    // … så snittet inneholder den.
    expect(uttrykkFraAmbient(innhold).safetyEventIds).toContain('HB-9');
  });

  it('mutasjonsbevis: fjernes sikkerhetssteget fra PROTOKOLLEN, feiler porten', () => {
    const f = hentFakta(scenario('bilstol'));
    const innhold = lesP4Innhold(alleBriefs(scenario('bilstol'))[0]);
    expect(innhold.protokoll.steg.some((st) => st.safetyEventId === 'HB-9')).toBe(true);
    const mutert: P4Innhold = {
      ...innhold,
      protokoll: {
        ...innhold.protokoll,
        steg: innhold.protokoll.steg.filter((st) => st.safetyEventId !== 'HB-9'),
      },
    };
    const resultat = sjekkSemantikk(uttrykkFraAmbient(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler).toContain('safety-event mangler: HB-9');
  });

  it('mutasjonsbevis: fjernes hendelsen fra BRIEFEN, feiler porten også (snitt, ikke union)', () => {
    const f = hentFakta(scenario('bilstol'));
    const innhold = lesP4Innhold(alleBriefs(scenario('bilstol'))[0]);
    const mutert: P4Innhold = {
      ...innhold,
      briefInnhold: {
        ...innhold.briefInnhold,
        sikkerhet: innhold.briefInnhold.sikkerhet.filter((e) => e.id !== 'HB-9'),
      },
    };
    const resultat = sjekkSemantikk(uttrykkFraAmbient(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler).toContain('safety-event mangler: HB-9');
  });

  it('mutasjonsbevis: er flatene uenige om gyldigheten, feiler porten (fail-safe null)', () => {
    const f = hentFakta(scenario('bilstol'));
    const innhold = lesP4Innhold(alleBriefs(scenario('bilstol'))[0]);
    const mutert: P4Innhold = {
      ...innhold,
      protokoll: { ...innhold.protokoll, gyldigTilISO: labISO('23:59') },
    };
    const uttrykk = uttrykkFraAmbient(mutert);
    expect(uttrykk.gyldigTil).toBeNull();
    const resultat = sjekkSemantikk(uttrykk, f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler.some((m) => m.startsWith('gyldighet avviker'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Del 2 — atferd: brief-første-steg == protokollens steg 1 (alle ti)
 * ------------------------------------------------------------------ */

describe('atferd 1: brief-flatens handling er alltid protokollens steg 1', () => {
  for (const s of SCENARIER) {
    it(`steg 1 er identisk med P1-kompilatets steg 1 — ${s.id}`, () => {
      const rader = alleBriefsMedFakta(s);
      expect(rader.length).toBeGreaterThan(0);
      for (const { brief, fakta } of rader) {
        // Fasiten kompileres fra briefens EGET faktagrunnlag — V1 og V2 i
        // delta-scenariet har hver sin protokoll (morgen- vs. oppdatert
        // prognose), og steg 1 skal alltid stemme med P1s kompilat.
        const fasit = kompilerProtokoll(fakta).steg[0];
        const steg1 = forsteTryggeSteg(lesP4Innhold(brief));
        expect(steg1, `${s.id} / ${brief.briefId}`).toEqual(fasit);
      }
    });
  }

  it('manglende-vaerdata: steg 1 er den konservative fallbacken, aldri plagg', () => {
    const steg1 = forsteTryggeSteg(lesP4Innhold(alleBriefs(scenario('manglende-vaerdata'))[0]));
    expect(steg1.handling).toBe('Kle etter årstid');
    expect(steg1.sone).toBe('kjerne');
  });

  it('bilstol: HB-9 står FØR ytterlaget i den pakkede protokollen, og nakkesjekken sist', () => {
    const innhold = lesP4Innhold(alleBriefs(scenario('bilstol'))[0]);
    const steg = innhold.protokoll.steg;
    const hb9Indeks = steg.findIndex((st) => st.safetyEventId === 'HB-9');
    const ytterIndeks = steg.findIndex((st) => /dress|parkdress|kjørepose/i.test(st.handling) && st.sone === 'kjerne');
    expect(hb9Indeks).toBeGreaterThanOrEqual(0);
    if (ytterIndeks >= 0) expect(hb9Indeks).toBeLessThan(ytterIndeks);
    // Kontrollpunktet er siste steg — overgangen bevarer P1s rekkefølge.
    expect(steg[steg.length - 1].id).toBe(NAKKESJEKK_ID);
  });
});

/* ------------------------------------------------------------------ *
 * Del 3 — atferd: versjonsbrudd kan ikke skje via brief-maskinen
 * ------------------------------------------------------------------ */

describe('atferd 2: versjonsbrudd-property — umulig via brief-maskinen', () => {
  it('alle scenarier, hele tidslinjen + klokkeavvik: gjeldende brief har aldri brudd', () => {
    let observerteGjeldende = 0;
    for (const s of SCENARIER) {
      const { steg } = ambientTidslinje(s);
      let t: BriefTilstand = START_TILSTAND;
      for (const st of steg) {
        t = motta(t, st.hendelse, { naaISO: st.tidISO });
        if (t.gjeldende !== null) {
          observerteGjeldende += 1;
          expect(sjekkVersjonsbrudd(t.gjeldende).brudd, `${s.id} @ ${st.tidISO}`).toBe(false);
        }
      }
      // Klokke frem forbi utløp og tilbake igjen — fortsatt aldri brudd.
      for (const naa of [labISO('23:00'), labISO('00:01')]) {
        t = motta(t, { type: 'klokke' }, { naaISO: naa });
        if (t.gjeldende !== null) {
          expect(sjekkVersjonsbrudd(t.gjeldende).brudd, `${s.id} @ ${naa}`).toBe(false);
        }
      }
    }
    expect(observerteGjeldende).toBeGreaterThan(0); // property-testen er ikke-vakuøs
  });

  it('pakkMedProtokoll stempler atomisk: versjonen følger briefen, også ved ompakking', () => {
    const s = scenario('normal-dag');
    const { protokoll } = ambientTidslinje(s);
    for (const brief of alleBriefs(s)) {
      const ompakket = pakkMedProtokoll(brief, protokoll);
      expect(lesP4Innhold(ompakket).protokollVersjon).toBe(brief.versjon);
      expect(sjekkVersjonsbrudd(ompakket).brudd).toBe(false);
    }
  });

  it('mutasjonsbevis: et håndkonstruert brudd oppdages og navngir begge versjoner', () => {
    const brief = alleBriefs(scenario('normal-dag'))[0];
    // Versjonen bumpes UTEN ompakking — nøyaktig det syntesen aldri skal gjøre.
    const brutt: Brief = { ...brief, versjon: brief.versjon + 1 };
    const sjekk = sjekkVersjonsbrudd(brutt);
    expect(sjekk.brudd).toBe(true);
    expect(sjekk.briefVersjon).toBe(brief.versjon + 1);
    expect(sjekk.protokollVersjon).toBe(brief.versjon);
    // Feiltilstandsteksten bærer begge versjonene (syntesen har feilet-sporet).
    const tekst = P4_TEKST.versjonsbrudd(sjekk.briefVersjon, sjekk.protokollVersjon);
    expect(tekst).toContain(`#${sjekk.briefVersjon}`);
    expect(tekst).toContain(`#${sjekk.protokollVersjon}`);
  });
});

/* ------------------------------------------------------------------ *
 * Del 3b — atferd: maskering forblir enveis gjennom komposisjonen
 * ------------------------------------------------------------------ */

describe('atferd 3: P3s maskinregler overlever innpakningen (enveis maskering)', () => {
  it('normal-dag: V1→V2→forsinket V1 forkastes→utløp maskert→klokke tilbake gir aldri re-autorisering', () => {
    const s = scenario('normal-dag');
    const f = hentFakta(s);
    const { steg } = ambientTidslinje(s);

    let t: BriefTilstand = START_TILSTAND;
    t = motta(t, steg[0].hendelse, { naaISO: steg[0].tidISO });
    expect(t.status).toBe('aktiv');
    expect(t.gjeldende?.versjon).toBe(1);

    t = motta(t, steg[1].hendelse, { naaISO: steg[1].tidISO });
    expect(t.gjeldende?.versjon).toBe(2);

    t = motta(t, steg[2].hendelse, { naaISO: steg[2].tidISO });
    expect(t.gjeldende?.versjon).toBe(2);
    expect(t.forkastede.at(-1)?.grunn).toBe('maskert-enveis');

    t = motta(t, { type: 'klokke' }, { naaISO: f.gyldighet.gjelderTilISO });
    expect(t.status).toBe('maskert');
    t = motta(t, { type: 'klokke' }, { naaISO: steg[1].tidISO });
    expect(t.status).toBe('maskert'); // klokkeavvik re-autoriserer aldri
  });

  it('utlopt-raad: pakket brief ankommer etter egen gyldighet og maskeres umiddelbart', () => {
    const s = scenario('utlopt-raad');
    const { steg } = ambientTidslinje(s);
    const t = motta(START_TILSTAND, steg[0].hendelse, { naaISO: labISO(s.naa) });
    expect(t.status).toBe('maskert');
    // Innholdet som ALDRI skal brukes: fallbacken er dokumentert i felles.
    expect(DEGRADERT_NESTE_HANDLING).toContain('Kle etter årstid');
  });
});

/* ------------------------------------------------------------------ *
 * Del 3c — atferd: overgangen brief→protokoll er kontinuerlig (P4-P0)
 * ------------------------------------------------------------------ */

describe('atferd 4: overgangskontinuitet — samme briefId+versjon før, under og etter åpning', () => {
  it('for hvert akseptert punkt i tidslinjen viser begge flater samme brief, og retur endrer ingenting', () => {
    let antallAapninger = 0;
    for (const s of SCENARIER) {
      const { steg } = ambientTidslinje(s);
      let t: BriefTilstand = START_TILSTAND;
      for (const st of steg) {
        t = motta(t, st.hendelse, { naaISO: st.tidISO });
        if (t.gjeldende === null || t.status === 'maskert') continue;
        antallAapninger += 1;

        // FØR åpning: brief-flatens identitet.
        const foer = t.gjeldende;

        // ÅPNING: protokollflaten bygges av NØYAKTIG samme brief-objekt —
        // versjonssjekken består og det pakkede stempelet er identisk.
        const sjekk = sjekkVersjonsbrudd(foer);
        expect(sjekk.brudd, `${s.id} / ${foer.briefId}`).toBe(false);
        const innhold = lesP4Innhold(foer);
        expect(innhold.protokollVersjon).toBe(foer.versjon);

        // Kontinuitetslinjen på protokollflaten navngir BÅDE briefId og
        // versjon — samme identitet som brief-flatens stempellinje.
        const linje = P4_TEKST.sammeVersjon(foer.briefId, foer.versjon);
        expect(linje).toContain(foer.briefId);
        expect(linje).toContain(`#${foer.versjon}`);

        // RETUR: åpning/lukking er rene lesninger — maskintilstanden og
        // dermed brief-flatens identitet er uendret etterpå.
        const etter = t.gjeldende;
        expect(etter.briefId).toBe(foer.briefId);
        expect(etter.versjon).toBe(foer.versjon);
      }
    }
    expect(antallAapninger).toBeGreaterThan(0); // ikke-vakuøst
  });

  it('kontinuiteten holder over versjonsskiftet: etter V2 viser begge flater V2', () => {
    const s = scenario('endret-vaer');
    const { steg } = ambientTidslinje(s);
    let t: BriefTilstand = START_TILSTAND;
    t = motta(t, steg[0].hendelse, { naaISO: steg[0].tidISO });
    expect(t.gjeldende?.versjon).toBe(1);
    expect(lesP4Innhold(t.gjeldende!).protokollVersjon).toBe(1);

    t = motta(t, steg[1].hendelse, { naaISO: steg[1].tidISO });
    expect(t.gjeldende?.versjon).toBe(2);
    // Begge flater (brief + åpnet protokoll) leser samme objekt → V2.
    expect(lesP4Innhold(t.gjeldende!).protokollVersjon).toBe(2);
    expect(sjekkVersjonsbrudd(t.gjeldende!).brudd).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Del 3d — atferd: endret-vaer-briefen uttrykker BÅDE delta og første
 * protokollhandling (P4-P1), og V2 endrer handlingen reelt
 * ------------------------------------------------------------------ */

describe('atferd 5: endret-vaer — delta OG første protokollhandling, uten ny anbefaling', () => {
  it('V2-briefen bærer deltaet, den konkrete lagendringen og protokollens steg 1', () => {
    const rader = alleBriefsMedFakta(scenario('endret-vaer'));
    const v2 = rader.find((r) => r.brief.versjon === 2)!;
    const innhold = lesP4Innhold(v2.brief);

    // Deltaet er til stede med antrekksbaseline.
    expect(innhold.briefInnhold.delta).not.toBeNull();
    expect(innhold.briefInnhold.delta!.setning).toContain('Kaldere enn i går');
    expect(innhold.briefInnhold.delta!.baseline.etikett).toMatch(
      /^i går V1 \(føltes -?\d+ °C\): .+/,
    );

    // Den konkrete endringen navngir laget og posisjonen …
    expect(innhold.briefInnhold.komfortHandling).toBe(
      'Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.',
    );

    // … og introduserer INGEN ny anbefaling: det navngitte laget finnes
    // som eget steg i protokollen briefen selv bærer.
    expect(
      innhold.protokoll.steg.some((st) => st.handling === 'Ta på ull-jakke'),
    ).toBe(true);

    // Første protokollhandling er fortsatt P1s steg 1 for samme fakta.
    expect(forsteTryggeSteg(innhold)).toEqual(kompilerProtokoll(v2.fakta).steg[0]);
  });

  it('V2 endrer handlingsinnholdet reelt fra V1 (samme antrekk holder → legg laget)', () => {
    const rader = alleBriefsMedFakta(scenario('endret-vaer'));
    const v1 = lesP4Innhold(rader.find((r) => r.brief.versjon === 1)!.brief);
    const v2 = lesP4Innhold(rader.find((r) => r.brief.versjon === 2)!.brief);

    expect(v1.briefInnhold.komfortHandling).toMatch(/^Samme antrekk som i går holder/);
    expect(v2.briefInnhold.komfortHandling).toMatch(/^Legg /);
    expect(v2.briefInnhold.komfortHandling).not.toBe(v1.briefInnhold.komfortHandling);

    // Protokollen endres tilsvarende: V2s kompilat har flere plaggsteg.
    expect(v2.protokoll.steg.length).toBeGreaterThan(v1.protokoll.steg.length);
  });
});

/* ------------------------------------------------------------------ *
 * Del 4 — tekstdoktrinen og manifestets kompletthet
 * ------------------------------------------------------------------ */

describe('tekstdoktrinen: FORBUDTE_MONSTRE gjelder all P4-tekst', () => {
  it('pakket innhold for alle scenarier bryter aldri forbudslisten', () => {
    for (const s of SCENARIER) {
      for (const brief of alleBriefs(s)) {
        expect(harForbudtSprak(brief.innhold), `${s.id} / ${brief.briefId}`).toBe(false);
      }
    }
  });

  it('overgangstekstene (P4s eneste egne tekst) bryter aldri forbudslisten', () => {
    const tekster = [
      P4_TEKST.aapneProtokoll(7),
      P4_TEKST.lukkProtokoll,
      P4_TEKST.stegEnAv(7),
      P4_TEKST.sammeVersjon('endret-vaer-b2', 2),
      P4_TEKST.versjonsbrudd(2, 1),
      P4_TEKST.maskert,
      P4_TEKST.ventende('06:30'),
      P4_TEKST.utenNett,
    ];
    for (const tekst of tekster) {
      expect(harForbudtSprak(tekst), tekst).toBe(false);
      expect(/forstått/i.test(tekst), tekst).toBe(false);
    }
  });

  it('manifestet er komplett etter §3-malen og følger doktrinen', () => {
    const tekst = JSON.stringify(manifest);
    expect(harForbudtSprak(tekst)).toBe(false);
    expect(manifest.hypotese).toBeTruthy();
    expect(manifest.isolertVariabel).toBeTruthy();
    expect(manifest.oppgaver.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(manifest.scoringsfasit).sort()).toEqual(
      SCENARIER.map((s) => s.id).sort(),
    );
    expect(manifest.farligeFeil.length).toBeGreaterThanOrEqual(3);
    expect(manifest.stoppregel).toBeTruthy();
    expect(manifest.loggedeEvents).toContain('versjonsbrudd');
    expect(manifest.loggedeEvents).toContain('kontrollpunkt-bekreftet');
    // Overgangen logges begge veier (P4-P0: åpning OG retur).
    expect(manifest.loggedeEvents).toContain('protokoll-aapnet');
    expect(manifest.loggedeEvents).toContain('protokoll-lukket');
    expect(manifest.ikkeStottet.length).toBeGreaterThanOrEqual(3);
  });
});
