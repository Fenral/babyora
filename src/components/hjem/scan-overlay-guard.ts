/**
 * scan-overlay-guard — den kritiske vakten (risiko #1 i den tekniske
 * planen) i egen fil, atskilt fra ScanOverlay.tsx sine komponent-eksporter.
 *
 * Grunn: react-refresh/only-export-components tillater ikke at en komponent-
 * fil eksporterer noe annet enn komponenter (fast refresh krever det for å
 * kunne skille "komponent endret" fra "modul-tilstand endret" trygt). Den
 * rene predikat-funksjonen flyttes derfor hit slik at den fortsatt kan
 * enhetstestes isolert (ScanOverlay.test.tsx) UTEN å bryte den regelen i
 * selve komponentfilen.
 */

export type OutfitTransitionStatusLike = 'idle' | 'captured' | 'ready' | 'playing' | 'settled';

/**
 * ScanOverlay/ScanStatusBlock skal ALDRI rendres mens outfit-transition-
 * koordinatoren (src/lib/outfit-transition/coordinator.ts, uendret av denne
 * pakken) er i 'captured' | 'ready' | 'playing' — det ville bety at skann-
 * koreografien kjører SAMTIDIG som en garment-flyv-animasjon fra en
 * tidligere navigasjon er i ferd med å lande.
 */
export function isScanOverlaySuppressed(outfitTransitionStatus: OutfitTransitionStatusLike): boolean {
  return outfitTransitionStatus === 'captured'
    || outfitTransitionStatus === 'ready'
    || outfitTransitionStatus === 'playing';
}
