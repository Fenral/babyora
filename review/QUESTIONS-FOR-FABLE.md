# Spørsmål for Fable 5 — P9-runden

> Per autonomi-protokoll (P9 master): genuine usikkerheter logges her,
> jeg fortsetter med foreløpig valg. Fable 5 svarer asynkront. Punkter
> i sjekklisten merkes `[?]`.

## Q1 — Capacitor-plugin lokalt vs npm

**Kontekst:** P9.1 krever en Capacitor-plugin `widget-bridge` med
`updateSnapshot(json)`. Pluginet trenger native iOS + Android-kode
som ikke kan testes uten Mac/emulator i denne sesjonen.

**Alternativer:**
- A) Lag pluginet som intern Capacitor-plugin under `ios/App/App/Plugins/`
  og `android/app/src/main/java/.../plugins/` (vanlig Capacitor 7+ mønster
  via `@capacitor/cli` plugin generator)
- B) Lag som separat npm-pakke `@babyora/widget-bridge`
- C) Direkte JS-skall som later som det skriver (no-op) inntil native-
  delene legges til av widget-sesjonene

**Foreløpig valg:** A. Begrunnelse: holder alt i hovedrepoet, ingen
ekstern publish-flyt. Widget-sesjonene har isolerte iOS/Android-
mapper og kan utvide native-delen.

## Q2 — PostHog API-nøkkel sourcing

**Kontekst:** P9.4 krever PostHog Cloud EU. Jeg har ingen nøkkel.

**Foreløpig valg:** Implementer `track()`-wrapper med env-var
`VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST`. Hvis nøkkel mangler ved
runtime: silent no-op. Sivert legger nøkkel i Vercel/Codemagic env
når PostHog-konto er opprettet. Markeres `[?]` i sjekklisten for
"installer/verifiser nøkkel etter konto-opprettelse".

## Q3 — Premium-grense for «Mine plagg»

**Kontekst:** P9.6 sier «3 plagg gratis, ubegrenset i premium».
Eksisterende paywall-flow trigges av andre kontekster.

**Foreløpig valg:** Implementer count-grense på 3 toggle-handlinger
mot localStorage per barn. Ved 4. → vis PaywallSheet med
trigger='garment_ownership'. Begrunnelse: matcher P9.6-tekst,
gjenbruker eksisterende paywall.

## Q4 — Bias-eksponering UI-plassering

**Kontekst:** P9.5 «når bias er aktiv vises 'Justert: dere har meldt
at {navn} ofte er for varm' på Hjem, med av-bryter».

**Foreløpig valg:** Liten chip ovenfor HeroHotspot, som chip-row P7.4
allerede satte konvensjon for. Av-bryter åpner Innstillinger →
barnet → feedback-historikk.

## Q5 — Versjonsstrategi for WidgetSnapshot

**Foreløpig valg:** `v: 1` hardkodet, plugin/parser sjekker `v` og
faller tilbake til "Åpne Babyora" hvis ukjent. Migrering ved v=2 blir
egen runde.
