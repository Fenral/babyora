# SN-007 · Dom · feat/hjem-list-detail-sheet

**Modell/agent:** Haiku 4.5 (Explore), Snudly W-GREN kontrollør  
**Baseline:** origin/main (7108499)  
**Grenens tupp:** origin/feat/hjem-list-detail-sheet (216518b)  
**Diff:** 316 filer, +23591/-4610 linjer  
**Lest:** snudly-mock.html, SNUDLY-DESIGNSYSTEM.md, DOD-SNUDLY.md, commits 216518b, 9df6a74, 171ecfa, 69b944e, 1d7f408, DESIGN.md.

---

## Overordnet vurdering

Grenen introduserer to nye detail-sheet-komponenter (GarmentFactSheet, GarmentAlternativesSheet) og situasjonsvelger (HomeSituationSheet) som native `<dialog>`-elementer med animert inngång/utgang, samt Glass A light-palett (eiergodkjent 2026-08-10). Strukturelt kompatibel med Snudly-mocken, men **introduserer systembrudd**: mørk-tema er `:root` fallback i stedet for lys (som kreves av SNUDLY-DESIGNSYSTEM.md §8). Animasjoner respekterer `prefers-reduced-motion`. Grenen er **stort sett BEHOLD/ENDRE-verdig**, med én **FORKAST**-del (design-lab-arkiv).

---

## Dom per del

| Del | Filer | Dom | Begrunnelse | Handling |
| --- | --- | --- | --- | --- |
| **Detail-sheets** | 171ecfa: GarmentFactSheet.tsx/.css, GarmentAlternativesSheet.tsx/.css | BEHOLD | Native `<dialog>`, ingen nøstede kort, chevron på listerad, motion-gramm. korrekt, `prefers-reduced-motion` implementert. | Cherry-pick direkte. |
| **HomeSituationSheet** | 171ecfa: HomeSituationSheet.tsx/.css, tests | BEHOLD | Situasjon som status (ikon-knapp, 44×44), ikke primær CTA. Dialog-basert, samme motion-grammatikk. | Cherry-pick direkte. |
| **Motion/redusert bevegelse** | 171ecfa: useOriginDialogTransition.ts/.css, home-sheet-motion.test.ts | BEHOLD | Dobbelkontroll på `reducedMotion` + `window.matchMedia()`, MOTION-tokens brukt, test verifiserer geometri aldri animeres. | Cherry-pick direkte. |
| **Glass A palett** | 9df6a74: src/styles/design-tokens-v2.css, DESIGN.md, theme-store.ts | ENDRE | Alle `--dw-*`-tokens (både mørk + lys) eksisterer og korrekte. **Problem:** `:root` er mørk (espresso #1E140C), men DESIGN.md 2026-08-10 krever lys som default. Lys-brukere ser riktig via `@media[data-theme="light"]`, men fallback for nye brukere (ingen lagret tema) er mørk. **Løsning:** Omstrukturér `:root` og `@media` slik at lys er fallback (enten via `prefers-color-scheme: light` eller ved å flytte alle lys-verdier til `:root` + mørk til overlay). | Endre CSS-ordning, behold alle token-verdier. |
| **Signaturgrep** | 216518b: docs/mocks/signatur/ (RESULTAT.md, PNG-er) | FORKAST | Design-lab-eksperiment (blind-dommer-øvelse for visuell lag-kommunikasjon). Ingen `.tsx/.ts`-kode, bare bilder og dokumentasjon. Lateral PRODUCT-beslutning som krever eier-godkjenning, ikke implementeringspakke. | Fjern fra grenen. |
| **tools/garment-audit/** | 216518b+ BABYORA-AGENCY-POLISH-MASTERPROMPT.md | FORKAST | Design-lab-arkiv (Impeccable-scan fra 2026-08-09, før Snudly-navnebytte). Bruker legacy «Babyora»-navn, ikke produktkode. | Fjern fra grenen. |
| **Chevron + systemregler** | MonterGarmentRow.tsx, HomeSituationSheet.tsx | BEHOLD | Chevron eneste «åpne»-affordance i rad (A8). Situasjonsmerke er status, ikke knapp. Ingen nøstede kort. | Cherry-pick direkte. |
| **HjemMonter orkestrator** | 1d7f408, 171ecfa, 216518b: HjemMonter.tsx (+1500 linjer) | BEHOLD | Ny scene-toggle (weather/result), sheet-state, situation-select, result-cache, motion-koordinering. Veloversatt, testet etter DoD-kriterier. | Cherry-pick direkte. |
| **Navn (A7)** | git diff origin/main...origin/feat/hjem-list-detail-sheet -- src/ | BEHOLD | «Babyora» forekommer i console.error (legacy), test-fixtures, paywall-tekst (RevenueCat produkt-ID, påkrevd per DoD C2). Ingen forekomst i brukersynlig UI-tekst. HomeSituationSheet bruker «Snudly» implisitt. | Behold som er. |
| **Nye tester** | GarmentFactSheet.test.tsx, HomeSituationSheet.test.tsx, home-sheet-motion.test.ts | BEHOLD | 50+ nye tester, ingen `skip` uten årsak. Antall tester øker. | Cherry-pick direkte. |

---

## Nøkkelfunn

1. **CSS-fallback lys-tema** — `src/styles/design-tokens-v2.css:1-150` definerer `:root` som espresso (mørk), men SNUDLY-DESIGNSYSTEM.md §8 og DESIGN.md 2026-08-10 krever lys som default. Nye brukere (ingen lagret tema) faller til mørk. **Fix:** `:root` skal være light + `@media[data-theme="dark"]` skal være mørk, eller bruk `@media (prefers-color-scheme: light)` for fallback.

2. **useOriginDialogTransition korrekt** — `src/components/hjem/useOriginDialogTransition.ts` sjekker både `reducedMotion` prop og `window.matchMedia()`, dobbelkontroll. MOTION-tokens brukt, ingen hardkodet ms. Test verifiserer geometri aldri animeres. ✓ BEHOLD.

3. **Chevron eneste affordance** — `src/components/hjem/MonterGarmentRow.tsx:150-160` viser chevron KUN for detalj-åpning, aldri tekstlenker. ✓ BEHOLD, MockRule §6.

4. **Design-lab-artefakter skal ikke merges** — `docs/mocks/signatur/` (PNG-er, RESULTAT.md) og `tools/garment-audit/` (design-review) er eksperimenter, ikke produktkode. ✗ FORKAST.

5. **Glass A palett godkjent** — Alle `--dw-*`-tokens eksisterer med korrekte verdier. Kun fallback-orden må endres. ✓ BEHOLD + ENDRE.

6. **Situasjonsmerke er status** — Ikonknapp som read-only visual feedback. Åpnes av bruker for å endre, men merket selv er ikke en affordance. ✓ BEHOLD, MockRule §6.

7. **Ingen nøstede kort** — GarmentFactSheet, GarmentAlternativesSheet, HomeSituationSheet bruker native `<dialog>`, ikke embedderte kort. ✓ A8.

8. **Motion-test** — `src/components/hjem/__tests__/home-sheet-motion.test.ts` verifiserer at animasjoner bruker `MOTION`-tokens, respekterer `prefers-reduced-motion`, og at geometri aldri animeres. ✓ A5.

---

## Det jeg er minst trygg på

1. **Nøyaktig CSS-fallback strategi** — Jeg antok `:root` skal være light basert på DESIGN.md, men har ikke kjørt appen. Hvis `theme-store.ts` håndterer fallback korrekt, kan CSS-endringen være utenfor scope. **Verifiser:** Start appen med sletta tema-lagring; sjekk at HTML bruker lys, ikke mørk.

2. **Situasjonsmerke interaksjonsflyt** — Jeg antok read-only, men har ikke lest all HjemMonter-logikk for situation-change. **Verifiser:** Søk etter onClick på situasjonsmerke; skal være None (bruker klikker ikonknapp i stedet).

3. **Paywall «Babyora»-tekst** — DoD C2 forbyr å endre produkt-ID-ene (fordi de er i App Store Connect). DoD A7 forbyr synlig «Babyora» i UI. Jeg antok paywall er unntatt, men **verifiser** at bruker faktisk ikke oppfatter navnet som «Babyora» (kan være OK hvis det bare står «Plus»).

---

## Anbefaling

**Cherry-pick fremover:**
- 171ecfa (sheets + motion + tests)
- 69b944e (garment refinement, hvis ikke tatt inn av 171ecfa)
- 9df6a74 (Glass A, med **rette CSS-fallback**)

**Fjern:**
- `docs/mocks/signatur/`
- `tools/garment-audit/`

**Kjør:** DoD G1–G4, `tools/verify-hjem.mjs`, ta screenshots (lys + mørk).

**Lag PR** mot main med referanse til denne filen.

