/**
 * P1 (nav 4→3 skeleton, 2026-07-30): tre-rots-navigasjonen — Hjem · Planlegg ·
 * Familie. Guide-tab-roten er fjernet; alle tidligere Guide-skjermer forblir
 * nåbare via drills (se App.tsx sin Drill-union) i stedet for en egen root-tab.
 * Innstillinger er ikke en rot — innholdet bor bak Familie (R7 Task 7).
 *
 * TAB_DEFS (nøkler + labels) bor her som ren data slik at copy/struktur kan
 * testes uten DOM; ikonene bor i BottomTabBar.
 */

export type TabKey = 'hjem' | 'plan' | 'familie';

export type TabDefData = { key: TabKey; label: string };

export const TAB_DEFS: ReadonlyArray<TabDefData> = [
  { key: 'hjem', label: 'Hjem' },
  { key: 'plan', label: 'Planlegg' },
  { key: 'familie', label: 'Familie' },
];

/**
 * P1: mål for de tre tidligere Guide-"kunnskap"-kortene (TOG-guiden, Varm
 * eller kald?, Første vinter) — nå åpnet som drills fra Familie sin nye
 * "Verktøy"-seksjon (src/components/family/ToolsSection.tsx) i stedet for
 * fra Guide-huben. Selve destinasjonsskjermene (TogGuideScreen,
 * VarmEllerKaldScreen, VinterprogramScreen) er uendret.
 */
export type FamilieToolTarget = 'tog' | 'varm-kald' | 'forste-vinter';
