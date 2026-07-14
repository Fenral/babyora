/**
 * R7 Task 3 — fire-rots-navigasjonen (mål-IA fra decision log 2026-07-13):
 * Hjem · Planlegg · Guide · Familie. Innstillinger er ikke lenger en rot —
 * innholdet bor bak Familie (restruktureres i R7 Task 7).
 *
 * TAB_DEFS (nøkler + labels) bor her som ren data slik at copy/struktur kan
 * testes uten DOM; ikonene bor i BottomTabBar.
 */

export type TabKey = 'hjem' | 'plan' | 'guide' | 'familie';

export type TabDefData = { key: TabKey; label: string };

export const TAB_DEFS: ReadonlyArray<TabDefData> = [
  { key: 'hjem', label: 'Hjem' },
  { key: 'plan', label: 'Planlegg' },
  { key: 'guide', label: 'Guide' },
  { key: 'familie', label: 'Familie' },
];
