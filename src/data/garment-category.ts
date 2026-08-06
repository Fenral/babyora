/**
 * Programmatisk kategori-map for plagg — brukt av Plaggbiblioteket og
 * Min garderobe i Guide-seksjonen.
 *
 * Kategoriene matcher motorens lag-kategorier (`LayerId`) og fargetokens
 * `--garment-*` i `tokens.css`. Avledet fra grupperingen i
 * `garment-info.ts` / `garment-illustrations.ts`.
 *
 * Konvensjon: hode/hender/hals/føtter → `ekstra`; vogn-tilbehør + søvn +
 * hud → `utstyr` (eksternt utstyr som ikke er på barnet), i tråd med
 * REASON_TEMPLATE i `outfit-state.ts`.
 */

import type { GarmentId } from './garment-illustrations';

export type GarmentCategory =
  | 'innerst'
  | 'mellomlag'
  | 'yttertoy'
  | 'ekstra'
  | 'utstyr';

export const CATEGORY_LABEL: Record<GarmentCategory, string> = {
  innerst: 'Innerst',
  mellomlag: 'Mellomlag',
  yttertoy: 'Yttertøy',
  ekstra: 'Ekstra',
  utstyr: 'Utstyr',
};

export const CATEGORY_ORDER: GarmentCategory[] = [
  'innerst',
  'mellomlag',
  'yttertoy',
  'ekstra',
  'utstyr',
];

/** Ordnet plagg-liste per kategori (id-er matcher garment-info.ts-nøkler). */
export const GARMENTS_BY_CATEGORY: Record<GarmentCategory, GarmentId[]> = {
  innerst: [
    'kortermet-body',
    'kortermet-ullbody',
    'langermet-body',
    'langermet-ullbody',
    'langermet-ullbody-tynn',
    'ullsett-tynt',
    'ullsett-tykt',
    'to-ullsett',
    't-skjorte',
    'shorts',
    'lett-bukse',
    'bleie',
    'ullsokker',
  ],
  mellomlag: [
    'tynn-bukse',
    'tynn-ull-mellomlag',
    'ull-mellomlag',
    'ull-mellomlag-tykt',
    'ull-jakke',
    'ull-bukse',
    'tynn-pyjamas',
    'pyjamas',
    'ull-pyjamas',
  ],
  yttertoy: [
    'lett-kjoredress',
    'kjoredress',
    'vinterkjoredress',
    'vinterkjoredress-isolert',
    'vinterdress',
    'vinterdress-isolert',
    'regntoy-skall',
    'vindtett-skall',
  ],
  ekstra: [
    'solhatt',
    'lue-tynn',
    'lue',
    'lue-m-ull',
    'balaklava',
    'votter-tynne',
    'votter',
    'votter-tykke',
    'votter-dun',
    'vindvotter-skall',
    'hals',
    'sko',
    'toffel-sko',
    'sandaler',
    'vintersko',
    'vintersko-isolerte',
    /* «Tykke ullsokker (vinterdress dekker)» — fottøyets plass, ikke et
       ekstra par sokker. Uten oppføring her gir categoryFor() null, og
       classifyOutfitItem() (body-anchor-catalog.ts:221) forkaster hele
       klassifiseringen: plagget teller som umappet både mot katalogen og
       mot kroppen. Målt som 69/70 i inventory-v1 før denne linjen. */
    'vintersokker',
  ],
  utstyr: [
    'tynt-teppe',
    'dunteppe',
    'varmepose-lett',
    'varmepose',
    'varmepose-dun',
    'sauekinn-i-vogn',
    'regntrekk',
    'regnponcho-over-baeresele',
    'sovepose-0-5-tog',
    'sovepose-1-0-tog',
    'sovepose-1-5-tog',
    'sovepose-2-0-tog',
    'sovepose-2-5-tog',
    'sovepose-3-0-3-5-tog',
    'sovepose-3-5-tog',
    'ansiktskrem',
  ],
};

const CAT_OF: Record<GarmentId, GarmentCategory> = (() => {
  const out = {} as Record<GarmentId, GarmentCategory>;
  (Object.keys(GARMENTS_BY_CATEGORY) as GarmentCategory[]).forEach((cat) => {
    for (const id of GARMENTS_BY_CATEGORY[cat]) out[id] = cat;
  });
  return out;
})();

/** Slå opp kategori for et plagg-id. */
export function categoryFor(id: GarmentId): GarmentCategory | null {
  return CAT_OF[id] ?? null;
}
