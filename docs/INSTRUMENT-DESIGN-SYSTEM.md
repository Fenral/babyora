# Babyora Instrument Design System

Port av Claude Design's `CLAUDE.md` (2026-06-18). Dette er den persisterende
design-doktrinen for HELE wool-app. Følges på hver skjerm.

## Core concept
Babyora er **IKKE en weather-app**. Den er **et instrument som oversetter
vær til handling** (hva babyen skal ha på seg).

Føler: **calm, intelligent, trustworthy, effortless**. Aldri playful.
Aldri loud.

## Visual philosophy
UI-en føler seg som **"air + light + surface"** — én kontinuerlig
materiale.

**Unngå:** flate gradienter, cards, komponent-stil.
**Bruk:** soft surfaces, subtle elevation, samme materiale på tvers.

## Background system
- **Ingen synlig horisont-linje**
- Soft transisjon: kjølig topp → varm bunn
- Liten horisontal retning i gradienten
- Subtil atmospheric depth
- Bakgrunnen suggererer plass, viser ikke design

## Avatar role
**Avatar er ikke dekorasjon.** Den representerer hvordan været føles
og hvordan babyen påvirkes.

- **Alltid** sentrert
- **Alltid** grounded (aldri flytende)
- **Alltid** integrert med bakgrunnen

## Layout & hierarchy (ALDRI bryt)
1. **Temperatur** (primær, alltid dominant)
2. **Context** (vær-condition)
3. **Avatar** (interpretation)
4. **Action** (CTA)
5. **Navigation** (ambient)

## CTA philosophy
**Ikke en knapp** — det naturlige neste steget, del av flyten.

- Soft, low contrast, slightly elevated
- Aldri aggressiv

## Navigation philosophy
**Ambient.** Ingen synlig bar, low-contrast monochrome ikoner, minimal
active state (opacity/stroke, ikke farge).

Må ikke konkurrere med CTA. Brukeren skal ikke legge merke til navigasjonen,
men alltid finne den.

## Components
**Unngå:** cards, sterke borders, tunge skygger.
**Bruk:** soft surfaces, subtle elevation, **samme materiale** delt på
tvers av elementer.

## Typography
Clean, readable, calm. Ingen dekorative fonter. Tight spacing control.

**Temperatur må alltid være dominant.**

Aktuell font: **Schibsted Grotesk** (Google Fonts).

```css
font-family: 'Schibsted Grotesk', -apple-system, system-ui, sans-serif;
```

## Interaction feel
- Slow, smooth transitions (**300-500ms ease-out**)
- Ingen aggressiv motion
- Ingen bounce
- Temperatur-basert tone-shift: kaldere → kjølig tint, varmere → terracotta tint

## Content philosophy
**Ikke vis lister.** Strukturér informasjon istedenfor.

## Palette
| Token | Hex | Bruk |
|-------|-----|------|
| Sky base | `#C3D6E3` | Bakgrunns-topp (kald) |
| Warm surface | `#E8E1D8` | Bakgrunns-bunn (varm) |
| Accent terracotta | `#C0632F` | CTA-element, dot-indikatorer, hint |
| Ink | `#2B2B2B` | Primær tekst |
| Ink-soft | `rgba(43,43,43,.72)` | Subtitle |
| Ink-mute | `rgba(43,43,43,.5)` | Caption |
| Ink-faint | `rgba(43,43,43,.4)` | Disabled / eyebrows |

## Dynamic gradient (temperatur-respons)
```ts
// warmth 0..1 baseret på temp
const w = clamp((temp + 12) / 30, 0, 1);

// background
const topCold = [188,211,228], topWarm = [206,205,199];
const top = mix(topCold, topWarm, w);
const botCold = [228,227,223], botWarm = [233,223,211];
const bot = mix(botCold, botWarm, w);

// tint
const tint = w < 0.5
  ? `rgba(96,140,184, ${(0.10*(1-w*2)).toFixed(3)})`   // cool
  : `rgba(192,99,47, ${(0.09*((w-0.5)*2)).toFixed(3)})`; // warm
```

## Canonical reference
**`Forside – Instrument · Lys.dc.html`** er referanse-implementasjonen.
Portet til `public/redesign-mocks/v20.html`.

## Implementerings-skjermer
1. **HomeScreen** ← Forside-Instrument
2. **GuideHubScreen** ← Guide.dc.html
3. **PlanScreen** ← Uke.dc.html
4. **LayerDetailSheet** ← Påkledning.dc.html
5. Resten i samme DNA: PlaggbibliotekScreen, MinGarderobeScreen,
   TogGuideScreen, VarmEllerKaldScreen, SettingsScreen, OnboardingScreen,
   GuideScreen, GarmentDetailScreen

## A11y-grunnlag (følges alltid):
- `<html lang="nb">`, beskrivende `<title>`, skip-link
- `prefers-reduced-motion`: drop alle animasjoner
- `prefers-reduced-transparency`: bytt glass til opaque `rgba(255,255,255,.92)`
- `forced-colors: active`: Canvas/CanvasText/Highlight + border ButtonBorder
- `prefers-contrast: more`: bumpe ink-soft fra .72 → .85
- Glass-pille har 1px solid rgba(0,0,0,.18) border for WCAG 1.4.11
- Negative temp: `sr-only` "Minus X grader Celsius" + `aria-hidden` på visuell −X°
- Decorative animations: `aria-hidden="true"`
- Native `<dialog>` for sheets med showModal() + focus-management
- aria-live="polite" for state-bytte (vogn-toggle)

## Motion-system
- **Entry stagger:** rise 600ms cubic-bezier(0.16, 1, 0.3, 1)
- **Press-feedback:** scale(0.965) 450ms cubic-bezier(.22,1,.36,1)
- **Breath:** 6.5s ±5px translateY
- **Sway:** variabel basert på vind (4-8s) ±0.7deg rotate
- **Shadow-puls:** 6.5s ease-in-out scaleX + opacity
- **CTA-glow:** 3.4s ease-in-out box-shadow puls
- **Snow-drift:** 11-19s linear infinite (kun ved snø/temp ≤ -2)
