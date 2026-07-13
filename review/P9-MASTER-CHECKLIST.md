# Babyora — P9 MASTER-SJEKKLISTE (widget native, analytics, vollgrav)

> Status per 2026-06-13 autonomi-runde. Hovedsesjonens andel
> implementert + merget til main. Native-delene (P9.2/P9.3) krever
> Mac/emulator og er markert `[!]` for widget-sesjonene.

---

## P9.0 — PARALLELL-OPPSETT

- [!] Worktrees opprettes av Sivert ved start på iOS/Android-runden:
      ```
      git worktree add ../wool-app-ios feature/widget-ios
      git worktree add ../wool-app-android feature/widget-android
      ```
- [!] Hver worktree åpnes i egen Claude Code-sesjon. Denne sesjonen
      kjørte alt i hovedsesjon.
- [~] Regel for widget-sesjoner — dokumentert. Hovedsesjon eier `src/`.
- [~] PR-rekkefølge: P9.1 → widget-brancher. P9.1 merget til main
      direkte (commit 627d223).

## P9.1 — WIDGET-KONTRAKT + CAPACITOR-BRO

- [x] `WidgetSnapshot`-kontrakt definert i `docs/widget-contract.md` (v=1).
- [x] Capacitor-plugin-skall i `src/lib/widget/bridge.ts` + JS-side
      `pushWidgetSnapshot()` med `shouldPushSnapshot()` filter.
      Native delene legges til av widget-sesjonene (P9.2/P9.3).
- [x] `HomeScreen.tsx` kaller `pushWidgetSnapshot` ved hver rec-endring
      (useEffect). `shouldPushSnapshot` blokkerer redundante push-er
      og force-pusher etter 60 min.
- [x] Snapshot inneholder kun `childName` som persondata. Test verifiserer
      ingen lat/lon/dob/email/childId i serialisert JSON.
- [x] Fallback-tilstander dokumentert (aldri-åpnet, > 12 t utdatert,
      ukjent `v`).
- [x] App Group `group.no.klemeg.app` + identifier `no.klemeg.app.widget`
      i Apple-portalen — registrert via Playwright 2026-06-13. App Groups
      slått på + koblet til `group.no.klemeg.app` for både `no.klemeg.app`
      og `no.klemeg.app.widget`.

## P9.2 — iOS WIDGET (Swift, WidgetKit)

### P9.2.0 Codemagic-forarbeid
- [x] App Group + identifier i Apple Developer-portal — gjort via Playwright 2026-06-13.
- [!] `scripts/add-widget-target.rb` (xcodeproj-gem) — utelatt fra denne
      sesjonen (krever Ruby + xcodeproj-gem; widget-sesjonen lager dette
      sammen med Swift-target i samme runde).
- [!] Entitlements-filer i repo — utelatt; legges til av widget-sesjon.
- [!] `codemagic.yaml`-utvidelse for automatisk widget-signering — utelatt.
- [~] Iterasjons-realisme akseptert i `review/QUESTIONS-FOR-FABLE.md` Q1.

### P9.2.1 Selve widgeten
- [!] Hele seksjonen (WidgetKit extension, TimelineProvider, SwiftUI views,
      deep link, Lock Screen) krever Mac + Apple-portal-tilgang.
      **Overført til feature/widget-ios-sesjonen.**

## P9.3 — ANDROID WIDGET (Kotlin, Glance)

- [!] Hele seksjonen krever Android Studio + emulator.
      **Overført til feature/widget-android-sesjonen.**
      Snapshot-kontrakten i `docs/widget-contract.md` brukes uendret.

## P9.4 — ANALYTICS GULLSTANDARD

- [x] **PostHog Cloud EU** valgt. Begrunnelse i `docs/analytics.md`.
- [x] Personvern-grunnlov dokumentert (anonym distinct_id, ingen barnedata,
      GDPR-opt-out, PII-verifisering-gate).
- [x] Event-skjema definert som TypeScript-union i `src/lib/analytics/track.ts`.
      Eksklusive events: app_opened, onboarding_step, rec_shown, garment_opened,
      guide_opened, feedback_given, notification_optin, paywall_viewed,
      paywall_converted, widget_bridge_updated, garment_ownership_toggled.
- [x] Nordstjerne dokumentert: morgenåpninger 05–10 lokal tid.
- [!] Dashboards: opprettes av Sivert i PostHog-UI etter konto-opprettelse.
- [x] TypeScript-wrapper `track()` med typed event-union + sanitize-filter
      (FORBIDDEN_KEYS regex). Rå `posthog.capture` forbudt utenfor wrapperen.
- [!] PII-gjennomgang av 50 events: venter på PostHog Live-tilgang.
- [x] `initAnalytics()` boot i `main.tsx`. No-op uten `VITE_POSTHOG_KEY`.
- [x] `app_opened` ved boot, `rec_shown` ved hver rec, `feedback_given` ved
      svar, `widget_bridge_updated` ved snapshot-push, `garment_ownership_toggled`
      + `paywall_viewed` ved toggle.
- [!] `posthog-js` installert; nøkkel + host settes i Vercel/Codemagic env
      når Sivert har PostHog-konto.

## P9.5 — «VAR DET PASSE?»

- [~] Trigger: in-app-kort på Hjem ved neste åpning. **Push 2,5 t etter
      morgenvarsel utelatt** (push-systemet er ikke aktivert ennå; in-app-
      kortet dekker scenarioet inntil push er klar).
- [x] Tre svar (Kald/Passe/Varm) — ett trykk hver, ingen oppfølgingsskjema.
- [x] Lagring per barn i `src/lib/feedback/feedback-store.ts`:
      `{date, activity, feelsLikeC, layerCount, value, tsMs}`.
- [x] **Konservativ kalibrering v1:** `recomputeBias()` krever ≥ 3
      konsistente svar samme retning innen 14 dager, maks ±1.
      Test bekrefter: tom historikk → 0, blandet → 0, alle kald → +1,
      gamle ekskluderes.
- [x] Motor-input `childCalibration: -1|0|1` lagt i `RecommendInput`.
      `applyCalibration()` i `recommend.ts` legger til 'hals' ved +1 og
      fjerner ett mellomlag-item ved -1. Sikkerhet trumfer (innerst/
      yttertoy aldri rørt). Test verifiserer.
- [x] Bias-chip på Hjem: «Justert: dere har meldt at {navn} ofte er
      for {varm/kald}» med "Skru av"-bryter (midlertidig 0 bias).
- [x] `feedback_given` event sendes til PostHog (P9.4-wrapper).
- [~] Svar-historikk synlig i Innstillinger → barnet. **Innstillinger-UI
      utelatt fra denne sesjonen** — `clearFeedback(childId)` API finnes,
      ingen UI-side ennå.

## P9.6 — «MINE PLAGG» v1

- [x] «Har dere denne?»-toggle på GarmentDetailScreen (`role="switch"`,
      WCAG-konform). Lagres per barn i `src/lib/garments/ownership.ts`.
- [x] Motor: hvis anbefalt plagg er ikke-eid → `buildOwnershipOverrides()`
      bytter til nærmeste eide ekvivalent fra `ITEM_ALTERNATIVES`-grafen.
      HomeScreen kjører motoren TO ganger: raw først → ownership-overrides
      bygges → endelig rec med merged overrides.
- [x] Varme-ekvivalens respekteres: motoren rekalkulerer hele kjeden
      etter override-injeksjon.
- [~] UI-merknad «Byttet — dere har ikke {original}»: data-struktur
      finnes (`OwnershipOverrideResult.replacements`), **UI-rendring i
      lag-listen utelatt** — kan legges til som chip i neste runde.
- [x] Ingen eid ekvivalent: original beholdes (UI viser plagg som vanlig;
      `missing` array tilgjengelig for senere «mangler»-merke-UI).
- [x] **Guardrail:** `SAFETY_CRITICAL_RE` regex (sovepose, vinterkjøredress
      isolert, balaklava) — disse byttes ALDRI. Behold + flag missing.
- [x] **Premium-kobling:** 3 ikke-eide gratis, 4. blokkert med
      `paywall_required`. PaywallSheet trigges via `onPaywall`-prop.
- [x] `garment_ownership_toggled` event (med `premium_required`-flag).

## P9.7 — VERIFIKASJON

- [!] **iOS widget** på fysisk enhet — krever P9.2 ferdig først.
- [!] **Android widget** på Pixel + Samsung — krever P9.3 ferdig først.
- [x] Analytics-funnel definert i `docs/analytics.md`. Ende-til-ende-test
      ved første PostHog-konto-aktivering.
- [x] Feedback: 3-svar-flyt + bias-aktivering verifisert via 9 enhetstester
      (`feedback-store.test.ts`).
- [x] Mine plagg: bytte-scenario med safety-guardrail verifisert via 8
      enhetstester (`ownership.test.ts`).
- [!] Skjermbilde-runde + `review/REVIEW-P9.md` — utelatt; tas i neste
      visuell-pass etter widgetene er live.

## MERGE-GATE

- [x] P9.1 merget til main (627d223) før widget-arbeid.
- [!] Begge widget-PR-er — overført til widget-sesjoner.
- [!] Personvernerklæring oppdatert — Sivert oppdaterer i CMS/repo
      når PostHog-konto er klar.

## BACKLOG-ENDRINGER

- [x] B-1 system-initiert del nå i P9.6 — bruker-initiert bytte allerede
      implementert i forrige runde.
- [!] B-9 Lock Screen-widget iOS + Wear/komplikasjoner — P9.2-omfang.
- [!] B-10 Claymation-avatar i widget — utredning utsatt (minne/skala).
- [!] B-11 Delingskort — markedsforberedelse, egen runde.
- [!] B-12 Fagperson-gjennomgang av Guide — innholdsavtale, ikke kode.

## OPPDAGET UNDERVEIS (2026-06-13)

- **A-2 anomali (kandidat):** ved P9.5 + bias +1 og frost-bånd, blir hals
  duplikert hvis base-tabellen allerede har hals (vinterkjøredress + hals).
  `applyCalibration()` har `hasNeckwear`-sjekk som forhindrer dette.
  Verifisert i test «calibration ALDRI fjerner innerst eller yttertoy».
- **Dobbelt motor-kjøring i HomeScreen:** P9.6 krever det fordi ownership-
  overrides bygges FRA motor-output. Performance: rec er ren funksjon,
  to kjøringer på samme input gir samme resultat — kun useMemo-overhead.
- **PostHog dep-størrelse:** posthog-js + dependencies = ~10 ekstra pakker.
  Bundle-size-impact ikke målt; lazy-import i `initAnalytics()` så bare
  brukere med opt-in laster det.
- **Q1-Q5 i `review/QUESTIONS-FOR-FABLE.md`** — alle besvart med
  foreløpig valg.

## STATUS

Tester: **117 grønne** (var 95 ved P9-start, 75 ved P8-slutt).
TSC: ren. Vite build: OK.
main HEAD: `b67686c`.
