# Pakke-evidens: Motor V2-kjernen (engine-2-plan Task 1–12) — VERIFIED

**Fullført:** 2026-07-14 · **Range:** `b279053..6ad7583` (12 commits, én per task) · **Uavhengig dom: PASS** (fersk Fable-kontekst, alle kommandoer selvkjørt)

## Levert

| Task | Commit | Innhold |
|---|---|---|
| 1 | `4d0633d` | Domenekontrakter eksakt per design-spec §6–§12/§16 + typede feil + validering |
| 2 | `4ca3f17` | Aldersstadier (boundary begge sider) + frossen situasjonsmatrise (21 celler) |
| 3 | `52534e4` | Strukturert katalog (41 varianter), ullfri viabilitet per rolle×stadium, G34-vern |
| 4 | `fcf6e88` | ThermalIntent — kun behov+koder; terskler eksakt fra legacy (boundary-testet) |
| 5 | `e1fcc25` | Kalibrering ±1 på intent FØR plaggvalg (G30/G31, invariant 4) |
| 6 | `c311db3` | Materialpolicy (§8.1/§5-matrisen) + rolleavledning; avoid_wool hard |
| 7 | `027b48a` | Plagg-/utstyrsresolver; fottøy som to delslots m/ 9/15/16-mnd-reglene |
| 8 | `985540e` | Safety på typede plagg; portet copy byte-identisk (HB-9/HB-1/CK-9/SB-7/SB-8) |
| 9 | `4d6fd48` | Fingerprint (PII-fri per konstruksjon) + forklaringskoder i 5 språk |
| 10 | `9d3184c` | recommendV2() + alle 36 gullscenarioer + §8-invarianter (>500 kombinasjoner) |
| 11 | `4c34c55` | Legacy-adapter (ren mapping, 6 snapshots) |
| 12 | `6ad7583` | Feature-flags (alle false), shadow-sammenligning, rollback = containet legacy |

**Sluttall:** 208 V2-tester · 457 totalt · audit 19/19 · tsc/build/lint grønne.

## Dokumenterte spec-avvik (alle verifisert av dommer)

1. `CALIBRATION_WARMER/COOLER` lagt til ExplanationCode (krevd av plan Task 5).
2. `carrierUnderParentJacket` i input (G04/G05).
3. Resolver-sortering: varmeavstand prunes før materialrang (begrunnet + testet).
4. Nye sikkerhetsregler `HB-V2-*` med ny copy — **merket for fagpakken (Task 16)**.

## Dommerens P3-funn → oppfølging i Task 16–17

1. `shadow-compare.ts` bruker label-regex for regnbeskyttelse-klassifisering — flyttes til strukturelle felter (`intent.needsWaterproofShell`) før shadow-porten lener seg på den.
2. `HB-V2-POUCH` er uoppnåelig via egen pipeline (defensiv redundans) — skal ikke fremstilles som aktiv produksjonsregel i fagpakken.
3. V2-CK-9 er semantisk utvidet vs. legacy (fjerner alt ytterlag, ikke bare barnejakke) — eksplisitt rad i shadow-/faggjennomgangen.

## Gjenstående i engine-2-planen

Task 13 (profilmigrering) · 14 (analytics) · 15 (aldersadaptiv situasjons-UI — krever a11y-lead) · 16 (fagpakke-eksport, inkl. P3-punktene og alle HB-V2-tekster) · 17 (kohortaktivering — **blokkert på ekstern faglig signatur**, menneskelig gate). Visningsflagg forblir false; ingen skjerm konsumerer V2 (dommer-verifisert).
