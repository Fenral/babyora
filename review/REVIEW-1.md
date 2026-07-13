# Fable 5 review-runde 1 — 2026-06-12

Playwright-loopen kjørt mot live preview-deploy (commit `3d02318`,
viewport 430×900). Skjermbilder i `review/shots/r1-430x900/`.

## Funn

### 1. Innstillinger viste hardkodet «Trondheim»

**Skjermbilde:** `innstillinger.png`

**Bug:** Settings.tsx hadde `<span className="iz-row__name">Trondheim</span>`
hardkodet, mens Hjem og Uke leste fra `active.city` (= "Oslo" i testen).
Det er Fable-buggen om sted-inkonsistens i 1:1 form.

**Fix:** R1.1 (commit `09196ed`) — `SettingsScreen.tsx` importerer
`useChildren` og bruker `{active.city}` istedenfor «Trondheim»-strengen.

**Verifikasjon:** runde 2 skal vise samme sted (Oslo) i Innstillinger
som i Hjem/Uke.

### 2. Orbit-tags rendret men ikke synlige

**Skjermbilder:** `hjem-vogn-vaken.png` (ingen tags synlig), 
`hjem-opacity-forced.png` (tags synlig etter manuell DOM-overstyring).

**Bug:** DOM-evaluering bekreftet 3 `[data-plagg-button]`-noder med
korrekte layer-IDs (innerst, mellomlag, ekstra), MEN foreldre-noden
`<g data-garment>` hadde inline `opacity: 0` fra DressUpAvatar. Web
Animations API rapporterte 0 aktive animasjoner — animasjonen kjørte
aldri eller ble kansellert.

**Hypotese:** DressUpAvatar.useEffect cleanup canceller play umiddelbart
ved deps-endring. I gjenåpnings-cas (sessionStorage allerede satt,
shouldAutoplay=false) ble play('fade') trigget men cancelled.

**Fix:** R1.2 (commit `6cb00d4`) — DressUpOrbital.useEffect setter inline
`opacity = '1'` på alle `[data-garment]`-noder etter mount. WAAPI
keyframes overstyrer inline mens animasjonen kjører (1500ms-vindu for
første gang), så autoplay-opplevelsen er uberørt.

**Verifikasjon:** runde 2 skal vise 3 plagg-tags synlige rundt Lillian
med labels.

## Suksesser (ingen fix nødvendig)

✅ **P0.1 Engine-summary**: «Langermet body og pyjamas.» matcher
faktisk anbefaling (ikke «Ull + fleece + yttertøy»-lyver-tekst).

✅ **P0.3 Værikon**: sol/sky-ikon vises ved 0.0 mm/t, ikke regnsky.

✅ **P0.4 Sted/dato**:
- Uke-titler: «Time for time i Oslo», «Neste 10 dager i Oslo»
- 10 dager viser «12. juni, 13. juni, ...» (relative datoer, ikke
  «12. mai» i juni)

✅ **P0.5 Time-for-time**: full liste med 24 timer + score per time.

✅ **P1.3 Mini-Lillian fjernet**: header har bare «Lillian» + «I DAG».

✅ **P1 OKLCH borders**: ingen ferskenbeige synlige; alt kjølig blue-grey.

## Utestående (ikke fikset denne runden)

- **P1.4 AKTIVITET-velger over «Vis lag»**: fortsatt under «Vis lag».
- **P4 Lillian-i-onboarding**: ikke implementert (krever 3-stegs UI-arbeid).
- **A-1 (ANOMALIES)**: Guide-kalkulator ved +5° + frisk vind + yr → 
  4 lag vinterkjøredress (rapportert i Fable, ikke verifisert i denne
  runden).

## Neste runde (R2)

1. Verifiser at R1.1 (Innstillinger) og R1.2 (orbit-tags) fungerer.
2. Test klikk på en orbit-tag → LayerDetailSheet åpner.
3. Test klikk på en uke-time → TimeShiftSheet åpner.
4. Sjekke onboarding-flyten (steg 1-3) hvis localStorage tømmes.
