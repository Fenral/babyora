# F86 — Innholds-sporet til ferdig produkt: «Første vinter» + morgenvarsel + IG-motor

Mål (fra monetiseringsanalysen 2026-07-11): gjøre ekspertisen som ligger i
motoren om til **veiledning som rettferdiggjør Pluss-abonnementet** — den
dokumentert sterkeste betalingsdriveren i kategorien (Huckleberry/Nanit/Nørs+).
Tre arbeidsstrømmer + tverrgående paywall-kobling. Lansering-target:
**september-kuldeknekken** (betalingsviljen våkner med første kalde uke).

## Modellfordeling (per Sivert-regel 2026-07-11)

| Oppgave | Modell | Hvorfor |
|---|---|---|
| Denne planen, innholds-arkitektur, helsefaglig QA av alle leksjonstekster, paywall-copy, sluttreview | **Fable 5** (hovedloop) | Sannferdighet + smak endrer utfallet |
| Leksjons-UTKAST etter Fable-outline (8 stk), UI-implementering etter detaljert spec, F82-repo-mekanikk, render/verify-scripts, Reels-opptak | **Sonnet** (subagenter) | Mekanisk gitt god spec |
| Drip-logikk + LocalNotifications-finpuss HVIS det viser seg subtilt | **Opus** (kun ved behov) | Native-integrasjon med kanttilfeller |
| a11y pre-clearance + post-sweep per UI-endring | accessibility-lead (fast) | Utenfor tieringen |

## W1 — «Første vinter med baby»: 8-ukers program i Pluss

### Produktform
- Ny seksjon i **Guide-hub**: «Første vinter» (kort med program-cover + progresjon «Uke 3 av 8»).
- 8 leksjoner, én per uke, hver 2–3 min lesing: tittel + lead + 3–4 korte
  seksjoner + én «Prøv selv»-CTA som peker på relevant app-flate (kalkulatoren,
  Varm/kald, garderoben). Ingen quiz — ikke skole, men helsesøster-tone.
- **Drip:** leksjon N låses opp N−1 uker etter at brukeren starter programmet
  (start-dato i localStorage `babyora:vinterprogram:start`). Alle tidligere
  leksjoner forblir åpne. Ukentlig lokal-notifikasjon «Ny leksjon» (fase 2 —
  MVP uten).
- **Gating:** Pluss via useAccess. **Leksjon 1 gratis** (smakebit — modell (b),
  samme teaser-mønster som «i morgen» på Uke). Sikkerhets-KJERNEN
  (sjekk-nakken, overoppheting) finnes allerede gratis i Varm/kald-skjermen —
  programmet er pedagogisk fordypning, aldri gate på sikkerhet
  (copy-lint + F81-regelen står).

### Leksjonsplan (innholds-outline — Fable skriver/QA-er, Sonnet drafter)
1. **Ull mot huden** — hvorfor ull regulerer temperatur og fukt (F62-research + garment-info som kilde)
2. **Lag-på-lag-logikken** — innerst/mellom/ytterst, motorens egen modell forklart
3. **Vindeffekten** — hvorfor «føles som» styrer anbefalingen (feels-like-formelen i menneskespråk)
4. **Vogn, bæresele eller utelek** — aktivitet = varmeproduksjon (motorens aktivitets-logikk)
5. **Sjekk nakken** — rutinen som overstyrer alle regler (fordypning av gratis-innholdet)
6. **Søvn ute i vogn** — vinterversjonen (varmepose/TOG-trinn, sikkerhets-grenser)
7. **Frost-spesialen** — −10° og kaldere: balaklava, isolert dress, tidsbegrensning
8. **Din garderobe = din anbefaling** — garderobe-tilpasning i praksis (konverterer til aktiv Pluss-bruk)

### Teknisk
- `src/data/vinterprogram.ts` — statisk innholdsfil (LESSONS: id, week, title,
  lead, sections[], ctaTarget). Norsk, lintCopy på alt.
- `src/screens/VinterprogramScreen.tsx` (oversikt m/progresjon) +
  leksjonsvisning (gjenbruk PlaggDetailSheet-designspråket: kategori-farge,
  fakta-kort, hero).
- GuideHubScreen: nytt kort (Pluss-chip når ikke-Premium, teaser åpner leksjon 1).
- Ny paywall-trigger `forste_vinter` i products.ts + TRIGGER_HEADLINE
  («Lær vinterpåkledning — én leksjon i uka»).
- a11y-lead pre-clearance FØR bygging (ny navigasjonsflate + gating-mønster).

### Bilder (svar på bildespørsmålet)
- **MVP: 0 nye bilder.** Leksjons-heroer komponeres av eksisterende assets:
  clay-garments (62), avatar-stages, vær-ikoner (weather-3d). Godt nok til
  lansering.
- **Polish (💰 krever ja — over 100 kr-cap):** 8 leksjons-heroer + 1
  program-cover i clay-stil via Nano Banana ≈ 9 × ~30 kr ≈ **~270 kr**.
  Prompt-mønsteret fra F80a-batchen gjenbrukes (magenta-key-pipeline).
  Anbefaling: kjør MVP først, generer polish-batch når innholdet er låst.
- App Store: +1 screenshot av programmet når bygget (render — gratis).

## W2 — Morgenvarsel som flaggskip (infrastruktur FINNES — skjerping, ikke nybygg)

Status verifisert 2026-07-11: `src/lib/notifications/morning-notification.ts`
(LocalNotifications-scheduling), tidspunkt-modal i Innstillinger, Pluss-gating
— alt bygget i F81. Gjenstår:
1. **Varsel-teksten** gjøres levende: i dag statisk — bør si «God morgen — se
   hva {navn} skal ha på i dag» (navn fra children-store ved scheduling).
   Innholdsrik push (faktisk anbefaling i teksten) krever backend/cron — IKKE
   nå (fase 3+, egen beslutning).
2. **Paywall-kommunikasjon lades mot flaggskipet:** PaywallDialog-hero +
   onboarding-teaser omskrives så morgenvarsel er førstelinje-verdien
   («Våkn opp til ferdig antrekk»-vinkelen finnes i TRIGGER_HEADLINE — løftes
   til generisk headline). Fable skriver copy, Sonnet implementerer.
3. **Verifisering på ekte enhet** (TestFlight — avhenger av cert-revoke/Apple-
   innlogging fra Sivert): fyrer varselet 06:45, åpner det Hjem, respekteres
   tidspunkt-valget.

## W3 — Dagens antrekk-IG (F82) + Reels: aktivering

- Pipeline 90 % bygget (daily.mjs, template, captions, dry-run-modus).
- **Sivert-blokkere (eneste gjenstående):** (1) IG-brukernavn + konvertere til
  Business/Creator + koble FB-side, (2) være innlogget på
  developers.facebook.com + github.com i Playwright-økt for token/secrets,
  (3) PAT m/workflow-scope så ci/daily-post.yml kan flyttes til
  .github/workflows/.
- Deretter: 7 dagers dry-run → Sivert ser kortene → «slå på» → auto-post 06:45.
- **Reels (F82.7):** takeover-animasjonen (naken→kledd) tas opp via Playwright
  (430×932) → ffmpeg → 9:16 → 2–3 evergreen-reels. Ingen nye bilder —
  animasjonen ER innholdet. Sonnet-jobb etter ferdig oppskrift.

## W4 — Tverrgående paywall/onboarding-kobling

- Onboarding-teaser-slide: nevn morgenvarsel + Første vinter (de to
  «grunnene til Pluss i september»).
- «I morgen»-teaser på Uke: uendret (finnes).
- App Store-tekst/screenshots: «Første vinter»-screenshot + morgenvarsel-
  utheving når W1/W2 er ferdig.

## Rekkefølge + estimat (AI-tid; kalendertid avhenger av Sivert-blokkere)

| Fase | Hva | Estimat | Avhengighet |
|---|---|---|---|
| 0 | Plan-godkjenning + 💰-bildebeslutning | — | Sivert |
| 1 | W2 morgenvarsel-skjerping (navn i varsel + paywall-copy) | ~1 t | ingen |
| 2 | W1 innhold: Fable-outline → Sonnet-utkast → Fable-QA (8 leksjoner) | ~2–3 t | ingen |
| 3 | W1 UI: a11y-preclearance → VinterprogramScreen + Guide-kort + drip + gating → verify | ~3–4 t | fase 2 |
| 4 | W3: IG-aktivering + Reels | ~1–2 t | Sivert-steg (IG/token) |
| 5 | Polish: Nano Banana-heroer (hvis ja) + App Store-screenshot + TestFlight | ~1 t + 💰~270 kr | fase 3, Apple-innlogging |

Alt bygges på `mock/takeover-preview` → Sivert ser på Vercel → merge til main
ved go (som F83–F85).
