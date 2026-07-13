# Babyora Instrument-redesign — Atomic Master Checklist

Etablert: 2026-06-18
Eier: Claude Code (Sivert sover)

## Verifisering-protokoll
Hver task:
1. **Plan-add** → linje i denne fila
2. **Implement** → kode/edit
3. **Self-verify** → Claude leser igjen + bekrefter
4. **Cross-verify** → Copilot leser via Playwright + bekrefter
5. **Sjekk ✅** kun når BEGGE verifiserer

Status-koder:
- ⬜ Ikke startet
- 🟡 I gang
- ✅ Ferdig + self-verified
- 🔵 Cross-verified av Copilot
- ❌ Blokkert / må re-iter

---

## Fase 0 — Foundation docs
- [✅] 0.1 Opprett `wool-app/docs/atomic-master.md` (denne fila)
- [⬜] 0.2 Port CLAUDE.md → `wool-app/docs/INSTRUMENT-DESIGN-SYSTEM.md`
- [⬜] 0.3 Commit + push (markering: «F26 fase 0 — foundation docs»)

## Fase 1 — Design-system foundation
- [⬜] 1.1 `src/styles/instrument-tokens.css` — palette (sky #C3D6E3, warm #E8E1D8, accent #C0632F, ink #2B2B2B), spacing, radii, shadows, motion-curves
- [⬜] 1.2 `src/index.css` — Schibsted Grotesk import (Google Fonts) + globale glass-utils
- [⬜] 1.3 `src/styles/instrument-utils.ts` — `instrumentWarmthFromTemp(t, vogn)` (port fra v20.html)
- [⬜] 1.4 Globale CSS-vars (`--bg-gradient`, `--tint-cool/warm`, `--glow`, `--ground`, `--drop-shadow`)
- [⬜] 1.5 `.glass-pill` shared CSS class med 1.4.11-border + reduced-transparency fallback + forced-colors
- [⬜] 1.6 `npm run build` grønt
- [⬜] 1.7 `npm test` grønt
- [⬜] 1.8 Commit + push (markering: «F26 fase 1 — foundation»)

## Fase 2 — HomeScreen Instrument
- [⬜] 2.1 `src/components/WeatherHero.tsx` (NY) — topbar + 112px temp + chips
- [⬜] 2.2 `src/components/AvatarScene.tsx` (NY) — port av v20 scene-logikk (breath, sway, posture, glow, ground, contact-shadow)
- [⬜] 2.3 `src/components/VognSegmented.tsx` (NY) — pille m/ dot-indikator + aria-live
- [⬜] 2.4 `src/components/CTA.tsx` (NY) — NESTE / Se påkledning + accent-sirkel + glow-puls
- [⬜] 2.5 `src/components/BottomNav.tsx` (rewrite) — ambient nav (Hjem/Uke/Guide/Innst)
- [⬜] 2.6 `src/screens/HomeScreen.tsx` (rewrite) — bruk eksisterende useWeather + recommend() + tierFromRecommendation
- [⬜] 2.7 A11y-lead verify
- [⬜] 2.8 `npm run build` grønt
- [⬜] 2.9 `npm test` grønt
- [⬜] 2.10 Commit + push (markering: «F26 fase 2 — HomeScreen»)
- [⬜] 2.11 emil-design-eng score ≥ 90
- [⬜] 2.12 impeccable score ≥ 90

## Fase 3 — GuideHubScreen (Guide.dc.html)
- [⬜] 3.1 `src/screens/GuideHubScreen.tsx` (rewrite)
- [⬜] 3.2 Header "Guide" + subtitle
- [⬜] 3.3 Primary card "Finn antrekk" m/ 46×46 accent-firkant + chevron-arrow
- [⬜] 3.4 Verktøy-seksjon (Plaggbiblioteket + Min garderobe)
- [⬜] 3.5 Kunnskap-seksjon (TOG-guiden + Varm/kald)
- [⬜] 3.6 Footer-disclaimer
- [⬜] 3.7 A11y-lead verify
- [⬜] 3.8 Build + test + commit + push
- [⬜] 3.9 emil + impeccable ≥ 90

## Fase 4 — LayerDetailSheet (Påkledning.dc.html)
- [⬜] 4.1 `src/components/LayerDetailSheet.tsx` (rewrite)
- [⬜] 4.2 Topbar (back + location)
- [⬜] 4.3 Header: PÅKLEDNING eyebrow + "Slik kler du {name}" + context
- [⬜] 4.4 Mini-avatar 104×104 m/ glow + ground + float-anim
- [⬜] 4.5 Vertikal spine (gradient linje)
- [⬜] 4.6 Lag-rader (Ytterlag/Mellom/Innerst/Tilbehør/Sovepose)
- [⬜] 4.7 "Klar for tur" pille-CTA m/ arrow
- [⬜] 4.8 Bottom-nav
- [⬜] 4.9 A11y-lead verify
- [⬜] 4.10 Build + test + commit + push
- [⬜] 4.11 emil + impeccable ≥ 90

## Fase 5 — PlanScreen (Uke.dc.html)
- [⬜] 5.1 `src/screens/PlanScreen.tsx` (rewrite)
- [⬜] 5.2 Topbar (location-pille + notif-bell)
- [⬜] 5.3 Tab-toggle (I dag / 10 dager)
- [⬜] 5.4 Tittel + klokkeslett-stepper (− + buttons)
- [⬜] 5.5 Lag-legend (2 lett / 3 middels / 4 mye)
- [⬜] 5.6 Liste-rader m/ glass-bg, vær-ikoner, lag-badge
- [⬜] 5.7 A11y-lead verify
- [⬜] 5.8 Build + test + commit + push
- [⬜] 5.9 emil + impeccable ≥ 90

## Fase 6 — Resterende skjermer
- [⬜] 6.1 `src/screens/PlaggbibliotekScreen.tsx` (re-style)
- [⬜] 6.2 `src/screens/MinGarderobeScreen.tsx` (re-style)
- [⬜] 6.3 `src/screens/TogGuideScreen.tsx` (re-style)
- [⬜] 6.4 `src/screens/GarmentDetailScreen.tsx` (re-style)
- [⬜] 6.5 `src/screens/VarmEllerKaldScreen.tsx` (re-style) — alltid gratis
- [⬜] 6.6 `src/screens/SettingsScreen.tsx` (re-style)
- [⬜] 6.7 `src/screens/OnboardingScreen.tsx` (re-style)
- [⬜] 6.8 `src/screens/GuideScreen.tsx` (re-style)
- [⬜] 6.9 A11y-lead verify per skjerm
- [⬜] 6.10 Build + test + commit + push
- [⬜] 6.11 emil + impeccable ≥ 90 per skjerm

## Fase 7 — emil + impeccable iter-loop til 90+
- [⬜] 7.1 Kjør emil-design-eng mot hver live-URL etter Fase 2-6
- [⬜] 7.2 Kjør impeccable critique mot hver live-URL etter Fase 2-6
- [⬜] 7.3 Implementer tiltak-tabell fra hver runde
- [⬜] 7.4 Loop til snitt ≥ 90
- [⬜] 7.5 Lagre `wool-app/docs/score-log.md`

## Sidespor A — Copilot million-dollar-app-dialog (parallel)
- [✅] A.1 Åpne Sivert's Copilot via Playwright (2026-06-17 23:10)
- [✅] A.2 Sendt intro-melding med status, URL-er, Nano Banana-bilder
- [✅] A.3 Mottatt: «Hva mangler for million-dollar-app?» (6 punkter A-F)
- [✅] A.4 Mottatt: avatar 3D — behold men strikt regelsett
- [✅] A.5 Lagret `wool-app/docs/copilot-million-dollar.md`
- [✅] A.6 Be om red team memo (do not touch / must fix / nice to have) — sendt 23:33
- [⬜] A.7 SPØR SIVERT i morgen før Nano Banana-generering

### Copilot's TOP 5 — å gjøre i natt (Claude Code-tolkning):
1. ✅ Sekundærskjermene må opp til samme autoritet som home
2. ⬜ Definer et motion grammar for hele produktet
3. ✅ Fjern forklarende copy der UI burde gjøre jobben
4. ⬜ Gjør avataren mer "display", mindre "character"
5. ✅ Stram hele component-craften til ett materialsystem

## Sidespor B — Atomic-liste oppdatert kontinuerlig
- [✅] B.1 Master-liste eksisterer (denne fila)
- [⬜] B.2 Hver nye jobb → append til denne fila FØR utførelse
- [⬜] B.3 Self-verify per item
- [⬜] B.4 Cross-verify Copilot per item (etter Fase 7)

---

## Autonomi-mandat (gjeldende):
- Chain alle faser uten å spørre
- Nano Banana → SPØR FØRST (Sivert godkjenner i morgen)
- Vercel deploy via git push (auto)
- Commit-meldinger merket "F26"
- Logger persisteres til `wool-app/docs/`

## Tracking timeline:
- 2026-06-17 23:10 — Atomic-master opprettet, Copilot-session åpnet
- (logges per fase)
