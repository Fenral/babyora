/**
 * P1 «PROTOKOLLEN» — tester for protokollkompilatoren.
 *
 * (1) Semantikkporten: uttrykket LEST UT AV STEGENE består sjekkSemantikk
 *     for alle ti scenarier — med ikke-vakuøsitet og mutasjonsbevis
 *     (fjernet sikkerhetssteg / endret gyldighet → porten feiler).
 * (2) Retningsspesifikk atferd: bilstol-steget FØR ytterlag, nakkesjekk
 *     alltid sist, påkledningsrekkefølge innerst→ytterst, degradert som
 *     konservativ fallback + klokke-overgang, tilstandslinjens hvorfor.
 * (3) Språkporten: FORBUDTE_MONSTRE gjelder all tekst i protokoll+manifest.
 */

import { describe, expect, it } from 'vitest';
import { SCENARIER, scenarioForId, type Scenario } from '../felles/scenarier';
import {
  hentFakta,
  sjekkSemantikk,
  type NoytraleFakta,
} from '../felles/fakta';
import { DEGRADERT_NESTE_HANDLING, harForbudtSprak } from '../felles/tekst';
import { klassifiser, klassifiserDetaljert } from '../p1/klassifiserer';
import {
  GRENSEVAER_HYSTERESE_C,
  USIKKERHETSBAAND_C,
  grensevaerMarginC,
  usikkerhetsbaandC,
  type Modus,
} from '../p1/regeltabell';
import {
  AUTORITETSLINJE,
  NAKKESJEKK_ID,
  TOPPTEKST_FOR_TILGJENGELIGHET,
  erUtloptNaa,
  kompilerProtokoll,
  uttrykkFraProtokoll,
  type Protokoll,
  type Sone,
} from '../p1/protokollkompilator';
import { manifest } from '../p1/manifest';

function fakta(id: string): NoytraleFakta {
  const scenario = scenarioForId(id);
  if (!scenario) throw new Error(`ukjent scenario: ${id}`);
  return hentFakta(scenario);
}

function protokollFor(id: string): Protokoll {
  return kompilerProtokoll(fakta(id));
}

/**
 * Uavhengig fasit (samme kilde som klassifiserer-testens motorprobe).
 * endret-vaer: føles-som −5,9 °C ligger 1,1 °C fra −7-grensen — innenfor
 * vindmålingens deklarerte usikkerhetsbånd (±2 °C, vind 7 m/s) → Følg med
 * (Sols avvik a: maks(hysterese, usikkerhetsbånd), aldri «Vanlig dag»
 * når erklært måleusikkerhet kan krysse terskelen).
 */
const MODUS_FASIT: ReadonlyArray<[id: string, modus: Modus]> = [
  ['normal-dag', 'normal'],
  ['grensevaer', 'folg-med'],
  ['sovende-vognbarn', 'avvik'],
  ['bilstol', 'avvik'],
  ['manglende-vaerdata', 'degradert'],
  ['endret-vaer', 'folg-med'],
  ['utlopt-raad', 'degradert'],
  ['ny-omsorgsperson', 'normal'],
  ['dynamic-type', 'normal'],
  ['utendorslys', 'avvik'],
];

const ALLE_IDER = SCENARIER.map((s) => s.id);

/* ================================================================== *
 * 1) Semantikkporten — alle ti scenarier
 * ================================================================== */

describe('P1-transformatoren består sjekkSemantikk (spec §4.2)', () => {
  it.each(ALLE_IDER)('%s: uttrykket fra stegene består porten', (id) => {
    const f = fakta(id);
    const resultat = sjekkSemantikk(uttrykkFraProtokoll(kompilerProtokoll(f)), f);
    expect(resultat.mangler).toEqual([]);
    expect(resultat.ok).toBe(true);
  });

  it('porten er ikke-vakuøs: bilstol bærer ≥2 safety-ids (inkl. HB-9) og ≥1 stoppkriterium', () => {
    const uttrykk = uttrykkFraProtokoll(protokollFor('bilstol'));
    expect(uttrykk.safetyEventIds.length).toBeGreaterThanOrEqual(2);
    expect(uttrykk.safetyEventIds).toContain('HB-9');
    expect(uttrykk.stoppkriterier.length).toBeGreaterThanOrEqual(1);
  });

  it('MUTASJONSBEVIS: fjernes HB-9-steget fra protokollen, feiler porten', () => {
    const f = fakta('bilstol');
    const protokoll = kompilerProtokoll(f);
    const antallFoer = protokoll.steg.length;
    const mutert: Protokoll = {
      ...protokoll,
      steg: protokoll.steg.filter((s) => s.safetyEventId !== 'HB-9'),
    };
    expect(mutert.steg.length).toBe(antallFoer - 1); // det VAR et steg å fjerne

    const resultat = sjekkSemantikk(uttrykkFraProtokoll(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler).toContain('safety-event mangler: HB-9');
  });

  it('MUTASJONSBEVIS: endres gyldigheten i protokollen, feiler porten', () => {
    const f = fakta('normal-dag');
    const mutert: Protokoll = {
      ...kompilerProtokoll(f),
      gyldigTilISO: '2026-01-15T23:59:00+01:00',
    };
    const resultat = sjekkSemantikk(uttrykkFraProtokoll(mutert), f);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler.some((m) => m.startsWith('gyldighet avviker'))).toBe(true);
  });
});

/* ================================================================== *
 * 2) Modus + tilstandslinje
 * ================================================================== */

describe('modus og tilstandslinje', () => {
  it('fasiten dekker nøyaktig alle ti scenarier (ikke-vakuøs)', () => {
    expect(MODUS_FASIT.map(([id]) => id).sort()).toEqual([...ALLE_IDER].sort());
  });

  it.each(MODUS_FASIT)('%s → modus %s (og lik klassifisereren)', (id, forventet) => {
    const protokoll = protokollFor(id);
    expect(protokoll.modus).toBe(forventet);
    expect(protokoll.modus).toBe(klassifiser(fakta(id)));
  });

  it.each(ALLE_IDER)('%s: tilstandslinjen har fast topplinje + ikke-tomt hvorfor', (id) => {
    const { tilstand, tilgjengelighet } = protokollFor(id);
    if (tilgjengelighet === 'aktiv') {
      expect(['Vanlig dag', 'Følg med', 'Avvik']).toContain(tilstand.frase);
    } else {
      // Utilgjengelig råd bruker tilgjengelighetstopptekst — aldri «Avvik».
      expect(['Rådet er utløpt', 'Kan ikke beregnes']).toContain(tilstand.frase);
    }
    expect(tilstand.hvorfor.length).toBeGreaterThan(10);
  });

  it('frasene skiller modusene: normal-dag=Vanlig dag, grensevaer=Følg med, bilstol=Avvik', () => {
    expect(protokollFor('normal-dag').tilstand.frase).toBe('Vanlig dag');
    expect(protokollFor('grensevaer').tilstand.frase).toBe('Følg med');
    expect(protokollFor('bilstol').tilstand.frase).toBe('Avvik');
    expect(protokollFor('bilstol').tilstand.hvorfor).toBe(
      'Bilstol i kulde endrer hva som er trygt.',
    );
  });

  it('tilgjengelighet er en SEPARAT akse: aktive råd er aktiv, utilgjengelige aldri «Avvik»', () => {
    for (const id of ALLE_IDER) {
      const protokoll = protokollFor(id);
      if (protokoll.modus === 'degradert') {
        expect(protokoll.tilgjengelighet, id).not.toBe('aktiv');
        expect(protokoll.tilstand.frase, id).not.toBe('Avvik');
      } else {
        expect(protokoll.tilgjengelighet, id).toBe('aktiv');
      }
    }
    // Manglende data ≠ utløpt: to forskjellige topptekster.
    const mangler = protokollFor('manglende-vaerdata');
    expect(mangler.tilgjengelighet).toBe('kan-ikke-beregnes');
    expect(mangler.tilstand.frase).toBe('Kan ikke beregnes');
    const utlopt = protokollFor('utlopt-raad');
    expect(utlopt.tilgjengelighet).toBe('utlopt');
    expect(utlopt.tilstand.frase).toBe('Rådet er utløpt');
    expect(TOPPTEKST_FOR_TILGJENGELIGHET.utlopt).toBe('Rådet er utløpt');
    expect(TOPPTEKST_FOR_TILGJENGELIGHET['kan-ikke-beregnes']).toBe('Kan ikke beregnes');
  });
});

/* ================================================================== *
 * 2b) Grensevær-marginen — maks(hysterese, deklarert usikkerhetsbånd)
 * ================================================================== */

describe('grensevær-marginen (Sols avvik a)', () => {
  it('usikkerhetsbåndet følger svakeste premiss: vind 2°, nedbør 1,5°, temperatur 1°', () => {
    expect(usikkerhetsbaandC({ windMs: 7, precipMmH: 0 })).toBe(
      USIKKERHETSBAAND_C.vindmaaling,
    );
    expect(usikkerhetsbaandC({ windMs: 0, precipMmH: 1.2 })).toBe(
      USIKKERHETSBAAND_C.nedboersmengde,
    );
    expect(usikkerhetsbaandC({ windMs: 0, precipMmH: 0 })).toBe(
      USIKKERHETSBAAND_C.temperaturOmToTimer,
    );
    expect(USIKKERHETSBAAND_C.vindmaaling).toBe(2);
    expect(USIKKERHETSBAAND_C.nedboersmengde).toBe(1.5);
    expect(USIKKERHETSBAAND_C.temperaturOmToTimer).toBe(1);
  });

  it('marginen er aldri smalere enn hysteresen (±1 °C)', () => {
    expect(GRENSEVAER_HYSTERESE_C).toBe(1);
    expect(grensevaerMarginC({ windMs: 0, precipMmH: 0 })).toBe(1);
    expect(grensevaerMarginC({ windMs: 7, precipMmH: 0 })).toBe(2);
    expect(grensevaerMarginC({ windMs: 0, precipMmH: 0.5 })).toBe(1.5);
  });

  it('endret-vaer klassifiseres Følg med via grensevær-regelen (ikke Vanlig dag)', () => {
    const resultat = klassifiserDetaljert(fakta('endret-vaer'));
    expect(resultat.modus).toBe('folg-med');
    expect(resultat.regel.id).toBe('grensevaer');
    // Ikke-vakuøst: −5,9 er UTENFOR den gamle faste ±1°-marginen fra −7,
    // men innenfor vindmålingens deklarerte bånd (±2 °C).
    const feels = fakta('endret-vaer').vaergrunnlag!.feelsLikeC;
    expect(Math.abs(feels - -7)).toBeGreaterThan(1);
    expect(Math.abs(feels - -7)).toBeLessThanOrEqual(2);
  });
});

/* ================================================================== *
 * 3) Atferd: rekkefølge og innsetting av sikkerhetssteg
 * ================================================================== */

const SONE_TALL: Record<Sone, number> = {
  kjerne: 0,
  hode: 3,
  hender: 4,
  fotter: 5,
  utstyr: 6,
  sikkerhet: -1,
  kontroll: 99,
};

describe('påkledningsrekkefølgen (innerst→ytterst)', () => {
  it('normal-dag: plaggsteg i ikke-synkende sonerekkefølge, ≥3 soner, kjerne først', () => {
    const steg = protokollFor('normal-dag').steg.filter(
      (s) => s.sone !== 'sikkerhet' && s.sone !== 'kontroll',
    );
    expect(steg.length).toBeGreaterThanOrEqual(4); // ikke-vakuøst
    expect(steg[0].sone).toBe('kjerne');

    const tall = steg.map((s) => SONE_TALL[s.sone]);
    for (let i = 1; i < tall.length; i++) {
      expect(tall[i], `steg ${i} (${steg[i].handling})`).toBeGreaterThanOrEqual(
        tall[i - 1],
      );
    }
    expect(new Set(steg.map((s) => s.sone)).size).toBeGreaterThanOrEqual(3);
  });

  it('plaggsteg er verb-først («Ta på …» / «Gjør klar …»)', () => {
    const steg = protokollFor('normal-dag').steg.filter((s) =>
      s.id.startsWith('plagg-'),
    );
    expect(steg.length).toBeGreaterThan(0);
    for (const s of steg) {
      expect(s.handling).toMatch(/^(Ta på|Gjør klar) /);
    }
  });
});

describe('faseinndelingen i normalmodus (Sols P1-funn: ikke én flat liste)', () => {
  it('normal-dag: alle steg utenom nakkesjekken har fase, begge faser finnes', () => {
    const steg = protokollFor('normal-dag').steg;
    const stabel = steg.filter((s) => s.id !== NAKKESJEKK_ID);
    expect(stabel.length).toBeGreaterThanOrEqual(4); // ikke-vakuøst
    for (const s of stabel) {
      expect(s.fase, s.id).toMatch(/^(paa-barnet|uteklart)$/);
    }
    const faser = new Set(stabel.map((s) => s.fase));
    expect(faser.has('paa-barnet')).toBe(true);
    expect(faser.has('uteklart')).toBe(true);
    // Nakkesjekken tilhører ingen fase — den er egen kontrollflate.
    expect(steg[steg.length - 1].fase).toBeUndefined();
  });

  it.each(['normal-dag', 'grensevaer', 'endret-vaer'])(
    '%s: fasene er sammenhengende — alt «på barnet» kommer før alt «uteklart»',
    (id) => {
      const stabel = protokollFor(id).steg.filter((s) => s.id !== NAKKESJEKK_ID);
      const sisteInnerst = stabel.map((s) => s.fase).lastIndexOf('paa-barnet');
      const forsteUteklart = stabel.map((s) => s.fase).indexOf('uteklart');
      expect(sisteInnerst).toBeGreaterThanOrEqual(0);
      expect(forsteUteklart).toBeGreaterThan(sisteInnerst);
    },
  );

  it('fasegrensen går ved ytterlaget: yttertøy og utstyr er «uteklart», innerst er «på barnet»', () => {
    const f = fakta('normal-dag');
    const medYtterlag = kompilerProtokoll({
      ...f,
      basePlagg: [...f.basePlagg, { kategori: 'yttertoy', plagg: 'testytterlag' }],
    });
    const ytterlag = medYtterlag.steg.find((s) => s.handling === 'Ta på testytterlag');
    expect(ytterlag?.fase).toBe('uteklart');
    for (const s of medYtterlag.steg) {
      if (s.sone === 'utstyr') expect(s.fase, s.id).toBe('uteklart');
    }
    // Første plaggsteg (innerst) hører til «på barnet».
    const forstePlagg = medYtterlag.steg.find((s) => s.id.startsWith('plagg-'));
    expect(forstePlagg?.fase).toBe('paa-barnet');
  });

  it('bilstol-sikkerhetssteget (HB-9, før ytterlag) bærer fasen «uteklart»', () => {
    const f = fakta('bilstol');
    const medYtterlag = kompilerProtokoll({
      ...f,
      basePlagg: [...f.basePlagg, { kategori: 'yttertoy', plagg: 'testytterlag' }],
    });
    const hb9 = medYtterlag.steg.find((s) => s.safetyEventId === 'HB-9');
    expect(hb9).toBeTruthy();
    expect(hb9!.fase).toBe('uteklart');
  });
});

describe('bilstol-steget settes inn FØR ytterlaget (retningens kjernekrav)', () => {
  it('reelt bilstol-scenario: HB-9 ligger etter kjernelagene og før hode/hender/føtter/utstyr', () => {
    const steg = protokollFor('bilstol').steg;
    const hb9 = steg.findIndex((s) => s.safetyEventId === 'HB-9');
    expect(hb9).toBeGreaterThan(0);

    const kjerneIndekser = steg.flatMap((s, i) => (s.sone === 'kjerne' ? [i] : []));
    const ytreIndekser = steg.flatMap((s, i) =>
      s.sone === 'hode' || s.sone === 'hender' || s.sone === 'fotter' || s.sone === 'utstyr'
        ? [i]
        : [],
    );
    // Ikke-vakuøst: begge sider av innsettingspunktet finnes.
    expect(kjerneIndekser.length).toBeGreaterThan(0);
    expect(ytreIndekser.length).toBeGreaterThan(0);
    expect(Math.max(...kjerneIndekser)).toBeLessThan(hb9);
    expect(Math.min(...ytreIndekser)).toBeGreaterThan(hb9);
  });

  it('syntetisk ytterlag: HB-9-steget ligger umiddelbart FØR ytterlag-plagget', () => {
    const f = fakta('bilstol');
    // Motoren fjernet dressen (HB-9) — legg tilbake et ytterlagsplagg for å
    // bevise innsettingspunktet direkte.
    const medYtterlag: NoytraleFakta = {
      ...f,
      basePlagg: [...f.basePlagg, { kategori: 'yttertoy', plagg: 'testytterlag' }],
    };
    const steg = kompilerProtokoll(medYtterlag).steg;
    const hb9 = steg.findIndex((s) => s.safetyEventId === 'HB-9');
    const ytterlag = steg.findIndex((s) => s.handling === 'Ta på testytterlag');
    expect(hb9).toBeGreaterThan(0);
    expect(ytterlag).toBeGreaterThan(0);
    expect(hb9).toBeLessThan(ytterlag);
    // Ingen kroppssone-steg mellom sikkerhetssteget og ytterlaget.
    for (let i = hb9 + 1; i < ytterlag; i++) {
      expect(steg[i].sone).toBe('sikkerhet');
    }
  });

  it('myke hendelser blir kontrollsteg ETTER plaggene og FØR nakkesjekken (grensevaer)', () => {
    const steg = protokollFor('grensevaer').steg;
    const myke = steg.flatMap((s, i) =>
      s.sone === 'sikkerhet' && !s.kritisk ? [i] : [],
    );
    expect(myke.length).toBeGreaterThan(0); // SB-2 finnes i scenariet
    const sistePlagg = Math.max(
      ...steg.flatMap((s, i) => (s.id.startsWith('plagg-') ? [i] : [])),
    );
    const nakkesjekk = steg.findIndex((s) => s.id === NAKKESJEKK_ID);
    for (const i of myke) {
      expect(i).toBeGreaterThan(sistePlagg);
      expect(i).toBeLessThan(nakkesjekk);
      expect(steg[i].kontrollpunkt).toBeTruthy();
    }
  });
});

/* ================================================================== *
 * 4) Nakkesjekken — alltid sist, i alle moduser
 * ================================================================== */

describe('avsluttende nakkesjekk-steg', () => {
  it.each(ALLE_IDER)('%s: siste steg er nakkesjekken med kontrollpunkt og stoppkriterium', (id) => {
    const steg = protokollFor(id).steg;
    expect(steg.length).toBeGreaterThan(0);
    const siste = steg[steg.length - 1];
    expect(siste.id).toBe(NAKKESJEKK_ID);
    expect(siste.kritisk).toBe(true);
    expect(siste.kontrollpunkt).toContain('nakken');
    expect(siste.stoppkriterium).toContain('fjern ett lag');
    // Nakkesjekken finnes nøyaktig én gang.
    expect(steg.filter((s) => s.id === NAKKESJEKK_ID)).toHaveLength(1);
  });

  it('autoritetslinjen er den avtalte frasen', () => {
    expect(AUTORITETSLINJE).toBe('Protokollen ser været. Du ser barnet.');
  });
});

/* ================================================================== *
 * 5) Degradert — konservativ fallback + klokke-overgang
 * ================================================================== */

describe('degradert tilstand', () => {
  it.each(['manglende-vaerdata', 'utlopt-raad'])('%s: konservativ fallback, ingen plaggsteg', (id) => {
    const protokoll = protokollFor(id);
    expect(protokoll.modus).toBe('degradert');
    expect(protokoll.degradert).not.toBeNull();
    expect(protokoll.degradert!.fallback).toBe(DEGRADERT_NESTE_HANDLING);
    expect(protokoll.degradert!.fallback).toBe(
      'Kle etter årstid. Kjenn på nakken før dere går.',
    );
    expect(protokoll.degradert!.aarsak.length).toBeGreaterThan(5);
    expect(protokoll.steg.some((s) => s.id.startsWith('plagg-'))).toBe(false);
    expect(protokoll.steg[protokoll.steg.length - 1].id).toBe(NAKKESJEKK_ID);
  });

  it('OVERGANG: halvåpent intervall — utløpt fra og med gyldigTil (Sols avvik e)', () => {
    const protokoll = protokollFor('normal-dag'); // gjelder til 12:00
    expect(erUtloptNaa(protokoll, '2026-01-15T10:15:00+01:00')).toBe(false);
    expect(erUtloptNaa(protokoll, '2026-01-15T11:59:00+01:00')).toBe(false);
    // Rådet er gyldig FØR tidspunktet, ikke gjennom det: «til 09:30» betyr
    // utløpt klokken 09:30 — ingen grensetilstand der begge gjelder.
    expect(erUtloptNaa(protokoll, '2026-01-15T12:00:00+01:00')).toBe(true);
    expect(erUtloptNaa(protokoll, '2026-01-15T12:01:00+01:00')).toBe(true);
  });

  it('fail-safe: uleselig klokke regnes som utløpt', () => {
    expect(erUtloptNaa(protokollFor('normal-dag'), 'ikke-en-tid')).toBe(true);
  });
});

/* ================================================================== *
 * 6) Språkporten + manifestet
 * ================================================================== */

describe('FORBUDTE_MONSTRE og manifestet', () => {
  it('ingen forbudt retorikk i noen protokoll (alle ti scenarier)', () => {
    for (const id of ALLE_IDER) {
      expect(
        harForbudtSprak(JSON.stringify(protokollFor(id))),
        `scenario ${id}`,
      ).toBe(false);
    }
    expect(harForbudtSprak(AUTORITETSLINJE)).toBe(false);
  });

  it('ingen forbudt retorikk i manifestet', () => {
    expect(harForbudtSprak(JSON.stringify(manifest))).toBe(false);
  });

  it('scoringsfasiten dekker nøyaktig de ti scenariene og stemmer med kompilatoren', () => {
    expect(Object.keys(manifest.scoringsfasit).sort()).toEqual([...ALLE_IDER].sort());
    for (const [id, forventet] of MODUS_FASIT) {
      const fasit = manifest.scoringsfasit[id];
      expect(fasit.forventetModus, id).toBe(forventet);
      const protokoll = protokollFor(id);
      expect(protokoll.modus, id).toBe(fasit.forventetModus);
      expect(protokoll.tilstand.frase, id).toBe(fasit.forventetFrase);
      expect(fasit.korrektHandling.length).toBeGreaterThan(20);
    }
  });

  it('manifestet har farlige feil, stoppregel, events og ikke-støttet-liste (§3-malen)', () => {
    expect(manifest.farligeFeil.length).toBeGreaterThanOrEqual(3);
    expect(manifest.stoppregel).toContain('stopp');
    const eventTyper = manifest.loggedeEvents.map((e) => e.type);
    expect(eventTyper).toContain('degradert_overgang');
    expect(eventTyper).toContain('steg_bekreftet');
    expect(eventTyper).toContain('sloyfe_fullfort');
    expect(manifest.ikkeStottet.length).toBeGreaterThanOrEqual(4);
    expect(manifest.primaerHypotese.length).toBeGreaterThan(50);
    expect(manifest.isolertVariabel.length).toBeGreaterThan(30);
  });
});

/* ================================================================== *
 * 7) Sikkerhetssteg bærer innhold (ikke-vakuøsitet på stegnivå)
 * ================================================================== */

describe('sikkerhetssteg er STEG, ikke bannere', () => {
  it.each(['bilstol', 'utendorslys'] as const)(
    '%s: hvert hardt sikkerhetssteg er kritisk og har stoppkriterium',
    (id) => {
      const steg = protokollFor(id).steg.filter(
        (s) => s.sone === 'sikkerhet' && s.kritisk,
      );
      expect(steg.length).toBeGreaterThan(0);
      for (const s of steg) {
        expect(s.safetyEventId).toBeTruthy();
        expect(s.stoppkriterium).toBeTruthy();
        expect(s.handling.length).toBeGreaterThan(10);
      }
    },
  );

  it('scenario-typen er koblet: Scenario har bilstol-flagget kompilatoren leser', () => {
    const s: Scenario | undefined = scenarioForId('bilstol');
    expect(s?.bilstol).toBe(true);
  });
});
