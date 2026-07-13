import type { Recommendation } from './types.js';

/** Norsk etikett per ull-lag-kategori. Gjenbrukt i Home + Plan. */
export const CATEGORY_LABEL: Record<
  Recommendation['layers'][number]['category'],
  string
> = {
  innerst: 'Innerst',
  mellomlag: 'Mellomlag',
  yttertoy: 'Yttertøy',
  ekstra: 'Ekstra',
  utstyr: 'Utstyr',
};
