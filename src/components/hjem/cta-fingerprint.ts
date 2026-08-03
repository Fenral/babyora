/**
 * cta-fingerprint — eier-override v4 (PRODUCT.md, 2026-08-03): anbefalings-
 * fingerprinten styrer scan-seremonien, ikke antall trykk.
 *
 * v3-regelen «HVERT CTA-trykk spiller full 3,2 s» er opphevet. Seremonien
 * skal spilles når Babyora faktisk gjør NYTT arbeid:
 *
 *   ukjent fingerprint → «Finn dagens antrekk» → full 3,2 s-koreografi
 *   kjent  fingerprint → «Vis dagens antrekk»  → rett til det cachede svaret
 *
 * Maskineriet fantes allerede — `computeScanResultKey` (lib/scan/result-key.ts)
 * er en deterministisk fingerprint over plaggutfallet PLUSS værgrunnlaget, og
 * scan-cache-store nøkler allerede på den. Det som manglet var at noe LESER
 * nøkkelen FØR trykket og velger både tekst og vei. Det er denne filen.
 *
 * Rene funksjoner: ingen React, ingen DOM, ingen timere — samme arbeidsdeling
 * som scan-orchestration.ts / swap-row.ts / adjust-prefill.ts allerede har i
 * denne mappa. HjemMonter.tsx står for kablingen.
 */
import type { ScanStaleReason } from '../../lib/scan/types.js';
import {
  FULL_SCAN_DURATION_MS,
  QUICK_RECALC_DURATION_MS,
} from './scan-orchestration.js';

/** Hvilken vei et CTA-trykk tar. */
export type CtaPath =
  /** Ukjent fingerprint — Babyora gjør nytt arbeid → full 3,2 s-koreografi. */
  | 'ceremony'
  /** Kjent fingerprint — svaret finnes allerede → rett til resultatet. */
  | 'reveal';

export type CtaPlan = Readonly<{ path: CtaPath; label: string; line: string }>;

export const CTA_CEREMONY_LABEL = 'Finn dagens antrekk';
export const CTA_REVEAL_LABEL = 'Vis dagens antrekk';
/**
 * Linjene er bevisst PARALLELLE — samme tre ord, ulikt verb — slik at
 * forskjellen leses som «hva skjer når jeg trykker», ikke som to urelaterte
 * påstander. PRODUCT.md v4: «The line under the CTA tells the truth about
 * which path you are on.» Ingen motorspråk (art bible forbyr «analysert»);
 * dette er vær, sted og aktivitet — brukerens egne ord.
 */
export const CTA_CEREMONY_LINE = 'Vær, sted og aktivitet vurderes sammen';
/* MÅTTE RETTES: sto «Vær, sted og aktivitet er uendret siden sist». Det er en
   påstand om INPUTENE, og den er usann — nøkkelen (computeScanResultKey)
   inneholder plaggene og været, ikke sted og aktivitet. Bytter man aktivitet
   og får samme antrekk, traff cachen med rette, men linja løy: aktiviteten
   VAR endret. Verifisert live: utelek → vogn ga «uendret siden sist».
   Linja snakker nå om UTFALLET, som er det nøkkelen faktisk vet noe om. */
export const CTA_REVEAL_LINE = 'Samme antrekk som sist – det er klart';

const CEREMONY_PLAN: CtaPlan = Object.freeze({
  path: 'ceremony', label: CTA_CEREMONY_LABEL, line: CTA_CEREMONY_LINE,
});
const REVEAL_PLAN: CtaPlan = Object.freeze({
  path: 'reveal', label: CTA_REVEAL_LABEL, line: CTA_REVEAL_LINE,
});

/**
 * Nøkkelminnet: scope («barn|dato») → alle resultKey-fingerprints appen har
 * landet for den kombinasjonen.
 *
 * PRODUCT.md v4: «Cache is a KEY LOOKUP, not one slot.» scan-cache-store
 * holder ÉN slot per barn og OVERSKRIVER den ved hver fullføring, så et bytte
 * utelek → vogn → utelek ville ellers ha mistet det første svaret og spilt
 * seremonien på nytt for noe appen allerede hadde beregnet.
 */
export type ResultKeyMemory = Map<string, Set<string>>;

export function createResultKeyMemory(): ResultKeyMemory {
  return new Map();
}

/**
 * Scopet er barn+dag. Aktivitet og sted er BEVISST utenfor: det er nettopp de
 * to som kan bytte fram og tilbake i løpet av en økt og likevel lande på et
 * svar appen allerede holder. Værgrunnlaget trenger heller ingen egen
 * dimensjon — det er allerede bakt inn i selve nøkkelen (temp/føles som/vind/
 * nedbør/symbol), så et værskifte gir automatisk en ukjent nøkkel.
 */
export function resultKeyScope(childId: string, dateKey: string): string {
  return `${childId}|${dateKey}`;
}

export function rememberResultKey(
  memory: ResultKeyMemory,
  scope: string,
  resultKey: string,
): void {
  const existing = memory.get(scope);
  if (existing === undefined) memory.set(scope, new Set([resultKey]));
  else existing.add(resultKey);
}

export function knowsResultKey(
  memory: ReadonlyMap<string, ReadonlySet<string>>,
  scope: string,
  resultKey: string,
): boolean {
  return memory.get(scope)?.has(resultKey) === true;
}

/**
 * Leser fingerprinten FØR trykket og velger tekst + vei.
 *
 * `persistedResultKey` er nøkkelen scan-cache-store faktisk har lagret for
 * barnet i dag (overlever app-restart); `memory` er øktens akkumulerte nøkler
 * (overlever remount ved fanebytte, men ikke restart). Begge teller som «appen
 * holder allerede dette svaret» — oppslaget skjer på NØKKELEN, aldri på
 * identiteten, nettopp fordi identiteten kan ha endret seg til noe som gir
 * nøyaktig samme antrekk (eierens egen note: «change the activity but get an
 * identical outfit, and there is nothing new to show»).
 *
 * Ingen nøkkel ennå (motoren eller været er ikke klart) → seremoni-planen.
 * CTA-en er uansett deaktivert i den tilstanden, og «Finn dagens antrekk» er
 * det ærlige løftet: ingenting er beregnet.
 */
export function planCta(
  currentResultKey: string | null,
  persistedResultKey: string | null,
  memory: ReadonlyMap<string, ReadonlySet<string>>,
  scope: string,
): CtaPlan {
  if (currentResultKey === null) return CEREMONY_PLAN;
  if (persistedResultKey === currentResultKey) return REVEAL_PLAN;
  return knowsResultKey(memory, scope, currentResultKey) ? REVEAL_PLAN : CEREMONY_PLAN;
}

export type RecalcPlan = Readonly<{ durationMs: number; ceremony: boolean }>;

const INLINE_RECALC_PLAN: RecalcPlan = Object.freeze({
  durationMs: QUICK_RECALC_DURATION_MS, ceremony: false,
});
const EXPLICIT_RECALC_PLAN: RecalcPlan = Object.freeze({
  durationMs: FULL_SCAN_DURATION_MS, ceremony: true,
});

/**
 * PRODUCT.md v4: «Explicit "Beregn på nytt" always plays the full ceremony.
 * Inline adjustments keep the 220ms quick recalc.»
 *
 * `identity-changed` er den inline justeringen (stale-CTA-en heter da «Se
 * antrekk for vogn» — et bytte brukeren nettopp gjorde selv). De to andre
 * årsakene gir knappen «Beregn på nytt», som er en eksplisitt bestilling av
 * nytt arbeid og derfor skal føles som det.
 */
export function planRecalc(reason: ScanStaleReason): RecalcPlan {
  return reason === 'identity-changed' ? INLINE_RECALC_PLAN : EXPLICIT_RECALC_PLAN;
}

/**
 * Øktens nøkkelminne — én delt instans.
 *
 * Modulnivå med vilje: HjemScreen (og dermed HjemMonter) UNMOUNTES ved hvert
 * fanebytte i App.tsx, så et minne i komponent-state ville vært tomt akkurat
 * når brukeren kommer tilbake til Hjem — nettopp øyeblikket seremonien ikke
 * skal spilles på nytt. Skrives kun fra effekter/handlere (aldri under
 * render); leses under render, der verdien er stabil så lenge fasen er
 * weather-ready (den endres kun i det samme trykket som også bytter fase).
 * Persistens på tvers av app-restart ville krevd et nytt felt i
 * scan-cache-store — utenfor denne pakkens filgrense.
 */
export const sessionResultKeys: ResultKeyMemory = createResultKeyMemory();
