/**
 * scan — delte typer for Hjem-skjermens skann-tilstandsmaskin (P3).
 *
 * Produktmodell (PRODUCT.md, låst): Hjem er en to-tilstands skann-opplevelse
 *   weather-ready → scanning → result-current ⇄ result-stale → recalculate.
 * Første scan om dagen kan spilles i sin helhet (2.1s koreografi); senere
 * åpninger viser cachet resultat umiddelbart. Aktivitets-toggle trigger
 * automatisk inline-rekalkulering (kort scan); stale er fallback når
 * rekalkulering er treg eller feiler.
 *
 * P3 er REN bibliotek/lager-kode — ingen UI-kobling (det er P4). HjemScreen
 * er uendret av denne pakken.
 */
import type { Activity } from '../wool-layers/types.js';

export type ScanPhase =
  | 'weather-ready'
  | 'scanning'
  | 'result-current'
  | 'result-stale'
  | 'recalculating';

/**
 * Motor-versjon brukt til å beregne et scan-resultat.
 *
 * Ingen eksportert, stabil versjonskonstant fantes i noen av motor-mappene
 * (wool-layers/clothing-engine-v2/met-no/planning/outfit/recommendation) på
 * tidspunktet dette ble skrevet — derfor hardkodes den lokalt her. BUMP
 * denne strengen når motorens regeltabeller/katalog endres materielt (nye
 * HB-regler, ny plagg-katalog-revisjon, ny tier-logikk osv.), slik at
 * cachede scan-resultater fra gammel motor ALDRI vises som "current" uten
 * en frisk scan (identitets-sammenligning i getSlotForIdentity feiler
 * automatisk når denne strengen endres).
 */
export const WOOL_LAYERS_ENGINE_VERSION = '2026-07' as const;

/**
 * Identiteten et scan-resultat gjelder for.
 *
 * Værgrunnlaget (temp/vind/nedbør/symbolCode) er BEVISST IKKE med her —
 * værendringer er en "dirty"-årsak som gjør et resultat stale (se
 * ScanStaleReason), ikke en identitetsendring. Identitet er kun "hvilken
 * kontekst" scanningen gjelder (barn/dag/sted/aktivitet/motor-versjon).
 */
export type ScanIdentity = Readonly<{
  childId: string;
  /** Lokal dato, YYYY-MM-DD (ikke UTC — se localDateKey). */
  dateKey: string;
  /** Opak nøkkel for stedet scanningen gjelder (kaller-beregnet, f.eks. avledet fra lat/lon/kilde). */
  placeKey: string;
  activity: Activity;
  engineVersion: string;
}>;

/** Årsaker et resultat kan bli markert stale av. */
export type ScanStaleReason =
  | 'identity-changed'
  | 'weather-basis'
  | 'recalc-failed';

/**
 * Persistert cache-slot — ett scan-resultat per barn.
 *
 * `resultKey` gjenbruker EKSAKT samme fingerprint-logikk som HjemScreen sin
 * nåværende `fingerprint`-variabel (se lib/scan/result-key.ts sin
 * computeScanResultKey — testet likeverdig i result-key.test.ts).
 */
export type ScanCacheSlot = Readonly<{
  identity: ScanIdentity;
  resultKey: string;
  /** Epoch ms — når scanningen som produserte resultKey fullførte. */
  completedAt: number;
  /** Har full 2.1s-koreografi allerede blitt spilt for dette barnet i dag? */
  scanPlayedInFullToday: boolean;
}>;

/**
 * Lokal (ikke UTC) dato-nøkkel — brukt til å oppdage dato-rollover uavhengig
 * av tidssone-representasjon i lagrede strenger.
 */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sameScanIdentity(a: ScanIdentity, b: ScanIdentity): boolean {
  return (
    a.childId === b.childId
    && a.dateKey === b.dateKey
    && a.placeKey === b.placeKey
    && a.activity === b.activity
    && a.engineVersion === b.engineVersion
  );
}

// Speiler Activity i lib/wool-layers/types.ts. Unions av streng-literaler
// finnes ikke ved kjøretid — dette settet må holdes i sync manuelt hvis
// Activity noen gang utvides der (wool-layers er skrivebeskyttet for denne
// pakken, jf. arbeidspakke-grensene).
const VALID_ACTIVITIES: ReadonlySet<string> = new Set([
  'vogn',
  'baeresele',
  'utelek',
  'soevn',
]);

function isActivity(value: unknown): value is Activity {
  return typeof value === 'string' && VALID_ACTIVITIES.has(value);
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isScanIdentity(value: unknown): value is ScanIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.childId === 'string' && candidate.childId.length > 0
    && typeof candidate.dateKey === 'string'
    && DATE_KEY_PATTERN.test(candidate.dateKey)
    && typeof candidate.placeKey === 'string' && candidate.placeKey.length > 0
    && isActivity(candidate.activity)
    && typeof candidate.engineVersion === 'string'
    && candidate.engineVersion.length > 0
  );
}

export function isScanCacheSlot(value: unknown): value is ScanCacheSlot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isScanIdentity(candidate.identity)
    && typeof candidate.resultKey === 'string' && candidate.resultKey.length > 0
    && typeof candidate.completedAt === 'number'
    && Number.isFinite(candidate.completedAt)
    && typeof candidate.scanPlayedInFullToday === 'boolean'
  );
}
