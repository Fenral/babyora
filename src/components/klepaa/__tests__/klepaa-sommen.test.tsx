/**
 * SØMMEN — porten som måler VEIEN, ikke destinasjonen.
 *
 * ═══ FUNNET DENNE PORTEN FINNES FOR ═══════════════════════════════════════
 * MÅLT 2026-08-05: `KlePaaStepper` var ferdig, portet og GRØNN på 36 av 36
 * målinger — og et grep etter komponentnavnet utenfor dens egen mappe ga null
 * treff. Knappen «Kle på, steg for steg» gikk fortsatt til Påkledning, som
 * viser hele antrekket som en liste. Eierens funn sto altså uendret i appen
 * mens porten sa grønt.
 *
 * Det er en egen feilklasse, og den er verdt å navngi:
 *
 *   EN KOMPONENT SOM IKKE ER NÅDD HAR IKKE RETTET NOE.
 *
 * Komponentporten var ikke feil. Den var ærlig om det den målte og taus om
 * alt annet — og «alt annet» inneholdt hele leveransen. En port som måler et
 * mål uten å måle at målet er koblet til, kan bestå på arbeid som ikke virker.
 *
 * ═══ DE FIRE MÅLENE ═══════════════════════════════════════════════════════
 *   1. RUTEVALGET ER RIKTIG. Dagens antrekk med en støttet bundel → sekvens.
 *      Planlagt, ustøttet, og manglende bundel → den gamle flaten.
 *   2. VALGET ER FAKTISK KOBLET TIL. App.tsx skal KALLE `klePaaKildeFor` og
 *      RENDRE `KlePaaOverlay`. Uten dette kunne rutefunksjonen vært aldri så
 *      korrekt og fortsatt vært død kode — nøyaktig forrige feil, én etasje
 *      opp.
 *   3. SEKVENSEN BLIR FAKTISK TIL STEG. Kilden ruta returnerer må gi minst
 *      ett steg gjennom `deriveKlePaaSteps`, ellers har brukeren gått fra en
 *      liste til en tom skjerm.
 *   4. IKKE-VAKUØSITET. Fixturen må være et EKTE, støttet snapshot. Bygges
 *      den feil, blir alt over grønt på fravær.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../../lib/wool-layers/types.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import type { OutfitTruthSnapshotV1 } from '../../../lib/outfit/outfit-truth.js';
import type { OutfitBundleProducerResult } from '../../../lib/outfit/outfit-bundle-producer.js';
import { klePaaKildeFor } from '../kle-paa-rute.js';
import { deriveKlePaaSteps } from '../KlePaaStepper.js';

const APP_KILDE = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');

/* ── FIXTUREN ─────────────────────────────────────────────────────────────
   Et EKTE snapshot fra motorens egen bygger, med EKTE plaggstrenger. En
   håndlaget objektliteral ville kunne bli grønn på en form motoren aldri
   produserer — og inngangen valideres strengt, så en gjettet form kaster.
   Samme mønster som lib/outfit/__tests__/outfit-map-layout.test.ts. */

const PLAGG = ['langermet ullbody', 'ull-jakke', 'isolert vinterdress'] as const;

const INPUT: RecommendInput = {
  weather: { feelsLikeC: -6, tempC: -2, windMs: 3, precipMmH: 0 },
  child: { ageMonths: 9 },
  activity: 'utelek',
};

function ektSnapshot(): OutfitTruthSnapshotV1 {
  const resultat = createOutfitTruthSnapshot({
    transitionContextId: 'transition:klepaa-sommen',
    input: INPUT,
    finalizedRecommendation: {
      ...recommend(INPUT),
      layers: [{ category: 'innerst', items: [...PLAGG] }],
    },
    pose: 'standing',
  });
  if (resultat.kind !== 'supported') {
    throw new Error(`fixturen er ikke et støttet snapshot: ${resultat.kind}`);
  }
  return resultat.snapshot;
}

const SNAPSHOT = ektSnapshot();

const støttetBundel = (): OutfitBundleProducerResult =>
  ({
    kind: 'supported',
    bundleVersion: 1,
    source: {},
    weather: {},
    base: SNAPSHOT,
    options: [],
  }) as unknown as OutfitBundleProducerResult;

const drill = (over: Record<string, unknown>) =>
  ({ kind: 'paakledning', source: 'current', outfitBundle: støttetBundel(), ...over }) as never;

/* ════════════════════════════════════════════════════════════════════════
   4. IKKE-VAKUØSITET — FØRST, fordi alt annet hviler på fixturen.
   ════════════════════════════════════════════════════════════════════════ */

describe('sømmen — fixturen er ekte', () => {
  it('snapshotet er støttet og bærer plaggene', () => {
    expect(
      SNAPSHOT.garments.length,
      'fixturens snapshot har ingen plagg — hver måling under ville vært grønn på tomhet',
    ).toBe(PLAGG.length);
  });
});

/* ════════════════════════════════════════════════════════════════════════
   1. RUTEVALGET
   ════════════════════════════════════════════════════════════════════════ */

describe('sømmen — CTA-en lander på sekvensen', () => {
  it('dagens antrekk med støttet bundel gir sekvensen', () => {
    const kilde = klePaaKildeFor(drill({}));
    expect(
      kilde,
      'CTA-en «Kle på, steg for steg» lander ikke på sekvensen — det var nettopp '
      + 'eierens funn: knappen lover en rekkefølge og flaten gir et oppslagsverk.',
    ).not.toBeNull();
    expect(kilde!.base).toBe(SNAPSHOT);
  });

  it.each([
    ['planlagt antrekk', { source: 'planned' }, 'der leser man et antrekk man ikke skal på med nå'],
    ['ustøttet kardinalitet', { outfitBundle: { kind: 'unsupported-cardinality' } }, 'ingen plaggliste å dele i steg'],
    ['utilgjengelig bundel', { outfitBundle: { kind: 'unavailable' } }, 'ingen plaggliste å dele i steg'],
    ['ingen bundel', { outfitBundle: undefined }, 'test- og preview-mounts uten payload'],
    ['et annet drill', { kind: 'plaggbib' }, 'bare påkledning skal kunne åpne sekvensen'],
  ])('%s beholder den gamle flaten', (_navn, over, hvorfor) => {
    expect(klePaaKildeFor(drill(over)), hvorfor).toBeNull();
  });

  it('null og undefined er trygge', () => {
    expect(klePaaKildeFor(null)).toBeNull();
    expect(klePaaKildeFor(undefined)).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════
   2. VALGET ER KOBLET TIL — forrige feil, én etasje opp.
   ════════════════════════════════════════════════════════════════════════ */

describe('sømmen — App.tsx bruker faktisk ruta', () => {
  it('kaller `klePaaKildeFor`', () => {
    expect(
      /\bklePaaKildeFor\s*\(/u.test(APP_KILDE),
      'App.tsx kaller ikke klePaaKildeFor. En rutefunksjon som ingen kaller er '
      + 'like død som komponenten den skulle koble inn.',
    ).toBe(true);
  });

  it('rendrer `KlePaaOverlay`', () => {
    expect(
      /<KlePaaOverlay[\s/>]/u.test(APP_KILDE),
      'App.tsx rendrer ikke KlePaaOverlay — sekvensen er bygget, portet og unådd.',
    ).toBe(true);
  });

  it('den gamle flaten er fortsatt der som reserve', () => {
    /* Reserven er ikke valgfri: uten den ville en ustøttet bundel gitt tom
       skjerm i stedet for listen. Målingen over ville vært grønn likevel. */
    expect(
      /<PaakledningScreen[\s/>]/u.test(APP_KILDE),
      'PaakledningScreen er borte — ustøttede bundler har da ingen flate å falle til',
    ).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════════════
   3. KILDEN BLIR FAKTISK TIL STEG
   ════════════════════════════════════════════════════════════════════════ */

describe('sømmen — kilden gir en sekvens, ikke en tom skjerm', () => {
  it('hvert plagg blir ett steg', () => {
    const kilde = klePaaKildeFor(drill({}))!;
    const steg = deriveKlePaaSteps(kilde);
    expect(
      steg.length,
      `ruta ga en kilde, men den ble til ${steg.length} steg. Brukeren har da gått `
      + 'fra en liste til ingenting.',
    ).toBe(PLAGG.length);
    expect(
      steg.every((s) => s.displayLabel.trim().length > 0),
      'et steg uten navn forteller ikke hvilket plagg som skal på',
    ).toBe(true);
    expect(
      new Set(steg.map((s) => s.itemId)).size,
      'to steg deler itemId — da kolliderer de som React-nøkler og i sveipet',
    ).toBe(PLAGG.length);
  });
});
