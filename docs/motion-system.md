# Babyora Motion System

**Versjon:** v1 (2026-06-14)
**Eier:** alle Babyora-utviklere

Single source of truth for motion, haptikk og press-feedback. Brukes for
å unngå at hver komponent oppfinner sin egen transition og at appen
føles inkonsistent på premium-nivå.

## Tokens (i `src/index.css :root`)

### Tidsforløp og easing

| Token | Verdi | Bruk |
|---|---|---|
| `--ease` | `cubic-bezier(0.23, 1, 0.32, 1)` | Standard ease-out-quart. Default for alt. |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | iOS drawer/sheet open/close. |
| `--dur-press` | `140ms` | Generisk button press. |
| `--dur-state` | `200ms` | State change (active/hover). |
| `--dur-enter` | `280ms` | Enter-transition (mount, sheet-up). |
| `--dur-blur-bridge` | `220ms` | Avatar tier-bytte cross-fade. |
| `--dur-tap` | `100ms` | Tap-target scale-tilbake. |

### Spring (JS-konsumert, dokumentert som token for sporbarhet)

| Token | stiffness / damping | Bruk |
|---|---|---|
| `--spring-soft` | 320 / 32 | Tier-bytte default. |
| `--spring-bounce` | 280 / 18 | Playful toggle (sjelden). |
| `--spring-snap` | 400 / 28 | Snap-til-pose (thermometer, slider). |

### Visuelle

| Token | Verdi | Bruk |
|---|---|---|
| `--blur-bridge` | `8px` | Blur-radius for tier-cross-fade. |
| `--tap-scale` | `0.97` | Scale på `:active`. |

## Helpers

### `<TapTarget>` ([src/components/TapTarget.tsx](../src/components/TapTarget.tsx))

Wrapper rundt native `<button>`. Bevarer ARIA, type, form, disabled.

```tsx
<TapTarget haptic="light" onPress={handle} aria-label="Klikk">
  Klikk
</TapTarget>
```

`haptic` policy:
- `selection` — valg endres (radio, toggle, fane)
- `light` — standard tap (kort, rad). **Default**.
- `medium` — primær CTA (Prøv gratis, Fortsett, Sett i gang)
- `heavy` — destruktiv bekreftelse
- `none` — fortsatt visuell tap-scale, ingen haptikk

### `<AvatarTransition>` ([src/components/AvatarTransition.tsx](../src/components/AvatarTransition.tsx))

Wrapper rundt `<img>` for tier-avatar PNG. Ved src-bytte: blur 8px +
scale 0.96 i 220ms, swap, unblur. Respekterer `prefers-reduced-motion`
og `prefers-contrast: more` (skipper blur).

```tsx
<AvatarTransition src={avatarPng(tier, headwear)} alt="" width={88} height={108} />
```

### `useCountUp` ([src/hooks/useCountUp.ts](../src/hooks/useCountUp.ts))

```tsx
const tempDisplay = useCountUp(Math.round(weatherInput.tempC));
```

Interpolere tall-verdi over 200ms ease-out-quart. Returnerer instant ved
`prefers-reduced-motion`.

### `useHaptics` ([src/hooks/useHaptics.ts](../src/hooks/useHaptics.ts))

Capacitor Haptics-wrapper. `<TapTarget>` bruker den internt — men ved
direkte behov:

```tsx
const haptics = useHaptics();
void haptics.impact('medium');
void haptics.selection();
```

Silent fail på web/uten permission.

## A11y-regler (mandatory)

- **Haptikk er ALDRI eneste signal** — visuell feedback må alltid være
  primær. Doc i `useHaptics.ts`.
- **prefers-reduced-motion: reduce** — alle transitions skrus av eller
  snappes til target.
- **prefers-contrast: more** — `<AvatarTransition>` skipper blur.
- **focus-visible** urørt — bruker `--focus`-token (`oklch(58% 0.135 40)`).
- **aria-pressed, aria-current, aria-disabled** passerer urørt gjennom
  `<TapTarget>` via spread.

## Anti-mønstre

- ❌ Animer aldri `width`, `height`, `padding`, `margin`, `top/left/etc`.
  Kun `transform` + `opacity` + `filter`.
- ❌ Aldri `scale(0)` på enter. Start fra `scale(0.95)`.
- ❌ Aldri `ease-in` på enter-transitions. Bruk `ease-out`-familien.
- ❌ Aldri haptikk i hot-loops (scroll-handlers).
- ❌ Aldri wrappe `<div>` i `<TapTarget>` (forbudt). Bruk `<button>`.
- ❌ Aldri `aria-live` på `useCountUp`-verdi — 200ms-frame-spam er støy.

## Roadmap

Foundation + Apply (Fase 1-2): ferdig 2026-06-14.

Fremtidige polish-runder:
- Spring-fysikk på toggle-thumbs (MinGarderobe)
- Stagger-reveal i grids og lister (Plaggbiblioteket, GuideHub)
- Termometer-skala reused på TOG-guiden
- Per-skjerm motion-orkestrering (Plan, Outfit, GarmentDetail)
