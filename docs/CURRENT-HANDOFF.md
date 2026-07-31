# Current handoff

**Updated:** 2026-07-22
**Phase:** UX- og motionlæren er formalisert. Babyora-babyen er gjennomgående i onboarding, og Planlegg/Dagslinjen forblir en separat arbeidsstrøm.

## 2026-07-22: UX & Motion Bible godkjent

Eier klassifiserte den mottatte master-handoff-en som Babyoras **UX & Motion
Bible**. Den er lagret som `docs/BABYORA-UX-MOTION-BIBLE.md` og styrer ro,
forklarende bevegelse, signaturovergangen fra Antrekkskart til plaggliste og
avgrenset bruk av Higgsfield. Den erstatter ikke `AGENTS.md`,
`docs/CLAUDE-START-HERE.md`, beslutningsloggen, produktmodellen,
sikkerhetskravene eller godkjente planer.

## 2026-07-20: Én visuell figur gjennom hele onboardingen

Eier ba om å erstatte de gamle onboardingbildene og vurdere om
signaturanimasjonen kunne brukes på alle sidene. Den valgte løsningen beholder
Babyora-babyen gjennom steg 1–5, men spiller den fulle introduksjonsfilmen bare
én gang. Senere steg bruker det rolige sluttbildet med en kontekstmarkør for
fødselsdato, sted eller ferdig. Dette gir kontinuitet uten at bevegelsen starter
på nytt og konkurrerer med kalender, stedssøk og sammendrag.

De tidligere akvarellbildene er ikke lenger referert fra onboardingflyten.
Steg 2–4 bruker en kompakt 156 px figur, mens velkomststeget bruker en større
224 px variant. Videoens autoplay-, redusert-bevegelse- og fallbackkontrakt er
uendret.

**Verifisering før push:**

- `npm run lint`: PASS;
- `npm test`: 57 filer / 571 tester PASS;
- `npm run build`: PASS for hovedapp og bare-variant;
- `npm run e2e`: 5/5 PASS, inkludert at videoen ikke repeteres på senere steg.

Push til `origin/main` utløser `ios-internal` i `codemagic.yaml`, som bygger og
sender til TestFlight. Android-workflowen er fortsatt manuell etter gjeldende
repo-konfigurasjon.

## 2026-07-20: Babyora-baby implementert i første onboardingsteg

Eier godkjente implementering av den nye Babyora-babyen. Den er lagt inn kun
i første onboardingsteg som en 2,25 sekunders signatursekvens med ekte
`Babyora`-tekst over figuren. Videoen spiller én gang per onboardingøkt, uten
loop; redusert bevegelse, naturlig slutt, mediefeil og avvist autoplay ender på
det samme rolige WebP-stillbildet. `Fortsett` og `Hopp over` deler nå samme
overgangsfunksjon, så tilbake-navigasjon starter ikke videoen på nytt.

Den lokale onboarding-CSS-en fikk samtidig nødvendig selektorspesifisitet over
den globale `.app-shell > main > div`-regelen. Dette flyttet CTA-en fra utenfor
referansevisningen (`y=846`) til fullt synlig (`y=760`) ved 390 × 844.

**Verifisert kandidat:** `f15a43dd074ddb0b8d894eb9724803e8648fb1bd`

- uavhengig GSD-review: PASS, ingen gjenværende funn;
- `npm test`: 57 filer / 570 tester PASS;
- `npm run lint`: PASS;
- `npm run build`: PASS for hovedapp og bare-variant;
- `npm run e2e`: 5/5 PASS (CTA, begge tilbakeveier, naturlig slutt,
  avbrutt video og demo-appskall);
- ingen skjermbilder eller skjermvideo ble produsert fra appen.

Tre implementeringscommits er pushet til `origin/main`. Vercel mottok pushen,
men både automatisk deploy og én trygg redeploy sto fortsatt i ekstern
`Initializing`-kø uten bygglogg eller kjørte byggetrinn ved handoff. Den stabile
adressen er fortsatt `https://wool-app.vercel.app`; den oppdateres når Vercel
starter den køede produksjonsjobben. Ikke gjør flere redeploy-forsøk før køen
har fått tid til å drenere eller Vercel viser en konkret feil.

## 2026-07-19: Planlegg-retningen låst

Eier godkjente («Kjøper det») den read-only gjennomgangen av Planlegg. Den
låste retningen er **Dagslinjen**:

- én synlig `Planlegg`-tittel og kompakt barn-/stedskontekst;
- én behersket `I dag / Uke / Snart`-kontroll;
- ett dominant svar om hvor lenge antrekket gjelder og hva som skjer neste;
- én kontinuerlig, semantisk linje direkte på temperaturflaten;
- bare reelle antrekksendringer får markør;
- bare valgt markør utvides, med én handling, inntil tre plagg og tilgang til
  hele antrekket;
- ingen mega-card, repeterte hvite hendelseskort eller konkurrerende
  time-for-time-liste i hovedhierarkiet;
- eksisterende Morgennatt-designsystem beholdes og raffineres.

Før senere implementering må data-/handlingskontrakten rettes: fire samplede
tidspunkter kan ikke kalles «time for time» eller bevise «hele dagen»; `swap`
må skille av/på; og fremtidige rader må åpne sin egen dato/vær/aktivitet/
anbefaling. Døde sted-/varselkontroller skal ikke presenteres som funksjoner.

Detaljene og akseptansekriteriene er lagt inn i `DECISION-LOG.md` og Task 5 i
`docs/superpowers/plans/2026-07-13-babyora-ui-90-plus-plan.md`. Ingen appkode er
endret. Neste planleggingssteg er å lage og stressteste den låste skjermmodellen
visuelt før en separat implementeringspakke eventuelt godkjennes.

**GSD-/modellplan:** Den detaljerte implementerings- og verifikasjonsplanen er
`docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md`.
Den deler high-risk sannhet/fremtidskontekst/tilgang (Fable 5 Extra + separat
verifier) fra standard UI (Sonnet 5 High), bruker Codex som ekstern motleser og
krever GSD code review, verifier, UI-audit, UAT og 90+ evidens. Manifestet
`docs/gsd/planlegg-ingest.yml` er klart, men GSD-ingest er ikke kjørt fordi
workflowen krever en egen dokumentliste-/konfliktgodkjenning. Ingen kode er
autorisert eller endret.

## 2026-07-14: Første implementeringspakke FERDIG (R1→R2→R3)

Eier godkjente pakken eksplisitt («kjør»). Alle tre pakker er committet lokalt på main og uavhengig verifisert (se `docs/superpowers/evidence/packages/r1-r3-first-package.md`):

- **R1** `03b46f6` — fersk baseline (222+19 tester grønne, build grønn, lint-rød baseline dokumentert eksakt).
- **R2** `da217fb` — legacy safety containment: P0-gapet lukket. Én endelig sikkerhetsgrense (`src/lib/wool-layers/finalize-safety.ts`); overrides/kalibrering/session-swaps kan ikke lenger omgå HB/CK/SB-reglene. Guardrail-matrise G1–G12 (RED→GREEN), uavhengig fresh-context dom: PASS/SHIPPBAR. Trygg Motor V2-rollback = containet legacy-sti.
- **R3** `dfcc08c` — grønn plattform: lint 19→0 atferdsbevarende, CI-workflow (.github/workflows/ci.yml), E2E-røyktest (`npm run e2e`). Gate grønn på samme SHA.
- **Pakke-gate §6:** PASS fra ren checkout (alle tall reprodusert).

**Ikke pushet til origin** — venter på eierbeslutning (repo har Codemagic-kobling).

**R4 (2026-07-14):** Tre North-Star-prototyper bygget fra låst brief + ekte motor-fixtures (`docs/mocks/north-star/`, commit `c549d8a`). Fable-review + a11y-lead-verifisering utført, alle funn rettet. **Eier valgte retning B «Scenen»** (med C-listeanatomi i Antrekk) — se decision log. Fem-foreldre-testen gjenstår som evidens før R8/R12.

**R5/R6 Motor V2-kjernen (2026-07-14): Task 1–12 FERDIG og uavhengig verifisert (PASS).** Range `b279053..6ad7583`, 208 V2-tester/457 totalt, alle 36 gullscenarioer automatisert, flagg av, rollback = containet legacy. Evidens: `docs/superpowers/evidence/packages/motor-v2-core-tasks-1-12.md`.

**Task 13–16 FERDIG (2026-07-14 kveld):** profilmigrering (materialPreference, uendret lagringsnøkkel), PII-frie analytics-events (typenivå-bevist), fagpakke-eksport (`npm run engine:v2:review` — deterministisk, `docs/superpowers/evidence/engine-v2-scenarios.json` + expert-review.md, status IKKE SIGNERT), og situasjons-/materialkomponentene (a11y-lead-review fulgt; skjerm-wiring bevisst utsatt til R7 — dokumentert avvik). 478 tester grønne, E2E 2/2.

**Alt maskingjørbart i Motor V2 er nå levert.** Gjenstår i motoren: Task 17 kohortaktivering — **blokkert på ekstern faglig signatur av fagpakken**.

**R7 Task 1–2 FERDIG (2026-07-14 kveld):** sentralisert capability-kontrakt (`decideAccess` — lifetime fjernet fra PLAN_ORDER per låst beslutning, trust-copy oppdatert) + kanonisk `RecommendationView`/`AvatarStateKey` (R5-kontrakten: sittende 0–11/stående 12–24, tomt manifest → nøytral fallback til R8). 507 tester grønne. GitHub-webhook til Codemagic gjenopprettet (id 652768164).

**NESTE (porter oppdatert 2026-07-14 kveld):** Fem-foreldre-porten er **frafalt av eier** (se decision log) — R7 Task 3+ (dock, instrument, Hjem/Antrekk/Plan i retning B) er ikke lenger blokkert av den. R8 avatar-**kostnadsplanen er godkjent** («Kjør på»): Nano Banana Pro edit-chain, 24 komposittbilder, 2K standard, ~150–500 kr forventet. R8-genereringen forutsetter retning B-skjermene fra R7 Task 3+. Eneste gjenstående menneskeport: fagperson signerer `engine-v2-scenarios.json` (blokkerer kun Motor V2 Task 17 / kohortaktivering, ikke R7-fremdrift).

## 2026-07-15: Ny styringsprosess vedtatt (risikobasert plan→kode)

Eier godkjente `docs/PROSESS-PLAN-TIL-KODE.md` som gjeldende prosess. Fremover
velges **risikoløype** (lett/standard/høy) per oppgave, og kontrollmengden følger
risikoen. Høyrisikogatene (safety-motor, RLS/auth, betaling, migrering, PII,
avatar-sannhet) er uendret; lavrisiko-arbeid slipper unødig seremoni. Se
DECISION-LOG 2026-07-15. `AGENTS.md` peker nå på denne prosessen; den gamle
`verification-protocol.md` er merket SUPERSEDED (beholdt som referanse).

## 2026-07-15: R7 Task 7 kode-slices FERDIG (autonom loop)

Eier ba om autonom kjøring på dokumenterte defaults mens borte. Levert på lokal main (ikke pushet), hver bit verifisert (tsc, vitest, lint, e2e, build grønne før commit):

- `b27d92f` — morgenvarsel gjort gratis (fjernet Plus-gate i Innstillinger), generisk paywall reframet til «Fremover, overalt og sammen», død morgenvarsel-trigger fjernet.
- `7b684d5` — onboarding: paywall-teaser (gml. steg 6) fjernet så første ekte anbefaling vises FØR paywall; eksplisitt lokal-først-forklaring.
- `02f70e9` — Familie-rot IA-relabel (Profil→Barn, Abonnement→Babyora Pluss; «Vær & sted» beholdt for sannferdighet).
- `c6adda6` — care-circle dev-only preview (`CareCircle`, R9-gatet bak `import.meta.env.DEV`, tre-shakes ut av prod).
- `ca97be8` — paywall verdi-seksjon (`PlusExpansionPreview`) med sannferdig Free→Plus-ekspansjon; familie/kalibrering skjult til de er bygget (`plus-features.ts`).

564 tester grønne.

**Task 8 headless regresjonssjekk (2026-07-15):** `npm run audit:prepare` (Playwright headless, 390×844, dark, reduced-motion, mocket forecast) fanget **13/13 sider rent** etter alle Task 7-commits — onboarding, Hjem, Påkledning, Plan, Guide, Finn antrekk, Plaggbibliotek, Min garderobe, TOG, Varm/kald, Første vinter, Innstillinger og Betalingsvegg rendrer og navigerer uten feil. Sterk evidens for at Task 7-endringene ikke brøt noen side. Selve rubrikk-scoringen krever vision-LLM/eier-vurdering (owner-bucket).

**«Notification pre-prompt after value» er oppfylt:** varsel-tillatelse spørres kun ved aktiv toggle-handling (etter bruk), aldri kaldt ved oppstart; onboarding har ingen varsel-prompt (teaseren fjernet).

### Løst 2026-07-15 (eierbeslutninger)

- ~~Push~~ ✅ · ~~R8 avatar-generering~~ ✅ (24 kompositter) · ~~Offentlig navn~~ ✅ **Babyora beholdt** (naming-porten lukket) · ~~Fagsignatur som v1-blokker~~ → nedgradert til fast-follow via **veiledende-disclaimer** (v1 på dagens containede motor).
- **IAP app-side ferdig + verifisert** via dev/Playwright (`npm run e2e:purchase` 3/3). App Store Connect-stegene er turnkey i `docs/APP-STORE-IAP-SETUP.md`.

### ⚠️ VIKTIG: Apple/RC er allerede provisjonert (STATUS.md, juni 2026)

App Store Connect (App ID `6776416135`, bundle `no.klemeg.app` — IKKE endre),
3 IAP, RevenueCat (prosjekt `4bd62d97`, SDK-nøkler i `.env.local` + Codemagic)
og Codemagic er satt opp. `STATUS.md` er provisioning-sannheten. (Deler av denne
øktens tidligere anbefalinger antok feilaktig at dette måtte gjøres fra bunnen —
rettet i STORE-LISTING.md / APP-STORE-IAP-SETUP.md.)

### ⏳ Venter på eier

1. **Provisioning-profil (blokkerer TestFlight):** ASC-API-nøkkel `ryddy-asc-key` → App Manager-rolle (STATUS.md #2), så push → grønt bygg → TestFlight.
2. **Produkt-ID-mismatch (blokkerer ekte kjøp):** koden `babyora_*` ≠ provisjonert `no.klemeg.app.*`; prismodell divergerer (49/299/499 vs 39/99/299). Eierbeslutning på prismodell → så aligner jeg kode/store. Se `docs/APP-STORE-IAP-SETUP.md`.
3. **Apple-priser + localization per IAP** (STATUS.md #1).
4. **Personvernerklæring** publisert + App Privacy-skjema.
5. **Task 8 manuell evidens** — VoiceOver, haptikk, tekstskalering (enhet).
6. **Fagsignatur** (fast-follow) — låser Motor V2 + R8-visning. Ikke v1-blokker.

## Completed

- Product and architecture review.
- Screen-by-screen UX/UI analysis and interactive HTML report.
- 90+ design specification and visual-signature direction.
- Plans for Engine 2.0, UI, family sharing, personal calibration, notifications/widgets, and verification.
- Cost-free Instagram launch plan.
- Name exploration through Klarune and Vaerni; both are rejected and the public name is open.
- Protected-core logo concept and initial SVG/PNG assets.
- Private GitHub continuity workflow defined.
- Full re-analysis and prioritized action summary, including the constrained avatar production direction.
- Consolidated revision plan plus revised master, Motor V2, UI, family, calibration, notifications/widget, verification and governing design specifications.

## Not completed or not approved

- No public product name is approved. Vaerni is rejected.
- The logo symbol and wordmark are not final production identity assets.
- External professional review of safety-sensitive recommendation scenarios is outstanding.
- No implementation phase has been authorized by the repository setup itself.

## Repository baseline verification

Recorded during repository initialization on 2026-07-13:

- `npm test`: **passed** — 27 test files, 222 tests.
- `npm run audit:test`: **passed** — 6 test files, 19 tests.
- `npm run build`: **passed** — application and bare build completed.
- `npm run lint`: **failed on the existing baseline** — 17 errors and 2 warnings. No lint fixes were made because repository setup did not authorize code changes. The implementation plans require this baseline to be resolved as a separate behavior-preserving task.

## Next decision

Claude should first review `docs/superpowers/plans/2026-07-13-babyora-analysis-and-action-summary.md` and `docs/superpowers/plans/2026-07-13-babyora-consolidated-revision-plan.md`. Together they lock 0–24 months, legacy safety containment first, one avatar identity, sitting/standing poses, outermost visible garments only, 24 target composites, NOK 1,000 direct generation budget, the five-parent North-Star gate, and the required model/effort for every implementation package. This is still planning; no app-code implementation is authorized.

After that review, choose and explicitly approve the first implementation package. The recommended first code package remains fresh baseline verification, legacy safety containment, and a green working platform before recommendation-facing redesign.

## Opening from another device

1. Open the private GitHub repository.
2. In Claude, connect the repository and select the current default branch.
3. Ask Claude to read `AGENTS.md` and `docs/CLAUDE-START-HERE.md`.
4. Use the safe opening prompt in that file.
5. Start in planning/review mode. Do not begin coding until the first implementation package is explicitly approved.

---

# Superseding design handoff

For the current Hjem, scan, clothing-result and Planlegg direction, start with:

[`BABYORA-DESIGN-HANDOFF-2026-07-31.md`](BABYORA-DESIGN-HANDOFF-2026-07-31.md)

That document supersedes older visual decisions in this file where they conflict. Owner decisions 2026-07-31 (recorded in PRODUCT.md) additionally override the handoff on: commercial model (hard paywall, 7-day trial on all plans), navigation (3 tabs), theme (dark-first warm) and mascot production (style shootout before asset batch).
