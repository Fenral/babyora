/**
 * RUTEVALGET — hvilken flate CTA-en lander på.
 *
 * ═══ HVORFOR DETTE ER EN FUNKSJON OG IKKE EN if I JSX ═════════════════════
 * MÅLT 2026-08-05: `KlePaaStepper` var ferdig bygget, portet og grønn — og
 * nådd fra ingen steder i appen. Porten målte komponenten isolert og hadde
 * rett i alt den påsto; den påsto bare ingenting om VEIEN dit.
 *
 * En betingelse skrevet rett inn i JSX kan ikke måles uten å rendre hele
 * App.tsx. Skilt ut hit kan selve valget prøves direkte: gitt et drill, hvor
 * havner brukeren? Da blir «CTA-en når fram» en måling i stedet for et
 * inntrykk — og det var nettopp inntrykket som tok feil sist.
 */
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { OutfitBundleProducerResult } from '../../lib/outfit/outfit-bundle-producer.js';
import type { OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';

/** Det sekvensen trenger — og alt den trenger. */
export type KlePaaKilde = Readonly<{
  base: OutfitTruthSnapshotV1;
  options: readonly OutfitAlternativeOptionV1[];
}>;

/** Formen `App.tsx` faktisk har. Løs med vilje: ruta skal ikke eie Drill-typen. */
export type PaakledningDrill = Readonly<{
  kind: string;
  source?: 'current' | 'planned';
  outfitBundle?: OutfitBundleProducerResult;
}> | null | undefined;

/**
 * `null` betyr «vis den gamle listeflaten». Det er ikke en nødløsning, det er
 * riktig svar i tre tilfeller:
 *
 *   1. PLANLAGTE antrekk. Der leser man et antrekk man IKKE skal på med nå;
 *      en påkledningssekvens ville bedt brukeren kle på et barn i morgen.
 *   2. Bundler som ikke er 'supported'. Bare den varianten bærer `base` +
 *      `options` — de to andre har ingen plaggliste å dele opp i steg, og en
 *      tom stepper er verre enn listen den erstattet.
 *   3. Ingen bundel i det hele tatt (test- og preview-mounts uten payload).
 */
export function klePaaKildeFor(drill: PaakledningDrill): KlePaaKilde | null {
  if (drill === null || drill === undefined) return null;
  if (drill.kind !== 'paakledning') return null;
  if (drill.source !== 'current') return null;
  const bundle = drill.outfitBundle;
  if (bundle === undefined || bundle.kind !== 'supported') return null;
  return { base: bundle.base, options: bundle.options };
}
