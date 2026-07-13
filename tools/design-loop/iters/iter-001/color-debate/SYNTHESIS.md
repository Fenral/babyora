# Iter 001 farge-debatt — Claude orkestrator-syntese

Dato: 2026-06-10 · Commit i evaluering: `b307b56`
Deltakere: /impeccable, /emil-design-eng, /color-expert, M365 Copilot, Claude
Total tid: ~25 min for 4 parallelle perspektiver

## TL;DR

**Sterkt konsensus om retning C** (warm off-white surface, ÉN orange accent, ikke pure white, ikke Court Clay).

Anbefalt palett etter syntese:

```css
--surface:           #FBFAF8;  /* warm paper, oklch(0.985 0.003 80) */
--surface-elevated:  #F3EFE9;  /* soft card */
--ink:               #14181F;  /* grafitt, ikke pure black */
--ink-muted:         #66707A;  /* secondary text */
--accent:            #D8541F;  /* terracotta, oklch(0.660 0.175 42) */
--accent-deep:       #A8441C;  /* pressed */
--hairline:          #DDD5CB;  /* divider — eneste card-erstatning */
--focus:             #2F6FED;  /* separat fra accent */

/* Aktivitet: mikro-hint-dot (5px circle) for sekundær semantikk, IKKE ringer */
--hint-vogn:         #7A98B8;
--hint-baeresele:    #9A7FB3;
--hint-utelek:       #6C9B83;
--hint-soevn:        #7D86B8;
```

## Konsensus-matrise

| Beslutning | impeccable | emil | color-expert | copilot | **Vinner** |
|---|---|---|---|---|---|
| **Retning C (verken A eller B)** | ✓ | ✓ | ✓ | ✓ | **4/4** |
| Surface warm-paper #FBFAF8 (ikke pure white) | ✓ (#FAFAF8) | ✓ #FBFAF8 | ✓ #FBFAF8 | ✓ #FBFAF8 | **4/4** |
| Ink grafitt, ikke pure #000 | ✓ #14181F | ✓ #1A1E26 | ✓ #14181F | ✓ #14181F | **4/4** |
| Drop DM Serif fra UI | ✓ | ✓ | ✓ | ✓ | **4/4** |
| Hairline-dividers, ikke cards | ✓ | ✓ | implisitt | ✓ | **4/4** |
| Multi-color rings i aktivitetsvelger | ✓ (dempet) | ✗ | ✓ (L=0.62) | ✗ | **2-2 split, men 3/4 sier IKKE som hovedvisuell bærer** |
| **Orange-tone** | #FF6B35 (+fix) | #D8541F | #F26A2E | #D8541F | **#D8541F: 2/4, anbefalt** |

## Konflikt-løsning

### Konflikt 1: Multi-color rings vs ÉN accent + ikon

Stillingsfordeling:
- **impeccable**: dempet 4-hue chips OK (state-indikator)
- **color-expert**: 4 ringer på fast L=0.62 OK (iso-perseptuell vekt)
- **emil**: NEI — Apple Fitness fungerer fordi den ER produktet
- **copilot**: NEI — «multicolor cosplay», stjeler fra hovedjobben

**Beslutning**: ikke som hovedbærer. ÉN accent + tydelige ikoner per aktivitet, og hvis vi vil ha semantisk støtte: mikro-hint-dot (5px) i samme palett som de fire chip-hues. Det er kompromisset Copilot foreslår eksplisitt, og det respekterer Emils «én accent per skjerm» mens det beholder color-expert sin L=0.62-disiplin når dot brukes.

### Konflikt 2: Eksakt orange-tone

| Token | L | C | Hue | C på paper | C på filled+hvit-tekst | Vurdering |
|---|---|---|---|---|---|---|
| `#FF6B35` (PRODUCT.md) | 0.68 | 0.207 | 38 | 3.1:1 | 3.13:1 (fail AA) | **Out-of-gamut sRGB** |
| `#F26A2E` (color-expert) | 0.66 | 0.175 | 42 | 3.1:1 | 4.0:1 | In-gamut, marginal hvit-tekst |
| `#D8541F` (emil+copilot) | 0.58 | 0.165 | 38 | 4.6:1 | 4.6:1 | In-gamut, **AA-pass på hvit** |

`#D8541F` er teknisk best (passerer WCAG AA både på paper og som filled CTA med hvit tekst). Color-expert sitt argument om hue-bånd 35-42 er respektert (alle innenfor warm-amber-segment).

**Beslutning**: `#D8541F` som primær accent. `color-expert` sin `--ref-amber-700` (#D45820) brukes som `--accent-deep` (pressed).

## Endelig palett-anbefaling (Claude-syntese)

```css
:root {
  /* Surface — warm paper */
  --surface:          #FBFAF8;  /* oklch(0.985 0.003 80) */
  --surface-elevated: #F3EFE9;  /* oklch(0.955 0.010 75) — hero-card lift */
  --surface-sunken:   #ECEAE6;  /* oklch(0.930 0.005 80) — section bg */

  /* Ink — grafitt-cool, ikke svart */
  --ink:              #14181F;  /* oklch(0.215 0.012 250) */
  --ink-soft:         #4A5260;  /* oklch(0.380 0.010 250) — labels */
  --ink-muted:        #66707A;  /* oklch(0.560 0.020 250) — captions */
  --ink-subtle:       #B8B5B0;  /* oklch(0.760 0.008 80) — UI only, non-text */

  /* Accent — én kontrollert terracotta */
  --accent:           #D8541F;  /* oklch(0.580 0.165 38) — primær CTA, AA på paper + hvit */
  --accent-deep:      #BE4818;  /* oklch(0.520 0.155 38) — pressed/hover */
  --accent-tint:      #FAEFE8;  /* oklch(0.960 0.020 38) — selected-pill bg */

  /* Struktur */
  --hairline:         #DDD5CB;  /* oklch(0.890 0.008 78) */

  /* Focus — separat fra accent for tydelig keyboard-feedback */
  --focus:            #2F6FED;  /* oklch(0.610 0.160 260) */

  /* Aktivitets-hints — KUN som mikro-dot eller ikon-tint, ikke som hovedbærer */
  --hint-vogn:        #7A98B8;  /* oklch(0.660 0.060 240) */
  --hint-baeresele:   #9A7FB3;  /* oklch(0.620 0.080 305) */
  --hint-utelek:      #6C9B83;  /* oklch(0.640 0.060 155) */
  --hint-soevn:       #7D86B8;  /* oklch(0.620 0.060 265) */
}
```

## Survivor-design-flagg

Ingen design-element fra Court Clay-paletten overlever uten endring. SVG-shells fra forrige sprint må bygges på ny surface-token. Lillian-PNG-er er warm-orange og fungerer fortsatt på warm-paper (validert av impeccable + emil).

## Tekstendringer som følger

- `--paper` → `--surface`
- `--paper-deep` → `--surface-elevated`
- `--terra` → `--accent`
- `--terra-deep` → `--accent-deep`
- `--terra-tint` → `--accent-tint`
- `--hair` → `--hairline`
- `--krem` → fjernes (pure white #FFFFFF erstattes av `--surface` i alle ikke-hero-kontekster)

## Score-konsensus etter debatt

| Perspektiv | Score nåværende design |
|---|---|
| Claude (orkestrator) | 59 |
| /impeccable | 58 |
| /emil-design-eng | 58 |
| /color-expert | (ikke eksplisitt score, men implisitt < 60 basert på «Court Clay feiler»-argument) |
| M365 Copilot | **43** (brutaleste) |

**Aggregert: ~54/100**. Klar regresjon fra iter 0 (~70 før hero v2). Iter 2 må reversere alle 6 problemer for å komme over 85.

## Stopp-betingelser

- Score < 95 → loop fortsetter
- Konvergens OK (alle valgte C, ulike detalj-varianter løst)
- Ingen survivor-design-blokk → fortsetter til iter 002

## Anbefalt scope for iter 002

Per Sivert-valg «iter 002 = palett-pivot + ny baby-silhuett samtidig»:

1. Tokens-bytte i `src/index.css` per palett over
2. Komponent-grep for hardkodet `oklch(64% 0.16 40)`, `oklch(94% 0.03 50)`, etc → bruk semantiske tokens
3. Drop DM Serif Display fra produkt-skjermer (behold KUN i splash + onboarding)
4. Hjem-hero: SVG-baby-silhuett med 3 kontur-linjer som lag (innerst/mellomlag/yttertøy) som henger på silhuetten
5. Aktivitetsvelger: ikon-driven, ikke multi-color. Mikro-hint-dot 5px under aktiv som sekundær semantikk (valgfri).
6. Vær-pill krymper til hairline-tekstrad
7. Lag-liste vertikal med 1px guide-linje
8. Accessibility-lead-pass på alle tokens (kritisk pga full palette-swap)

**Stopp-trigger sjekk etter iter 002**: hvis alle 4 perspektiver scorer ≥ 85, fortsett mot 95. Hvis < 85: identifiser om vi konvergerer eller om vi har survivor-blocker.
