/**
 * SKJERMMANIFESTET GENERERES — et håndskrevet manifest råtner.
 *
 * Bakgrunn (DoD fase 2, Sol-blokker 6): `docs/design-notes/skjermmanifest.md`
 * skal liste alle shipping-skjermer med filsti, om de migreres og ansvarlig
 * fase, og være VALIDERINGSGRUNNLAGET for de andre fase 2-portene. Sols poeng
 * var at et slikt register ikke kan skrives for hånd: det er sant den dagen det
 * skrives og løgn en uke senere. Beviset ligger allerede i repoet — dagens
 * `lanseringsstatus-2026-08-03.md` peker fortsatt på `MinGarderobeScreen.tsx`,
 * en fil som ble slettet 2026-08-04. Generatoren melder den som utgått; en
 * prosa-liste hadde bare båret den videre.
 *
 * Derfor: `tools/skjermmanifest.mjs` utleder ALT som kan utledes av kode, og
 * KUN unntakene skrives for hånd i `skjermmanifest.unntak.json`. Denne porten
 * regenererer manifestet og feiler hvis filen på disk avviker.
 *
 * ─── HULLET PORTEN FINNES FOR ──────────────────────────────────────────────
 * `lazy()`-registeret i `App.tsx` gir TI moduler, ikke elleve.
 * `InnstillingerScreen` — 6230 linjer, 190 `CSSProperties`-objekter, null
 * `var(--dw-*)` — står ikke der. Den nås via `FamilieScreen.tsx:19`, en
 * 21-linjers passthrough. Genereres skjermlista fra `lazy()`, forsvinner
 * nøyaktig den skjermen hvis revisjon falt ut på API-feil 2026-08-03: den
 * største umålte flaten i appen, usynlig for hele fase 2.
 * `PaakledningScreen` er det motsatte tilfellet — i registeret, men utenfor
 * routeKey-kjeden (søsken-overlay på `App.tsx:761`/`:770`).
 *
 * Generatoren går derfor fra DISK (`src/screens/*.tsx` = fasit) og krever at
 * hver fil finnes igjen i minst én rutekilde, transitivt. Det er kjerneassertet.
 *
 * ─── IKKE-VAKUØSITET (riktig utgave) ───────────────────────────────────────
 * «Er skopet stort nok» duger ikke — det ble prøvd 2026-08-04 og godtok en
 * kommentarblokk. Porten beviser at den fant MÅLENE SINE:
 *   1. de navngitte ankerskjermene er i den PARSEDE skjermmengden,
 *   2. hver av de fem rutekildene ga et ikke-tomt, forventet utvalg,
 *   3. hver rutereferanse løser opp til en fil som finnes på disk,
 *   4. hvert håndskrevet unntak peker på en fil som finnes,
 *   5. hver eierpunkt-id finnes i `vedtak.json`,
 *   6. funnene fra lanseringsstatusen traff faktisk skjermer.
 *
 * ─── KOMMENTARER STRIPPES FØRST ────────────────────────────────────────────
 * Ikke teoretisk her. `App.tsx` nevner `GuideHubScreen`,
 * `PlannedPaakledningScreen` og `CurrentPaakledningScreen` KUN i kommentarer,
 * og `GuideHubScreen.tsx` er slettet i P6. Uten stripping ville generatoren
 * meldt en rutereferanse til en fil som ikke finnes — og assert 3 over ville
 * strøket på PROSA i stedet for på kode. Testen under sjekker begge veier:
 * at strippingen faktisk fjernet noe, og at det den fjernet ikke finnes på disk.
 *
 * ─── BASELINE ──────────────────────────────────────────────────────────────
 * Se BASELINE under. Tallet er dagens antall, og kan bare KRYMPE — fase 3
 * ratsjer det til null, og null blir nytt låst gulv.
 * EIERRAPPORTERTE FUNN KAN ALDRI BASELINES: `paakledning-gjenoppbygges` og
 * `kle-paa-stepper` telles utenfor gulvet og har ingen toleranse i det hele
 * tatt — de lukkes først når vedtaket står `laast` i `vedtak.json`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ROT,
  MANIFEST_STI,
  byggManifest,
  samleManifest,
  stripKommentarer,
  lesSkjermerFraDisk,
} from '../../../tools/skjermmanifest.mjs';

/**
 * BASELINE — dagens antall, gulvet porten feiler ved ØKNING av.
 * Tallene kan bare KRYMPE. Fase 3 ratsjer `umigrerteIFase3` til 0 over de ni
 * skjermene i manifestet; når den står i 0 er 0 nytt låst gulv.
 * `eierpunkter` er IKKE en baseline — se kommentaren over og testen under.
 */
const BASELINE = {
  /** Skjermer i fase 3-kohorten med gjenstående migreringsgjeld: 9 av 9. */
  umigrerteIFase3: 9,
} as const;

/**
 * IKKE-VAKUØSITETSGULV, ikke en baseline. Faller antallet skjermer, har skopet
 * kollapset — det er nøyaktig slik en port begynner å bestå på fravær.
 * Dette tallet skal bare kunne VOKSE, og en bevisst sletting (slik
 * MinGarderobeScreen ble slettet 2026-08-04) senker det med et eget vedtak.
 */
const MINST_ANTALL_SKJERMER = 11;

/**
 * ANKRENE porten må finne igjen. Ikke «minst n filer» — navngitte mål.
 * InnstillingerScreen er hele grunnen til at generatoren går fra disk.
 * PaakledningScreen er grunnen til at den ikke går fra routeKey-kjeden.
 */
const ANKERSKJERMER = [
  'src/screens/InnstillingerScreen.tsx',
  'src/screens/PaakledningScreen.tsx',
  'src/screens/FamilieScreen.tsx',
  'src/screens/HjemScreen.tsx',
  'src/screens/UkeScreen.tsx',
] as const;

/** De fem rutekildene, med det utvalget de MÅ gi for at lesningen skal telle. */
const RUTEKILDER = {
  lazyRegister: 10,
  ruteNokler: 8,
  drillKinds: 4,
  tabDefs: 3,
  familieToolTargets: 3,
} as const;

const m = samleManifest(ROT);
const stiene = m.rader.map((r) => r.sti);

describe('skjermmanifestet genereres — ikke-vakuøsitet', () => {
  it('fant skjermfilene på disk, og alle ankerskjermene er blant dem', () => {
    expect(
      stiene.length,
      `fant ${stiene.length} skjermer — skopet har kollapset under gulvet ${MINST_ANTALL_SKJERMER}`,
    ).toBeGreaterThanOrEqual(MINST_ANTALL_SKJERMER);
    for (const anker of ANKERSKJERMER) {
      expect(stiene, `ankerskjermen ${anker} er ikke i den parsede mengden`).toContain(anker);
    }
  });

  it('alle fem rutekildene ga et utvalg — ingen tom parse som later som den leste', () => {
    const r = m.naa.rute;
    expect(r.lazyRegister.length, 'lazy()-registeret ble ikke parset').toBe(RUTEKILDER.lazyRegister);
    expect(r.ruteNokler.length, 'routeKey-tildelingene ble ikke parset').toBe(RUTEKILDER.ruteNokler);
    expect(r.drillKinds.length, `Drill-unionens kinds: ${r.drillKinds.join(', ')}`)
      .toBe(RUTEKILDER.drillKinds);
    expect(r.tabDefs.length, 'TAB_DEFS ble ikke parset').toBe(RUTEKILDER.tabDefs);
    expect(r.familieToolTargets.length, 'FamilieToolTarget ble ikke parset')
      .toBe(RUTEKILDER.familieToolTargets);
    console.log(
      `\n  skjermmanifest: ${stiene.length} skjermer · ${r.lazyRegister.length} lazy · `
      + `${r.ruteNokler.length} routeKeys · ${r.drillKinds.length} drill-kinds · `
      + `${m.funnTreff} funnpunkter · ${m.tall.eierpunkter} eierpunkter\n`,
    );
  });

  it('hver rutereferanse løser opp til en fil som finnes — ingen prosa i skopet', () => {
    expect(
      m.naa.hengende,
      `ruteren refererer til skjermer som ikke finnes på disk: ${m.naa.hengende.join(', ')}`,
    ).toEqual([]);
  });

  it('kommentarstrippingen fjernet faktisk noe, og det den fjernet finnes ikke på disk', () => {
    // Uten denne testen kan strippingen slutte å virke uten at noe merker det.
    expect(
      m.naa.rute.kunIProsa.length,
      'App.tsx skal ha minst ett skjermnavn som KUN står i en kommentar '
      + '(GuideHubScreen, slettet i P6) — finner porten null, er strippingen død '
      + 'eller kommentaren borte, og assertet over er ikke lenger et bevis',
    ).toBeGreaterThan(0);
    expect(m.naa.rute.kunIProsa).toContain('GuideHubScreen');
    const paaDisk = new Set(lesSkjermerFraDisk(ROT).map((s) => s.split('/').pop()));
    for (const navn of m.naa.rute.kunIProsa) {
      expect(
        paaDisk.has(`${navn}.tsx`),
        `${navn} står kun i prosa OG finnes på disk — da måler ikke testen det den tror`,
      ).toBe(false);
    }
    // Og strippingen flytter ingen linje: linjetallet skal være uendret.
    const raa = readFileSync(join(ROT, 'src/App.tsx'), 'utf8').replace(/\r\n/gu, '\n');
    expect(stripKommentarer(raa).split('\n').length).toBe(raa.split('\n').length);
  });

  it('hvert håndskrevet unntak peker på en fil som finnes', () => {
    const alle = [
      ...Object.keys(m.unntak.unntak),
      ...Object.keys(m.unntak.visningsnavn),
      ...Object.keys(m.unntak.lanseringsstatusnavn),
      ...Object.keys(m.unntak.tilleggsfase ?? {}),
      ...Object.keys(m.unntak.eierpunkter ?? {}),
    ];
    for (const sti of alle) {
      expect(stiene, `unntaksfila nevner ${sti}, som ikke er en skjerm på disk`).toContain(sti);
    }
    for (const x of m.unntak.ikkeSkjermer) {
      expect(
        readFileSync(join(ROT, x.fil), 'utf8').length,
        `${x.fil} er ført som eksplisitt unntak, men finnes ikke`,
      ).toBeGreaterThan(0);
    }
    // Hver skjerm SKAL ha et visningsnavn — ellers står den navnløs i manifestet.
    for (const sti of stiene) {
      expect(m.unntak.visningsnavn[sti], `${sti} mangler visningsnavn`).toBeTruthy();
    }
  });

  it('hver eierpunkt-id finnes i vedtak.json og er eierrapportert', () => {
    const punkter = m.rader.flatMap((r) => r.eierpunkter);
    expect(punkter.length, 'null eierpunkter funnet — porten måler ingenting her')
      .toBeGreaterThan(0);
    for (const e of punkter) {
      expect(e.vedtak, `eierpunkt «${e.id}» finnes ikke i vedtak.json`).not.toBeNull();
      expect(
        e.vedtak?.kilde ?? '',
        `«${e.id}» er ført som EIERrapportert, men kilden nevner ikke eieren`,
      ).toMatch(/eier/iu);
    }
  });

  it('lanseringsstatusens funn traff faktisk skjermene', () => {
    const medFunn = m.rader.filter((r) => r.funn.length > 0);
    expect(medFunn.length, 'ingen skjerm fikk funnpunkter — parsen av lanseringsstatusen er tom')
      .toBeGreaterThanOrEqual(8);
    const tagger = new Set(m.rader.flatMap((r) => r.funn.map((f) => f.tag)));
    expect(tagger, 'T-01-lista ble ikke løftet inn').toContain('T-01');
    expect(tagger, 'adresselista (skyggestabler → --dw-depth-*) ble ikke løftet inn')
      .toContain('adresseliste');
    const lister = new Set(m.rader.flatMap((r) => r.funn.map((f) => f.liste)));
    expect(lister, 'kosmetisk-lista ble ikke løftet inn').toContain('KOSMETISK');
  });
});

describe('skjermmanifestet genereres — kjerneporten', () => {
  it('hver skjerm på disk nås fra minst én rutekilde', () => {
    const uten = m.naa.uNaabare;
    expect(
      uten,
      'disse ligger i src/screens/ men ingen rutekilde når dem — de er usynlige '
      + `for enhver port som genererer skjermlista fra ruteren:\n  ${uten.join('\n  ')}`,
    ).toEqual([]);
  });

  it('InnstillingerScreen nås KUN gjennom FamilieScreen — hullet porten finnes for', () => {
    // Dokumenterer selve hullet: den står ikke i lazy()-registeret, og faller ut
    // av enhver liste som genereres derfra.
    const innst = m.rader.find((r) => r.sti === 'src/screens/InnstillingerScreen.tsx');
    expect(m.naa.rute.lazyRegister).not.toContain('src/screens/InnstillingerScreen.tsx');
    expect(innst?.vei).toBe('rendres av FamilieScreen.tsx');
  });

  it('«snart» blir ikke en falsk 12. skjerm', () => {
    expect(m.naa.rute.guideTargets, 'GuideTarget skal fortsatt bære planlegg-viewet')
      .toContain('snart');
    expect(stiene.some((s) => /snart/iu.test(s)), '«snart» er talt som skjerm').toBe(false);
  });
});

describe('skjermmanifestet genereres — filen på disk', () => {
  it(`${MANIFEST_STI} er identisk med det generatoren utleder`, () => {
    const generert = byggManifest(ROT);
    const paaDisk = readFileSync(join(ROT, MANIFEST_STI), 'utf8').replace(/\r\n/gu, '\n');
    expect(
      paaDisk,
      `${MANIFEST_STI} avviker fra koden. Den er GENERERT — rediger `
      + 'skjermmanifest.unntak.json og kjør «node tools/skjermmanifest.mjs --skriv».',
    ).toBe(generert);
  });

  it('manifestet deler 11 skjermer i 9 som migreres + 2 unntatt', () => {
    expect(m.tall.skjermer).toBe(m.tall.migreres + m.tall.unntatt);
    expect(m.tall.migreres, 'fase 3 er én runde over ni skjermer (DoD fase 3)').toBe(9);
    expect(m.tall.unntatt, 'to skjermer er unntatt, med skriftlig grunn hver').toBe(2);
    for (const r of m.rader.filter((x) => !x.migreres)) {
      expect(r.unntaksgrunn, `${r.sti} er unntatt uten begrunnelse`).toBeTruthy();
      expect(r.fase, `${r.sti} er unntatt uten ansvarlig fase`).toBeTruthy();
    }
  });
});

describe('skjermmanifestet genereres — baseline og eierpunkter', () => {
  it(`umigrerte skjermer i fase 3-kohorten ≤ ${BASELINE.umigrerteIFase3}`, () => {
    const umigrerte = m.rader.filter((r) => r.migreres && r.umigrert);
    expect(
      umigrerte.length,
      `baselinen kan bare KRYMPE. Gulv ${BASELINE.umigrerteIFase3}, målt `
      + `${umigrerte.length}:\n  ${umigrerte.map((r) => `${r.sti} (${r.legacyTokens.length} legacy, ${r.raaHex} rå hex, ${r.dwForbruk} --dw-*)`).join('\n  ')}`,
    ).toBeLessThanOrEqual(BASELINE.umigrerteIFase3);
  });

  it('eierrapporterte punkter er ALDRI en del av gulvet', () => {
    const bærere = m.rader.filter((r) => r.eierpunkter.length > 0);
    expect(bærere.length, 'ingen skjerm bærer eierpunkter — mistet porten dem?')
      .toBeGreaterThan(0);
    for (const r of bærere) {
      expect(
        r.migreres,
        `${r.sti} bærer eierrapporterte funn og ville blitt talt inn i `
        + 'fase 3-baselinen. Eierrapporterte funn kan ALDRI baselines.',
      ).toBe(false);
    }
  });

  it('hvert eierpunkt står fortsatt ÅPENT i vedtak.json — ingen toleranse', () => {
    for (const e of m.rader.flatMap((r) => r.eierpunkter)) {
      expect(
        e.vedtak?.status,
        `«${e.id}» står nå «${e.vedtak?.status}». Er den låst, skal den ut av `
        + 'skjermmanifest.unntak.json og manifestet regenereres — ikke bli stående '
        + 'som et åpent punkt ingen lenger jobber med.',
      ).not.toBe('laast');
    }
  });
});
