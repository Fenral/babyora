import { garmentFactFor, type GarmentFact } from '../../data/garment-facts.js';
import {
  displayNameForDbString,
  garmentDisplayName,
} from '../../data/garment-display-names.js';
import { localizedGarmentName } from '../../data/garment-display-names-localized.js';
import {
  garmentIdFor,
  garmentPngSafe,
  type GarmentId,
} from '../../data/garment-illustrations.js';
import {
  isOutfitBundleProducerResult,
  type OutfitBundleProducerResult,
} from './outfit-bundle-producer.js';
import type { OutfitItemId } from './outfit-truth.js';
import { getAlternatives } from '../wool-layers/alternatives.js';

export type HomeAlternativeLanguage = 'da' | 'en' | 'no' | 'sv';

export type HomeGarmentAlternativeItem = Readonly<{
  optionId: string;
  sourceItemId: OutfitItemId;
  targetCatalogGarmentId: string | null;
  name: string;
  imageSrc: string;
  fact: GarmentFact;
  advantages: readonly string[];
  tradeoffs: readonly string[];
}>;

export type HomeGarmentAlternativeGroup = Readonly<{
  source: Readonly<{
    itemId: OutfitItemId;
    catalogGarmentId: string | null;
    name: string;
    imageSrc: string;
    fact: GarmentFact;
    advantages: readonly string[];
    tradeoffs: readonly string[];
  }>;
  alternatives: readonly HomeGarmentAlternativeItem[];
}>;

const GENERIC_COMPARISON: Readonly<
  Record<Exclude<HomeAlternativeLanguage, 'no'>, Readonly<{
    advantage: string;
    tradeoff: string;
  }>>
> = Object.freeze({
  en: Object.freeze({
    advantage: 'A safe alternative for this place in today\'s outfit.',
    tradeoff: 'The material, warmth and feel may differ from the recommendation.',
  }),
  sv: Object.freeze({
    advantage: 'Ett säkert alternativ för denna plats i dagens klädsel.',
    tradeoff: 'Material, värme och känsla kan skilja sig från rekommendationen.',
  }),
  da: Object.freeze({
    advantage: 'Et sikkert alternativ til denne plads i dagens påklædning.',
    tradeoff: 'Materiale, varme og fornemmelse kan afvige fra anbefalingen.',
  }),
});

const GENERIC_RECOMMENDATION: Readonly<
  Record<Exclude<HomeAlternativeLanguage, 'no'>, Readonly<{
    advantage: string;
    tradeoff: string;
  }>>
> = Object.freeze({
  en: Object.freeze({
    advantage: 'Matched to today\'s weather and the complete outfit.',
    tradeoff: 'A safe alternative may suit your material preference better.',
  }),
  sv: Object.freeze({
    advantage: 'Anpassat efter dagens väder och hela klädseln.',
    tradeoff: 'Ett säkert alternativ kan passa din materialpreferens bättre.',
  }),
  da: Object.freeze({
    advantage: 'Tilpasset dagens vejr og hele påklædningen.',
    tradeoff: 'Et sikkert alternativ kan passe bedre til din materialepræference.',
  }),
});

function normalizeLanguage(
  language: string | null | undefined,
): HomeAlternativeLanguage {
  const base = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'no' || base === 'nb' || base === 'nn') return 'no';
  if (base === 'sv' || base === 'da') return base;
  return 'en';
}

function catalogIdFor(
  catalogGarmentId: string | null,
  label: string,
): GarmentId | null {
  return catalogGarmentId ?? garmentIdFor(label);
}

function localizedName(
  id: GarmentId | null,
  label: string,
  language: HomeAlternativeLanguage,
): string {
  if (id !== null) {
    return localizedGarmentName(id, language)
      ?? garmentDisplayName(id, language);
  }
  return displayNameForDbString(label, language);
}

function localizedComparison(
  language: HomeAlternativeLanguage,
  exactAdvantages: readonly string[],
  exactTradeoffs: readonly string[],
): Readonly<{
  advantages: readonly string[];
  tradeoffs: readonly string[];
}> {
  if (language === 'no') {
    return {
      advantages: Object.freeze([...exactAdvantages]),
      tradeoffs: Object.freeze([...exactTradeoffs]),
    };
  }
  const generic = GENERIC_COMPARISON[language];
  return {
    advantages: Object.freeze([generic.advantage]),
    tradeoffs: Object.freeze([generic.tradeoff]),
  };
}

function sourceComparison(
  sourceLabel: string,
  language: HomeAlternativeLanguage,
): Readonly<{
  advantages: readonly string[];
  tradeoffs: readonly string[];
}> {
  if (language === 'no') {
    try {
      const source = getAlternatives(sourceLabel);
      return {
        advantages: Object.freeze([...(source?.pros ?? [])]),
        tradeoffs: Object.freeze([...(source?.cons ?? [])]),
      };
    } catch {
      return {
        advantages: Object.freeze([]),
        tradeoffs: Object.freeze([]),
      };
    }
  }
  const generic = GENERIC_RECOMMENDATION[language];
  return {
    advantages: Object.freeze([generic.advantage]),
    tradeoffs: Object.freeze([generic.tradeoff]),
  };
}

/**
 * Derives Home's informational comparison groups from the authenticated outfit
 * bundle only. The source side is always read from `bundle.base.garments`;
 * equipment is never considered, even if a future producer adds options for it.
 */
export function deriveHomeGarmentAlternativeGroups(
  bundle: OutfitBundleProducerResult | null | undefined,
  language?: string | null,
): readonly HomeGarmentAlternativeGroup[] {
  if (!isOutfitBundleProducerResult(bundle) || bundle.kind !== 'supported') {
    return Object.freeze([]);
  }

  const normalizedLanguage = normalizeLanguage(language);
  const groups = bundle.base.garments.flatMap<HomeGarmentAlternativeGroup>(
    (source) => {
      // Deliberately use filter: every finalized option for this occurrence is
      // exposed, without silently collapsing the group to the first match.
      const authorizedOptions = bundle.options.filter(
        (option) => option.sourceItemId === source.itemId,
      );
      if (authorizedOptions.length === 0) return [];

      const sourceGarmentId = catalogIdFor(
        source.catalogGarmentId,
        source.label,
      );
      const sourceFactId = sourceGarmentId ?? source.label;
      const recommendedComparison = sourceComparison(
        source.sourceLabel,
        normalizedLanguage,
      );
      const alternatives = authorizedOptions.map<HomeGarmentAlternativeItem>(
        (option) => {
          const targetGarmentId = catalogIdFor(
            option.targetCatalogGarmentId,
            option.targetLabel,
          );
          const targetFactId = targetGarmentId ?? option.targetLabel;
          const comparison = localizedComparison(
            normalizedLanguage,
            option.comparison.advantages,
            option.comparison.tradeoffs,
          );
          return Object.freeze({
            optionId: option.optionId,
            sourceItemId: option.sourceItemId,
            targetCatalogGarmentId: option.targetCatalogGarmentId,
            name: localizedName(
              targetGarmentId,
              option.targetLabel,
              normalizedLanguage,
            ),
            imageSrc: garmentPngSafe(targetGarmentId),
            fact: Object.freeze(
              garmentFactFor(targetFactId, normalizedLanguage),
            ),
            advantages: comparison.advantages,
            tradeoffs: comparison.tradeoffs,
          });
        },
      );

      return [Object.freeze({
        source: Object.freeze({
          itemId: source.itemId,
          catalogGarmentId: source.catalogGarmentId,
          name: localizedName(
            sourceGarmentId,
            source.label,
            normalizedLanguage,
          ),
          imageSrc: garmentPngSafe(sourceGarmentId),
          fact: Object.freeze(
            garmentFactFor(sourceFactId, normalizedLanguage),
          ),
          advantages: recommendedComparison.advantages,
          tradeoffs: recommendedComparison.tradeoffs,
        }),
        alternatives: Object.freeze(alternatives),
      })];
    },
  );

  return Object.freeze(groups);
}
