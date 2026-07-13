# HANDOVER til Copilot — Babyora F28-loop fasit-rolle

> **AUTO-GENERERT** av `scripts/v0-handover.mjs` ved
> 2026-06-19 (timestamp utelatt — re-generering
> ved Sivert/Claude utgivelse, ikke runtime).

**Aktiveres når:** V0-saldo ≤ $0.50

---

## 1. Hvem du er, hva du gjør

Du er **GitHub Copilot** og tar over som **design-fasit-partner** i
Babyora F28-loopen — V0's rolle gjennom F28.21-28.

Sivert (eier) forventer:
- **Score 96+/100** før vi stopper på en skjerm
- **Brutal ærlighet, ikke ja-mann.** Utfordre Claude hvis han tar feil.
- **Korte konkrete svar.** Score + 1-2 konkrete tiltak per runde.
- **Spec-disiplin.** Instrument-DNA (TrackMan / Apple Weather / Things 3).

Anti-mønstre (Sivert-direktiv):
- Konsensus-først er bias-felle — utfordre Claude alltid
- Ja-mann-respons er forbudt
- «Begge alternativene er bra» er forbudt — gi sterkeste mening først

---

## 2. Babyora — kondensert context

**Hva:** Norsk PWA som hjelper foreldre kle på spedbarn (0-3 år) etter været.
**Live:** https://wool-app.vercel.app
**Stack:** React + Vite + TypeScript + Capacitor (iOS+Android), Vercel auto-deploy.

**Design-DNA:**
- Instrument-metafor (TrackMan / Apple Weather / Things 3)
- Palette: terracotta (#AD4B2A 600 ink, #D98A6A 400 line, #F6E3D9 100 tint),
  sand-100 #F4EEE7 bg, ink-300/500/700/900
- Font: Schibsted Grotesk (sans only — DROP serif)
- ° baseline (ikke superscript), tabular-nums
- Atmosphere-gradient kontinuerlig mix (cold top → warm bottom), aldri 3 faste klasser
- Form-baserte LayerSymbol (outline/halv/solid)
- Native `<dialog showModal>` for focus-trap

---

## 3. Hvor V0-loopen sluttet (frosset state)

**Siste commit:** `3a77c04` — F28.36: Plaggbib 2-kol grid + serif-drop på h1 (fan-out P0)
**Triggered ved:** V0-saldo ≤ $0.50
**Skjerm vi sto på:** se siste fil i seksjon 10

**Siste 10 commits:**
```
3a77c04 F28.36: Plaggbib 2-kol grid + serif-drop på h1 (fan-out P0)
6823496 F28.29+34: Guide-hub subtitle + Sone 3 P0 fan-out (4 parallel evalueringer)
62caf2f F30.auto: v0-handover.mjs (saldo-detektor + handover-regen)
bbc226b F30: HANDOVER-TO-COPILOT.md klar for trigger (Sivert 2026-06-19)
cee1c7b F28.28: dokumentere V0-runde 10 Forsiden + sone 1-trio sluttstatus
30f68cd F28.28: Forside ConditionLayer (V0-runde 9 P0 #2 TILTAK 5b)
4822e44 F28.27: Uke fokus-affordans bump + delvis-ikon 26→24 (V0-runde 7)
e0b9868 F28.26: Uke kolonnelås + scroll-bunn-safe-area (V0-runde 6, score 82→?)
6150e9a F28.25.a: verify-browser-uke.mjs — fix utdatert LayerSymbol-detektor
b010270 F28.24: suppress warm/SB-2 banner + vindlag 14° utelek (V0-runde 4)
```

---

## 4. V0-score-tabell (auto fra v0-rounds/)

| F28.X | Skjerm | Score | Fil |
|---|---|---|---|
| 21 | paakledning | — | F28.21-paakledning-response.md |
| 23 | paakledning | 84 | F28.23-paakledning-response.md |
| 24 | paakledning | — | F28.24-paakledning-response.md |
| 25 | uke | 82 | F28.25-uke-response.md |
| 26 | uke | 93 | F28.26-uke-response.md |
| 27 | uke | 97 | F28.27-uke-SHIP.md |
| 28 | forside | 93 | F28.28-forside-response.md |
| 28 | forside | — | F28.28-forside-runde2.md |

---

## 5. V0's mest sentrale verdikter (verbatim sitater)

Disse er **bar for kvalitet du forventes å levere som fasit:**

**Engine-splaining:**
> «Components should explain themselves. En banner som forteller hvorfor
> færre lag ER engine-splaining — flytt til 'Hvorfor?'-expander.»

**Atmosphere-konsistens:**
> «Kontinuerlig mix() cold→mild→warm, aldri tre faste klasser, transition:
> background var(--dur-slow) så skiftet føles levende, ikke hopp.»

**Instrument-DNA:**
> «Bare-nivå gjennomført (ingen surface-bokser rundt temp/condition/
> anbefaling), ° på baseline med tabular-nums + clamp() for 1.4.4.
> Det er ekte 96-kandidat-arbeid.»

**Kolonnelås:**
> «Misalignment vises først nedover i lista, ikke i toppraden du ser i
> preview. Spec'en kaller dette 'det dyreste enkeltproblemet for
> betalingsvilje'.»

**Språk-presisjon:**
> «Inkonsistent ordstilling mellom skjermer ('ull-mellomlag tykt' cold
> vs 'tynn ull-mellomlag' mild). Maskinell ordstilling leser som
> DB-nøkler. Naturlig: 'isolert vinterdress', 'tynt ullsett'.»

**Ærlighet i UI-state:**
> «Bakgrunnen representerer dayIdx, men hvis raden ikke har et synlig
> valgt-tilstand, kan brukeren ikke se hvilken dag gradienten viser →
> bakgrunnen oppleves som om den 'lyver'.»

**TILTAK 5b condition-lag:**
> Lag 1 Tone (alltid): temperaturgradient (~70% av været).
> Lag 2 Condition (BAK avataren): klarvær mykt lyspunkt, skyet flatere,
> snø 12-15 partikler slow drift (ENESTE bevegelses-lag), regn statisk haze.
> Lag 3 Grounding: shadow-ground.

---

## 6. A11y-policy ved uenighet med Claude/Sivert

Sivert valgte **Hybrid (B med presisering):** Visuell form fra fasit (V0/deg),
semantisk/ARIA fra accessibility-lead.

Eksempler:
- atmosphere `transition: background` BEHOLDT ved prefers-reduced-motion
  (a11y-lead: «color is not motion»)
- SegmentToggle ser ut som A3-pille men kan ha ulike ARIA-roles
  (radiogroup / switch / tabs)
- Status-dot må aldri være eneste signal — alltid tekst-label
- Inline-expander: aria-expanded + aria-controls + return focus

A11y-lead vinner ved semantisk uenighet. Du eier visuell form.

---

## 7. Loop-protokoll (slik V0 fungerte best)

**Hva gikk galt:** Vedlegg (screenshots) spiste V0's context-limit
hver gang. Tekst-only fungerte.

**Anbefalt mønster:**
- **Tekst-only** — drop screenshots og vedlegg
- **2-3 spørsmål per melding**, kort svar pr linje
- **Be om score 0-100 eksplisitt** + 1-2 konkrete tiltak + SHIP-verdikt
- **Bevisst kort prolog** (V0-context-limit triggered etter ~3000 tegn)
- **Aldri konsensus-først** — utfordre Claude og Sivert tilbake

Hver runde dekker:
1. Skjerm-navn + commit-hash
2. Hva som er endret siden forrige runde
3. 2-3 spørsmål: ny score? hva mangler for 96+? SHIP eller ikke?

---

## 8. F28-rekkefølge (status ved bytte)

1. ✅ Forside (B1) — F27.3 + F28.28 (sannsynlig ~96 SHIP, V0-runde 10 kuttet)
2. ✅ Uke (B2) — 97/100 SHIP (V0-runde 8)
3. ⏳ Guide-hub (B3) — NESTE
4. ⏳ Innstillinger (B7-3)
5. ✅ Påkledning (LayerDetailSheet) — F28.21-24, ~93 forventet
6. ⏳ Plaggbibliotek (B4)
7. ⏳ Plagg-detalj (B5)
8. ⏳ Finn antrekk (B6)
9. ⏳ Varm/kald (B7-1)
10. ⏳ TOG-veiledning (B7-2)
11. ⏳ Onboarding

---

## 9. Hvordan du fortsetter

1. **Bekreft kontekst:** Si fra at du har lest handover-fila + nevn ett
   eller flere V0-sitat verbatim for å vise du har den
2. **Ta neste skjerm** (Guide-hub) eller bekreft Forsiden+Påkledning SHIP
3. **Lagre svarene dine** i `wool-app/docs/copilot-rounds/F28.X-skjerm.md`
   (samme struktur som `docs/v0-rounds/`)
4. **Bruk samme tekst-only-protokoll** som V0

Lykke til. Vær brutal. Sivert vil ha 96+.

---

## 10. V0-runde-arkivet (alle filer)

- `F28.21-paakledning-response.md`
- `F28.23-paakledning-response.md`
- `F28.24-paakledning-response.md`
- `F28.25-uke-response.md`
- `F28.26-uke-response.md`
- `F28.27-uke-SHIP.md`
- `F28.28-forside-response.md`
- `F28.28-forside-runde2.md`

---

*Regenerer fila: `node scripts/v0-handover.mjs --regen`*
*Full bytte: `node scripts/v0-handover.mjs --full` (regen + commit + push)*
