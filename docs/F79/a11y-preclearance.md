# F79 A11y Pre-Clearance Checklist (accessibility-lead, 2026-07-01)

Advisory baseline for design-mock builders. Post-build sweep følger senere.

## 1. Kontrast — hver av de 4 palett-mockene må dokumentere

- [ ] Body-tekst vs bakgrunn: ≥ 4.5:1 (WCAG 1.4.3), målt i **både** lys og mørk variant
- [ ] Stor temp-display (≥ 24px / 18.66px bold): ≥ 3:1 minimum; sikt 4.5:1 uansett siden temp er primær-info
- [ ] Non-text UI (1.4.11): card-borders, input-outlines, ikon-strokes, toggle-states vs nabofarger ≥ 3:1
- [ ] CTA-knapp: label vs knapp-fill ≥ 4.5:1 OG knapp-fill vs side-bakgrunn ≥ 3:1 (begge varianter)
- [ ] Fokus-indikator vs bakgrunn ≥ 3:1 i begge varianter
- [ ] Dokumentér ratios i kommentar-blokk eller synlig spec-tabell per mock: `par → ratio → pass/fail`
- [ ] OKLCH-advarsel: re-valider etter hue-swap — sRGB gamut-clipping kan maskere luminans-skift (beregn på endelige clipped sRGB-verdier, ikke OKLCH-kilden)
- [ ] Aldri kode temperatur/vær-alvorlighet med farge alene

## 2. Dressing-animasjon (lagvis fade-in, ~1.5–2s)

- [ ] `@media (prefers-reduced-motion: reduce)`: hopp til ferdig-kledd sluttstate umiddelbart (ingen fades, ingen stagger). Sluttstate identisk med animert resultat
- [ ] Annonsering: ÉN `aria-live="polite"`-oppdatering ved animasjons-slutt — `"Påkledd: body, bukse, jakke"`. Aldri per lag (spam). Region må finnes i DOM før innhold injiseres
- [ ] Ingen flashing: kun fade-in, ingen blink/strobe; trivielt under 2.3.1 (3 flashes/sek) — verifiser ingen rask opacity-toggling i easing
- [ ] Pause/replay: under 5s så 2.2.2-pause ikke strengt kreves, men inkluder «Spill av igjen» replay-`<button>` (keyboard-nåbar, synlig fokus). Hvis noen looping/idle-animasjon finnes, ER pause-kontroll påkrevd
- [ ] Animasjonen må ikke stjele eller flytte fokus

## 3. Genererte bilde-assets — alt-tekst-policy

- [ ] (a) Individuelle plagg-lag-PNG-er staket på avatar: `alt=""` + `aria-hidden="true"` på hvert lag — presentasjonelle fragmenter
- [ ] (b) Komponert avatar: én meningsfull alt på wrapper (`role="img"` + `aria-label`), f.eks. `aria-label="Barn kledd i body, bukse og jakke"`. Alt må liste faktiske plagg, matchende live-region-teksten
- [ ] (c) 3D vær-ikoner med synlig temp+condition-tekst ved siden: `alt=""` — tekstlabelen bærer infoen. Hvis ikonet noensinne vises UTEN tekstlabel, flippes til meningsfull alt
- [ ] Ingen tekst bakt inn i genererte bilder som eneste info-bærer (1.4.5)

## 4. Mock-HTML-baseline (hver mock-fil)

- [ ] `<html lang="nb">`, beskrivende `<title>` («Mocknavn – Babyora F79»)
- [ ] Nøyaktig én `<h1>`; ingen hoppede heading-nivåer
- [ ] Landmarks: `<header>`, `<main>`, `<footer>` minimum; `<nav>` hvis navigasjon finnes
- [ ] Native elementer: `<button>` for handlinger, `<a href>` for navigasjon — ingen div-knapper selv i mocks
- [ ] `:focus-visible`-stiler på alle interaktive, ≥ 3:1 kontrast, ikke `outline: none` uten erstatning
- [ ] Touch-targets ≥ 44×44px
- [ ] `@media (forced-colors: active)` fallback: borders/outlines overlever, ingen info tapt
- [ ] Viewport-meta uten `user-scalable=no` / `maximum-scale`

## 5. Pattern-spesifikke feller

- [ ] **(a) Outfit-stack:** høyest risiko — stakede bilder formidler antrekket uten tekst. Krev synlig eller SR-tilgjengelig tekstliste av lag («Lag: body, bukse, jakke»), ikke alt-only. Lag-rekkefølge (innerst→ytterst) må finnes i tekst, ikke bare visuell stabling
- [ ] **(b) Editorial lag-fortelling:** heading-hierarki per seksjon (h2/h3, ingen hopp); ved scroll-triggede reveals må innholdet være i DOM og lesbart uten JS/scroll; reduced-motion viser alle seksjoner statisk
- [ ] **(c) Inline reveal:** trigger = `<button aria-expanded>` pekende på avslørt region; avslørt innhold følger trigger i DOM-rekkefølge; ingen fokus-trap; Escape ikke påkrevd (ikke modal) men ikke hijack den

Flagg konflikter eksplisitt heller enn å kompromisse stille — spesielt palett-vs-kontrast-spenninger.
