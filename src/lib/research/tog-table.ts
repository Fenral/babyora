/**
 * TOG (Thermal Overall Grade) - tabell per romtemperatur for søvn.
 *
 * Konsolidert fra HALO, ErgoPouch, Slumbersac (industri-consensus jun 2026).
 * Kryss-validert med Babyora sin egen tables.ts soevn-rad — sammenfaller.
 *
 * Babyora sin regelmotor bruker TempBand som primær abstraksjon for soevn-rad
 * i tables.ts. Denne TOG-tabellen er parallelt referanse-data + UI-hjelp.
 */

export type TogEntry = {
  /** Inklusiv min-temperatur i Celsius */
  tempMinC: number;
  /** Eksklusiv maks-temperatur i Celsius */
  tempMaxC: number;
  /** TOG-verdi for sleep-sack/sovepose */
  tog: number;
  /** Hva som skal være under sovepose (NO) */
  layersUnder: string;
  /** Hva som skal være under sovepose (EN) */
  layersUnderEn: string;
  /** Hvilken Babyora TempBand denne sammenfaller med */
  klemegBand:
    | 'tropisk'
    | 'ekstrem_varme'
    | 'varm'
    | 'mild'
    | 'kjolig'
    | 'kald'
    | 'frost'
    | 'streng_frost'
    | 'ekstrem';
  /** Hvilke kilder denne raden bygger på */
  sourceIds: string[];
};

export const TOG_TABLE: TogEntry[] = [
  {
    tempMinC: 26,
    tempMaxC: 100,
    tog: 0.2,
    layersUnder: 'Bleie eller sleeveless body',
    layersUnderEn: 'Diaper or sleeveless body',
    klemegBand: 'tropisk',
    sourceIds: ['halo-tog', 'ergopouch-guide'],
  },
  {
    tempMinC: 24,
    tempMaxC: 26,
    tog: 0.5,
    layersUnder: 'Short-sleeve body',
    layersUnderEn: 'Short-sleeve body',
    klemegBand: 'ekstrem_varme',
    sourceIds: ['halo-tog', 'ergopouch-guide', 'slumbersac'],
  },
  {
    tempMinC: 22,
    tempMaxC: 24,
    tog: 1.0,
    layersUnder: 'Long-sleeve body eller pyjamas',
    layersUnderEn: 'Long-sleeve body or pyjamas',
    klemegBand: 'varm',
    sourceIds: ['halo-tog', 'ergopouch-guide', 'slumbersac'],
  },
  {
    tempMinC: 20,
    tempMaxC: 22,
    tog: 1.5,
    layersUnder: 'Long-sleeve + footed pyjamas',
    layersUnderEn: 'Long-sleeve + footed pyjamas',
    klemegBand: 'mild',
    sourceIds: ['halo-tog', 'ergopouch-guide'],
  },
  {
    tempMinC: 18,
    tempMaxC: 20,
    tog: 2.5,
    layersUnder: 'Long-sleeve body + romper',
    layersUnderEn: 'Long-sleeve body + romper',
    klemegBand: 'kjolig',
    sourceIds: ['halo-tog', 'ergopouch-guide', 'slumbersac'],
  },
  {
    tempMinC: 16,
    tempMaxC: 18,
    tog: 3.5,
    layersUnder: 'Ullbody + long-sleeve + romper',
    layersUnderEn: 'Wool body + long-sleeve + romper',
    klemegBand: 'kald',
    sourceIds: ['halo-tog', 'merino-kids'],
  },
  {
    tempMinC: -100,
    tempMaxC: 16,
    tog: 3.5,
    layersUnder: 'Ullsett + sovepose (anbefal å øke romtemp før mer lag)',
    layersUnderEn: 'Wool set + sleep sack (recommend raising room temp before adding layers)',
    klemegBand: 'frost',
    sourceIds: ['halo-tog', 'merino-kids'],
  },
];

/**
 * Slå opp TOG-anbefaling for en gitt romtemperatur. Returnerer entry
 * med tempMinC <= tempC < tempMaxC. Faller tilbake på laveste entry
 * for utenfor-rekkevidde temperaturer.
 */
export function togForRoomTemp(tempC: number): TogEntry {
  for (const entry of TOG_TABLE) {
    if (tempC >= entry.tempMinC && tempC < entry.tempMaxC) {
      return entry;
    }
  }
  return TOG_TABLE[TOG_TABLE.length - 1];
}
