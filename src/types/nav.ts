/**
 * Fire rotfaner: Hjem · Planlegg · Verktøy · Familie. Verktøy samler
 * kalkulatorer og guider uten å blande dem inn i familieinnstillingene.
 * Innstillinger er ikke en rot — innholdet bor bak Familie (R7 Task 7).
 *
 * TAB_DEFS (nøkler + labels) bor her som ren data slik at copy/struktur kan
 * testes uten DOM; ikonene bor i BottomTabBar.
 */

export type TabKey = 'hjem' | 'plan' | 'verktoy' | 'familie';

export type TabDefData = { key: TabKey; label: string };

export const TAB_DEFS: ReadonlyArray<TabDefData> = [
  { key: 'hjem', label: 'Hjem' },
  { key: 'plan', label: 'Planlegg' },
  { key: 'verktoy', label: 'Verktøy' },
  { key: 'familie', label: 'Familie' },
];

/**
 * Kompatibilitetstype for de tre guidene som også inngår i VerktoyTarget.
 * Navnet beholdes fordi vinterprogram-data fortsatt importerer GuideTarget.
 */
export type FamilieToolTarget = 'tog' | 'varm-kald' | 'forste-vinter';

/** De fire destinasjonene som eies av Verktøy-roten. */
export type VerktoyTarget = FamilieToolTarget | 'finn-antrekk';

/**
 * P6 (GuideHubScreen-sletting): union for de seks drill-målene som tidligere
 * ble eksportert som `GuideHubTarget` fra GuideHubScreen.tsx. Selve
 * GuideHub-skjermen ble avmontert i P1 og er nå slettet i P6 — men typen
 * lever videre her siden App.tsx (`onOpenGuideTarget`), VinterprogramScreen
 * sin `onOpenTarget`-prop og data/vinterprogram.ts sine `tryDet.target`
 * fortsatt trenger et felles union for målene: de tre Familie-verktøyene
 * over + Hjem-drillene finn-antrekk/plaggbib. Planlegg har ikke lenger en
 * egen Snart-destinasjon; flaten består kun av I dag og I morgen.
 */
export type GuideTarget = FamilieToolTarget | 'finn-antrekk' | 'plaggbib';
