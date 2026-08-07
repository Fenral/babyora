/**
 * MascotIdle — den hvilende weather-ready-maskotens sjeldne "nysgjerrig-
 * glimt" (Del 4, sol-duel v3-pakken 2026-08-01 — se mascot-idle.ts sin egen
 * filhode for HVORFOR dette erstattet den opprinnelige loop-VIDEO-planen).
 * Mountes UTELUKKENDE i HjemMonter sin weather-ready-gren (se
 * HjemMonter.tsx) — å forlate den fasen (CTA-trykk → scanning, e.l.)
 * unmounter denne komponenten, som i seg selv er nok til at glimtene aldri
 * kan kjøre utenfor weather-ready (de andre fasene styrer MascotPeek sin
 * `pose` direkte, se MascotPeek.tsx).
 *
 * Ekstern review (2026-08-01, samme dag): maskot-nysgjerrig.png (Del 3 sin
 * scan-koreografi-pose) er RESERVERT for «Babyora undersøker»-øyeblikket
 * under selve scanningen — gjenbrukes IKKE her. Glimtet i hvile bruker sin
 * EGEN, roligere pose-asset (`public/monter/maskot-glimt.webp`), lagt oppå
 * den ALLTID normal-poserte MascotPeek som et eget, uavhengig crossfadet
 * lag (IKKE via MascotPeek sin `pose`-prop — den forblir 'normal' her,
 * urørt av glimtet).
 *
 * `GLANCE_ASSET_READY` under er en bevisst BUILD-TIME-brytepunkt: hvis
 * asset-filen noensinne mangler, settes den til `false` og HELE
 * glimt-systemet blir inert (kun MascotPeek sin normalpose, ingen timere,
 * ingen lyttere, ingen forespørsel om den manglende fila — unngår en 404
 * `npm run e2e`/`e2e:purchase` ellers ville flagget). Faller ALDRI tilbake
 * til maskot-nysgjerrig.png.
 *
 * Kanselleringsvakter (idleGlanceEligible, mascot-idle.ts) — sjekkes PÅ NYTT
 * idet en planlagt timer faktisk fyrer, ikke bare når timeren armeres:
 *  - Reduce Motion (in-app override ELLER OS): permanent normalpose.
 *  - Fanen skjult (visibilitychange).
 *  - Et natives <dialog open> finnes i DOM-en — samme mønster hele
 *    kodebasen bruker for sheets/paywalls (PaywallDialog/PlaggDetailSheet/
 *    MaterialPreferenceSheet/AppPaywallGate), så ÉN generisk selector
 *    dekker dem alle uten egen kabling per komponent.
 *  - Programvaretastatur sannsynligvis oppe (visualViewport krympet).
 *  - De første 30s etter at appen resumes fra bakgrunn (RESUME_COOLDOWN_MS).
 * Et glimt-forsøk som feiler en vakt ved fyring glimter ALDRI — det
 * planlegger bare et nytt forsøk (`'rest'`-vinduet) i stedet for å gå
 * stille for godt.
 *
 * Et enkelt ~1,8s glimt (første etter 35–55 s ro, deretter 60–120 s mellom
 * hvert, maks to per foreground-sesjon — runde 8-kontrakten fra
 * analysesløyfen 2026-08-01) er momentan, ikke-repeterende bevegelse godt
 * under WCAG 2.2.2 sin 5s-grense for når en egen pause/stopp-KONTROLL
 * kreves utover Reduce Motion — derfor ingen egen pause-knapp her (kravet
 * gjaldt den opprinnelige, nå retirerte, kontinuerlig LØPENDE videoen).
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { MascotPeek, type MascotPose } from './MascotPeek.js';
import {
  idleGlanceDelayMs,
  idleGlanceEligible,
  IDLE_GLANCE_FADE_MS,
  IDLE_GLANCE_HOLD_MS,
  MAX_GLANCES_PER_SESSION,
  RESUME_COOLDOWN_MS,
  type IdleGlanceWindow,
} from './mascot-idle.js';

const GLANCE_SRC = `${import.meta.env.BASE_URL}monter/maskot-glimt.webp`;
/**
 * `public/monter/maskot-glimt.webp` finnes (verifisert 512×512, alfa-kanal,
 * samme lerret som maskot.png — se PR-notatet). Flipp til `false` (og IKKE
 * fjern denne konstanten) hvis asset-filen noensinne fjernes/erstattes med
 * noe ubrukelig — se filhodet over for hvorfor systemet da skal gå inert
 * i stedet for å falle tilbake til en annen pose.
 */
const GLANCE_ASSET_READY = true;

function isDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('dialog[open]') !== null;
}

/** Heuristikk: et programvaretastatur krymper typisk visualViewport til godt under vinduets egen høyde. 0.75-terskelen unngår falske positiver fra vanlig nettleser-kant/safe-area-forskjeller. */
function isKeyboardLikelyOpen(): boolean {
  if (typeof window === 'undefined' || !window.visualViewport) return false;
  return window.visualViewport.height < window.innerHeight * 0.75;
}

export type MascotIdleProps = Readonly<{
  reducedMotion: boolean;
  /** Videresendes til MascotPeek — kompakt i scan/stale/offline. */
  compact?: boolean;
  /**
   * Videresendes til MascotPeek. 'curious' under scanning/recalculating.
   * Glimtet undertrykkes automatisk da: scan-posen er RESERVERT for
   * «Babyora undersøker», og et hvileglimt oppå den ville stjålet den
   * betydningen (analysesløyfe-runde 8).
   */
  pose?: MascotPose;
}>;

/**
 * MASKOTENS ENESTE VERT. Rendres i ALLE faser av HjemMonter — også under
 * scanning — nettopp fordi komponenttypen på denne plassen i treet må være
 * KONSTANT.
 *
 * Før: weather-ready rendret <MascotIdle>, mens scanning rendret
 * <MascotPeek compact pose="curious"> direkte. Ulik komponenttype på samme
 * posisjon får React til å rive den ene og montere den andre — maskoten
 * RE-MOUNTES ved CTA-trykk. Konsekvensen var målbar: nysgjerrig-posen hadde
 * ÉN eneste transform gjennom hele momentet (sluttilstanden fra frame 1),
 * ingen interpolasjon, og ingen krysstoning i det hele tatt. Fire porter i
 * tools/verify-hjem.mjs strøk på det, og art bible kaller det bindende:
 * «Maskoten er ETT objekt som ALDRI re-mountes.»
 */
export function MascotIdle({ reducedMotion, compact = false, pose = 'normal' }: MascotIdleProps): ReactElement {
  const [glancing, setGlancing] = useState(false);
  const glanceTimerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const fadeBackTimerRef = useRef<number | null>(null);
  // Epoch ms — Date.now() < denne betyr "innenfor kjøletiden etter resume".
  // 0 (initialverdien) er alltid i fortiden, altså "ingen aktiv kjøletid".
  const resumeCooldownUntilRef = useRef(0);
  // Runde 8 (analysesløyfen): maks MAX_GLANCES_PER_SESSION glimt per
  // foreground-sesjon — deretter stillhet til bakgrunn→forgrunn-overgangen
  // nullstiller telleren (handleVisibility under). Interaksjoner nullstiller
  // hvile-KLOKKEN, men ikke sesjonstelleren.
  const glanceCountRef = useRef(0);

  const clearAllTimers = useCallback(() => {
    if (glanceTimerRef.current !== null) { window.clearTimeout(glanceTimerRef.current); glanceTimerRef.current = null; }
    if (holdTimerRef.current !== null) { window.clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (fadeBackTimerRef.current !== null) { window.clearTimeout(fadeBackTimerRef.current); fadeBackTimerRef.current = null; }
  }, []);

  const currentlyEligible = useCallback(() => idleGlanceEligible({
    reducedMotion,
    documentHidden: document.hidden,
    dialogOpen: isDialogOpen(),
    keyboardOpen: isKeyboardLikelyOpen(),
    withinResumeCooldown: Date.now() < resumeCooldownUntilRef.current,
    assetReady: GLANCE_ASSET_READY,
  }), [reducedMotion]);

  // Planlegger NESTE glimt-FORSØK (ikke et garantert glimt — se
  // currentlyEligible). Kalt igjen fra glimtets egen avslutning under, og
  // fra en mislykket vakt-sjekk ved fyring (kjeden holder seg selv i gang
  // mens komponenten er mountet). `scheduleGlanceRef` (under) unngår at
  // funksjonen refererer til SEG SELV før `const`-tilordningen er
  // fullført (react-hooks/immutability) — samme "hold nyeste versjon i en
  // ref, synk via effekt"-mønster som resten av Hjem-pakken allerede
  // bruker for sent-fyrende callbacks (se f.eks. den nå pensjonerte
  // OpeningSequence.tsx sin onCompleteRef).
  const scheduleGlanceRef = useRef<(window_: IdleGlanceWindow) => void>(() => {});

  const scheduleGlance = useCallback((window_: IdleGlanceWindow) => {
    clearAllTimers();
    const delay = idleGlanceDelayMs(window_, Math.random);
    glanceTimerRef.current = window.setTimeout(() => {
      if (glanceCountRef.current >= MAX_GLANCES_PER_SESSION) {
        // Sesjonsbudsjettet er brukt opp (runde 8) — gå stille uten å
        // planlegge mer; kun en ny foreground-sesjon nullstiller.
        return;
      }
      if (!currentlyEligible()) {
        // Vakt feilet akkurat idet timeren fyrte (dialog/tastatur/skjult
        // fane/kjøletid) — glimt ALDRI likevel, planlegg bare et nytt
        // forsøk i stedet for å gå stille for godt.
        scheduleGlanceRef.current('rest');
        return;
      }
      glanceCountRef.current += 1;
      setGlancing(true);
      holdTimerRef.current = window.setTimeout(() => {
        setGlancing(false);
        fadeBackTimerRef.current = window.setTimeout(() => {
          scheduleGlanceRef.current('rest');
        }, IDLE_GLANCE_FADE_MS);
      }, IDLE_GLANCE_FADE_MS + IDLE_GLANCE_HOLD_MS);
    }, delay);
  }, [clearAllTimers, currentlyEligible]);

  useEffect(() => {
    scheduleGlanceRef.current = scheduleGlance;
  }, [scheduleGlance]);

  // Armerer det aller FØRSTE glimt-forsøket ved mount (og re-armerer om
  // reducedMotion skulle bli slått AV midt i økten — Innstillinger kan
  // endre den live). RM sann, eller asset ikke klar: rydder kun timere —
  // selve `glancing`-state tvinges ALDRI synkront tilbake her (react-hooks/
  // set-state-in-effect); render-uttrykket under (`showGlance`) garanterer
  // likevel at glimtet aldri VISES mens disabled, uansett `glancing`-verdi.
  useEffect(() => {
    if (reducedMotion || !GLANCE_ASSET_READY) {
      clearAllTimers();
      return clearAllTimers;
    }
    scheduleGlance('first');
    return clearAllTimers;
  }, [reducedMotion, scheduleGlance, clearAllTimers]);

  // Enhver reell interaksjon nullstiller hvile-klokken — faller UMIDDELBART
  // tilbake til normalposen (selv midt i et glimt) og venter FØRSTE-
  // glimt-vinduet på nytt, samme "berøring nullstiller stillhet"-idé som
  // den pensjonerte åpningssekvensens egen "tap anywhere"-filosofi.
  useEffect(() => {
    if (reducedMotion || !GLANCE_ASSET_READY) return;
    const handleInteraction = () => {
      setGlancing(false);
      scheduleGlance('first');
    };
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('scroll', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [reducedMotion, scheduleGlance]);

  // Bakgrunnsfane: fall umiddelbart tilbake til normalposen, slutt å
  // planlegge til fanen er synlig igjen. Ved retur: armer en 30s kjøletid
  // (RESUME_COOLDOWN_MS) FØR noe glimt kan vises — currentlyEligible()
  // håndhever denne når det planlagte forsøket faktisk fyrer.
  useEffect(() => {
    if (reducedMotion || !GLANCE_ASSET_READY) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setGlancing(false);
        clearAllTimers();
      } else {
        resumeCooldownUntilRef.current = Date.now() + RESUME_COOLDOWN_MS;
        // Ny foreground-sesjon: nullstill glimt-budsjettet (runde 8).
        glanceCountRef.current = 0;
        scheduleGlance('first');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [reducedMotion, scheduleGlance, clearAllTimers]);

  // Render-tids dobbel vakt (i tillegg til at INGEN timer noensinne armeres
  // mens disabled, se effektene over): selv om `glancing` skulle stå igjen
  // `true` fra rett før reducedMotion/asset-status endret seg, VISES det
  // aldri — ingen synkron setState trengs i effektene for å garantere dette.
  // Scan-posen er reservert. Glimter vi oppå den, mister «Babyora
  // undersøker» eierskapet til uttrykket (analysesløyfe-runde 8).
  const showGlance = glancing && !reducedMotion && GLANCE_ASSET_READY && pose === 'normal';

  return (
    <>
      {/* Posen kommer fra HjemMonter (scanning ⇒ 'curious'); glimt-laget
          under er alltid montert, men vises bare i hvile. */}
      <MascotPeek compact={compact} pose={pose} reducedMotion={reducedMotion} />
      {GLANCE_ASSET_READY && (
        <img
          className="hjm-mascot hjm-mascot-glance"
          data-glancing={showGlance ? 'true' : 'false'}
          data-animate={reducedMotion ? 'false' : 'true'}
          src={GLANCE_SRC}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
    </>
  );
}
