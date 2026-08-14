# SN-007 · Syntese · dom over tre grener mot Snudly-mocken

**Baseline:** origin/main `7108499`
**Grener dømt:**
- `feat/hjem-list-detail-sheet` — tupp `216518b`, 40 commits over main, 316 filer, +23591/-4610
- `feat/kontekstvalg-hjem` — tupp `9e89b24`, 35 commits over main, 281 filer, +21557/-4537
- `agent/babyora-polish-slide` — tupp `9a72e9b`, 23 commits over main, 249 filer, +17345/-4290

**W-GREN-agenter:** tre uavhengige Explore-kontrollører, ingen så hverandres arbeid. Evidens per gren:
- `loop/evidens/SN-007/gren-feat-hjem-list-detail-sheet.md`
- `loop/evidens/SN-007/gren-feat-kontekstvalg-hjem.md`
- `loop/evidens/SN-007/gren-agent-babyora-polish-slide.md`

**Kontrollørens etterprøving:** commit-mengdene er kaskadete, ikke overlappende alternativer.
`agent/babyora-polish-slide` ⊂ `feat/kontekstvalg-hjem` ⊂ `feat/hjem-list-detail-sheet`. Verifisert
med `comm` på `git log --oneline origin/main..origin/<br>`: A\B=0, A\C=0, B\C=0, B\A=12, C\(A∪B)=5.
Det betyr at avgjørelsen ikke er «velg én gren», men «velg hvor langt oppover kaskaden materialet
er brukbart mot mocken».

---

## 1. Struktur — kaskaden

| Nivå | Gren | Nye commits over forrige nivå | Hva laget introduserer |
| --- | --- | --- | --- |
| 0 | `origin/main` (`7108499`) | — | Snudly-baseline uten Home-redesign. |
| 1 | `agent/babyora-polish-slide` (`9a72e9b`) | 23 fra main | Launch signature, weather-cloud motion, garment carousel, Mineral Garden palett-adopsjon (`3092fdd`, `d6a3999`), materiallokalisering (`e1da5a8`), design-tokens-v2-test-omkalibrering. |
| 2 | `feat/kontekstvalg-hjem` (`9e89b24`) | +12 over nivå 1 | preferredActivity (`d08b1d0`), bæresele-utvidelse (`3cd2399`), Tools som egen fane / 4-fane-nav (`4a8a011`), result-first Hjem, «Sol»-dialog-svarene og engine consistency-verifikasjon. |
| 3 | `feat/hjem-list-detail-sheet` (`216518b`) | +5 over nivå 2 | GarmentFactSheet + GarmentAlternativesSheet + HomeSituationSheet (`171ecfa`), garment refinement (`69b944e`), Glass A light-palett (`9df6a74`), Home list polish + launch handoff (`1d7f408`), Signaturgrep blind-dom (`216518b`). |

Kaskaden betyr at hver «forkast»-beslutning på nivå 1 forplanter seg oppover: Mineral Garden-
adopsjonen som gren 1 introduserer finnes uendret i gren 2 og 3.

## 2. Kryssvis dom per konsept

Sortert etter konsept, ikke etter gren, siden de tre agentene så samme byggeklosser fra
forskjellige tupper.

| Konsept | Kilde | Dom | Begrunnelse | Handling |
| --- | --- | --- | --- | --- |
| **Detail-sheets** (GarmentFactSheet, GarmentAlternativesSheet, HomeSituationSheet) | `171ecfa` i gren 3 | BEHOLD | Native `<dialog>`, ingen nøstede kort, chevron eneste åpne-affordance (A8). Motion respekterer `prefers-reduced-motion` (A5). 50+ nye tester grønne. Situasjonsmerket brukes som status, ikke som knapp — ikonknappen ved siden av åpner sheet-en. | Cherry-pick fra gren 3. |
| **HjemMonter-orkestrator** | `171ecfa` + `1d7f408` i gren 3 | BEHOLD | Ny scene-toggle, sheet-state, result-cache, motion-koordinering. Kobler detail-sheets til Hjem-listen. | Kommer med detail-sheets-cherry-pick. |
| **Home result-first + carousel** | gren 2, videreført i gren 3 | BEHOLD (med visuell QA) | Redesign av Hjem-resultatflate til carousel med scroll-snap, én rad per plagg, chevron åpner sheet. Matcher mockens hengende avatar + liste. Trenger skjermbilder mot mocken før merge. | Cherry-pick fra gren 2; QA-oppgave (SN-018) står allerede i arbeidslisten. |
| **Tools-fane / 4-fane-nav** | `4a8a011` i gren 2 | BEHOLD | Mocken har fire faner (`.tabbar grid-template-columns: repeat(4,1fr)` i `snudly-mock.html:473`). Grenen legger `TabKey: verktoy` og VerktoyScreen. | Cherry-pick fra gren 2; hører til SN-017. |
| **preferredActivity** | `d08b1d0` i gren 2 | BEHOLD | Legger `HjemActivity`-preferanse på barnet med fallback utelek. Passer «Hjem starter i familiens egen situasjon». Type-sikker. | Cherry-pick fra gren 2. |
| **Bæresele-utvidelse** | `3cd2399` i gren 2 | BEHOLD | Vogn + bæresele + utelek konsistent på tre steder, copy i alle fire språk, søvn holdes utenfor. | Cherry-pick fra gren 2. |
| **Materiallokalisering** | `e1da5a8` i gren 1 | BEHOLD | Materialnavn oversatt for garment carousel. Uomstridt. | Cherry-pick fra gren 1. |
| **Weather-cloud motion + launch weather-fikser** | `f502ff9`, `628ed29`, `d72cfb5` i gren 1 | BEHOLD | Motion-tokens, respekterer A5. Ingen brukersynlig «Babyora»-forbindelse. | Cherry-pick fra gren 1. |
| **Launch signature-animasjon** | `12dad31`, `d0ac3b5` i gren 1 | ENDRE | Konseptet (stille launch, ingen kunstig delay) er OK, men wordmark-assetet grenen viser er merkevare-fastlåst (se «Merkevare-artefakter» nedenfor). | Cherry-pick logikken; bytt asset-referanser i separat oppgave. |
| **Garment carousel-nøsting** | `ba547c9`, `2d0142a` i gren 1 | ENDRE | Rad-struktur OK, men bruk av `<details>`-element rundt plagg-info er en form for nøsting som skurrer mot A8-ånden («chevron eneste åpne-affordance»). Chevron + eksplisitt sheet er mocken sin modell. | Cherry-pick strukturen; erstatt `<details>` med chevron-rad som åpner sheet fra gren 3. |
| **Design-tokens-v2 tester** | `src/styles/__tests__/*` i gren 1 | ENDRE | ~600 endrede testlinjer i motion/depth/focus/kontrastmatrise. Kalibrering er sannsynligvis mot Mineral Garden, ikke Snudly K2b. | Ta med tokens-endringene bare der de kobles til BEHOLD-konsepter; auditer resten mot Snudly-tokens under SN-010. |
| **Glass A light-palett** | `9df6a74` i gren 3 | ENDRE | Alle `--dw-*`-tokens er definert. Feilen ligger i CSS-fallback: `:root` gir mørk (espresso `#1E140C`), og lys aktiveres av `@media [data-theme="light"]`. Snudly-mocken og SNUDLY-DESIGNSYSTEM.md §8 låser **lys som standard**. Nye brukere uten lagret tema treffer i dag mørk. | Cherry-pick tokens-verdiene; snu fallback-ordenen slik at `:root` er lys og mørk aktiveres av `[data-theme="dark"]` eller `prefers-color-scheme: dark`. Hører til SN-010. |
| **Mineral Garden-adopsjon** | `3092fdd`, `d6a3999` i gren 1 | FORKAST | Dark-first-overstyring innført 2026-08-08 uten sanksjon fra eier. Eier 14.08 låste Snudly-mocken (lys, K2b) som fasit; design-lab-beslutningen om dark-first er eksplisitt overstyrt. DESIGN.md- og canvas-endringene (`#F2F5F1` mot Snudly `#f3f7f5`) skal ikke inn. | Ekskluder disse commits ved cherry-pick. |
| **Signaturgrep blind-dom** | `216518b` (`docs/mocks/signatur/`) i gren 3 | FORKAST fra Home-cherry-pick | Design-eksperiment (PNG-er + `RESULTAT.md`) forfattet av eier selv (`Sivert Skotvold`, `sivertskotvold@gmail.com`, 2026-08-11). Ikke `.tsx/.ts`-kode og ikke direkte relevant for byggegrenens vei mot App Store. Å merge det med SN-W04-cherry-picket kobler produktkode til et design-lab-spor uten grunn. Selve eksperimentet er eierens eiendom og kan videreføres på egen gren om eier vil. | Utelates fra Home-cherry-pick-settet i SN-W04. Ikke slett; grenen forblir tilgjengelig for eier. |
| **tools/garment-audit + BABYORA-AGENCY-POLISH-MASTERPROMPT.md** | gren 3 | FORKAST fra Home-cherry-pick | Audit-/prompt-arkiv fra før Snudly-navnebytte, forfattet av eier og Fenral. Bruker «Babyora»-språk gjennomgående. Ikke produktkode. Samme resonnement som over: å merge inn i Home-cherry-picket blander arkivmateriale med produkt. | Utelates fra Home-cherry-pick. Kan bevares på gren 3 for referanse. |
| **tools/verify-hjem.mjs, tools/verify-launch.mjs endringer** | gren 2 og 3 | ENDRE | 1000+ linjers omskrivning per fil. Verify-skriptene brukes av W-VERIFY. De kan være kalibrert mot Mineral Garden/Glass A, og må avstemmes mot Snudly-tokens etter valg av palett. | Cherry-pick sammen med Home-redesignet, men kjør skriptene mot Snudly-mocken før de tas i bruk som verifikasjon. |
| **Merkevare-artefakter i index.html og /public/brand/** | felles for alle tre grener | ENDRE | Alle tre grener beholder `<title>Babyora</title>`, `<meta apple-mobile-web-app-title>`, `babyora-theme-color`, `localStorage.getItem('babyora.theme')` og `href="/brand/babyora-wordmark-reverse.svg"`. Delvis også i `origin/main` (title + meta). `public/brand/` inneholder `babyora-wordmark-reverse.svg` + åtte andre `babyora-*.svg`-assets på main og alle tre grener. Wordmark-assetet er A7-relevant fordi det rendres i UI (referert av `<img src>` og `<link>` i index.html). **Korreksjon av gren-3-dommens funn 1:** agenten oppga `<span className="hjm-brand">BABYORA</span>` i `index.html:1276`. Filen er 306 linjer på alle tre grener; ingen `hjm-brand`- eller `>BABYORA<`-tag finnes. Den spesifikke påstanden verifiserer ikke. A7-eksponering er reell, men gjennom title-tag og wordmark-asset, ikke gjennom en HTML-span. Se kontroll-notat nederst i `gren-agent-babyora-polish-slide.md`. | Ikke SN-007s ansvar å fikse. SN-011 (visningsnavn til Snudly) må utvides til å bytte wordmark-assets, `<title>`, `<meta apple-mobile-web-app-title>` og `localStorage`-nøkkel `babyora.theme` → `snudly.theme` (migrer eksisterende verdier). Foreslått som SN-W11 nedenfor. |

## 3. Anbefaling per gren

**`feat/hjem-list-detail-sheet` (`216518b`) — DELVIS BEHOLD.**
Grenen er den lengste kaskaden. Detail-sheets, HjemMonter-orkestrator, motion, Glass A-tokens
og alt fra nivåene under er brukbart. To eksplisitte FORKAST-elementer må luftes ut ved
cherry-pick (`docs/mocks/signatur/`, `tools/garment-audit/`) og ett ENDRE (Glass A CSS-fallback-
orden). Ikke merge grenen som helhet.

**`feat/kontekstvalg-hjem` (`9e89b24`) — DELVIS BEHOLD.**
Grenen tilfører preferredActivity, bæresele, Tools-fane og result-first Hjem — alle
BEHOLD-verdige. Bærer også Mineral Garden fra nivå 1 (FORKAST) og et stort `tools/`-skift
(ENDRE, må auditeres). Ikke merge som helhet.

**`agent/babyora-polish-slide` (`9a72e9b`) — DELVIS BEHOLD, ikke som helhet.**
Bunn i kaskaden. Materiallokalisering, weather-cloud motion og launch-vær-fikser er BEHOLD.
Launch signature-logikken er ENDRE (behold logikk, bytt merkevare-asset). Garment carousels
`<details>`-nøsting er ENDRE (bytt til chevron+sheet fra gren 3). Mineral Garden-adopsjonen
er FORKAST. Design-tokens-v2-testene er ENDRE (auditeres mot Snudly-tokens under SN-010).

## 4. Reintroduksjonsplan (nye oppgaver)

Ingen av grenene merges til byggegrenen som de er. I stedet fødes disse oppgavene, som
byggeren kan ta senere i planlagt rekkefølge:

| Ny ID | Type | Foreslått tekst | Kilde |
| --- | --- | --- | --- |
| SN-W04 | A | Cherry-pick detail-sheets + HjemMonter-orkestrator fra `216518b`, uten `docs/mocks/signatur/` og `tools/garment-audit/`. Skjermbilder mot mocken. | Gren 3 unike commits. Hører til SN-018. |
| SN-W05 | A | Cherry-pick Tools-fane + `TabKey: verktoy` fra `4a8a011`. | Gren 2, SN-017. |
| SN-W06 | A | Cherry-pick preferredActivity (`d08b1d0`), bæresele (`3cd2399`), result-first Home carousel fra gren 2. Auditer `tools/verify-hjem.mjs`-endringer mot Snudly-tokens. | Gren 2, SN-018. |
| SN-W07 | A | Cherry-pick materiallokalisering (`e1da5a8`), weather-cloud motion (`f502ff9`, `628ed29`, `d72cfb5`), launch weather-fikser, og launch signature-logikk fra gren 1. Bytt wordmark-asset når SN-011 er ferdig. | Gren 1, SN-018. |
| SN-W08 | A | Cherry-pick Glass A tokens fra `9df6a74`; snu CSS-fallback slik at `:root` er lys og `[data-theme="dark"]` er mørk. Verifiser at nye brukere uten lagret tema treffer lys. | Gren 3, hører til SN-010. |
| SN-W09 | A | Auditer design-tokens-v2-tester (`src/styles/__tests__/*`) endret på gren 1: hvilke assertions kalibrerer Snudly-tokens og hvilke kalibrerer Mineral Garden? Fjern Mineral Garden-referansene, oppdater mot Snudly-tokens. | Gren 1. |
| SN-W10 | A | Cherry-pick garment carousel-strukturen fra `ba547c9`+`2d0142a`, men erstatt `<details>`-nøsting med chevron-rad som åpner detail-sheet. | Gren 1 + gren 3. |
| SN-W11 | E | Utvid SN-011 (visningsnavn til Snudly) med `public/brand/`-wordmark-swap og `localStorage`-nøkkel `babyora.theme` → `snudly.theme` (migrer eksisterende verdier). | Alle tre grener + `origin/main`. |

Alle SN-W04..SN-W10 er avhengige av at Mineral Garden-adopsjonen og signaturgrep-artefaktene
holdes UTE av cherry-picks. Ingen av dem endrer bundle-id eller produkt-IDer. SN-W11 er
strengt en visningsnavn-forbedring uten C-implikasjon.

## 5. FORKAST — hva som ikke merges

- Commits `3092fdd` og `d6a3999` (Mineral Garden-adopsjon) på alle tre grener.
- `docs/mocks/signatur/` (PNG-er + `RESULTAT.md`) fra gren 3.
- `tools/garment-audit/` og `BABYORA-AGENCY-POLISH-MASTERPROMPT.md` fra gren 3.
- `DESIGN.md`-endringer på gren 1/2/3 som beskriver Mineral Garden som primær.

## 6. Det jeg er minst trygg på

1. **Grafisk QA av result-first Home carousel** mot mocken er ikke gjort i SN-007 (dokument-
   oppgave, ikke visuell). SN-W06 må produsere skjermbilder før den lukkes.
2. **Design-tokens-v2-testenes reelle scope** er ikke lest linje for linje av kontrolløren —
   agent 3 flagget ~600 endrede linjer som «må audites», og syntesen har akseptert det som
   ENDRE-vurdering. SN-W09 må gjøre den faktiske auditen.
3. **Wordmark-assetets synlighet** i lansert app er ikke fysisk verifisert. `href` finnes i
   `<link>` og `<img src>` i `index.html`; om de faktisk rendres avhenger av at brukeren
   når skjermer som viser wordmark. Verifisering står i SN-011/SN-W11.
4. **Om `<details>` i garment carousel er A8-brudd** er en tolkningsavgjørelse. A8 sier
   «Ingen nøstede kort. Chevron er eneste åpne-affordance i en rad.» `<details>` er
   ikke et kort; men det er en åpne-affordance som ikke er chevron. Syntesen tolker
   dette som A8-brudd og krever chevron+sheet — verifiseres av Codex.

## 7. Handling for SN-007

Denne oppgaven produserer ingen kode-endring på byggegrenen. Utfallet er:

- Denne syntesen + tre gren-dommer + G1-G4-evidens i `loop/evidens/SN-007/`.
- **Forslag** til nye oppgaver SN-W04..SN-W11 (seksjon 4 over). Selve innleggelsen i
  `loop/ARBEIDSLISTE-SNUDLY.md` er en oppfølgingsbeslutning som ligger UTENFOR SN-007s
  material. Rasjonalen: SN-007 er type E og skal levere dommen, ikke bestemme hvordan
  arbeidslisten bygges. En [admin]-bokføring etter Codex' BESTÅTT-dom kan innføre
  oppgavene hvis eier ikke overstyrer forslaget.
- SN-007 settes `TIL KONTROLL`.

Ingen av de tre grenene endrer status i git (de forblir uleste tupp-referanser). Cherry-picks
og faktiske merger utføres av SN-W04..SN-W10 senere.

---

## Vedlegg · rødt-lag-fix 2026-08-14T18:14Z

Kontrolleragent `ac534639af342504e` fant tre punkter som denne syntesen adresserer før
overlevering:

1. **Eierskaps-attribuering korrigert** — `docs/mocks/signatur/` og `tools/garment-audit/`
   ble opprinnelig kalt «design-lab uten sanksjon fra eier». Verifisert med
   `git log --format='%an %ae' -- <sti>`: begge forfattet av eier (Sivert Skotvold) selv,
   `garment-audit` også av Fenral (repo-eierens org-håndtak). Ny FORKAST-begrunnelse: ikke
   «uten sanksjon», men «hører ikke til Home-cherry-pick-settet». Se seksjon 2, radene
   «Signaturgrep» og «tools/garment-audit».
2. **Motstrid mellom gren-3-dommen og syntesens korreksjon eksplisitt** —
   `<span className="hjm-brand">BABYORA</span>`-påstanden er markert som ikke-verifisert
   både i syntesen (seksjon 2, siste rad) og i et kontroll-notat nederst i
   `gren-agent-babyora-polish-slide.md`. A7-eksponering står, men via title-tag og
   wordmark-asset — ikke via HTML-span.
3. **SN-W04..SN-W11-innleggelse ryddet** — syntesen lovte tidligere å legge oppgavene inn
   i arbeidslisten. Det motsa material-diffen (som ikke gjorde det). Seksjon 7 er
   omskrevet: forslaget står, innleggelsen er en [admin]-oppfølging etter dom, ikke en
   handling internt i SN-007.

Kontrollerte uten funn: G1-G4 EXIT-koder, testantall (3168 pass + 1 todo), diff-omfang
(kun `loop/`), kaskade-tallene (A=23, B=35, C=40; B\A=12; C\(A∪B)=5), Mineral Garden-
commits på alle tre grener, commit-metadata på bbf9c24 og 12a6dce, hemmeligheter,
konsoll-rester, nye avhengigheter, evidensfiler sporet i git.
