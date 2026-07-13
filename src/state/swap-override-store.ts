/**
 * swap-override-store — session-only override for plagg-bytter.
 *
 * Når brukeren tar et alternativ fra PlaggDetailSheet («Bytte til»),
 * registreres mappingen original → alternativ her. Antrekks-renderingen kan
 * lese `getSwap(originalId)` og bytte ut visningen uten å forstyrre
 * regelmotorens output.
 *
 * Bevisst UTEN persist — bytte gjelder kun for nåværende sesjon. For
 * permanent eierskaps-override, se `lib/garments/ownership-override.ts`.
 */
import { create } from 'zustand';

export type SwapMap = { [originalGarmentId: string]: string };

export type SwapOverrideState = {
  swaps: SwapMap;
  setSwap: (original: string, alternative: string) => void;
  clearSwap: (original: string) => void;
  getSwap: (original: string) => string | null;
  resetAll: () => void;
};

export const useSwapOverride = create<SwapOverrideState>()((set, get) => ({
  swaps: {},
  setSwap: (original, alternative) =>
    set((s) => ({ swaps: { ...s.swaps, [original]: alternative } })),
  clearSwap: (original) =>
    set((s) => {
      const next = { ...s.swaps };
      delete next[original];
      return { swaps: next };
    }),
  getSwap: (original) => get().swaps[original] ?? null,
  resetAll: () => set({ swaps: {} }),
}));
