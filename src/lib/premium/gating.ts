/**
 * gating — F81.5-W2: rene, testbare gating-predikater for freemium-flatene.
 *
 * Holdt UTEN React/Capacitor-avhengigheter (samme mønster som
 * paywall-copy.ts) slik at predikatene kan importeres og testes trygt fra
 * vitest (node-miljø, ingen jsdom) OG fra skjermene som faktisk bruker dem
 * til å styre rendering/guard-logikk (InnstillingerScreen.tsx, UkeScreen.tsx).
 *
 * Denne appen har ingen jsdom/@testing-library/react-oppsett — skjerm-
 * rendering verifiseres via Playwright/e2e (se f.eks. useOverrides.test.tsx).
 * Disse predikatene eksisterer derfor som egne, importerbare enheter slik at
 * selve GATING-BESLUTNINGEN (ikke DOM-outputet) kan enhetstestes presist.
 */

/**
 * Flate 4 (barn 2+): skal denne barn-raden i Bytt barn-dialogen gates bak
 * Babyora Pluss?
 *
 * Regel: barn nr. 1 (index 0) er alltid gratis. For ikke-Premium er
 * children[1+] gatet — MEN aktivt barn låses ALDRI ut, selv om det er
 * barn 2+ og brukeren har mistet Premium (edge-case: nedgradering mens et
 * barn nr. 2+ var valgt). `isActive` overstyrer derfor alltid gating.
 */
export function isChildSwitchGated(index: number, isActive: boolean, isPremium: boolean): boolean {
  if (isPremium || isActive) return false;
  return index > 0;
}

/**
 * Flate 1 (10 dager / "Uke"-tab): skal 10-dagers-panelet vise
 * teaser-modus (antrekk-/lag-delen erstattet av ETT samlet låst-parti)?
 *
 * Modell (b): tabben er alltid valgbar — kun tenday-tab + ikke-Premium
 * trigger teaser. "I dag"-tab er alltid urørt, uansett Premium-status.
 */
export function shouldShowTenDayTeaser(tab: 'today' | 'tenday', isPremium: boolean): boolean {
  return tab === 'tenday' && !isPremium;
}
