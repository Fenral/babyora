/**
 * Kanonisk display-name for plagg-strenger.
 *
 * P2.4-utvidelse (Fable 5 Q6): motorens output har plagg-navn i lowercase
 * («pyjamas», «kjøredress»). UI skal vise dem med stor forbokstav uten
 * å endre motorens kanoniske form.
 */

/** Kapitaliser første bokstav. «pyjamas» → «Pyjamas». */
export function displayName(name: string | undefined | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

/** Lower-case første bokstav. «Pyjamas» → «pyjamas». For sammenhengende setninger. */
export function lowerFirst(name: string | undefined | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  return trimmed[0].toLowerCase() + trimmed.slice(1);
}
