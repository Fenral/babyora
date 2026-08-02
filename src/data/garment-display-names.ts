/**
 * garment-display-names — ÉN kanonisk kilde for brukersynlige plaggnavn (T1A).
 *
 * KANONISK KILDE-VALG (dokumentert beslutning, T1A-4 / katalog-audit §3):
 * `katalog-audit/display-names.json` er fasiten for visningsnavn. Den er
 * importert hit som modul (`garment-display-names.json`, en 1:1-kopi — kopien
 * finnes fordi `katalog-audit/` ligger utenfor `src/` og public-katalogen
 * ikke kan importeres synkront av Vite). `plagg-katalog.json` sitt
 * `label`-felt holdes identisk med denne filen — likheten håndheves av
 * `src/data/__tests__/plagg-katalog-integritet.test.ts`, så de to kan aldri
 * drive fra hverandre uten rød test.
 *
 * ROLLEDELING mot garment-illustrations.ts:
 *  - `dbStringFor(id)` er en MOTOR-/DB-nøkkel (rå streng slik den ligger i
 *    wool-layers/tables.ts, f.eks. «tykt ullsett») — brukes KUN til oppslag
 *    (getAlternatives, eierskaps-nøkler), ALDRI som brukersynlig tekst.
 *  - `garmentDisplayName(id)` / `displayNameForDbString(raw)` her er de
 *    ENESTE veiene til brukersynlig plaggnavn.
 *
 * `displayNameForDbString` sin sannhetsregel (katalogsannhet, runde 9):
 * en rå motor-streng byttes til visningsnavn KUN når strengen er den
 * kanoniske db-strengen for et katalog-id (informasjonstapsfritt bytte).
 * Alias-strenger med EKSTRA semantikk («tykke ullsokker», «tøffel-sko +
 * tykke ullsokker», «lett kortermet body (valgfritt)») beholder ordlyden
 * sin — motoren sa mer enn grunnavnet, og det ekstra skal ikke parafraseres
 * bort — de får kun stor forbokstav.
 */
import DISPLAY_NAMES_JSON from './garment-display-names.json';
import { dbStringFor, garmentIdFor, type GarmentId } from './garment-illustrations';

/** id → visningsnavn for alle 60 katalog-id-er. */
export const GARMENT_DISPLAY_NAMES: Readonly<Record<string, string>> =
  DISPLAY_NAMES_JSON;

function sentenceCase(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Humaniser et ukjent id (siste utvei — id-er utenfor katalogen, f.eks.
 * ikke-ull-alternativene 'tynn-fleece'/'bomullssett'): kebab → mellomrom,
 * TOG-trinn med komma-desimal, stor forbokstav. Samme regler som den gamle
 * titleFor-fallbacken i garment-catalog-helpers.ts.
 */
function humanizeId(id: string): string {
  const humanized = id
    .replace(/-(\d)-(\d)-tog\b/g, ' $1,$2 tog')
    .replace(/-(\d)-tog\b/g, ' $1,0 tog')
    .replace(/-/g, ' ')
    .replace(/\btog\b/g, 'TOG');
  return sentenceCase(humanized);
}

/**
 * Visningsnavn for et katalog-id. Katalog-id-er slår opp direkte i fasiten;
 * kjente ikke-katalog-id-er (alternativ-plagg) faller tilbake til pent
 * formatert db-streng, og helt ukjente id-er humaniseres fra id-formen.
 */
export function garmentDisplayName(id: GarmentId): string {
  const canonical = GARMENT_DISPLAY_NAMES[id];
  if (canonical !== undefined) return canonical;
  const db = dbStringFor(id);
  if (db !== id) return sentenceCase(db);
  return humanizeId(id);
}

/**
 * Visningsnavn for en rå motor-/db-streng (det motoren emitterer i
 * `recommendation.layers[].items`). Informasjonstapsfri regel — se
 * filhodet. Brukes av alle flater som viser motor-output direkte
 * (Hjem-vitrinen, Kle på, Planlegg-thumbs, Finn antrekk, outfit-lister).
 */
export function displayNameForDbString(raw: string): string {
  const trimmed = raw.trim();
  const id = garmentIdFor(trimmed);
  if (id !== null && dbStringFor(id) === trimmed) {
    return garmentDisplayName(id);
  }
  return sentenceCase(trimmed);
}
