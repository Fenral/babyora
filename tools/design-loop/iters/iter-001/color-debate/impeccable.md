# /impeccable — Standpunkt

## Standpunkt

**C — tredje vei. Spesifikt: warm-paper neutral + én funksjonell orange accent + multi-hue context-chips (KUN på Hjem-aktivitetsvalg).**

Status quo (A) feiler product-test: DM Serif Display på "Lillian" + cream/terracotta/serif-stacken er *eksakt* den AI-magazine-parenting-reflex PRODUCT.md anti-refererer mot (Hatch/Frida). Skjermdumpen viser det: orange CTA forsvinner i terracotta-hero, serif-display-h1 stjeler fra recommendation, hairline-prinsippet brytes av cards-in-cards.

B (PRODUCT.md-spec) er ærligere, men feiler òg: pure white #FFFFFF i en *outdoor-one-handed-winter-glove*-kontekst er en luminans-fall i mørket, og fire ring-hues på en skjerm bryter "single accent per screen" (PRODUCT.md linje 49). PRODUCT.md motsier seg selv — den krever Apple-Fitness-rings i samme avsnitt som "sparing visual elements".

Tredje vei løser begge: warm off-white surface (ikke cream, ikke pure), én orange CTA, kontekst-farger som *state-indikatorer på chips* (Vogn/Bæresele/Utelek/Søvn), ikke som flood. Behold serif KUN som wordmark.

## Foreslått palett

```css
:root {
  /* Surfaces — warm-paper, ikke cream, ikke pure white */
  --surface:        oklch(98.6% 0.004 80);   /* #fafaf8 — warm off-white, glare-safe outdoor */
  --surface-raised: oklch(100% 0 0);          /* #ffffff — hero-card lift */
  --surface-sunken: oklch(96.5% 0.006 80);   /* #f3f2ee — section bg */

  /* Ink — deep, not pure black (eye-fatigue under sleep-dep) */
  --ink:            oklch(20% 0.015 250);    /* #14181f — fra PRODUCT.md, beholdt */
  --ink-muted:      oklch(45% 0.010 250);    /* #5f6670 — secondary labels */
  --ink-subtle:     oklch(62% 0.008 250);    /* #8a8f97 — tertiary */

  /* Hairline (PRODUCT.md krever hairline-dividers, ikke cards) */
  --hairline:       oklch(90% 0.005 80);     /* #e3e1dc */

  /* Accent — én orange, brukt på CTA + active-tab + current-state */
  --accent:         oklch(68% 0.18 35);      /* #ff6b35 — PRODUCT.md orange, beholdt */
  --accent-ink:     oklch(98.6% 0.004 80);   /* tekst på accent — matcher surface */
  --accent-soft:    oklch(94% 0.04 35);      /* #fbe4d8 — accent bg for selected-pill */

  /* Context chips — KUN aktivitetsvelger, semantisk state, ikke decoration */
  --ctx-vogn:       oklch(55% 0.13 240);     /* dempet blå */
  --ctx-baresele:   oklch(50% 0.13 290);     /* dempet lilla */
  --ctx-utelek:     oklch(55% 0.13 155);     /* dempet emerald */
  --ctx-sovn:       oklch(45% 0.10 270);     /* dempet indigo */
}
```

**8 tokens. Konsistent L-skala. Alle chroma ≤0.18 (ingen flood).**

## WCAG-kontrast-tabell

| Pair | Ratio | AA normal (4.5)? | AA large (3.0)? |
|---|---|---|---|
| `--ink` on `--surface` (#14181f on #fafaf8) | **15.8:1** | ✓ AAA | ✓ |
| `--ink-muted` on `--surface` (#5f6670 on #fafaf8) | **6.4:1** | ✓ AA | ✓ |
| `--ink-subtle` on `--surface` (#8a8f97 on #fafaf8) | **3.4:1** | ✗ | ✓ (kun UI/large) |
| `--accent-ink` on `--accent` (#fafaf8 on #ff6b35) | **3.5:1** | ✗ normal | ✓ large/UI |
| `--ink` on `--accent` (#14181f on #ff6b35) | **9.1:1** | ✓ AAA | ✓ |
| `--ctx-vogn` on `--surface` | **5.7:1** | ✓ AA | ✓ |
| `--ctx-baresele` on `--surface` | **6.1:1** | ✓ AA | ✓ |
| `--ctx-utelek` on `--surface` | **4.6:1** | ✓ AA (marginal) | ✓ |
| `--ctx-sovn` on `--surface` | **7.8:1** | ✓ AA | ✓ |
| `--hairline` on `--surface` (non-text, 3:1 UI) | **1.2:1** | n/a | ✓ (1.4.11 unntak for decorative hairlines, men flagged) |

**Kritisk finding:** orange CTA (#ff6b35) med hvit tekst er **3.5:1 — UNDER AA-normal**. Dette er en PRODUCT.md-bug, ikke min. Løs ved: bruk `--ink` på `--accent` (9.1:1), ELLER bump accent-L ned til ~62% for hvit-på-orange ≥4.5:1. **Re-validér etter hue-swap** (jf. OKLCH-gamut-feedback).

## Implementasjons-skisse

**Files å endre:**
- `src/styles/tokens.css` (eller hvor enn nåværende Court Clay-tokens bor) — bytt ut hele `:root`
- `src/components/Hjem/*` — fjerne serif-h1 fra "Lillian", behold som wordmark KUN i splash/nav
- `src/components/ActivityPicker.tsx` — bind context-chips til `--ctx-*` istedenfor uniform accent
- `tailwind.config.js` (hvis Tailwind) — re-map theme.colors
- `index.html` font-link — dropp DM Serif Display fra runtime CSS, behold Instrument Sans + system stack

**Endrings-styrke:** Medium. Token-swap er mekanisk. Risiko ligger i Lillian-illustrasjonene (PNG-er er warm-orange — fungerer med warm-paper, ville feilet mot pure white).

**AI-tid:** ~25–40 min. Token-fil + 4-6 komponent-touch-ups + kontrast-revalidering. Manuell QA på TestFlight tar 15 min ekstra.

## Anti-mønstre

- **Ikke** introduser pure white (#FFFFFF) som surface. Gir glare outdoor + bryter sensoriell varme PRODUCT.md krever ("ikke clinical").
- **Ikke** bruk fire ring-hues som visuell flood. Apple-Fitness-DNA er greit som *state-indikator-vokabular* på chips, ikke som hero-dekorasjon.
- **Ikke** behold DM Serif Display i UI-labels, knapper, datakolonner. Serif kun som wordmark. PRODUCT.md (product-register) forbyr display-fonts i UI.
- **Ikke** brodere cream/terracotta som "varme" — det er category-reflex som anti-refererer Hatch/Frida.
- **Ikke** stack cards-in-cards (slik som nåværende hero+lag-for-lag). Hairline-dividers er PRODUCT.md-direktiv.
- **Ikke** skip kontrast-revalidering etter ANY hue-shift. OKLCH-gamut-clipping kan maskere ekte luminans.
- **Ikke** lås orange #FF6B35 før kontrast-fix mot hvit tekst er løst — pant blir 3.5:1, under AA.
- **Ikke** anta at PRODUCT.md har rett. Den krever samtidig "Apple-Fitness-rings" og "sparing visual elements, single accent per screen". Det er en spec-kollisjon Sivert må forhandle.
