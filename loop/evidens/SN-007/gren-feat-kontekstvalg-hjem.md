# SN-007 · Dom · feat/kontekstvalg-hjem

**Modell/agent:** Claude Haiku 4.5, Snudly gren-kontrollør  
**Baseline:** origin/main (71084992fecb372)  
**Grenens tupp:** origin/feat/kontekstvalg-hjem (9e89b246)  
**Diff:** 281 filer, +21557/-4537 linjer  
**Lest:** loop/referanse/snudly-mock.html (938 linjer), loop/referanse/SNUDLY-DESIGNSYSTEM.md, git log/show/diff for 35 commits.

## Overordnet vurdering

Grenen har tre separable deler: (1) Bæresele-utvidelse + preferredActivity — begge BEHOLD, funker med mocken. (2) Tools som egen fane + result-first Hjem — BEHOLD Tools-struktur (mocken viser 4 faner), result-first endrer Hjem-flow. (3) Mineral Garden dark-first override — FORKAST: eier 14.08 overstyrt dark-first; lys skal være default og låst i designsystemet.

## Dom per del

| Del | Commits | Dom | Begrunnelse |
| --- | --- | --- | --- |
| preferredActivity (d08b1d0) | src/state/child-profile.ts, HjemScreen.tsx | BEHOLD | Legger HjemActivity-preferanse på barnet, fallback utelek, sikker type-binding. |
| Bæresele-utvidelse (3cd2399) | hjem-copy.ts, WeatherScene, scan-orchestration.ts | BEHOLD | Vogn+bæresele+utelek på tre steder, copy alle 4 språk, soevn holdt utenfor. |
| Tools hub (4a8a011) | src/types/nav.ts, src/screens/VerktoyScreen.tsx | BEHOLD | 4 faner (Hjem, Planlegg, Verktøy, Familie) matchet fasit-mocken. TabKey legger til verktoy. |
| Hjem result-first | ResultSurface.tsx, GarmentAlternativesSheet.tsx | BEHOLD | Carousel scroll-snap arkitektur, detalj-sheet per plagg. Major redesign, visuelt QA nødvendig. |
| Mineral Garden palett (3092fdd) | DESIGN.md, design-tokens-v2.css, splash-filer | FORKAST | Dark-first-overstyring. Eier 14.08 låste lys som default. Fargetokens (espresso #1E140C) hører til forkastet retning. |
| Tab depth-test (d6a3999) | BottomTabBar.test.tsx | FORKAST | Mineral Garden-referanse i test, knyttet til forkastet adopsjonen. |
| tools/garment-audit, tools/verify-*.mjs | design-handoff-filer, script-oppgaderinger | ENDRE | Mulig Mineral-relatert audit-artefakt. Skilles som tools-gren eller dokumenteres separat. |

## Nøkkelfunn

- **Fanestruktur korrekt:** `.tabbar grid-template-columns: repeat(4,1fr)` i mocken (linje 473). Grenen legger Verktøy som TabKey — matchet.

- **Dark-first conflict:** DESIGN.md på grenen sier Mineral-lys er primær; origin/main sier dark er primær. Referanse-systemet (SNUDLY-DESIGNSYSTEM.md §8) låser lys som standard. Eier 14.08 overstyrt Mineral-beslutninga. **REVERSER.**

- **Bæresele-coverage:** Tre steder (HjemActivity, useState, record) alle utvidet til vogn+bæresele+utelek. Copy alle språk. **FULLSTENDIG.**

- **Chart-bruk av rust:** Kun `--saffron` i `change-line`/`change-pill` på Plan. Ingen misbruk. **OK.**

- **Navn (A7):** Snudly brukt konsistent, legacy Babyora-refs oppholdt for kompatibilitet. **BEHOLD.**

## Anbefaling

**BEHOLD:** preferredActivity, bæresele, Tools-fane, result-first Hjem-redesign.  
**FORKAST:** Mineral Garden dark-first (3092fdd, d6a3999, DESIGN.md-Mineral-seksjonen, design-tokens-v2.css).  
**ENDRE:** tools/-katalog separer eller dokumenter.  
**Reintroduksjon:** Lag `feat/kontekstvalg-hjem--reintegrated`, git revert 3092fdd d6a3999, fjern Mineral-seksjoner fra DESIGN.md, behold legacy design-tokens.css.

## Usikkerhet

- **tools/** katalog: Jeg kan ikke avgjøre om verify-hjem.mjs og verify-launch.mjs oppgraderinger er nødvendige eller Mineral-relatert. Les tool-headers før avgjørelse.
- **Result-first visuell QA:** GarmentAlternativesSheet (281 linjer) og scroll-snap-logikk ser korrekte ut, men visuell test mot mock nødvendig før merge.

