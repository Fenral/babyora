# Native feasibility-spike: widget-timeline med utløpsdegradering + deep link

Dato: 2026-08-06 · Avgrensning (Sols bindende, fase 10-review): **én widgetfamilie,
én deep link, én utløpstilstand — upolert.** Dette er bevisverktøy, ikke en femte
prototype.

Spiken skal bevise/motbevise tre påstander:

| # | Påstand | Mekanisme |
|---|---------|-----------|
| (a) | Widgeten kan vise en brief og degradere den **VED utløpstidspunktet uten app-åpning** | iOS: WidgetKit-timeline med to entries (nå + degradert entry datert nøyaktig `expiresAt`), `.atEnd`-policy. Android: `AlarmManager`-alarm på `expiresAt` → re-render |
| (b) | Deep link fra widget lander riktig | iOS: `widgetURL(babyora://brief/<briefId>)` + CFBundleURLTypes. Android: `PendingIntent` med `ACTION_VIEW babyora://brief/<briefId>` + intent-filter på MainActivity |
| (c) | Cache/kontrakt mellom app og widget holder | Samme `WidgetSnapshot` v2-JSON: iOS leser App Group-fil (`group.no.klemeg.app`/`widget-snapshot.json`), Android leser SharedPreferences (`babyora_widget`/`snapshot_json`) — skrevet av samme `WidgetBridge`-plugin |

Utløpssemantikk overalt: **halvåpent intervall** — utløpt når `nå >= expiresAt`
(Sols avvik e, speiler `docs/design-lab/lab/p3/brief-maskin.ts`).

## Hva som er bygget

### Kontrakt (v1 → v2, bakoverkompatibel)
- `src/lib/widget/snapshot.ts` — v2-feltene `expiresAtISO`, `versjon`, `briefId`,
  `deltaTekst` som valgfrie felter; `withBriefFields()` løfter v1→v2 og peker
  `deepLink` på `babyora://brief/<briefId>`; `erSnapshotUtlopt()` med halvåpent
  intervall. Alle v1-felter uendret — v1-lesere ignorerer v2-feltene trygt.
- `src/lib/widget/bridge.ts` — `shouldPushSnapshot` trigges nå også av endret
  `briefId`/`versjon`/`expiresAtISO`.
- `src/lib/widget/__tests__/snapshot-v2.test.ts` — 12 nye tester, inkl.
  grensetesten «nøyaktig på expiresAt → utløpt».

### iOS
- `ios/App/BabyoraWidget/BabyoraWidget.swift` — timeline med TO entries:
  gjeldende brief nå + degradert entry datert nøyaktig `expiresAt`
  («Må beregnes på nytt» + «Rådet gjaldt til HH:mm» + fallback-linjen
  «Sist: <antrekk>»), `.atEnd`-policy; `widgetURL` på hele flaten.
- `ios/App/BabyoraWidget/WidgetSnapshot.swift` — dekoder v1 OG v2 (optionals),
  `erUtlopt(naa:)` med halvåpent intervall.
- `ios/App/App.xcodeproj/project.pbxproj` — **håndredigert**: nytt target
  `BabyoraWidgetExtension` (appex, bundle-id `no.klemeg.app.widget`,
  entitlements med App Group), Embed Foundation Extensions-fase,
  target-dependency, og `WidgetBridgePlugin.swift/.m` lagt inn i App-targetets
  Sources (var aldri med — pluginen har vært død kode i alle bygg til nå).
  `CODE_SIGN_ENTITLEMENTS = App/App.entitlements` satt på App-targetet
  (App Group-entitlementen var heller aldri koblet).
- `ios/App/App/Info.plist` — `CFBundleURLTypes` med scheme `babyora`
  (fantes ikke — `babyora://`-lenker hadde ingen mottaker på iOS).
- `codemagic.yaml` — henter/oppretter provisioning profile også for
  `no.klemeg.app.widget` i fetch-signing-files-steget.

### Android
- `android/app/src/main/java/no/klemeg/app/widget/BabyoraBriefWidget.kt` (NY) —
  `AppWidgetProvider` som leser samme JSON fra SharedPreferences, viser brief +
  gyldighet, og skedulerer `AlarmManager.setExactAndAllowWhileIdle` på
  `expiresAt` (fallback `setWindow` ±60 s der eksakt alarm er avslått);
  `PendingIntent` deep link på hele flaten.
- `android/app/src/main/res/layout/widget_babyora_brief.xml` +
  `res/xml/babyora_brief_widget_info.xml` (NYE) — upolert layout + metadata
  (`updatePeriodMillis=0`, kun push + alarm).
- `WidgetBridgePlugin.kt` — omskrevet: navngitte SharedPreferences (androidx.
  preference-avhengigheten fantes ikke i build.gradle), trigger provider-render
  direkte (gamle `notifyAppWidgetViewDataChanged` gjelder kun collection-views).
- `MainActivity.java` — `registerPlugin(WidgetBridgePlugin.class)` (app-lokale
  Capacitor-plugins registreres ikke automatisk — broen var død kode på
  Android også).
- `AndroidManifest.xml` — widget-receiver, `babyora://`-intent-filter på
  MainActivity, `SCHEDULE_EXACT_ALARM`.
- `android/build.gradle` + `android/app/build.gradle` — Kotlin-plugin aktivert
  (`.kt`-filene ble stille ignorert av AGP uten den), `jvmTarget 21`.
- `codemagic.yaml` — Android-workflow `java: 17 → 21` (Capacitor 8 genererer
  `sourceCompatibility 21`; 17 ville feilet).

### App-siden (minst mulig inngrep)
- `src/lib/widget/WidgetSpikePanel.tsx` (NY) — testpanel synlig kun på native
  + dev-web: to knapper («utløper om 2 min» / «15 min») som skriver et
  v2-test-snapshot via broen, og en «Siste deep link inn»-linje som viser
  `appUrlOpen`-URL-en (deep link verifiseres uten devtools på enheten).
- `src/screens/InnstillingerScreen.tsx` — 2-linjers mount av panelet over
  versjonsfooteren. (Ingen eksisterende dev-flate fantes i bridge.ts.)

## Verifisert lokalt (Windows) vs. venter på Codemagic/enhet

**Verifisert lokalt:**
- `npx vitest run src/lib/widget` → 28/28 grønne (16 v1 + 12 nye v2).
- `npm run build` (tsc -b + vite, alle tre flater) → grønt.
- ESLint på alle berørte TS/TSX-filer → rent.
- pbxproj: klammer/paren-balanse + alle nye UUID-er definert, ingen duplikater
  (skriptet sjekk).
- Gradle: `./gradlew :app:assembleDebug --dry-run` evaluerer alle build-skript
  inkl. ny Kotlin-plugin uten feil, men stopper på «SDK location not found» —
  **det finnes ingen Android SDK på denne maskinen**, så Kotlin-kompilering,
  manifest-merge og ressurslenking verifiseres først av Codemagic.
- Merk: 6 røde tester i `src/styles/__tests__/` (design-doktrine/skjermmanifest)
  skyldes den parallelle øktens pågående arbeid i `src/screens`/`paakledning.css`
  — ingen av dem peker på widget-filer.

**Venter på Codemagic:**
- Swift-kompilering av widget + plugin (kan ikke bygges på Windows).
- Provisioning: profilene må inkludere App Group.
- Kotlin-kompilering + APK/AAB.

**Venter på enhet:** hele eier-protokollen under.

## Hva Codemagic-bygget vil produsere

- **iOS (trigges av tag `v*`, f.eks. `git tag v1.0.12 && git push origin v1.0.12`):**
  TestFlight-bygg der appen embedder `BabyoraWidgetExtension.appex`. Widgeten
  «Babyora» dukker opp i widget-galleriet (small + medium).
- **Android (manuell trigger i Codemagic-dashboard, `android-internal`):**
  AAB til Play Internal (draft) med widgeten «Babyora» i widget-velgeren.

### Forutsetningen på developer.apple.com — UTFØRT 2026-08-06

Gjort via Playwright etter at eieren logget inn manuelt (passord + 2FA kan
ikke automatiseres, og skal ikke være det).

Funnet ved gjennomgang — ikke det NATIVE-SPIKE.md antok:

| App ID | Før | Handling |
|--------|-----|----------|
| `no.klemeg.app` (Klemeg) | App Groups påslått, `group.no.klemeg.app` allerede tilordnet | ingen |
| `no.klemeg.app.widget` (Babyora Widget Extension) | App Groups **påslått, men «Enabled App Groups (0)»** | `group.no.klemeg.app` krysset av → Continue → Save → Confirm |

Den halvferdige tilstanden på widget-ID-en er den farlige varianten: haken
sto på, så en rask titt ville lest det som «ordnet», mens entitlementen
peker på null grupper og codesign feiler først i byggesteget.

**Verifisert etter full sideomlasting** (ikke bare i skjemaets minne):
`Enabled App Groups (1)`, og dialogen viser `group.no.klemeg.app` avkrysset,
«1 of 1 item(s) selected». Bevis: `docs/design-lab/appendix/fase-spike-bevis/`
(01 = før, 02 = etter omlasting).

Apple varslet ved lagring at eksisterende provisioning-profiler for denne
App ID-en blir ugyldige og må lages på nytt. Det er forventet — Codemagics
`fetch-signing-files`-steg henter/oppretter profiler for både
`no.klemeg.app` og `no.klemeg.app.widget` ved hvert bygg.

## Byggresultat 2026-08-06

### iOS — bygg 6a74e7f3052b204a9a5eb450, tag v1.0.12, build 83

Alle 19 steg `success`, inkludert `Fetch signing files` (begge bundle-ID-er),
`Apply signing profiles`, `Build IPA` og `Publishing`. Artefakter: `App.ipa`
(333 MB) + `babyora_83_artifacts.zip`. Bygget lastet opp til TestFlight.

**Grønne steg beviser ikke innhold.** IPA-en ble derfor lastet ned og
inspisert med `tools/ipa-bevis.ps1` (feiler med exit 1 hvis en påstand
mangler dekning; inneholder et mutasjonsledd så testen ikke er vakuøs):

| Påstand | Fasit i fila |
|---------|--------------|
| Widget-utvidelsen er embeddet med egen binær | `Payload/App.app/PlugIns/BabyoraWidgetExtension.appex/BabyoraWidgetExtension` |
| Widgetens profil har app-gruppen | `group.no.klemeg.app` i widgetens `embedded.mobileprovision` |
| Widgetens profil gjelder riktig bundle | `no.klemeg.app.widget` i samme profil |
| Appens profil har SAMME app-gruppe | `group.no.klemeg.app` i appens `embedded.mobileprovision` |
| `babyora://` har en mottaker | `babyora` i appens `Info.plist` |

Alle fem har dekning. Det som gjenstår er nettopp det bare en enhet kan
avgjøre: om timelinen faktisk degraderer ved `expiresAt` uten app-åpning,
om deep link lander, og om App Group-fila leses i praksis. Kjør protokollen
under.

### Android — bygg 6a74ecea5fa8ce34a92f94aa: FEILET før første steg

`No keystores with reference 'klemeg_keystore' were found from code signing
identities.` Ingen kodefeil — signeringsnøkkelen er aldri lastet opp i
Codemagic (samme forbehold som `codemagic.yaml` linje 221 dokumenterer).

Dette **sperrer ikke spiken**: tolkningsregelen krever PASS på minst én
plattform, og iOS er nede. Android krever en eierbeslutning før den kan
bygges — en keystore binder appens identitet i Play for alltid, så valget
mellom «gjenbruk Ryddys» og «lag en ny for Babyora» er ikke Claudes å ta.

Kjente spike-avgrensninger (bevisst utenfor): lock screen-widget, pen design,
i18n i widgeten, WorkManager-persistens over reboot på Android (alarm settes på
nytt ved neste `onUpdate`/push, ikke ved boot), og selve brief-innholdet (P3s
«komplett beslutningsenhet»-P0 løses i retningsarbeidet, ikke her).

## Enhetsprotokollen — resultater så langt

| Dato | Steg | Resultat |
|------|------|----------|
| 2026-08-07 01:34 | 1 · Legg widget (iOS) | **PASS.** «Babyora» fantes i widgetgalleriet. Eier la på BÅDE small og medium på samme hjemskjerm — bredere enn protokollen ba om, og begge rendret. Bekrefter at `BabyoraWidgetExtension.appex` ble embeddet og at begge familiene i `supportedFamilies` faktisk vises. |
| 2026-08-07 01:34 | 2 · Tomtilstand | **PASS.** Begge widgetene viser «Åpne Babyora for dagens antrekk». |
| | 3 · Sett test-snapshot | venter |
| | 4 · Utløpsdegradering (kjernebeviset) | venter |
| | 5 · Deep link | venter |
| | 6 · Re-aktivering | venter |

Merk til tolkningen: tomtilstanden i steg 2 beviser at widgeten kjører og
tegner, men **ikke** at App Group-lesingen virker — den fallbacken vises
også når snapshot-fila mangler eller ikke kan leses. Kontrakten (c)
avgjøres først i steg 3.

## Eier-testprotokoll på enhet

> **Gjelder build 83 (tag v1.0.12) — ikke senere bygg.** Den parallelle økten
> holder på å slette `WidgetSpikePanel.tsx` og erstatte den med
> `use-widget-snapshot.ts`, som mater widgeten fra ekte bruk i HjemScreen i
> stedet for fra en testknapp. Det er riktig retning (kallstedet manglet —
> widgeten ville stått i tomtilstand for alltid), men det betyr at
> **testknappen under bare finnes i build 83**. Bygges det på nytt etter at
> den endringen er landet, må steg 2 skrives om til «åpne appen og la den
> hente vær», og utløpstiden kan ikke lenger settes til to minutter.
> Kjør derfor protokollen på build 83 mens den står der.

Forberedelse (begge plattformer): installer bygget, åpne appen én gang, gå til
**Innstillinger** og finn den oransje, stiplede boksen «Widget-spike
(testverktøy — fjernes)» nederst, over versjonslinjen.

### iOS (TestFlight)

1. **Legg widget:** hold på hjemskjermen → + → søk «Babyora» → legg til small
   eller medium.
   - PASS: widgeten finnes i galleriet og viser «Åpne Babyora for dagens
     antrekk» (tomtilstand).
   - FAIL: widgeten mangler i galleriet (targetet ble ikke embeddet) → sperre.
2. **Sett test-snapshot:** åpne appen → Innstillinger → trykk
   «Send test-brief · utløper om 2 min». Gå til hjemskjermen.
   - PASS: widgeten viser «Testbarn», «1°», «3 lag», delta-linjen
     «+1 ull-lag: …» og «Gjelder til HH:mm» innen ~10 sek.
   - FAIL: widgeten står i tomtilstand → kontraktsbrudd (c): broen skriver
     ikke, eller widgeten leser ikke App Group-filen.
3. **Utløpsdegradering UTEN app-åpning:** bli på hjemskjermen (IKKE åpne
   appen), vent til utløpsklokkeslettet passerer.
   - PASS: **ved** utløpstidspunktet (±1 min, WidgetKit-presisjon) bytter
     widgeten selv til «Må beregnes på nytt» + «Rådet gjaldt til HH:mm» +
     «Sist: …». Dette er kjernebeviset for (a).
   - FAIL: widgeten viser fortsatt aktivt råd 5+ min etter utløp → (a)
     motbevist for iOS-timeline, alternativ (App Refresh/push) må utredes.
4. **Deep link:** trykk på widgeten (i degradert tilstand).
   - PASS: appen åpnes, og panelet i Innstillinger viser
     «Siste deep link inn: babyora://brief/spike-…» med samme briefId som i
     status-linjen fra steg 2.
   - FAIL: appen åpnes uten at deep link-linjen oppdateres (scheme-ruting
     virker ikke), eller appen åpnes ikke → sperre for (b).
5. **Re-aktivering:** send ny test-brief (15 min) → widgeten skal tilbake til
   aktiv visning med NY gyldighet. PASS/FAIL på om ny brief alltid vinner.

### Android (Play Internal / APK)

1. **Legg widget:** hold på hjemskjermen → Widgets → «Babyora» → legg til.
   - PASS/FAIL som iOS steg 1.
2. **Sett test-snapshot:** som iOS steg 2.
   - PASS: widgeten viser «Testbarn», «1° · 3 lag», delta-linje og
     «Gjelder til HH:mm» innen ~10 sek.
3. **Utløpsdegradering uten app-åpning:** som iOS steg 3.
   - PASS: ved utløp (eksakt hvis «Alarmer og påminnelser»-tilgang er på for
     Babyora; ellers inntil ~60 s etterslep) viser widgeten
     «Må beregnes på nytt» + «Rådet gjaldt til HH:mm» + «Sist: … · trykk for
     å oppdatere».
   - Hvis FAIL på Android 14+: sjekk Innstillinger → Apper → Babyora →
     «Alarmer og påminnelser». Noter om PASS krevde manuell tilgang — det er
     et arkitekturfunn (WorkManager-fallback må vurderes), ikke en formalitet.
4. **Deep link:** trykk på widgeten.
   - PASS: appen åpnes og panelet viser `babyora://brief/spike-…`.
5. **Re-aktivering:** som iOS steg 5.

### Tolkningsregel (Sols sperreliste)
Spiken er BESTÅTT bare hvis (a), (b) og (c) alle består på minst én plattform,
og degraderingen i steg 3 skjedde uten at appen ble åpnet. Delvis PASS
dokumenteres per plattform. Grønt på fravær teller ikke: hvert PASS krever den
konkrete observasjonen beskrevet over (ikke-vakuøsitet), og steg 3 er
mutasjonsbeviset — samme widget, samme snapshot, kun klokken flyttet seg.
