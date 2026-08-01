/**
 * opening-sequence — P10/JOB1 (docs/design-notes/aapningssekvens-2026-08-01.md):
 * rene beslutningsfunksjoner + tidslinje-konstanter for åpningssekvensen.
 *
 * Ingen React/DOM her — testbare i Node, samme konvensjon som
 * scan-orchestration.ts (HjemMonter.tsx/OpeningSequence.tsx står for selve
 * kablingen: useEffect + WAAPI element.animate()).
 *
 * ── Gradert bruk (spec §"Gradert bruk") ─────────────────────────────────
 *  - Første gang noensinne: full hybrid ~900 ms ('first-ever').
 *  - Senere kaldstarter: 280–350 ms mikro-versjon ('cold').
 *  - Varmstart (result-current fra scan-cache): ingen sekvens ('none').
 *  - Reduce Motion: ingen sekvens ('none').
 *  - Allerede resolvet denne boot-en (se ui-store.ts sin
 *    consumeOpeningBootSlot): ingen sekvens ('none') — spilles ALDRI om
 *    igjen bare fordi HjemMonter remountes (fane-bytte) i samme økt.
 */

export type OpeningVariant = 'first-ever' | 'cold' | 'none';

export type DecideOpeningVariantParams = Readonly<{
  /** Resultatet av ui-store.ts sin consumeOpeningBootSlot() — sann KUN for første kall denne boot-en. */
  bootSlotClaimed: boolean;
  reducedMotion: boolean;
  /** Sann når HjemMonter sin mount-logikk allerede fant et EKSAKT cachet resultat for identiteten (decideScanEntry === 'show-cached') — «direkte til cachet Hjem». */
  isWarmCacheHit: boolean;
  /** ui-store.ts sin persisterte livstids-flagg. */
  hasSeenOpeningEver: boolean;
}>;

/**
 * Avgjør hvilken åpningssekvens-variant (om noen) som skal spilles idet
 * Hjem monteres. Rekkefølgen på vaktene er bevisst: boot-slotten og
 * reduced motion vinner over ALT (inkludert varmstart), varmstart vinner
 * over hasSeenOpeningEver.
 */
export function decideOpeningVariant(params: DecideOpeningVariantParams): OpeningVariant {
  if (!params.bootSlotClaimed) return 'none';
  if (params.reducedMotion) return 'none';
  if (params.isWarmCacheHit) return 'none';
  return params.hasSeenOpeningEver ? 'cold' : 'first-ever';
}

// ── Tidslinje — første gang noensinne (~900 ms) ─────────────────────────────

export const FIRST_EVER_TOTAL_MS = 900;

/** 100–280 ms: panelet løftes 8px til sluttposisjon. Monter-lyset går ÉN gang langs toppkanten. */
export const FIRST_EVER_PANEL_LIFT_START_MS = 100;
export const FIRST_EVER_PANEL_LIFT_END_MS = 280;
export const FIRST_EVER_PANEL_LIFT_PX = 8;

/** 180–720 ms: maskoten stiger 60–80px BAK panelet. cubic-bezier(.16,1,.3,1), maks 1° rotasjon. */
export const FIRST_EVER_MASCOT_RISE_START_MS = 180;
export const FIRST_EVER_MASCOT_RISE_END_MS = 720;
export const FIRST_EVER_MASCOT_RISE_PX = 70; // midtpunkt av 60–80px
export const FIRST_EVER_MASCOT_RISE_ROTATION_DEG = 1;
export const MASCOT_RISE_EASING = 'cubic-bezier(.16,1,.3,1)';

/** 620–820 ms: hender/fingre-laget kommer foran kanten; grepet lander på fingertupp-linjen. */
export const FIRST_EVER_HANDS_LAND_START_MS = 620;
export const FIRST_EVER_HANDS_LAND_END_MS = 820;
/* P10.1 (judge finding A2): HANDS_LAND_RISE_PX (the old translateY "rise
   into place" distance) is retired — the landing is now communicated by a
   clip-path reveal (OpeningSequence.tsx), not by a physical rise, so there
   is no separate rise-distance constant anymore. */

/** 820–900 ms: 2px mikrosettling, deretter helt stille. */
export const FIRST_EVER_SETTLE_START_MS = 820;
export const FIRST_EVER_SETTLE_END_MS = 900;
export const SETTLE_PX = 2;

// ── Tidslinje — senere kaldstarter (280–350 ms mikro) ───────────────────────

/** Konkret varighet innenfor spekens 280–350ms-vindu. */
export const COLD_TOTAL_MS = 320;
export const COLD_PANEL_LIFT_PX = 5; // midtpunkt av 4–6px
export const COLD_MASCOT_SETTLE_PX = 11; // midtpunkt av 10–12px
export const COLD_PANEL_LIFT_END_MS = 180;
export const COLD_MASCOT_SETTLE_END_MS = COLD_TOTAL_MS;
export const COLD_EDGE_LIGHT_END_MS = 180;

/**
 * Maskotens fingertupp-linje — SAMME alfa-målte geometri som .hjm-mascot
 * sin ankring (hjem-monter.css: "top: -152px at width 205 means fingertip
 * line at 152px from image top +10px overlap"). Verdien er avledet fra
 * tools/split-mascot-layers.mjs sin faktiske output (maskot.png, 512px
 * bredde): hender-laget starter ved rad 329 av 512 i kilde-bildet →
 * 329/512 som ANDEL av bredden — skalerer korrekt uansett hvilken
 * .hjm-mascot-bredde-breakpoint (205/188/164px) som er aktiv, siden begge
 * lag deler samme kilde-bredde og dermed samme skaleringsfaktor.
 */
export const HANDS_TOP_OFFSET_FRACTION_OF_WIDTH = 329 / 512;

/** Idle-loop (P10 duel §4) — IKKE integrert i denne pakken; hook-punktet er dokumentert her og i OpeningSequence.tsx sin TODO-kommentar. */
export const IDLE_LOOP_MIN_DELAY_MS = 4000;
export const IDLE_LOOP_MAX_DELAY_MS = 5000;
