/**
 * Testselen — klokke, rekkefølge (Williams), logging, nullmodell, disclaimer.
 *
 * Fasit-prinsippet (port må ha fasit): hver egenskap bevises både positivt
 * og med mutasjonsbevis — et vanlig latinsk kvadrat SKAL feile
 * carryover-sjekken (Sols klarsignalmerknad), en lekk nullmodell SKAL
 * fanges av lekkasjesjekken, og et tomt uttrykk SKAL feile semantikkporten.
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId } from '../felles/scenarier';
import {
  hentFakta,
  labISO,
  semantikkAvtrykk,
  sjekkSemantikk,
  type RetningsUttrykk,
} from '../felles/fakta';
import { harForbudtSprak } from '../felles/tekst';
import { klokkeForScenario, lagKlokke } from '../felles/sele/klokke';
import {
  ARMER,
  WILLIAMS_ARMSEKVENSER,
  carryoverTelling,
  erCarryoverBalansert,
  erPosisjonsbalansert,
  maaleScenarier,
  rekkefolgeForDeltaker,
  SCENARIOFAMILIER,
  tildelScenarier,
  treningsScenarier,
  williamsSekvenser,
} from '../felles/sele/rekkefolge';
import { lagLogg, normaliserEvent } from '../felles/sele/logging';
import {
  NI_ORDS_REGELEN,
  nullarmTekster,
  nullmodellTekster,
} from '../felles/sele/nullmodell';
import {
  ALLE_NULLARMER,
  NULLARMER,
  nullarmFraParam,
  standardNullarm,
} from '../felles/sele/nullarmer';
import {
  forsteSetning,
  lesLabParametre,
  oppgavePromptFraManifest,
} from '../felles/sele/deltakermodus';
import {
  DISCLAIMER_TEKST,
  DISCLAIMER_TITTEL,
} from '../felles/sele/disclaimer';
import { manifest as p1Manifest } from '../p1/manifest';
import { manifest as p2Manifest } from '../p2/manifest';
import { manifest as p3Manifest } from '../p3/manifest';
import { manifest as p4Manifest } from '../p4/manifest';

/* ------------------------------------------------------------------ *
 * Virtuell klokke
 * ------------------------------------------------------------------ */

describe('klokke — virtuell klokke med fiksert start fra scenario', () => {
  it('starter på scenariets «nå» i labISO-format', () => {
    const scenario = scenarioForId('normal-dag')!;
    const klokke = klokkeForScenario(scenario);
    expect(klokke.naaISO()).toBe(labISO('10:15'));
    expect(klokke.naaISO()).toBe('2026-01-15T10:15:00+01:00');
  });

  it('spol(min) flytter klokka og varsler onTick-lyttere; avmelding virker', () => {
    const klokke = lagKlokke(labISO('10:15'));
    let tikk = 0;
    const av = klokke.onTick(() => {
      tikk += 1;
    });

    klokke.spol(30);
    expect(klokke.naaISO()).toBe('2026-01-15T10:45:00+01:00');
    expect(tikk).toBe(1);

    av();
    klokke.spol(15);
    expect(klokke.naaISO()).toBe('2026-01-15T11:00:00+01:00');
    expect(tikk).toBe(1); // avmeldt lytter varsles ikke
  });

  it('kan spole forbi rådets gyldighet — utløp blir en OVERGANG (streng-sammenlignbar ISO)', () => {
    const scenario = scenarioForId('normal-dag')!; // nå 10:15, gyldig til 12:00
    const klokke = klokkeForScenario(scenario);
    const fakta = hentFakta(scenario);

    expect(klokke.naaISO() <= fakta.gyldighet.gjelderTilISO).toBe(true);
    klokke.spol(120); // 10:15 → 12:15
    expect(klokke.naaISO() > fakta.gyldighet.gjelderTilISO).toBe(true);
  });

  it('tåler døgnrulling og beholder +01:00-formatet', () => {
    const klokke = lagKlokke(labISO('23:30'));
    klokke.spol(60);
    expect(klokke.naaISO()).toBe('2026-01-16T00:30:00+01:00');
    expect(klokke.naaISO()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+01:00$/);
  });
});

/* ------------------------------------------------------------------ *
 * Rekkefølge — Williams-design (Sols klarsignalmerknad)
 * ------------------------------------------------------------------ */

describe('rekkefolge — Williams-design for fem eksponeringer', () => {
  it('gir 2n = 10 sekvenser der hver er en permutasjon av alle fem armene', () => {
    expect(WILLIAMS_ARMSEKVENSER).toHaveLength(10);
    for (const sekvens of WILLIAMS_ARMSEKVENSER) {
      expect([...sekvens].sort()).toEqual([...ARMER].sort());
    }
  });

  it('er posisjonsbalansert: hver arm står i hver posisjon nøyaktig 2 ganger', () => {
    expect(erPosisjonsbalansert(WILLIAMS_ARMSEKVENSER)).toBe(true);
    for (let pos = 0; pos < 5; pos++) {
      for (const arm of ARMER) {
        const antall = WILLIAMS_ARMSEKVENSER.filter(
          (s) => s[pos] === arm,
        ).length;
        expect(antall, `${arm} i posisjon ${pos}`).toBe(2);
      }
    }
  });

  it('balanserer førsteordens carryover: hvert ordnede par forekommer nøyaktig 2 ganger', () => {
    expect(erCarryoverBalansert(WILLIAMS_ARMSEKVENSER)).toBe(true);
    const telling = carryoverTelling(WILLIAMS_ARMSEKVENSER);
    expect(telling.size).toBe(5 * 4); // alle ordnede par finnes
    for (const [par, antall] of telling) {
      expect(antall, par).toBe(2);
    }
  });

  it('MUTASJONSBEVIS: et vanlig latinsk kvadrat (sykliske skift) består IKKE carryover-sjekken', () => {
    // Sols merknad: «Et ordinært latinsk kvadrat gjør ikke nødvendigvis
    // dette alene for fem eksponeringer.» Her bevises det: kvadratet er
    // posisjonsbalansert, men carryover-skjevt (f.eks. følger 1 alltid 0).
    const syklisk = Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 5 }, (_, j) => (i + j) % 5),
    );
    expect(erPosisjonsbalansert(syklisk)).toBe(true);
    expect(erCarryoverBalansert(syklisk)).toBe(false);
  });

  it('williamsSekvenser(4) gir ett enkelt balansert kvadrat for like n', () => {
    const s4 = williamsSekvenser(4);
    expect(s4).toHaveLength(4);
    expect(erCarryoverBalansert(s4)).toBe(true);
    expect(erPosisjonsbalansert(s4)).toBe(true);
  });

  it('tildeler deltakere syklisk: deltaker 1 og 11 får samme sekvens, 1–10 er innbyrdes ulike', () => {
    expect(rekkefolgeForDeltaker(11)).toEqual(rekkefolgeForDeltaker(1));
    const sett = new Set(
      Array.from({ length: 10 }, (_, i) =>
        rekkefolgeForDeltaker(i + 1).join(','),
      ),
    );
    expect(sett.size).toBe(10);
  });
});

describe('rekkefolge — scenariofamilier (trening vs. måling adskilt)', () => {
  it('familiene dekker alle ti scenarier nøyaktig én gang', () => {
    const alle = [...treningsScenarier(), ...maaleScenarier()].sort();
    const fasit = SCENARIER.map((s) => s.id).sort();
    expect(alle).toEqual(fasit);
  });

  it('trenings- og målescenarier overlapper aldri', () => {
    const trening = new Set(treningsScenarier());
    for (const id of maaleScenarier()) {
      expect(trening.has(id), id).toBe(false);
    }
  });

  it('tildelScenarier gir ett målescenario per familie, alltid fra familiens egen måleliste', () => {
    for (let deltaker = 1; deltaker <= 10; deltaker++) {
      for (let posisjon = 0; posisjon < 5; posisjon++) {
        const t = tildelScenarier(deltaker, posisjon);
        expect(t.maaling).toHaveLength(SCENARIOFAMILIER.length);
        t.maaling.forEach((id, i) => {
          expect(SCENARIOFAMILIER[i].maaling).toContain(id);
        });
        expect(t.trening).toEqual(treningsScenarier());
      }
    }
  });

  it('rotasjonen varierer målescenariet der familien har flere kandidater', () => {
    const p0 = tildelScenarier(1, 0).maaling;
    const p1 = tildelScenarier(1, 1).maaling;
    expect(p0).not.toEqual(p1); // avviksklassen/normalklassen roterer
  });
});

/* ------------------------------------------------------------------ *
 * Logging
 * ------------------------------------------------------------------ */

describe('logging — hendelseslogg med virtuell tid og JSON-eksport', () => {
  it('normaliserer P1-objektsignaturen ({type, …} → event + detalj)', () => {
    expect(
      normaliserEvent([{ type: 'protokoll_vist', scenarioId: 'bilstol', modus: 'avvik' }]),
    ).toEqual({
      event: 'protokoll_vist',
      detalj: { scenarioId: 'bilstol', modus: 'avvik' },
    });
    expect(normaliserEvent([{ type: 'sloyfe_fullfort' }])).toEqual({
      event: 'sloyfe_fullfort',
    });
  });

  it('normaliserer P2/P3-strengsignaturen (event, detaljer)', () => {
    expect(normaliserEvent(['p2:oppgave-valgt', { oppgave: 'holder' }])).toEqual({
      event: 'p2:oppgave-valgt',
      detalj: { oppgave: 'holder' },
    });
    expect(normaliserEvent(['p3:brief_vist'])).toEqual({ event: 'p3:brief_vist' });
  });

  it('stempler innslag med den VIRTUELLE klokkas tid — spoling endrer stempelet', () => {
    const klokke = lagKlokke(labISO('10:15'));
    const logg = lagLogg();
    const skriv = logg.loggerFor('p1', 'normal-dag', klokke);

    skriv('foer_spoling');
    klokke.spol(60);
    skriv({ type: 'etter_spoling', naaISO: klokke.naaISO() });

    const innslag = logg.innslag();
    expect(innslag).toHaveLength(2);
    expect(innslag[0]).toMatchObject({
      tidISO: '2026-01-15T10:15:00+01:00',
      prototype: 'p1',
      scenario: 'normal-dag',
      event: 'foer_spoling',
    });
    expect(innslag[1].tidISO).toBe('2026-01-15T11:15:00+01:00');
    expect(innslag[1].event).toBe('etter_spoling');
  });

  it('eksporterer til JSON som runder trippen, og toem() nullstiller', () => {
    const klokke = lagKlokke(labISO('09:00'));
    const logg = lagLogg();
    logg.loggerFor('null', 'grensevaer', klokke)('null:melding_sendt', {
      tekst: 'ta med regntrekk',
    });

    const parsed = JSON.parse(logg.tilJSON());
    expect(parsed).toEqual([
      {
        tidISO: '2026-01-15T09:00:00+01:00',
        prototype: 'null',
        scenario: 'grensevaer',
        event: 'null:melding_sendt',
        detalj: { tekst: 'ta med regntrekk' },
      },
    ]);

    logg.toem();
    expect(logg.innslag()).toEqual([]);
    expect(JSON.parse(logg.tilJSON())).toEqual([]);
  });

  it('varsler abonnenter ved nye innslag; avmelding virker', () => {
    const klokke = lagKlokke(labISO('10:00'));
    const logg = lagLogg();
    let varsler = 0;
    const av = logg.abonner(() => {
      varsler += 1;
    });

    const skriv = logg.loggerFor('sele', 'normal-dag', klokke);
    skriv('sele:spol', { min: 30 });
    expect(varsler).toBe(1);
    av();
    skriv('sele:spol', { min: 60 });
    expect(varsler).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * Nullmodell — kontrollarmen
 * ------------------------------------------------------------------ */

/** Lekkasjesjekk: bærer noen av tekstene motor-semantikk fra faktalaget? */
function lekkasjer(tekster: string[], scenarioId: string): string[] {
  const fakta = hentFakta(scenarioForId(scenarioId)!);
  const alt = tekster.join(' ');
  const funn: string[] = [];
  for (const event of fakta.safetyEvents) {
    if (alt.includes(event.innhold)) funn.push(`innhold: ${event.id}`);
    if (event.stoppkriterium && alt.includes(event.stoppkriterium)) {
      funn.push(`stoppkriterium: ${event.id}`);
    }
  }
  for (const bp of fakta.basePlagg) {
    if (alt.includes(bp.plagg)) funn.push(`plagg: ${bp.plagg}`);
  }
  return funn;
}

describe('nullmodell — værapp-rådata uten motor-semantikk', () => {
  it('ni-ords-regelen er nøyaktig ni ord og uten forbudt språk', () => {
    expect(NI_ORDS_REGELEN.trim().split(/\s+/)).toHaveLength(9);
    expect(harForbudtSprak(NI_ORDS_REGELEN)).toBe(false);
  });

  it('viser rådata for alle ti scenarier — aldri forbudt språk, aldri lekkasje av safety-innhold/stoppkriterier/plagg', () => {
    for (const scenario of SCENARIER) {
      const tekster = nullmodellTekster(scenario);
      expect(tekster.length).toBeGreaterThan(0);
      for (const t of tekster) {
        expect(harForbudtSprak(t), `${scenario.id}: ${t}`).toBe(false);
      }
      expect(lekkasjer(tekster, scenario.id), scenario.id).toEqual([]);
    }
  });

  it('MUTASJONSBEVIS: en lekk tekstliste fanges av lekkasjesjekken', () => {
    const fakta = hentFakta(scenarioForId('bilstol')!);
    const hard = fakta.safetyEvents.find((e) => e.prioritet === 'hard')!;
    const lekk = [...nullmodellTekster(scenarioForId('bilstol')!), hard.stoppkriterium!];
    expect(lekkasjer(lekk, 'bilstol').length).toBeGreaterThan(0);
  });

  it('degraderte scenarier viser kun at data mangler — ingen gjetting, ingen råd', () => {
    const tekster = nullmodellTekster(scenarioForId('manglende-vaerdata')!);
    expect(tekster).toEqual(['Værdata er ikke tilgjengelig akkurat nå.']);
  });

  it('rådatalinjene inneholder scenariets faktiske verdier (ikke-vakuøst)', () => {
    const tekster = nullmodellTekster(scenarioForId('grensevaer')!).join(' ');
    expect(tekster).toContain('0 °C');
    expect(tekster).toContain('4 m/s');
    expect(tekster).toContain('1.2 mm/t');
    expect(tekster).toContain('sludd');
  });
});

/* ------------------------------------------------------------------ *
 * Nullarmer — oppgavespesifikke kontrollarmer (Sols fase 10-review,
 * nullmodell-P2: «påkledning, validering og handoff må ha hver sin
 * sammenlignbare slutt»)
 * ------------------------------------------------------------------ */

describe('nullarmer — oppgavespesifikke kontrollarmer', () => {
  it('tre armer med nøyaktig spec-komponentene: rådata+regel / regel+egen vurdering / meldingsfelt', () => {
    expect(ALLE_NULLARMER).toEqual([
      'null-paakledning',
      'null-validering',
      'null-handoff',
    ]);
    expect(NULLARMER['null-paakledning'].komponenter).toEqual([
      'raadata',
      'regel',
    ]);
    expect(NULLARMER['null-validering'].komponenter).toEqual([
      'regel',
      'egen-vurdering',
    ]);
    expect(NULLARMER['null-handoff'].komponenter).toEqual(['meldingsfelt']);
  });

  it('hver arm har unik sluttEvent (sammenlignbar slutt) og noterer hva som inngår i beslutningstiden', () => {
    const sluttEvents = ALLE_NULLARMER.map((a) => NULLARMER[a].sluttEvent);
    expect(new Set(sluttEvents).size).toBe(3);
    for (const arm of ALLE_NULLARMER) {
      const spec = NULLARMER[arm];
      expect(spec.beslutningstidInkluderer.length, arm).toBeGreaterThan(20);
      for (const tekst of [
        spec.navn,
        spec.oppgavePrompt,
        spec.beslutningstidInkluderer,
      ]) {
        expect(harForbudtSprak(tekst), `${arm}: ${tekst}`).toBe(false);
      }
      // Oppgaveprompten er én setning (ingen setningsgrense inni).
      expect(spec.oppgavePrompt, arm).not.toMatch(/\.\s+\S/);
    }
  });

  it('standardNullarm per oppgavetype: ny-omsorgsperson er handoff (overlevering), resten påkledning', () => {
    for (const scenario of SCENARIER) {
      expect(standardNullarm(scenario.id), scenario.id).toBe(
        scenario.id === 'ny-omsorgsperson'
          ? 'null-handoff'
          : 'null-paakledning',
      );
    }
  });

  it('armene er disjunkte flater: kun påkledning bærer rådata, kun handoff mangler regelen', () => {
    const scenario = scenarioForId('grensevaer')!;
    const paakledning = nullarmTekster(scenario, 'null-paakledning').join(' ');
    const validering = nullarmTekster(scenario, 'null-validering').join(' ');
    const handoff = nullarmTekster(scenario, 'null-handoff').join(' ');

    expect(paakledning).toContain('°C');
    expect(paakledning).toContain(NI_ORDS_REGELEN);
    expect(validering).not.toContain('°C'); // regel + egen vurdering, ingen rådata
    expect(validering).toContain(NI_ORDS_REGELEN);
    expect(handoff).not.toContain('°C'); // kun meldingsfeltet
    expect(handoff).not.toContain(NI_ORDS_REGELEN);
  });

  it('ingen arm lekker safety-innhold/stoppkriterier/plagg eller bruker forbudt språk — alle ti scenarier', () => {
    for (const scenario of SCENARIER) {
      for (const arm of ALLE_NULLARMER) {
        const tekster = nullarmTekster(scenario, arm);
        for (const t of tekster) {
          expect(harForbudtSprak(t), `${scenario.id}/${arm}: ${t}`).toBe(false);
        }
        expect(lekkasjer(tekster, scenario.id), `${scenario.id}/${arm}`).toEqual(
          [],
        );
      }
    }
  });

  it('nullarmFraParam godtar oppgavetype og full arm-id; MUTASJONSBEVIS: ukjent verdi avvises', () => {
    expect(nullarmFraParam('paakledning')).toBe('null-paakledning');
    expect(nullarmFraParam('validering')).toBe('null-validering');
    expect(nullarmFraParam('handoff')).toBe('null-handoff');
    expect(nullarmFraParam('null-validering')).toBe('null-validering');
    expect(nullarmFraParam('protokoll')).toBe(null);
    expect(nullarmFraParam('')).toBe(null);
    expect(nullarmFraParam(null)).toBe(null);
  });
});

/* ------------------------------------------------------------------ *
 * Deltakermodus — URL-kontrakt og oppgaveprompt (Sols fase 10-review,
 * FELLES-P0: «Første viewport skal vise oppgaveprompt og retningens
 * kjerne» — låst modus styrt av skjermbevis-skriptets URL-parametre)
 * ------------------------------------------------------------------ */

describe('deltakermodus — URL-kontrakt (skjermbevis-skriptet)', () => {
  it('parser skjermbevis-URL-en nøyaktig: ?modus=deltaker&arm=p1&scenario=bilstol', () => {
    expect(lesLabParametre('?modus=deltaker&arm=p1&scenario=bilstol')).toEqual({
      modus: 'deltaker',
      arm: 'p1',
      scenarioId: 'bilstol',
      nullarm: null,
      forhandsbekreftet: false,
    });
  });

  it('alle fem armer kan låses — null-armen med tildelt oppgavetype', () => {
    for (const arm of ARMER) {
      const p = lesLabParametre(`?modus=deltaker&arm=${arm}&scenario=normal-dag`);
      expect(p.modus, arm).toBe('deltaker');
      expect(p.arm, arm).toBe(arm);
    }
    const nullP = lesLabParametre(
      '?modus=deltaker&arm=null&scenario=ny-omsorgsperson&oppgave=handoff',
    );
    expect(nullP.modus).toBe('deltaker');
    expect(nullP.arm).toBe('null');
    expect(nullP.nullarm).toBe('null-handoff');
  });

  it('MUTASJONSBEVIS: ugyldig/manglende arm degraderes til operatørmodus — låst modus krever definert oppgave', () => {
    expect(
      lesLabParametre('?modus=deltaker&arm=p9&scenario=bilstol'),
    ).toMatchObject({ modus: 'operator', arm: null });
    expect(lesLabParametre('?modus=deltaker')).toMatchObject({
      modus: 'operator',
      arm: null,
    });
    expect(lesLabParametre('')).toEqual({
      modus: 'operator',
      arm: null,
      scenarioId: null,
      nullarm: null,
      forhandsbekreftet: false,
    });
  });

  it('&bekreftet=1 forhåndsbekrefter disclaimer (kun for skjermbevis); alle andre verdier gjør ikke', () => {
    expect(
      lesLabParametre('?modus=deltaker&arm=p1&scenario=bilstol&bekreftet=1')
        .forhandsbekreftet,
    ).toBe(true);
    expect(
      lesLabParametre('?modus=deltaker&arm=p1&scenario=bilstol&bekreftet=0')
        .forhandsbekreftet,
    ).toBe(false);
    expect(
      lesLabParametre('?modus=deltaker&arm=p1&scenario=bilstol')
        .forhandsbekreftet,
    ).toBe(false);
  });
});

describe('deltakermodus — oppgaveprompt fra manifestets aktive oppgave', () => {
  it('forsteSetning kutter til én setning, stryker metodenotat i parentes og normaliserer punktum', () => {
    expect(forsteSetning('Gjør A. Gjør B.')).toBe('Gjør A.');
    expect(forsteSetning('Les linjen og gjenfortell (teach-back).')).toBe(
      'Les linjen og gjenfortell.',
    );
    expect(forsteSetning('Uten punktum')).toBe('Uten punktum.');
    expect(forsteSetning('  Med luft rundt.  ')).toBe('Med luft rundt.');
  });

  it('gir én setning fra hvert ekte manifest — ikke-vakuøst mot faktisk manifestinnhold', () => {
    const p1 = oppgavePromptFraManifest(p1Manifest);
    const p2 = oppgavePromptFraManifest(p2Manifest);
    const p3 = oppgavePromptFraManifest(p3Manifest);
    const p4 = oppgavePromptFraManifest(p4Manifest);

    // P1/P3/P4: første oppgave i string-listen, redusert til én setning.
    expect(p1).toBe(forsteSetning(p1Manifest.oppgaver[0]));
    expect(p1).toContain('tilstandslinjen');
    expect(p3).toBe(forsteSetning(p3Manifest.oppgaver[0]));
    expect(p3).toContain('brief');
    expect(p4).toBe(forsteSetning(p4Manifest.oppgaver[0]));
    expect(p4).toContain('brief');

    // P2: den AKTIVE (scorbare) oppgavens navn uten metodenotat.
    expect(p2).toBe('«Holder dette?»');

    for (const prompt of [p1, p2, p3, p4]) {
      expect(prompt).not.toBeNull();
      expect(harForbudtSprak(prompt!)).toBe(false);
      expect(prompt!).not.toMatch(/\.\s+\S/); // én setning
    }
  });

  it('MUTASJONSBEVIS: manifest uten (gyldige) oppgaver gir null — prompten diktes aldri opp', () => {
    expect(oppgavePromptFraManifest(undefined)).toBe(null);
    expect(oppgavePromptFraManifest(null)).toBe(null);
    expect(oppgavePromptFraManifest({})).toBe(null);
    expect(oppgavePromptFraManifest({ oppgaver: [] })).toBe(null);
    expect(oppgavePromptFraManifest({ oppgaver: [42] })).toBe(null);
  });
});

/* ------------------------------------------------------------------ *
 * Disclaimer + semantikkporten sett fra selen
 * ------------------------------------------------------------------ */

describe('disclaimer — forskningsinformasjon før hver oppgave', () => {
  it('navngir fiksjonen (fiktive barn/vær), avviser ekte råd og varsler logging — uten forbudt språk', () => {
    const alt = `${DISCLAIMER_TITTEL} ${DISCLAIMER_TEKST}`;
    expect(alt).toContain('fiktive');
    expect(alt.toLowerCase()).toContain('ingenting her er ekte påkledningsråd');
    expect(alt.toLowerCase()).toContain('logg');
    expect(alt.toLowerCase()).toContain('ingen posisjon');
    expect(harForbudtSprak(alt)).toBe(false);
  });
});

describe('semantikkporten sett fra selen — alle ti scenarier', () => {
  it('et komplett uttrykk bygget fra avtrykket består porten for hvert scenario (porten er åpen for retningene)', () => {
    for (const scenario of SCENARIER) {
      const fakta = hentFakta(scenario);
      const avtrykk = semantikkAvtrykk(fakta);
      const uttrykk: RetningsUttrykk = {
        retning: 'sele-referanse',
        safetyEventIds: [...avtrykk.safetyEventIds],
        stoppkriterier: [...avtrykk.stoppkriterier],
        gyldigTil: avtrykk.gyldigTil,
      };
      const sjekk = sjekkSemantikk(uttrykk, fakta);
      expect(sjekk.ok, `${scenario.id}: ${sjekk.mangler.join('; ')}`).toBe(true);
    }
  });

  it('nullmodell-armen består ALDRI porten — kontrollarmen bærer bevisst ingen semantikk (porten er ikke-vakuøs)', () => {
    for (const scenario of SCENARIER) {
      const fakta = hentFakta(scenario);
      const nullUttrykk: RetningsUttrykk = {
        retning: 'null',
        safetyEventIds: [],
        stoppkriterier: [],
        gyldigTil: null,
      };
      const sjekk = sjekkSemantikk(nullUttrykk, fakta);
      expect(sjekk.ok, scenario.id).toBe(false);
    }
  });
});
