# ia-flyter
# Babyora — Fase 1-audit: State, persistens og premium

Alle funn er lest direkte fra kode i `C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/src/`. Rapporten dokumenterer det som ER, ikke det som burde vært.

## 1. Viktigste avvik fra oppdragsbeskrivelsen

Oppdraget beskrev modellen som «free: i dag på ett sted / Plus: fremtid+overalt+familie». **Koden implementerer ikke lenger denne modellen.** Per eierbeslutning 2026-07-31 (referert i `src/lib/access/capabilities.ts:5-13`) er produktmodellen en **hard paywall**: etter fullført onboarding og én vist anbefaling krever HELE appen aktivt premium-entitlement. `decideAccess()` er en ren entitlement-sjekk — `reason: 'free'` beholdes kun i typen for en låst kontrakt i planning-laget (`capabilities.ts:19-27`), men returneres aldri. Free/Plus-skillet lever igjen bare som (a) rester i copy («fra/til»-ekspansjoner i `plus-features.ts:49-55`), (b) «barn nr. 1 er gratis»-regelen i `gating.ts:103-112`, og (c) hardkodede `reason: 'free'`-literaler i Hjem/Uke for planning-kontrakten.

## 2. State-arkitektur

To paradigmer side om side:

**A. React Context (eldst):** Barn-profiler ligger IKKE i zustand. `children-store.tsx` + `children-provider.tsx` er en klassisk Context/Provider med manuelle `localStorage`-hjelpere (`loadFromStorage`/`saveToStorage`, `children-store.tsx:117-156`). Nøkler: `babyora:children:v2` og `babyora:activeChildId:v2` (v2-bump F58, 2026-06-24 — gammel `klemeg:`-data ignoreres men slettes ikke, `children-store.tsx:75-80`). `needsOnboarding`-flagget styrer om OnboardingScreen vises i stedet for tabs.

**B. Zustand (v5):** 9 stores i `src/state/`:

| Store | Persist-nøkkel | Innhold |
|---|---|---|
| `subscription-store.ts` | `babyora.subscription` | isPremium-cache, lastSyncedAt, firstRecommendationSeenAt (+ ikke-persistert grace-vindu) |
| `theme-store.ts` | `babyora.theme` | auto/light/dark (leses også av boot-script i index.html) |
| `notification-pref-store.ts` | `babyora.notifications` | morning/weatherChange/morningHour (kun preferanse, ikke scheduling) |
| `location-pref-store.ts` | `babyora.location-pref` | KUN `mode` ('auto'/'manual') persisteres; automatiske koordinater er bevisst session-only med generasjonsteller |
| `ref-hour-store.ts` | `babyora.refHour` | referansetime 6/9/12/15/18/21, default 12 |
| `scan-cache-store.ts` | `babyora.scan-cache` | én ScanCacheSlot per barn + livstidsflagget `hasPlayedFullScanEver` (P9-migrering fra per-dag-flagg) |
| `ui-store.ts` | `babyora.ui` | `hasSeenOpeningEver` — **dødt felt uten konsumenter** (åpningssekvensen fjernet ved eier-override v3, bevisst ikke ryddet, `ui-store.ts:8-19`) |
| `swap-override-store.ts` | (ingen — bevisst session-only) | plagg-bytter for økten |
| `outfit-selection-store.ts` | (ingen persist) | åpen/lukket antrekksvalg-sesjon med streng validering |

I tillegg egne rå-localStorage-moduler utenfor zustand: `lib/feedback/feedback-store.ts` (`babyora:feedback:`/`babyora:bias:` per barn), `lib/garments/ownership.ts` (`babyora:owned:`), `hooks/useOverrides.ts` (`babyora:overrides:`), `hooks/useTooltipSeen.ts` (`babyora:tooltip-seen:`), `data/vinterprogram.ts` (`babyora:vinterprogram:start`), `lib/widget/bridge.ts` (`babyora:widget:lastSnapshot`), `hooks/useNativeSettings.ts` (`native-settings:*`), met.no-værcache (`lib/met-no/client.ts:335-369`) og geokode-cache (`nominatim:*`, `lib/geocode/nominatim.ts:25`).

**Mønster verdt å merke:** to «beregnet én gang per JS-boot»-modulkonstanter i `subscription-store.ts` — `DEMO_ENTITLEMENT_OVERRIDE` (`?seed=demo`-hook, linje 56-65) og `HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT` (rå synkron localStorage-les FØR storen opprettes, linje 95-97) — fordi zustand/persist sin rehydrering skjer for sent til å skille «var satt før økten» fra «ble nettopp satt».

## 3. Persistens: kun localStorage, ingen Capacitor Preferences

`@capacitor/preferences` er **ikke** en avhengighet (package.json) og importeres ingen steder. Eneste treff på «Preferences» er en kommentar i `scan-cache-store.ts:28-33` som eksplisitt begrunner valget: synkron localStorage gjør cachet resultat lesbart FØR første render, uten async-race mot Preferences/IndexedDB ved native kill/resume. All persistens går altså gjennom WebView-ens localStorage.

**GDPR-hull (verifisert):** `lib/gdpr/local-data.ts:19-24` eksporterer/sletter kun nøkler med prefiks `babyora:` og `klemeg:` (kolon). Alle zustand/persist-nøklene bruker punktum (`babyora.subscription`, `babyora.theme`, `babyora.ui`, `babyora.scan-cache`, `babyora.notifications`, `babyora.location-pref`, `babyora.refHour`) og fanges dermed **ikke** av «Mine data»-eksport eller «Slett alt»-flyten i InnstillingerScreen. Det samme gjelder `nominatim:*`, `native-settings:*` og PostHogs egen localStorage-persistens. Merk: abonnementsstatus overlever dermed en GDPR-sletting (funksjonelt gunstig, men udokumentert).

## 4. RevenueCat-integrasjon

- **Wrapper:** `lib/billing/revenuecat.ts`. Entitlement-ID `'premium'` (linje 19). API-nøkler fra `VITE_REVENUECAT_PUBLIC_KEY_IOS/_ANDROID` (linje 21-22). Alt er hardt gatet på `Capacitor.isNativePlatform()` + konfigurert nøkkel — web/dev er no-op som returnerer false/null. Funksjoner: `initRevenueCat`, `checkPremium`, `getOfferings`, `purchasePackage` (matcher på package- ELLER product-identifier, linje 81-84; svelger userCancelled), `restorePurchases`.
- **Boot:** `main.tsx:35-44` — `initRevenueCat()` fire-and-forget, deretter `syncPremiumEntitlement()` uansett utfall.
- **Ferskhetskontroll:** `lib/premium/use-access.ts` er broen til UI. `createEntitlementFreshnessController` (linje 59-151) implementerer single-flight + generasjonsteller: på konfigurert native er effektiv tilgang ALLTID `{isPremium:false, loading:true}` mens oppslag pågår — en cachet Plus-verdi kan aldri åpne betalt innhold før butikken har svart (`resolveEffectiveAccess`, linje 171-183). Ved feil committes `false`. På web/dev leses mock-verdien rett fra subscription-store.
- **Resume-sync:** modulnivå-registrert `appStateChange`-lytter (native) eller `visibilitychange` (web) re-syncer entitlement (linje 197-217).
- **Cache:** `subscription-store.setPremium()` persisterer siste kjente verdi + `lastSyncedAt`. `App.tsx:270-278` rehydrerer storen ved `storage`-event på web (multi-tab).
- **Produkter:** `lib/premium/products.ts:23-27` — `no.klemeg.app.yearly/quarterly/monthly`, ankerpriser 299/99/39 NOK, entitlement «premium», offering «default», hero = årlig. **Stale kommentar:** `revenuecat.ts:7-13` advarer fortsatt om produkt-ID-mismatch (`babyora_*`), men `products.ts` ble alignet tilbake 2026-07-15 og bruker nå `no.klemeg.app.*`.

## 5. Hvor free/premium-grensen faktisk håndheves

**Lag 1 — hard paywall (primær håndheving):** `components/AppPaywallGate.tsx`, montert ÉN gang ovenpå hele tab-routingen (`App.tsx:760`). Ren beslutningsfunksjon `isHardPaywallDue` (`AppPaywallGate.tsx:76-85`) krever ALLE fem: (1) `HARD_PAYWALL_ENABLED` (eksportert bryter, `true`, linje 52), (2) onboarding fullført, (3) `firstRecommendationSeenAt !== null` — satt idempotent av HjemScreen når første anbefaling faktisk rendres (`HjemScreen.tsx:489-493`), (4) grace-vinduet stengt, (5) `!isPremium && !loading`. Gaten rendrer `PaywallDialog` med `dismissable={false}` — ESC/backdrop lukker aldri; dialogen forsvinner kun fordi isPremium faktisk endres (`PaywallDialog.tsx:845-871`), med 1800 ms latch så suksess-animasjonen får spille ferdig (`AppPaywallGate.tsx:50`).

**P9 «les ferdig»-vindu:** `recommendationGraceWindowActive` (`subscription-store.ts:113-123`) er sann hele økten som først viste anbefalingen — bevisst ALDRI persistert (`partialize`, linje 150-157). Stenges av (a) `consumeRecommendationGraceWindow()` når brukeren trykker «Planlegg»-fanen (`App.tsx:303-308`) eller (b) neste kalde app-start (veggen vises da direkte).

**Lag 2 — kapabilitetskontrakt:** `lib/access/capabilities.ts` (`decideAccess`, linje 57-64): loading → nekt nøytralt; ikke Plus → `reason:'expired'` + paywallTrigger; REQUIRES_AUTH (family_sharing, personal_calibration, smart_notifications) krever auth OVENPÅ Plus. `lib/premium/gating.ts` legger til leverbarhets-flagg: `resolveRuntimeCapabilityAccess` krever policy-tilgang OG `PLUS_FEATURE_AVAILABILITY[cap] === true` (`plus-features.ts:30-38` — family_sharing og personal_calibration er `false`/ikke bygget, og paywallen markedsfører dem derfor ikke). `resolvePlanningViewAccess` gir 'neutral'/'full'/'hidden' — ingen teaser-tilstand finnes lenger (`gating.ts:61-66`). Konsumenter: `App.tsx:246-264`, `UkeScreen.tsx:413-428`, `HjemScreen.tsx:397`, `InnstillingerScreen.tsx:1186`.

**Lag 3 — punktgating:** `isChildSwitchGated` (`gating.ts:105-112`): barn på indeks 0 og aktivt barn er aldri gatet («et aktivt barn låses aldri ut ved nedgradering»); brukt i `InnstillingerScreen.tsx:4177`. `VinterprogramScreen.tsx:99-100` åpner paywall for låste leksjoner. `useAccess()` er den eneste lovlige lesekontrakten for skjermer (`use-access.ts:20-21`).

## 6. Trial-logikk

Det finnes **ingen app-side trial-tilstandsmaskin.** 7 dagers gratis prøve er StoreKit intro-trial konfigurert i App Store Connect, ikke i kode — `trialDays: 7` på alle tre planer i `products.ts:47-71` er kun UI-signal («X dager gratis»-merke + pristransparens-tekst `priceTransparencyText`, linje 82-89). Eierbeslutning 2026-07-31: trial gjelder ALLE tre planer (`products.ts:15-20`). Rest av et eldre localStorage-trial-mock: `children-provider.tsx:92` fjerner legacy-nøkkelen `klemeg:trialStartedAt` ved resetAll, og `revenuecat.ts:5` omtaler fortsatt «localStorage-mock (trial-modus)» i en stale kommentar.

## 7. Paywall-triggere

Definert i `products.ts:104-110` (konstanter «for analytics-konsistens»): `imorgen`, `garderobe_tilpasning`, `barn_2`, `forste_vinter`, `snart`. Faktisk wiret i UI: kun **`forste_vinter`** (`VinterprogramScreen.tsx:139`) og **`barn_2`** (`InnstillingerScreen.tsx:2498`). Innstillingers Premium-CTA og auto-lokasjon-toggle bruker `trigger={null}` → logges som `'generic'` (`PaywallDialog.tsx:814`). Hard-gaten selv bruker også `trigger={null}` (`AppPaywallGate.tsx:116`). `imorgen`, `garderobe_tilpasning` og `snart` er definert men aldri sendt til en PaywallDialog — konsistent med hard-paywall-modellen der planvisninger er 'hidden' i stedet for teaser+paywall. Tidligere triggere bevisst droppet: søvn/TOG er sikkerhetsinnhold som aldri gates, morgenvarsel er gratis-kapabilitet (`products.ts:98-102`).

## 8. PostHog-analytics

`lib/analytics/track.ts` er «eneste lovlige event-overflate» (rå `posthog.capture` forbudt; flere testfiler regex-håndhever fravær av posthog/analytics i planning-moduler). Oppsett (`initAnalytics`, linje 102-125): dynamisk import av `posthog-js`, no-op uten `VITE_POSTHOG_KEY`, host default `https://eu.posthog.com`, `autocapture: false`, `capture_pageview: false`, session recording avslått, egen anonym distinct-id i `babyora:analytics:distinct_id` (crypto.randomUUID). Opt-out: `babyora:analytics:opt_out` + `opt_out_capturing()/reset()`. PII-vern: `sanitize()` dropper nøkler OG strengverdier som matcher `/(name|dob|birth|email|phone|lat|lon|location|child_?id)/i` (linje 47, 127-135).

**Deklarert vs. faktisk målt:** `TrackedEvent`-unionen (linje 21-45) deklarerer 20 eventtyper, men kun **5 fyres i produksjonskode**: `app_opened` (source alltid 'direct', `main.tsx:26`), `paywall_viewed` (`PaywallDialog.tsx:814`), `paywall_converted` (908/918), `trial_started` (909/919 — **kun for yearly**, selv om alle tre planer har trial), `material_preference_changed` (`MaterialPreferenceSheet.tsx:62`). Aldri fyrt: onboarding_step, rec_shown, garment_opened, guide_opened, feedback_given, notification_optin, widget_bridge_updated, garment_ownership_toggled, trial_converted, trial_expired, winback_shown/converted, engine_v2-eventene, situation_changed, material_alternative_opened. Konverteringstrakten kan altså i praksis bare måle paywall-visning → kjøpsklikk; trial-utfall og churn måles ikke.

## 9. Test-hooks

`?seed=demo` seeder demo-barn (children-provider) og setter `isPremium=true` som default; `?seed=demo&entitlement=none` gir eksplisitt ikke-abonnent for e2e av hard-gaten (`subscription-store.ts:37-61`). Web/dev uten RevenueCat: kjøpsknappen i PaywallDialog simulerer vellykket kjøp (`setPremium(true)`, `PaywallDialog.tsx:903-913`); restore gir dev-only-feilmelding.

## FAKTA
- Produktmodellen i kode er hard paywall, ikke free/Plus-nivåer: decideAccess() returnerer aldri 'free' og nekter alt uten isPlus (src/lib/access/capabilities.ts:57-64, kommentar linje 5-27)
- AppPaywallGate mountes én gang over hele tab-routingen (src/App.tsx:760) og blokkerer med ikke-avviselig PaywallDialog når 5 vilkår holder (isHardPaywallDue, src/components/AppPaywallGate.tsx:76-85); bryter HARD_PAYWALL_ENABLED=true (linje 52)
- firstRecommendationSeenAt settes idempotent av HjemScreen når første anbefaling rendres (src/screens/HjemScreen.tsx:489-493; src/state/subscription-store.ts:139-142)
- Grace-vinduet recommendationGraceWindowActive persisteres bevisst aldri (partialize, src/state/subscription-store.ts:150-157), avledes per boot fra rå localStorage-les før store-opprettelse (linje 95-97), og konsumeres ved trykk på Planlegg-fanen (src/App.tsx:307)
- RevenueCat: entitlement-ID 'premium' (src/lib/billing/revenuecat.ts:19), nøkler fra VITE_REVENUECAT_PUBLIC_KEY_IOS/_ANDROID (linje 21-22), all funksjonalitet gatet på Capacitor.isNativePlatform() (linje 34, 50, 62, 74, 100)
- use-access.ts: under pågående native entitlement-refresh er effektiv tilgang alltid {isPremium:false, loading:true} — cachet verdi kan aldri åpne betalt innhold (resolveEffectiveAccess, src/lib/premium/use-access.ts:171-183); single-flight + generasjonsteller (linje 59-151); resume-sync via appStateChange/visibilitychange (linje 197-217)
- Boot-rekkefølge: initAnalytics→app_opened, initRevenueCat→syncPremiumEntitlement (src/main.tsx:25-44)
- Produkter: no.klemeg.app.yearly/quarterly/monthly, anker 299/99/39 NOK, DEFAULT_PLAN='yearly' (src/lib/premium/products.ts:23-27, 47-74)
- Trial er StoreKit intro-trial konfigurert i App Store Connect; trialDays:7 på alle tre planer er kun UI-signal (src/lib/premium/products.ts:15-20, 47-71); ingen trial-tilstandsmaskin finnes i appen
- trial_started-event fyres kun når plan==='yearly' (src/components/PaywallDialog.tsx:909, 919) selv om alle tre planer har trial
- PAYWALL_TRIGGERS definerer 5 triggere (src/lib/premium/products.ts:104-110); kun forste_vinter (src/screens/VinterprogramScreen.tsx:139) og barn_2 (src/screens/InnstillingerScreen.tsx:2498) er wiret; Innstillingers Premium-CTA og AppPaywallGate bruker trigger=null → 'generic'
- isChildSwitchGated: barn indeks 0 og aktivt barn aldri gatet (src/lib/premium/gating.ts:105-112), brukt i InnstillingerScreen.tsx:4177
- PLUS_FEATURE_AVAILABILITY: family_sharing=false, personal_calibration=false (ikke bygget); today_home/future_plan/automatic_location/extra_children/soon_preparation=true (src/lib/premium/plus-features.ts:30-38)
- 9 zustand-stores; persisterte nøkler: babyora.subscription, babyora.theme, babyora.notifications, babyora.location-pref, babyora.refHour, babyora.scan-cache, babyora.ui; swap-override og outfit-selection er bevisst session-only
- Barn-profiler ligger i React Context med manuell localStorage (babyora:children:v2 / babyora:activeChildId:v2), ikke zustand (src/state/children-store.tsx:75-156)
- @capacitor/preferences er ikke en dependency og importeres ingen steder; localStorage-valget er eksplisitt begrunnet i src/state/scan-cache-store.ts:28-33 (synkron les før første render)
- GDPR-eksport/sletting matcher kun prefiksene 'babyora:' og 'klemeg:' (src/lib/gdpr/local-data.ts:19-24) — alle zustand-nøkler med punktum-prefiks (babyora.*) fanges ikke
- PostHog: dynamisk import, no-op uten VITE_POSTHOG_KEY, EU-host default, autocapture og session recording av, anonym distinct-id i babyora:analytics:distinct_id, opt-out-nøkkel babyora:analytics:opt_out, PII-regex-sanitering (src/lib/analytics/track.ts:47-135)
- Av 20 deklarerte eventtyper fyres kun 5 i produksjonskode: app_opened, paywall_viewed, paywall_converted, trial_started (kun yearly), material_preference_changed (grep uten __tests__: main.tsx:26, PaywallDialog.tsx:814/908-919, MaterialPreferenceSheet.tsx:62)
- ?seed=demo setter isPremium=true som default; ?seed=demo&entitlement=none gir ikke-abonnent for e2e (src/state/subscription-store.ts:37-61); web/dev-kjøp i PaywallDialog mocker suksess via setPremium(true) (src/components/PaywallDialog.tsx:903-913)
- App.tsx rehydrerer subscription-store ved cross-tab storage-event på web (src/App.tsx:270-278)
- ui-store.hasSeenOpeningEver er dødt felt uten konsumenter, bevisst beholdt (src/state/ui-store.ts:8-19)
- location-pref-store persisterer kun mode; automatiske koordinater er session-only med generasjonsteller (src/state/location-pref-store.ts, kommentar linje 1-6)
- Legacy-nøkkel klemeg:trialStartedAt fjernes i resetAll (src/state/children-provider.tsx:92) — rest av gammelt localStorage-trial-mock

## ANTAKELSER
- At RevenueCat/App Store Connect faktisk har entitlement 'premium', offering 'default' og produkt-IDene no.klemeg.app.* provisjonert som STATUS.md hevder — ikke verifiserbart fra kode
- At StoreKit intro-trial på 7 dager faktisk er konfigurert for alle tre planer i App Store Connect (koden viser bare UI-signalet trialDays)
- At VITE_POSTHOG_KEY og VITE_REVENUECAT_PUBLIC_KEY_* faktisk er satt i produksjonsbygg (Codemagic) — uten dem er både analytics og billing stille no-ops, og appen ville kjøre permanent i dev-mock (isPremium=false, kjøp umulig)
- At WebView-localStorage overlever OS-opprydding på iOS/Android i praksis (WKWebView kan tømme localStorage under lagringspress) — hele persistenslaget hviler på dette
- PaywallDialog er kun delvis lest (linje 780-960 av ~1000+); copy-detaljer i paywall-copy.ts (308 linjer) og copy-lint.ts er ikke gjennomgått linje for linje
- InnstillingerScreen (5400+ linjer) er kun lest punktvis rundt paywall/GDPR/barn-gating — andre premium-berøringer kan finnes der

## GJELD
- GDPR-prefiks-mismatch: 'Mine data'-eksport og 'Slett alt' dekker ikke zustand-nøklene babyora.* (punktum), nominatim:*, native-settings:* eller PostHogs egen localStorage — sletting er dermed ufullstendig målt mot PRIVACY-løftet i local-data.ts sin egen doc-kommentar
- trial_started fyres kun for yearly (PaywallDialog.tsx:909/919) mens products.ts (eierbeslutning 2026-07-31) sier trial gjelder alle tre planer — trial-funnelen undertelles for monthly/quarterly
- 15 av 20 deklarerte analytics-events fyres aldri (deriblant hele trial-/winback-livssyklusen og onboarding_step) — P10 §8-målingene eksisterer bare som typer
- Stale kommentarer i revenuecat.ts: produkt-ID-mismatch-advarselen (linje 7-13) og 'localStorage-mock (trial-modus)' (linje 5) beskriver en tilstand som ble rettet 2026-07-15 / fjernet
- Entitlement-sannheten er client-side only: web/dev-kjøpsmocken (setPremium(true)) og det persisterte babyora.subscription-feltet kan settes manuelt i localStorage; på web finnes ingen server-verifisering i det hele tatt (native re-verifiseres ved hver boot/resume)
- To state-paradigmer (Context+manuell localStorage for barn vs zustand/persist for alt annet) og tre nøkkelkonvensjoner (babyora:… , babyora.… , klemeg:-legacy) uten samlet nøkkelregister
- Død kode bevisst beholdt: ui-store.hasSeenOpeningEver/consumeOpeningBootSlot uten konsumenter; 'free' i AccessDecision-typen holdes i live kun av en låst planning-kontrakt
- 3 av 5 definerte paywall-triggere (imorgen, garderobe_tilpasning, snart) er aldri wiret til en dialog — analytics på 'hva utløste paywallen' er i praksis begrenset til generic/forste_vinter/barn_2
- eslint-regelen som skal forby rå posthog.capture utenfor track.ts er omtalt som 'legges til når eslint-config er aktiv' (track.ts:5-6) — håndheves i dag kun av spredte test-regexer
- Ingen Capacitor Preferences / native lagring: all brukerdata (inkl. barneprofiler og premium-cache) ligger i WebView-localStorage uten backup/sync; Supabase-sync er omtalt i kommentarer som 'senere' flere steder (feedback-store.ts, ownership.ts, children-store.tsx)