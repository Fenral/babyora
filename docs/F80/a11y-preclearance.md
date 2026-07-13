# F80 PROD-PORT — A11y pre-clearance (accessibility-lead, 2026-07-02)

Lim inn i port-agent-prompter. Regresjon mot baseline = Critical.

**Baseline (regresjon = Critical):** Behold native `<dialog>` + showModal/ESC/focus-return via App.tsx drill-state, eksisterende aria-live-mønstre, og reduced-motion-grammatikken i motion-grammar.ts. Alle nye animasjoner SKAL gå gjennom motion-grammar, ikke rå CSS-keyframes med egen RM-sjekk.

## 1. HjemScreen (port fra f79-hjem-a — mocken er a11y-korrekt, porter mønstrene 1:1)

- Dressing-sekvens ved load: ~2s autoplay OK uten pause-krav (WCAG 2.2.2 gjelder >5s), MEN: (a) `prefers-reduced-motion` → hopp rett til sluttstate (stage-4), ingen crossfade; (b) sekvensen skal ALDRI blokkere interaksjon — CTA og nav fokuserbare fra første frame; (c) frekvens (én gang per dag vs per mount) er UX-valg, ikke a11y-krav — men ved replay-knapp (`aria-label="Spill av påkledning igjen"`) skal `role="status"`-elementet annonsere ferdig-state («Kledd i N lag»), ikke hvert stage. Avatar-stacken: container `role="img"` + samlet aria-label, alle stage-`<img alt="">`.
- Sol-puls er kontinuerlig (>5s) → **synlig pause-knapp KREVES** (WCAG 2.2.2), uavhengig av RM. Porter motion-toggle-btn: `aria-pressed` + aria-label «Pause sol-animasjon», **persistér valget (localStorage)**.
- Temp-mast er dekorativ (`aria-hidden="true"`); verdien bæres av sr-only `#temp-display` med `aria-live="polite"`. Ikke dupliser verdien i AT-treet.
- Lag-teller: dots `aria-hidden`, tekst «N lag» bærer semantikken.

## 2. Temperatur-reaktiv canvas (live vær)

Canvas/atmos-lag er `aria-hidden` — visuell transition ved vær-endring har ingen ARIA-krav utover: (a) RM → CSS-vars byttes uten transition (instant snap); (b) ingen flashing >3/sek; (c) vær-ENDRINGEN annonseres via `#temp-display` polite-region (temp + kort tilstandsord, «8 grader, regn»); (d) **re-valider kontrast for tekst/CTA mot ALLE temp-varianter av canvas (kald/mild/varm × light/dark)** — mockens kontrasttabell er fasit. Ingen transition ved polling-jitter — kun ved faktisk tilstandsbytte.

## 3. Komposisjons-popup (2–9 plagg)

- **DOM-rekkefølge = påkledningsrekkefølge** (innerst→ytterst), alltid — uansett visuell posisjon (CSS/absolute for layout, aldri `order`/`tabindex` for rekkefølge). Badge-tall `aria-hidden`; laget i knappens aria-label: «Vis info om {plagg}, lag {n}[, {m} alternativer finnes]». Connectors/labels `aria-hidden`.
- Avatar-hero: `role="img"` med DYNAMISK aria-label fra recommend()-output, ikke hardkodet.
- **Fallback ved plassmangel** (landscape/smått/9 plagg/200 % zoom): degradér til vertikal liste — samme DOM, kun CSS. WCAG 1.4.10 (reflow, 320px) + 1.4.4: ingen plagg-kort klippes/blir unåelige. Touch ≥24×24 (44 anbefalt) også kompakt.
- Detalj-region: `aria-expanded` + `aria-controls` + fokusflytt inn, ESC/lukk → fokus tilbake til utløsende kort. PlaggDetailSheet-integrasjonen må ikke bryte dialog-baseline.

## 4. Lottie → statisk PNG

Ingenting mistes — Lottie hadde null semantikk. Krav: `alt=""` (dekorativ; temp/tilstand bæres av tekst). Fjern død WeatherLottie-RM-logikk; ingen tomme `aria-label`/wrapper-roller igjen.

## 5. Verdikt-hero i FinnAntrekk + Guide

- Tallet + hvorfor-linje i én `aria-live="polite" aria-atomic="true"`-region. **Debounce ~800–1000ms** etter siste slider-input (annonsér hvilende verdi, aldri hver tick). Slidere: native `<input type="range">` med label + `aria-valuetext` i menneskelig enhet («−5 grader»). Kilde-linje UTENFOR live-regionen.
- GuideHub: fjern søkeknappen HELT fra DOM (ikke display:none-skjuling som etterlater tab-stopp).
- TogGuide: barnenavn interpoleres — verifiser ingen template-rester («{navn}») i aria-labels.

## Exit-sjekk per skjerm

`npm run build` grønn · axe uten nye funn · tastatur-runde (Tab-orden = logisk, ESC-kjede intakt) · RM-modus visuelt verifisert · kontrast re-validert per temp-variant (OKLCH-gamut-regelen: re-valider etter fargebytte).
