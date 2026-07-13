/**
 * FASE 3 (2026-06-13): Topp-til-tå-mapping per SAMLET arbeidsordre §4.6.
 *
 * Klassifiserer plagg som hode-, hånd-, fot-, halsplagg så «Topp til tå»-
 * raden på forsiden kan beregne om den skal vises (lue, votter, sokker,
 * sko, solhatt, hals) — vises kun ved relevante plagg.
 */

export type ToppTilTaaSlot = 'hode' | 'hender' | 'hals' | 'fotter';

const SLOT_PATTERNS: Record<ToppTilTaaSlot, RegExp> = {
  hode: /\b(lue|hatt|solhatt|balaklava|balaclava|caps|beanie)\b/i,
  hender: /\b(votter|votte|hansker|hanske|vindvotter)\b/i,
  hals: /\b(hals|skjerf|halstørkle)\b/i,
  fotter: /\b(sokker|ullsokker|sko|tøffel|tøffler|sandaler|vintersko)\b/i,
};

export function slotFor(itemName: string): ToppTilTaaSlot | null {
  for (const [slot, re] of Object.entries(SLOT_PATTERNS) as Array<[ToppTilTaaSlot, RegExp]>) {
    if (re.test(itemName)) return slot;
  }
  return null;
}

/**
 * Filtrer items til kun topp-til-tå-plagg. Brukes til «Topp til tå»-raden
 * som vises KUN når minst ett topp-til-tå-plagg er anbefalt.
 */
export function toppTilTaaItems(items: string[]): string[] {
  return items.filter((i) => slotFor(i) !== null);
}

/**
 * Returnerer ekstra-items SOM IKKE er topp-til-tå (varmepose, saueskinn,
 * ansiktskrem, etc.). Disse hører ikke hjemme i topp-til-tå-raden, men
 * forblir i ekstra-lag eller i utstyr.
 */
export function ekstraIkkeToppTilTaa(items: string[]): string[] {
  return items.filter((i) => slotFor(i) === null);
}
