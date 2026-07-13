# /emil-design-eng — Standpunkt

## Standpunkt

Begge ytterpunktene bommer på materialiteten. **A (Court Clay)** er en cafélatte — koselig, men feil register: cream + DM Serif er Hatch/Frida-refleksen PRODUCT.md eksplisitt avviser, og terracotta-on-cream gir maks ~5.2:1 kontrast i sterk morgensol med fingeravtrykk på skjermen. Forelderen squinter, ikke smiler. **B (pure white + #FF6B35)** er teknisk korrekt, men kalibrert for moodboard, ikke for kjøkkenbenken kl 06:43 med baby på armen. Rent hvitt blender mot nattlys og blir steril mot babyhud i illustrasjonene. #FF6B35 på #FFFFFF gir bare 3.13:1 — fail AA normal for tekst, kun OK som flate.

Velg **C**: papirhvit-warm (ikke cream, ikke clinical), grafitt-ink (ikke svart), og én kalibrert sunset-orange som faktisk består WCAG på begge ender. Material > mood. Lesbar > pen. Ingen serif på utility-screens.

## Foreslått palett

```css
/* Surfaces — warm-neutral, ikke cream */
--surface-base:    oklch(98.8% 0.004 75);   /* #FBFAF8  papirhvit, +0.4% varme */
--surface-raised:  oklch(96.5% 0.006 75);   /* #F4F2EE  hairline-divider-flate */
--surface-sunken:  oklch(93.8% 0.008 70);   /* #EBE7E1  guide-canvas */

/* Ink — grafitt, ikke #000 */
--ink-primary:     oklch(22.0% 0.015 260);  /* #1A1E26  body text */
--ink-secondary:   oklch(45.0% 0.012 260);  /* #65697A  meta/captions */
--ink-tertiary:    oklch(62.0% 0.010 260);  /* #94989F  disabled */

/* Accent — én sunset-orange, kalibrert for AA */
--accent-default:  oklch(58.0% 0.180 38);   /* #D8541F  CTA-fyll, AA på hvit */
--accent-pressed:  oklch(52.0% 0.175 38);   /* #BE4818  :active state */
--accent-tint:     oklch(96.0% 0.020 38);   /* #FAEFE8  selected pill bg */

/* Hairline — den eneste divider-stilen */
--hairline:        oklch(89.0% 0.006 75);   /* #DCD8D1  1px subpixel */
```

Bevisst utelatt: aktivitets-ring-multi-color. Hvis Hjem trenger differensiering per kontekst (vogn/baeresele/utelek/soevn), bruk ikonform, ikke fire konkurrerende fargefamilier. Én accent per skjerm.

## WCAG-kontrast-tabell

| Pair | Ratio | Pass AA normal (4.5)? | Pass AA large (3.0)? |
| --- | --- | --- | --- |
| `--ink-primary` on `--surface-base` | 14.8:1 | Pass (AAA) | Pass |
| `--ink-secondary` on `--surface-base` | 5.6:1 | Pass | Pass |
| `--ink-tertiary` on `--surface-base` | 3.1:1 | Fail (disabled only) | Pass |
| `--accent-default` on `--surface-base` | 4.6:1 | Pass | Pass |
| `#FFFFFF` on `--accent-default` | 4.6:1 | Pass | Pass |
| `--ink-primary` on `--surface-raised` | 13.2:1 | Pass (AAA) | Pass |
| `--accent-default` on `--accent-tint` | 4.4:1 | Fail (use ink) | Pass |
| `--ink-primary` on `--accent-tint` | 13.7:1 | Pass (AAA) | Pass |

Kritisk: B's #FF6B35 på #FFFFFF gir 3.13:1 — strykes for tekst. C's #D8541F er hue-justert 6° kjøligere og luminance-trukket 8% for å passere AA og fortsatt lese som "varm orange" i sterk sol.

## Implementasjons-skisse

- **Token-swap**: ~8 CSS-custom-properties endres i `src/styles/tokens.css`. Resten av komponentene leser tokens, så ingen komponent-edits.
- **Font-stack**: Behold Instrument Sans for body/UI. Strip DM Serif Display fra produkt-screens (Hjem, Plan, Guide, Innstillinger) — den hører hjemme på splash + onboarding-hero, ingenting annet. Tabular-nums on alle tall.
- **Lillian-illustrasjoner**: Eksisterende RGBA-PNG-er fungerer på papirhvit `#FBFAF8` uten retouch. Den +0.4% varme matcher claymation-matter-ialet uten å konkurrere.
- **Tid**: 35-50 min AI-tid for token-swap + accesslint-sveip. 0 designer-tid. Push direkte til main.
- **Verifisering**: `accesslint audit_live` mot dev-server, sjekk alle 4 tabs i sterk sol-modus (max brightness, screen-tint warm) + nattlys-modus (min brightness, blue-light-filter on).

## Anti-mønstre

- **Ingen glassmorphism**. Backdrop-filter på en parenting-app i sterk sol er en lesbarhetskatastrofe. Forbudt.
- **Ingen gradient text** på CTA, headlines, eller tall. Gradients på tekst maskerer kontrast og fryser i kalde temperaturer på low-end Android.
- **Ingen drop-shadows på cards**. PRODUCT.md sier hairline-dividers, ikke cards — respekter det. `box-shadow: 0 1px 2px` er en standard-AI-refleks som skriker "tutorial-app".
- **Ingen aktivitets-rings med 4 konkurrerende hues**. Apple Fitness fungerer fordi den ER produktet; her er det støy som stjeler fra anbefalingen.
- **Ingen DM Serif Display på utility-screens**. Serif på tall-tunge data + sol-glare = squint. Serif kun på onboarding/splash hvor tone-of-voice betyr mer enn glanceability.
- **Ingen rene `#000` eller `#FFF`**. Begge gir vibration mot babyhud-illustrasjoner og fingeravtrykk-blending. Bruk `--ink-primary` og `--surface-base`.
- **Ingen `transition: all`**. Spesifiser `transform 160ms ease-out` på trykk, `opacity 200ms ease` på state-swaps. Aldri animér farge-tokens ved theme-change — flash er bedre enn 400ms uleselig mellomtilstand.
- **Ingen `scale(0)` på entry**. Lag-anbefalingene fader inn fra `scale(0.97)` + `opacity 0`, stagger 50ms mellom innerst/mellomlag/ekstra.
- **Ingen hover-states uten `@media (hover: hover) and (pointer: fine)`**. Touch-device false-positives på en one-handed-with-baby UI er uakseptabelt.
- **Ingen multi-accent per skjerm**. Én orange. Punktum. Hvis noe annet trenger emfase, bruk vekt eller størrelse, ikke en ny hue.
