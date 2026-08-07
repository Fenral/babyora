/**
 * mascot-idle — rene tidsplan-/beslutningsfunksjoner for MascotIdle.tsx sin
 * "nysgjerrig-glimt i hvile" (Del 4, sol-duel v3-pakken 2026-08-01).
 *
 * REVIDERT UNDERVEIS #1 (koordinator-funn): den opprinnelige planen for
 * Del 4 var en 12–16s KONTINUERLIG idle-loop-VIDEO
 * (docs/mocks/monter/maskot-idle-loop-v2.mp4). Frame-QA (koordinatorens eget
 * arbeid, separat fra denne pakken) fant at den eksporterte mp4-en har en
 * BAKT INN hvit bakgrunn + grå kant, ingen alfa-kanal — den kan derfor
 * ALDRI sitte riktig oppå det værnyanserte petrol-panelet. Videoplanen er
 * derfor SKROTET (ingen mp4 kopieres, ingen <video>-element brukes noe
 * sted). I stedet uttrykkes hvile-liv som ETT kort, sjeldent glimt
 * (crossfade inn → kort hold → crossfade ut) i stedet for en evigvarende
 * loop.
 *
 * REVIDERT UNDERVEIS #2 (ekstern review, samme dag): glimtet skal IKKE
 * gjenbruke maskot-nysgjerrig.png (Del 3 sin scan-koreografi-pose) — den
 * posen er RESERVERT for «Babyora undersøker»-øyeblikket under selve
 * scanningen. Glimtet i hvile bruker i stedet sin EGEN, roligere
 * pose-asset (public/monter/maskot-glimt.webp, MascotIdle.tsx). Samtidig
 * lagt til: flere kanselleringsvakter (dialog/sheet/paywall åpen, tastatur
 * oppe, 30s kjøletid etter at appen resumes fra bakgrunn) — se
 * `IdleGlanceEligibility`/`idleGlanceEligible` under.
 *
 * Ingen React/DOM/Math.random()/Date.now() her — MascotIdle.tsx (komponenten)
 * eier selve setTimeout/event-listener-kablingen, de faktiske DOM-
 * målingene (dialog[open], visualViewport) og sender sin EGEN Math.random
 * inn ved det virkelige kallstedet; alt tids-relatert her tar derfor en
 * injiserbar `random: () => number` slik at tester kan verifisere eksakte
 * grenser deterministisk (samme konvensjon som scan-orchestration.ts sine
 * rene funksjoner — bare uten noen React-rendering involvert i det hele
 * tatt).
 */

/**
 * Første glimt (ved mount, eller rett etter at en interaksjon har nullstilt
 * hvile-klokken): 35–55 s REELL inaktivitet. REVIDERT #3 (analysesløyfen
 * runde 8, 2026-08-01): det opprinnelige 4–5 s-vinduet var for tidlig for en
 * rolig app — glimtet skal være en sjelden livstegn-detalj, ikke en hilsen.
 */
export const IDLE_LOOP_MIN_DELAY_MS = 35000;
export const IDLE_LOOP_MAX_DELAY_MS = 55000;

/**
 * Senere glimt: tilfeldig 60–120 s mellom hvert (runde 8-kontrakten,
 * erstatter det gamle 20–30 s-vinduet). Se også MAX_GLANCES_PER_SESSION.
 */
export const IDLE_GLANCE_REST_MIN_MS = 60000;
export const IDLE_GLANCE_REST_MAX_MS = 120000;

/**
 * Maks antall glimt per foreground-sesjon (runde 8): etter to glimt er
 * maskoten stille til appen har vært i bakgrunnen og kommer tilbake
 * (MascotIdle.tsx nullstiller telleren ved bakgrunn→forgrunn-overgang,
 * ETTER at RESUME_COOLDOWN_MS har passert).
 */
export const MAX_GLANCES_PER_SESSION = 2;

/** Selve glimtets egen koreografi: crossfade inn → hold nysgjerrig → crossfade ut. */
export const IDLE_GLANCE_FADE_MS = 300;
export const IDLE_GLANCE_HOLD_MS = 1200;
export const IDLE_GLANCE_TOTAL_MS = IDLE_GLANCE_FADE_MS * 2 + IDLE_GLANCE_HOLD_MS;

/**
 * Kjøletid etter at appen resumes fra bakgrunn (visibilitychange → synlig
 * igjen etter å ha vært skjult) — INGEN glimt de første 30s, uansett om et
 * planlagt forsøk skulle falle midt i vinduet (se idleGlanceEligible under;
 * MascotIdle.tsx sjekker denne PÅ NYTT idet en planlagt timer fyrer, ikke
 * bare når kjøletiden startes).
 */
export const RESUME_COOLDOWN_MS = 30000;

export type IdleGlanceWindow = 'first' | 'rest';

/**
 * Randomisert forsinkelse før NESTE glimt-FORSØK (ikke garantert glimt —
 * se idleGlanceEligible) kan starte, innenfor det gitte vinduets grenser.
 * `random` MÅ returnere en verdi i [0, 1) — inject `Math.random` ved det
 * virkelige kallstedet, en fast stub i tester.
 */
export function idleGlanceDelayMs(window: IdleGlanceWindow, random: () => number): number {
  const [min, max] = window === 'first'
    ? [IDLE_LOOP_MIN_DELAY_MS, IDLE_LOOP_MAX_DELAY_MS]
    : [IDLE_GLANCE_REST_MIN_MS, IDLE_GLANCE_REST_MAX_MS];
  return min + random() * (max - min);
}

export type IdleGlanceEligibility = Readonly<{
  /** In-app override ELLER OS-preferanse (useNativeSettings) — permanent normalpose, aldri glimt. */
  reducedMotion: boolean;
  /** document.visibilityState !== 'visible'. */
  documentHidden: boolean;
  /** Et natives <dialog open> finnes i DOM-en (PaywallDialog/PlaggDetailSheet/MaterialPreferenceSheet/AppPaywallGate — samme native-<dialog>-mønster hele kodebasen bruker). */
  dialogOpen: boolean;
  /** Programvaretastatur sannsynligvis oppe (visualViewport krympet vesentlig). */
  keyboardOpen: boolean;
  /** Innenfor RESUME_COOLDOWN_MS etter siste bakgrunn→forgrunn-overgang. */
  withinResumeCooldown: boolean;
  /** public/monter/maskot-glimt.webp finnes og er klar til bruk — se MascotIdle.tsx sin egen GLANCE_ASSET_READY-kommentar. ALDRI fall tilbake til scan-koreografiens maskot-nysgjerrig.png hvis denne er false. */
  assetReady: boolean;
}>;

/**
 * Glimt kan kjøre i det hele tatt kun når ALLE vaktene under er «rene».
 * Selve FASE-vakten (aldri under scanning/recalculating/result-*) håndheves
 * IKKE her — MascotIdle.tsx mountes utelukkende i HjemMonter sin
 * weather-ready-gren (se HjemMonter.tsx), så et fasebytte unmounter
 * komponenten (og dermed alle dens timere) automatisk. Det er derfor
 * tilstrekkelig i seg selv, uten en egen phase-parameter her.
 */
export function idleGlanceEligible(params: IdleGlanceEligibility): boolean {
  return params.assetReady
    && !params.reducedMotion
    && !params.documentHidden
    && !params.dialogOpen
    && !params.keyboardOpen
    && !params.withinResumeCooldown;
}
