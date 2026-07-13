# Atomic-liste — alle deler ferdig før TestFlight

**Direktiv (Sivert 2026-06-19):** Alle delene må være klare før jeg
tester i TestFlight. Kjør dynamisk flow med så mange prosesser samtidig
uten dobbelcoding. System som sjekker at kode + bilde blir riktig ut
fra bestillingen.

## Filsti-territorier (per agent, ingen overlapp)

For å unngå dobbelcoding: hvert spor eier disjunkte filer.

| Spor | Filer som røres | Konflikt-risiko |
|---|---|---|
| **F32** LayerSheet | `src/components/instrument/InstrumentLayerSheet.tsx`, `src/screens/HomeScreenInstrument.tsx` (state-stack), eksisterende `src/data/garment-illustrations.ts` (read-only lookup) | Touches HomeScreen |
| **F28.37** Onboarding | `src/screens/OnboardingScreen.tsx`, `src/index.css` (.onb*-klasser) | Isolert |
| **F28.38** Sone 3 Copilot-validering | Ingen kode-endring i denne fasen (kun melding + scoring) | Isolert |
| **F28.39** Plaggbib/Plagg-detalj Copilot-validering | Ingen kode-endring i denne fasen | Isolert |
| **F31** Codemagic-monitor | Ingen wool-app-endring; `docs/v0-rounds/codemagic-build-N.md` | Isolert |

**Konflikt:** F32 + F28.37 begge potentielt rører `HomeScreenInstrument.tsx` hvis F28.37 onboarding-CTA-fixer trenger HomeScreen-state. **Mitigering:** F28.37 endrer kun OnboardingScreen.tsx + index.css. Ingen overlapp.

---

## Atomic-tasks per spor

### F32 — LayerSheet visuelt + interaktivt

| # | Task | Eier-fil | Verifisering |
|---|---|---|---|
| F32.1 | a11y pre-clearance | (background) | a11y-lead SHIP ✅ ferdig |
| F32.2 | LayerRow: thumbnail (56px) + tap-button + chevron | `InstrumentLayerSheet.tsx` | grep `garmentPng`, `<button>` på rad |
| F32.3 | Multi-item: h3 primary + secondary-span (a11y-lead spec) | `InstrumentLayerSheet.tsx` | grep `secondary` style |
| F32.4 | Wire `onOpenGarment` prop + sheet-state-stack | `HomeScreenInstrument.tsx` | grep `currentGarment` state |
| F32.5 | Alternativ-liste fallback (button + aria-expanded) | `InstrumentLayerSheet.tsx` | grep `aria-expanded`, `ITEM_ALTERNATIVES`-lookup |
| F32.6 | Backdrop-click filtrert på event.target (dialog-stack) | `InstrumentLayerSheet.tsx` | grep `event.target ===` |
| F32.7 | Build + tests + verify-fan-out --screen=paakledning | scripts | exit 0, 200/200 tester |
| F32.8 | Visuell verifisering: render screenshot + sammenlign | scripts/render-sheet-3temps.mjs | screenshot diff |

### F28.37 — Onboarding CTA + input-rader

| # | Task | Eier-fil | Verifisering |
|---|---|---|---|
| F28.37.1 | a11y pre-clearance | (background) | ✅ a11y-lead REWORK-spec mottatt |
| F28.37.2 | CTA #1 (steg 1): TapTarget → InteractiveBlock m/ haptic-wrapper | `OnboardingScreen.tsx` | ✅ grep `<InteractiveBlock`, `onClick={tapHaptic}`, `aria-label="Fortsett til steg 2 av 3"` |
| F28.37.3 | CTA #2 (steg 2) | `OnboardingScreen.tsx` | ✅ `aria-label="Fortsett til steg 3 av 3"` |
| F28.37.4 | CTA #3 (steg 3 «Sett i gang») | `OnboardingScreen.tsx` | ✅ `aria-label="Fullfør oppsett"` + `ref={finishBtnRef}` |
| F28.37.5 | Input steg 1: 56px surface-rad wrapper | `OnboardingScreen.tsx` + `index.css` `.onb__row` | ✅ `<label className="onb__row">` rundt name-input |
| F28.37.6 | Input steg 2 (date): samme wrapper + age-readout integrert i data-readout | same | ✅ native date-input bevart, `dobDisplay` viser «dd.mm.åååå · X år Y mnd» |
| F28.37.7 | Input steg 3 (sted): samme wrapper + GPS-knapp egen InteractiveBlock-rad under | same | ✅ GPS flyttet UNDER input som `.onb__row--action` |
| F28.37.8 | Build + tests + verify-fan-out --screen=onboarding | scripts | ✅ `npm run build` exit 0, `npm test` 200/200 |
| F28.37.9 | Visuell: render 3 step-screenshots | (lage script hvis ikke finnes) | ⏳ overlatt til Claude master (post-batch) |

### F28.38 — Sone 3 Copilot-validering

| # | Task | Eier-fil | Verifisering |
|---|---|---|---|
| F28.38.1 | Send Copilot: Varm/kald + TOG + Innstillinger status | Playwright/Copilot | Copilot-respons |
| F28.38.2 | Implementer eventuelle P1-fixer fra Copilot | per skjerm-fil | grep tiltak-tegn |
| F28.38.3 | Build + tests etter P1-fixer | scripts | exit 0 |

### F28.39 — Plaggbib + Plagg-detalj Copilot-validering

| # | Task | Eier-fil | Verifisering |
|---|---|---|---|
| F28.39.1 | Send Copilot: Plaggbib + Plagg-detalj status | Playwright/Copilot | Copilot-respons |
| F28.39.2 | Implementer eventuelle P1-fixer | per skjerm-fil | grep |
| F28.39.3 | Build + tests | scripts | exit 0 |

### F28.40 — Onboarding Copilot ny score

| # | Task | Eier | Verifisering |
|---|---|---|---|
| F28.40.1 | Etter F28.37 implementert: send Copilot ny status | Playwright | score-bekreft |
| F28.40.2 | Iter til SHIP (96+) | hvis lavere, P0-fixer | score-trend |

### F31 — Codemagic build-monitor (kjører parallelt)

| # | Task | Eier | Verifisering |
|---|---|---|---|
| F31.b | Sjekke Codemagic iOS-build-status | Playwright codemagic.io | status grønt eller log feilet |
| F31.c | Hvis cert-revoke: følg playbook | docs/codemagic-cert-revoke.md | build retrigger grønt |
| F31.d | Sende Sivert TestFlight + Play Internal-link når begge grønne | (Sivert-handover) | URL klar |

---

## Verifikasjons-system (bestilling vs leveranse)

**Per task:**

1. **Pre-flight grep** — sjekk at filen ikke har ufullstendige edits (no orphan `{}` etc)
2. **Build** — `npm run build` grønt
3. **Tests** — `npm test` 200/200
4. **Verify-fan-out** — `node scripts/verify-all.mjs --screen=X` ≥4/5 grønt (tokens-drift pre-existing)
5. **Visuell render** — Playwright screenshot ved 390×844 viewport
6. **A11y-sweep** — accessibility-lead post-build review per ny komponent

**Per spor (etter alle tasks):**
- Commit-melding refererer atomic-task-numre som er ferdig
- Push trigger Codemagic-build automatisk
- Status oppdateres her i fila

---

## Dynamic-flow-strategi

**Parallell:**
- F28.38 + F28.39 Copilot-validering (samtidig — Copilot leser én melding av gangen, men Playwright-meldinger kan kø)
- F31 Codemagic-monitor (passivt, ingen kode-endring)

**Sekvensiell:**
- F32 må fullføres før F32.5 verify (samme fil)
- F28.37 må fullføres før F28.40 Copilot ny score
- Onboarding a11y-lead svar må komme inn før F28.37.2-7 implementeres

**Worktree-isolation droppet** for nå — kostnad/oppside ikke verdt det
siden F32 og F28.37 har disjunkte fil-territorier.

---

## Atomic-tracking

Hver task får checkbox under sin seksjon når ferdig. Pushes til repo
etter hver større del-commit.

**Status nå:** F32.1 ✅, F28.37.1–F28.37.8 ✅ (F28.37.9 visuell-render ⏳), alle andre ⏳
