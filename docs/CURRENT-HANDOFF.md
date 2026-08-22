# Current handoff

**Updated:** 2026-08-22
**Phase:** Product roadmap Phases 0 and 1 are closed. Phase 2 is active on `codex/phase-2/subscription-and-observability`. TASK-021 waits for owner-authenticated sandbox evidence; owner authorized independent local work, and TASK-022–024 are complete.

## 2026-08-22: TASK-024 complete truthful store offers

- The paywall reads the explicit RevenueCat default offering and renders the
  store's localized monthly and annual price strings. Its display lookup and
  purchase lookup use the same first matching monthly/annual package rule.
- Loading, incomplete offering, invalid price, SDK error, live offer, and
  explicit demo states are distinct. Outside exact `?seed=demo`, fallback
  anchor prices are hidden and the purchase controls remain disabled.
- Renewal and cancellation copy follows the selected live amount. A yearly
  monthly-equivalent comparison appears only when the store supplies a
  localized equivalent, so the UI does not invent misleading currency text.
- Verification passed 61/61 focused tests, full lint/typecheck/build, 217/217
  test files with 3,332 passing and 1 todo, and 4/4 browser purchase scenarios.
  Record: `docs/evidence/task-024-verification.md`. **Next local task:**
  TASK-025. TASK-021 remains open for owner sandbox evidence.

## 2026-08-22: TASK-023 complete first-value paywall gate

- The first recommendation timestamp persists, but the current-session grace
  flag has an explicit non-persisted contract. Blocked or corrupt browser
  storage fails open to another first-result session instead of crashing or
  showing a premature paywall.
- A locked Planlegg action cannot consume grace before a genuine result exists.
  After the result, both primary and programmatic Planlegg entry points close
  grace; a later action or the next app session can then open the hard paywall.
- Only the exact `?seed=demo` test URL can override the entitlement; unrelated
  query parameters cannot activate demo Premium state.
- Verification passed 33/33 focused tests, full lint/typecheck/build, 217/217
  test files with 3,327 passing and 1 todo, and 4/4 browser purchase-gate
  scenarios including session-one free reading and session-two paywall.
  Record: `docs/evidence/task-023-verification.md`. **Next local task:**
  TASK-024. TASK-021 remains open for owner sandbox evidence.

## 2026-08-22: TASK-022 complete typed purchase contract

- `purchasePlan` now returns one of six discriminated statuses: `success`,
  `cancelled`, `pending`, `unavailable`, `entitlement_missing`, or `error`.
  RevenueCat cancellation, payment-pending, operation-in-progress, and store
  availability codes map to explicit user-safe outcomes.
- A module-level in-flight guard rejects concurrent taps as
  `purchase_in_progress` before a second RevenueCat call starts, and releases
  after the first attempt settles. Paywall pending/cancellation states do not
  render as errors.
- Payment review removed raw RevenueCat error and `customerInfo` payloads from
  billing logs. Verification passed 23/23 adapter tests, 42/42 focused billing
  and Paywall tests, full lint/typecheck/build, 217/217 test files with 3,323
  passing and 1 todo, and 4/4 web purchase E2E scenarios. Record:
  `docs/evidence/task-022-verification.md`.
- The external Codex review process timed out after 94 seconds without a
  verdict; the recorded review is manual. **Next local task:** TASK-023. The
  TASK-021 RevenueCat sandbox gate remains open.

## 2026-08-22: TASK-021 local RevenueCat contract complete; sandbox gate open

- The adapter now exports and consistently uses entitlement `premium` and
  selects offering `default` from `offerings.all`; an unrelated targeted
  `current` offering cannot replace it.
- Purchases remain mapped only by RevenueCat package type: monthly and annual.
  No component selects a hard-coded store product ID.
- Focused adapter verification passed 17/17 tests, including missing-default
  fail-closed behavior. Full verification passed ESLint, main/bare builds, and
  217/217 test files with 3,316 passing and 1 todo. Record:
  `docs/evidence/revenuecat-config.md`.
- TASK-021 remains unchecked until an owner-authenticated native sandbox run
  returns both required package types with localized prices. No credentials or
  SDK-key values were inspected. **Next:** collect the four redacted evidence
  points listed in the record, then close TASK-021 and start TASK-022.

## 2026-08-22: TASK-020 complete core magic moment E2E

- `e2e/core-recommendation.spec.ts` drives the production build at a 390×844
  mobile viewport with reduced motion. It completes onboarding after denied
  geolocation, selects a manual Trondheim home, and reaches a numbered result.
- A separate consent flow grants automatic geolocation, reverse-geocodes
  Tromsø, verifies weather uses the automatic coordinates, and confirms those
  coordinates never enter persisted location state.
- Outdoor play, stroller, carrier, and indoor sleep each reach a complete
  canonical result. The 24 °C sleep case proves the safety finalizer replaces
  2.5 TOG with 0.5 TOG. A 503 weather response exposes retry and no false
  recommendation.
- The final recorded cached returning-user path completed in **404 ms**, below
  the 5,000 ms gate. Verification passed: core E2E 7/7, smoke E2E 2/2,
  217/217 test files with 3,313 passing and 1 todo, full lint, typecheck, and
  main+bare production build. Record: `docs/evidence/phase-1-verification.md`.
  **Next:** create `phase-2/subscription-and-observability` and start TASK-021.

## 2026-08-22: TASK-019 safety-finalized garment substitution

- Every factory-owned substitution is safety-finalized when generated and then
  finalized again from a private frozen request when the parent confirms it.
- The confirmation boundary accepts only the matching canonical base identity
  and exact registered option. Forged, stale, cross-session, or changed results
  fail closed before the selected outfit changes.
- Alternatives removed by a hard safety rule are not shown as actions. The
  affected garment row names the blocked preference and explains that the
  safety rules removed it. Canonical garment order remains unchanged.
- Verification passed: 116 focused tests, typecheck, focused and full lint,
  217/217 test files with 3,313 passing and 1 todo, main+bare build, and E2E
  2/2. Record: `docs/evidence/task-019-verification.md`. `FR-008` remains
  Partial only because the supported `KlePaaOverlay` route still lacks a
  user-facing undo/reset action. **Next:** TASK-020 verifies the complete core
  magic moment end to end.

## 2026-08-22: TASK-018 complete numbered outfit result

- The result keeps one inner-to-outer numbered garment list with category and
  body-role text. Garment images remain optional; failed images fall back
  without removing or reordering any text row.
- The result now labels its exact weather time and gives one short largest
  weather driver instead of an unranked list of conditions.
- The trusted outfit bundle carries a frozen presentation projection from the
  finalized recommendation. Visible safety notices render; flags explicitly
  hidden from sheets remain hidden.
- Current results older than one hour are labeled as previously calculated and
  show a stale status. An unavailable bundle shows one bounded recovery and no
  garment list, rationale, or partial result.
- Verification passed: 101 focused tests, typecheck, full lint, 217/217 test
  files with 3,310 passing and 1 todo, main+bare build, and E2E 2/2. Record:
  `docs/evidence/task-018-verification.md`. `FR-007` is now Verified.
  **Next:** TASK-019 safety-finalizes every garment substitution and explains
  blocked alternatives.

## 2026-08-22: TASK-017 fast Home input-to-answer interaction

- Home now exposes outdoor play, stroller, carrier, and indoor sleep in one
  accessible radio group. Arrow keys plus Home/End move selection, and every
  control retains at least a 44 px touch target.
- Indoor sleep has a visible 14–24 °C room-temperature control starting at
  18 °C. Its value, not outdoor MET temperature, drives the engine and scan
  identity; outdoor-only wind, rain, and weather symbols are excluded.
- The active child's rolling state reaches the canonical engine. Engine and
  post-swap contract failures render a bounded recovery with a profile action;
  no partial outfit is presented as complete.
- Verification passed: 75 focused interaction tests, 79 regression-contract
  tests, typecheck, full lint, 216/216 test files with 3,306 passing and 1 todo,
  main+bare build, and E2E 2/2. Record:
  `docs/evidence/task-017-verification.md`.
- `FR-004` and `FR-005` are now Verified. `FR-006` remains Partial only for
  localized message keys in rule output. **Next:** TASK-018 renders the complete
  numbered outfit, rationale, freshness, fallbacks, and error states.

## 2026-08-22: TASK-016 versioned Motor 2.0 safety register

- Motor 2.0 now resolves stable rule ID, severity, and source IDs from one
  immutable `v2.1.0` register. All ten rules explicitly declare that UI,
  preference, calibration, and feature flags cannot override them.
- The source register uses precise AAP, NHS, Lullaby Trust, Red Nose Australia,
  and NHTSA references. Exact Snudly temperature/time cutoffs remain visibly
  identified as product policy; policy alone is rejected as evidence.
- Rule-level NO, SE, and DK statuses are honestly `pending`. A typed production
  assertion rejects every country until each selected V2 rule is externally
  approved. This is separate from Norway's current contained-legacy gate.
- Verification passed: 10 direct register tests, 116 focused tests, typecheck,
  lint, 215/215 test files with 3,301 passing tests and 1 todo, main+bare build,
  and E2E 2/2. Record: `docs/evidence/task-016-verification.md`.
- No external clinical sign-off is claimed; the code now records and enforces
  that missing gate. **Next:** TASK-017 implements the fast Home input-to-answer
  interaction with all four explicit activity inputs and bounded engine errors.

## 2026-08-22: TASK-015 deterministic canonical engine

- Hjem, Juster, and Uke now calculate through one pure, versioned facade.
  It deliberately retains the contained legacy safety pipeline while Motor 2.0
  remains externally unreviewed and display-disabled.
- Sixteen named temperature fixtures freeze both sides of all eight band
  thresholds. Seven activity/context fixtures cover stroller awake/sleeping,
  carrier outside/under jacket, outdoor play, indoor sleep, and car seat.
- Every fixture is byte-identical across 25 repeated runs and leaves input
  unchanged. Source gates prevent the three production screens from importing
  the underlying engine directly.
- Verification passed: 27 direct boundary tests, typecheck, lint, 214/214 test
  files with 3,286 passing tests and 1 todo, main+bare build, and E2E 2/2.
  Record: `docs/evidence/task-015-verification.md`.
- `FR-005` remains Partial only because screens still collapse engine errors to
  `null` instead of a visible bounded recovery state. **Next:** TASK-016
  versions the safety-rule register, sources, non-override policy, and country
  review status.

## 2026-08-22: TASK-014 explicit activity input

- Motor 2.0 now accepts one discriminated public contract for stroller,
  carrier, outdoor play, and indoor sleep while preserving precise internal
  situations.
- Awake/sleeping stroller mode, carrier-under-jacket, and awake-stroller car
  seat context normalize explicitly. Impossible cross-activity fields fail at
  TypeScript and runtime boundaries.
- Stroller sleep stays outdoor and receives stroller weather/equipment logic;
  indoor sleep ignores wind/rain. Activity now appears in every V2 result and
  semantic fingerprint.
- Verification passed: 24 direct input tests, 275 focused tests, typecheck,
  lint, 213/213 test files with 3,259 passing tests and 1 todo, main+bare build,
  and E2E 2/2. Record: `docs/evidence/task-014-verification.md`.
- `FR-004` remains Conflicting until TASK-017 exposes all four choices in the
  production Home flow. **Next:** TASK-015 proves deterministic behavior at
  temperature and activity boundaries and selects the canonical engine path.

## 2026-08-22: TASK-013 MET forecast proxy contract

- Missing, blank, non-finite, and out-of-range coordinates now fail before
  cache or network access on both client and proxy boundaries.
- MET requests use an eight-second timeout and one jittered retry for transient
  network/502/503 failures. A 429 never loops and preserves bounded
  `Retry-After` metadata.
- Malformed JSON and structurally invalid forecasts are rejected before shared
  caching. All failures are no-store; fixed-home success remains shared-cache
  eligible and automatic-location traffic remains no-store end to end.
- Browser failures are now typed `ForecastClientError` values. The proxy has a
  server-safe parser and a contact-bearing Snudly identity with a server-only
  override.
- Verification passed: 112 focused tests, lint, 212/212 test files with 3,232
  passing tests and 1 todo, main+bare build, and E2E 2/2. Record:
  `docs/evidence/task-013-verification.md`. `FR-003` is now Verified.
  **Next:** TASK-014 makes the canonical recommendation input explicit across
  all activity contexts.

## 2026-08-22: TASK-012 privacy-bounded location

- Only location mode persists. Automatic coordinates, place labels, child
  scope, and request generations remain session-only and use memory-only
  weather/geocode clients.
- Hjem's scan cache and widget source now receive explicit cache scope.
  Automatic-location results cannot enter either persistent surface.
- Scan-cache version 1 purges all legacy coordinate slots because version 0
  could not distinguish fixed-home from automatic coordinates; its unrelated
  lifetime choreography flag survives migration.
- Verification passed: 133 focused tests, typecheck, full lint, 212/212 test
  files with 3,214 passing tests and 1 todo, main+bare build, and E2E 2/2.
  Record: `docs/evidence/task-012-verification.md`.
- `FR-002` is now Verified. `FR-009` remains Conflicting only because the
  fixed-home scan cache does not contain a renderable recommendation payload.
  **Next:** TASK-013 hardens the MET forecast proxy and typed failure behavior.

## 2026-08-22: TASK-011 local child-profile contract

- New profiles and edits now validate required fields and strict ISO birth
  dates before persistence; ages 0–24 are accepted and future/25+ dates show a
  plain-language boundary in onboarding and add-child.
- Hydration remains deliberately tolerant: known material-preference shapes
  migrate, corrupt entries recover without crashing, and older stored profiles
  are preserved rather than silently deleted.
- Provider mutations report rejection and avoid stale-list races. Invalid
  active IDs fall back safely, and storage failures do not crash the app.
- Verification passed: 27 focused tests, typecheck, focused lint, full
  regression suite, main+bare build, and 2/2 E2E scenarios. Record:
  `docs/evidence/task-011-verification.md`.
- `FR-001` remains Partial only because existing 25+ profiles are not yet
  excluded by every recommendation screen. **Next:** TASK-012 closes the
  automatic-location persistence leak without changing visual design.

## 2026-08-22: Phase 0 closeout

- Reproduced `npm ci`, Chromium installation, all 211 test files / 3,189
  passing tests, lint, main+bare build, and E2E 2/2.
- `e2e/smoke.ts` now permanently verifies Hjem → Planlegg → Familie → Hjem,
  including page titles, current-tab semantics, and visible screen markers.
- Accepted exceptions and Phase 1 blockers are recorded in
  `docs/evidence/phase-0-verification.md`; critical/high production dependency
  review is explicitly owned by TASK-052.
- The current source shell has three root tabs while the owner-selected live
  reference has four slots. TASK-011–016 can proceed; ask the owner before
  TASK-017 changes root navigation.
- **Next:** TASK-011 hardens the local child profile for ages 0–24 months.

## 2026-08-22: Country release gates

- Typed policy: `src/config/release-gates.ts`; contract tests:
  `src/config/release-gates.test.ts`.
- Norway is production-approved. Sweden and Denmark are controlled pilots with
  public release blocked while safety review is pending. Unknown country input
  fails closed to unavailable.
- Selected language is structurally independent from country status; choosing
  Norwegian, Swedish, Danish, English, or German cannot grant country access.
- Candidate `eb9abaf` passed final fresh Sonnet/high exact-commit review with no
  P0–P3 findings. Full gate: 211/211 test files, 3,189 tests, lint, main+bare
  build, and 2/2 E2E PASS.
- Verification record: `docs/evidence/task-009-verification.md`.
- **Next:** TASK-010 closes Phase 0 by reproducing the working shell and
  recording accepted exceptions and next-phase blockers.

## 2026-08-22: Runtime configuration inventory

- Safe template: `.env.example`; full responsibility/placement map:
  `docs/evidence/environment-inventory.md`; reproducible gate:
  `tools/verify-environment-inventory.mjs`.
- All 12 PRD variables have a reader/scope, sensitivity, environment, owner,
  current evidence status, and later console gate. No local or console secret
  value was read or recorded.
- Known gaps are assigned forward: Vercel domain plus MET identity to TASK-013;
  RevenueCat console mappings to TASK-021; PostHog before behavioral validation;
  Sentry after scrubbed implementation; Supabase remains deferred.
- Candidate `fb24caa` passed independent content/security review. Full gate:
  210/210 test files, 3,168 tests, lint, main+bare build, and 2/2 E2E PASS.
- Verification record: `docs/evidence/task-008-verification.md`.
- TASK-009 subsequently modeled Norway production and Sweden/Denmark pilots
  independently from selected language; see the current section above.

## 2026-08-22: Provisional Snudly Ro v0.1

- **Owner waiver:** after confirming TASK-006 required testing with five real
  dads, the owner explicitly decided to skip it. Record 0/5 participants and
  continue to TASK-008; never describe the visual direction as user-tested.
- Owner said “Kjør på” after the dad-test → visual language → design-system
  sequence was restated. TASK-007 was therefore completed without fabricating
  TASK-006 evidence; participant count remains 0/5.
- Machine source of truth: `docs/design.md`. Human visual mirror:
  `docs/design.html`. Both preserve the owner-supplied live result-first layout
  while keeping visual choices reversible.
- Live reference record: `docs/evidence/live-layout-audit.md` plus six captured
  light/dark screens. The live four-slot shell and local three-root-tab source
  divergence require owner confirmation before navigation implementation.
- Verified candidate: `b2aefbf`. Independent Sonnet/high exact-commit review:
  PASS with no P0–P3 findings. Full gate: 210/210 test files, 3,168 tests,
  lint, main+bare build, and 2/2 E2E scenarios PASS.
- Verification record: `docs/evidence/task-007-verification.md`. TASK-006 is
  closed only by owner waiver; visual choices stay reversible.
- Preserve the unrelated local loop/SN-007 changes already present in the
  worktree.

## 2026-08-19: Product roadmap execution

- Technical baseline: `docs/evidence/baseline.md`.
- PRD implementation coverage: `docs/evidence/implementation-matrix.md`.
- Prototype foundation inventory: `docs/evidence/prototype-inventory.md`.
- Open visual exploration brief: `docs/design-exploration.md`.
- TASK-004 verification: `docs/evidence/task-004-verification.md` against candidate `0d55118`.
- Three title-blind visual candidates: `docs/design-options.md` and `design-lab/task-005/`.
- TASK-005 verification: `docs/evidence/task-005-verification.md` against candidate `a632aa8`.
- **Historical human gate — WAIVED 2026-08-22:** TASK-006 would have required five real target dads. No responses were collected or inferred.
- Open source-of-truth conflict: `AGENTS.md` says Babyora and free today-at-home; the newer product documents say Snudly and specify a later-session core paywall. Do not implement identity or monetization changes until reconciled.
- **Owner layout decision (2026-08-19):** use the current live Snudly layout, information order, and four-tab structure as the base for the new TASK-007 design system. Colors, typography, spacing tokens, component styling, imagery, and motion treatment remain open. The three TASK-005 candidates are visual-language probes, not competing production page structures.
- Preserve the unrelated local loop/SN-007 changes already present in the worktree.

All entries below this point are dated history. When they conflict with the
2026-08-19 handoff above or `docs/CLAUDE-START-HERE.md`, they are not the current
instruction.

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

## Historical repository-initialization snapshot: completed (2026-07-13; superseded)

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

## Historical repository-initialization snapshot: not completed (2026-07-13; superseded)

- No public product name is approved. Vaerni is rejected.
- The logo symbol and wordmark are not final production identity assets.
- External professional review of safety-sensitive recommendation scenarios is outstanding.
- No implementation phase has been authorized by the repository setup itself.

## Historical repository baseline verification (2026-07-13; superseded)

Recorded during repository initialization on 2026-07-13:

- `npm test`: **passed** — 27 test files, 222 tests.
- `npm run audit:test`: **passed** — 6 test files, 19 tests.
- `npm run build`: **passed** — application and bare build completed.
- `npm run lint`: **failed on the existing baseline** — 17 errors and 2 warnings. No lint fixes were made because repository setup did not authorize code changes. The implementation plans require this baseline to be resolved as a separate behavior-preserving task.

## Historical next decision (2026-07-13; superseded)

Claude should first review `docs/superpowers/plans/2026-07-13-babyora-analysis-and-action-summary.md` and `docs/superpowers/plans/2026-07-13-babyora-consolidated-revision-plan.md`. Together they lock 0–24 months, legacy safety containment first, one avatar identity, sitting/standing poses, outermost visible garments only, 24 target composites, NOK 1,000 direct generation budget, the five-parent North-Star gate, and the required model/effort for every implementation package. This is still planning; no app-code implementation is authorized.

After that review, choose and explicitly approve the first implementation package. The recommended first code package remains fresh baseline verification, legacy safety containment, and a green working platform before recommendation-facing redesign.

## Opening from another device

1. Open the private GitHub repository.
2. In Claude, connect the repository and select the current default branch.
3. Ask Claude to read `AGENTS.md` and `docs/CLAUDE-START-HERE.md`.
4. Use the safe opening prompt in that file.
5. Start in planning/review mode. Do not begin coding until the first implementation package is explicitly approved.

---

# Historical design handoff (superseded by decisions dated 2026-08-14 and later)

For the current Hjem, scan, clothing-result and Planlegg direction, start with:

[`BABYORA-DESIGN-HANDOFF-2026-07-31.md`](BABYORA-DESIGN-HANDOFF-2026-07-31.md)

That document supersedes older visual decisions in this file where they conflict. Owner decisions 2026-07-31 (recorded in PRODUCT.md) additionally override the handoff on: commercial model (hard paywall, 7-day trial on all plans), navigation (3 tabs), theme (dark-first warm) and mascot production (style shootout before asset batch).
