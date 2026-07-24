---
phase: 01-planlegg-dagslinjen
artifact: validation-strategy
status: validated_autonomous_round_3
updated: 2026-07-24
plans_total: 18
plans_completed: 12
plans_remaining: 6
remaining_autonomous: true
---

# Phase 01 — autonom valideringsstrategi

## Gjeldende portstatus

- 01-01–01-12 er fullført historie. Planer, summaries, SHA-er og bevis derfra endres ikke.
- 01-13 er ikke lenger en menneskelig blokkering. 01-13–01-18 er `autonomous: true` uten menneskelig stopptask, eiergodkjenning, fagport eller manuelt gjenopptakssignal.
- Snart er nøytral historisk forberedelse. Helse, sikkerhet, kuldeeksponering, sol/UV, størrelse og passform er ute av scope.
- Formell personvernreview er utsatt. De tekniske session-only/no-URL/no-storage/no-log/no-analytics/no-backend/no-identitet/no-tidshistorikk-invariantene er automatiske capability-porter.
- `soon_preparation=false` til 01-16s eksakte aktiverte kandidat er grønn og dobbelt reviewet. `family_sharing=false` og `personal_calibration=false`.
- Ingen ny app screenshot/video/trace mens flaten endres. Fase 1 fullføres på deterministisk tekst/DOM/E2E; fysisk/visuell 90+ konvergens eies av fase 4 og er ikke en 01-13–01-18-port.
- Forventet ny kostnad er NOK 0. Ingen betalt fallback; en ny enkelt/aggregert forpliktelse over NOK 1 000 ligger utenfor det autonome løpet og pådras ikke.
- Plannerens samlede scope-warning for 01-13–01-18 er eksplisitt akseptert: de seks planene er cohesive vertikale slices, og executorbudsjettet holdes ved tre selvstendig verifiserbare tasks per plan og maksimalt fem paths per task.

## Sekvens og rollbackgrenser

| Plan | Ansvar | Må være sant ved utgang |
|---|---|---|
| 01-13 | Build-time generator, source/provenance, lisens, dekning, validator, datapakke | Byte-reproduserbar pack; hver kanoniske stedoppføring valid eller eksplisitt unavailable; review A+B PASS |
| 01-14 | Runtime decoder, D+28–D+42, Babyora-heuristikk, copy, ren modell | ready/empty/unavailable og alle terskelgrenser grønne; capability false; review A+B PASS |
| 01-15 | UI, session-only state, fast-hjem og access-first | Null advice før allowed; privacy source scan grønn; capability false; review A+B PASS |
| 01-16 | Capability + dynamisk privacy/access/E2E | Samme executor aktiverer, tester og committer før reviewer; begge PASS binder faktisk activated SHA; feil rollbacker false |
| 01-17 | Typed route-migrering | Guide/program→Snart uten replay; Min garderobe kun uroutbar, ikke bredt slettet; review A+B PASS |
| 01-18 | Native haptics, bottomnav, full integrasjon | Full no-media suite og final review A+B PASS på én tuple |

Avhengighetskjede: `01-12 → 01-13 → 01-14 → 01-15 → 01-16 → 01-17 → 01-18`.

## Immutable kandidat- og reviewprotokoll

Hver høyrisikoport bruker `scripts/snart/review-gate.ts candidate|receipt|validate` og nøyaktig tre planbundne filer:

```text
evidence/<plan>-candidate.json
evidence/<plan>-review-a.json
evidence/<plan>-review-b.json
```

Candidatefilen genereres fra faktisk repository- og commandevidence og binder:

```text
gitSha
treeSha
cleanCodeWorktree
contractSha256
packSha256
evidenceSha256
```

Krav:

1. Den aktive `gsd-executor` leser sin faktiske collaboration-gitte canonical task name/agent ID og bruker agent-ID-en som `implementerAgentId`. Ingen mid-plan handoff er nødvendig.
2. Etter immutable kandidatcommit kjører executoren `review-gate.ts candidate` med eksplisitte `--implementer-agent-id`/`--implementer-task-name` og identisk `executorIdentity` på stdin. Manglende/tomme/ulike felt er FAIL; verktøyet recomputer faktisk HEAD/tree/clean-state/contract/pack/evidence.
3. Executoren starter begge reviewer før venting med eksakte `collaboration.spawn_agent`-kall: lane A bruker `agent_type:"gsd-code-reviewer"`, lane B `agent_type:"gsd-security-auditor"`, begge `fork_turns:"none"` og unike `task_name:"snart_<plan>_review_<lane>_attempt_<N>"`. Den reviewer aldri eget arbeid.
4. Executoren bruker `collaboration.wait_agent`/`collaboration.list_agents`, tar canonical reviewer-ID-er fra toolresultatene og exact `FINAL_ANSWER` fra completion-eventene, og skriver først deretter A/B receipts med output/transcript SHA-256.
5. `validate` recomputer lokale hasher/digests og krever distinkte reviewer agent/task-ID-er, begge ulik `implementerAgentId`, samme final SHA/evidence og PASS uten blocker/high. Executoren reconciler receipts mot toolresultatene fra samme agenttur.
6. Receipts/hashes er uttrykkelig consistency-only og ikke kryptografisk autentisering av Codex-output. En ytre root-audit kan gjøres senere, men er ikke en nødvendig routing- eller completion-port.
7. Hvis executorens canonical identitet, `spawn_agent`, `wait_agent`, `list_agents`, tool-returned reviewer-ID eller `FINAL_ANSWER` mangler, feiler planen lukket. Kodeendring etter review ugyldiggjør SHA og krever to nye task names/reviewer.
8. Det tillates høyst tre komplette repair/review-forsøk. Uttømming gir `FAIL_REVIEW_CYCLES_EXHAUSTED`, capability false og teknisk FAIL uten menneskelig port.

Plan 01-16 reviewes på faktisk aktiverte bytes: executoren setter bare `soon_preparation=true`, kjører hele matrisen, committer final activated SHA og starter deretter begge reviewer. Ved FAIL rollbackes false før reparasjon; hver ny true-kandidat får ny SHA og nye reviewer. Ingen post-review flaggpatch er tillatt.

## Eksakt task-verifikasjonskart 01-13–01-18

| Task | Bevis | Automatisk kommando |
|---|---|---|
| `01-13-01` | Selvstendig GREEN kontrakt for source/HTTP/home-place/grid/tid/leap/femdagersvindu/rounding/alder/review og boundary-fixtures | `npx vitest run scripts/snart/__tests__/contract-fixtures.test.ts` |
| `01-13-02` | Sekvensiell builder, offline validator, 60-avledet canonical dekning, reproduserbarhet og unavailable-fail-closed | Plan 01-13 Task 2s eksakte `climate-pipeline` + fixture-validator-kommando |
| `01-13-03` | Live refresh, to byte-identiske bygg, pack/manifest og actual-HEAD reviewtuple | Plan 01-13 Task 3s eksakte reproduce→validate→`review-gate validate`-kommando |
| `01-14-01` | Strict packdecoder og 15 lokale datoer over DST | Plan 01-14 Task 1s data-validator + `snart-climate`/`snart-date-window`-tester |
| `01-14-02` | 0/5/10/16, 2/4, copy, dedupe og tre tilstander | Plan 01-14 Task 2s fem fokussuiter + typecheck |
| `01-14-03` | Ingen forbudte imports/identitetsfelt; full suite og to reviewer | Plan 01-14 Task 3s validator + full test/lint/build + `review-gate validate` |
| `01-15-01` | Uttømmende tilgjengelig renderer uten lokal modelllogikk | Plan 01-15 Task 1s copy/model/component-suite + lint |
| `01-15-02` | Access zero-call, session reset og privacy source scan | Plan 01-15 Task 2s session/privacy-suite + typecheck |
| `01-15-03` | Skjult Uke/access-wiring med capability fortsatt false og to reviewer | Plan 01-15 Task 3s fokussuiter + full test/lint/build + `review-gate validate` |
| `01-16-01` | Typed truthful paywall-trigger/copy mens alle capabilityflagg er false | Plan 01-16 Task 1s produkt-/paywalltester + build |
| `01-16-02` | False-state readiness; browser access, tilstander, privacy og regresjoner via eksplisitt test-only override | Plan 01-16 Task 2s availability-suite + `snart`, `automatic-location`, `exact-context`, `semantic-rail`, `composition`, `access` |
| `01-16-03` | Faktisk aktivert immutable SHA, to reviewer og fail-closed false rollback | Plan 01-16 Task 3s full suite + `snart` + `review-gate validate` |
| `01-17-01` | Felles typed App→Uke one-shot request uten replay | Plan 01-17 Task 1s interactiontest + typecheck |
| `01-17-02` | Kun uroutbar Min garderobe-gren fjernes | Plan 01-17 Task 2s route-suite + lint/build |
| `01-17-03` | Cross-root focus/no-replay og high-risk regresjoner med to reviewer | Plan 01-17 Task 3s route/exact/access/location/snart + `review-gate validate` |
| `01-18-01` | Native-only haptics, preference independence og web no-op | Plan 01-18 Task 1s interaction/haptics + typecheck |
| `01-18-02` | Fire-root, 44px, aria-current, focus-visible og forced colors | Plan 01-18 Task 2s nav/haptics/types + lint/build |
| `01-18-03` | Hele kandidaten, alle source scans, all E2E og to finalreviewer | Plan 01-18 Task 3s data-validator + full test/lint/build + `native-polish` + `all` + `review-gate validate` |

Alle `<verify>`-kommandoer i PLAN-filene er autoritative og skal kjøres byte-for-byte. Hurtigtester bruker committede fixtures og krever ikke live MET. Bare eksplisitt 01-13 data-refresh bruker nettverk.

## Browser-case-register

| Case | Eier | Scope |
|---|---|---|
| `harness` | 01-01 | Deterministisk boot/no-media |
| `location-containment` | 01-08 | Capability-off/manual zero-I/O |
| `exact-context` | 01-06 | Trusted future DTO |
| `semantic-rail` | 01-06 | ID-only rail og seks markører |
| `composition` | 01-07 | Planlegg state/scroll/a11y |
| `access` | 01-10 | Entitlement Free/loading/Plus/downgrade |
| `automatic-location` | 01-12 | Memory-only exact place/context |
| `snart` | 01-16 | Historikk, access, privacy, fast-hjem og tre modelltilstander |
| `route-migration` | 01-17 | Guide/program→Snart, focus og no-replay |
| `native-polish` | 01-18 | Bottomnav/motion/focus; ingen haptikk-call-count |
| `all` | 01-18 | Alle deterministiske cases uten media |

## Explicit no-media-port

- Forbudt i 01-13–01-18: app screenshots, video, Playwright trace og mediaorienterte `audit:prepare`/`audit:finalize`.
- Tillatt: DOM, computed style, geometry, overflow, keyboard, focus, semantics, storage-/URL-/transportspies og tekstlig command output.
- E2E-konfigurasjonen skal eksplisitt ha screenshot/video/trace av.
- `git status` og no-media scan skal bevise at ingen ny appmedia ble opprettet.
- Ingen plan trenger eiermedia- eller fysisk-enhet-godkjenning for å fullføres. Fase 4 kan senere verifisere fysisk haptikk, VoiceOver/TalkBack, appmedia og 90+ konvergens uten å omskrive Phase 1 til Pending.

## Source- og personvernsøk

Finale porter skal bevise:

- ingen runtimeimport av `scripts/snart`, THREDDS, Frost eller `fetch` fra Snart-domene/UI;
- ingen Snart-write til URL/query/hash/history, localStorage, sessionStorage, IndexedDB eller Cache API;
- ingen Snart-payload til logger, console, PostHog/analytics/tracing, beacon, XHR, fetch, API-route eller backend;
- ingen barn-ID, navn, rå fødselsdato eller brukerhandlingstidspunkt i Snart state/output/fixtures/review;
- ingen sol/UV, helse/sikkerhet, kuldeeksponering, størrelse/passform eller MET-endorsement i Snart-copy;
- ingen `navigator.vibrate`, browser-history-router eller unsupported family/calibration claim.

## Multi-Source Coverage Audit

| Source | ID/gruppe | Dekning | Plan | Status |
|---|---|---|---|---|
| GOAL | Phase 1 goal | Truthful Planlegg + capability-backed historisk Snart + exact context | 01-13–01-18 sammen med fullført 01-01–01-12 | COVERED |
| REQ | GOV-01, GOV-02, GOV-03 | Scope, planformat og frozen kontrakter | 01-13, 01-15, 01-18 + fullført historikk | COVERED |
| REQ | GOV-04, GOV-05, GOV-06 | Immutable slices, autonom repair og to fresh reviewer | Alle 01-13–01-18 | COVERED |
| REQ | TRUTH-01 | Historisk/datatruth uten motorendring | 01-13–01-14 | COVERED |
| REQ | CTXT-01 | Exact Outfit-context bevares | 01-17–01-18 regresjon + fullført 01-04–01-12 | COVERED |
| REQ | UI-01, UI-02 | Planlegg/Snart semantic composition | 01-15–01-18 + fullført 01-06–01-07 | COVERED |
| REQ | ACCESS-01 | Free/Plus/capability/fixed-home/session truth | 01-15–01-17 | COVERED |
| REQ | A11Y-01 | 44px, keyboard, focus, motion/haptics/nav | 01-15–01-16, 01-18 | COVERED |
| REQ | EVID-01, EVID-02 | No-media determinisme og exact-SHA review | 01-13–01-18 | COVERED |
| RESEARCH | seNorge build-time, provenance, lisens, schema/hash/dekning | 01-13 | COVERED |
| RESEARCH | D+28–D+42, derivation@1 og heuristics@1 | 01-14 | COVERED |
| RESEARCH | Session privacy, fixed-home, access-first | 01-15–01-16 | COVERED |
| RESEARCH | Capability, route, haptikk og final evidence | 01-16–01-18 | COVERED |
| CONTEXT | D-01–D-04 | Autonomi, historikk-not-forecast, build-time-only, ingen fabrikasjon | 01-13–01-18 | COVERED |
| CONTEXT | D-05–D-07 | Babyora-heuristikk, ingen health/solar/size, session-only privacy | 01-14–01-16 | COVERED |
| CONTEXT | D-08–D-12 | To reviewer, kostnad, capability/family/calibration, no-media | 01-13–01-18 | COVERED |

Auditresultat: ingen in-scope kildepost mangler. Den gamle manuelle approvaljournalen, formell privacyreview, appmedia og fysisk/90+ review er ekskludert av nyere eierbeslutning eller flyttet til fase 4, ikke stille utelatt.

## Faseparallelitet

- Phase 2 kan planlegges og kjøres parallelt med resterende Phase 1 i isolert worktree/branch.
- Phase 3 kan planlegge og bygge Living Home-/motion-grunnlag parallelt i en annen isolert worktree/branch.
- Home→Outfit-integrasjonen i Phase 3 må vente på et frosset Phase 2-interface for stabile garment IDs, anchor/body geometry, dressing order og navigation snapshot.
- Samme fil kan ikke eies av parallelle worktrees uten eksplisitt merge-order; Phase 1-planenes `files_modified` er canonical konfliktgrunnlag.

## Planner-konsistensport

Før execution:

- alle seks PLAN-filer validerer mot GSD frontmatter/structure;
- `autonomous: true` i 01-13–01-18;
- ingen menneskelig stopptask, manuelt gjenopptakssignal, eierapproval eller helse-/privacy-human-gate;
- waves er 13–18 og dependencies danner én acyklisk kjede;
- plan count er 18, completed er 12, remaining er 6 i ROADMAP;
- hver plan har requirements, must_haves, tasks, automated verify, threat model og rollback;
- ingen files_modified-overlap finnes i samme wave.

**Status 2026-07-24, autonomous revision round 3: PASS.** `frontmatter.validate --schema plan` og `verify.plan-structure` er grønne uten warnings for alle seks planene. Statisk konsistenssjekk bekrefter tre tasks per plan, maksimalt fem oppførte filer per task, komplett wave/dependency-kjede, ingen menneskelige porter, ingen package-install og ingen `files_modified`-konflikt i samme wave. Den aksepterte scope-warningen endrer derfor ikke executability. Stalesøk bekrefter at den tidligere sentrale reviewhandoffen og patch-after-review-modellen er fjernet; legitime UI-termer som cross-root/rootnav er beholdt. `git diff --check` er grønn for de reviderte planleggingsfilene.
