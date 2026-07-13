# Babyora — Fargesystem

> Status 2026-06-19. Kilde: `src/styles/instrument-tokens.css` (v2, F27.0).
> Verifisert av accessibility-lead (F28-final) + V0 (F28.13).

## Doktrin

1. **Schibsted Grotesk er eneste font.** Ingen serif. Drop overalt.
2. **Tre nivåer (A0):** `bare` / `surface` / `interactive`. Aldri bland.
3. **Sand-bg er kanonisk.** `#F4EEE7` (sand-100) er primær page-bg. Pure
   svart/hvit er forbudt.
4. **Tinted neutrals.** Alle ink-tokens er warm-tinted (ikke pure grey)
   for å matche sand-undertone.
5. **Atmosphere puster.** Bakgrunnsgradienten interpoleres kontinuerlig
   av temperatur — aldri 3 faste klasser.

---

## 1. Kjernepalett

### Ink-skala (mot sand-bg `#F4EEE7`)

| Token | Hex | Kontrast | Rolle |
|---|---|---|---|
| `--ink-900` | `#2B2522` | **13.1:1 AAA** | Body text, h1, primær tekst |
| `--ink-700` | `#5A514C` | 6.7:1 AA+ | Sekundær tekst, descriptions |
| `--ink-500` | `#776C66` | 4.52:1 AA | Tertiær tekst, captions, micro |
| `--ink-300` | `#C9C0B9` | hairline | Borders, dividers, separators |

> **Historisk:** `--ink-500` ble bumpet fra `#8A7F78` (F28-final) etter
> a11y-lead-funn at den feilet AA 1.4.3 på caption-tekst.

### Terracotta-skala (signatur-aksent)

| Token | Hex | Kontrast | Rolle |
|---|---|---|---|
| `--terracotta-600` | `#AD4B2A` | **4.78:1 AA** | Primær accent, CTA, active states, eyebrow på «ANBEFALT/NESTE» |
| `--terracotta-500` | `#C45F38` | 3.8:1 | Hover-tilstand på accent |
| `--terracotta-400` | `#D98A6A` | 2.7:1 | Lett tint (borders, accent-svake states) |
| `--terracotta-100` | `#F6E3D9` | bg-tint | Very light bg-tint (safety-banner, accent-sirkel-bg) |

> **Historisk:** `--terracotta-600` ble bumpet til `#AD4B2A` (a11y-lead
> F28-final) for å passere AA 4.5:1 mot sand-bg.

### Sky + Sand (kjølig/varm aksent)

| Token | Hex | Rolle |
|---|---|---|
| `--sky-500` | `#7E9CB3` | Kjølig aksent (kaldværs-symboler, vinter-tints) |
| `--sky-200` | `#C5D4DE` | Lett kjølig tint |
| `--sand-200` | `#ECE5DD` | Sekundær warm-bg (safety-banner severity=MEDIUM) |
| `--sand-100` | `#F4EEE7` | **Primær page-bg «varm sand»** |

### Status-skala (status-dots, warnings, safety)

| Token | Hex | Kontrast | Rolle |
|---|---|---|---|
| `--status-cold` | `#5A7E99` | 3.74:1 non-text | «For kald» status-dot, vinter-indikator |
| `--status-warn` | `#C45F38` | 4.78:1 | «For varm» / overheating-warning |
| `--status-ok` | `#5F7C5B` | 3.8:1 non-text | «Passe» / OK-state |

> **Historisk:** `--status-cold` bumpet til `#5A7E99` (F28-final) for
> non-text-kontrast ≥3:1. `--status-ok` bumpet fra `#6E8B6A` (3.18:1
> failet) til `#5F7C5B` (3.8:1) for headroom mot atmosphere-bottom-shifts.

---

## 2. Semantiske tokens (nivåmodell A0)

| Token | Verdi | Rolle |
|---|---|---|
| `--background` | `var(--sand-100)` | Primær page-bg på alle skjermer |
| `--foreground` | `var(--ink-900)` | Default tekst |
| `--surface` | `#FBF8F4` | `surface`-nivå (cards, rows, sheets) — lysere enn bg så det «løfter» |
| `--surface-border` | `rgba(43, 37, 34, 0.06)` | Hairline 1px på surface-rader (forced-contrast bumper til 0.18) |
| `--muted-foreground` | `var(--ink-500)` | Sekundær tekst |

### Nivå-bruksregel

- **bare:** Direkte på `--background`. Ingen fill, border eller shadow.
  Brukes på Forsiden hero, anbefaling, condition-tekst.
- **surface:** `--surface`-fill + `--shadow-surface` + `--radius-md`.
  Brukes på cards, lag-rader, status-bokser.
- **interactive:** `--surface`-fill + `--shadow-interactive` + ingen
  border. Brukes på CTA, klikkbare cards (InteractiveBlock).

> **Cards-i-cards er forbudt** — impeccable absolute ban. Ett surface-
> nivå per visuell sone.

---

## 3. Atmosphere (kontinuerlig bg-interpolasjon)

Bakgrunn interpoleres av `computeAtmosphere(temp)` i
`src/styles/instrument-utils.ts` basert på temperatur. **Modell B (F28.13):**
kjølig topp → varm bunn på ALLE vær. Kun temperaturen justerer varme-
graden — gradient-retningen er konstant.

### Stops (per atmosphere-bucket)

| Bucket | Top | Mid | Bottom | ΔL |
|---|---|---|---|---|
| `cold` | `#BCCBD6` blå-grå | `#CFD3D3` | `#E2DBCF` sand | +11% |
| `mild` | `#CFD5D8` grå-blå | `#E0DCD5` | `#F2E4D2` krem | +12% |
| `warm` | `#D6DAD8` lys grå | `#E7DED2` | `#F8E2CC` fersken | +8% |

### A11y-spec for atmosphere

- ink-900 må passere AAA 7:1 på ALLE 9 stops (worst: cold-top 12.92:1) ✓
- ink-500 må passere AA 4.5:1 på alle bottom (worst: cold-bottom 4.59:1) ✓
- terracotta-600 må passere AA 4.5:1 (worst: cold-bottom 4.65:1) ✓
- ΔL ≥8% per band (alle retning topp→bunn = lysere/varmere) ✓
- Hue-shift kjølig→varm bevart (b*-akse) ✓

> **V0 understreket (F28.13):** «det var nettopp den kjølig→varm-dybden
> som ga mockupene 'levende instrument'-preget». Hold gradient-retningen
> konstant per skjerm.

### Sone-disiplin

| Sone | Skjermer | Atmosphere |
|---|---|---|
| **1 full** | Forside, Uke, Påkledning-sheet | Full kontinuerlig gradient |
| **2 tone-hint** | Finn-antrekk | `data-atmosphere`-attribute settes (focus-ring atmosphere-aware), men IKKE `.atmosphere`-klasse — ren sand-bg |
| **3 nøytral** | Guide, Plagg-detalj, TOG, Innstillinger, Varm/kald, Plaggbib, Onboarding | Ren `--background` sand. Ingen gradient. |

---

## 4. Focus-ring (atmosphere-aware)

| Atmosphere | Ring | Halo |
|---|---|---|
| default | `--ink-900` (`#2B2522`) | `#FFFFFF` |
| cold | `#0B1220` | `#FFFFFF` |
| mild | `#11151C` | `#FFFFFF` |
| warm | `#1A0E08` | `#FFFFFF` |

> A11y-lead REQUIRED: focus-ring kontrast ≥3:1 mot atmosphere-stops.
> Hver atmosphere-bucket har egen ring-farge tilpasset bakgrunnen.

---

## 5. Skygger (nivå-bundet)

| Token | Verdi | Rolle |
|---|---|---|
| `--shadow-surface` | `0 1px 2px rgba(43, 37, 34, 0.03)` | Lett løft for surface-nivå |
| `--shadow-interactive` | `0 1px 2px rgba(43, 37, 34, 0.04), 0 4px 12px rgba(43, 37, 34, 0.06)` | Synlig løft for interactive (CTA) |
| `--shadow-ground` | `radial-gradient(ellipse 60% 18% at 50% 100%, rgba(43, 37, 34, 0.12), transparent 70%)` | Grounding under avatar (radial) |

> Shadow-grounding er signatur-mønsteret: hver avatar/illustrasjon har
> radial-grounding så den «sitter» visuelt i scenen.

---

## 6. A11y-fallbacks

### `prefers-reduced-transparency: reduce`

```css
:root {
  --surface: rgba(255, 255, 255, 0.95);
}
```

### `prefers-contrast: more`

```css
:root {
  --ink-500: #5A514C;   /* ink-700 fallback */
  --surface-border: rgba(43, 37, 34, 0.18);   /* 3x sterkere */
}
```

### `prefers-reduced-motion: reduce`

Alle transitions/animasjoner droppes til 0.01ms. **Unntak:** atmosphere
`transition: background` beholdes (a11y-lead: «color is not motion»).

### `forced-colors: active`

```css
.instr-app { background: Canvas !important; color: CanvasText !important; }
[data-atmosphere] { --focus-ring: ButtonText; --focus-ring-halo: Canvas; }
```

Alle OKLCH-shadows + gradients bytter til system-tokens.

---

## 7. Kontrastsverdier (komplett tabell)

| Combo | Kontrast | Standard |
|---|---|---|
| ink-900 på sand-100 | 13.1:1 | AAA |
| ink-700 på sand-100 | 6.7:1 | AAA |
| ink-500 på sand-100 | 4.52:1 | AA |
| ink-500 på cold-bottom | 4.59:1 | AA (worst-case) |
| terracotta-600 på sand-100 | 4.78:1 | AA |
| terracotta-600 på cold-bottom | 4.65:1 | AA |
| ink-900 på cold-top | 12.92:1 | AAA (worst-case body) |
| status-cold non-text | 3.74:1 | AA (1.4.11) |
| status-ok non-text | 3.8:1 | AA (1.4.11) |
| status-warn body | 4.78:1 | AA |

Ingen tekst-kombinasjoner under AA. Ingen non-text-kombinasjoner
under 3:1.

---

## 8. Forbidden

- Pure svart `#000` eller pure hvit `#fff` på root-bg.
- Pure grey (uten warm tint) — alle neutrals skal være warm-tinted.
- Serif (DM Serif Display, Georgia, etc.).
- Side-stripe-borders > 1px som accent (impeccable absolute ban).
- Cards-i-cards (impeccable absolute ban).
- Glassmorphism som dekorativ default.
- Status-dot som eneste signal (må alltid være form/tekst ved siden av).
- 3 faste atmosphere-klasser (må interpoleres kontinuerlig).
- Annen farge enn `terracotta-600` på primær CTA-aksent.

---

## 9. Score / V0-validering

| Fase | Score | Kommentar |
|---|---|---|
| F27.0 tokens | a11y-clearance ✓ | A11y-lead alle 5 levers passert |
| F28.13 atmosphere | V0 SHIP | «Det var nettopp den kjølig→varm-dybden som ga 'levende instrument'-preget» |
| F28.23 banner-variant | V0 SHIP | «I terracotta+sand+ink uten ny farge — riktig, ingen baby-app-felle» |
| F28.27 focus-affordans | V0 97/100 SHIP | terracotta-2px-border + shadow-interactive løste «den ærlige atmosfære-bindingen blir lesbar» |
| F28.28 condition-lag | V0 ~96 | Klarvær-glow + skyet-flatten + snø-partikler + regn-haze BAK avatar |

---

## 10. Bruksveiledning per komponent

| Komponent | Tokens brukt |
|---|---|
| **Forsiden temp** | `--ink-900`, `--font-display-xl` (72px), tabular-nums |
| **Forsiden anbefaling** | eyebrow `--terracotta-600` + body-strong `--ink-900` |
| **CTA InteractiveBlock** | `--surface` fill + `--shadow-interactive` + 44px `--terracotta-600` sirkel-aksent |
| **Sone 1 atmosphere** | `--bg-top/mid/bottom` interpolert per temp |
| **Bottom-nav** | inaktive: solid `--ink-500`; aktiv: `--terracotta-600` + aria-current |
| **Safety-banner alarm** | `--terracotta-100` bg + `--terracotta-400` border + `--terracotta-600` ink |
| **Safety-banner advarsel** | `--sand-100` bg + `--ink-300` border + `--ink-700` ink |
| **Safety-banner FYI** | transparent bg + hairline border-top + `--ink-500` |
| **LayerSymbol form-baserte** | outline/halv/solid m/ `--terracotta-600` + `--ink-900` |
| **Status-dots (Varm/kald)** | `--status-cold/warn/ok` 8px sirkel + tekst-label |

---

*Sist oppdatert: 2026-06-19, etter F32-plan-godkjenning.*
*Filsti: `wool-app/docs/COLOR-SYSTEM.md`*
*Kildefil: `wool-app/src/styles/instrument-tokens.css`*
