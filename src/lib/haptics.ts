/**
 * lib/haptics — P9 (docs/design-notes/sol-duel-2026-07-31.md §3) navngitt
 * haptikk-vokabular for scan-koreografien (Monter Hjem) og kjøpsflyten
 * (PaywallDialog).
 *
 * Dette er en TYNN semantisk overbygning over den allerede etablerte,
 * testede plattform-adapteren i lib/haptics/system.ts (samme Capacitor-
 * modul-lasting, samme native-only/web-no-op-garanti) — IKKE en ny
 * parallell implementasjon. Alt system.ts allerede gjorde riktig
 * (lazy-import av @capacitor/haptics, native-plattform-gate, stille
 * try/catch rundt ethvert plugin-kall) gjenbrukes uendret; denne filen
 * legger kun til det som manglet der (et 'error'-varsel) og gir hvert
 * duell-navngitt event sin egen lille funksjon, slik at kall-steder (scan-
 * koreografien, PaywallDialog) leser som ren produkt-intensjon i stedet for
 * rå tier-strenger.
 *
 * §3-tabellen (hendelse → generator → regel):
 *   Scan starter              → impactSoft()     — KUN førstegangs-sekvensen
 *   Avhuking (førstegang)     → selection()       — ett tick per avhuket rad
 *   Resultat lander           → impactMedium()    — prepare() ~110ms først
 *   Aktivitet byttes          → selection()       — kun ved faktisk endring
 *   Prisplan velges           → selection()
 *   Kjøp bekreftet            → notifySuccess()   — FØRST etter StoreKit-svar
 *   Kjøp feiler                → notifyError()     — FØRST etter StoreKit-svar
 *
 * Forbudt (håndheves av KALL-STEDENE, ikke her): tab-bytte, scroll, vanlige
 * kort, "arbeider"-repetisjon, kjøpsknapp-TRYKKET selv (kun resultatet).
 *
 * ALLE funksjonene her er stille no-op på web/i test (arvet fra system.ts:
 * `Capacitor.isNativePlatform()` er false → tidlig retur før noe
 * @capacitor/haptics-modul i det hele tatt importeres) OG når brukeren har
 * skrudd haptikk av i Innstillinger (samme `hapticsOn`-preferanse som resten
 * av appen bruker via useHapticSystem — lest her via readHaptics() siden
 * disse er rene funksjoner, ikke en React-hook).
 */
import { fire as systemFire, prepare as systemPrepare } from './haptics/system.js';
import { readHaptics } from '../hooks/useNativeSettings.js';

function hapticsEnabled(): boolean {
  return readHaptics() === 'on';
}

/** Scan starter — eier-override v3: HVERT scan-trykk (Hjem + Juster), ikke lenger kun "første gang noensinne" (§3). */
export function impactSoft(): Promise<void> {
  if (!hapticsEnabled()) return Promise.resolve();
  return systemFire('light');
}

/** Resultat lander — full scan-koreografi, ring med prepare() ~110ms først. */
export function impactMedium(): Promise<void> {
  if (!hapticsEnabled()) return Promise.resolve();
  return systemFire('medium');
}

/** Avhuking (hvert scan-trykk) / aktivitet byttes / prisplan velges. */
export function selection(): Promise<void> {
  if (!hapticsEnabled()) return Promise.resolve();
  return systemFire('selection');
}

/** Kjøp bekreftet — kalles FØRST etter StoreKit/RevenueCat-bekreftelse. */
export function notifySuccess(): Promise<void> {
  if (!hapticsEnabled()) return Promise.resolve();
  return systemFire('success');
}

/** Kjøp feiler — kalles FØRST etter et mislykket StoreKit/RevenueCat-svar. */
export function notifyError(): Promise<void> {
  if (!hapticsEnabled()) return Promise.resolve();
  return systemFire('error');
}

/**
 * Varmer opp den native haptikk-motoren før en landing. Ugatet av
 * hapticsOn (samme mønster som system.ts sin egen `prepare` — ren
 * modul-oppvarming, ingen følbar puls i seg selv) — no-op på web uansett,
 * siden `systemPrepare` selv aldri laster noe native-modul utenfor en
 * native plattform.
 */
export function prepare(): Promise<void> {
  return systemPrepare();
}
