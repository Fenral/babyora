/**
 * P3 AMBIENT BRIEFING — tester for briefbyggeren (transformatoren) og
 * tidslinjen.
 *
 * Del 1: semantikk-porten (spec v2 §4.2) — briefen bærer hele
 * sikkerhetssemantikken for ALLE ti scenarier, med mutasjonsbevis
 * (fjernes noe, feiler porten — grønt på fravær teller ikke).
 *
 * Del 2: retningsspesifikk atferd — delta med synlig versjonert
 * baseline, tidslinjesekvensen V1 → V2 → forsinket V1 (forkastes) →
 * utløp (maskert, enveis), degradert fallback, og tekstdoktrinen
 * (FORBUDTE_MONSTRE + kvittering heter «Åpnet», aldri fortolkende).
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import {
  hentFakta,
  labISO,
  sjekkSemantikk,
  type NoytraleFakta,
} from '../felles/fakta';
import {
  DEGRADERT_NESTE_HANDLING,
  deltaSetning,
  harForbudtSprak,
} from '../felles/tekst';
import {
  byggBrief,
  byggBriefInnhold,
  byggTidslinje,
  leggTilMinutter,
  lesBriefInnhold,
  tilRetningsUttrykk,
  KVITTERING_ETIKETT,
} from '../p3/briefbygger';
import { motta, START_TILSTAND, type BriefTilstand } from '../p3/brief-maskin';
import { manifest } from '../p3/manifest';

function scenario(id: string): Scenario {
  const s = scenarioForId(id);
  if (!s) throw new Error(`ukjent scenario: ${id}`);
  return s;
}

function fakta(id: string): NoytraleFakta {
  return hentFakta(scenario(id));
}

/** Gårsdagens motorberegnede antrekk for et delta-scenario. */
function antrekkIGaar(s: Scenario) {
  return hentFakta({ ...s, weather: s.weatherIGaar! }).basePlagg;
}

/* ------------------------------------------------------------------ *
 * Del 1 — semantikk-porten for alle ti scenarier
 * ------------------------------------------------------------------ */

describe('P3-briefbyggeren består semantikk-porten (alle ti scenarier)', () => {
  it('fikstursettet er komplett (ti scenarier — porten er ikke-vakuøs)', () => {
    expect(SCENARIER.length).toBe(10);
  });

  for (const s of SCENARIER) {
    it(`V1-briefen bærer full semantikk — ${s.id}`, () => {
      const f = hentFakta(s);
      const brief = byggBrief(f, {
        briefId: `${s.id}-b1`,
        versjon: 1,
        scenarioFingerprint: `test#${s.id}`,
      });
      const resultat = sjekkSemantikk(tilRetningsUttrykk(lesBriefInnhold(brief)), f);
      expect(resultat.mangler).toEqual([]);
      expect(resultat.ok).toBe(true);
    });
  }

  it('delta-formen (V2 med baseline) bærer samme fulle semantikk', () => {
    const s = scenario('endret-vaer');
    const f = hentFakta(s);
    const brief = byggBrief(f, {
      briefId: 'endret-vaer-b2',
      versjon: 2,
      scenarioFingerprint: 'test#endret-vaer',
      supersedes: 'endret-vaer-b1',
      baseline: { versjon: 1, vaer: s.weatherIGaar!, antrekk: antrekkIGaar(s) },
    });
    const resultat = sjekkSemantikk(tilRetningsUttrykk(lesBriefInnhold(brief)), f);
    expect(resultat.mangler).toEqual([]);
    expect(resultat.ok).toBe(true);
  });

  it('ikke-vakuøst: bilstol-briefen bærer faktisk HB-9 + stoppkriterium', () => {
    const innhold = byggBriefInnhold(fakta('bilstol'));
    expect(innhold.sikkerhet.length).toBeGreaterThanOrEqual(2);
    expect(innhold.sikkerhet.map((e) => e.id)).toContain('HB-9');
    const stopp = innhold.sikkerhet.flatMap((e) =>
      e.stoppkriterium ? [e.stoppkriterium] : [],
    );
    expect(stopp.length).toBeGreaterThanOrEqual(1);
    // Hard sikkerhet vinner den dominante handlingen.
    const hb9 = innhold.sikkerhet.find((e) => e.id === 'HB-9')!;
    expect(innhold.handling).toBe(
      innhold.sikkerhet.filter((e) => e.prioritet === 'hard')[0].innhold,
    );
    expect(hb9.prioritet).toBe('hard');
  });

  it('mutasjonsbevis: fjernes én safety-hendelse fra innholdet, feiler porten', () => {
    const f = fakta('bilstol');
    const innhold = byggBriefInnhold(f);
    expect(innhold.sikkerhet.some((e) => e.id === 'HB-9')).toBe(true); // det VAR noe å fjerne
    const mutert = {
      ...innhold,
      sikkerhet: innhold.sikkerhet.filter((e) => e.id !== 'HB-9'),
    };
    const resultat = sjekkSemantikk(tilRetningsUttrykk(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler).toContain('safety-event mangler: HB-9');
  });

  it('mutasjonsbevis: endres gyldigheten i innholdet, feiler porten', () => {
    const f = fakta('bilstol');
    const innhold = byggBriefInnhold(f);
    const mutert = {
      ...innhold,
      gyldighet: { ...innhold.gyldighet, gjelderTilISO: labISO('23:59') },
    };
    const resultat = sjekkSemantikk(tilRetningsUttrykk(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler.some((m) => m.startsWith('gyldighet avviker'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Del 2 — retningsspesifikk atferd
 * ------------------------------------------------------------------ */

describe('atferd 1: delta med synlig versjonert ANTREKKS-baseline (INV-6 + P3-P0)', () => {
  it('endret-vaer: deltaSetning + konkret lagendring med posisjon + antrekksbaseline', () => {
    const s = scenario('endret-vaer');
    const f = hentFakta(s);
    const iGaar = antrekkIGaar(s);
    const brief = byggBrief(f, {
      briefId: 'b2',
      versjon: 2,
      scenarioFingerprint: 'test',
      supersedes: 'b1',
      baseline: { versjon: 1, vaer: s.weatherIGaar!, antrekk: iGaar },
    });
    const innhold = lesBriefInnhold(brief);

    expect(innhold.form).toBe('delta');
    expect(innhold.delta).not.toBeNull();
    // Deltaet er NØYAKTIG felles-tekstens setning (aldri egen omskriving).
    expect(innhold.delta!.setning).toBe(deltaSetning(s.weatherIGaar!, s.weather!));
    // Mildt→vind/kulde: deltaet skal peke MOT flere lag, aldri færre.
    expect(innhold.delta!.setning).toContain('Kaldere enn i går');

    // HANDLINGSKOMPLETT (Sols P3-P0): konkret lag, posisjon og basePlagg-navn
    // — aldri det vage «Legg til et lag».
    expect(innhold.handling).toBe(
      'Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.',
    );
    expect(innhold.komfortHandling).toBe(innhold.handling);
    expect(/^legg til et lag\.?$/i.test(innhold.handling)).toBe(false);
    // Lagnavnet er et faktisk basePlagg i dagens antrekk.
    expect(innhold.basePlagg.some((p) => innhold.handling.includes(p.plagg))).toBe(true);

    // Synlig, VERSJONERT baseline: gårsdagens følt-verdi OG antrekk (2–3
    // nøkkelplagg) — baseline er et antrekk, ikke bare en temperatur.
    expect(innhold.delta!.baseline.versjon).toBe(1);
    expect(innhold.delta!.baseline.etikett).toMatch(
      /^i går V1 \(føltes -?\d+ °C\): .+/,
    );
    const etikettNavn = iGaar.filter((p) =>
      innhold.delta!.baseline.etikett.includes(p.plagg),
    );
    expect(etikettNavn.length).toBeGreaterThanOrEqual(2); // minst 2 nøkkelplagg
    expect(innhold.delta!.baseline.antrekk).toEqual(iGaar);
    expect(brief.baselineVersjon).toBe(1);
  });

  it('uten gårsdagsdata finnes ikke delta — full-liste-form, aldri diktet baseline', () => {
    const innhold = byggBriefInnhold(fakta('normal-dag'));
    expect(innhold.form).toBe('full-liste');
    expect(innhold.delta).toBeNull();
    expect(JSON.stringify(innhold)).not.toMatch(/i går V\d/);
  });
});

describe('atferd 1b: briefen er HANDLINGSKOMPLETT for alle ti scenarier (Sols P3-P0)', () => {
  it('hver brief i hver tidslinje bærer en konkret handling med basePlagg-navn', () => {
    let antallIkkeDegradert = 0;
    for (const s of SCENARIER) {
      for (const steg of byggTidslinje(s)) {
        if (steg.hendelse.type !== 'brief') continue;
        const innhold = lesBriefInnhold(steg.hendelse.brief);
        const ctx = `${s.id} / ${steg.hendelse.brief.briefId}`;

        // Det vage «legg til et lag» finnes ikke som handling noe sted.
        expect(/^legg til et lag\.?$/i.test(innhold.handling), ctx).toBe(false);

        if (innhold.form === 'degradert') {
          // Degradert: konservativ fallback ER handlingen — aldri plagg.
          expect(innhold.handling, ctx).toBe(DEGRADERT_NESTE_HANDLING);
          expect(innhold.komfortHandling, ctx).toBeNull();
          continue;
        }

        antallIkkeDegradert += 1;
        // Konkret antrekkshandling finnes alltid og navngir minst ett
        // faktisk basePlagg fra briefens egen liste.
        expect(innhold.komfortHandling, ctx).not.toBeNull();
        expect(
          innhold.basePlagg.some((p) => innhold.komfortHandling!.includes(p.plagg)),
          `${ctx}: «${innhold.komfortHandling}» navngir ingen basePlagg`,
        ).toBe(true);

        // Dominansregelen: hard sikkerhet vinner handlingen, ellers er
        // handlingen selve den konkrete antrekkshandlingen.
        const harde = innhold.sikkerhet.filter((e) => e.prioritet === 'hard');
        expect(innhold.handling, ctx).toBe(
          harde.length > 0 ? harde[0].innhold : innhold.komfortHandling,
        );

        // Semantikk-porten består mot briefens EGET faktagrunnlag
        // (V1 i delta-scenariet har morgenprognosens fakta).
        const resultat = sjekkSemantikk(tilRetningsUttrykk(innhold), steg.fakta);
        expect(resultat.mangler, ctx).toEqual([]);
      }
    }
    expect(antallIkkeDegradert).toBeGreaterThanOrEqual(8 * 3); // ikke-vakuøst
  });
});

describe('atferd 1c: V2 ENDRER handlingen i endret-vaer (Sols P3-P1)', () => {
  it('V1 (morgenprognose = i går): samme antrekk holder → V2: konkret lagendring', () => {
    const s = scenario('endret-vaer');
    const tidslinje = byggTidslinje(s);
    const briefs = tidslinje.flatMap((st) =>
      st.hendelse.type === 'brief' ? [st.hendelse.brief] : [],
    );
    const v1 = lesBriefInnhold(briefs.find((b) => b.versjon === 1)!);
    const v2 = lesBriefInnhold(briefs.find((b) => b.versjon === 2)!);

    // Begge er delta-form mot samme versjonerte baseline.
    expect(v1.form).toBe('delta');
    expect(v2.form).toBe('delta');
    expect(v1.delta!.baseline.versjon).toBe(1);
    expect(v2.delta!.baseline.versjon).toBe(1);

    // V1: prognosen er ennå uendret fra i går → bekreft antrekket.
    expect(v1.handling).toMatch(/^Samme antrekk som i går holder — .+/);
    expect(v1.basePlagg.some((p) => v1.handling.includes(p.plagg))).toBe(true);

    // V2: oppdatert prognose → handlingen ENDRES til en konkret lagendring
    // med navngitt lag og posisjon.
    expect(v2.handling).toBe(
      'Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.',
    );
    expect(v2.handling).not.toBe(v1.handling);

    // Endringen er reell: V2s antrekk skiller seg fra V1s (flere lag).
    expect(v2.basePlagg.length).toBeGreaterThan(v1.basePlagg.length);
  });
});

describe('atferd 2: tidslinjen V1 → V2 → forsinket V1 → utløp (maskert, enveis)', () => {
  it('kjører hele sekvensen for normal-dag med synlig forkastelse', () => {
    const s = scenario('normal-dag');
    const f = hentFakta(s);
    const tidslinje = byggTidslinje(s);

    expect(tidslinje.map((st) => st.etikett)).toEqual([
      'V1 ankommer',
      'V2 ankommer (oppdatert prognose, erstatter V1)',
      'Forsinket V1 ankommer på nytt (nettverkskø)',
    ]);

    let t: BriefTilstand = START_TILSTAND;

    // V1 ankommer → aktiv.
    t = motta(t, tidslinje[0].hendelse, { naaISO: tidslinje[0].tidISO });
    expect(t.status).toBe('aktiv');
    expect(t.gjeldende?.versjon).toBe(1);

    // V2 ankommer → V2 gjeldende, V1 maskert via supersedes.
    t = motta(t, tidslinje[1].hendelse, { naaISO: tidslinje[1].tidISO });
    expect(t.status).toBe('aktiv');
    expect(t.gjeldende?.versjon).toBe(2);
    expect(t.maskerte).toContain('normal-dag-b1');

    // Forsinket V1 → forkastes SYNLIG (aldri autoritativ igjen).
    t = motta(t, tidslinje[2].hendelse, { naaISO: tidslinje[2].tidISO });
    expect(t.gjeldende?.versjon).toBe(2);
    expect(t.forkastede.at(-1)).toMatchObject({
      briefId: 'normal-dag-b1',
      versjon: 1,
      grunn: 'maskert-enveis',
    });

    // Utløp ved gjelderTil → maskert.
    t = motta(t, { type: 'klokke' }, { naaISO: f.gyldighet.gjelderTilISO });
    expect(t.status).toBe('maskert');
    expect(t.maskerte).toContain('normal-dag-b2');

    // Klokkeavvik: stilles klokken tilbake, re-autoriseres ALDRI.
    t = motta(t, { type: 'klokke' }, { naaISO: tidslinje[1].tidISO });
    expect(t.status).toBe('maskert');
  });

  it('V2 bærer samme gyldighet og full plaggliste (fallback med samme stempel)', () => {
    const s = scenario('normal-dag');
    const f = hentFakta(s);
    const tidslinje = byggTidslinje(s);
    const stegV2 = tidslinje[1];
    if (stegV2.hendelse.type !== 'brief') throw new Error('forventet brief-steg');
    const innhold = lesBriefInnhold(stegV2.hendelse.brief);

    expect(stegV2.hendelse.brief.expiresAtISO).toBe(f.gyldighet.gjelderTilISO);
    expect(innhold.basePlagg.length).toBeGreaterThan(0); // ikke-vakuøst
    expect(innhold.basePlagg).toEqual(f.basePlagg); // full liste, uendret
  });

  it('leggTilMinutter: ren HH:MM-aritmetikk på lab-ISO', () => {
    expect(leggTilMinutter('2026-01-15T10:15:00+01:00', 20)).toBe(
      '2026-01-15T10:35:00+01:00',
    );
    expect(leggTilMinutter('2026-01-15T09:50:00+01:00', 30)).toBe(
      '2026-01-15T10:20:00+01:00',
    );
  });
});

describe('atferd 3: degradert og utløpt → strukturell maskering + konservativ fallback', () => {
  it('manglende-vaerdata: kun V1 i tidslinjen, degradert innhold, maskert ved ankomst', () => {
    const s = scenario('manglende-vaerdata');
    const tidslinje = byggTidslinje(s);
    expect(tidslinje.length).toBe(1);

    const steg = tidslinje[0];
    if (steg.hendelse.type !== 'brief') throw new Error('forventet brief-steg');
    const innhold = lesBriefInnhold(steg.hendelse.brief);
    expect(innhold.form).toBe('degradert');
    expect(innhold.handling).toBe(DEGRADERT_NESTE_HANDLING);
    expect(innhold.basePlagg).toEqual([]); // aldri gjettede plagg

    // gyldigTil == utstedt → maskeres i samme øyeblikk den ankommer.
    const t = motta(START_TILSTAND, steg.hendelse, { naaISO: steg.tidISO });
    expect(t.status).toBe('maskert');
  });

  it('utlopt-raad: briefen ankommer etter egen gyldighet og maskeres umiddelbart', () => {
    const s = scenario('utlopt-raad');
    const tidslinje = byggTidslinje(s);
    const steg = tidslinje[0];

    // Klokken står på scenariets «nå» (13:50) — briefen gjaldt til 09:30.
    const t = motta(START_TILSTAND, steg.hendelse, { naaISO: labISO(s.naa) });
    expect(t.status).toBe('maskert');
    // Enveis: samme brief på nytt forkastes synlig.
    const t2 = motta(t, steg.hendelse, { naaISO: labISO(s.naa) });
    expect(t2.forkastede.at(-1)?.grunn).toBe('maskert-enveis');
  });
});

describe('atferd 4: tekstdoktrinen — forbudte mønstre og kvitteringens navn', () => {
  it('ingen brief-tekst bryter FORBUDTE_MONSTRE, og «forstått» finnes ikke', () => {
    for (const s of SCENARIER) {
      for (const steg of byggTidslinje(s)) {
        if (steg.hendelse.type !== 'brief') continue;
        const tekst = steg.hendelse.brief.innhold + ' ' + steg.etikett;
        expect(harForbudtSprak(tekst), `${s.id}: ${steg.etikett}`).toBe(false);
        expect(/forstått/i.test(tekst), `${s.id}: ${steg.etikett}`).toBe(false);
      }
    }
  });

  it('kvitteringen heter «Åpnet» — aldri en fortolkningspåstand', () => {
    expect(KVITTERING_ETIKETT).toBe('Åpnet');
  });

  it('manifestet følger samme doktrine (ingen forbudte mønstre, ingen «forstått»)', () => {
    const tekst = JSON.stringify(manifest);
    expect(harForbudtSprak(tekst)).toBe(false);
    expect(/forstått/i.test(tekst)).toBe(false);
    // Manifestet er komplett etter §3-malen.
    expect(manifest.oppgaver.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(manifest.scoringsfasit).sort()).toEqual(
      SCENARIER.map((s) => s.id).sort(),
    );
    expect(manifest.farligeFeil.length).toBeGreaterThanOrEqual(3);
    expect(manifest.stoppregel).toBeTruthy();
    expect(manifest.loggedeEvents).toContain('brief-forkastet');
    expect(manifest.ikkeStottet.length).toBeGreaterThanOrEqual(3);
  });
});
