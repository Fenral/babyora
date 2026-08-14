# Babyora lansering — full status

> **Autoritativt: se «Avstemming SN-003 (2026-08-14)» rett under.**
> Snapshotet nedenfor stammer fra 2026-06-04 og er ikke redigert; det er
> bevart som historisk kilde. Hver hovedpåstand er merket VERIFISERT eller
> ANTAKELSE i avstemmingsseksjonen med kilde eller grunn.

---

## Avstemming SN-003 (2026-08-14)

**Kilder som eier sannheten:** koden i klonen (`capacitor.config.ts`,
`codemagic.yaml`, `src/lib/premium/products.ts`, `src/lib/billing/revenuecat.ts`,
`.env.example`, `NEXT-STEPS.md`, `docs/APP-STORE-IAP-SETUP.md`,
`docs/CURRENT-HANDOFF.md`), og loggen `loop/LEDGER.md`. Numeriske IDer i
App Store Connect, Play Console, RevenueCat, ASC-API-nøkler og Codemagic
kan ikke verifiseres fra denne klonen; de er derfor merket ANTAKELSE med
mindre koden refererer dem eksplisitt. C4 forbyr konsollhandling fra
byggeren, så konsollverifikasjon er eiers ansvar (se merknader nederst).

Alle datoer under er skrevet 2026-08-14 (dagens dato per CLAUDE.md-kontekst).
Loop-tidsstempler i LEDGER skal være UTC. To kommandoer er i bruk:
`date -u +%Y-%m-%dT%H:%M:%SZ` (unix) og
`(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (PowerShell).
Flere LEDGER-linjer oppgir eksplisitt hvilken kommando de brukte; andre
oppgir det ikke, uten at det er endret retroaktivt. Linjene
`loop/LEDGER.md:10-11, 13-14, 18` bruker `07:30Z`, `08:30Z`, `08:35Z` som er
lokal CEST-veggklokke (UTC+2 sommertid) med feilaktig `Z`-suffiks; deres
faktiske UTC-tider er ikke verifisert. Feilklassifiseringen er dokumentert i
`loop/LEDGER.md:19`; historiske linjer beholdes urørt («Kun tillegg. Ingen
redigering av gamle linjer.», `loop/LEDGER.md:3`).

**Linjenumre nedenfor er nåværende STATUS.md-linjer** (snapshotet starter på
`STATUS.md:126` med `> Live-oppdatert 2026-06-04`). Snapshotet er ikke
redigert; det er skjøvet ned av denne avstemmings-seksjonen.

**Diff-scope (samlet SN-003, alle commits på tvers av f1 og f2):**
`STATUS.md` + `loop/ARBEIDSLISTE-SNUDLY.md` + `loop/LEDGER.md` +
`loop/BATON.md` + `loop/requests/SN-003-*.md` + `loop/verdicts/SN-003-*.md` +
`loop/ESKALERING-SN-003.md`. Ingen annen produksjonskode eller docs berøres.
Fordelingen mellom commits står i den respektive requesten (se f2-requestens
G5-seksjon for f47ef40..92c1263 material + 3 admin-commits + f2-commiten).
`loop/SELVSJEKK-BYGGER.md` (eiers §2b-tillegg), `loop/notater/SN-005-
kartlegging.md` og snapshotfilene under
`src/lib/{clothing-engine-v2,wool-layers}/__tests__/__snapshots__/` (CRLF)
holdes utenfor alle SN-003-commits.

### Kode- og konfigurasjonsforankrede påstander

| # | Påstand (nåværende STATUS.md-linjer) | Status | Kilde |
|---|---|---|---|
| 1 | `no.klemeg.app` som bundle-id / appId (STATUS.md:131, 260, 273) | VERIFISERT | `capacitor.config.ts:9` (`appId: 'no.klemeg.app'`) |
| 2 | App-navn `Babyora` (STATUS.md:1, 133, 190–192) | VERIFISERT som gjeldende kode-tilstand | `capacitor.config.ts:10` (`appName: 'Babyora'`). Merk: SN-011 skal endre visningsnavnet til «Snudly»; bundle-id og produkt-IDer forblir. |
| 3 | Apple IAP-IDer `no.klemeg.app.{monthly,quarterly,yearly}` (STATUS.md:135–137, 265–267) | VERIFISERT | `src/lib/premium/products.ts:24-26` (`PRODUCT_IDS`) |
| 4 | RevenueCat SDK env-navn `VITE_REVENUECAT_PUBLIC_KEY_IOS/ANDROID` (koblet fra SDK-nøkler STATUS.md:172–173) | VERIFISERT | `.env.example:8-9` (`VITE_REVENUECAT_PUBLIC_KEY_IOS/ANDROID`), `src/lib/billing/revenuecat.ts:14-15`, `codemagic.yaml:30,73,243`. Snapshotet ramser opp nøkkelverdiene, ikke env-navnene; kildesannheten ligger i `.env.example` og `revenuecat.ts`. |
| 5a | `codemagic.yaml` refererer env-gruppa `klemeg_revenuecat` (STATUS.md:175, 180, 288) | VERIFISERT | `codemagic.yaml:30,243` (`klemeg_revenuecat` som `groups`-oppføring; nøklenavnene i kommentar). |
| 5b | Env-gruppa `klemeg_revenuecat` inneholder faktisk RC-nøklene i Codemagic-konsollen | ANTAKELSE | Gruppens innhold ligger i Codemagic-konsollen; ikke verifiserbart fra klonen (C4). |
| 6 | `codemagic.yaml` peker til `ryddy-asc-key` (ID `JQVPW4D944`) (STATUS.md:179, 289) | VERIFISERT | `codemagic.yaml:19` (`ryddy-asc-key # eksisterende key (JQVPW4D944), brukt av Ryddy/StrikeArc`), også `:168` |
| 7a | `babyora_premium_{monthly,quarterly,yearly}` er skriftlig kanonisk Play-navngiving i klonen (STATUS.md:161–163, 242–244) | VERIFISERT | `NEXT-STEPS.md:69-71`, `RELEASE.md:70,74-75,81`, `README.md:57-59`, `tools/play/play-setup.ts:56-58`, `scripts/bootstrap-revenuecat.mjs:105`. |
| 7b | `babyora_premium_*` faktisk opprettet i Play Console | ANTAKELSE | Konsollopprettelse er SN-072 (EIER, irreversibel). Ikke verifiserbart fra klonen (C4). |
| 8a | Skriftlig avviklings-beslutning for `klemeg_premium_*` (STATUS.md:158–164 selv-erklærer avviklingen) | VERIFISERT | `NEXT-STEPS.md:69-71`, `RELEASE.md:70,74-75,81`, `README.md:57-59`, `tools/play/play-setup.ts:56-58`, `scripts/bootstrap-revenuecat.mjs:105`. Beslutningen er dokumentert i klonen. |
| 8b | `babyora_premium_{monthly,quarterly,yearly}` er skriftlig kanonisk Play-navngiving som skal opprettes | VERIFISERT | Samme kilder som 8a: `NEXT-STEPS.md:69-71`, `RELEASE.md:70,74-75,81`, `README.md:57-59`, `tools/play/play-setup.ts:56-58`, `scripts/bootstrap-revenuecat.mjs:105`. Overlappende med rad 7a for skriftlig kanonisk navn; 8b uttaler seg om erstatningen for `klemeg_premium_*`. |
| 8c | `klemeg_premium_*` finnes ikke i Play Console (fravær bekreftet) | ANTAKELSE | Konsollfravær ikke verifiserbart fra klonen (C4). Kryssrefereres til K13. Faktisk RevenueCat-rekobling er SN-073 (EIER). |
| 9a | Skriftlig konklusjon om provisioning-feil: `ryddy-asc-key` har rolle Developer og trenger App Manager (STATUS.md:203) | VERIFISERT | `docs/APP-STORE-IAP-SETUP.md:19`, `docs/APP-STORE-ASC-CHECKLIST.md:8,17`, `docs/CURRENT-HANDOFF.md:168` — alle sier det samme skriftlig. |
| 9b | Faktisk API-key-rolle i Apple-konsollen | ANTAKELSE | Konsoll-rolle er ikke verifiserbar fra klonen (C4). Retting krever eier-handling i App Store Connect Team-settings. |
| 10a | Kode-tilstand: `trialDays: 7` på alle tre planer (monthly, quarterly, yearly) | VERIFISERT | `src/lib/premium/products.ts:53,61,69` — `trialDays: 7` per plan. |
| 10b | Snapshot-tekst STATUS.md:246: «Årsplanen får Offer → Free trial · 7 dager» begrenser trial til årsplanen | VERIFISERT | Direkte lesing av STATUS.md:246 (bekreftet 2026-08-14). Motstriden mot 10a er dokumentert i E3-tabellen; eierbeslutning 2026-07-31 (SN-008 harmoniserer kode, kommentarer og paywall-tekst). |

### Konsoll-forankrede påstander (ikke verifiserbare fra klonen)

Alle numeriske IDer i denne blokka er merket ANTAKELSE. Årsak: de finnes
bare i menneskeskrevne notater i dette repoet (STATUS.md, NEXT-STEPS.md,
docs/APP-STORE-*.md) fra 2026-06-04-sessionen, og C4 forbyr konsollhandling
fra byggeren for verifikasjon.

| # | Påstand | Status | Grunn |
|---|---|---|---|
| K1 | App Store Connect App ID `6776416135` | ANTAKELSE | Kun i egne notater (STATUS.md:132,190; NEXT-STEPS-APPLE-REVENUECAT.md; docs/APP-STORE-IAP-SETUP.md; docs/CURRENT-HANDOFF.md). Ingen konsoll-eksport i git. |
| K2 | Subscription Group ID `22131969` (STATUS.md:133, 264) | ANTAKELSE | Samme som K1. |
| K3 | IAP Sub IDer `6776416692` / `6776418068` / `6776417937` (STATUS.md:135–137, 265–267) | ANTAKELSE | Samme som K1. |
| K4 | ASC API Key ID `6KCX7DK2XF`, Issuer `202e9a0f-…` (STATUS.md:138) | ANTAKELSE | Samme som K1. Kobling til `.p8`-fil (K5) ikke verifisert. |
| K5 | `.p8`-fil på `C:\Users\SkotvoldSivertSende\.playwright-mcp\…` (STATUS.md:139, 269) | ANTAKELSE (utenfor klon) | Filsti på annen brukers hjemmemappe (denne klonen er på `C:\Users\siver\…`). Kan ikke verifiseres. |
| K6 | Play App ID `4973788330869295535`, package `no.klemeg.app` (STATUS.md:142) | ANTAKELSE | Samme som K1. Package-navnet stemmer med bundle-id (verifisert 1), men konsoll-tilstedeværelsen er ikke. |
| K7 | Play service account `ryddy-revenuecat@ryddy-play-api.iam.gserviceaccount.com` med Admin (13) (STATUS.md:143, 274) | ANTAKELSE | Samme som K1. |
| K8 | RevenueCat Project ID `4bd62d97`, Entitlement `entlf724c435c8`, Apple App `appcdc2cd86b2`, Play App `app820dc1a429`, Offering `ofrngceba064bd5`, per-produkt IDer (STATUS.md:146–149, 154–156, 166, 278–280) | ANTAKELSE | Samme som K1. RevenueCat-kall skjer fra native app via SDK; ingen konsoll-eksport i git. |
| K9a | Historisk snapshot inneholder RC SDK-nøkler i klartekst (STATUS.md:172–173, 283–284) | VERIFISERT | Direkte lesing av STATUS.md:172–173 og :283–284 (bekreftet 2026-08-14). |
| K9b | Klartekst-verdiene er fortsatt gyldige nøkler i RevenueCat-konsollen | ANTAKELSE | Konsollverifikasjon utenfor klonen (C4). Denne avstemmingen refererer ikke selve verdiene — G7 er global og gjelder også SN-003. Retting av snapshot-klartekst er avhengig av SN-030 (native byggekonfig) og eier-rotasjon i RevenueCat-konsollen. F1s påstand «G7 gjelder ikke SN-003» er trukket tilbake. |
| K10 | Codemagic App ID `6a217a089f41293842acfade`, wool-app (STATUS.md:178) | ANTAKELSE | Samme som K1. `codemagic.yaml` finnes (verifisert), men konsoll-App-ID er ikke. |
| K11 | Apple pris + localization ikke satt (STATUS.md:184–194) | ANTAKELSE | Samme som K1. Blir SN-061 (EIER). |
| K12 | Første Codemagic-build feilet med provisioning-feil (STATUS.md:196–203) | ANTAKELSE med skriftlig beskrivelse | Feilmeldingen som er beskrevet i STATUS.md:200 er sannsynlig, men build-tilstanden i dag (2026-08-14, ~2 mnd etter 2026-06-04 per snapshotets datering STATUS.md:126) er ikke re-verifisert. Blokker for SN-054 (EIER, TestFlight-beta). |
| K13 | Play Console subscriptions ikke opprettet (STATUS.md:232–234, bekreftet 2026-08-08) | ANTAKELSE med skriftlig bekreftelse | Bekreftelsesteksten dateres 2026-08-08 — konsistent med SN-072 (EIER, irreversibel opprettelse). |
| K14 | `.env.local` inneholder begge SDK-nøklene (STATUS.md:174 påstår dette) | ANTAKELSE (gitignored — innhold ikke verifiserbart fra klonen) | `.gitignore:13` (mønsteret `*.local`) ekskluderer `.env*.local`, så filen er ikke i git og innholdet kan ikke verifiseres av byggeren. Env-navnene som *skal* ligge der er verifiserte i `.env.example:8-9`; hvorvidt eiers lokale fil faktisk inneholder verdiene er utenfor scope. |
| K15 | Apple Team-ID `PL9G26C26C` (STATUS.md:259) | ANTAKELSE | Kun i egne notater (STATUS.md og `codemagic.yaml`-integrasjon). `codemagic.yaml` refererer ikke Team-ID-en som streng; bare via `ryddy-asc-key`-integrasjonen (VERIFISERT som referanse i rad 6). Konsoll-verifikasjon eies av eier. |
| K16 | Play service-account JSON-sti `C:\Users\SkotvoldSivertSende\.ryddy-secrets\play-api-service-account.json` (STATUS.md:275) | ANTAKELSE (utenfor klon) | Filsti på annen brukers hjemmemappe (denne klonen er `C:\Users\siver\…`). Filen er ikke i git (hemmelighet) og kan ikke verifiseres; kryssrefereres til K5 og E3-motstriden om `wool-app`-stien. |
| K17 | «16 / 16 må passere. Koden er trygg — det er kun store-konfig som krever oppgradering nå.» (STATUS.md:301) | ANTAKELSE (foreldet 2026-06-04) | Utsagnet er datert `Autonom session 2026-06-04` (STATUS.md:305) og er ikke re-verifisert som operasjonell konklusjon. G1–G4 er grønne 2026-08-14 (se f2-request), men «kun store-konfig gjenstår» motstrider `loop/ARBEIDSLISTE-SNUDLY.md` (45+ oppgaver) og dead-command `scripts/e2e-flows.mjs` behandles begge i E3-tabellen. |
| K18a | IAP-capability aktivert på Apple-identifier (STATUS.md:131) | ANTAKELSE | Apple Developer-konsollstatus; ikke verifiserbar fra klonen (C4). Bundle-id `no.klemeg.app` selv er verifisert i rad 1. |
| K18b | Subscription Group-navnet «Babyora Premium» i Apple (STATUS.md:133) | ANTAKELSE | App Store Connect-konsollstatus; ikke verifiserbar fra klonen (C4). Group-ID er dekket av K2. |
| K18c | Play-app-klassifiseringen «Norwegian default, Free + IAP» (STATUS.md:142) | ANTAKELSE | Play Console-konsollstatus; ikke verifiserbar fra klonen (C4). Package-navnet stemmer med bundle-id (rad 1); klassifisering og Play App ID (K6) er ikke. |
| K18d | RC-koblingsstatus «koblet med Key ID + Issuer + .p8» / «koblet med play-api-service-account.json» (STATUS.md:148–149) | ANTAKELSE | RevenueCat-konsollstatus; ikke verifiserbar fra klonen (C4). Kryssrefereres til K4, K5, K7 og K16. |
| K18e | RC package-navn + mappinger `$rc_monthly`/`$rc_three_month`/`$rc_annual` mot Apple/Play-produkter (STATUS.md:166–169) | ANTAKELSE | RevenueCat-konsollstatus; ikke verifiserbar fra klonen (C4). RC-projekt/entitlement/offering-IDer selv er dekket av K8. |

### Feilfakta og motstrid (E3)

| Sted | Problem |
|---|---|
| STATUS.md:150 (`✅ 6 Products … alle linket til premium-entitlement`) vs merknad STATUS.md:158–164 | Selvmotsigelse innenfor dokumentet: Play-kolonnen «peker på produkter som ikke finnes». Grønn hake er materiell feil; Play-siden er ikke fullført før SN-072/SN-073 er avklart. |
| STATUS.md:128 (`## 🟢 100 % ferdig`) vs seksjon `🟡 Pending — krever Sivert` (STATUS.md:182+) | Overskriften er misvisende. «100 %» refererer bare til blokka umiddelbart under, men leseren tar det som statusflagg for hele appen. Loopens arbeidsliste dokumenterer 45+ gjenstående oppgaver (`loop/ARBEIDSLISTE-SNUDLY.md`). |
| STATUS.md:298 (`node scripts/e2e-flows.mjs` … «16 / 16 må passere») | Filen finnes ikke: `ls scripts/e2e-flows.mjs` → «No such file or directory». Seksjonen «Hvis noe brekker» er død kode. Riktig fallback for byggeren er `npm run lint && npx tsc --noEmit && npm test && npm run build` (G1–G4). |
| STATUS.md:296 (`cd C:\Users\SkotvoldSivertSende\wool-app`) | Klonen er nå på `C:\Users\siver\Documents\Snudly-bygg\snudly` (env-kontekst per CLAUDE-oppdrag). Sti er utdatert. |
| STATUS.md:126 (`Live-oppdatert 2026-06-04`) og STATUS.md:305 («95 % … bare cert/profile + Apple-priser igjen») | Fem påstander som er blitt utdatert eller motstridende siden 2026-06-04: RevenueCat-mismatch avklart i SN-002, prøveperiode utvidet til 3 planer 2026-07-31, Snudly-omdøping vedtatt 2026-08-14 (SN-005/SN-011), Play-produkter navngivet om (`babyora_premium_*`, SN-072), og SN-073 må rekoble RevenueCat. «95 %» er ikke lenger sant. |
| Bundle Explorer / Play-tilstand pr 2026-08-08 (STATUS.md:232–234) | Denne merknaden ble skrevet før SN-002. Konsistent med SN-071/SN-072-avhengighet, men bør re-verifiseres av eier ved SN-071. Utenfor SN-003s scope. |
| RevenueCat-tabellen (STATUS.md:154–156) peker Play-kolonnen på `klemeg_premium_*` med `prod…`-IDer | Rekobling er SN-073 (EIER). Tabellen er teknisk sann for RevenueCat’s nåværende Play-App-oppsett (per notat), men peker på ikke-eksisterende Play-produkter (K13). Skal ikke re-brukes som fasit. |
| Snudly vs Babyora som offentlig navn | `docs/DECISION-LOG.md:215-217` (2026-07-15) sier «Offentlig navn: Babyora — naming-porten lukket». Nyere versjonerte eierkilder overstyrer: `loop/referanse/SNUDLY-LANSERINGSPLAN-V2.md:21` («Snudly besluttet av eier 13. august — uregistrert i repoet») og `:31` («Snudly-byttet skjer utelukkende i visningsnavn, butikktekst og UI; bundle-id `no.klemeg.app` og Apple produkt-IDene endres aldri»), `loop/referanse/SNUDLY-DESIGNSYSTEM.md` («Navnebytte Babyora → Snudly er gjennomført i mocken», gjelder fra 13.08.2026), `loop/ARBEIDSLISTE-SNUDLY.md:21` (SN-005 «Registrer eierbeslutningene, Snudly-navnet»), samt byggegrenen `snudly/bygg`. SN-003 registrerer motstriden; harmonisering av `docs/DECISION-LOG.md` er SN-005s scope. |
| Trial-modell: kode vs snapshot-tekst | `src/lib/premium/products.ts:53,61,69` gir `trialDays: 7` på alle tre planer (monthly, quarterly, yearly), mens snapshotet STATUS.md:246 sier «Årsplanen får Offer → Free trial · 7 dager» og begrenser trial til årsplanen. Eierbeslutning 2026-07-31 utvidet til alle tre; SN-008 harmoniserer kode-kommentarer og paywall-tekst. Rader 10a/10b klassifiserer hver av de to påstandene som VERIFISERT; motstriden dokumenteres her. |

### Konklusjon

- Alt kode- og konfigurasjonsforankret (bundle-id, Apple IAP-IDer, Codemagic-referanser, env-navn) er VERIFISERT mot klonen på dagens dato.
- Alt konsoll-forankret (numeriske IDer i Apple, Play, RevenueCat, Codemagic; ASC API-key-detaljer; `.p8`-fil på annen maskin; SDK-nøkler i klartekst; `.env.local`; Apple Team-ID; JSON-sti) er ANTAKELSE og eies av eier for konsollverifikasjon. Ingen av dem er endret eller berørt av SN-003.
- Seks klare feilfakta / motstrid: (a) grønn 6-produkt-hake for Play, (b) misvisende «100 %»-overskrift, (c) død kommando `scripts/e2e-flows.mjs`, (d) foreldet «95 %-ferdig»-signatur, (e) Snudly vs Babyora offentlig navn (SN-005 harmoniserer), (f) trial-modell kode vs snapshot-tekst (SN-008 harmoniserer).
- SN-003 endrer ikke selve snapshotet; det ligger uendret nedenfor for sporing. Autoritativ status for hver enkelt påstand er tabellene over.
- Naturlige oppfølginger utenfor SN-003s scope: SN-004 (`NEXT-STEPS-APPLE-REVENUECAT.md` og `docs/APP-STORE-IAP-SETUP.md` skal avstemmes tilsvarende), SN-005 (DECISION-LOG dokumenterer Snudly-navnet og loop-mandatet; harmoniserer motstriden mot `docs/DECISION-LOG.md:215-217`), SN-008 (prøveperiode-konsistens), SN-030 (RC-nøkler ut av klartekst inn i native byggekonfig), SN-072/SN-073 (Play-siden).

---

> Live-oppdatert 2026-06-04. Etter MCP Playwright-orkestrert setup.

## 🟢 100 % ferdig

### App Store Connect (Apple)
- ✅ Identifier `no.klemeg.app` med IAP-capability
- ✅ App-record: **App ID 6776416135** — `https://appstoreconnect.apple.com/apps/6776416135`
- ✅ Subscription Group "Babyora Premium" — Group ID **22131969**
- ✅ 3 IAP-records:
  - Monthly — Sub ID **6776416692** — `no.klemeg.app.monthly`
  - Quarterly — Sub ID **6776418068** — `no.klemeg.app.quarterly`
  - Yearly — Sub ID **6776417937** — `no.klemeg.app.yearly`
- ✅ In-App Purchase Key: **`6KCX7DK2XF`**, Issuer `202e9a0f-dbfc-44d6-b1b6-03510e4cb1a2`
- ✅ `.p8`-fil: `C:\Users\SkotvoldSivertSende\.playwright-mcp\SubscriptionKey_6KCX7DK2XF.p8`

### Play Console (Google)
- ✅ App: **App ID 4973788330869295535** — `no.klemeg.app`, Norwegian default, Free + IAP
- ✅ Service account `ryddy-revenuecat@ryddy-play-api.iam.gserviceaccount.com` har Admin (13) på Babyora

### RevenueCat
- ✅ Project ID **`4bd62d97`** — `https://app.revenuecat.com/projects/4bd62d97/overview`
- ✅ Entitlement **`premium`** (display "Premium") — ID `entlf724c435c8`
- ✅ Apple App: **`appcdc2cd86b2`** koblet med Key ID + Issuer + .p8
- ✅ Play App: **`app820dc1a429`** koblet med play-api-service-account.json
- ✅ 6 Products (3 Apple + 3 Play) — alle linket til premium-entitlement:

| Periode | Apple Product | Play Product |
|---|---|---|
| Monthly | `no.klemeg.app.monthly` (`prod4a4785aa4f`) | `klemeg_premium_monthly:p1m` (`prod1d0afec4d3`) |
| Quarterly | `no.klemeg.app.quarterly` (`prod7f42136454`) | `klemeg_premium_quarterly:p3m` (`prod22782eec69`) |
| Yearly | `no.klemeg.app.yearly` (`prod75f5cfc880`) | `klemeg_premium_yearly:p1y` (`prodcde25eb3d9`) |

> ⚠ **Play-kolonnen peker på produkter som ikke finnes.** Verifisert i Play
> Console 2026-08-08: kontoen har null abonnementer og null engangsprodukter
> på app `4973788330869295535`. De tre `klemeg_premium_*` ble aldri
> opprettet. Kanonisk navngivning er nå `babyora_premium_monthly`,
> `babyora_premium_quarterly` og `babyora_premium_yearly` (base plans
> `p1m` / `p3m` / `p1y`) — se `NEXT-STEPS.md`. RevenueCat-produktene over må
> byttes ut når Play-produktene finnes.

- ✅ Offering **`default`** (ID `ofrngceba064bd5`) med 3 packages:
  - `$rc_monthly` — Babyora Premium 1 måned — Apple monthly + Play monthly
  - `$rc_three_month` — Babyora Premium 3 måneder (pappaperm) — Apple quarterly + Play quarterly
  - `$rc_annual` — Babyora Premium 1 år — Apple yearly + Play yearly

### RevenueCat SDK keys
- ✅ iOS: **`appl_xAZkuUdfAeDblrIKQtxaikahaTV`**
- ✅ Android: **`goog_AtbkBuzzCfptBzovCOxDOpHIDvY`**
- ✅ Begge i `.env.local`
- ✅ Begge i Codemagic env-gruppe `klemeg_revenuecat`

### Codemagic
- ✅ wool-app lagt til (App ID **`6a217a089f41293842acfade`**)
- ✅ codemagic.yaml peker til `ryddy-asc-key` (ID `JQVPW4D944`) for ASC integration
- ✅ env-gruppe `klemeg_revenuecat` med begge RC-keys

## 🟡 Pending — krever Sivert

### 1. Apple pris + localization per IAP (~20 min)

Du må gjøre dette manuelt i App Store Connect:

| IAP | Pris (NOK) | Norwegian Display Name | URL |
|---|---|---|---|
| Monthly | 39 NOK | Babyora Premium | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776416692 |
| Quarterly | 99 NOK | Babyora Premium — 3 måneder (pappaperm) | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776418068 |
| Yearly | 299 NOK | Babyora Premium — 1 år | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776417937 |

Pluss Review Information per IAP (screenshot + notes for Apple-reviewers).

### 2. iOS provisioning profile (CRITICAL — blocks build)

Første Codemagic-build feilet:
```
No matching profiles found for bundle identifier "no.klemeg.app" and distribution type "app_store"
```

**Trolig årsak:** `ryddy-asc-key` (Apple API key brukt av Codemagic) har "Developer"-rolle, men trenger "App Manager" for å auto-generere distribution provisioning profile.

**Fix-valg:**

**A) Generer ny ASC API-key med App Manager-rolle:**
1. https://appstoreconnect.apple.com/access/integrations/api/team
2. Klikk + → Name `Codemagic Babyora`, Access `App Manager`
3. Download `.p8`
4. Codemagic UI: Team settings → Integrations → Developer Portal → Add another key
5. Endre `codemagic.yaml`-referansen til ny key-navn

**B) Manuel provisioning profile via Apple Developer Portal:**
1. https://developer.apple.com/account/resources/profiles/list
2. + → App Store distribution → Bundle ID `no.klemeg.app` → Certificate → Name `Babyora App Store`
3. Last ned `.mobileprovision`
4. Codemagic: legg opp som manual signing identity

### 3. Codemagic re-build

Etter profile er fikset:
- Push noe til main → auto-trigger
- Eller: Start manual build via Codemagic UI

Build-link: https://codemagic.io/app/6a217a089f41293842acfade

### 4. Play Console subscriptions (~30 min)

Krever at .aab er uploaded først (vil skje ved første grønne Codemagic build, eller manuelt).

Bekreftet 2026-08-08: Bundle Explorer er tom, og Play viser bare «Upload a
new APK» på Subscriptions-siden. Ingen «Create subscription»-knapp før
.aab-en er oppe.

Når .aab er på Play Internal:
1. https://play.google.com/console/u/0/developers/6701736013891341719/app/4973788330869295535/subscriptions
2. Create subscription × 3:

| Product ID | Base plan ID | Pris (NOK) | Periode | Navn (no-NO) |
|---|---|---|---|---|
| `babyora_premium_monthly` | `p1m` | 39 | 1 måned | Babyora Pluss |
| `babyora_premium_quarterly` | `p3m` | 99 | 3 måneder | Babyora Pluss 3 mnd |
| `babyora_premium_yearly` | `p1y` | 299 | 1 år | Babyora Pluss 1 år |

Årsplanen får Offer → Free trial · 7 dager.

### 5. Marketing-assets

- Privacy policy + ToS (Vercel-side)
- App Store-skjermbilder (6.5"/6.7"/6.9" iPhone)
- Play Store-skjermbilder (telefon)
- App-beskrivelse (norsk + engelsk)
- App-ikon + splash: `npx capacitor-assets generate` etter `resources/icon.png` (1024×1024)

## 📋 IDer samlet

```
Apple Team:           PL9G26C26C
Bundle ID:            no.klemeg.app

App Store Connect:
  App ID:             6776416135
  Subscription Group: 22131969
  IAP Monthly:        6776416692 (no.klemeg.app.monthly)
  IAP Quarterly:      6776418068 (no.klemeg.app.quarterly)
  IAP Yearly:         6776417937 (no.klemeg.app.yearly)
  ASC API Key:        6KCX7DK2XF (Issuer 202e9a0f-dbfc-44d6-b1b6-03510e4cb1a2)
  .p8 file:           C:\Users\SkotvoldSivertSende\.playwright-mcp\SubscriptionKey_6KCX7DK2XF.p8

Play Console:
  App ID:             4973788330869295535
  Package:            no.klemeg.app
  Service Account:    ryddy-revenuecat@ryddy-play-api.iam.gserviceaccount.com (Admin)
  JSON:               C:\Users\SkotvoldSivertSende\.ryddy-secrets\play-api-service-account.json

RevenueCat:
  Project ID:         4bd62d97
  Entitlement:        entlf724c435c8 (premium)
  Apple App:          appcdc2cd86b2
  Play App:           app820dc1a429
  Offering:           ofrngceba064bd5 (default)
  iOS SDK key:        appl_xAZkuUdfAeDblrIKQtxaikahaTV
  Android SDK key:    goog_AtbkBuzzCfptBzovCOxDOpHIDvY

Codemagic:
  App ID:             6a217a089f41293842acfade
  Env-group:          klemeg_revenuecat
  ASC integration:    ryddy-asc-key (JQVPW4D944) — TRENGER OPPGRADERING til App Manager
  First build:        FAILED på provisioning (se Fix #2 over)
```

## 🚨 Hvis noe brekker

```bash
cd C:\Users\SkotvoldSivertSende\wool-app
npm run dev &
node scripts/e2e-flows.mjs
```

16 / 16 må passere. Koden er trygg — det er kun store-konfig som krever oppgradering nå.

---

*Autonom session 2026-06-04. 95% av all konfigurasjon ferdig — bare cert/profile + Apple-priser igjen.*
