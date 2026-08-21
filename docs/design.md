---
version: 0.1.0
name: Snudly Ro
description: A calm Nordic care system that preserves Snudly's result-first mobile layout while making every decision faster to scan and easier to trust.

colors:
  canvas: "#EEF6F2"
  surface: "#FFFDF8"
  surface-subtle: "#DCEDE7"
  primary: "#165B4C"
  on-primary: "#FFFFFF"
  accent: "#A64724"
  accent-pressed: "#863A20"
  accent-soft: "#F6E1D5"
  on-accent: "#FFFFFF"
  on-surface: "#15251F"
  on-surface-muted: "#596B64"
  border: "#CCDAD4"
  focus: "#005FCC"
  success: "#2F6B45"
  warning: "#8C5A00"
  warning-surface: "#FFF1D2"
  error: "#B43A2A"
  info: "#2F668C"
  disabled-surface: "#D9E1DC"
  disabled-ink: "#56665F"
  shadow: "#274138"
  dark-canvas: "#0C1B16"
  dark-surface: "#142820"
  dark-surface-subtle: "#1B332A"
  dark-primary: "#A7D7C2"
  dark-on-primary: "#0C1B16"
  dark-accent: "#E89B74"
  dark-accent-pressed: "#F0AE8B"
  dark-accent-soft: "#3B291F"
  dark-on-accent: "#2C160C"
  dark-on-surface: "#F4EFE4"
  dark-on-surface-muted: "#B8C6BE"
  dark-border: "#355047"
  dark-focus: "#FFD166"
  dark-success: "#9DBF9A"
  dark-warning: "#E0B45C"
  dark-warning-surface: "#3A2D12"
  dark-error: "#E58A72"
  dark-info: "#8FB9D1"
  dark-disabled-surface: "#243A32"
  dark-disabled-ink: "#A8B8B0"
  dark-shadow: "#000000"

typography:
  wordmark:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.24em
  display:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 36px
    fontWeight: 720
    lineHeight: 0.98
    letterSpacing: -0.04em
  h1:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.035em
  h2:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.025em
  h3:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 18px
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: -0.01em
  body:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 16px
    fontWeight: 450
    lineHeight: 1.5
  body-strong:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 16px
    fontWeight: 650
    lineHeight: 1.4
  label:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 650
    lineHeight: 1.3
  caption:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
  data-large:
    fontFamily: "'Schibsted Grotesk', 'Schibsted Grotesk Fallback', Arial, sans-serif"
    fontSize: 52px
    fontWeight: 680
    lineHeight: 0.92
    letterSpacing: -0.06em
  profile-display:
    fontFamily: "'Fraunces', 'Fraunces Fallback', Georgia, serif"
    fontSize: 38px
    fontWeight: 550
    lineHeight: 1
    letterSpacing: -0.025em

rounded:
  none: 0px
  small: 8px
  control: 12px
  card: 18px
  panel: 20px
  navigation: 28px
  pill: 999px

spacing:
  micro: 2px
  xsmall: 4px
  small: 8px
  medium: 12px
  large: 16px
  gutter: 18px
  xlarge: 20px
  xxlarge: 24px
  section: 32px
  spacious: 40px
  screen: 48px

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.xlarge}"
    height: 52px
  button-primary-pressed:
    backgroundColor: "{colors.accent-pressed}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.xlarge}"
    height: 52px
  button-primary-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.xlarge}"
    height: 52px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.xlarge}"
    height: 52px
  weather-panel:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "{spacing.large}"
  content-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "{spacing.large}"
  garment-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "{spacing.medium} {spacing.large}"
    height: 68px
  choice-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "{spacing.small} {spacing.medium}"
    height: 44px
  choice-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "{spacing.small} {spacing.medium}"
    height: 44px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.large}"
    height: 52px
  safety-notice:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.medium} {spacing.large}"
  bottom-navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.navigation}"
    padding: "{spacing.small}"
    height: 64px
  bottom-navigation-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.caption}"
    rounded: "{rounded.card}"
    padding: "{spacing.small} {spacing.medium}"
    height: 52px
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "{spacing.xlarge}"
  recovery-state:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "{spacing.large}"
---

# Snudly Ro Design System

## Overview

Snudly Ro is a provisional v0.1 system for first-time Scandinavian dads making a quick clothing decision with one hand and limited attention. It preserves the owner-supplied live deployment's result-first layout, information order, 18 px mobile gutter, large working surfaces, and four-slot navigation by owner decision on 2026-08-19 and 2026-08-22. The reference was visually audited at `https://snudly.vercel.app/` on 2026-08-22 and recorded in `docs/evidence/live-layout-audit.md`. The local source currently contains a three-root-tab variant; that information-architecture difference is not silently resolved by this visual system and must be confirmed before implementation. The intended feeling is calm, warm, direct, and competent: an everyday decision aid, not a medical instrument and not generic pastel baby branding. The first visual priority is always the complete outfit answer and its short reason. TASK-006 target-dad testing is still deferred, so this system is explicitly reversible rather than a final brand lock.

Evidence-locked for v0.1:

- Keep the result before explanation, the observed information order, 18 px mobile gutter, one dominant region, and 44 px minimum controls.
- Keep the complete canonical outfit in dressing order; imagery supports the answer but never replaces its text.
- Keep safety, weather age, stale data, offline state, and recovery actions explicit in words.

Open until TASK-006 and implementation review:

- Palette values, font personality, serif use, radii, elevation, and illustration style may change while semantic contrast roles remain.
- Component density and motion timing may change after target-dad observation; reading order and reduced-motion behavior may not.
- The live deployment has four navigation slots while local source has three root tabs. Confirm the destination model with the owner before changing navigation code; do not infer it from this styling reference.

## Colors

The light theme uses a pale Nordic green canvas and warm-white paper surfaces, keeping the result readable outdoors without becoming clinical white. Deep evergreen carries navigation, selection, and brand continuity; terracotta is reserved for genuine actions and time-sensitive changes, so it cannot become decorative confetti. Dark mode is a complete companion palette, not a mechanical inversion: its green-black room and warm cream text preserve the same material character. Semantic colors always appear with text or an icon, never as the only signal. All defined normal-text foreground/background pairs target WCAG AA or better; focus uses blue on light surfaces and amber on dark surfaces to remain visibly separate from actions.

## Typography

Schibsted Grotesk carries every decision, action, garment, and explanation because its open forms remain clear at small mobile sizes. Display sizes are compact and slightly tightened, matching the current layout without forcing headings onto extra lines. Fraunces has exactly one domain: names and human family moments such as the active child profile; it must not style weather, safety, prices, actions, or garment instructions. `data-large` is reserved for the current temperature or one equivalent primary measurement. Dynamic Type may increase vertical space and collapse multi-column arrangements, but it may never clip the ordered answer or primary action.

## Layout

The production base remains the current 390 px mobile composition: 18 px side gutters, safe-area-aware top spacing, one dominant region per screen, and a floating four-item bottom navigation. The spacing scale follows the app's observed 2-pixel rhythm while naming only useful steps; `gutter` is intentionally 18 px because changing it would change today's layout. Home keeps weather context above the numbered outfit, Planlegg keeps the change decision above the forecast curve, and tool/family screens keep a single lead card before supporting rows. At 320 px, content stacks and text wraps; no horizontal scrolling is allowed in the core flow.

## Elevation & Depth

Depth comes from warm low-opacity shadows plus a visible border, not glass panels or dramatic floating layers. `content-card`, `weather-panel`, the navigation, and `bottom-sheet` may use one low elevation; modal sheets may use one medium elevation and a scrim. Garment rows are grouped by their parent surface and separated with hairlines rather than receiving individual shadows. Dark mode reduces shadow reliance and increases border contrast. Elevation never changes the authority of safety content or makes a secondary card compete with the outfit.

## Shapes

Shape language is mixed but disciplined. Inputs and buttons use the 12 px control radius, cards use 18 px, major weather/sheet panels use 20 px, and the floating navigation uses 28 px. Pills are reserved for compact choices, filters, and status—not long prose or every label. Rows inside a shared card remain square where they meet so the ordered list reads as one object. The system avoids both sharp technical instrument panels and excessively bubbly baby-app chrome.

## Components

`button-primary` is the single emphasized action per screen; pressed and disabled states use explicit colors rather than opacity, and loading retains focus with `aria-busy`. `weather-panel` provides context without becoming a dashboard, while `content-card` groups one decision or task. `garment-row` preserves canonical dressing order with a number, image fallback, garment name, role, and disclosure affordance; canonical text stays authoritative over imagery. `choice-chip`, `input`, `safety-notice`, `bottom-navigation`, and `bottom-sheet` all keep a minimum 44×44 px interactive target and visible focus. `recovery-state` distinguishes stale, offline, and failed data in text, preserves safe inputs, and provides one clear retry or fallback action; it must never present a partial outfit as complete. Motion connects Home to the outfit in 360–560 ms, never changes reading order, and resolves immediately to the final state under reduced motion.

## Do's and Don'ts

**Do:** keep the answer before explanation; preserve today's four-tab layout; use one emphasized action; show weather age, reason, and safety boundary in text; let imagery support canonical garment names; allow layout to grow vertically with larger text.

**Don't:** turn Home into a weather dashboard; use cuteness as evidence; spread terracotta across decoration; place serif on instructions or safety; create a card for every line; use color, opacity, animation, or a baby character as the only carrier of meaning.
