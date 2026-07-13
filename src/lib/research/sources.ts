/**
 * Citation-database for Babyora sin regelmotor.
 *
 * 11 kilder samlet fra forskningsrapport jun 2026 (se RESEARCH.md).
 * Hver kilde har stabilt id som brukes av age-thermoregulation, tog-table
 * og safety-flags for å koble regel → kilde.
 */

export type SourceType = 'consumer-guide' | 'medical-authority' | 'peer-reviewed' | 'industry';

export type ResearchSource = {
  /** Stabilt id, brukes som referanse i andre research-filer */
  id: string;
  /** Visningstittel */
  title: string;
  /** Direkte URL til kilden */
  url: string;
  /** Hvor autoritativ kilden er */
  type: SourceType;
  /** Hva denne kilden konkret bidrar med — én setning */
  keyFinding: string;
};

export const SOURCES: ResearchSource[] = [
  {
    id: 'weatherwisebaby-guide',
    title: 'WeatherWiseBaby — Dressing Your Newborn',
    url: 'https://weatherwisebaby.com/guides/dressing-newborn',
    type: 'consumer-guide',
    keyFinding: 'Generell guide uten alderssplit; cites AAP.',
  },
  {
    id: 'weatherwisebaby-calc',
    title: 'WeatherWiseBaby — Calculator',
    url: 'https://weatherwisebaby.com/',
    type: 'consumer-guide',
    keyFinding: 'Bekreftet 3-kategori-modell (0-3 / 3-6 / 6+ mnd) i calculator-tool.',
  },
  {
    id: 'aap-healthychildren',
    title: 'American Academy of Pediatrics — Dressing Your Newborn',
    url: 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Dressing-Your-Newborn.aspx',
    type: 'medical-authority',
    keyFinding: '"One layer more than adult"-regel; sleep-sacks anbefalt over løse pledd (SIDS).',
  },
  {
    id: 'howtodressbaby',
    title: 'HowToDressBaby — Multi-context calculator',
    url: 'https://howtodressbaby.com/',
    type: 'consumer-guide',
    keyFinding: '2-kategori (0-3 / 4+ mnd), 5 aktiviteter, 8 sleep-temp-bånd med TOG, "Neck Test"-signatur.',
  },
  {
    id: 'pmc-12386404',
    title: 'Narrative Review on Infants Thermoregulatory Response to Heat',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12386404/',
    type: 'peer-reviewed',
    keyFinding: 'Metabolic heat production peaks 8-9 mnd; surface-area-to-mass faller 28% fra 0 til 12 mnd; sweat capacity til stede ved fødsel men lower per gland.',
  },
  {
    id: 'pmc-7202982',
    title: 'Clothing layers and babywearing thermoregulation',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7202982/',
    type: 'peer-reviewed',
    keyFinding: '9 babyer <12 mnd; 15 min indoor babywearing med ekstra vest gir IKKE core-temp endring (skin +0.71°C, core -0.13°C).',
  },
  {
    id: 'halo-tog',
    title: 'HALO Sleep — TOG chart',
    url: 'https://www.halosleep.com/blogs/halo/tog-chart',
    type: 'industry',
    keyFinding: 'TOG-tabell per romtemp; overheating-tegn (sveiter, rødt, rask pust); cold-tegn (skjelver, kalde hender/føtter, fussiness).',
  },
  {
    id: 'ergopouch-guide',
    title: 'ErgoPouch — What to Wear Guide',
    url: 'https://www.ergopouch.com/pages/what-to-wear-guide',
    type: 'industry',
    keyFinding: '4 TOG-trinn standard: 0.2/0.3, 1.0, 2.5, 3.5.',
  },
  {
    id: 'slumbersac',
    title: 'Slumbersac — How Babies Regulate Body Temperature',
    url: 'https://www.slumbersac.co.uk/blogs/advice/baby-regulate-body-temperature',
    type: 'industry',
    keyFinding: 'Ved 9-12 mnd kan baby fullt tilpasse kroppstemperatur til eksterne forhold; head accounts for opptil 85% av heat loss i sovende infants.',
  },
  {
    id: 'merino-kids',
    title: 'Merino Kids UK — Temperature regulation in babies',
    url: 'https://merinokids.co.uk/blogs/merino/the-importance-of-temperature-regulation-in-babies',
    type: 'industry',
    keyFinding: 'Ull-spesifikk guide; bekrefter head heat-loss fakta og ull-fordeler ved fukt.',
  },
  {
    id: 'capital-area-peds',
    title: 'Capital Area Pediatrics — Dressing Your Child for Cold Weather',
    url: 'https://www.capitalareapediatrics.com/blog/dressing-your-child-for-cold-weather-in-virginia-a-parent-s-guide',
    type: 'medical-authority',
    keyFinding: 'Bekrefter "one more layer than adult"-regelen; outdoor-exposure-grenser per alder.',
  },
];

/** Slå opp kilde via id. Returnerer undefined hvis ikke funnet. */
export function getSource(id: string): ResearchSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

/** Filter kilder etter type (f.eks. kun peer-reviewed). */
export function sourcesByType(type: SourceType): ResearchSource[] {
  return SOURCES.filter((s) => s.type === type);
}
